mergeInto(LibraryManager.library, {
  OpenProduct: function (codePtr) {
    var code = UTF8ToString(codePtr);

    if (typeof window.openProduct === "function" && window.__fvInitBridge) {
      window.openProduct(code);
      return;
    }

    if (!window.__fvInitBridge) {
      window.__fvInitBridge = true;
      var API_BASE = "http://localhost:5005/api";
      var SITE_BASE = "http://localhost:3000";
      var UPLOADS_BASE = "http://localhost:5005/uploads";
      var state = { product: null, size: "", color: "", qty: 1, pendingAction: null, inMallFlow: null };

      function injectStyles() {
        if (document.getElementById("fv-modal-styles")) return;
        if (!document.querySelector('meta[name="viewport"]')) {
          var vp = document.createElement("meta");
          vp.name = "viewport";
          vp.content = "width=device-width, height=device-height, initial-scale=1.0, user-scalable=no";
          document.head.appendChild(vp);
        }
        var st = document.createElement("style");
        st.id = "fv-modal-styles";
        st.textContent =
          "#unity-container,#unity-canvas{z-index:1!important}" +
          "#fv-product-modal{position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:auto!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;background:rgba(0,0,0,0.22)!important;backdrop-filter:blur(4px)!important;-webkit-backdrop-filter:blur(4px)!important}" +
          "#fv-product-modal *{box-sizing:border-box}" +
          "#fv-product-modal .fv-card{width:min(1120px,calc(100vw - 40px))!important;height:min(86vh,720px)!important;max-height:calc(100vh - 40px)!important;background:rgba(255,255,255,0.1)!important;backdrop-filter:blur(22px)!important;-webkit-backdrop-filter:blur(22px)!important;border:1px solid rgba(255,255,255,0.28)!important;border-radius:20px!important;box-shadow:0 24px 64px rgba(0,0,0,0.35)!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;pointer-events:auto!important}" +
          "#fv-product-modal .fv-card-header{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:14px 18px!important;border-bottom:1px solid rgba(255,255,255,0.18)!important;flex-shrink:0!important}" +
          "#fv-product-modal .fv-card-header span{font-size:11px!important;font-weight:700!important;letter-spacing:1.4px!important;text-transform:uppercase!important;color:rgba(255,255,255,0.72)!important}" +
          "#fv-product-modal #fv-close-btn{border:1px solid rgba(255,255,255,0.35)!important;background:rgba(0,0,0,0.35)!important;color:#fff!important;width:34px!important;height:34px!important;border-radius:50%!important;cursor:pointer!important;font-size:16px!important;line-height:1!important;position:static!important}" +
          "#fv-product-modal .fv-card-body{flex:1!important;min-height:0!important;display:grid!important;grid-template-columns:minmax(0,1.12fr) minmax(280px,0.88fr)!important;gap:16px!important;padding:0 18px 18px!important;overflow:hidden!important}" +
          "#fv-product-modal .fv-viewer-pane{position:relative!important;background:rgba(0,0,0,0.18)!important;border-radius:14px!important;overflow:hidden!important;min-height:0!important;border:1px solid rgba(255,255,255,0.15)!important}" +
          "#fv-product-modal .fv-viewer-pane model-viewer," +
          "#fv-product-modal .fv-viewer-pane iframe{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;border:0!important;display:block!important;background:transparent!important}" +
          "#fv-product-modal .fv-details-pane{overflow-y:auto!important;padding:14px 16px!important;color:#fff!important;min-height:0!important;background:rgba(255,255,255,0.06)!important;border:1px solid rgba(255,255,255,0.14)!important;border-radius:14px!important}" +
          "#fv-product-modal .fv-details-pane h2{margin:4px 0 6px!important;font-size:clamp(20px,2vw,26px)!important;font-family:Georgia,serif!important;font-weight:600!important;color:#fff!important}" +
          "#fv-product-modal .fv-brand{font-size:12px!important;color:rgba(255,255,255,0.72)!important;margin:0 0 8px!important;text-transform:uppercase!important;letter-spacing:0.5px!important}" +
          "#fv-product-modal .fv-price{font-size:22px!important;font-weight:700!important;margin:0 0 10px!important;color:#fff!important}" +
          "#fv-product-modal .fv-desc{font-size:14px!important;line-height:1.6!important;color:rgba(255,255,255,0.88)!important;margin:0 0 14px!important}" +
          "#fv-product-modal .fv-options{display:flex!important;flex-direction:column!important;gap:12px!important;margin-bottom:14px!important}" +
          "#fv-product-modal .fv-opt-group span{display:block!important;font-size:11px!important;text-transform:uppercase!important;letter-spacing:0.8px!important;color:rgba(255,255,255,0.65)!important;margin-bottom:6px!important}" +
          "#fv-product-modal .fv-opt-list{display:flex!important;flex-wrap:wrap!important;gap:6px!important}" +
          "#fv-product-modal .fv-size-btn{padding:6px 14px!important;border:1px solid rgba(255,255,255,0.35)!important;border-radius:6px!important;background:rgba(255,255,255,0.08)!important;color:#fff!important;font-size:12px!important;cursor:pointer!important}" +
          "#fv-product-modal .fv-size-btn.active{background:#fff!important;color:#111!important;border-color:#fff!important;font-weight:600!important}" +
          "#fv-product-modal .fv-color-swatch{width:26px!important;height:26px!important;border-radius:50%!important;border:2px solid rgba(255,255,255,0.45)!important;cursor:pointer!important;padding:2px!important;background-clip:content-box!important}" +
          "#fv-product-modal .fv-color-swatch.active{border-color:#fff!important;box-shadow:0 0 0 2px rgba(255,255,255,0.4)!important}" +
          "#fv-product-modal .fv-qty{display:inline-flex!important;align-items:center!important;border:1px solid rgba(255,255,255,0.35)!important;border-radius:8px!important;overflow:hidden!important}" +
          "#fv-product-modal .fv-qty button{width:34px!important;height:34px!important;border:0!important;background:rgba(255,255,255,0.1)!important;color:#fff!important;font-size:16px!important;cursor:pointer!important}" +
          "#fv-product-modal .fv-qty span{min-width:40px!important;text-align:center!important;font-size:14px!important;color:#fff!important}" +
          "#fv-product-modal .fv-actions{display:flex!important;flex-direction:column!important;gap:10px!important}" +
          "#fv-product-modal .fv-btn-add{width:100%!important;padding:13px 16px!important;border:1px solid rgba(255,255,255,0.45)!important;border-radius:8px!important;background:rgba(255,255,255,0.14)!important;color:#fff!important;font-size:13px!important;font-weight:600!important;cursor:pointer!important}" +
          "#fv-product-modal .fv-btn-buy{width:100%!important;padding:13px 16px!important;border:0!important;border-radius:8px!important;background:#fff!important;color:#111!important;font-size:13px!important;font-weight:600!important;cursor:pointer!important}" +
          "#fv-product-modal .fv-stock{font-size:11px!important;color:#fca5a5!important;margin:8px 0 0!important}" +
          "#fv-product-modal .fv-hint{position:absolute!important;bottom:12px!important;left:12px!important;z-index:2!important;margin:0!important;padding:8px 12px!important;background:rgba(0,0,0,0.55)!important;color:#fff!important;font-size:11px!important;border-radius:8px!important;pointer-events:none!important}" +
          "#fv-product-modal .fv-mini-cart{display:none!important;position:fixed!important;bottom:24px!important;right:24px!important;width:min(320px,calc(100vw - 48px))!important;max-height:min(42vh,360px)!important;z-index:2147483647!important;flex-direction:column!important;background:rgba(255,255,255,0.12)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important;color:#fff!important;border:1px solid rgba(255,255,255,0.28)!important;border-radius:14px!important;box-shadow:0 16px 48px rgba(0,0,0,0.3)!important;overflow:hidden!important;pointer-events:auto!important}" +
          "#fv-product-modal .fv-mini-cart.open{display:flex!important}" +
          "#fv-product-modal .fv-mini-cart-hd{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:12px 14px!important;border-bottom:1px solid rgba(255,255,255,0.18)!important;font-size:12px!important;font-weight:700!important;letter-spacing:1px!important;text-transform:uppercase!important}" +
          "#fv-product-modal .fv-mini-cart-body{overflow-y:auto!important;padding:8px 12px!important;flex:1!important}" +
          "#fv-product-modal .fv-cart-item{display:flex!important;gap:10px!important;padding:8px 0!important;border-bottom:1px solid rgba(255,255,255,0.12)!important;align-items:center!important}" +
          "#fv-product-modal .fv-cart-item img{width:48px!important;height:48px!important;object-fit:cover!important;border-radius:6px!important}" +
          "#fv-product-modal .fv-cart-item-info{flex:1!important;min-width:0!important}" +
          "#fv-product-modal .fv-cart-item-name{font-size:12px!important;font-weight:600!important;margin:0 0 2px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;color:#fff!important}" +
          "#fv-product-modal .fv-cart-item-meta{font-size:11px!important;color:rgba(255,255,255,0.7)!important;margin:0!important}" +
          "#fv-product-modal .fv-mini-cart-ft{padding:12px 14px!important;border-top:1px solid rgba(255,255,255,0.18)!important}" +
          "#fv-product-modal .fv-cart-total{display:flex!important;justify-content:space-between!important;font-size:14px!important;font-weight:700!important;margin-bottom:10px!important}" +
          "#fv-product-modal .fv-btn-checkout{width:100%!important;padding:12px!important;border:0!important;border-radius:8px!important;background:#fff!important;color:#111!important;font-size:13px!important;font-weight:600!important;cursor:pointer!important}" +
          "#fv-product-modal .fv-toast{position:fixed!important;bottom:24px!important;left:24px!important;z-index:2147483647!important;padding:10px 16px!important;background:rgba(16,185,129,0.92)!important;color:#fff!important;font-size:13px!important;border-radius:8px!important;pointer-events:none!important;opacity:0!important;transition:opacity 0.25s!important}" +
          "#fv-product-modal .fv-toast.show{opacity:1!important}" +
          "#fv-inmall-stack{position:fixed!important;bottom:24px!important;right:24px!important;z-index:2147483647!important;width:min(340px,calc(100vw - 48px))!important;pointer-events:auto!important}" +
          "#fv-inmall-card{background:rgba(255,255,255,0.12)!important;backdrop-filter:blur(20px)!important;-webkit-backdrop-filter:blur(20px)!important;border:1px solid rgba(255,255,255,0.28)!important;border-radius:14px!important;box-shadow:0 16px 48px rgba(0,0,0,0.35)!important;color:#fff!important;overflow:hidden!important}" +
          "#fv-inmall-hd{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:12px 14px!important;border-bottom:1px solid rgba(255,255,255,0.18)!important;font-size:12px!important;font-weight:700!important;letter-spacing:1px!important;text-transform:uppercase!important}" +
          "#fv-inmall-body{padding:14px!important;max-height:min(62vh,480px)!important;overflow-y:auto!important}" +
          "#fv-inmall-body input,#fv-inmall-body select{width:100%!important;padding:10px 12px!important;margin-bottom:6px!important;border:1px solid rgba(255,255,255,0.3)!important;border-radius:8px!important;background:rgba(0,0,0,0.2)!important;color:#fff!important;font-size:13px!important;box-sizing:border-box!important}" +
          "#fv-inmall-body label{display:block!important;font-size:10px!important;text-transform:uppercase!important;color:rgba(255,255,255,0.65)!important;margin:8px 0 4px!important}" +
          "#fv-inmall-body .fv-inmall-btn{width:100%!important;margin-top:10px!important;padding:12px!important;border:0!important;border-radius:8px!important;background:#fff!important;color:#111!important;font-size:13px!important;font-weight:600!important;cursor:pointer!important}" +
          "#fv-inmall-body .fv-inmall-ghost{padding:10px 12px!important;border:1px solid rgba(255,255,255,0.4)!important;border-radius:8px!important;background:rgba(255,255,255,0.1)!important;color:#fff!important;font-size:12px!important;cursor:pointer!important}" +
          "#fv-inmall-err{color:#fca5a5!important;font-size:12px!important;margin:6px 0!important}" +
          "#fv-inmall-switch{font-size:12px!important;text-align:center!important;margin-top:12px!important;color:rgba(255,255,255,0.75)!important}" +
          "#fv-inmall-switch button{background:none!important;border:none!important;color:#fff!important;font-weight:600!important;text-decoration:underline!important;cursor:pointer!important}" +
          "#fv-inmall-close-sm{border:0!important;background:rgba(0,0,0,0.35)!important;color:#fff!important;width:28px!important;height:28px!important;border-radius:50%!important;cursor:pointer!important}" +
          "@media(max-width:900px){#fv-product-modal .fv-card{height:min(92vh,900px)!important;overflow-y:auto!important}#fv-product-modal .fv-card-body{grid-template-columns:1fr!important;overflow:visible!important}#fv-product-modal .fv-viewer-pane{min-height:260px!important;height:260px!important}}";
        document.head.appendChild(st);
      }

      function esc(s) {
        if (!s) return "";
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      }

      function pauseUnity() {
        try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
        var c = document.getElementById("unity-container");
        if (c) c.style.pointerEvents = "none";
        var cv = document.getElementById("unity-canvas");
        if (cv) cv.style.pointerEvents = "none";
      }

      function resumeUnity() {
        var c = document.getElementById("unity-container");
        if (c) c.style.pointerEvents = "auto";
        var cv = document.getElementById("unity-canvas");
        if (cv) cv.style.pointerEvents = "auto";
      }

      function closeModal() {
        var el = document.getElementById("fv-product-modal");
        if (el) el.remove();
        document.body.style.overflow = "";
        resumeUnity();
        state.product = null;
      }

      function getUserId() {
        try {
          var u = JSON.parse(localStorage.getItem("user") || "null");
          return u ? (u._id || u.id) : null;
        } catch (e) { return null; }
      }

      function isCustomer() {
        return !!localStorage.getItem("token") && localStorage.getItem("role") === "customer";
      }

      function getCartKey() {
        var uid = getUserId();
        return uid ? "cart_" + uid : "cart_guest";
      }

      function getCart() {
        try { return JSON.parse(localStorage.getItem(getCartKey()) || "[]"); } catch (e) { return []; }
      }

      function saveCart(cart) {
        localStorage.setItem(getCartKey(), JSON.stringify(cart));
      }

      function mergeGuestCartIntoUser(userId) {
        var guest = [];
        try { guest = JSON.parse(localStorage.getItem("cart_guest") || "[]"); } catch (e) {}
        if (!guest.length) return;
        var userCart = [];
        try { userCart = JSON.parse(localStorage.getItem("cart_" + userId) || "[]"); } catch (e) {}
        var merged = userCart.slice();
        for (var i = 0; i < guest.length; i++) {
          var g = guest[i];
          var found = false;
          for (var j = 0; j < merged.length; j++) {
            if (merged[j].id === g.id) {
              merged[j].qty = (merged[j].qty || 1) + (g.qty || 1);
              found = true;
              break;
            }
          }
          if (!found) merged.push(g);
        }
        localStorage.setItem("cart_" + userId, JSON.stringify(merged));
        localStorage.removeItem("cart_guest");
      }

      function parsePrice(p) {
        if (typeof p === "number") return p;
        if (typeof p === "string") return parseFloat(p.replace(/[^0-9.]/g, "")) || 0;
        return 0;
      }

      function formatPrice(p) {
        return "Rs. " + parsePrice(p).toLocaleString();
      }

      function getImageUrl(product) {
        var img = product.images && product.images[0] ? product.images[0] : "";
        if (!img) return "";
        if (img.indexOf("http") === 0) return img;
        return UPLOADS_BASE + "/" + img;
      }

      function showToast(msg) {
        var t = document.getElementById("fv-toast");
        if (!t) return;
        t.textContent = msg;
        t.classList.add("show");
        setTimeout(function () { t.classList.remove("show"); }, 2200);
      }

      function renderMiniCart() {
        var el = document.getElementById("fv-mini-cart");
        var body = document.getElementById("fv-mini-cart-body");
        var totalEl = document.getElementById("fv-cart-total-val");
        var cc = document.getElementById("fv-cart-count");
        if (!el || !body) return;
        var cart = getCart();
        if (!cart.length) {
          el.classList.remove("open");
          return;
        }
        el.classList.add("open");
        if (cc) cc.textContent = "(" + cart.length + ")";
        var html = "";
        var total = 0;
        for (var i = 0; i < cart.length; i++) {
          var item = cart[i];
          var img = item.image || (item.images && item.images[0] ? item.images[0] : "");
          if (img && img.indexOf("http") !== 0) img = UPLOADS_BASE + "/" + img;
          var qty = item.qty || item.quantity || 1;
          total += parsePrice(item.price) * qty;
          html += '<div class="fv-cart-item">' +
            (img ? '<img src="' + esc(img) + '" alt="">' : '<div style="width:48px;height:48px;background:#e5e7eb;border-radius:6px"></div>') +
            '<div class="fv-cart-item-info"><p class="fv-cart-item-name">' + esc(item.name) + '</p>' +
            '<p class="fv-cart-item-meta">Qty ' + qty + (item.selectedSize ? " | " + esc(item.selectedSize) : "") + '</p></div>' +
            '<span style="font-size:12px;font-weight:600">' + formatPrice(item.price) + '</span></div>';
        }
        body.innerHTML = html;
        if (totalEl) totalEl.textContent = "Rs. " + total.toLocaleString();
      }

      function sketchfabUrl(url) {
        if (url.indexOf("sketchfab.com") === -1) return url;
        if (url.indexOf("/embed") === -1) {
          var parts = url.split("/");
          var id = parts[parts.length - 1] || parts[parts.length - 2];
          url = "https://sketchfab.com/models/" + id + "/embed";
        }
        var sep = url.indexOf("?") >= 0 ? "&" : "?";
        return url + sep +
          "autostart=1&preload=1&autospin=0.2&scrollwheel=1&navigation_controls=1" +
          "&ui_controls=1&ui_stop=0&ui_watermark=0&ui_hint=0&ui_infos=0&ui_help=0" +
          "&ui_inspector=0&ui_ar=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_animations=0" +
          "&transparent=0&annotation=0&annotations=0&dnt=1";
      }

      function resolveModelUrl(url) {
        if (!url) return url;
        if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) return url;
        if (url.charAt(0) === "/") return window.location.origin + url;
        return url;
      }

      function renderModel(url) {
        url = resolveModelUrl(url);
        if (!url) return "<p style='color:#fff;padding:2rem'>No 3D model</p>";
        var lower = url.toLowerCase();
        if (lower.indexOf(".glb") !== -1 || lower.indexOf(".gltf") !== -1) {
          return '<model-viewer src="' + esc(url) + '" camera-controls auto-rotate touch-action="pan-y" interaction-prompt="auto" shadow-intensity="1" exposure="1" environment-image="neutral" style="width:100%;height:100%;background:#111827;--poster-color:transparent"></model-viewer>';
        }
        return '<iframe src="' + sketchfabUrl(url) + '" allow="autoplay; fullscreen; xr-spatial-tracking; gyroscope; accelerometer"></iframe>';
      }

      function buildOptionsHtml(product) {
        var sizes = product.sizes && product.sizes.length ? product.sizes : ["One Size"];
        var colors = product.colors && product.colors.length ? product.colors : [];
        var sizeHtml = "";
        for (var i = 0; i < sizes.length; i++) {
          var s = sizes[i];
          sizeHtml += '<button type="button" class="fv-size-btn' + (state.size === s ? " active" : "") + '" data-size="' + esc(s) + '">' + esc(s) + '</button>';
        }
        var colorHtml = "";
        if (colors.length) {
          for (var j = 0; j < colors.length; j++) {
            var c = colors[j];
            colorHtml += '<div class="fv-color-swatch' + (state.color === c ? " active" : "") + '" data-color="' + esc(c) + '" style="background-color:' + esc(c) + '" title="' + esc(c) + '"></div>';
          }
        } else {
          colorHtml = '<span style="font-size:12px;color:#64748b">Default</span>';
        }
        return '<div class="fv-options">' +
          '<div class="fv-opt-group"><span>Color</span><div class="fv-opt-list">' + colorHtml + '</div></div>' +
          '<div class="fv-opt-group"><span>Size</span><div class="fv-opt-list">' + sizeHtml + '</div></div>' +
          '<div class="fv-opt-group"><span>Quantity</span><div class="fv-qty">' +
          '<button type="button" id="fv-qty-minus">-</button><span id="fv-qty-val">' + state.qty + '</span><button type="button" id="fv-qty-plus">+</button></div></div></div>';
      }

      function wireOptions() {
        var sizes = document.querySelectorAll("#fv-product-modal .fv-size-btn");
        for (var i = 0; i < sizes.length; i++) {
          sizes[i].onclick = function () {
            state.size = this.getAttribute("data-size");
            var all = document.querySelectorAll("#fv-product-modal .fv-size-btn");
            for (var j = 0; j < all.length; j++) all[j].classList.toggle("active", all[j] === this);
          };
        }
        var colors = document.querySelectorAll("#fv-product-modal .fv-color-swatch");
        for (var k = 0; k < colors.length; k++) {
          colors[k].onclick = function () {
            state.color = this.getAttribute("data-color");
            var allc = document.querySelectorAll("#fv-product-modal .fv-color-swatch");
            for (var m = 0; m < allc.length; m++) allc[m].classList.toggle("active", allc[m] === this);
          };
        }
        var minus = document.getElementById("fv-qty-minus");
        var plus = document.getElementById("fv-qty-plus");
        var qv = document.getElementById("fv-qty-val");
        if (minus) minus.onclick = function () {
          state.qty = Math.max(1, state.qty - 1);
          if (qv) qv.textContent = state.qty;
        };
        if (plus) plus.onclick = function () {
          state.qty += 1;
          if (qv) qv.textContent = state.qty;
        };
      }

      function formatProduct(product) {
        return {
          id: product._id || product.id,
          _id: product._id || product.id,
          name: product.name,
          price: parsePrice(product.price),
          image: getImageUrl(product),
          images: product.images || [],
          description: product.description,
          brand: product.brand,
          productId: product.productId,
          stock: product.stock
        };
      }

      function getCheckoutItems() {
        try {
          var buy = JSON.parse(localStorage.getItem("buyNowItem") || "null");
          if (buy) return [buy];
        } catch (e) {}
        return getCart();
      }

      function closeInMallStack() {
        state.inMallFlow = null;
        state.pendingAction = null;
        var el = document.getElementById("fv-inmall-stack");
        if (el) el.innerHTML = "";
        var mc = document.getElementById("fv-mini-cart");
        if (mc && getCart().length) mc.classList.add("open");
      }

      function apiPost(path, body, auth) {
        var headers = { "Content-Type": "application/json" };
        if (auth) {
          var tok = localStorage.getItem("token");
          if (tok) headers.Authorization = "Bearer " + tok;
        }
        return fetch(API_BASE + path, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(body || {})
        }).then(function (r) {
          return r.json().then(function (data) {
            if (!r.ok) throw new Error(data.message || "Request failed");
            return data;
          });
        });
      }

      function saveSession(data) {
        var user = data.user;
        var role = (user.role || "customer").toLowerCase();
        if (role === "user") role = "customer";
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", role);
        localStorage.setItem("user", JSON.stringify(user));
        var uid = user._id || user.id;
        if (uid) mergeGuestCartIntoUser(uid);
        return role;
      }

      function resumePendingAction() {
        if (state.pendingAction === "addCart" && state.product) {
          handleAddToCart();
        } else if (state.pendingAction === "buyNow" && state.product) {
          var p = formatProduct(state.product);
          localStorage.setItem("buyNowItem", JSON.stringify({
            id: p.id, _id: p.id, name: p.name, price: p.price, image: p.image,
            images: p.images, selectedSize: state.size, selectedColor: state.color, qty: state.qty
          }));
          showInMallFlow("shipping");
        } else if (state.pendingAction === "checkout") {
          localStorage.removeItem("buyNowItem");
          showInMallFlow("shipping");
        }
        state.pendingAction = null;
      }

      function showInMallFlow(flow) {
        state.inMallFlow = flow;
        var mc = document.getElementById("fv-mini-cart");
        if (mc) mc.classList.remove("open");
        var stack = document.getElementById("fv-inmall-stack");
        if (!stack) return;
        var title = flow === "shipping" ? "Shipping" : flow === "payment" ? "Payment" : "Login";
        var body = "";
        if (flow === "auth" || flow === "login") {
          body =
            '<form id="fv-login-form">' +
            '<label>Email</label><input type="email" id="fv-login-email" placeholder="name@example.com" required>' +
            '<label>Password</label><input type="password" id="fv-login-pass" required>' +
            '<p id="fv-inmall-err" class="fv-inmall-err" style="display:none"></p>' +
            '<button type="submit" class="fv-inmall-btn">Login</button>' +
            '<p class="fv-inmall-switch">New here? <button type="button" id="fv-goto-reg">Register</button></p></form>';
        } else if (flow === "register") {
          body =
            '<form id="fv-reg-form">' +
            '<label>Full name</label><input id="fv-reg-name" required>' +
            '<label>Email</label><input type="email" id="fv-reg-email" required>' +
            '<label>Phone</label><input id="fv-reg-phone" placeholder="03XXXXXXXXX" required>' +
            '<label>Password</label><input type="password" id="fv-reg-pass" required>' +
            '<div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center">' +
            '<input id="fv-reg-otp" placeholder="6-digit OTP" maxlength="6">' +
            '<button type="button" class="fv-inmall-ghost" id="fv-send-otp">Send OTP</button></div>' +
            '<p id="fv-inmall-err" class="fv-inmall-err" style="display:none"></p>' +
            '<button type="submit" class="fv-inmall-btn">Create account</button>' +
            '<p class="fv-inmall-switch">Have account? <button type="button" id="fv-goto-login">Login</button></p></form>';
        } else if (flow === "shipping") {
          body =
            '<form id="fv-ship-form">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
            '<input id="fv-ship-fn" placeholder="First name *" required>' +
            '<input id="fv-ship-ln" placeholder="Last name *" required></div>' +
            '<input id="fv-ship-addr" placeholder="Address *" required>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
            '<input id="fv-ship-city" placeholder="City *" required>' +
            '<input id="fv-ship-state" placeholder="State *" required></div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
            '<input id="fv-ship-postal" placeholder="Postal *" required>' +
            '<input id="fv-ship-phone" placeholder="Phone *" required></div>' +
            '<p id="fv-inmall-err" class="fv-inmall-err" style="display:none"></p>' +
            '<button type="submit" class="fv-inmall-btn">Continue to payment</button></form>';
        } else if (flow === "payment") {
          var items = getCheckoutItems();
          var total = 0;
          var lines = "";
          for (var i = 0; i < items.length; i++) {
            var q = items[i].qty || items[i].quantity || 1;
            total += parsePrice(items[i].price) * q;
            lines += '<p style="font-size:12px;margin:4px 0;opacity:0.85">' + esc(items[i].name) + " x" + q + "</p>";
          }
          body =
            '<p style="font-size:16px;font-weight:700;margin:0 0 8px">Total: Rs. ' + total.toLocaleString() + "</p>" +
            lines +
            '<p style="font-size:11px;opacity:0.7;margin:8px 0">Stripe opens in new tab. Mall stays here.</p>' +
            '<p id="fv-inmall-err" class="fv-inmall-err" style="display:none"></p>' +
            '<button type="button" class="fv-inmall-btn" id="fv-pay-btn">Pay Rs. ' + total.toLocaleString() + "</button>";
        }
        stack.innerHTML =
          '<div class="fv-inmall-card" id="fv-inmall-card">' +
          '<div id="fv-inmall-hd" class="fv-inmall-hd"><span>' + title + '</span>' +
          '<button type="button" id="fv-inmall-close-sm" class="fv-inmall-close-sm">X</button></div>' +
          '<div id="fv-inmall-body" class="fv-inmall-body">' + body + "</div></div>";
        document.getElementById("fv-inmall-close-sm").onclick = closeInMallStack;
        wireInMallFlow(flow);
      }

      function wireInMallFlow(flow) {
        var errEl = document.getElementById("fv-inmall-err");
        function showErr(msg) {
          if (!errEl) return;
          errEl.textContent = msg;
          errEl.style.display = msg ? "block" : "none";
        }
        if (flow === "auth" || flow === "login") {
          var gf = document.getElementById("fv-goto-reg");
          if (gf) gf.onclick = function () { showInMallFlow("register"); };
          var lf = document.getElementById("fv-login-form");
          if (lf) lf.onsubmit = function (e) {
            e.preventDefault();
            showErr("");
            apiPost("/auth/login", {
              email: document.getElementById("fv-login-email").value,
              password: document.getElementById("fv-login-pass").value
            }, false).then(function (data) {
              var role = saveSession(data);
              if (role !== "customer") { showErr("Use a customer account"); return; }
              closeInMallStack();
              resumePendingAction();
              showToast("Logged in");
            }).catch(function (ex) { showErr(ex.message); });
          };
        }
        if (flow === "register") {
          var gl = document.getElementById("fv-goto-login");
          if (gl) gl.onclick = function () { showInMallFlow("auth"); };
          var so = document.getElementById("fv-send-otp");
          if (so) so.onclick = function () {
            showErr("");
            apiPost("/auth/send-registration-otp", { email: document.getElementById("fv-reg-email").value }, false)
              .then(function () { showToast("OTP sent"); })
              .catch(function (ex) { showErr(ex.message); });
          };
          var rf = document.getElementById("fv-reg-form");
          if (rf) rf.onsubmit = function (e) {
            e.preventDefault();
            showErr("");
            var email = document.getElementById("fv-reg-email").value;
            var pass = document.getElementById("fv-reg-pass").value;
            apiPost("/auth/register", {
              name: document.getElementById("fv-reg-name").value,
              email: email,
              phone: document.getElementById("fv-reg-phone").value,
              password: pass,
              otp: document.getElementById("fv-reg-otp").value,
              role: "customer"
            }, false).then(function () {
              return apiPost("/auth/login", { email: email, password: pass }, false);
            }).then(function (data) {
              saveSession(data);
              closeInMallStack();
              resumePendingAction();
              showToast("Account ready");
            }).catch(function (ex) { showErr(ex.message); });
          };
        }
        if (flow === "shipping") {
          var sf = document.getElementById("fv-ship-form");
          if (sf) sf.onsubmit = function (e) {
            e.preventDefault();
            showErr("");
            var fn = document.getElementById("fv-ship-fn").value;
            var ln = document.getElementById("fv-ship-ln").value;
            localStorage.setItem("shippingAddress", JSON.stringify({
              name: fn + " " + ln,
              phone: document.getElementById("fv-ship-phone").value,
              address: document.getElementById("fv-ship-addr").value,
              city: document.getElementById("fv-ship-city").value,
              state: document.getElementById("fv-ship-state").value,
              zipCode: document.getElementById("fv-ship-postal").value,
              country: "Pakistan"
            }));
            showInMallFlow("payment");
          };
        }
        if (flow === "payment") {
          var pb = document.getElementById("fv-pay-btn");
          if (pb) pb.onclick = function () {
            showErr("");
            var shippingAddress = JSON.parse(localStorage.getItem("shippingAddress") || "{}");
            if (!shippingAddress.address) { showErr("Add shipping first"); return; }
            apiPost("/orders/create-checkout-session", {
              items: getCheckoutItems(),
              shippingAddress: shippingAddress
            }, true).then(function (data) {
              if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
              showToast("Complete payment in new tab");
            }).catch(function (ex) { showErr(ex.message); });
          };
        }
      }

      function requireCustomer(action) {
        if (isCustomer()) return true;
        state.pendingAction = action;
        showInMallFlow("auth");
        return false;
      }

      function handleAddToCart() {
        var p = formatProduct(state.product);
        var cart = getCart();
        var existing = null;
        for (var i = 0; i < cart.length; i++) {
          if (cart[i].id === p.id) { existing = cart[i]; break; }
        }
        if (existing) {
          existing.qty = (existing.qty || 1) + state.qty;
        } else {
          cart.push({
            id: p.id, _id: p.id, name: p.name, price: p.price, image: p.image,
            images: p.images, selectedSize: state.size, selectedColor: state.color, qty: state.qty
          });
        }
        saveCart(cart);
        renderMiniCart();
        var msg = isCustomer() ? "Added to bag" : "Added to bag (login at checkout to save order)";
        showToast(msg);
      }

      function handleBuyNow() {
        if (!requireCustomer("buyNow")) return;
        var p = formatProduct(state.product);
        localStorage.setItem("buyNowItem", JSON.stringify({
          id: p.id, _id: p.id, name: p.name, price: p.price, image: p.image,
          images: p.images, selectedSize: state.size, selectedColor: state.color, qty: state.qty
        }));
        showInMallFlow("shipping");
      }

      function handleCheckout() {
        if (!requireCustomer("checkout")) return;
        localStorage.removeItem("buyNowItem");
        showInMallFlow("shipping");
      }

      function openModal(product) {
        closeModal();
        injectStyles();
        pauseUnity();
        state.product = product;
        state.size = (product.sizes && product.sizes[0]) || "One Size";
        state.color = (product.colors && product.colors[0]) || "";
        state.qty = 1;

        if (!document.getElementById("fv-model-viewer-script")) {
          var s = document.createElement("script");
          s.id = "fv-model-viewer-script";
          s.type = "module";
          s.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js";
          document.head.appendChild(s);
        }

        var price = typeof product.price === "number" ? "Rs. " + product.price.toLocaleString() : product.price;
        var modelHtml = product.is3DEnabled && product.model3DUrl ? renderModel(product.model3DUrl) : "<p style='color:#fff;padding:2rem'>3D not enabled</p>";
        var brand = product.brand && product.brand.name ? product.brand.name : "";
        var codeLine = product.productId ? '<p class="fv-brand">Code: ' + esc(product.productId) + '</p>' : "";
        var stockHtml = "";
        if (product.stock === 0) stockHtml = '<p class="fv-stock">Out of stock</p>';
        else if (product.stock > 0 && product.stock < 10) stockHtml = '<p class="fv-stock">Only ' + product.stock + ' left</p>';

        var wrap = document.createElement("div");
        wrap.id = "fv-product-modal";
        wrap.innerHTML =
          '<div class="fv-card">' +
          '<div class="fv-card-header"><span>3D Product View</span><button id="fv-close-btn" type="button" aria-label="Close">X</button></div>' +
          '<div class="fv-card-body">' +
          '<div class="fv-viewer-pane">' + modelHtml +
          '<p class="fv-hint">Drag to rotate | Scroll to zoom</p></div>' +
          '<div class="fv-details-pane">' +
          '<h2>' + esc(product.name || "") + '</h2>' +
          (brand ? '<p class="fv-brand">' + esc(brand) + '</p>' : '') + codeLine +
          '<p class="fv-price">' + esc(String(price)) + '</p>' +
          '<p class="fv-desc">' + esc(product.description || "No description available.") + '</p>' +
          buildOptionsHtml(product) +
          '<div class="fv-actions">' +
          '<button type="button" class="fv-btn-add" id="fv-add-cart">Add to Bag</button>' +
          '<button type="button" class="fv-btn-buy" id="fv-buy-now">Buy it now</button>' +
          '</div>' + stockHtml + '</div></div></div>' +
          '<div class="fv-mini-cart" id="fv-mini-cart">' +
          '<div class="fv-mini-cart-hd"><span>Your Bag</span><span id="fv-cart-count"></span></div>' +
          '<div class="fv-mini-cart-body" id="fv-mini-cart-body"></div>' +
          '<div class="fv-mini-cart-ft">' +
          '<div class="fv-cart-total"><span>Total</span><span id="fv-cart-total-val">Rs. 0</span></div>' +
          '<button type="button" class="fv-btn-checkout" id="fv-checkout">Checkout</button>' +
          '</div></div>' +
          '<div id="fv-inmall-stack"></div>' +
          '<div class="fv-toast" id="fv-toast"></div>';

        document.body.appendChild(wrap);
        document.body.style.overflow = "hidden";

        document.getElementById("fv-close-btn").onclick = closeModal;
        document.getElementById("fv-add-cart").onclick = handleAddToCart;
        document.getElementById("fv-buy-now").onclick = handleBuyNow;
        document.getElementById("fv-checkout").onclick = handleCheckout;
        wireOptions();
        renderMiniCart();
        console.log("[FashionVerse] centered card modal opened");
      }

      window.openProduct = function (productCode) {
        var c = String(productCode || "").trim();
        if (!c) return;
        console.log("[FashionVerse] openProduct:", c);
        fetch(API_BASE + "/products/" + encodeURIComponent(c))
          .then(function (res) {
            if (!res.ok) throw new Error("not found");
            return res.json();
          })
          .then(function (product) { openModal(product); })
          .catch(function (err) {
            console.error("[FashionVerse]", err);
            alert("Product not found: " + c);
          });
      };

      console.log("[FashionVerse] bridge ready (from OpenProduct.jslib)");
    }

    if (typeof window.openProduct === "function") {
      window.openProduct(code);
    }
  }
});
