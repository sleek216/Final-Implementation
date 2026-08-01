import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api";
import Product3DModal from "../components/Product3DModal";
import "../styles/UnityMall.css";

const STORAGE_KEY = "fv_unity_server_url";

export default function UnityMallPage() {
  const [searchParams] = useSearchParams();
  const spawnPoint = searchParams.get("spawn") || "entrance";

  const iframeRef = useRef(null);

  /* ── URL input state ── */
  const [savedUrl, setSavedUrl] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [urlInput, setUrlInput] = useState(savedUrl);
  const [connected, setConnected] = useState(!!savedUrl);

  /* ── Unity state ── */
  const [unityReady, setUnityReady] = useState(false);
  const [product, setProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);

  /* ── Build the iframe src ── */
  const iframeSrc = connected && savedUrl
    ? `${savedUrl.replace(/\/+$/, "")}?spawn=${encodeURIComponent(spawnPoint)}`
    : "";

  /* ── Connect handler ── */
  const handleConnect = (e) => {
    e.preventDefault();
    const url = urlInput.trim();
    if (!url) {
      toast.error("Please enter a URL");
      return;
    }
    localStorage.setItem(STORAGE_KEY, url);
    setSavedUrl(url);
    setConnected(true);
    setUnityReady(false);
    toast.success("Connecting to Unity build...");
  };

  /* ── Disconnect / change URL ── */
  const handleDisconnect = () => {
    setConnected(false);
    setUnityReady(false);
    setModalOpen(false);
    setProduct(null);
  };

  /* ── Close product modal ── */
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setProduct(null);
    document.body.style.overflow = "";
  }, []);

  /* ── Open product from Unity ── */
  const openProductFromUnity = useCallback(async (productCode) => {
    const code = String(productCode || "").trim();
    if (!code) return;

    setLoadingProduct(true);
    try {
      const res = await api.get(`/products/${encodeURIComponent(code)}`);
      setProduct(res.data);
      setModalOpen(true);
      document.body.style.overflow = "hidden";
    } catch (err) {
      console.error("[UnityMall] Product fetch failed:", err);
      toast.error(`Product not found: ${code}. Check productId in database.`);
    } finally {
      setLoadingProduct(false);
    }
  }, []);

  /* ── Also register as window.openProduct for the jslib fallback ── */
  useEffect(() => {
    window.openProduct = openProductFromUnity;
    return () => { delete window.openProduct; };
  }, [openProductFromUnity]);

  /* ── Listen for postMessage from Unity iframe ── */
  useEffect(() => {
    const handler = (event) => {
      if (!event.data || typeof event.data !== "object") return;

      if (event.data.type === "FV_OPEN_PRODUCT") {
        openProductFromUnity(event.data.productCode);
      }
      if (event.data.type === "FV_UNITY_READY") {
        setUnityReady(true);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [openProductFromUnity]);

  /* ── Cleanup body overflow on unmount ── */
  useEffect(() => {
    return () => { document.body.style.overflow = ""; };
  }, []);

  /* ══════════ RENDER ══════════ */

  /* -- URL input screen -- */
  if (!connected) {
    return (
      <div className="unity-mall-page">
        <header className="unity-mall-header">
          <Link to="/home" className="unity-mall-back">← Back to Store</Link>
          <p className="unity-mall-title">FashionVerse Unity Mall</p>
          <Link to="/3d-mall" className="unity-mall-alt">Three.js Mall →</Link>
        </header>

        <div className="unity-mall-connect-screen">
          <div className="unity-mall-connect-card">
            <div className="unity-mall-connect-icon">🎮</div>
            <h2 className="unity-mall-connect-heading">Connect Unity Build</h2>
            <p className="unity-mall-connect-desc">
              Enter the URL of your local Unity WebGL server.<br />
              Run the build from Unity (Build & Run) and paste the URL here.
            </p>
            <form onSubmit={handleConnect} className="unity-mall-connect-form">
              <input
                type="url"
                className="unity-mall-connect-input"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost:51234"
                autoFocus
                required
              />
              <button type="submit" className="unity-mall-connect-btn">
                ▶ Connect & Play
              </button>
            </form>
            <p className="unity-mall-connect-hint">
              Tip: The port changes each time Unity runs. Copy the full URL from your browser.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* -- Connected: show iframe -- */
  return (
    <div className={`unity-mall-page ${modalOpen ? "unity-mall-page--modal-open" : ""}`}>
      <header className="unity-mall-header">
        <Link to="/home" className="unity-mall-back">← Back to Store</Link>
        <p className="unity-mall-title">FashionVerse Unity Mall</p>
        <button
          type="button"
          className="unity-mall-alt unity-mall-change-url"
          onClick={handleDisconnect}
        >
          Change URL
        </button>
      </header>

      <div className="unity-mall-canvas-wrap">
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className="unity-mall-iframe"
          title="FashionVerse Unity Mall"
          allow="autoplay; fullscreen; pointer-lock; gamepad"
          allowFullScreen
        />

        {!unityReady && (
          <div className="unity-mall-overlay">
            <p className="unity-mall-overlay__title">Loading Unity Mall...</p>
            <div className="unity-mall-progress">
              <div className="unity-mall-progress__fill unity-mall-progress__fill--pulse" />
            </div>
            <p className="unity-mall-overlay__subtitle">
              Connected to: <code>{savedUrl}</code>
            </p>
          </div>
        )}

        {unityReady && !modalOpen && (
          <div className="unity-mall-hud">
            <span>Walk to a poster → press <kbd>F</kbd> or <kbd>E</kbd> → view product</span>
          </div>
        )}

        {loadingProduct && (
          <div className="unity-mall-fetching">Loading product...</div>
        )}
      </div>

      {modalOpen && product && (
        <Product3DModal product={product} onClose={closeModal} fullscreen />
      )}
    </div>
  );
}
