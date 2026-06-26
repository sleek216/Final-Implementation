import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import api from "../api";
import "../styles/admin/AdminProducts.css";

const ManageProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]); // Add brands state

  // Add Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    productId: `FV-${Math.floor(100000 + Math.random() * 900000)}`,
    description: "",
    price: "",
    stock: "",
    category: "",
    subCategory: "",
    brand: "", // In a real app, this might be auto-selected based on logged-in user or a dropdown
    images: []
  });
  const [addingProduct, setAddingProduct] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchBrands(); // Fetch brands
    fetchProducts();
  }, [searchQuery, filterStatus, filterCategory, currentPage]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/admin/categories');
      setCategories(response.data || []);
      // Set default category for new product if available
      if (response.data && response.data.length > 0) {
        setNewProduct(prev => ({ 
          ...prev, 
          category: response.data[0].name,
          subCategory: response.data[0].subCategories && response.data[0].subCategories.length > 0 ? response.data[0].subCategories[0].name : ""
        }));
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  // Fetch Brands
  const fetchBrands = async () => {
    try {
      const response = await api.get('/admin/brands');
      setBrands(response.data || []);
      if (response.data && response.data.length > 0) {
        setNewProduct(prev => ({ ...prev, brand: response.data[0]._id }));
      }
    } catch (err) {
      console.error("Failed to fetch brands:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      params.append('page', currentPage);
      params.append('limit', '10');

      const response = await api.get(`/admin/products?${params}`);
      setProducts(response.data.products || []);
      setTotalProducts(response.data.total || 0);
      setTotalPages(response.data.pages || 1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (productId) => {
    try {
      await api.put(`/admin/products/${productId}/toggle-status`);
      setProducts(products.map(product =>
        product._id === productId ? { ...product, isActive: !product.isActive } : product
      ));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to toggle product status");
    }
  };



  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusFilter = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (e) => {
    setFilterCategory(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Add Product Handlers
  const handleAddProductChange = (e) => {
    const { name, value } = e.target;
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.productId || !newProduct.price || !newProduct.category) {
      alert("Please fill in all required fields including Product ID");
      return;
    }

    try {
      setAddingProduct(true);
      // Construct payload - ignoring images for now as verified by user request for 'dropdown connection'
      // Construct payload - ignoring images for now as verified by user request for 'dropdown connection'
      const payload = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock) || 0,
      };

      // Remove brand if empty string to avoid ObjectId CastError on server
      if (!payload.brand) {
        delete payload.brand;
      }

      await api.post('/admin/products', payload);
      alert("Product added successfully!");
      setShowAddModal(false);
      setNewProduct({
        name: "",
        productId: `FV-${Math.floor(100000 + Math.random() * 900000)}`,
        description: "",
        price: "",
        stock: "",
        category: categories.length > 0 ? categories[0].name : "",
        subCategory: (categories.length > 0 && categories[0].subCategories?.length > 0) ? categories[0].subCategories[0].name : "",
        brand: "",
        images: []
      });
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add product");
    } finally {
      setAddingProduct(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="dashboard-content">
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div>Loading products...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="dashboard-content">
          <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
            <div>Error: {error}</div>
            <button onClick={fetchProducts} style={{ marginTop: '10px', padding: '8px 16px' }}>
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="dashboard-content">
        {/* Header */}
        <div className="product-management-header">
          <div className="header-content">
            <div className="header-info">
              <h1>Manage Products</h1>
              <p>View, manage, and add products to the store</p>
            </div>
            <div className="header-actions" style={{ marginLeft: 'auto' }}>
              <button
                className="add-user-btn"
                onClick={() => setShowAddModal(true)}
              >
                + Add Product
              </button>
            </div>
          </div>
        </div>

        <div className="activity-card">
          <div className="card-header">
            <h2 className="card-title">All Products ({totalProducts})</h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                value={filterCategory}
                onChange={handleCategoryFilter}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={handleStatusFilter}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearch}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  width: '250px'
                }}
              />
            </div>
          </div>

          <table className="activity-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="activity-event">
                      <div className="event-icon green">
                        <span>📦</span>
                      </div>
                      <div className="event-info">
                        <h4>{product.name}</h4>
                        <p>{product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="time-text">{product.brand?.name || 'N/A'}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>
                      Rs. {product.price?.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span className={product.stock === 0 ? 'time-text' : ''}>
                      {product.stock} units
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${product.isActive ? 'completed' : 'pending'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="task-action"
                        onClick={() => handleToggleStatus(product._id)}
                        style={{
                          background: product.isActive ? '#fee2e2' : '#d1fae5',
                          color: product.isActive ? '#dc2626' : '#059669',
                          borderColor: product.isActive ? '#dc2626' : '#059669'
                        }}
                      >
                        {product.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="task-action"
                        style={{ background: '#eef2ff', color: '#667eea', borderColor: '#667eea' }}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '8px' }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: currentPage === 1 ? '#f3f4f6' : 'white',
                  color: currentPage === 1 ? '#9ca3af' : '#000000',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              <span style={{ padding: '8px 16px' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  background: currentPage === totalPages ? '#f3f4f6' : 'white',
                  color: currentPage === totalPages ? '#9ca3af' : '#000000',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Add New Product</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddProductSubmit}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={newProduct.name}
                    onChange={handleAddProductChange}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Product ID</label>
                  <input
                    type="text"
                    name="productId"
                    value={newProduct.productId}
                    onChange={handleAddProductChange}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Category</label>
                  <select
                    name="category"
                    value={newProduct.category}
                    onChange={handleAddProductChange}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Sub-Category</label>
                  <select
                    name="subCategory"
                    value={newProduct.subCategory}
                    onChange={handleAddProductChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="">Select Sub-Category</option>
                    {categories.find(c => c.name === newProduct.category)?.subCategories?.map((sub) => (
                      <option key={sub._id} value={sub.name}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Brand</label>
                  <select
                    name="brand"
                    value={newProduct.brand}
                    onChange={handleAddProductChange}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="">Select Brand</option>
                    {brands.map((brand) => (
                      <option key={brand._id} value={brand._id}>{brand.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Description</label>
                  <textarea
                    name="description"
                    value={newProduct.description}
                    onChange={handleAddProductChange}
                    rows="3"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '5px' }}>Price (Rs.)</label>
                    <input
                      type="number"
                      name="price"
                      value={newProduct.price}
                      onChange={handleAddProductChange}
                      required
                      min="0"
                      step="0.01"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '5px' }}>Stock</label>
                    <input
                      type="number"
                      name="stock"
                      value={newProduct.stock}
                      onChange={handleAddProductChange}
                      required
                      min="0"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="modal-btn secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-btn primary"
                  disabled={addingProduct}
                >
                  {addingProduct ? "Adding..." : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ManageProducts;


