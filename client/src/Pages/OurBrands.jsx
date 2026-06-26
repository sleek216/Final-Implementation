import React, { useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import StoreNavbar from "../components/StoreNavbar";
import ProductFooter from "../components/ProductFooter";
import Breadcrumbs from "../components/Breadcrumbs";
import "../styles/OurBrands.css";
import "../styles/Home.css";

export default function OurBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .get("/brand/approved")
      .then((res) => {
        if (mounted) setBrands(res.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => mounted && setLoading(false));

    return () => (mounted = false);
  }, []);

  if (loading) {
    return (
      <div className="our-brands-loading" style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        fontFamily: "'Playfair Display', serif",
        fontSize: "24px",
        color: "#1e293b",
        gap: "16px"
      }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{
          width: "48px",
          height: "48px",
          color: "#0f172a",
          animation: "scanSearch 1.5s infinite ease-in-out"
        }}>
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span style={{ letterSpacing: "1px", fontWeight: "300" }}>Searching Brands...</span>
        <style>{`
          @keyframes scanSearch {
            0% { transform: translate(-5px, -5px) scale(1); }
            50% { transform: translate(5px, 5px) scale(1.1); }
            100% { transform: translate(-5px, -5px) scale(1); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <StoreNavbar />

      <section className="ourbrands-page-section">
        <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 4%' }}>
          <Breadcrumbs paths={[
            { label: "Home", url: "/home" },
            { label: "Our Brands", url: "" }
          ]} />
        </div>
        <div className="ourbrands-page-header">
          <p className="ourbrands-page-subtitle">CURATED EXCELLENCE</p>
          <h2 className="ourbrands-page-title">Our Brands</h2>
        </div>

        <div className="ourbrands-grid">
          {brands.map((b, i) => (
            <div key={b._id || i} className="ourbrands-card-wrapper">
              <div className="ourbrands-card">
                <div
                  className="ourbrands-card-bg"
                  style={{
                    backgroundImage: b.logo
                      ? `url(http://localhost:5005/uploads/${b.logo})`
                      : "",
                  }}
                >
                  {!b.logo && (
                    <span className="ourbrands-card-initial">
                      {b.name?.charAt(0)}
                    </span>
                  )}
                </div>

                <div className="ourbrands-card-overlay">
                  <div className="ourbrands-card-info">
                    <h3>{b.name}</h3>
                    <span className="ourbrands-card-label">
                      {b.tagline || "Premium Collection"}
                    </span>
                  </div>
                  <div className="ourbrands-card-actions">
                    <Link
                      to={`/brand/${b._id}`}
                      className="action-btn-mini btn-2d-mini"
                    >
                      2D
                    </Link>
                    <button
                      className="action-btn-mini btn-3d-mini"
                      onClick={() => toast.info("3D Store coming soon! ✨")}
                    >
                      3D
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ProductFooter />
    </>
  );
}
