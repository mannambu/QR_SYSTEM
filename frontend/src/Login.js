import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import api from './api';

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); 
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(""); // clear trước khi submit

    try {
      const res = await api.post("/api/login", { username, password });
      const { accessToken, refreshToken, user } = res.data;

      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("userMail", user.mail);
      localStorage.setItem("userName", user.username);
      localStorage.setItem("userId", user.id);

      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);

      if (err.response) {
        if (err.response.status === 429) {
          // bị limiter chặn
          setErrorMessage("Too many failed attempts. Account locked for 15 minutes.");
        } else if (err.response.status === 401 || err.response.status === 500) {
          // sai username hoặc password
          setErrorMessage("Invalid username or password.");
        } else {
          setErrorMessage("An error occurred. Please try again.");
        }
      } else {
        setErrorMessage("Cannot connect to server.");
      }
    }
  };

  const LogoCard = () => (
    <div className="logo-card-container">
      <div className="logo-section">
        <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#FF661A', padding: '12px 18px', borderRadius: '12px', color: 'white', marginBottom: '10px' }}>
          <span className="brand-name" style={{ color: 'white', margin: 0 }}>FruitTrace</span>
        </div>
        <p className="portal-text">Admin & Staff Portal</p>
      </div>
    </div>
  );

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="visual-story">
          <div className="visual-content">
            <div className="orange-line"></div>
            <h2>Origin<br/>Traceability</h2>
            <p className="sub-text">From farm to table, every step is recorded</p>
            <ul>
              <li>Fast QR Scanning</li>
              <li>Transparent Information</li>
              <li>Quality Assurance</li>
            </ul>
          </div>
        </div>

        <div className="login-form-wrap">
          <div className="login-form-card">
            <Link to="/scanner" className="back-home-link">
              &larr; Back to Home
            </Link>

            <LogoCard />

            <form className="login-form" onSubmit={handleSubmit}>
              <h2>Welcome back!</h2>
              <p className="sub-heading">Log in to manage the traceability system</p>

              <label>Username</label>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="password-header">
                <label>Password</label>
                <Link to="/forgot-password" className="forgot-link">
                  Forgot Password?
                </Link>
              </div>
              <div className="input-group">
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Hiển thị thông báo lỗi ngay dưới ô nhập */}
              <div className="error-message-container">
                  <p className={`error-message ${errorMessage ? 'visible' : 'hidden'}`}>
                    {/* Dùng một ký tự tàng hình (non-breaking space) khi không có lỗi để giữ chiều cao dòng */}
                    {errorMessage || "\u00A0"} 
                  </p>
              </div>

              <div className="remember-me">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember">Remember me</label>
              </div>

              <button type="submit" className="login-btn">
                Log In
              </button>
            </form>
          </div>

          <footer className="footer">
            © 2025 FruitTrace. All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Login;