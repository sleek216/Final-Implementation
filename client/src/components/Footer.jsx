import React, { Component } from "react";

class Footer extends Component {
  render() {
    const brands = [
      "MINIMEHR", "RAHMEER", "XENIQUE",
      "ZARQ", "KINGSWARD", "AURA", "LUMINA",
      "PRISM", "GULNAAR", "OPULENCE"
    ];

    // Create the scrolling content
    const marqueeContent = (
      <>
        {brands.map((brand, index) => (
          <span key={index}>{brand}</span>
        ))}
      </>
    );

    return (
      <footer className="footer">
        <div className="footer-marquee-container">
          <div className="footer-marquee-track">
            {marqueeContent}
            {marqueeContent} {/* Duplicate for seamless scroll */}
            {marqueeContent} {/* Triplicate for wide screens if needed */}
          </div>
        </div>

        <div className="location">
          BASED IN PAKISTAN <br />
          © 2026 FashionVerse Inc.
        </div>
      </footer>
    );
  }
}

export default Footer;
