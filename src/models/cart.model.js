const connection = require('../database/connection');

class CartModel {
  async create(data) {
    const { status, user_id } = data;
    const sql = `INSERT INTO \`order\` (status, user_id) VALUES ('${status}', '${user_id}')`;
    try {
      await connection.execute(sql);
      return { status, user_id };
    } catch (error) {
      return error;
    }
  }

  async checkout(id) {
    const sql = `UPDATE \`order\` SET status = 'closed' WHERE id = ${id}`;
    try {
      return await connection.execute(sql);
    } catch (error) {
      return error;
    }
  }

  async createOrderItem(data) {
    const { order_id, product_id, quantity } = data;
    const sql = `INSERT INTO order_item (order_id, product_id, quantity) VALUES
    ('${order_id}', '${product_id}', '${quantity}')`;
    try {
      await connection.execute(sql);
      return { order_id, product_id, quantity };
    } catch (error) {
      return error;
    }
  }

  async findAll() {
    const sql = 'SELECT * FROM \`order\`';
    try {
      const [orders] = await connection.execute(sql);
      return orders;
    } catch (error) {
      return error;
    }
  }

  async findOne(id) {
    const sql = `SELECT * FROM \`order\` WHERE id = ${id}`;
    try {
      const [order] = await connection.execute(sql);
      return order[0];
    } catch (error) {
      return error;
    }
  }

  async findActiveOrder(user_id) {
    const sql = `SELECT * FROM \`order\` WHERE (status = 'open' AND user_id = ${user_id})`;
    try {
      const [order] = await connection.execute(sql);
      return order[0];
    } catch (error) {
      return error;
    }
  }

  async findInativeOrders(user_id) {
    const sql = `SELECT * FROM \`order\` WHERE (status = 'closed' AND user_id = ${user_id})`;
    try {
      const [orders] = await connection.execute(sql);
      return orders;
    } catch (error) {
      return error;
    }
  }

  async findPurchasedProducts(user_id) {
    const sql = `SELECT product.id, product.name, description, price, stock, image_path, category.name as
    category_name, game.name as game_name, game.enterprise as game_enterprise, order.user_id, category_id,
    quantity, order.id as order_id, order_item.id as order_item_id FROM \`order\`
    INNER JOIN order_item on order_item.order_id = order.id
    INNER JOIN product on product.id = order_item.product_id
    INNER JOIN category on category.id = product.category_id
    INNER JOIN game on game.id = product.game_id
    WHERE (order.status = 'closed' AND order.user_id = ${user_id})`;
    try {
      const [products] = await connection.execute(sql);
      return products;
    } catch (error) {
      return error;
    }
  }

  async findProductsInOrder(order_id) {
    const sql = `SELECT product.id, product.name, description, price, stock, image_path, category.name as
    category_name, game.name as game_name, game.enterprise as game_enterprise, order.user_id, category_id,
    quantity, order.id as order_id, order_item.id as order_item_id FROM \`order\`
    INNER JOIN order_item on order_item.order_id = order.id
    INNER JOIN product on product.id = order_item.product_id
    INNER JOIN category on category.id = product.category_id
    INNER JOIN game on game.id = product.game_id
    WHERE order_item.order_id = ${order_id}`;
    try {
      const [products] = await connection.execute(sql);
      return products;
    } catch (error) {
      return error;
    }
  }

  async updateOrderItem(id, data) {
    const { quantity } = data;
    const sql = `UPDATE order_item SET quantity = '${quantity}' WHERE id = ${id}`;
    try {
      return await connection.execute(sql);
    } catch (error) {
      return error;
    }
  }

  async removeProduct(order_id, product_id) {
    const sql = `DELETE FROM order_item WHERE (order_id = ${order_id} AND product_id = ${product_id})`;
    try {
      return await connection.execute(sql);
    } catch (error) {
      return error;
    }
  }
}


module.exports = new CartModel();
