const connection = require('../database/connection');

class ProductModel {
  async create(data) {
    const { name, description, price, stock, image_path, user_id, category_id, game_id } = data;
    const sql = `INSERT INTO product (name, description, price, stock, image_path, user_id, category_id, game_id) VALUES ('${name}',
    '${description}', '${price}', '${stock}', '${image_path}', '${user_id}', '${category_id}', '${game_id}')`;
    try {
      return await connection.query(sql);
    } catch (error) {
      return error;
    }
  }

  async findAll() {
    const sql = `SELECT product.id, product.name, description, price, stock, image_path,
    category.name as category_name, game.name as game_name, game.enterprise as game_enterprise,
    user_id, category_id FROM product INNER JOIN category on category.id = product.category_id
    INNER JOIN game on game.id = product.game_id`;
    try {
      const products = await connection.query(sql);
      return products;
    } catch (error) {
      return error;
    }
  }

  async findOne(id) {
    const sql = `SELECT product.id, product.name, description, price, stock, image_path, category.name as
    category_name, game.name as game_name, game.enterprise as game_enterprise, user_id, category_id FROM product
    INNER JOIN category on category.id = product.category_id INNER JOIN game on game.id = product.game_id WHERE product.id = ${id}`;
    try {
      const product = await connection.query(sql);
      return product[0];
    } catch (error) {
      return error;
    }
  }

  async findReviews(id) {
    const sql = `SELECT * FROM review INNER JOIN user ON review.user_id = user.id WHERE product_id = ${id}`;
    try {
      const reviews = await connection.query(sql);
      return reviews;
    } catch (error) {
      return error;
    }
  }

  async findByUserId(id) {
    const sql = `SELECT product.id, product.name, description, price, stock, image_path, category.name as
    category_name, game.name as game_name, game.enterprise as game_enterprise, user_id, category_id FROM product
    INNER JOIN category on category.id = product.category_id INNER JOIN game on game.id = product.game_id
    WHERE user_id = ${id}`;
    try {
      const products = await connection.query(sql);
      return products;
    } catch (error) {
      return error;
    }
  }

  async remove(id) {
    const sql = `DELETE FROM product WHERE id = ${id}`;
    try {
      return await connection.query(sql);
    } catch (error) {
      return error;
    }
  }
}


module.exports = new ProductModel();
