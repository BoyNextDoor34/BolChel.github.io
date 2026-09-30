/* Route existing destructive actions through the site's Material 3 dialog and
   add reader deletion for their own unpublished suggestions. */
(function(){
  'use strict';
  let installed=false;
  const $=(s,r=document)=>r.querySelector(s);

  function installNewsDeleteDialog(){
    if(installed||typeof window.deleteNews!=='function')return false;
    installed=true;
    const original=window.deleteNews;
    window.deleteNews=async function(id){
      const item=typeof state!=='undefined'?state.news?.find(n=>String(n.id)===String(id)):null;
      const message=item?.title?`Удалить новость «${item.title}»? Это действие необратимо.`:'Удалить новость? Это действие необратимо.';
      if(typeof window.siteConfirm==='function'){
        const ok=await window.siteConfirm(message,{eyebrow:'Удаление',title:'Удалить новость?',confirmLabel:'Удалить',danger:true});
        if(!ok)return;
        const nativeConfirm=window.confirm;
        window.confirm=()=>true;
        try{return await original(id);}finally{window.confirm=nativeConfirm;}
      }
      return original(id);
    };
    return true;
  }

  async function deleteOwnSuggestion(id,button){
    if(typeof state==='undefined'||state.admin||!state.user||!state.supabase||!id)return;
    button.disabled=true;
    try{
      const ok=typeof window.siteConfirm==='function'
        ?await window.siteConfirm('Предложение будет удалено из ваших материалов. Опубликованные новости и изменения, уже отправленные на проверку, не затрагиваются.',{
            eyebrow:'Предложенные новости',title:'Удалить предложение?',confirmLabel:'Удалить',cancelLabel:'Отмена',danger:true
          })
        :window.confirm('Удалить это предложение?');
      if(!ok)return;

      const result=await state.supabase.from('news_submissions')
        .delete({count:'exact'})
        .eq('id',id)
        .eq('author_id',state.user.id)
        .in('status',['pending','rejected']);
      if(result.error)throw result.error;
      if(result.count===0)throw new Error('Предложение не удалено: оно уже опубликовано или недоступно вашему аккаунту.');

      const card=button.closest('.management-suggestion');
      card?.remove();
      const count=$('.management-count');
      if(count)count.textContent=String(Math.max(0,(Number(count.textContent)||1)-1));
      if(!document.querySelector('.management-suggestion')){
        const content=$('#profile-management-content');
        if(content){
          const list=content.querySelector('.management-suggestion')?.parentElement||content.lastElementChild;
          if(list)list.innerHTML='<div class="media-note">Вы ещё не предлагали новости.</div>';
        }
      }
      window.showToast?.('Предложение удалено');
    }catch(error){
      console.error('Suggestion deletion failed:',error);
      window.showToast?.(error?.message||'Не удалось удалить предложение.');
    }finally{button.disabled=false;}
  }

  function addSuggestionDeleteButtons(){
    if(typeof state==='undefined'||state.admin||!state.user)return;
    document.querySelectorAll('.management-suggestion').forEach(card=>{
      if(card.querySelector('[data-user-delete-suggestion],[data-user-delete]'))return;
      const edit=card.querySelector('[data-user-edit]');
      if(!edit)return;
      const status=(card.querySelector('.management-suggestion-status')?.textContent||'').trim();
      if(status!=='Ожидает проверки'&&status!=='Отклонена')return;
      const actions=card.querySelector('.management-suggestion-actions');
      if(!actions)return;
      const button=document.createElement('button');
      button.type='button';
      button.className='text-button';
      button.dataset.userDeleteSuggestion=edit.dataset.userEdit||'';
      button.innerHTML='<span class="material-symbols-rounded">delete</span>Удалить';
      actions.appendChild(button);
    });
  }

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-user-delete-suggestion]');
    if(!button)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    deleteOwnSuggestion(button.dataset.userDeleteSuggestion,button);
  },true);

  const observer=new MutationObserver(addSuggestionDeleteButtons);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  addSuggestionDeleteButtons();

  if(!installNewsDeleteDialog()){
    const timer=setInterval(()=>{if(installNewsDeleteDialog())clearInterval(timer);},100);
    setTimeout(()=>clearInterval(timer),10000);
  }
})();