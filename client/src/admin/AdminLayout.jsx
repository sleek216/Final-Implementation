import React, { Component } from "react";
import AdminSidebar from "./AdminSidebar";
import api from "../api";
import "../styles/admin/AdminLayout.css";

class AdminLayout extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sidebarOpen: true,
      isMobile: window.innerWidth <= 768,
      dropdownOpen: false,
      unreadCount: 0
    };
    this.dropdownRef = React.createRef();
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('mousedown', this.handleClickOutside);
    this.fetchUnreadCount();
    // Poll for new messages every 30 seconds
    this.unreadInterval = setInterval(this.fetchUnreadCount, 30000);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('mousedown', this.handleClickOutside);
    if (this.unreadInterval) clearInterval(this.unreadInterval);
  }

  fetchUnreadCount = async () => {
    try {
      const res = await api.get("/admin/messages/unread-count");
      this.setState({ unreadCount: res.data.unreadCount });
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }

  handleClickOutside = (event) => {
    if (this.dropdownRef.current && !this.dropdownRef.current.contains(event.target)) {
      this.setState({ dropdownOpen: false });
    }
  }

  handleResize = () => {
    const isMobile = window.innerWidth <= 768;
    this.setState({
      isMobile,
      sidebarOpen: !isMobile // Auto-close on mobile, open on desktop
    });
  }

  toggleSidebar = () => {
    this.setState(prevState => ({
      sidebarOpen: !prevState.sidebarOpen
    }));
  }

  closeSidebar = () => {
    if (this.state.isMobile) {
      this.setState({ sidebarOpen: false });
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

  handleNavigation = (path) => {
    // Basic navigation helper if not using withRouter/useNavigate
    // Ideally AdminLayout should use useNavigate hook, but it's a class component here.
    // Assuming 'window.location' for now or props.navigate if HOC used.
    window.location.href = path;
  }

  render() {
    const { children, breadcrumb } = this.props;
    const { sidebarOpen, isMobile, dropdownOpen, unreadCount } = this.state;

    // Get user info from localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userName = user.name || "Admin User";
    const userRole = user.role === "admin" ? "System Administrator" : "Brand Owner";

    // Default breadcrumb if not provided
    const defaultBreadcrumb = (
      <>
        <span className="brand-link">FashionVerse Admin</span>
        <span className="separator">/</span>
        <span className="current">Dashboard Overview</span>
      </>
    );

    return (
      <div className="admin-layout">
        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div className="mobile-overlay" onClick={this.closeSidebar} />
        )}

        {/* Professional Sidebar */}
        <div className={`admin-sidebar-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'
          } ${isMobile ? 'mobile-sidebar' : ''}`}>
          <AdminSidebar
            isOpen={sidebarOpen}
            isMobile={isMobile}
            onNavigate={this.closeSidebar}
          />
        </div>

        {/* Main Content Area */}
        <div className={`admin-content ${sidebarOpen && !isMobile ? 'content-with-sidebar' : 'content-full'
          }`}>
          {/* Header */}
          <div className="admin-header">
            <div className="header-left">
              <button
                className="menu-toggle"
                onClick={this.toggleSidebar}
                aria-label="Toggle menu"
              >
                <span style={{ fontSize: '24px' }}>☰</span>
              </button>
              <div className="breadcrumb">
                {breadcrumb || defaultBreadcrumb}
              </div>
            </div>

            <div className="header-right">
              <button
                className="icon-btn notification-btn"
                title={`${unreadCount} New Messages`}
                aria-label="Notifications"
                onClick={() => this.handleNavigation('/admin/messages')}
              >
                <span className="icon" style={{ fontSize: '20px' }}>🔔</span>
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
              </button>

              <div className="user-menu" ref={this.dropdownRef}>
                <div className="user-avatar-container" onClick={this.toggleDropdown}>
                  <div className="user-avatar">{userName.charAt(0).toUpperCase()}</div>
                  <div className="user-info">
                    <div className="user-name">{userName}</div>
                    <div className="user-role">{userRole}</div>
                  </div>
                  <span className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>▼</span>
                </div>

                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <button className="dropdown-item" onClick={() => this.handleNavigation('/admin/settings')}>
                      <span className="dropdown-icon">👤</span>
                      <span>Edit Profile</span>
                    </button>
                    <button className="dropdown-item" onClick={() => this.handleNavigation('/admin/settings')}>
                      <span className="dropdown-icon">🔒</span>
                      <span>Change Password</span>
                    </button>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item logout" onClick={this.handleLogout}>
                      <span className="dropdown-icon">🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Page Content */}
          {children}
        </div>
      </div>
    );
  }
}

export default AdminLayout;
