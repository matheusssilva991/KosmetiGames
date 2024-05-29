const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');

class UserService {
  async create(data) {
    // Check if the password has at least 6 characters
    if (data.password?.length < 6) {
      return { error: {password: 'Senha deve ter ao menos 6 caracteres.'}, status: 400, data };
    }

    if (await userModel.findOneByEmail(data.email)) {
      return { error: {email: 'E-mail já cadastrado.'}, status: 400, data };
    }

    // Encrypt the password
    const hash = bcrypt.hashSync(data.password, 10);
    data.password = hash;

    return await userModel.create(data);
  }

  async findAll() {
    const users = await userModel.findAll();

    users.forEach(user => {
      delete user.password;
    });
    return users;
  }

  async findOne(id) {
    const user = await userModel.findOne(id);

    if (!user) {
      return { error: 'Usuário não encontrado.', status: 404 };
    }

    return user;
  }

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
    }

    return await userModel.update(id, data);
  }
}


module.exports = new UserService();
