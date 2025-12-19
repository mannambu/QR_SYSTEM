const router = require('express').Router();
const db = require('../services/db');
const auth = require('../services/authMiddleware.js').auth;
const upload = require('../services/authMiddleware.js').upload;
const sendAdminEmail = require('../services/mailer').sendAdminEmail;

// ==================== FARMS ====================

// Get farm list
router.get('/farms', auth(['admin','staff']), (req, res) => {
  const sql = 'SELECT * FROM Farms';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching farms:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
    res.json(results);
  });
});

// Create farm (admin only)
router.post('/farms', auth('admin'), (req, res) => {
  const { FarmName, Address, Owner, Contact } = req.body;
  if (!FarmName) {
    return res.status(400).json({ msg: 'FarmName is required' });
  }
  const sql = 'INSERT INTO Farms SET ?';
  const farmObj = { FarmName, Address, Owner, Contact };
  db.query(sql, farmObj, (err, result) => {
    if (err) {
      console.error('Error creating farm:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
    res.json({ msg: 'Farm created successfully', farmId: result.insertId });
  });
});

// ==================== CERTIFICATIONS ====================

// Get certifications list
router.get('/certifications', auth(['admin','staff']), (req, res) => {
  const sql = 'SELECT * FROM Certifications';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching certifications:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
    res.json(results);
  });
});

// Create certification (admin only)
router.post('/certifications', auth('admin'), (req, res) => {
  const { CertName, CertDescription, Issuer } = req.body;
  if (!CertName) {
    return res.status(400).json({ msg: 'CertName is required' });
  }
  const sql = 'INSERT INTO Certifications SET ?';
  const certObj = { CertName, CertDescription, Issuer };
  db.query(sql, certObj, (err, result) => {
    if (err) {
      console.error('Error creating certification:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
    res.json({ msg: 'Certification created successfully', certId: result.insertId });
  });
});

module.exports = router;