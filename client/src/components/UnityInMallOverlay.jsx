import { useState } from "react";
import { toast } from "react-toastify";
import api from "../api";

const parsePrice = (price) => {
  if (typeof price === "number") return price;
  if (typeof price === "string") return parseFloat(price.replace(/[^0-9.]/g, "")) || 0;
  return 0;
};

export default function UnityInMallOverlay({
  flow,
  onClose,
  onLoginSuccess,
  onShippingComplete,
  checkoutItems = [],
  initialRegister = false,
}) {
  const [mode, setMode] = useState(initialRegister ? "register" : "login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regOtp, setRegOtp] = useState("");

  const [ship, setShip] = useState({
    firstName: "",
    lastName: "",
    address1: "",
    city: "",
    state: "",
    postal: "",
    phone: "",
  });

  if (!flow) return null;

  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + parsePrice(item.price) * (item.qty || item.quantity || 1),
    0
  );

  const saveSession = (data) => {
    const user = data.user;
    let role = (user.role || "customer").toLowerCase();
    if (role === "user") role = "customer";
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", role);
    localStorage.setItem("user", JSON.stringify(user));
    return role;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email: loginEmail, password: loginPassword });
      const role = saveSession(res.data);
      if (role !== "customer") {
        setError("Please use a customer account to shop in the mall.");
        return;
      }
      toast.success(`Welcome, ${res.data.user.name || "shopper"}!`);
      onLoginSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError("");
    if (!regEmail.trim()) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/send-registration-otp", { email: regEmail });
      setOtpSent(true);
      toast.success("OTP sent to your email");
    } catch (err) {
      setError(err.response?.data?.message || "Could not send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        role: "customer",
      });
      toast.success("Account created! Logging you in...");
      const res = await api.post("/auth/login", { email: regEmail, password: regPassword });
      saveSession(res.data);
      onLoginSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleShipping = (e) => {
    e.preventDefault();
    setError("");
    const { firstName, lastName, address1, city, state, postal, phone } = ship;
    if (!firstName || !lastName || !address1 || !city || !state || !postal || !phone) {
      setError("Please fill all required fields");
      return;
    }
    const shippingAddress = {
      name: `${firstName} ${lastName}`,
      phone,
      address: address1,
      city,
      state,
      zipCode: postal,
      country: "Pakistan",
    };
    localStorage.setItem("shippingAddress", JSON.stringify(shippingAddress));
    onShippingComplete?.();
  };

  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [completedOrder, setCompletedOrder] = useState(null);

  const handleCardNumberChange = (e) => {
    setError("");
    let val = e.target.value.replace(/\D/g, "").slice(0, 16);
    let formatted = val.replace(/(.{4})/g, "$1 ").trim();
    setCardNumber(formatted);
  };

  const handleCardExpChange = (e) => {
    setError("");
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 3) {
      val = val.slice(0, 2) + "/" + val.slice(2);
    }
    setCardExp(val);
  };

  const handleCardCvcChange = (e) => {
    setError("");
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCardCvc(val);
  };

  const validateCardDetails = () => {
    const rawCard = cardNumber.replace(/\s/g, "");
    if (rawCard.length < 15) {
      return "Card number must be 16 digits (e.g. 4242 4242 4242 4242)";
    }
    if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(cardExp)) {
      return "Expiry must be in MM/YY format (e.g. 12/28)";
    }
    const parts = cardExp.split("/");
    const expMonth = parseInt(parts[0], 10);
    const expYear = 2000 + parseInt(parts[1], 10);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return "Card expiry date is in the past";
    }
    if (cardCvc.length < 3) {
      return "CVC must be 3 or 4 digits (e.g. 123)";
    }
    return null;
  };

  const handleStripeSession = async () => {
    const shippingAddress = JSON.parse(localStorage.getItem("shippingAddress") || "{}");
    if (!shippingAddress.address) {
      setError("Add shipping address first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        "/orders/create-checkout-session",
        { items: checkoutItems, shippingAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.url) {
        window.open(res.data.url, "_blank", "noopener,noreferrer");
        toast.info("Stripe Hosted Checkout opened in new tab. Your 3D Mall stays live!");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Stripe Session Error");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectPayment = async (e) => {
    e?.preventDefault();
    const shippingAddress = JSON.parse(localStorage.getItem("shippingAddress") || "{}");
    if (!shippingAddress.address) {
      setError("Add shipping address first");
      return;
    }

    const validationError = validateCardDetails();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // Format items so productId is guaranteed to be MongoDB ObjectId
      const formattedItems = checkoutItems.map((item) => ({
        productId: item._id || item.id,
        quantity: item.qty || item.quantity || 1,
        price: typeof item.price === "string" ? parseFloat(item.price.replace(/[Rs. ,]/g, "")) : item.price,
      }));

      const res = await api.post(
        "/orders",
        {
          items: formattedItems,
          totalAmount: subtotal,
          shippingAddress,
          paymentMethod: "credit_card",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.removeItem("buyNowItem");
      toast.success("Payment Successful! Order placed in 3D Mall.");
      setCompletedOrder(res.data.order || { _id: "ORD-" + Date.now(), totalAmount: subtotal });
    } catch (err) {
      setError(err.response?.data?.message || "Payment processing failed.");
    } finally {
      setLoading(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="unity-inmall-stack" onClick={(e) => e.stopPropagation()}>
        <div className="unity-inmall-card">
          <div className="unity-inmall-card-header">
            <span>🎉 Order Confirmed!</span>
            <button type="button" className="unity-inmall-close" onClick={onClose} aria-label="Close">
              X
            </button>
          </div>
          <div className="unity-inmall-card-body" style={{ textAlign: "center", padding: "20px 16px" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🛍️</div>
            <h3 style={{ margin: "0 0 6px", fontSize: "1.1rem", color: "#fff" }}>Thank You for Your Order!</h3>
            <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.75)", margin: "0 0 12px" }}>
              Order ID: <code style={{ color: "#38bdf8" }}>{completedOrder._id}</code>
            </p>
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "10px", padding: "10px", margin: "12px 0", textAlign: "left" }}>
              <p style={{ fontSize: "0.8rem", margin: "0 0 6px", fontWeight: "bold", color: "#fff" }}>Order Summary:</p>
              {checkoutItems.map((item) => (
                <p key={item.id || item._id} style={{ fontSize: "0.78rem", margin: "3px 0", color: "rgba(255,255,255,0.8)" }}>
                  • {item.name} (x{item.qty || item.quantity || 1})
                </p>
              ))}
              <hr style={{ borderColor: "rgba(255,255,255,0.15)", margin: "8px 0" }} />
              <p style={{ fontSize: "0.88rem", fontWeight: "bold", margin: 0, color: "#4ade80" }}>
                Total Paid: Rs. {subtotal.toLocaleString()}
              </p>
            </div>
            <button
              type="button"
              className="unity-inmall-btn-primary"
              onClick={onClose}
              style={{ marginTop: "10px" }}
            >
              🎮 Continue Shopping in 3D Mall
            </button>
          </div>
        </div>
      </div>
    );
  }

  const title =
    flow === "shipping"
      ? "Shipping"
      : flow === "payment"
        ? "Stripe Card Payment"
        : mode === "register"
          ? "Register"
          : "Login";

  return (
    <div className="unity-inmall-stack" onClick={(e) => e.stopPropagation()}>
      <div className="unity-inmall-card">
        <div className="unity-inmall-card-header">
          <span>{title}</span>
          <button type="button" className="unity-inmall-close" onClick={onClose} aria-label="Close">
            X
          </button>
        </div>

        <div className="unity-inmall-card-body">
          {(flow === "login" || flow === "auth") && mode === "login" && (
            <form onSubmit={handleLogin}>
              <label className="unity-inmall-label">Email</label>
              <input
                className="unity-inmall-input"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
              <label className="unity-inmall-label">Password</label>
              <input
                className="unity-inmall-input"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
              {error && <p className="unity-inmall-error">{error}</p>}
              <button type="submit" className="unity-inmall-btn-primary" disabled={loading}>
                {loading ? "..." : "Login"}
              </button>
              <p className="unity-inmall-switch">
                New here?{" "}
                <button type="button" onClick={() => { setMode("register"); setError(""); }}>
                  Register
                </button>
              </p>
            </form>
          )}

          {(flow === "login" || flow === "auth") && mode === "register" && (
            <form onSubmit={handleRegister}>
              <label className="unity-inmall-label">Full name</label>
              <input className="unity-inmall-input" value={regName} onChange={(e) => setRegName(e.target.value)} required />
              <label className="unity-inmall-label">Email</label>
              <input className="unity-inmall-input" type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
              <label className="unity-inmall-label">Phone</label>
              <input className="unity-inmall-input" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="03XXXXXXXXX" required />
              <label className="unity-inmall-label">Password</label>
              <input className="unity-inmall-input" type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
              {error && <p className="unity-inmall-error">{error}</p>}
              <button type="submit" className="unity-inmall-btn-primary" disabled={loading}>
                {loading ? "..." : "Create account"}
              </button>
              <p className="unity-inmall-switch">
                Have an account?{" "}
                <button type="button" onClick={() => { setMode("login"); setError(""); }}>
                  Login
                </button>
              </p>
            </form>
          )}

          {flow === "shipping" && (
            <form onSubmit={handleShipping}>
              <div className="unity-inmall-row">
                <input className="unity-inmall-input" placeholder="First name *" value={ship.firstName} onChange={(e) => setShip({ ...ship, firstName: e.target.value })} required />
                <input className="unity-inmall-input" placeholder="Last name *" value={ship.lastName} onChange={(e) => setShip({ ...ship, lastName: e.target.value })} required />
              </div>
              <input className="unity-inmall-input" placeholder="Address *" value={ship.address1} onChange={(e) => setShip({ ...ship, address1: e.target.value })} required />
              <div className="unity-inmall-row">
                <input className="unity-inmall-input" placeholder="City *" value={ship.city} onChange={(e) => setShip({ ...ship, city: e.target.value })} required />
                <input className="unity-inmall-input" placeholder="State *" value={ship.state} onChange={(e) => setShip({ ...ship, state: e.target.value })} required />
              </div>
              <div className="unity-inmall-row">
                <input className="unity-inmall-input" placeholder="Postal *" value={ship.postal} onChange={(e) => setShip({ ...ship, postal: e.target.value })} required />
                <input className="unity-inmall-input" placeholder="Phone *" value={ship.phone} onChange={(e) => setShip({ ...ship, phone: e.target.value })} required />
              </div>
              {error && <p className="unity-inmall-error">{error}</p>}
              <button type="submit" className="unity-inmall-btn-primary">Continue to payment</button>
            </form>
          )}

          {flow === "payment" && (
            <div>
              <p className="unity-inmall-summary">Total Payable: Rs. {subtotal.toLocaleString()}</p>
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "8px", padding: "8px 10px", marginBottom: "12px" }}>
                {checkoutItems.map((item) => (
                  <p key={item.id || item._id} className="unity-inmall-line" style={{ margin: "2px 0", fontSize: "11px" }}>
                    • {item.name} x{item.qty || item.quantity || 1}
                  </p>
                ))}
              </div>

              {/* Stripe Session Button */}
              <button
                type="button"
                className="unity-inmall-btn-primary"
                onClick={handleStripeSession}
                disabled={loading}
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", marginBottom: "14px" }}
              >
                {loading ? "Redirecting..." : `💳 Stripe Hosted Checkout (Opens in Tab)`}
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "10px 0", fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.15)" }} />
                <span>OR PAY DIRECTLY IN 3D MALL</span>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.15)" }} />
              </div>

              <form onSubmit={handleDirectPayment}>
                <label className="unity-inmall-label">Card Number (16 Digits)</label>
                <input
                  className="unity-inmall-input"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  maxLength={19}
                  required
                />

                <div className="unity-inmall-row">
                  <div>
                    <label className="unity-inmall-label">Expiry (MM/YY)</label>
                    <input
                      className="unity-inmall-input"
                      placeholder="12/28"
                      value={cardExp}
                      onChange={handleCardExpChange}
                      maxLength={5}
                      required
                    />
                  </div>
                  <div>
                    <label className="unity-inmall-label">CVC (3-4 Digits)</label>
                    <input
                      className="unity-inmall-input"
                      type="password"
                      placeholder="123"
                      value={cardCvc}
                      onChange={handleCardCvcChange}
                      maxLength={4}
                      required
                    />
                  </div>
                </div>

                {error && <p className="unity-inmall-error">{error}</p>}
                <button type="submit" className="unity-inmall-btn-primary" disabled={loading} style={{ marginTop: "12px" }}>
                  {loading ? "Processing Order..." : `🔒 Instant Pay Rs. ${subtotal.toLocaleString()}`}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
