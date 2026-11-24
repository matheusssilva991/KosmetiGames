const pool = require("../database/connection");

async function findOne(id) {
    const [rows] = await pool.execute(
        "SELECT id, name, email, address, phone_number FROM user WHERE id = ?",
        [id],
    );
    return rows[0];
}

async function findCredentials(email) {
    const [rows] = await pool.execute(
        "SELECT id, name, password FROM user WHERE email = ?",
        [email],
    );
    return rows[0];
}

async function create({ name, email, password, address, phone_number }) {
    await pool.execute(
        "INSERT INTO user (name, email, password, address, phone_number) VALUES (?, ?, ?, ?, ?)",
        [name, email, password, address, phone_number],
    );
}

async function update(id, { name, email, address, phone_number, password }) {
    const fields = [name, email, address, phone_number];
    const passwordAssignment = password ? ", password = ?" : "";
    if (password) {
        fields.push(password);
    }
    const [result] = await pool.execute(
        `UPDATE user SET name = ?, email = ?, address = ?, phone_number = ?${passwordAssignment} WHERE id = ?`,
        [...fields, id],
    );
    return result.affectedRows;
}

module.exports = { findOne, findCredentials, create, update };
