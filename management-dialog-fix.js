/* Route existing destructive actions through the site's Material 3 dialog. */
(function(){
  'use strict';
  let installed=false;
  function install(){
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
  if(!install()){
    const timer=setInterval(()=>{if(install())clearInterval(timer);},100);
    setTimeout(()=>clearInterval(timer),10000);
  }
})();
