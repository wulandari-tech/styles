const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

// Konfigurasi Cloudflare (Pindahkan ke Variabel Lingkungan untuk produksi!)
const CLOUDFLARE_ZONE = "8986c21d4df43f0d1708b8f9f6ab4dcd";
const CLOUDFLARE_API_TOKEN = "FUKXUphvvUDKUQW8v8JIWXBQekynFNOV1ltmT4eE";
const CLOUDFLARE_TLD = "wanzofc.us.kg";

// Konfigurasi multer
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 248 * 1024 * 1024 }
});

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true })); // Untuk mengurai body yang di-encode dalam URL

// Endpoint untuk mengunggah file
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Tidak ada file yang diunggah.' });
        }

        const fileBuffer = req.file.buffer;
        const originalFileName = req.file.originalname || 'image.jpg';
        const fileExtension = originalFileName.split('.').pop();
        const customFileName = `wanz-${uuidv4()}.${fileExtension}`;
        const formData = new FormData();
        formData.append('images', fileBuffer, originalFileName);


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
        if (result && result.src) {
            const originalUrl = result.src;
            const baseURL = originalUrl.substring(0, originalUrl.lastIndexOf('/') + 1);
            const customUrl = `${baseURL}${customFileName}`;

            try {
                const subdomainName = req.body.subdomain || `wanz-${uuidv4()}`;
                const ipAddress = req.body.ip || "103.226.128.118"; // Ambil IP dari request atau gunakan default
                const subdomainResult = await subDomain1(subdomainName, ipAddress);
                if(subdomainResult.success){
                    res.json({ ...result, src: customUrl, subdomain: subdomainResult.name });
                }else{
                    return res.status(500).json({ error: 'Upload berhasil, tetapi gagal membuat subdomain Cloudflare: '+ subdomainResult.error });
                }

            } catch (cloudflareError) {
                console.error("Gagal membuat subdomain Cloudflare:", cloudflareError);
                return res.status(500).json({ error: 'Upload berhasil, tetapi gagal membuat subdomain Cloudflare.' });
            }

        } else {
            res.json(result);
        }
    } catch (error) {
        console.error("Error saat mengunggah:", error);
        res.status(500).json({ error: 'Terjadi kesalahan server saat mengunggah file. Mohon coba lagi nanti.' });
    }
});

// Fungsi untuk membuat subdomain di Cloudflare
function subDomain1(host, ip) {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await axios.post(
                `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE}/dns_records`,
                {
                    type: "A",
                    name: `${host.replace(/[^a-z0-9.-]/gi, "")}.${CLOUDFLARE_TLD}`,
                    content: ip.replace(/[^0-9.]/gi, ""),
                    ttl: 3600,
                    priority: 10,
                    proxied: false,
                },
                {
                    headers: {
                        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            if (response.data.success) {
                resolve({ success: true, zone: response.data.result?.zone_name, name: response.data.result?.name, ip: response.data.result?.content });
            } else {
                let error = response.data?.errors?.[0]?.message || response.data?.errors || "Unknown Cloudflare API error";
                reject({ success: false, error });
            }
        } catch (error) {
            let errorMessage = error.response?.data?.errors?.[0]?.message || error.response?.data?.errors || error.message || error.response?.data || error.response || error;
            reject({ success: false, error: String(errorMessage) });
        }
    });
}

// Endpoint utama untuk mengirim index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Menjalankan server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
