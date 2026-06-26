import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import StoreNavbar from "../components/StoreNavbar";
import ProductFooter from "../components/ProductFooter";
import Breadcrumbs from "../components/Breadcrumbs";
import api from "../api";
import "../styles/BrandProducts.css";
import { WishlistContext } from "../context/WishlistContext";
import { CartContext } from "../context/CartContext";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { FiFilter, FiRefreshCw, FiSearch } from "react-icons/fi";

const BrandProducts = () => {
  const { brandId } = useParams();
  const navigate = useNavigate();
  const [brandData, setBrandData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [minRating, setMinRating] = useState("Any Rating");
  const [maxPrice, setMaxPrice] = useState(100000);
  const [selectedSubCategory, setSelectedSubCategory] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const { toggleWishlist, isInWishlist } = useContext(WishlistContext);
  const { addToCart, toggleCart } = useContext(CartContext);

  useEffect(() => {
    fetchBrandAndProducts();
  }, [brandId]);

  const fetchBrandAndProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!brandId || brandId === "undefined") {
        setError("Brand ID is invalid or not provided.");
        setLoading(false);
        return;
      }

      const brandRes = await api.get(`/brand/${brandId}`);
      setBrandData(brandRes.data);

      const prodRes = await api.get(`/products?brand=${brandId}`);
      setProducts(prodRes.data.products || []);

    } catch (err) {
      console.error("Error fetching brand data:", err);
      setError("Failed to load brand data. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product) => {
    const formattedProduct = {
      ...product,
      id: product._id,
      image: product.images?.[0] ? `http://localhost:5005/uploads/${product.images[0]}` : "",
      images: product.images?.map(img => `http://localhost:5005/uploads/${img}`) || []
    };

    navigate(`/product/${product.productId || product._id}`, {
      state: { product: formattedProduct },
    });
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedSubCategory("All"); // Reset subcategory when category changes
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedSubCategory("All");
    setMinRating("Any Rating");
    setMaxPrice(100000);
    setSortBy("default");
  };

  if (loading) {
    return (
      <>
        <StoreNavbar />
        <div className="brand-loading" style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "450px",
          textAlign: "center",
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
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: "300", color: "#1e293b" }}>Searching Brand...</h2>
          <style>{`
            @keyframes scanSearch {
              0% { transform: translate(-5px, -5px) scale(1); }
              50% { transform: translate(5px, 5px) scale(1.1); }
              100% { transform: translate(-5px, -5px) scale(1); }
            }
          `}</style>
        </div>
        <ProductFooter />
      </>
    );
  }

  if (error || !brandData) {
    return (
      <>
        <StoreNavbar />
        <div className="brand-error" style={{ padding: "100px", textAlign: "center", color: "red" }}>
          <h2>{error || "Brand not found"}</h2>
        </div>
        <ProductFooter />
      </>
    );
  }

  const availableCategories = ["Men", "Women", "Kids"];
  
  const filteredProducts = products.filter((p) => {
    // Search
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Category
    if (selectedCategory !== "All" && p.category !== selectedCategory) {
      return false;
    }
    // SubCategory
    if (selectedSubCategory !== "All" && p.subCategory !== selectedSubCategory) {
      return false;
    }
    // Rating
    if (minRating !== "Any Rating") {
      const ratingVal = parseInt(minRating);
      if ((p.rating || 0) < ratingVal) return false;
    }
    // Price
    if (p.price > maxPrice) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "rating-desc") return (b.rating || 0) - (a.rating || 0);
    if (sortBy === "alpha-asc") return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <>
      <StoreNavbar />
      <main className="brand-products-container">
        {/* Brand Hero Section - Luxe Style */}
        <section
          className="brand-hero"
          style={{
            backgroundImage: brandData.heroImage
              ? `url(http://localhost:5005/uploads/brands/${brandData.heroImage})`
              : brandData.bannerImage
                ? `url(http://localhost:5005/uploads/${brandData.bannerImage})`
                : 'none',
          }}
        >
          <div className="brand-hero-content">
            <div className="brand-header-info">
              <p className="brand-tagline">Exclusive Collection</p>
              <h1>{brandData.name}</h1>
              <button
                className="btn-explore"
                onClick={() => {
                  const section = document.getElementById("featured-products-section");
                  if (section) {
                    section.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                Shop the Brand
              </button>
            </div>
          </div>
        </section>

        {/* Brand Content */}
        <section className="brand-products-content">
          <div className="breadcrumb-wrapper">
            <Breadcrumbs paths={[
              { label: "Home", url: "/home" },
              { label: "Our Brands", url: "/brands" },
              { label: brandData.name, url: "" }
            ]} />
          </div>

          {/* Search Bar - Aesthetic Redesign */}
          <div className="brand-search-section">
            <div className="brand-search-bar">
              <FiSearch className="brand-search-icon" />
              <input
                type="text"
                placeholder={`Looking for something specific in ${brandData.name}?`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="brand-search-input"
              />
              {searchQuery && (
                <button className="brand-search-clear" onClick={() => setSearchQuery("")}>✕</button>
              )}
            </div>
          </div>

          <div className="brand-shop-layout" id="featured-products-section">
            {/* Left Sidebar - Filters */}
            <aside className="filters-sidebar">
              <div className="filters-header">
                <FiFilter className="filter-icon"/>
                <h3>Filters</h3>
              </div>
              
              <div className="filter-group">
                <label>Sort Products</label>
                <div className="custom-select-wrapper">
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="default">Newest Arrivals</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating-desc">Highest Rated</option>
                    <option value="alpha-asc">A to Z</option>
                  </select>
                </div>
              </div>

              <div className="filter-group">
                <label>Category</label>
                <div className="custom-select-wrapper">
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    <option value="All">All Categories</option>
                    {[...new Set(products.map(p => p.category))].filter(Boolean).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedCategory !== "All" && (
                <div className="filter-group">
                  <label>Sub Category</label>
                  <div className="custom-select-wrapper">
                    <select 
                      value={selectedSubCategory} 
                      onChange={(e) => setSelectedSubCategory(e.target.value)}
                    >
                      <option value="All">All Sub Categories</option>
                      {[...new Set(products.filter(p => p.category === selectedCategory).map(p => p.subCategory))].filter(Boolean).map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="filter-group">
                <label>Rating</label>
                <div className="custom-select-wrapper">
                  <select 
                    value={minRating}
                    onChange={(e) => setMinRating(e.target.value)}
                  >
                    <option value="Any Rating">Any Rating</option>
                    <option value="4">4 Stars & Above</option>
                    <option value="3">3 Stars & Above</option>
                    <option value="2">2 Stars & Above</option>
                    <option value="1">1 Star & Above</option>
                  </select>
                </div>
              </div>

              <div className="filter-group">
                <label>Price Range: Up to Rs. {maxPrice.toLocaleString()}</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100000" 
                  step="1000"
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(Number(e.target.value))} 
                  className="price-slider"
                />
                <div className="slider-labels">
                  <span>Rs. 0</span>
                  <span>Rs. 100k</span>
                </div>
              </div>

              <button className="btn-reset-filters" onClick={resetFilters}>
                <FiRefreshCw /> Reset All Filters
              </button>
            </aside>

            {/* Right Main Content - Products */}
            <div className="products-main-content">
              <div className="products-header">
                <h2>{selectedCategory === "All" ? "Full Collection" : `${selectedCategory} Collection`}</h2>
                <span className="products-count">{filteredProducts.length} pieces found</span>
              </div>
              <div className="products-grid">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <div key={product._id} className="product-card" onClick={() => handleProductClick(product)}>
                      <div className="product-image">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={`http://localhost:5005/uploads/${product.images[0]}`}
                            alt={product.name}
                            loading="lazy"
                            onError={(e) => { e.target.src = "https://via.placeholder.com/400x500?text=No+Image"; }}
                          />
                        ) : (
                          <div className="image-placeholder"></div>
                        )}

                        <div className="product-overlay">
                          <button className="btn-quick-view">Quick View</button>
                          <button className="btn-add-cart" onClick={(e) => {
                            e.stopPropagation();
                            const token = localStorage.getItem("token");
                            const role = localStorage.getItem("role");

                            if (!token || role !== 'customer') {
                              toast.error("Please login as a customer to add items to cart");
                              navigate("/login?redirectTo=" + encodeURIComponent(window.location.pathname));
                              return;
                            }

                            const formattedProduct = {
                              ...product,
                              id: product._id,
                              image: product.images?.[0] ? `http://localhost:5005/uploads/${product.images[0]}` : "",
                              images: product.images?.map(img => `http://localhost:5005/uploads/${img}`) || []
                            };

                            addToCart(formattedProduct);
                            toggleCart();
                          }}>Add to Bag</button>
                        </div>
                      </div>
                      <div className="product-info">
                        <h4>{product.name}</h4>
                        <div className="price-wishlist-row">
                          <p className="product-price">Rs. {product.price?.toLocaleString()}</p>
                          <div className={`wishlist-icon-inline ${isInWishlist(product._id) ? 'active' : ''}`} onClick={(e) => {
                            e.stopPropagation();
                            const token = localStorage.getItem("token");
                            const role = localStorage.getItem("role");

                            if (!token || role !== 'customer') {
                              navigate("/login?redirectTo=" + encodeURIComponent(window.location.pathname));
                              return;
                            }

                            toggleWishlist(product);
                          }}>
                            {isInWishlist(product._id) ? <AiFillHeart color="#ef4444" /> : <AiOutlineHeart />}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-products-found">
                    <div className="empty-state-icon">✨</div>
                    <p>No pieces found matching your specific filters.</p>
                    <button className="btn-primary" onClick={resetFilters}>View All Pieces</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <ProductFooter />
    </>
  );
};

export default BrandProducts;
