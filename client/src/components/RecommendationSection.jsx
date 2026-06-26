import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WishlistContext } from '../context/WishlistContext';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import '../styles/RecommendationSection.css';

const RecommendationSection = ({ products, loading, title }) => {
    const navigate = useNavigate();
    const scrollRef = useRef(null);
    const autoScrollRef = useRef(null);

    // Safe array conversion
    let productList = [];
    if (Array.isArray(products)) {
        productList = products;
    } else if (products && Array.isArray(products.most_viewed)) {
        productList = products.most_viewed;
    } else if (products && Array.isArray(products.related_products)) {
        productList = products.related_products;
    } else if (products && Array.isArray(products.data)) {
        productList = products.data;
    }

    // Auto-scroll like New Arrivals
    useEffect(() => {
        autoScrollRef.current = setInterval(() => {
            const container = scrollRef.current;
            if (container) {
                const maxScroll = container.scrollWidth - container.clientWidth;
                if (container.scrollLeft >= maxScroll - 10) {
                    container.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    container.scrollBy({ left: 300, behavior: 'smooth' });
                }
            }
        }, 4000);

        return () => {
            if (autoScrollRef.current) {
                clearInterval(autoScrollRef.current);
            }
        };
    }, []);

    if (loading) {
        return (
            <section className="product-section rec-section">
                <h2>{title}</h2>
                <p style={{ textAlign: 'center', color: '#888' }}>Loading recommendations...</p>
            </section>
        );
    }

    if (productList.length === 0) {
        return null;
    }

    const getImageSrc = (product) => {
        if (!product.image) return "https://via.placeholder.com/300x400?text=No+Image";
        return product.image.startsWith('http') ? product.image : `http://localhost:5005/uploads/${product.image}`;
    };

    return (
        <WishlistContext.Consumer>
            {({ isInWishlist, toggleWishlist }) => (
                <section className="product-section rec-section">
                    <h2>{title}</h2>
                    <div className="brand-container" style={{ position: 'relative' }}>
                        <div
                            className="brand-scroll product-grid rec-scroll-row"
                            ref={scrollRef}
                            style={{
                                display: 'flex',
                                overflowX: 'auto',
                                scrollBehavior: 'smooth',
                                gap: '20px',
                                padding: '10px 0',
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none'
                            }}
                        >
                            {productList.map((product) => {
                                const isFav = isInWishlist(product.product_id);
                                return (
                                    <div
                                        className="product-card"
                                        key={product.product_id}
                                        onClick={() => navigate(`/product/${product.product_id}`)}
                                        style={{ flex: '0 0 auto', width: '280px', position: 'relative' }}
                                    >
                                        <img
                                            src={getImageSrc(product)}
                                            alt={product.product_name}
                                            style={{ width: '100%', height: '350px', objectFit: 'cover', objectPosition: 'top', borderRadius: '8px' }}
                                            onError={(e) => { e.target.src = "https://via.placeholder.com/300x400?text=No+Image"; }}
                                        />
                                        <div className="product-card-content">
                                            <span>{product.brand_name || 'FashionVerse'}</span>
                                            <h4>{product.product_name}</h4>
                                            {product.rating && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '-2px' }}>
                                                    <span style={{ color: '#f5a623', fontSize: '14px' }}>{'★'.repeat(Math.round(product.rating))}</span>
                                                    <span style={{ fontSize: '12px', color: '#888' }}>({product.rating})</span>
                                                </div>
                                            )}
                                            <div className="price-wishlist-row">
                                                <p>Rs. {product.price?.toLocaleString()}</p>
                                                <div className={`wishlist-icon-inline ${isFav ? 'active' : ''}`} onClick={(e) => {
                                                    e.stopPropagation();
                                                    const token = localStorage.getItem("token");
                                                    const role = localStorage.getItem("role");
                                                    if (!token || role !== 'customer') {
                                                        navigate("/login?redirectTo=" + encodeURIComponent(window.location.pathname));
                                                        return;
                                                    }
                                                    toggleWishlist(product);
                                                }}>
                                                    {isFav ? <AiFillHeart color="#e31b23" /> : <AiOutlineHeart />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}
        </WishlistContext.Consumer>
    );
};

export default RecommendationSection;