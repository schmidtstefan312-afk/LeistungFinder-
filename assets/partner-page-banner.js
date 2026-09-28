// partner-page-banner.js
// Leistung-Finder
// Öffentliche Partnerseiten laden ihre Banner ausschließlich aus Supabase.
// Fest im HTML eingebaute Banner werden entfernt, damit keine Doppelanzeigen
// entstehen.

(function () {
  "use strict";

  const SUPABASE_URL =
    "https://rnnmdlibekqhqrxqqrws.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_PXFh4qggQUq3Eb4AGbPpPg_05HIlS1x";

  const CONTAINER_ID = "partnerBanners";

  function renderBannerHTML(banner) {
    const safeUrl = banner.target_url || "#";
    const safeImg = banner.image_url || "";
    const safeAlt =
      banner.alt_text ||
      banner.partner_name ||
      "Partnerangebot";

    return `
      <div class="banner">
        <span class="badge">Anzeige</span>
        <a
          href="${safeUrl}"
          target="_blank"
          rel="sponsored noopener"
        >
          <img
            loading="lazy"
            alt="${safeAlt}"
            src="${safeImg}"
          >
        </a>
      </div>
    `;
  }

  function ensureContainer() {
    let el = document.getElementById(CONTAINER_ID);

    if (el) {
      return el;
    }

    el = document.createElement("div");
    el.id = CONTAINER_ID;

    const card =
      document.querySelector(".card") ||
      document.body;

    card.appendChild(el);

    return el;
  }

  function removeFixedBanners(container) {
    /*
      Alte Banner, die fest im Partner-HTML stehen,
      werden entfernt.

      Wichtig:
      Banner innerhalb von #partnerBanners werden NICHT entfernt.
      Diese kommen aus Supabase.
    */
    document
      .querySelectorAll(".banner")
      .forEach((el) => {
        if (!container.contains(el)) {
          el.remove();
        }
      });
  }

  function installCompactStyles() {
    if (
      document.getElementById(
        "partner-banner-grid-style"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "partner-banner-grid-style";

    style.textContent = `
      #partnerBanners.partner-banners-grid {
        display: grid;
        grid-template-columns:
          repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
        margin-top: 1rem;
      }

      #partnerBanners.partner-banners-grid .banner {
        margin-top: 0;
        padding: 10px;
      }

      #partnerBanners.partner-banners-grid
      .banner img {
        display: block;
        width: auto;
        max-width: 100%;
        max-height: 180px;
        height: auto;
        object-fit: contain;
        margin: 0 auto;
      }

      @media (max-width: 600px) {
        #partnerBanners.partner-banners-grid {
          grid-template-columns: 1fr;
          gap: 12px;
        }

        #partnerBanners.partner-banners-grid
        .banner img {
          max-height: 160px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  async function loadPartnerBanner() {
    const scriptTag =
      document.currentScript;

    const partnerName =
      scriptTag
        ? scriptTag.dataset.partner
        : null;

    if (!partnerName) {
      console.warn(
        "partner-page-banner.js: " +
        "kein data-partner gesetzt."
      );
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
      const res =
        await fetch(url, {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization:
              `Bearer ${SUPABASE_KEY}`,
          },
        });

      if (!res.ok) {
        console.error(
          "partner-page-banner.js: " +
          "Supabase-Anfrage fehlgeschlagen:",
          res.status,
          res.statusText
        );
        return;
      }

      rows = await res.json();

    } catch (err) {
      console.error(
        "partner-page-banner.js: " +
        "Fehler beim Laden:",
        err
      );
      return;
    }

    console.log(
      `partner-page-banner.js: ` +
      `${rows.length} aktive Banner für ` +
      `"${partnerName}" geladen.`
    );

    const container =
      ensureContainer();

    /*
      Ganz wichtig:
      Fest eingebaute Banner werden entfernt.
      Danach bleiben ausschließlich die
      Supabase-Banner übrig.
    */
    removeFixedBanners(container);

    if (!rows.length) {
      container.innerHTML = "";
      return;
    }

    installCompactStyles();

    container.classList.add(
      "partner-banners-grid"
    );

    container.innerHTML =
      rows
        .map(renderBannerHTML)
        .join("");
  }

  /*
    document.currentScript ist nur während
    der synchronen Ausführung verfügbar.
    Deshalb direkt starten.
  */
  loadPartnerBanner();

})();
