
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
  function base(s) { return String(s).replace(/\s*\(DE\)\s*$/i, "").replace(/\s+DE$/i, "").trim(); }

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
      var groups = {}, order = [], seen = {}, raw = {};
      rows.forEach(function (b) {
        var key = base(b.partner_name);
        if (hasPage(key) || !b.image_url || !b.target_url || seen[b.target_url]) return;
        seen[b.target_url] = 1;
        if (!groups[key]) { groups[key] = []; order.push(key); raw[key] = b.partner_name; }
        groups[key].push(b);
      });
      if (!order.length) return;
      var list = document.querySelector(".partner-list");
      if (!list) {
        list = document.createElement("ul");
        list.className = "partner-list";
        card.appendChild(list);
      }
      // Partner ohne feste Seite: Eintrag wie bei den anderen, Klick öffnet die Vorlagenseite
      // /partner-seite.html?n=<Name> mit Überschrift, Beschreibung (Supabase "partner_texte") und Bannern.
      order.forEach(function (name) {
        var li = document.createElement("li");
        li.innerHTML =
          '<a href="/partner-seite.html?n=' + encodeURIComponent(raw[name]) + '">' +
          '<div class="name">' + esc(name) + '</div>' +
          '<div class="desc">' + esc(cat) + '</div>' +
          '<div class="go">Zur Partnerseite \u2192</div></a>';
        list.appendChild(li);
      });
    })
    .catch(function (e) { console.warn("partner-category.js:", e); });
})();
