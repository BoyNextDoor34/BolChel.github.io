/* Saved local drafts for reader and administrator editors. */
(function(){
  'use strict';
  const KEY='bolchel-saved-drafts-v1';
  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const read=()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v:[]}catch(_){return[]}};
  const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v));return true}catch(_){return false}};
  const makeId=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
  const formatDate=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});};
  const currentDraftId=()=>typeof state!=='undefined'?state.editor?.draftId:null;
  function removeDraft(id){if(!id)return;write(read().filter(d=>d.id!==id));}
  window.removeSavedDraft=removeDraft;

  async function fileToDataUrl(file){
    if(!file)return null;
    return await new Promise((resolve,reject)=>{
      const img=new Image();
      const url=URL.createObjectURL(file);
      img.onload=()=>{
        try{
          const max=1280,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));
          const canvas=document.createElement('canvas');
          canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
          canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
          const ctx=canvas.getContext('2d');
          if(!ctx)throw new Error('Canvas недоступен.');
          ctx.drawImage(img,0,0,canvas.width,canvas.height);
          resolve(canvas.toDataURL('image/webp',.82));
        }catch(error){reject(error)}finally{URL.revokeObjectURL(url)}
      };
      img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Не удалось подготовить изображение черновика.'))};
      img.src=url;
    });
  }
  async function dataUrlToFile(dataUrl){
    if(!dataUrl||!dataUrl.startsWith('data:'))return null;
    const r=await fetch(dataUrl); const blob=await r.blob();
    return new File([blob],'draft-cover.webp',{type:blob.type||'image/webp',lastModified:Date.now()});
  }

  async function saveCurrentDraft(){
    const page=$('#editor-page');
    if(!page)return;
    const user=typeof state!=='undefined'?state.user:null;
    if(!user){window.showToast?.('Сохранение черновиков доступно после входа в аккаунт.');return;}
    const title=$('#news-title-input')?.value.trim()||'';
    const category=$('#news-category-input')?.value||'Политика';
    const summary=$('#news-summary-input')?.value.trim()||'';
    const body=$('#news-body-input')?.value||'';
    let image=$('#news-image-input')?.value.trim()||'';
    const file=typeof state!=='undefined'?state.editor?.pendingCoverFile:null;
    let imageDataUrl=null;
    if(file) imageDataUrl=await fileToDataUrl(file);
    if(!image&&imageDataUrl)image=imageDataUrl;
    const drafts=read();
    const id=currentDraftId()||makeId();
    const draft={
      id,
      ownerId:user.id,
      ownerNickname:user.profile?.nickname||user.email?.split('@')[0]||'Пользователь',
      kind:typeof state!=='undefined'&&state.editor?.suggestionMode?'suggestion':'news',
      title,category,summary,body,image,imageDataUrl,
      authorId:$('#news-author-input')?.value||user.id,
      savedAt:new Date().toISOString()
    };
    const next=[draft,...drafts.filter(d=>d.id!==id)].slice(0,50);
    if(!write(next)){window.showToast?.('Не удалось сохранить черновик: закончилось место в хранилище браузера.');return;}
    if(typeof state!=='undefined')state.editor.draftId=id;
    page.dataset.savedDraftId=id;
    window.showToast?.('Черновик сохранён');
  }

  function ensureSection(){
    let section=$('#section-saved-drafts');
    if(section)return section;
    const main=$('#main'); if(!main)return null;
    section=document.createElement('section');
    section.id='section-saved-drafts'; section.className='page-section'; section.setAttribute('aria-labelledby','saved-drafts-heading');
    main.appendChild(section); return section;
  }
  function openPage(){ensureSection();window.openSection?.('saved-drafts');renderPage();}

  function injectProfileButton(){
    const root=$('#profile-card');const side=$('.profile-side',root);
    if(!side||!state?.user)return;
    if(side.querySelector('[data-saved-drafts]'))return;
    const box=side.querySelector('.profile-management-links');
    if(!box)return;
    const b=document.createElement('button');b.type='button';b.className='profile-management-link';b.dataset.savedDrafts='1';
    b.innerHTML='<span class="profile-management-link-main"><span class="material-symbols-rounded">draft</span><span><span class="profile-management-link-title">Сохранённые черновики</span><span class="profile-management-link-note">Незавершённые материалы на этом устройстве</span></span></span><span class="material-symbols-rounded">chevron_right</span>';
    b.onclick=openPage;
    box.prepend(b);
  }

  function injectDraftStyles(){
    if($('#saved-drafts-style'))return;
    const style=document.createElement('style');style.id='saved-drafts-style';
    style.textContent='.saved-drafts-page{width:100%;box-sizing:border-box}.saved-drafts-list{display:grid;gap:12px;width:100%;min-width:0}.saved-draft-card{width:100%;box-sizing:border-box;min-width:0;overflow:hidden;border:1px solid var(--md-sys-color-outline-variant);border-radius:20px;background:var(--md-sys-color-surface-container);padding:16px}.saved-draft-title{font-weight:700;overflow-wrap:anywhere}.saved-draft-meta{margin-top:6px;display:flex;flex-wrap:wrap;gap:6px 12px;color:var(--md-sys-color-on-surface-variant);font-size:13px}.saved-draft-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}@media(max-width:860px){.saved-draft-actions{flex-direction:column}.saved-draft-actions button{width:100%}}';
    document.head.appendChild(style);
  }

  function renderPage(){
    injectDraftStyles();
    const section=ensureSection();if(!section)return;
    const drafts=read().filter(d=>typeof state==='undefined'||!state.user||d.ownerId===state.user.id);
    section.innerHTML='<div class="saved-drafts-page"><div class="profile-management-page-head"><button type="button" class="icon-button" id="saved-drafts-back" aria-label="Вернуться в профиль"><span class="material-symbols-rounded">arrow_back</span></button><h2 id="saved-drafts-heading">Сохранённые черновики</h2></div><div class="saved-drafts-list" id="saved-drafts-list"></div></div>';
    $('#saved-drafts-back',section).onclick=()=>window.openSection?.('profile');
    const list=$('#saved-drafts-list',section);
    if(!drafts.length){list.innerHTML='<div class="media-note">Сохранённых черновиков пока нет.</div>';return;}
    list.innerHTML=drafts.map(d=>'<article class="saved-draft-card"><div class="saved-draft-title">'+esc(d.title||'Без названия')+'</div><div class="saved-draft-meta"><span>'+(d.kind==='suggestion'?'Предложение':'Новость')+'</span><span>'+esc(d.category||'')+'</span><span>'+esc(formatDate(d.savedAt))+'</span></div><div class="saved-draft-actions"><button type="button" class="tonal-button" data-open-draft="'+esc(d.id)+'"><span class="material-symbols-rounded">edit</span>Продолжить редактирование</button><button type="button" class="text-button" data-delete-draft="'+esc(d.id)+'"><span class="material-symbols-rounded">delete</span>Удалить</button></div></article>').join('');
    list.querySelectorAll('[data-open-draft]').forEach(b=>b.onclick=()=>openDraft(b.dataset.openDraft));
    list.querySelectorAll('[data-delete-draft]').forEach(b=>b.onclick=()=>{const id=b.dataset.deleteDraft;removeDraft(id);renderPage();window.showToast?.('Черновик удалён');});
  }

  async function openDraft(id){
    const d=read().find(x=>x.id===id);if(!d||!state?.user)return;
    const own=d.ownerId===state.user.id;if(!own){window.showToast?.('Этот черновик недоступен.');return;}
    if(d.kind==='suggestion'&&!state.admin)window.openEditor?.(null,'suggest');else window.openEditor?.(null);
    await new Promise(r=>setTimeout(r,80));
    const page=$('#editor-page');if(!page)return;
    if(typeof state!=='undefined')state.editor.draftId=d.id;
    page.dataset.savedDraftId=d.id;
    const set=(sel,v)=>{const el=$(sel);if(el)el.value=v??'';};
    set('#news-title-input',d.title);set('#news-category-input',d.category||'Политика');set('#news-summary-input',d.summary);set('#news-body-input',d.body);
    set('#news-image-input',d.image&&d.image.startsWith('data:')?'':d.image);
    $('#news-body-input')?.dispatchEvent(new Event('input',{bubbles:true}));
    $('#news-image-input')?.dispatchEvent(new Event('input',{bubbles:true}));
    if(d.imageDataUrl){
      const file=await dataUrlToFile(d.imageDataUrl);
      if(typeof state!=='undefined')state.editor.pendingCoverFile=file;
      const img=$('#editor-cover-preview');if(img){img.src=d.imageDataUrl;img.style.opacity='1';}
      if(typeof window.updateEditorPaletteFromImage==='function')window.updateEditorPaletteFromImage(d.imageDataUrl);
    }
    window.showToast?.('Черновик открыт');
  }

  function wrapRenderProfile(){
    if(typeof window.renderProfile!=='function'||window.renderProfile.__draftWrapped)return false;
    const original=window.renderProfile;
    const wrapped=function(){const r=original.apply(this,arguments);setTimeout(injectProfileButton,30);return r;};
    wrapped.__draftWrapped=true;window.renderProfile=wrapped;return true;
  }

  function install(){
    if(document.documentElement.dataset.draftsWorkflow==='1')return;
    document.documentElement.dataset.draftsWorkflow='1';
    wrapRenderProfile();
    document.addEventListener('click',e=>{
      const save=e.target.closest?.('#editor-save-draft');
      if(save){e.preventDefault();e.stopImmediatePropagation();saveCurrentDraft();return;}
      if(e.target.closest?.('#profile-management-back')&&typeof state!=='undefined'&&state.section==='saved-drafts')setTimeout(()=>window.openSection?.('profile'),0);
    },true);
    setTimeout(injectProfileButton,100);
  }
  function boot(){if(!wrapRenderProfile())setTimeout(boot,100);install();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();