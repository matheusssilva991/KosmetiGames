const express = require('express');
const router = express.Router();
const ejs = require('ejs');

const authMiddleware = require('../middlewares/auth.middleware');
const userService = require('../services/userService');

router.get('/register', authMiddleware.unauth, async (req, res) => {
  const html = await ejs.renderFile('./src/views/register.ejs', {error: null, data: {}, user: {}},
   { async: true})
  res.send(html);
});

router.post('/register', authMiddleware.unauth, async (req, res) => {
  const result = await userService.create(req.body);

  if (!result.error) {
    res.redirect('/')
  } else {
    const html = await ejs.renderFile('./src/views/register.ejs',
    { error: result.error, data: result.data }, { async: true });
    res.send(html);
  }
});

module.exports = router;
