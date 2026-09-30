/* Final runtime fixes: recover core bootstrap and keep primary navigation state visible. */
(function(){
  'use strict';
  function markNavigation(){
    if(typeof state==='undefined')return;
    const section=state.section;
    const target=section==='profile-management'||section==='saved-drafts'?'profile':section==='article'?'news':section;
    document.querySelectorAll('#main-nav .nav-item[data-section],#mobile-dock .mobile-dock-item[data-section]').forEach(el=>{
      const active=el.dataset.section===target;
      el.classList.toggle('is-active',active);
      if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
    });
  }

  function resumeCore(){
    try{
      if(typeof window.initSupabase==='function' && window.__NEWS_APP_READY__!==true){
        Promise.resolve(window.initSupabase()).catch(error=>console.warn('Bootstrap resume failed:',error));
      }
    }catch(error){console.warn('Bootstrap resume error:',error);}
    markNavigation();
  }

  function install(){
    if(document.documentElement.dataset.runtimeFixes==='1')return;
    document.documentElement.dataset.runtimeFixes='1';
    document.addEventListener('click',event=>{
      if(event.target.closest?.('#main-nav .nav-item,#mobile-dock .mobile-dock-item,[data-management],#profile-management-back,#saved-drafts-back')){
        setTimeout(markNavigation,0);
      }
    },true);
    [0,50,150,400,1000].forEach(ms=>setTimeout(resumeCore,ms));
    window.addEventListener('popstate',()=>setTimeout(markNavigation,0));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();