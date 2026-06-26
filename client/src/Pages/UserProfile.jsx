import React, { Component } from "react";
import { Link } from "react-router-dom";
import { withRouter } from "../utils/withRouter";
import StoreNavbar from "../components/StoreNavbar";
import ProductFooter from "../components/ProductFooter";
import Breadcrumbs from "../components/Breadcrumbs";
import api from "../api";
import { WishlistContext } from "../context/WishlistContext";
import dashboardIcon from "../assets/icons/dashboard.svg";
import reviewsIcon from "../assets/icons/reviews.svg";
import wishlistIcon from "../assets/icons/my-wish-list.png";
import orderIcon from "../assets/icons/local_mall.png";
import settingsIcon from "../assets/icons/person.svg";
import paymentIcon from "../assets/icons/credit_card.svg";
import locationIcon from "../assets/icons/location_on.svg";
import calendarIcon from "../assets/icons/calendar_month.png";
import cameraIcon from "../assets/icons/photo_camera.svg";
import "../styles/UserProfile.css";
import "../styles/UserProfile-Wishlist-Reviews.css";

class UserProfile extends Component {
  static contextType = WishlistContext;
  state = {
    // User profile data (fetched from backend)
    user: {
      name: "",
      email: "",
      phone: "",
      bio: "",
      location: "",
      joinedDate: "",
      profileImage: null,
      verified: false,
    },
    activeTab: "overview",

    // Orders from backend
    orders: [],
    ordersLoading: true,

    // Profile loading & edit states
    profileLoading: true,
    isEditing: false,

    // Settings form fields
    editName: "",
    editEmail: "",
    editPhone: "",
    editBio: "",
    editLocation: "",

    // Password change fields
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",

    // UI feedback
    profileMsg: "",
    profileError: "",
    passwordMsg: "",
    passwordError: "",
    savingProfile: false,
    savingPassword: false,

    // Activity: Support Messages
    messages: [],
    messagesLoading: true,

    // Wishlist and reviews
    wishlistItems: [],
    userReviews: [],
    reviewsLoading: true,

    // Review Modal State
    showReviewModal: false,
    selectedProductForReview: null,
    selectedOrderForReview: null,
    reviewRating: 5,
    reviewComment: "",
    submittingReview: false,
    reviewError: "",
    reviewMsg: ""
  };

  componentDidMount() {
    // 🔐 Role-based guard: only customers can access this page
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      this.props.navigate("/login");
      return;
    }

    if (role === "admin") {
      this.props.navigate("/admin/dashboard");
      return;
    }

    if (role === "brand") {
      this.props.navigate("/brand/dashboard");
      return;
    }

    this.fetchProfile();
    this.fetchOrders();
    this.fetchMessages();
    this.loadWishlistItems();
    this.fetchUserReviews();
  }

  /* =============================================
     FETCH PROFILE FROM BACKEND
  ============================================= */
  fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        this.props.navigate("/login");
        return;
      }

      const res = await api.get("/auth/profile");
      const u = res.data;

      // Format joined date
      const joinedDate = u.createdAt
        ? new Date(u.createdAt).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
        : "";

      this.setState({
        user: {
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          bio: u.bio || "",
          location: u.location || "",
          joinedDate: `Joined ${joinedDate}`,
          profileImage: null,
          verified: true,
        },
        editName: u.name || "",
        editEmail: u.email || "",
        editPhone: u.phone || "",
        editBio: u.bio || "",
        editLocation: u.location || "",
        profileLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        this.props.navigate("/login");
      }
      this.setState({ profileLoading: false });
    }
  };

  /* =============================================
     FETCH USER ORDERS FROM BACKEND
  ============================================= */
  fetchOrders = async () => {
    try {
      const res = await api.get("/orders");
      this.setState({ orders: res.data, ordersLoading: false });
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      this.setState({ orders: [], ordersLoading: false });
    }
  };

  fetchMessages = async () => {
    try {
      const res = await api.get("/contact/my-messages");
      this.setState({ messages: res.data, messagesLoading: false });
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      this.setState({ messages: [], messagesLoading: false });
    }
  };

  loadWishlistItems = () => {
    // Load from wishlist context
    if (this.context && this.context.wishlist) {
      this.setState({ wishlistItems: this.context.wishlist });
    }
  };

  fetchUserReviews = async () => {
    try {
      this.setState({ reviewsLoading: true });
      const res = await api.get("/reviews/user");
      this.setState({ userReviews: res.data, reviewsLoading: false });
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      this.setState({ reviewsLoading: false });
    }
  };

  handleOpenReviewModal = (product, order) => {
    this.setState({
      selectedProductForReview: product,
      selectedOrderForReview: order,
      showReviewModal: true,
      reviewRating: 5,
      reviewComment: "",
      reviewError: "",
      reviewMsg: ""
    });
  };

  handleCloseReviewModal = () => {
    this.setState({ showReviewModal: false });
  };

  submitReview = async () => {
    const { selectedProductForReview, selectedOrderForReview, reviewRating, reviewComment } = this.state;
    
    if (!reviewComment.trim()) {
      this.setState({ reviewError: "Please write a comment" });
      return;
    }

    this.setState({ submittingReview: true, reviewError: "", reviewMsg: "" });

    try {
      await api.post("/reviews", {
        productId: selectedProductForReview._id || selectedProductForReview.id,
        orderId: selectedOrderForReview._id,
        rating: reviewRating,
        comment: reviewComment
      });

      this.setState({
        reviewMsg: "Review submitted successfully!",
        submittingReview: false,
      });

      // Refresh data
      this.fetchUserReviews();
      
      setTimeout(() => {
        this.handleCloseReviewModal();
      }, 1500);

    } catch (error) {
      this.setState({
        reviewError: error.response?.data?.message || "Failed to submit review",
        submittingReview: false
      });
    }
  };

  /* =============================================
     UPDATE PROFILE SETTINGS
  ============================================= */
  handleUpdateProfile = async () => {
    const { editName, editEmail, editPhone, editBio, editLocation } = this.state;

    if (!editName.trim() || !editEmail.trim()) {
      this.setState({ profileError: "Name and Email are required", profileMsg: "" });
      return;
    }

    const nameRegex = /^[a-zA-Z\s\.]+$/;
    if (!nameRegex.test(editName.trim())) {
      this.setState({ profileError: "Name should only contain letters, spaces, or dots", profileMsg: "" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail.trim())) {
      this.setState({ profileError: "Please enter a valid email address", profileMsg: "" });
      return;
    }

    if (editPhone.trim()) {
      const cleanedPhone = editPhone.replace(/[\s\-\(\)]/g, "");
      const pkPhoneRegex = /^(?:\+92|92|0)?3\d{9}$/;
      if (!pkPhoneRegex.test(cleanedPhone)) {
        this.setState({ profileError: "Please enter a valid Pakistani phone number (e.g., 03XXXXXXXXX)", profileMsg: "" });
        return;
      }
    }

    this.setState({ savingProfile: true, profileError: "", profileMsg: "" });

    try {
      const res = await api.put("/auth/profile", {
        name: editName,
        email: editEmail,
        phone: editPhone,
        bio: editBio,
        location: editLocation,
      });

      const u = res.data;
      const joinedDate = u.createdAt
        ? new Date(u.createdAt).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
        : this.state.user.joinedDate;

      this.setState({
        user: {
          ...this.state.user,
          name: u.name,
          email: u.email,
          phone: u.phone || "",
          bio: u.bio || "",
          location: u.location || "",
          joinedDate: joinedDate.startsWith("Joined") ? joinedDate : `Joined ${joinedDate}`,
        },
        profileMsg: "Profile updated successfully!",
        profileError: "",
        savingProfile: false,
        isEditing: false,
      });

      // Clear success message after 3 seconds
      setTimeout(() => this.setState({ profileMsg: "" }), 3000);
    } catch (error) {
      this.setState({
        profileError: error.response?.data?.message || "Failed to update profile",
        profileMsg: "",
        savingProfile: false,
      });
    }
  };

  /* =============================================
     CHANGE PASSWORD
  ============================================= */
  handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmNewPassword } = this.state;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      this.setState({ passwordError: "All password fields are required", passwordMsg: "" });
      return;
    }

    if (newPassword.length < 6) {
      this.setState({ passwordError: "New password must be at least 6 characters", passwordMsg: "" });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      this.setState({ passwordError: "New passwords do not match", passwordMsg: "" });
      return;
    }

    this.setState({ savingPassword: true, passwordError: "", passwordMsg: "" });

    try {
      await api.put("/auth/password", {
        currentPassword,
        newPassword,
      });

      this.setState({
        passwordMsg: "Password changed successfully!",
        passwordError: "",
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
        savingPassword: false,
      });

      setTimeout(() => this.setState({ passwordMsg: "" }), 3000);
    } catch (error) {
      this.setState({
        passwordError: error.response?.data?.message || "Failed to change password",
        passwordMsg: "",
        savingPassword: false,
      });
    }
  };

  /* =============================================
     SIGN OUT
  ============================================= */
  handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("cart");
    this.props.navigate("/login");
  };

  /* =============================================
     TAB CHANGE
  ============================================= */
  handleTabChange = (tab) => {
    this.setState({ activeTab: tab, profileMsg: "", profileError: "", passwordMsg: "", passwordError: "" });
  };

  /* =============================================
     HELPER: GET ORDER STATUS COLOR
  ============================================= */
  getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "delivered";
      case "shipped":
        return "shipped";
      case "processing":
        return "processing";
      case "pending":
        return "pending";
      case "cancelled":
        return "cancelled";
      default:
        return "pending";
    }
  };

  /* =============================================
     RENDER
  ============================================= */
  // Helper to build image URL for product objects or filenames
  getImageUrl = (productOrImage) => {
    if (!productOrImage) return "https://via.placeholder.com/100";

    // If a product object provided
    if (typeof productOrImage === 'object') {
      const imgs = productOrImage.images || [];
      const first = imgs.length ? imgs[0] : productOrImage.image || "";
      if (!first) return "https://via.placeholder.com/100";
      return (first.startsWith && first.startsWith('http')) ? first : `http://localhost:5005/uploads/${first}`;
    }

    // If a string filename / url provided
    const str = productOrImage.toString();
    if (!str) return "https://via.placeholder.com/100";
    return str.startsWith('http') ? str : `http://localhost:5005/uploads/${str}`;
  }
  render() {
    const {
      user,
      activeTab,
      orders,
      ordersLoading,
      profileLoading,
      isEditing,
      editName,
      editEmail,
      editPhone,
      editBio,
      editLocation,
      currentPassword,
      newPassword,
      confirmNewPassword,
      profileMsg,
      profileError,
      passwordMsg,
      passwordError,
      savingProfile,
      savingPassword,
    } = this.state;

    if (profileLoading) {
      return (
        <>
          <StoreNavbar />
          <main className="profile-container">
            <div className="profile-loading">
              <div className="loading-spinner"></div>
              <p>Loading your profile...</p>
            </div>
          </main>
        </>
      );
    }

    // Recent orders for overview (show max 3)
    const recentOrders = orders.slice(0, 3);

    return (
      <>
        <StoreNavbar />
        <main className="profile-container">
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
            <Breadcrumbs paths={[{ label: "My Profile", url: "/profile" }]} />
          </div>
          {/* Profile Header */}
          <section className="profile-header">
            <div className="profile-header-content">
              <div className="profile-info-wrapper">
                <div className="profile-avatar">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {user.verified && (
                    <div className="verified-badge">
                      <img src={cameraIcon} alt="" className="camera-badge-icon" />
                    </div>
                  )}
                </div>

                <div className="profile-details">
                  <h1>{user.name}</h1>
                  <p className="bio">{user.bio || "Fashion enthusiast at FashionVerse"}</p>
                  <div className="profile-meta">
                    {user.location && (
                      <span className="location">
                        <img src={locationIcon} alt="" className="meta-icon" />
                        {user.location}
                      </span>
                    )}
                    <span className="joined">
                      <img src={calendarIcon} alt="" className="meta-icon" />
                      {user.joinedDate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="profile-actions">
                <button
                  className="btn-primary"
                  onClick={() => this.handleTabChange("settings")}
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </section>

          {/* Main Content */}
          <section className="profile-content">
            {/* Sidebar */}
            <aside className="profile-sidebar">
              <div className="sidebar-section">
                <h3>Dashboard</h3>
                <nav className="sidebar-nav">
                  <button
                    className={`sidebar-link ${activeTab === "overview" ? "active" : ""}`}
                    onClick={() => this.handleTabChange("overview")}
                  >
                    <img src={dashboardIcon} alt="" className="sidebar-icon" />
                    Overview
                  </button>
                  <button
                    className={`sidebar-link ${activeTab === "orders" ? "active" : ""}`}
                    onClick={() => this.handleTabChange("orders")}
                  >
                    <img src={orderIcon} alt="" className="sidebar-icon" />
                    My Orders
                  </button>
                  <button
                    className={`sidebar-link ${activeTab === "wishlist" ? "active" : ""}`}
                    onClick={() => this.handleTabChange("wishlist")}
                  >
                    <img src={wishlistIcon} alt="" className="sidebar-icon" />
                    Wishlist
                  </button>
                  <button
                    className={`sidebar-link ${activeTab === "reviews" ? "active" : ""}`}
                    onClick={() => this.handleTabChange("reviews")}
                  >
                    <img src={reviewsIcon} alt="" className="sidebar-icon" />
                    Reviews
                  </button>
                </nav>
              </div>

              <div className="sidebar-section">
                <h3>Account</h3>
                <nav className="sidebar-nav">
                  <button
                    className={`sidebar-link ${activeTab === "settings" ? "active" : ""}`}
                    onClick={() => this.handleTabChange("settings")}
                  >
                    <img src={settingsIcon} alt="" className="sidebar-icon" />
                    Profile Settings
                  </button>
                  <button
                    className={`sidebar-link ${activeTab === "password" ? "active" : ""}`}
                    onClick={() => this.handleTabChange("password")}
                  >
                    <img src={paymentIcon} alt="" className="sidebar-icon" />
                    Change Password
                  </button>
                </nav>
              </div>

              <div className="sidebar-section">
                <button className="btn-signout" onClick={this.handleSignOut}>
                  🚪 Sign Out
                </button>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="profile-main">
              {/* ===================== OVERVIEW TAB ===================== */}
              {activeTab === "overview" && (
                <div className="tab-content overview-tab">
                  {/* Stats Cards */}
                  <div className="stats-row">
                    <div className="stat-card">
                      <span className="stat-number">{orders.length}</span>
                      <span className="stat-label">Total Orders</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-number">
                        {orders.filter((o) => o.orderStatus === "delivered").length}
                      </span>
                      <span className="stat-label">Delivered</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-number">
                        {orders.filter(
                          (o) =>
                            o.orderStatus === "processing" ||
                            o.orderStatus === "pending" ||
                            o.orderStatus === "shipped"
                        ).length}
                      </span>
                      <span className="stat-label">In Progress</span>
                    </div>
                  </div>

                  <div className="content-grid">
                    {/* Recent Orders */}
                    <div className="content-section">
                      <div className="section-header">
                        <h2>Recent Orders</h2>
                        <button
                          className="view-all"
                          onClick={() => this.handleTabChange("orders")}
                        >
                          View All
                        </button>
                      </div>

                      <div className="orders-list">
                        {ordersLoading ? (
                          <p className="empty-state">Loading orders...</p>
                        ) : recentOrders.length === 0 ? (
                          <p className="empty-state">
                            No orders yet. Start shopping to see your orders here!
                          </p>
                        ) : (
                          recentOrders.map((order) => (
                            <div
                              key={order._id}
                              className="order-card"
                              onClick={() => {
                                if (order.paymentStatus === 'pending') {
                                  const cartItems = order.items.map(item => ({
                                    id: item.productId._id || item.productId,
                                    name: item.productId.name || "Product",
                                    price: item.price.toString(),
                                    image: this.getImageUrl(item.productId?.images?.[0] || item.productId?.image || item.productId),
                                    qty: item.quantity
                                  }));
                                  localStorage.setItem("cart", JSON.stringify(cartItems));
                                  window.location.href = "/checkout/shipping";
                                }
                              }}
                              style={order.paymentStatus === 'pending' ? { cursor: 'pointer', borderColor: '#e65100' } : {}}
                            >
                              <div className="order-image">
                                {order.items?.[0]?.productId ? (
                                  <img
                                    src={this.getImageUrl(order.items[0].productId)}
                                    alt={order.items[0].productId.name || "Product"}
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/100'; }}
                                  />
                                ) : (
                                  <div className="image-placeholder"></div>
                                )}
                              </div>
                              <div className="order-info">
                                <h4>
                                  {order.items?.[0]?.productId?.name || "Order Item"}
                                  {order.items.length > 1 && ` + ${order.items.length - 1} more`}
                                </h4>
                                <p className="order-meta">
                                  {order.items.length} item{order.items.length > 1 ? "s" : ""}
                                </p>
                                <p className="order-date">
                                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                              <div className="order-status">
                                <span
                                  className={`status-badge ${this.getStatusClass(
                                    order.orderStatus
                                  )}`}
                                >
                                  {order.orderStatus?.charAt(0).toUpperCase() +
                                    order.orderStatus?.slice(1)}
                                </span>
                              </div>
                              <div className="order-price">
                                <p>Rs. {order.totalAmount?.toLocaleString()}</p>
                                {order.paymentStatus === 'pending' && (
                                  <span style={{ color: '#d32f2f', fontSize: '12px', fontWeight: 'bold' }}>Pay Now &rarr;</span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* RECENT SUPPORT MESSAGES */}
                    <div className="content-section" style={{ marginTop: "24px" }}>
                      <div className="section-header">
                        <h2>Recent Support Inquiries</h2>
                      </div>
                      <div className="support-list">
                        {this.state.messagesLoading ? (
                          <p className="empty-state">Loading messages...</p>
                        ) : this.state.messages.length === 0 ? (
                          <p className="empty-state">No support requests sent yet.</p>
                        ) : (
                          this.state.messages.slice(0, 3).map((msg) => (
                            <div key={msg._id} className="order-card" style={{ padding: '15px' }}>
                              <div className="order-info" style={{ marginLeft: 0 }}>
                                <h4>{msg.subject}</h4>
                                <p className="order-meta">{msg.message.substring(0, 60)}...</p>
                                <p className="order-date" style={{ marginTop: '5px' }}>
                                  {new Date(msg.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="order-status" style={{ marginLeft: 'auto' }}>
                                <span className={`status-badge ${msg.status === 'read' ? 'delivered' : 'pending'}`}>
                                  {msg.status === 'unread' ? 'Sent' : 'Read by Admin'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Account Info Card */}
                  <div className="content-section" style={{ marginTop: "24px" }}>
                    <div className="section-header">
                      <h2>Account Information</h2>
                    </div>
                    <div className="account-info-grid">
                      <div className="info-item">
                        <span className="info-label">Full Name</span>
                        <span className="info-value">{user.name}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Email Address</span>
                        <span className="info-value">{user.email}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Phone</span>
                        <span className="info-value">{user.phone || "Not set"}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Location</span>
                        <span className="info-value">{user.location || "Not set"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== ORDERS TAB ===================== */}
              {activeTab === "orders" && (
                <div className="tab-content orders-tab">
                  <h2>My Orders</h2>
                  <div className="orders-list">
                    {ordersLoading ? (
                      <p className="empty-state">Loading orders...</p>
                    ) : orders.length === 0 ? (
                      <div className="empty-state-container">
                        <span className="empty-icon">📦</span>
                        <p className="empty-state">
                          No orders yet. Start shopping to see your orders here!
                        </p>
                        <Link to="/home" className="btn-primary" style={{ marginTop: "16px", display: "inline-block", textDecoration: "none" }}>
                          Browse Products
                        </Link>
                      </div>
                    ) : (
                      orders.map((order) => (
                        <React.Fragment key={order._id}>
                          <div
                            className="order-card"
                            onClick={() => {
                              if (order.paymentStatus === 'pending') {
                                const cartItems = order.items.map(item => ({
                                  id: item.productId._id || item.productId,
                                  name: item.productId.name || "Product",
                                  price: item.price.toString(),
                                  image: this.getImageUrl(item.productId),
                                  qty: item.quantity
                                }));
                                localStorage.setItem("cart", JSON.stringify(cartItems));
                                window.location.href = "/checkout/shipping";
                              }
                            }}
                            style={order.paymentStatus === 'pending' ? { cursor: 'pointer', border: '1px solid #e65100' } : {}}
                          >
                            <div className="order-image">
                              <img
                                src={this.getImageUrl(order.items[0]?.productId)}
                                alt="Order Item"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/100'; }}
                              />
                            </div>
                            <div className="order-info">
                              <h4>
                                {order.items[0]?.productId?.name || "Order Item"}
                                {order.items.length > 1 && ` + ${order.items.length - 1} more`}
                              </h4>
                              <p className="order-meta">
                                {order.items.length} item{order.items.length > 1 ? "s" : ""}
                              </p>
                              <p className="order-date">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="order-status">
                              <span className={`status-badge ${this.getStatusClass(order.orderStatus)}`}>
                                {order.orderStatus?.charAt(0).toUpperCase() + order.orderStatus?.slice(1)}
                              </span>
                            </div>
                            <div className="order-price">
                              <p>Rs. {order.totalAmount?.toLocaleString()}</p>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                <span className="payment-status">
                                  {order.paymentStatus === "completed" ? "✅ Paid" : (
                                    <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>Pay Now &rarr;</span>
                                  )}
                                </span>
                                {order.orderStatus === 'delivered' && (
                                  <button 
                                    className="btn-review-small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Default to the first product in the order for the quick review button
                                      this.handleOpenReviewModal(order.items[0]?.productId, order);
                                    }}
                                    style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: '1px solid #111827', background: '#111827', color: 'white', cursor: 'pointer' }}
                                  >
                                    Write Review
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Show additional items if any, but styled inside the same container scope if needed */}
                          {order.items.length > 1 && (
                            <div className="order-extra-items" style={{ padding: '0 20px 15px', marginTop: '-10px', fontSize: '13px', color: '#666' }}>
                                <span>Includes: {order.items.slice(1).map(item => item.productId?.name).join(", ")}</span>
                            </div>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ===================== WISHLIST TAB ===================== */}
              {activeTab === "wishlist" && (
                <div className="tab-content wishlist-tab">
                  <h2>My Wishlist</h2>
                  {this.state.wishlistItems.length === 0 ? (
                    <div className="empty-state-container">
                      <span className="empty-icon">💝</span>
                      <p className="empty-state">Your wishlist is empty</p>
                      <Link to="/home" className="btn-primary" style={{ marginTop: "16px", display: "inline-block", textDecoration: "none" }}>
                        Browse Products
                      </Link>
                    </div>
                  ) : (
                    <div className="wishlist-grid-profile">
                      {this.state.wishlistItems.map((product) => {
                        const mainImage = product.images?.[0] || product.image;
                        const imageUrl = (mainImage && typeof mainImage === 'string' && mainImage.startsWith("http"))
                          ? mainImage
                          : (mainImage ? `http://localhost:5005/uploads/${mainImage}` : "https://via.placeholder.com/200");
                        return (
                          <div key={product._id} className="wishlist-card-profile">
                            <img src={imageUrl} alt={product.name} />
                            <h4>{product.name}</h4>
                            <p className="wishlist-price">Rs. {product.price?.toLocaleString() || "0"}</p>
                            <button 
                              className="btn-primary" 
                              style={{ width: "100%", marginTop: "10px" }}
                              onClick={() => {
                                const formattedProduct = {
                                  ...product,
                                  id: product._id,
                                  image: imageUrl,
                                  images: product.images?.map(img => img.startsWith('http') ? img : `http://localhost:5005/uploads/${img}`) || []
                                };
                                this.props.navigate(`/product/${product.productId || product._id}`, {
                                  state: { product: formattedProduct },
                                });
                              }}
                            >
                              View Product
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ===================== REVIEWS TAB ===================== */}
              {activeTab === "reviews" && (
                <div className="tab-content reviews-tab">
                  <h2>My Reviews</h2>
                  {this.state.reviewsLoading ? (
                    <p className="empty-state">Loading reviews...</p>
                  ) : this.state.userReviews.length === 0 ? (
                    <div className="empty-state-container">
                      <span className="empty-icon">⭐</span>
                      <p className="empty-state">
                        No reviews yet. Start shopping to leave your first review!
                      </p>
                    </div>
                  ) : (
                    <div className="reviews-list-profile">
                      {this.state.userReviews.map((review, idx) => (
                        <div key={idx} className="review-card-profile" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                          <img 
                            src={this.getImageUrl(review.product)} 
                            alt={review.product?.name} 
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} 
                          />
                          <div style={{ flex: 1 }}>
                            <div className="review-header">
                              <h4>{review.product?.name}</h4>
                              <span className="review-rating">{"★".repeat(review.rating || 5)}{"☆".repeat(5 - (review.rating || 5))}</span>
                            </div>
                            <p className="review-comment">{review.comment || "No comment"}</p>
                            <p className="review-date">
                              {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ===================== SETTINGS TAB ===================== */}
              {activeTab === "settings" && (
                <div className="tab-content settings-tab">
                  <h2>Profile Settings</h2>

                  {/* Success / Error Messages */}
                  {profileMsg && (
                    <div className="alert alert-success">{profileMsg}</div>
                  )}
                  {profileError && (
                    <div className="alert alert-error">{profileError}</div>
                  )}

                  <form
                    className="settings-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      this.handleUpdateProfile();
                    }}
                  >
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) =>
                            this.setState({ editName: e.target.value })
                          }
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="form-group">
                        <label>Email Address</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) =>
                            this.setState({ editEmail: e.target.value })
                          }
                          placeholder="Your email"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          value={editPhone}
                          onChange={(e) =>
                            this.setState({ editPhone: e.target.value })
                          }
                          placeholder="Your phone number"
                        />
                      </div>
                      <div className="form-group">
                        <label>Location</label>
                        <input
                          type="text"
                          value={editLocation}
                          onChange={(e) =>
                            this.setState({ editLocation: e.target.value })
                          }
                          placeholder="City, Country"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Bio</label>
                      <textarea
                        value={editBio}
                        onChange={(e) =>
                          this.setState({ editBio: e.target.value })
                        }
                        placeholder="Tell us a little about yourself..."
                        rows={3}
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={savingProfile}
                    >
                      {savingProfile ? "Saving..." : "Update Profile"}
                    </button>
                  </form>
                </div>
              )}

              {/* ===================== CHANGE PASSWORD TAB ===================== */}
              {activeTab === "password" && (
                <div className="tab-content settings-tab">
                  <h2>Change Password</h2>

                  {/* Success / Error Messages */}
                  {passwordMsg && (
                    <div className="alert alert-success">{passwordMsg}</div>
                  )}
                  {passwordError && (
                    <div className="alert alert-error">{passwordError}</div>
                  )}

                  <form
                    className="settings-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      this.handleChangePassword();
                    }}
                  >
                    <div className="form-group">
                      <label>Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) =>
                          this.setState({ currentPassword: e.target.value })
                        }
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) =>
                            this.setState({ newPassword: e.target.value })
                          }
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="form-group">
                        <label>Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) =>
                            this.setState({ confirmNewPassword: e.target.value })
                          }
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={savingPassword}
                    >
                      {savingPassword ? "Changing..." : "Change Password"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </section>
        </main>

        {/* REVIEW MODAL */}
        {this.state.showReviewModal && (
            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div className="modal-content" style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
                    <h3>Review for {this.state.selectedProductForReview?.name}</h3>
                    <div style={{ margin: '20px 0' }}>
                        <label style={{ display: 'block', marginBottom: '10px' }}>Rating:</label>
                        <div style={{ fontSize: '24px', color: '#fbbf24', cursor: 'pointer' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <span key={star} onClick={() => this.setState({ reviewRating: star })}>
                                    {star <= this.state.reviewRating ? "★" : "☆"}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '10px' }}>Your Feedback:</label>
                        <textarea 
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '100px' }}
                            placeholder="How was the product?"
                            value={this.state.reviewComment}
                            onChange={(e) => this.setState({ reviewComment: e.target.value })}
                        ></textarea>
                    </div>

                    {this.state.reviewError && <p style={{ color: 'red', fontSize: '14px' }}>{this.state.reviewError}</p>}
                    {this.state.reviewMsg && <p style={{ color: 'green', fontSize: '14px' }}>{this.state.reviewMsg}</p>}

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button onClick={this.handleCloseReviewModal} style={{ padding: '8px 20px', borderRadius: '6px', border: '1px solid #ddd', background: 'white' }}>Cancel</button>
                        <button onClick={this.submitReview} disabled={this.state.submittingReview} style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#111827', color: 'white' }}>
                            {this.state.submittingReview ? "Submitting..." : "Post Review"}
                        </button>
                    </div>
                </div>
            </div>
        )}
        <ProductFooter />
      </>
    );
  }
}

export default withRouter(UserProfile);
