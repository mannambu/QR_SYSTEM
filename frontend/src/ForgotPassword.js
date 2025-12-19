import React, { useState } from 'react';
import './ForgotPassword.css'; // File CSS đi kèm

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState(null); // 'success', 'error', 'loading'

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setStatus({ type: 'error', message: 'Please enter your email address.' });
            return;
        }

        setStatus({ type: 'loading' });

        try {
            const res = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (res.ok) {
            setStatus({ type: 'success', message: data.msg });
            } else {
            setStatus({ type: 'error', message: data.msg });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'An error occurred while sending the request.' });
        }
    };

    const isButtonDisabled = status && status.type === 'loading';

    return (
        <div className="reset-password-page-container">
            <div className="reset-password-card">
                
                <header className="reset-password-header">
                    {/* Tiêu đề chính */}
                    <div className="header-tabs">
                        <span className="tab active-tab">Forgot Password</span>
                        <a href="/login" className="tab">Log In</a>
                    </div>
                </header>

                <main className="reset-password-body">
                    <h2 className="main-title">Reset Password</h2>
                    <p className="description">
                        Please enter the email associated with your account. We will send a secure link to create a new password.
                    </p>

                    {/* Hiển thị thông báo */}
                    {status && status.message && (
                        <div className={`status-message ${status.type}`}>
                            {status.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="reset-form">
                        <div className="form-group">
                            <label htmlFor="email">Your Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setStatus(null); 
                                }}
                                placeholder="example@mail.com"
                                disabled={isButtonDisabled}
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="continue-btn"
                            disabled={isButtonDisabled}
                        >
                            {isButtonDisabled ? (
                                <div className="spinner"></div> 
                            ) : (
                                'Send Request'
                            )}
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

export default ForgotPassword;