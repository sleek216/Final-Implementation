import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import api from "../api";
import "../styles/admin/AdminBrands.css"; // Reuse existing styles or create new ones

const ManageCategories = () => {
  const [storeCategories, setStoreCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [newSubCategoryName, setNewSubCategoryName] = useState("");
  const [activeCategoryIdForSub, setActiveCategoryIdForSub] = useState(null);
  const [addingSubCategory, setAddingSubCategory] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/categories");
      setStoreCategories(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      alert("Please enter a category name");
      return;
    }

    try {
      setAddingCategory(true);
      await api.post("/admin/categories", {
        name: newCategoryName,
        description: newCategoryDesc
      });
      alert("Category added successfully!");
      setNewCategoryName("");
      setNewCategoryDesc("");
      setShowCategoryForm(false);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add category");
    } finally {
      setAddingCategory(false);
    }
  };

  const handleQuickAddCategory = async (categoryName) => {
    try {
      setAddingCategory(true);
      await api.post("/admin/categories", {
        name: categoryName,
        description: `${categoryName}'s fashion collection`
      });
      alert(`${categoryName} category added successfully!`);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to add ${categoryName} category`);
    } finally {
      setAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm("Are you sure you want to delete this category? This will affect all brands using it.")) {
      try {
        await api.delete(`/admin/categories/${categoryId}`);
        alert("Category deleted successfully!");
        fetchCategories();
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete category");
      }
    }
  };

  const handleAddSubCategory = async (e, categoryId) => {
    e.preventDefault();
    if (!newSubCategoryName.trim()) {
      alert("Please enter a sub-category name");
      return;
    }

    try {
      setAddingSubCategory(true);
      await api.post(`/admin/categories/${categoryId}/subcategories`, {
        name: newSubCategoryName
      });
      alert("Sub-category added successfully!");
      setNewSubCategoryName("");
      setActiveCategoryIdForSub(null);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add sub-category");
    } finally {
      setAddingSubCategory(false);
    }
  };

  const handleDeleteSubCategory = async (categoryId, subCategoryId) => {
    if (window.confirm("Are you sure you want to delete this sub-category?")) {
      try {
        await api.delete(`/admin/categories/${categoryId}/subcategories/${subCategoryId}`);
        alert("Sub-category deleted successfully!");
        fetchCategories();
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete sub-category");
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
        <span className="current">Global Category Management</span>
      </>
    }>
      <div className="dashboard-content">
        <div className="brand-management-header" style={{ marginBottom: '30px' }}>
          <div className="header-info">
            <h1>Global Category & Sub-Category Management</h1>
            <p>Define the generic structure that all brands will use for their products.</p>
          </div>
        </div>

        <div className="store-categories-section" style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div className="section-header-with-add" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div className="section-title-with-icon">
              <span className="section-icon" style={{ fontSize: '24px' }}>🏪</span>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Master Category List</h2>
            </div>
            <button
              className="add-new-btn"
              onClick={() => setShowCategoryForm(!showCategoryForm)}
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            >
              {showCategoryForm ? "✕ Cancel" : "+ Add New Category"}
            </button>
          </div>

          {/* Quick Add Default Categories */}
          <div className="quick-add-categories" style={{ marginBottom: '25px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <p className="quick-add-label" style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '10px' }}>Quick Add Common Categories:</p>
            <div className="quick-buttons" style={{ display: 'flex', gap: '10px' }}>
              {['Women', 'Men', 'Kids', 'Accessories', 'Beauty'].map((cat) => (
                <button
                  key={cat}
                  className="quick-add-btn"
                  onClick={() => handleQuickAddCategory(cat)}
                  disabled={addingCategory || storeCategories.some(c => c.name === cat)}
                  style={{ background: '#fff', border: '1px solid #e2e8f0', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', color: '#475569' }}
                >
                  + {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Add Category Form */}
          {showCategoryForm && (
            <form onSubmit={handleAddCategory} className="category-form" style={{ marginBottom: '30px', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#fff' }}>
              <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>Create New Global Category</h3>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="Category Name (e.g., Electronics, Footwear)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <textarea
                  placeholder="Description of this category..."
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  rows="3"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <button type="submit" disabled={addingCategory} className="submit-btn" style={{ width: '100%', padding: '12px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                {addingCategory ? "Creating..." : "Add Global Category"}
              </button>
            </form>
          )}

          <div className="categories-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {storeCategories.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px' }}>
                <div className="empty-state-icon" style={{ fontSize: '40px' }}>🏪</div>
                <div className="empty-state-text">No categories defined yet</div>
                <p>Standard categories created here will be available to all brands.</p>
              </div>
            ) : (
              storeCategories.map((category) => (
                <div key={category._id} className="category-card" style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                  <div className="category-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <div className="category-info">
                      <div className="category-name" style={{ fontWeight: '700', fontSize: '18px', color: '#1e293b' }}>{category.name}</div>
                      <div className="category-description" style={{ fontSize: '13px', color: '#64748b' }}>{category.description || "No description"}</div>
                    </div>
                    <button
                      className="delete-category-btn"
                      onClick={() => handleDeleteCategory(category._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', padding: '5px' }}
                      title="Delete category"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="sub-categories-container" style={{ padding: '15px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', margin: 0 }}>Sub-Categories</h4>
                      <button
                        onClick={() => setActiveCategoryIdForSub(activeCategoryIdForSub === category._id ? null : category._id)}
                        style={{ background: '#eff6ff', color: '#2563eb', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        {activeCategoryIdForSub === category._id ? "Cancel" : "+ Add Sub"}
                      </button>
                    </div>

                    {/* Sub-categories Tags */}
                    <div className="sub-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px' }}>
                      {category.subCategories && category.subCategories.length > 0 ? (
                        category.subCategories.map(sub => (
                          <div key={sub._id} style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #e2e8f0' }}>
                            <span style={{ color: '#334155', fontWeight: '600' }}>{sub.name}</span>
                            <button
                              onClick={() => handleDeleteSubCategory(category._id, sub._id)}
                              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px', padding: 0, fontWeight: 'bold' }}
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No sub-categories defined</span>
                      )}
                    </div>

                    {/* Inline Add Sub Form */}
                    {activeCategoryIdForSub === category._id && (
                      <form onSubmit={(e) => handleAddSubCategory(e, category._id)} style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                        <input
                          type="text"
                          placeholder="New sub-category..."
                          value={newSubCategoryName}
                          onChange={(e) => setNewSubCategoryName(e.target.value)}
                          style={{ flex: 1, padding: '8px 12px', fontSize: '13px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                          required
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={addingSubCategory}
                          style={{ background: '#1e293b', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 15px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          {addingSubCategory ? "..." : "Add"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ManageCategories;
