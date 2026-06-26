import React, { Component } from "react";
import StoreNavbar from "../components/StoreNavbar";
import ProductFooter from "../components/ProductFooter";
import { CartContext } from "../context/CartContext";
import Breadcrumbs from "../components/Breadcrumbs";
import { withRouter } from "../utils/withRouter";
import "../styles/OrderSuccess.css";

import api from "../api";

class OrderSuccessPage extends Component {
  static contextType = CartContext;

  state = {
    loading: true,
    success: false,
    order: null,
    error: ""
  };

  async componentDidMount() {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const orderId = params.get("order_id");

    if (!sessionId || !orderId) {
      this.setState({ loading: false, error: "Invalid session information." });
      return;
    }

    try {
      const { clearCart, clearBuyNowItem } = this.context;
      const res = await api.get(`/orders/verify-payment?session_id=${sessionId}&order_id=${orderId}`);

      if (res.data.success) {
        this.setState({
          loading: false,
          success: true,
          order: res.data.order
        });
        clearCart(); // WIPE CART ON SUCCESS
        clearBuyNowItem(); // WIPE DIRECT BUY DATA
        localStorage.removeItem("shippingAddress"); // WIPE SHIPPING DATA
      } else {
        this.setState({ loading: false, success: false, error: res.data.message });
      }
    } catch (err) {
      console.error("Verification failed:", err);
      this.setState({ loading: false, success: false, error: "Failed to verify payment." });
    }
  }

  render() {
    const { loading, success, order, error } = this.state;

    if (loading) {
      return (
        <>
          <StoreNavbar />
          <div className="order-success">
            <div className="success-card">
              <div className="loader"></div>
              <h1>Verifying Payment...</h1>
              <p>Please do not close this window.</p>
            </div>
          </div>
          <ProductFooter />
        </>
      );
    }

    if (!success) {
      return (
        <>
          <StoreNavbar />
          <div className="order-success">
            <div className="success-row" style={{ textAlign: "center", padding: "100px 20px" }}>
              <div className="error-icon" style={{ fontSize: "50px", marginBottom: "20px" }}>❌</div>
              <h1 style={{ color: "#c41e3a" }}>Payment Failed</h1>
              <p>{error || "We couldn't confirm your payment. Please contact support."}</p>
              <button className="continue-shopping" onClick={() => this.props.navigate("/checkout/payment")}>Try Again</button>
            </div>
          </div>
          <ProductFooter />
        </>
      );
    }

    return (
      <>
        <StoreNavbar />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <Breadcrumbs paths={[
            { label: "Cart", url: "/home" },
            { label: "Checkout", url: "/checkout/shipping" },
            { label: "Success", url: "" }
          ]} />
        </div>
        <section className="order-success">
          <div className="success-card">
            <div className="checkmark">✓</div>

            <h1>Thank you for your order</h1>
            <p className="pickup-line">
              Your style upgrade is officially on the way ✨
            </p>

            <p className="order-id">
              Order ID: <strong>#{order._id.substring(order._id.length - 6).toUpperCase()}</strong>
            </p>

            {/* ORDER SUMMARY */}
            <div className="order-summary">
              {order.items?.map((item, i) => (
                <div key={i} className="order-item">
                  <span>
                    {item.productId?.name || "Product"} <small>x{item.quantity}</small>
                  </span>
                  <span>Rs. {item.price.toLocaleString()}</span>
                </div>
              ))}

              <div className="order-total">
                <span>Total Amount Paid</span>
                <span>Rs. {order.totalAmount?.toLocaleString()}</span>
              </div>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                A confirmation email has been sent to your registered address.
              </p>
            </div>

            <button
              className="continue-shopping"
              onClick={() => this.props.navigate("/home")}
            >
              Continue Shopping →
            </button>
          </div>
        </section>

        <ProductFooter />
      </>
    );
  }
}

export default withRouter(OrderSuccessPage);
