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
  const { error, data } = await userService.create(req.body);

  if (!error) {
    res.redirect('/')
  } else {
    const html = await ejs.renderFile('./src/views/user/register_user.ejs',
    { error, data, user: null }, { async: true });
    res.send(html);
  }
});

router.get('/user/:id', async (req, res) => {
  const user = req.session.user;
  const id = req.params.id;
  const result = await userService.findOne(id);
  const { error } = result;
  const data = result;
  delete data.error

  const html = await ejs.renderFile('./src/views/user/view_user.ejs', { user, error, data }, { async: true });
  res.send(html);
});

router.patch('/user/edit', authMiddleware.auth, authMiddleware.owner, async (req, res) => {
  const user = req.session.user;
  const { error, data } = await userService.update(user.id, req.body);

  if (!error) {
    res.redirect('/')
  } else {
    const html = await ejs.renderFile('./src/views/user/update_user.ejs',
    { error, data, user }, { async: true });
    res.send(html);
  }
});

module.exports = router;
