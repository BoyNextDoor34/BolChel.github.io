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

  window.__openAccessibilityDirect=openAccessibility;
})();
