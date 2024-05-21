const express = require('express');
const router = express.Router();
const ejs = require('ejs');

const authenticateService = require('../services/authenticateService');

router.get('/login', async (req, res) => {
  const html = await ejs.renderFile('./src/views/login.ejs', {error: null}, { async: true})
  res.send(html);
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await authenticateService.login(email, password);
  if (user) {
    res.redirect('/')
  } else {
    const html = await ejs.renderFile('./src/views/login.ejs',
    { error: 'Invalid email or password' }, { async: true });
    res.send(html);
  }
});

module.exports = router;
