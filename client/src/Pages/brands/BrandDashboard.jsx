import React, { Component } from "react";
import { Link } from "react-router-dom";
import "../../styles/brands/BrandDashboard.css";

// Import icons
import dashboardIcon from "../../assets/icons/dashboard.svg";
import inventoryIcon from "../../assets/icons/inventory_2.png";
import ordersIcon from "../../assets/icons/local_mall.png";
import customersIcon from "../../assets/icons/cutomer-group.svg";
import settingsIcon from "../../assets/icons/settings.png";
import searchIcon from "../../assets/icons/search.svg";
import bellIcon from "../../assets/icons/bell-icon.png";

import Dashboard from "./Dashboard";
import Orders from "./Orders";
import Inventory from "./Inventory";
import Settings from "./Setting";
import AddProduct from "./AddProduct";
import Customers from "./Customers";

import api from "../../api";

class BrandDashboard extends Component {
  state = {
    activePage: "dashboard",
    activeTab: "overview",
    brand: null,
    stats: null,
    loading: true,
    error: null,
    dropdownOpen: false,
    period: 30, // Default 30 days
    searchTerm: ""
  };

  dropdownRef = React.createRef();

  async componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
    this.fetchData();
  }

  fetchData = async () => {
    try {
      this.setState({ loading: true });
      const res = await api.get(`/brand/dashboard?days=${this.state.period}`);
      this.setState({
        brand: res.data.brand,
        stats: res.data.stats,
        loading: false
      });
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      this.setState({ error: "Failed to load dashboard data", loading: false });
    }
  };

  handlePeriodChange = (days) => {
    this.setState({ period: days }, () => {
      this.fetchData();
    });
  };

  handleExport = () => {
    const { stats, brand } = this.state;
    if (!stats) return;

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Dashboard Export,${brand?.name || 'Brand'}\n`;
    csvContent += `Period,${stats.period}\n\n`;
    csvContent += `Metric,Value\n`;
    csvContent += `Total Sales,Rs. ${stats.revenue}\n`;
    csvContent += `Total Products,${stats.products}\n`;
    csvContent += `Total Orders,${stats.orders}\n`;
    csvContent += `Pending Orders,${stats.pendingOrders}\n\n`;

    if (stats.recentActivities && stats.recentActivities.length > 0) {
      csvContent += `Recent Activities\n`;
      csvContent += `Order ID,Customer,Status,Amount,Date\n`;
      stats.recentActivities.forEach(act => {
        csvContent += `${act.orderId},${act.customerName},${act.status},${act.amount},${new Date(act.createdAt).toLocaleDateString()}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${brand?.name || 'brand'}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  handleClickOutside = (event) => {
    if (this.dropdownRef.current && !this.dropdownRef.current.contains(event.target)) {
      this.setState({ dropdownOpen: false });
    }
  }

  toggleDropdown = () => {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  }

  handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    window.location.href = "/login";
  }

  renderPage = () => {
    const { activePage, brand, stats } = this.state;

    switch (activePage) {
      case "orders":
        return <Orders searchTerm={this.state.searchTerm} />;
      case "inventory":
        return <Inventory
          onAddProduct={() => this.setState({ activePage: 'add-product' })}
          onEditProduct={this.handleEditProduct}
          searchTerm={this.state.searchTerm}
        />;
      case "customers":
        return <Customers searchTerm={this.state.searchTerm} />;
      case "settings":
        return <Settings />;
      case "add-product":
        return <AddProduct onBack={() => this.setState({ activePage: 'inventory' })} />;
      case "edit-product":
        return <AddProduct
          product={this.state.editingProduct}
          onBack={() => this.setState({ activePage: 'inventory', editingProduct: null })}
        />;
      default:
        return (
          <Dashboard
            brand={brand}
            stats={stats}
            period={this.state.period}
            onPeriodChange={this.handlePeriodChange}
            onExport={this.handleExport}
          />
        );
    }
  };

  handleEditProduct = (product) => {
    this.setState({
      activePage: "edit-product",
      editingProduct: product
    });
  };

  getSearchPlaceholder = () => {
    const { activePage } = this.state;
    if (activePage === "orders") return "Search orders...";
    if (activePage === "inventory") return "Search inventory...";
    return "Search orders, products...";
  };

  render() {
    const { activePage, activeTab, brand, stats, loading, error } = this.state;
    const isEditing = activePage === 'add-product';

    if (loading) return <div className="brand-loading">Loading Dashboard...</div>;
    if (error) return <div className="brand-error">{error}</div>;

    return (
      <div className="brand-layout">

        {/* ================= SIDEBAR ================= */}
        <aside className="brand-sidebar">
          <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#111827', borderRadius: '10px', marginBottom: '12px' }}>
            
            <div className="brand-logo-container" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {brand?.logo ? (
                <img 
                  src={`http://localhost:5005/uploads/${brand.logo}`} 
                  alt={brand.name} 
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    objectFit: 'cover',
                    border: '1.5px solid #ffffff'
                  }} 
                />
              ) : (
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: '#0ea5e9', 
                  color: '#ffffff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: '700',
                  fontSize: '11px',
                  border: '1.5px solid #ffffff'
                }}>
                  {brand?.name ? brand.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'B'}
                </div>
              )}
            </div>

            <div className="logo-text" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '11px', color: '#ffffff', margin: 0, fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {brand?.name || "FashionVerse"}
              </h2>
              <span className="brand-subtitle" style={{ display: 'block', fontSize: '9px', color: 'rgba(255, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '1px' }}>
                Brand Portal
              </span>
            </div>
          </div>

          <nav className="brand-nav">
            <button
              className={`nav-item ${activePage === "dashboard" ? "active" : ""}`}
              onClick={() => this.setState({ activePage: "dashboard" })}
            >
              <img src={dashboardIcon} alt="Dashboard" className="nav-icon-img" />
              Dashboard
            </button>

            <button
              className={`nav-item ${activePage === "orders" ? "active" : ""}`}
              onClick={() => this.setState({ activePage: "orders" })}
            >
              <img src={ordersIcon} alt="Orders" className="nav-icon-img" />
              Orders
              {stats?.pendingOrders > 0 && <span className="nav-badge">{stats.pendingOrders}</span>}
            </button>

            <button
              className={`nav-item ${activePage === "inventory" || activePage === 'add-product' ? "active" : ""}`}
              onClick={() => this.setState({ activePage: "inventory" })}
            >
              <img src={inventoryIcon} alt="Inventory" className="nav-icon-img" />
              Inventory
            </button>

            <button
              className={`nav-item ${activePage === "customers" ? "active" : ""}`}
              onClick={() => this.setState({ activePage: "customers" })}
            >
              <img src={customersIcon} alt="Customers" className="nav-icon-img" />
              Customers
            </button>
          </nav>

          <div className="sidebar-footer">
            <button
              className={`nav-item ${activePage === "settings" ? "active" : ""}`}
              onClick={() => this.setState({ activePage: "settings" })}
            >
              <img src={settingsIcon} alt="Settings" className="nav-icon-img" />
              Settings
            </button>
            {brand && (
              <Link to={`/brand/${brand._id || brand.id}`} target="_blank" style={{ textDecoration: 'none' }}>
                <button className="add-product-btn" style={{ background: '#000', color: '#fff', borderRadius: '4px', width: '100%' }}>
                  <span style={{ fontSize: '14px' }}>↗</span> View Live Store
                </button>
              </Link>
            )}
          </div>
        </aside>

        {/* ================= MAIN CONTENT ================= */}
        <main className="brand-content">

          {/* Top Header - Hidden on "Add Product" since it has its own header in the image */}
          {!isEditing && (
            <header className="brand-header">
              <div className="header-tabs">
                <button
                  className={`tab-btn ${activeTab === "brand" ? "active" : ""}`}
                  onClick={() => this.setState({ activeTab: "brand" })}
                  style={{ border: activeTab === 'brand' ? '1.5px solid #111827' : '1px solid #e2e8f0', borderRadius: '8px', color: activeTab === 'brand' ? '#111827' : '#64748b' }}
                >
                  Brand
                </button>
                <button
                  className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
                  onClick={() => this.setState({ activeTab: "overview" })}
                >
                  Overview
                </button>
              </div>

              <div className="header-center" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div className="search-box" style={{ width: '280px', borderRadius: '4px', background: '#f1f5f9' }}>
                  <img src={searchIcon} alt="Search" className="search-icon-img" />
                  <input
                    type="text"
                    placeholder={this.getSearchPlaceholder()}
                    className="search-input"
                    value={this.state.searchTerm}
                    onChange={(e) => this.setState({ searchTerm: e.target.value })}
                  />
                </div>
                {activePage === 'inventory' && (
                  <button
                    className="primary-btn"
                    style={{ borderRadius: '6px', fontSize: '12px', padding: '10px 15px' }}
                    onClick={() => this.setState({ activePage: 'add-product' })}
                  >
                    + Add New Product
                  </button>
                )}
              </div>

              <div className="header-right">
                <button className="icon-btn">
                  <img src={bellIcon} alt="Notifications" className="bell-icon-img" />
                </button>
                <div className="user-menu-container" style={{ position: 'relative' }} ref={this.dropdownRef}>
                  <div
                    className="user-profile"
                    onClick={this.toggleDropdown}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                  >
                    <div style={{ textAlign: 'right' }}>
                      <div className="user-name" style={{ fontSize: '13px', lineHeight: '1', fontWeight: '700' }}>
                        {brand?.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Brand Owner</div>
                    </div>
                    <div className="user-avatar" style={{ background: '#e2e8f0', width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden' }}>
                      {brand?.logo ? (
                        <img src={`http://localhost:5005/uploads/${brand.logo}`} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontWeight: 'bold' }}>
                          {brand?.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>{this.state.dropdownOpen ? '▲' : '▼'}</span>
                  </div>

                  {this.state.dropdownOpen && (
                    <div className="dropdown-menu" style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '10px',
                      background: '#fff',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                      padding: '8px',
                      zIndex: 100,
                      minWidth: '160px',
                      border: '1px solid #f1f5f9'
                    }}>
                      <button
                        className="dropdown-item"
                        onClick={() => { this.setState({ activePage: "settings", dropdownOpen: false }) }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          borderRadius: '4px',
                          color: '#1e293b'
                        }}
                      >
                        <span>👤</span> Profile Settings
                      </button>
                      <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }}></div>
                      <button
                        className="dropdown-item"
                        onClick={this.handleLogout}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          borderRadius: '4px',
                          color: '#cc0000'
                        }}
                      >
                        <span>🚪</span> Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>
          )}

          {/* Page Content */}
          <div className="page-content">
            {this.renderPage()}
          </div>
        </main>

      </div>
    );
  }
}

export default BrandDashboard;
