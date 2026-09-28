// partner-page-banner.js – Partnerseiten laden ihre Banner ausschließlich aus Supabase.
// data-partner darf mehrere Namen mit "|" enthalten. Vergleich ohne Groß-/Kleinschreibung,
// zusätzlich wird die Variante mit/ohne " DE" mitgeladen (z. B. Wondershare / Wondershare DE).
(function () {
  "use strict";
  var SUPABASE_URL = "https://rnnmdlibekqhqrxqqrws.supabase.co";
  var SUPABASE_KEY = "sb_publishable_PXFh4qggQUq3Eb4AGbPpPg_05HIlS1x";
  var CONTAINER_ID = "partnerBanners";
  var scriptTag = document.currentScript;

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;")
      .replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderBannerHTML(b) {
    return '<div class="banner"><span class="badge">Anzeige</span>' +
      '<a href="' + esc(b.target_url || "#") + '" target="_blank" rel="sponsored noopener">' +
      '<img loading="lazy" alt="' + esc(b.alt_text || b.partner_name || "Partnerangebot") +
      '" src="' + esc(b.image_url) + '"></a></div>';
  }

  function ensureContainer() {
    var el = document.getElementById(CONTAINER_ID);
    if (el) return el;
    el = document.createElement("div");
    el.id = CONTAINER_ID;
    (document.querySelector(".card") || document.body).appendChild(el);
    return el;
  }

  function removeFixedBanners(container) {
    document.querySelectorAll(".banner").forEach(function (el) {
      if (!container.contains(el)) el.remove();
    });
    document.querySelectorAll(".offer").forEach(function (o) {
      var g = o.parentElement;
      o.remove();
      if (g && g.classList.contains("grid") && !g.children.length) g.remove();
    });
  }

  function installStyles() {
    if (document.getElementById("partner-banner-grid-style")) return;
    var s = document.createElement("style");
    s.id = "partner-banner-grid-style";
    s.textContent =
      "#partnerBanners.partner-banners-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:1rem}" +
      "#partnerBanners.partner-banners-grid .banner{margin-top:0;padding:10px}" +
      "#partnerBanners.partner-banners-grid .banner img{display:block;width:auto;max-width:100%;max-height:180px;height:auto;object-fit:contain;margin:0 auto}" +
      "@media(max-width:600px){#partnerBanners.partner-banners-grid{grid-template-columns:1fr;gap:12px}#partnerBanners.partner-banners-grid .banner img{max-height:160px}}";
    document.head.appendChild(s);
  }

  function nameVariants(raw) {
    var out = [];
    raw.split("|").forEach(function (n) {
      n = n.trim(); if (!n) return;
      var base = n.replace(/\s+DE$/i, "");
      [n, base, base + " DE"].forEach(function (v) {
        if (out.map(function (x) { return x.toLowerCase(); }).indexOf(v.toLowerCase()) < 0) out.push(v);
      });
    });
    return out;
  }

  async function load() {
    var partner = scriptTag ? scriptTag.dataset.partner : null;
    if (!partner) { console.warn("partner-page-banner.js: kein data-partner gesetzt."); return; }
    var names = nameVariants(partner);
    var orExpr = "(" + names.map(function (n) { return 'partner_name.ilike."' + n + '"'; }).join(",") + ")";
    var url = SUPABASE_URL + "/rest/v1/banner?or=" + encodeURIComponent(orExpr) +
      "&aktiv=eq.true&select=partner_name,image_url,target_url,alt_text,sort_order&order=sort_order.asc";
    var rows;
    try {
      var res = await fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY } });
      if (!res.ok) { console.error("partner-page-banner.js: Supabase-Fehler", res.status); return; }
      rows = await res.json();
    } catch (err) { console.error("partner-page-banner.js: Fehler beim Laden:", err); return; }

    var seen = {};
    rows = rows.filter(function (r) {
      if (!r.image_url || !r.target_url || seen[r.target_url]) return false;
      seen[r.target_url] = 1; return true;
    });
    console.log("partner-page-banner.js: " + rows.length + " aktive Banner für " + names.join(" / "));
    var container = ensureContainer();
    removeFixedBanners(container);
    if (!rows.length) { container.innerHTML = ""; return; }
    installStyles();
    container.classList.add("partner-banners-grid");
    container.innerHTML = rows.map(renderBannerHTML).join("");
  }
  load();
})();
