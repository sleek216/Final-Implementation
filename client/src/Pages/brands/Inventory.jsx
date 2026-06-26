import React, { Component } from "react";
import "../../styles/brands/BrandDashboard.css";
import api from "../../api";

class Inventory extends Component {
    state = {
        products: [],
        loading: true,
        error: null,
        activeTab: "All Products",
        searchTerm: ""
    };

    async componentDidMount() {
        this.fetchProducts();
    }

    fetchProducts = async () => {
        try {
            const res = await api.get("/brand/products");
            this.setState({ products: res.data, loading: false });
        } catch (err) {
            console.error("Error fetching products:", err);
            this.setState({ error: "Failed to load inventory", loading: false });
        }
    };

    handleToggle3D = async (product) => {
        if (!product.model3DUrl?.trim()) {
            alert("Add a 3D model URL in product edit before enabling 3D view.");
            return;
        }

        const nextValue = !product.is3DEnabled;
        try {
            const res = await api.patch(`/brand/products/${product._id}/3d`, {
                is3DEnabled: nextValue
            });

            const updatedProduct = res.data.product;
            this.setState({
                products: this.state.products.map((p) =>
                    p._id === product._id ? { ...p, ...updatedProduct } : p
                )
            });
        } catch (err) {
            console.error("Error updating 3D toggle:", err);
            alert(err.response?.data?.message || "Failed to update 3D setting");
        }
    };

    handleDeleteProduct = async (productId) => {
        if (window.confirm("Are you sure you want to delete this product from your inventory and the database?")) {
            try {
                await api.delete(`/brand/products/${productId}`);
                this.setState({
                    products: this.state.products.filter(p => p._id !== productId)
                });
                alert("Product deleted successfully");
            } catch (err) {
                console.error("Error deleting product:", err);
                alert(err.response?.data?.message || "Failed to delete product");
            }
        }
    };

    getFilteredProducts = () => {
        const { products, activeTab } = this.state;
        const searchTerm = this.props.searchTerm || this.state.searchTerm;
        let filtered = products;

        if (activeTab !== "All Products") {
            filtered = filtered.filter(p => p.category?.name === activeTab);
        }

        if (searchTerm.trim() !== "") {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(term) || 
                (p.sku && p.sku.toLowerCase().includes(term)) ||
                p._id.toLowerCase().includes(term)
            );
        }

        return filtered;
    };

    render() {
        const { products, loading, error, activeTab } = this.state;

        if (loading) return <div className="dash-wrapper"><p>Loading Inventory...</p></div>;
        if (error) return <div className="dash-wrapper"><p style={{ color: 'red' }}>{error}</p></div>;

        // Calculate Stats
        const totalProducts = products.length;
        const lowStockCount = products.filter(p => p.stock > 0 && p.stock < 10).length;
        const outOfStockCount = products.filter(p => !p.stock || p.stock === 0).length;
        const categories = [...new Set(products.map(p => p.category?.name).filter(Boolean))];

        const filteredProducts = this.getFilteredProducts();

        return (
            <div className="dash-wrapper">
                {/* STATS ROW */}
                <div className="dash-stats">
                    <div className="stat-card">
                        <div className="stat-top">
                            <span className="stat-label">Total Products</span>
                        </div>
                        <h2 className="stat-value">{totalProducts}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ fontSize: '14px' }}>📁</span>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Active Catalog</span>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-top">
                            <span className="stat-label">Low Stock</span>
                        </div>
                        <h2 className="stat-value">{lowStockCount}</h2>
                        <span className="pill warning">⚠ Action Required</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-top">
                            <span className="stat-label">Out of Stock</span>
                        </div>
                        <h2 className="stat-value">{outOfStockCount}</h2>
                        <span className="pill urgent">● Critical</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-top">
                            <span className="stat-label">Categories</span>
                        </div>
                        <h2 className="stat-value">{categories.length}</h2>
                        <span className="pill info">Diverse Range</span>
                    </div>
                </div>

                {/* FILTER BAR */}
                <div className="filter-bar">
                    <div className="tabs-group">
                        <button
                            className={`pill-tab ${activeTab === "All Products" ? "active" : ""}`}
                            onClick={() => this.setState({ activeTab: "All Products" })}
                        >
                            All Products
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`pill-tab ${activeTab === cat ? "active" : ""}`}
                                onClick={() => this.setState({ activeTab: cat })}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* LIST SECTION */}
                <div className="list-container">
                    <div className="list-header inventory-list-grid">
                        <div>Image</div>
                        <div style={{ marginLeft: '10px' }}>SKU</div>
                        <div>Product Name</div>
                        <div>Category</div>
                        <div style={{ textAlign: 'center' }}>Stock Level</div>
                        <div>Price</div>
                        <div style={{ textAlign: 'center' }}>3D View</div>
                        <div style={{ textAlign: 'right' }}>Actions</div>
                    </div>

                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((item) => (
                            <div className="list-row inventory-list-grid" key={item._id}>
                                <div className="product-img-v">
                                    {item.images?.[0] && (
                                        <img
                                            src={`http://localhost:5005/uploads/${item.images[0]}`}
                                            alt={item.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                                        />
                                    )}
                                </div>
                                <div className="sku-cell" style={{ fontWeight: 600, color: '#334155', fontSize: '12px' }}>
                                    {item.sku || item._id.slice(-8).toUpperCase()}
                                </div>
                                <div className="product-info-v">
                                    <span className="product-name-v">{item.name}</span>
                                    <span className="product-cat-v">
                                        {item.model3DUrl
                                            ? (item.is3DEnabled ? "3D preview enabled" : "3D URL added")
                                            : "No 3D model"}
                                    </span>
                                </div>
                                <div>
                                    <span className="cat-badge-v">{item.category?.name || "Uncategorized"}</span>
                                </div>
                                <div className="stock-lvl-cell">
                                    <span className="stock-num">{item.stock || 0}</span>
                                    <div className="stock-bar-v">
                                        <div
                                            className={`fill ${item.stock > 20 ? 'high' : item.stock > 0 ? 'low' : 'none'}`}
                                            style={{ width: item.stock > 0 ? (item.stock > 50 ? '100%' : '50%') : '0%' }}
                                        ></div>
                                    </div>
                                </div>
                                <div style={{ fontWeight: 700, color: '#0f172a' }}>
                                    Rs. {item.price?.toLocaleString()}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <button
                                        type="button"
                                        className={`inventory-3d-toggle ${item.is3DEnabled ? "on" : ""}`}
                                        title={item.model3DUrl ? "Toggle 3D view for customers" : "Add 3D URL first"}
                                        disabled={!item.model3DUrl}
                                        onClick={() => this.handleToggle3D(item)}
                                    >
                                        <span className="inventory-3d-toggle-knob" />
                                    </button>
                                </div>
                                <div className="action-btns-v">
                                    <button
                                        className="icon-btn-v"
                                        title="Edit Product"
                                        onClick={() => this.props.onEditProduct(item)}
                                    >✎</button>
                                    <button
                                        className="icon-btn-v"
                                        title="Delete Product"
                                        onClick={() => this.handleDeleteProduct(item._id)}
                                    >
                                        🗑
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                            No products found in this category.
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default Inventory;
