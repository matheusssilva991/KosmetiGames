/**
 * Controller de Produtos
 *
 * Gerencia todas as operações relacionadas a produtos,
 * incluindo listagem, visualização, criação, edição e exclusão.
 * Também gerencia o carrinho de compras e histórico de compras.
 *
 * @author Matheus Santos Silva
 */

const express = require('express');
const router = express.Router();
const ejs = require('ejs');
const { upload } = require('../multer/multer');

const authMiddleware = require('../middlewares/auth.middleware');
const productService = require('../services/product.service');
const gameService = require('../services/game.service');
const categoryService = require('../services/category.service');
const cartService = require('../services/cart.service');

/**
 * GET /
 * Exibe a página inicial com listagem de produtos
 * Permite filtrar produtos por jogo, categoria ou busca
 *
 * @query {string} game - ID do jogo para filtrar
 * @query {string} category - ID da categoria para filtrar
 * @query {string} search - Termo de busca
 * @returns {HTML} Página inicial com produtos, jogos e categorias
 */
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

/**
 * GET /product/:id
 * Exibe os detalhes de um produto específico
 *
 * @param {string} id - ID do produto
 * @returns {HTML} Página com detalhes do produto
 */
router.get('/product/:id', async (req, res) => {
  const user = req.session.user || {};
  const { id } = req.params;
  const product = await productService.findOne(id);

  const html = await ejs.renderFile('./src/views/product/view_product.ejs', { user, product, error: product.error },
   { async: true });
  res.send(html);
});

/**
 * GET /user/:id/product/:product_id/edit
 * Exibe o formulário de edição de produto
 *
 * @middleware auth - Verifica se o usuário está autenticado
 * @middleware owner - Verifica se o usuário é o dono do recurso
 * @param {string} id - ID do usuário
 * @param {string} product_id - ID do produto
 * @returns {HTML} Formulário de edição do produto
 */
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

/**
 * POST /user/:id/product/:product_id/edit
 * Processa a atualização de um produto
 *
 * @middleware upload.single('image') - Faz upload de uma imagem
 * @middleware auth - Verifica se o usuário está autenticado
 * @middleware owner - Verifica se o usuário é o dono do recurso
 * @param {string} id - ID do usuário
 * @param {string} product_id - ID do produto
 * @body {Object} data - Dados do produto a serem atualizados
 * @returns {Redirect|HTML} Redireciona para lista de produtos ou exibe erros
 */
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

/**
 * GET /user/:id/products
 * Lista todos os produtos cadastrados por um usuário específico
 *
 * @middleware auth - Verifica se o usuário está autenticado
 * @middleware owner - Verifica se o usuário é o dono do recurso
 * @param {string} id - ID do usuário
 * @returns {HTML} Página com lista de produtos do usuário
 */
router.get('/user/:id/products', authMiddleware.auth, authMiddleware.owner, async (req, res) => {
  const user = req.session.user;
  const id = req.params.id;
  const products = await productService.findByUserId(id);

  const html = await ejs.renderFile('./src/views/product/user_products.ejs', { user, products, error: undefined }, { async: true });
  res.send(html);
});

/**
 * GET /user/:id/product/register
 * Exibe o formulário de cadastro de novo produto
 *
 * @middleware auth - Verifica se o usuário está autenticado
 * @param {string} id - ID do usuário
 * @returns {HTML} Formulário de cadastro de produto com jogos e categorias
 */
router.get('/user/:id/product/register', authMiddleware.auth, async (req, res) => {
  const user = req.session.user;
  const games = await gameService.findAll();
  const categories = await categoryService.findAll();
  const html = await ejs.renderFile('./src/views/product/register_product.ejs', {error: null, data: {}, user,
   games, categories},
   { async: true})
  res.send(html);
});

/**
 * POST /user/:id/product/register
 * Processa o cadastro de um novo produto
 *
 * @middleware upload.single('image') - Faz upload da imagem do produto
 * @middleware auth - Verifica se o usuário está autenticado
 * @param {string} id - ID do usuário
 * @body {Object} data - Dados do produto (name, description, price, stock, etc)
 * @returns {Redirect|HTML} Redireciona para home se sucesso, ou exibe erros
 */
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

/**
 * POST /user/:id/product/:product_id/delete
 * Exclui um produto específico do usuário
 *
 * @middleware auth - Verifica se o usuário está autenticado
 * @middleware owner - Verifica se o usuário é o dono do recurso
 * @param {string} id - ID do usuário
 * @param {string} product_id - ID do produto a ser excluído
 * @returns {Redirect|HTML} Redireciona para lista de produtos ou exibe erros
 */
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

/**
 * POST /user/:id/cart/product/:product_id
 * Adiciona um produto ao carrinho do usuário
 *
 * @middleware auth - Verifica se o usuário está autenticado
 * @param {string} id - ID do usuário
 * @param {string} product_id - ID do produto a ser adicionado
 * @returns {Redirect} Redireciona para a página inicial
 */
router.post('/user/:id/cart/product/:product_id', authMiddleware.auth, async (req, res) => {
  const { id, product_id } = req.params;
  const result = await cartService.addProduct({ user_id: id, product_id });

  if (!result.error) {
    res.redirect('/');
  }

});

/**
 * GET /user/:id/cart
 * Exibe o carrinho de compras do usuário
 * Cria um novo carrinho se não existir um ativo
 *
 * @middleware auth - Verifica se o usuário está autenticado
 * @param {string} id - ID do usuário
 * @returns {HTML} Página do carrinho com produtos
 */
router.get('/user/:id/cart', authMiddleware.auth, async (req, res) => {
  const user = req.session.user;
  let cart = await cartService.findActiveOrder(user.id);

  if (cart.error) {
    await cartService.create({ status: 'open', user_id: user.id });
    cart = await cartService.findActiveOrder(user.id);
  }

  const products = await cartService.findProductsInOrder(cart.id);

  const html = await ejs.renderFile('./src/views/user/view_cart.ejs', { user, cart, products },
   { async: true });
  res.send(html);
});

/**
 * POST /user/:id/cart/product/:product_id/delete
 * Remove um produto do carrinho do usuário
 *
 * @middleware auth - Verifica se o usuário está autenticado
 * @param {string} id - ID do usuário
 * @param {string} product_id - ID do produto a ser removido
 * @returns {Redirect} Redireciona para o carrinho
 */
router.post('/user/:id/cart/product/:product_id/delete', authMiddleware.auth, async (req, res) => {
  const { id, product_id } = req.params;
  const user = req.session.user;
  const cart = await cartService.findActiveOrder(user.id);
  const result = await cartService.removeProduct(cart.id, product_id);

  if (!result.error) {
    res.redirect('/user/' + id + '/cart');
  }
});

/**
 * GET /user/:id/purchased-products
 * Exibe o histórico de produtos comprados pelo usuário
 *
 * @middleware auth - Verifica se o usuário está autenticado
 * @middleware owner - Verifica se o usuário é o dono do recurso
 * @param {string} id - ID do usuário
 * @returns {HTML} Página com histórico de compras
 */
router.get('/user/:id/purchased-products', authMiddleware.auth, authMiddleware.owner, async (req, res) => {
  const user = req.session.user;
  const products = await cartService.findPurchasedProducts(user.id);

  const html = await ejs.renderFile('./src/views/product/user_purchased_products.ejs', { user, products },
   { async: true });
  res.send(html);
});

/**
 * POST /user/:id/cart/checkout
 * Finaliza a compra do carrinho do usuário
 * Altera o status do pedido de 'open' para 'completed'
 *
 * @middleware auth - Verifica se o usuário está autenticado
 * @param {string} id - ID do usuário
 * @returns {Redirect} Redireciona para página de produtos comprados
 */
router.post('/user/:id/cart/checkout', authMiddleware.auth, async (req, res) => {
  const user = req.session.user;
  const cart = await cartService.findActiveOrder(user.id);
  const result = await cartService.checkout(cart.id);

  if (!result.error) {
    res.redirect('/user/' + user.id + '/purchased-products');
  }
});

module.exports = router;
