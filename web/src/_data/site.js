const DEFAULT_SITE_URL = "https://etho.clooney.io";

function normalizeSiteUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return DEFAULT_SITE_URL;
  }
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export default {
  name: "Project Etho",
  description: "Etho's appearances across the web.",
  url: normalizeSiteUrl(process.env.SITE_URL || DEFAULT_SITE_URL),
  socialImagePath: "/assets/social/project-etho-og.png"
};
