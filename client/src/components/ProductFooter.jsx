import React, { Component } from "react";
import { Link } from "react-router-dom";

class ProductFooter extends Component {
  render() {
    return (
      <footer className="fv-footer">
        <div className="fv-footer-wrapper">

          {/* Brand */}
          <div className="fv-footer-col">
            <h2 className="fv-footer-logo">FashionVerse</h2>
            <p className="fv-footer-desc">
              A premium fashion marketplace delivering curated styles
              with a modern editorial aesthetic.
            </p>
          </div>

          {/* Quick Links */}
          <div className="fv-footer-col">
            <h4 className="fv-footer-title">Explore</h4>
            <Link to="/home">Shop</Link>
            <Link to="/home">New Arrivals</Link>
            <Link to="/home">Collections</Link>
          </div>

          {/* Support */}
          <div className="fv-footer-col">
            <h4 className="fv-footer-title">Support</h4>
            <Link to="/contact">Contact</Link>
            <Link to="/about">About Us</Link>
            <a href="#">FAQs</a>
          </div>

          {/* Social */}
          <div className="fv-footer-col">
            <h4 className="fv-footer-title">Follow</h4>
            <div className="fv-footer-social">
              <a href="#">Instagram</a>
              <a href="#">Facebook</a>
              <a href="#">Twitter</a>
            </div>
          </div>

        </div>

        {/* Bottom */}
        <div className="fv-footer-bottom">
          © 2024 FashionVerse · Pakistan
        </div>
      </footer>
    );
  }
}

export default ProductFooter;
