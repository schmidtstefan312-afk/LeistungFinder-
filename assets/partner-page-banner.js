// partner-page-banner.js
// Läuft auf EINER einzelnen Partner-Unterseite (z.B. /partner/explorer-travel-i9d9x/)
// und zeigt NUR die Banner dieses einen Partners - kein Kategorie-Filter,
// kein Sammelblock, kein "Weitere Angebote".
//
// Banner: Die Datenbank (Admin) ist die einzige Quelle. Liefert sie Banner, werden fest
// eingebaute Awin-Banner der Seite entfernt. Fällt die Datenbank aus oder liefert sie
// nichts, bleibt die Seite unverändert.
//
// NEU: Lädt zusätzlich den Beschreibungstext des Partners aus der Supabase-Tabelle
// "partner_texte" und setzt ihn unter die Überschrift. Wenn die Tabelle fehlt oder
// kein Text vorhanden ist, bleibt der bisherige Text einfach stehen.
//
// Einbindung auf der Partnerseite (unverändert):
//   <script src="https://leistung-finder.de/assets/partner-page-banner.js" data-partner="EXPLORER TRAVEL"></script>
//
// data-partner muss EXAKT dem partner_name in Supabase entsprechen
// (Groß-/Kleinschreibung wird für die Anzeige ignoriert, für den Datenbank-Filter zählt sie).

(function () {
  "use strict";

  const SUPABASE_URL = "https://rnnmdlibekqhqrxqqrws.supabase.co";
  const SUPABASE_KEY = "sb_publishable_PXFh4qggQUq3Eb4AGbPpPg_05HIlS1x";

  const CONTAINER_ID = "partnerBanners";

  // WICHTIG: document.currentScript ist nur während der synchronen Ausführung
  // des Scripts gültig, deshalb hier sofort merken.
  const scriptTag = document.currentScript;
  const partnerName = scriptTag ? scriptTag.dataset.partner : null;

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/"/g, "&quot;")
      .replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Katalog-Seiten haben ein .grid mit .offer-Kacheln; dann dasselbe Markup nutzen.
  function usesGrid() {
    return !!document.querySelector(".grid .offer");
  }

  function renderBannerHTML(banner, asOffer) {
    const safeUrl = esc(banner.target_url || "#");
    const safeImg = esc(banner.image_url || "");
    const safeAlt = esc(banner.alt_text || banner.partner_name || "Partnerangebot");
    const cls = asOffer ? "offer" : "banner";
    return `
      <div class="${cls}">
        <a href="${safeUrl}" target="_blank" rel="noopener sponsored">
          <img src="${safeImg}" alt="${safeAlt}" loading="lazy">
        </a>
      </div>`;
  }

  function ensureContainer() {
    let el = document.getElementById(CONTAINER_ID);
    if (el) return el;
    el = document.createElement("div");
    el.id = CONTAINER_ID;
    const card = document.querySelector(".card") || document.body;
    card.appendChild(el);
    return el;
  }

  // Entfernt fest in die Seite eingebaute Awin-Banner (außerhalb des Containers),
  // damit nur die Banner aus der Datenbank (Admin) angezeigt werden.
  function removeStaticBanners(container) {
    const imgs = Array.from(document.querySelectorAll('img[src*="awin1.com/cshow.php"]'));
    imgs.forEach((img) => {
      if (container.contains(img)) return;
      const wrap = img.closest(".offer, .banner") || img.closest("a") || img;
      const parent = wrap.parentElement;
      wrap.remove();
      if (parent && parent !== container && parent.classList &&
          parent.classList.contains("grid") && !parent.children.length) {
        parent.remove();
      }
    });
  }

  // ---------- Banner (unverändert) ----------
  async function loadPartnerBanner() {
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

    if (document.readyState === "loading") {
      await new Promise((r) => document.addEventListener("DOMContentLoaded", r, { once: true }));
    }

    const asOffer = usesGrid(); // vor dem Entfernen prüfen
    const container = ensureContainer();
    removeStaticBanners(container);
    if (asOffer) container.classList.add("grid");
    container.innerHTML = rows.map((b) => renderBannerHTML(b, asOffer)).join("");
  }

  // ---------- Beschreibungstext (neu) ----------

  // Findet den vorhandenen Beschreibungstext direkt unter der Überschrift.
  // Bevorzugt ein Element mit Attribut data-partner-beschreibung. Sonst: das erste
  // kurze Textelement nach der <h1>, das kein Werbehinweis ist und keine Links/Bilder enthält.
  // Wird nichts Passendes gefunden, passiert nichts.
  function findDescriptionElement() {
    const hooked = document.querySelector("[data-partner-beschreibung]");
    if (hooked) return hooked;

    const h1 = document.querySelector(".card h1") || document.querySelector("h1");
    if (!h1) return null;

    let el = h1.nextElementSibling;
    for (let i = 0; i < 3 && el; i++, el = el.nextElementSibling) {
      if (el.tagName !== "P" && el.tagName !== "DIV") continue;
      if (el.querySelector("a, img, button, input, form")) continue;
      const text = (el.textContent || "").trim();
      if (text.length < 5 || text.length > 300) continue;
      if (/anzeige|werbung|vergütung|behörde|keine rechtsberatung/i.test(text)) continue;
      return el;
    }
    return null;
  }

  async function loadPartnerDescription() {
    if (!partnerName) return;

    const url =
      `${SUPABASE_URL}/rest/v1/partner_texte` +
      `?partner_name=ilike.${encodeURIComponent(partnerName)}` +
      `&aktiv=eq.true` +
      `&select=beschreibung` +
      `&limit=1`;

    try {
      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      if (!res.ok) return; // Tabelle fehlt o. ä.: bisheriger Text bleibt
      const rows = await res.json();
      const text = rows && rows[0] && rows[0].beschreibung;
      if (!text) return;

      // Wartet kurz, falls die Seite noch lädt
      if (document.readyState === "loading") {
        await new Promise((r) => document.addEventListener("DOMContentLoaded", r, { once: true }));
      }
      const el = findDescriptionElement();
      if (el) el.textContent = text;
    } catch (err) {
      console.warn("partner-page-banner.js: Beschreibung konnte nicht geladen werden", err);
    }
  }

  loadPartnerBanner();
  loadPartnerDescription();
})();
