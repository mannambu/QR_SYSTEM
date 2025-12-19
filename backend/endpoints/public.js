const express = require('express');
const db = require('../services/db.js');
const router = express.Router();


// Xem chi tiết sản phẩm công khai (Chỉ hiện hàng instock)
router.get('/products/public/:id', (req, res) => {
  // const sql = `
  //   SELECT p.*, f.FarmID, f.FarmName, f.Location, f.Certification
  //   FROM Product p
  //   LEFT JOIN Farm f ON p.FarmID = f.FarmID
  //   WHERE p.ProductID = ? AND p.Status = ?
  // `;
  const sql =`
  SELECT  
        p.ProductID, p.ProductName, p.ProdDescription AS Description, p.Price, p.Status, p.HarvestDate,
        f.FarmName, f.Address AS Location, 
        c.CertName, c.Issuer,
        pc.IssueDate
  FROM Products p
  LEFT JOIN Farms f ON p.FarmID = f.FarmID
  LEFT JOIN Product_Certifications pc ON p.ProductID = pc.ProductID
  LEFT JOIN Certifications c ON pc.CertID = c.CertID
  WHERE p.ProductID = ? AND p.Status = ?;
  `

  db.query(sql, [req.params.id, 'instock'], (err, results) => {
    if (err || !results.length) {
      return res.status(404).json({ msg: 'Sản phẩm không tồn tại hoặc đã hết hàng' , error: err});
    }
    res.json(results[0]);
  });
});

// API ngu hơn: lấy tất cả sản phẩm rồi lọc bằng JS
router.get('/products/public-slow/:id', (req, res) => {
  // const sql = `
  //   SELECT p.*, f.*, u.*
  //   FROM Product p
  //   LEFT JOIN Farm f ON p.FarmID = f.FarmID
  //   LEFT JOIN User u ON u.UserID = p.InsertedBy
  // `;

    const sql = `
  SELECT 
      p.*, f.*, u.*, c.*, pc.*
  FROM Products p
  LEFT JOIN Farms f ON p.FarmID = f.FarmID
  LEFT JOIN Users u ON u.UserID = p.CreatedBy
  LEFT JOIN Product_Certifications pc ON p.ProductID = pc.ProductID
  LEFT JOIN Certifications c ON pc.CertID = c.CertID;
  `;

  db.query(sql, (err, results) => {
    if (err || !results.length) {
      return res.status(404).json({ msg: err || 'No products found' });
    }
    //res.json(results);
    // Lọc bằng JS thay vì SQL (ngu hơn, chậm hơn)
    const product = results.find(r => r.ProductID == req.params.id && r.Status === 'instock');
    if (!product) {
      return res.status(404).json({ msg: 'Out of stock' });
    }
    
    res.json(product);
  });
});

module.exports = router;