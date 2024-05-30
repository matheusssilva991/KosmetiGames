const userModel = require('../models/user.model');
const productModel = require('../models/product.model');
const categoryModel = require('../models/category.model');
const gameModel = require('../models/game.model');

class ProductService {
  async create(data) {
    // Check if the user exists
    if (!await userModel.findOne(data.user_id)) {
      return { error: { user: 'Usuário não existe.'}, status: 400, data };
    }

    // Check if the game exists
    if (!await gameModel.findOne(data.game_id)) {
      return { error: { game: 'Jogo não existe.' }, status: 400, data };
    }

    // Check if the category exists
    if (!await categoryModel.findOne(data.category_id)) {
      return { error: { category: 'Categoria não existe.' }, status: 400, data };
    }

    try {
      data.price = parseFloat(data.price);
    } catch (error) {
      return { error: { price: 'O preço deve ser um número.' }, status: 400, data };
    }

    if (data.price < 0) {
      return { error: { price: 'O preço não pode ser negativo.' }, status: 400, data };
    }

    if (data.stock < 0) {
      return { error: { stock: 'O estoque não pode ser negativo.' }, status: 400, data };
    }

    data.description = data.description.trim().replace("\n", "");

    return await productModel.create(data);
  }

  async findAll() {
    const products =  await productModel.findAll();
    return products;
  }

  async findOne(id) {
    const product = await productModel.findOne(id);

    if (!product) {
      return { error: { product: 'Produto não encontrado.' }, status: 404 };
    }

    return product;
  }

  async findReviews(id) {
    return await productModel.findReviews(id);
  }

  async findByUserId(id) {
    return await productModel.findByUserId(id);
  }

  async update(id, data) {
    const product = await this.findOne(id);

    data.description = data.description.trim().replace("\n", "");

    if (product.error) {
      return product;
    }

    // Check if the user exists
    if (data.user_id && !await userModel.findOne(data.user_id)) {
      return { error: { user: 'Usuário não existe.'}, status: 400, data };
    }

    // Check if the game exists
    if (data.game_id && !await gameModel.findOne(data.game_id)) {
      return { error: { game: 'Jogo não existe.' }, status: 400, data };
    }

    // Check if the category exists
    if (data.category_id && !await categoryModel.findOne(data.category_id)) {
      return { error: { category: 'Categoria não existe.' }, status: 400, data };
    }

    if (data.price) {
      try {
        data.price = parseFloat(data.price);
      } catch (error) {
        return { error: { price: 'O preço deve ser um número.' }, status: 400, data };
      }

      if (data.price < 0) {
        return { error: { price: 'O preço não pode ser negativo.' }, status: 400, data };
      }
    }

    if (data.stock && data.stock < 0) {
      return { error: { stock: 'O estoque não pode ser negativo.' }, status: 400, data };
    }

    if (data.image_path && product.image_path !== data.image_path) {
      try {
        const fs = require('fs');
        const path = require('path');
        const imagePath = path.join(__dirname, '../../public' + product.image_path)
        fs.unlinkSync(imagePath);
      }
      catch (error) {
        return { error: {image: 'Erro ao remover a imagem antiga.'}, status: 500 };
      }
    } else {
      data.image_path = product.image_path;
    }

    return await productModel.update(id, data);
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
      return { error: 'Erro ao remover a imagem.', status: 500 };
    }
  }
}


module.exports = new ProductService();
