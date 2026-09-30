/* Saved local drafts for reader and administrator editors. */
(function(){
  'use strict';

  const KEY='bolchel-saved-drafts-v1';
  const DB_NAME='bolchel-drafts-db-v1';
  const DB_VERSION=1;
  const STORE='drafts';

  const $=(s,r=document)=>r.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const makeId=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
  const formatDate=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});};
  const currentDraftId=()=>typeof state!=='undefined'?state.editor?.draftId:null;

  let dbPromise=null;
  let draftsCache=null;

  function readLegacy(){
    try{
      const value=JSON.parse(localStorage.getItem(KEY)||'[]');
      return Array.isArray(value)?value:[];
    }catch(_){
      return[];
    }
  }

  function writeLegacy(value){
    try{
      localStorage.setItem(KEY,JSON.stringify(value));
      return true;
    }catch(error){
      console.warn('LocalStorage draft snapshot failed:',error);
      return false;
    }
  }

  function openDB(){
    if(dbPromise)return dbPromise;
    if(!('indexedDB' in window)){
      dbPromise=Promise.reject(new Error('IndexedDB недоступен.'));
      return dbPromise;
    }
    dbPromise=new Promise((resolve,reject)=>{
      const request=indexedDB.open(DB_NAME,DB_VERSION);
      request.onupgradeneeded=()=>{
        const db=request.result;
        if(!db.objectStoreNames.contains(STORE)){
          const store=db.createObjectStore(STORE,{keyPath:'id'});
          store.createIndex('ownerId','ownerId',{unique:false});
          store.createIndex('savedAt','savedAt',{unique:false});
        }
      };
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error('Не удалось открыть IndexedDB.'));
      request.onblocked=()=>reject(new Error('IndexedDB заблокирована другим окном браузера.'));
    });
    return dbPromise;
  }

  function idbGetAll(db){
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readonly');
      const request=tx.objectStore(STORE).getAll();
      request.onsuccess=()=>resolve(Array.isArray(request.result)?request.result:[]);
      request.onerror=()=>reject(request.error||new Error('Не удалось прочитать черновики.'));
    });
  }

  function idbPut(db,draft){
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put(draft);
      tx.oncomplete=()=>resolve(true);
      tx.onerror=()=>reject(tx.error||new Error('Не удалось сохранить черновик.'));
      tx.onabort=()=>reject(tx.error||new Error('Сохранение черновика отменено.'));
    });
  }

  function idbDelete(db,id){
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete=()=>resolve(true);
      tx.onerror=()=>reject(tx.error||new Error('Не удалось удалить черновик.'));
    });
  }

  function sortDrafts(items){
    return [...items].sort((a,b)=>new Date(b.savedAt||0).getTime()-new Date(a.savedAt||0).getTime()).slice(0,50);
  }

  async function loadDrafts(){
    if(draftsCache)return draftsCache;

    const legacy=readLegacy();
    try{
      const db=await openDB();
      const stored=await idbGetAll(db);
      const byId=new Map(stored.map(d=>[d.id,d]));

      // Migrate drafts created by the old localStorage-only implementation.
      for(const draft of legacy){
        if(!byId.has(draft.id)){
          await idbPut(db,draft);
          byId.set(draft.id,draft);
        }
      }

      draftsCache=sortDrafts([...byId.values()]);
      return draftsCache;
    }catch(error){
      console.warn('IndexedDB unavailable, using localStorage fallback:',error);
      draftsCache=sortDrafts(legacy);
      return draftsCache;
    }
  }

  async function persistDraft(draft){
    let storedInIndexedDB=false;
    try{
      const db=await openDB();
      await idbPut(db,draft);
      storedInIndexedDB=true;
    }catch(error){
      console.warn('IndexedDB draft save failed:',error);
    }

    // Keep a lightweight browser-local snapshot too. This provides migration
    // and a fallback for browsers where IndexedDB is unavailable.
    const fallbackDraft={...draft};
    delete fallbackDraft.imageBlob;
    if(!storedInIndexedDB && draft.imageDataUrl)fallbackDraft.imageDataUrl=draft.imageDataUrl;
    else delete fallbackDraft.imageDataUrl;

    const current=readLegacy();
    const next=sortDrafts([fallbackDraft,...current.filter(d=>d.id!==draft.id)]);
    const legacyOk=writeLegacy(next);

    if(!storedInIndexedDB && !legacyOk){
      throw new Error('Браузер не смог сохранить черновик. Проверьте разрешения на хранение данных сайта.');
    }

    const cache=await loadDrafts();
    const cacheIndex=cache.findIndex(d=>d.id===draft.id);
    if(cacheIndex>=0)cache[cacheIndex]=draft;
    else cache.unshift(draft);
    draftsCache=sortDrafts(cache);
  }

  async function removeDraft(id){
    if(!id)return;
    const items=await loadDrafts();
    draftsCache=items.filter(d=>d.id!==id);
    try{
      const db=await openDB();
      await idbDelete(db,id);
    }catch(error){
      console.warn('IndexedDB draft delete failed:',error);
    }
    writeLegacy(readLegacy().filter(d=>d.id!==id));
  }
  window.removeSavedDraft=removeDraft;

  async function fileToDataUrl(file){
    if(!file)return null;
    return await new Promise((resolve,reject)=>{
      const img=new Image();
      const url=URL.createObjectURL(file);
      img.onload=()=>{
        try{
          const max=1280;
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
        reject(new Error('Не удалось подготовить изображение черновика.'));
      };
      img.src=url;
    });
  }

  async function dataUrlToFile(dataUrl){
    if(!dataUrl||!dataUrl.startsWith('data:'))return null;
    const response=await fetch(dataUrl);
    const blob=await response.blob();
    return new File([blob],'draft-cover.webp',{type:blob.type||'image/webp',lastModified:Date.now()});
  }

  async function saveCurrentDraft(){
    const page=$('#editor-page');
    if(!page)return;
    const user=typeof state!=='undefined'?state.user:null;
    if(!user){
      window.showToast?.('Сохранение черновиков доступно после входа в аккаунт.');
      return;
    }

    const title=$('#news-title-input')?.value.trim()||'';
    const category=$('#news-category-input')?.value||'Политика';
    const summary=$('#news-summary-input')?.value.trim()||'';
    const body=$('#news-body-input')?.value||'';
    let image=$('#news-image-input')?.value.trim()||'';
    const file=typeof state!=='undefined'?state.editor?.pendingCoverFile:null;

    let imageDataUrl=null;
    let imageBlob=null;
    if(file){
      imageDataUrl=await fileToDataUrl(file);
      if(imageDataUrl){
        const response=await fetch(imageDataUrl);
        imageBlob=await response.blob();
        if(!image)image=imageDataUrl;
      }
    }

    const existing=await loadDrafts();
    const id=currentDraftId()||page.dataset.savedDraftId||makeId();
    const draft={
      id,
      ownerId:user.id,
      ownerNickname:user.profile?.nickname||user.email?.split('@')[0]||'Пользователь',
      kind:typeof state!=='undefined'&&state.editor?.suggestionMode?'suggestion':'news',
      title,category,summary,body,image,
      imageDataUrl,
      imageBlob,
      authorId:$('#news-author-input')?.value||user.id,
      savedAt:new Date().toISOString()
    };

    const next=sortDrafts([draft,...existing.filter(d=>d.id!==id)]);
    if(next.length>50)next.length=50;

    // Persist the exact record first. IndexedDB keeps the binary cover as a
    // Blob, so image-heavy drafts no longer hit localStorage's small quota.
    draftsCache=next;
    await persistDraft(draft);

    if(typeof state!=='undefined')state.editor.draftId=id;
    page.dataset.savedDraftId=id;
    window.showToast?.('Черновик сохранён');
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

  function openPage(){
    ensureSection();
    window.openSection?.('saved-drafts');
    renderPage();
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

    const b=document.createElement('button');
    b.type='button';
    b.className='profile-management-link';
    b.dataset.savedDrafts='1';
    b.innerHTML='<span class="profile-management-link-main"><span class="material-symbols-rounded">draft</span><span><span class="profile-management-link-title">Сохранённые черновики</span><span class="profile-management-link-note">Незавершённые материалы на этом устройстве</span></span></span><span class="material-symbols-rounded">chevron_right</span>';
    b.onclick=openPage;
    box.prepend(b);
  }

  function injectDraftStyles(){
    if($('#saved-drafts-style'))return;
    const style=document.createElement('style');
    style.id='saved-drafts-style';
    style.textContent='.saved-drafts-page{width:100%;box-sizing:border-box}.saved-drafts-list{display:grid;gap:12px;width:100%;min-width:0}.saved-draft-card{width:100%;box-sizing:border-box;min-width:0;overflow:hidden;border:1px solid var(--md-sys-color-outline-variant);border-radius:20px;background:var(--md-sys-color-surface-container);padding:16px}.saved-draft-title{font-weight:700;overflow-wrap:anywhere}.saved-draft-meta{margin-top:6px;display:flex;flex-wrap:wrap;gap:6px 12px;color:var(--md-sys-color-on-surface-variant);font-size:13px}.saved-draft-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}@media(max-width:860px){.saved-draft-actions{flex-direction:column}.saved-draft-actions button{width:100%}}';
    document.head.appendChild(style);
  }

  async function renderPage(){
    injectDraftStyles();
    const section=ensureSection();
    if(!section)return;

    const list=section.querySelector('#saved-drafts-list');
    if(!list){
      section.innerHTML='<div class="saved-drafts-page"><div class="profile-management-page-head"><button type="button" class="icon-button" id="saved-drafts-back" aria-label="Вернуться в профиль"><span class="material-symbols-rounded">arrow_back</span></button><h2 id="saved-drafts-heading">Сохранённые черновики</h2></div><div class="saved-drafts-list" id="saved-drafts-list"><div class="media-note">Загрузка черновиков…</div></div></div>';
      $('#saved-drafts-back',section).onclick=()=>window.openSection?.('profile');
    }

    const drafts=(await loadDrafts()).filter(d=>typeof state==='undefined'||!state.user||d.ownerId===state.user.id);
    const target=$('#saved-drafts-list',section);
    if(!target)return;
    if(!drafts.length){
      target.innerHTML='<div class="media-note">Сохранённых черновиков пока нет.</div>';
      return;
    }

    target.innerHTML=drafts.map(d=>'<article class="saved-draft-card"><div class="saved-draft-title">'+esc(d.title||'Без названия')+'</div><div class="saved-draft-meta"><span>'+(d.kind==='suggestion'?'Предложение':'Новость')+'</span><span>'+esc(d.category||'')+'</span><span>'+esc(formatDate(d.savedAt))+'</span></div><div class="saved-draft-actions"><button type="button" class="tonal-button" data-open-draft="'+esc(d.id)+'"><span class="material-symbols-rounded">edit</span>Продолжить редактирование</button><button type="button" class="text-button" data-delete-draft="'+esc(d.id)+'"><span class="material-symbols-rounded">delete</span>Удалить</button></div></article>').join('');
    target.querySelectorAll('[data-open-draft]').forEach(b=>b.onclick=()=>openDraft(b.dataset.openDraft));
    target.querySelectorAll('[data-delete-draft]').forEach(b=>b.onclick=async()=>{
      const id=b.dataset.deleteDraft;
      await removeDraft(id);
      renderPage();
      window.showToast?.('Черновик удалён');
    });
  }

  async function openDraft(id){
    const drafts=await loadDrafts();
    const d=drafts.find(x=>x.id===id);
    if(!d||!state?.user)return;

    const own=d.ownerId===state.user.id;
    if(!own){
      window.showToast?.('Этот черновик недоступен.');
      return;
    }

    if(d.kind==='suggestion'&&!state.admin)window.openEditor?.(null,'suggest');
    else window.openEditor?.(null);

    await new Promise(r=>setTimeout(r,100));
    const page=$('#editor-page');
    if(!page)return;

    if(typeof state!=='undefined')state.editor.draftId=d.id;
    page.dataset.savedDraftId=d.id;

    const set=(sel,v)=>{
      const el=$(sel);
      if(el)el.value=v??'';
    };

    set('#news-title-input',d.title);
    set('#news-category-input',d.category||'Политика');
    set('#news-summary-input',d.summary);
    set('#news-body-input',d.body);
    set('#news-image-input',d.image&&d.image.startsWith('data:')?'':d.image);

    if(typeof window.syncEditorSelect==='function')window.syncEditorSelect('news-category-input');
    if(typeof window.syncEditorSelect==='function')window.syncEditorSelect('news-author-input');
    $('#news-body-input')?.dispatchEvent(new Event('input',{bubbles:true}));
    $('#news-image-input')?.dispatchEvent(new Event('input',{bubbles:true}));

    const savedBlob=d.imageBlob||(d.imageDataUrl?await (async()=>{try{const r=await fetch(d.imageDataUrl);return await r.blob();}catch(_){return null}})():null);
    if(savedBlob){
      const file=new File([savedBlob],'draft-cover.webp',{type:savedBlob.type||'image/webp',lastModified:Date.now()});
      if(typeof state!=='undefined')state.editor.pendingCoverFile=file;
      if(typeof state!=='undefined')state.editor.imageObjectUrl=URL.createObjectURL(savedBlob);
      const img=$('#editor-cover-preview');
      if(img){
        img.src=URL.createObjectURL(savedBlob);
        img.style.opacity='1';
      }
      if(typeof window.updateEditorPaletteFromImage==='function')window.updateEditorPaletteFromImage(img?.src||d.imageDataUrl);
    }

    window.showToast?.('Черновик открыт');
  }

  function wrapRenderProfile(){
    if(typeof window.renderProfile!=='function'||window.renderProfile.__draftWrapped)return false;
    const original=window.renderProfile;
    const wrapped=function(){
      const result=original.apply(this,arguments);
      setTimeout(injectProfileButton,30);
      return result;
    };
    wrapped.__draftWrapped=true;
    window.renderProfile=wrapped;
    return true;
  }

  function install(){
    if(document.documentElement.dataset.draftsWorkflow==='1')return;
    document.documentElement.dataset.draftsWorkflow='1';
    wrapRenderProfile();

    document.addEventListener('click',e=>{
      const save=e.target.closest?.('#editor-save-draft');
      if(save){
        e.preventDefault();
        e.stopImmediatePropagation();
        saveCurrentDraft();
        return;
      }
      if(e.target.closest?.('#saved-drafts-back')&&typeof state!=='undefined'&&state.section==='saved-drafts'){
        setTimeout(()=>window.openSection?.('profile'),0);
      }
    },true);

    const observer=new MutationObserver(()=>{
      if(typeof state!=='undefined'&&state.section==='profile')injectProfileButton();
    });
    const profileRoot=$('#profile-card');
    if(profileRoot)observer.observe(profileRoot,{childList:true,subtree:true});
    setTimeout(injectProfileButton,100);
  }

  function boot(){
    if(!wrapRenderProfile())setTimeout(boot,100);
    install();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
