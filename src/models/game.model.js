const connection = require('../database/connection');

class GameModel {
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

  async findAll() {
    const sql = 'SELECT * FROM game';
    try {
      const [games] = await connection.execute(sql);
      return games;
    } catch (error) {
      return error;
    }
  }

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
