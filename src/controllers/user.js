const express = require('express');
const router = express.Router();
const ejs = require('ejs');

const userService = require('../services/userService');

router.get('/register', async (req, res) => {
  const html = await ejs.renderFile('./src/views/register.ejs', {error: null}, { async: true})
  res.send(html);
});

module.exports = router;
