const express = require('express');
const router = express.Router();
const ejs = require('ejs');

const userService = require('../services/userService');

router.get('/register', async (req, res) => {
  const html = await ejs.renderFile('./src/views/register.ejs', {error: null}, { async: true})
  res.send(html);
});

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const data = { name, email, password };

  const result = await userService.create(data);

  if (!result.error) {
    res.redirect('/')
  } else {
    const html = await ejs.renderFile('./src/views/register.ejs',
    { error: result.error }, { async: true });
    res.send(html);
  }
});

module.exports = router;
