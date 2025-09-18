const express = require('express');
const path = require('path');
const { Pool } = require('pg'); // Usamos o "tradutor" do PostgreSQL

const app = express();
const PORT = process.env.PORT || 3000;

// Validação para garantir que a URL do banco de dados foi configurada no Render
if (!process.env.DATABASE_URL) {
    throw new Error("Erro: A variável de ambiente DATABASE_URL não está definida.");
}

// Configuração da conexão com o banco de dados, otimizada para o Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Esta configuração é crucial para a conexão na nuvem do Render
    rejectUnauthorized: false
  }
});

// Função que cria a nossa tabela no banco de dados se ela ainda não existir
const initializeDatabase = async () => {
    const client = await pool.connect();
    try {
        // Cria a tabela principal que vai guardar todo o nosso conteúdo
        await client.query(`
            CREATE TABLE IF NOT EXISTS tv_content (
                id INT PRIMARY KEY,
                content_data JSONB NOT NULL
            );
        `);
        console.log("Tabela 'tv_content' verificada/criada com sucesso.");

        // Garante que a linha que usaremos para guardar os dados sempre exista
        // Se a linha com id=1 não existir, ela é criada com uma lista vazia.
        await client.query(`
            INSERT INTO tv_content (id, content_data)
            VALUES (1, '[]'::jsonb)
            ON CONFLICT (id) DO NOTHING;
        `);
        console.log("Linha de dados inicializada com sucesso.");

    } catch (err) {
        console.error("Erro ao inicializar o banco de dados:", err);
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
        const result = await client.query('SELECT content_data FROM tv_content WHERE id = 1');
        
        // Se por algum motivo não houver resultado, retorna uma lista vazia
        if (result.rows.length === 0) {
            return res.json([]);
        }
        
        res.json(result.rows[0].content_data);
        client.release();
    } catch (err) {
        console.error("Erro na rota GET /api/content:", err);
        res.status(500).send('Erro ao ler o conteúdo do banco de dados.');
    }
});

// ROTA PARA SALVAR o conteúdo no banco de dados
app.post('/api/content', async (req, res) => {
    const newContent = req.body;
    try {
        const client = await pool.connect();
        // Atualiza a coluna 'content_data' na linha onde o id é 1
        await client.query('UPDATE tv_content SET content_data = $1 WHERE id = 1', [JSON.stringify(newContent)]);
        res.status(200).send({ message: 'Conteúdo salvo com sucesso no banco de dados.' });
        client.release();
    } catch (err) {
        console.error("Erro na rota POST /api/content:", err);
        res.status(500).send('Erro ao salvar o conteúdo no banco de dados.');
    }
});

// Inicia o servidor e prepara o banco de dados
app.listen(PORT, () => {
    console.log(`Servidor a iniciar na porta ${PORT}...`);
    // Chama a função para garantir que a nossa tabela existe antes de começar
    initializeDatabase();
});