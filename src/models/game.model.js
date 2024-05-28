const connection = require('../database/connection');

class GameModel {
  async create(data) {
    const { name, enterprise } = data;
    const sql = `INSERT INTO game (name, enterprise) VALUES ('${name}', '${enterprise}')`;
    try {
      await connection.query(sql);
      return { name, enterprise };
    } catch (error) {
      return error;
    }
  }

  async findAll() {
    const sql = 'SELECT * FROM game';
    try {
      const games = await connection.query(sql);
      return games;
    } catch (error) {
      return error;
    }
  }

  async findOne(id) {
    const sql = `SELECT * FROM game WHERE id = ${id}`;
    try {
      const game = await connection.query(sql);
      return game;
    } catch (error) {
      return error;
    }
  }
}


module.exports = new GameModel();
