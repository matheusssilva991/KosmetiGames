const cartModel = require('../models/cart.model');
const userModel = require('../models/user.model');
const productModel = require('../models/product.model');

class CartService {
  async create(data) {
    const user = await userModel.findOne(data.user_id);

    if (!user) {
      return { error: 'Usuário não encontrado.', status: 400 };
    }

    const order = await cartModel.findActiveOrder(data.user_id);

    if (order) {
      return { error: 'Carrinho já existe.', status: 400 };
    }

    await cartModel.create(data);

    return data;
  }

  async checkout(cart_id) {
    const order = await cartModel.findOne(cart_id);

    if (!order) {
      return { error: 'Carrinho não encontrado.', status: 404 };
    }
    
    await cartModel.checkout(order.id);

    return order;
  }

  async addProduct(data) {
    const user = await userModel.findOne(data.user_id);
    const product = await productModel.findOne(data.product_id);

    if (!user) {
      return { error: 'Usuário não encontrado.', status: 400 };
    }

    if (!product) {
      return { error: 'Produto não encontrado.', status: 400 };
    }

    let order = await cartModel.findActiveOrder(data.user_id);

    if (!order) {
      await cartModel.create({ status: 'open', user_id: data.user_id });
      order = await cartModel.findActiveOrder(data.user_id);
    }

    data.order_id = order.id;

    const productsInCart = await cartModel.findProductsInOrder(data.order_id);
    const productInCart = productsInCart.filter(product => product.id == data.product_id);

    let order_item_data = {};

    if (productInCart.length == 0) {
      if (!data.quantity) {
        data.quantity = 1;
      }

      if (product.stock < data.quantity) {
        return { error: 'Produto sem estoque.', status: 400 };
      }

      order_item_data = await cartModel.createOrderItem(data);
    }

    return {...data, ...order_item_data};
  }

  async findOne(id) {
    const cart = await cartModel.findOne(id);

    if (!cart) {
      return { error: 'Carrinho não encontrado.' , status: 404 };
    }

    return cart;
  }

  async findActiveOrder(user_id) {
    const order = await cartModel.findActiveOrder(user_id);

    if (!order) {
      return { error: 'Carrinho não encontrado.' , status: 404 };
    }

    return order;
  }

  async findInativeOrders(user_id) {
    const orders = await cartModel.findInativeOrders(user_id);

    return orders;
  }

  async findProductsInOrder(order_id) {
    const products = await cartModel.findProductsInOrder(order_id);

    return products;
  }

  async findPurchasedProducts(user_id) {
    const products = await cartModel.findPurchasedProducts(user_id);

    return products;
  }

  async removeProduct(order_id, product_id) {
    const result = await cartModel.removeProduct(order_id, product_id);

    if (!result) {
      return { error: 'Produto não encontrado.', status: 404 };
    }

    return result;
  }

}

module.exports = new CartService();
