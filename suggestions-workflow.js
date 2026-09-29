/* Enhanced reader suggestion workflow. Extends the existing application without replacing its core news/editor code. */
(function(){
  'use strict';
  let client=null, currentUser=null, currentProfile=null, installed=false, authorCache={};
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const $=(s,r=document)=>r.querySelector(s);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  function ensureStyles(){
    if($('#suggestions-v2-style')) return;
    const style=document.createElement('style');
    style.id='suggestions-v2-style';
    style.textContent=`
      .profile-side{min-width:0;overflow:hidden}
      .admin-suggestions,.reader-suggestions{width:100%;max-width:100%;min-width:0;box-sizing:border-box;overflow:hidden}
      .admin-suggestions-list,.reader-suggestions-list{width:100%;max-width:100%;min-width:0;box-sizing:border-box}
      .admin-suggestion-row,.reader-suggestion-row{width:100%;max-width:100%;min-width:0;box-sizing:border-box;overflow:hidden}
      .admin-suggestion-row .admin-news-main,.reader-suggestion-row .admin-news-main{min-width:0;max-width:100%;overflow:hidden}
      .admin-suggestion-row .admin-news-main strong,.reader-suggestion-row .admin-news-main strong{display:block;min-width:0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .admin-suggestion-actions,.reader-suggestion-actions{max-width:100%;min-width:0;box-sizing:border-box;flex-wrap:wrap}
      .suggestion-edit-button{flex:0 0 auto}
      .suggestion-status{font-size:12px;color:var(--md-sys-color-on-surface-variant);margin-top:3px}
      .suggestion-status.pending{color:var(--md-sys-color-primary)}
      .suggestion-status.rejected{color:var(--md-sys-color-error)}
      .suggestion-status.approved{color:var(--md-sys-color-on-surface-variant)}
      @media(max-width:860px){
        .admin-suggestion-row,.reader-suggestion-row{flex-direction:column}
        .admin-suggestion-actions,.reader-suggestion-actions{width:100%;justify-content:flex-start}
        .admin-suggestion-actions button,.reader-suggestion-actions button{max-width:100%}
      }
    `;
    document.head.appendChild(style);
  }

  async function getClient(){
    if(client) return client;
    if(!window.supabase?.createClient || !window.SUPABASE_CONFIG?.url || !window.SUPABASE_CONFIG?.anonKey) return null;
    client=window.supabase.createClient(window.SUPABASE_CONFIG.url,window.SUPABASE_CONFIG.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    return client;
  }

  async function refreshIdentity(){
    const sb=await getClient();
    if(!sb) return null;
    const {data:{session}}=await sb.auth.getSession();
    currentUser=session?.user||null;
    currentProfile=null;
    if(currentUser){
      const {data}=await sb.from('profiles').select('*').eq('id',currentUser.id).maybeSingle();
      currentProfile=data||{id:currentUser.id,nickname:currentUser.email?.split('@')[0]||'Пользователь',role:'reader'};
    }
    return currentUser;
  }

  function isAdmin(){return currentProfile?.role==='admin';}
  function statusText(s){return s==='pending'?'Ожидает проверки':s==='pending_update'?'Изменения ожидают проверки':s==='approved'?'Опубликована':s==='rejected'?'Отклонена':s;}

  async function fetchOwn(){
    const sb=await getClient(); if(!sb||!currentUser)return [];
    const {data,error}=await sb.from('news_submissions').select('*').eq('author_id',currentUser.id).order('created_at',{ascending:false});
    if(error){console.warn('Suggestions own load failed',error);return [];} return data||[];
  }

  async function fetchPending(){
    const sb=await getClient(); if(!sb||!isAdmin())return [];
    const {data,error}=await sb.from('news_submissions').select('*').in('status',['pending','pending_update']).order('created_at',{ascending:false});
    if(error){console.warn('Suggestions admin load failed',error);return [];}
    const ids=[...new Set((data||[]).map(x=>x.author_id).filter(Boolean))];
    if(ids.length){
      const p=await sb.from('profiles').select('id,nickname').in('id',ids);
      (p.data||[]).forEach(x=>authorCache[x.id]=x.nickname||'Пользователь');
    }
    return data||[];
  }

  function fillEditor(item,mode){
    const page=$('#editor-page'); if(!page)return;
    page.dataset.suggestionId=String(item.id);
    page.dataset.suggestionMode=mode;
    page.dataset.suggestionNewsId=item.news_id||'';
    const usePending=mode==='published-edit'||mode==='admin-review-update';
    const source=usePending&&item.pending_title?{title:item.pending_title,category:item.pending_category,summary:item.pending_summary,body:item.pending_body,image:item.pending_image_url,palette:item.pending_palette}:{title:item.title,category:item.category,summary:item.summary,body:item.body,image:item.image_url,palette:item.palette};
    $('#news-title-input').value=source.title||'';
    $('#news-category-input').value=source.category||'Политика';
    $('#news-summary-input').value=source.summary||'';
    $('#news-body-input').value=source.body||'';
    $('#news-image-input').value=source.image||'';
    const button=$('#admin-save');
    if(button){const label=button.querySelector('span:last-child');if(label)label.textContent=mode==='published-edit'?'Отправить на проверку':'Сохранить изменения';}
    setTimeout(()=>{
      $('#news-category-input')?.dispatchEvent(new Event('change',{bubbles:true}));
      $('#news-body-input')?.dispatchEvent(new Event('input',{bubbles:true}));
      $('#news-image-input')?.dispatchEvent(new Event('input',{bubbles:true}));
      if(source.palette&&typeof source.palette==='object'&&window.renderPaletteSwatches)window.renderPaletteSwatches(source.palette);
    },30);
    attachEditorSave();
    if(isAdmin()&&(mode==='admin-review'||mode==='admin-review-update'))addAdminPublishButton(item);
  }

  async function openSuggestionEditor(item,mode){
    if(typeof window.openEditor!=='function')return;
    window.openEditor(null,'suggest');
    await sleep(100);
    fillEditor(item,mode);
  }

  async function saveSuggestionFromEditor(){
    const sb=await getClient(); if(!sb||!currentUser)return;
    const page=$('#editor-page'); const id=page?.dataset.suggestionId; const mode=page?.dataset.suggestionMode;
    if(!id){if(typeof window.saveNewsSuggestion==='function')return window.saveNewsSuggestion();return;}
    const title=$('#news-title-input')?.value.trim()||'';
    const category=$('#news-category-input')?.value||'Политика';
    const summary=$('#news-summary-input')?.value.trim()||'';
    const body=$('#news-body-input')?.value.trim()||'';
    let image=$('#news-image-input')?.value.trim()||'';
    try{
      if(!image&&typeof state!=='undefined'&&state.editor?.pendingCoverFile&&typeof window.uploadNewsImage==='function'){
        image=await window.uploadNewsImage(state.editor.pendingCoverFile,'suggestion');
        const input=$('#news-image-input');if(input)input.value=image;
      }
      if(!title||!body||!image){$('#admin-message').textContent='Заполните заголовок, текст и изображение.';return;}
      const palette=(typeof state!=='undefined'&&state.editor?.generatedPalette)||null;
      const values={category,title,summary,body,image_url:image,palette};
      let r;
      if(mode==='published-edit'){
        r=await sb.from('news_submissions').update({pending_category:values.category,pending_title:values.title,pending_summary:values.summary,pending_body:values.body,pending_image_url:values.image_url,pending_palette:values.palette,status:'pending_update',updated_at:new Date().toISOString()}).eq('id',id).eq('author_id',currentUser.id);
      }else{
        r=await sb.from('news_submissions').update({category:values.category,title:values.title,summary:values.summary,body:values.body,image_url:values.image_url,palette:values.palette,status:'pending',updated_at:new Date().toISOString()}).eq('id',id);
      }
      if(r.error)throw r.error;
      if(window.showToast)window.showToast(mode==='published-edit'?'Изменения отправлены администратору':'Предложение сохранено');
      if(window.openSection)window.openSection('profile');
      await refreshIdentity();renderPanels();
    }catch(e){$('#admin-message').textContent=e.message||'Не удалось сохранить предложение.';}
  }

  function attachEditorSave(){const b=$('#admin-save');if(b)b.onclick=saveSuggestionFromEditor;}

  function addAdminPublishButton(item){
    const actions=$('.editor-actions');if(!actions||$('#admin-publish-suggestion'))return;
    const b=document.createElement('button');b.id='admin-publish-suggestion';b.className='tonal-button';b.type='button';b.innerHTML='<span class="material-symbols-rounded">publish</span><span>Опубликовать</span>';b.onclick=()=>publishSuggestion(item.id);actions.insertBefore(b,actions.lastElementChild);
  }

  async function publishSuggestion(id){
    const sb=await getClient();if(!sb||!isAdmin())return;
    const {data:item,error}=await sb.from('news_submissions').select('*').eq('id',id).single();
    if(error||!item)return;
    if(!confirm('Опубликовать эту версию новости?'))return;
    try{
      const updateMode=item.status==='pending_update'&&item.news_id;
      const src=updateMode?{category:item.pending_category,title:item.pending_title,summary:item.pending_summary,body:item.pending_body,image_url:item.pending_image_url,palette:item.pending_palette}:{category:item.category,title:item.title,summary:item.summary,body:item.body,image_url:item.image_url,palette:item.palette};
      let palette=src.palette;if(typeof palette==='string'){try{palette=JSON.parse(palette)}catch(_){palette=null}}
      const payload={category:src.category,title:src.title,summary:src.summary||'',body:src.body||'',image_url:src.image_url||'',author_id:item.author_id,accent_hex:palette?.light?.primary||null,palette};
      let newsId=item.news_id;
      if(updateMode){const r=await sb.from('news').update(payload).eq('id',newsId);if(r.error)throw r.error;}else{const r=await sb.from('news').insert(payload).select('id').single();if(r.error)throw r.error;newsId=r.data.id;}
      const r2=await sb.from('news_submissions').update({status:'approved',news_id:newsId,reviewed_at:new Date().toISOString(),reviewed_by:currentUser.id,pending_category:null,pending_title:null,pending_summary:null,pending_body:null,pending_image_url:null,pending_palette:null,updated_at:new Date().toISOString()}).eq('id',id);if(r2.error)throw r2.error;
      if(window.loadRemoteNews)await window.loadRemoteNews();
      if(window.showToast)window.showToast(updateMode?'Изменения опубликованы':'Предложение опубликовано');
      if(window.openSection)window.openSection('profile');
      await refreshIdentity();renderPanels();
    }catch(e){if(window.showToast)window.showToast(e.message||'Не удалось опубликовать.');}
  }

  async function rejectSuggestion(id){
    const sb=await getClient();if(!sb||!isAdmin())return;
    const r=await sb.from('news_submissions').update({status:'rejected',reviewed_at:new Date().toISOString(),reviewed_by:currentUser.id,pending_category:null,pending_title:null,pending_summary:null,pending_body:null,pending_image_url:null,pending_palette:null,updated_at:new Date().toISOString()}).eq('id',id);
    if(r.error){if(window.showToast)window.showToast(r.error.message);return;}if(window.showToast)window.showToast('Предложение отклонено');renderPanels();
  }

  async function renderPanels(){
    await refreshIdentity();
    const root=$('#profile-card');if(!root||!currentUser)return;
    ensureStyles();
    root.querySelectorAll('.admin-suggestions').forEach(x=>x.remove());
    root.querySelectorAll('.reader-suggestions').forEach(x=>x.remove());
    const side=$('.profile-side',root);if(!side)return;
    if(isAdmin()){
      const items=await fetchPending();
      const box=document.createElement('section');box.className='admin-suggestions admin-suggestions-v2';
      box.innerHTML='<div class="nav-divider"></div><div class="admin-suggestions-heading"><h3>Предложенные новости</h3><span class="suggestion-count">'+items.length+'</span></div><div class="admin-suggestions-list"></div>';
      const list=$('.admin-suggestions-list',box);
      list.innerHTML=items.length?items.map(s=>{const pending=s.status==='pending_update';return '<div class="admin-suggestion-row"><div class="admin-news-main"><strong>'+esc(pending?s.pending_title:s.title)+'</strong><span>'+esc(pending?s.pending_category:s.category)+' · '+esc(new Date(s.created_at).toLocaleDateString('ru-RU'))+'</span><span class="suggestion-author">Автор: '+esc(authorCache[s.author_id]||'Пользователь')+'</span><span class="suggestion-status pending">'+esc(statusText(s.status))+'</span></div><div class="admin-suggestion-actions"><button class="tonal-button suggestion-edit-button" data-review="'+esc(s.id)+'" type="button"><span class="material-symbols-rounded">edit</span>Просмотреть и изменить</button><button class="filled-button" data-publish="'+esc(s.id)+'" type="button"><span class="material-symbols-rounded">publish</span>Опубликовать</button><button class="text-button" data-reject="'+esc(s.id)+'" type="button">Отклонить</button></div></div>';}).join(''):'<div class="media-note">Новых предложений и изменений на проверке нет.</div>';
      list.querySelectorAll('[data-review]').forEach(b=>b.onclick=async()=>{const a=items.find(x=>String(x.id)===String(b.dataset.review));if(a)await openSuggestionEditor(a,a.status==='pending_update'?'admin-review-update':'admin-review');});
      list.querySelectorAll('[data-publish]').forEach(b=>b.onclick=()=>publishSuggestion(b.dataset.publish));
      list.querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>rejectSuggestion(b.dataset.reject));
      side.appendChild(box);
    }else{
      const items=await fetchOwn();
      const box=document.createElement('section');box.className='reader-suggestions surface-card';
      box.innerHTML='<div class="admin-suggestions-heading"><h3>Предложенные новости</h3><span class="suggestion-count">'+items.length+'</span></div><div class="reader-suggestions-list"></div>';
      const list=$('.reader-suggestions-list',box);
      list.innerHTML=items.length?items.map(s=>{const pending=s.status==='pending_update';const title=pending?s.pending_title:s.title;const cat=pending?s.pending_category:s.category;const editable=s.status==='pending'||s.status==='approved'||s.status==='pending_update';return '<div class="reader-suggestion-row admin-suggestion-row"><div class="admin-news-main"><strong>'+esc(title)+'</strong><span>'+esc(cat)+' · '+esc(new Date(s.created_at).toLocaleDateString('ru-RU'))+'</span><span class="suggestion-status '+esc(s.status)+'">'+esc(statusText(s.status))+'</span></div><div class="reader-suggestion-actions admin-suggestion-actions">'+(editable?'<button class="tonal-button suggestion-edit-button" data-user-edit="'+esc(s.id)+'" type="button"><span class="material-symbols-rounded">edit</span>Редактировать</button>':'')+'</div></div>';}).join(''):'<div class="media-note">Вы ещё не предлагали новости.</div>';
      list.querySelectorAll('[data-user-edit]').forEach(b=>b.onclick=async()=>{const a=items.find(x=>String(x.id)===String(b.dataset.userEdit));if(a)await openSuggestionEditor(a,a.status==='approved'?'published-edit':'pending-edit');});
      side.appendChild(box);
    }
  }

  function install(){
    if(installed)return;installed=true;ensureStyles();
    const original=window.renderProfile;
    if(typeof original==='function')window.renderProfile=function(){const result=original.apply(this,arguments);setTimeout(renderPanels,80);return result;};
    const observer=new MutationObserver(()=>{const page=$('#editor-page');if(page?.dataset.suggestionId&&$('#admin-save'))attachEditorSave();});
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(renderPanels,500);
  }

  async function boot(){for(let i=0;i<100;i++){if(window.supabase?.createClient&&typeof window.renderProfile==='function')break;await sleep(200);}install();}
  boot();
})();
