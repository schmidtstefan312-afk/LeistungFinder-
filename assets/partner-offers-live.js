
/* Leistung-Finder Chat-Assistent \u2013 eigenst\u00e4ndige Datei, keine Abh\u00e4ngigkeiten.
   Einbinden: <script src="chatbot.js" defer></script> kurz vor </body> */
(function () {
  if (window.__lfChat) return;
  window.__lfChat = true;

  var URL = "https://rnnmdlibekqhqrxqqrws.supabase.co/functions/v1/chat";
  var LINKS = ["arbeitsagentur.de", "verwaltung.bund.de", "familienportal.de",
    "bundesgesundheitsministerium.de", "bafa.de", "foerderdatenbank.de"];
  var history = [];
  var busy = false;

  var css = "\
#lfc-btn{position:fixed;right:16px;bottom:16px;z-index:2147483000;width:58px;height:58px;border-radius:50%;border:0;background:#1d4ed8;color:#fff;font-size:26px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.3)}\
#lfc-btn:focus-visible,#lfc-send:focus-visible,#lfc-in:focus-visible,#lfc-x:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}\
#lfc-box{position:fixed;right:16px;bottom:86px;z-index:2147483000;width:min(380px,calc(100vw - 32px));height:min(540px,calc(100vh - 110px));background:#fff;color:#111;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.35);display:none;flex-direction:column;overflow:hidden;font:16px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}\
#lfc-box.open{display:flex}\
#lfc-head{background:#1d4ed8;color:#fff;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;font-weight:600}\
#lfc-x{background:none;border:0;color:#fff;font-size:24px;line-height:1;cursor:pointer;padding:2px 6px}\
#lfc-msgs{flex:1;overflow-y:auto;padding:12px;background:#f3f4f6}\
.lfc-m{max-width:88%;margin:0 0 10px;padding:9px 12px;border-radius:12px;white-space:pre-wrap;word-wrap:break-word}\
.lfc-b{background:#fff;border:1px solid #e5e7eb;margin-right:auto}\
.lfc-u{background:#1d4ed8;color:#fff;margin-left:auto}\
.lfc-m a{color:#1d4ed8;text-decoration:underline}.lfc-u a{color:#fff}\
#lfc-note{font-size:12px;color:#4b5563;padding:6px 12px;background:#fff;border-top:1px solid #e5e7eb}\
#lfc-form{display:flex;gap:8px;padding:10px;border-top:1px solid #e5e7eb;background:#fff}\
#lfc-in{flex:1;font-size:16px;padding:10px;border:1px solid #9ca3af;border-radius:8px;min-width:0}\
#lfc-send{background:#1d4ed8;color:#fff;border:0;border-radius:8px;padding:0 16px;font-size:16px;cursor:pointer}\
#lfc-send[disabled]{opacity:.5}";

  var st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  var btn = document.createElement("button");
  btn.id = "lfc-btn";
  btn.type = "button";
  btn.setAttribute("aria-label", "Chat-Assistent \u00f6ffnen");
  btn.textContent = "\ud83d\udcac";

  var box = document.createElement("div");
  box.id = "lfc-box";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-label", "Chat-Assistent");
  box.innerHTML =
    '<div id="lfc-head"><span>Fragen zu Leistungen</span><button id="lfc-x" type="button" aria-label="Chat schlie\u00dfen">\u00d7</button></div>' +
    '<div id="lfc-msgs" aria-live="polite"></div>' +
    '<div id="lfc-note">Automatischer Assistent, keine Beratung. Bitte keine pers\u00f6nlichen Daten eingeben.</div>' +
    '<form id="lfc-form"><input id="lfc-in" type="text" maxlength="500" placeholder="Ihre Frage \u2026" autocomplete="off" aria-label="Ihre Frage">' +
    '<button id="lfc-send" type="submit">Senden</button></form>';

  document.body.appendChild(btn);
  document.body.appendChild(box);

  var msgs = box.querySelector("#lfc-msgs");
  var input = box.querySelector("#lfc-in");
  var send = box.querySelector("#lfc-send");

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function linkify(s) {
    s = esc(s);
    LINKS.forEach(function (d) {
      var re = new RegExp("(^|[^\\w./-])((?:https?://)?(?:www\\.)?" + d.replace(/\./g, "\\.") + ")(?![\\w-])", "gi");
      s = s.replace(re, function (m, pre) {
        return pre + '<a href="https://' + d + '" target="_blank" rel="noopener noreferrer">' + d + "</a>";
      });
    });
    return s;
  }
  function add(role, text) {
    var d = document.createElement("div");
    d.className = "lfc-m " + (role === "user" ? "lfc-u" : "lfc-b");
    if (role === "user") d.textContent = text; else d.innerHTML = linkify(text);
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  add("assistant", "Guten Tag! Ich gebe Ihnen eine erste Orientierung zu staatlichen Leistungen und F\u00f6rderungen, z. B. B\u00fcrgergeld, Wohngeld, Kindergeld oder Pflegegrad. Was m\u00f6chten Sie wissen?");

  function toggle(open) {
    var o = open === undefined ? !box.classList.contains("open") : open;
    box.classList.toggle("open", o);
    btn.setAttribute("aria-label", o ? "Chat-Assistent schlie\u00dfen" : "Chat-Assistent \u00f6ffnen");
    if (o) setTimeout(function () { input.focus(); }, 50);
  }
  btn.addEventListener("click", function () { toggle(); });
  box.querySelector("#lfc-x").addEventListener("click", function () { toggle(false); btn.focus(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") toggle(false); });

  box.querySelector("#lfc-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text || busy) return;
    input.value = "";
    add("user", text);
    history.push({ role: "user", content: text });
    busy = true; send.disabled = true;
    var wait = add("assistant", "\u2026");
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 30000);
    fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-8) }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) { return r.json(); })
      .then(function (j) {
        var reply = (j && j.reply) || "Dazu habe ich gerade keine Antwort. Bitte wenden Sie sich an die zust\u00e4ndige Stelle.";
        wait.innerHTML = linkify(reply);
        history.push({ role: "assistant", content: reply });
      })
      .catch(function () {
        wait.innerHTML = linkify("Der Assistent ist gerade nicht erreichbar. Bitte nutzen Sie die Suche auf Leistung-Finder oder wenden Sie sich an die zust\u00e4ndige Stelle, z. B. \u00fcber arbeitsagentur.de oder verwaltung.bund.de.");
        history.pop();
      })
      .then(function () {
        clearTimeout(timer);
        busy = false; send.disabled = false;
        msgs.scrollTop = msgs.scrollHeight;
        input.focus();
      });
  });
})();
