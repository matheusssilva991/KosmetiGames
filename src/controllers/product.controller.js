const express = require('express');
const router = express.Router();
const ejs = require('ejs');
const { upload } = require('../multer/multer');

const authMiddleware = require('../middlewares/auth.middleware');
const productService = require('../services/product.service');
const gameService = require('../services/game.service');
const categoryService = require('../services/category.service');

router.get('/', async (req, res) => {
  const user = req.session.user;
  const products = await productService.findAll();

  const html = await ejs.renderFile('./src/views/home.ejs', { user, products }, { async: true });
  res.send(html);
});

router.get('/product/:id', async (req, res) => {
  const user = req.session.user;
  const id = req.params.id;
  const product = await productService.findOne(id);

  const html = await ejs.renderFile('./src/views/product/view_product.ejs', { user, product }, { async: true });
  res.send(html);
});

router.get('/user/:id/products', authMiddleware.auth, authMiddleware.owner, async (req, res) => {
  const user = req.session.user;
  const id = req.params.id;
  const products = await productService.findByUserId(id);

  const html = await ejs.renderFile('./src/views/product/user_products.ejs', { user, products }, { async: true });
  res.send(html);
});

router.get('/product/register', authMiddleware.auth, async (req, res) => {
  const user = req.session.user;
  const games = await gameService.findAll();
  const categories = await categoryService.findAll();
  const html = await ejs.renderFile('./src/views/product/register_product.ejs', {error: null, data: {}, user,
   games, categories},
   { async: true})
  res.send(html);
});

router.post('/product/register', upload.single('image'), authMiddleware.auth, async (req, res) => {
  const user = req.session.user;
  const data = req.body;
  const games = await gameService.findAll();
  const categories = await categoryService.findAll();
  data.user_id = user.id;
  data.image_path = "/images/" + req.file.filename;

  const result = await productService.create(data);

  if (!result.error) {
    res.redirect('/')
  } else {
    const html = await ejs.renderFile('./src/views/product/register_product.ejs',
    { error: result.error, data: result.data, user, games, categories }, { async: true });
    res.send(html);
  }
});

module.exports = router;
