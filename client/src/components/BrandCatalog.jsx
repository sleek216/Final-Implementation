import React, { Component } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api";

class BrandCatalog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      brands: [],
      loading: true
    };
    this.scrollRef = React.createRef();
    this.autoScrollInterval = null;
  }

  async componentDidMount() {
    try {
      const res = await api.get("/brand/approved");
      this.setState({ brands: res.data, loading: false });
    } catch (err) {
      console.error("Failed to fetch brands:", err);
      this.setState({ loading: false });
    }

    // Auto-scroll every 5 seconds
    this.autoScrollInterval = setInterval(() => {
      this.autoScroll();
    }, 5000);
  }

  componentWillUnmount() {
    // Clear interval when component unmounts
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
    }
  }

  autoScroll = () => {
    const container = this.scrollRef.current;
    if (container) {
      const scrollAmount = 300;
      const maxScroll = container.scrollWidth - container.clientWidth;

      // If we're at the end, scroll back to start
      if (container.scrollLeft >= maxScroll - 10) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  scroll = (direction) => {
    const container = this.scrollRef.current;
    if (container) {
      const scrollAmount = 300;
      if (direction === "left") {
        container.scrollLeft -= scrollAmount;
      } else {
        container.scrollLeft += scrollAmount;
      }
    }
  };

  render() {
    const { brands, loading } = this.state;

    if (loading) {
      return (
        <section className="brand-section" id="brands" style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{
              width: "24px",
              height: "24px",
              color: "#0f172a",
              animation: "scanSearch 1.5s infinite ease-in-out"
            }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span style={{ fontSize: "16px", color: "#64748b", fontFamily: "sans-serif" }}>Searching Brands...</span>
          </div>
          <style>{`
            @keyframes scanSearch {
              0% { transform: translate(-3px, -3px) scale(1); }
              50% { transform: translate(3px, 3px) scale(1.1); }
              100% { transform: translate(-3px, -3px) scale(1); }
            }
          `}</style>
        </section>
      );
    }

    return (
      <section className="brand-section" id="brands">
        <p className="brand-section-subtitle">Curated Excellence</p>
        <h2>Our Brands</h2>

        <div className="brand-container">
          <div className="brand-scroll snap-x" ref={this.scrollRef}>
            {brands.map((b, i) => (
              <div key={i} className="brand-card-wrapper">
                <div className="modern-brand-card">
                  <div className="card-background-image" style={{
                    backgroundImage: b.logo ? `url(http://localhost:5005/uploads/${b.logo})` : 'none',
                    backgroundColor: b.logo ? 'transparent' : '#f5efe6'
                  }}>
                    {!b.logo && <span className="brand-placeholder-letter">{b.name.charAt(0)}</span>}
                  </div>

                  <div className="card-overlay">
                    <div className="card-info">
                      <h3>{b.name}</h3>
                      <p className="brand-label">Premium Collection</p>
                    </div>
                    <div className="card-actions-overlay">
                      <Link to={`/brand/${b._id}`} className="action-btn-mini btn-2d-mini">
                        2D
                      </Link>
                      <button className="action-btn-mini btn-3d-mini" onClick={() => toast.info("3D Store coming soon! ✨")}>
                        3D
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
}

export default BrandCatalog;
