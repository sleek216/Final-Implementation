export const normalizeModel3DUrl = (input = "") => {
  const trimmed = String(input).trim();
  if (!trimmed) return "";

  const iframeMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (iframeMatch) return iframeMatch[1];

  const embedMatch = trimmed.match(/sketchfab\.com\/models\/([a-f0-9]{32})\/embed/i);
  if (embedMatch) return `https://sketchfab.com/models/${embedMatch[1]}/embed`;

  const modelPageMatch = trimmed.match(/sketchfab\.com\/3d-models\/[^"'\s]+-([a-f0-9]{32})/i);
  if (modelPageMatch) return `https://sketchfab.com/models/${modelPageMatch[1]}/embed`;

  const bareIdMatch = trimmed.match(/^([a-f0-9]{32})$/i);
  if (bareIdMatch) return `https://sketchfab.com/models/${bareIdMatch[1]}/embed`;

  return trimmed;
};

export const parseBoolean = (value) => value === true || value === "true" || value === "1";
