const express = require('express');
const router = express.Router();
const ejs = require('ejs');

const authenticateService = require('../services/authenticateService');

router.get('/login', async (req, res) => {
  const html = await ejs.renderFile('./src/views/login.ejs', {error: null, user: {}}, { async: true})
  res.send(html);
});

router.post('/login', async (req, res) => {
  const result = await authenticateService.login(req.body);

  if (result.token) {
    res.cookie('token', result.token, { maxAge: 86400, httpOnly: true });
    res.redirect('/')
  } else {
    const html = await ejs.renderFile('./src/views/login.ejs',
    { error: result.error, user: result.data }, { async: true });
    res.send(html);
  }
});

module.exports = router;
