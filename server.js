const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 3000;

// Konfigurasi Multer untuk meng-handle file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 } // Batas ukuran file 20 MB
});

// Middleware untuk melayani file statis dari folder 'public'
app.use(express.static(path.join(__dirname)));

app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Tidak ada file yang diunggah.' });
        }

        const fileBuffer = req.file.buffer;
        const originalFileName = req.file.originalname || 'image.jpg';
        const customFileName = 'wanz.jpg'; // Nama file custom
        const formData = new FormData();
        formData.append('images', fileBuffer, originalFileName); // Gunakan nama asli saat upload

        const uploadURL = 'https://telegraph.zorner.men/upload';

        const response = await fetch(uploadURL, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            let errorBody;
            try {
                errorBody = await response.json();
            } catch (jsonError) {
                errorBody = await response.text();
            }
            const errorMessage = `Upload gagal dengan status ${response.status}: ${errorBody}`;
            console.error("Upload gagal dengan status:", response.status, "dan pesan:", errorBody);
            return res.status(response.status).json({ error: errorMessage });
        }

        const result = await response.json();

        // Proses hasil dari Telegraph untuk mengganti nama file
        if (result && result.src) {
            const originalUrl = result.src;
             // Mendapatkan base URL (sampai slash terakhir)
            const baseURL = originalUrl.substring(0, originalUrl.lastIndexOf('/') + 1);

            const customUrl = `${baseURL}${customFileName}`;

            // Mengembalikan response dengan URL custom
            res.json({ ...result, src: customUrl });
        } else {
             res.json(result); // Jika tidak ada src di response, kirim aslinya
        }

    } catch (error) {
        console.error("Error saat mengunggah:", error);
        res.status(500).json({ error: 'Terjadi kesalahan server saat mengunggah file. Mohon coba lagi nanti.' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
