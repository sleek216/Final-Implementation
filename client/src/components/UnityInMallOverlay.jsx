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
    if (!otpSent) {
      setError("Send OTP first");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: regName,
        email: regEmail,
        phone: regPhone,
        password: regPassword,
        otp: regOtp,
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

  const handlePayment = async () => {
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
        toast.info("Complete payment in the Stripe tab. Unity mall stays open here.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Payment could not start");
    } finally {
      setLoading(false);
    }
  };

  const title =
    flow === "shipping"
      ? "Shipping"
      : flow === "payment"
        ? "Payment"
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
              <div className="unity-inmall-otp-row">
                <input className="unity-inmall-input" value={regOtp} onChange={(e) => setRegOtp(e.target.value)} placeholder="6-digit OTP" maxLength={6} />
                <button type="button" className="unity-inmall-btn-ghost" onClick={handleSendOtp} disabled={loading}>
                  Send OTP
                </button>
              </div>
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
              <p className="unity-inmall-summary">Total: Rs. {subtotal.toLocaleString()}</p>
              {checkoutItems.map((item) => (
                <p key={item.id || item._id} className="unity-inmall-line">
                  {item.name} x{item.qty || item.quantity || 1}
                </p>
              ))}
              <p className="unity-inmall-hint">Stripe opens in a new tab. Mall stays here.</p>
              {error && <p className="unity-inmall-error">{error}</p>}
              <button type="button" className="unity-inmall-btn-primary" onClick={handlePayment} disabled={loading}>
                {loading ? "..." : `Pay Rs. ${subtotal.toLocaleString()}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
