import React, { Component } from "react";
import StoreNavbar from "../components/StoreNavbar";
import ProductFooter from "../components/ProductFooter";
import { CartContext } from "../context/CartContext";
import Breadcrumbs from "../components/Breadcrumbs";
import "../styles/Payment.css";
import { withRouter } from "../utils/withRouter";


import api from "../api";

class PaymentPage extends Component {
  static contextType = CartContext;

  state = {
    loading: false,
    error: "",
  };

  componentDidMount() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("cancelled")) {
      this.setState({ error: "Payment was cancelled. Please try again." });
    }

    // Enrich cart items missing name by fetching from API
    this.enrichItemsIfNeeded();
  }

  enrichItemsIfNeeded = async () => {
    const { cart, buyNowItem } = this.context;
    const checkoutItems = buyNowItem ? [buyNowItem] : (cart || []);

    let needsUpdate = false;
    const enriched = [...checkoutItems];

    for (let i = 0; i < enriched.length; i++) {
      const item = enriched[i];
      if (!item.name) {
        const productId = item.id || item._id;
        if (productId) {
          try {
            const res = await api.get(`/products/${productId}`);
            const prod = res.data;
            enriched[i] = {
              ...item,
              name: prod.name,
              image: item.image || (prod.images?.[0] ? `http://localhost:5005/uploads/${prod.images[0]}` : ''),
              price: item.price || prod.price
            };
            needsUpdate = true;
          } catch (err) {
            console.warn('Could not enrich item:', err);
          }
        }
      }
    }

    if (needsUpdate) {
      // Update cart context with enriched items
      if (buyNowItem) {
        this.context.setBuyNowItem(enriched[0]);
      }
      // For cart items, we update by re-adding via the cart context
      // Since cart is stored in localStorage, force a page re-render
      this.forceUpdate();
    }
  }

  handlePay = async () => {
    const { cart, buyNowItem } = this.context;

    // Use buyNowItem if it exists, otherwise use cart
    const checkoutItems = buyNowItem ? [buyNowItem] : cart;

    // Get shipping details from localStorage (saved in ShippingPage)
    const shippingAddress = JSON.parse(localStorage.getItem("shippingAddress") || "{}");

    if (!shippingAddress.address) {
      this.setState({ error: "Missing shipping information. Please go back." });
      return;
    }

    this.setState({ loading: true, error: "" });

    try {
      // 1. Create Stripe Session via our Backend
      const res = await api.post("/orders/create-checkout-session", {
        items: checkoutItems,
        shippingAddress
      });

      if (res.data.url) {
        // 2. Redirect user to Stripe Checkout
        window.location.href = res.data.url;
      }
    } catch (err) {
      console.error("Payment failed:", err);
      this.setState({
        error: err.response?.data?.message || "Something went wrong. Please try again.",
        loading: false
      });
    }
  };

  render() {
    const { cart, buyNowItem } = this.context;

    // 🚀 USE buyNowItem if it exists (Direct Buy Mode), else use Cart
    const checkoutItems = buyNowItem ? [buyNowItem] : (cart || []);
    const { error } = this.state;

    const subtotal = checkoutItems.reduce(
      (sum, item) => {
        const priceVal = typeof item.price === 'string'
          ? parseFloat(item.price.replace(/[Rs. ,]/g, ""))
          : item.price;
        const quantity = item.qty || item.quantity || 1;
        return sum + (priceVal || 0) * quantity;
      },
      0
    );

    return (
      <>
        <StoreNavbar />

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <Breadcrumbs paths={[
            { label: "Cart", url: "/home" },
            { label: "Shipping", url: "/checkout/shipping" },
            { label: "Payment", url: "/checkout/payment" }
          ]} />
        </div>
        <section className="payment-page">
          {/* LEFT */}
          <div className="payment-left">
            <h2>Payment Details</h2>
            <p className="subtitle">Complete your purchase securely.</p>

            <div className="stripe-setup-info">
              <div className="stripe-branding">
                <span className="stripe-logo">Stripe</span>
                <span className="secure-badge">Verified Secure 🔒</span>
              </div>
              <p>
                You will be redirected to Stripe's secure payment page to complete your transaction.
                We support all major credit/debit cards.
              </p>
            </div>

            {error && <p className="error" style={{ color: '#c41e3a', marginBottom: '15px' }}>{error}</p>}

            <button
              className="pay-btn"
              onClick={this.handlePay}
              disabled={this.state.loading}
            >
              {this.state.loading ? "Redirecting to payment..." : `Continue to Payment (Rs. ${subtotal.toLocaleString()}) →`}
            </button>

            <p className="secure-note">
              🔒 Your payment information is processed by Stripe and never stored on our servers.
            </p>
          </div>

          {/* RIGHT */}
          <div className="payment-right">
            <h3>Order Summary</h3>

            {checkoutItems.map((item) => (
              <div key={item.id} className="summary-item">
                <div>
                  <strong>{item.name}</strong>
                  <p>Qty: {item.qty || item.quantity || 1}</p>
                </div>
                <span>
                  {typeof item.price === 'number' ? `Rs. ${item.price.toLocaleString()}` : item.price}
                </span>
              </div>
            ))}

            <div className="summary">
              <div><span>Subtotal</span><span>Rs. {subtotal.toLocaleString()}</span></div>
              <div><span>Shipping</span><span>Free</span></div>
              <div><span>Taxes</span><span>Rs. 0</span></div>
              <div className="total">
                <span>Total</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>

        <ProductFooter />
      </>
    );
  }
}

export default withRouter(PaymentPage);
