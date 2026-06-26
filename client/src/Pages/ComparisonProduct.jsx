import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import StoreNavbar from "../components/StoreNavbar";
import ProductFooter from "../components/ProductFooter";
import Breadcrumbs from "../components/Breadcrumbs";
import api from "../api";
import "../styles/ComparisonProduct.css";
import { CartContext } from "../context/CartContext";

const ComparisonProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToCart, toggleCart } = useContext(CartContext);

    const [mainProduct, setMainProduct] = useState(location.state?.product || null);
    const [slot2, setSlot2] = useState(null);
    const [slot3, setSlot3] = useState(null);

    const [brands, setBrands] = useState([]);
    const [selectedBrandIds, setSelectedBrandIds] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [activeSlot, setActiveSlot] = useState(null);
    const [modalMode, setModalMode] = useState("brands"); // "brands" or "products"
    const [brandProducts, setBrandProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    // Mock data for Recent Comparisons
    const [recentComparisons, setRecentComparisons] = useState([]);
    const [popularComparisons] = useState([
        {
            p1: { name: "Silk Party Wear", price: 12299, image: "https://via.placeholder.com/150" },
            p2: { name: "Chiffon Kurta", price: 4899, image: "https://via.placeholder.com/150" }
        },
        {
            p1: { name: "Cotton Casuals", price: 3399, image: "https://via.placeholder.com/150" },
            p2: { name: "Linen Trousers", price: 2799, image: "https://via.placeholder.com/150" }
        }
    ]);

    useEffect(() => {
        const init = async () => {
            await fetchMainProduct();
            loadRecentComparisons();
        };
        init();
    }, [id]);

    useEffect(() => {
        if (mainProduct) {
            fetchComparisonBrands();
        }
    }, [mainProduct]);

    const fetchMainProduct = async () => {
        try {
            const res = await api.get(`/products/${id}`);
            setMainProduct(res.data);
        } catch (err) {
            console.error("Error fetching main product:", err);
        }
    };

    const fetchComparisonBrands = async () => {
        try {
            const res = await api.get(`/products/compare/${id}/brands`);
            setBrands(res.data || []);
        } catch (err) {
            console.error("Error fetching comparison brands:", err);
        }
    };

    const loadRecentComparisons = () => {
        const saved = localStorage.getItem("recentComparisons");
        if (saved) {
            setRecentComparisons(JSON.parse(saved));
        }
    };

    const saveComparison = (p1, p2) => {
        if (!p1 || !p2) return;
        const newComp = {
            p1: { name: p1.name, price: p1.price, image: p1.images?.[0] || p1.image },
            p2: { name: p2.name, price: p2.price, image: p2.images?.[0] || p2.image },
            date: new Date().toISOString()
        };
        const updated = [newComp, ...recentComparisons.slice(0, 3)];
        setRecentComparisons(updated);
        localStorage.setItem("recentComparisons", JSON.stringify(updated));
    };

    const handleOpenSelection = (slotNum) => {
        setActiveSlot(slotNum);
        setModalMode("brands");
        setSelectedBrandIds([]);
        setShowModal(true);
    };

    const toggleBrandSelection = (brandId) => {
        setSelectedBrandIds(prev => 
            prev.includes(brandId) 
                ? prev.filter(id => id !== brandId) 
                : [...prev, brandId]
        );
    };

    const handleFetchComparisonProducts = async () => {
        if (selectedBrandIds.length === 0) {
            toast.error("Please select at least one brand");
            return;
        }
        try {
            setLoading(true);
            const res = await api.get(`/products/compare/${id}/products`, {
                params: { brandIds: selectedBrandIds.join(',') }
            });
            setBrandProducts(res.data || []);
            setModalMode("products");
        } catch (err) {
            console.error("Error fetching products:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProduct = (product) => {
        if (activeSlot === 2) {
            setSlot2(product);
            saveComparison(mainProduct, product);
        } else if (activeSlot === 3) {
            setSlot3(product);
        }
        setShowModal(false);
    };

    const handleAddToBag = (product) => {
        if (!product) return;
        const formattedProduct = {
            ...product,
            id: product._id,
            image: product.images?.[0] ? `http://localhost:5005/uploads/${product.images[0]}` : product.image,
            images: product.images?.map(img => img.startsWith('http') ? img : `http://localhost:5005/uploads/${img}`) || []
        };
        addToCart(formattedProduct);
        toggleCart();
    };

    const renderProductSlot = (product, slotNum) => {
        if (!product) {
            return (
                <div className="comparison-slot">
                    <div className="empty-compare-slot">
                        <p>Compare with</p>
                        <span>Select brands to find similar items</span>
                        <div className="add-compare-box" onClick={() => handleOpenSelection(slotNum)}>
                            Add similar {mainProduct?.category || "Product"}
                        </div>
                    </div>
                </div>
            );
        }

        const imgUrl = product.images?.[0]
            ? (product.images[0].startsWith('http') ? product.images[0] : `http://localhost:5005/uploads/${product.images[0]}`)
            : (product.image || "");

        return (
            <div className="comparison-slot">
                {slotNum !== 1 && (
                    <button className="remove-slot-btn" onClick={() => slotNum === 2 ? setSlot2(null) : setSlot3(null)}>✕</button>
                )}
                <img src={imgUrl} alt={product.name} className="prod-compare-img" />
                <h3 className="prod-compare-name">{product.name}</h3>
                <p className="prod-compare-price">Rs. {product.price?.toLocaleString()}</p>
                <button className="add-bag-compare-btn" onClick={() => handleAddToBag(product)}>Add to Cart</button>
            </div>
        );
    };

    return (
        <div className="comparison-page-wrapper">
            <StoreNavbar />

            <div className="comparison-container">
                <div className="comparison-header">
                    <Breadcrumbs paths={[
                        { label: "Home", url: "/home" },
                        { label: "Comparison", url: "/comparison" },
                        { label: mainProduct?.name, url: "" }
                    ]} />
                    <h1>Product Comparison</h1>
                    <p>Comparing <strong>{mainProduct?.name}</strong> with similar items in the <strong>{mainProduct?.colors?.join(", ")}</strong> family.</p>
                </div>

                <section className="comparison-grid-section">
                    <div className="comparison-slots-wrapper">
                        <div className="comparison-info-column">
                            <h2>{mainProduct?.name} Comparison</h2>
                        </div>
                        {renderProductSlot(mainProduct, 1)}
                        {renderProductSlot(slot2, 2)}
                        {renderProductSlot(slot3, 3)}
                    </div>

                    <table className="features-table">
                        <tbody>
                            <tr className="features-section-header">
                                <td colSpan="4">General Information</td>
                            </tr>
                            <tr>
                                <td className="feature-label">Brand</td>
                                <td>{mainProduct?.brand?.name || "N/A"}</td>
                                <td>{slot2?.brand?.name || "—"}</td>
                                <td>{slot3?.brand?.name || "—"}</td>
                            </tr>
                            <tr>
                                <td className="feature-label">Category</td>
                                <td>{mainProduct?.category || "N/A"}</td>
                                <td>{slot2?.category || "—"}</td>
                                <td>{slot3?.category || "—"}</td>
                            </tr>
                            <tr>
                                <td className="feature-label">Colors</td>
                                <td>{mainProduct?.colors?.join(", ") || "N/A"}</td>
                                <td>{slot2?.colors?.join(", ") || "—"}</td>
                                <td>{slot3?.colors?.join(", ") || "—"}</td>
                            </tr>
                            <tr>
                                <td className="feature-label">Stock Status</td>
                                <td>{mainProduct?.stock > 0 ? "In Stock" : "Out of Stock"}</td>
                                <td>{slot2 ? (slot2.stock > 0 ? "In Stock" : "Out of Stock") : "—"}</td>
                                <td>{slot3 ? (slot3.stock > 0 ? "In Stock" : "Out of Stock") : "—"}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            </div>

            {/* IMPROVED SELECTION MODAL */}
            {showModal && (
                <div className="brand-catalog-modal" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                        <div className="modal-header">
                            <h3>{modalMode === "brands" ? "Step 1: Select Brands to Compare" : "Step 2: Choose Product"}</h3>
                            <button className="close-modal-btn" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            {modalMode === "brands" ? (
                                <>
                                    <p style={{ marginBottom: '15px' }}>Found {brands.length} brands with similar products. You can select multiple brands.</p>
                                    <div className="brands-selection-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
                                        {brands.map((brand) => (
                                            <div 
                                                key={brand._id} 
                                                className={`brand-select-card ${selectedBrandIds.includes(brand._id) ? 'selected' : ''}`} 
                                                onClick={() => toggleBrandSelection(brand._id)}
                                                style={{ 
                                                    border: selectedBrandIds.includes(brand._id) ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                                    padding: '15px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer',
                                                    position: 'relative'
                                                }}
                                            >
                                                {selectedBrandIds.includes(brand._id) && (
                                                    <span style={{ position: 'absolute', top: '5px', right: '5px', background: '#2563eb', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>
                                                )}
                                                <img
                                                    src={brand.logo ? `http://localhost:5005/uploads/${brand.logo}` : "https://via.placeholder.com/60"}
                                                    alt={brand.name}
                                                    style={{ width: '60px', height: '60px', objectFit: 'contain', marginBottom: '10px' }}
                                                />
                                                <h4 style={{ fontSize: '13px', margin: 0 }}>{brand.name}</h4>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: '30px', textAlign: 'right' }}>
                                        <button 
                                            className="btn-primary" 
                                            onClick={handleFetchComparisonProducts}
                                            disabled={selectedBrandIds.length === 0 || loading}
                                            style={{ background: selectedBrandIds.length === 0 ? '#cbd5e1' : '#2563eb' }}
                                        >
                                            {loading ? "Matching..." : "Compare Selected Brands"}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="back-to-brands" onClick={() => setModalMode("brands")} style={{ cursor: 'pointer', marginBottom: '15px', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span>←</span> Edit Brand Selection
                                    </div>
                                    <div className="products-selection-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                                        {brandProducts.length > 0 ? (
                                            brandProducts.map((prod) => (
                                                <div key={prod._id} className="prod-select-card" onClick={() => handleSelectProduct(prod)} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px', cursor: 'pointer' }}>
                                                    <img
                                                        src={prod.images?.[0] ? `http://localhost:5005/uploads/${prod.images[0]}` : "https://via.placeholder.com/150"}
                                                        alt={prod.name}
                                                        style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', marginBottom: '10px' }}
                                                    />
                                                    <div style={{ padding: '5px' }}>
                                                        <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>{prod.brand?.name}</span>
                                                        <h4 style={{ fontSize: '13px', margin: '3px 0' }}>{prod.name}</h4>
                                                        <p style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>Rs. {prod.price?.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p style={{ textAlign: 'center', gridColumn: '1/-1', padding: '40px' }}>No exact matches found for these brands.</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ProductFooter />
        </div>
    );
};

export default ComparisonProduct;
