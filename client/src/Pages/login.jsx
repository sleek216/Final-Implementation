import React, { useState, useContext } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import "../styles/Auth.css";
import api from "../api";
import logo from "../assets/images/logo.png";
import loginImage from "../assets/images/login-image.jpeg";
import { CartContext } from "../context/CartContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  // 🔹 state for inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { addToCart, setBuyNowItem, toggleCart } = useContext(CartContext);

  // 🔹 REAL LOGIN HANDLER
  const handleLogin = async () => {
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!password) {
      toast.error("Password is required");
      return;
    }

    try {
      const res = await api.post("/auth/login", {
        email,
        password
      });

      // 🔹 token & role save
      // 🔹 Store token, role, and full user object
      const user = res.data.user;
      let role = user.role.toLowerCase();

      // Normalize 'user' role to 'customer' for frontend consistency
      if (role === "user") role = "customer";

      console.log("Login Success. User Role (normalized):", role);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", role);
      localStorage.setItem("user", JSON.stringify(user));
      
      const isNewUser = localStorage.getItem("justRegistered");
      if (isNewUser) {
        toast.success(`Welcome to FashionVerse, ${user.name || 'User'}!`);
        localStorage.removeItem("justRegistered");
      } else {
        toast.success(`Welcome back, ${user.name || 'User'}!`);
      }

      // 🔹 role based redirect & resume pending action
      if (role === "admin") {
        navigate("/admin/dashboard");
        return;
      }

      if (role === "brand" || role === "brandowner") {
        navigate("/brand/dashboard");
        return;
      }

      // Process any pending action saved before login
      try {
        const pendingRaw = localStorage.getItem('pendingAction');
        if (pendingRaw && role === 'customer') {
          const pending = JSON.parse(pendingRaw);
          if (pending?.action === 'addToBag' && pending.product) {
            addToCart({
              ...pending.product,
              selectedSize: pending.product.selectedSize,
              selectedColor: pending.product.selectedColor,
              quantity: pending.product.quantity
            });
            toggleCart();
            localStorage.removeItem('pendingAction');
            navigate(redirectTo || "/home");
            return;
          }

          if (pending?.action === 'buyNow' && pending.product) {
            setBuyNowItem({
              ...pending.product,
              selectedSize: pending.product.selectedSize,
              selectedColor: pending.product.selectedColor,
              qty: pending.product.quantity
            });
            localStorage.removeItem('pendingAction');
            navigate('/checkout/shipping');
            return;
          }
        }
      } catch (e) {
        console.error('Error processing pending action', e);
      }

      // Default customer redirect
      navigate(redirectTo || "/home");

    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid email or password");
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <Link to="/home" className="login-logo">
          <img src={logo} alt="FashionVerse Logo" className="login-logo-img" />
        </Link>
        <img
          src={loginImage}
          alt="Fashion Model"
          className="login-model-image"
        />
      </div>

      <div className="login-right">
        <div className="login-form-container">
          <h1 className="login-title">Login</h1>
          <p className="login-subtitle">Access your curated collection and exclusive pieces.</p>

          <div className="login-form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
            />
          </div>
          <div className="login-form-group">
            <div className="login-label-row">
              <label>Password</label>
              <Link to="/forgot-password" className="login-forgot">Forgot?</Link>
            </div>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input password-field"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button onClick={handleLogin} className="login-button">
            Login
          </button>

          <p className="login-signup-text">
            New to FashionVerse? <Link to="/register" className="login-signup-link">Register Now</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
