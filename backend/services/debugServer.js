const express = require('express');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

// 1. Cấu hình lấy biến môi trường từ file .env gốc
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
// Đổi cổng thành 5051 theo ý bạn (tránh cổng 5000 của Mac và 5001 của Server chính)
const PORT = 5051; 

// 2. Kết nối Database
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

db.connect(err => {
  if (err) console.error('❌ Lỗi kết nối DB Debug:', err.message);
  else console.log('✅ Debug Server đã kết nối Database!');
});

// 3. API soi Index
app.get('/check-index/:tableName', (req, res) => {
    const table = req.params.tableName;
    
    db.query(`SHOW INDEX FROM ${table}`, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const indexList = results.map(idx => ({
            INDEX_NAME: idx.Key_name,
            COLUMN: idx.Column_name,
            IS_UNIQUE: idx.Non_unique == 0 ? "YES" : "NO",
            TYPE: idx.Index_type
        }));

        res.json({
            table: table,
            total_indexes: indexList.length,
            indexes: indexList
        });
    });
});

app.listen(PORT, () => {
    console.log(`🔎 Debug Server đang chạy tại: http://localhost:${PORT}`);
});