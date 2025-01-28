const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const FormData = require('form-data');
const multer = require('multer'); // Import multer untuk menangani upload file
const app = express();
const port = 8080;

// Konfigurasi untuk membaca file di luar folder
const parentDir = path.join(__dirname, '/'); // Naik satu level dari direktori server.js
const indexPath = path.join(parentDir, 'index.html');


// Konfigurasi multer untuk menyimpan file di memori
const upload = multer({
    storage: multer.memoryStorage()
});

// Endpoint untuk menampilkan halaman index.html
app.get('/', (req, res) => {
    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) {
            console.error('Failed to read index.html:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.send(html);
    });
});

// Endpoint untuk meng-upload file ke Telegraph
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        const fileBuffer = req.file.buffer;
        const originalFileName = req.file.originalname;
        const formData = new FormData();
        formData.append('images', fileBuffer, originalFileName);

        const response = await fetch('https://telegraph.zorner.men/upload', {
            method: 'POST',
            headers: {
                ...formData.getHeaders(),
            },
            body: formData,
        });


        if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`);
        }


        const result = await response.json();
        const telegraphLink = result.links[0];

        res.send(`
            <h1>Upload Success</h1>
            <p>Link: <a href="${telegraphLink}">${telegraphLink}</a></p>
            <button onclick="window.location.href='/'">Back</button>
        `);

    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send(`Error during file upload: ${error.message}`);
    }
});


// Jalankan server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
