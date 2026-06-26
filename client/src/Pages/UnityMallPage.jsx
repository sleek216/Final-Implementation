import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../api";
import Product3DModal from "../components/Product3DModal";
import { UNITY_BUILD } from "../config";
import "../styles/UnityMall.css";

const loadScript = (src) =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-unity-src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.dataset.unitySrc = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });

export default function UnityMallPage() {
  const [searchParams] = useSearchParams();
  const spawnPoint = searchParams.get("spawn") || "entrance";

  const canvasRef = useRef(null);
  const unityInstanceRef = useRef(null);

  const [phase, setPhase] = useState("loading");
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [product, setProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setProduct(null);
    document.body.style.overflow = "";
  }, []);

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
      toast.error(`Product not found: ${code}. DB mein productId match karo.`);
    } finally {
      setLoadingProduct(false);
    }
  }, []);

  useLayoutEffect(() => {
    window.openProduct = openProductFromUnity;
    return () => {
      delete window.openProduct;
    };
  }, [openProductFromUnity]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootUnity = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        setPhase("loading");
        setLoadError("");
        setLoadProgress(0);

        await loadScript(UNITY_BUILD.loaderUrl);

        if (cancelled || typeof window.createUnityInstance !== "function") {
          throw new Error(
            `Unity loader not found. Build files ko client/public/unity/Build/ mein rakho (${UNITY_BUILD.buildName}.*).`
          );
        }

        const config = {
          dataUrl: UNITY_BUILD.dataUrl,
          frameworkUrl: UNITY_BUILD.frameworkUrl,
          codeUrl: UNITY_BUILD.codeUrl,
          streamingAssetsUrl: UNITY_BUILD.streamingAssetsUrl,
          companyName: UNITY_BUILD.companyName,
          productName: UNITY_BUILD.productName,
          productVersion: UNITY_BUILD.productVersion,
        };

        const instance = await window.createUnityInstance(
          canvas,
          config,
          (progress) => {
            if (!cancelled) setLoadProgress(Math.round(progress * 100));
          }
        );

        if (cancelled) {
          instance?.Quit?.();
          return;
        }

        unityInstanceRef.current = instance;
        setPhase("ready");
        setLoadProgress(100);

        // Tell Unity to place player at mall entrance (Main-Gate)
        try {
          if (spawnPoint) {
            instance.SendMessage("MallSpawnManager", "SpawnAt", spawnPoint);
          }
        } catch (e) {
          console.warn("[UnityMall] Spawn message failed - add MallSpawnManager in Unity scene:", e);
        }
      } catch (error) {
        console.error("[UnityMall] Load failed:", error);
        if (!cancelled) {
          setPhase("error");
          setLoadError(
            error.message ||
              "Unity build load nahi hui. README dekho: client/public/unity/README.md"
          );
        }
      }
    };

    bootUnity();

    return () => {
      cancelled = true;
      if (unityInstanceRef.current?.Quit) {
        unityInstanceRef.current.Quit();
        unityInstanceRef.current = null;
      }
    };
  }, [spawnPoint]);

  return (
    <div className={`unity-mall-page ${modalOpen ? "unity-mall-page--modal-open" : ""}`}>
      <header className="unity-mall-header">
        <Link to="/home" className="unity-mall-back">
          ← Back to Store
        </Link>
        <p className="unity-mall-title">FashionVerse Unity Mall</p>
        <Link to="/3d-mall" className="unity-mall-alt">
          Three.js Mall →
        </Link>
      </header>

      <div className="unity-mall-canvas-wrap">
        <canvas
          ref={canvasRef}
          id="unity-canvas"
          className="unity-mall-canvas"
          tabIndex={-1}
        />

        {phase === "loading" && (
          <div className="unity-mall-overlay">
            <p className="unity-mall-overlay__title">Loading Unity Mall...</p>
            <div className="unity-mall-progress">
              <div className="unity-mall-progress__fill" style={{ width: `${loadProgress}%` }} />
            </div>
            <span>{loadProgress}%</span>
          </div>
        )}

        {phase === "error" && (
          <div className="unity-mall-overlay unity-mall-overlay--error">
            <h2>Unity Build Missing</h2>
            <p>{loadError}</p>
            <ol className="unity-mall-steps">
              <li>Unity se WebGL build export karo</li>
              <li>
                <code>Build/</code> folder copy karo →{" "}
                <code>client/public/unity/Build/</code>
              </li>
              <li>
                <code>StreamingAssets/</code> (agar ho) →{" "}
                <code>client/public/unity/StreamingAssets/</code>
              </li>
              <li>
                Build name <code>{UNITY_BUILD.buildName}</code> hona chahiye ya{" "}
                <code>.env</code> mein <code>VITE_UNITY_BUILD_NAME</code> set karo
              </li>
            </ol>
          </div>
        )}

        {phase === "ready" && (
          <div className="unity-mall-hud">
            <span>Poster dekho → <kbd>F</kbd> press → 3D product modal</span>
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
