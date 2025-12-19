import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './ForgotPassword.css'; 

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (password && confirm) {
      if (password !== confirm) {
        setStatus({ type: 'error', message: 'Passwords do not match.' });
      } else {
        setStatus(null);
      }
    }
  }, [password, confirm]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirm) {
      setStatus({ type: 'error', message: 'Please enter both password fields.' });
      return;
    }
    if (password !== confirm) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    if (password.length > 25 || confirm.length > 25) {
      setStatus({ type: 'error', message: 'Password cannot exceed 25 characters.' });
      return;
    }

    setStatus({ type: 'loading' });

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', message: data.msg || 'Password reset successfully.' });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setStatus({ type: 'error', message: data.msg || 'An error occurred while resetting password.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'An error occurred while sending the request.' });
    }
  };

  const isButtonDisabled = status && status.type === 'loading';

  // SVG icon mắt mở
  const EyeOpen = (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24">
      <path stroke="currentColor" strokeWidth="2" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
    </svg>
  );

  // SVG icon mắt đóng
  const EyeClosed = (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24">
      <path stroke="currentColor" strokeWidth="2" d="M3 3l18 18M1 12s4-7 11-7c2.5 0 4.7.9 6.5 2.3M23 12s-4 7-11 7c-2.5 0-4.7-.9-6.5-2.3"/>
    </svg>
  );

  // Hàm xử lý nhập có giới hạn
  const handlePasswordChange = (val) => {
    if (val.length > 25) {
      setStatus({ type: 'error', message: 'Password cannot exceed 25 characters.' });
      setPassword(val.slice(0, 25)); // cắt bớt
    } else {
      setPassword(val);
    }
  };

  const handleConfirmChange = (val) => {
    if (val.length > 25) {
      setStatus({ type: 'error', message: 'Confirm password cannot exceed 25 characters.' });
      setConfirm(val.slice(0, 25)); // cắt bớt
    } else {
      setConfirm(val);
    }
  };

  return (
    <div className="reset-password-page-container">
      <div className="reset-password-card">

        <header className="reset-password-header">
          <div className="header-tabs">
            <span className="tab active-tab">Reset Password</span>
            <a href="/login" className="tab">Log In</a>
          </div>
        </header>

        <main className="reset-password-body">
          <h2 className="main-title">Create New Password</h2>
          <p className="description">
            Enter a new password for your account. This link is only valid for a few minutes.
          </p>

          {status && status.message && (
            <div className={`status-message ${status.type}`}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="reset-form">
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="••••••••"
                  disabled={isButtonDisabled}
                />
                <span
                  className="icon-eye"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? EyeOpen : EyeClosed}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirm">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => handleConfirmChange(e.target.value)}
                  placeholder="••••••••"
                  disabled={isButtonDisabled}
                />
                <span
                  className="icon-eye"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? EyeOpen : EyeClosed}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="continue-btn"
              disabled={isButtonDisabled}
            >
              {isButtonDisabled ? <div className="spinner"></div> : 'Update Password'}
            </button>
          </form>

          <div className="back-link">
            <a href="/login">← Back to Login</a>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResetPassword;