
// partner-category.js – Kategorieseiten (/partner/<kategorie>/)
// Die feste Partnerliste bleibt. Partner aus Supabase, die dort noch fehlen,
// werden mit ihren Bannern direkt auf der Kategorieseite ergänzt.
(function () {
  "use strict";
  var URL = "https://rnnmdlibekqhqrxqqrws.supabase.co";
  var KEY = "sb_publishable_PXFh4qggQUq3Eb4AGbPpPg_05HIlS1x";
  var h1 = document.querySelector(".hero h1");
  var card = document.querySelector(".card");
  if (!h1 || !card) return;
  var cat = h1.textContent.trim();
  var cats = [cat];
  if (cat === "Sonstige Angebote") cats.push("Partnerangebote");

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;")
      .replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ""); }
  function base(s) { return String(s).replace(/\s+DE$/i, "").trim(); }

  var listed = Array.prototype.map.call(document.querySelectorAll(".partner-list .name"),
    function (n) { return norm(n.textContent); });
  function hasPage(name) {
    var n = norm(base(name));
    return listed.some(function (l) { return l.indexOf(n) >= 0 || n.indexOf(l) >= 0; });
  }

  var q = "in.(" + cats.map(function (c) { return '"' + c + '"'; }).join(",") + ")";
  fetch(URL + "/rest/v1/banner?aktiv=eq.true&category=" + encodeURIComponent(q) +
    "&select=partner_name,image_url,target_url,alt_text,sort_order&order=sort_order.asc&limit=2000",
    { headers: { apikey: KEY, Authorization: "Bearer " + KEY } })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (rows) {
      var groups = {}, order = [], seen = {};
      rows.forEach(function (b) {
        var key = base(b.partner_name);
        if (hasPage(key) || !b.image_url || !b.target_url || seen[b.target_url]) return;
        seen[b.target_url] = 1;
        if (!groups[key]) { groups[key] = []; order.push(key); }
        groups[key].push(b);
      });
      if (!order.length) return;
      var css = document.createElement("style");
      css.textContent = ".pc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:.75rem}" +
        ".pc-grid .banner{margin-top:0;padding:10px}.pc-grid .banner img{max-height:180px;object-fit:contain}";
      document.head.appendChild(css);
      var html = order.map(function (name) {
        return '<h2 class="name" style="margin-top:1.5rem">' + esc(name) + '</h2><div class="pc-grid">' +
          groups[name].map(function (b) {
            return '<div class="banner"><span class="badge">Anzeige</span>' +
              '<a href="' + esc(b.target_url) + '" target="_blank" rel="sponsored noopener">' +
              '<img loading="lazy" alt="' + esc(b.alt_text || b.partner_name) + '" src="' + esc(b.image_url) + '"></a></div>';
          }).join("") + "</div>";
      }).join("");
      var box = document.createElement("div");
      box.innerHTML = html;
      card.appendChild(box);
    })
    .catch(function (e) { console.warn("partner-category.js:", e); });
})();
