const CATEGORIES = [
  'Политика','Экономика','Общество','Технологии и наука','Культура','Спорт','Образование','Семья','Молодежь','Туризм','Военнообязанные'
];

const DEMO_NEWS = [
  { id:'1', category:'Технологии и наука', title:'Новая вычислительная архитектура обещает снизить энергозатраты ИИ', summary:'Исследователи представили подход к обработке моделей, ориентированный на энергоэффективность и локальные устройства.', date:'24 сентября 2026', time:'18:40', author:'Редакция', image:'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=82', accent:'#5a65d8' },
  { id:'2', category:'Общество', title:'Города расширяют общественные пространства для пешеходов', summary:'Муниципальные команды пересматривают сценарии использования центральных улиц и площадей.', date:'24 сентября 2026', time:'16:20', author:'Мария Орлова', image:'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1100&q=82', accent:'#2a7c72' },
  { id:'3', category:'Экономика', title:'Малый бизнес ускоряет переход на цифровые расчёты', summary:'Компании внедряют инструменты автоматизации учёта, платежей и аналитики продаж.', date:'24 сентября 2026', time:'14:10', author:'Илья Волков', image:'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1100&q=82', accent:'#6c5b3e' },
  { id:'4', category:'Культура', title:'Музеи запускают новые форматы цифровых выставок', summary:'Экспозиции объединяют физические объекты, архивы и интерактивные мультимедийные сценарии.', date:'24 сентября 2026', time:'12:45', author:'Алина Котова', image:'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=1100&q=82', accent:'#9a5f76' },
  { id:'5', category:'Спорт', title:'Как клубы используют аналитику для подготовки спортсменов', summary:'Трекеры и видеосистемы помогают тренерам детально разбирать нагрузку и технику.', date:'23 сентября 2026', time:'20:30', author:'Спорт-редакция', image:'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1100&q=82', accent:'#5e6e2e' },
  { id:'6', category:'Образование', title:'Школы тестируют гибридные лаборатории для естественных наук', summary:'Учебные центры добавляют цифровые измерительные комплексы и удалённый доступ к экспериментам.', date:'23 сентября 2026', time:'11:05', author:'Редакция', image:'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1100&q=82', accent:'#3f6b93' },
  { id:'7', category:'Семья', title:'Новые сервисы помогают планировать семейные дела', summary:'Приложения объединяют списки задач, календарь, покупки и общие напоминания.', date:'22 сентября 2026', time:'17:25', author:'Ольга Смирнова', image:'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=1100&q=82', accent:'#9a6046' },
  { id:'8', category:'Туризм', title:'Региональные маршруты переходят на единые цифровые карты', summary:'Новые путеводители связывают природные точки, музеи, транспорт и локальные события.', date:'22 сентября 2026', time:'09:50', author:'Редакция', image:'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1100&q=82', accent:'#3d7754' },
  { id:'9', category:'Молодежь', title:'Студенческие сообщества создают собственные медиапроекты', summary:'Кампусные редакции развивают подкасты, новостные дайджесты и события для своих аудиторий.', date:'21 сентября 2026', time:'15:15', author:'Редакция', image:'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1100&q=82', accent:'#6a5790' },
  { id:'10', category:'Военнообязанные', title:'Что меняется в цифровых государственных сервисах', summary:'Разбираем официально опубликованные изменения интерфейсов и уведомлений государственных платформ.', date:'21 сентября 2026', time:'10:25', author:'Редакция', image:'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1100&q=82', accent:'#526d7e' },
  { id:'11', category:'Политика', title:'Парламентские комитеты продолжают обсуждение новых инициатив', summary:'Краткий обзор публичных заседаний и опубликованных документов без оценок и агитации.', date:'20 сентября 2026', time:'19:05', author:'Редакция', image:'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1100&q=82', accent:'#655a8f' },
  { id:'12', category:'Общество', title:'Городские библиотеки открывают вечерние программы', summary:'Читальные залы дополняются лекциями, клубами и пространствами для самостоятельной работы.', date:'20 сентября 2026', time:'13:40', author:'Никита Павлов', image:'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1100&q=82', accent:'#6b6148' }
];

const state = {
  section:'news', category:null, news:[...DEMO_NEWS], user:null, admin:false, search:null,
  authMode:'login', supabase:null
};

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

const DEFAULT_AVATAR = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#6750a4"/><stop offset="1" stop-color="#9c8ad3"/></linearGradient></defs><rect width="256" height="256" rx="80" fill="url(#g)"/><circle cx="128" cy="106" r="44" fill="#fff" opacity=".96"/><path d="M54 224c6-49 37-71 74-71s68 22 74 71" fill="#fff" opacity=".96"/></svg>`);

const KEYMAP = [
  {group:'Навигация', keys:[['j / ↓','Следующая новость'],['k / ↑','Предыдущая новость'],['g n','Раздел «Новости»'],['g p','Профиль'],['g a','О нас'],['g 1…9','Выбрать категорию'],['Enter','Открыть выбранную новость'],['Esc','Закрыть окно']]},
  {group:'Система', keys:[['/','Поиск'],['t','Сменить светлую/тёмную тему'],['?','Показать эту справку'],['r','Случайная новость']]},
  {group:'WhichKey / Helix', keys:[['Space','Показать подсказки'],['Backspace','Скрыть/вернуться'],['Ctrl+D','Прокрутить справку вниз'],['Ctrl+U','Прокрутить справку вверх']]}
];

function showToast(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('is-visible');
  clearTimeout(showToast.t); showToast.t = setTimeout(()=>toast.classList.remove('is-visible'), 2400);
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem('news-theme', theme);
  $('#theme-icon').textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
}

function openSection(section) {
  state.section = section;
  $$('.page-section').forEach(el=>el.classList.toggle('is-visible', el.id === `section-${section}`));
  $$('#main-nav .nav-item').forEach(btn=>btn.classList.toggle('is-active', btn.dataset.section === section));
  $('#page-title').textContent = section === 'news' ? 'Новости' : section === 'profile' ? 'Профиль' : 'О нас';
  $('#page-category').textContent = state.category || (section === 'news' ? 'Все разделы' : '');
  if (section === 'profile') renderProfile();
}

function renderCategoryNav() {
  const root = $('#category-nav');
  root.innerHTML = '';
  const all = document.createElement('button');
  all.className = 'nav-item compact-item' + (!state.category ? ' is-active' : '');
  all.dataset.category = '';
  all.innerHTML = '<span class="material-symbols-rounded">grid_view</span><span>Все новости</span>';
  root.appendChild(all);
  CATEGORIES.forEach((category, index)=>{
    const btn = document.createElement('button');
    btn.className = 'nav-item compact-item' + (state.category === category ? ' is-active' : '');
    btn.dataset.category = category; btn.dataset.number = index < 9 ? String(index+1) : '';
    btn.innerHTML = `<span class="material-symbols-rounded">${['policy','payments','groups','science','museum','sports_soccer','school','family_restroom','diversity_1','travel_explore','verified_user'][index]}</span><span>${category}</span>${btn.dataset.number ? `<kbd>${btn.dataset.number}</kbd>`:''}`;
    root.appendChild(btn);
  });
}

function setCategory(category) {
  state.category = category || null;
  renderCategoryNav();
  $('#page-category').textContent = state.category || 'Все разделы';
  openSection('news');
  renderNews();
}

function renderNews() {
  const root = $('#news-grid');
  let items = state.news.filter(n => !state.category || n.category === state.category);
  if (state.search) {
    const q = state.search.toLowerCase();
    items = items.filter(n => `${n.title} ${n.summary} ${n.category}`.toLowerCase().includes(q));
  }
  if (!items.length) { root.innerHTML = '<div class="empty-state"><h2>Ничего не найдено</h2><p>Попробуйте другой раздел или поисковый запрос.</p></div>'; return; }
  root.innerHTML = items.map((n, i)=> cardTemplate(n, i===0 && !state.search && !state.category)).join('');
  root.querySelectorAll('.news-card').forEach(card=>card.addEventListener('click', ()=>openArticle(card.dataset.id)));
  applyDynamicAccents();
}

function cardTemplate(n, featured) {
  return `<article class="news-card ${featured ? 'featured' : ''}" data-id="${n.id}" style="--news-primary:${n.accent || '#6750a4'}">
    <div class="news-card-image"><img loading="lazy" src="${n.image}" alt="" onerror="this.style.display='none'"><div class="news-card-overlay">
      <div class="news-meta"><span class="category-pill" style="--news-primary:${n.accent || '#6750a4'}">${n.category}</span><span>${n.date} · ${n.time}</span></div>
      <div class="news-title">${n.title}</div><p class="news-summary">${n.summary}</p>
    </div></div>
    ${featured ? '' : `<div class="news-card-body"><div class="news-meta"><span>${n.author}</span><span>•</span><span>${n.date}</span></div><div class="news-title">${n.title}</div><p class="news-summary">${n.summary}</p></div>`}
  </article>`;
}

function hexToRgb(hex) { const h=hex.replace('#',''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
function rgbToHex([r,g,b]) { return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join(''); }
function mix(a,b,t){ return a.map((v,i)=>Math.round(v*(1-t)+b[i]*t)); }
function relativeLuma(rgb) { return (0.2126*rgb[0]+0.7152*rgb[1]+0.0722*rgb[2])/255; }
function applyDynamicAccents() {
  // Runtime fallback for static hosting: sample the image's dominant-ish accent and build a Material-like tonal pair.
  // A production pipeline can replace `accent` with a matugen-generated JSON palette.
  $$('.news-card').forEach(card=>{
    const n = state.news.find(x=>x.id===card.dataset.id); if (!n) return;
    const img = $('img', card); const accent = hexToRgb(n.accent || '#6750a4');
    const dark = relativeLuma(accent) < .45;
    const primary = dark ? mix(accent,[255,255,255],.22) : mix(accent,[0,0,0],.12);
    const container = dark ? mix(accent,[255,255,255],.55) : mix(accent,[255,255,255],.82);
    card.style.setProperty('--news-primary', rgbToHex(primary));
    card.style.setProperty('--news-container', rgbToHex(container));
    card.style.setProperty('--news-image-luma', relativeLuma(accent));
    img?.addEventListener('load', ()=>card.dataset.paletteReady='1', {once:true});
  });
}

function openArticle(id) {
  const n = state.news.find(x=>x.id===id); if (!n) return;
  const dialog = $('#article-dialog');
  $('#article-body').innerHTML = `<img class="article-hero" src="${n.image}" alt=""><div class="article-content" style="--news-primary:${n.accent || '#6750a4'}"><div class="news-meta"><span class="category-pill" style="--news-primary:${n.accent || '#6750a4'}">${n.category}</span><span>${n.date} · ${n.time}</span></div><h1>${n.title}</h1><p class="article-lead">${n.summary}</p><p class="article-text">Редакционный материал демонстрационного интерфейса. Здесь может находиться полный текст статьи, изображения, цитаты, ссылки на источники и дополнительные блоки. Карточка получает собственную акцентную палитру от изображения материала, а контент остаётся читаемым в светлой и тёмной теме.</p><p class="article-text">Автор: <strong>${n.author}</strong></p></div>`;
  dialog.showModal();
}

function renderKeyHelp() {
  $('#whichkey-content').innerHTML = KEYMAP.map(group=>`<section class="key-group"><div class="key-group-title">${group.group}</div>${group.keys.map(([k,d])=>`<div class="key-row"><div class="key-combo">${k.split(' / ').map(x=>`<kbd>${x}</kbd>`).join('')}</div><div>${d}</div></div>`).join('')}</section>`).join('');
}
function toggleHelp(force) { $('#whichkey-panel').classList.toggle('is-open', force ?? !$('#whichkey-panel').classList.contains('is-open')); }

function renderProfile() {
  const root = $('#profile-card');
  if (!state.user) {
    root.innerHTML = `<article class="surface-card profile-main"><span class="eyebrow">Не авторизован</span><h2 style="margin-top:7px">Создайте профиль читателя</h2><p>Ник, аватар и поле «О себе» сохраняются в Supabase. Роль администратора может назначить только владелец проекта через базу данных.</p><button id="profile-signin" class="filled-button"><span class="material-symbols-rounded">login</span>Войти или зарегистрироваться</button></article><aside class="surface-card profile-side"><h3>Что доступно</h3><div class="stat-row"><span>Чтение новостей</span><strong>✓</strong></div><div class="stat-row"><span>Профиль</span><strong>✓</strong></div><div class="stat-row"><span>Публикация</span><strong>Только admin</strong></div></aside>`;
    $('#profile-signin').onclick = ()=>$('#auth-dialog').showModal();
    return;
  }
  const p = state.user.profile || {};
  root.innerHTML = `<article class="surface-card profile-main"><div class="profile-head"><img class="profile-avatar-large" src="${p.avatar_url || DEFAULT_AVATAR}" alt="Аватар"><div><div class="profile-name">${escapeHtml(p.nickname || state.user.email?.split('@')[0] || 'Пользователь')}</div><div class="profile-role">${p.role === 'admin' ? 'Администратор' : 'Читатель'}</div></div></div><p class="profile-bio">${escapeHtml(p.bio || 'Пока ничего не рассказано.')}</p><div style="margin-top:22px;display:flex;gap:8px;flex-wrap:wrap"><button id="edit-profile" class="filled-button"><span class="material-symbols-rounded">edit</span>Изменить профиль</button><button id="signout" class="tonal-button"><span class="material-symbols-rounded">logout</span>Выйти</button></div></article><aside class="surface-card profile-side"><h3>Сведения</h3><div class="stat-row"><span>Email</span><strong style="max-width:170px;overflow:hidden;text-overflow:ellipsis">${escapeHtml(state.user.email || '—')}</strong></div><div class="stat-row"><span>Роль</span><strong>${p.role === 'admin' ? 'admin' : 'reader'}</strong></div><div class="stat-row"><span>Админ-режим</span><strong>${p.role === 'admin' ? 'доступен' : 'нет'}</strong></div>${p.role === 'admin' ? '<button id="create-news" class="filled-button" style="width:100%;margin-top:14px"><span class="material-symbols-rounded">edit_note</span>Написать новость</button>' : ''}</aside>`;
  $('#edit-profile').onclick = ()=>openEditProfile(p);
  $('#signout').onclick = signOut;
  if($('#create-news')) $('#create-news').onclick = openAdminComposer;
}
function escapeHtml(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

function openEditProfile(p) {
  $('#profile-nickname').value = p.nickname || '';
  $('#profile-avatar').value = p.avatar_url || '';
  $('#profile-bio').value = p.bio || '';
  $('#profile-message').textContent='';
  $('#edit-profile-dialog').showModal();
}


function mapRemoteNews(row){
  return {
    id:row.id, category:row.category, title:row.title, summary:row.summary, body:row.body || '',
    date:new Date(row.published_at).toLocaleDateString('ru-RU',{day:'2-digit',month:'long',year:'numeric'}),
    time:new Date(row.published_at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}),
    author:'Редакция', image:row.image_url || 'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1100&q=82',
    accent:row.accent_hex || '#6750a4', palette:row.palette || null
  };
}

async function loadRemoteNews(){
  if(!state.supabase) return;
  try{
    const {data,error}=await state.supabase.from('news').select('id,author_id,category,title,summary,body,image_url,accent_hex,palette,published_at').order('published_at',{ascending:false});
    if(error) throw error;
    if(data?.length){ state.news=data.map(mapRemoteNews); renderNews(); }
  }catch(e){ console.warn('News load failed; keeping demo data', e); }
}

function openAdminComposer(){
  if(!state.admin){ showToast('Раздел доступен только администраторам'); return; }
  $('#news-category-input').innerHTML=CATEGORIES.map(c=>`<option value="${c}">${c}</option>`).join('');
  ['#news-title-input','#news-summary-input','#news-body-input','#news-image-input','#news-accent-input'].forEach(s=>$(s).value='');
  $('#admin-message').textContent=''; $('#admin-dialog').showModal();
}

async function saveNews(){
  const msg=$('#admin-message'); msg.textContent='';
  if(!state.supabase || !state.user || !state.admin){msg.textContent='Нужен аккаунт администратора.';return;}
  const payload={author_id:state.user.id,category:$('#news-category-input').value,title:$('#news-title-input').value.trim(),summary:$('#news-summary-input').value.trim(),body:$('#news-body-input').value.trim(),image_url:$('#news-image-input').value.trim()||null,accent_hex:$('#news-accent-input').value.trim()||null};
  try{
    const {error}=await state.supabase.from('news').insert(payload);
    if(error) throw error;
    $('#admin-dialog').close(); await loadRemoteNews(); showToast('Новость опубликована');
  }catch(e){msg.textContent=e.message||'Не удалось опубликовать новость.';}
}

async function initSupabase() {
  const cfg = window.SUPABASE_CONFIG;
  if (!cfg?.url || !cfg?.anonKey) return;
  try {
    const mod = await import('https://esm.sh/@supabase/supabase-js@2');
    state.supabase = mod.createClient(cfg.url, cfg.anonKey);
    const { data: { session } } = await state.supabase.auth.getSession();
    await handleSession(session);
    state.supabase.auth.onAuthStateChange(async (_event, session)=>handleSession(session));
  } catch (e) { console.warn('Supabase unavailable', e); }
}

async function handleSession(session) {
  state.user = session?.user ? { ...session.user } : null;
  if (state.user && state.supabase) {
    const { data: profile } = await state.supabase.from('profiles').select('*').eq('id', state.user.id).single();
    state.user.profile = profile || { nickname: state.user.email?.split('@')[0], role:'reader' };
    state.admin = state.user.profile.role === 'admin';
  } else { state.admin=false; }
  updateAuthUI();
  renderProfile();
}

function updateAuthUI(){
  const avatarBtn=$('#avatar-button'); const authBtn=$('#auth-button');
  if (state.user) {
    authBtn.classList.add('hidden'); avatarBtn.classList.remove('hidden'); $('#top-avatar').src = state.user.profile?.avatar_url || DEFAULT_AVATAR;
  } else { authBtn.classList.remove('hidden'); avatarBtn.classList.add('hidden'); }
}

function setAuthMode(mode){
  state.authMode=mode; $$('.segment').forEach(b=>b.classList.toggle('is-selected', b.dataset.authMode===mode));
  $('#auth-title').textContent=mode==='login'?'Вход':'Регистрация';
  $('#auth-submit').textContent=mode==='login'?'Войти':'Создать аккаунт';
  $('#auth-extra').classList.toggle('hidden', mode==='login');
  $('#auth-message').textContent='';
}

async function submitAuth(){
  const email=$('#auth-email').value.trim(); const password=$('#auth-password').value; const nickname=$('#auth-nickname').value.trim();
  const msg=$('#auth-message');
  if (!state.supabase) { msg.textContent='Supabase пока не подключён. Откройте supabase-config.js и добавьте URL/anon key.'; return; }
  msg.textContent='';
  try {
    if (state.authMode==='signup') {
      const { data, error }=await state.supabase.auth.signUp({email,password,options:{data:{nickname}}});
      if(error) throw error;
      msg.textContent = data.session ? 'Аккаунт создан.' : 'Аккаунт создан. Проверьте email для подтверждения.';
    } else {
      const { error }=await state.supabase.auth.signInWithPassword({email,password}); if(error) throw error;
      $('#auth-dialog').close();
    }
  } catch(e){ msg.textContent=e.message || 'Не удалось выполнить запрос.'; }
}

async function signOut(){ if(state.supabase) await state.supabase.auth.signOut(); else state.user=null; handleSession(null); showToast('Вы вышли из аккаунта'); }

async function saveProfile(){
  const msg=$('#profile-message'); msg.textContent='';
  if(!state.supabase || !state.user){msg.textContent='Сначала войдите в аккаунт.';return;}
  let avatarUrl=$('#profile-avatar').value.trim()||null;
  const file=$('#profile-avatar-file').files?.[0];
  try{
    if(file){
      const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
      const path=`${state.user.id}/${Date.now()}-${safeName}`;
      const upload=await state.supabase.storage.from('avatars').upload(path,file,{upsert:true,contentType:file.type});
      if(upload.error) throw upload.error;
      avatarUrl=state.supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    }
    const payload={id:state.user.id,nickname:$('#profile-nickname').value.trim(),avatar_url:avatarUrl,bio:$('#profile-bio').value.trim()};
    const {data,error}=await state.supabase.from('profiles').upsert(payload).select('*').single();
    if(error) throw error; state.user.profile=data; $('#edit-profile-dialog').close(); updateAuthUI(); renderProfile(); showToast('Профиль сохранён');
  }catch(e){msg.textContent=e.message||'Не удалось сохранить профиль.';}
}

function searchNews(){
  const value=prompt('Поиск новостей');
  state.search=(value||'').trim()||null;
  renderNews();
  showToast(state.search ? `Поиск: ${state.search}` : 'Поиск очищен');
}

let selectedNewsIndex=0;
function visibleNews(){
  return [...document.querySelectorAll('.news-card')];
}
function focusNews(delta){
  if(state.section!=='news') return;
  const cards=visibleNews(); if(!cards.length) return;
  selectedNewsIndex=Math.max(0,Math.min(cards.length-1,selectedNewsIndex+delta));
  cards[selectedNewsIndex].scrollIntoView({block:'center',behavior:'smooth'});
  cards[selectedNewsIndex].focus?.();
  cards[selectedNewsIndex].style.outline='3px solid color-mix(in srgb, var(--md-sys-color-primary) 60%, transparent)';
  clearTimeout(focusNews.t); focusNews.t=setTimeout(()=>cards[selectedNewsIndex].style.outline='',700);
}

let keyBuffer=''; let keyBufferTimer;
document.addEventListener('keydown',(e)=>{
  if(e.target.matches('input,textarea,select,[contenteditable="true"]')) return;
  const key=e.key;
  if(key==='Escape'){
    toggleHelp(false); if($('#article-dialog').open) $('#article-dialog').close(); if($('#auth-dialog').open) $('#auth-dialog').close(); if($('#edit-profile-dialog').open) $('#edit-profile-dialog').close(); return;
  }
  if(key==='?' || (key==='/' && !e.shiftKey)){ e.preventDefault(); if(key==='?') toggleHelp(); else searchNews(); return; }
  if(key===' ') { e.preventDefault(); toggleHelp(true); return; }
  if(key==='t'){ setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'); return; }
  if(key==='j' || key==='ArrowDown'){ e.preventDefault(); focusNews(1); return; }
  if(key==='k' || key==='ArrowUp'){ e.preventDefault(); focusNews(-1); return; }
  if(key==='Enter'){ const cards=visibleNews(); if(state.section==='news' && cards[selectedNewsIndex]) openArticle(cards[selectedNewsIndex].dataset.id); return; }
  if(key==='r'){ const item=state.news[Math.floor(Math.random()*state.news.length)]; openArticle(item.id); return; }
  if(key==='Backspace'){ toggleHelp(false); return; }
  keyBuffer += key.toLowerCase(); clearTimeout(keyBufferTimer); keyBufferTimer=setTimeout(()=>keyBuffer='',700);
  if(keyBuffer.endsWith('gn')) openSection('news');
  if(keyBuffer.endsWith('gp')) openSection('profile');
  if(keyBuffer.endsWith('ga')) openSection('about');
  if(/g[1-9]$/.test(keyBuffer)){ const idx=Number(keyBuffer.slice(-1))-1; if(idx<CATEGORIES.length) setCategory(CATEGORIES[idx]); }
});

$('#theme-toggle').onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
$('#keyboard-help').onclick=()=>toggleHelp(true); $('#close-help').onclick=()=>toggleHelp(false);
$('#search-button').onclick=searchNews; $('#random-news').onclick=()=>{const n=state.news[Math.floor(Math.random()*state.news.length)]; openArticle(n.id)};
$('#auth-button').onclick=()=>$('#auth-dialog').showModal(); $('#avatar-button').onclick=()=>openSection('profile');
$('#mobile-menu').onclick=()=>{ $('.app-nav').classList.add('is-open'); $('#mobile-scrim').classList.add('is-visible'); };
$('#mobile-scrim').onclick=()=>{$('.app-nav').classList.remove('is-open'); $('#mobile-scrim').classList.remove('is-visible');};
$('#close-article').onclick=()=>$('#article-dialog').close();
$$('#main-nav .nav-item').forEach(btn=>btn.onclick=()=>{openSection(btn.dataset.section); $('.app-nav').classList.remove('is-open'); $('#mobile-scrim').classList.remove('is-visible');});
$('#category-nav').onclick=(e)=>{const btn=e.target.closest('[data-category]'); if(btn) setCategory(btn.dataset.category);};
$$('.segment').forEach(btn=>btn.onclick=()=>setAuthMode(btn.dataset.authMode));
$('#auth-submit').onclick=submitAuth; $('#profile-save').onclick=saveProfile; $('#admin-save').onclick=saveNews;

renderCategoryNav(); renderNews(); renderKeyHelp(); setTheme(document.documentElement.dataset.theme || 'light'); renderProfile();
await initSupabase();
await loadRemoteNews();
