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
      var state = { product: null, size: "", color: "", qty: 1 };

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
          "#fv-product-modal{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:2147483647!important;pointer-events:none!important;overflow:hidden!important}" +
          "#fv-product-modal *{box-sizing:border-box}" +
          "#fv-product-modal .fv-viewer-pane{position:fixed!important;inset:0!important;z-index:1!important;background:transparent!important;pointer-events:auto!important}" +
          "#fv-product-modal .fv-viewer-pane model-viewer," +
          "#fv-product-modal .fv-viewer-pane iframe{position:absolute!important;inset:0!important;width:100vw!important;height:100vh!important;border:0!important;display:block!important;background:transparent!important}" +
          "#fv-product-modal .fv-details-card{position:fixed!important;top:16px!important;left:50%!important;transform:translateX(-50%)!important;width:min(720px,calc(100vw - 32px))!important;max-height:min(52vh,480px)!important;overflow-y:auto!important;z-index:5!important;padding:20px 22px!important;background:rgba(255,255,255,0.12)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important;border:1px solid rgba(255,255,255,0.28)!important;border-radius:16px!important;box-shadow:0 12px 40px rgba(0,0,0,0.25)!important;color:#fff!important;pointer-events:auto!important}" +
          "#fv-product-modal .fv-details-card h2{margin:4px 0 6px!important;font-size:clamp(20px,3vw,28px)!important;font-family:Georgia,serif!important;font-weight:600!important;color:#fff!important}" +
          "#fv-product-modal .fv-label{font-size:11px!important;letter-spacing:1.2px!important;text-transform:uppercase!important;color:rgba(255,255,255,0.65)!important;margin:0 0 4px!important}" +
          "#fv-product-modal .fv-brand{font-size:12px!important;color:rgba(255,255,255,0.75)!important;margin:0 0 8px!important;text-transform:uppercase!important;letter-spacing:0.5px!important}" +
          "#fv-product-modal .fv-price{font-size:22px!important;font-weight:700!important;margin:0 0 10px!important;color:#fff!important}" +
          "#fv-product-modal .fv-desc{font-size:13px!important;line-height:1.55!important;color:rgba(255,255,255,0.88)!important;margin:0 0 14px!important}" +
          "#fv-product-modal .fv-options{display:flex!important;flex-wrap:wrap!important;gap:14px 20px!important;margin-bottom:14px!important}" +
          "#fv-product-modal .fv-opt-group span{display:block!important;font-size:11px!important;text-transform:uppercase!important;letter-spacing:0.8px!important;color:rgba(255,255,255,0.7)!important;margin-bottom:6px!important}" +
          "#fv-product-modal .fv-opt-list{display:flex!important;flex-wrap:wrap!important;gap:6px!important}" +
          "#fv-product-modal .fv-size-btn{padding:6px 14px!important;border:1px solid rgba(255,255,255,0.35)!important;border-radius:6px!important;background:rgba(255,255,255,0.08)!important;color:#fff!important;font-size:12px!important;cursor:pointer!important}" +
          "#fv-product-modal .fv-size-btn.active{background:#fff!important;color:#111!important;border-color:#fff!important;font-weight:600!important}" +
          "#fv-product-modal .fv-color-swatch{width:28px!important;height:28px!important;border-radius:50%!important;border:2px solid rgba(255,255,255,0.4)!important;cursor:pointer!important;padding:2px!important;background-clip:content-box!important}" +
          "#fv-product-modal .fv-color-swatch.active{border-color:#fff!important;box-shadow:0 0 0 2px rgba(255,255,255,0.5)!important}" +
          "#fv-product-modal .fv-qty{display:flex!important;align-items:center!important;gap:0!important;border:1px solid rgba(255,255,255,0.35)!important;border-radius:8px!important;overflow:hidden!important}" +
          "#fv-product-modal .fv-qty button{width:36px!important;height:36px!important;border:0!important;background:rgba(255,255,255,0.12)!important;color:#fff!important;font-size:18px!important;cursor:pointer!important}" +
          "#fv-product-modal .fv-qty span{min-width:40px!important;text-align:center!important;font-size:14px!important;color:#fff!important}" +
          "#fv-product-modal .fv-actions{display:flex!important;gap:10px!important;flex-wrap:wrap!important}" +
          "#fv-product-modal .fv-btn-add{flex:1!important;min-width:140px!important;padding:13px 16px!important;border:1px solid rgba(255,255,255,0.5)!important;border-radius:8px!important;background:rgba(255,255,255,0.15)!important;color:#fff!important;font-size:13px!important;font-weight:600!important;cursor:pointer!important}" +
          "#fv-product-modal .fv-btn-buy{flex:1!important;min-width:140px!important;padding:13px 16px!important;border:0!important;border-radius:8px!important;background:#fff!important;color:#111!important;font-size:13px!important;font-weight:600!important;cursor:pointer!important}" +
          "#fv-product-modal .fv-btn-add:hover{background:rgba(255,255,255,0.25)!important}" +
          "#fv-product-modal .fv-btn-buy:hover{opacity:0.92!important}" +
          "#fv-product-modal .fv-stock{font-size:11px!important;color:#fca5a5!important;margin:8px 0 0!important}" +
          "#fv-product-modal #fv-close-btn{position:fixed!important;top:16px!important;right:16px!important;z-index:6!important;border:0!important;background:rgba(17,24,39,0.75)!important;color:#fff!important;width:44px!important;height:44px!important;border-radius:50%!important;cursor:pointer!important;font-size:20px!important;line-height:1!important;pointer-events:auto!important}" +
          "#fv-product-modal .fv-hint{position:fixed!important;bottom:20px!important;left:20px!important;z-index:4!important;margin:0!important;padding:10px 14px!important;background:rgba(0,0,0,0.55)!important;color:#fff!important;font-size:12px!important;border-radius:8px!important;pointer-events:none!important}" +
          "#fv-product-modal .fv-mini-cart{position:fixed!important;bottom:20px!important;right:20px!important;width:min(340px,calc(100vw - 40px))!important;max-height:min(50vh,400px)!important;z-index:6!important;background:rgba(255,255,255,0.14)!important;backdrop-filter:blur(18px)!important;-webkit-backdrop-filter:blur(18px)!important;border:1px solid rgba(255,255,255,0.3)!important;border-radius:14px!important;box-shadow:0 12px 36px rgba(0,0,0,0.3)!important;color:#fff!important;overflow:hidden!important;pointer-events:auto!important;display:none!important}" +
          "#fv-product-modal .fv-mini-cart.open{display:flex!important;flex-direction:column!important}" +
          "#fv-product-modal .fv-mini-cart-hd{display:flex!important;align-items:center!important;justify-content:space-between!important;padding:12px 14px!important;border-bottom:1px solid rgba(255,255,255,0.15)!important;font-size:12px!important;font-weight:700!important;letter-spacing:1px!important;text-transform:uppercase!important}" +
          "#fv-product-modal .fv-mini-cart-body{overflow-y:auto!important;padding:8px 12px!important;flex:1!important}" +
          "#fv-product-modal .fv-cart-item{display:flex!important;gap:10px!important;padding:8px 0!important;border-bottom:1px solid rgba(255,255,255,0.1)!important;align-items:center!important}" +
          "#fv-product-modal .fv-cart-item img{width:48px!important;height:48px!important;object-fit:cover!important;border-radius:6px!important;background:rgba(0,0,0,0.2)!important}" +
          "#fv-product-modal .fv-cart-item-info{flex:1!important;min-width:0!important}" +
          "#fv-product-modal .fv-cart-item-name{font-size:12px!important;font-weight:600!important;margin:0 0 2px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}" +
          "#fv-product-modal .fv-cart-item-meta{font-size:11px!important;opacity:0.75!important;margin:0!important}" +
          "#fv-product-modal .fv-mini-cart-ft{padding:12px 14px!important;border-top:1px solid rgba(255,255,255,0.15)!important}" +
          "#fv-product-modal .fv-cart-total{display:flex!important;justify-content:space-between!important;font-size:14px!important;font-weight:700!important;margin-bottom:10px!important}" +
          "#fv-product-modal .fv-btn-checkout{width:100%!important;padding:12px!important;border:0!important;border-radius:8px!important;background:#fff!important;color:#111!important;font-size:13px!important;font-weight:600!important;cursor:pointer!important}" +
          "#fv-product-modal .fv-toast{position:fixed!important;bottom:90px!important;right:20px!important;z-index:7!important;padding:10px 16px!important;background:rgba(16,185,129,0.92)!important;color:#fff!important;font-size:13px!important;border-radius:8px!important;pointer-events:none!important;opacity:0!important;transition:opacity 0.25s!important}" +
          "#fv-product-modal .fv-toast.show{opacity:1!important}";
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

      function getCart() {
        var uid = getUserId();
        if (!uid) return [];
        try { return JSON.parse(localStorage.getItem("cart_" + uid) || "[]"); } catch (e) { return []; }
      }

      function saveCart(cart) {
        var uid = getUserId();
        if (uid) localStorage.setItem("cart_" + uid, JSON.stringify(cart));
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
        if (!el || !body) return;
        var cart = getCart();
        if (!cart.length) {
          el.classList.remove("open");
          return;
        }
        el.classList.add("open");
        var html = "";
        var total = 0;
        for (var i = 0; i < cart.length; i++) {
          var item = cart[i];
          var img = item.image || (item.images && item.images[0] ? item.images[0] : "");
          if (img && img.indexOf("http") !== 0) img = UPLOADS_BASE + "/" + img;
          var qty = item.qty || item.quantity || 1;
          total += parsePrice(item.price) * qty;
          html += '<div class="fv-cart-item">' +
            (img ? '<img src="' + esc(img) + '" alt="">' : '<div style="width:48px;height:48px;background:rgba(0,0,0,0.2);border-radius:6px"></div>') +
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
          "&transparent=1&annotation=0&annotations=0&dnt=1";
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
          return '<model-viewer src="' + esc(url) + '" camera-controls auto-rotate touch-action="pan-y" interaction-prompt="auto" shadow-intensity="1" exposure="1" environment-image="neutral" style="width:100vw;height:100vh;background:transparent;--poster-color:transparent"></model-viewer>';
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
          colorHtml = '<span style="font-size:12px;opacity:0.7">Default</span>';
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

      function handleAddToCart() {
        if (!isCustomer()) {
          var pid = state.product && (state.product._id || state.product.id);
          window.location.href = SITE_BASE + "/login?redirectTo=" + encodeURIComponent("/unity-mall");
          return;
        }
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
        showToast("Added to bag");
      }

      function handleBuyNow() {
        if (!isCustomer()) {
          window.location.href = SITE_BASE + "/login?redirectTo=" + encodeURIComponent("/checkout/shipping");
          return;
        }
        var p = formatProduct(state.product);
        localStorage.setItem("buyNowItem", JSON.stringify({
          id: p.id, _id: p.id, name: p.name, price: p.price, image: p.image,
          images: p.images, selectedSize: state.size, selectedColor: state.color, qty: state.qty
        }));
        window.location.href = SITE_BASE + "/checkout/shipping";
      }

      function handleCheckout() {
        if (!isCustomer()) {
          window.location.href = SITE_BASE + "/login?redirectTo=" + encodeURIComponent("/checkout/shipping");
          return;
        }
        localStorage.removeItem("buyNowItem");
        window.location.href = SITE_BASE + "/checkout/shipping";
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
          '<div class="fv-viewer-pane">' + modelHtml + '</div>' +
          '<div class="fv-details-card" id="fv-details-card">' +
          '<p class="fv-label">3D Product View</p>' +
          '<h2>' + esc(product.name || "") + '</h2>' +
          (brand ? '<p class="fv-brand">' + esc(brand) + '</p>' : '') + codeLine +
          '<p class="fv-price">' + esc(String(price)) + '</p>' +
          '<p class="fv-desc">' + esc(product.description || "No description available.") + '</p>' +
          buildOptionsHtml(product) +
          '<div class="fv-actions">' +
          '<button type="button" class="fv-btn-add" id="fv-add-cart">Add to Bag</button>' +
          '<button type="button" class="fv-btn-buy" id="fv-buy-now">Buy it now</button>' +
          '</div>' + stockHtml + '</div>' +
          '<p class="fv-hint">Drag to rotate | Scroll to zoom | Click X to close</p>' +
          '<button id="fv-close-btn" type="button" aria-label="Close">X</button>' +
          '<div class="fv-mini-cart" id="fv-mini-cart">' +
          '<div class="fv-mini-cart-hd"><span>Your Bag</span><span id="fv-cart-count"></span></div>' +
          '<div class="fv-mini-cart-body" id="fv-mini-cart-body"></div>' +
          '<div class="fv-mini-cart-ft">' +
          '<div class="fv-cart-total"><span>Total</span><span id="fv-cart-total-val">Rs. 0</span></div>' +
          '<button type="button" class="fv-btn-checkout" id="fv-checkout">Checkout on Store</button>' +
          '</div></div>' +
          '<div class="fv-toast" id="fv-toast"></div>';

        document.body.appendChild(wrap);
        document.body.style.overflow = "hidden";

        document.getElementById("fv-close-btn").onclick = closeModal;
        document.getElementById("fv-add-cart").onclick = handleAddToCart;
        document.getElementById("fv-buy-now").onclick = handleBuyNow;
        document.getElementById("fv-checkout").onclick = handleCheckout;
        wireOptions();
        renderMiniCart();
        var cc = document.getElementById("fv-cart-count");
        if (cc) cc.textContent = "(" + getCart().length + ")";
        console.log("[FashionVerse] transparent modal opened");
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
