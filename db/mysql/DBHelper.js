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
          else {
            var dataString = JSON.stringify(fields);
            var data = JSON.parse(dataString);
            resolve(data);
          }
          connection.release();
        });
      }
    });
  });
};
const queryFirst = (sql, val) => {
  return new Promise((resolve, reject) => {
    console.log("开始连接数据库");
    pool.getConnection(function (err, connection) {
      console.log("连接异常", err);
      if (err) reject(err);
      else {
        connection.query(sql, val, (err, fields) => {
          if (err) reject(err);
          else {
            var dataString = JSON.stringify(fields);
            var data = JSON.parse(dataString);
            resolve((data && data[0]) || null);
          }
          connection.release();
        });
      }
    });
  });
};
module.exports = { query, queryFirst };
