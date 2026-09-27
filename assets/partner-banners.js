
(function () {
  const SUPABASE_URL = "https://rnnmdlibekqhqrxqqrws.supabase.co";
  const SUPABASE_KEY = "sb_publishable_PXFh4qggQUq3Eb4AGbPpPg_05HIlS1x";

  const script = document.currentScript;
  const category = script?.getAttribute("data-category")?.trim();
  if (!category) return;

  const wrap = document.getElementById("dynamicBannerWrap");
  const container = document.getElementById("dynamicBanners");
  if (!wrap || !container) return;

  const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  async function loadBanners() {
    const { data: rows, error } = await client
      .from("banner")
      .select("partner_name, image_url, target_url, alt_text, sort_order")
      .eq("category", category)
      .eq("aktiv", true)
      .order("sort_order", { ascending: true });

    if (error || !rows || rows.length === 0) return;

    container.innerHTML = rows
      .map(
        (r) => `
      <div class="banner" style="margin-bottom:1rem;">
        <a href="${escapeHtml(r.target_url)}" target="_blank" rel="noopener sponsored">
          <img src="\( {escapeHtml(r.image_url)}" alt=" \){escapeHtml(r.alt_text || r.partner_name)}" loading="lazy" style="max-width:100%;height:auto;display:block;margin:0 auto;">
        </a>
      </div>`
      )
      .join("");

    wrap.style.display = "block";
  }

  if (typeof supabase !== "undefined") {
    loadBanners();
  } else {
    window.addEventListener("load", loadBanners);
  }
})();
