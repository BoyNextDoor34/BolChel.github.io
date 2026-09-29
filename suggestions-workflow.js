/* Profile management pages for news administration and reader suggestions. */
(function(){
  'use strict';
  let installed=false;
  const $=(s,r=document)=>r.querySelector(s);
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function ensureStyles(){
    if($('#profile-management-pages-style'))return;
    const style=document.createElement('style');style.id='profile-management-pages-style';
    style.textContent=`
      .profile-management-links{display:grid;gap:10px;margin-top:18px;width:100%;min-width:0}
      .profile-management-link{width:100%;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border:1px solid var(--md-sys-color-outline-variant);border-radius:18px;background:var(--md-sys-color-surface-container);color:var(--md-sys-color-on-surface);cursor:pointer;text-align:left;font:inherit}
      .profile-management-link:hover{background:var(--md-sys-color-surface-container-high)}
      .profile-management-link-main{min-width:0;display:flex;align-items:center;gap:12px}
      .profile-management-link-main>div{min-width:0}
      .profile-management-link-title{font-weight:600;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .profile-management-link-note{display:block;font-size:12px;color:var(--md-sys-color-on-surface-variant);margin-top:2px}
      .profile-management-page{width:100%;box-sizing:border-box}
      .profile-management-page-head{display:flex;align-items:center;gap:12px;margin-bottom:18px}
      .profile-management-page-head h2{margin:0;min-width:0}
      .profile-management-back{flex:0 0 auto}
      .profile-management-content{width:100%;min-width:0;box-sizing:border-box;display:grid;gap:12px}
      .profile-management-card{width:100%;min-width:0;box-sizing:border-box;overflow:hidden;border:1px solid var(--md-sys-color-outline-variant);border-radius:20px;background:var(--md-sys-color-surface-container);padding:16px}
      .profile-management-card-title{font-weight:650;display:block;overflow-wrap:anywhere}
      .profile-management-card-meta{display:flex;flex-wrap:wrap;gap:6px 12px;margin-top:5px;color:var(--md-sys-color-on-surface-variant);font-size:13px}
      .profile-management-card-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
      @media(max-width:860px){.profile-management-page-head{align-items:flex-start}.profile-management-page-head h2{font-size:22px}.profile-management-card-actions{flex-direction:column}.profile-management-card-actions button{width:100%}}
    `;
    document.head.appendChild(style);
  }

  function openManagementPage(kind){
    if(typeof window.openSection!=='function')return;
    window.__profileManagementPage=kind;
    window.openSection('profile-management');
    setTimeout(renderManagementPage,0);
  }
  function closeManagementPage(){window.__profileManagementPage=null;window.openSection?.('profile');}

  function replaceProfilePanels(root){
    const side=$('.profile-side',root);if(!side)return;
    side.querySelectorAll('.admin-suggestions,.reader-suggestions,.admin-news-list').forEach(x=>x.remove());
    const existing=root.querySelector('.profile-management-links');if(existing)existing.remove();
    const box=document.createElement('div');box.className='profile-management-links';
    if(typeof state!=='undefined'&&state.admin){
      box.innerHTML=`<button type="button" class="profile-management-link" data-management="news"><span class="profile-management-link-main"><span class="material-symbols-rounded">article</span><span><span class="profile-management-link-title">Управление новостями</span><span class="profile-management-link-note">Все опубликованные материалы и их редактирование</span></span></span><span class="material-symbols-rounded">chevron_right</span></button><button type="button" class="profile-management-link" data-management="suggestions"><span class="profile-management-link-main"><span class="material-symbols-rounded">inbox</span><span><span class="profile-management-link-title">Предложенные новости</span><span class="profile-management-link-note">Проверка, редактирование и публикация предложений</span></span></span><span class="material-symbols-rounded">chevron_right</span></button>`;
    }else if(typeof state!=='undefined'&&state.user){
      box.innerHTML=`<button type="button" class="profile-management-link" data-management="suggestions"><span class="profile-management-link-main"><span class="material-symbols-rounded">inbox</span><span><span class="profile-management-link-title">Предложенные новости</span><span class="profile-management-link-note">Ваши предложения и отправленные на проверку изменения</span></span></span><span class="material-symbols-rounded">chevron_right</span></button>`;
    }else return;
    side.appendChild(box);
    box.querySelectorAll('[data-management]').forEach(b=>b.onclick=()=>openManagementPage(b.dataset.management));
  }

  function renderManagementPage(){
    if(typeof state==='undefined'||state.section!=='profile-management')return;
    const root=document.querySelector('#main')||document.querySelector('main');if(!root)return;
    const kind=window.__profileManagementPage||'suggestions';
    root.innerHTML=`<section class="profile-management-page"><div class="profile-management-page-head"><button type="button" class="icon-button profile-management-back" id="profile-management-back" aria-label="Вернуться в профиль"><span class="material-symbols-rounded">arrow_back</span></button><h2>${kind==='news'?'Управление новостями':'Предложенные новости'}</h2></div><div class="profile-management-content" id="profile-management-content"><div class="media-note">Загрузка…</div></div></section>`;
    $('#profile-management-back').onclick=closeManagementPage;
    const content=$('#profile-management-content');
    if(kind==='news')renderNewsManagement(content);else renderSuggestionsManagement(content);
  }

  function renderNewsManagement(content){
    const news=(state.news||[]).filter(n=>!String(n.id).startsWith('demo-'));
    content.innerHTML=news.length?news.map(n=>`<article class="profile-management-card"><span class="profile-management-card-title">${esc(n.title)}</span><div class="profile-management-card-meta"><span>${esc(n.category||'')}</span><span>${esc(n.date||'')}</span></div><div class="profile-management-card-actions"><button type="button" class="tonal-button" data-edit-news="${esc(n.id)}"><span class="material-symbols-rounded">edit</span>Редактировать</button><button type="button" class="text-button" data-delete-news="${esc(n.id)}"><span class="material-symbols-rounded">delete</span>Удалить</button></div></article>`).join(''):'<div class="media-note">Опубликованных новостей пока нет.</div>';
    content.querySelectorAll('[data-edit-news]').forEach(b=>b.onclick=()=>window.openEditor?.(b.dataset.editNews));
    content.querySelectorAll('[data-delete-news]').forEach(b=>b.onclick=()=>window.deleteNews?.(b.dataset.deleteNews));
  }

  async function renderSuggestionsManagement(content){
    if(typeof window.__renderSuggestionsManagement==='function')return window.__renderSuggestionsManagement(content);
    content.innerHTML='<div class="media-note">Интерфейс предложений загружается…</div>';
  }

  function install(){
    if(installed)return;installed=true;ensureStyles();
    const originalProfile=window.renderProfile;
    if(typeof originalProfile==='function')window.renderProfile=function(){const result=originalProfile.apply(this,arguments);setTimeout(()=>replaceProfilePanels(document.querySelector('#profile-card')),60);return result;};
    const originalOpen=window.openSection;
    if(typeof originalOpen==='function')window.openSection=function(section){const result=originalOpen.apply(this,arguments);if(section==='profile-management')setTimeout(renderManagementPage,20);return result;};
    setTimeout(()=>{if(state?.section==='profile')replaceProfilePanels(document.querySelector('#profile-card'));},500);
  }
  async function boot(){for(let i=0;i<100;i++){if(typeof window.renderProfile==='function'&&typeof window.openSection==='function')break;await sleep(100);}install();}
  boot();
})();
