/**
 * Model de Categorias
 *
 * Responsável pelas operações de banco de dados relacionadas às categorias de produtos.
 * Realiza operações de consulta e criação na tabela category.
 *
 * @author Matheus Santos Silva
 */

const connection = require('../database/connection');

class CategoryModel {
  /**
   * Cria uma nova categoria
   *
   * @param {Object} data - Dados da categoria
   * @param {string} data.name - Nome da categoria
   * @returns {Object} Categoria criada ou erro
   */
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

  /**
   * Busca todas as categorias
   *
   * @returns {Array} Lista de todas as categorias ou erro
   */
  async findAll() {
    const sql = 'SELECT * FROM category';
    try {
      const [categories] = await connection.execute(sql);
      return categories;
    } catch (error) {
      return error;
    }
  }

  /**
   * Busca uma categoria específica por ID
   *
   * @param {number} id - ID da categoria
   * @returns {Object} Dados da categoria ou undefined
   */
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
