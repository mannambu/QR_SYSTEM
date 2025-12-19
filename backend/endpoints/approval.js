const express = require('express');
const router = express.Router();
const db = require('../services/db');
const auth = require('../services/authMiddleware.js').auth;

// ==========================================
// ADMIN APPROVAL HANDLER
// ==========================================

// 1. Lấy chi tiết 1 yêu cầu duyệt
router.get('/approval/:id', auth(['admin','staff']), (req, res) => {
  const { id } = req.params;
  // Sửa ReqID -> RequestID, ReqType -> RequestType
  const sql = `
    SELECT 
      RequestID, ProductID, RequestType, RequestedBy, ReviewedBy, Status, Notes, 
      CreatedAt, ReviewedAt, Data
    FROM ApprovalRequests
    WHERE RequestID = ?
  `;
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Error fetching approval request:', err);
      return res.status(500).json({ msg: 'Server error' });
    }
    if (!results.length) {
      return res.status(404).json({ msg: 'Approval request not found' });
    }

    const approval = results[0];
    let parsedData = null;
    try {
      parsedData = approval.Data ? JSON.parse(approval.Data) : null;
    } catch (e) {
      console.error('Error parsing Data JSON:', e);
    }

    res.json({
      ...approval,
      Data: parsedData
    });
  });
});

// 2. Xử lý Duyệt / Từ chối
router.post('/approvals/:id', auth(['admin']), (req, res) => {
  const { status, notes } = req.body;
  const approvalId = req.params.id;

  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ msg: 'Database connection failed' });

    connection.beginTransaction(err => {
      if (err) {
        connection.release();
        return res.status(500).json({ msg: 'Transaction failed' });
      }

      // Sửa ReqID -> RequestID
      connection.query('SELECT * FROM ApprovalRequests WHERE RequestID = ?', [approvalId], (err, results) => {
        if (err || !results.length) {
          console.error("Fetch Approval Error:", err);
          return rollback('Approval request not found');
        }

        const request = results[0];
        let data = null;
        if (request.Data) {
          try {
            data = typeof request.Data === 'string'
              ? JSON.parse(request.Data)
              : request.Data;
          } catch (err) {
            console.error('Invalid JSON format:', request.Data);
          }
        }

        // Chuẩn bị dữ liệu sản phẩm để Insert/Update
        const productData = {
          ProductName: data.name,
          Price: data.price,
          ProdDescription: data.description || null,
          Status: data.status || 'instock',
          FarmID: data.farmId,
          // Nếu có ảnh trong JSON request thì cập nhật QRUrl hoặc logic ảnh riêng
          // Ở đây tạm gán vào QRUrl nếu bạn muốn đơn giản, hoặc bỏ qua nếu dùng bảng ProductImages
          QRUrl: data.image ? data.image : null, 
          // Không update CreatedBy/CreatedAt khi duyệt
        };

        // --- XỬ LÝ LOGIC DUYỆT ---
        if (status === 'approved') {
          // Sửa ReqType -> RequestType
          if (request.RequestType === 'create') {
            // Thêm CreatedBy cho sản phẩm mới
            productData.CreatedBy = request.RequestedBy; 
            
            connection.query('INSERT INTO Products SET ?', productData, (err, result) => {
              if (err) return rollback(err);
              const productId = result.insertId;
              
              // Cập nhật lại ProductID cho request này để sau này tra cứu
              connection.query('UPDATE ApprovalRequests SET ProductID = ? WHERE RequestID = ?', [productId, approvalId]);
              
              // Xử lý phụ (ảnh, cert) nếu cần thiết - gọi hàm helper hoặc viết thẳng logic tại đây
              handleExtraData(connection, productId, data);

              done('approved', productId);
            });

          } else if (request.RequestType === 'update') {
            connection.query('UPDATE Products SET ? WHERE ProductID = ?', [productData, request.ProductID], (err) => {
              if (err) return rollback(err);
              
              // Xử lý phụ
              handleExtraData(connection, request.ProductID, data);
              
              done('approved', request.ProductID);
            });

          } else if (request.RequestType === 'delete') {
            connection.query('DELETE FROM Products WHERE ProductID = ?', [request.ProductID], (err) => {
              if (err) return rollback(err);
              done('approved', request.ProductID);
            });
          }

        } else {
          // --- XỬ LÝ TỪ CHỐI (Rejected) ---
          done('rejected', request.ProductID);
        }

        // Hàm kết thúc transaction thành công
        function done(newStatus, productId) {
          // Sửa ReqID -> RequestID
          connection.query(
            'UPDATE ApprovalRequests SET Status=?, Notes=?, ReviewedBy=?, ReviewedAt=NOW() WHERE RequestID=?',
            [newStatus, notes, req.user.id, approvalId],
            err2 => {
              if (err2) return rollback(err2);
              connection.commit(err => {
                connection.release();
                if (err) return res.status(500).json({ msg: 'Commit failed' });
                res.json({ msg: `Request ${newStatus} successfully`, productId });
              });
            }
          );
        }

        // Hàm rollback khi lỗi
        function rollback(error) {
          connection.rollback(() => {
            connection.release();
            console.error('Approval processing failed:', error);
            res.status(500).json({ msg: typeof error === 'string' ? error : 'Operation failed' });
          });
        }
      });
    });
  });
});

// Helper: Xử lý dữ liệu phụ (Ảnh, Cert) trong transaction
function handleExtraData(connection, productId, data) {
    // 1. Xử lý ảnh (nếu data.image là chuỗi path)
    if (data.image) {
        // Tùy logic: Xóa cũ thêm mới hoặc chỉ thêm
        // Ở đây ví dụ thêm mới vào bảng ProductImages
        connection.query('INSERT INTO ProductImages SET ?', { ProductID: productId, ImageUrl: data.image });
    }
    
    // 2. Xử lý ảnh nhiều (nếu data.images là mảng)
    if (data.images && Array.isArray(data.images)) {
        data.images.forEach(img => {
            connection.query('INSERT INTO ProductImages SET ?', { ProductID: productId, ImageUrl: img });
        });
    }

    // 3. Xử lý Cert (nếu có)
    if (data.certId) {
        // Xóa cert cũ của sản phẩm này (nếu muốn reset)
        // connection.query('DELETE FROM Product_Certifications WHERE ProductID = ?', [productId]);
        
        // Thêm cert mới
        const certData = {
            ProductID: productId,
            CertID: data.certId,
            IssueDate: data.issueDate || null, // Cần đảm bảo frontend gửi lên trường này nếu có
            ExpireDate: data.expireDate || null
        };
        connection.query('INSERT INTO Product_Certifications SET ?', certData);
    }
}

// Hàm export approveRequest (dùng cho crud.js khi admin tạo trực tiếp)
// Lưu ý: Hàm này chạy ngoài transaction của router trên, nên dùng db.query thường
function approveRequest(productId, adminId, type, data) {
    const qrUrl = `http://localhost:3000/product/${productId}`;
    console.log('Auto-approving extra data:', { productId, type });

    if (type === 'create' || type === 'update') {
        // Cập nhật QRUrl mặc định
        db.query('UPDATE Products SET QRUrl = ? WHERE ProductID = ?', [qrUrl, productId]);

        // Insert ảnh nếu có
        if (data && data.image) {
             db.query('INSERT INTO ProductImages SET ?', { ProductID: productId, ImageUrl: data.image });
        }
    }
    // Delete thì DB đã có ON DELETE CASCADE (trong file SQL) nên không cần xóa tay ảnh/cert
}

module.exports = { router, approveRequest };