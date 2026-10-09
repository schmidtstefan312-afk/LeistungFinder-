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

  // Partner mit eigener Katalogseite: Name in der Datenbank -> Ordner unter /partner/
  var EIGENE_SEITEN = {
    "Kalendermaxx-de": "kalendermaxx-de",
    "Airparks de": "airparks-de",
    "ALLPOWERS DE": "allpowers-de",
    "DRBO Greenenergy (DE)": "drbo-greenenergy-de",
    "Malteser": "malteser-de",
    "Marley Spoon DE": "marley-spoon-de",
    "VATRER": "vatrer-de"
  };

  // Kurzzeile unter dem Namen auf der Karte
  var KURZTEXT = {
    "Kalendermaxx-de": "Online-Aktionskalender für Unternehmen",
    "Airparks de": "Parken, Hotels und Lounges an Flughäfen",
    "ALLPOWERS DE": "Tragbare Powerstations",
    "DRBO Greenenergy (DE)": "Solartechnik und Energiespeicher",
    "Malteser": "Hausnotruf rund um die Uhr",
    "Marley Spoon DE": "Kochboxen mit Zutaten und Rezepten",
    "VATRER": "Lithium-Batterien und Energiespeicher"
  };

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
      // Partner ohne feste Seite: Karte genau wie die festen Einträge (Farbfläche, Buchstabe, "Partner", Button).
      // Hat der Partner eine eigene Katalogseite (EIGENE_SEITEN), führt der Klick direkt dorthin,
      // sonst auf die Vorlagenseite /partner-seite.html?n=<Name>.
      var farben = ["#ad7f42", "#2e9e4d", "#0d6b8a", "#8a3f5c", "#5b6bb0", "#c2622d"];
      var wm = "";
      var wmEl = list.querySelector(".ptop .wm");
      if (wmEl) { wm = wmEl.outerHTML; }
      else {
        var hm = document.querySelector(".hero .wmark");
        if (hm) wm = '<svg class="wm" viewBox="0 0 24 24" aria-hidden="true">' + hm.innerHTML + '</svg>';
      }
      var pfeil = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
      var start = list.querySelectorAll("li").length;
      order.forEach(function (name, i) {
        var li = document.createElement("li");
        var ziel = EIGENE_SEITEN[raw[name]]
          ? "/partner/" + EIGENE_SEITEN[raw[name]] + "/"
          : "/partner-seite.html?n=" + encodeURIComponent(raw[name]);
        var buchstabe = (name.match(/[A-Za-z0-9]/) || ["•"])[0].toUpperCase();
        var farbe = farben[(start + i) % farben.length];
        li.innerHTML =
          '<a href="' + ziel + '">' +
          '<span class="ptop" style="background:linear-gradient(135deg,' + farbe + ',#0d3934)">' + wm +
          '<span class="badge">' + esc(buchstabe) + '</span><span class="tag">Partner</span></span>' +
          '<span class="pbody"><span class="name">' + esc(name) + '</span>' +
          '<span class="desc">' + esc(KURZTEXT[raw[name]] || cat) + '</span>' +
          '<span class="go">Alle Angebote ansehen ' + pfeil + '</span></span></a>';
        list.appendChild(li);
      });
    })
    .catch(function (e) { console.warn("partner-category.js:", e); });
})();
