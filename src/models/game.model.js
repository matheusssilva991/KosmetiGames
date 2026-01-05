/**
 * Model de Jogos
 *
 * Responsável pelas operações de banco de dados relacionadas aos jogos.
 * Realiza operações de consulta e criação na tabela game.
 *
 * @author Matheus Santos Silva
 */

const connection = require('../database/connection');

class GameModel {
  /**
   * Cria um novo jogo
   *
   * @param {Object} data - Dados do jogo
   * @param {string} data.name - Nome do jogo
   * @param {string} data.enterprise - Empresa desenvolvedora
   * @returns {Object} Jogo criado ou erro
   */
  async create(data) {
    const { name, enterprise } = data;
    const sql = `INSERT INTO game (name, enterprise) VALUES ('${name}', '${enterprise}')`;
    try {
      await connection.execute(sql);
      return { name, enterprise };
    } catch (error) {
      return error;
    }
  }

  /**
   * Busca todos os jogos
   *
   * @returns {Array} Lista de todos os jogos ou erro
   */
  async findAll() {
    const sql = 'SELECT * FROM game';
    try {
      const [games] = await connection.execute(sql);
      return games;
    } catch (error) {
      return error;
    }
  }

  /**
   * Busca um jogo específico por ID
   *
   * @param {number} id - ID do jogo
   * @returns {Object} Dados do jogo ou undefined
   */
  async findOne(id) {
    const sql = `SELECT * FROM game WHERE id = ${id}`;
    try {
      const [game] = await connection.execute(sql);
      return game[0];
    } catch (error) {
      return error;
    }
  }
}


module.exports = new GameModel();
