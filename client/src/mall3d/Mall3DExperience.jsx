import { useEffect, useRef, useState, useCallback } from "react";

const MALL_MODEL_URL = "/models/mall/mall_model_web.glb";

const prefetchMallAssets = () => {
  if (document.querySelector('link[data-mall-prefetch="model"]')) return;

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "fetch";
  link.href = MALL_MODEL_URL;
  link.crossOrigin = "anonymous";
  link.dataset.mallPrefetch = "model";
  document.head.appendChild(link);
};

export default function Mall3DExperience({ onPlayStateChange }) {
  const mountRef = useRef(null);
  const sceneApiRef = useRef(null);
  const startedRef = useRef(false);

  const [phase, setPhase] = useState("loading");
  const [loadStage, setLoadStage] = useState("engine");
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [isSprinting, setIsSprinting] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [storeNotice, setStoreNotice] = useState("");

  const showStoreNotice = useCallback(() => {
    setStoreNotice("Entered Store");
    window.clearTimeout(showStoreNotice._timer);
    showStoreNotice._timer = window.setTimeout(() => setStoreNotice(""), 2200);
  }, []);

  const teardown = useCallback(async () => {
    if (sceneApiRef.current) {
      const { destroyMallScene } = await import("@mall/mallScene.js");
      destroyMallScene(sceneApiRef.current);
      sceneApiRef.current = null;
    }
  }, []);

  useEffect(() => () => { teardown(); }, [teardown]);

  useEffect(() => {
    onPlayStateChange?.(isLocked);
  }, [isLocked, onPlayStateChange]);

  const initMall = useCallback(async () => {
    if (startedRef.current) return;
    const mount = mountRef.current;
    if (!mount) return;

    startedRef.current = true;
    setPhase("loading");
    setLoadError("");
    setLoadProgress(0);
    setLoadStage("engine");

    try {
      const { createMallScene, getMallModelUrl } = await import("@mall/mallScene.js");
      setLoadStage("download");

      const api = createMallScene(mount, {
        onProgress: (value, stage = "download") => {
          setLoadStage(stage);
          setLoadProgress(value);
        },
        onLocked: () => setIsLocked(true),
        onUnlocked: () => setIsLocked(false),
        onSprintChange: setIsSprinting,
        onEnterStore: showStoreNotice,
      });

      sceneApiRef.current = api;
      await api.loadModel(getMallModelUrl());
      setPhase("ready");
      setLoadProgress(100);
      setLoadStage("ready");
    } catch (error) {
      console.error("Mall load failed:", error);
      startedRef.current = false;
      await teardown();
      setPhase("error");
      setLoadError("3D mall load nahi ho saka. Model path check karo: /models/mall/mall_model_web.glb");
    }
  }, [teardown, showStoreNotice]);

  useEffect(() => {
    prefetchMallAssets();
    initMall();
  }, [initMall]);

  const startWalk = () => {
    setHasEntered(true);
    sceneApiRef.current?.lock();
  };

  const loadStageLabel = {
    engine: "Initializing engine...",
    download: "Downloading world assets...",
    processing: "Building mall environment...",
    ready: "Ready",
  }[loadStage] || "Loading...";

  const isPlaying = phase === "ready" && isLocked;

  return (
    <div className={`mall3d-experience ${isPlaying ? "mall3d-experience--playing" : ""}`}>
      <div ref={mountRef} className="mall3d-canvas-host" />

      {phase === "loading" && (
        <div className="mall3d-overlay mall3d-overlay--loading">
          <div className="mall3d-game-loader">
            <p className="mall3d-game-loader__title">FASHIONVERSE 3D MALL</p>
            <p className="mall3d-game-loader__status">{loadStageLabel}</p>
            <div className="mall3d-progress-track" aria-hidden="true">
              <div
                className="mall3d-progress-fill"
                style={{ width: `${Math.max(loadProgress, loadStage === "engine" ? 8 : 0)}%` }}
              />
            </div>
            <span className="mall3d-game-loader__pct">{loadProgress > 0 ? `${loadProgress}%` : "..."}</span>
          </div>
        </div>
      )}

      {phase === "error" && (
        <div className="mall3d-overlay mall3d-overlay--error">
          <div className="mall3d-pause-menu">
            <h2>Load Failed</h2>
            <p>{loadError}</p>
            <button
              type="button"
              className="mall3d-start-btn"
              onClick={() => {
                startedRef.current = false;
                setPhase("loading");
                initMall();
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {phase === "ready" && !isLocked && (
        <div className="mall3d-overlay mall3d-overlay--prompt" onClick={startWalk}>
          <div className="mall3d-pause-menu">
            <p className="mall3d-pause-menu__tag">{hasEntered ? "PAUSED" : "READY"}</p>
            <h2>{hasEntered ? "Game Paused" : "Enter the Mall"}</h2>
            <p>{hasEntered ? "Click anywhere to resume" : "First-person walkthrough — click to play"}</p>
            <div className="mall3d-controls-grid">
              <div><kbd>W A S D</kbd><span>Move</span></div>
              <div><kbd>SHIFT</kbd><span>Sprint</span></div>
              <div><kbd>MOUSE</kbd><span>Look</span></div>
              <div><kbd>ESC</kbd><span>Pause</span></div>
            </div>
            <button type="button" className="mall3d-start-btn mall3d-start-btn--game">
              {hasEntered ? "▶ Resume" : "▶ Play Now"}
            </button>
          </div>
        </div>
      )}

      {isPlaying && (
        <>
          <div className="mall3d-vignette" aria-hidden="true" />
          <div className="mall3d-crosshair" aria-hidden="true">
            <span />
            <span />
          </div>
          <div className="mall3d-hud mall3d-hud--game">
            <div className="mall3d-hud__top">
              <span className="mall3d-hud__brand">FashionVerse Mall</span>
              {isSprinting && <span className="mall3d-hud__sprint">SPRINT</span>}
              {storeNotice && <span className="mall3d-hud__store">{storeNotice}</span>}
            </div>
            <div className="mall3d-hud__keys">
              <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move</span>
              <span><kbd>SHIFT</kbd> Sprint</span>
              <span><kbd>ESC</kbd> Pause</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
