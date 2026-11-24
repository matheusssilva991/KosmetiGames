const pool = require("../database/connection");

async function findAll() {
    const [rows] = await pool.execute(
        "SELECT id, name FROM category ORDER BY id",
    );
    return rows;
}

module.exports = { findAll };
