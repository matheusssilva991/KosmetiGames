const connection = require('../database/connection');

class CategoryModel {
  async create(data) {
    const { name } = data;
    const sql = `INSERT INTO category (name) VALUES ('${name}')`;
    try {
      await connection.execute(sql);
      return { name };
    } catch (error) {
      return error;
    }
  }

  async findAll() {
    const sql = 'SELECT * FROM category';
    try {
      const [categories] = await connection.execute(sql);
      return categories;
    } catch (error) {
      return error;
    }
  }

  async findOne(id) {
    const sql = `SELECT * FROM category WHERE id = ${id}`;
    try {
      const [category] = await connection.execute(sql);
      return category[0];
    } catch (error) {
      return error;
    }
  }
}


module.exports = new CategoryModel();
