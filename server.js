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

const initializeDatabase = async () => { /* ...código da inicialização sem alteração... */ };

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

app.get('/api/content', async (req, res) => { /* ...código do GET sem alteração... */ });

// ######################################################################
// ESTA É A PARTE MODIFICADA PARA O TESTE
// ######################################################################
app.post('/api/content', async (req, res) => {
    console.log("[API Request] Recebido pedido POST para /api/content. IGNORANDO DADOS DO USUÁRIO.");
    
    // Em vez de usar os dados que vêm do navegador (req.body),
    // vamos criar um dado de teste fixo aqui mesmo.
    const debugData = [{
        id: 9999,
        type: 'news',
        title: 'TESTE GRAVADO DIRETAMENTE NO SERVIDOR',
        description: 'Se você vir isto, a gravação funcionou.',
        imageUrl: '',
        displayTime: 10,
        startDate: '',
        endDate: ''
    }];

    console.log("[Debug] A tentar gravar os seguintes dados fixos:", debugData);

    let client;
    try {
        client = await pool.connect();
        const queryText = 'UPDATE tv_content SET content_data = $1 WHERE id = 1';
        
        // Usamos os nossos dados de teste 'debugData'
        await client.query(queryText, [debugData]);

        console.log("[API Success] POST /api/content - Dados de teste salvos com sucesso no banco de dados.");
        res.status(200).send({ message: 'Dados de teste salvos com sucesso.' });
    } catch (err) {
        console.error("[API Error] POST /api/content falhou ao gravar dados de teste:", err);
        res.status(500).send('Erro ao salvar o conteúdo de teste.');
    } finally {
        if (client) client.release();
    }
});
// ######################################################################
// FIM DA SEÇÃO MODIFICADA
// ######################################################################


app.listen(PORT, () => {
    console.log(`Servidor de TESTE a iniciar na porta ${PORT}...`);
    initializeDatabase();
});

// Funções completas que não mudaram, para facilitar o copiar e colar
const initializeDatabase_full = async () => { let client; try { client = await pool.connect(); await client.query(`CREATE TABLE IF NOT EXISTS tv_content (id INT PRIMARY KEY, content_data JSONB NOT NULL);`); console.log("[DB Success] Tabela 'tv_content' verificada/criada."); await client.query(`INSERT INTO tv_content (id, content_data) VALUES (1, '[]'::jsonb) ON CONFLICT (id) DO NOTHING;`); console.log("[DB Success] Linha de dados (id=1) garantida."); } catch (err) { console.error("[DB Error] Falha ao inicializar o banco de dados:", err); } finally { if (client) client.release(); } };
const get_api_content_full = async (req, res) => { console.log("[API Request] Recebido pedido GET para /api/content"); let client; try { client = await pool.connect(); const result = await client.query('SELECT content_data FROM tv_content WHERE id = 1'); if (result.rows.length === 0) { console.log("[API Response] Nenhum dado encontrado, a retornar lista vazia."); return res.json([]); } console.log("[API Response] Dados encontrados, a enviar para o cliente."); res.json(result.rows[0].content_data); } catch (err) { console.error("[API Error] GET /api/content falhou:", err); res.status(500).send('Erro ao ler o conteúdo.'); } finally { if (client) client.release(); } };
// Injetando as funções completas no sítio certo
initializeDatabase = initializeDatabase_full;
app.get('/api/content', get_api_content_full);