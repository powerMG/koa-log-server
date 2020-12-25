const mysql = require("mysql");
const MYSQL_CONFIG = require("./mysqlConfig");

const pool = mysql.createPool(MYSQL_CONFIG);

const query = (sql, val) => {
  return new Promise((resolve, reject) => {
    pool.getConnection(function (err, connection) {
      if (err) reject(err);
      else {
        connection.query(sql, val, (err, fields) => {
          if (err) reject(err);
          else resolve(fields);
          connection.release();
        });
      }
    });
  });
};
module.exports = { query };
