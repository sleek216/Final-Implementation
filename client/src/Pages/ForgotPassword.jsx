import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import api from "../api";
import logo from "../assets/images/logo.png";
import loginImage from "../assets/images/login-image.jpeg";

const ForgotPassword = () => {
    const navigate = useNavigate();

    // Step: 1 = email, 2 = OTP, 3 = new password
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Step 1: Request OTP
    const handleRequestOtp = async () => {
        if (!email) {
            setError("Please enter your email address");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await api.post("/auth/forgot-password", { email });
            setMessage(res.data.message);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 6) {
            setError("Please enter the 6-digit OTP");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await api.post("/auth/verify-otp", { email, otp });
            setResetToken(res.data.resetToken);
            setMessage("OTP verified! Set your new password.");
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid or expired OTP");
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await api.post("/auth/reset-password", { resetToken, newPassword });
            setMessage("Password reset successfully!");

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOtp = async () => {
        setLoading(true);
        setError("");
        setMessage("");

        try {
            await api.post("/auth/forgot-password", { email });
            setMessage("New OTP sent to your email");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to resend OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-left">
                <Link to="/home" className="login-logo">
                    <img src={logo} alt="FashionVerse Logo" className="login-logo-img" />
                </Link>
                <img
                    src={loginImage}
                    alt="Fashion Model"
                    className="login-model-image"
                />
            </div>

            <div className="login-right">
                <div className="login-form-container">

                    {/* Step Indicator */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                style={{
                                    width: '40px',
                                    height: '4px',
                                    borderRadius: '2px',
                                    background: step >= s ? '#0f172a' : '#e2e8f0'
                                }}
                            />
                        ))}
                    </div>

                    {/* STEP 1: Email Entry */}
                    {step === 1 && (
                        <>
                            <h1 className="login-title">Forgot Password?</h1>
                            <p className="login-subtitle">Enter your email to receive a verification code.</p>

                            <div className="login-form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="login-input"
                                />
                            </div>

                            {error && <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '15px' }}>{error}</p>}
                            {message && <p style={{ color: '#059669', fontSize: '14px', marginBottom: '15px' }}>{message}</p>}

                            <button onClick={handleRequestOtp} className="login-button" disabled={loading}>
                                {loading ? "Sending..." : "Send OTP"}
                            </button>
                        </>
                    )}

                    {/* STEP 2: OTP Verification */}
                    {step === 2 && (
                        <>
                            <h1 className="login-title">Enter OTP</h1>
                            <p className="login-subtitle">
                                We've sent a 6-digit code to <strong>{email}</strong>
                            </p>

                            <div className="login-form-group">
                                <label>Verification Code</label>
                                <input
                                    type="text"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="login-input"
                                    style={{
                                        textAlign: 'center',
                                        letterSpacing: '10px',
                                        fontSize: '24px',
                                        fontWeight: '700'
                                    }}
                                    maxLength={6}
                                />
                            </div>

                            {error && <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '15px' }}>{error}</p>}
                            {message && <p style={{ color: '#059669', fontSize: '14px', marginBottom: '15px' }}>{message}</p>}

                            <button onClick={handleVerifyOtp} className="login-button" disabled={loading}>
                                {loading ? "Verifying..." : "Verify OTP"}
                            </button>

                            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
                                Didn't receive code?{' '}
                                <button
                                    onClick={handleResendOtp}
                                    disabled={loading}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#0f172a',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    Resend
                                </button>
                            </p>
                        </>
                    )}

                    {/* STEP 3: New Password */}
                    {step === 3 && (
                        <>
                            <h1 className="login-title">Set New Password</h1>
                            <p className="login-subtitle">Create a strong password for your account.</p>

                            <div className="login-form-group">
                                <label>New Password</label>
                                <div className="password-input-container">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="login-input password-field"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                                    >
                                        {showNewPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="login-form-group">
                                <label>Confirm Password</label>
                                <div className="password-input-container">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="login-input password-field"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle-btn"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '15px' }}>{error}</p>}
                            {message && <p style={{ color: '#059669', fontSize: '14px', marginBottom: '15px' }}>{message}</p>}

                            <button onClick={handleResetPassword} className="login-button" disabled={loading}>
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>
                        </>
                    )}

                    <p className="login-signup-text" style={{ marginTop: '30px' }}>
                        Remember your password? <Link to="/login" className="login-signup-link">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
