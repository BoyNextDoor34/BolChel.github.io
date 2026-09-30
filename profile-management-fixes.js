/* Profile-management UX fixes: permissions, navigation state and management-page polish. */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function markProfileActive(){
    $$('.nav-item[data-section], .mobile-dock-item[data-section]').forEach(el=>{
      const active=el.dataset.section==='profile';
      el.classList.toggle('is-active',active);
      el.setAttribute('aria-current',active?'page':'false');
    });
  }

  function markSectionActive(){
    if(typeof state==='undefined')return;
    if(state.section==='profile-management')markProfileActive();
  }

  function updateDeleteAvailability(root=document){
    if(typeof state==='undefined'||state.admin)return;
    $$('.management-suggestion',root).forEach(card=>{
      const status=card.dataset.status||'';
      const canDelete=status==='pending'||status==='rejected';
      const button=$('[data-delete-suggestion]',card);
      if(!button)return;
      button.disabled=!canDelete;
      button.setAttribute('aria-disabled',canDelete?'false':'true');
      if(!canDelete){
        button.title=status==='pending_update'?'Изменения уже отправлены на проверку администратора.':'Опубликованную новость удалить здесь нельзя.';
        button.classList.add('is-disabled');
      }else{
        button.removeAttribute('title');
        button.classList.remove('is-disabled');
      }
    });
  }

  function install(){
    if(document.documentElement.dataset.profileManagementFixes==='1')return;
    document.documentElement.dataset.profileManagementFixes='1';

    const style=document.createElement('style');
    style.textContent=`
      .management-suggestion [data-delete-suggestion]:disabled,
      .management-suggestion [data-delete-suggestion].is-disabled{
        opacity:.45;cursor:not-allowed;pointer-events:none;
        filter:saturate(.35);
      }
      .nav-item[aria-current="page"],.mobile-dock-item[aria-current="page"]{font-weight:800;}
    `;
    document.head.appendChild(style);

    document.addEventListener('click',e=>{
      const management=e.target.closest?.('[data-management]');
      if(management){setTimeout(markProfileActive,0);}
      const back=e.target.closest?.('#profile-management-back');
      if(back){setTimeout(()=>{
        $$('.nav-item[data-section], .mobile-dock-item[data-section]').forEach(el=>{
          const active=el.dataset.section==='profile';
          el.classList.toggle('is-active',active);
          el.setAttribute('aria-current',active?'page':'false');
        });
      },0);}
    },true);

    const observer=new MutationObserver(()=>{
      markSectionActive();
      updateDeleteAvailability();
    });
    observer.observe(document.body,{subtree:true,childList:true});
    markSectionActive();
    updateDeleteAvailability();

    // The management page is rendered asynchronously by suggestions-workflow.js.
    // Re-run the permission state shortly after navigation without replacing its UI.
    [0,100,300,700,1200].forEach(ms=>setTimeout(()=>{
      markSectionActive();
      updateDeleteAvailability();
    },ms));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
