import React, { Component } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/images/logo.jpg";
import { CartContext } from "../context/CartContext";
import wishlistIcon from "../assets/icons/my-wish-list.png";
import bagIcon from "../assets/icons/shopping-bag.svg";
import userIcon from "../assets/icons/person.svg";
import searchIcon from "../assets/icons/search.svg";

const prefetchMallModel = () => {
  if (document.querySelector('link[data-mall-prefetch="model"]')) return;
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "fetch";
  link.href = "/models/mall/mall_model_web.glb";
  link.crossOrigin = "anonymous";
  link.dataset.mallPrefetch = "model";
  document.head.appendChild(link);
};

class StoreNavbar extends Component {

  /* 🔥 CartContext attach */
  static contextType = CartContext;

  state = {
    menuOpen: false,
  };

  toggleMenu = () => {
    this.setState({ menuOpen: !this.state.menuOpen });
  };

  render() {
    const { cart, toggleCart } = this.context;

    // total quantity count
    const count = cart.reduce((total, item) => total + item.qty, 0);

    // 🔐 Get auth state
    const token = localStorage.getItem("token");
    const role = (localStorage.getItem("role") || "").toLowerCase();

    return (
      <header className="store-navbar">

        <div className="nav-left-container">
          <Link to="/landingpage" className="nav-left">
            <img src={logo} alt="FashionVerse Logo" className="nav-logo-img" />
          </Link>
        </div>

        {/* CENTER */}
        <nav className={`nav-links ${this.state.menuOpen ? "open" : ""}`}>
          <Link to="/home" className="nav-link-item" onClick={this.toggleMenu}>Home</Link>
          <Link to="/brands" className="nav-link-item" onClick={this.toggleMenu}>Brands</Link>
          <Link to="/about" className="nav-link-item" onClick={this.toggleMenu}>About</Link>
          <Link to="/contact" className="nav-link-item" onClick={this.toggleMenu}>Contact</Link>
          <Link
            to="/unity-mall?spawn=entrance"
            className="sale nav-link-item"
            onClick={this.toggleMenu}
          >
            3D Mall
          </Link>
        </nav>

        {/* RIGHT ICONS */}
        <div className="nav-icons">
          <img
            src={searchIcon}
            alt="search"
            className="nav-icon"
          />

          {/* Wishlist */}
          <Link to="/wishlist">
            <img
              src={wishlistIcon}
              alt="Wishlist"
              className="nav-icon"
            />
          </Link>

          {/* Cart / Bag */}
          <div className="bag-icon" onClick={toggleCart}>
            <img
              src={bagIcon}
              alt="Cart"
              className="nav-icon"
            />

            {count > 0 && (
              <span className="bag-count">{count}</span>
            )}
          </div>

          {/* Auth Section */}
          {/* Auth: Login/Sign Out */}
          {!token ? (
            <Link to="/login" className="nav-login-btn">Login</Link>
          ) : (
            <button
              className="nav-logout-btn"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                localStorage.removeItem("user");
                window.location.href = "/home";
              }}
            >
              Sign Out
            </button>
          )}

          {/* Profile Icon */}
          <Link
            to={
              !token ? "/login" :
                (role === "admin") ? "/admin/dashboard" :
                  (role === "brand" || role === "brandowner") ? "/brand/dashboard" :
                    "/profile"
            }
            className="profile-link"
          >
            <img
              src={userIcon}
              alt="Profile"
              className="nav-icon"
            />
          </Link>
        </div>

      </header>
    );
  }
}

export default StoreNavbar;
