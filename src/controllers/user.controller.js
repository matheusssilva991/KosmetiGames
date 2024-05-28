const express = require('express');
const router = express.Router();
const ejs = require('ejs');

const authMiddleware = require('../middlewares/auth.middleware');
const userService = require('../services/user.service');

router.get('/register', authMiddleware.unauth, async (req, res) => {
  const html = await ejs.renderFile('./src/views/user/register_user.ejs', {error: null, data: {}, user: null},
   { async: true})
  res.send(html);
});

router.post('/register', authMiddleware.unauth, async (req, res) => {
  const result = await userService.create(req.body);

  if (!result.error) {
    res.redirect('/')
  } else {
    const html = await ejs.renderFile('./src/views/user/register_user.ejs',
    { error: result.error, data: result.data, user: null }, { async: true });
    res.send(html);
  }
});

module.exports = router;
