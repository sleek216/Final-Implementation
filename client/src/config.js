const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5005";

export const API_BASE_URL = import.meta.env.VITE_API_URL || `${SERVER_URL}/api`;
export const UPLOADS_BASE_URL = `${SERVER_URL}/uploads`;

export const getUploadUrl = (path) => {
  if (!path) return "";
  if (typeof path === "string" && path.startsWith("http")) return path;
  return `${UPLOADS_BASE_URL}/${path}`;
};

/** Unity WebGL build — files in client/public/unity/Build/ */
const UNITY_BUILD_NAME = import.meta.env.VITE_UNITY_BUILD_NAME || "Unity-Build";
/** Compression suffix: "" (none), ".gz", or ".br" — match your Unity export */
const UNITY_COMPRESS = import.meta.env.VITE_UNITY_COMPRESS || "";

export const UNITY_BUILD = {
  buildName: UNITY_BUILD_NAME,
  loaderUrl: `/unity/Build/${UNITY_BUILD_NAME}.loader.js`,
  dataUrl: `/unity/Build/${UNITY_BUILD_NAME}.data${UNITY_COMPRESS}`,
  frameworkUrl: `/unity/Build/${UNITY_BUILD_NAME}.framework.js${UNITY_COMPRESS}`,
  codeUrl: `/unity/Build/${UNITY_BUILD_NAME}.wasm${UNITY_COMPRESS}`,
  streamingAssetsUrl: "/unity/StreamingAssets",
  companyName: "FashionVerse",
  productName: "FYP-Stores",
  productVersion: "0.1",
};
