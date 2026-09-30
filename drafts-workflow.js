/* Server-side saved drafts. */
(function(){
  'use strict';
  const TABLE='news_drafts';
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  function sb(){return typeof state!=='undefined'&&state.supabase?state.supabase:null;}
  function currentUser(){return typeof state!=='undefined'?state.user:null;}

  async function imageToDataUrl(file){
    if(!file)return '';
    return await new Promise((resolve,reject)=>{
      const objectUrl=URL.createObjectURL(file);
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
        finally{URL.revokeObjectURL(objectUrl)}
      };
      img.onerror=()=>{URL.revokeObjectURL(objectUrl);reject(new Error('Не удалось подготовить изображение.'));};
      img.src=objectUrl;
    });
  }

  async function resolveImage(file,msg){
    if(!file)return '';
    const client=sb(),u=currentUser();
    if(!client||!u)return '';
    try{
      if(msg)msg.textContent='Загружаем обложку…';
      const safe=String(file.name||'draft-cover').replace(/[^a-zA-Z0-9._-]/g,'_');
      const path='drafts/'+u.id+'/'+Date.now()+'-'+safe;
      const result=await client.storage.from('news-images').upload(path,file,{upsert:false,contentType:file.type||'image/webp',cacheControl:'3600'});
      if(result.error)throw result.error;
      return client.storage.from('news-images').getPublicUrl(path).data.publicUrl||'';
    }catch(error){
      console.warn('Draft cover upload failed, storing a compressed image in Supabase:',error);
      if(msg)msg.textContent='Хранилище изображения недоступно, сохраняем сжатую обложку в черновике…';
      return await imageToDataUrl(file);
    }
  }

  function ensureSection(){
    let section=$('#section-saved-drafts');
    if(section)return section;
    const main=$('#main');
    if(!main)return null;
    section=document.createElement('section');
    section.id='section-saved-drafts';
    section.className='page-section';
    section.setAttribute('aria-labelledby','saved-drafts-heading');
    main.appendChild(section);
    return section;
  }

  async function fetchDrafts(){
    const client=sb(),u=currentUser();
    if(!client||!u)return [];
    const result=await client.from(TABLE)
      .select('id,owner_id,kind,title,category,summary,body,image_url,author_id,palette,created_at,updated_at')
      .eq('owner_id',u.id)
      .order('updated_at',{ascending:false});
    if(result.error)throw result.error;
    return result.data||[];
  }

  async function saveCurrentDraft(){
    const client=sb(),u=currentUser(),page=$('#editor-page');
    if(!page||!client||!u){window.showToast?.('Войдите в аккаунт, чтобы сохранять черновики.');return;}
    const msg=$('#admin-message');
    if(msg)msg.textContent='';
    try{
      const title=$('#news-title-input')?.value.trim()||'';
      const category=$('#news-category-input')?.value||'Политика';
      const summary=$('#news-summary-input')?.value.trim()||'';
      const body=$('#news-body-input')?.value||'';
      let image=$('#news-image-input')?.value.trim()||'';
      const file=$('#editor-image-file')?.files?.[0]||state.editor?.pendingCoverFile||null;
      if(file){
        const resolved=await resolveImage(file,msg);
        if(resolved)image=resolved;
      }

      const id=state.editor?.draftId||page.dataset.savedDraftId||null;
      const payload={
        owner_id:u.id,
        kind:state.editor?.suggestionMode?'suggestion':'news',
        title,category,summary,body,image_url:image,
        author_id:$('#news-author-input')?.value||state.editor?.authorId||u.id,
        palette:state.editor?.generatedPalette||null
      };

      if(msg)msg.textContent='Сохраняем черновик…';

      let result;
      if(id){
        result=await client.from(TABLE).update(payload).eq('id',id).eq('owner_id',u.id).select('id,updated_at').maybeSingle();
      }else{
        result=await client.from(TABLE).insert(payload).select('id,updated_at').single();
      }

      if(result.error)throw result.error;
      if(!result.data)throw new Error('Черновик не был сохранён. Проверьте таблицу news_drafts в Supabase.');

      state.editor.draftId=result.data.id;
      page.dataset.savedDraftId=result.data.id;
      window.showToast?.('Черновик сохранён');
      if(msg)msg.textContent='';
    }catch(error){
      console.error('Server draft save failed:',error);
      const missing=/news_drafts|relation .* does not exist|Could not find the table/i.test(error?.message||'');
      const message=missing
        ?'Таблица news_drafts ещё не создана в Supabase. Выполните supabase-news-drafts.sql.'
        :(error?.message||'Не удалось сохранить черновик.');
      if(msg)msg.textContent=message;
      window.showToast?.(message);
    }
  }

  async function deleteDraft(id){
    const client=sb(),u=currentUser();
    if(!client||!u||!id)return;
    const result=await client.from(TABLE).delete().eq('id',id).eq('owner_id',u.id);
    if(result.error)throw result.error;
  }

  function ensureStyles(){
    if($('#saved-drafts-style'))return;
    const style=document.createElement('style');
    style.id='saved-drafts-style';
    style.textContent='.saved-drafts-page{width:100%;box-sizing:border-box}.saved-drafts-list{display:grid;gap:12px;width:100%;min-width:0}.saved-draft-card{width:100%;box-sizing:border-box;min-width:0;overflow:hidden;border:1px solid var(--md-sys-color-outline-variant);border-radius:20px;background:var(--md-sys-color-surface-container);padding:16px}.saved-draft-title{font-weight:700;overflow-wrap:anywhere}.saved-draft-meta{margin-top:6px;display:flex;flex-wrap:wrap;gap:6px 12px;color:var(--md-sys-color-on-surface-variant);font-size:13px}.saved-draft-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}@media(max-width:860px){.saved-draft-actions{flex-direction:column}.saved-draft-actions button{width:100%}}';
    document.head.appendChild(style);
  }

  async function renderPage(){
    const section=ensureSection();
    if(!section)return;
    ensureStyles();
    section.innerHTML='<div class="saved-drafts-page"><div class="profile-management-page-head"><button type="button" class="icon-button" id="saved-drafts-back" aria-label="Вернуться в профиль"><span class="material-symbols-rounded">arrow_back</span></button><h2 id="saved-drafts-heading">Сохранённые черновики</h2></div><div class="saved-drafts-list" id="saved-drafts-list"><div class="media-note">Загрузка черновиков…</div></div></div>';
    $('#saved-drafts-back',section).onclick=()=>window.openSection?.('profile');
    try{
      const drafts=(await fetchDrafts()).filter(d=>!currentUser()||d.owner_id===currentUser().id);
      const list=$('#saved-drafts-list',section);
      if(!drafts.length){
        list.innerHTML='<div class="media-note">Сохранённых черновиков пока нет.</div>';
        return;
      }
      list.innerHTML=drafts.map(d=>'<article class="saved-draft-card"><div class="saved-draft-title">'+esc(d.title||'Без названия')+'</div><div class="saved-draft-meta"><span>'+(d.kind==='suggestion'?'Предложение':'Новость')+'</span><span>'+esc(d.category||'')+'</span><span>'+esc(new Date(d.updated_at||d.created_at).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}))+'</span></div><div class="saved-draft-actions"><button type="button" class="tonal-button" data-open-draft="'+esc(d.id)+'"><span class="material-symbols-rounded">edit</span>Продолжить редактирование</button><button type="button" class="text-button" data-delete-draft="'+esc(d.id)+'"><span class="material-symbols-rounded">delete</span>Удалить</button></div></article>').join('');
      list.querySelectorAll('[data-open-draft]').forEach(b=>b.onclick=()=>openDraft(b.dataset.openDraft));
      list.querySelectorAll('[data-delete-draft]').forEach(b=>b.onclick=async()=>{
        try{await deleteDraft(b.dataset.deleteDraft);await renderPage();window.showToast?.('Черновик удалён');}
        catch(error){window.showToast?.(error?.message||'Не удалось удалить черновик.');}
      });
    }catch(error){
      console.error('Server draft load failed:',error);
      const missing=/news_drafts|relation .* does not exist|Could not find the table/i.test(error?.message||'');
      const message=missing
        ?'Таблица news_drafts ещё не создана в Supabase. Выполните supabase-news-drafts.sql.'
        :(error?.message||'Не удалось загрузить черновики.');
      $('#saved-drafts-list',section).innerHTML='<div class="media-note">'+esc(message)+'</div>';
    }
  }

  async function openDraft(id){
    const drafts=await fetchDrafts();
    const draft=drafts.find(d=>String(d.id)===String(id));
    if(!draft||!state?.user)return;

    if(draft.kind==='suggestion'&&!state.admin)window.openEditor?.(null,'suggest');
    else window.openEditor?.(null);

    await sleep(100);
    const page=$('#editor-page');
    if(!page)return;

    state.editor.draftId=draft.id;
    state.editor.authorId=draft.author_id||state.user.id;
    page.dataset.savedDraftId=draft.id;

    const set=(selector,value)=>{
      const el=$(selector);
      if(el)el.value=value??'';
    };
    set('#news-title-input',draft.title);
    set('#news-category-input',draft.category||'Политика');
    set('#news-summary-input',draft.summary);
    set('#news-body-input',draft.body);
    set('#news-image-input',draft.image_url||'');

    if(typeof window.syncEditorSelect==='function')window.syncEditorSelect('news-category-input');
    if(typeof window.syncEditorSelect==='function')window.syncEditorSelect('news-author-input');
    $('#news-body-input')?.dispatchEvent(new Event('input',{bubbles:true}));
    state.editor.generatedPalette=draft.palette||null;
    if(draft.image_url)updateEditorCoverPreview();
    window.showToast?.('Черновик открыт');
  }

  function ensureManagementBox(side){
    let box=side?.querySelector('.profile-management-links');
    if(box)return box;
    if(!side)return null;
    box=document.createElement('div');
    box.className='profile-management-links';
    side.appendChild(box);
    return box;
  }

  function injectProfileButton(){
    const root=$('#profile-card');
    const side=$('.profile-side',root);
    if(!side||!state?.user)return;
    const box=ensureManagementBox(side);
    if(!box||box.querySelector('[data-saved-drafts]'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='profile-management-link';
    button.dataset.savedDrafts='1';
    button.innerHTML='<span class="profile-management-link-main"><span class="material-symbols-rounded">draft</span><span><span class="profile-management-link-title">Сохранённые черновики</span><span class="profile-management-link-note">Материалы, сохранённые в вашем аккаунте</span></span></span><span class="material-symbols-rounded">chevron_right</span>';
    button.onclick=()=>{ensureSection();window.openSection?.('saved-drafts');renderPage();};
    box.prepend(button);
  }

  function install(){
    if(document.documentElement.dataset.serverDraftsWorkflow==='1')return;
    document.documentElement.dataset.serverDraftsWorkflow='1';
    ensureStyles();
    document.addEventListener('click',event=>{
      const button=event.target.closest?.('#editor-save-draft');
      if(!button)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      saveCurrentDraft();
    },true);
    const observer=new MutationObserver(()=>{
      if(typeof state!=='undefined'&&state.section==='profile')injectProfileButton();
    });
    const profileRoot=$('#profile-card');
    if(profileRoot)observer.observe(profileRoot,{childList:true,subtree:true});
    setTimeout(injectProfileButton,100);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();

  window.removeSavedDraft=async id=>{
    try{await deleteDraft(id);}
    catch(error){console.warn('removeSavedDraft failed:',error);}
  };
})();