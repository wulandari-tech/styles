const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Konfigurasi Multer untuk meng-handle file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // Batas ukuran file 20 MB
    fileFilter: (req, file, cb) => {
        // Filter file berdasarkan tipe MIME
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'video/mp4', 'audio/mpeg', 'audio/mp3'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipe file tidak diizinkan. Hanya gambar (JPG, PNG), video MP4, dan audio MP3 yang diizinkan.'), false);
        }
    },
});


// Middleware untuk melayani file statis dari folder 'public'
app.use(express.static(path.join(__dirname)));

app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Tidak ada file yang diunggah.' });
        }

        const fileBuffer = req.file.buffer;
        const originalFileName = req.file.originalname;

        // Dapatkan ekstensi file
        const fileExtension = path.extname(originalFileName).toLowerCase();

        // Generate nama file unik
        const uniqueFileName = `${uuidv4()}${fileExtension}`;

        const formData = new FormData();
        formData.append('file', fileBuffer, uniqueFileName); // Gunakan 'file' sebagai field

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


        // Proses hasil dari Telegraph untuk mengganti nama file (tidak perlu karena sudah dilakukan saat upload)
        if (result && result.src) {
             // Mendapatkan base URL (sampai slash terakhir)
             const baseURL = result.src.substring(0, result.src.lastIndexOf('/') + 1);
             const customUrl = `${baseURL}${uniqueFileName}`;

             // Mengembalikan response dengan URL custom
             res.json({ ...result, src: customUrl });
        } else {
            res.json(result);
        }

    } catch (error) {
        console.error("Error saat mengunggah:", error);
        res.status(500).json({ error: error.message || 'Terjadi kesalahan server saat mengunggah file. Mohon coba lagi nanti.' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
