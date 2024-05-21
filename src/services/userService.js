const userModel = require('../models/userModel');

class UserService {
  async create(data) {
    // Check if the password has at least 6 characters
    if (data.password?.length < 6) {
      return { error: {password: 'Password must have at least 6 characters'}, status: 400 };
    }

    if (await userModel.findOneByEmail(data.email)) {
      return { error: {email: 'Email already in use'}, status: 400 };
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
      return { error: 'User not found', status: 404 };
    }

    delete user.password;
    return user;
  }
}


module.exports = new UserService();
