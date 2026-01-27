const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Configurações
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Pasta onde os arquivos serão salvos
const STORAGE_DIR = path.join(__dirname, 'registros');

// Garante que a pasta existe
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR);
}

// Endpoint para receber e salvar o PDF
app.post('/api/save', (req, res) => {
    const { fileName, fileContent, detentor, loja } = req.body;

    if (!fileContent || !fileName) {
        return res.status(400).send({ error: 'Dados incompletos' });
    }

    const filePath = path.join(STORAGE_DIR, fileName);
    const buffer = Buffer.from(fileContent, 'base64');

    fs.writeFile(filePath, buffer, (err) => {
        if (err) {
            console.error('Erro ao salvar arquivo:', err);
            return res.status(500).send({ error: 'Erro ao salvar no disco' });
        }
        console.log(`✓ Arquivo salvo: ${fileName} (${detentor} - ${loja})`);
        res.send({ success: true, path: filePath });
    });
});

// Rota para o frontend (Single Page App)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 SERVIDOR MINI PREÇO RODANDO`);
    console.log(`📍 Link: http://localhost:${PORT}`);
    console.log(`📁 Pasta de Destino: ${STORAGE_DIR}`);
    console.log(`=========================================`);
});
