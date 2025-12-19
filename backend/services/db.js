const mysql=require('mysql2');
const dotenv=require('dotenv');
const path=require('path');
dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: null,
  connectionLimit: 10 
});

//db.connect(err => { if (err) throw ("Can't connected SQL"); console.log('MySQL Connected'); });
// Kiểm tra kết nối ban đầu
db.getConnection((err, connection) => {
  if (err) {
    console.error('MySQL connection failed:', err);
  } else {
    console.log('MySQL Connected (pool ready)');
    connection.release(); // trả connection về pool
  }
});

module.exports = db;