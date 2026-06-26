import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../styles/admin/AdminSettings.css"; // Reusing existing styles if possible or adding specific ones

const Setting = () => {
    const [activeTab, setActiveTab] = useState("store");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Brand State
    const [brand, setBrand] = useState({
        name: "",
        description: "",
        supportEmail: "",
        phone: "",
        logo: "",
        bannerImage: ""
    });

    // User State
    const [user, setUser] = useState({
        name: "",
        email: ""
    });

    // Password State
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    // File State for previews and uploads
    const [files, setFiles] = useState({
        logo: null,
        bannerImage: null
    });

    const [previews, setPreviews] = useState({
        logo: null,
        bannerImage: null
    });

    useEffect(() => {
        fetchData();
    }, []);

    // Determine if current user can edit email (brand owners should not)
    const role = localStorage.getItem("role");
    const emailEditable = !(role === "brand" || role === "brandowner");

    const fetchData = async () => {
        try {
            setLoading(true);
            const [brandRes, userRes] = await Promise.all([
                api.get("/brand/my-brand"),
                api.get("/auth/profile")
            ]);

            setBrand(brandRes.data);
            setUser({
                name: userRes.data.name,
                email: userRes.data.email
            });
            setLoading(false);
        } catch (err) {
            console.error("Failed to load settings:", err);
            setError("Failed to load settings data.");
            setLoading(false);
        }
    };

    const handleBrandChange = (e) => {
        const { name, value } = e.target;
        setBrand(prev => ({ ...prev, [name]: value }));
    };

    const handleUserChange = (e) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswords(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        const file = files[0];
        if (file) {
            setFiles(prev => ({ ...prev, [name]: file }));
            setPreviews(prev => ({ ...prev, [name]: URL.createObjectURL(file) }));
        }
    };

    const saveBrandChanges = async () => {
        try {
            setSuccess(null);
            setError(null);

            if (!brand.name.trim()) {
                setError("Store Name is required.");
                return;
            }
            if (brand.name.trim().length < 2) {
                setError("Store Name must be at least 2 characters.");
                return;
            }

            if (brand.supportEmail.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(brand.supportEmail.trim())) {
                    setError("Please enter a valid support email address.");
                    return;
                }
            }

            if (brand.phone.trim()) {
                const cleanedPhone = brand.phone.replace(/[\s\-\(\)]/g, "");
                const pkPhoneRegex = /^(?:\+92|92|0)?3\d{9}$/;
                if (!pkPhoneRegex.test(cleanedPhone)) {
                    setError("Please enter a valid Pakistani phone number (e.g., 03XXXXXXXXX).");
                    return;
                }
            }

            const formData = new FormData();
            formData.append("name", brand.name);
            formData.append("description", brand.description);
            formData.append("supportEmail", brand.supportEmail);
            formData.append("phone", brand.phone);

            if (files.logo) formData.append("logo", files.logo);
            if (files.bannerImage) formData.append("bannerImage", files.bannerImage);

            await api.put("/brand/update-profile", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setSuccess("Brand settings updated successfully!");
            // Refresh data to show updated images from server
            setTimeout(fetchData, 1000);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update brand settings.");
        }
    };

    const saveAccountChanges = async () => {
        try {
            setSuccess(null);
            setError(null);

            if (!user.name.trim()) {
                setError("Full Name is required.");
                return;
            }
            const nameRegex = /^[a-zA-Z\s\.]+$/;
            if (!nameRegex.test(user.name.trim())) {
                setError("Full Name should only contain letters, spaces, or dots.");
                return;
            }

            if (!user.email.trim()) {
                setError("Email Address is required.");
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(user.email.trim())) {
                setError("Please enter a valid email address.");
                return;
            }

            await api.put("/auth/profile", user);
            setSuccess("Account profile updated successfully!");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update account settings.");
        }
    };

    const updatePassword = async () => {
        try {
            setSuccess(null);
            setError(null);

            if (passwords.newPassword !== passwords.confirmPassword) {
                setError("New passwords do not match.");
                return;
            }

            if (passwords.newPassword.length < 6) {
                setError("Password must be at least 6 characters.");
                return;
            }

            await api.put("/auth/password", {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });

            setSuccess("Password updated successfully!");
            setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update password.");
        }
    };

    if (loading) return <div className="dash-wrapper"><div className="loader">Loading settings...</div></div>;

    return (
        <div className="dash-wrapper">
            <div className="subpage-header">
                <h1>Settings</h1>
                <p>Manage your store profile and account security</p>
            </div>

            {/* Notifications */}
            {error && <div className="alert alert-error" style={{ marginBottom: '20px', padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px' }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: '20px', padding: '12px', background: '#dcfce7', color: '#16a34a', borderRadius: '8px' }}>{success}</div>}

            {/* TABS */}
            <div className="tabs-container" style={{ display: 'flex', gap: '32px', borderBottom: '1px solid #f1f5f9', marginBottom: '32px' }}>
                <button
                    className={`tab-btn ${activeTab === 'store' ? 'active' : ''}`}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '12px 4px',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'store' ? '600' : '400',
                        color: activeTab === 'store' ? '#0ea5e9' : '#64748b',
                        borderBottom: activeTab === 'store' ? '2px solid #0ea5e9' : 'none'
                    }}
                    onClick={() => { setActiveTab('store'); setError(null); setSuccess(null); }}
                >
                    Store Profile
                </button>
                <button
                    className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '12px 4px',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'account' ? '600' : '400',
                        color: activeTab === 'account' ? '#0ea5e9' : '#64748b',
                        borderBottom: activeTab === 'account' ? '2px solid #0ea5e9' : 'none'
                    }}
                    onClick={() => { setActiveTab('account'); setError(null); setSuccess(null); }}
                >
                    Account Security
                </button>
            </div>

            {activeTab === "store" ? (
                <div className="settings-content animate-fade-in">
                    {/* SECTION: STORE BRANDING */}
                    <div className="form-section">
                        <div className="section-title-v">Store Branding</div>
                        <div className="branding-grid-v" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '40px', alignItems: 'start' }}>
                            <div className="form-group-v">
                                <label className="label-v">Store Logo</label>
                                <div className="logo-uploader-v" style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '12px',
                                    border: '2px dashed #e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    background: '#f8fafc'
                                }}>
                                    {(previews.logo || brand.logo) && (
                                        <img
                                            src={previews.logo || `http://localhost:5005/uploads/${brand.logo}`}
                                            alt="Logo Preview"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    )}
                                    <div className="upload-overlay" style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(0,0,0,0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        opacity: previews.logo || brand.logo ? 0 : 1,
                                        transition: 'opacity 0.2s',
                                        color: 'white',
                                        cursor: 'pointer'
                                    }}>
                                        <span>Click to Upload</span>
                                    </div>
                                    <input type="file" name="logo" onChange={handleFileChange} style={{ position: 'absolute', opacity: 0, cursor: 'pointer', inset: 0 }} />
                                </div>
                            </div>
                            <div className="form-group-v">
                                <label className="label-v">Store Banner</label>
                                <div className="banner-uploader-v" style={{
                                    width: '100%',
                                    height: '160px',
                                    borderRadius: '12px',
                                    border: '2px dashed #e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    background: '#f8fafc'
                                }}>
                                    {(previews.bannerImage || brand.bannerImage) ? (
                                        <img
                                            src={previews.bannerImage || `http://localhost:5005/uploads/${brand.bannerImage}`}
                                            alt="Banner Preview"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                            <span style={{ fontSize: '32px' }}>🖼</span>
                                            <p>Upload Store Banner</p>
                                        </div>
                                    )}
                                    <input type="file" name="bannerImage" onChange={handleFileChange} style={{ position: 'absolute', opacity: 0, cursor: 'pointer', inset: 0 }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION: GENERAL INFO */}
                    <div className="form-section" style={{ marginTop: '32px' }}>
                        <div className="section-title-v">General Information</div>
                        <div className="form-grid-v" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                            <div className="form-group-v">
                                <label className="label-v">Store Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="input-v"
                                    value={brand.name}
                                    onChange={handleBrandChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            <div className="form-group-v">
                                <label className="label-v">Store Description</label>
                                <textarea
                                    name="description"
                                    className="textarea-v"
                                    rows="4"
                                    value={brand.description}
                                    onChange={handleBrandChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* SECTION: CONTACT & SUPPORT */}
                    <div className="form-section" style={{ marginTop: '32px' }}>
                        <div className="section-title-v">Contact & Support</div>
                        <div className="form-grid-v" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group-v">
                                <label className="label-v">Support Email</label>
                                <input
                                    type="email"
                                    name="supportEmail"
                                    className="input-v"
                                    value={brand.supportEmail}
                                    onChange={handleBrandChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            <div className="form-group-v">
                                <label className="label-v">Business Phone</label>
                                <input
                                    type="text"
                                    name="phone"
                                    className="input-v"
                                    value={brand.phone}
                                    onChange={handleBrandChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="footer-actions-v" style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="primary-btn" onClick={saveBrandChanges}>Save Brand Changes</button>
                    </div>
                </div>
            ) : (
                <div className="settings-content animate-fade-in">
                    <div className="form-section">
                        <div className="section-title-v">Personal Information</div>
                        <div className="form-grid-v" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group-v">
                                <label className="label-v">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="input-v"
                                    value={user.name}
                                    onChange={handleUserChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            <div className="form-group-v">
                                <label className="label-v">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="input-v"
                                    value={user.email}
                                    onChange={emailEditable ? handleUserChange : undefined}
                                    readOnly={!emailEditable}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: !emailEditable ? '#f8fafc' : undefined }}
                                />
                                {!emailEditable && (
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                                        Email cannot be changed from this panel.
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="footer-actions-v" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="primary-btn" onClick={saveAccountChanges}>Update Profile</button>
                        </div>
                    </div>

                    <div className="form-section" style={{ marginTop: '48px', borderTop: '1px solid #f1f5f9', paddingTop: '32px' }}>
                        <div className="section-title-v">Change Password</div>
                        <div className="form-grid-v" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', maxWidth: '500px' }}>
                            <div className="form-group-v">
                                <label className="label-v">Current Password</label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    className="input-v"
                                    value={passwords.currentPassword}
                                    onChange={handlePasswordChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            <div className="form-group-v">
                                <label className="label-v">New Password</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    className="input-v"
                                    value={passwords.newPassword}
                                    onChange={handlePasswordChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            <div className="form-group-v">
                                <label className="label-v">Confirm New Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    className="input-v"
                                    value={passwords.confirmPassword}
                                    onChange={handlePasswordChange}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            <div className="footer-actions-v" style={{ marginTop: '10px', display: 'flex' }}>
                                <button className="primary-btn" onClick={updatePassword}>Update Password</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Setting;
