const config = require('./config');
const mysql = require('mysql2/promise');
const fs = require('fs');

async function executeSchema() {
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

  // Execute schema
  try {
    const schema = fs.readFileSync('./src/database/schema.sql').toString();
    await connection.query(schema);
  } catch (error) {
    console.error('Error executing schema', error);
    throw error;
  }
}

module.exports = { executeSchema }
