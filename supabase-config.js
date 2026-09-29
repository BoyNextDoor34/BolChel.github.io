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
      .app-nav .bolchel-logo-wrapper {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 4px !important;
        gap: 7px !important;
      }

      .app-nav .bolchel-logo-wrapper > div:first-child {
        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: flex-start !important;
        gap: 7px !important;
      }

      .app-nav .bolchel-logo-wrapper > div:first-child > svg {
        width: 58px !important;
        height: 58px !important;
        flex: 0 0 58px !important;
      }

      .app-nav .bolchel-logo-wrapper > div:first-child > div {
        width: 100% !important;
        min-width: 0 !important;
        height: auto !important;
        flex: 0 0 auto !important;
        overflow: visible !important;
        align-items: center !important;
        justify-content: center !important;
        text-align: center !important;
      }

      .app-nav .bolchel-logo-wrapper > div:first-child > div > span {
        width: 100% !important;
        max-width: 100% !important;
        font-size: 0.98rem !important;
        line-height: 1.05 !important;
        letter-spacing: 0.025em !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: clip !important;
        text-align: center !important;
      }

      .app-nav .bolchel-logo-wrapper > div:last-child {
        width: 100% !important;
        max-width: 100% !important;
        font-size: 0.54rem !important;
        line-height: 1.2 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        text-align: center !important;
      }
    }

    /* Keep the News navigation item selected while a news article is open.
       The article has its own section state, but it still belongs to News. */
    body:has(#section-article.is-visible) #main-nav .nav-item[data-section="news"],
    body:has(#section-article.is-visible) #mobile-dock .mobile-dock-item[data-section="news"] {
      background: var(--md-sys-color-primary-container) !important;
      color: var(--md-sys-color-on-primary-container) !important;
      border-color: var(--md-sys-color-outline-variant) !important;
      font-weight: 800 !important;
    }
  `;
  document.head.appendChild(style);

  /* openSection() intentionally marks the article as its own section and
     therefore removes .is-active from the mobile News item. Keep the
     visual selection on News while an article is actually visible. */
  const syncArticleNewsDock = () => {
    const article = document.getElementById('section-article');
    const newsDock = document.querySelector('#mobile-dock .mobile-dock-item[data-section="news"]');
    if (!article || !newsDock) return;
    newsDock.classList.toggle('is-active', article.classList.contains('is-visible'));
  };

  document.addEventListener('DOMContentLoaded', () => {
    syncArticleNewsDock();
    const article = document.getElementById('section-article');
    if (!article) return;
    new MutationObserver(syncArticleNewsDock).observe(article, {
      attributes: true,
      attributeFilter: ['class']
    });
  });
})();
