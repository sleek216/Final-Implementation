import AdminLayout from "./AdminLayout";
import "../styles/admin/ManageVerifications.css";

const ManageVerifications = () => {
    return (
        <AdminLayout>
            <div className="verifications-admin-page">
                {/* Page Header */}
                <div className="page-header">
                    <div className="header-content">
                        <h1>FBR Verifications</h1>
                        <p>Federal Board of Revenue - IRIS 2.0 Verification Portal</p>
                    </div>
                    <a
                        href="https://iris.fbr.gov.pk/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="open-external-btn"
                    >
                        <span>Open in New Tab</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </a>
                </div>

                {/* Iframe Container */}
                <div className="iframe-wrapper">
                    <div className="iframe-loading-overlay" id="loading-overlay">
                        <div className="spinner"></div>
                        <p>Loading FBR IRIS Portal...</p>
                    </div>

                    <iframe
                        src="https://iris.fbr.gov.pk/"
                        title="FBR IRIS Verification Portal"
                        className="fbr-iframe"
                        onLoad={() => {
                            const overlay = document.getElementById('loading-overlay');
                            if (overlay) overlay.style.display = 'none';
                        }}
                    />

                    {/* Fallback Notice */}
                    <div className="fallback-notice">
                        <div className="notice-icon">ℹ️</div>
                        <div className="notice-content">
                            <strong>Note:</strong> If the portal doesn't load, government websites may block embedding for security reasons.
                            Use the "Open in New Tab" button above to access the portal directly.
                        </div>
                    </div>
                </div>

                {/* Quick Links Section */}
                <div className="quick-links-section">
                    <h3>Quick Verification Links</h3>
                    <div className="quick-links-grid">
                        <a href="https://iris.fbr.gov.pk/" target="_blank" rel="noopener noreferrer" className="quick-link-card">
                            <div className="link-icon">📋</div>
                            <div className="link-info">
                                <h4>Active Taxpayer List (Income Tax)</h4>
                                <p>Verify income tax registration status</p>
                            </div>
                            <span className="arrow">→</span>
                        </a>
                        <a href="https://iris.fbr.gov.pk/" target="_blank" rel="noopener noreferrer" className="quick-link-card">
                            <div className="link-icon">🏪</div>
                            <div className="link-info">
                                <h4>Active Taxpayer List (Sales Tax)</h4>
                                <p>Verify sales tax registration</p>
                            </div>
                            <span className="arrow">→</span>
                        </a>
                        <a href="https://iris.fbr.gov.pk/" target="_blank" rel="noopener noreferrer" className="quick-link-card">
                            <div className="link-icon">🔍</div>
                            <div className="link-info">
                                <h4>Taxpayer Profile Inquiry</h4>
                                <p>Check taxpayer details</p>
                            </div>
                            <span className="arrow">→</span>
                        </a>
                        <a href="https://iris.fbr.gov.pk/" target="_blank" rel="noopener noreferrer" className="quick-link-card">
                            <div className="link-icon">🧾</div>
                            <div className="link-info">
                                <h4>CPR Verification</h4>
                                <p>Computerized Payment Receipt</p>
                            </div>
                            <span className="arrow">→</span>
                        </a>
                        <a href="https://iris.fbr.gov.pk/" target="_blank" rel="noopener noreferrer" className="quick-link-card">
                            <div className="link-icon">🏠</div>
                            <div className="link-info">
                                <h4>Property Certificate (u/s 7E)</h4>
                                <p>Property tax verification</p>
                            </div>
                            <span className="arrow">→</span>
                        </a>
                        <a href="https://iris.fbr.gov.pk/" target="_blank" rel="noopener noreferrer" className="quick-link-card">
                            <div className="link-icon">📱</div>
                            <div className="link-info">
                                <h4>POS Invoice Verification</h4>
                                <p>Point of Sale invoice check</p>
                            </div>
                            <span className="arrow">→</span>
                        </a>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default ManageVerifications;
