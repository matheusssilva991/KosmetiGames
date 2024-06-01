const express = require('express');
const router = express.Router();
const ejs = require('ejs');
const { upload } = require('../multer/multer');

const authMiddleware = require('../middlewares/auth.middleware');
const productService = require('../services/product.service');
const gameService = require('../services/game.service');
const categoryService = require('../services/category.service');
const cartService = require('../services/cart.service');

router.get('/', async (req, res) => {
  const user = req.session.user || {};
  const games = await gameService.findAll();
  const categories = await categoryService.findAll();
  const query = req.query;
  let products = [];

  if (query.game || query.category || query.search) {
    products = await productService.findAllQuery(query);
  } else {
    products = await productService.findAll();
  }

  const html = await ejs.renderFile('./src/views/home.ejs', { user, products, games, categories },
   { async: true });
  res.send(html);
});

router.get('/product/:id', async (req, res) => {
  const user = req.session.user || {};
  const { id } = req.params;
  const product = await productService.findOne(id);
  
  const html = await ejs.renderFile('./src/views/product/view_product.ejs', { user, product, error: product.error },
   { async: true });
  res.send(html);
});

router.get('/user/:id/product/:product_id/edit', authMiddleware.auth, authMiddleware.owner, async (req, res) => {
  const user = req.session.user;
  const { product_id } = req.params;
  const result = await productService.findOne(product_id);
  const games = await gameService.findAll();
  const categories = await categoryService.findAll();

  const html = await ejs.renderFile('./src/views/product/edit_product.ejs',
  { user, data: result, error:result.error, games, categories }, { async: true });
  res.send(html);
});

router.post('/user/:id/product/:product_id/edit', upload.single('image'), authMiddleware.auth, authMiddleware.owner, async (req, res) => {
  const user = req.session.user;
  const { product_id, id } = req.params;
  const data = req.body;
  const games = await gameService.findAll();
  const categories = await categoryService.findAll();
  data.id = product_id;
  data.user_id = id;

  if (req.file) {
    data.image_path = '/images/' + req.file.filename;
  }

  const result = await productService.update(product_id, data);

  if (!result.error) {
    res.redirect('/user/' + user.id + '/products');
  } else {
    if (req.file) {
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, '../../public' + data.image_path);
      fs.unlinkSync(imagePath);
    }
    const html = await ejs.renderFile('./src/views/product/edit_product.ejs',
    { user, data, error: result.error, games, categories }, { async: true });
    res.send(html);
  }
});

router.get('/user/:id/products', authMiddleware.auth, authMiddleware.owner, async (req, res) => {
  const user = req.session.user;
  const id = req.params.id;
  const products = await productService.findByUserId(id);

  const html = await ejs.renderFile('./src/views/product/user_products.ejs', { user, products, error: undefined }, { async: true });
  res.send(html);
});

router.get('/user/:id/product/register', authMiddleware.auth, async (req, res) => {
  const user = req.session.user;
  const games = await gameService.findAll();
  const categories = await categoryService.findAll();
  const html = await ejs.renderFile('./src/views/product/register_product.ejs', {error: null, data: {}, user,
   games, categories},
   { async: true})
  res.send(html);
});

router.post('/user/:id/product/register', upload.single('image'), authMiddleware.auth, async (req, res) => {
  const user = req.session.user;
  const data = req.body;
  const games = await gameService.findAll();
  const categories = await categoryService.findAll();
  data.user_id = req.params.id;
  data.image_path = "/images/" + req.file.filename;

  const result = await productService.create(data);

  if (!result.error) {
    res.redirect('/')
  } else {
    const fs = require('fs');
    const path = require('path');
    const imagePath = path.join(__dirname, '../../public' + product.image_path);
    fs.unlinkSync(imagePath);
    const html = await ejs.renderFile('./src/views/product/register_product.ejs',
    { error: result.error, data: result.data, user, games, categories }, { async: true });
    res.send(html);
  }
});

router.post('/user/:id/product/:product_id/delete', authMiddleware.auth, authMiddleware.owner, async (req, res) => {
  const { id, product_id } = req.params;
  const products = await productService.findByUserId(id);
  const result = await productService.remove(product_id);
  const user = req.session.user;

  if (!result.error) {
    res.redirect('/user/' + id + '/products');
  } else {
    const html = await ejs.renderFile('./src/views/product/user_products.ejs',
    { user, products, error: result.error }, { async: true });
    res.send(html);
  }
});

router.post('/user/:id/cart/product/:product_id', authMiddleware.auth, async (req, res) => {
  const { id, product_id } = req.params;
  const result = await cartService.addProduct({ user_id: id, product_id });

  if (!result.error) {
    res.redirect('/');
  }

});

module.exports = router;
