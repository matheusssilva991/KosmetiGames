/**
 * Arquivo principal da aplicação KosmetiGames
 *
 * Este arquivo configura e inicializa o servidor Express,
 * incluindo middlewares, sessões, template engine e rotas.
 *
 * @author Matheus Santos Silva
 */

const express = require('express');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv');
const router = require('./routes/routes');
const session = require('express-session');
const path = require('path');

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Configuração de Middlewares
// CORS - permite requisições de diferentes origens
app.use(cors());

// Parse de JSON no body das requisições
app.use(express.json());

// Parse de dados de formulários (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// Serve arquivos estáticos da pasta public (CSS, imagens, etc)
app.use(express.static('public'));

// Configuração de sessões do usuário
app.use(session({
  secret: process.env.SESSION_SECRET,     // Chave secreta para assinar a sessão
  resave: false,                          // Não salva sessão se não foi modificada
  saveUninitialized: false,               // Não salva sessões não inicializadas
  cookie: { secure: false }               // secure: true requer HTTPS (usar em produção)
}));

// Configuração do Template Engine EJS
app.set('view engine', 'ejs');          // Define EJS como motor de templates
app.set('views', './src/views');        // Define o diretório das views

// Define a porta do servidor (variável de ambiente ou padrão 8080)
const PORT = process.env.PORT || 8080;

// Registra as rotas da aplicação
app.use('/', router);

// Inicia o servidor e escuta na porta definida
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
