/**
 * Model de Usuários
 *
 * Responsável pelas operações de banco de dados relacionadas aos usuários.
 * Realiza operações CRUD (Create, Read, Update, Delete) na tabela user.
 *
 * @author Matheus Santos Silva
 */

const connection = require('../database/connection');

class UserModel {
  /**
   * Cria um novo usuário no banco de dados
   *
   * @param {Object} data - Dados do usuário
   * @param {string} data.name - Nome do usuário
   * @param {string} data.email - E-mail do usuário
   * @param {string} data.password - Senha criptografada
   * @param {string} data.address - Endereço do usuário
   * @param {string} data.phone_number - Telefone do usuário
   * @returns {Object} Dados do usuário criado (sem password) ou erro
   */
  async create(data) {
    const { name, email, password, address, phone_number } = data;
    const sql = `INSERT INTO user (name, email, password, address, phone_number) VALUES ('${name}',
    '${email}', '${password}', '${address}', '${phone_number}')`;
    try {
      await connection.execute(sql);
      return { name, email, address, phone_number };
    } catch (error) {
      return error;
    }
  }

  /**
   * Busca todos os usuários
   *
   * @returns {Array} Lista de todos os usuários ou erro
   */
  async findAll() {
    const sql = 'SELECT * FROM user';
    try {
      const [users] = await connection.execute(sql);
      return users;
    } catch (error) {
      return error;
    }
  }

  /**
   * Busca um usuário específico por ID
   *
   * @param {number} id - ID do usuário
   * @returns {Object} Dados do usuário ou undefined se não encontrado
   */
  async findOne(id) {
    const sql = `SELECT * FROM user WHERE id = ${id}`;
    try {
      const [user] = await connection.execute(sql);
      return user[0];
    } catch (error) {
      return error;
    }
  }

  /**
   * Busca um usuário por e-mail
   *
   * @param {string} email - E-mail do usuário
   * @returns {Object} Dados do usuário ou undefined se não encontrado
   */
  async findOneByEmail(email) {
    const sql = `SELECT * FROM user WHERE email = '${email}'`;
    try {
      const [user] = await connection.execute(sql);
      return user[0];
    } catch (error) {
      return error;
    }
  }

  /**
   * Atualiza os dados de um usuário
   *
   * Se a senha não for fornecida, mantém a senha atual.
   *
   * @param {number} id - ID do usuário
   * @param {Object} data - Novos dados do usuário
   * @returns {Object} Resultado da atualização ou erro
   */
  async update(id, data) {
    const { name, email, address, phone_number } = data;
    let { password } = data;
    const user = await this.findOne(id);

    if (user && !password) {
      password = user.password;
    }

    const sql = `UPDATE user SET name = '${name}', email = '${email}', password = '${password}',
    address = '${address}', phone_number = '${phone_number}' WHERE id = ${id}`;

    try {
      return await connection.execute(sql);
    } catch (error) {
      return error;
    }
  }
}


module.exports = new UserModel();
