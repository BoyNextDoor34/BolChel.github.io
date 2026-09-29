/* Turn profile management blocks into dedicated in-site pages without replacing the existing managers. */
(function(){
  'use strict';
  let installed=false;
  const $=(s,r=document)=>r.querySelector(s);

  function ensureStyles(){
    if($('#profile-management-pages-style')) return;
    const style=document.createElement('style');
    style.id='profile-management-pages-style';
    style.textContent=`
      .profile-tools{display:grid;gap:10px;margin-top:18px}
      .profile-tool-button{width:100%;min-height:64px;display:flex;align-items:center;gap:14px;justify-content:flex-start;text-align:left;padding:0 18px;border:1px solid var(--md-sys-color-outline-variant);border-radius:18px;background:var(--md-sys-color-surface-container);color:var(--md-sys-color-on-surface);cursor:pointer}
      .profile-tool-button:hover{background:var(--md-sys-color-secondary-container);color:var(--md-sys-color-on-secondary-container)}
      .profile-tool-button .material-symbols-rounded{font-size:25px}
      .profile-tool-copy{display:grid;gap:2px;min-width:0;flex:1}
      .profile-tool-title{font-weight:750}
      .profile-tool-description{font-size:12px;color:var(--md-sys-color-on-surface-variant);white-space:normal}
      .profile-tool-count{min-width:28px;height:28px;padding:0 8px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;background:var(--md-sys-color-primary-container);color:var(--md-sys-color-on-primary-container);font-size:12px;font-weight:800}
      .profile-subpage{display:none}
      .profile-subpage.is-visible{display:block}
      .profile-subpage .subpage-header{display:flex;align-items:flex-start;gap:16px;justify-content:space-between;margin-bottom:22px}
      .profile-subpage .subpage-header h1{margin:2px 0 0}
      .profile-subpage .subpage-header .text-button{flex:0 0 auto}
      .profile-subpage-content{min-width:0;width:100%;box-sizing:border-box}
      .profile-subpage-content>.admin-news-list,.profile-subpage-content>.admin-suggestions,.profile-subpage-content>.reader-suggestions{width:100%;max-width:none;box-sizing:border-box;min-width:0}
      .profile-subpage-content>.admin-suggestions{overflow:visible}
      .profile-subpage-content .admin-suggestion-row,.profile-subpage-content .reader-suggestion-row{width:100%;max-width:100%;box-sizing:border-box;min-width:0}
      @media(max-width:860px){
        .profile-subpage .subpage-header{align-items:stretch;flex-direction:column}
        .profile-subpage .subpage-header .text-button{align-self:flex-start}
      }
    `;
    document.head.appendChild(style);
  }

  function getMain(){return $('main')||document.querySelector('.app-main');}

  function ensurePage(kind){
    const id='profile-subpage-'+kind;
    let page=document.getElementById(id);
    if(page)return page;
    const main=getMain();if(!main)return null;
    page=document.createElement('section');
    page.id=id;
    page.className='page-section profile-subpage';
    page.setAttribute('aria-hidden','true');
    const title=kind==='news-management'?'Управление новостями':'Предложенные новости';
    const eyebrow=kind==='news-management'?'Администрирование':'Материалы';
    page.innerHTML='<div class="subpage-header"><div><span class="eyebrow">'+eyebrow+'</span><h1>'+title+'</h1></div><button class="text-button" type="button" data-profile-subpage-back><span class="material-symbols-rounded">arrow_back</span>Вернуться в профиль</button></div><div class="profile-subpage-content"></div>';
    main.appendChild(page);
    $('[data-profile-subpage-back]',page).onclick=()=>closePage();
    return page;
  }

  function closePage(){
    document.querySelectorAll('.profile-subpage').forEach(p=>{p.classList.remove('is-visible');p.setAttribute('aria-hidden','true');});
    if(typeof window.openSection==='function')window.openSection('profile');
    else document.getElementById('section-profile')?.classList.add('is-visible');
  }

  function openPage(kind){
    ensureStyles();
    const page=ensurePage(kind);if(!page)return;
    document.querySelectorAll('.profile-subpage').forEach(p=>{p.classList.toggle('is-visible',p===page);p.setAttribute('aria-hidden',p===page?'false':'true');});
    document.querySelectorAll('.page-section').forEach(p=>{if(!p.classList.contains('profile-subpage'))p.classList.remove('is-visible');});
    const content=$('.profile-subpage-content',page);
    const profile=document.getElementById('section-profile');
    if(kind==='news-management'){
      const list=profile?.querySelector('.admin-news-list');
      content.replaceChildren();
      if(list){list.hidden=false;list.removeAttribute('aria-hidden');content.appendChild(list);}
      else content.innerHTML='<div class="surface-card media-note">Управление новостями пока недоступно.</div>';
    }else{
      const box=profile?.querySelector('.admin-suggestions,.reader-suggestions');
      content.replaceChildren();
      if(box){box.hidden=false;box.removeAttribute('aria-hidden');content.appendChild(box);}
      else content.innerHTML='<div class="surface-card media-note">Предложения загружаются…</div>';
    }
    const profileNav=document.querySelector('#main-nav .nav-item[data-section="profile"]');
    const profileDock=document.querySelector('#mobile-dock .mobile-dock-item[data-section="profile"]');
    document.querySelectorAll('#main-nav .nav-item,#mobile-dock .mobile-dock-item').forEach(x=>x.classList.remove('is-active'));
    profileNav?.classList.add('is-active');profileDock?.classList.add('is-active');
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function findHeading(root,text){return [...root.querySelectorAll('h2,h3,h4')].find(x=>x.textContent.trim()===text);}

  function hideInlineBlock(node,heading,root){
    // Hide only the panel that directly contains the manager. Do not walk
    // up to the profile-layout itself: that also contains the right-hand
    // profile tools and would make the entire side panel disappear.
    const panel=node?.parentElement;
    const target=panel && panel!==root ? panel : node;
    target.hidden=true;
    target.setAttribute('aria-hidden','true');
  }

  function addTool(container,kind,title,description,icon,count){
    let button=container.querySelector('[data-profile-tool="'+kind+'"]');
    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.className='profile-tool-button';
      button.dataset.profileTool=kind;
      button.innerHTML='<span class="material-symbols-rounded">'+icon+'</span><span class="profile-tool-copy"><span class="profile-tool-title">'+title+'</span><span class="profile-tool-description">'+description+'</span></span><span class="profile-tool-count"></span><span class="material-symbols-rounded">chevron_right</span>';
      container.appendChild(button);
    }
    const badge=button.querySelector('.profile-tool-count');
    if(count===null||count===undefined||count===''||count==='0'){badge.hidden=count!=='0';if(count==='0')badge.textContent='0';}
    else{badge.hidden=false;badge.textContent=String(count);}
    button.onclick=()=>openPage(kind);
  }

  function collapseInlineBlocks(root){
    const managerList=root.querySelector('.admin-news-list');
    if(managerList){
      const heading=findHeading(root,'Управление новостями');
      const divider=heading?.previousElementSibling;
      hideInlineBlock(managerList,heading,root);
      heading?.remove();divider?.remove();
    }
    const suggestion=root.querySelector('.admin-suggestions,.reader-suggestions');
    if(suggestion){
      const heading=findHeading(root,'Предложенные новости');
      const divider=heading?.previousElementSibling;
      hideInlineBlock(suggestion,heading,root);
      heading?.remove();divider?.remove();
    }
  }

  function sync(){
    ensureStyles();
    const root=document.getElementById('profile-card');
    if(!root)return;
    let tools=root.querySelector('.profile-tools');
    if(!tools){tools=document.createElement('div');tools.className='profile-tools';root.appendChild(tools);}
    const admin=Boolean(root.querySelector('.admin-news-list'));
    const suggestions=root.querySelector('.admin-suggestions,.reader-suggestions');
    if(admin)addTool(tools,'news-management','Управление новостями','Редактирование, удаление и контроль опубликованных материалов','newspaper',null);
    const count=suggestions?.querySelector('.suggestion-count')?.textContent||null;
    addTool(tools,'suggestions','Предложенные новости',admin?'Проверка предложений пользователей и правок опубликованных новостей':'Ваши предложения и изменения','rate_review',count);
    collapseInlineBlocks(root);
  }

  function install(){
    if(installed)return;installed=true;ensureStyles();
    const original=window.renderProfile;
    if(typeof original==='function' && !original.__profileManagementWrapped){
      window.renderProfile=function(){
        const result=original.apply(this,arguments);
        setTimeout(sync,80);
        setTimeout(sync,500);
        return result;
      };
      window.renderProfile.__profileManagementWrapped=true;
    }
    const observer=new MutationObserver(()=>{
      if(document.getElementById('section-profile')?.classList.contains('is-visible'))setTimeout(sync,0);
    });
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(sync,500);
  }

  function boot(){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(typeof window.renderProfile==='function'){clearInterval(timer);install();}
      else if(tries>100)clearInterval(timer);
    },100);
  }
  boot();
})();
