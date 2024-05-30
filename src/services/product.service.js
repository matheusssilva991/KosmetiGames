const userModel = require('../models/user.model');
const productModel = require('../models/product.model');
const categoryModel = require('../models/category.model');
const gameModel = require('../models/game.model');

class ProductService {
  async create(data) {
    // Check if the user exists
    if (!await userModel.findOne(data.user_id)) {
      return { error: 'Usuário não existe.', status: 400, data };
    }

    // Check if the game exists
    if (!await gameModel.findOne(data.game_id)) {
      return { error: 'Jogo não existe.', status: 400, data };
    }

    // Check if the category exists
    if (!await categoryModel.findOne(data.category_id)) {
      return { error: 'Categoria não existe.', status: 400, data };
    }

    try {
      data.price = parseFloat(data.price);
    } catch (error) {
      return { error: 'O preço deve ser um número.', status: 400, data };
    }

    if (data.price < 0) {
      return { error: 'O preço não pode ser negativo.', status: 400, data };
    }

    if (data.stock < 0) {
      return { error: 'O estoque não pode ser negativo.', status: 400, data };
    }

    return await productModel.create(data);
  }

  async findAll() {
    const products =  await productModel.findAll();
    return products;
  }

  async findOne(id) {
    const product = await productModel.findOne(id);

    if (!product) {
      return { error: 'Produto não encontrado.', status: 404 };
    }

    return product;
  }

  async findReviews(id) {
    return await productModel.findReviews(id);
  }

  async findByUserId(id) {
    return await productModel.findByUserId(id);
  }

  async remove(id) {
    const product = await this.findOne(id);

    if (product.error) {
      return product;
    }

    try {
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, '../../public' + product.image_path);
      fs.unlinkSync(imagePath);
      return await productModel.remove(id);
    } catch (error) {
      console.log(error);
      return { error: 'Erro ao remover a imagem.', status: 500 };
    }
  }
}


module.exports = new ProductService();
