import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import api from "../api";

const ManageColors = () => {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHex, setNewHex] = useState("#000000");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/colors");
      setColors(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch colors");
    } finally {
      setLoading(false);
    }
  };

  const handleAddColor = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newHex.trim()) {
      alert("Please enter both name and hex code");
      return;
    }

    try {
      setAdding(true);
      await api.post("/admin/colors", {
        name: newName,
        hexCode: newHex
      });
      alert("Color added successfully!");
      setNewName("");
      setNewHex("#000000");
      setShowForm(false);
      fetchColors();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add color");
    } finally {
      setAdding(false);
    }
  };

  const handleQuickAdd = async (colorName, hex) => {
    try {
      setAdding(true);
      await api.post("/admin/colors", {
        name: colorName,
        hexCode: hex
      });
      fetchColors();
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteColor = async (id) => {
    if (window.confirm("Are you sure you want to delete this color? This will affect product comparisons.")) {
      try {
        await api.delete(`/admin/colors/${id}`);
        alert("Color deleted successfully!");
        fetchColors();
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete color");
      }
    }
  };

  if (loading) return <AdminLayout><div className="loading">Loading...</div></AdminLayout>;
  if (error) return <AdminLayout><div className="error">{error}</div></AdminLayout>;

  const commonColors = [
    { name: 'Red', hex: '#FF0000' },
    { name: 'Blue', hex: '#0000FF' },
    { name: 'Green', hex: '#008000' },
    { name: 'Yellow', hex: '#FFFF00' },
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#FFFFFF' },
    { name: 'Pink', hex: '#FFC0CB' },
    { name: 'Purple', hex: '#800080' },
    { name: 'Grey', hex: '#808080' },
    { name: 'Brown', hex: '#A52A2A' },
    { name: 'Orange', hex: '#FFA500' },
    { name: 'Navy', hex: '#000080' }
  ];

  return (
    <AdminLayout breadcrumb={
      <>
        <span className="brand-link">FashionVerse Admin</span>
        <span className="separator">/</span>
        <span className="current">Global Color Management</span>
      </>
    }>
      <div className="dashboard-content">
        <div className="brand-management-header" style={{ marginBottom: '30px' }}>
          <div className="header-info">
            <h1>Global Color Management</h1>
            <p>Define standardized colors that all brands will select from. This ensures perfect product comparisons.</p>
          </div>
        </div>

        <div className="store-categories-section" style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div className="section-header-with-add" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div className="section-title-with-icon">
              <span className="section-icon" style={{ fontSize: '24px' }}>🎨</span>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Master Color List</h2>
            </div>
            <button
              className="add-new-btn"
              onClick={() => setShowForm(!showForm)}
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            >
              {showForm ? "✕ Cancel" : "+ Add New Color"}
            </button>
          </div>

          {/* Quick Add Section */}
          <div className="quick-add-categories" style={{ marginBottom: '25px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p className="quick-add-label" style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '10px' }}>Quick Add Standard Colors:</p>
            <div className="quick-buttons" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {commonColors.map((c) => (
                <button
                  key={c.name}
                  className="quick-add-btn"
                  onClick={() => handleQuickAdd(c.name, c.hex)}
                  disabled={adding || colors.some(existing => existing.name.toLowerCase() === c.name.toLowerCase())}
                  style={{ 
                    background: '#fff', 
                    border: '1px solid #e2e8f0', 
                    padding: '6px 14px', 
                    borderRadius: '6px', 
                    fontSize: '13px', 
                    cursor: 'pointer', 
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', background: c.hex, border: '1px solid #ddd' }}></span>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Add Form */}
          {showForm && (
            <form onSubmit={handleAddColor} className="category-form" style={{ marginBottom: '30px', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#fff' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>Define New Standard Color</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: '600' }}>Color Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Crimson Red, Royal Blue"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '13px', marginBottom: '5px', fontWeight: '600' }}>Hex Code</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="color"
                      value={newHex}
                      onChange={(e) => setNewHex(e.target.value)}
                      style={{ width: '50px', height: '40px', padding: '2px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={newHex}
                      onChange={(e) => setNewHex(e.target.value)}
                      style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      required
                    />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={adding} className="submit-btn" style={{ width: '100%', marginTop: '20px', padding: '12px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                {adding ? "Adding..." : "Add to Master List"}
              </button>
            </form>
          )}

          <div className="colors-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
            {colors.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px' }}>
                <p>No standardized colors defined yet.</p>
              </div>
            ) : (
              colors.map((color) => (
                <div key={color._id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '12px 15px', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '10px',
                  background: '#f8fafc'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '30px', 
                      height: '30px', 
                      borderRadius: '50%', 
                      background: color.hexCode, 
                      border: '2px solid #fff',
                      boxShadow: '0 0 0 1px #e2e8f0'
                    }}></div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>{color.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{color.hexCode}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteColor(color._id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ManageColors;
