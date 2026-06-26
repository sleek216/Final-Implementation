import React, { Component } from "react";
import StoreNavbar from "../components/StoreNavbar";
import ProductFooter from "../components/ProductFooter";
import Breadcrumbs from "../components/Breadcrumbs";
import "../styles/Shipping.css";
import { withRouter } from "../utils/withRouter";
import { CartContext } from "../context/CartContext";
import api from "../api";

class ShippingPage extends Component {
  static contextType = CartContext;

  state = {
    addresses: [],
    selectedIndex: null,
    error: "",
    form: {
      firstName: "",
      lastName: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      postal: "",
      phone: "",
    },
    billingSame: true,
  };

  componentDidMount() {
    this.enrichItemsIfNeeded();
  }

  enrichItemsIfNeeded = async () => {
    const { cart, buyNowItem } = this.context;
    const checkoutItems = buyNowItem ? [buyNowItem] : (cart || []);

    let needsUpdate = false;
    const enriched = [...checkoutItems];

    for (let i = 0; i < enriched.length; i++) {
      const item = enriched[i];
      if (!item.name || !item.price) {
        const productId = item.id || item._id;
        if (productId) {
          try {
            const res = await api.get(`/products/${productId}`);
            const prod = res.data;
            enriched[i] = {
              ...item,
              name: item.name || prod.name,
              image: item.image || (prod.images?.[0] ? `http://localhost:5005/uploads/${prod.images[0]}` : ""),
              price: item.price || prod.price
            };
            needsUpdate = true;
          } catch (err) {
            console.warn("Could not enrich item in ShippingPage:", err);
          }
        }
      }
    }

    if (needsUpdate) {
      if (buyNowItem) {
        this.context.setBuyNowItem(enriched[0]);
      }
      // Trigger re-render to show enriched data
      this.forceUpdate();
    }
  };

  handleChange = (e) => {
    this.setState({
      form: { ...this.state.form, [e.target.name]: e.target.value },
      error: "",
    });
  };

  validateForm = () => {
    const { firstName, lastName, address1, city, state, postal, phone } =
      this.state.form;

    if (
      !firstName ||
      !lastName ||
      !address1 ||
      !city ||
      !state ||
      !postal ||
      !phone
    ) {
      this.setState({
        error: "Please fill all required address fields",
      });
      return false;
    }

    // Name validations
    const nameRegex = /^[a-zA-Z\s\.]+$/;
    if (!nameRegex.test(firstName.trim())) {
      this.setState({ error: "First Name should only contain letters, spaces, or dots" });
      return false;
    }
    if (!nameRegex.test(lastName.trim())) {
      this.setState({ error: "Last Name should only contain letters, spaces, or dots" });
      return false;
    }

    // City and State validation
    const locationRegex = /^[a-zA-Z\s\-]+$/;
    if (!locationRegex.test(city.trim())) {
      this.setState({ error: "City should only contain letters, spaces, or hyphens" });
      return false;
    }
    if (!locationRegex.test(state.trim())) {
      this.setState({ error: "State/Province should only contain letters, spaces, or hyphens" });
      return false;
    }

    // Postal code validation (Pakistan zip codes are 5 digits)
    const postalRegex = /^\d{5}$/;
    if (!postalRegex.test(postal.trim())) {
      this.setState({ error: "Please enter a valid 5-digit Pakistani postal code (e.g., 75500)" });
      return false;
    }

    // Phone number validation (Pakistani formats: 03xxxxxxxxx, +923xxxxxxxxx, 923xxxxxxxxx, 3xxxxxxxxx)
    const cleanedPhone = phone.replace(/[\s\-\(\)]/g, "");
    const phoneRegex = /^(?:\+92|92|0)?3\d{9}$/;
    if (!phoneRegex.test(cleanedPhone)) {
      this.setState({
        error: "Please enter a valid Pakistani phone number (e.g., 03XXXXXXXXX or +923XXXXXXXXX)"
      });
      return false;
    }

    return true;
  };

  addAddress = () => {
    if (!this.validateForm()) return;

    this.setState((prev) => ({
      addresses: [...prev.addresses, prev.form],
      selectedIndex: prev.addresses.length,
      form: {
        firstName: "",
        lastName: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        postal: "",
        phone: "",
      },
      error: "",
    }));
  };

  handleContinue = () => {
    const { addresses, selectedIndex } = this.state;

    if (addresses.length === 0) {
      this.setState({
        error: "Please add a shipping address before continuing",
      });
      return;
    }

    if (selectedIndex === null) {
      this.setState({
        error: "Please select a shipping address before continuing",
      });
      return;
    }

    // 🔐 SAVE TO LOCALSTORAGE FOR PAYMENT PAGE
    const selectedAddr = addresses[selectedIndex];
    const shippingAddress = {
      name: `${selectedAddr.firstName} ${selectedAddr.lastName}`,
      phone: selectedAddr.phone,
      address: selectedAddr.address1,
      city: selectedAddr.city,
      state: selectedAddr.state,
      zipCode: selectedAddr.postal,
      country: "Pakistan" // Default
    };
    localStorage.setItem("shippingAddress", JSON.stringify(shippingAddress));

    this.props.navigate("/checkout/payment");
  };

  render() {
    const { addresses, selectedIndex, form, billingSame, error } = this.state;
    const { cart, buyNowItem } = this.context;

    // 🚀 USE buyNowItem if it exists (Direct Buy Mode), else use Cart
    const checkoutItems = buyNowItem ? [buyNowItem] : (cart || []);

    const subtotal = checkoutItems.reduce((sum, item) => {
      const priceVal = typeof item.price === 'string'
        ? parseFloat(item.price.replace(/[Rs. ,]/g, ""))
        : item.price;
      const quantity = item.qty || item.quantity || 1;
      return sum + (priceVal || 0) * quantity;
    }, 0);
    const shipping = 0; // Free shipping
    const tax = 0;
    const total = subtotal + shipping + tax;

    return (
      <>
        <StoreNavbar />

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <Breadcrumbs paths={[
            { label: "Cart", url: "/home" },
            { label: "Shipping", url: "/checkout/shipping" }
          ]} />
        </div>
        <section className="shipping-page">
          {/* LEFT */}
          <div className="shipping-left">
            <h2>Shipping Details</h2>

            {/* SAVED ADDRESSES */}
            {addresses.length > 0 && (
              <div className="saved-addresses">
                {addresses.map((addr, i) => (
                  <label
                    key={i}
                    className={`address-card ${selectedIndex === i ? "active" : ""
                      }`}
                  >
                    <input
                      type="radio"
                      checked={selectedIndex === i}
                      onChange={() => this.setState({ selectedIndex: i })}
                    />
                    <div>
                      <strong>
                        {addr.firstName} {addr.lastName}
                      </strong>
                      <p>{addr.address1}</p>
                      <p>
                        {addr.city}, {addr.state}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* FORM */}
            <div className="address-form">
              <h3>Add New Address</h3>

              <div className="row">
                <div className="input-group">
                  <label>First Name <span className="required-star">*</span></label>
                  <input
                    name="firstName"
                    placeholder="First Name"
                    value={form.firstName}
                    onChange={this.handleChange}
                  />
                </div>
                <div className="input-group">
                  <label>Last Name <span className="required-star">*</span></label>
                  <input
                    name="lastName"
                    placeholder="Last Name"
                    value={form.lastName}
                    onChange={this.handleChange}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Address Line 1 <span className="required-star">*</span></label>
                <input
                  name="address1"
                  placeholder="Street address or P.O. Box"
                  value={form.address1}
                  onChange={this.handleChange}
                />
              </div>

              <div className="input-group">
                <label>Address Line 2 (Optional)</label>
                <input
                  name="address2"
                  placeholder="Apartment, suite, unit, building, floor, etc."
                  value={form.address2}
                  onChange={this.handleChange}
                />
              </div>

              <div className="row">
                <div className="input-group">
                  <label>City <span className="required-star">*</span></label>
                  <input
                    name="city"
                    placeholder="City"
                    value={form.city}
                    onChange={this.handleChange}
                  />
                </div>
                <div className="input-group">
                  <label>State / Province <span className="required-star">*</span></label>
                  <input
                    name="state"
                    placeholder="State"
                    value={form.state}
                    onChange={this.handleChange}
                  />
                </div>
              </div>

              <div className="row">
                <div className="input-group">
                  <label>Postal Code <span className="required-star">*</span></label>
                  <input
                    name="postal"
                    placeholder="Postal Code"
                    value={form.postal}
                    onChange={this.handleChange}
                  />
                </div>
                <div className="input-group">
                  <label>Phone <span className="required-star">*</span></label>
                  <input
                    name="phone"
                    placeholder="Phone"
                    value={form.phone}
                    onChange={this.handleChange}
                  />
                </div>
              </div>

              <div className="billing-check">
                <input
                  type="checkbox"
                  checked={billingSame}
                  onChange={() =>
                    this.setState({ billingSame: !billingSame })
                  }
                />
                <label>Billing address same as shipping</label>
              </div>

              {error && <p className="form-error">{error}</p>}

              <button className="add-address-btn" onClick={this.addAddress}>
                Add Address
              </button>

              <div
                className="return-cart"
                onClick={() => {
                  this.context.clearBuyNowItem(); // Clear direct buy if returning to cart
                  this.props.navigate(-1);
                  this.context.toggleCart();
                }}
              >
                ← Return to Cart
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="shipping-right">
            <h3>Your Order</h3>

            <div className="order-summary-items">
              {checkoutItems.length > 0 ? (
                checkoutItems.map((item, idx) => {
                  const itemPrice = typeof item.price === 'string'
                    ? parseFloat(item.price.replace(/[Rs. ,]/g, ""))
                    : item.price;
                  const itemQty = item.qty || item.quantity || 1;
                  const itemImage = item.image || (item.images && item.images[0]) || "";
                  const displayImage = itemImage.startsWith('http') ? itemImage : `http://localhost:5005/uploads/${itemImage}`;

                  return (
                    <div key={item.id || idx} className="checkout-item-mini">
                      <div className="checkout-item-thumb">
                        <img src={displayImage} alt={item.name} onError={(e) => e.target.src = 'https://via.placeholder.com/50'} />
                        <span className="item-qty-badge">{itemQty}</span>
                      </div>
                      <div className="checkout-item-info">
                        <p className="item-name">{item.name}</p>
                        <p className="item-variant">{item.selectedSize} {item.selectedColor ? ` / ${item.selectedColor}` : ""}</p>
                      </div>
                      <p className="item-price">Rs. {(itemPrice * itemQty).toLocaleString()}</p>
                    </div>
                  );
                })
              ) : (
                <p className="empty-checkout">No items found</p>
              )}
            </div>

            <div className="summary">
              <div><span>Subtotal</span><span>Rs. {subtotal.toLocaleString()}</span></div>
              <div><span>Shipping</span><span>Rs. {shipping.toLocaleString()}</span></div>
              <div><span>Tax</span><span>Rs. {tax.toLocaleString()}</span></div>
              <div className="total">
                <span>Total</span>
                <span>Rs. {total.toLocaleString()}</span>
              </div>
            </div>

            <button className="continue-btn" onClick={this.handleContinue}>
              Continue to Payment →
            </button>
          </div>
        </section>

        <ProductFooter />
      </>
    );
  }
}

export default withRouter(ShippingPage);
