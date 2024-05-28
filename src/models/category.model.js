const connection = require('../database/connection');

class CategoryModel {
  async create(data) {
    const { name } = data;
    const sql = `INSERT INTO category (name) VALUES ('${name}')`;
    try {
      await connection.query(sql);
      return { name };
    } catch (error) {
      return error;
    }
  }

  async findAll() {
    const sql = 'SELECT * FROM category';
    try {
      const categories = await connection.query(sql);
      return categories;
    } catch (error) {
      return error;
    }
  }

  async findOne(id) {
    const sql = `SELECT * FROM category WHERE id = ${id}`;
    try {
      const product = await connection.query(sql);
      return product;
    } catch (error) {
      return error;
    }
  }
}


module.exports = new CategoryModel();
