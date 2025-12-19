const express = require('express');
const router = express.Router();
const db = require('../services/db');
const auth = require('../services/authMiddleware.js').auth;

// 1. Lấy danh sách Kho hàng (Inventory)
router.get('/inventory', auth(['staff', 'admin']), (req, res) => {
  let query = 'SELECT * FROM Products';
  const params = [];

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
router.get('/products/:id', auth(['staff', 'admin']), (req, res) => {
  let query = 'SELECT * FROM Products WHERE ProductID = ?';
  const params = [req.params.id];

  db.query(query, params, (err, results) => {
    if (err || !results.length) return res.status(404).json({ msg: 'Product not found' });
    res.json(results[0]);
  });
});


// 1. Xem lịch sử yêu cầu (Request List)
// QUAN TRỌNG: Đã sửa tên cột SQL để khớp với Frontend
router.get('/my-requests', auth(['staff', 'admin']), (req, res) => {
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
router.get('/approvals/pending', auth(['admin']), (req, res) => {
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

module.exports = router