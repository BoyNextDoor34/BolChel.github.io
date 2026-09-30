/* Final profile-management compatibility layer. It does not replace the existing workflow; it only fixes UI state and permissions. */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];

  function setProfileActive(){
    $$('.nav-item[data-section],.mobile-dock-item[data-section]').forEach(el=>{
      const active=el.dataset.section==='profile';
      el.classList.toggle('is-active',active);
      if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');
    });
  }

  function refreshDeleteState(){
    if(typeof state==='undefined'||state.admin)return;
    $$('.management-suggestion').forEach(card=>{
      const text=card.textContent||'';
      const status=card.dataset.status||(
        text.includes('Изменения ожидают проверки')?'pending_update':
        text.includes('Ожидает проверки')?'pending':
        text.includes('Отклонена')?'rejected':
        text.includes('Опубликована')?'approved':''
      );
      const buttons=$$('button',card).filter(b=>/delete|Удалить/i.test(`${b.textContent} ${b.querySelector('.material-symbols-rounded')?.textContent||''}`));
      buttons.forEach(button=>{
        const allowed=status==='pending'||status==='rejected';
        button.disabled=!allowed;
        button.setAttribute('aria-disabled',String(!allowed));
        if(!allowed){
          button.title=status==='pending_update'?'Изменения уже отправлены администратору на проверку.':'Опубликованную новость здесь удалить нельзя.';
          button.classList.add('is-disabled');
        }else{
          button.removeAttribute('title');
          button.classList.remove('is-disabled');
        }
      });
    });
  }

  function restoreAbout(){
    const section=$('#section-about');
    if(!section||section.dataset.aboutRestored==='1')return;
    const grid=$('.about-grid',section);
    if(!grid)return;
    section.dataset.aboutRestored='1';
    grid.innerHTML=`
      <article class="surface-card about-card">
        <div class="icon-badge"><span class="material-symbols-rounded">auto_awesome</span></div>
        <h2>Material Design 3</h2>
        <p>Весь дизайн сайта построен на основе системы Material 3 с открытым исходным кодом.</p>
      </article>
      <article class="surface-card about-card">
        <div class="icon-badge"><span class="material-symbols-rounded">palette</span></div>
        <h2>Динамическая генерация цветовой палитры</h2>
        <p>Благодаря MATUGEN цветовая палитра сайта генерируется на основе контента в каждой отдельной новости.</p>
      </article>
      <article class="surface-card about-card">
        <div class="icon-badge"><span class="material-symbols-rounded">keyboard</span></div>
        <h2>Навигация без мыши</h2>
        <p>На ПК поддерживается управление исключительно с клавиатуры, вдохновленное Neovim/Helix.</p>
      </article>
`;
  }

  function isolateSuggestionSaveButton(){
    const page=$('#editor-page');
    if(!page?.dataset.suggestionId)return;
    const old=$('#admin-save',page);
    if(!old||old.dataset.reliableSuggestionSave==='1')return;
    const replacement=old.cloneNode(true);
    replacement.id='admin-save-final';
    replacement.dataset.reliableSuggestionSave='1';
    replacement.removeAttribute('onclick');
    replacement.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      if(typeof window.saveSuggestionEditorReliable==='function')window.saveSuggestionEditorReliable();else if(typeof window.saveSuggestionEditorWorkflow==='function')window.saveSuggestionEditorWorkflow();
    });
    old.replaceWith(replacement);
  }

  function install(){
    if(document.documentElement.dataset.profileFinalFix==='1')return;
    document.documentElement.dataset.profileFinalFix='1';
    const style=document.createElement('style');
    style.textContent=`
      .management-suggestion button.is-disabled,.management-suggestion button:disabled{opacity:.45!important;cursor:not-allowed!important;pointer-events:none!important;filter:saturate(.35)}
      .nav-item[aria-current="page"],.mobile-dock-item[aria-current="page"]{font-weight:800}
      .editor-panes[data-editor-mode="edit"] .editor-pane-preview{display:none!important}
      .editor-panes[data-editor-mode="preview"] .editor-pane-input{display:none!important}
      .editor-panes[data-editor-mode="edit"] .editor-pane-input,.editor-panes[data-editor-mode="preview"] .editor-pane-preview{display:block!important}
    `;
    document.head.appendChild(style);

    document.addEventListener('click',e=>{
      if(e.target.closest?.('[data-management]'))setTimeout(setProfileActive,0);
      if(e.target.closest?.('#profile-management-back'))setTimeout(setProfileActive,0);
    },true);

    const observer=new MutationObserver(()=>{
      if(typeof state!=='undefined'&&state.section==='profile-management')setProfileActive();
      refreshDeleteState();
      restoreAbout();
      isolateSuggestionSaveButton();
    });
    observer.observe(document.body,{childList:true,subtree:true});
    [0,100,300,700,1500].forEach(ms=>setTimeout(()=>{
      if(typeof state!=='undefined'&&state.section==='profile-management')setProfileActive();
      refreshDeleteState();restoreAbout();isolateSuggestionSaveButton();
    },ms));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
