import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import StoreNavbar from "../components/StoreNavbar";
import ProductFooter from "../components/ProductFooter";
import Breadcrumbs from "../components/Breadcrumbs";
import { WishlistContext } from "../context/WishlistContext";
import { CartContext } from "../context/CartContext";
import { AiOutlineClose, AiFillHeart } from "react-icons/ai";
import "../styles/Home.css";
import "../styles/WishlistPage.css";

const WishlistPage = () => {
    const { wishlist, toggleWishlist } = useContext(WishlistContext);
    const { addToCart, toggleCart } = useContext(CartContext);
    const navigate = useNavigate();

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

    return (
        <div className="wishlist-page-wrapper">
            <StoreNavbar />

            <main className="wishlist-content">
                <Breadcrumbs paths={[{ label: "My Wishlist", url: "/wishlist" }]} />
                <h1 className="wishlist-title">My Wishlist</h1>

                {wishlist.length === 0 ? (
                    <div className="empty-wishlist">
                        <p>Your wishlist is currently empty.</p>
                        <button onClick={() => navigate("/home")} className="wishlist-explore-btn">
                            Explore Products
                        </button>
                    </div>
                ) : (
                    <div className="product-grid wishlist-grid">
                        {wishlist.map((product) => {
                            const mainImage = product.images?.[0] || product.image;
                            const imageUrl = (mainImage && typeof mainImage === 'string' && mainImage.startsWith("http"))
                                ? mainImage
                                : (mainImage ? `http://localhost:5005/uploads/${mainImage}` : "https://via.placeholder.com/300");

                            return (
                                <div
                                    key={product._id}
                                    className="product-card"
                                    onClick={() => handleProductClick(product)}
                                >
                                    {/* Cross button to remove from wishlist */}
                                    <button
                                        className="wishlist-remove-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleWishlist(product);
                                        }}
                                        title="Remove from wishlist"
                                    >
                                        <AiOutlineClose />
                                    </button>

                                    <div className="product-image" style={{ position: 'relative' }}>
                                        <img
                                            src={imageUrl}
                                            alt={product.name}
                                            style={{ objectPosition: 'top' }}
                                        />

                                        <div className="product-overlay">
                                            <button
                                                className="btn-quick-view"
                                                onClick={(e) => { e.stopPropagation(); handleProductClick(product); }}
                                            >
                                                Quick View
                                            </button>
                                            <button
                                                className="btn-add-cart"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const formatted = {
                                                        ...product,
                                                        id: product._id || product.id,
                                                        _id: product._id || product.id,
                                                        price: typeof product.price === 'string' ? parseFloat((product.price || '').toString().replace(/[Rs. ,]/g, "")) : product.price,
                                                        selectedSize: product.sizes?.[0] || "",
                                                        selectedColor: product.colors?.[0] || "",
                                                        quantity: 1
                                                    };
                                                    addToCart(formatted);
                                                    toggleCart();
                                                }}
                                            >
                                                Add to Cart
                                            </button>
                                        </div>
                                    </div>
                                    <div className="product-card-content">
                                        <span>
                                            {typeof product.brand === 'object' ? product.brand?.name : "FashionVerse"}
                                        </span>
                                        <h4>{product.name}</h4>
                                        <div className="price-wishlist-row">
                                            <p>Rs. {product.price?.toLocaleString()}</p>
                                            <div className="wishlist-icon-inline active">
                                                <AiFillHeart color="#e31b23" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            <ProductFooter />
        </div>
    );
};

export default WishlistPage;
