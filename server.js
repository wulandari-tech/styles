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
        const fileName = req.file.originalname || 'image.jpg';
        const formData = new FormData();
        formData.append('images', fileBuffer, fileName);


        const response = await fetch('https://telegraph.zorner.men/upload', {
            method: 'POST',
            body: formData, // Kirim formData sebagai body
        });

        if (!response.ok) {
            const errorText = await response.text();
             console.error("Upload gagal dengan status:", response.status, "dan pesan:", errorText);
             return res.status(response.status).json({ error: `Upload gagal dengan status ${response.status}: ${errorText}` });
           
        }

        const result = await response.json();
        res.json(result);

    } catch (error) {
        console.error("Error saat mengunggah:", error);
        res.status(500).json({ error: 'Error saat mengunggah file: ' + error.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
