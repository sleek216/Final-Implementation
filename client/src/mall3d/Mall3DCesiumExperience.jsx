import { useCallback, useEffect, useRef, useState } from "react";
import "cesium/Build/Cesium/Widgets/widgets.css";

export default function Mall3DCesiumExperience() {
  const mountRef = useRef(null);
  const sceneApiRef = useRef(null);
  const startedRef = useRef(false);

  const [phase, setPhase] = useState("loading");
  const [loadStage, setLoadStage] = useState("engine");
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState("");

  const teardown = useCallback(async () => {
    if (sceneApiRef.current) {
      const { destroyCesiumMallScene } = await import("@mall/cesiumMallScene.js");
      destroyCesiumMallScene(sceneApiRef.current);
      sceneApiRef.current = null;
    }
  }, []);

  useEffect(() => () => { teardown(); }, [teardown]);

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
      const { createCesiumMallScene } = await import("@mall/cesiumMallScene.js");
      const api = await createCesiumMallScene(mount, {
        onProgress: (value, stage = "download") => {
          setLoadStage(stage);
          setLoadProgress(value);
        },
      });

      sceneApiRef.current = api;
      setPhase("ready");
      setLoadProgress(100);
      setLoadStage("ready");
    } catch (error) {
      console.error("Cesium mall load failed:", error);
      startedRef.current = false;
      await teardown();
      setPhase("error");
      setLoadError(
        error?.message ||
          "Cesium Ion mall load nahi ho saka. Token ya asset ID check karo."
      );
    }
  }, [teardown]);

  useEffect(() => {
    initMall();
  }, [initMall]);

  const loadStageLabel = {
    engine: "Cesium engine load ho rahi hai...",
    download: "Ion tileset download ho raha hai...",
    processing: "Tileset process ho raha hai...",
    ready: "Ready",
  }[loadStage] || "Loading...";

  return (
    <div className="mall3d-experience mall3d-experience--cesium">
      <div ref={mountRef} className="mall3d-canvas-host mall3d-cesium-host" />

      {phase === "loading" && (
        <div className="mall3d-overlay mall3d-overlay--loading">
          <p>Loading Cesium Mall... {loadProgress > 0 ? `${loadProgress}%` : ""}</p>
          <div className="mall3d-progress-track" aria-hidden="true">
            <div
              className="mall3d-progress-fill"
              style={{ width: `${Math.max(loadProgress, loadStage === "engine" ? 8 : 0)}%` }}
            />
          </div>
          <span>{loadStageLabel}</span>
          <span className="mall3d-load-tip">
            Ion streaming tiles — poora 47MB ek sath download nahi hota, is liye shuruat tez ho sakti hai.
          </span>
        </div>
      )}

      {phase === "error" && (
        <div className="mall3d-overlay mall3d-overlay--error">
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
      )}

      {phase === "ready" && (
        <div className="mall3d-hud">
          <span>Cesium Ion — Asset {4936723}</span>
          <span>Mouse — Orbit / zoom</span>
          <span>Right drag — Look</span>
        </div>
      )}
    </div>
  );
}
