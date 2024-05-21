const bcrypt = require('bcrypt');

class AuthenticateService {
  async login(data) {
    if (!data.email) {
      return { error: 'Email is required', status: 400 };
    }

    if (!data.password) {
      return { error: 'Password is required', status: 400 };
    }

    const user = await userModel.findOneByEmail(data.email);

    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    if (!bcrypt.compareSync(data.password, user.password)) {
      return { error: 'Invalid password', status: 401 };
    }

    const token = jwt.sign({ id: user.id, name: user.name }, process.env.SECRET, {
      expiresIn: 86400
    });

    return { token };

  }
}

module.exports = new AuthenticateService();
