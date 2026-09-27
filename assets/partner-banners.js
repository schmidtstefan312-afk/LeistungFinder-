// partner-page-banner.js
// Läuft auf EINER einzelnen Partner-Unterseite (z.B. /partner/explorer-travel-i9d9x/)
// und zeigt NUR die Banner dieses einen Partners - kein Kategorie-Filter,
// kein Sammelblock, kein "Weitere Angebote".
//
// Einbindung auf der Partnerseite:
//   <script src="https://leistung-finder.de/assets/partner-page-banner.js" data-partner="EXPLORER TRAVEL"></script>
//
// data-partner muss EXAKT dem partner_name in Supabase entsprechen
// (Groß-/Kleinschreibung wird für die Anzeige ignoriert, für den Datenbank-Filter zählt sie).

(function () {
  "use strict";

  const SUPABASE_URL = "https://rnnmdlibekqhqrxqqrws.supabase.co";
  const SUPABASE_KEY = "sb_publishable_PXFh4qggQUq3Eb4AGbPpPg_05HIlS1x";

  const CONTAINER_ID = "partnerBanners";

  function renderBannerHTML(banner) {
    const safeUrl = banner.target_url || "#";
    const safeImg = banner.image_url || "";
    const safeAlt = banner.alt_text || banner.partner_name || "Partnerangebot";
    return `
      <div class="banner">
        <a href="${safeUrl}" target="_blank" rel="noopener sponsored">
          <img src="${safeImg}" alt="${safeAlt}" loading="lazy">
        </a>
      </div>`;
  }

  function ensureContainer() {
    let el = document.getElementById(CONTAINER_ID);
    if (el) return el;

    // Falls die Partnerseite noch keinen Container hat: direkt nach
    // dem Element mit Klasse "card" einfügen (Standard-Layout dieser Seiten).
    el = document.createElement("div");
    el.id = CONTAINER_ID;
    const card = document.querySelector(".card") || document.body;
    card.appendChild(el);
    return el;
  }

  async function loadPartnerBanner() {
    const scriptTag = document.currentScript;
    const partnerName = scriptTag ? scriptTag.dataset.partner : null;

    if (!partnerName) {
      console.warn("partner-page-banner.js: kein data-partner am <script>-Tag gesetzt - Abbruch.");
      return;
    }

    const url =
      `${SUPABASE_URL}/rest/v1/banner` +
      `?partner_name=eq.${encodeURIComponent(partnerName)}` +
      `&aktiv=eq.true` +
      `&select=partner_name,image_url,target_url,alt_text,sort_order` +
      `&order=sort_order.asc`;

    let rows = [];
    try {
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      if (!res.ok) {
        console.error("partner-page-banner.js: Supabase-Anfrage fehlgeschlagen", res.status, res.statusText);
        return;
      }
      rows = await res.json();
    } catch (err) {
      console.error("partner-page-banner.js: Fehler beim Laden", err);
      return;
    }

    console.log(`partner-page-banner.js: ${rows.length} aktive Banner für Partner "${partnerName}" geladen.`);

    if (!rows.length) return; // keine Banner -> kein leerer Block auf der Seite

    const container = ensureContainer();
    container.innerHTML = rows.map(renderBannerHTML).join("");
  }

  // WICHTIG: kein DOMContentLoaded-Listener - document.currentScript ist nur
  // während der synchronen Ausführung des Scripts gültig, deshalb sofort starten.
  loadPartnerBanner();
})();
