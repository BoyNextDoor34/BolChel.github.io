/* Lightweight performance layer. It does not change data flow; it only caches
   expensive palette work and avoids rebuilding the Markdown preview on every
   keystroke when the preview is not visible. */
(function(){
  'use strict';

  function install(){
    if(document.documentElement.dataset.performanceFixes==='1')return;
    document.documentElement.dataset.performanceFixes='1';

    if(typeof window.generateM3ContentPaletteFromImage==='function'){
      const originalPalette=window.generateM3ContentPaletteFromImage;
      const cache=new Map();
      window.generateM3ContentPaletteFromImage=async function(imageUrl){
        const key=String(imageUrl||'');
        if(!key)return originalPalette(imageUrl);
        if(cache.has(key))return cache.get(key);
        const pending=originalPalette(imageUrl);
        cache.set(key,pending);
        try{return await pending;}
        catch(error){cache.delete(key);throw error;}
      };
    }

    if(typeof window.renderMarkdownPreview==='function'){
      const originalPreview=window.renderMarkdownPreview;
      let timer=0;
      window.renderMarkdownPreview=function(){
        const panes=document.querySelector('#editor-panes');
        const mode=panes?.dataset.editorMode||'split';
        if(mode==='edit')return;
        clearTimeout(timer);
        timer=setTimeout(()=>originalPreview(),mode==='split'?120:0);
      };
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
