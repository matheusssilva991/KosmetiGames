const pool = require("../database/connection");

async function lockBuyer(connection, userId) {
    const [rows] = await connection.execute(
        "SELECT id FROM user WHERE id = ? FOR UPDATE",
        [userId],
    );
    return rows.length > 0;
}

async function findOpenOrder(connection, userId) {
    const [rows] = await connection.execute(
        "SELECT id FROM `order` WHERE open_user_id = ?",
        [userId],
    );
    return rows[0];
}

async function findOrder(connection, userId, orderId) {
    const [rows] = await connection.execute(
        "SELECT id, status FROM `order` WHERE id = ? AND user_id = ? FOR UPDATE",
        [orderId, userId],
    );
    return rows[0];
}

async function createOrder(connection, userId) {
    const [result] = await connection.execute(
        "INSERT INTO `order` (user_id, status) VALUES (?, 'open')",
        [userId],
    );
    return result.insertId;
}

async function findCart(userId) {
    const [rows] = await pool.execute(
        `SELECT o.id AS order_id, i.id AS item_id, i.quantity, p.id, p.name, p.description,
            p.price, p.stock, p.image_path, p.archived_at, c.name AS category_name, g.name AS game_name
     FROM \`order\` AS o
     LEFT JOIN order_item AS i ON i.order_id = o.id
     LEFT JOIN product AS p ON p.id = i.product_id
     LEFT JOIN category AS c ON c.id = p.category_id
     LEFT JOIN game AS g ON g.id = p.game_id
     WHERE o.open_user_id = ? ORDER BY i.id`,
        [userId],
    );
    return {
        id: rows[0]?.order_id,
        items: rows.filter((row) => row.item_id !== null),
    };
}

async function findQuantity(connection, orderId, productId) {
    const [rows] = await connection.execute(
        "SELECT quantity FROM order_item WHERE order_id = ? AND product_id = ?",
        [orderId, productId],
    );
    return rows[0]?.quantity ?? 0;
}

async function saveItem(
    connection,
    orderId,
    productId,
    quantity,
    existingQuantity,
) {
    if (existingQuantity) {
        await connection.execute(
            "UPDATE order_item SET quantity = ? WHERE order_id = ? AND product_id = ?",
            [quantity, orderId, productId],
        );
    } else {
        await connection.execute(
            "INSERT INTO order_item (order_id, product_id, quantity) VALUES (?, ?, ?)",
            [orderId, productId, quantity],
        );
    }
}

async function removeItem(connection, orderId, itemId) {
    const [result] = await connection.execute(
        "DELETE FROM order_item WHERE order_id = ? AND id = ?",
        [orderId, itemId],
    );
    return result.affectedRows;
}

async function findItems(connection, orderId) {
    const [rows] = await connection.execute(
        "SELECT id, product_id, quantity FROM order_item WHERE order_id = ? ORDER BY product_id",
        [orderId],
    );
    return rows;
}

async function recordPurchase(connection, item, product) {
    await connection.execute(
        "UPDATE product SET stock = stock - ?, version = version + 1 WHERE id = ?",
        [item.quantity, product.id],
    );
    await connection.execute(
        `UPDATE order_item SET snapshot_name = ?, snapshot_description = ?, snapshot_price = ?,
                           snapshot_image_path = ?, snapshot_game = ?, snapshot_category = ?
     WHERE id = ?`,
        [
            product.name,
            product.description,
            product.price,
            product.image_path,
            product.game_name,
            product.category_name,
            item.id,
        ],
    );
}

async function closeOrder(connection, orderId) {
    await connection.execute(
        "UPDATE `order` SET status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE id = ?",
        [orderId],
    );
}

async function findPurchases(userId) {
    const [rows] = await pool.execute(
        `SELECT o.id AS order_id, o.closed_at, i.quantity, i.snapshot_name AS name,
            i.snapshot_description AS description, i.snapshot_price AS price,
            i.snapshot_image_path AS image_path, i.snapshot_game AS game_name,
            i.snapshot_category AS category_name
     FROM \`order\` AS o
     INNER JOIN order_item AS i ON i.order_id = o.id
     WHERE o.user_id = ? AND o.status = 'closed'
     ORDER BY o.id DESC, i.id`,
        [userId],
    );
    return rows;
}

module.exports = {
    lockBuyer,
    findOpenOrder,
    findOrder,
    createOrder,
    findCart,
    findQuantity,
    saveItem,
    removeItem,
    findItems,
    recordPurchase,
    closeOrder,
    findPurchases,
};
