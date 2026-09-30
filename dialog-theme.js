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
      message:isPublish?'Опубликовать эту версию новости?':(title?`Удалить новость «${title}»? Это действие необратимо.`:'Удалить новость? Это действие необратимо.'),
      eyebrow:isPublish?'Публикация':'Удаление',
      title:isPublish?'Опубликовать эту версию новости?':'Удалить новость?',
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
