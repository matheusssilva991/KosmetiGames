const express = require('express');
const router = express.Router();

const authenticateController = require('../controllers/auth.controller');
const userController = require('../controllers/user.controller');
const productController = require('../controllers/product.controller');

router.use('/', authenticateController);
router.use('/', userController);
router.use('/', productController);

module.exports = router;
