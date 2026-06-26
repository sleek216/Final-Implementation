import { Component } from "react";
import { Link } from "react-router-dom";
import "../styles/admin/AdminSidebar.css";

class AdminSidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeLink: this.getActiveLinkFromPath(window.location.pathname)
    };
  }

  componentDidMount() {
    // Update active link when pathname changes
    this.updateActiveLink();

    // Poll for route changes to update active state
    this.pathCheckInterval = setInterval(() => {
      this.updateActiveLink();
    }, 200);
  }

  componentWillUnmount() {
    if (this.pathCheckInterval) {
      clearInterval(this.pathCheckInterval);
    }
  }

  updateActiveLink = () => {
    const pathname = window.location.pathname;
    const activeLink = this.getActiveLinkFromPath(pathname);
    if (this.state.activeLink !== activeLink) {
      this.setState({ activeLink });
    }
  }

  getActiveLinkFromPath = (pathname) => {
    if (pathname === '/admin' || pathname === '/admin/') {
      return 'dashboard';
    } else if (pathname.includes('/admin/users')) {
      return 'users';
    } else if (pathname.includes('/admin/brands')) {
      return 'brands';
    } else if (pathname.includes('/admin/categories')) {
      return 'categories';
    } else if (pathname.includes('/admin/products')) {
      return 'products';
    } else if (pathname.includes('/admin/colors')) {
      return 'colors';
    } else if (pathname.includes('/admin/verifications')) {
      return 'verifications';
    } else if (pathname.includes('/admin/messages')) {
      return 'messages';
    } else if (pathname.includes('/admin/orders')) {
      return 'orders';
    } else if (pathname.includes('/admin/settings')) {
      return 'settings';
    }
    return 'dashboard';
  }

  handleLinkClick = (linkName) => {
    this.setState({ activeLink: linkName });
    // Close sidebar on mobile after navigation
    if (this.props.isMobile && this.props.onNavigate) {
      this.props.onNavigate();
    }
  }

  render() {
    const { isOpen, isMobile } = this.props;
    const { activeLink } = this.state;

    return (
      <div className={`professional-sidebar ${isOpen ? 'sidebar-expanded' : 'sidebar-mini'
        } ${isMobile ? 'mobile-view' : ''}`}>
        {/* Professional Sidebar Header */}
        <div className="professional-header">
          <div className="brand-container">
            <div className="brand-logo">FV</div>
            {(isOpen || isMobile) && (
              <div className="brand-text">
                <h3>FashionVerse</h3>
                <p>Admin Console</p>
              </div>
            )}
          </div>
        </div>

        {/* Professional Navigation */}
        <div className="professional-nav">
          <div className="nav-section">
            <Link
              to="/admin/dashboard"
              className={`nav-item ${activeLink === 'dashboard' ? 'active' : ''}`}
              onClick={() => this.handleLinkClick('dashboard')}
            >
              <span className="nav-icon icon-dashboard"></span>
              {(isOpen || isMobile) && <span className="nav-label">Dashboard</span>}
            </Link>
            <Link
              to="/admin/users"
              className={`nav-item ${activeLink === 'users' ? 'active' : ''}`}
              onClick={() => this.handleLinkClick('users')}
            >
              <span className="nav-icon icon-users"></span>
              {(isOpen || isMobile) && <span className="nav-label">Users</span>}
            </Link>
            <Link
              to="/admin/brands"
              className={`nav-item ${activeLink === 'brands' ? 'active' : ''}`}
              onClick={() => this.handleLinkClick('brands')}
            >
              <span className="nav-icon icon-store"></span>
              {(isOpen || isMobile) && <span className="nav-label">Brand & Store</span>}
            </Link>
            <Link
              to="/admin/categories"
              className={`nav-item ${activeLink === 'categories' ? 'active' : ''}`}
              onClick={() => this.handleLinkClick('categories')}
            >
              <span className="nav-icon">🏪</span>
              {(isOpen || isMobile) && <span className="nav-label">Global Categories</span>}
            </Link>
            <Link
              to="/admin/colors"
              className={`nav-item ${activeLink === 'colors' ? 'active' : ''}`}
              onClick={() => this.handleLinkClick('colors')}
            >
              <span className="nav-icon">🎨</span>
              {(isOpen || isMobile) && <span className="nav-label">Global Colors</span>}
            </Link>
            <Link
              to="/admin/products"
              className={`nav-item ${activeLink === 'products' ? 'active' : ''}`}
              onClick={() => this.handleLinkClick('products')}
            >
              <span className="nav-icon icon-products"></span>
              {(isOpen || isMobile) && <span className="nav-label">Products</span>}
            </Link>
            <Link
              to="/admin/verifications"
              className={`nav-item ${activeLink === 'verifications' ? 'active' : ''}`}
              onClick={() => this.handleLinkClick('verifications')}
            >
              <span className="nav-icon icon-verification"></span>
              {(isOpen || isMobile) && <span className="nav-label">Verifications</span>}
            </Link>
            <Link
              to="/admin/messages"
              className={`nav-item ${activeLink === 'messages' ? 'active' : ''}`}
              onClick={() => this.handleLinkClick('messages')}
            >
              <span className="nav-icon icon-mail" style={{ filter: 'none' }}>✉️</span>
              {(isOpen || isMobile) && <span className="nav-label">Messages</span>}
            </Link>
            <Link
              to="/admin/orders"
              className={`nav-item ${activeLink === 'orders' ? 'active' : ''}`}
              onClick={() => this.handleLinkClick('orders')}
            >
              <span className="nav-icon">📦</span>
              {(isOpen || isMobile) && <span className="nav-label">Orders</span>}
            </Link>
            <Link
              to="/admin/settings"
              className={`nav-item ${activeLink === 'settings' ? 'active' : ''}`}
              onClick={() => this.handleLinkClick('settings')}
            >
              <span className="nav-icon icon-settings"></span>
              {(isOpen || isMobile) && <span className="nav-label">Settings</span>}
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default AdminSidebar;
