
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
    })
    .catch(function (e) { console.warn("partner-offers-live.js: Fallback auf feste Liste:", e); });
})();
