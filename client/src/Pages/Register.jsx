import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import "../styles/Register.css";
import api from "../api";
import loginImage from "../assets/images/login-image.jpeg";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const [accountType, setAccountType] = useState("customer");

  // Customer Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Brand Partner Fields
  const [brandName, setBrandName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [brandCategory, setBrandCategory] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1); // 1: Details, 2: OTP Verification
  const [otp, setOtp] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pkPhoneRegex = /^(?:\+92|92|0)?3\d{9}$/;
    const nameRegex = /^[a-zA-Z\s\.]+$/;
    const urlRegex = /^https?:\/\/.+/;

    if (accountType === "customer") {
      if (!fullName.trim()) {
        errors.fullName = "Full Name is required";
      } else if (!nameRegex.test(fullName.trim())) {
        errors.fullName = "Full Name should only contain letters, spaces, or dots";
      }

      if (!email.trim()) {
        errors.email = "Email is required";
      } else if (!emailRegex.test(email)) {
        errors.email = "Please enter a valid email address";
      }

      const cleanedPhone = phone.replace(/[\s\-\(\)]/g, "");
      if (!phone.trim()) {
        errors.phone = "Phone Number is required";
      } else if (!pkPhoneRegex.test(cleanedPhone)) {
        errors.phone = "Please enter a valid Pakistani phone number (e.g., 03XXXXXXXXX)";
      }

      if (!password) {
        errors.password = "Password is required";
      } else if (password.length < 6) {
        errors.password = "Password must be at least 6 characters";
      }
    }

    if (accountType === "brand") {
      if (!brandName.trim()) {
        errors.brandName = "Brand Name is required";
      } else if (brandName.trim().length < 2) {
        errors.brandName = "Brand Name must be at least 2 characters";
      }

      if (!businessEmail.trim()) {
        errors.businessEmail = "Business Email is required";
      } else if (!emailRegex.test(businessEmail)) {
        errors.businessEmail = "Please enter a valid email address";
      }

      // Website URL is optional but if filled, must be valid
      if (websiteUrl.trim() && !urlRegex.test(websiteUrl)) {
        errors.websiteUrl = "Please enter a valid URL (e.g., https://www.brand.com)";
      }
      if (!brandCategory) errors.brandCategory = "Brand Category is required";
      if (!uploadedFile) errors.uploadedFile = "Verification document is required";
      if (!agreeTerms) errors.agreeTerms = "You must agree to the terms & conditions";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendOtp = async () => {
    if (!validateForm()) {
      toast.error("Please fix the highlighted errors before proceeding");
      setError("Please fix the highlighted errors before proceeding");
      return;
    }

    const targetEmail = accountType === "customer" ? email : businessEmail;

    setLoading(true);
    setError("");

    try {
      await api.post("/auth/send-registration-otp", { email: targetEmail });
      setStep(2);
      toast.info(`OTP has been sent to ${targetEmail}`);
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to send OTP. Please check your connection.";
      toast.error(errMsg);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerRegister = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      setError("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/register", {
        name: fullName,
        email,
        phone,
        password,
        otp,
        role: "customer"
      });

      if (response.data.user) {
        toast.success("Account created successfully! Please login to continue.");
        localStorage.setItem("justRegistered", "true");
        // Preserve redirectTo param so login page can redirect to checkout
        navigate(redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Registration failed. Please try again.";
      toast.error(errMsg);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleBrandRegister = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      setError("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("brandName", brandName);
      formData.append("businessEmail", businessEmail);
      formData.append("websiteUrl", websiteUrl);
      formData.append("brandCategory", brandCategory);
      formData.append("verificationFile", uploadedFile);
      formData.append("otp", otp);

      await api.post("/auth/register-brand", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      // Show success message
      setSuccess(true);
      toast.success("Brand registration submitted successfully! We'll review your application soon.");

      // Reset form
      setBrandName("");
      setBusinessEmail("");
      setWebsiteUrl("");
      setBrandCategory("");
      setUploadedFile(null);
      setAgreeTerms(false);
      setError("");

      // Navigate to landing
      setTimeout(() => {
        navigate("/");
      }, 2000);

    } catch (err) {
      const errMsg = err.response?.data?.message || "Brand registration failed. Please try again.";
      toast.error(errMsg);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    if (step === 1) {
      handleSendOtp();
    } else {
      if (accountType === "customer") {
        handleCustomerRegister();
      } else {
        handleBrandRegister();
      }
    }
  };

  return (
    <div className="register-page-wrapper">
      <div className="register-container">
        <div className="register-wrapper">

          {/* LEFT SIDE - IMAGE (STATIC - NEVER CHANGES) */}
          <div className="register-left">
            <div className="register-image-overlay">
              <div className="register-image-content">
                <p className="register-image-label">The New Standard</p>
                <h2 className="register-image-title">
                  Curating Excellence, <br />
                  Defining You.
                </h2>
                <p className="register-image-desc">
                  Join an exclusive network of fashion enthusiasts and visionary brands.
                </p>
              </div>
              <img
                src={loginImage}
                alt="Fashion Model"
                className="register-image"
              />
            </div>
          </div>

          {/* RIGHT SIDE - FORM */}
          <div className="register-right">
            <div className="register-form-container">

              {/* HEADING */}
              <h1 className="register-title">
                {accountType === "customer" ? "Elevate Your Style" : "Partner with FashionVerse"}
              </h1>

              {/* ACCOUNT TYPE TABS - STICKY */}
              <div className="account-type-tabs">
                <button
                  className={`account-tab ${accountType === "customer" ? "active" : ""}`}
                  onClick={() => { setAccountType("customer"); setStep(1); setOtp(""); setError(""); setFieldErrors({}); }}
                  disabled={step === 2}
                >
                  Customer
                </button>
                <button
                  className={`account-tab ${accountType === "brand" ? "active" : ""}`}
                  onClick={() => { setAccountType("brand"); setStep(1); setOtp(""); setError(""); setFieldErrors({}); }}
                  disabled={step === 2}
                >
                  Brands
                </button>
              </div>

              {/* FORM CONTENT */}
              <div className="register-form-content">

                {/* ERROR MESSAGE */}
                {error && (
                  <div className="register-error">
                    {error}
                  </div>
                )}

                {/* SUCCESS MESSAGE */}
                {success && (
                  <div className="register-success">
                    Registration submitted successfully!
                  </div>
                )}

                {/* STEP 1: Details */}
                {step === 1 && (
                  <>
                    {/* CUSTOMER FORM */}
                    {accountType === "customer" && (
                      <>
                        <div className="register-form-group">
                          <label className="register-label">Full Name <span className="required-star">*</span></label>
                          <input
                            type="text"
                            placeholder="e.g., Julianne Moore"
                            className="register-input"
                            value={fullName}
                            onChange={(e) => { setFullName(e.target.value); setFieldErrors(prev => ({ ...prev, fullName: '' })); }}
                          />
                          {fieldErrors.fullName && <span className="field-error">{fieldErrors.fullName}</span>}
                        </div>

                        <div className="register-form-group">
                          <label className="register-label">Email Address <span className="required-star">*</span></label>
                          <input
                            type="email"
                            placeholder="name@example.com"
                            className="register-input"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: '' })); }}
                          />
                          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                        </div>

                        <div className="register-form-group">
                          <label className="register-label">Phone Number <span className="required-star">*</span></label>
                          <input
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            className="register-input"
                            value={phone}
                            onChange={(e) => { setPhone(e.target.value); setFieldErrors(prev => ({ ...prev, phone: '' })); }}
                          />
                          {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
                        </div>

                        <div className="register-form-group">
                          <label className="register-label">Password <span className="required-star">*</span></label>
                          <div className="password-input-wrapper">
                            <input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="register-input"
                              value={password}
                              onChange={(e) => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: '' })); }}
                            />
                            <button
                              className="password-toggle"
                              onClick={() => setShowPassword(!showPassword)}
                              type="button"
                            >
                              {showPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                          </div>
                          {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
                        </div>
                      </>
                    )}

                    {/* BRAND PARTNER FORM */}
                    {accountType === "brand" && (
                      <>
                        <div className="brand-section-title">
                          <span className="section-icon">💼</span>
                          <span>Business Information</span>
                        </div>

                        <div className="register-form-grid-2">
                          <div className="register-form-group">
                            <label className="register-label">Brand Name <span className="required-star">*</span></label>
                            <input
                              type="text"
                              placeholder="Official business name"
                              className="register-input"
                              value={brandName}
                              onChange={(e) => { setBrandName(e.target.value); setFieldErrors(prev => ({ ...prev, brandName: '' })); }}
                            />
                            {fieldErrors.brandName && <span className="field-error">{fieldErrors.brandName}</span>}
                          </div>

                          <div className="register-form-group">
                            <label className="register-label">Business Email <span className="required-star">*</span></label>
                            <input
                              type="email"
                              placeholder="partnerships@brand.com"
                              className="register-input"
                              value={businessEmail}
                              onChange={(e) => { setBusinessEmail(e.target.value); setFieldErrors(prev => ({ ...prev, businessEmail: '' })); }}
                            />
                            {fieldErrors.businessEmail && <span className="field-error">{fieldErrors.businessEmail}</span>}
                          </div>
                        </div>

                        <div className="register-form-grid-2">
                          <div className="register-form-group">
                            <label className="register-label">Website URL</label>
                            <input
                              type="url"
                              placeholder="https://www.brand.com"
                              className="register-input"
                              value={websiteUrl}
                              onChange={(e) => { setWebsiteUrl(e.target.value); setFieldErrors(prev => ({ ...prev, websiteUrl: '' })); }}
                            />
                            {fieldErrors.websiteUrl && <span className="field-error">{fieldErrors.websiteUrl}</span>}
                          </div>

                          <div className="register-form-group">
                            <label className="register-label">Brand Category <span className="required-star">*</span></label>
                            <select
                              className="register-input"
                              value={brandCategory}
                              onChange={(e) => { setBrandCategory(e.target.value); setFieldErrors(prev => ({ ...prev, brandCategory: '' })); }}
                            >
                              <option value="">Select category</option>
                              <option value="mens">Men's Fashion</option>
                              <option value="womens">Women's Fashion</option>
                              <option value="unisex">All Category</option>
                              <option value="accessories">Kids</option>
                            </select>
                            {fieldErrors.brandCategory && <span className="field-error">{fieldErrors.brandCategory}</span>}
                          </div>
                        </div>

                        <div className="brand-section-title" style={{ marginTop: "30px" }}>
                          <span className="section-icon">🔒</span>
                          <span>Verification Documents <span className="required-star">*</span></span>
                        </div>

                        <p className="section-description">
                          Required: Business Registration, Tax Certificates, or Brand Authorization letters (PDF/JPG, max 10MB).
                        </p>

                        <label htmlFor="file-input" className="file-upload-area">
                          <div className="upload-icon">📁</div>
                          <p className="upload-text">Click to upload or drag and drop</p>
                          <p className="upload-subtext">Professional legal documentation for brand verification</p>
                        </label>
                        <input
                          id="file-input"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => { handleFileUpload(e); setFieldErrors(prev => ({ ...prev, uploadedFile: '' })); }}
                          className="file-input-hidden"
                        />
                        {fieldErrors.uploadedFile && <span className="field-error">{fieldErrors.uploadedFile}</span>}

                        {uploadedFile && (
                          <div className="uploaded-file">
                            <span className="file-icon">📄</span>
                            <span className="file-name">{uploadedFile.name}</span>
                            <span className="file-size">{(uploadedFile.size / 1024).toFixed(1)} KB</span>
                          </div>
                        )}

                        <div className="terms-checkbox-wrapper">
                          <input
                            type="checkbox"
                            id="agree-terms"
                            checked={agreeTerms}
                            onChange={(e) => { setAgreeTerms(e.target.checked); setFieldErrors(prev => ({ ...prev, agreeTerms: '' })); }}
                            className="checkbox-input"
                          />
                          <label htmlFor="agree-terms" className="checkbox-label">
                            I confirm that the provided information is accurate and that I have the legal authority to represent this brand. I agree to the{" "}
                            <Link to="/terms" className="link">
                              Brand Partnership Terms & Conditions
                            </Link>{" "}
                            and{" "}
                            <Link to="/privacy" className="link">
                              Privacy Policy
                            </Link>
                          </label>
                          {fieldErrors.agreeTerms && <span className="field-error">{fieldErrors.agreeTerms}</span>}
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* STEP 2: OTP Verification */}
                {step === 2 && (
                  <div className="otp-verification-section">
                    <div className="otp-header">
                      <h3>Verify Your Email</h3>
                      <p>We've sent a 6-digit verification code to <strong>{accountType === "customer" ? email : businessEmail}</strong></p>
                    </div>

                    <div className="register-form-group">
                      <label className="register-label">Verification Code</label>
                      <input
                        type="text"
                        placeholder="000000"
                        className="register-input otp-input"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        style={{
                          textAlign: 'center',
                          letterSpacing: '10px',
                          fontSize: '24px',
                          fontWeight: '700'
                        }}
                      />
                    </div>

                    <div className="otp-footer">
                      <button
                        type="button"
                        className="back-btn"
                        onClick={() => { setStep(1); setOtp(""); setError(""); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', color: '#64748b' }}
                      >
                        Edit Details
                      </button>
                      <button
                        type="button"
                        className="resend-btn"
                        onClick={handleSendOtp}
                        disabled={loading}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', color: '#0f172a', fontWeight: 'bold' }}
                      >
                        Resend Code
                      </button>
                    </div>
                  </div>
                )}

                {/* CTA BUTTON */}
                <button
                  className="register-button"
                  onClick={handleRegister}
                  disabled={loading}
                >
                  {step === 1
                    ? (loading ? "Sending OTP..." : "Generate OTP →")
                    : (loading ? (accountType === "customer" ? "Joining..." : "Submitting...") : (accountType === "customer" ? "VERIFY & REGISTER" : "VERIFY & SUBMIT"))
                  }
                </button>

                {/* TERMS & LOGIN */}
                {accountType === "customer" && (
                  <div className="register-footer-text">
                    <p className="register-terms">
                      By joining, you agree to our <Link to="/terms" className="link">Terms of Service</Link> and <Link to="/privacy" className="link">Privacy Policy</Link>
                    </p>
                    <p className="register-login-prompt">
                      Already have an account? <Link to={redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login"} className="register-login-link">Log in</Link>
                    </p>
                  </div>
                )}

                {accountType === "brand" && (
                  <p className="encryption-notice">
                    🔐 End-to-End Encrypted Verification
                  </p>
                )}

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
