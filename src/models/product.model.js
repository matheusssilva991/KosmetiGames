/**
 * Model de Produtos
 *
 * Responsável pelas operações de banco de dados relacionadas aos produtos.
 * Realiza operações CRUD na tabela product e consultas relacionadas.
 *
 * @author Matheus Santos Silva
 */

const connection = require('../database/connection');

class ProductModel {
  /**
   * Cria um novo produto no banco de dados
   *
   * @param {Object} data - Dados do produto
   * @param {string} data.name - Nome do produto
   * @param {string} data.description - Descrição do produto
   * @param {number} data.price - Preço do produto
   * @param {number} data.stock - Quantidade em estoque
   * @param {string} data.image_path - Caminho da imagem do produto
   * @param {number} data.user_id - ID do vendedor
   * @param {number} data.category_id - ID da categoria
   * @param {number} data.game_id - ID do jogo relacionado
   * @returns {Object} Resultado da inserção ou erro
   */
  async create(data) {
    const { name, description, price, stock, image_path, user_id, category_id, game_id } = data;
    const sql = `INSERT INTO product (name, description, price, stock, image_path, user_id, category_id, game_id)
    VALUES ('${name}', '${description}', '${price}', '${stock}', '${image_path}', '${user_id}',
     '${category_id}', '${game_id}')`;
    try {
      return await connection.execute(sql);
    } catch (error) {
      return error;
    }
  }

  /**
   * Busca todos os produtos com informações de categoria e jogo
   *
   * Realiza JOIN com as tabelas category e game para trazer
   * informações completas dos produtos.
   *
   * @returns {Array} Lista de produtos com categoria e jogo ou erro
   */
  async findAll() {
    const sql = `SELECT product.id, product.name, description, price, stock, image_path,
    category.name as category_name, game.name as game_name, game.enterprise as game_enterprise,
    user_id, category_id, game_id FROM product INNER JOIN category on category.id = product.category_id
    INNER JOIN game on game.id = product.game_id`;
    try {
      const [products] = await connection.execute(sql);
      return products;
    } catch (error) {
      return error;
    }
  }

  /**
   * Busca um produto específico por ID
   *
   * Realiza JOIN com as tabelas category e game.
   *
   * @param {number} id - ID do produto
   * @returns {Object} Dados do produto com categoria e jogo ou undefined
   */
  async findOne(id) {
    const sql = `SELECT product.id, product.name, description, price, stock, image_path, category.name as
    category_name, game.name as game_name, game.enterprise as game_enterprise, user_id, category_id, game_id
    FROM product INNER JOIN category on category.id = product.category_id
    INNER JOIN game on game.id = product.game_id WHERE product.id = ${id}`;
    try {
      const [product] = await connection.execute(sql);
      return product[0];
    } catch (error) {
      return error;
    }
  }

  /**
   * Busca as avaliações de um produto
   *
   * @param {number} id - ID do produto
   * @returns {Array} Lista de avaliações com dados do usuário ou erro
   */
  async findReviews(id) {
    const sql = `SELECT * FROM review INNER JOIN user ON review.user_id = user.id WHERE product_id = ${id}`;
    try {
      const [reviews] = await connection.execute(sql);
      return reviews;
    } catch (error) {
      return error;
    }
  }

  /**
   * Busca todos os produtos de um usuário específico
   *
   * @param {number} id - ID do usuário
   * @returns {Array} Lista de produtos do usuário ou erro
   */
  async findByUserId(id) {
    const sql = `SELECT product.id, product.name, description, price, stock, image_path, category.name as
    category_name, game.name as game_name, game.enterprise as game_enterprise, user_id, category_id, game_id
    FROM product INNER JOIN category on category.id = product.category_id
    INNER JOIN game on game.id = product.game_id WHERE user_id = ${id}`;
    try {
      const [products] = await connection.execute(sql);
      return products;
    } catch (error) {
      return error;
    }
  }

  /**
   * Atualiza os dados de um produto
   *
   * @param {number} id - ID do produto
   * @param {Object} data - Novos dados do produto
   * @returns {Object} Resultado da atualização ou erro
   */
  async update(id, data) {
    const { name, description, price, stock, image_path, user_id, category_id, game_id } = data;
    const sql = `UPDATE product SET name = '${name}', description = '${description}', price = '${price}',
    stock = '${stock}', image_path = '${image_path}', user_id = '${user_id}', category_id = '${category_id}',
    game_id = '${game_id}' WHERE id = ${id}`;
    try {
      return await connection.execute(sql);
    } catch (error) {
      return error;
    }
  }

  /**
   * Remove um produto do banco de dados
   *
   * @param {number} id - ID do produto
   * @returns {Object} Resultado da exclusão ou erro
   */
  async remove(id) {
    const sql = `DELETE FROM product WHERE id = ${id}`;
    try {
      return await connection.execute(sql);
    } catch (error) {
      return error;
    }
  }
}


module.exports = new ProductModel();
