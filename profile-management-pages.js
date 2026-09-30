/* Unified profile/management bootstrap. Keep the application core in app.js and load the smaller profile workflows only after it is ready. */
(function(){
  'use strict';

  const scripts=[
    ['suggestions-workflow.js?v=20260930-17','data-suggestions-workflow'],
    ['dialog-theme.js?v=20260930-07','data-dialog-theme'],
    ['performance-fixes.js?v=20260930-01','data-performance-fixes']
  ];
  const deferredScripts=[
    ['management-dialog-fix.js?v=20260930-13','data-management-dialog-fix'],
    ['drafts-workflow.js?v=20260930-18','data-drafts-workflow'],
    ['site-runtime-fixes.js?v=20260930-17','data-site-runtime-fixes']
  ];

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

  function installEditorMobileFix(){
    if(document.getElementById('editor-mobile-layout-fix'))return;
    const style=document.createElement('style');
    style.id='editor-mobile-layout-fix';
    style.textContent=`
      @media (max-width:860px){
        .editor-panes[data-editor-mode="split"]{grid-template-columns:1fr !important;}
        .editor-panes[data-editor-mode="split"] .editor-pane-preview{display:none !important;}
        .editor-panes[data-editor-mode="edit"] .editor-pane-preview,
        .editor-panes[data-editor-mode="preview"] .editor-pane-input{display:none !important;}
      }
    `;
    document.head.appendChild(style);
  }

  async function boot(){
    try{
      installEditorMobileFix();
      for(const [src,attr] of scripts) await load(src,attr);
      await Promise.all(deferredScripts.map(([src,attr])=>load(src,attr)));
    }catch(error){
      console.error('Profile management bootstrap failed:',error);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
