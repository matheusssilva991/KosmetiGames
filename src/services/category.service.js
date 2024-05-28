const categoryModel = require('../models/category.model');

class CategoryService {
  async create(data) {
    return await categoryModel.create(data);
  }

  async findAll() {
    return await categoryModel.findAll();
  }

  async findOne(id) {
    const game = await categoryModel.findOne(id);

    if (!game) {
      return { error: 'Categoria não encontrada.', status: 404 };
    }

    return game;
  }
}


module.exports = new CategoryService();
