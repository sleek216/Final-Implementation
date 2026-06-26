# Unity Integration — Copy These Files

## ⚠️ Error: `window.openProduct not defined`

Yeh tab aata hai jab Unity **seedha** chalao (`localhost:51193`) bina bridge ke.

**2 solutions:**

### Option A — FashionVerse website se kholo (recommended)
```
http://localhost:3000/unity-mall
```
React yahan `window.openProduct` set karta hai.

### Option B — Standalone Unity build (localhost:51193)

1. Copy `WebGLTemplate/FashionVerse/` → Unity `Assets/WebGLTemplates/FashionVerse/`
2. Player Settings → WebGL → **Template: FashionVerse**
3. Rebuild WebGL
4. Build output mein `TemplateData/webgl-bridge.js` hona chahiye

Ya manually existing build mein:
- `webgl-bridge.js` copy karo → `Build/TemplateData/webgl-bridge.js`
- `index.html` mein `<head>` ke andar add karo:
  ```html
  <script src="TemplateData/webgl-bridge.js"></script>
  ```
  (**Unity load hone se PEHLE**)

---

## Unity project mein kahan paste karna hai

| File (yahan se) | Unity mein paste karo |
|-----------------|----------------------|
| `PlayerController.cs` | `Assets/Main-Scripts/PlayerController.cs` |
| `ProductSpot.cs` | `Assets/Main-Scripts/ProductSpot.cs` |
| `OpenProduct.jslib` | `Assets/Plugins/WebGL/OpenProduct.jslib` |
| `WebGLTemplate/FashionVerse/` | `Assets/WebGLTemplates/FashionVerse/` |

**Important:** `OpenProduct.jslib` ke liye folder banao:
`Assets/Plugins/WebGL/`

## Har poster par

1. Collider lagao (Box Collider)
2. `ProductSpot` script attach karo
3. `productCode` set karo — DB `productId` jaisa, e.g. `MEN-GREEN-001`

## Build settings

- File → Build Settings → WebGL
- Template: **FashionVerse**
- Export karo
- Copy to `FashionVerse/client/public/unity/` (README dekho)

## Test

| URL | Bridge |
|-----|--------|
| `http://localhost:3000/unity-mall` | React |
| `http://localhost:51193` (Unity dev) | `webgl-bridge.js` in template |

Console mein yeh dikhna chahiye:
```
[FashionVerse] window.openProduct ready
```
