const userModel = require('../models/userModel');

class UserService {
  async create(data) {
    // Check if the name is empty
    if (!data.name) {
      return { error: 'Name is required', status: 400 };
    }

    // Check if the email is empty
    if (!data.email) {
      return { error: 'Email is required', status: 400 };
    }

    // Check if the password is empty
    if (!data.password) {
      return { error: 'Password is required', status: 400 };
    }

    // Check if the password has at least 6 characters
    if (data.password.length < 6) {
      return { error: 'Password must have at least 6 characters', status: 400 };
    }

    // Check if the email is already in use
    const emailAreadyExists = await this.emailAreadyExists(data.email);
    if (emailAreadyExists.error) {
      return emailAreadyExists;
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

  async emailAreadyExists(email) {
    const user = await userModel.getUserByEmail(email);

    if (user) {
      return { error: 'Email already in use', status: 400 };
    }

    return { error: false, status: 200 };
  }
}


module.exports = new UserService();
