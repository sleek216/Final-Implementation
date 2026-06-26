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

/** Sketchfab embed — interactive 3D (autostart, rotate, zoom) */
export const sketchfabEmbedUrl = (input = "") => {
  const embed = normalizeModel3DUrl(input);
  if (!embed || !embed.includes("sketchfab.com")) return embed;
  const sep = embed.includes("?") ? "&" : "?";
  return (
    `${embed}${sep}` +
    "autostart=1&preload=1&autospin=0.15&scrollwheel=1&navigation_controls=1" +
    "&ui_controls=1&ui_stop=0&ui_watermark=0&ui_hint=0&ui_infos=0&ui_help=0" +
    "&ui_inspector=0&ui_ar=0&ui_settings=0&ui_vr=0&ui_fullscreen=1&ui_animations=0" +
    "&transparent=0&annotation=0&annotations=0"
  );
};
