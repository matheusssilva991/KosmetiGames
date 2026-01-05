/**
 * Controller de Autenticação
 *
 * Gerencia as rotas relacionadas à autenticação de usuários,
 * incluindo login e logout.
 *
 * @author Matheus Santos Silva
 */

const express = require('express');
const router = express.Router();
const ejs = require('ejs');
const jsonwebtoken = require('jsonwebtoken');

const authMiddleware = require('../middlewares/auth.middleware');
const authenticateService = require('../services/auth.service');

/**
 * GET /login
 * Exibe a página de login
 *
 * @middleware unauth - Verifica se o usuário NÃO está autenticado
 * @returns {HTML} Página de login renderizada
 */
router.get('/login', authMiddleware.unauth, async (req, res) => {
  const html = await ejs.renderFile('./src/views/login.ejs', {error: null, data: {}, user: null }, { async: true})
  res.send(html);
});

/**
 * POST /login
 * Processa a autenticação do usuário
 *
 * @middleware unauth - Verifica se o usuário NÃO está autenticado
 * @body {string} email - E-mail do usuário
 * @body {string} password - Senha do usuário
 * @returns {Redirect|HTML} Redireciona para home se sucesso, ou exibe erros
 */
router.post('/login', authMiddleware.unauth, async (req, res) => {
  const result = await authenticateService.login(req.body);

  if (result.token) {
    const decoded = jsonwebtoken.decode(result.token);
    req.session.user = decoded;
    res.redirect('/')
  } else {
    const html = await ejs.renderFile('./src/views/login.ejs',
    { error: result.error, data: result.data, user: null }, { async: true });
    res.send(html);
  }
});

/**
 * GET /logout
 * Realiza o logout do usuário destruindo a sessão
 *
 * @middleware auth - Verifica se o usuário está autenticado
 * @returns {Redirect} Redireciona para a página inicial
 */
router.get('/logout', authMiddleware.auth, async (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
