const config = require('./config');
const mysql = require('mysql2/promise');

const connection = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  port: config.db.port
});

module.exports = connection;
