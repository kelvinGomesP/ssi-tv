const express = require('express');
const path = require('path');
const { Pool } = require('pg'); // Importa o "tradutor" do PostgreSQL

const app = express();
const PORT = process.env.PORT || 3000;

// Configura a conexão com o banco de dados usando a URL que colocamos no Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Função que cria nossa tabela no banco de dados se ela não existir
const createTable = async () => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS content_storage (
                id INT PRIMARY KEY,
                data JSONB
            );
        `);
        // Garante que sempre haverá uma linha para guardar nosso conteúdo
        await client.query(`
            INSERT INTO content_storage (id, data)
            VALUES (1, '[]'::jsonb)
            ON CONFLICT (id) DO NOTHING;
        `);
    } finally {
        client.release();
    }
};

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// ROTA PARA LER o conteúdo do banco de dados
app.get('/api/content', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT data FROM content_storage WHERE id = 1');
        res.json(result.rows[0].data);
        client.release();
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao ler o conteúdo do banco de dados.');
    }
});

// ROTA PARA SALVAR o conteúdo no banco de dados
app.post('/api/content', async (req, res) => {
    const content = req.body;
    try {
        const client = await pool.connect();
        // Atualiza a linha que guarda nosso conteúdo
        await client.query('UPDATE content_storage SET data = $1 WHERE id = 1', [JSON.stringify(content)]);
        res.status(200).send({ message: 'Conteúdo salvo com sucesso no banco de dados.' });
        client.release();
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao salvar o conteúdo no banco de dados.');
    }
});

// Inicia o servidor e prepara o banco de dados
app.listen(PORT, () => {
    createTable().catch(console.error);
    console.log(`Servidor rodando na porta ${PORT}`);
});