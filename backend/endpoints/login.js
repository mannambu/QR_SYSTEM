const express = require('express');
const router = express.Router();
const db = require('../services/db.js');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs'); // 1. Import bcryptjs

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // tối đa 5 lần
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      msg: 'Too many login attempts, please try again after 15 minutes'
    });
  }
});

// Login
router.post('/login', limiter, (req, res) => {
  console.log("API login called");
  const { username, password } = req.body || {};

  // Kiểm tra dữ liệu đầu vào
  if (!username || !password) {
    return res.status(400).json({ msg: 'Missing username or password' });
  }

  // 2. Chỉ tìm User theo Username (không check password trong SQL nữa)
  const query = 'SELECT * FROM Users WHERE Username = ?';

  db.query(query, [username], async (err, results) => { // Thêm async ở đây để dùng await
    if (err) {
      // console.error('Login DB Error:', err);
      return res.status(500).json({ msg: 'Server error' });
    }

    // Nếu không tìm thấy user
    if (!results.length) {
      return res.status(401).json({ msg: 'Wrong username or password' });
    }

    const user = results[0];

    // 3. So sánh mật khẩu nhập vào (plain) với mật khẩu trong DB (hash)
    // bcrypt.compare(password_nhập, password_hash_trong_db)
    const isMatch = await bcrypt.compare(password, user.Password);

    if (!isMatch) {
      return res.status(401).json({ msg: 'Wrong username or password' });
    }

    // 4. Nếu khớp, tiến hành tạo Token như bình thường
    const accessToken = jwt.sign(
      { id: user.UserID, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    const refreshToken = jwt.sign(
      { id: user.UserID, role: user.Role, type: 'refresh' },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      msg: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.UserID,
        username: user.Username,
        mail: user.Email,
        role: user.Role
      }
    });

  });
});

// Token Refresh (Giữ nguyên)
router.post('/refresh-token', (req, res) => {
  const refreshToken = req.body.refreshToken;

  if (!refreshToken) return res.status(401).json({ msg: 'No refresh token'});

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    if (decoded.type !== 'refresh') {
      return res.status(403).json({ msg: 'Invalid refresh token' });
    }

    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ msg: 'Invalid or expired refresh token' });
  }
});

module.exports = router;