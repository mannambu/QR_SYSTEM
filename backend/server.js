const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { backupToCloudinary, recoverFromCloudinary } = require('./services/backupCloudinary.js');
const db = require('./services/db.js');
const index = require('./services/Indexes.js');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use('/.well-known', (req, res) => res.status(204).end());
app.use('/uploads', express.static('uploads'));

/////////////////////////////////////AUTHORIZATION & LOGIN//////////////////////////////

const auth = require('./services/authMiddleware.js').auth;
const upload = require('./services/authMiddleware.js').upload;
const loginRoutes = require('./endpoints/login.js');
const passwordRoutes = require('./endpoints/password.js');

app.set('trust proxy', 1);
app.use('/api', loginRoutes);
app.use('/api', passwordRoutes);

//////////////////////////////////////PRODUCT MANAGEMENT//////////////////////////////

// Public API
const publicRoutes = require('./endpoints/public.js');
app.use('/api', publicRoutes);

// ==========================================
// NHÓM 2: PRODUCT MANAGEMENT (Staff/Admin)
// ==========================================

// 1. Lấy danh sách Kho hàng (Inventory)
app.get('/api/inventory', auth(['staff', 'admin']), (req, res) => {
  let query = 'SELECT * FROM Products';
  const params = [];

  // Logic cũ: Staff chỉ thấy bài mình (đang comment lại theo yêu cầu chung)
  // if (req.user.role === 'staff') {
  //   query += ' WHERE CreatedBy = ?'; // Lưu ý: SQL là CreatedBy, không phải insertedBy
  //   params.push(req.user.id);
  // }

  query += ' ORDER BY ProductID DESC';
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Inventory Error:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
    res.json(results);
  });
});

// 2. Lấy chi tiết 1 sản phẩm
app.get('/api/products/:id', auth(['staff', 'admin']), (req, res) => {
  let query = 'SELECT * FROM Products WHERE ProductID = ?';
  const params = [req.params.id];

  db.query(query, params, (err, results) => {
    if (err || !results.length) return res.status(404).json({ msg: 'Product not found' });
    res.json(results[0]);
  });
});

// ==========================================
// NHÓM 3: APPROVAL FLOW (Quy trình duyệt)
// ==========================================

// 1. Xem lịch sử yêu cầu (Request List)
// QUAN TRỌNG: Đã sửa tên cột SQL để khớp với Frontend
app.get('/api/my-requests', auth(['staff', 'admin']), (req, res) => {
  let query = `
    SELECT 
      a.RequestID as ApprovalID,       -- Sửa ReqID -> RequestID
      a.RequestType as ReqType,        -- Sửa ReqType -> RequestType
      a.Status AS ApprovalStatus,
      a.Notes,
      a.CreatedAt,
      a.Data,
      u.UserName,
      p.Status AS ProductStatus,
      p.ProductID,
      COALESCE(
        p.ProductName,                                
        JSON_UNQUOTE(JSON_EXTRACT(a.Data, '$.name'))  
      ) AS ProductNameDisplay
    FROM ApprovalRequests a            -- Đảm bảo tên bảng đúng
    LEFT JOIN Users u ON a.RequestedBy = u.UserID
    LEFT JOIN Products p ON a.ProductID = p.ProductID
  `;
  
  const params = [];
  
  if (req.user.role === 'staff') {
    query += ' WHERE a.RequestedBy = ?';
    params.push(req.user.id);
  }

  query += ' ORDER BY a.CreatedAt DESC';

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("My Requests Error:", err); // Log lỗi chi tiết
      return res.status(500).json({ msg: 'Server error fetching requests' });
    }
    res.json(results);
  });
});

// 2. Lấy danh sách chờ duyệt (Pending Approvals - Admin)
app.get('/api/approvals/pending', auth(['admin']), (req, res) => {
  const sql = `
    SELECT 
      a.RequestID as ApprovalID,       -- Alias cho khớp Frontend Approvals.js
      a.RequestType,
      a.ProductID,
      a.RequestedBy,
      a.Status,
      a.Notes,
      a.CreatedAt,
      a.Data,
      u.UserName as StaffName,
      COALESCE(
        p.ProductName, 
        JSON_UNQUOTE(JSON_EXTRACT(a.Data, '$.name'))
      ) AS ProductNameDisplay
    FROM ApprovalRequests a            -- Sửa tên bảng từ Approval -> ApprovalRequests
    LEFT JOIN Users u ON a.RequestedBy = u.UserID
    LEFT JOIN Products p ON a.ProductID = p.ProductID
    WHERE a.Status = "pending"
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Pending Approvals Error:", err);
      return res.status(500).json({ msg: 'Server error fetching pending' });
    }
    res.json(results);
  });
});

const crudRoutes = require('./endpoints/crud.js');
const farmnCertRoutes = require('./endpoints/farmnCert.js');
const approvalRoutes = require('./endpoints/approval.js').router; // Import route duyệt

app.use('/api', crudRoutes);
app.use('/api', farmnCertRoutes);
app.use('/api', approvalRoutes); // Đăng ký route duyệt

// ADMIN BACKUP & RECOVERY
app.post('/api/admin/backup', auth(['admin']), async (req, res) => {
  try {
    const result = await backupToCloudinary();
    res.json(result);
  } catch (error) {
    console.error("Backup Error:", error);
    res.status(500).json({ msg: 'Backup failed', error: error.message });
  }
});

app.post('/api/admin/recovery', auth(['admin']), async (req, res) => {
  try {
    await recoverFromCloudinary();
    res.json({ msg: 'Data recovered successfully' });
  } catch (error) {
    console.error("Recovery Error:", error);
    res.status(500).json({ msg: 'Recovery failed', error: error.message });
  }
});

//////////////////////////////////////////// QR CODE MANAGEMENT //////////////////////////////////

// Admin tạo QR và lưu
app.put('/api/products/:id/qr', auth(['admin','staff']), (req, res) => {
  const productId = req.params.id;
  const qrUrl = `http://localhost:3000/product/${productId}`; // Link frontend public
  
  // Update vào DB (URL text)
  db.query('UPDATE Products SET QRUrl = ? WHERE ProductID = ?', [qrUrl, productId], (err) => {
      if (err) {
        console.error('DB update error:', err);
        return res.status(500).json({ msg: 'Database update failed' });
      }
      res.json({ msg: 'QR code generated successfully', qr_url: qrUrl });
  });
});

// Lấy QR (tạo ảnh base64 on-the-fly)
app.get('/api/qr/:id', (req, res) => {
  const productId = req.params.id;

  db.query('SELECT QRUrl FROM Products WHERE ProductID = ?', [productId], (err, results) => {
    if (err || !results.length) {
      // Fallback: nếu chưa có, tạo tạm từ ID
      const tempUrl = `http://localhost:3000/product/${productId}`;
      QRCode.toDataURL(tempUrl, (err, url) => {
        if (err) return res.status(500).send('QR generation failed');
        res.send(url);
      });
      return;
    }

    const qrData = results[0].QRUrl;
    if (!qrData) {
       const tempUrl = `http://localhost:3000/product/${productId}`;
       QRCode.toDataURL(tempUrl, (err, url) => res.send(url));
    } else {
       // Nếu qrData là URL text, convert sang hình ảnh
       QRCode.toDataURL(qrData, (err, url) => {
        if (err) return res.status(500).send('QR conversion failed');
        res.send(url);
      });
    }
  });
});

// API Dashboard Counts
app.get('/api/product/count', auth(['staff','admin']), (req, res) => {
  const query = `SELECT COUNT(*) AS total FROM Products`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ msg: 'Server error' });
    res.json({ total: results[0].total });
  });
});

app.get('/api/product/status-count', auth(['staff','admin']), (req, res) => {
  const query = `
    SELECT 
      SUM(CASE WHEN Status = 'instock' THEN 1 ELSE 0 END) AS instock,
      SUM(CASE WHEN Status = 'outstock' THEN 1 ELSE 0 END) AS outstock
    FROM Products
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ msg: 'Server error' });
    res.json(results[0]);
  });
});

app.get('/api/product/approval-count', auth(['staff','admin']), (req, res) => {
  const query = `
    SELECT 
      SUM(CASE WHEN Status = 'approved' THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN Status = 'pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN Status = 'rejected' THEN 1 ELSE 0 END) AS rejected
    FROM ApprovalRequests
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ msg: 'Server error' });
    res.json(results[0]);
  });
});

app.get('/api/users/role-count', auth(['admin']), (req, res) => {
  const query = `
    SELECT 
      SUM(CASE WHEN Role = 'staff' THEN 1 ELSE 0 END) AS staff,
      SUM(CASE WHEN Role = 'admin' THEN 1 ELSE 0 END) AS admin
    FROM Users
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ msg: 'Server error' });
    res.json(results[0]);
  });
});

app.get('/api/product/update-trend', auth(['staff','admin']), (req, res) => {
  const query = `
    SELECT DATE(UpdatedAt) AS date, COUNT(*) AS count
    FROM Products
    GROUP BY DATE(UpdatedAt)
    ORDER BY date ASC
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ msg: 'Server error' });
    res.json(results);
  });
});

// ==========================================
// ADMIN: MANUAL INDEXING TRIGGER
// ==========================================
app.get('/api/index', auth(['admin']), async (req, res) => {
  try {
    // Gọi hàm runIndexing từ module Indexes
    // LƯU Ý: Bạn cần đảm bảo file services/Indexes.js đã export hàm runIndexing
    if (index && typeof index.runIndexing === 'function') {
      await index.runIndexing();
      res.json({ msg: '✅ Quá trình Indexing đã được kích hoạt thành công!' });
    } else {
      console.warn("⚠️ Module Indexes.js chưa export hàm runIndexing.");
      res.status(500).json({ msg: 'Server chưa cấu hình export cho Indexes service.' });
    }
  } catch (err) {
    console.error("❌ Indexing Error:", err);
    res.status(500).json({ msg: 'Lỗi khi chạy Indexing', error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
