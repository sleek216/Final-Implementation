# Unity WebGL Build — FashionVerse

## Tumhari actual build

| Setting | Value |
|---------|--------|
| Product name | FYP-Stores |
| **Build file prefix** | **Unity-Build** (not FYP-Stores!) |
| Compression | None (`.data`, `.framework.js`, `.wasm`) |

`.env` (optional — defaults already match):
```
VITE_UNITY_BUILD_NAME=Unity-Build
VITE_UNITY_COMPRESS=
```

---

## Sahi folder structure

```
client/public/unity/
├── index.html              ← Unity ka original (bridge added)
├── TemplateData/
│   ├── webgl-bridge.js     ← F press bridge (IMPORTANT)
│   └── style.css, ...
└── Build/
    ├── Unity-Build.loader.js
    ├── Unity-Build.data
    ├── Unity-Build.framework.js
    └── Unity-Build.wasm
```

**Galat:** `Build/Build/` nested folder — duplicate hai, ignore/delete kar sakte ho.

**StreamingAssets/** — sirf tab chahiye jab Unity project mein ho.

---

## 2 tareeqe chalane ke

### A) Unity ka apna server (jo tum abhi use kar rahe ho)

```
localhost:51193  ← Unity "Build and Run"
```

- FashionVerse folder **zaroori nahi** is mode ke liye
- Unity apne export folder se serve karta hai
- **Zaroori:** us export ke `index.html` mein `webgl-bridge.js` add karo (same as `TemplateData/webgl-bridge.js`)

Unity project se har nayi build par bridge dubara add karo, ya **WebGL Template** use karo (`unity-integration/WebGLTemplate/FashionVerse/`).

### B) FashionVerse website ke sath

| URL | Kya hai |
|-----|---------|
| `http://localhost:3000/unity/` | Standalone Unity page + bridge |
| `http://localhost:3000/unity-mall` | React wrapper + modal |

Dono ke liye `client/public/unity/` wali files chahiye + `npm run dev`.

---

## Copy kaise karna hai (Unity export se)

Unity se **poora** export folder copy karo:

```
Unity Export/
  index.html
  TemplateData/
  Build/
```

→ paste into `client/public/unity/` (merge/replace)

Phir ensure karo `TemplateData/webgl-bridge.js` exist kare (repo mein already hai).

---

## Test

1. Backend: `http://localhost:5005` running
2. Console mein: `[FashionVerse] window.openProduct ready`
3. F press → modal with product
