// runIndexing();
const db = require('./db'); // Đảm bảo đường dẫn đúng tới db.js

// CẬP NHẬT TÊN BẢNG CHO ĐÚNG SCHEMA
const indexes = [
  "CREATE INDEX idx_user_username ON Users(Username)",           // Sửa User -> Users
  "CREATE INDEX idx_approval_status ON ApprovalRequests(Status)", // Sửa Approval -> ApprovalRequests
  "CREATE INDEX idx_product_name ON Products(ProductName)",       // Sửa Product -> Products
  "CREATE INDEX idx_approval_requestedby ON ApprovalRequests(RequestedBy)"
];

async function runIndexing() {
  console.log("🔄 Đang bắt đầu quá trình Indexing thủ công...");

  for (const query of indexes) {
    try {
      await new Promise((resolve, reject) => {
        db.query(query, (err) => {
          if (err) {
            // Mã lỗi ER_DUP_KEYNAME nghĩa là Index đã tồn tại -> Bỏ qua
            if (err.code === 'ER_DUP_KEYNAME') {
              console.log(`⚠️ Index đã tồn tại: ${query}`);
              resolve();
            } else {
              console.error(`❌ Lỗi khi chạy: ${query}`, err.message);
              resolve(); 
            }
          } else {
            console.log(`✅ Đã tạo thành công: ${query}`);
            resolve();
          }
        });
      });
    } catch (e) {
      console.error("Unexpected error:", e);
    }
  }
  console.log("🎉 HOÀN TẤT INDEXING!");
}

// Export hàm để server.js có thể gọi
module.exports = { runIndexing };