const express = require('express');
const router = express.Router();
const ejs = require('ejs');

const authenticateService = require('../services/authenticateService');

router.get('/login', async (req, res) => {
  const html = await ejs.renderFile('./src/views/login.ejs', {error: null}, { async: true})
  res.send(html);
});

router.post('/login', async (req, res) => {
  const result = await authenticateService.login(req.body);
  console.log(result);
  
  if (result.token) {
    res.redirect('/')
  } else {
    const html = await ejs.renderFile('./src/views/login.ejs',
    { error: result.error }, { async: true });
    res.send(html);
  }
});

module.exports = router;
