const gameModel = require('../models/game.model');

class GameService {
  async create(data) {
    return await gameModel.create(data);
  }

  async findAll() {
    return await gameModel.findAll();
  }

  async findOne(id) {
    const game = await gameModel.findOne(id);

    if (!game) {
      return { error: 'Jogo não encontrado.', status: 404 };
    }

    return game;
  }
}


module.exports = new GameService();
