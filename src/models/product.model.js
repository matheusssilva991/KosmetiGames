const pool = require("../database/connection");

const selectProduct = `
  SELECT p.id, p.name, p.description, p.price, p.stock, p.image_path, p.user_id,
         p.game_id, p.category_id, p.version, g.enterprise AS game_enterprise,
         g.name AS game_name, c.name AS category_name
  FROM product AS p
  INNER JOIN game AS g ON g.id = p.game_id
  INNER JOIN category AS c ON c.id = p.category_id
  WHERE p.archived_at IS NULL
`;

async function findAll({ ownerId, gameId, categoryId, search } = {}) {
    const conditions = [];
    const params = [];
    for (const [predicate, value] of [
        ["p.user_id = ?", ownerId],
        ["p.game_id = ?", gameId],
        ["p.category_id = ?", categoryId],
        ["LOCATE(LOWER(?), LOWER(p.name)) > 0", search],
    ]) {
        if (value != null && value !== "") {
            conditions.push(predicate);
            params.push(value);
        }
    }
    const where = conditions.length ? " AND " + conditions.join(" AND ") : "";
    const [rows] = await pool.execute(
        selectProduct + where + " ORDER BY p.id DESC",
        params,
    );
    return rows;
}

async function findOne(id) {
    const [rows] = await pool.execute(selectProduct + " AND p.id = ?", [id]);
    return rows[0];
}

async function create(data) {
    const [result] = await pool.execute(
        `INSERT INTO product (name, description, price, stock, image_path, user_id, category_id, game_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.name,
            data.description,
            data.price,
            data.stock,
            data.image_path,
            data.user_id,
            data.category_id,
            data.game_id,
        ],
    );
    return result.insertId;
}

async function update(connection, productId, ownerId, version, data) {
    const [result] = await connection.execute(
        `UPDATE product
     SET name = ?, description = ?, price = ?, stock = ?, image_path = ?, category_id = ?,
         game_id = ?, version = version + 1
     WHERE id = ? AND user_id = ? AND version = ? AND archived_at IS NULL`,
        [
            data.name,
            data.description,
            data.price,
            data.stock,
            data.image_path,
            data.category_id,
            data.game_id,
            productId,
            ownerId,
            version,
        ],
    );
    return result.affectedRows;
}

async function archive(connection, productId, ownerId) {
    await connection.execute(
        "UPDATE product SET archived_at = CURRENT_TIMESTAMP, image_path = NULL WHERE id = ? AND user_id = ?",
        [productId, ownerId],
    );
}

async function lock(connection, id) {
    const [rows] = await connection.execute(
        `SELECT p.id, p.user_id, p.name, p.description, p.price, p.image_path, p.stock, p.archived_at,
            (SELECT name FROM game WHERE id = p.game_id) AS game_name,
            (SELECT name FROM category WHERE id = p.category_id) AS category_name
     FROM product AS p WHERE p.id = ? FOR UPDATE`,
        [id],
    );
    return rows[0];
}

async function imageIsReferenced(imagePath) {
    const [rows] = await pool.execute(
        `SELECT 1 FROM product WHERE image_path = ?
     UNION ALL SELECT 1 FROM order_item WHERE snapshot_image_path = ? LIMIT 1`,
        [imagePath, imagePath],
    );
    return rows.length > 0;
}

module.exports = {
    findAll,
    findOne,
    create,
    update,
    archive,
    lock,
    imageIsReferenced,
};
