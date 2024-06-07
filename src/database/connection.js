const config = require('./config');
const mysql = require('mysql2/promise');

async function query(sql, args) {
  const db = config.db;

  const connection_string = `mysql://${db.user}:${db.password}@${db.host}:${db.port}`;
  let connection = null;

  // Create connection
  try {
    connection = await mysql.createConnection(connection_string + '/' + db.database);
  } catch (error) {
    connection = await mysql.createConnection(connection_string);
    connection.query(`CREATE DATABASE IF NOT EXISTS ${db.database};`)
    connection.query(`USE ${db.database};`)
  }

  // Execute query
  try {
    const [results, ] = await connection.execute(sql, args);
    return results;
  } catch (error) {
    console.error('Error executing query', error);
    throw error;
  }
}

module.exports = { query }
