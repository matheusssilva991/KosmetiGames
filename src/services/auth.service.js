const bcrypt = require('bcrypt');
const userModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

class AuthenticateService {
  async login(data) {
    if (!data.email) {
      return { error: 'E-mail e/ou senha incorretos.', status: 400, data };
    }

    if (!data.password) {
      return { error: 'E-mail e/ou senha incorretos.', status: 400, data };
    }

    const user = await userModel.findOneByEmail(data.email);

    if (!user) {
      return { error: 'E-mail e/ou senha incorretos.', status: 404, data };
    }

    if (!bcrypt.compareSync(data.password, user.password)) {
      return { error: 'E-mail e/ou senha incorretos.', status: 401, data };
    }

    const token = jwt.sign({ id: user.id, name: user.name }, process.env.SECRET_KEY, {
      expiresIn: 86400
    });

    return { token };

  }
}

module.exports = new AuthenticateService();
