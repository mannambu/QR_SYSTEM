const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../services/db.js');
// QUAN TRỌNG: Phải dùng { transporter } vì mailer.js export ra một object
const { transporter } = require('../services/mailer.js'); 
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Forgot Password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  
  if (!email) return res.status(400).json({ msg: 'Email is required' });

  // 1. Kiểm tra Email có trong DB không
  db.query('SELECT * FROM Users WHERE Email = ?', [email], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ msg: 'Database error' });
    }
    
    // Nếu email không tồn tại
    if (!results.length) {
      return res.status(404).json({ msg: 'Email address not found in system' });
    }

    // 2. Tạo Token & Link
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '5m' });
    // Đảm bảo port 3000 (React)
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    console.log(`Sending reset email to: ${email}`);

    // 3. Gửi Mail
    const mailOptions = {
      from: `"FruitTrace Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #FF661A;">FruitTrace Password Reset</h2>
          <p>You requested a password reset. Please click the link below to set a new password:</p>
          <a href="${resetLink}" style="background-color: #FF661A; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Reset Password</a>
          <p style="font-size: 0.9em; color: #666;">This link will expire in 5 minutes.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 0.8em; color: #999;">If you did not request this, please ignore this email.</p>
        </div>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("❌ NODEMAILER ERROR:", error);
        return res.status(500).json({ msg: 'Failed to send email. Server configuration error.' });
      }
      console.log("✅ Email sent successfully: " + info.response);
      res.json({ msg: 'Email sent successfully', token });
    });
  });
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ msg: 'Missing token or password' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = 'UPDATE Users SET Password = ? WHERE Email = ?';
    db.query(query, [hashedPassword, email], (err, result) => {
      if (err) return res.status(500).json({ msg: 'Database error' });
      if (result.affectedRows === 0) return res.status(404).json({ msg: 'User not found' });

      res.json({ msg: 'Password reset successful' });
    });

  } catch (err) {
    console.error("Token error:", err.message);
    return res.status(400).json({ msg: 'Invalid or expired token' });
  }
});

module.exports = router;