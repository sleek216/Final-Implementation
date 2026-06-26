import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CartContext } from "../context/CartContext";
import { getUploadUrl } from "../config";
import { normalizeModel3DUrl, sketchfabEmbedUrl } from "../utils/model3d";
import UnityInMallOverlay from "./UnityInMallOverlay";
import "../styles/ProductDetail.css";

const isDirectModelFile = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.endsWith(".glb") || lower.endsWith(".gltf") || lower.includes(".glb?") || lower.includes(".gltf?");
};

const render3DModel = (url, className = "", transparent = false) => {
  if (!url) {
    return (
      <div className={`product-3d-container ${className}`.trim()}>
        <p style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
          No 3D model URL for this product.
        </p>
      </div>
    );
  }

  const bgStyle = transparent
    ? { width: "100%", height: "100%", background: "transparent", "--poster-color": "transparent" }
    : { width: "100%", height: "100%", "--poster-color": "transparent" };

  if (isDirectModelFile(url)) {
    return (
      <div className={`product-3d-container ${className}`.trim()}>
        <model-viewer
          src={url}
          alt="3D product model"
          camera-controls
          auto-rotate
          touch-action="pan-y"
          interaction-prompt="auto"
          shadow-intensity="1"
          exposure="1"
          style={bgStyle}
        />
      </div>
    );
  }

  let embedUrl = sketchfabEmbedUrl(url);
  if (!embedUrl.includes("/embed") && url.includes("sketchfab.com")) {
    const parts = url.split("/");
    const modelId = parts[parts.length - 1] || parts[parts.length - 2];
    if (modelId) embedUrl = sketchfabEmbedUrl(`https://sketchfab.com/models/${modelId}/embed`);
  }

  if (transparent && embedUrl.includes("transparent=0")) {
    embedUrl = embedUrl.replace("transparent=0", "transparent=1");
  } else if (transparent && !embedUrl.includes("transparent=")) {
    embedUrl += (embedUrl.includes("?") ? "&" : "?") + "transparent=1";
  }

  return (
    <div className={`product-3d-container ${className}`.trim()}>
      {className.includes("modal-viewer") && (
        <p className="product-3d-viewer-hint">Drag to rotate | Scroll to zoom</p>
      )}
      <iframe
        title="3D Model Viewer"
        src={embedUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; fullscreen; xr-spatial-tracking; gyroscope; accelerometer"
      />
    </div>
  );
};

function MiniCartPanel({ cart, onCheckout, float = false }) {
  const parsePrice = (price) => {
    if (typeof price === "number") return price;
    if (typeof price === "string") return parseFloat(price.replace(/[^0-9.]/g, "")) || 0;
    return 0;
  };

  const total = cart.reduce((sum, item) => sum + parsePrice(item.price) * (item.qty || 1), 0);

  if (!cart.length) return null;

  return (
    <div className={`product-3d-mini-cart open${float ? " product-3d-mini-cart--float" : ""}`}>
      <div className="product-3d-mini-cart-header">
        <span>Your Bag</span>
        <span>({cart.length})</span>
      </div>
      <div className="product-3d-mini-cart-body">
        {cart.map((item) => {
          const img = item.image || (item.images?.[0] ? getUploadUrl(item.images[0]) : "");
          return (
            <div key={item.id || item._id} className="product-3d-mini-cart-item">
              {img ? <img src={img} alt={item.name} /> : <div className="product-3d-mini-cart-placeholder" />}
              <div className="product-3d-mini-cart-info">
                <p className="product-3d-mini-cart-name">{item.name}</p>
                <p className="product-3d-mini-cart-meta">
                  Qty {item.qty || 1}
                  {item.selectedSize ? ` | ${item.selectedSize}` : ""}
                </p>
              </div>
              <span className="product-3d-mini-cart-price">
                Rs. {parsePrice(item.price).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
      <div className="product-3d-mini-cart-footer">
        <div className="product-3d-mini-cart-total">
          <span>Total</span>
          <span>Rs. {total.toLocaleString()}</span>
        </div>
        <button type="button" className="product-3d-mini-cart-checkout" onClick={onCheckout}>
          Checkout
        </button>
      </div>
    </div>
  );
}

export default function Product3DModal({ product, onClose, fullscreen = false }) {
  const navigate = useNavigate();
  const { cart, addToCart, setBuyNowItem, clearBuyNowItem, mergeGuestCartIntoUser } = useContext(CartContext);

  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || "One Size");
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [showMiniCart, setShowMiniCart] = useState(false);
  const [inMallFlow, setInMallFlow] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    if (!document.getElementById("model-viewer-script")) {
      const script = document.createElement("script");
      script.id = "model-viewer-script";
      script.type = "module";
      script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js";
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    setSelectedSize(product?.sizes?.[0] || "One Size");
    setSelectedColor(product?.colors?.[0] || "");
    setQuantity(1);
    setShowMiniCart(cart.length > 0);
  }, [product, cart.length]);

  if (!product) return null;

  const modelUrl = normalizeModel3DUrl(product.model3DUrl || "");
  const has3D = !!(modelUrl && product.is3DEnabled);

  const formatProduct = () => ({
    ...product,
    id: product._id || product.id,
    _id: product._id || product.id,
    image: product.images?.[0] ? getUploadUrl(product.images[0]) : "",
    images: (product.images || []).map((img) =>
      img.startsWith("http") ? img : getUploadUrl(img)
    ),
    price:
      typeof product.price === "string"
        ? parseFloat(product.price.replace(/[Rs. ,]/g, ""))
        : product.price,
  });

  const isCustomer = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    return !!token && role === "customer";
  };

  const getCheckoutItems = () => {
    const buyNow = JSON.parse(localStorage.getItem("buyNowItem") || "null");
    if (buyNow) return [buyNow];
    return cart;
  };

  const resumePendingAction = () => {
    if (pendingAction === "addCart" && product) {
      handleAddToBag();
    } else if (pendingAction === "buyNow" && product) {
      const formatted = formatProduct();
      setBuyNowItem({
        ...formatted,
        selectedSize,
        selectedColor,
        qty: quantity,
      });
      setInMallFlow("shipping");
    } else if (pendingAction === "checkout") {
      clearBuyNowItem();
      setInMallFlow("shipping");
    }
    setPendingAction(null);
  };

  const requireCustomerInMall = (action) => {
    if (isCustomer()) return true;
    setPendingAction(action);
    setInMallFlow("auth");
    return false;
  };

  const handleAddToBag = () => {
    const formatted = formatProduct();
    addToCart({
      ...formatted,
      selectedSize,
      selectedColor,
      quantity,
    });
    setShowMiniCart(true);
    toast.success("Added to bag");
  };

  const handleBuyNow = () => {
    if (fullscreen) {
      if (!requireCustomerInMall("buyNow")) return;
      const formatted = formatProduct();
      setBuyNowItem({
        ...formatted,
        selectedSize,
        selectedColor,
        qty: quantity,
      });
      setInMallFlow("shipping");
      return;
    }
    if (!isCustomer()) {
      toast.error("Please login as a customer to continue");
      navigate("/login?redirectTo=" + encodeURIComponent("/checkout/shipping"));
      return;
    }
    const formatted = formatProduct();
    setBuyNowItem({
      ...formatted,
      selectedSize,
      selectedColor,
      qty: quantity,
    });
    navigate("/checkout/shipping");
  };

  const handleCheckout = () => {
    if (fullscreen) {
      if (!requireCustomerInMall("checkout")) return;
      clearBuyNowItem();
      setInMallFlow("shipping");
      return;
    }
    if (!isCustomer()) {
      toast.error("Please login as a customer to continue");
      navigate("/login?redirectTo=" + encodeURIComponent("/checkout/shipping"));
      return;
    }
    clearBuyNowItem();
    navigate("/checkout/shipping");
  };

  const detailsContent = (
    <>
      <h2>{product.name}</h2>
      {product.brand?.name && <p className="product-3d-brand">{product.brand.name}</p>}
      {product.productId && (
        <p className="product-3d-brand product-3d-code">Code: {product.productId}</p>
      )}
      <p className="price">
        {typeof product.price === "number"
          ? `Rs. ${product.price.toLocaleString()}`
          : product.price}
      </p>
      <p className="desc product-3d-card-desc">
        {product.description || "No description available for this product."}
      </p>

      <div className="product-3d-modal-options">
        <div className="colors product-option-group">
          <span>Color</span>
          <div className="product-option-list">
            {product.colors?.length > 0 ? (
              product.colors.map((c, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedColor(c)}
                  className={`modal-color-swatch ${selectedColor === c ? "active" : ""}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))
            ) : (
              <span className="product-3d-no-option">Default</span>
            )}
          </div>
        </div>

        <div className="size product-option-group">
          <span>Size</span>
          <div className="product-option-list">
            {(product.sizes?.length > 0 ? product.sizes : ["One Size"]).map((s, i) => (
              <button
                key={i}
                type="button"
                className={`modal-size-btn ${selectedSize === s ? "active" : ""}`}
                onClick={() => setSelectedSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="quantity-selector-container modal-quantity">
          <span>Quantity</span>
          <div className="quantity-selector">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
              -
            </button>
            <span>{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => q + 1)}>
              +
            </button>
          </div>
        </div>
      </div>

      <div className="product-actions modal-actions">
        <button type="button" className="add-to-bag-btn" onClick={handleAddToBag}>
          Add to Bag
        </button>
        <button type="button" className="buy-now-btn" onClick={handleBuyNow}>
          Buy it now
        </button>
      </div>
      {(product.stock === 0 || (product.stock > 0 && product.stock < 10)) && (
        <p className="stock modal-stock">
          {product.stock === 0 ? "Out of stock" : `Only ${product.stock} left in stock`}
        </p>
      )}
    </>
  );

  return (
    <div
      className={`product-3d-overlay${fullscreen ? " product-3d-overlay--unity" : ""}`}
      onClick={onClose}
    >
      <div className="product-3d-overlay-panel" onClick={(e) => e.stopPropagation()}>
        <div className="product-3d-overlay-header">
          <p className="product-3d-overlay-title">3D Product View</p>
          <button
            type="button"
            className="product-3d-overlay-close"
            onClick={onClose}
            aria-label="Close 3D preview"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="product-3d-overlay-body">
          <div className="product-3d-overlay-viewer">
            {has3D ? (
              render3DModel(modelUrl, "modal-viewer")
            ) : (
              <div className="product-3d-container modal-viewer">
                {product.images?.[0] ? (
                  <img
                    src={getUploadUrl(product.images[0])}
                    alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <p style={{ padding: "2rem", textAlign: "center" }}>No preview available</p>
                )}
              </div>
            )}
          </div>

          <div className="product-3d-overlay-details">
            <div className="product-3d-modal-details">
              <div className="product-3d-modal-top">{detailsContent}</div>
            </div>
          </div>
        </div>
      </div>

      {fullscreen && showMiniCart && !inMallFlow && (
        <div onClick={(e) => e.stopPropagation()}>
          <MiniCartPanel cart={cart} onCheckout={handleCheckout} float />
        </div>
      )}

      {fullscreen && inMallFlow && (
        <UnityInMallOverlay
          flow={inMallFlow}
          checkoutItems={getCheckoutItems()}
          onClose={() => {
            setInMallFlow(null);
            setPendingAction(null);
          }}
          onLoginSuccess={() => {
            try {
              const u = JSON.parse(localStorage.getItem("user") || "null");
              if (u) mergeGuestCartIntoUser(u._id || u.id);
            } catch (e) {}
            setInMallFlow(null);
            resumePendingAction();
          }}
          onShippingComplete={() => setInMallFlow("payment")}
        />
      )}
    </div>
  );
}
