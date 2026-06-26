import React, { Component } from "react";
import { toast } from "react-toastify";
import { CartContext } from "../context/CartContext";
import { withRouter } from "../utils/withRouter";

class CartSidebar extends Component {
  static contextType = CartContext;

  constructor(props) {
    super(props);
    this.state = {
      showAuthModal: false,
      cartRecs: [],
      loadingRecs: false,
      lastFetchedCartIds: ""
    };
  }

  componentDidUpdate(prevProps, prevState) {
    const { cart, isOpen } = this.context;
    
    // Create a unique string of cart IDs to detect changes
    const currentCartIds = cart.map(item => item.id || item._id).sort().join(',');

    // Fetch recs when cart opens OR items change, but ONLY if we haven't fetched for these items already
    if (isOpen && (currentCartIds !== this.state.lastFetchedCartIds)) {
      this.fetchCartRecommendations(currentCartIds);
    }
  }

  fetchCartRecommendations = async (currentCartIds) => {
    if (this.state.loadingRecs) return;
    
    const { cart } = this.context;
    if (cart.length === 0) {
      this.setState({ cartRecs: [], lastFetchedCartIds: "" });
      return;
    }

    // Try to get user from localStorage 'user' object
    let userId = null;
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user.id || user._id;
      }
    } catch (e) {}

    try {
      this.setState({ loadingRecs: true });
      const productIds = cart.map(item => item.id || item._id);
      const response = await fetch('http://localhost:5005/api/recommendations/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cart_items: productIds,
          user_id: userId || 'guest'
        })
      });
      const data = await response.json();
      if (data.success) {
        this.setState({ 
          cartRecs: data.recommendations.slice(0, 4),
          lastFetchedCartIds: currentCartIds 
        });
      }
    } catch (error) {
      console.error("Cart recommendations error:", error);
    } finally {
      this.setState({ loadingRecs: false });
    }
  };

  handleProceedToCheckout = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // 1. Not logged in → Show Popup
    if (!token) {
      this.setState({ showAuthModal: true });
      return;
    }

    // 2. Logged in but NOT a customer (admin or brand)
    if (role !== "customer") {
      toast.error("Admin and Brand accounts cannot perform purchases. Please use a customer account.");
      return;
    }

    // 3. Logged in as customer → Go to checkout
    const { toggleCart, clearBuyNowItem } = this.context;
    clearBuyNowItem(); // Ensure cart checkout isn't overridden by buyNowItem
    toggleCart();
    this.props.navigate("/checkout/shipping");
  };

  closeAuthModal = () => {
    this.setState({ showAuthModal: false });
  };

  render() {
    const { cart, isOpen, increment, decrement, removeFromCart, toggleCart } = this.context;

    const parsePrice = (price) => {
      if (typeof price === "number") return price;
      if (typeof price === "string") {
        return parseFloat(price.replace(/[^0-9.]/g, "")) || 0;
      }
      return 0;
    };

    const total = cart.reduce(
      (sum, item) => sum + parsePrice(item.price) * (item.qty || 1),
      0
    );

    return (
      <div className={`cart-sidebar ${isOpen ? "open" : ""}`}>

        {/* HEADER */}
        <div className="cart-header">
          <div>
            <h3>Shopping Cart</h3>
            <span className="cart-count">{cart.length} Items</span>
          </div>
          <span className="cart-close" onClick={toggleCart}>✕</span>
        </div>

        {/* ITEMS */}
        <div className="cart-items">
          {cart.length === 0 && (
            <p className="empty-cart">Your cart is empty</p>
          )}

          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              {/* Product Image */}
              <div className="cart-item-image">
                <img 
                  src={
                    item.image?.startsWith('http') ? item.image 
                    : (item.image ? `http://localhost:5005/uploads/${item.image}` 
                       : (item.images?.[0] ? (item.images[0].startsWith('http') ? item.images[0] : `http://localhost:5005/uploads/${item.images[0]}`) : 'https://via.placeholder.com/80'))
                  } 
                  alt={item.name} 
                  onError={(e) => e.target.src = 'https://via.placeholder.com/80'} 
                />
              </div>

              {/* Product Info */}
              <div className="cart-item-info">
                <p className="cart-item-name">{item.name}</p>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
                  {item.selectedSize && <span className="cart-item-size">{item.selectedSize}</span>}
                  {item.selectedColor && (
                    <span
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: item.selectedColor,
                        border: '1px solid #ddd',
                        display: 'inline-block'
                      }}
                      title={item.selectedColor}
                    ></span>
                  )}
                </div>
                <div className="cart-item-price">
                  <span className="current-price">
                    {typeof item.price === 'number' ? `Rs. ${item.price.toLocaleString()}` : item.price}
                  </span>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="cart-qty">
                <button onClick={() => decrement(item.id)}>−</button>
                <span>{item.qty}</span>
                <button onClick={() => increment(item.id)}>+</button>
              </div>

              {/* Remove Button */}
              <button
                className="cart-remove"
                onClick={() => removeFromCart(item.id)}
              >
                ✕
              </button>
            </div>
          ))}

          {/* CART RECOMMENDATIONS */}
          {this.state.cartRecs.length > 0 && (
            <div className="cart-recommendations">
              <h4>Complete The Look</h4>
              <div className="cart-rec-grid">
                {this.state.cartRecs.map(prod => (
                  <div key={prod._id} className="cart-rec-item" onClick={() => {
                    this.context.toggleCart();
                    this.props.navigate(`/product/${prod._id}`);
                  }}>
                    <img src={prod.images?.[0]?.startsWith('http') ? prod.images[0] : `http://localhost:5005/uploads/${prod.images?.[0]}`} alt={prod.name} />
                    <div className="cart-rec-info">
                      <p>{prod.name}</p>
                      <span>Rs.{prod.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="cart-footer">
          <div className="cart-subtotal">
            <span>Subtotal:</span>
            <span>Rs.{total.toFixed(2)}</span>
          </div>
          <div className="cart-total">
            <span>Total:</span>
            <strong>Rs.{total.toFixed(2)}</strong>
          </div>

          <button
            className="cart-checkout-btn"
            onClick={this.handleProceedToCheckout}
          >
            Proceed To Checkout →
          </button>
        </div>

        {/* AUTH MODAL POPUP */}
        {this.state.showAuthModal && (
          <div className="auth-modal-overlay">
            <div className="auth-modal-content">
              <button className="auth-modal-close" onClick={this.closeAuthModal}>✕</button>

              <div className="auth-modal-icon">👤</div>
              <h2>Wait! You're almost there</h2>
              <p>To provide you with the best experience and track your orders, please join or login to FashionVerse.</p>

              <div className="auth-modal-actions">
                <button
                  className="auth-modal-btn register"
                  onClick={() => {
                    this.closeAuthModal();
                    this.context.toggleCart();
                    this.props.navigate("/register?redirectTo=/checkout/shipping");
                  }}
                >
                  Create New Account
                </button>
                <div className="auth-modal-divider">or</div>
                <button
                  className="auth-modal-btn login"
                  onClick={() => {
                    this.closeAuthModal();
                    this.context.toggleCart();
                    this.props.navigate("/login?redirectTo=/checkout/shipping");
                  }}
                >
                  Login to Existing Account
                </button>
              </div>

              <p className="auth-modal-footer">
                Fast & Secure Checkout Guaranteed.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(CartSidebar);

