
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

  // Namensvergleich ohne Rücksicht auf Reihenfolge, Groß-/Kleinschreibung, Zeichen und "DE"/"GmbH"
  function tokens(s) {
    return String(s).toLowerCase().split(/[^a-z0-9]+/).filter(function (w) {
      return w && w !== "de" && w !== "gmbh";
    }).sort().join(" ");
  }
  var listed = Array.prototype.map.call(document.querySelectorAll(".partner-list .name"),
    function (n) { return { n: norm(n.textContent), t: tokens(n.textContent) }; });
  function hasPage(name) {
    var n = norm(base(name)), t = tokens(name);
    return listed.some(function (l) { return l.t === t || l.n.indexOf(n) >= 0 || n.indexOf(l.n) >= 0; });
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
      css.textContent =
        ".pc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr));gap:14px;margin:.75rem 0 .25rem;width:100%;max-width:100%}" +
        ".pc-grid[hidden]{display:none}" +
        ".pc-grid .banner{min-width:0;margin:0;padding:0;background:transparent;border:0}" +
        ".pc-grid .badge{display:block;font-size:.72rem;color:#5c655f;font-style:italic;margin:0 0 4px;position:static}" +
        ".pc-grid .banner a{display:flex;align-items:center;justify-content:center;width:100%;height:170px;overflow:hidden;background:#fff;border:1px solid #e2ded2;border-radius:3px}" +
        ".pc-grid .banner img{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain}" +
        ".pc-toggle{cursor:pointer}";
      document.head.appendChild(css);
      var list = document.querySelector(".partner-list");
      if (!list) {
        list = document.createElement("ul");
        list.className = "partner-list";
        card.appendChild(list);
      }
      order.forEach(function (name) {
        var li = document.createElement("li");
        li.innerHTML =
          '<a href="#" class="pc-toggle" aria-expanded="false">' +
          '<div class="name">' + esc(name) + '</div>' +
          '<div class="desc">' + esc(cat) + '</div>' +
          '<div class="go">Angebote ansehen \u2193</div></a>' +
          '<div class="pc-grid" hidden>' +
          groups[name].map(function (b) {
            return '<div class="banner"><span class="badge">Anzeige</span>' +
              '<a href="' + esc(b.target_url) + '" target="_blank" rel="sponsored noopener">' +
              '<img loading="lazy" alt="' + esc(b.alt_text || b.partner_name) + '" src="' + esc(b.image_url) + '"></a></div>';
          }).join("") + '</div>';
        var t = li.querySelector(".pc-toggle"), g = li.querySelector(".pc-grid"), go = li.querySelector(".go");
        t.addEventListener("click", function (e) {
          e.preventDefault();
          var open = g.hasAttribute("hidden");
          if (open) g.removeAttribute("hidden"); else g.setAttribute("hidden", "");
          t.setAttribute("aria-expanded", open ? "true" : "false");
          go.textContent = open ? "Angebote ausblenden \u2191" : "Angebote ansehen \u2193";
        });
        list.appendChild(li);
      });
    })
    .catch(function (e) { console.warn("partner-category.js:", e); });
})();
