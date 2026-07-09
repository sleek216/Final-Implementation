import React, { useState, useEffect, useContext } from "react";
import api from "../api";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../styles/ComparisonModal.css";
import { CartContext } from "../context/CartContext";

const ComparisonModal = ({ mainProduct, onClose }) => {
    const navigate = useNavigate();
    const { addToCart, toggleCart } = useContext(CartContext);

    const [brands, setBrands] = useState([]);
    const [selectedBrandIds, setSelectedBrandIds] = useState([]);
    const [brandProductsMap, setBrandProductsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [modalMode, setModalMode] = useState("brands"); // "brands" or "products"
    const [carouselIndices, setCarouselIndices] = useState({});

    useEffect(() => {
        if (mainProduct?._id) {
            fetchComparisonBrands();
        }
    }, [mainProduct]);

    const fetchComparisonBrands = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/products/compare/${mainProduct._id}/brands`);
            setBrands(res.data || []);
        } catch (err) {
            console.error("Error fetching comparison brands:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleBrandSelection = (brandId) => {
        setSelectedBrandIds(prev => 
            prev.includes(brandId) 
                ? prev.filter(id => id !== brandId) 
                : [...prev, brandId]
        );
    };

    const handleCompareSelected = async () => {
        if (selectedBrandIds.length === 0) {
            toast.error("Please select at least one brand to compare.");
            return;
        }

        setLoading(true);
        try {
            // Group products by brand
            const productsMap = {};
            for (const brandId of selectedBrandIds) {
                const res = await api.get(`/products/compare/${mainProduct._id}/products`, {
                    params: { brandIds: brandId }
                });
                productsMap[brandId] = res.data || [];
            }
            setBrandProductsMap(productsMap);
            setModalMode("products");
        } catch (err) {
            console.error("Error fetching comparison products:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToBag = (product) => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token || role !== 'customer') {
            toast.error("Please login to add items to your bag.");
            onClose(); // Close modal to allow navigation
            navigate("/login?redirectTo=" + encodeURIComponent(window.location.pathname));
            return;
        }

        const formattedProduct = {
            ...product,
            id: product._id,
            _id: product._id,
            name: product.name,
            price: product.price,
            image: product.images?.[0] ? (product.images[0].startsWith('http') ? product.images[0] : `http://localhost:5005/uploads/${product.images[0]}`) : product.image,
            images: product.images || [],
            quantity: 1, // Default quantity for comparison add
            selectedSize: product.sizes?.[0] || "Standard", 
            selectedColor: product.colors?.[0] || "Standard"
        };
        
        addToCart(formattedProduct);
        toggleCart();
    };

    const navigateToBrand = (brandId) => {
        onClose();
        navigate(`/brand/${brandId}`);
    };

    const handleNextProduct = (brandId, total) => {
        setCarouselIndices(prev => ({
            ...prev,
            [brandId]: ((prev[brandId] || 0) + 1) % total
        }));
    };

    const handlePrevProduct = (brandId, total) => {
        setCarouselIndices(prev => ({
            ...prev,
            [brandId]: ((prev[brandId] || 0) - 1 + total) % total
        }));
    };

    return (
        <div className="comp-modal-overlay">
            <div className="comp-modal-container luxe-modal">
                <div className="comp-modal-header luxe-header">
                    <div className="header-text">
                        <h2>Compare & Discover</h2>
                        <p>
                            {brands.length > 0 
                                ? `We found ${brands.length} brands with similar items for your ${mainProduct?.name}`
                                : `Exploring similar collections for ${mainProduct?.name}`
                            }
                        </p>
                    </div>
                    <button className="comp-modal-close" onClick={onClose} aria-label="Close">✕</button>
                </div>

                <div className="comp-modal-body luxe-body">
                    {loading ? (
                        <div className="luxe-loading">
                            <div className="spinner"></div>
                            <p>Analyzing collections and matching styles...</p>
                        </div>
                    ) : modalMode === "brands" ? (
                        <>
                            <div className="selection-instruction">
                                <h3>Step 1: Select brands to compare</h3>
                                <p>Choose one or more brands to see their matching products side-by-side with yours.</p>
                            </div>
                            <div className="brands-selection-grid">
                                {brands.length > 0 ? brands.map((brand) => (
                                    <div 
                                        key={brand._id} 
                                        className={`brand-choice-card ${selectedBrandIds.includes(brand._id) ? 'active' : ''}`}
                                        onClick={() => toggleBrandSelection(brand._id)}
                                    >
                                        <div className="custom-checkbox-container">
                                            <div className={`pretty-checkbox ${selectedBrandIds.includes(brand._id) ? 'checked' : ''}`}>
                                                {selectedBrandIds.includes(brand._id) && <span>✓</span>}
                                            </div>
                                        </div>
                                        <div className="logo-box">
                                            <img
                                                src={brand.logo ? `http://localhost:5005/uploads/${brand.logo}` : "https://via.placeholder.com/100"}
                                                alt={brand.name}
                                            />
                                        </div>
                                        <h4>{brand.name}</h4>
                                    </div>
                                )) : (
                                    <div className="no-brands-available">
                                        <div className="empty-icon" style={{fontSize: '3rem', marginBottom: '20px'}}>✨</div>
                                        <p>No other brands currently have similar products in this specific category.</p>
                                        <button className="back-btn-mini" style={{marginTop: '20px'}} onClick={onClose}>Continue Shopping</button>
                                    </div>
                                )}
                            </div>
                            {brands.length > 0 && (
                                <div className="modal-footer-actions">
                                    <button 
                                        className="btn-luxe-primary" 
                                        disabled={selectedBrandIds.length === 0}
                                        onClick={handleCompareSelected}
                                    >
                                        Compare Selected Brands ({selectedBrandIds.length})
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="comparison-results-view">
                            <div className="comparison-layout-grid">
                                {/* LEFT: MAIN PRODUCT (FIXED) */}
                                <div className="main-product-column">
                                    <div className="sticky-main-product">
                                        <div className="main-product-badge">YOUR PRODUCT</div>
                                        <img 
                                            src={mainProduct.images?.[0] 
                                                ? (mainProduct.images[0].startsWith('http') ? mainProduct.images[0] : `http://localhost:5005/uploads/${mainProduct.images[0]}`)
                                                : (mainProduct.image?.startsWith('http') ? mainProduct.image : `http://localhost:5005/uploads/${mainProduct.image}`)
                                            } 
                                            alt={mainProduct.name} 
                                            onError={(e) => { e.target.src = "https://via.placeholder.com/300x400?text=Image+Not+Found"; }}
                                            onClick={() => {
                                                onClose();
                                                navigate(`/product/${mainProduct.productId || mainProduct._id}`, { state: { product: mainProduct, fromComparison: true, mainProductId: mainProduct.productId || mainProduct._id } });
                                            }}
                                            style={{ cursor: "pointer" }}
                                            title="View Details"
                                        />
                                        <div className="main-info">
                                            <h4>{mainProduct.name}</h4>
                                            <span className="price">Rs. {mainProduct.price?.toLocaleString()}</span>
                                            <div className="main-details">
                                                <span>Category: {mainProduct.category}</span>
                                                <span>Colors: {mainProduct.colors?.join(", ")}</span>
                                            </div>
                                        </div>
                                        <button className="back-btn-luxe" onClick={() => setModalMode("brands")}>
                                            ← Back to Brands
                                        </button>
                                    </div>
                                </div>

                                {/* RIGHT: MATCHING PRODUCTS (SCROLLABLE COLUMNS) */}
                                <div className="matching-products-column">
                                    <div className="brands-columns-container">
                                        {selectedBrandIds.map(brandId => {
                                            const brand = brands.find(b => b._id === brandId);
                                            const products = brandProductsMap[brandId] || [];
                                            const activeIndex = carouselIndices[brandId] || 0;
                                            const hasMultiple = products.length > 1;
                                            const activeProduct = products[activeIndex];
                                            
                                            return (
                                                <div key={brandId} className="brand-comparison-column">
                                                    <div className="column-brand-profile">
                                                        <img 
                                                            src={brand.logo 
                                                                ? (brand.logo.startsWith('http') ? brand.logo : `http://localhost:5005/uploads/${brand.logo}`)
                                                                : "https://via.placeholder.com/60"
                                                            } 
                                                            alt={brand.name} 
                                                        />
                                                        <div className="brand-column-info">
                                                            <h4>{brand.name}</h4>
                                                            <span className="match-badge">{products.length} Items Match</span>
                                                        </div>
                                                        <button className="view-brand-btn" onClick={() => navigateToBrand(brandId)}>Visit Store</button>
                                                    </div>
                                                    
                                                    <div className="column-products-carousel">
                                                        {products.length > 0 ? (
                                                            <div className="carousel-product-wrapper">
                                                                {hasMultiple && (
                                                                    <button 
                                                                        className="carousel-arrow prev-arrow" 
                                                                        onClick={() => handlePrevProduct(brandId, products.length)}
                                                                        aria-label="Previous product"
                                                                    >
                                                                        ‹
                                                                    </button>
                                                                )}
                                                                
                                                                <div className="comp-product-luxe-card">
                                                                    <div className="luxe-card-media">
                                                                        <img 
                                                                            src={activeProduct.images?.[0] 
                                                                                ? (activeProduct.images[0].startsWith('http') ? activeProduct.images[0] : `http://localhost:5005/uploads/${activeProduct.images[0]}`)
                                                                                : (activeProduct.image?.startsWith('http') ? activeProduct.image : `http://localhost:5005/uploads/${activeProduct.image}`)
                                                                            } 
                                                                            alt={activeProduct.name} 
                                                                            onError={(e) => { e.target.src = "https://via.placeholder.com/200x240?text=No+Image"; }}
                                                                        />
                                                                        <div className="luxe-hover-overlay">
                                                                            <button className="overlay-btn view" onClick={() => {
                                                                                onClose();
                                                                                navigate(`/product/${activeProduct.productId || activeProduct._id}`, { state: { product: activeProduct, fromComparison: true, mainProductId: mainProduct.productId || mainProduct._id } });
                                                                            }}>View Details</button>
                                                                            <button className="overlay-btn bag" onClick={() => handleAddToBag(activeProduct)}>Add to Bag</button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="luxe-card-info">
                                                                        <h5>{activeProduct.name}</h5>
                                                                        <span className="luxe-price">Rs. {activeProduct.price?.toLocaleString()}</span>
                                                                    </div>
                                                                </div>

                                                                {hasMultiple && (
                                                                    <button 
                                                                        className="carousel-arrow next-arrow" 
                                                                        onClick={() => handleNextProduct(brandId, products.length)}
                                                                        aria-label="Next product"
                                                                    >
                                                                        ›
                                                                    </button>
                                                                )}

                                                                {hasMultiple && (
                                                                    <div className="carousel-indicator-bar">
                                                                        <div className="carousel-dots">
                                                                            {products.map((_, idx) => (
                                                                                <span 
                                                                                    key={idx} 
                                                                                    className={`dot ${idx === activeIndex ? 'active' : ''}`}
                                                                                    onClick={() => setCarouselIndices(prev => ({ ...prev, [brandId]: idx }))}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                        <span className="carousel-count-text">{activeIndex + 1} of {products.length}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="no-row-items">No exact matches found for this brand in the same color.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ComparisonModal;
