/* Load the profile-management workflow and its shared Material 3 UI extensions. */
(function(){
  'use strict';
  function load(src,attr){
    return new Promise((resolve,reject)=>{
      if(document.querySelector('script['+attr+']')){resolve();return;}
      const script=document.createElement('script');
      script.src=src;
      script.async=false;
      script.setAttribute(attr,'1');
      script.onload=resolve;
      script.onerror=()=>reject(new Error('Не удалось загрузить '+src));
      document.body.appendChild(script);
    });
  }
  (async()=>{
    try{
      await load('suggestions-workflow.js?v=20260930-12','data-suggestions-workflow');
      await load('dialog-theme.js?v=20260930-06','data-dialog-theme');
      await load('suggestion-save-fix.js?v=20260930-12','data-suggestion-save-fix');
      await load('management-dialog-fix.js?v=20260930-12','data-management-dialog-fix');
      await load('profile-management-fixes.js?v=20260930-12','data-profile-management-fixes');
      await load('profile-management-final.js?v=20260930-12','data-profile-management-final');
      await load('drafts-workflow.js?v=20260930-13','data-drafts-workflow');
      await load('site-runtime-fixes.js?v=20260930-12','data-site-runtime-fixes');
    }catch(error){
      console.error('Profile management extensions failed:',error);
    }
  })();
})();
