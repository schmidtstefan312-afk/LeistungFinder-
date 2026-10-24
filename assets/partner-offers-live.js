

// partner-offers-live.js – Startseite: Partner-Kacheln aus Supabase (public.banner)
// Fällt bei Fehlern auf die fest eingebaute Liste in index.html zurück.
(function () {
  "use strict";
  var URL = "https://rnnmdlibekqhqrxqqrws.supabase.co";
  var KEY = "sb_publishable_PXFh4qggQUq3Eb4AGbPpPg_05HIlS1x";
  var MERGE = { "Partnerangebote": "Sonstige Angebote" };

  fetch(URL + "/rest/v1/banner?aktiv=eq.true&select=category,partner_name,image_url,target_url,alt_text,sort_order&order=sort_order.asc&limit=2000",
    { headers: { apikey: KEY, Authorization: "Bearer " + KEY } })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (rows) {
      if (!Array.isArray(rows) || !rows.length) return;
      partnerCategorySlug["Uhren & Schmuck"] = "uhren-schmuck";
      partnerCategorySlug["Bürobedarf"] = "buerobedarf";
      var seen = {}, list = [];
      rows.forEach(function (b) {
        if (!b.image_url || !b.target_url || seen[b.target_url]) return;
        seen[b.target_url] = 1;
        list.push({
          category: MERGE[b.category] || b.category,
          label: b.partner_name,
          alt: b.alt_text || b.partner_name,
          url: b.target_url,
          img: b.image_url
        });
      });
      partnerOffers.splice.apply(partnerOffers, [0, partnerOffers.length].concat(list));
      renderPartnerOffers();
      // Kachel "Bürobedarf": eigener Untertitel und eigenes Symbol
      var bb = document.querySelector('a.lf-pbtn[href="/partner/buerobedarf/"]');
      if (bb) {
        var sm = bb.querySelector("small"); if (sm) sm.textContent = "Alles für Büro und Arbeitsplatz";
        var ic = bb.querySelector(".lf-pico"); if (ic) ic.innerHTML = '<svg class="lf-pi" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>';
      }
    })
    .catch(function (e) { console.warn("partner-offers-live.js: Fallback auf feste Liste:", e); });
})();
