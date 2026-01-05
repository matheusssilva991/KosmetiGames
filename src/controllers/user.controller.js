/**
 * Controller de Usuários
 *
 * Gerencia as operações relacionadas aos usuários,
 * incluindo cadastro, visualização e edição de perfil.
 *
 * @author Matheus Santos Silva
 */

const express = require('express');
const router = express.Router();
const ejs = require('ejs');

const authMiddleware = require('../middlewares/auth.middleware');
const userService = require('../services/user.service');

/**
 * GET /register
 * Exibe o formulário de cadastro de usuário
 *
 * @middleware unauth - Verifica se o usuário NÃO está autenticado
 * @returns {HTML} Página de cadastro de usuário
 */
router.get('/register', authMiddleware.unauth, async (req, res) => {
  const html = await ejs.renderFile('./src/views/user/register_user.ejs', {error: null, data: {}, user: null},
   { async: true})
  res.send(html);
});

/**
 * POST /register
 * Processa o cadastro de um novo usuário
 *
 * @middleware unauth - Verifica se o usuário NÃO está autenticado
 * @body {Object} data - Dados do usuário (name, email, password, etc)
 * @returns {Redirect|HTML} Redireciona para home se sucesso, ou exibe erros
 */
router.post('/register', authMiddleware.unauth, async (req, res) => {
  const { error, data } = await userService.create(req.body);

  if (!error) {
    res.redirect('/')
  } else {
    const html = await ejs.renderFile('./src/views/user/register_user.ejs',
    { error, data, user: null }, { async: true });
    res.send(html);
  }
});

/**
 * GET /user/:id
 * Exibe a página de perfil do usuário para edição
 *
 * @middleware auth - Verifica se o usuário está autenticado
 * @middleware owner - Verifica se o usuário é o dono do perfil
 * @param {string} id - ID do usuário
 * @returns {HTML} Página de edição de perfil
 */
router.get('/user/:id', authMiddleware.auth, authMiddleware.owner, async (req, res) => {
  const user = req.session.user;
  const id = req.params.id;
  const result = await userService.findOne(id);
  const { error } = result;
  const data = result;
  delete data.error

  const html = await ejs.renderFile('./src/views/user/edit_user.ejs', { user, error, data }, { async: true });
  res.send(html);
});

/**
 * POST /user/:id/edit
 * Processa a atualização dos dados do usuário
 *
 * @middleware auth - Verifica se o usuário está autenticado
 * @middleware owner - Verifica se o usuário é o dono do perfil
 * @param {string} id - ID do usuário
 * @body {Object} data - Dados do usuário a serem atualizados
 * @returns {Redirect|HTML} Redireciona para home se sucesso, ou exibe erros
 */
router.post('/user/:id/edit', authMiddleware.auth, authMiddleware.owner, async (req, res) => {
  const user = req.session.user;
  const { error, data, ...result } = await userService.update(user.id, req.body);

  if (!error) {
    res.redirect('/')
  } else {
    const html = await ejs.renderFile('./src/views/user/edit_user.ejs',
    { error, data, user }, { async: true });
    res.send(html);
  }
});

module.exports = router;
