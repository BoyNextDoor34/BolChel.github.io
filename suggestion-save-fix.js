/* Reliable save bridge for the suggestion editor. */
(function(){
  'use strict';
  let busy=false;
  const $=(s,r=document)=>r.querySelector(s);
  const resetEditor=()=>{ state.editor={id:null,mode:'edit',originalImageUrl:null,generatedPalette:null,imageObjectUrl:null,pendingCoverFile:null,authorId:null,suggestionMode:false,submissionId:null}; };

  function rememberCoverFile(){
    const page=$('#editor-page');
    if(!page?.dataset.suggestionId || typeof state==='undefined') return;
    const input=$('#editor-page input[type="file"]');
    const file=input?.files?.[0];
    if(file) state.editor.pendingCoverFile=file;
  }

  async function save(){
    if(busy)return;
    const page=$('#editor-page'),id=page?.dataset.suggestionId,mode=page?.dataset.suggestionMode;
    if(!id||!mode)return;
    if(!state.supabase||!state.user){showToast?.('Не удалось сохранить: аккаунт или Supabase недоступен.');return;}
    busy=true;
    const msg=$('#admin-message');
    if(msg)msg.textContent='';
    try{
      rememberCoverFile();
      const title=$('#news-title-input')?.value.trim()||'';
      const category=$('#news-category-input')?.value||'Политика';
      const summary=$('#news-summary-input')?.value.trim()||'';
      const body=$('#news-body-input')?.value.trim()||'';
      let image=$('#news-image-input')?.value.trim()||'';
      if(!title||!body)throw new Error('Заполните заголовок и текст новости.');

      if(state.editor.pendingCoverFile){
        if(msg)msg.textContent='Загружаем обложку…';
        image=await uploadNewsImage(state.editor.pendingCoverFile,'suggestion');
        const imageInput=$('#news-image-input');
        if(imageInput)imageInput.value=image;
        state.editor.pendingCoverFile=null;
      }
      if(!image)image=extractFirstImageFromMarkdown(body)||'';
      if(!image)throw new Error('Добавьте изображение новости.');

      if(msg)msg.textContent='Генерируем палитру…';
      const palette=state.editor.generatedPalette?.generator===M3_IMAGE_PALETTE_GENERATOR
        ?state.editor.generatedPalette
        :await generateM3ContentPaletteFromImage(image);
      state.editor.generatedPalette=palette;

      const effectiveSummary=summary||body.replace(/^#{1,6}\s+/gm,'').replace(/[*_`>#-]/g,'').split(/\n\s*\n/).find(Boolean)?.trim().slice(0,360)||'';
      const payload=mode==='published-edit'||mode==='admin-review-update'
        ?{pending_category:category,pending_title:title,pending_summary:effectiveSummary,pending_body:body,pending_image_url:image,pending_palette:palette,status:'pending_update',updated_at:new Date().toISOString()}
        :{category,title,summary:effectiveSummary,body,image_url:image,palette,status:'pending',updated_at:new Date().toISOString()};

      let query=state.supabase.from('news_submissions').update(payload).eq('id',id);
      if(mode==='published-edit')query=query.eq('author_id',state.user.id);
      else if(mode!=='admin-review'&&mode!=='admin-review-update')query=query.eq('author_id',state.user.id).in('status',['pending','rejected']);

      // Request the changed row back. This avoids treating a null count as a
      // successful save and gives us a definitive result under Supabase RLS.
      const result=await query.select('id,updated_at,status').maybeSingle();
      if(result.error)throw result.error;
      if(!result.data)throw new Error('Supabase не сохранил изменения. Проверьте права доступа к этому предложению.');

      try{localStorage.removeItem(`news-editor-draft-${id}`);}catch(_){ }
      showToast?.(mode==='published-edit'?'Изменения отправлены администратору':'Предложение сохранено');
      resetEditor();
      window.openSection?.('profile');
      setTimeout(()=>window.openSection?.('profile-management'),0);
    }catch(error){
      console.error('Suggestion save failed:',error);
      if(msg)msg.textContent=error?.message||'Не удалось сохранить изменения.';
      else showToast?.(error?.message||'Не удалось сохранить изменения.');
    }finally{busy=false;}
  }

  document.addEventListener('change',e=>{
    if(e.target?.matches?.('#editor-page input[type="file"]')) rememberCoverFile();
  },true);

  document.addEventListener('click',e=>{
    const button=e.target.closest?.('#admin-save');
    if(!button)return;
    const page=$('#editor-page');
    if(!page?.dataset.suggestionId)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    save();
  },true);

  window.saveSuggestionEditorReliable=save;
})();
