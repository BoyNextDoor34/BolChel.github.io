(function(){
  'use strict';

  function get(id){ return document.getElementById(id); }

  function openAccessibility(){
    const dialog=get('accessibility-dialog');
    if(!dialog) return false;

    try{
      if(typeof window.openAccessibilitySettings==='function'){
        window.openAccessibilitySettings();
        if(dialog.open) return true;
      }
    }catch(error){
      console.warn('Accessibility app handler failed, using direct dialog fallback:',error);
    }

    try{
      if(!dialog.open){
        if(typeof dialog.showModal==='function') dialog.showModal();
        else dialog.setAttribute('open','');
      }
      get('a11y-enabled')?.focus?.({preventScroll:true});
      return true;
    }catch(error){
      console.error('Could not open accessibility dialog:',error);
      return false;
    }
  }

  function bind(){
    const button=get('accessibility-button');
    const dialog=get('accessibility-dialog');
    if(!button||!dialog) return false;
    if(button.dataset.a11yEntryBound==='1') return true;

    button.dataset.a11yEntryBound='1';
    button.addEventListener('click',function(event){
      event.preventDefault();
      event.stopImmediatePropagation();
      openAccessibility();
    },{capture:true});

    button.addEventListener('keydown',function(event){
      if(event.key==='Enter'||event.key===' '){
        event.preventDefault();
        event.stopImmediatePropagation();
        openAccessibility();
      }
    },{capture:true});

    return true;
  }

  if(!bind()){
    document.addEventListener('DOMContentLoaded',bind,{once:true});
  }


  const CONTRAST_SURFACES = {
    bw: {surface:'#ffffff', surfaceContainer:'#f4f4f4', surfaceHigh:'#eeeeee', text:'#000000', primary:'#000000', onPrimary:'#ffffff', border:'#000000'},
    wb: {surface:'#000000', surfaceContainer:'#111111', surfaceHigh:'#222222', text:'#ffffff', primary:'#ffffff', onPrimary:'#000000', border:'#ffffff'},
    'yellow-navy': {surface:'#001a33', surfaceContainer:'#00233f', surfaceHigh:'#00345f', text:'#ffffff', primary:'#ffff00', onPrimary:'#000000', border:'#ffff00'},
    'navy-cream': {surface:'#fff8d7', surfaceContainer:'#f7efc9', surfaceHigh:'#d7e8f6', text:'#001a2d', primary:'#003b67', onPrimary:'#ffffff', border:'#001a2d'}
  };

  function setContrastInline(value){
    const schemes={
      bw:{surface:'#ffffff',container:'#f4f4f4',high:'#eeeeee',text:'#000000',primary:'#000000',onPrimary:'#ffffff',border:'#000000'},
      wb:{surface:'#000000',container:'#111111',high:'#222222',text:'#ffffff',primary:'#ffffff',onPrimary:'#000000',border:'#ffffff'},
      'yellow-navy':{surface:'#001a33',container:'#00233f',high:'#00345f',text:'#ffffff',primary:'#ffff00',onPrimary:'#000000',border:'#ffff00'},
      'navy-cream':{surface:'#fff8d7',container:'#f7efc9',high:'#d7e8f6',text:'#001a2d',primary:'#003b67',onPrimary:'#ffffff',border:'#001a2d'}
    };
    const root=document.documentElement;
    const scheme=schemes[value]||schemes.bw;
    root.dataset.a11yContrast=value;
    const enabled=get('a11y-enabled');
    root.classList.toggle('a11y-enabled',!!enabled?.checked);
    const vars={
      '--md-sys-color-surface':scheme.surface,
      '--md-sys-color-surface-container-low':scheme.surface,
      '--md-sys-color-surface-container':scheme.container,
      '--md-sys-color-surface-container-high':scheme.high,
      '--md-sys-color-surface-container-highest':scheme.high,
      '--md-sys-color-on-surface':scheme.text,
      '--md-sys-color-on-surface-variant':scheme.text,
      '--md-sys-color-primary':scheme.primary,
      '--md-sys-color-on-primary':scheme.onPrimary,
      '--md-sys-color-primary-container':scheme.high,
      '--md-sys-color-on-primary-container':scheme.text,
      '--md-sys-color-secondary':scheme.primary,
      '--md-sys-color-secondary-container':scheme.high,
      '--md-sys-color-on-secondary-container':scheme.text,
      '--md-sys-color-tertiary':scheme.primary,
      '--md-sys-color-on-tertiary':scheme.onPrimary,
      '--md-sys-color-outline':scheme.border,
      '--md-sys-color-outline-variant':scheme.border,
      '--md-sys-color-error':scheme.primary
    };
    Object.entries(vars).forEach(([key,val])=>root.style.setProperty(key,val,'important'));
    document.body?.style.setProperty('background-color',scheme.surface,'important');
    document.body?.style.setProperty('color',scheme.text,'important');
    document.querySelectorAll('.app-nav,.topbar,.mobile-dock,.whichkey-panel,.dialog-card,.surface-card,.news-card,.search-shell,.accessibility-fieldset,.a11y-check,.accessibility-switch').forEach(el=>{
      el.style.setProperty('background-color',scheme.container,'important');
      el.style.setProperty('color',scheme.text,'important');
      el.style.setProperty('border-color',scheme.border,'important');
    });
    document.querySelectorAll('.filled-button').forEach(el=>{
      el.style.setProperty('background-color',scheme.primary,'important');
      el.style.setProperty('color',scheme.onPrimary,'important');
    });
    document.querySelectorAll('.text-button,.eyebrow,.page-context span:first-child,.article-markdown a,.category-pill,.nav-item.is-active,.mobile-dock-item.is-active').forEach(el=>{
      el.style.setProperty('color',scheme.primary,'important');
    });
    document.querySelectorAll('.category-pill').forEach(el=>el.style.setProperty('background-color',scheme.high,'important'));
    try{
      const saved=JSON.parse(localStorage.getItem('news-accessibility')||'{}');
      saved.contrast=value;
      localStorage.setItem('news-accessibility',JSON.stringify(saved));
    }catch(_){}
  }

  window.__setAccessibilityContrast=function(value){
    if(!value) return;
    try{ window.__setAccessibilitySetting?.('contrast',value); }catch(_){}
    setContrastInline(value);
  };

  function applyDirectContrast(){
    const enabled=get('a11y-enabled')?.checked===true;
    const selected=document.querySelector('input[data-a11y-setting="contrast"]:checked');
    const root=document.documentElement;
    if(!enabled || !selected) return;
    const key=selected.value;
    setContrastInline(key);
    root.dataset.a11yContrast=key;
    const scheme=CONTRAST_SURFACES[key]||CONTRAST_SURFACES.bw;
    root.style.setProperty('--a11y-contrast-surface',scheme.surface);
    root.style.setProperty('--a11y-contrast-container',scheme.surfaceContainer);
    root.style.setProperty('--a11y-contrast-high',scheme.surfaceHigh);
    root.style.setProperty('--a11y-contrast-text',scheme.text);
    root.style.setProperty('--a11y-contrast-primary',scheme.primary);
    root.style.setProperty('--a11y-contrast-on-primary',scheme.onPrimary);
    root.style.setProperty('--a11y-contrast-border',scheme.border);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',scheme.surface);
  }

  function bindContrastFallback(){
    if(document.documentElement.dataset.a11yContrastFallbackBound==='1') return;
    document.documentElement.dataset.a11yContrastFallbackBound='1';
    document.addEventListener('change',function(event){
      const target=event.target;
      if(!(target instanceof HTMLInputElement)) return;
      if(target.dataset.a11ySetting==='contrast' || target.id==='a11y-enabled'){
        applyDirectContrast();
      }
    },true);
    document.addEventListener('click',function(event){
      const target=event.target;
      if(target instanceof HTMLInputElement && target.dataset.a11ySetting==='contrast'){
        applyDirectContrast();
      }
    },true);
    applyDirectContrast();
  }


  window.__openAccessibilityDirect=openAccessibility;
  bindContrastFallback();
})();