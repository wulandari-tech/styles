const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const FormData = require('form-data');
const multer = require('multer');
const app = express();
const port = 8080;

// Konfigurasi untuk membaca file di folder yang sama dengan file JS
const indexPath = path.join(__dirname, 'index.html'); // Perbaikan disini


// Konfigurasi multer untuk menyimpan file di memori
const upload = multer({
    storage: multer.memoryStorage()
});

// Endpoint untuk menampilkan halaman index.html
app.get('/', (req, res) => {
    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) {
            console.error('Failed to read index.html:', err);
            return res.status(500).send(`
                <h1>Internal Server Error</h1>
                <p>Error: Could not read index.html. Please check if the file exists at the correct location.</p>
                <p>Details: ${err.message}</p>
            `); // Pesan error yang lebih informatif
        }
        res.send(html);
    });
});

// Endpoint untuk meng-upload file ke Telegraph
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send(`
            <h1>Bad Request</h1>
            <p>Error: No file uploaded. Please choose a file to upload.</p>
          `); // Pesan error yang lebih jelas
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
           const responseText = await response.text()
           throw new Error(`Upload failed with status ${response.status} - ${responseText}`); // Menampilkan response text dari server
        }


        const result = await response.json();
        if (!result.links || result.links.length === 0) {
             throw new Error(`Invalid response from Telegraph API. No links found.`); // Error handling tambahan jika link tidak ditemukan
        }

        const telegraphLink = result.links[0];

        res.send(`
            <h1>Upload Success</h1>
            <p>Link: <a href="${telegraphLink}">${telegraphLink}</a></p>
            <button onclick="window.location.href='/'">Back</button>
        `);

    } catch (error) {
        console.error('Error uploading file:', error);
         res.status(500).send(`
            <h1>Internal Server Error</h1>
            <p>Error during file upload: ${error.message}</p>
            `); // Pesan error yang lebih informatif
    }
});

// Jalankan server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
