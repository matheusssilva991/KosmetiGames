const connection = require('../database/connection');

class UserModel {
  async create(data) {
    const { name, email, password } = data;
    const sql = `INSERT INTO user (name, email, password) VALUES ('${name}', '${email}', '${password}')`;
    try {
      await connection.query(sql);
      return { name, email };
    } catch (error) {
      return error;
    }
  }

  async findAll() {
    const sql = 'SELECT * FROM user';
    try {
      const users = await connection.query(sql);
      return users;
    } catch (error) {
      return error;
    }
  }

  async findOne(id) {
    const sql = `SELECT * FROM user WHERE id = ${id}`;
    try {
      const user = await connection.query(sql);
      return user;
    } catch (error) {
      return error;
    }
  }

  async findOneByEmail(email) {
    const sql = `SELECT * FROM user WHERE email = '${email}'`;
    try {
      const user = await connection.query(sql);
      return user;
    } catch (error) {
      return error;
    }
  }
}


module.exports = new UserModel();
