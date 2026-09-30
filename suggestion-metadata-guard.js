/* Keep suggestion metadata in the editor state immediately before submission.
   This is intentionally tiny: the actual insert/update remains in app.js. */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);

  function syncCategory(){
    const input=$('#news-category-input');
    const control=input?.closest('.editor-select-control');
    const selected=control?.querySelector('.editor-select-option.is-selected');
    if(!input||!selected)return;
    const value=String(selected.dataset.value||selected.textContent||'').trim();
    if(value)input.value=value;
  }

  function rememberCover(){
    if(typeof state==='undefined'||!state.editor?.suggestionMode)return;
    const file=$('#editor-image-file')?.files?.[0];
    if(file)state.editor.pendingCoverFile=file;
  }

  document.addEventListener('change',event=>{
    if(event.target?.matches?.('#editor-image-file'))rememberCover();
    if(event.target?.matches?.('#news-category-input'))syncCategory();
  },true);

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('#admin-save');
    if(!button||typeof state==='undefined'||!state.editor?.suggestionMode)return;
    syncCategory();
    rememberCover();
  },true);

  const observer=new MutationObserver(()=>syncCategory());
  const root=document.body;
  if(root)observer.observe(root,{subtree:true,childList:true});
})();
