const express = require('express');
const router = express.Router();
const ejs = require('ejs');

const authMiddleware = require('../middlewares/auth.middleware');
const productService = require('../services/product.service');
const gameService = require('../services/game.service');
const categoryService = require('../services/category.service');

router.get('/product/register', authMiddleware.auth, async (req, res) => {
  const user = req.session.user;
  const games = await gameService.findAll();
  const categories = await categoryService.findAll();

  const html = await ejs.renderFile('./src/views/product/register_product.ejs', {error: null, data: {}, user,
   games, categories},
   { async: true})
  res.send(html);
});

router.post('/product/register', authMiddleware.auth, async (req, res) => {
  const user = req.session.user;
  const data = req.body;
  data.user_id = user.id;

  const result = await productService.create(data);

  if (!result.error) {
    res.redirect('/')
  } else {
    const html = await ejs.renderFile('./src/views/product/register_product.ejs',
    { error: result.error, data: result.data, user }, { async: true });
    res.send(html);
  }
});

module.exports = router;
