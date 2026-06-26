/**
 * FashionVerse - Unity WebGL bridge (standalone builds)
 * Defines window.openProduct BEFORE Unity loads.
 *
 * Unity WebGL template: paste into index.html <head>
 * Or: Assets/WebGLTemplates/FashionVerse/index.html (see template folder)
 */
(function () {
  var API_BASE = "http://localhost:5005/api";

  function ensureModelViewer() {
    if (document.getElementById("fv-model-viewer-script")) return;
    var s = document.createElement("script");
    s.id = "fv-model-viewer-script";
    s.type = "module";
    s.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js";
    document.head.appendChild(s);
  }

  function closeModal() {
    var el = document.getElementById("fv-product-modal");
    if (el) el.remove();
    document.body.style.overflow = "";
    var c = document.getElementById("unity-container");
    if (c) c.style.pointerEvents = "auto";
    var cv = document.getElementById("unity-canvas");
    if (cv) cv.style.pointerEvents = "auto";
  }

  function sketchfabUrl(url) {
    if (url.indexOf("sketchfab.com") === -1) return url;
    if (url.indexOf("/embed") === -1) {
      var parts = url.split("/");
      var id = parts[parts.length - 1] || parts[parts.length - 2];
      url = "https://sketchfab.com/models/" + id + "/embed";
    }
    var sep = url.indexOf("?") >= 0 ? "&" : "?";
    return (
      url + sep +
      "autostart=1&preload=1&autospin=0.15&scrollwheel=1&navigation_controls=1" +
      "&ui_controls=1&ui_stop=0&ui_watermark=0&ui_hint=0&ui_infos=0&ui_help=0" +
          "&ui_inspector=0&ui_ar=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_animations=0" +
      "&transparent=0&annotation=0&annotations=0"
    );
  }

  function renderModel(url) {
    if (!url) return "<p style='color:#fff;padding:2rem'>No 3D model URL</p>";
    var lower = url.toLowerCase();
    if (lower.endsWith(".glb") || lower.endsWith(".gltf")) {
      return (
        '<model-viewer src="' +
        url +
        '" camera-controls auto-rotate touch-action="pan-y" interaction-prompt="auto" shadow-intensity="1" environment-image="neutral" style="background:transparent;--poster-color:transparent"></model-viewer>'
      );
    }
    return (
      '<iframe src="' +
      sketchfabUrl(url) +
      '" allow="autoplay; fullscreen; xr-spatial-tracking; gyroscope; accelerometer"></iframe>'
    );
  }

  function openModal(product) {
    closeModal();
    ensureModelViewer();

    if (!document.getElementById("fv-modal-styles")) {
      var st = document.createElement("style");
      st.id = "fv-modal-styles";
      st.textContent =
        "#fv-product-modal{position:fixed!important;inset:0!important;z-index:2147483647!important}" +
        "#fv-product-modal .fv-viewer-pane{position:fixed;inset:0;right:min(420px,38vw);z-index:1;background:rgba(0,0,0,0.4)}" +
        "#fv-product-modal .fv-viewer-pane model-viewer,#fv-product-modal .fv-viewer-pane iframe{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;border:0!important}" +
        "#fv-product-modal .fv-details-pane{position:fixed;top:0;right:0;bottom:0;width:min(420px,38vw);z-index:2;padding:28px 24px;overflow-y:auto;background:rgba(255,255,255,0.88);backdrop-filter:blur(16px);border-left:1px solid rgba(255,255,255,0.5)}" +
        "#fv-product-modal .fv-hint{position:fixed;bottom:18px;left:18px;z-index:3;padding:8px 14px;background:rgba(0,0,0,0.65);color:#fff;font-size:12px;border-radius:8px;pointer-events:none}" +
        "#fv-product-modal #fv-close-btn{position:fixed;top:16px;right:min(436px,calc(38vw + 16px));z-index:4;border:0;background:rgba(17,24,39,0.9);color:#fff;width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:22px}";
      document.head.appendChild(st);
    }

    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
    var uc = document.getElementById("unity-container");
    if (uc) uc.style.pointerEvents = "none";
    var ucv = document.getElementById("unity-canvas");
    if (ucv) ucv.style.pointerEvents = "none";

    var price =
      typeof product.price === "number"
        ? "Rs. " + product.price.toLocaleString()
        : product.price;

    var modelHtml =
      product.is3DEnabled && product.model3DUrl
        ? renderModel(product.model3DUrl)
        : "<p style='color:#fff;padding:2rem'>3D not enabled</p>";

    var brand = product.brand && product.brand.name ? product.brand.name : "";
    var wrap = document.createElement("div");
    wrap.id = "fv-product-modal";
    wrap.innerHTML =
      '<div class="fv-viewer-pane">' + modelHtml + "</div>" +
      '<p class="fv-hint">Drag to rotate | Scroll to zoom</p>' +
      '<button id="fv-close-btn" type="button">X</button>' +
      '<div class="fv-details-pane">' +
      '<p style="margin:0 0 6px;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#6b7280">3D Product View</p>' +
      "<h2 style=\"margin:0 0 8px;font-size:26px;font-family:Georgia,serif\">" +
      (product.name || "") +
      "</h2>" +
      "<p style=\"color:#64748b;margin:0 0 12px\">" + brand + "</p>" +
      "<p style=\"font-size:22px;font-weight:700;margin:0 0 16px\">" + price + "</p>" +
      "<p style=\"color:#475569;line-height:1.6;margin:0\">" + (product.description || "") + "</p>" +
      "</div>";

    document.body.appendChild(wrap);
    document.body.style.overflow = "hidden";

    document.getElementById("fv-close-btn").onclick = closeModal;
  }

  window.openProduct = async function (productCode) {
    var code = String(productCode || "").trim();
    if (!code) return;

    console.log("[FashionVerse] openProduct:", code);

    try {
      var res = await fetch(API_BASE + "/products/" + encodeURIComponent(code));
      if (!res.ok) throw new Error("Product not found: " + code);
      var product = await res.json();
      openModal(product);
    } catch (err) {
      console.error("[FashionVerse] openProduct failed:", err);
      alert("Product not found: " + code + "\n\nDB mein productId match karo.");
    }
  };

  console.log("[FashionVerse] window.openProduct ready");
})();
