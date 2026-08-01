import React, { Component } from "react";
import AdminSidebar from "./AdminSidebar";
import api from "../api";
import "../styles/admin/AdminSettings.css";

class AdminSettings extends Component {
    state = {
        // System Settings
        stripeSecretKey: "",
        stripePublishableKey: "",
        siteName: "FashionVerse",
        
        // Email Settings
        smtpHost: "",
        smtpPort: "",
        smtpSecure: false,
        smtpUser: "",
        smtpPass: "",
        emailFrom: "",

        // Admin Profile
        adminName: "",
        adminEmail: "",
        adminImage: "",
        selectedFile: null,
        imagePreview: null,

        // Password Change
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",

        // UI State
        activeTab: "system", // system, profile, password
        loading: true,
        saving: false,
        message: "",
        error: "",
        showSecret: false,
    };

    componentDidMount() {
        this.fetchData();
    }

    fetchData = async () => {
        this.setState({ loading: true });
        try {
            const [settingsRes, profileRes] = await Promise.all([
                api.get("/settings"),
                api.get("/auth/profile")
            ]);

            const { stripeSecretKey, stripePublishableKey, siteName, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, emailFrom } = settingsRes.data;
            const { name, email, image } = profileRes.data;

            this.setState({
                stripeSecretKey: stripeSecretKey || "",
                stripePublishableKey: stripePublishableKey || "",
                siteName: siteName || "FashionVerse",
                smtpHost: smtpHost || "",
                smtpPort: smtpPort || "",
                smtpSecure: smtpSecure || false,
                smtpUser: smtpUser || "",
                smtpPass: smtpPass || "",
                emailFrom: emailFrom || "",
                adminName: name || "",
                adminEmail: email || "",
                adminImage: image || "",
                loading: false,
            });
        } catch (err) {
            console.error("Failed to load data:", err);
            this.setState({ loading: false });
        }
    };

    handleChange = (e) => {
        this.setState({ [e.target.name]: e.target.value, message: "", error: "" });
    };

    handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            this.setState({
                selectedFile: file,
                imagePreview: URL.createObjectURL(file)
            });
        }
    };

    handleSaveSettings = async (e) => {
        e.preventDefault();
        this.setState({ saving: true, message: "", error: "" });

        try {
            const { stripeSecretKey, stripePublishableKey, siteName, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, emailFrom } = this.state;
            await api.put("/settings", {
                stripeSecretKey,
                stripePublishableKey,
                siteName,
                smtpHost,
                smtpPort,
                smtpSecure,
                smtpUser,
                smtpPass,
                emailFrom,
            });
            this.setState({ saving: false, message: "System settings saved successfully!" });
        } catch (err) {
            this.setState({
                saving: false,
                error: err.response?.data?.message || "Failed to save settings.",
            });
        }
    };

    handleSaveProfile = async (e) => {
        e.preventDefault();
        this.setState({ saving: true, message: "", error: "" });

        try {
            const { adminName, adminEmail, selectedFile } = this.state;
            const formData = new FormData();
            formData.append('name', adminName);
            formData.append('email', adminEmail);
            if (selectedFile) {
                formData.append('profileImage', selectedFile);
            }

            const res = await api.put("/auth/profile", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            this.setState({
                saving: false,
                message: "Profile updated successfully!",
                adminImage: res.data.image || this.state.adminImage,
                selectedFile: null,
                imagePreview: null
            });
        } catch (err) {
            this.setState({
                saving: false,
                error: err.response?.data?.message || "Failed to update profile.",
            });
        }
    };

    handleSavePassword = async (e) => {
        e.preventDefault();
        const { currentPassword, newPassword, confirmPassword } = this.state;

        if (newPassword !== confirmPassword) {
            this.setState({ error: "New passwords do not match." });
            return;
        }

        this.setState({ saving: true, message: "", error: "" });

        try {
            await api.put("/auth/password", {
                currentPassword,
                newPassword,
            });
            this.setState({
                saving: false,
                message: "Password changed successfully!",
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });
        } catch (err) {
            this.setState({
                saving: false,
                error: err.response?.data?.message || "Failed to change password.",
            });
        }
    };

    toggleShowSecret = () => {
        this.setState((prev) => ({ showSecret: !prev.showSecret }));
    };

    render() {
        const {
            stripeSecretKey,
            stripePublishableKey,
            siteName,
            smtpHost,
            smtpPort,
            smtpSecure,
            smtpUser,
            smtpPass,
            emailFrom,
            adminName,
            adminEmail,
            adminImage,
            imagePreview,
            currentPassword,
            newPassword,
            confirmPassword,
            activeTab,
            loading,
            saving,
            message,
            error,
            showSecret,
        } = this.state;

        const serverUrl = "http://localhost:5005/uploads/"; // Adjust if needed

        return (
            <div className="admin-container">
                <AdminSidebar />
                <main className="admin-main">
                    <div className="premium-settings-wrapper">
                        <div className="admin-header-premium">
                            <h1>System & Profile Management</h1>
                            <p className="subtitle">Manage your credentials and store configurations with ease.</p>

                            <div className="admin-tabs-premium">
                                <button
                                    className={`tab-btn-premium ${activeTab === 'system' ? 'active' : ''}`}
                                    onClick={() => this.setState({ activeTab: 'system', message: '', error: '' })}
                                >
                                    <span className="tab-icon">⚙️</span>
                                    <span>System Settings</span>
                                </button>
                                <button
                                    className={`tab-btn-premium ${activeTab === 'profile' ? 'active' : ''}`}
                                    onClick={() => this.setState({ activeTab: 'profile', message: '', error: '' })}
                                >
                                    <span className="tab-icon">👤</span>
                                    <span>Admin Profile</span>
                                </button>
                                <button
                                    className={`tab-btn-premium ${activeTab === 'password' ? 'active' : ''}`}
                                    onClick={() => this.setState({ activeTab: 'password', message: '', error: '' })}
                                >
                                    <span className="tab-icon">🛡️</span>
                                    <span>Security</span>
                                </button>
                            </div>
                        </div>

                        <div className="settings-card-premium">
                            {loading ? (
                                <div className="loader-box">
                                    <div className="premium-loader"></div>
                                    <p>Loading your data...</p>
                                </div>
                            ) : (
                                <div className="form-container-premium">
                                    {message && <div className="alert-premium success">{message}</div>}
                                    {error && <div className="alert-premium error">{error}</div>}

                                    {activeTab === "system" && (
                                        <form className="settings-form-content" onSubmit={this.handleSaveSettings}>
                                            <div className="premium-section">
                                                <div className="section-header">
                                                    <h3>General Configuration</h3>
                                                    <p>Core settings for your FashionVerse store.</p>
                                                </div>
                                                <div className="premium-field">
                                                    <label>Site Name</label>
                                                    <input
                                                        type="text"
                                                        name="siteName"
                                                        value={siteName}
                                                        onChange={this.handleChange}
                                                        placeholder="e.g. FashionVerse"
                                                    />
                                                </div>
                                            </div>

                                            <div className="premium-section">
                                                <div className="section-header">
                                                    <h3>Payment Gateway (Stripe)</h3>
                                                    <p>Securely connect your store to Stripe.</p>
                                                </div>
                                                <div className="premium-field">
                                                    <label>Stripe Publishable Key</label>
                                                    <input
                                                        type="text"
                                                        name="stripePublishableKey"
                                                        value={stripePublishableKey}
                                                        onChange={this.handleChange}
                                                        placeholder="pk_test_..."
                                                    />
                                                </div>

                                                <div className="premium-field">
                                                    <label>Stripe Secret Key</label>
                                                    <div className="password-wrapper-premium">
                                                        <input
                                                            type={showSecret ? "text" : "password"}
                                                            name="stripeSecretKey"
                                                            value={stripeSecretKey}
                                                            onChange={this.handleChange}
                                                            placeholder="sk_test_..."
                                                        />
                                                        <button
                                                            type="button"
                                                            className="show-hide-btn"
                                                            onClick={this.toggleShowSecret}
                                                        >
                                                            {showSecret ? "Hide" : "Show"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="premium-section">
                                                <div className="section-header">
                                                    <h3>Email Configuration (SMTP)</h3>
                                                    <p>Settings for system emails (OTP, order confirmation).</p>
                                                </div>
                                                <div className="premium-field">
                                                    <label>SMTP Host</label>
                                                    <input
                                                        type="text"
                                                        name="smtpHost"
                                                        value={smtpHost}
                                                        onChange={this.handleChange}
                                                        placeholder="smtp.example.com"
                                                    />
                                                </div>
                                                <div className="premium-field">
                                                    <label>SMTP Port</label>
                                                    <input
                                                        type="text"
                                                        name="smtpPort"
                                                        value={smtpPort}
                                                        onChange={this.handleChange}
                                                        placeholder="587"
                                                    />
                                                </div>
                                                <div className="premium-field">
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <input
                                                            type="checkbox"
                                                            name="smtpSecure"
                                                            checked={smtpSecure}
                                                            onChange={(e) => this.setState({ smtpSecure: e.target.checked })}
                                                            style={{ width: 'auto' }}
                                                        />
                                                        Use Secure Connection (TLS/SSL)
                                                    </label>
                                                </div>
                                                <div className="premium-field">
                                                    <label>SMTP Username</label>
                                                    <input
                                                        type="text"
                                                        name="smtpUser"
                                                        value={smtpUser}
                                                        onChange={this.handleChange}
                                                        placeholder="user@example.com"
                                                    />
                                                </div>
                                                <div className="premium-field">
                                                    <label>SMTP Password</label>
                                                    <div className="password-wrapper-premium">
                                                        <input
                                                            type={showSecret ? "text" : "password"}
                                                            name="smtpPass"
                                                            value={smtpPass}
                                                            onChange={this.handleChange}
                                                            placeholder="password or app password"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="premium-field">
                                                    <label>Sender Email (From)</label>
                                                    <input
                                                        type="text"
                                                        name="emailFrom"
                                                        value={emailFrom}
                                                        onChange={this.handleChange}
                                                        placeholder='"FashionVerse" <no-reply@fashionverse.com>'
                                                    />
                                                </div>
                                            </div>

                                            <button type="submit" className="premium-submit-btn" disabled={saving}>
                                                {saving ? "Saving Changes..." : "Save System Settings"}
                                            </button>
                                        </form>
                                    )}

                                    {activeTab === "profile" && (
                                        <form className="settings-form-content" onSubmit={this.handleSaveProfile}>
                                            <div className="premium-profile-header">
                                                <div className="avatar-preview-box">
                                                    <img
                                                        src={imagePreview || (adminImage ? `${serverUrl}${adminImage}` : "https://via.placeholder.com/150")}
                                                        alt="Admin Avatar"
                                                        className="premium-avatar"
                                                    />
                                                    <label htmlFor="image-input" className="avatar-edit-icon">
                                                        <span>✏️</span>
                                                    </label>
                                                    <input
                                                        id="image-input"
                                                        type="file"
                                                        hidden
                                                        onChange={this.handleFileChange}
                                                        accept="image/*"
                                                    />
                                                </div>
                                                <div className="user-info-premium">
                                                    <h3>{adminName || "Admin User"}</h3>
                                                    <p>{adminEmail || "Email Address"}</p>
                                                </div>
                                            </div>

                                            <div className="premium-section">
                                                <div className="section-header">
                                                    <h3>Identity Details</h3>
                                                    <p>Update your display name and contact email.</p>
                                                </div>
                                                <div className="premium-field">
                                                    <label>Full Name</label>
                                                    <input
                                                        type="text"
                                                        name="adminName"
                                                        value={adminName}
                                                        onChange={this.handleChange}
                                                        placeholder="Your Name"
                                                    />
                                                </div>
                                                <div className="premium-field">
                                                    <label>Email Address</label>
                                                    <input
                                                        type="email"
                                                        name="adminEmail"
                                                        value={adminEmail}
                                                        onChange={this.handleChange}
                                                        placeholder="admin@example.com"
                                                    />
                                                </div>
                                            </div>
                                            <button type="submit" className="premium-submit-btn" disabled={saving}>
                                                {saving ? "Updating Profile..." : "Update Profile"}
                                            </button>
                                        </form>
                                    )}

                                    {activeTab === "password" && (
                                        <form className="settings-form-content" onSubmit={this.handleSavePassword}>
                                            <div className="premium-section">
                                                <div className="section-header">
                                                    <h3>Account Security</h3>
                                                    <p>Protect your account with a high-security password.</p>
                                                </div>
                                                <div className="premium-field">
                                                    <label>Current Password</label>
                                                    <input
                                                        type="password"
                                                        name="currentPassword"
                                                        value={currentPassword}
                                                        onChange={this.handleChange}
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                                <div className="premium-field">
                                                    <label>New Password</label>
                                                    <input
                                                        type="password"
                                                        name="newPassword"
                                                        value={newPassword}
                                                        onChange={this.handleChange}
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                                <div className="premium-field">
                                                    <label>Confirm New Password</label>
                                                    <input
                                                        type="password"
                                                        name="confirmPassword"
                                                        value={confirmPassword}
                                                        onChange={this.handleChange}
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </div>
                                            <button type="submit" className="premium-submit-btn" disabled={saving}>
                                                {saving ? "Updating Password..." : "Change Password"}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        );
    }
}

export default AdminSettings;
