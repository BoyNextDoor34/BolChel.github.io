/* ===== Community system: comments, reactions, public profiles, moderation UI ===== */
(function(){
  'use strict';
  const S=()=>typeof state!=='undefined'?state:null;
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const roles={reader:'Читатель',admin:'Администратор',owner:'Владелец'};
  const icons={reader:'person',admin:'shield',owner:'verified_user'};
  const client=()=>S()?.supabase||null, me=()=>S()?.user||null, pme=()=>me()?.profile||null;
  const role=()=>pme()?.role||'reader', banned=()=>!!pme()?.is_banned;
  const staff=()=>role()==='admin'||role()==='owner';
  const canModerate=p=>!!p&&p.role!=='owner'&&((role()==='owner'&&['reader','admin'].includes(p.role))||(role()==='admin'&&p.role==='reader'));
  const canManageNews=n=>{if(!n||!me())return false;if(role()==='owner')return true;if(role()!=='admin')return false;const ar=S()?.authorProfiles?.[n.authorId]?.role;return String(n.authorId)===String(me().id)||ar==='reader';};
  const show=m=>window.showToast?.(m), avatar=p=>p?.avatar_url||(typeof DEFAULT_AVATAR!=='undefined'?DEFAULT_AVATAR:''), name=p=>p?.nickname||'Пользователь';
  const roleBadge=r=>'<span class="community-role-badge community-role-'+esc(r)+'"><span class="material-symbols-rounded">'+(icons[r]||icons.reader)+'</span>'+esc(roles[r]||roles.reader)+'</span>';
  const date=v=>{const d=new Date(v);return Number.isNaN(d.getTime())?'Дата неизвестна':d.toLocaleDateString(window.getInterfaceLocale?.() || 'ru-RU',{day:'numeric',month:'long',year:'numeric'});};
  const plural=(n,a,b,c)=>{const x=Math.abs(n)%100,y=x%10;return x>=11&&x<=14?c:y===1?a:y>=2&&y<=4?b:c;};
  function age(v){const d=new Date(v);if(Number.isNaN(d.getTime()))return'—';const n=new Date();let y=n.getFullYear()-d.getFullYear(),m=n.getMonth()-d.getMonth(),day=n.getDate()-d.getDate();if(day<0){m--;day+=new Date(n.getFullYear(),n.getMonth(),0).getDate();}if(m<0){y--;m+=12;}if(y)return y+' '+plural(y,'год','года','лет')+(m?' '+m+' '+plural(m,'месяц','месяца','месяцев'):'');if(m)return m+' '+plural(m,'месяц','месяца','месяцев');return day?day+' '+plural(day,'день','дня','дней'):'меньше суток';}
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  let publicProfileContext={id:null,profile:null,publications:[],palette:null};

  async function publicProfiles(ids){const sb=client();if(!sb)return{};const u=[...new Set(ids.filter(Boolean).map(String))];if(!u.length)return{};const r=await sb.from('community_public_profiles').select('id,nickname,role,avatar_url,bio,created_at,comment_score,publication_count').in('id',u);if(r.error)throw r.error;const out={};(r.data||[]).forEach(x=>out[x.id]=x);return out;}
  async function publicProfile(id){const sb=client();if(!sb)return null;const r=await sb.from('community_public_profiles').select('id,nickname,role,avatar_url,bio,created_at,comment_score,publication_count').eq('id',id).maybeSingle();if(r.error)throw r.error;return r.data||null;}
  async function moderationProfile(id){const sb=client();if(!sb||!staff())return null;const r=await sb.rpc('community_get_moderation_user',{p_user_id:id});if(r.error)throw r.error;return Array.isArray(r.data)?(r.data[0]||null):(r.data||null);}

  function commentHtml(c,authors,reactions,depth){const p=c.__author||authors[c.author_id]||{id:c.author_id,nickname:'Пользователь',role:'reader'};const own=String(me()?.id||'')===String(c.author_id),mod=staff()&&canModerate(p),score=num(c.score),rv=Number(reactions[c.id]||0),rep=c.__replies||[];const edited=!!c.__edited;return '<article class="community-comment '+(depth?'is-reply':'')+'" style="--community-depth:'+Math.min(depth,4)+'" data-comment-id="'+esc(c.id)+'">'+'<div class="community-comment-head"><button type="button" class="community-user-button" data-profile-id="'+esc(p.id||c.author_id)+'" aria-label="Открыть профиль"><img class="community-comment-avatar" src="'+esc(avatar(p))+'" alt=""></button><div class="community-comment-author"><div class="community-comment-author-line"><button type="button" class="community-profile-link" data-profile-id="'+esc(p.id||c.author_id)+'">'+esc(name(p))+'</button>'+roleBadge(p.role)+'</div><div class="community-comment-meta">'+esc(date(c.created_at))+(edited?' · Изменено':'')+'</div></div></div>'+'<div class="community-comment-body" data-comment-body>'+esc(c.body).replace(/\n/g,'<br>')+'</div>'+'<div class="community-comment-actions"><div class="community-vote-group"><button type="button" class="community-vote-button up '+(rv===1?'is-active':'')+'" data-comment-up="'+esc(c.id)+'" aria-label="Апвоут"><span class="material-symbols-rounded">arrow_upward</span></button><span class="community-score '+(score>0?'is-positive':score<0?'is-negative':'')+'">'+score+'</span><button type="button" class="community-vote-button down '+(rv===-1?'is-active':'')+'" data-comment-down="'+esc(c.id)+'" aria-label="Даунвоут"><span class="material-symbols-rounded">arrow_downward</span></button></div>'+'<button type="button" class="community-comment-action" data-comment-reply="'+esc(c.id)+'"><span class="material-symbols-rounded">reply</span>Ответить</button>'+(own?'<button type="button" class="community-comment-action" data-comment-edit="'+esc(c.id)+'"><span class="material-symbols-rounded">edit</span>Изменить</button>':'')+((own||mod)?'<button type="button" class="community-comment-action community-danger-action" data-comment-delete="'+esc(c.id)+'"><span class="material-symbols-rounded">delete</span>Удалить</button>':'')+(mod?'<button type="button" class="community-comment-action community-danger-action" data-comment-ban="'+esc(c.author_id)+'"><span class="material-symbols-rounded">block</span>Заблокировать</button>':'')+'</div>'+(own?'<div class="community-inline-edit hidden" data-comment-edit-form="'+esc(c.id)+'"><textarea maxlength="4000" rows="4">'+esc(c.body)+'</textarea><div class="community-reply-actions"><button type="button" class="text-button" data-comment-edit-cancel="'+esc(c.id)+'">Отмена</button><button type="button" class="filled-button" data-comment-edit-save="'+esc(c.id)+'">Сохранить</button></div></div>':'')+'<div class="community-reply-form hidden" data-reply-form="'+esc(c.id)+'"><textarea maxlength="4000" rows="3" placeholder="Ваш ответ…"></textarea><div class="community-reply-actions"><button type="button" class="text-button" data-reply-cancel="'+esc(c.id)+'">Отмена</button><button type="button" class="filled-button" data-reply-submit="'+esc(c.id)+'">Ответить</button></div></div>'+(rep.length?'<div class="community-replies">'+rep.map(x=>commentHtml(x,authors,reactions,depth+1)).join('')+'</div>':'')+'</article>';}

  async function loadComments(newsId){const sb=client();if(!sb)return{comments:[],profiles:{},reactions:{},roots:[]};const q=await sb.from('comments').select('id,news_id,author_id,parent_id,body,score,created_at,updated_at').eq('news_id',String(newsId)).order('created_at',{ascending:true}).limit(500);if(q.error)throw q.error;const comments=q.data||[],profiles=await publicProfiles(comments.map(x=>x.author_id)),reactions={};if(me()&&comments.length){const r=await sb.from('comment_reactions').select('comment_id,value').eq('user_id',me().id).in('comment_id',comments.map(x=>x.id));if(r.error)throw r.error;(r.data||[]).forEach(x=>reactions[x.comment_id]=x.value);}if(comments.length){try{const er=await sb.from('comment_edits').select('comment_id').in('comment_id',comments.map(x=>x.id));if(!er.error)(er.data||[]).forEach(x=>{const target=comments.find(item=>String(item.id)===String(x.comment_id));if(target)target.__edited=true;});}catch(_){}}const by=new Map();const roots=[];comments.forEach(c=>{c.__author=profiles[c.author_id];c.__replies=[];if(c.parent_id){const k=String(c.parent_id);if(!by.has(k))by.set(k,[]);by.get(k).push(c);}else{roots.push(c);}});const attach=c=>{c.__replies=by.get(String(c.id))||[];c.__replies.forEach(attach);};roots.forEach(attach);return{comments,profiles,reactions,roots};}

  function commentsShell(id){let top;if(!me())top='<div class="community-login-prompt"><div><strong>Присоединитесь к обсуждению</strong><p>Войдите в аккаунт, чтобы оставлять комментарии, отвечать и голосовать.</p></div><button type="button" class="filled-button" data-community-login>Войти</button></div>';else if(banned())top='<div class="community-ban-prompt"><div><strong>Комментарии недоступны</strong><p>Ваш аккаунт заблокирован'+(pme()?.ban_reason?': '+esc(pme().ban_reason):'.')+'</p></div></div>';else top='<form class="community-composer" data-community-composer><div class="community-composer-head"><img class="community-composer-avatar" src="'+esc(avatar(pme()))+'" alt=""><div><strong>'+esc(name(pme()))+'</strong><span>'+esc(roles[role()]||roles.reader)+'</span></div></div><textarea maxlength="4000" rows="4" placeholder="Поделитесь своим мнением…"></textarea><div class="community-composer-footer"><span class="community-counter">0 / 4000</span><button type="submit" class="filled-button">Опубликовать</button></div></form>';return '<section class="community-comments" data-news-id="'+esc(id)+'"><div class="community-section-heading"><div><span class="eyebrow">Обсуждение</span><h2>Комментарии</h2></div><span class="community-comments-count" data-comments-count>0</span></div>'+top+'<div class="community-comments-list" data-comments-list><div class="media-note">Загрузка комментариев…</div></div></section>';}

  async function renderComments(m){try{const d=await loadComments(m.dataset.newsId);$('[data-comments-count]',m).textContent=String(d.comments.length);$('[data-comments-list]',m).innerHTML=d.roots.length?d.roots.map(c=>commentHtml(c,d.profiles,d.reactions,0)).join(''):'<div class="community-empty"><span class="material-symbols-rounded">forum</span><strong>Пока никто не оставил комментарий.</strong><span>Станьте первым, кто выскажется.</span></div>';bind(m);}catch(e){$('[data-comments-list]',m).innerHTML='<div class="media-note">Не удалось загрузить комментарии: '+esc(e.message||'неизвестная ошибка')+'</div>';}}
  async function add(newsId,body,parent){const sb=client();if(!sb||!me())throw Error('Сначала войдите в аккаунт.');if(banned())throw Error(pme()?.ban_reason?'Ваш аккаунт заблокирован: '+pme().ban_reason:'Ваш аккаунт заблокирован.');body=String(body||'').trim();if(!body)throw Error('Комментарий не может быть пустым.');const rpc=await sb.rpc('community_create_comment',{p_news_id:String(newsId),p_body:body,p_parent_id:parent||null});if(!rpc.error)return;const missing=rpc.error.code==='PGRST202'||/schema cache|Could not find the function/i.test(String(rpc.error.message||''));if(!missing)throw rpc.error;const direct=await sb.from('comments').insert({news_id:String(newsId),author_id:me().id,parent_id:parent||null,body}).select('id').single();if(direct.error)throw direct.error;}
  async function react(id,value){const sb=client();if(!sb||!me()){window.openAuth?.('login');return;}if(banned())throw Error('Ваш аккаунт заблокирован.');const current=await sb.from('comment_reactions').select('value').eq('comment_id',id).eq('user_id',me().id).maybeSingle();if(current.error)throw current.error;if(current.data&&Number(current.data.value)===value){const q=await sb.from('comment_reactions').delete().eq('comment_id',id).eq('user_id',me().id);if(q.error)throw q.error;return;}if(current.data){const q=await sb.from('comment_reactions').update({value}).eq('comment_id',id).eq('user_id',me().id);if(q.error)throw q.error;return;}const q=await sb.from('comment_reactions').insert({comment_id:id,user_id:me().id,value});if(q.error)throw q.error;}
  async function del(id){const r=await client().rpc('community_delete_comment',{p_comment_id:id});if(r.error)throw r.error;}
  function ensureBanDialog(){let d=$('#community-ban-dialog');if(d)return d;d=document.createElement('dialog');d.id='community-ban-dialog';d.className='modal-dialog community-ban-dialog';d.innerHTML='<form method="dialog" novalidate class="dialog-card"><div class="dialog-header"><div><span class="eyebrow">Модерация</span><h2>Блокировка пользователя</h2></div><button type="button" class="icon-button" data-community-ban-close aria-label="Закрыть"><span class="material-symbols-rounded">close</span></button></div><p class="community-ban-dialog-note">Укажите причину блокировки. Она сохранится в профиле и будет доступна модераторам.</p><label class="field"><span>Причина блокировки</span><textarea id="community-ban-reason" maxlength="500" rows="5" placeholder="Например: неоднократное нарушение правил сообщества"></textarea></label><div class="dialog-actions"><button type="button" data-community-ban-close class="text-button">Отмена</button><button type="submit" value="confirm" class="filled-button">Заблокировать</button></div></form>';document.body.appendChild(d);d.querySelectorAll('[data-community-ban-close]').forEach(b=>b.onclick=()=>d.close('cancel'));return d;}
async function banUser(id){const d=ensureBanDialog();const form=d.querySelector('form');const field=$('#community-ban-reason',d);field.value='';return await new Promise(resolve=>{const finish=ok=>{d.removeEventListener('close',onclose);if(ok){const reason=field.value.trim();if(!reason){show('Причина блокировки обязательна.');resolve(false);return;}client().rpc('community_ban_user',{p_user_id:id,p_reason:reason}).then(r=>{if(r.error){show(r.error.message||'Не удалось заблокировать пользователя.');resolve(false);}else{show('Пользователь заблокирован.');resolve(true);}}).catch(e=>{show(e.message||'Не удалось заблокировать пользователя.');resolve(false);});}else resolve(false);};const onclose=()=>finish(d.returnValue==='confirm');d.addEventListener('close',onclose,{once:true});d.showModal();field.focus();});}

  function bind(m){
    const installTextareaEnter=(textarea,submit)=>{
      if(!textarea||textarea.dataset.enterSubmitBound==='1')return;
      textarea.dataset.enterSubmitBound='1';
      textarea.addEventListener('keydown',event=>{
        if(event.isComposing||event.key!=='Enter'||event.shiftKey||event.ctrlKey||event.metaKey||event.altKey)return;
        event.preventDefault();
        submit?.();
      });
    };
    const f=$('[data-community-composer]',m);if(f){const t=$('textarea',f),counter=$('.community-counter',f);t.oninput=()=>counter.textContent=t.value.length+' / 4000';installTextareaEnter(t,()=>f.requestSubmit?.());f.onsubmit=async e=>{e.preventDefault();try{await add(m.dataset.newsId,t.value);t.value='';show('Комментарий опубликован.');await renderComments(m);}catch(x){show(x.message||'Не удалось опубликовать комментарий.');}};}$$('[data-comment-edit]',m).forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const form=$('[data-comment-edit-form="'+CSS.escape(btn.dataset.commentEdit)+'"]',m);if(!form)return;form.dataset.originalBody=$('textarea',form)?.value||'';installTextareaEnter($('textarea',form),()=>form.querySelector('[data-comment-edit-save]')?.click());$$('.community-inline-edit',m).forEach(x=>{if(x!==form)x.classList.add('hidden');});form.classList.remove('hidden');$('textarea',form)?.focus();}));
$$('[data-comment-reply]',m).forEach(btn=>btn.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      if(!me()){window.openAuth?.('login');return;}
      if(banned()){show('Ваш аккаунт заблокирован.');return;}
      const form=$('[data-reply-form="'+CSS.escape(btn.dataset.commentReply)+'"]',m);
      if(!form)return;
      $$('.community-reply-form',m).forEach(x=>{if(x!==form)x.classList.add('hidden');});
      form.classList.toggle('hidden');
      if(!form.classList.contains('hidden')){
        const textarea=$('textarea',form);
        installTextareaEnter(textarea,()=>form.querySelector('[data-reply-submit]')?.click());
        textarea?.focus();
      }
    }));
$$('[data-comment-edit-cancel]',m).forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const form=$('[data-comment-edit-form="'+CSS.escape(btn.dataset.commentEditCancel)+'"]',m);form?.classList.add('hidden');}));
$$('[data-comment-edit-save]',m).forEach(btn=>btn.addEventListener('click',async e=>{e.preventDefault();e.stopPropagation();const id=btn.dataset.commentEditSave;const form=$('[data-comment-edit-form="'+CSS.escape(id)+'"]',m);const field=$('textarea',form);const original=String(form?.dataset.originalBody??field?.defaultValue??'').trim();const body=String(field?.value||'').trim();if(body===original){form?.classList.add('hidden');return;}if(!body)return show('Комментарий не может быть пустым.');if(body.length>4000)return show('Комментарий не может быть длиннее 4000 символов.');try{const q=await client().from('comments').update({body}).eq('id',id).eq('author_id',me().id);if(q.error)throw q.error;try{const meta=await client().from('comment_edits').upsert({comment_id:id,editor_id:me().id,edited_at:new Date().toISOString()},{onConflict:'comment_id'});if(meta.error&&meta.error.code!=='PGRST205'&&!/schema cache|relation .* does not exist|could not find/i.test(String(meta.error.message||'')))console.warn(meta.error);}catch(_){ }show('Комментарий изменён.');await renderComments(m);}catch(x){show(x.message||'Не удалось изменить комментарий.');}}));
m.onclick=async e=>{const p=e.target.closest?.('[data-profile-id]');if(p){e.preventDefault();e.stopPropagation();openPublicProfile(p.dataset.profileId);return;}if(e.target.closest?.('[data-community-login]')){window.openAuth?.('login');return;}const edit=e.target.closest?.('[data-comment-edit]');if(edit){const form=$('[data-comment-edit-form="'+CSS.escape(edit.dataset.commentEdit)+'"]',m);if(form){form.dataset.originalBody=$('textarea',form)?.value||'';$$('.community-inline-edit',m).forEach(x=>x!==form&&x.classList.add('hidden'));form.classList.toggle('hidden');if(!form.classList.contains('hidden'))$('textarea',form)?.focus();}return;}const cancelEdit=e.target.closest?.('[data-comment-edit-cancel]');if(cancelEdit){$('[data-comment-edit-form="'+CSS.escape(cancelEdit.dataset.commentEditCancel)+'"]',m)?.classList.add('hidden');return;}const saveEdit=e.target.closest?.('[data-comment-edit-save]');if(saveEdit){const form=$('[data-comment-edit-form="'+CSS.escape(saveEdit.dataset.commentEditSave)+'"]',m);const t=$('textarea',form);const original=String(form?.dataset.originalBody??t?.defaultValue??'').trim();const body=String(t?.value||'').trim();if(body===original){form?.classList.add('hidden');return;}if(!body)return show('Комментарий не может быть пустым.');if(body.length>4000)return show('Комментарий не может быть длиннее 4000 символов.');try{const q=await client().from('comments').update({body}).eq('id',saveEdit.dataset.commentEditSave).eq('author_id',me().id);if(q.error)throw q.error;try{await client().from('comment_edits').upsert({comment_id:saveEdit.dataset.commentEditSave,editor_id:me().id,edited_at:new Date().toISOString()},{onConflict:'comment_id'});}catch(_){}show('Комментарий изменён.');await renderComments(m);}catch(x){show(x.message||'Не удалось изменить комментарий.');}return;}const cancel=e.target.closest?.('[data-reply-cancel]');if(cancel){$('[data-reply-form="'+CSS.escape(cancel.dataset.replyCancel)+'"]',m)?.classList.add('hidden');return;}const rs=e.target.closest?.('[data-reply-submit]');if(rs){const form=$('[data-reply-form="'+CSS.escape(rs.dataset.replySubmit)+'"]',m);try{await add(m.dataset.newsId,$('textarea',form).value,rs.dataset.replySubmit);await renderComments(m);}catch(x){show(x.message||'Не удалось опубликовать ответ.');}return;}const up=e.target.closest?.('[data-comment-up]');if(up){try{const started=performance.now();up.classList.remove('is-reacting-up');void up.offsetWidth;up.classList.add('is-reacting-up');await react(up.dataset.commentUp,1);const remaining=Math.max(0,260-(performance.now()-started));await new Promise(resolve=>setTimeout(resolve,remaining));await renderComments(m);}catch(x){up.classList.remove('is-reacting-up');show(x.message||'Не удалось поставить реакцию.');}return;}const dn=e.target.closest?.('[data-comment-down]');if(dn){try{const started=performance.now();dn.classList.remove('is-reacting-down');void dn.offsetWidth;dn.classList.add('is-reacting-down');await react(dn.dataset.commentDown,-1);const remaining=Math.max(0,260-(performance.now()-started));await new Promise(resolve=>setTimeout(resolve,remaining));await renderComments(m);}catch(x){dn.classList.remove('is-reacting-down');show(x.message||'Не удалось поставить реакцию.');}return;}const d=e.target.closest?.('[data-comment-delete]');if(d){const ok=window.siteConfirm?await window.siteConfirm('Комментарий будет удалён. Это действие нельзя отменить.',{eyebrow:'Модерация',title:'Удалить комментарий?',confirmLabel:'Удалить',danger:true}):confirm('Удалить комментарий?');if(ok)try{await del(d.dataset.commentDelete);await renderComments(m);}catch(x){show(x.message||'Не удалось удалить комментарий.');}return;}const b=e.target.closest?.('[data-comment-ban]');if(b)try{await banUser(b.dataset.commentBan);await renderComments(m);}catch(x){show(x.message||'Не удалось заблокировать пользователя.');}};}

  async function mountArticle(n){const root=$('#article-page');if(!root||!n?.id)return;root.querySelector('.community-comments')?.remove();const r=$('.article-reading',root);if(!r)return;const holder=document.createElement('div');holder.innerHTML=commentsShell(n.id);const m=holder.firstElementChild;const div=$('.article-divider',r);div?div.insertAdjacentElement('afterend',m):r.appendChild(m);const by=$('.article-byline',root);if(by&&n.authorId){by.dataset.profileId=n.authorId;by.tabIndex=0;by.setAttribute('role','button');by.classList.add('community-clickable-byline');}if(role()==='admin'&&!canManageNews(n)){root.querySelector('#article-edit')?.remove();root.querySelector('#article-delete')?.remove();}await renderComments(m);}
  function newsCards(root){if(!root)return;$$('.news-card',root).forEach(card=>{const n=S()?.news?.find(x=>String(x.id)===String(card.dataset.id));const a=$('.news-card-body .news-meta span:first-child',card);if(n?.authorId&&a&&!a.dataset.profileId){a.dataset.profileId=n.authorId;a.classList.add('community-inline-profile-link');a.setAttribute('role','button');a.tabIndex=0;}});}

  function ensurePublic(){let s=$('#section-public-profile');if(s)return s;const m=$('#main');if(!m)return null;s=document.createElement('section');s.id='section-public-profile';s.className='page-section';s.setAttribute('aria-labelledby','public-profile-heading');m.appendChild(s);return s;}
  async function openPublicProfile(id){
    if(!id)return;
    const st=S(); st.previousSection=st.section==='public-profile'?'news':st.section; ensurePublic(); window.openSection?.('public-profile');
    $('#page-title').textContent='Профиль пользователя'; $('#page-category').textContent=''; window.syncPrimaryNavigation?.('profile');
    const s=$('#section-public-profile');
    const back=()=>{const t=st.previousSection||'news';window.openSection?.(t);if(t==='article')window.renderArticle?.();if(t==='profile')window.renderProfile?.();};
    s.innerHTML='<div class="community-public-profile"><div class="community-public-profile-head"><button type="button" class="icon-button" data-public-profile-back aria-label="Назад"><span class="material-symbols-rounded">arrow_back</span></button><div><span class="eyebrow">Участник сообщества</span><h1 id="public-profile-heading">Профиль</h1></div></div><div class="media-note">Загрузка профиля…</div></div>';
    $('[data-public-profile-back]',s).onclick=back;
    try{
      const p=await publicProfile(id);
      if(!p){s.querySelector('.media-note').textContent='Профиль не найден.';return;}
      const q=await client().from('news').select('id,category,title,summary,image_url,published_at').eq('author_id',id).order('published_at',{ascending:false});
      const pubs=q.error?[]:q.data||[];
      publicProfileContext={id,profile:p,publications:pubs,palette:null};
      try{const pal=await window.generateM3ContentPaletteFromImage?.(avatar(p));if(pal)publicProfileContext.palette=pal;}catch(_){}
      let moderationHtml='';
      if(staff()&&canModerate(p)){try{const mp=await moderationProfile(id);if(mp?.is_banned)moderationHtml='<div class="community-profile-moderation"><strong>Пользователь заблокирован</strong><span>'+esc(mp.ban_reason||'Причина не указана')+'</span><button type="button" class="text-button" data-public-unban="'+esc(id)+'">Разблокировать</button></div>';else moderationHtml='<div class="community-profile-moderation"><button type="button" class="text-button community-danger-action" data-public-ban="'+esc(id)+'">Заблокировать пользователя</button></div>';}catch(_){}}
      const preview=pubs.slice(0,3);
      s.innerHTML='<div class="community-public-profile"><div class="community-public-profile-head"><button type="button" class="icon-button" data-public-profile-back aria-label="Назад"><span class="material-symbols-rounded">arrow_back</span></button><div><span class="eyebrow">Участник сообщества</span><h1 id="public-profile-heading">'+esc(name(p))+'</h1></div></div><div class="community-public-profile-grid"><article class="surface-card community-profile-hero-card"><div class="community-public-profile-hero"><img class="community-public-avatar" src="'+esc(avatar(p))+'" alt="Аватар"><div><h2>'+esc(name(p))+'</h2>'+roleBadge(p.role)+'</div></div><div class="community-public-bio">'+esc(p.bio||'Пользователь пока ничего о себе не рассказал.')+'</div><div class="community-profile-stats"><div><span>Регистрация</span><strong>'+esc(date(p.created_at))+'</strong><small>'+esc(age(p.created_at))+'</small></div><div><span>Чистые реакции</span><strong>'+num(p.comment_score)+'</strong><small>на комментариях</small></div><div><span>Публикации</span><strong>'+num(p.publication_count)+'</strong><small>материалов</small></div></div>'+moderationHtml+'</article><section class="community-publications"><div class="community-section-heading"><div><span class="eyebrow">Архив автора</span><h2>Все публикации</h2></div></div><div class="community-public-publications-list">'+(preview.length?preview.map(n=>'<article class="community-public-publication" data-news-id="'+esc(n.id)+'" tabindex="0"><div class="community-public-publication-image"><img src="'+esc(n.image_url||'')+'" alt="" loading="lazy"></div><div class="community-public-publication-content"><div class="community-public-publication-meta"><span>'+esc(n.category||'')+'</span><span>'+esc(date(n.published_at))+'</span></div><h3>'+esc(n.title||'Без названия')+'</h3><p>'+esc(n.summary||'')+'</p></div></article>').join(''):'<div class="community-empty"><span class="material-symbols-rounded">article</span><strong>Публикаций пока нет.</strong></div>')+'</div>'+(pubs.length?'<button type="button" class="tonal-button community-show-all-publications" data-public-show-all><span class="material-symbols-rounded">list</span>Показать все</button>':'')+'</section></div></div>';
      $('[data-public-profile-back]',s).onclick=back;
      $$('.community-public-publication',s).forEach(x=>{x.onclick=()=>window.openArticle?.(x.dataset.newsId);x.onkeydown=e=>{if(e.key==='Enter')x.click();};});
      $('[data-public-show-all]',s)?.addEventListener('click',openPublicationsPage);
      $('[data-public-ban]',s)?.addEventListener('click',async()=>{try{if(await banUser(id))openPublicProfile(id);}catch(e){show(e.message||'Не удалось заблокировать пользователя.');}});
      $('[data-public-unban]',s)?.addEventListener('click',async()=>{const q=await client().rpc('community_unban_user',{p_user_id:id});if(q.error)return show(q.error.message||'Не удалось разблокировать пользователя.');show('Пользователь разблокирован.');openPublicProfile(id);});
      if(publicProfileContext.palette)window.applySitePalette?.(publicProfileContext.palette);
    }catch(e){s.querySelector('.media-note').textContent=e.message||'Не удалось загрузить профиль.';}
  }

  function openPublicationsPage(){
    const ctx=publicProfileContext;if(!ctx?.profile)return;ensurePublicationsSection();window.openSection?.('public-publications');
    $('#page-title').textContent='Все публикации';$('#page-category').textContent='';
    const s=$('#section-public-publications');if(!s)return;
    s.innerHTML='<div class="community-publications-page"><div class="community-publications-page-head"><button type="button" class="icon-button" data-publications-back aria-label="Назад"><span class="material-symbols-rounded">arrow_back</span></button><div><span class="eyebrow">Архив автора</span><h1>Все публикации</h1></div></div><div class="community-publications-page-intro"><div class="community-publications-page-author"><img src="'+esc(avatar(ctx.profile))+'" alt=""><div><strong>'+esc(name(ctx.profile))+'</strong>'+roleBadge(ctx.profile.role)+'</div></div></div><div class="community-publications-page-list">'+(ctx.publications.length?ctx.publications.map(n=>'<article class="community-public-publication community-public-publication-full" data-news-id="'+esc(n.id)+'" tabindex="0"><div class="community-public-publication-image"><img src="'+esc(n.image_url||'')+'" alt="" loading="lazy"></div><div class="community-public-publication-content"><div class="community-public-publication-meta"><span>'+esc(n.category||'')+'</span><span>'+esc(date(n.published_at))+'</span></div><h2>'+esc(n.title||'Без названия')+'</h2><p>'+esc(n.summary||'')+'</p></div></article>').join(''):'<div class="community-empty"><span class="material-symbols-rounded">article</span><strong>Публикаций пока нет.</strong></div>')+'</div></div>';
    $('[data-publications-back]',s).onclick=()=>{window.openSection?.('public-profile');$('#page-title').textContent='Профиль пользователя';$('#page-category').textContent='';if(publicProfileContext.palette)window.applySitePalette?.(publicProfileContext.palette);};
    $$('.community-public-publication-full',s).forEach(x=>{x.onclick=()=>window.openArticle?.(x.dataset.newsId);x.onkeydown=e=>{if(e.key==='Enter')x.click();};});
    if(publicProfileContext.palette)window.applySitePalette?.(publicProfileContext.palette);
  }

  function ensurePublicationsSection(){let s=$('#section-public-publications');if(s)return s;const m=$('#main');if(!m)return null;s=document.createElement('section');s.id='section-public-publications';s.className='page-section';s.setAttribute('aria-labelledby','public-publications-heading');m.appendChild(s);return s;}

  function ownProfile(root){if(!root||!me())return;const p=pme(),r=$('.profile-role',root);if(r)r.innerHTML=roleBadge(p.role);const main=$('.profile-main',root);const details=root.querySelector('.profile-details-group');if(!main||!details)return;details.innerHTML='<h3>Сведения</h3><div class="community-profile-stat-row"><span>Email</span><strong>'+esc(me().email||'—')+'</strong></div><div class="community-own-stat"><span>Регистрация</span><strong>'+esc(date(p.created_at))+'</strong></div><div class="community-own-stat"><span>Возраст аккаунта</span><strong>'+esc(age(p.created_at))+'</strong></div><div class="community-own-stat"><span>Чистые реакции</span><strong data-own-score>…</strong></div><div class="community-own-stat"><span>Публикации</span><strong data-own-pubs>…</strong></div>'+(banned()?'<div class="community-own-ban"><strong>Аккаунт заблокирован</strong><span>'+esc(p.ban_reason||'Причина не указана')+'</span></div>':'');publicProfile(me().id).then(x=>{if(x){$('[data-own-score]',details).textContent=String(num(x.comment_score));$('[data-own-pubs]',details).textContent=String(num(x.publication_count));}}).catch(()=>{});if(role()==='owner'&&!main.querySelector('.community-owner-tools')){const t=document.createElement('div');t.className='community-owner-tools';t.innerHTML='<div class="profile-details-divider"></div><button type="button" class="tonal-button" data-owner-users style="width:100%;margin-top:14px"><span class="material-symbols-rounded">manage_accounts</span>Управление пользователями</button>';main.appendChild(t);const ownerButton=t.querySelector('[data-owner-users]');if(ownerButton)ownerButton.onclick=e=>{e.preventDefault();e.stopPropagation();users();};window.__communityOpenUserManagement=users;}}
  async function users(){if(role()!=='owner')return;let s=$('#section-user-management');if(!s){s=document.createElement('section');s.id='section-user-management';s.className='page-section';$('#main')?.appendChild(s);}window.openSection?.('user-management');$('#page-title').textContent='Пользователи';window.syncPrimaryNavigation?.('profile');s.innerHTML='<div class="community-user-management"><div class="profile-management-page-head"><button type="button" class="icon-button" data-user-back aria-label="Назад"><span class="material-symbols-rounded">arrow_back</span></button><h2>Управление пользователями</h2></div><div class="community-user-management-list"><div class="media-note">Загрузка…</div></div></div>';$('[data-user-back]',s).onclick=()=>{window.openSection?.('profile');window.renderProfile?.();};try{const r=await client().rpc('community_list_users');if(r.error)throw r.error;const list=$('.community-user-management-list',s);list.innerHTML=(r.data||[]).map(p=>'<article class="community-user-management-row"><img src="'+esc(avatar(p))+'" alt="" class="community-management-avatar"><div class="community-user-management-main"><div class="community-user-management-name">'+esc(name(p))+' '+roleBadge(p.role)+'</div><div class="community-user-management-meta">Регистрация: '+esc(date(p.created_at))+' · '+esc(age(p.created_at))+' · '+num(p.comment_score)+' чистых реакций · '+num(p.publication_count)+' публикаций</div>'+(p.is_banned?'<div class="community-management-ban-note">Заблокирован: '+esc(p.ban_reason||'Причина не указана')+'</div>':'')+(p.role==='owner'?'<span class="community-owner-protected"><span class="material-symbols-rounded">verified_user</span>Защищённый владелец</span>':'<div class="community-user-management-actions">'+(p.role==='reader'?'<button type="button" class="tonal-button" data-set-role="'+esc(p.id)+'" data-new-role="admin">Назначить администратором</button>':'<button type="button" class="tonal-button" data-set-role="'+esc(p.id)+'" data-new-role="reader">Снять администратора</button>')+(p.is_banned?'<button type="button" class="text-button" data-unban="'+esc(p.id)+'">Разблокировать</button>':'<button type="button" class="text-button community-danger-action" data-ban-user="'+esc(p.id)+'">Заблокировать</button>')+'</div>')+'</div></article>').join('')||'<div class="media-note">Пользователей пока нет.</div>';list.querySelectorAll('[data-set-role]').forEach(b=>b.onclick=async()=>{const q=await client().rpc('community_set_role',{p_user_id:b.dataset.setRole,p_role:b.dataset.newRole});if(q.error)return show(q.error.message||'Не удалось изменить роль пользователя.');show(b.dataset.newRole==='admin'?'Пользователь назначен администратором.':'Права администратора сняты.');users();});list.querySelectorAll('[data-ban-user]').forEach(b=>b.onclick=async()=>{try{await banUser(b.dataset.banUser);users();}catch(e){show(e.message||'Не удалось заблокировать пользователя.');}});list.querySelectorAll('[data-unban]').forEach(b=>b.onclick=async()=>{const q=await client().rpc('community_unban_user',{p_user_id:b.dataset.unban});if(q.error)return show(q.error.message);show('Пользователь разблокирован.');users();});}catch(e){$('.community-user-management-list',s).innerHTML='<div class="media-note">'+esc(e.message||'Не удалось загрузить пользователей.')+'</div>';}}

  function styles(){if($('#community-system-style'))return;const s=document.createElement('style');s.id='community-system-style';s.textContent=''+
  '.community-comments{margin:32px 0 42px;padding:24px 0 0;border-top:1px solid var(--md-sys-color-outline-variant)}.community-section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:18px}.community-section-heading h2{margin-top:6px}.community-comments-count{min-width:34px;height:30px;padding:0 10px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;background:var(--md-sys-color-primary-container);color:var(--md-sys-color-on-primary-container);font-weight:750}'+
  '.community-composer,.community-login-prompt,.community-ban-prompt{border:1px solid var(--md-sys-color-outline-variant);border-radius:22px;background:var(--md-sys-color-surface-container);padding:16px}.community-composer-head{display:flex;align-items:center;gap:11px;margin-bottom:12px}.community-composer-head>div{display:grid;gap:2px}.community-composer-head span{color:var(--md-sys-color-on-surface-variant);font-size:12px}.community-composer-avatar,.community-comment-avatar{width:42px;height:42px;border-radius:50%;object-fit:cover;background:var(--md-sys-color-surface-container-high)}'+
  '.community-inline-edit{margin-top:11px;padding:16px;border:1px solid var(--md-sys-color-outline-variant);border-radius:22px;background:var(--md-sys-color-surface-container)}.community-inline-edit textarea{width:100%;box-sizing:border-box;resize:vertical;min-height:92px;border:1px solid var(--md-sys-color-outline);border-radius:16px;padding:12px 14px;background:var(--md-sys-color-surface);color:var(--md-sys-color-on-surface);outline:none;font:inherit;line-height:1.5}.community-inline-edit textarea:focus{border-color:var(--md-sys-color-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--md-sys-color-primary) 18%,transparent)}.community-inline-edit.hidden{display:none}.community-composer textarea,.community-reply-form textarea{width:100%;box-sizing:border-box;resize:vertical;min-height:92px;border:1px solid var(--md-sys-color-outline);border-radius:16px;padding:12px 14px;background:var(--md-sys-color-surface);color:var(--md-sys-color-on-surface);outline:none}.community-composer textarea:focus,.community-reply-form textarea:focus{border-color:var(--md-sys-color-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--md-sys-color-primary) 18%,transparent)}.community-composer-footer,.community-reply-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px}.community-counter{font-size:12px;color:var(--md-sys-color-on-surface-variant)}.community-login-prompt,.community-ban-prompt{display:flex;align-items:center;justify-content:space-between;gap:16px}.community-login-prompt p,.community-ban-prompt p{margin:4px 0 0;font-size:13px}.community-comments-list{display:grid;gap:12px;margin-top:18px}'+
  '.community-comment{padding:16px;border:1px solid var(--md-sys-color-outline-variant);border-radius:20px;background:var(--md-sys-color-surface-container-low)}.community-comment.is-reply{margin-left:clamp(16px,calc(var(--community-depth) * 22px),66px);border-radius:18px}.community-comment-head{display:flex;align-items:center;gap:10px}.community-user-button{width:42px;height:42px;flex:0 0 42px;padding:0;border:0;background:transparent;border-radius:50%;cursor:pointer;overflow:hidden}.community-user-button:hover{box-shadow:0 0 0 3px color-mix(in srgb,var(--md-sys-color-primary) 18%,transparent)}.community-comment-author-line{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.community-profile-link,.community-inline-profile-link{border:0;background:none;padding:0;color:var(--md-sys-color-on-surface);font:inherit;font-weight:700;cursor:pointer;text-align:left}.community-profile-link:hover,.community-inline-profile-link:hover{color:var(--md-sys-color-primary);text-decoration:underline}.community-clickable-byline{cursor:pointer;border-radius:12px;padding:3px 6px;margin:-3px -6px}.community-clickable-byline:hover{background:var(--md-sys-color-surface-container-high)}.community-comment-meta{margin-top:2px;color:var(--md-sys-color-on-surface-variant);font-size:12px}.community-role-badge{display:inline-flex;align-items:center;gap:4px;min-height:24px;padding:0 8px;border-radius:999px;background:var(--md-sys-color-secondary-container);color:var(--md-sys-color-on-secondary-container);font-size:11px;font-weight:700}.community-role-badge .material-symbols-rounded{font-size:15px}.community-role-admin{background:var(--md-sys-color-primary-container);color:var(--md-sys-color-on-primary-container)}.community-role-owner{background:color-mix(in srgb,var(--md-sys-color-tertiary) 16%,var(--md-sys-color-surface));color:var(--md-sys-color-tertiary)}'+
  '.community-comment-body{margin:14px 0 12px;color:var(--md-sys-color-on-surface);font-size:15px;line-height:1.65;overflow-wrap:anywhere}.community-comment-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.community-vote-group{display:inline-flex;align-items:center;gap:4px;padding:2px 5px;border:1px solid var(--md-sys-color-outline-variant);border-radius:999px;background:var(--md-sys-color-surface)}.community-vote-button{width:34px;height:34px;padding:0;border:0;border-radius:50%;display:grid;place-items:center;background:transparent;color:var(--md-sys-color-on-surface-variant);cursor:pointer;transform-origin:center}.community-vote-button.is-reacting-up{animation:community-vote-pop .26s cubic-bezier(.2,.8,.3,1)}.community-vote-button.is-reacting-down{animation:community-vote-shake .26s cubic-bezier(.2,.8,.3,1)}@keyframes community-vote-pop{0%{transform:scale(1)}35%{transform:scale(1.28) rotate(-7deg)}65%{transform:scale(.92) rotate(4deg)}100%{transform:scale(1) rotate(0)}}@keyframes community-vote-shake{0%{transform:scale(1)}35%{transform:scale(1.18) rotate(7deg)}65%{transform:scale(.92) rotate(-5deg)}100%{transform:scale(1) rotate(0)}}.community-vote-button:hover{background:var(--md-sys-color-surface-container-high);color:var(--md-sys-color-primary)}.community-vote-button.down:hover{color:var(--md-sys-color-error)}.community-vote-button.is-active.up{background:var(--md-sys-color-primary-container);color:var(--md-sys-color-primary)}.community-vote-button.is-active.down{background:color-mix(in srgb,var(--md-sys-color-error) 18%,var(--md-sys-color-surface));color:var(--md-sys-color-error)}.community-score{min-width:28px;text-align:center;font-size:13px;font-weight:800}.community-score.is-positive{color:var(--md-sys-color-primary)}.community-score.is-negative{color:var(--md-sys-color-error)}.community-comment-action{min-height:36px;padding:0 10px;border:1px solid transparent;border-radius:999px;background:transparent;color:var(--md-sys-color-on-surface-variant);display:inline-flex;align-items:center;gap:5px;cursor:pointer;font:inherit;font-size:12px}.community-comment-action:hover{background:var(--md-sys-color-surface-container-high)}.community-danger-action{color:var(--md-sys-color-error)}.community-ban-dialog{width:min(520px,calc(100vw - 24px));max-width:calc(100vw - 24px);border:1px solid var(--md-sys-color-outline-variant);border-radius:28px;background:var(--md-sys-color-surface-container);color:var(--md-sys-color-on-surface)}.community-ban-dialog::backdrop{background:color-mix(in srgb,#000 48%,transparent);}.community-ban-dialog-note{font-size:13px;line-height:1.55}.community-ban-dialog .dialog-card{padding:24px}.community-reply-form{margin-top:11px;padding:12px;border-radius:16px;background:var(--md-sys-color-surface)}.community-replies{display:grid;gap:10px;margin-top:12px}.community-empty{display:grid;place-items:center;gap:5px;padding:34px 18px;text-align:center;color:var(--md-sys-color-on-surface-variant);border:1px dashed var(--md-sys-color-outline);border-radius:20px}.community-empty .material-symbols-rounded{font-size:28px;color:var(--md-sys-color-primary)}'+
  '.community-own-stat{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid var(--md-sys-color-outline-variant);font-size:13px;line-height:1.4}.community-profile-stat-row{font-size:13px;line-height:1.4}.community-own-details h3{margin:0 0 8px}.community-own-details .community-own-stat,.community-profile-stat-row{font-size:13px;line-height:1.4}.community-profile-stat-row{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid var(--md-sys-color-outline-variant)}.community-profile-stat-row span{color:var(--md-sys-color-on-surface-variant)}.community-profile-stat-row strong{max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.community-own-stat span{color:var(--md-sys-color-on-surface-variant)}.community-own-stat strong{text-align:right}.community-own-ban{margin-top:12px;padding:12px;border-radius:16px;background:color-mix(in srgb,var(--md-sys-color-error) 10%,var(--md-sys-color-surface));border:1px solid color-mix(in srgb,var(--md-sys-color-error) 28%,var(--md-sys-color-outline-variant));display:grid;gap:4px}.community-own-ban strong{color:var(--md-sys-color-error)}'+
  '.community-public-profile,.community-user-management{width:100%;box-sizing:border-box}.profile-details-divider{height:1px;background:var(--md-sys-color-outline-variant);margin:22px 0 18px}.profile-details-group h3,.community-own-stats h3{margin:0 0 8px}.community-public-profile-head{display:flex;align-items:center;gap:12px;margin-bottom:20px}.community-public-profile-grid{display:grid;grid-template-columns:minmax(280px,.8fr) minmax(0,1.5fr);gap:18px}.community-profile-hero-card{padding:22px}.community-public-profile-head .icon-button{display:inline-grid;place-items:center;align-self:center;flex:0 0 44px;width:44px;height:44px;margin:0}.community-public-profile-head h1{margin:0;line-height:1.05}.community-show-all-publications{width:100%;justify-content:center;margin-top:12px}.community-profile-moderation{margin-top:16px;padding:12px 14px;border:1px solid var(--md-sys-color-outline-variant);border-radius:16px;background:var(--md-sys-color-surface-container);display:grid;gap:6px}.community-profile-moderation strong{color:var(--md-sys-color-error)}.community-profile-moderation span{font-size:12px;color:var(--md-sys-color-on-surface-variant)}.community-publications-page{width:100%;box-sizing:border-box}.community-publications-page-head{display:flex;align-items:center;gap:12px;margin-bottom:18px}.community-publications-page-head .icon-button{display:inline-grid;place-items:center;align-self:center;flex:0 0 44px;width:44px;height:44px;margin:0}.community-publications-page-head h1{margin:0;line-height:1.05}.community-publications-page-intro{display:flex;align-items:center;gap:16px;margin-bottom:14px;padding:14px 16px;border:1px solid var(--md-sys-color-outline-variant);border-radius:18px;background:var(--md-sys-color-surface-container)}.community-publications-page-author{display:flex;align-items:center;gap:11px;min-width:0}.community-publications-page-author img{width:44px;height:44px;border-radius:50%;object-fit:cover}.community-publications-page-author>div{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.community-publications-page-list{display:grid;gap:12px}.community-public-publication-full{grid-template-columns:180px minmax(0,1fr)}.community-public-publication-full h2{margin:6px 0 0;font-size:20px}.community-public-profile-hero{display:flex;align-items:center;gap:15px}.community-public-avatar{width:88px;height:88px;border-radius:50%;object-fit:cover;background:var(--md-sys-color-surface-container-high)}.community-public-bio{margin-top:18px;color:var(--md-sys-color-on-surface-variant);line-height:1.62;white-space:pre-wrap}.community-profile-stats{display:grid;gap:8px;margin-top:18px}.community-profile-stats>div{padding:11px 0;border-radius:16px;background:var(--md-sys-color-surface-container);display:grid;gap:2px}.community-public-bio{margin-left:0;margin-right:0}.community-profile-hero{padding:0}.community-profile-hero-card{padding-left:22px;padding-right:22px}.community-profile-stats span{font-size:11px;color:var(--md-sys-color-on-surface-variant);text-transform:uppercase;letter-spacing:.08em;font-weight:700}.community-profile-stats strong{font-size:19px}.community-profile-stats small{color:var(--md-sys-color-on-surface-variant);font-size:12px}.community-public-publications-list{display:grid;gap:12px}.community-public-publication{display:grid;grid-template-columns:150px minmax(0,1fr);gap:14px;padding:12px;border:1px solid var(--md-sys-color-outline-variant);border-radius:20px;background:var(--md-sys-color-surface-container);cursor:pointer}.community-public-publication:hover{background:var(--md-sys-color-surface-container-high)}.community-public-publication-image{height:106px;overflow:hidden;border-radius:14px;background:var(--md-sys-color-surface-container-high)}.community-public-publication-image img{width:100%;height:100%;object-fit:cover}.community-public-publication-content{min-width:0}.community-public-publication-meta{display:flex;gap:8px;flex-wrap:wrap;color:var(--md-sys-color-on-surface-variant);font-size:11px}.community-public-publication h3{margin-top:6px;font-size:19px;overflow-wrap:anywhere}.community-public-publication p{margin:7px 0 0;font-size:13px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}'+
  '.community-user-management-list{display:grid;gap:12px}.community-user-management-row{display:grid;grid-template-columns:52px minmax(0,1fr);gap:13px;padding:15px;border:1px solid var(--md-sys-color-outline-variant);border-radius:20px;background:var(--md-sys-color-surface-container)}.community-management-avatar{width:52px;height:52px;border-radius:50%;object-fit:cover}.community-user-management-name{display:flex;align-items:center;gap:7px;flex-wrap:wrap;font-weight:700}.community-user-management-meta{margin-top:5px;color:var(--md-sys-color-on-surface-variant);font-size:12px}.community-management-ban-note{margin-top:8px;padding:9px 11px;border-radius:13px;background:color-mix(in srgb,var(--md-sys-color-error) 9%,var(--md-sys-color-surface));font-size:12px}.community-user-management-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.community-owner-protected{display:inline-flex;align-items:center;gap:6px;margin-top:12px;color:var(--md-sys-color-primary);font-size:12px;font-weight:700}'+
  '@media(max-width:860px){.community-public-profile-grid{grid-template-columns:1fr}.community-public-publication{grid-template-columns:110px minmax(0,1fr)}.community-public-publication-full{grid-template-columns:110px minmax(0,1fr)}.community-public-publication-image{height:88px}.community-login-prompt,.community-ban-prompt{align-items:stretch;flex-direction:column}.community-login-prompt .filled-button{width:100%}.community-comment.is-reply{margin-left:16px}.community-user-management-actions{flex-direction:column}.community-user-management-actions button{width:100%}}@media(max-width:520px){.community-comment{padding:13px}.community-public-publication{grid-template-columns:1fr}.community-public-publication-image{height:150px}.community-comment-actions{gap:4px}}';
  document.head.appendChild(s);}
  function install(){if(document.documentElement.dataset.communitySystem==='1')return;document.documentElement.dataset.communitySystem='1';styles();window.__communityMountArticle=mountArticle;window.__communityEnhanceProfile=ownProfile;window.__communityEnhanceNewsCards=newsCards;window.__communityCanManageNews=canManageNews;window.openCommunityProfile=openPublicProfile;window.__communitySessionChanged=()=>{const m=$('.community-comments');if(m)renderComments(m);if(S()?.section==='profile')ownProfile($('#profile-card'));};window.addEventListener('interface-language-change',()=>{const m=$('.community-comments');if(m)renderComments(m);if(S()?.section==='profile')ownProfile($('#profile-card'));if(S()?.section==='public-profile'&&publicProfileContext.id)openPublicProfile(publicProfileContext.id);if(S()?.section==='public-publications'&&publicProfileContext.id)openPublications(publicProfileContext.id);});document.addEventListener('click',e=>{const el=e.target.closest?.('.community-clickable-byline,.community-inline-profile-link');if(el?.dataset.profileId){e.preventDefault();e.stopPropagation();openPublicProfile(el.dataset.profileId);}},true);document.addEventListener('keydown',e=>{const el=e.target?.closest?.('.community-clickable-byline,.community-inline-profile-link');if(el?.dataset.profileId&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openPublicProfile(el.dataset.profileId);}},true);}
  // This module is loaded at the end of <body>, so the DOM is already available
  // in normal page execution. Install immediately; waiting for DOMContentLoaded
  // would put us after app.js bootstrap and miss the first render.
  install();
  if(typeof state!=='undefined'){
    try{
      if(state.section==='news') window.__communityEnhanceNewsCards?.(document.getElementById('news-grid'));
      if(state.section==='profile') window.__communityEnhanceProfile?.(document.getElementById('profile-card'));
      if(state.section==='article' && state.articleId){
        const article=state.news?.find(n=>String(n.id)===String(state.articleId));
        if(article) window.__communityMountArticle?.(article);
      }
    }catch(error){ console.error('Community initial render enhancement failed:',error); }
  }
})();

/* Keyboard navigation for article comments. The existing comment actions remain
   mouse-accessible; this layer adds a Vim-like selection model on top. */
(function(){
  'use strict';
  let commentKeyboardEnabled=false;
  let selectedCommentId=null;
  let selectedActionIndex=-1;
  let observedRoot=null;
  let observer=null;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const comments=()=>$$('#article-page .community-comments .community-comment');
  const currentComment=()=>{
    const list=comments();
    if(!list.length)return null;
    return list.find(x=>String(x.dataset.commentId)===String(selectedCommentId))||list[0];
  };
  const actionsFor=comment=>comment?[...comment.querySelectorAll('[data-comment-reply],[data-comment-edit],[data-comment-delete],[data-comment-ban]')].filter(x=>!x.disabled):[];

  function show(message){window.showToast?.(message);}

  function syncSelection({focus=true,scroll=true}={}){
    const list=comments();
    if(!list.length){selectedCommentId=null;selectedActionIndex=-1;return null;}
    let current=list.find(x=>String(x.dataset.commentId)===String(selectedCommentId));
    if(!current){current=list[0];selectedCommentId=current.dataset.commentId;selectedActionIndex=-1;}
    list.forEach(x=>{
      const on=String(x.dataset.commentId)===String(selectedCommentId);
      x.classList.toggle('is-keyboard-selected',on);
      x.setAttribute('aria-selected',String(on));
      x.tabIndex=on?0:-1;
    });
    const actions=actionsFor(current);
    if(selectedActionIndex>=actions.length)selectedActionIndex=Math.max(-1,actions.length-1);
    actions.forEach((button,index)=>button.classList.toggle('is-keyboard-selected',selectedActionIndex===index));
    if(focus){
      const target=selectedActionIndex>=0?actions[selectedActionIndex]:current;
      target?.focus?.({preventScroll:true});
    }
    if(scroll)current.scrollIntoView?.({block:'nearest',inline:'nearest',behavior:typeof getMotionBehavior==='function'?getMotionBehavior(): 'smooth'});
    return current;
  }

  function selectComment(delta){
    const list=comments();
    if(!list.length){show('В этой статье нет комментариев.');return;}
    const currentIndex=Math.max(0,list.findIndex(x=>String(x.dataset.commentId)===String(selectedCommentId)));
    const next=Math.max(0,Math.min(list.length-1,(selectedCommentId?currentIndex:0)+delta));
    if(!selectedCommentId)selectedActionIndex=-1;
    selectedCommentId=list[next].dataset.commentId;
    if(next!==currentIndex)selectedActionIndex=-1;
    syncSelection({focus:true,scroll:true});
  }

  function selectAction(delta){
    const comment=currentComment();
    if(!comment){show('Комментариев нет.');return;}
    const actions=actionsFor(comment);
    if(!actions.length){show('Для этого комментария нет доступных кнопок управления.');return;}
    const start=selectedActionIndex<0?0:selectedActionIndex;
    selectedActionIndex=(start+delta+actions.length)%actions.length;
    syncSelection({focus:true,scroll:true});
  }

  function activateSelectedAction(){
    const comment=currentComment();
    if(!comment)return;
    const actions=actionsFor(comment);
    if(selectedActionIndex>=0&&actions[selectedActionIndex]){
      actions[selectedActionIndex].click();
      return true;
    }
    const reply=comment.querySelector('[data-comment-reply]');
    if(reply){reply.click();return true;}
    return false;
  }

  function focusComposer(){
    const input=$('#article-page .community-comments [data-community-composer] textarea');
    if(input){input.focus();return true;}
    if(typeof window.openAuth==='function'){window.openAuth('login');return true;}
    show('Чтобы оставить комментарий, войдите в аккаунт.');
    return false;
  }

  function activateCommentAction(selector,message){
    const comment=currentComment();
    if(!comment)return false;
    const button=comment.querySelector(selector);
    if(!button){if(message)show(message);return false;}
    button.click();
    return true;
  }

  function ensureObserver(){
    const root=$('#article-page');
    if(!root||root===observedRoot)return;
    observer?.disconnect();
    observedRoot=root;
    observer=new MutationObserver(()=>{
      if(commentKeyboardEnabled&&comments().length){
        syncSelection({focus:false,scroll:false});
      }
    });
    observer.observe(root,{childList:true,subtree:true});
    if(comments().length)syncSelection({focus:false,scroll:false});
  }

  document.addEventListener('keydown',event=>{
    ensureObserver();
    const article=document.querySelector('#article-page .community-comments');
    if(!article)return;
    if(event.isComposing||event.ctrlKey||event.metaKey||event.altKey)return;
    const target=event.target;
    const editable=target?.matches?.('input,textarea,select,[contenteditable="true"]');
    if(editable||target?.closest?.('#whichkey-panel,dialog[open]'))return;

    const code=event.code;
    const key=event.key;

    /* Let native buttons/links keep their native Enter activation. */
    if(code==='Enter'&&target.matches?.('button,a[href],[role="button"]'))return;

    /* I is intentionally available even when comment keyboard mode is off. */
    if(code==='KeyI'){
      event.preventDefault();
      event.stopImmediatePropagation();
      focusComposer();
      return;
    }
    if(!commentKeyboardEnabled||!comments().length)return;

    const comment=currentComment();
    const selected=!!comment&&comment.classList.contains('is-keyboard-selected');

    if(code==='KeyJ'||code==='ArrowDown'){
      event.preventDefault();event.stopImmediatePropagation();selectComment(1);return;
    }
    if(code==='KeyK'||code==='ArrowUp'){
      event.preventDefault();event.stopImmediatePropagation();selectComment(-1);return;
    }
    if(code==='KeyH'||code==='ArrowLeft'){
      event.preventDefault();event.stopImmediatePropagation();selectAction(-1);return;
    }
    if(code==='KeyL'||code==='ArrowRight'){
      event.preventDefault();event.stopImmediatePropagation();selectAction(1);return;
    }
    if(code==='Enter'&&selected){
      event.preventDefault();event.stopImmediatePropagation();activateSelectedAction();return;
    }
    if(code==='KeyE'&&selected){if(activateCommentAction('[data-comment-edit]','Изменять можно только свой комментарий.')){event.preventDefault();event.stopImmediatePropagation();}return;}
    if(code==='KeyR'&&selected){if(activateCommentAction('[data-comment-reply]')){event.preventDefault();event.stopImmediatePropagation();}return;}
    if(code==='KeyD'&&selected){if(activateCommentAction('[data-comment-delete]','Удаление доступно только для своего комментария или модерации.')){event.preventDefault();event.stopImmediatePropagation();}return;}
    if(code==='KeyB'&&selected){if(activateCommentAction('[data-comment-ban]','Блокировка доступна только администратору или владельцу.')){event.preventDefault();event.stopImmediatePropagation();}return;}
    if(code==='KeyP'&&selected){if(activateCommentAction('.community-profile-link')){event.preventDefault();event.stopImmediatePropagation();}return;}
    /*
       The TKL "+" key is physically the "=" key with Shift. Some browsers/layouts
       expose the modifier state inconsistently, so use the physical key code as
       the stable shortcut while the comment-control mode is active.
    */
    const positiveReaction=selected&&(
      event.key==='+'
      || event.code==='Equal'
      || event.code==='NumpadAdd'
      || event.code==='Add'
    );
    if(positiveReaction){
      if(activateCommentAction('[data-comment-up]')){
        event.preventDefault();event.stopImmediatePropagation();
      }
      return;
    }
    const negativeReaction=selected&&(
      event.key==='-'
      || event.code==='Minus'
      || event.code==='NumpadSubtract'
      || event.code==='Subtract'
    );
    if(negativeReaction){
      if(activateCommentAction('[data-comment-down]')){
        event.preventDefault();event.stopImmediatePropagation();
      }
      return;
    }
  },true);

  function setKeyboardSelectionEnabled(enabled){
    commentKeyboardEnabled=Boolean(enabled);
    const list=comments();
    list.forEach(comment=>{
      comment.classList.remove('is-keyboard-selected');
      comment.removeAttribute('aria-selected');
      comment.removeAttribute('tabindex');
      comment.querySelectorAll('.community-comment-action.is-keyboard-selected,.community-vote-button.is-keyboard-selected')
        .forEach(button=>button.classList.remove('is-keyboard-selected'));
    });
    selectedCommentId=null;
    selectedActionIndex=-1;
    if(commentKeyboardEnabled){
      if(!list.length){
        show('В этой статье пока нет комментариев.');
        return false;
      }
      syncSelection({focus:true,scroll:true});
      show('Управление комментариями с клавиатуры включено.');
    }else{
      show('Управление комментариями с клавиатуры выключено.');
    }
    return commentKeyboardEnabled;
  }

  window.toggleCommentKeyboardNavigation=()=>{
    const next=!commentKeyboardEnabled;
    return setKeyboardSelectionEnabled(next);
  };

  function addStyle(){
    if($('#community-keyboard-style'))return;
    const style=document.createElement('style');style.id='community-keyboard-style';style.textContent=
      '.community-comment.is-keyboard-selected{outline:2px solid var(--md-sys-color-primary);outline-offset:3px}\n'+
      '.community-comment-action.is-keyboard-selected,.community-vote-button.is-keyboard-selected{outline:2px solid var(--md-sys-color-primary);outline-offset:2px}\n'+
      '.community-comment[aria-selected="false"]{outline-color:transparent}';
    document.head.appendChild(style);
  }

  document.addEventListener('keydown',event=>{
    const dialog=document.querySelector('#community-ban-dialog[open]');
    if(!dialog)return;
    const field=dialog.querySelector('#community-ban-reason');
    const cancel=dialog.querySelector('[data-community-ban-close]');
    const ok=dialog.querySelector('button[type="submit"]');
    if(!cancel||!ok)return;
    if(event.key==='ArrowLeft'||event.key==='ArrowUp'){
      event.preventDefault();event.stopImmediatePropagation();cancel.focus({preventScroll:true});return;
    }
    if(event.key==='ArrowRight'||event.key==='ArrowDown'){
      event.preventDefault();event.stopImmediatePropagation();ok.focus({preventScroll:true});return;
    }
    if(event.key==='Enter'&&document.activeElement!==field){
      event.preventDefault();event.stopImmediatePropagation();document.activeElement===cancel?cancel.click():ok.click();return;
    }
  },true);

  const boot=()=>{addStyle();ensureObserver();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
