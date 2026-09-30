/* Reliable save bridge for the suggestion editor. */
(function(){
  'use strict';
  let busy=false;
  const $=(s,r=document)=>r.querySelector(s);
  const resetEditor=()=>{ state.editor={id:null,mode:'edit',originalImageUrl:null,generatedPalette:null,imageObjectUrl:null,pendingCoverFile:null,authorId:null,suggestionMode:false,submissionId:null}; };
  async function save(){
    if(busy)return;
    const page=$('#editor-page');
    const id=page?.dataset.suggestionId;
    const mode=page?.dataset.suggestionMode;
    if(!id||!mode)return;
    if(!state.supabase||!state.user){ showToast?.('Не удалось сохранить: аккаунт или Supabase недоступен.'); return; }
    busy=true;
    const msg=$('#admin-message');
    if(msg)msg.textContent='';
    try{
      const title=$('#news-title-input')?.value.trim()||'';
      const category=$('#news-category-input')?.value||'Политика';
      const summary=$('#news-summary-input')?.value.trim()||'';
      const body=$('#news-body-input')?.value.trim()||'';
      let image=$('#news-image-input')?.value.trim()||'';
      if(!title||!body)throw new Error('Заполните заголовок и текст новости.');
      if(state.editor.pendingCoverFile){
        if(msg)msg.textContent='Загружаем обложку…';
        image=await uploadNewsImage(state.editor.pendingCoverFile,'suggestion');
        $('#news-image-input').value=image;
        state.editor.pendingCoverFile=null;
      }
      if(!image)image=extractFirstImageFromMarkdown(body)||'';
      if(!image)throw new Error('Добавьте изображение новости.');
      if(msg)msg.textContent='Генерируем палитру…';
      const palette=state.editor.generatedPalette?.generator===M3_IMAGE_PALETTE_GENERATOR?state.editor.generatedPalette:await generateM3ContentPaletteFromImage(image);
      const effectiveSummary=summary||body.replace(/^#{1,6}\s+/gm,'').replace(/[*_`>#-]/g,'').split(/\n\s*\n/).find(Boolean)?.trim().slice(0,360)||'';
      let result;
      if(mode==='published-edit'||mode==='admin-review-update'){
        const q=state.supabase.from('news_submissions').update({pending_category:category,pending_title:title,pending_summary:effectiveSummary,pending_body:body,pending_image_url:image,pending_palette:palette,status:'pending_update',updated_at:new Date().toISOString()}).eq('id',id);
        if(mode==='published-edit')q.eq('author_id',state.user.id);
        result=await q;
      }else{
        result=await state.supabase.from('news_submissions').update({category,title,summary:effectiveSummary,body,image_url:image,palette,status:'pending',updated_at:new Date().toISOString()}).eq('id',id);
      }
      if(result.error)throw result.error;
      try{localStorage.removeItem(`news-editor-draft-${id}`);}catch(_){ }
      showToast?.(mode==='published-edit'?'Изменения отправлены администратору':'Предложение сохранено');
      resetEditor();
      window.openSection?.('profile');
      setTimeout(()=>window.openSection?.('profile-management'),0);
    }catch(error){
      console.error('Suggestion save failed:',error);
      if(msg)msg.textContent=error?.message||'Не удалось сохранить изменения.';else showToast?.(error?.message||'Не удалось сохранить изменения.');
    }finally{busy=false;}
  }
  document.addEventListener('click',e=>{
    const button=e.target.closest?.('#admin-save');
    if(!button)return;
    const page=$('#editor-page');
    if(!page?.dataset.suggestionId)return;
    e.preventDefault();e.stopImmediatePropagation();save();
  },true);
  window.saveSuggestionEditorReliable=save;
})();
