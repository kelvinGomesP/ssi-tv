const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
    console.error("FATAL ERROR: A variável de ambiente DATABASE_URL não está definida.");
    process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const initializeDatabase = async () => {
    let client;
    try {
        client = await pool.connect();
        await client.query(`
            CREATE TABLE IF NOT EXISTS tv_content (
                id INT PRIMARY KEY,
                content_data JSONB NOT NULL
            );
        `);
        console.log("[DB Success] Tabela 'tv_content' verificada/criada.");
        await client.query(`
            INSERT INTO tv_content (id, content_data) VALUES (1, '[]'::jsonb)
            ON CONFLICT (id) DO NOTHING;
        `);
        console.log("[DB Success] Linha de dados (id=1) garantida.");
    } catch (err) {
        console.error("[DB Error] Falha ao inicializar o banco de dados:", err);
    } finally {
        if (client) client.release();
    }
};

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

app.get('/api/content', async (req, res) => {
    console.log("[API Request] Recebido pedido GET para /api/content");
    let client;
    try {
        client = await pool.connect();
        const result = await client.query('SELECT content_data FROM tv_content WHERE id = 1');
        if (result.rows.length === 0) {
            console.log("[API Response] Nenhum dado encontrado, a retornar lista vazia.");
            return res.json([]);
        }
        console.log("[API Response] Dados encontrados, a enviar para o cliente.");
        res.json(result.rows[0].content_data);
    } catch (err) {
        console.error("[API Error] GET /api/content falhou:", err);
        res.status(500).send('Erro ao ler o conteúdo.');
    } finally {
        if (client) client.release();
    }
});

app.post('/api/content', async (req, res) => {
    const newContent = req.body;
    console.log("[API Request] Recebido pedido POST para /api/content com", newContent.length, "itens.");
    let client;
    try {
        client = await pool.connect();
        const queryText = 'UPDATE tv_content SET content_data = $1 WHERE id = 1';

        // CORREÇÃO: Removido JSON.stringify(). A biblioteca 'pg' lida com isso sozinha.
        await client.query(queryText, [newContent]);

        console.log("[API Success] POST /api/content - Dados salvos com sucesso no banco de dados.");
        res.status(200).send({ message: 'Conteúdo salvo com sucesso.' });
    } catch (err) {
        console.error("[API Error] POST /api/content falhou:", err);
        res.status(500).send('Erro ao salvar o conteúdo.');
    } finally {
        if (client) client.release();
    }
});

app.listen(PORT, () => {
    console.log(`Servidor a iniciar na porta ${PORT}...`);
    initializeDatabase();
});