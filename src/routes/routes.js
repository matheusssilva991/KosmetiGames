const express = require('express');
const router = express.Router();

const authenticateController = require('../controllers/auth');
const userController = require('../controllers/user');

router.use('/', authenticateController);
router.use('/', userController);

module.exports = router;
