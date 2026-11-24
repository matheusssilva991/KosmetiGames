const pool = require("./connection");

async function transaction(work) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await work(connection);
        await connection.commit();
        return result;
    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error("Falha ao desfazer transação.", rollbackError.code);
        }
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = transaction;
