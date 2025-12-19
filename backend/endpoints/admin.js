const express = require('express');
const router = express.Router();
const { backupToCloudinary, recoverFromCloudinary } = require('../services/backupCloudinary.js');
const index = require('../services/Indexes.js')
const auth = require('../services/authMiddleware.js').auth;


// ADMIN BACKUP & RECOVERY
router.post('/admin/backup', auth(['admin']), async (req, res) => {
  try {
    const result = await backupToCloudinary();
    res.json(result);
  } catch (error) {
    console.error("Backup Error:", error);
    res.status(500).json({ msg: 'Backup failed', error: error.message });
  }
});

router.post('/admin/recovery', auth(['admin']), async (req, res) => {
  try {
    await recoverFromCloudinary();
    res.json({ msg: 'Data recovered successfully' });
  } catch (error) {
    console.error("Recovery Error:", error);
    res.status(500).json({ msg: 'Recovery failed', error: error.message });
  }
});

router.get('/index', auth(['admin']), async (req, res) => {
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

module.exports = router