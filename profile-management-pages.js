/* Load the profile-management workflow and the shared themed confirmation dialog. */
(function(){
  'use strict';
  function load(src, attr){
    return new Promise((resolve,reject)=>{
      if(document.querySelector('script['+attr+']')){ resolve(); return; }
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
      await load('suggestions-workflow.js?v=20260930-02','data-suggestions-workflow');
      await load('dialog-theme.js?v=20260930-02','data-dialog-theme');
    }catch(error){
      console.error('Profile management extensions failed:',error);
    }
  })();
})();
