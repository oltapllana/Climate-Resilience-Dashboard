const numberFormats = new Map();
export const numberLocale = (lang) => lang === "sq" ? "sq-AL" : "en-GB";

/** Presentation only: never use this result as chart data or in calculations. */
export function formatNumber(value, lang = "en", options = {}) {
  if (value == null || String(value).trim() === "" || !Number.isFinite(Number(value))) return "—";
  const settings = { maximumFractionDigits: 20, useGrouping: false, ...options };
  const locale = numberLocale(lang);
  const key = `${locale}:${JSON.stringify(settings)}`;
  if (!numberFormats.has(key)) numberFormats.set(key, new Intl.NumberFormat(locale, settings));
  return numberFormats.get(key).format(Number(value));
}

export function updateDocumentTitle(t, target = document) {
  target.title = t("appTitle");
  if (target.documentElement) target.documentElement.lang = t.locale;
  if (!target.createElement) return;
  for (const { name, property, content } of documentMetadata(t)) {
    const attribute = name ? "name" : "property";
    const key = name ?? property;
    let element = target.querySelector(`meta[${attribute}="${key}"]`);
    if (!element) {
      element = target.createElement("meta");
      element.setAttribute(attribute, key);
      target.head.append(element);
    }
    element.setAttribute("content", content);
  }
}

export function documentMetadata(t) {
  return [
    { name: "description", content: t("metaDescription") },
    { property: "og:title", content: t("appTitle") },
    { property: "og:description", content: t("metaDescription") },
    { property: "og:type", content: "website" },
    { property: "og:locale", content: t.locale === "sq" ? "sq_AL" : "en_GB" },
    { property: "og:locale:alternate", content: t.locale === "sq" ? "en_GB" : "sq_AL" },
    { property: "og:site_name", content: t("appTitle") },
  ];
}
