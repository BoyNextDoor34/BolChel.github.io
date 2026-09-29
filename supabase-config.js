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
      width: 100% !important; max-width: 100% !important; min-width: 0 !important;
      overflow: hidden !important; box-sizing: border-box !important;
    }
    .app-nav .bolchel-logo-wrapper > div:first-child {
      width: 100% !important; max-width: 100% !important; height: auto !important;
      min-height: 0 !important; gap: 10px !important; box-sizing: border-box !important;
    }
    .app-nav .bolchel-logo-wrapper > div:first-child > svg {
      width: 64px !important; height: 64px !important; flex: 0 0 64px !important;
    }
    .app-nav .bolchel-logo-wrapper > div:first-child > div {
      min-width: 0 !important; flex: 1 1 auto !important; overflow: hidden !important;
      justify-content: center !important;
    }
    .app-nav .bolchel-logo-wrapper > div:first-child > div > span {
      display: block !important; max-width: 100% !important; font-size: 1.22rem !important;
      line-height: 0.98 !important; letter-spacing: 0.025em !important;
      white-space: nowrap !important; overflow: hidden !important; text-overflow: clip !important;
    }
    .app-nav .bolchel-logo-wrapper > div:last-child {
      max-width: 100% !important; overflow: hidden !important; font-size: 0.62rem !important;
      white-space: nowrap !important; text-overflow: ellipsis !important;
    }
    .app-nav.is-collapsed .bolchel-logo-wrapper { width:56px !important; max-width:56px !important; padding:0 !important; gap:0 !important; }
    .app-nav.is-collapsed .bolchel-logo-wrapper > div:first-child { width:56px !important; height:56px !important; gap:0 !important; }
    .app-nav.is-collapsed .bolchel-logo-wrapper > div:first-child > svg { width:56px !important; height:56px !important; flex:0 0 56px !important; }
    .app-nav.is-collapsed .bolchel-logo-wrapper > div:first-child > div,
    .app-nav.is-collapsed .bolchel-logo-wrapper > div:last-child { display:none !important; }
    @media (max-width:860px) {
      .app-nav .bolchel-logo-wrapper { width:100% !important; max-width:100% !important; padding:0 4px !important; gap:7px !important; }
      .app-nav .bolchel-logo-wrapper > div:first-child { width:100% !important; height:auto !important; min-height:0 !important; flex-direction:column !important; align-items:center !important; justify-content:flex-start !important; gap:7px !important; }
      .app-nav .bolchel-logo-wrapper > div:first-child > svg { width:58px !important; height:58px !important; flex:0 0 58px !important; }
      .app-nav .bolchel-logo-wrapper > div:first-child > div { width:100% !important; min-width:0 !important; height:auto !important; flex:0 0 auto !important; overflow:visible !important; align-items:center !important; justify-content:center !important; text-align:center !important; }
      .app-nav .bolchel-logo-wrapper > div:first-child > div > span { width:100% !important; max-width:100% !important; font-size:0.98rem !important; line-height:1.05 !important; letter-spacing:0.025em !important; white-space:nowrap !important; overflow:hidden !important; text-overflow:clip !important; text-align:center !important; }
      .app-nav .bolchel-logo-wrapper > div:last-child { width:100% !important; max-width:100% !important; font-size:0.54rem !important; line-height:1.2 !important; white-space:nowrap !important; overflow:hidden !important; text-overflow:ellipsis !important; text-align:center !important; }
    }
    body:has(#section-article.is-visible) #main-nav .nav-item[data-section="news"],
    body:has(#section-article.is-visible) #mobile-dock .mobile-dock-item[data-section="news"] {
      background:var(--md-sys-color-primary-container) !important; color:var(--md-sys-color-on-primary-container) !important;
      border-color:var(--md-sys-color-outline-variant) !important; font-weight:800 !important;
    }
    .editor-author-readonly { display:flex !important; align-items:center !important; min-height:56px !important; padding:0 16px !important; border:1px solid var(--md-sys-color-outline) !important; border-radius:16px !important; background:var(--md-sys-color-surface-container-low) !important; color:var(--md-sys-color-on-surface) !important; box-sizing:border-box !important; }
    .editor-author-readonly .editor-author-name { overflow:hidden !important; text-overflow:ellipsis !important; white-space:nowrap !important; }
    @media(max-width:860px){
      .editor-author-readonly{min-height:52px !important;}
      .mobile-dock.is-editor-inactive{transform:translateY(calc(100% + 28px)) !important;opacity:0 !important;visibility:hidden !important;pointer-events:none !important;}
    }
  `;
  document.head.appendChild(style);
  const syncArticleNewsDock=()=>{const article=document.getElementById('section-article'),newsDock=document.querySelector('#mobile-dock .mobile-dock-item[data-section="news"]');if(!article||!newsDock)return;newsDock.classList.toggle('is-active',article.classList.contains('is-visible'));};
  document.addEventListener('DOMContentLoaded',()=>{syncArticleNewsDock();const article=document.getElementById('section-article');if(!article)return;new MutationObserver(syncArticleNewsDock).observe(article,{attributes:true,attributeFilter:['class']});});
})();

/* Lock the news author in the editor. */
(function(){
  const getAuthorName=input=>{const id=input?.value||'';try{if(typeof state!=='undefined'){const profile=state.authorProfiles?.[id];if(profile?.nickname)return profile.nickname;if(state.user?.id===id)return state.user.profile?.nickname||state.user.email?.split('@')[0]||'Пользователь';}}catch(_){}return 'Редакция';};
  const lockAuthorField=field=>{if(!field||field.querySelector('.editor-author-readonly'))return;const input=field.querySelector('#news-author-input');if(!input?.value)return;const name=getAuthorName(input);field.innerHTML=`<span>Автор</span><div class="editor-author-readonly"><input type="hidden" id="news-author-input" value="${String(input.value||'').replace(/"/g,'&quot;')}"><span class="editor-author-name">${String(name).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}</span></div>`;};
  const scan=()=>document.querySelectorAll('.editor-author-field').forEach(lockAuthorField);
  const start=()=>{scan();const root=document.getElementById('editor-page');if(!root)return;new MutationObserver(scan).observe(root,{childList:true,subtree:true});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

/* Fold the mobile dock while the editor page is open. */
(function(){
  const sync=()=>{const dock=document.getElementById('mobile-dock'),editor=document.getElementById('section-editor');if(!dock||!editor)return;const inactive=Boolean(window.matchMedia?.('(max-width:860px)').matches&&editor.classList.contains('is-visible'));dock.classList.toggle('is-editor-inactive',inactive);dock.setAttribute('aria-hidden',inactive?'true':'false');};
  const start=()=>{const editor=document.getElementById('section-editor');if(editor)new MutationObserver(sync).observe(editor,{attributes:true,attributeFilter:['class']});window.addEventListener('resize',sync,{passive:true});sync();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

/* Load the enhanced suggestion workflow after the existing application is ready. */
(function(){
  const load=()=>{if(document.querySelector('script[data-suggestions-workflow]'))return;const s=document.createElement('script');s.src='suggestions-workflow.js?v=20260930-07';s.dataset.suggestionsWorkflow='1';s.defer=true;document.head.appendChild(s);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
