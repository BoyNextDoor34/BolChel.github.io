window.SUPABASE_CONFIG = {
  url: 'https://hbskouigfgekicgkabgg.supabase.co',
  anonKey: 'sb_publishable_o4GAB61zQsPugHS9qN2Lmg_Ob0So5pf'
};

/* Keep the existing logo markup intact, but constrain it to the navigation drawer.
   The current logo uses inline max-content sizing, so this small runtime style
   prevents the wordmark from escaping the drawer on desktop and mobile. */
(function () {
  const style = document.createElement('style');
  style.textContent = `
    .app-nav .bolchel-logo-wrapper {
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    .app-nav .bolchel-logo-wrapper > div:first-child {
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      min-height: 0 !important;
      gap: 10px !important;
      box-sizing: border-box !important;
    }

    .app-nav .bolchel-logo-wrapper > div:first-child > svg {
      width: 64px !important;
      height: 64px !important;
      flex: 0 0 64px !important;
    }

    .app-nav .bolchel-logo-wrapper > div:first-child > div {
      min-width: 0 !important;
      flex: 1 1 auto !important;
      overflow: hidden !important;
      justify-content: center !important;
    }

    .app-nav .bolchel-logo-wrapper > div:first-child > div > span {
      display: block !important;
      max-width: 100% !important;
      font-size: 1.22rem !important;
      line-height: 0.98 !important;
      letter-spacing: 0.025em !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: clip !important;
    }

    .app-nav .bolchel-logo-wrapper > div:last-child {
      max-width: 100% !important;
      overflow: hidden !important;
      font-size: 0.62rem !important;
      white-space: nowrap !important;
      text-overflow: ellipsis !important;
    }

    .app-nav.is-collapsed .bolchel-logo-wrapper {
      width: 56px !important;
      max-width: 56px !important;
      padding: 0 !important;
      gap: 0 !important;
    }

    .app-nav.is-collapsed .bolchel-logo-wrapper > div:first-child {
      width: 56px !important;
      height: 56px !important;
      gap: 0 !important;
    }

    .app-nav.is-collapsed .bolchel-logo-wrapper > div:first-child > svg {
      width: 56px !important;
      height: 56px !important;
      flex: 0 0 56px !important;
    }

    .app-nav.is-collapsed .bolchel-logo-wrapper > div:first-child > div,
    .app-nav.is-collapsed .bolchel-logo-wrapper > div:last-child {
      display: none !important;
    }

    @media (max-width: 860px) {
      .app-nav .bolchel-logo-wrapper > div:first-child > svg {
        width: 72px !important;
        height: 72px !important;
        flex-basis: 72px !important;
      }

      .app-nav .bolchel-logo-wrapper > div:first-child > div > span {
        font-size: 1.35rem !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
