/* Reliable save bridge for the suggestion editor. */
(function(){
  'use strict';
  let busy=false;
  const $=(s,r=document)=>r.querySelector(s);

  const resetEditor=()=>{
    state.editor={
      id:null,mode:'edit',originalImageUrl:null,generatedPalette:null,
      imageObjectUrl:null,pendingCoverFile:null,authorId:null,
      suggestionMode:false,submissionId:null
    };
  };

  function rememberCoverFile(){
    const page=$('#editor-page');
    const isSuggestion=!!(page?.dataset.suggestionId ||
      (typeof state!=='undefined'&&state.editor?.suggestionMode));
    if(!isSuggestion||typeof state==='undefined')return;
    const input=$('#editor-image-file');
    const file=input?.files?.[0];
    if(file)state.editor.pendingCoverFile=file;
  }

  function readCategory(){
    const input=$('#news-category-input');
    const control=input?.closest('.editor-select-control');
    const selected=control?.querySelector('.editor-select-option.is-selected');
    const value=String(input?.value||'').trim();
    return value||String(selected?.dataset.value||selected?.textContent||'Политика').trim()||'Политика';
  }

  function imageFileToDataUrl(file){
    return new Promise((resolve,reject)=>{
      if(!file){resolve(null);return;}
      const url=URL.createObjectURL(file);
      const img=new Image();
      img.onload=()=>{
        try{
          const max=1600;
          const scale=Math.min(1,max/Math.max(img.naturalWidth||1,img.naturalHeight||1));
          const canvas=document.createElement('canvas');
          canvas.width=Math.max(1,Math.round((img.naturalWidth||1)*scale));
          canvas.height=Math.max(1,Math.round((img.naturalHeight||1)*scale));
          const ctx=canvas.getContext('2d');
          if(!ctx)throw new Error('Canvas недоступен.');
          ctx.drawImage(img,0,0,canvas.width,canvas.height);
          resolve(canvas.toDataURL('image/webp',.82));
        }catch(error){reject(error)}
        finally{URL.revokeObjectURL(url)}
      };
      img.onerror=()=>{
        URL.revokeObjectURL(url);
        reject(new Error('Не удалось подготовить обложку.'));
      };
      img.src=url;
    });
  }

  async function resolveCoverImage(file,msg){
    if(!file)return null;
    try{
      if(msg)msg.textContent='Загружаем обложку…';
      return await uploadNewsImage(file,'suggestion');
    }catch(uploadError){
      console.warn('Suggestion image upload failed, using inline fallback:',uploadError);
      if(msg)msg.textContent='Хранилище изображения недоступно, сохраняем обложку внутри предложения…';
      return await imageFileToDataUrl(file);
    }
  }

  async function save(){
    if(busy)return;
    const page=$('#editor-page');
    const id=page?.dataset.suggestionId;
    const mode=page?.dataset.suggestionMode;
    const isNewSuggestion=!id&&typeof state!=='undefined'&&state.editor?.suggestionMode;
    if(!isNewSuggestion&&(!id||!mode))return;
    if(!state.supabase||!state.user){
      showToast?.('Не удалось сохранить: аккаунт или Supabase недоступен.');
      return;
    }

    busy=true;
    const msg=$('#admin-message');
    if(msg)msg.textContent='';

    try{
      rememberCoverFile();

      const title=$('#news-title-input')?.value.trim()||'';
      const category=readCategory();
      const categoryInput=$('#news-category-input');
      if(categoryInput){
        categoryInput.value=category;
        if(typeof window.syncEditorSelect==='function')window.syncEditorSelect('news-category-input');
      }

      const summary=$('#news-summary-input')?.value.trim()||'';
      const body=$('#news-body-input')?.value.trim()||'';
      let image=$('#news-image-input')?.value.trim()||'';

      if(!title||!body)throw new Error('Заполните заголовок и текст новости.');

      const pendingCoverFile=
        state.editor.pendingCoverFile||
        $('#editor-image-file')?.files?.[0]||
        null;

      if(pendingCoverFile){
        const resolved=await resolveCoverImage(pendingCoverFile,msg);
        if(resolved){
          image=resolved;
          const imageInput=$('#news-image-input');
          if(imageInput)imageInput.value=image;
        }
      }

      if(!image)image=extractFirstImageFromMarkdown(body)||'';
      if(!image)throw new Error('Добавьте изображение новости.');

      if(msg)msg.textContent='Генерируем палитру…';
      const palette=state.editor.generatedPalette?.generator===M3_IMAGE_PALETTE_GENERATOR
        ?state.editor.generatedPalette
        :await generateM3ContentPaletteFromImage(image);
      state.editor.generatedPalette=palette;

      const effectiveSummary=
        summary||
        body.replace(/^#{1,6}\s+/gm,'')
          .replace(/[*_#>-]/g,'')
          .replace(/\x60/g,'')
          .split(/\n\s*\n/)
          .find(Boolean)?.trim()
          .slice(0,360)||'';

      if(isNewSuggestion){
        if(msg)msg.textContent='Отправляем предложение на проверку…';

        const payload={
          category,
          title,
          summary:effectiveSummary,
          body,
          image_url:image,
          author_id:state.user.id,
          palette,
          status:'pending'
        };

        const inserted=await state.supabase
          .from('news_submissions')
          .insert(payload)
          .select('id,category,title,image_url,status,created_at')
          .single();

        if(inserted.error)throw inserted.error;
        if(!inserted.data)throw new Error('Предложение не вернулось после сохранения.');

        state.editor.pendingCoverFile=null;
        try{localStorage.removeItem('news-editor-draft-new');}catch(_){}
        window.removeSavedDraft?.(state.editor.draftId);
        showToast?.('Предложение отправлено редактору');
        resetEditor();
        window.openSection?.('profile');
        return;
      }

      const payload=mode==='published-edit'||mode==='admin-review-update'
        ?{
            pending_category:category,
            pending_title:title,
            pending_summary:effectiveSummary,
            pending_body:body,
            pending_image_url:image,
            pending_palette:palette,
            status:'pending_update',
            updated_at:new Date().toISOString()
          }
        :{
            category,
            title,
            summary:effectiveSummary,
            body,
            image_url:image,
            palette,
            status:'pending',
            updated_at:new Date().toISOString()
          };

      let query=state.supabase.from('news_submissions').update(payload).eq('id',id);
      if(mode==='published-edit'){
        query=query.eq('author_id',state.user.id);
      }else if(mode!=='admin-review'&&mode!=='admin-review-update'){
        query=query.eq('author_id',state.user.id).in('status',['pending','rejected']);
      }

      const result=await query.select('id,updated_at,status,category,image_url').maybeSingle();
      if(result.error)throw result.error;
      if(!result.data)throw new Error('Supabase не сохранил изменения. Проверьте права доступа к этому предложению.');

      state.editor.pendingCoverFile=null;
      try{localStorage.removeItem('news-editor-draft-'+id);}catch(_){}
      showToast?.(mode==='published-edit'?'Изменения отправлены администратору':'Предложение сохранено');
      resetEditor();
      window.openSection?.('profile');
      setTimeout(()=>window.openSection?.('profile-management'),0);
    }catch(error){
      console.error('Suggestion save failed:',error);
      if(msg)msg.textContent=error?.message||'Не удалось сохранить изменения.';
      else showToast?.(error?.message||'Не удалось сохранить изменения.');
    }finally{
      busy=false;
    }
  }

  document.addEventListener('change',e=>{
    if(e.target?.matches?.('#editor-page input[type="file"]'))rememberCoverFile();
  },true);

  document.addEventListener('click',e=>{
    const button=e.target.closest?.('#admin-save');
    if(!button)return;
    const page=$('#editor-page');
    const isSuggestion=typeof state!=='undefined'&&state.editor?.suggestionMode;
    if(!page?.dataset.suggestionId&&!isSuggestion)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    save();
  },true);

  window.saveSuggestionEditorReliable=save;
})();
