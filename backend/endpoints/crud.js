const router = require('express').Router();
const db = require('../services/db');
const auth = require('../services/authMiddleware.js').auth;
const upload = require('../services/authMiddleware.js').upload;
const sendAdminEmail = require('../services/mailer').sendAdminEmail;
const approveRequest = require('./approval').approveRequest;

// ==========================================
// CREATE Product (staff/admin)
// ==========================================
router.post('/products', auth(['staff','admin']), upload.single('media'), (req,res) => {
    try {
        const product = req.body;
        
        if (!product.name || !product.price || !product.farmId) {
            return res.status(400).json({ msg:'Missing required fields (name, price, farmId)' });
        }

        // Kiểm tra Farm tồn tại
        db.query('SELECT FarmID FROM Farms WHERE FarmID=?', [product.farmId], (err, farmRows) => {
            if (err) {
                // console.error("DB Check Farm Error:", err);
                return res.status(500).json({ msg: 'DB Error checking Farm' });
            }
            if (!farmRows.length) return res.status(400).json({ msg: 'Farm not found' });
            
            processCreateProduct();
        });

        function processCreateProduct() {
            const image = req.file ? `/uploads/${req.file.filename}` : '';

            // Dữ liệu chuẩn bị
            const requestData = {
                name: product.name,
                price: product.price, 
                description: product.description, 
                plantDate: product.plantDate, 
                harvestDate: product.harvestDate, 
                status: product.status || 'instock',
                farmId: product.farmId, 
                certId: product.certId, 
                image: image
            };

            if (req.user.role === 'admin') {
                // ADMIN: Insert trực tiếp
                const prodObj = {
                    FarmID: product.farmId,
                    ProductName: product.name,
                    ProdDescription: product.description || null,
                    Price: product.price,
                    PlantDate: product.plantDate || null,
                    HarvestDate: product.harvestDate || null,
                    QRUrl: image || null,
                    Status: product.status || 'instock',
                    CreatedBy: req.user.id
                };

                db.query('INSERT INTO Products SET ?', [prodObj], (err, result) => {
                    if (err) {
                        // console.error("Insert Product Error:", err);
                        return res.status(500).json({ msg:'Server error inserting product' });
                    }
                    
                    const productId = result.insertId;
                    // Helper xử lý ảnh/cert
                    approveRequest(productId, req.user.id, 'create', requestData);

                    // Log auto-approved
                    const approvalLog = {
                        ProductID: productId,
                        RequestType: 'create', // Sửa lại thành RequestType cho khớp SQL
                        RequestedBy: req.user.id,
                        ReviewedBy: req.user.id,
                        Status: 'approved',
                        Notes: 'Created directly by admin',
                        Data: JSON.stringify(requestData)
                    };

                    db.query('INSERT INTO ApprovalRequests SET ?', [approvalLog], (err) => {
                        if (err) console.error("Log Approval Error:", err);
                    });

                    res.json({ msg:'Product created successfully', productId });
                });

            } else {
                // STAFF: Gửi yêu cầu
                const approval = {
                    ProductID: null,
                    RequestType: 'create', // Khớp SQL
                    RequestedBy: req.user.id,
                    Status: 'pending',
                    Data: JSON.stringify(requestData)
                };
                
                db.query('INSERT INTO ApprovalRequests SET ?', approval, (err) => {
                    if (err) {
                        // console.error("Staff Create Request Error:", err);
                        return res.status(500).json({ msg: 'Server error logging request' });
                    }
                    sendAdminEmail(`New product creation request by Staff ID ${req.user.id}.`);
                    res.json({ msg:'Product request submitted, pending approval' });
                });
            }
        }
    } catch (error) {
        console.error("Critical Create Error:", error);
        res.status(500).json({ msg: 'Server crashed processing request' });
    }
});

// ==========================================
// UPDATE Product (Fix lỗi FarmID rỗng)
// ==========================================
router.put('/products/:id', auth(['staff', 'admin']), upload.array('media', 5), (req, res) => {
    try {
        const productId = req.params.id;
        const updates = req.body;

        const newImages = req.files && req.files.length > 0
            ? req.files.map(f => `/uploads/${f.filename}`)
            : [];
        
        const buildUpdateObject = (source, mapping) => {
            const target = {};
            for (const [key, value] of Object.entries(source)) {
                if (value !== undefined && value !== 'undefined' && value !== null) {
                    const dbKey = mapping ? mapping[key] : key;
                    if (dbKey) target[dbKey] = value;
                }
            }
            return target;
        };

        // ================= ADMIN LOGIC =================
        if (req.user.role === 'admin') {
            const dbMapping = {
                name: 'ProductName',
                price: 'Price',
                description: 'ProdDescription',
                plantDate: 'PlantDate',
                harvestDate: 'HarvestDate',
                status: 'Status',
                farmId: 'FarmID'
            };

            const dbUpdateObj = buildUpdateObject(updates, dbMapping);

            // --- FIX QUAN TRỌNG: Xóa field nếu là chuỗi rỗng (tránh lỗi MySQL) ---
            if (dbUpdateObj.FarmID === '') delete dbUpdateObj.FarmID;
            if (dbUpdateObj.Price === '') delete dbUpdateObj.Price;

            if (newImages.length > 0) {
                dbUpdateObj.QRUrl = newImages[0];
            }

            if (Object.keys(dbUpdateObj).length === 0) {
                return res.status(400).json({ msg: 'No fields provided to update' });
            }

            db.query('UPDATE Products SET ? WHERE ProductID = ?', [dbUpdateObj, productId], (err, result) => {
                if (err) {
                    console.error("❌ SQL ERROR:", err); // Log lỗi để debug
                    return res.status(500).json({ msg: 'Server error updating product' });
                }

                if (newImages.length > 0) {
                     const imageValues = newImages.map(img => [productId, img, 'image']);
                     db.query('INSERT INTO ProductImages (ProductID, ImageUrl, MediaType) VALUES ?', [imageValues], (err) => {
                         if (err) console.error("Error saving images:", err);
                     });
                }
                
                res.json({ msg: 'Product updated successfully' });
            });

        } 
        // ================= STAFF LOGIC =================
        else {
            const requestData = { ...updates };
            if (newImages.length > 0) requestData.images = newImages;
            else delete requestData.media;

            Object.keys(requestData).forEach(key => {
                if (requestData[key] === undefined) delete requestData[key];
            });

            const approval = {
                ProductID: productId,
                RequestType: 'update',
                RequestedBy: req.user.id,
                Status: 'pending',
                Data: JSON.stringify(requestData),
            };

            db.query('INSERT INTO ApprovalRequests SET ?', approval, (err) => {
                if (err) return res.status(500).json({ msg: 'Server error' });
                sendAdminEmail(`New update request for Product ID ${productId}.`);
                res.json({ msg: 'Update request pending approval' });
            });
        }
    } catch (error) {
        console.error("Critical Error:", error);
        res.status(500).json({ msg: 'Server crashed' });
    }
});


// ==========================================
// DELETE Product
// ==========================================
router.delete('/products/:id', auth(['staff', 'admin']), (req, res) => {
  try {
      const productId = req.params.id;

      if (req.user.role === 'admin') {
        db.query('DELETE FROM Products WHERE ProductID = ?', [productId], (err) => {
          if (err) {
            //   console.error("Admin Delete DB Error:", err);
              return res.status(500).json({ msg: 'Server error deleting product' });
          }
          res.json({ msg: 'Deleted successfully' });
        });
      } else {
        const approval = {
          ProductID: productId,
          RequestType: 'delete', // Khớp SQL
          RequestedBy: req.user.id,
          Status: 'pending',
          Data: JSON.stringify({ ProductID: productId }),
        };
        
        db.query('INSERT INTO ApprovalRequests SET ?', approval, (err) => {
          if (err) {
            //   console.error("Staff Delete Request DB Error:", err);
              return res.status(500).json({ msg: 'Server error' });
          }
          sendAdminEmail(`Delete request for Product ID ${productId} by Staff ID ${req.user.id}.`);
          res.json({ msg: 'Delete request pending approval' });
        });
      }
  } catch (error) {
      console.error("Critical Delete Error:", error);
      res.status(500).json({ msg: 'Server crashed processing delete' });
  }
});

module.exports = router;