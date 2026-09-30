const CATEGORIES = [
  'Политика','Экономика','Общество','Технологии и наука','Культура','Спорт','Образование','Семья','Молодежь','Туризм','Военнообязанные'
];

const CATEGORY_ICONS = ['policy','payments','groups','science','museum','sports_soccer','school','family_restroom','diversity_1','travel_explore','verified_user'];
const DEFAULT_SEED = '#6750A4';
const DEFAULT_AVATAR = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#6750a4"/><stop offset="1" stop-color="#9c8ad3"/></linearGradient></defs><rect width="256" height="256" rx="80" fill="url(#g)"/><circle cx="128" cy="106" r="44" fill="#fff" opacity=".96"/><path d="M54 224c6-49 37-71 74-71s68 22 74 71" fill="#fff" opacity=".96"/></svg>`);

const state = {
  section:'news', previousSection:'news', category:null, search:'', news:[],
  selectedNewsIndex:0, articleId:null, user:null, admin:false, authMode:'login',
  supabase:null, expandedHelp:false, keySequence:'', keySequenceTimer:null, leaderHeld:'',
  editor:{ id:null, mode:'edit', originalImageUrl:null, generatedPalette:null, imageObjectUrl:null, pendingCoverFile:null, authorId:null, suggestionMode:false, submissionId:null },
  newsSuggestions:[],
  avatarCrop:{ file:null, img:null, zoom:1, rotation:0, x:0, y:0, dragging:false, lastX:0, lastY:0, blob:null },
  pendingAvatarBlob:null, sitePalette:null, activePalette:null, paletteContext:'neutral', paletteRequestId:0, authorProfiles:{}, supabaseInitPromise:null, supabaseError:null
};

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];

const KEYMAP = [
  {group:'Новости', rows:[
    [['J / ↓'],'Следующая новость'],[['K / ↑'],'Предыдущая новость'],[['Ctrl+D'],'Прокрутить вниз'],[['Ctrl+U'],'Прокрутить вверх'],[['PageDown'],'Следующий экран'],[['PageUp'],'Предыдущий экран'],[['Home'],'В начало списка'],[['G'],'В конец списка'],[['G','G'],'В начало страницы'],[['Enter / O'],'Открыть выбранную новость'],[['Esc'],'Назад из статьи'],[['[ / ]'],'Предыдущая / следующая статья'],[['R'],'Случайная новость'],[['C'],'Сбросить раздел'],[['X'],'Очистить поиск'],[['N / Shift+N'],'Следующий / предыдущий результат']
  ]},
  {group:'Разделы и страницы', rows:[
    [['G','N'],'Новости'],[['G','P'],'Профиль'],[['G','A'],'О нас'],[['G','1'],'Политика'],[['G','2'],'Экономика'],[['G','3'],'Общество'],[['G','4'],'Технологии и наука'],[['G','5'],'Культура'],[['G','6'],'Спорт'],[['G','7'],'Образование'],[['G','8'],'Семья'],[['G','9'],'Молодежь'],[['G','0'],'Туризм'],[['G','-'],'Военнообязанные'],[['G','E'],'Редактор / создать новость (admin)']
  ]},
  {group:'Поиск и интерфейс', rows:[
    [['/'],'Фокус поиска'],[['Space','/'],'Открыть расширенную шпаргалку'],[['T'],'Светлая / тёмная тема'],[['Tab / Shift+Tab'],'Переход по интерактивным элементам']
  ]},
  {group:'Администрирование', rows:[
    [['E'],'Открыть редактор новой новости'],[['Ctrl+S'],'Сохранить новость в редакторе'],[['Ctrl+Enter'],'Опубликовать / сохранить'],[['D'],'Удалить текущую новость (admin)'],[['Enter'],'Открыть выбранную новость / подтвердить действие']
  ]},
  {group:'Редактор Markdown', rows:[
    [['Ctrl+B'],'Жирный текст'],[['Ctrl+I'],'Курсив'],[['Ctrl+K'],'Ссылка'],[['Tab'],'Отступ в Markdown'],[['Shift+Tab'],'Убрать отступ'],[['Ctrl+Shift+7'],'Нумерованный список'],[['Ctrl+Shift+8'],'Маркированный список']
  ]}
];

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => toast.classList.remove('is-visible'), 2700);
}

function escapeHtml(value='') {
  return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return {date:'', time:''};
  return {
    date:date.toLocaleDateString('ru-RU',{day:'2-digit',month:'long',year:'numeric'}),
    time:date.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})
  };
}

function hexToRgb(hex) {
  const h = String(hex || '').replace('#','');
  if (!/^[0-9a-f]{6}$/i.test(h)) return [103,80,164];
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}
function rgbToHex(rgb) {
  return '#' + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2,'0')).join('');
}
function mixColor(a,b,t) { return a.map((v,i)=>Math.round(v*(1-t)+b[i]*t)); }
function clamp(v,min,max){ return Math.max(min, Math.min(max,v)); }
function rgbToHsl([r0,g0,b0]) {
  const r=r0/255,g=g0/255,b=b0/255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b), l=(max+min)/2;
  if(max===min) return [0,0,l];
  const d=max-min, s=l>0.5?d/(2-max-min):d/(max+min);
  let h;
  switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;}
  h/=6;
  return [h*360,s,l];
}
function hslToRgb([h,s,l]) {
  h=((h%360)+360)%360/360;
  if(s===0) return [l*255,l*255,l*255];
  const hue2rgb=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
  const q=l<.5?l*(1+s):l+s-l*s, p=2*l-q;
  return [hue2rgb(p,q,h+1/3)*255,hue2rgb(p,q,h)*255,hue2rgb(p,q,h-1/3)*255];
}
function relativeLuma(rgb) {
  const s=rgb.map(v=>v/255).map(v=>v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4));
  return .2126*s[0]+.7152*s[1]+.0722*s[2];
}
function onColor(bgRgb){ return relativeLuma(bgRgb) > .48 ? '#19151e' : '#ffffff'; }
function hslHex(h,s,l){ return rgbToHex(hslToRgb([h,s,l])); }

const NEUTRAL_PALETTE = {
  source:'neutral',
  generator:'neutral-baseline-v1',
  light:{
    primary:'#6750a4', on_primary:'#ffffff', primary_container:'#eaddff', on_primary_container:'#21005d',
    secondary:'#625b71', secondary_container:'#e8def8', on_secondary_container:'#1d192b',
    tertiary:'#7d5260', on_tertiary:'#ffffff',
    surface:'#fffbfe', surface_tint:'#f7f1f9', surface_container_low:'#fbf6fc',
    surface_container:'#f3edf7', surface_container_high:'#ece6f0', surface_container_highest:'#e6e0e9',
    on_surface:'#1d1b20', on_surface_variant:'#49454f', outline:'#79747e', outline_variant:'#cac4d0', error:'#ba1a1a'
  },
  dark:{
    primary:'#b9b9b9', on_primary:'#111214', primary_container:'#303136', on_primary_container:'#eeeeee',
    secondary:'#b8bac0', secondary_container:'#26272b', on_secondary_container:'#e8e8ea',
    tertiary:'#c0c1c5', on_tertiary:'#16171a',
    surface:'#151619', surface_tint:'#191b1e', surface_container_low:'#181a1d',
    surface_container:'#1d1f22', surface_container_high:'#282a2e', surface_container_highest:'#32353a',
    on_surface:'#f2f2f3', on_surface_variant:'#bfc0c4', outline:'#6f7176', outline_variant:'#3b3d42', error:'#ffb4ab'
  }
};

let m3UtilitiesPromise=null;
async function loadM3ColorUtilities(){
  if(!m3UtilitiesPromise){
    m3UtilitiesPromise=import('https://cdn.jsdelivr.net/npm/@material/material-color-utilities@0.4.0/+esm');
  }
  return m3UtilitiesPromise;
}

const M3_CONTENT_ROLE_MAP={
  primary:'primary', on_primary:'onPrimary',
  primary_container:'primaryContainer', on_primary_container:'onPrimaryContainer',
  secondary:'secondary', secondary_container:'secondaryContainer', on_secondary_container:'onSecondaryContainer',
  tertiary:'tertiary', on_tertiary:'onTertiary',
  surface:'surface', surface_tint:'surfaceTint',
  surface_container_low:'surfaceContainerLow', surface_container:'surfaceContainer',
  surface_container_high:'surfaceContainerHigh', surface_container_highest:'surfaceContainerHighest',
  on_surface:'onSurface', on_surface_variant:'onSurfaceVariant',
  outline:'outline', outline_variant:'outlineVariant', error:'error'
};

const M3_IMAGE_PALETTE_GENERATOR='m3-content-matugen-v1';

function schemeToPalette(scheme,utils){
  const out={};
  for(const [role,token] of Object.entries(M3_CONTENT_ROLE_MAP)){
    const dynamicColor=utils.MaterialDynamicColors?.[token];
    if(dynamicColor?.getArgb) out[role]=utils.hexFromArgb(dynamicColor.getArgb(scheme)).toLowerCase();
  }
  return out;
}

async function loadImageForPalette(imageUrl){
  const img=new Image();
  img.crossOrigin='anonymous';
  await new Promise((resolve,reject)=>{
    img.onload=resolve;
    img.onerror=()=>reject(new Error('Изображение недоступно для анализа цвета.'));
    img.src=imageUrl;
  });
  return img;
}

async function extractMatugenSourceColorFromImage(imageUrl,utils){
  const img=await loadImageForPalette(imageUrl);
  // Mirror matugen's image path: resize to 112×112, quantize to 128 colors,
  // discard low-chroma colors, then rank the remaining colors with Material
  // Color Utilities' Score algorithm.
  const size=112;
  const canvas=document.createElement('canvas');
  canvas.width=size; canvas.height=size;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx) throw new Error('Canvas недоступен.');
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(img,0,0,size,size);

  const data=ctx.getImageData(0,0,size,size).data;
  const pixels=[];
  for(let i=0;i<data.length;i+=4){
    if(data[i+3]!==255) continue;
    pixels.push(utils.argbFromRgb(data[i],data[i+1],data[i+2]));
  }
  if(!pixels.length) throw new Error('В изображении нет непрозрачных пикселей.');

  const quantized=utils.QuantizerCelebi.quantize(pixels,128);
  for(const [argb] of [...quantized.entries()]){
    if(utils.Hct.fromInt(argb).chroma<5) quantized.delete(argb);
  }

  const ranked=utils.Score.score(quantized);
  return ranked[0] ?? utils.argbFromHex('#4285f4');
}

async function generateM3ContentPaletteFromImage(imageUrl){
  const utils=await loadM3ColorUtilities();
  const source=await extractMatugenSourceColorFromImage(imageUrl,utils);
  const hct=utils.Hct.fromInt(source);
  const lightScheme=new utils.SchemeContent(hct,false,0.0);
  const darkScheme=new utils.SchemeContent(hct,true,0.0);
  return {
    source:'image',
    generator:M3_IMAGE_PALETTE_GENERATOR,
    seed:utils.hexFromArgb(source).toLowerCase(),
    light:tuneNoctaliaSurfaceRoles(schemeToPalette(lightScheme,utils),hct,utils,false),
    dark:tuneNoctaliaSurfaceRoles(schemeToPalette(darkScheme,utils),hct,utils,true)
  };
}

function hctHex(utils,hue,chroma,tone){
  return utils.hexFromArgb(utils.Hct.from(hue,chroma,tone).toInt()).toLowerCase();
}

function tuneNoctaliaSurfaceRoles(palette,hct,utils,isDark){
  // Noctalia exposes a compact role set: accent colors carry emphasis,
  // while surface/background roles stay low-chroma and only subtly tinted.
  // Keep the M3 Content accent family, but derive shell surfaces from the
  // same seed hue with restrained chroma so they never become bright accents.
  const surfaceChroma=clamp(Math.min(8,hct.chroma*0.12),1.5,8);
  const surfaceHue=hct.hue;
  const surfaceTone=isDark?7:98;
  const variantTone=isDark?13:94;
  const variantHighTone=isDark?17:91;
  const highestTone=isDark?21:88;
  const onSurfaceTone=isDark?92:18;
  const onVariantTone=isDark?74:38;
  const outlineTone=isDark?32:52;

  palette.surface=hctHex(utils,surfaceHue,surfaceChroma,surfaceTone);
  palette.surface_tint=palette.surface;
  palette.surface_container_low=hctHex(utils,surfaceHue,surfaceChroma,isDark?9:97);
  palette.surface_container=hctHex(utils,surfaceHue,surfaceChroma,isDark?11:96);
  palette.surface_container_high=hctHex(utils,surfaceHue,surfaceChroma,variantTone);
  palette.surface_container_highest=hctHex(utils,surfaceHue,surfaceChroma,variantHighTone);
  palette.on_surface=hctHex(utils,surfaceHue,Math.min(surfaceChroma,4),onSurfaceTone);
  palette.on_surface_variant=hctHex(utils,surfaceHue,Math.min(surfaceChroma,5),onVariantTone);
  palette.outline=hctHex(utils,surfaceHue,Math.min(surfaceChroma,4.5),outlineTone);
  palette.outline_variant=hctHex(utils,surfaceHue,Math.min(surfaceChroma,3.5),isDark?24:78);

  // Container roles are used by this web UI for selections/tonal controls.
  // Keep them surface-like instead of turning large UI areas into accent fills.
  palette.primary_container=hctHex(utils,surfaceHue,surfaceChroma,highestTone);
  palette.on_primary_container=palette.on_surface;
  palette.secondary_container=hctHex(utils,surfaceHue,surfaceChroma,variantHighTone);
  palette.on_secondary_container=palette.on_surface;
  return palette;
}

function applySitePalette(palette){
  if(!palette) return;
  state.sitePalette=palette;
  state.activePalette=palette;
  const scheme=document.documentElement.dataset.theme==='dark'?palette.dark:palette.light;
  const root=document.documentElement;
  const map={
    primary:'--md-sys-color-primary', on_primary:'--md-sys-color-on-primary',
    primary_container:'--md-sys-color-primary-container', on_primary_container:'--md-sys-color-on-primary-container',
    secondary:'--md-sys-color-secondary', secondary_container:'--md-sys-color-secondary-container',
    on_secondary_container:'--md-sys-color-on-secondary-container',
    tertiary:'--md-sys-color-tertiary', on_tertiary:'--md-sys-color-on-tertiary',
    surface:'--md-sys-color-surface', surface_tint:'--md-sys-color-surface-tint',
    surface_container_low:'--md-sys-color-surface-container-low', surface_container:'--md-sys-color-surface-container',
    surface_container_high:'--md-sys-color-surface-container-high', surface_container_highest:'--md-sys-color-surface-container-highest',
    on_surface:'--md-sys-color-on-surface', on_surface_variant:'--md-sys-color-on-surface-variant',
    outline:'--md-sys-color-outline', outline_variant:'--md-sys-color-outline-variant', error:'--md-sys-color-error'
  };
  Object.entries(map).forEach(([key,varName])=>root.style.setProperty(varName,scheme[key]));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',scheme.surface);
}

function activateNeutralPalette(){
  state.paletteContext='neutral';
  state.activePalette=null;
  applySitePalette(NEUTRAL_PALETTE);
}

async function activateArticlePalette(article){
  const requestId=++state.paletteRequestId;
  state.paletteContext='article';
  state.activePalette=null;
  applySitePalette(NEUTRAL_PALETTE);
  if(!article?.image) return;
  try{
    let palette=article.palette;
    if(!(palette?.generator===M3_IMAGE_PALETTE_GENERATOR && palette.light?.primary && palette.dark?.primary)){
      palette=await generateM3ContentPaletteFromImage(article.image);
      article.palette=palette;
      article.accent=palette.light.primary||null;
    }
    if(requestId!==state.paletteRequestId || state.section!=='article' || String(state.articleId)!==String(article.id)) return;
    applySitePalette(palette);
    renderArticle();
  }catch(error){
    if(requestId===state.paletteRequestId) activateNeutralPalette();
    console.warn('Article palette failed:',error);
  }
}

async function activateProfilePalette(){
  const requestId=++state.paletteRequestId;
  state.paletteContext='profile';
  state.activePalette=null;
  applySitePalette(NEUTRAL_PALETTE);
  if(!state.user) return;
  const avatarUrl=state.user.profile?.avatar_url||DEFAULT_AVATAR;
  try{
    const palette=await generateM3ContentPaletteFromImage(avatarUrl);
    if(requestId!==state.paletteRequestId || !['profile','profile-management'].includes(state.section)) return;
    applySitePalette(palette);
  }catch(error){
    if(requestId===state.paletteRequestId) activateNeutralPalette();
    console.warn('Profile palette failed:',error);
  }
}

function setTheme(theme){
  document.documentElement.dataset.theme=theme;
  document.documentElement.style.colorScheme=theme;
  localStorage.setItem('news-theme',theme);
  $('#theme-icon').textContent=theme==='dark'?'light_mode':'dark_mode';
  applySitePalette(state.activePalette||NEUTRAL_PALETTE);
}

function mapRemoteNews(row) {
  const dt=formatDateTime(row.published_at);
  let palette=row.palette||null;
  if(typeof palette==='string'){ try{palette=JSON.parse(palette);}catch(_){palette=null;} }
  if(!palette?.source || palette.source!=='image' || palette.generator!==M3_IMAGE_PALETTE_GENERATOR || !palette.light?.primary || !palette.dark?.primary) palette=null;
  const fallbackImage='https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1100&q=82';
  const authorProfile=state.authorProfiles?.[row.author_id];
  const fallbackAuthor=(row.author_id&&state.user?.id===row.author_id)?(state.user.profile?.nickname||state.user.email?.split('@')[0]||'Редакция'):'Редакция';
  return { id:row.id, category:row.category, title:row.title, summary:row.summary||'', body:row.body||'', date:dt.date, time:dt.time, author:authorProfile?.nickname||fallbackAuthor, image:row.image_url||fallbackImage, accent:palette?.light?.primary||null, palette, authorId:row.author_id, published_at:row.published_at };
}

function parseMarkdown(markdown='') {
  // Self-contained Markdown renderer so the public site still works if a CDN is unavailable.
  // HTML is escaped first, so raw HTML cannot be injected.
  const source=String(markdown??'').replace(/\r\n?/g,'\n');
  const lines=source.split('\n');
  const out=[];
  let i=0, inCode=false, codeLang='', code=[];
  const inline=(text)=>{
    let x=escapeHtml(text);
    x=x.replace(/`([^`]+)`/g,'<code>$1</code>');
    x=x.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)(?:\s+[\"\']([^\"\']*)[\"\'])?\)/g,(_,alt,url,title)=>`<img src="${url}" alt="${alt}"${title?` title="${title}"`:''} loading="lazy" referrerpolicy="no-referrer">`);
    x=x.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    x=x.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
    x=x.replace(/__([^_]+)__/g,'<strong>$1</strong>');
    x=x.replace(/~~([^~]+)~~/g,'<del>$1</del>');
    x=x.replace(/\*([^*]+)\*/g,'<em>$1</em>');
    x=x.replace(/_([^_]+)_/g,'<em>$1</em>');
    return x;
  };
  const isTableRow=v=>/^\s*\|.*\|\s*$/.test(v);
  while(i<lines.length){
    const line=lines[i];
    if(/^\s*```/.test(line)){
      if(!inCode){inCode=true;codeLang=line.replace(/^\s*```/,'').trim();code=[];}
      else{out.push(`<pre><code${codeLang?` data-lang="${escapeHtml(codeLang)}"`:''}>${escapeHtml(code.join('\n'))}</code></pre>`);inCode=false;codeLang='';code=[];}
      i++; continue;
    }
    if(inCode){code.push(line);i++;continue;}
    if(!line.trim()){i++;continue;}
    if(i+1<lines.length && isTableRow(line) && /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(lines[i+1])){
      const cells=row=>row.trim().replace(/^\||\|$/g,'').split('|').map(v=>inline(v.trim()));
      const head=cells(line); i+=2; const rows=[];
      while(i<lines.length && isTableRow(lines[i]) && lines[i].trim()){rows.push(cells(lines[i]));i++;}
      out.push(`<div class="md-table-wrap"><table><thead><tr>${head.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${head.map((_,j)=>`<td>${r[j]||''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    const hm=line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
    if(hm){out.push(`<h${hm[1].length}>${inline(hm[2])}</h${hm[1].length}>`);i++;continue;}
    if(/^\s*---+\s*$/.test(line)){out.push('<hr>');i++;continue;}
    if(/^\s*>/.test(line)){const q=[];while(i<lines.length && /^\s*>/.test(lines[i])){q.push(lines[i].replace(/^\s*>\s?/,''));i++;}out.push(`<blockquote><p>${inline(q.join('\n')).replace(/\n/g,'<br>')}</p></blockquote>`);continue;}
    if(/^\s*[-*+]\s+/.test(line)){const items=[];while(i<lines.length && /^\s*[-*+]\s+/.test(lines[i])){items.push(lines[i].replace(/^\s*[-*+]\s+/,''));i++;}out.push(`<ul>${items.map(v=>`<li>${inline(v)}</li>`).join('')}</ul>`);continue;}
    if(/^\s*\d+\.\s+/.test(line)){const items=[];while(i<lines.length && /^\s*\d+\.\s+/.test(lines[i])){items.push(lines[i].replace(/^\s*\d+\.\s+/,''));i++;}out.push(`<ol>${items.map(v=>`<li>${inline(v)}</li>`).join('')}</ol>`);continue;}
    const para=[line]; i++; while(i<lines.length && lines[i].trim() && !/^\s*(#{1,6})\s+/.test(lines[i]) && !/^\s*```/.test(lines[i]) && !/^\s*>/.test(lines[i]) && !/^\s*[-*+]\s+/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i])){para.push(lines[i]);i++;}
    out.push(`<p>${inline(para.join('\n')).replace(/\n/g,'<br>')}</p>`);
  }
  if(inCode) out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
  return out.join('');
}

function isMobileLayout(){ return window.matchMedia?.('(max-width:860px)').matches===true; }
function getMainScroller(){
  return isMobileLayout() ? $('#main') : (document.scrollingElement || document.documentElement);
}
function scrollMainToTop(behavior='smooth'){
  const main=getMainScroller();
  if(main) main.scrollTo({top:0,behavior});
}
function scrollMainBy(delta,behavior='smooth'){
  const main=getMainScroller();
  if(main) main.scrollBy({top:delta,behavior});
}
function scrollElementIntoMain(element,behavior='smooth'){
  if(!element) return;
  if(!isMobileLayout()){
    element.scrollIntoView({block:'center',behavior});
    return;
  }
  const main=getMainScroller();
  if(!main) return;
  const mainRect=main.getBoundingClientRect();
  const rect=element.getBoundingClientRect();
  const target=main.scrollTop + (rect.top-mainRect.top) - Math.max(0,(main.clientHeight-rect.height)/2);
  main.scrollTo({top:Math.max(0,target),behavior});
}

function openSection(section) {
  if(state.section!==section) state.previousSection=state.section;
  state.section=section;
  $$('.page-section').forEach(el=>el.classList.toggle('is-visible',el.id===`section-${section}`));
  $$('#main-nav .nav-item').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.section===section));
  $$('#mobile-dock .mobile-dock-item').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.section===section));
  const title=section==='news'?'Новости':section==='profile'?'Профиль':section==='about'?'О нас':section==='article'?'Материал':'Редактор';
  $('#page-title').textContent=title;
  $('#page-category').textContent=section==='news'?(state.category||'Все разделы'):'';
  document.body.classList.toggle('article-mode',section==='article');
  state.paletteRequestId++;
  if(section==='news') activateNeutralPalette();
  if(section==='about') activateNeutralPalette();
  if(section==='profile') { activateNeutralPalette(); renderProfile(); activateProfilePalette(); }
  if(section==='profile-management') { activateNeutralPalette(); activateProfilePalette(); }
  if(section==='article') { activateNeutralPalette(); renderArticle(); const article=state.news.find(item=>String(item.id)===String(state.articleId)); activateArticlePalette(article); }
  if(section==='editor') { activateNeutralPalette(); renderEditor(); state.editor.mode='edit'; requestAnimationFrame(()=>syncEditorMode()); }
  scrollMainToTop();
}

function renderCategoryNav() {
  const root=$('#category-nav');
  root.innerHTML='';
  const all=document.createElement('button');
  all.className='nav-item compact-item'+(!state.category?' is-active':'');
  all.dataset.category='';
  all.innerHTML='<span class="material-symbols-rounded">grid_view</span><span>Все новости</span>';
  root.appendChild(all);
  CATEGORIES.forEach((category,index)=>{
    const btn=document.createElement('button');
    btn.className='nav-item compact-item'+(state.category===category?' is-active':'');
    btn.dataset.category=category;
    btn.innerHTML=`<span class="material-symbols-rounded">${CATEGORY_ICONS[index]}</span><span>${escapeHtml(category)}</span>`;
    root.appendChild(btn);
  });
  const mobile=$('#mobile-category-nav');
  mobile.innerHTML=`<button class="mobile-cat ${!state.category?'is-active':''}" data-category="">Все</button>` + CATEGORIES.map(category=>`<button class="mobile-cat ${state.category===category?'is-active':''}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('');
}

function setCategory(category) {
  state.category=category||null;
  state.selectedNewsIndex=0;
  renderCategoryNav();
  $('#page-category').textContent=state.category||'Все разделы';
  openSection('news');
  renderNews();
}

function currentVisibleNews() {
  let items=state.news.filter(n=>!state.category||n.category===state.category);
  if(state.search.trim()){
    const q=state.search.trim().toLowerCase();
    items=items.filter(n=>`${n.title} ${n.summary} ${n.body||''} ${n.category}`.toLowerCase().includes(q));
  }
  return items;
}

function cardTemplate(n,featured,index) {
  const accent='var(--md-sys-color-primary)';
  return `<article class="news-card ${featured?'featured':''}" data-id="${escapeHtml(n.id)}" tabindex="0" aria-label="${escapeHtml(n.title)}" style="--news-primary:${accent}">
    <div class="news-card-image"><img loading="lazy" src="${escapeHtml(n.image)}" alt="" onerror="this.style.opacity='.2'"><div class="news-card-overlay">
      <div class="news-meta"><span class="category-pill" style="--news-primary:${accent}">${escapeHtml(n.category)}</span><span>${escapeHtml(n.date)} · ${escapeHtml(n.time)}</span></div>
      <div class="news-title">${escapeHtml(n.title)}</div><p class="news-summary">${escapeHtml(n.summary)}</p>
    </div></div>
    ${featured?'':`<div class="news-card-body"><div class="news-meta"><span>${escapeHtml(n.author||'Редакция')}</span><span>•</span><span>${escapeHtml(n.date)}</span></div><div class="news-title">${escapeHtml(n.title)}</div><p class="news-summary">${escapeHtml(n.summary)}</p></div>`}
  </article>`;
}

function renderNews(){
  const root=$('#news-grid');
  if(!root) return;
  const items=currentVisibleNews();
  const total=items.length;
  $('#search-status').textContent=state.search.trim()?`${total} ${pluralNews(total)} по запросу`:(state.category?`${total} материалов`:'');
  $('#search-clear').classList.toggle('hidden',!state.search);
  $('#news-search').value=state.search;
  if(!items.length){
    const title=state.search.trim()?'Ничего не найдено':'Новостей пока нет';
    const text=state.search.trim()?'Попробуйте другой запрос или измените раздел.':'Публикации появятся здесь после того, как администратор разместит первую новость.';
    root.innerHTML=`<div class="empty-state"><h2>${title}</h2><p>${text}</p></div>`;
    return;
  }
  root.innerHTML=items.map((n,i)=>cardTemplate(n,i===0&&!state.search&&!state.category,i)).join('');
  root.querySelectorAll('.news-card').forEach(card=>{
    card.addEventListener('click',()=>openArticle(card.dataset.id));
    card.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.code==='Enter') openArticle(card.dataset.id); });
  });
  state.selectedNewsIndex=clamp(state.selectedNewsIndex,0,items.length-1);
  updateSelectedCard();
}
function updateSelectedCard() {
  const cards=visibleNewsCards();
  cards.forEach((card,i)=>card.classList.toggle('is-selected',i===state.selectedNewsIndex));
}
function visibleNewsCards(){ return $$('.news-card'); }

async function ensureNewsPalette(newsItem){
  if(newsItem?.palette?.generator===M3_IMAGE_PALETTE_GENERATOR && newsItem.palette.light?.primary) return newsItem.palette;
  if(!newsItem?.image) return NEUTRAL_PALETTE;
  try{
    const palette=await generateM3ContentPaletteFromImage(newsItem.image);
    newsItem.palette=palette;
    newsItem.accent=palette.light.primary||null;
    return palette;
  }catch(_){
    return NEUTRAL_PALETTE;
  }
}

async function openArticle(id){
  const news=state.news.find(n=>String(n.id)===String(id));
  if(!news) return;
  state.articleId=id;
  state.previousSection=state.section==='article'?'news':state.section;
  openSection('article');
  renderArticle();
}


function getArticleNeighbors() {
  const items=currentVisibleNews();
  const index=Math.max(0,items.findIndex(n=>String(n.id)===String(state.articleId)));
  return {previous:items[index-1], next:items[index+1]};
}

function renderArticle() {
  const root=$('#article-page');
  const n=state.news.find(item=>String(item.id)===String(state.articleId));
  if(!n){root.innerHTML='<div class="empty-state"><h2>Материал не найден</h2><button class="filled-button" data-back-news>Вернуться к новостям</button></div>'; return;}
  const accent='var(--md-sys-color-primary)';
  const body=n.body?.trim()||`*У этого материала пока нет текста.*`;
  const html=parseMarkdown(body);
  const nav=getArticleNeighbors();
  root.innerHTML=`
    <div class="article-shell">
      <div class="article-toolbar">
        <div class="article-toolbar-left">
          <button id="article-back" class="tonal-button"><span class="material-symbols-rounded">arrow_back</span>Все новости</button>
        </div>
        <div class="article-toolbar-actions">
          ${state.admin && !String(n.id).startsWith('demo-')?`<button id="article-edit" class="text-button"><span class="material-symbols-rounded">edit</span>Редактировать</button><button id="article-delete" class="text-button"><span class="material-symbols-rounded">delete</span>Удалить</button>`:''}
        </div>
      </div>
      <img class="article-cover" src="${escapeHtml(n.image)}" alt="" style="--news-primary:${accent}">
      <article class="article-reading">
        <div class="news-meta"><span class="category-pill" style="--news-primary:${accent}">${escapeHtml(n.category)}</span><span>${escapeHtml(n.date)} · ${escapeHtml(n.time)}</span></div>
        <h1 id="article-heading">${escapeHtml(n.title)}</h1>
        <p class="article-lead">${escapeHtml(n.summary)}</p>
        <div class="article-byline"><span class="material-symbols-rounded">person</span><span>${escapeHtml(n.author||'Редакция')}</span></div>
        <div class="article-markdown">${html}</div>
        <div class="article-divider"></div>
        <div class="article-toolbar">
          <div class="article-toolbar-left">
            ${nav.previous?`<button class="tonal-button" data-article-nav="prev"><span class="material-symbols-rounded">arrow_back</span>Предыдущая</button>`:''}
            ${nav.next?`<button class="tonal-button" data-article-nav="next">Следующая<span class="material-symbols-rounded">arrow_forward</span></button>`:''}
          </div>
          <button class="text-button" data-back-news>Все новости</button>
        </div>
      </article>
    </div>`;
  $('#article-back').onclick=()=>backToNews();
  $('[data-back-news]')?.addEventListener('click',backToNews);
  if($('#article-edit')) $('#article-edit').onclick=()=>openEditor(n.id);
  if($('#article-delete')) $('#article-delete').onclick=()=>deleteNews(n.id);
  root.querySelectorAll('[data-article-nav]').forEach(btn=>btn.addEventListener('click',()=>openArticle(btn.dataset.articleNav==='prev'?nav.previous.id:nav.next.id)));
}

function backToNews() {
  state.articleId=null;
  openSection('news');
  renderNews();
}

function renderKeyHelp(){
  const root=$('#whichkey-content');
  if(!root) return;
  root.innerHTML=KEYMAP.map(group=>`<section class="key-group"><div class="key-group-title">${escapeHtml(group.group)}</div><table class="key-table"><tbody>${group.rows.map(([keys,desc])=>`<tr><td><div class="key-combo">${keys.map(k=>`<kbd>${escapeHtml(k)}</kbd>`).join('')}</div></td><td>${escapeHtml(desc)}</td></tr>`).join('')}</tbody></table></section>`).join('');
}

function toggleHelp(expanded=true){
  const panel=$('#whichkey-panel');
  if(!panel) return;
  state.expandedHelp=expanded;
  panel.classList.toggle('is-expanded',expanded);
  panel.setAttribute('aria-hidden', expanded ? 'false' : 'true');
  if(expanded){ panel.scrollTo({top:0,behavior:'smooth'}); $('#close-help')?.focus({preventScroll:true}); }
}

function openAuth(mode='login'){ setAuthMode(mode); $('#auth-dialog').showModal(); setTimeout(()=>$('#auth-email').focus(),30); }
function setAuthMode(mode){
  state.authMode=mode;
  $$('.segment').forEach(btn=>btn.classList.toggle('is-selected',btn.dataset.authMode===mode));
  $('#auth-title').textContent=mode==='login'?'Вход':'Регистрация';
  $('#auth-submit').textContent=mode==='login'?'Войти':'Создать аккаунт';
  $('#auth-extra').classList.toggle('hidden',mode==='login');
  $('#auth-message').textContent='';
}

function renderProfile(){
  const root=$('#profile-card');
  if(!state.user){
    root.innerHTML=`<article class="surface-card profile-main"><span class="eyebrow">Не авторизован</span><h2 style="margin-top:7px">Создайте профиль читателя</h2><p>Ник, аватар и поле «О себе» сохраняются в Supabase. Публиковать новости могут только пользователи с ролью admin.</p><div class="profile-actions"><button id="profile-signin" class="filled-button"><span class="material-symbols-rounded">login</span>Войти или зарегистрироваться</button></div></article><aside class="surface-card profile-side"><h3>Что доступно</h3><div class="stat-row"><span>Чтение новостей</span><strong>✓</strong></div><div class="stat-row"><span>Профиль</span><strong>✓</strong></div><div class="stat-row"><span>Публикация</span><strong>Только admin</strong></div></aside>`;
    $('#profile-signin').onclick=()=>openAuth('login');
    return;
  }
  const p=state.user.profile||{};
  root.innerHTML=`<article class="surface-card profile-main"><div class="profile-head"><img class="profile-avatar-large" src="${escapeHtml(p.avatar_url||DEFAULT_AVATAR)}" alt="Аватар"><div><div class="profile-name">${escapeHtml(p.nickname||state.user.email?.split('@')[0]||'Пользователь')}</div><div class="profile-role">${p.role==='admin'?'Администратор':'Читатель'}</div></div></div><p class="profile-bio">${escapeHtml(p.bio||'Пока ничего не рассказано.')}</p><div class="profile-actions"><button id="edit-profile" class="filled-button"><span class="material-symbols-rounded">edit</span>Изменить профиль</button><button id="signout" class="tonal-button"><span class="material-symbols-rounded">logout</span>Выйти</button></div></article><aside class="surface-card profile-side"><h3>Сведения</h3><div class="stat-row"><span>Email</span><strong style="max-width:190px;overflow:hidden;text-overflow:ellipsis">${escapeHtml(state.user.email||'—')}</strong></div><div class="stat-row"><span>Роль</span><strong>${p.role==='admin'?'admin':'reader'}</strong></div>${p.role==='admin'?`<button id="create-news" class="filled-button" style="width:100%;margin-top:14px"><span class="material-symbols-rounded">edit_note</span>Написать новость</button>`:''}</aside>`;
  $('#edit-profile').onclick=()=>openEditProfile(p);
  $('#signout').onclick=signOut;
  if($('#create-news')) $('#create-news').onclick=()=>openEditor(null);
  if(!state.admin){
    const side=$('.profile-side',root);
    if(side){
      const button=document.createElement('button');
      button.id='suggest-news';
      button.className='filled-button';
      button.style.cssText='width:100%;margin-top:14px';
      button.innerHTML='<span class="material-symbols-rounded">send</span>Предложить новость';
      button.onclick=()=>openEditor(null,'suggest');
      side.appendChild(button);
    }
  }
  if(state.admin) renderAdminNewsManager(root);
}

async function loadNewsSuggestions(){
  if(!state.supabase||!state.admin) return [];
  try{
    await loadAuthorProfiles();
    const {data,error}=await state.supabase.from('news_submissions')
      .select('id,author_id,category,title,summary,body,image_url,palette,status,created_at')
      .eq('status','pending')
      .order('created_at',{ascending:false});
    if(error) throw error;
    state.newsSuggestions=data||[];
    return state.newsSuggestions;
  }catch(error){
    state.newsSuggestions=[];
    console.warn('News suggestions load failed:',error);
    return [];
  }
}

async function approveNewsSuggestion(id){
  if(!state.supabase||!state.admin||!state.user) return;
  const item=state.newsSuggestions.find(s=>String(s.id)===String(id));
  if(!item) return;
  if(!window.confirm('Опубликовать предложение «'+item.title+'»?')) return;
  try{
    let palette=item.palette||null;
    if(typeof palette==='string'){try{palette=JSON.parse(palette);}catch(_){palette=null;}}
    const payload={
      category:item.category,
      title:item.title,
      summary:item.summary||'',
      body:item.body||'',
      image_url:item.image_url||'',
      author_id:item.author_id,
      accent_hex:palette?.light?.primary||null,
      palette
    };
    const inserted=await state.supabase.from('news').insert(payload);
    if(inserted.error) throw inserted.error;
    const updated=await state.supabase.from('news_submissions').update({
      status:'approved',
      reviewed_at:new Date().toISOString(),
      reviewed_by:state.user.id
    }).eq('id',id).eq('status','pending');
    if(updated.error) throw updated.error;
    await loadRemoteNews();
    showToast('Предложение опубликовано');
    renderProfile();
  }catch(error){
    showToast(error.message||'Не удалось опубликовать предложение.');
  }
}

async function rejectNewsSuggestion(id){
  if(!state.supabase||!state.admin||!state.user) return;
  const item=state.newsSuggestions.find(s=>String(s.id)===String(id));
  if(!item) return;
  if(!window.confirm('Отклонить предложение «'+item.title+'»?')) return;
  try{
    const updated=await state.supabase.from('news_submissions').update({
      status:'rejected',
      reviewed_at:new Date().toISOString(),
      reviewed_by:state.user.id
    }).eq('id',id).eq('status','pending');
    if(updated.error) throw updated.error;
    showToast('Предложение отклонено');
    renderProfile();
  }catch(error){
    showToast(error.message||'Не удалось отклонить предложение.');
  }
}

async function renderAdminNewsManager(root){
  const side=$('.profile-side',root);
  if(!side) return;

  const container=document.createElement('div');
  container.className='admin-news-list';
  const remote=state.news.filter(n=>!String(n.id).startsWith('demo-'));
  container.innerHTML=remote.length
    ? remote.map(n=>'<div class="admin-news-row" data-admin-news="'+escapeHtml(n.id)+'"><div class="admin-news-main"><strong>'+escapeHtml(n.title)+'</strong><span>'+escapeHtml(n.category)+' · '+escapeHtml(n.date)+'</span></div><div class="admin-news-actions"><button class="icon-button small" data-edit-news="'+escapeHtml(n.id)+'" aria-label="Редактировать"><span class="material-symbols-rounded">edit</span></button><button class="icon-button small" data-delete-news="'+escapeHtml(n.id)+'" aria-label="Удалить"><span class="material-symbols-rounded">delete</span></button></div></div>').join('')
    : '<div class="media-note">Пока нет опубликованных материалов из Supabase.</div>';
  side.insertAdjacentHTML('beforeend','<div class="nav-divider"></div><h3 style="margin-top:16px">Управление новостями</h3>');
  side.appendChild(container);
  container.querySelectorAll('[data-edit-news]').forEach(btn=>btn.onclick=()=>openEditor(btn.dataset.editNews));
  container.querySelectorAll('[data-delete-news]').forEach(btn=>btn.onclick=()=>deleteNews(btn.dataset.deleteNews));

  const suggestionsBox=document.createElement('section');
  suggestionsBox.className='admin-suggestions';
  suggestionsBox.innerHTML='<div class="nav-divider"></div><div class="admin-suggestions-heading"><h3>Предложенные новости</h3><span class="suggestion-count">Загрузка…</span></div><div class="admin-suggestions-list"></div>';
  side.appendChild(suggestionsBox);
  const list=suggestionsBox.querySelector('.admin-suggestions-list');
  const count=suggestionsBox.querySelector('.suggestion-count');
  const suggestions=await loadNewsSuggestions();
  count.textContent=String(suggestions.length);
  if(!suggestions.length){
    list.innerHTML='<div class="media-note">Новых предложений пока нет.</div>';
    return;
  }
  list.innerHTML=suggestions.map(s=>'<div class="admin-suggestion-row" data-suggestion-id="'+escapeHtml(s.id)+'"><div class="admin-news-main"><strong>'+escapeHtml(s.title)+'</strong><span>'+escapeHtml(s.category)+' · '+escapeHtml(new Date(s.created_at).toLocaleDateString('ru-RU'))+'</span><span class="suggestion-author">Автор: '+escapeHtml(state.authorProfiles?.[s.author_id]?.nickname||'Пользователь')+'</span></div><div class="admin-suggestion-actions"><button class="tonal-button suggestion-publish" data-approve-suggestion="'+escapeHtml(s.id)+'" type="button"><span class="material-symbols-rounded">publish</span>Опубликовать</button><button class="text-button suggestion-reject" data-reject-suggestion="'+escapeHtml(s.id)+'" type="button">Отклонить</button></div></div>').join('');
  list.querySelectorAll('[data-approve-suggestion]').forEach(btn=>btn.onclick=()=>approveNewsSuggestion(btn.dataset.approveSuggestion));
  list.querySelectorAll('[data-reject-suggestion]').forEach(btn=>btn.onclick=()=>rejectNewsSuggestion(btn.dataset.rejectSuggestion));
}

function openEditProfile(p){
  $('#profile-nickname').value=p.nickname||'';
  $('#profile-avatar').value=p.avatar_url||'';
  $('#profile-bio').value=p.bio||'';
  $('#profile-avatar-file').value='';
  $('#avatar-preview-note').textContent='Для локального файла после выбора откроется кадрирование 1:1.';
  $('#profile-message').textContent='';
  state.pendingAvatarBlob=null;
  $('#edit-profile-dialog').showModal();
}

async function signOut(){ if(state.supabase) await state.supabase.auth.signOut(); handleSession(null); showToast('Вы вышли из аккаунта'); }

async function submitAuth(){
  const email=$('#auth-email').value.trim(), password=$('#auth-password').value, nickname=$('#auth-nickname').value.trim(), msg=$('#auth-message');
  msg.textContent='';

  if(!state.supabase){
    msg.textContent='Подключаем Supabase…';
    const client=await initSupabase();
    if(!client){
      const detail=state.supabaseError?.message||'неизвестная ошибка';
      msg.textContent='Не удалось подключиться к Supabase: '+detail;
      return;
    }
  }

  try{
    if(state.authMode==='signup'){
      const {data,error}=await state.supabase.auth.signUp({email,password,options:{data:{nickname}}});
      if(error) throw error;
      msg.textContent=data.session?'Аккаунт создан.':'Аккаунт создан. Проверьте email для подтверждения.';
    }else{
      const {error}=await state.supabase.auth.signInWithPassword({email,password});
      if(error) throw error;
      $('#auth-dialog').close();
    }
  }catch(error){
    msg.textContent=error.message||'Не удалось выполнить запрос.';
  }
}


function updateAuthUI(){
  const authBtn=$('#auth-button'), avatarBtn=$('#avatar-button');
  if(state.user){
    authBtn.classList.add('hidden'); avatarBtn.classList.remove('hidden'); $('#top-avatar').src=state.user.profile?.avatar_url||DEFAULT_AVATAR;
  }else{ authBtn.classList.remove('hidden'); avatarBtn.classList.add('hidden'); }
}

async function handleSession(session){
  state.user=session?.user?{...session.user}:null;
  state.admin=false;
  if(state.user && state.supabase){
    try{
      const {data:profile,error}=await state.supabase.from('profiles').select('*').eq('id',state.user.id).maybeSingle();
      if(error) throw error;
      state.user.profile=profile||{
        nickname:state.user.email?.split('@')[0]||'Пользователь',
        role:'reader',
        avatar_url:null,
        bio:''
      };
      state.admin=state.user.profile.role==='admin';
    }catch(error){
      console.warn('Profile load failed:',error);
      state.user.profile={
        nickname:state.user.email?.split('@')[0]||'Пользователь',
        role:'reader',
        avatar_url:null,
        bio:''
      };
    }
  }
  updateAuthUI();
  renderProfile();
  if(state.section==='profile') activateProfilePalette();
}

async function loadSupabaseClientScript(){
  if(window.supabase?.createClient) return window.supabase;

  const sources=[
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
    'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js'
  ];

  let lastError=null;
  for(const src of sources){
    try{
      await new Promise((resolve,reject)=>{
        const script=document.createElement('script');
        script.src=src;
        script.async=true;
        script.crossOrigin='anonymous';
        const timer=setTimeout(()=>{cleanup();reject(new Error('Таймаут загрузки Supabase SDK.'));},12000);
        const cleanup=()=>{
          clearTimeout(timer);
          script.onload=null;
          script.onerror=null;
        };
        script.onload=()=>{cleanup();resolve();};
        script.onerror=()=>{cleanup();reject(new Error('Не удалось загрузить Supabase SDK: '+src));};
        document.head.appendChild(script);
      });
      if(window.supabase?.createClient) return window.supabase;
    }catch(error){
      lastError=error;
    }
  }
  throw lastError||new Error('Supabase SDK недоступен.');
}


async function initSupabase(){
  if(state.supabase) return state.supabase;
  if(state.supabaseInitPromise) return state.supabaseInitPromise;

  const cfg=window.SUPABASE_CONFIG;
  if(!cfg?.url || !cfg?.anonKey){
    state.supabaseError=new Error('В SUPABASE_CONFIG отсутствуют url или anonKey.');
    return null;
  }
  if(/^https:\/\/YOUR-PROJECT-REF\.supabase\.co/i.test(String(cfg.url)) || String(cfg.anonKey).includes('YOUR-ANON-PUBLIC-KEY')){
    state.supabaseError=new Error('В supabase-config.js остались демонстрационные значения.');
    return null;
  }

  state.supabaseInitPromise=(async()=>{
    try{
      const sdk=await loadSupabaseClientScript();
      const projectRef=(new URL(String(cfg.url).trim())).hostname.split('.')[0];
      state.supabase=sdk.createClient(String(cfg.url).trim(),String(cfg.anonKey).trim(),{
        auth:{
          persistSession:true,
          autoRefreshToken:true,
          detectSessionInUrl:true,
          storageKey:'sb-'+projectRef+'-auth-token',
          storage:window.localStorage
        }
      });
      state.supabaseError=null;

      try{
        const {data:{session},error:sessionError}=await state.supabase.auth.getSession();
        if(sessionError) throw sessionError;
        await handleSession(session);
      }catch(error){
        console.warn('Supabase session initialization failed:',error);
      }

      state.supabase.auth.onAuthStateChange((_event,nextSession)=>{
        setTimeout(async()=>{
          try{
            await handleSession(nextSession);
            await loadRemoteNews();
          }catch(error){
            console.warn('Supabase auth refresh failed',error);
          }
        },0);
      });

      try{
        await loadRemoteNews();
      }catch(error){
        console.warn('Initial Supabase news load failed:',error);
      }

      return state.supabase;
    }catch(error){
      state.supabaseError=error;
      state.supabase=null;
      console.error('Supabase client initialization failed:',error);
      showToast('Не удалось загрузить Supabase SDK. Проверьте интернет-соединение или попробуйте обновить страницу.');
      return null;
    }finally{
      state.supabaseInitPromise=null;
    }
  })();

  return state.supabaseInitPromise;
}


async function loadAuthorProfiles(){
  if(!state.supabase) return;
  try{
    const result=await state.supabase.from('profiles').select('id,nickname,role').order('nickname',{ascending:true});
    if(result.error) throw result.error;
    const next={};
    (result.data||[]).forEach(profile=>{ if(profile?.id) next[profile.id]=profile; });
    if(state.user?.id && state.user.profile && !next[state.user.id]) next[state.user.id]={id:state.user.id,nickname:state.user.profile.nickname||state.user.email?.split('@')[0]||'Пользователь',role:state.user.profile.role||'reader'};
    state.authorProfiles=next;
  }catch(error){ console.warn('Author profiles load failed:',error); }
}

async function loadEditorAuthors(selectedId=''){
  const control=$('.editor-author-field .editor-select-control');
  const input=$('#news-author-input');
  const menu=$('#news-author-menu');
  const valueNode=control?.querySelector('.editor-select-value');
  if(!control||!input||!menu||!valueNode) return;
  await loadAuthorProfiles();
  const profiles=Object.values(state.authorProfiles||{}).sort((a,b)=>String(a.nickname||'').localeCompare(String(b.nickname||''),'ru'));
  if(state.user?.id && !profiles.some(p=>p.id===state.user.id)) profiles.unshift({id:state.user.id,nickname:state.user.profile?.nickname||state.user.email?.split('@')[0]||'Пользователь',role:state.user.profile?.role||'admin'});
  const options=profiles.map(profile=>({id:profile.id,label:(profile.nickname||'Пользователь')+(profile.role==='admin'?' — Администратор':'')}));
  menu.innerHTML=options.length?options.map(option=>'<button type="button" class="editor-select-option" data-editor-option="author" data-value="'+escapeHtml(option.id)+'" role="option">'+escapeHtml(option.label)+'</button>').join(''):'<div class="editor-select-empty">Нет доступных авторов</div>';
  const preferred=state.editor.authorId||selectedId||state.user?.id||'';
  const selected=options.find(option=>option.id===preferred)||options[0];
  if(selected){ input.value=selected.id; state.editor.authorId=selected.id; valueNode.textContent=selected.label; }
  else{ input.value=''; valueNode.textContent='Редакция'; }
  menu.querySelectorAll('.editor-select-option').forEach(option=>option.classList.toggle('is-selected',option.dataset.value===input.value));
  bindEditorSelectControls();
}
async function loadRemoteNews(){
  if(!state.supabase) return;

  try{
    await loadAuthorProfiles();

    const fullSelect='id,author_id,category,title,summary,body,image_url,accent_hex,palette,published_at,updated_at';
    let result=await state.supabase
      .from('news')
      .select(fullSelect)
      .order('published_at',{ascending:false});

    if(result.error){
      console.warn('Full news query failed, trying minimal query:',result.error);
      result=await state.supabase
        .from('news')
        .select('id,author_id,category,title,summary,body,image_url,accent_hex,published_at')
        .order('published_at',{ascending:false});
    }

    if(result.error) throw result.error;

    state.news=(result.data||[]).map(mapRemoteNews);
    renderNews();

  }catch(error){
    console.error('News load failed:',error);
    showToast('Не удалось загрузить новости из Supabase: '+(error.message||'неизвестная ошибка'));
    if(!state.news.length) renderNews();
  }
}


function openEditor(id,mode='edit'){
  const suggestionMode=mode==='suggest';
  if(suggestionMode){
    if(!state.user){ showToast('Сначала войдите в аккаунт'); return; }
  }else if(!state.admin){
    showToast('Редактор доступен только администраторам');
    return;
  }
  state.editor={ id:id?String(id):null, mode:'edit', originalImageUrl:null, generatedPalette:null, imageObjectUrl:null, pendingCoverFile:null, authorId:null, suggestionMode, submissionId:null };
  openSection('editor');
}

function editorTemplate(news){
  const edit=Boolean(news);
  return `<div class="editor-shell">
    <div class="editor-topbar">
      <div class="editor-title-wrap"><span class="eyebrow">${edit?'Редактирование':'Публикация'}</span><input id="news-title-input" class="editor-title-input" maxlength="180" placeholder="Заголовок новости" autocomplete="off"></div>
      <div class="editor-actions"><button id="editor-cancel" class="text-button"><span class="material-symbols-rounded">close</span>Отмена</button><button id="admin-save" class="filled-button"><span class="material-symbols-rounded">${edit?'save':'publish'}</span><span>${edit?'Сохранить':'Опубликовать'}</span></button></div>
    </div>
    <div class="editor-meta-grid">
      <div class="field editor-category-field"><span>Раздел</span><div class="editor-select-control" data-editor-select="category">
        <input type="hidden" id="news-category-input" value="Политика">
        <button class="editor-select-button" type="button" aria-haspopup="listbox" aria-expanded="false"><span class="editor-select-value">Политика</span><span class="material-symbols-rounded">expand_more</span></button>
        <div class="editor-select-menu" role="listbox" aria-label="Раздел новости">${CATEGORIES.map(c=>`<button type="button" class="editor-select-option${c===CATEGORIES[0]?' is-selected':''}" data-editor-option="category" data-value="${escapeHtml(c)}" role="option">${escapeHtml(c)}</button>`).join('')}</div>
      </div></div>
      <div class="field editor-author-field"><span>Автор</span><div class="editor-select-control" data-editor-select="author">
        <input type="hidden" id="news-author-input" value="">
        <button class="editor-select-button" type="button" aria-haspopup="listbox" aria-expanded="false"><span class="editor-select-value">Загрузка авторов…</span><span class="material-symbols-rounded">expand_more</span></button>
        <div id="news-author-menu" class="editor-select-menu" role="listbox" aria-label="Автор новости"><div class="editor-select-empty">Загрузка авторов…</div></div>
      </div></div>
      <label class="editor-summary-field"><span class="editor-field-label">Лид</span><textarea id="news-summary-input" class="editor-summary" maxlength="360" placeholder="Короткое описание или лид. Если оставить пустым, он будет взят из первого абзаца Markdown."></textarea></label>
    </div>
    <div class="editor-cover-row">
      <div class="editor-cover-panel">
        <img id="editor-cover-preview" class="editor-cover-preview" src="${escapeHtml(news?.image||'')}" alt="Предпросмотр обложки">
        <div class="editor-cover-controls"><button id="editor-upload-image" class="tonal-button" type="button"><span class="material-symbols-rounded">upload</span>Загрузить изображение</button><button id="editor-crop-image" class="tonal-button" type="button" disabled><span class="material-symbols-rounded">crop</span>Обрезать</button><input id="editor-image-file" type="file" accept="image/*" class="visually-hidden"><button id="editor-use-markdown-image" class="text-button" type="button">Взять первую картинку из Markdown</button></div>
        <div class="editor-status" id="editor-image-status">Палитра будет сгенерирована автоматически из цветов обложки. Ручного Accent HEX нет.</div>
      </div>
      <div class="editor-cover-panel"><label class="field"><span>URL обложки</span><input id="news-image-input" class="editor-cover-url" type="url" placeholder="https://..."></label><div id="editor-palette-swatches" class="palette-swatches"></div><p class="media-note">Изображение является единственным источником цветовой палитры.</p></div>
    </div>
    <div class="editor-workbench">
      <div class="editor-toolbar" id="editor-toolbar">
        <button class="editor-tool editor-tool-label" data-md="h1" title="Заголовок 1">H1</button><button class="editor-tool editor-tool-label" data-md="h2" title="Заголовок 2">H2</button><button class="editor-tool editor-tool-label" data-md="h3" title="Заголовок 3">H3</button>
        <span class="editor-toolbar-sep"></span>
        <button class="editor-tool" data-md="bold" title="Жирный"><strong>B</strong></button><button class="editor-tool" data-md="italic" title="Курсив"><em>I</em></button><button class="editor-tool" data-md="strike" title="Зачёркнутый"><s>S</s></button><button class="editor-tool" data-md="code" title="Инлайн-код">&lt;/&gt;</button><button class="editor-tool" data-md="codeblock" title="Блок кода">{ }</button>
        <span class="editor-toolbar-sep"></span>
        <button class="editor-tool" data-md="quote" title="Цитата">❝</button><button class="editor-tool" data-md="ul" title="Список">•</button><button class="editor-tool" data-md="ol" title="Нумерованный список">1.</button><button class="editor-tool" data-md="link" title="Ссылка">↗</button><button class="editor-tool" data-md="image" title="Изображение">▧</button><button class="editor-tool" data-md="table" title="Таблица">▦</button><button class="editor-tool" data-md="hr" title="Разделитель">—</button>
        <div class="editor-mode-switch"><button class="editor-mode is-selected" data-editor-mode="split" type="button">Два окна</button><button class="editor-mode" data-editor-mode="edit" type="button">Markdown</button><button class="editor-mode" data-editor-mode="preview" type="button">Предпросмотр</button></div>
      </div>
      <div class="editor-panes" id="editor-panes">
        <section class="editor-pane editor-pane-input"><div class="editor-pane-label">Markdown</div><textarea id="news-body-input" spellcheck="true" placeholder="Начните писать…\n\nПоддерживается обычный Markdown: заголовки, **жирный**, *курсив*, списки, цитаты, ссылки, изображения, таблицы, код и разделители."></textarea></section>
        <section class="editor-pane editor-pane-preview"><div class="editor-pane-label">Предпросмотр</div><div id="markdown-preview" class="markdown-preview"></div></section>
      </div>
      <div class="markdown-help">Поддерживаются <code># заголовки</code>, <code>**bold**</code>, <code>*italic*</code>, <code>~~strike~~</code>, <code>&#96;code&#96;</code>, блоки <code>&#96;&#96;&#96;</code>, цитаты <code>&gt;</code>, списки, <code>[ссылки](url)</code>, <code>![картинки](url)</code>, таблицы и <code>---</code>. Редактор сохраняет черновик локально.</div>
    </div>
    <p id="admin-message" class="form-message"></p>
  </div>`;
}

function renderEditor(){
  if(!state.user || (!state.admin && !state.editor.suggestionMode)){
    state.section='news';
    showToast('Редактор доступен только авторизованным пользователям.');
    openSection('news');
    return;
  }
  const news=state.editor.id
    ? state.news.find(item=>String(item.id)===String(state.editor.id))
    : null;
  setupEditor(news||null);
}

function setupEditor(news){
  const root=$('#editor-page');
  root.innerHTML=editorTemplate(news);
  if(state.editor.suggestionMode){
    const eyebrow=$('.editor-title-wrap .eyebrow');
    if(eyebrow) eyebrow.textContent='Предложение';
    const saveButton=$('#admin-save');
    if(saveButton){
      const icon=saveButton.querySelector('.material-symbols-rounded');
      if(icon) icon.textContent='send';
      const label=saveButton.querySelector('span:last-child');
      if(label) label.textContent='Предложить';
    }
    const authorField=$('.editor-author-field');
    const authorId=state.user?.id||'';
    if(authorField && authorId){
      const nickname=state.user?.profile?.nickname||state.user?.email?.split('@')[0]||'Пользователь';
      authorField.innerHTML='<span>Автор</span><div class="editor-author-readonly"><input type="hidden" id="news-author-input" value="'+escapeHtml(authorId)+'"><span class="editor-author-name">'+escapeHtml(nickname)+'</span></div>';
    }
  }
  $('#news-title-input').value=news?.title||'';
  state.editor.authorId=news?.authorId||state.user?.id||'';
  $('#news-category-input').value=news?.category||CATEGORIES[0];
  loadEditorAuthors(state.editor.authorId);
  bindEditorSelectControls();
  $('#news-summary-input').value=news?.summary||'';
  $('#news-body-input').value=news?.body||'';
  $('#news-image-input').value=news?.image||'';
  state.editor.originalImageUrl=news?.image||null;
  state.editor.generatedPalette=news?.palette||null;
  updateEditorCoverPreview();
  renderMarkdownPreview();
  syncEditorMode();
  bindEditorEvents();
  loadEditorDraft(news?.id||'new');
  syncEditorSelect('news-category-input');
  syncEditorSelect('news-author-input');
  if(news?.palette) renderPaletteSwatches(news.palette);
  else if(news?.image) updateEditorPaletteFromImage(news.image);
}

function bindEditorEvents(){
  $('#editor-cancel').onclick=()=>{ state.editor={id:null,mode:'edit',originalImageUrl:null,generatedPalette:null,imageObjectUrl:null,pendingCoverFile:null,authorId:null,suggestionMode:false,submissionId:null}; backToNews(); };
  $('#admin-save').onclick=saveEditorNews;
  $('#news-body-input').addEventListener('input',()=>{ renderMarkdownPreview(); saveEditorDraft(); });
  $('#news-title-input').addEventListener('input',saveEditorDraft);
  $('#news-summary-input').addEventListener('input',saveEditorDraft);
  $('#news-category-input').addEventListener('change',saveEditorDraft);
  $('#news-author-input').addEventListener('change',e=>{state.editor.authorId=e.target.value||null;saveEditorDraft();});
  $('#news-image-input').addEventListener('input',()=>{ updateEditorCoverPreview(); saveEditorDraft(); });
  $('#editor-upload-image').onclick=()=>$('#editor-image-file').click();
  $('#editor-crop-image').onclick=()=>openNewsCoverCrop();
  $('#editor-image-file').addEventListener('change',handleNewsImageUpload);
  $('#editor-crop-image').disabled=!state.editor.pendingCoverFile;
  $('#editor-use-markdown-image').onclick=useFirstMarkdownImageAsCover;
  $('#news-body-input').addEventListener('keydown',handleMarkdownKeydown);

  const editorRoot=$('#editor-page');

  $$('#editor-toolbar [data-md]').forEach(btn=>{
    btn.onclick=()=>applyMarkdownCommand(btn.dataset.md);
  });

  $$('.editor-mode').forEach(btn=>{
    btn.onclick=()=>{
      state.editor.mode=btn.dataset.editorMode;
      syncEditorMode();
    };
  });

  editorRoot?.addEventListener('click',e=>{
    if(e.target.closest('.editor-select-control')) return;
    editorRoot.querySelectorAll('.editor-select-control.is-open').forEach(item=>{
      item.classList.remove('is-open');
      item.querySelector('.editor-select-button')?.setAttribute('aria-expanded','false');
    });
  });

}
function syncEditorMode(){
  $$('.editor-mode').forEach(btn=>btn.classList.toggle('is-selected',btn.dataset.editorMode===state.editor.mode));
  const panes=$('#editor-panes');
  if(!panes) return;
  panes.dataset.editorMode=state.editor.mode;
  panes.style.gridTemplateColumns=state.editor.mode==='split'?'1fr 1fr':'1fr';
  $('.editor-pane-input').classList.toggle('hidden',state.editor.mode==='preview');
  $('.editor-pane-preview').classList.toggle('hidden',state.editor.mode==='edit');
}
function markdownValue(){ return $('#news-body-input')?.value||''; }
function setTextareaSelection(start,end){ const el=$('#news-body-input'); el.focus(); el.setSelectionRange(start,end); }
function wrapSelection(before,after=before,placeholder='текст'){
  const el=$('#news-body-input'); if(!el) return;
  const start=el.selectionStart,end=el.selectionEnd,text=el.value;
  const selected=text.slice(start,end)||placeholder;
  el.value=text.slice(0,start)+before+selected+after+text.slice(end);
  const cursor=start+before.length+selected.length+after.length;
  el.focus(); el.setSelectionRange(cursor,cursor); el.dispatchEvent(new Event('input'));
}
function prefixLines(prefix){
  const el=$('#news-body-input'); if(!el) return;
  const start=el.selectionStart,end=el.selectionEnd,text=el.value;
  const lineStart=text.lastIndexOf('\n',start-1)+1;
  const endLine=text.indexOf('\n',end); const lineEnd=endLine===-1?text.length:endLine;
  const selected=text.slice(lineStart,lineEnd);
  const changed=selected.split('\n').map(line=>line.startsWith(prefix)?line:prefix+line).join('\n');
  el.value=text.slice(0,lineStart)+changed+text.slice(lineEnd);
  el.focus(); el.setSelectionRange(lineStart,lineStart+changed.length); el.dispatchEvent(new Event('input'));
}
function applyMarkdownCommand(cmd){
  switch(cmd){
    case 'h1': prefixLines('# '); break;
    case 'h2': prefixLines('## '); break;
    case 'h3': prefixLines('### '); break;
    case 'bold': wrapSelection('**','**','жирный текст'); break;
    case 'italic': wrapSelection('*','*','курсив'); break;
    case 'strike': wrapSelection('~~','~~','зачёркнутый'); break;
    case 'code': wrapSelection('`','`','code'); break;
    case 'codeblock': wrapSelection('```\n','\n```\n','код'); break;
    case 'quote': prefixLines('> '); break;
    case 'ul': prefixLines('- '); break;
    case 'ol': prefixOrderedList(); break;
    case 'link': wrapSelection('[','](https://example.com)','текст ссылки'); break;
    case 'image': wrapSelection('![','](https://example.com/image.jpg)','описание'); break;
    case 'table': insertTable(); break;
    case 'hr': insertAtCursor('\n---\n'); break;
  }
}
function prefixOrderedList(){
  const el=$('#news-body-input'); if(!el) return;
  const start=el.selectionStart,end=el.selectionEnd,text=el.value,lineStart=text.lastIndexOf('\n',start-1)+1,endLine=text.indexOf('\n',end),lineEnd=endLine===-1?text.length:endLine;
  let index=1;
  const changed=text.slice(lineStart,lineEnd).split('\n').map(line=>`${index++}. ${line}`).join('\n');
  el.value=text.slice(0,lineStart)+changed+text.slice(lineEnd); el.focus(); el.setSelectionRange(lineStart,lineStart+changed.length); el.dispatchEvent(new Event('input'));
}
function insertTable(){
  insertAtCursor('| Поле | Значение |\n| --- | --- |\n| Текст | Текст |\n');
}
function insertAtCursor(value){
  const el=$('#news-body-input'); if(!el) return;
  const start=el.selectionStart,end=el.selectionEnd,text=el.value;
  el.value=text.slice(0,start)+value+text.slice(end);
  const cursor=start+value.length; el.focus(); el.setSelectionRange(cursor,cursor); el.dispatchEvent(new Event('input'));
}
function handleMarkdownKeydown(e){
  if(e.ctrlKey || e.metaKey){
    const code=e.code;
    if(code==='KeyB'){e.preventDefault();applyMarkdownCommand('bold');}
    if(code==='KeyI'){e.preventDefault();applyMarkdownCommand('italic');}
    if(code==='KeyK'){e.preventDefault();applyMarkdownCommand('link');}
    if(e.shiftKey && code==='Digit7'){e.preventDefault();applyMarkdownCommand('ol');}
    if(e.shiftKey && code==='Digit8'){e.preventDefault();applyMarkdownCommand('ul');}
    if(code==='KeyS'){e.preventDefault();saveEditorNews();}
    if(code==='Enter'){e.preventDefault();saveEditorNews();}
  }
  if(e.key==='Tab' && !e.ctrlKey && !e.metaKey){e.preventDefault(); insertAtCursor('  ');}
}

function renderMarkdownPreview(){
  const preview=$('#markdown-preview'); if(!preview) return;
  preview.innerHTML=parseMarkdown(markdownValue()||'*Начните писать — предпросмотр появится здесь.*');
}

function bindEditorSelectControls(){
  const root=$('#editor-page');
  if(!root) return;

  root.querySelectorAll('.editor-select-button').forEach(button=>{
    if(button.dataset.editorBound==='1') return;
    button.dataset.editorBound='1';
    button.onclick=e=>{
      e.preventDefault();
      e.stopPropagation();
      const control=button.closest('.editor-select-control');
      if(!control) return;
      root.querySelectorAll('.editor-select-control.is-open').forEach(other=>{
        if(other!==control){
          other.classList.remove('is-open');
          other.querySelector('.editor-select-button')?.setAttribute('aria-expanded','false');
        }
      });
      const isOpen=control.classList.toggle('is-open');
      button.setAttribute('aria-expanded',String(isOpen));
    };
    button.onkeydown=e=>{
      if(e.key==='Enter'||e.key===' '){
        e.preventDefault();
        button.click();
      }else if(e.key==='Escape'){
        e.preventDefault();
        const control=button.closest('.editor-select-control');
        control?.classList.remove('is-open');
        button.setAttribute('aria-expanded','false');
      }
    };
  });

  root.querySelectorAll('.editor-select-option').forEach(option=>{
    if(option.dataset.editorBound==='1') return;
    option.dataset.editorBound='1';
    option.onclick=e=>{
      e.preventDefault();
      e.stopPropagation();
      const control=option.closest('.editor-select-control');
      const input=control?.querySelector('input[type="hidden"]');
      const valueNode=control?.querySelector('.editor-select-value');
      if(!control||!input||!valueNode) return;
      input.value=option.dataset.value||'';
      valueNode.textContent=option.textContent.trim();
      control.querySelectorAll('.editor-select-option').forEach(item=>item.classList.toggle('is-selected',item===option));
      control.classList.remove('is-open');
      control.querySelector('.editor-select-button')?.setAttribute('aria-expanded','false');
      input.dispatchEvent(new Event('change',{bubbles:true}));
    };
  });
}

function syncEditorSelect(inputId){
  const input=$('#'+inputId);
  if(!input) return;
  const control=input.closest('.editor-select-control');
  if(!control) return;
  const options=[...control.querySelectorAll('.editor-select-option')];
  const option=options.find(item=>item.dataset.value===input.value);
  const valueNode=control.querySelector('.editor-select-value');
  if(option&&valueNode) valueNode.textContent=option.textContent.trim();
  options.forEach(item=>item.classList.toggle('is-selected',item===option));
}
function saveEditorDraft(){
  const id=state.editor.id||'new';
  const payload={title:$('#news-title-input')?.value||'',category:$('#news-category-input')?.value||CATEGORIES[0],authorId:$('#news-author-input')?.value||state.editor.authorId||state.user?.id||'',summary:$('#news-summary-input')?.value||'',body:markdownValue(),image:$('#news-image-input')?.value||''};
  try{localStorage.setItem(`news-editor-draft-${id}`,JSON.stringify(payload));}catch(_){ }
}
function loadEditorDraft(id){
  if(id!=='new' && state.editor.id) return;
  try{
    const raw=localStorage.getItem(`news-editor-draft-${id}`); if(!raw) return;
    const draft=JSON.parse(raw); const isEmpty=!$('#news-title-input').value&&!markdownValue()&&!$('#news-image-input').value;
    if(isEmpty){
      $('#news-title-input').value=draft.title||''; $('#news-category-input').value=draft.category||CATEGORIES[0]; state.editor.authorId=draft.authorId||state.editor.authorId||state.user?.id||''; $('#news-author-input').value=state.editor.authorId; syncEditorSelect('news-category-input'); syncEditorSelect('news-author-input'); $('#news-summary-input').value=draft.summary||''; $('#news-body-input').value=draft.body||''; $('#news-image-input').value=draft.image||''; renderMarkdownPreview(); updateEditorCoverPreview();
      showToast('Черновик восстановлен из локального хранилища');
    }
  }catch(_){ }
}

function updateEditorCoverPreview(){
  const img=$('#editor-cover-preview'),url=$('#news-image-input')?.value.trim();
  if(!img) return;
  img.src=url||'';
  img.style.opacity=url?'1':'.28';
  if(url) updateEditorPaletteFromImage(url);
  else if(state.section==='editor') activateNeutralPalette();
}

async function updateEditorPaletteFromImage(url){
  if(!url){
    if(state.section==='editor') activateNeutralPalette();
    return;
  }
  const status=$('#editor-image-status');
  if(status) status.textContent='Анализируем изображение по M3 Content…';
  try{
    const palette=await generateM3ContentPaletteFromImage(url);
    state.editor.generatedPalette=palette;
    renderPaletteSwatches(palette);
    if(state.section==='editor'){
      state.paletteContext='editor';
      applySitePalette(palette);
    }
    if(status) status.textContent=`M3 Content-палитра готова из изображения. Seed: ${palette.seed}.`;
  }catch(error){
    state.editor.generatedPalette=null;
    if(state.section==='editor') activateNeutralPalette();
    if(status) status.textContent=`Не удалось прочитать цвета изображения: ${error.message}`;
    $('#editor-palette-swatches').innerHTML='';
  }
}


function renderPaletteSwatches(palette){
  const root=$('#editor-palette-swatches'); if(!root||!palette) return;
  const colors=[palette.light.primary,palette.light.primary_container,palette.light.secondary,palette.light.tertiary,palette.dark.primary,palette.dark.surface];
  root.innerHTML=`<div class="palette-swatches-grid">${colors.map(hex=>`<span title="${hex}" style="background:${hex}"></span>`).join('')}</div><small>Автоматически из обложки</small>`;
}

async function handleNewsImageUpload(){
  const file=$('#editor-image-file').files?.[0]; if(!file) return;
  const localUrl=URL.createObjectURL(file);
  $('#news-image-input').value='';
  $('#editor-cover-preview').src=localUrl; $('#editor-cover-preview').style.opacity='1';
  state.editor.imageObjectUrl=localUrl;
  state.editor.pendingCoverFile=file;
  $('#editor-crop-image').disabled=false;
  await updateEditorPaletteFromImage(localUrl);
  $('#editor-image-status').textContent='Изображение готово. Можно обрезать его перед публикацией.';
  saveEditorDraft();
}


function openNewsCoverCrop(){
  const dialog=$('#news-cover-crop-dialog'), canvas=$('#news-cover-crop-canvas');
  if(!dialog||!canvas) return;
  const file=state.editor.pendingCoverFile;
  if(!file){ showToast('Сначала загрузите изображение с компьютера.'); return; }
  const url=state.editor.imageObjectUrl||URL.createObjectURL(file);
  const img=new Image();
  img.onload=()=>{
    state.newsCoverCrop={file,img,objectUrl:url,zoom:1,rotation:0,x:0,y:0,dragging:false,lastX:0,lastY:0};
    $('#news-cover-zoom').value='1';
    renderNewsCoverCrop();
    dialog.showModal();
  };
  img.onerror=()=>showToast('Не удалось открыть изображение для обрезки.');
  img.src=url;
}

function renderNewsCoverCrop(showGuide=true){
  const canvas=$('#news-cover-crop-canvas'), ctx=canvas?.getContext('2d'), c=state.newsCoverCrop;
  if(!canvas||!ctx||!c?.img)return;
  const w=canvas.width,h=canvas.height, rotatedQuarter=(Math.abs(c.rotation)%180)!==0;
  const imgW=rotatedQuarter?c.img.naturalHeight:c.img.naturalWidth;
  const imgH=rotatedQuarter?c.img.naturalWidth:c.img.naturalHeight;
  const base=Math.max(w/imgW,h/imgH), scale=base*c.zoom;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#111';ctx.fillRect(0,0,w,h);
  ctx.save();
  ctx.translate(w/2+c.x,h/2+c.y);
  ctx.rotate(c.rotation*Math.PI/180);
  ctx.drawImage(c.img,-c.img.naturalWidth*scale/2,-c.img.naturalHeight*scale/2,c.img.naturalWidth*scale,c.img.naturalHeight*scale);
  ctx.restore();
  if(showGuide){
    ctx.strokeStyle='rgba(255,255,255,.92)';ctx.lineWidth=3;ctx.strokeRect(1.5,1.5,w-3,h-3);
    ctx.strokeStyle='rgba(255,255,255,.22)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(w/3,0);ctx.lineTo(w/3,h);ctx.moveTo((w/3)*2,0);ctx.lineTo((w/3)*2,h);ctx.moveTo(0,h/3);ctx.lineTo(w,h/3);ctx.moveTo(0,(h/3)*2);ctx.lineTo(w,(h/3)*2);ctx.stroke();
  }
}

function closeNewsCoverCrop(){
  $('#news-cover-crop-dialog')?.close();
  const c=state.newsCoverCrop;
  if(c?.objectUrl && c.objectUrl!==state.editor.imageObjectUrl) URL.revokeObjectURL(c.objectUrl);
  state.newsCoverCrop=null;
}

function initNewsCoverCrop(){
  const canvas=$('#news-cover-crop-canvas');
  if(!canvas)return;
  canvas.addEventListener('pointerdown',e=>{
    const c=state.newsCoverCrop;if(!c)return;
    c.dragging=true;c.lastX=e.clientX;c.lastY=e.clientY;canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
    const c=state.newsCoverCrop;if(!c?.dragging)return;
    c.x+=e.clientX-c.lastX;c.y+=e.clientY-c.lastY;c.lastX=e.clientX;c.lastY=e.clientY;renderNewsCoverCrop();
  });
  const stop=()=>{if(state.newsCoverCrop)state.newsCoverCrop.dragging=false;};
  canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
  $('#news-cover-zoom').addEventListener('input',e=>{if(state.newsCoverCrop){state.newsCoverCrop.zoom=Number(e.target.value);renderNewsCoverCrop();}});
  $('#news-cover-rotate-left').onclick=()=>{if(state.newsCoverCrop){state.newsCoverCrop.rotation-=90;renderNewsCoverCrop();}};
  $('#news-cover-rotate-right').onclick=()=>{if(state.newsCoverCrop){state.newsCoverCrop.rotation+=90;renderNewsCoverCrop();}};
  $('#news-cover-crop-reset').onclick=()=>{const c=state.newsCoverCrop;if(!c)return;c.zoom=1;c.rotation=0;c.x=0;c.y=0;$('#news-cover-zoom').value='1';renderNewsCoverCrop();};
  $('#news-cover-crop-close').onclick=closeNewsCoverCrop;
  $('#news-cover-crop-cancel').onclick=closeNewsCoverCrop;
  $('#news-cover-crop-apply').onclick=()=>{
    const canvas=$('#news-cover-crop-canvas'), c=state.newsCoverCrop;
    if(!canvas||!c)return;
    renderNewsCoverCrop(false);
    canvas.toBlob(blob=>{
      if(!blob){renderNewsCoverCrop(true);showToast('Не удалось подготовить обрезанное изображение.');return;}
      const baseName=(c.file.name||'news-image').replace(/\.[^.]+$/,'');
      const croppedFile=new File([blob],`${baseName}-cropped.webp`,{type:'image/webp',lastModified:Date.now()});
      const newUrl=URL.createObjectURL(blob);
      if(state.editor.imageObjectUrl) URL.revokeObjectURL(state.editor.imageObjectUrl);
      state.editor.imageObjectUrl=newUrl;
      state.editor.pendingCoverFile=croppedFile;
      $('#editor-crop-image').disabled=false;
      $('#news-image-input').value='';
      const preview=$('#editor-cover-preview'); if(preview){preview.src=newUrl;preview.style.opacity='1';}
      $('#editor-image-status').textContent='Обрезка применена. В публикацию будет загружена обрезанная копия изображения.';
      updateEditorPaletteFromImage(newUrl);
      saveEditorDraft();
      $('#news-cover-crop-dialog').close();
      state.newsCoverCrop=null;
    },'image/webp',.92);
  };
  $('#news-cover-crop-dialog').addEventListener('close',()=>{if(state.newsCoverCrop)state.newsCoverCrop=null;});
}

function extractFirstImageFromMarkdown(markdown){
  const match=String(markdown||'').match(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/);
  return match?.[1]||null;
}
function useFirstMarkdownImageAsCover(){
  const url=extractFirstImageFromMarkdown(markdownValue());
  if(!url){showToast('В Markdown нет изображения формата ![](url)');return;}
  $('#news-image-input').value=url; updateEditorCoverPreview(); showToast('Первая картинка назначена обложкой');
}

async function uploadNewsImage(file,scope='news'){
  if(!state.supabase||!state.user) throw new Error('Supabase не подключён.');
  const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
  const root=scope==='suggestion'?'suggestions':'news';
  const path=`${root}/${state.user.id}/${Date.now()}-${safe}`;
  const {error}=await state.supabase.storage.from('news-images').upload(path,file,{upsert:false,contentType:file.type,cacheControl:'3600'});
  if(error) throw error;
  return state.supabase.storage.from('news-images').getPublicUrl(path).data.publicUrl;
}


async function saveNewsSuggestion(){
  if(!state.supabase||!state.user){showToast('Нужен аккаунт.');return;}
  const msg=$('#admin-message');
  if(msg) msg.textContent='';
  const title=$('#news-title-input').value.trim();
  const category=$('#news-category-input').value;
  const body=markdownValue().trim();
  let summary=$('#news-summary-input').value.trim();
  let imageUrl=$('#news-image-input').value.trim();
  if(!title){if(msg) msg.textContent='Укажите заголовок.';return;}
  if(!body){if(msg) msg.textContent='Введите текст новости в Markdown.';return;}
  try{
    if(state.editor.pendingCoverFile){
      if(msg) msg.textContent='Загружаем обложку…';
      imageUrl=await uploadNewsImage(state.editor.pendingCoverFile,'suggestion');
      $('#news-image-input').value=imageUrl;
      state.editor.pendingCoverFile=null;
    }
    if(!imageUrl){
      imageUrl=extractFirstImageFromMarkdown(body)||'';
      $('#news-image-input').value=imageUrl;
    }
    if(!imageUrl){if(msg) msg.textContent='Нужно добавить изображение: палитра строится только из цветов изображения новости.';return;}
    if(msg) msg.textContent='Генерируем M3 Content-палитру из изображения…';
    const palette=state.editor.generatedPalette?.generator===M3_IMAGE_PALETTE_GENERATOR
      ? state.editor.generatedPalette
      : await generateM3ContentPaletteFromImage(imageUrl);
    state.editor.generatedPalette=palette;
    if(!summary){
      const firstPlain=(body.replace(/^#{1,6}\s+/gm,'').replace(/[*_#>-]/g,'').split(/\n\s*\n/).find(Boolean)||'').trim();
      summary=firstPlain.slice(0,360);
    }
    const payload={category,title,summary,body,image_url:imageUrl,author_id:state.user.id,palette,status:'pending'};
    const {error}=await state.supabase.from('news_submissions').insert(payload);
    if(error) throw error;
    try{localStorage.removeItem('news-editor-draft-new');}catch(_){}
    state.editor={id:null,mode:'edit',originalImageUrl:null,generatedPalette:null,imageObjectUrl:null,pendingCoverFile:null,authorId:null,suggestionMode:false,submissionId:null};
    showToast('Предложение отправлено редактору');
    openSection('profile');
    renderProfile();
  }catch(error){
    if(msg) msg.textContent=error.message||'Не удалось отправить предложение.';
  }
}

async function saveEditorNews(){
  if(state.editor.suggestionMode && !state.admin) return saveNewsSuggestion();
  if(!state.supabase||!state.user||!state.admin){showToast('Нужен аккаунт администратора.');return;}
  const msg=$('#admin-message'); msg.textContent='';
  const title=$('#news-title-input').value.trim(), category=$('#news-category-input').value, body=markdownValue().trim();
  let summary=$('#news-summary-input').value.trim(); let imageUrl=$('#news-image-input').value.trim();
  if(!title){msg.textContent='Укажите заголовок.';return;}
  if(!body){msg.textContent='Введите текст новости в Markdown.';return;}
  try{
    if(state.editor.pendingCoverFile){
      msg.textContent='Загружаем обложку…';
      imageUrl=await uploadNewsImage(state.editor.pendingCoverFile);
      $('#news-image-input').value=imageUrl;
      state.editor.pendingCoverFile=null;
    }
    if(!imageUrl){
      imageUrl=extractFirstImageFromMarkdown(body)||'';
      $('#news-image-input').value=imageUrl;
    }
    if(!imageUrl){msg.textContent='Нужно добавить изображение: палитра строится только из цветов изображения новости.';return;}
    msg.textContent='Генерируем M3 Content-палитру из изображения…';
    const palette=state.editor.generatedPalette?.generator===M3_IMAGE_PALETTE_GENERATOR
      ? state.editor.generatedPalette
      : await generateM3ContentPaletteFromImage(imageUrl);
    state.editor.generatedPalette=palette;
    if(!summary){
      const firstPlain=(body.replace(/^#{1,6}\s+/gm,'').replace(/[*_`>#-]/g,'').split(/\n\s*\n/).find(Boolean)||'').trim();
      summary=firstPlain.slice(0,360);
    }
    const authorId=$('#news-author-input')?.value||state.editor.authorId||state.user.id;
    const payload={category,title,summary,body,image_url:imageUrl,author_id:authorId,accent_hex:palette.light.primary,palette};
    const query=state.editor.id
      ? state.supabase.from('news').update(payload).eq('id',state.editor.id).select('id,author_id,category,title,summary,body,image_url,accent_hex,palette,published_at,updated_at').single()
      : state.supabase.from('news').insert(payload).select('id,author_id,category,title,summary,body,image_url,accent_hex,palette,published_at,updated_at').single();
    const {data,error}=await query;
    if(error) throw error;
    const mapped=mapRemoteNews(data);
    if(state.editor.id){
      const idx=state.news.findIndex(n=>String(n.id)===String(state.editor.id));
      if(idx>=0) state.news[idx]=mapped;
    }else state.news.unshift(mapped);
    try{localStorage.removeItem(`news-editor-draft-${state.editor.id||'new'}`);}catch(_){ }
    showToast(state.editor.id?'Новость обновлена':'Новость опубликована');
    state.articleId=mapped.id;
    openSection('article');
    renderArticle();
    applySitePalette(palette);
  }catch(error){ msg.textContent=error.message||'Не удалось сохранить новость.'; }
}

async function deleteNews(id){
  if(!state.supabase||!state.admin) return;
  const n=state.news.find(item=>String(item.id)===String(id));
  if(!n)return;
  if(!window.confirm(`Удалить новость «${n.title}»? Это действие необратимо.`)) return;
  try{
    const {error}=await state.supabase.from('news').delete().eq('id',id);
    if(error) throw error;
    state.news=state.news.filter(item=>String(item.id)!==String(id));
    state.articleId=null;
    showToast('Новость удалена');
    openSection('news'); renderNews();
  }catch(error){ showToast(error.message||'Не удалось удалить новость.'); }
}

async function saveProfile(){
  const msg=$('#profile-message'); msg.textContent='';
  if(!state.supabase||!state.user){msg.textContent='Сначала войдите в аккаунт.';return;}
  let avatarUrl=$('#profile-avatar').value.trim()||null;
  try{
    const file=state.pendingAvatarBlob;
    if(file){
      const path=`${state.user.id}/${Date.now()}-avatar.webp`;
      const upload=await state.supabase.storage.from('avatars').upload(path,file,{upsert:true,contentType:'image/webp',cacheControl:'3600'});
      if(upload.error) throw upload.error;
      avatarUrl=state.supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    }
    const payload={id:state.user.id,nickname:$('#profile-nickname').value.trim(),avatar_url:avatarUrl,bio:$('#profile-bio').value.trim()};
    const {data,error}=await state.supabase.from('profiles').upsert(payload).select('*').single();
    if(error) throw error;
    state.user.profile=data; state.pendingAvatarBlob=null; $('#avatar-preview-note').textContent='Для локального файла после выбора откроется кадрирование 1:1.';
    $('#edit-profile-dialog').close(); updateAuthUI(); renderProfile(); if(state.section==='profile') activateProfilePalette(); showToast('Профиль сохранён');
  }catch(error){ msg.textContent=error.message||'Не удалось сохранить профиль.'; }
}

function searchNews(value=$('#news-search')?.value||''){
  state.search=value.trim(); state.selectedNewsIndex=0; renderNews();
}

function focusSearch(){ $('#news-search')?.focus(); $('#news-search')?.select(); }
function focusNews(delta){
  if(state.section!=='news') return;
  const cards=visibleNewsCards(); if(!cards.length) return;
  state.selectedNewsIndex=clamp(state.selectedNewsIndex+delta,0,cards.length-1);
  updateSelectedCard();
  scrollElementIntoMain(cards[state.selectedNewsIndex]);
}
function openSelectedNews(){ const cards=visibleNewsCards(); if(cards[state.selectedNewsIndex]) openArticle(cards[state.selectedNewsIndex].dataset.id); }
function scrollPage(delta){ scrollMainBy(getMainScroller().clientHeight*.82*delta); }
function searchResult(delta){ focusNews(delta); }
function jumpToEdge(end=false){ state.selectedNewsIndex=end?Math.max(0,visibleNewsCards().length-1):0; updateSelectedCard(); scrollElementIntoMain(visibleNewsCards()[state.selectedNewsIndex]); }
function randomNews(){ if(!state.news.length)return; const item=state.news[Math.floor(Math.random()*state.news.length)]; openArticle(item.id); }

function clearSearch(){ state.search=''; $('#news-search').value=''; renderNews(); $('#news-search').focus(); }
function clearNewsState(){ state.search='';state.category=null;state.selectedNewsIndex=0;renderCategoryNav();renderNews();showToast('Фильтры сброшены'); }

function handleGlobalKeydown(e){
  const target=e.target;
  const isEditable=target.matches?.('input,textarea,select,[contenteditable="true"]');
  const code=e.code;

  const leaderCode = code==='KeyG' || code==='Space';
  if(e.repeat && (state.keySequence || leaderCode)) return;

  // The help panel owns keyboard scrolling while open.
  if(state.expandedHelp){
    if(code==='Escape'){
      e.preventDefault();
      toggleHelp(false);
      return;
    }
    if(code==='PageDown' || code==='ArrowDown' || code==='KeyJ' || (e.ctrlKey && code==='KeyD')){
      e.preventDefault();
      const panel=$('#whichkey-panel');
      panel?.scrollBy({top:code==='PageDown'?panel.clientHeight*.85:180,behavior:'smooth'});
      return;
    }
    if(code==='PageUp' || code==='ArrowUp' || code==='KeyK' || (e.ctrlKey && code==='KeyU')){
      e.preventDefault();
      const panel=$('#whichkey-panel');
      panel?.scrollBy({top:code==='PageUp'?-panel.clientHeight*.85:-180,behavior:'smooth'});
      return;
    }
    if(code==='Home'){
      e.preventDefault();
      const panel=$('#whichkey-panel');
      if(panel)panel.scrollTo({top:0,behavior:'smooth'});
      return;
    }
    if(code==='End'){
      e.preventDefault();
      const panel=$('#whichkey-panel');
      if(panel)panel.scrollTo({top:panel.scrollHeight,behavior:'smooth'});
      return;
    }
  }

  if(code==='Escape' && !e.ctrlKey && !e.metaKey){
    if(state.expandedHelp){e.preventDefault();toggleHelp(false);return;}
    if($('#auth-dialog').open){e.preventDefault();$('#auth-dialog').close();return;}
    if($('#edit-profile-dialog').open){e.preventDefault();$('#edit-profile-dialog').close();return;}
    if($('#avatar-crop-dialog').open){e.preventDefault();$('#avatar-crop-dialog').close();return;}
    if(state.section==='article'||state.section==='editor'){e.preventDefault();backToNews();return;}
  }
  if((e.ctrlKey||e.metaKey) && code==='Enter' && state.section==='editor'){e.preventDefault();saveEditorNews();return;}
  if((e.ctrlKey||e.metaKey) && code==='KeyS' && state.section==='editor'){e.preventDefault();saveEditorNews();return;}

  if(isEditable){
    if(code==='Escape' && target.id==='news-search'){ target.blur(); return; }
    return;
  }

  if(e.ctrlKey || e.metaKey){
    if(code==='KeyD'){e.preventDefault();scrollPage(1);return;}
    if(code==='KeyU'){e.preventDefault();scrollPage(-1);return;}
  }

  if(code==='Escape') return;

  if(code==='Space'){
    e.preventDefault();
    state.leaderHeld='SPACE';
    state.keySequence='SPACE';
    clearTimeout(state.keySequenceTimer);
    state.keySequenceTimer=setTimeout(()=>{ if(state.leaderHeld!=='SPACE') state.keySequence=''; },1200);
    return;
  }

  if(state.keySequence==='SPACE' && code==='Slash'){
    e.preventDefault();
    clearTimeout(state.keySequenceTimer);
    toggleHelp(!state.expandedHelp);
    if(state.leaderHeld==='SPACE'){
      state.keySequenceTimer=setTimeout(()=>{ if(state.leaderHeld!=='SPACE') state.keySequence=''; },1200);
    }else{
      state.keySequence='';
    }
    return;
  }

  if(code==='Slash'){
    e.preventDefault();
    if(e.shiftKey){ toggleHelp(!state.expandedHelp); } else { focusSearch(); }
    return;
  }
  if(code==='KeyT'){e.preventDefault();setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');return;}
  if(code==='KeyJ'||code==='ArrowDown'){e.preventDefault();focusNews(1);return;}
  if(code==='KeyK'||code==='ArrowUp'){e.preventDefault();focusNews(-1);return;}
  if(code==='PageDown'){e.preventDefault();scrollPage(1);return;}
  if(code==='PageUp'){e.preventDefault();scrollPage(-1);return;}
  if(code==='Home'){e.preventDefault();jumpToEdge(false);return;}
  if(code==='KeyG' && e.shiftKey){e.preventDefault();jumpToEdge(true);return;}
  if(code==='KeyG'){
    if(state.keySequence==='G' && state.leaderHeld!=='G'){
      e.preventDefault();
      state.keySequence='';
      clearTimeout(state.keySequenceTimer);
      jumpToEdge(false);
      return;
    }
    e.preventDefault();
    state.leaderHeld='G';
    state.keySequence='G';
    clearTimeout(state.keySequenceTimer);
    state.keySequenceTimer=setTimeout(()=>{ if(state.leaderHeld!=='G') state.keySequence=''; },1200);
    return;
  }

  if(state.keySequence==='G'){
    const commands={KeyN:()=>openSection('news'),KeyP:()=>openSection('profile'),KeyA:()=>openSection('about'),KeyE:()=>openEditor(null),KeyT:()=>setCategory('Туризм'),Minus:()=>setCategory('Военнообязанные'),Digit1:()=>setCategory(CATEGORIES[0]),Digit2:()=>setCategory(CATEGORIES[1]),Digit3:()=>setCategory(CATEGORIES[2]),Digit4:()=>setCategory(CATEGORIES[3]),Digit5:()=>setCategory(CATEGORIES[4]),Digit6:()=>setCategory(CATEGORIES[5]),Digit7:()=>setCategory(CATEGORIES[6]),Digit8:()=>setCategory(CATEGORIES[7]),Digit9:()=>setCategory(CATEGORIES[8]),Digit0:()=>setCategory(CATEGORIES[9])};
    if(commands[code]){
      e.preventDefault();
      commands[code]();
      clearTimeout(state.keySequenceTimer);
      if(state.leaderHeld==='G'){
        state.keySequence='G';
        state.keySequenceTimer=setTimeout(()=>{ if(state.leaderHeld!=='G') state.keySequence=''; },1200);
      }else{
        state.keySequence='';
      }
      return;
    }
  }

  if(code==='Enter'||code==='KeyO'){e.preventDefault(); if(state.section==='news')openSelectedNews(); return;}
  if(code==='KeyB'){e.preventDefault();if(state.section==='article'||state.section==='editor')backToNews();else if(state.section!=='news')openSection('news');return;}
  if(code==='BracketLeft'||code==='BracketRight'){
    if(state.section==='article'){
      const nav=getArticleNeighbors(); const target=code==='BracketLeft'?nav.previous:nav.next; if(target) openArticle(target.id);
    }
    return;
  }
  if(code==='KeyR'){e.preventDefault();randomNews();return;}
  if(code==='KeyC'){e.preventDefault();clearNewsState();return;}
  if(code==='KeyX'){e.preventDefault();clearSearch();return;}
  if(code==='KeyN'){e.preventDefault();searchResult(e.shiftKey?-1:1);return;}
  if(code==='KeyD' && state.admin && state.section==='article'){e.preventDefault();deleteNews(state.articleId);return;}
  if(code==='KeyE' && state.admin && state.section==='article'){e.preventDefault();openEditor(state.articleId);return;}

  state.keySequence='';
}

function onMobileMenu(){
  const nav=$('.app-nav');
  const scrim=$('#mobile-scrim');
  if(!nav)return;
  if(window.matchMedia('(max-width: 860px)').matches){
    nav.classList.add('is-open');
    scrim?.classList.add('is-visible');
  }else{
    nav.classList.toggle('is-collapsed');
    document.body.classList.toggle('nav-collapsed',nav.classList.contains('is-collapsed'));
  }
}
function closeMobileMenu(){
  const nav=$('.app-nav');
  const scrim=$('#mobile-scrim');
  nav?.classList.remove('is-open');
  scrim?.classList.remove('is-visible');
}

function initAvatarCrop(){
  const input=$('#profile-avatar-file'), canvas=$('#avatar-crop-canvas'), ctx=canvas.getContext('2d');
  input.addEventListener('change',()=>{
    const file=input.files?.[0]; if(!file)return;
    const url=URL.createObjectURL(file); const img=new Image();
    img.onload=()=>{ state.avatarCrop={file,img,zoom:1,rotation:0,x:0,y:0,dragging:false,lastX:0,lastY:0,blob:null}; drawAvatarCrop(); $('#avatar-crop-dialog').showModal(); };
    img.src=url;
  });
  function drawAvatarCrop(){
    const s=canvas.width, c=state.avatarCrop; ctx.clearRect(0,0,s,s); ctx.fillStyle='#111';ctx.fillRect(0,0,s,s); if(!c.img)return;
    const base=Math.max(s/c.img.naturalWidth,s/c.img.naturalHeight), scale=base*c.zoom;
    ctx.save(); ctx.translate(s/2+c.x,s/2+c.y); ctx.rotate(c.rotation*Math.PI/180); ctx.drawImage(c.img,-c.img.naturalWidth*scale/2,-c.img.naturalHeight*scale/2,c.img.naturalWidth*scale,c.img.naturalHeight*scale); ctx.restore();
    ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=2;ctx.strokeRect(1,1,s-2,s-2);
  }
  canvas.addEventListener('pointerdown',e=>{const c=state.avatarCrop;c.dragging=true;c.lastX=e.clientX;c.lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{const c=state.avatarCrop;if(!c.dragging)return;c.x+=e.clientX-c.lastX;c.y+=e.clientY-c.lastY;c.lastX=e.clientX;c.lastY=e.clientY;drawAvatarCrop();});
  canvas.addEventListener('pointerup',()=>state.avatarCrop.dragging=false);
  $('#avatar-zoom').addEventListener('input',e=>{state.avatarCrop.zoom=Number(e.target.value);drawAvatarCrop();});
  $('#avatar-rotate-left').onclick=()=>{state.avatarCrop.rotation-=90;drawAvatarCrop();};
  $('#avatar-rotate-right').onclick=()=>{state.avatarCrop.rotation+=90;drawAvatarCrop();};
  $('#avatar-crop-reset').onclick=()=>{state.avatarCrop.zoom=1;state.avatarCrop.rotation=0;state.avatarCrop.x=0;state.avatarCrop.y=0;$('#avatar-zoom').value='1';drawAvatarCrop();};
  $('#avatar-crop-close').onclick=()=>$('#avatar-crop-dialog').close();
  $('#avatar-crop-cancel').onclick=()=>$('#avatar-crop-dialog').close();
  $('#avatar-crop-apply').onclick=()=>{
    const out=document.createElement('canvas');out.width=out.height=512;const octx=out.getContext('2d');const s=canvas.width;const c=state.avatarCrop;
    octx.drawImage(canvas,0,0,s,s,0,0,512,512);
    out.toBlob(blob=>{state.pendingAvatarBlob=blob;$('#avatar-preview-note').textContent='Кадрирование применено. После сохранения изображение будет загружено в Supabase Storage.';$('#profile-avatar').value='';$('#avatar-crop-dialog').close();},'image/webp',.9);
  };
}

function bindGlobalEvents(){
  const bind=(selector,event,handler)=>{
    const el=$(selector);
    if(el)el.addEventListener(event,handler);
  };

  document.addEventListener('keydown',handleGlobalKeydown);
  document.addEventListener('keyup',e=>{
    if(e.code==='KeyG' && state.leaderHeld==='G') state.leaderHeld='';
    if(e.code==='Space' && state.leaderHeld==='SPACE') state.leaderHeld='';
    if(!state.leaderHeld) clearTimeout(state.keySequenceTimer);
  });

  bind('#theme-toggle','click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
  bind('#keyboard-help','click',()=>toggleHelp(true));
  bind('#close-help','click',()=>toggleHelp(false));
  bind('#auth-button','click',()=>openAuth('login'));
  bind('#avatar-button','click',()=>openSection('profile'));
  bind('#mobile-menu','click',onMobileMenu);
  bind('#mobile-scrim','click',closeMobileMenu);
  bind('#random-news','click',randomNews);
  bind('#clear-news-state','click',clearNewsState);
  bind('#news-search','input',e=>searchNews(e.target.value));
  bind('#search-clear','click',clearSearch);
  bind('#main-nav','click',e=>{
    const btn=e.target.closest('[data-section]');
    if(btn){
      openSection(btn.dataset.section);
      closeMobileMenu();
    }
  });
  bind('#category-nav','click',e=>{
    const btn=e.target.closest('[data-category]');
    if(btn)setCategory(btn.dataset.category);
  });
  bind('#mobile-category-nav','click',e=>{
    const btn=e.target.closest('[data-category]');
    if(btn)setCategory(btn.dataset.category);
  });
  bind('#mobile-dock','click',e=>{
    const btn=e.target.closest('[data-section]');
    if(btn){
      openSection(btn.dataset.section);
      scrollMainToTop();
    }
  });

  $$('.segment').forEach(btn=>{
    btn.addEventListener('click',()=>setAuthMode(btn.dataset.authMode));
  });
  bind('#auth-submit','click',submitAuth);
  bind('#profile-save','click',saveProfile);

  try{
    initAvatarCrop();
  }catch(error){
    console.error('Avatar crop initialization failed:',error);
  }

  try{
    initNewsCoverCrop();
  }catch(error){
    console.error('News cover crop initialization failed:',error);
  }

  try{
    initTouchGestures();
  }catch(error){
    console.error('Touch gestures initialization failed:',error);
  }
}

function initTouchGestures(){
  if(!('ontouchstart' in window) && !navigator.maxTouchPoints) return;
  let touchStart=null;
  const threshold=72;

  const ignoredTarget=(target)=>{
    return !!target?.closest?.('input,textarea,select,button,a,[contenteditable="true"],.mobile-category-scroll,.mobile-dock,pre,.md-table-wrap');
  };

  document.addEventListener('touchstart',e=>{
    if(!window.matchMedia?.('(max-width: 860px)').matches) return;
    const t=e.changedTouches?.[0];
    if(!t) return;
    touchStart={
      x:t.clientX,y:t.clientY,
      time:Date.now(),
      edgeLeft:t.clientX<=28,
      ignored:ignoredTarget(e.target)
    };
  },{passive:true});

  document.addEventListener('touchend',e=>{
    if(!touchStart || !window.matchMedia?.('(max-width: 860px)').matches) return;
    const t=e.changedTouches?.[0];
    if(!t){touchStart=null;return;}
    const dx=t.clientX-touchStart.x;
    const dy=t.clientY-touchStart.y;
    const elapsed=Date.now()-touchStart.time;
    const horizontal=Math.abs(dx)>Math.abs(dy)*1.25;
    const quick=elapsed<900;

    if(quick && horizontal && Math.abs(dx)>=threshold){
      const nav=$('.app-nav');

      if(!nav?.classList.contains('is-open') && touchStart.edgeLeft && dx>0){
        onMobileMenu();
        touchStart=null;
        return;
      }
      if(nav?.classList.contains('is-open') && dx<0){
        closeMobileMenu();
        touchStart=null;
        return;
      }

      if(!touchStart.ignored && state.section==='article'){
        const neighbors=getArticleNeighbors();
        if(dx<0 && neighbors.next) openArticle(neighbors.next.id);
        else if(dx>0 && neighbors.previous) openArticle(neighbors.previous.id);
        else showToast('Других материалов в этом направлении нет');
      }
    }
    touchStart=null;
  },{passive:true});
}

function safeRun(label,fn){
  try{
    return fn();
  }catch(error){
    console.error(label+' failed:',error);
    return null;
  }
}

function bootstrap(){
  // Core input handling is installed first so rendering/auth failures never
  // disable mouse or keyboard interaction for the whole site.
  safeRun('bindGlobalEvents',bindGlobalEvents);
  safeRun('renderCategoryNav',renderCategoryNav);
  safeRun('renderKeyHelp',renderKeyHelp);
  safeRun('renderNews',renderNews);
  safeRun('renderProfile',renderProfile);
  safeRun('setTheme',()=>setTheme(document.documentElement.dataset.theme||'light'));

  // Supabase is intentionally non-blocking for the static frontend.
  Promise.resolve(initSupabase())
    .catch(error=>console.error('Supabase initialization failed:',error));

  window.__NEWS_APP_READY__=true;
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bootstrap,{once:true});
else bootstrap();
