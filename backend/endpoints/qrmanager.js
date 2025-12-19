const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const db = require('../services/db.js');
const auth = require('../services/authMiddleware.js').auth;

// Admin tạo mã QR cho sản phẩm
router.put('/products/:id/qr', auth(['admin', 'staff']), (req, res) => {
  const productId = req.params.id;
  const qrUrl = `http://localhost:3000/product/${productId}`;
  const filePath = `uploads/qr_${productId}.png`;

  QRCode.toFile(filePath, qrUrl, (err) => {
    if (err) {
      console.error('QR generation failed:', err);
      return res.status(500).json({ msg: 'QR generation failed' });
    }

    db.query('UPDATE Products SET QRURL = ? WHERE ProductID = ?', [qrUrl, productId], (err) => {
      if (err) {
        console.error('DB update error:', err);
        return res.status(500).json({ msg: 'Database update failed' });
      }

      res.json({ msg: 'QR code generated successfully', qr_url: qrUrl });
    });
  });
});

// Lấy QR (tạo ảnh base64 on-the-fly)
router.get('/qr/:id', (req, res) => {
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

module.exports = router;