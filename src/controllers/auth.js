const express = require('express');
const router = express.Router();
const ejs = require('ejs');
const jsonwebtoken = require('jsonwebtoken');

const authMiddleware = require('../middlewares/auth.middleware');
const authenticateService = require('../services/authService');

router.get('/login', authMiddleware.unauth, async (req, res) => {
  const html = await ejs.renderFile('./src/views/login.ejs', {error: null, data: {}, user: null }, { async: true})
  res.send(html);
});

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

router.get('/logout', authMiddleware.auth, async (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
