/**
 * Service de Usuários
 *
 * Gerencia a lógica de negócios relacionada aos usuários,
 * incluindo validações, cadastro, atualização e consultas.
 *
 * @author Matheus Santos Silva
 */

const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');

class UserService {
  /**
   * Cria um novo usuário
   *
   * Valida os dados do usuário (e-mail, senha) e cria
   * um novo registro no banco de dados com a senha criptografada.
   *
   * @param {Object} data - Dados do usuário
   * @param {string} data.name - Nome do usuário
   * @param {string} data.email - E-mail do usuário
   * @param {string} data.password - Senha do usuário
   * @returns {Object} Usuário criado ou objeto de erro
   */
  async create(data) {
    // Check if the password has at least 6 characters
    if (data.password?.length < 6) {
      return { error: {password: 'Senha deve ter ao menos 6 caracteres.'}, status: 400, data };
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(data.email)) {
      return { error: {email: 'E-mail inválido.'}, status: 400, data };
    }

    // Check if the email is already registered
    const user = await userModel.findOneByEmail(data.email);

    if (user) {
      return { error: {email: 'E-mail já cadastrado.'}, status: 400, data };
    }

    // Encrypt the password
    const hash = bcrypt.hashSync(data.password, 10);
    data.password = hash;

    return await userModel.create(data);
  }

  /**
   * Busca todos os usuários
   *
   * Remove o campo password de cada usuário por segurança.
   *
   * @returns {Array} Lista de usuários sem o campo password
   */
  async findAll() {
    const users = await userModel.findAll();

    users.forEach(user => {
      delete user.password;
    });
    return users;
  }

  /**
   * Busca um usuário específico por ID
   *
   * Remove o campo password do usuário por segurança.
   *
   * @param {number} id - ID do usuário
   * @returns {Object} Dados do usuário sem password ou objeto de erro
   */
  async findOne(id) {
    const user = await userModel.findOne(id);

    if (!user) {
      return { error: 'Usuário não encontrado.', status: 404 };
    }

    delete user.password;
    return user;
  }

  /**
   * Atualiza os dados de um usuário
   *
   * Valida os novos dados (senha, e-mail) e atualiza o registro.
   * Se uma nova senha for fornecida, ela é criptografada.
   *
   * @param {number} id - ID do usuário
   * @param {Object} data - Novos dados do usuário
   * @returns {Object} Usuário atualizado ou objeto de erro
   */
  async update(id, data) {
    const user = await this.findOne(id);

    if (user.error) {
      return user;
    }

    if (data.password) {
      if (data.password.length < 6) {
        return { error: {password: 'Senha deve ter ao menos 6 caracteres.'}, status: 400, data };
      }

      const hash = bcrypt.hashSync(data.password, 10);
      data.password = hash;
    }

    if (data.email && data.email !== user.email) {
      if (await userModel.findOneByEmail(data.email)) {
        return { error: {email: 'E-mail já cadastrado.'}, status: 400, data };
      }
    } else {
      data.password = undefined;
    }

    return await userModel.update(id, data);
  }
}


module.exports = new UserService();
