const express = require('express');
const router = express.Router();
const db = require('../services/db');
const auth = require('../services/authMiddleware.js').auth;

router.get('/product/count', auth(['staff', 'admin']), (req, res) => {
  const query = `SELECT COUNT(*) AS total FROM Products`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ msg: 'Server error' });
    res.json({ total: results[0].total });
  });
});

router.get('/product/status-count', auth(['staff', 'admin']), (req, res) => {
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

router.get('/product/approval-count', auth(['staff', 'admin']), (req, res) => {
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

router.get('/users/role-count', auth(['admin']), (req, res) => {
  const query = `
    SELECT 
      SUM(CASE WHEN role = 'staff' THEN 1 ELSE 0 END) AS staff,
      SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) AS admin
    FROM Users
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ msg: 'Server error' });
    res.json(results[0]);
  });
});

router.get('/product/update-trend', auth(['staff', 'admin']), (req, res) => {
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

module.exports = router;