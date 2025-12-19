const nodemailer = require('nodemailer');
const db = require('./db'); 
require('dotenv').config();

// 1. Cấu hình Transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Kiểm tra kết nối ngay khi khởi động
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Mailer Connection Error:", error);
  } 
});

// 2. Hàm gửi email cho Admin (Giữ lại để không làm lỗi crud.js)
function sendAdminEmail(message) {
  // Lấy email của admin từ DB
  db.query("SELECT Email FROM Users WHERE Role = 'admin'", (err, results) => {
    if (err) {
      console.error('Failed to fetch admin emails:', err);
      return;
    }

    if (!results.length) {
      console.warn('No admin email found to send notification.');
      return;
    }

    const adminEmails = results.map(row => row.Email).filter(Boolean);
    const mailOptions = {
      from: `"FruitTrace System" <${process.env.EMAIL_USER}>`,
      to: adminEmails.join(','),
      subject: 'New Approval Request',
      text: message,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email to admins:', error);
      } else {
        console.log(`Admin notification sent: ${info.response}`);
      }
    });
  });
}

// 3. Export cả 2 thành phần
module.exports = { transporter, sendAdminEmail };