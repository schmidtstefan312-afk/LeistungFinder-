// partner-banners.js
// Lädt Banner aus Supabase und platziert sie JEWEILS unter ihrem eigenen Partner-Abschnitt.
// Kein Sammelblock "Weitere Angebote" mehr - jeder Banner gehört zu genau einem Partner.

(function () {
  "use strict";

  // ---- Konfiguration ----
  const SUPABASE_URL = window.SUPABASE_URL || "DEINE_SUPABASE_URL";
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "DEIN_ANON_KEY";

  function slugify(name) {
    return String(name)
      .toLowerCase()
      .replace(/[äöüß]/g, (m) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" }[m]))
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-+|-+$)/g, "");
  }

  function renderBannerHTML(banner) {
    const safeUrl = banner.target_url || "#";
    const safeImg = banner.image_url || "";
    const safeName = banner.partner_name || "Partnerangebot";
    return `
      <a href="${safeUrl}" target="_blank" rel="noopener sponsored" class="partner-banner" data-partner="${safeName}">
        <img src="${safeImg}" alt="${safeName} Angebot" loading="lazy">
      </a>`;
  }

  async function fetchBanners(category) {
    const url =
      `${SUPABASE_URL}/rest/v1/banner` +
      `?category=eq.${encodeURIComponent(category)}` +
      `&aktiv=eq.true` +
      `&select=partner_name,category,image_url,target_url,aktiv,sort_order` +
      `&order=partner_name.asc,sort_order.asc`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!res.ok) {
      console.error("partner-banners.js: Supabase-Anfrage fehlgeschlagen", res.status, res.statusText);
      return [];
    }
    return res.json();
  }

  function groupByPartner(banners) {
    const grouped = {};
    for (const banner of banners) {
      const key = banner.partner_name || "Unbekannt";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(banner);
    }
    return grouped;
  }

  function placeBanners(grouped) {
    const unmatched = [];

    for (const [partnerName, partnerBanners] of Object.entries(grouped)) {
      const slug = slugify(partnerName);
      const container = document.querySelector(`[data-partner-banners="${slug}"]`);

      if (!container) {
        unmatched.push(partnerName);
        continue;
      }

      container.innerHTML = partnerBanners.map(renderBannerHTML).join("");
      container.classList.add("partner-banners--loaded");
    }

    // Banner ohne passenden Container werden NICHT irgendwo angehängt
    // (kein "Weitere Angebote"-Fallback mehr) - nur zur Kontrolle geloggt.
    if (unmatched.length) {
      console.warn(
        "partner-banners.js: Kein Container gefunden für Partner:",
        unmatched.join(", "),
        "- bitte [data-partner-banners=\"<slug>\"] auf der Seite ergänzen."
      );
    }
  }

  async function loadPartnerBanners() {
    const category = document.body.dataset.category;
    if (!category) {
      console.warn("partner-banners.js: kein data-category am <body> gesetzt - Abbruch.");
      return;
    }

    try {
      const banners = await fetchBanners(category);
      const grouped = groupByPartner(banners);
      placeBanners(grouped);
    } catch (err) {
      console.error("partner-banners.js: Fehler beim Laden der Banner", err);
    }
  }

  document.addEventListener("DOMContentLoaded", loadPartnerBanners);
})();
