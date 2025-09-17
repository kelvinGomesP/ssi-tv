const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
// Linha Nova e Correta
const PORT = process.env.PORT || 3000; // A porta onde o servidor vai rodar

// Permite que o servidor entenda JSON e sirva os arquivos da pasta 'public'
app.use(express.json({ limit: '10mb' }));
// CORREÇÃO IMPORTANTE: Vamos assumir que os arquivos estão na raiz por enquanto.
app.use(express.static(path.join(__dirname)));

// O caminho para o nosso "banco de dados" em arquivo
const dbPath = path.join(__dirname, 'content.json');

// ROTA PARA LER a lista de conteúdos
app.get('/api/content', (req, res) => {
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.json([]);
            }
            return res.status(500).send('Erro ao ler o conteúdo.');
        }
        res.json(JSON.parse(data));
    });
});

// ROTA PARA SALVAR a lista de conteúdos
app.post('/api/content', (req, res) => {
    const content = req.body;
    fs.writeFile(dbPath, JSON.stringify(content, null, 2), 'utf8', (err) => {
        if (err) {
            return res.status(500).send('Erro ao salvar o conteúdo.');
        }
        res.status(200).send({ message: 'Conteúdo salvo com sucesso.' });
    });
});

// Inicia o servidor e avisa no console
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Acesse a EDIÇÃO em: http://localhost:${PORT}/edita/ssi_tv_edit.html`);
    console.log(`Acesse a TV em:      http://localhost:${PORT}/view/ssi-tv-view.html`);
});