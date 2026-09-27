
(function () {
  var SUPABASE_URL = "https://rnnmdlibekqhqrxqqrws.supabase.co";
  var SUPABASE_KEY = "sb_publishable_PXFh4qggQUq3Eb4AGbPpPg_05HIlS1x";

  var scriptTag = document.currentScript;
  var category = scriptTag.getAttribute("data-category");
  var wrapId = scriptTag.getAttribute("data-wrap") || "dynamicBannerWrap";
  var listId = scriptTag.getAttribute("data-target") || "dynamicBanners";

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  function render(rows) {
    var wrap = document.getElementById(wrapId);
    var list = document.getElementById(listId);
    if (!wrap || !list) return;
    if (!rows || !rows.length) {
      wrap.style.display = "none";
      return;
    }
    list.innerHTML = rows.map(function (r) {
      return (
        '<div class="banner">' +
          '<span class="badge">Anzeige</span><br>' +
          '<a rel="sponsored noopener" target="_blank" href="' + escapeHtml(r.target_url) + '">' +
            '<img loading="lazy" alt="' + escapeHtml(r.alt_text || r.partner_name) + '" src="' + escapeHtml(r.image_url) + '">' +
          '</a>' +
        '</div>'
      );
    }).join("");
    wrap.style.display = "block";
  }

  function init() {
    if (typeof supabase === "undefined") {
      setTimeout(init, 50);
      return;
    }
    var client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    client
      .from("banner")
      .select("*")
      .eq("category", category)
      .eq("aktiv", true)
      .order("sort_order", { ascending: true })
      .then(function (res) {
        if (!res.error) render(res.data);
      });
  }

  init();
})();
