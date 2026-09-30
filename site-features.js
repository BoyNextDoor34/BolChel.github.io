/* Material 3 themed confirmation dialogs for destructive / publishing actions. */
(function(){
  'use strict';

  let bypassNextClick=false;
  let activeResolve=null;
  let nativeConfirmBypassTimer=null;

  function ensureStyles(){
    if(document.getElementById('site-confirm-dialog-style')) return;
    const style=document.createElement('style');
    style.id='site-confirm-dialog-style';
    style.textContent=`
      .site-confirm-dialog{width:min(460px,calc(100vw - 32px));max-width:calc(100vw - 32px);padding:0;border:1px solid var(--md-sys-color-outline-variant);border-radius:28px;background:var(--md-sys-color-surface-container);color:var(--md-sys-color-on-surface);box-shadow:0 18px 50px color-mix(in srgb,#000 34%,transparent);overflow:hidden}
      .site-confirm-dialog::backdrop{background:color-mix(in srgb,#000 48%,transparent);backdrop-filter:blur(4px)}
      .site-confirm-card{padding:28px}.site-confirm-eyebrow{margin-bottom:7px;color:var(--md-sys-color-primary);font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
      .site-confirm-title{margin:0;font-family:'Google Sans',sans-serif;font-size:24px;line-height:1.18;letter-spacing:-.03em}.site-confirm-message{margin:12px 0 0;color:var(--md-sys-color-on-surface-variant);font-size:14px;line-height:1.55;overflow-wrap:anywhere}
      .site-confirm-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:24px}.site-confirm-actions button{min-height:42px;border-radius:999px;padding:0 18px;border:1px solid transparent;font:inherit;font-weight:650;cursor:pointer}
      .site-confirm-cancel{background:var(--md-sys-color-surface-container-high);color:var(--md-sys-color-on-surface);border-color:var(--md-sys-color-outline-variant)!important}.site-confirm-ok{background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);border-color:color-mix(in srgb,var(--md-sys-color-primary) 60%,var(--md-sys-color-outline))!important}.site-confirm-ok.is-danger{background:var(--md-sys-color-error);color:var(--md-sys-color-surface);border-color:var(--md-sys-color-error)!important}
      .site-confirm-actions button:focus-visible{outline:3px solid color-mix(in srgb,var(--md-sys-color-primary) 70%,transparent);outline-offset:2px}
      @media(max-width:640px){.site-confirm-dialog{width:calc(100vw - 24px);max-width:calc(100vw - 24px);border-radius:24px}.site-confirm-card{padding:22px}.site-confirm-actions{flex-direction:column-reverse}.site-confirm-actions button{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function $(selector){return document.querySelector(selector);}

  function ensureDialog(){
    let dialog=document.getElementById('site-confirm-dialog');
    if(dialog) return dialog;
    dialog=document.createElement('dialog');
    dialog.id='site-confirm-dialog';
    dialog.className='site-confirm-dialog';
    dialog.innerHTML=`<div class="site-confirm-card"><div class="site-confirm-eyebrow" id="site-confirm-eyebrow">Подтверждение</div><h2 class="site-confirm-title" id="site-confirm-title">Подтвердить действие?</h2><p class="site-confirm-message" id="site-confirm-message"></p><div class="site-confirm-actions"><button type="button" class="site-confirm-cancel" id="site-confirm-cancel">Отмена</button><button type="button" class="site-confirm-ok" id="site-confirm-ok">Подтвердить</button></div></div>`;
    document.body.appendChild(dialog);
    dialog.addEventListener('cancel',e=>{e.preventDefault();finish(false);});
    $('#site-confirm-cancel').onclick=()=>finish(false);
    $('#site-confirm-ok').onclick=()=>finish(true);
    return dialog;
  }

  function finish(value){
    const dialog=document.getElementById('site-confirm-dialog');
    if(dialog?.open) dialog.close();
    const resolve=activeResolve;
    activeResolve=null;
    resolve?.(value);
  }

  function ask(message,options={}){
    ensureStyles();
    const dialog=ensureDialog();
    $('#site-confirm-eyebrow').textContent=options.eyebrow||'Подтверждение';
    $('#site-confirm-title').textContent=options.title||'Подтвердить действие?';
    $('#site-confirm-message').textContent=message||'';
    const ok=$('#site-confirm-ok');
    ok.textContent=options.confirmLabel||'Подтвердить';
    ok.classList.toggle('is-danger',!!options.danger);
    $('#site-confirm-cancel').textContent=options.cancelLabel||'Отмена';
    return new Promise(resolve=>{activeResolve=resolve;dialog.showModal();requestAnimationFrame(()=>ok.focus());});
  }

  function replayWithConfirmedNativeAction(button){
    clearTimeout(nativeConfirmBypassTimer);
    const nativeConfirm=window.confirm;
    let used=false;
    window.confirm=function(message){
      if(!used){used=true;window.confirm=nativeConfirm;clearTimeout(nativeConfirmBypassTimer);return true;}
      return nativeConfirm.call(window,message);
    };
    nativeConfirmBypassTimer=setTimeout(()=>{window.confirm=nativeConfirm;},15000);
    bypassNextClick=true;
    try{button.click();}finally{queueMicrotask(()=>{bypassNextClick=false;});}
  }

  function getConfirmationTarget(button){
    const isDelete=button.matches('[data-delete-news]');
    const isPublish=button.matches('[data-publish], #management-publish, [data-approve-suggestion]');
    if(!isDelete&&!isPublish)return null;
    const row=button.closest('.profile-management-card,.management-suggestion,.admin-news-row,.admin-suggestion-row,article');
    const title=row?.querySelector('.profile-management-card-title,.management-suggestion-title,.admin-news-main strong')?.textContent?.trim()||'';
    return {
      isDelete,
      isPublish,
      message:isPublish
        ?'После публикации материал станет доступен читателям. Перед подтверждением проверьте заголовок, раздел и обложку.'
        :(title?`Удалить новость «${title}»? Это действие необратимо.`:'Удалить новость? Это действие необратимо.'),
      eyebrow:isPublish?'Публикация':'Удаление',
      title:isPublish?'Опубликовать новость?':'Удалить новость?',
      confirmLabel:isPublish?'Опубликовать':'Удалить'
    };
  }

  document.addEventListener('click',async event=>{
    if(bypassNextClick)return;
    const button=event.target.closest?.('[data-delete-news], [data-publish], #management-publish, [data-approve-suggestion]');
    if(!button)return;
    const target=getConfirmationTarget(button);
    if(!target)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const confirmed=await ask(target.message,{eyebrow:target.eyebrow,title:target.title,confirmLabel:target.confirmLabel,danger:target.isDelete});
    if(confirmed)replayWithConfirmedNativeAction(button);
  },true);

  window.siteConfirm=ask;
})();


/* ===== consolidated site feature module ===== */

/* Enhanced reader suggestion workflow + separate profile management page. */
(function(){
  'use strict';
  let currentUser=null,currentProfile=null,installed=false,authorCache={};
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const isAdmin=()=>currentProfile?.role==='admin';
  const statusText=s=>s==='pending'?'Ожидает проверки':s==='pending_update'?'Изменения ожидают проверки':s==='approved'?'Опубликована':s==='rejected'?'Отклонена':s;

  function ensureStyles(){if($('#suggestions-v2-style'))return;const st=document.createElement('style');st.id='suggestions-v2-style';st.textContent=`
    .profile-side{min-width:0;overflow:hidden}.profile-management-links{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;margin-top:18px;width:100%;box-sizing:border-box;align-items:stretch}
    .profile-management-link{width:100%;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border:1px solid var(--md-sys-color-outline-variant);border-radius:18px;background:var(--md-sys-color-surface-container);color:var(--md-sys-color-on-surface);cursor:pointer;text-align:left;font:inherit}
    .profile-management-link:hover{background:var(--md-sys-color-surface-container-high)}.profile-management-link-main{min-width:0;display:flex;align-items:center;gap:12px}.profile-management-link-main>span:last-child{min-width:0}.profile-management-link-title{font-weight:600;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.profile-management-link-note{display:block;font-size:12px;color:var(--md-sys-color-on-surface-variant);margin-top:2px}
    .profile-management-page{width:100%;box-sizing:border-box}.profile-management-page-head{display:flex;align-items:center;gap:12px;margin-bottom:18px}.profile-management-page-head h2{margin:0;min-width:0}.profile-management-content{width:100%;min-width:0;box-sizing:border-box;display:grid;gap:12px}.profile-management-card{width:100%;min-width:0;box-sizing:border-box;overflow:hidden;border:1px solid var(--md-sys-color-outline-variant);border-radius:20px;background:var(--md-sys-color-surface-container);padding:16px}.profile-management-card-title{font-weight:650;display:block;overflow-wrap:anywhere}.profile-management-card-meta{display:flex;flex-wrap:wrap;gap:6px 12px;margin-top:5px;color:var(--md-sys-color-on-surface-variant);font-size:13px}.profile-management-card-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
    .management-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.management-toolbar h3{margin:0}.management-count{min-width:28px;height:28px;padding:0 8px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;background:var(--md-sys-color-primary-container);color:var(--md-sys-color-on-primary-container);font-weight:700;font-size:12px}
    .management-suggestion{width:100%;min-width:0;box-sizing:border-box;overflow:hidden;border:1px solid var(--md-sys-color-outline-variant);border-radius:20px;background:var(--md-sys-color-surface-container);padding:16px}.management-suggestion-main{min-width:0}.management-suggestion-title{font-weight:650;overflow-wrap:anywhere}.management-suggestion-meta{display:flex;flex-wrap:wrap;gap:5px 12px;margin-top:5px;font-size:13px;color:var(--md-sys-color-on-surface-variant)}.management-suggestion-status{margin-top:7px;font-size:13px;color:var(--md-sys-color-primary)}.management-suggestion-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
    @media(max-width:860px){.profile-management-page-head{align-items:flex-start}.profile-management-page-head h2{font-size:22px}.profile-management-card-actions,.management-suggestion-actions{flex-direction:column}.profile-management-card-actions button,.management-suggestion-actions button{width:100%}}
  `;document.head.appendChild(st);}

  async function getClient(){return typeof state!=='undefined'&&state.supabase?state.supabase:null;}
  async function refreshIdentity(){currentUser=typeof state!=='undefined'?state.user:null;currentProfile=currentUser?.profile||null;return currentUser;}
  async function fetchOwn(){
    const sb=await getClient();
    if(!sb||!currentUser)return[];
    const {data,error}=await sb.from('news_submissions').select('*').eq('author_id',currentUser.id).order('created_at',{ascending:false});
    if(error){console.warn(error);return[];}
    return (data||[]).map(item=>{
      if(item.status!=='pending_update') return item;
      return {
        ...item,
        title:item.pending_title ?? item.title,
        category:item.pending_category ?? item.category,
        summary:item.pending_summary ?? item.summary,
        body:item.pending_body ?? item.body,
        image_url:item.pending_image_url ?? item.image_url,
        palette:item.pending_palette ?? item.palette
      };
    });
  }
  async function fetchPending(){const sb=await getClient();if(!sb||!isAdmin())return[];const {data,error}=await sb.from('news_submissions').select('*').in('status',['pending','pending_update']).order('created_at',{ascending:false});if(error){console.warn(error);return[]}const ids=[...new Set((data||[]).map(x=>x.author_id).filter(Boolean))];if(ids.length){const p=await sb.from('profiles').select('id,nickname').in('id',ids);(p.data||[]).forEach(x=>authorCache[x.id]=x.nickname||'Пользователь');}return data||[];}

  function ensureManagementSection(){let section=$('#section-profile-management');if(section)return section;const main=$('#main')||document.querySelector('main');if(!main)return null;section=document.createElement('section');section.id='section-profile-management';section.className='page-section';section.setAttribute('aria-labelledby','profile-management-heading');main.appendChild(section);return section;}
  function openManagement(kind){window.__profileManagementPage=kind;ensureManagementSection();window.openSection?.('profile-management');requestAnimationFrame(renderManagementPage);}
  function backProfile(){window.__profileManagementPage=null;window.openSection?.('profile');}
  function replaceProfilePanels(root){
    const side=$('.profile-side',root);
    if(!side)return;
    side.querySelectorAll('.admin-suggestions,.reader-suggestions,.admin-news-list,.profile-management-links').forEach(x=>x.remove());
    if(typeof state==='undefined'||!state.user)return;
    const box=document.createElement('div');
    box.className='profile-management-links';
    const draftsButton='<button type="button" class="profile-management-link" data-saved-drafts="1" onclick="window.openSavedDraftsPage?.()"><span class="profile-management-link-main"><span class="material-symbols-rounded">draft</span><span><span class="profile-management-link-title">Сохранённые черновики</span><span class="profile-management-link-note">Материалы, сохранённые в вашем аккаунте</span></span></span><span class="material-symbols-rounded">chevron_right</span></button>';
    if(state.admin){
      box.innerHTML='<button type="button" class="profile-management-link" data-management="news"><span class="profile-management-link-main"><span class="material-symbols-rounded">article</span><span><span class="profile-management-link-title">Управление новостями</span><span class="profile-management-link-note">Опубликованные материалы и редактирование</span></span></span><span class="material-symbols-rounded">chevron_right</span></button><button type="button" class="profile-management-link" data-management="suggestions"><span class="profile-management-link-main"><span class="material-symbols-rounded">inbox</span><span><span class="profile-management-link-title">Предложенные новости</span><span class="profile-management-link-note">Проверка и публикация предложений</span></span></span><span class="material-symbols-rounded">chevron_right</span></button>'+draftsButton;
    }else{
      box.innerHTML='<button type="button" class="profile-management-link" data-management="suggestions"><span class="profile-management-link-main"><span class="material-symbols-rounded">inbox</span><span><span class="profile-management-link-title">Предложенные новости</span><span class="profile-management-link-note">Ваши предложения и изменения на проверке</span></span></span><span class="material-symbols-rounded">chevron_right</span></button>'+draftsButton;
    }
    side.appendChild(box);
    box.querySelectorAll('[data-management]').forEach(b=>b.onclick=()=>openManagement(b.dataset.management));
  }

  function renderManagementPage(){if(typeof state==='undefined'||state.section!=='profile-management')return;const section=ensureManagementSection();if(!section)return;const kind=window.__profileManagementPage||'suggestions';section.innerHTML=`<div class="profile-management-page"><div class="profile-management-page-head"><button type="button" class="icon-button" id="profile-management-back" aria-label="Вернуться в профиль"><span class="material-symbols-rounded">arrow_back</span></button><h2 id="profile-management-heading">${kind==='news'?'Управление новостями':'Предложенные новости'}</h2></div><div class="profile-management-content" id="profile-management-content"><div class="media-note">Загрузка…</div></div></div>`;$('#profile-management-back',section).onclick=backProfile;const c=$('#profile-management-content',section);if(kind==='news')renderNewsPage(c);else renderSuggestionsPage(c);}
  function renderNewsPage(c){const news=(state.news||[]).filter(n=>!String(n.id).startsWith('demo-'));c.innerHTML=news.length?news.map(n=>`<article class="profile-management-card"><span class="profile-management-card-title">${esc(n.title)}</span><div class="profile-management-card-meta"><span>${esc(n.category||'')}</span><span>${esc(n.date||'')}</span></div><div class="profile-management-card-actions"><button type="button" class="tonal-button" data-edit-news="${esc(n.id)}"><span class="material-symbols-rounded">edit</span>Редактировать</button><button type="button" class="text-button" data-delete-news="${esc(n.id)}"><span class="material-symbols-rounded">delete</span>Удалить</button></div></article>`).join(''):'<div class="media-note">Опубликованных новостей пока нет.</div>';c.querySelectorAll('[data-edit-news]').forEach(b=>b.onclick=()=>window.openEditor?.(b.dataset.editNews));c.querySelectorAll('[data-delete-news]').forEach(b=>b.onclick=()=>window.deleteNews?.(b.dataset.deleteNews));}

  async function openSuggestionEditor(item,mode){
    if(typeof window.openEditor!=='function')return;

    let sourceItem=item;
    if(!isAdmin()&&currentUser&&item?.id){
      try{
        const sb=await getClient();
        const fresh=await sb?.from('news_submissions').select('*').eq('id',item.id).eq('author_id',currentUser.id).maybeSingle();
        if(fresh?.data) sourceItem=fresh.data;
      }catch(error){
        console.warn('Fresh suggestion read failed:',error);
      }
    }

    window.openEditor(null,'suggest');
    const page=$('#editor-page');
    if(!page)return;
    page.dataset.suggestionId=sourceItem.id;
    page.dataset.suggestionMode=mode;

    const pending=mode==='published-edit'||mode==='admin-review-update'||sourceItem.status==='pending_update';
    const hasPendingVersion=pending && [
      sourceItem.pending_title,sourceItem.pending_category,sourceItem.pending_summary,
      sourceItem.pending_body,sourceItem.pending_image_url,sourceItem.pending_palette
    ].some(value=>value!==null&&value!==undefined&&String(value)!=='');
    const src=hasPendingVersion
      ?{title:sourceItem.pending_title??sourceItem.title,category:sourceItem.pending_category??sourceItem.category,summary:sourceItem.pending_summary??sourceItem.summary,body:sourceItem.pending_body??sourceItem.body,image:sourceItem.pending_image_url??sourceItem.image_url}
      :{title:sourceItem.title,category:sourceItem.category,summary:sourceItem.summary,body:sourceItem.body,image:sourceItem.image_url};
    $('#news-title-input').value=src.title||'';
    $('#news-category-input').value=src.category||'Политика';
    $('#news-summary-input').value=src.summary||'';
    $('#news-body-input').value=src.body||'';
    $('#news-image-input').value=src.image||'';

    let savedPalette=pending?sourceItem.pending_palette:sourceItem.palette;
    if(typeof savedPalette==='string'){try{savedPalette=JSON.parse(savedPalette)}catch(_){savedPalette=null}}
    if(typeof state!=='undefined'){
      state.editor.generatedPalette=savedPalette||null;
      state.editor.pendingCoverFile=null;
      if(savedPalette){
        state.paletteContext='editor';
        window.applySitePalette?.(savedPalette);
      }
    }
    window.syncEditorSelect?.('news-category-input');
    window.updateEditorCoverPreview?.({generatePalette:false});
    if(savedPalette)window.renderPaletteSwatches?.(savedPalette);
    else if(src.image)window.updateEditorPaletteFromImage?.(src.image);

    const b=$('#admin-save');
    if(b){
      const label=b.querySelector('span:last-child');
      if(label)label.textContent=mode==='published-edit'?'Отправить на проверку':'Сохранить изменения';
      b.onclick=()=>saveSuggestionEditor();
    }
    if(isAdmin()&&(mode==='admin-review'||mode==='admin-review-update'))addPublishButton(sourceItem.id);
  }
  function addPublishButton(id){const actions=$('.editor-actions');if(!actions||$('#management-publish'))return;const b=document.createElement('button');b.id='management-publish';b.className='tonal-button';b.type='button';b.innerHTML='<span class="material-symbols-rounded">publish</span><span>Опубликовать</span>';b.onclick=()=>publishSuggestion(id);actions.insertBefore(b,actions.lastElementChild);}
  async function saveSuggestionEditor(){
    const sb=await getClient();
    if(!sb||!currentUser){window.showToast?.('Не удалось сохранить: аккаунт или Supabase недоступен.');return;}
    const page=$('#editor-page'),id=page?.dataset.suggestionId,mode=page?.dataset.suggestionMode;
    if(!id||!mode)return;
    const msg=$('#admin-message');if(msg)msg.textContent='';
    try{
      const title=$('#news-title-input')?.value.trim()||'';
      const category=$('#news-category-input')?.value||'Политика';
      const summary=$('#news-summary-input')?.value.trim()||'';
      const body=$('#news-body-input')?.value.trim()||'';
      let image=$('#news-image-input')?.value.trim()||'';
      if(!title||!body){if(msg)msg.textContent='Заполните заголовок и текст новости.';return;}
      const pendingCoverFile=typeof state!=='undefined'
        ?(state.editor?.pendingCoverFile || $('#editor-image-file')?.files?.[0] || null)
        :($('#editor-image-file')?.files?.[0] || null);
      if(pendingCoverFile){
        if(msg)msg.textContent='Загружаем обложку…';
        image=await uploadNewsImage(pendingCoverFile,'suggestion');
        const imageInput=$('#news-image-input');if(imageInput)imageInput.value=image;
      }
      if(!image)image=extractFirstImageFromMarkdown(body)||'';
      if(!image){if(msg)msg.textContent='Добавьте изображение новости.';return;}
      if(msg)msg.textContent='Генерируем палитру…';
      let palette=typeof state!=='undefined'?state.editor?.generatedPalette:null;
      if(palette?.generator!==M3_IMAGE_PALETTE_GENERATOR)palette=await generateM3ContentPaletteFromImage(image);
      const effectiveSummary=summary||body.replace(/^#{1,6}\s+/gm,'').replace(/[*_#>-]/g,'').split(/\n\s*\n/).find(Boolean)?.trim().slice(0,360)||'';
      let query=sb.from('news_submissions').update(
        mode==='published-edit'||mode==='admin-review-update'
          ?{pending_category:category,pending_title:title,pending_summary:effectiveSummary,pending_body:body,pending_image_url:image,pending_palette:palette,status:'pending_update',updated_at:new Date().toISOString()}
          :{category,title,summary:effectiveSummary,body,image_url:image,palette,status:'pending',updated_at:new Date().toISOString()}
      ).eq('id',id);
      if(mode==='published-edit')query=query.eq('author_id',currentUser.id);
      else if(mode==='pending-edit')query=query.eq('author_id',currentUser.id).in('status',['pending','rejected']);
      else if(mode==='admin-review'||mode==='admin-review-update'){if(!isAdmin())throw new Error('Требуются права администратора.');}
      else throw new Error('Неизвестный режим редактора предложения.');
      const result=await query.select('id,updated_at,status').maybeSingle();
      if(result.error)throw result.error;
      if(!result.data)throw new Error('Предложение не сохранено. Проверьте права доступа или актуальность его статуса.');
      if(typeof state!=='undefined'){
        state.editor.generatedPalette=palette;
        state.editor.pendingCoverFile=null;
      }
      window.removeSavedDraft?.(typeof state!=='undefined'?state.editor?.draftId:null);
      window.showToast?.(mode==='published-edit'?'Изменения отправлены администратору':'Предложение сохранено');
      if(typeof state!=='undefined')state.editor={id:null,mode:'edit',originalImageUrl:null,generatedPalette:null,imageObjectUrl:null,pendingCoverFile:null,authorId:null,suggestionMode:false,submissionId:null,draftId:null};
      window.openSection?.('profile');requestAnimationFrame(()=>window.openSection?.('profile-management'));
    }catch(error){
      console.error('Suggestion save failed:',error);
      if(msg)msg.textContent=error?.message||'Не удалось сохранить изменения.';else window.showToast?.(error?.message||'Не удалось сохранить изменения.');
    }
  }

  window.saveSuggestionEditorWorkflow=saveSuggestionEditor;

  async function deleteOwnSuggestion(id){
    const sb=await getClient();
    if(!sb||!currentUser)return;
    const read=await sb.from('news_submissions').select('id,title,status,author_id').eq('id',id).maybeSingle();
    if(read.error){window.showToast?.(read.error.message);return;}
    const item=read.data;
    if(!item||item.author_id!==currentUser.id||!['pending','rejected'].includes(item.status)){window.showToast?.('Эту новость удалить нельзя.');renderManagementPage();return;}
    const ok=typeof window.siteConfirm==='function'
      ?await window.siteConfirm('Удалить это неопубликованное предложение? Его нельзя будет восстановить.',{eyebrow:'Предложенные новости',title:'Удалить предложение?',confirmLabel:'Удалить',cancelLabel:'Отмена',danger:true})
      :window.confirm('Удалить предложение?');
    if(!ok)return;
    const result=await sb.from('news_submissions').delete().eq('id',id).eq('author_id',currentUser.id).in('status',['pending','rejected']);
    if(result.error){window.showToast?.(result.error.message);return;}
    window.showToast?.('Предложение удалено');renderManagementPage();
  }

  async function publishSuggestion(id){const sb=await getClient();if(!sb||!isAdmin())return;const {data:item,error}=await sb.from('news_submissions').select('*').eq('id',id).single();if(error||!item)return;if(!confirm('Опубликовать эту версию новости?'))return;const update=item.status==='pending_update'&&item.news_id;let p=item.palette;if(update)p=item.pending_palette;if(typeof p==='string'){try{p=JSON.parse(p)}catch(_){p=null}}const src=update?{category:item.pending_category,title:item.pending_title,summary:item.pending_summary,body:item.pending_body,image_url:item.pending_image_url}:{category:item.category,title:item.title,summary:item.summary,body:item.body,image_url:item.image_url};const payload={category:src.category,title:src.title,summary:src.summary||'',body:src.body||'',image_url:src.image_url||'',author_id:item.author_id,palette:p,accent_hex:p?.light?.primary||null};let newsId=item.news_id;let r;if(update)r=await sb.from('news').update(payload).eq('id',newsId);else{r=await sb.from('news').insert(payload).select('id').single();newsId=r.data?.id;}if(r.error)return window.showToast?.(r.error.message);const u=await sb.from('news_submissions').update({status:'approved',news_id:newsId,reviewed_at:new Date().toISOString(),reviewed_by:currentUser.id,pending_category:null,pending_title:null,pending_summary:null,pending_body:null,pending_image_url:null,pending_palette:null,updated_at:new Date().toISOString()}).eq('id',id);if(u.error)return window.showToast?.(u.error.message);await window.loadRemoteNews?.();window.showToast?.(update?'Изменения опубликованы':'Предложение опубликовано');backProfile();}
  async function rejectSuggestion(id){const sb=await getClient();if(!sb||!isAdmin())return;const r=await sb.from('news_submissions').update({status:'rejected',pending_category:null,pending_title:null,pending_summary:null,pending_body:null,pending_image_url:null,pending_palette:null,reviewed_at:new Date().toISOString(),reviewed_by:currentUser.id}).eq('id',id);if(r.error)return window.showToast?.(r.error.message);window.showToast?.('Предложение отклонено');renderManagementPage();}

  async function renderSuggestionsPage(c){await refreshIdentity();if(!currentUser){c.innerHTML='<div class="media-note">Войдите в аккаунт, чтобы просматривать предложения.</div>';return;}const items=isAdmin()?await fetchPending():await fetchOwn();c.innerHTML='';const toolbar=document.createElement('div');toolbar.className='management-toolbar';toolbar.innerHTML='<h3>'+ (isAdmin()?'Предложения на проверке':'Мои предложения') +'</h3><span class="management-count">'+items.length+'</span>';c.appendChild(toolbar);const list=document.createElement('div');list.style.cssText='display:grid;gap:12px;width:100%;min-width:0';c.appendChild(list);if(!items.length){list.innerHTML='<div class="media-note">'+(isAdmin()?'Новых предложений и изменений на проверке нет.':'Вы ещё не предлагали новости.')+'</div>';return;}list.innerHTML=items.map(s=>{const pending=s.status==='pending_update';const src=pending?{title:s.pending_title,category:s.pending_category}:{title:s.title,category:s.category};const author=isAdmin()?'<span>Автор: '+esc(authorCache[s.author_id]||'Пользователь')+'</span>':'';let actions='';if(isAdmin())actions='<button class="tonal-button" data-review="'+esc(s.id)+'"><span class="material-symbols-rounded">edit</span>Просмотреть и изменить</button><button class="filled-button" data-publish="'+esc(s.id)+'"><span class="material-symbols-rounded">publish</span>Опубликовать</button><button class="text-button" data-reject="'+esc(s.id)+'">Отклонить</button>';else { if(['pending','approved','pending_update','rejected'].includes(s.status))actions='<button class="tonal-button" data-user-edit="'+esc(s.id)+'"><span class="material-symbols-rounded">edit</span>Редактировать</button>'; if(['pending','rejected'].includes(s.status))actions+='<button class="text-button" data-user-delete="'+esc(s.id)+'"><span class="material-symbols-rounded">delete</span>Удалить</button>'; }return '<article class="management-suggestion"><div class="management-suggestion-main"><div class="management-suggestion-title">'+esc(src.title)+'</div><div class="management-suggestion-meta"><span>'+esc(src.category||'')+'</span><span>'+esc(new Date(s.created_at).toLocaleDateString('ru-RU'))+'</span>'+author+'</div><div class="management-suggestion-status">'+esc(statusText(s.status))+'</div></div><div class="management-suggestion-actions">'+actions+'</div></article>';}).join('');list.querySelectorAll('[data-review]').forEach(b=>b.onclick=async()=>{const a=items.find(x=>String(x.id)===String(b.dataset.review));if(a)openSuggestionEditor(a,a.status==='pending_update'?'admin-review-update':'admin-review');});list.querySelectorAll('[data-user-edit]').forEach(b=>b.onclick=async()=>{const a=items.find(x=>String(x.id)===String(b.dataset.userEdit));if(a)openSuggestionEditor(a,a.status==='approved'?'published-edit':'pending-edit');});list.querySelectorAll('[data-user-delete]').forEach(b=>b.onclick=()=>deleteOwnSuggestion(b.dataset.userDelete));list.querySelectorAll('[data-publish]').forEach(b=>b.onclick=()=>publishSuggestion(b.dataset.publish));list.querySelectorAll('[data-reject]').forEach(b=>b.onclick=()=>rejectSuggestion(b.dataset.reject));}

  function install(){if(installed)return;installed=true;ensureStyles();const op=window.renderProfile;if(typeof op==='function')window.renderProfile=function(){const r=op.apply(this,arguments);requestAnimationFrame(()=>replaceProfilePanels($('#profile-card')));return r;};const os=window.openSection;if(typeof os==='function')window.openSection=function(section){if(section==='profile-management')ensureManagementSection();const r=os.apply(this,arguments);if(section==='profile-management')requestAnimationFrame(renderManagementPage);return r;};
    document.addEventListener('click',e=>{
      const cancel=e.target.closest?.('#editor-cancel');
      if(!cancel||typeof state==='undefined'||state.section!=='editor')return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const target=state.previousSection&&state.previousSection!=='editor'?state.previousSection:'news';
      state.editor={id:null,mode:'edit',originalImageUrl:null,generatedPalette:null,imageObjectUrl:null,pendingCoverFile:null,authorId:null,suggestionMode:false,submissionId:null};
      if(target==='profile-management'){
        window.openSection?.('profile');
        setTimeout(()=>window.openSection?.('profile-management'),0);
        return;
      }
      window.openSection?.(target);
      if(target==='news')window.renderNews?.();
    },true);
    setTimeout(()=>{if(typeof state!=='undefined'&&state.section==='profile')replaceProfilePanels($('#profile-card'));},500);}
  function boot(){install();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();


/* ===== consolidated site feature module ===== */

/* Server-side saved drafts. */
(function(){
  'use strict';
  const TABLE='news_drafts';
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

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
      const file=state.editor?.pendingCoverFile||$('#editor-image-file')?.files?.[0]||null;
      if(file){
        const resolved=await resolveImage(file,msg);
        if(resolved){
          image=resolved;
          if(typeof state!=='undefined') state.editor.pendingCoverFile=null;
          const fileInput=$('#editor-image-file'); if(fileInput) fileInput.value='';
          const imageInput=$('#news-image-input'); if(imageInput) imageInput.value=image;
        }
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
    if(draft.image_url){
      if(draft.palette){
        state.paletteContext='editor';
        window.applySitePalette?.(draft.palette);
        renderPaletteSwatches(draft.palette);
      }
      updateEditorCoverPreview({generatePalette:!draft.palette});
    }
    window.showToast?.('Черновик открыт');
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
    window.openSavedDraftsPage=()=>{ensureSection();window.openSection?.('saved-drafts');renderPage();};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();

  window.removeSavedDraft=async id=>{
    if(!id)return;
    try{await deleteDraft(id);}
    catch(error){console.warn('removeSavedDraft failed:',error);}
  };
})();

/* ===== consolidated site feature module ===== */

/* Material delete confirmation bridge. */
(function(){
  'use strict';
  function install(){
    if(document.documentElement.dataset.deleteDialogFix==='1')return;
    document.documentElement.dataset.deleteDialogFix='1';
    if(typeof window.deleteNews!=='function')return;
    const original=window.deleteNews;
    window.deleteNews=async function(id){
      const item=typeof state!=='undefined'?state.news?.find(n=>String(n.id)===String(id)):null;
      const message=item?.title?'Удалить новость «'+item.title+'»? Это действие необратимо.':'Удалить новость? Это действие необратимо.';
      if(typeof window.siteConfirm!=='function')return original(id);
      const ok=await window.siteConfirm(message,{eyebrow:'Удаление',title:'Удалить новость?',confirmLabel:'Удалить',danger:true});
      if(!ok)return;
      const nativeConfirm=window.confirm;
      window.confirm=function(){return true;};
      try{return await original(id);}finally{window.confirm=nativeConfirm;}
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();