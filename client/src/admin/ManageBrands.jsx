import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import api from "../api";
import "../styles/admin/AdminBrands.css";

const ManageBrands = () => {
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [allBrands, setAllBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [brandToReject, setBrandToReject] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingRes, brandsRes] = await Promise.all([
        api.get("/admin/verifications"),
        api.get("/admin/brands")
      ]);
      setPendingVerifications(pendingRes.data);
      setAllBrands(brandsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (brandId) => {
    try {
      const response = await api.put(`/admin/verifications/${brandId}/approve`);
      setPendingVerifications(pendingVerifications.filter(brand => brand._id !== brandId));
      fetchBrands();
      // Inform the admin about the generated credentials
      if (response.data.credentials) {
        alert(`Brand approved! \n\nCredentials Generated:\nEmail: ${response.data.credentials.email}\nPassword: ${response.data.credentials.password}\n\nPlease save these credentials safely.`);
      } else {
        alert("Brand approved successfully!");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve brand");
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await api.get("/admin/brands");
      setAllBrands(res.data);
    } catch (err) {
      console.error("Failed to refresh brands", err);
    }
  };

  const handleReject = (brand) => {
    setBrandToReject(brand);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const submitRejection = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejection");
      return;
    }

    try {
      await api.put(`/admin/verifications/${brandToReject._id}/reject`, {
        reason: rejectionReason
      });
      setPendingVerifications(pendingVerifications.filter(brand => brand._id !== brandToReject._id));
      setRejectModalOpen(false);
      setBrandToReject(null);
      setRejectionReason("");
      alert("Brand rejected successfully and notification sent!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject brand");
    }
  };

  const handleViewDocuments = (brand) => {
    setSelectedBrand(brand);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedBrand(null);
  };

  const handleDeleteBrand = async (brandId) => {
    if (window.confirm("Are you sure you want to delete this brand?")) {
      try {
        await api.delete(`/admin/brands/${brandId}`);
        setAllBrands(allBrands.filter(brand => brand._id !== brandId));
        alert("Brand deleted successfully!");
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete brand");
      }
    }
  };

  if (loading) return <AdminLayout><div className="loading">Loading...</div></AdminLayout>;
  if (error) return <AdminLayout><div className="error">{error}</div></AdminLayout>;

  return (
    <AdminLayout breadcrumb={
      <>
        <span className="brand-link">FashionVerse Admin</span>
        <span className="separator">/</span>
        <span className="current">Brand Management</span>
      </>
    }>
      <div className="dashboard-content">
        <div className="brand-management-header" style={{ marginBottom: '20px' }}>
          <div className="header-info">
            <h1>Brand Management</h1>
            <p>Manage brand verification requests and registered brands.</p>
          </div>
        </div>

        {/* Pending Brand Verifications */}
        <div className="pending-verifications-section">
          <div className="section-header" style={{ marginBottom: '15px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Pending Verifications</h2>
          </div>
          <div className="verifications-table-container">
            <table className="verifications-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', textAlign: 'left' }}>
                <tr>
                  <th style={{ padding: '12px' }}>Brand</th>
                  <th style={{ padding: '12px' }}>Owner</th>
                  <th style={{ padding: '12px' }}>Date</th>
                  <th style={{ padding: '12px' }}>Documents</th>
                  <th style={{ padding: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingVerifications.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No pending verifications</td>
                  </tr>
                ) : (
                  pendingVerifications.map((brand) => (
                    <tr key={brand._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px' }}>{brand.name}</td>
                      <td style={{ padding: '12px' }}>{brand.owner?.name || "Pending"}</td>
                      <td style={{ padding: '12px' }}>{new Date(brand.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px' }}>
                        <button onClick={() => handleViewDocuments(brand)} style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>View PDF</button>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleApprove(brand._id)} style={{ color: 'green', cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.2rem' }}>✓</button>
                          <button onClick={() => handleReject(brand)} style={{ color: 'red', cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.2rem' }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Registered Brands Section */}
        <div className="registered-brands-section" style={{ marginTop: '30px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '15px' }}>Registered Brands</h2>
          <div className="verifications-table-container">
            <table className="verifications-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', textAlign: 'left' }}>
                <tr>
                  <th style={{ padding: '12px' }}>Brand</th>
                  <th style={{ padding: '12px' }}>Contact Email</th>
                  <th style={{ padding: '12px' }}>Password</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allBrands.filter(b => b.isApproved).length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No verified brands found</td>
                  </tr>
                ) : (
                  allBrands.filter(b => b.isApproved).map((brand) => (
                    <tr key={brand._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{brand.name}</td>
                      <td style={{ padding: '12px' }}>{brand.businessEmail}</td>
                      <td style={{ padding: '12px' }}>
                        <code style={{ background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                          {brand.owner?.tempPassword || "Hidden/Hashed"}
                        </code>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>Verified</span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button onClick={() => handleDeleteBrand(brand._id)} style={{ color: '#ef4444', cursor: 'pointer', background: 'none', border: 'none' }}>🗑️ Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Document Modal */}
      {modalOpen && selectedBrand && (
        <div className="modal-overlay" onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: '24px', borderRadius: '12px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ marginBottom: '15px', fontWeight: 'bold' }}>Documents: {selectedBrand.name}</h3>
            <p style={{ marginBottom: '10px' }}><strong>Business Email:</strong> {selectedBrand.businessEmail}</p>
            {selectedBrand.verificationDocument && (
              <div style={{ marginBottom: '20px' }}>
                <a href={`http://localhost:5005/uploads/${selectedBrand.verificationDocument}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>Open Verification Document</a>
              </div>
            )}
            <div style={{ textAlign: 'right' }}>
              <button onClick={closeModal} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalOpen && brandToReject && (
        <div className="modal-overlay" onClick={() => setRejectModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: '24px', borderRadius: '12px', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ marginBottom: '15px', fontWeight: 'bold' }}>Reject {brandToReject.name}</h3>
            <textarea 
              value={rejectionReason} 
              onChange={e => setRejectionReason(e.target.value)} 
              style={{ width: '100%', minHeight: '120px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '15px' }} 
              placeholder="Enter reason for rejection..." 
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setRejectModalOpen(false)} style={{ padding: '8px 16px', border: '1px solid #e2e8f0', background: '#fff', borderRadius: '6px' }}>Cancel</button>
              <button onClick={submitRejection} style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px' }}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ManageBrands;
