(function cmsApp() {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const KEY = 'hanifi-studio-cms-v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const paths = {
    grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    file:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h5',
    folder:'M3 7h18v13H3z M3 7V4h6l3 3',
    pen:'m16 3 5 5-12 12-6 1 1-6z M13 6l5 5',
    image:'M3 3h18v18H3z M3 16l5-5 4 4 4-6 5 7 M8 7h.01',
    settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',
    search:'M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
    plus:'M12 5v14 M5 12h14', arrow:'M7 17 17 7 M7 7h10v10',
    chevron:'m9 5 7 7-7 7', close:'m6 6 12 12 M6 18 18 6',
    eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    download:'M12 3v12 m-5-5 5 5 5-5 M4 16v5h16v-5',
    upload:'M12 16V4 m-5 5 5-5 5 5 M4 17v4h16v-4',
    globe:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M3 12h18 M12 3c5 5 5 13 0 18-5-5-5-13 0-18',
    check:'m5 12 4 4 10-10', trash:'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
    menu:'M3 6h18 M3 12h18 M3 18h18', clock:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 7v5l3 2',
    layers:'m12 3 10 5-10 5L2 8z M2 12l10 5 10-5 M2 16l10 5 10-5'
  };
  const icon = (name, extra = '') => `<svg ${extra} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.file}"/></svg>`;
  const routes = [
    ['overview','Genel bakış','grid'],['pages','Sayfalar','file'],['projects','Projeler','folder'],
    ['posts','Blog yazıları','pen'],['media','Medya kütüphanesi','image'],['settings','Site ayarları','settings'],['connection','Bağlantı ve yayın','globe']
  ];
  let state = clone(window.CMS_SEED);
  let storageError = '';
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version !== 1 || !parsed.settings || !['pages','projects','posts','media','activity'].every(k => Array.isArray(parsed[k]))) throw new Error('format');
      for (const item of [...parsed.pages,...parsed.projects,...parsed.posts]) {
        if (!item.id || !item.title || !item.body || typeof item.title.tr !== 'string') throw new Error('format');
      }
      state = parsed;
    }
  } catch {
    storageError = 'Kaydedilmiş taslak okunamadı. Kaynak içerikler gösteriliyor; yeni kayıttan önce mevcut verinin yedeğini kontrol et.';
  }
  let route = 'overview', query = '', statusFilter = 'all', draft = null, draftGroup = '', editorLanguage = 'tr', dirty = false, previewLanguage = 'tr', previewRecord = null, toastTimer;
  const main = $('#main'), editor = $('#editor-dialog'), preview = $('#preview-dialog'), confirmDialog = $('#confirm-dialog');
  const records = () => [...state.pages,...state.projects,...state.posts];
  const typeLabel = type => ({page:'Sayfa',project:'Proje',post:'Blog yazısı'}[type] || 'İçerik');
  const groupOf = type => ({page:'pages',project:'projects',post:'posts'}[type] || 'pages');
  const imgSrc = src => { if (typeof src !== 'string') return ''; if (/^assets\/[a-zA-Z0-9_.-]+$/.test(src) || /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(src)) return src; try { const url = new URL(src); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; } catch { return ''; } };
  const short = (text, n = 100) => String(text || '').length > n ? String(text).slice(0,n).trim() + '…' : text || '';
  const dateText = date => date ? new Date(date).toLocaleString('tr-TR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : 'Kaynak içerik';
  const statusLabel = status => ({source:'Siteden alındı',draft:'Taslak',ready:'Hazır'}[status] || 'Taslak');
  const badge = status => `<span class="badge badge-${['source','draft','ready'].includes(status) ? status : 'draft'}"><i></i>${statusLabel(status)}</span>`;
  const btn = (action,label,ico,cls='btn-secondary',attrs='') => `<button class="btn ${cls}" data-action="${action}" ${attrs}>${ico ? icon(ico) : ''}${label}</button>`;
  function toast(message) {
    const node = $('#toast'); node.textContent = message; node.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => {node.hidden = true;},4500);
  }
  function commit(next, message) {
    try { localStorage.setItem(KEY,JSON.stringify(next)); }
    catch { toast('Kaydedilemedi: tarayıcı depolaması dolu veya kapalı. Medyayı küçültmeyi ya da JSON yedeği almayı dene.'); return false; }
    state = next; storageError = ''; render(); if (message) toast(message); return true;
  }
  function activity(next,label) {
    next.activity.unshift({id:crypto.randomUUID(),label,at:new Date().toISOString()});
    next.activity = next.activity.slice(0,30);
  }
  function heading(eyebrow,title,description,actions='') {
    return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${description}</p></div><div class="heading-actions">${actions}</div></div>`;
  }
  function table(items,showType=false) {
    if (!items.length) return empty('Henüz bir içerik yok','Başka bir arama veya durum filtresi deneyebilirsin.');
    return `<div class="table-wrap"><table class="page-table"><thead><tr><th scope="col">İçerik adı</th><th scope="col">Durum</th><th scope="col">Dil</th><th scope="col">Son değişiklik</th><th scope="col"><span class="screen-reader">İşlemler</span></th></tr></thead><tbody>${items.map(item => `<tr><td><div class="content-cell"><span class="file-icon">${icon(item.type==='project'?'folder':item.type==='post'?'pen':'file')}</span><div><button class="content-title" data-action="edit" data-id="${esc(item.id)}" data-group="${groupOf(item.type)}">${esc(item.title.tr)}</button><span class="content-meta">${esc(showType ? typeLabel(item.type) + ' · ' + item.slug : item.slug)}</span></div></div></td><td>${badge(item.status)}</td><td><div class="language-pair"><span class="language-tag">TR</span>${item.title.en ? '<span class="language-tag">EN</span>' : ''}</div></td><td class="date-cell">${esc(dateText(item.updatedAt))}</td><td><div class="row-actions"><button class="icon-button" data-action="preview" data-id="${esc(item.id)}" data-group="${groupOf(item.type)}" aria-label="${esc(item.title.tr)} önizle">${icon('eye')}</button><button class="icon-button" data-action="edit" data-id="${esc(item.id)}" data-group="${groupOf(item.type)}" aria-label="${esc(item.title.tr)} düzenle">${icon('pen')}</button></div></td></tr>`).join('')}</tbody></table></div>`;
  }
  function empty(title,description) { return `<div class="empty-state">${icon('search')}<h3>${esc(title)}</h3><p>${esc(description)}</p></div>`; }
  function dashboard() {
    const home = state.pages.find(p=>p.id==='home') || state.pages[0];
    const stats = [
      ['Sayfa',state.pages.length,'Türkçe ve İngilizce içerikler','file','pages'],
      ['Proje',state.projects.length,'Fikirlerin ve ürettiklerin','folder','projects'],
      ['Blog yazısı',state.posts.length,'Bilgini ve deneyimini paylaş','pen','posts'],
      ['Medya',state.media.length,'Portre ve galeri görselleri','image','media']
    ];
    return heading('SENİN ALANIN, SENİN HİKÂYEN',`Merhaba, ${esc(state.settings.fullName.split(' ')[0])}<span class="heading-dot">.</span>`,'Web sitenin tüm içerikleri, tek bir yerde.',
      btn('preview-home','İçerik önizle','eye') + btn('new-post','Yeni yazı','plus','btn-primary'))
      + `<div class="stats-grid">${stats.map(([label,value,detail,ico,target])=>`<a href="#${target}" class="stat-card"><div class="stat-top"><span class="stat-icon">${icon(ico)}</span>${icon('arrow')}</div><div class="stat-value">${value}<span class="stat-label">${label}</span></div><div class="stat-detail">${detail}</div></a>`).join('')}</div>
      <div class="dashboard-grid"><div><section class="panel"><div class="panel-heading"><div><h2>Site sayfaları</h2><p>İçeriğine küçük dokunuşlar, hikâyene yeni bir yön.</p></div><a class="text-link" href="#pages">Tümünü gör ${icon('chevron')}</a></div>${table(state.pages.slice(0,6))}<div class="panel-bottom">${icon('globe')} 2 dil · ${state.pages.length} sayfa <span>Kaynak sitenden aktarıldı</span></div></section>
      <section class="panel activity-panel"><div class="panel-heading"><div><h2>Son düzenlemeler</h2><p>Bu çalışma alanındaki içerik hareketleri.</p></div><span class="small-label">BU TARAYICI</span></div>${state.activity.length ? `<div class="activity-list">${state.activity.slice(0,3).map(a=>`<div class="activity-item"><span class="activity-dot">${icon('check')}</span><div><strong>${esc(a.label)}</strong><time>${esc(dateText(a.at))}</time></div></div>`).join('')}</div>` : `<div class="activity-empty">${icon('clock')}<div><strong>Her şey yeni bir başlangıca hazır.</strong><p>İlk içeriğini kaydettiğinde düzenleme geçmişin burada görünecek.</p></div></div>`}</section></div>
      <aside class="overview-aside"><section class="panel preview-panel"><div class="panel-heading"><h2>Sitene bir bakış</h2><span class="small-label">ÖNİZLEME</span></div><div class="site-preview"><div class="preview-nav"><span class="preview-brand">${esc(state.settings.siteName)}<b>.</b></span><span>Portfolyo <i>TR</i></span></div><div class="preview-hero"><div class="preview-copy"><small>MERHABA, BEN</small><h3>${esc(state.settings.fullName)}</h3><p>${esc(state.settings.role)}</p><span class="preview-line"></span></div><img src="${esc(imgSrc(home?.cover || 'assets/homepp.png'))}" alt="${esc(state.settings.fullName)}"></div></div><div class="preview-card-footer"><span><i></i>Yerel içerik önizlemesi</span>${btn('preview-home','Aç','arrow','btn-ghost btn-small')}</div></section>
      <section class="panel"><div class="panel-heading"><h2>Hızlı başlangıç</h2></div><div class="quick-actions">${[['edit-home','Ana sayfanı düzenle','İlk izlenimini güncelle','file'],['new-project','Yeni proje ekle','Son çalışmanı vitrine çıkar','plus'],['upload','Görsel yükle','Kütüphaneni zenginleştir','upload']].map(([action,title,desc,ico])=>`<button class="quick-action" data-action="${action}"><span class="quick-icon">${icon(ico)}</span><span><strong>${title}</strong><small>${desc}</small></span>${icon('chevron')}</button>`).join('')}</div></section>
      <div class="design-note"><span>01 / İLK TASLAK</span><h3>İçeriğinle başla.</h3><p>Sayfalarını düzenle, iki dilde gözden geçir ve kendi yayın akışını şekillendir.</p></div></aside></div>`;
  }
  function collection(group) {
    const config = {pages:['SAYFALAR','Sitenin yapı taşları','Ana sayfadan iletişime, tüm sayfalarını buradan düzenle.'],projects:['PORTFOLYO','Projelerin bir arada','Çalışmalarını düzenle ve yeni projelerin için yer aç.'],posts:['BLOG','Paylaşmaya değer fikirler','Yazılarını hazırla, geliştir ve iki dilde gözden geçir.']}[group];
    const filtered = state[group].filter(i=>statusFilter==='all'||i.status===statusFilter);
    const actions = group==='pages' ? btn('preview-home','Siteyi önizle','eye') : btn(group==='projects'?'new-project':'new-post',group==='projects'?'Yeni proje':'Yeni yazı','plus','btn-primary');
    return heading(...config,actions) + `<section class="panel"><div class="section-toolbar"><div class="tabs" aria-label="İçerik durumu">${[['all','Tümü'],['source','Siteden alındı'],['draft','Taslak'],['ready','Hazır']].map(([id,label])=>`<button class="tab ${statusFilter===id?'active':''}" data-action="filter" data-filter="${id}" aria-pressed="${statusFilter===id}">${label}<span>${id==='all'?state[group].length:state[group].filter(x=>x.status===id).length}</span></button>`).join('')}</div><span class="small-label">${state[group].length} İÇERİK</span></div>${table(filtered)}</section><div class="notice">${icon('layers')}<span>“Hazır” içerikler, Bağlantı ve yayın ekranındaki “Sitede yayınla” işlemiyle yayına alınır. Yerel kaydetme canlı yayını değiştirmez.</span></div>`;
  }
  function mediaPage() {
    return heading('MEDYA KÜTÜPHANESİ','Hikâyenin görsel tarafı','Portre, galeri ve içerik kapakların için ortak bir alan.',btn('upload','Görsel yükle','upload','btn-primary'))+
    `<div class="section-toolbar media-toolbar"><span>${state.media.length} görsel <span class="muted">· JPG, PNG ve WebP</span></span><span class="small-label">YENİ YÜKLEMELER EN FAZLA 1 MB</span></div><div class="media-grid">${state.media.map(m=>`<article class="media-card"><button class="media-open" data-action="media-preview" data-id="${esc(m.id)}" aria-label="${esc(m.alt || m.name)} önizle"><img src="${esc(imgSrc(m.src))}" alt="${esc(m.alt || m.name)}" loading="lazy"></button><div class="media-info"><div><strong>${esc(m.alt || m.name)}</strong><small>${esc(m.name)} · ${Math.round((m.size||0)/1024)} KB</small></div>${m.uploaded?`<button class="icon-button" data-action="delete-media" data-id="${esc(m.id)}" aria-label="${esc(m.name)} kaldır">${icon('trash')}</button>`:icon('image')}</div></article>`).join('')}</div><div class="notice">${icon('image')}<span>Yeni görseller bu tarayıcıya kaydedilir. Kapak olarak seçebilir, yayınlama sırasında Supabase Storage’a aktarabilirsin.</span></div>`;
  }
  function settingsPage() {
    return heading('SİTE AYARLARI','Küçük detaylar, güçlü bir kimlik','Sitenin temel bilgilerini bu taslakta yönet.',btn('export','JSON yedeği indir','download'))+
    `<div class="settings-grid"><form id="settings-form" class="panel form-panel"><div class="panel-heading"><div><h2>Genel bilgiler</h2><p>Bu bilgiler yerel önizlemende kullanılır.</p></div>${icon('settings')}</div><div class="panel-body">${field('siteName','Site adı',state.settings.siteName,true)}${field('fullName','Ad soyad',state.settings.fullName,true)}${field('role','Unvan',state.settings.role,true)}${field('email','İletişim e-postası',state.settings.email,false,'email')}<div class="field"><label for="setting-description">Site açıklaması</label><textarea id="setting-description" name="description" rows="4" maxlength="800">${esc(state.settings.description)}</textarea></div><div class="form-submit"><span>Bu tarayıcıda saklanır</span><button class="btn btn-primary" type="submit">${icon('check')}Ayarları kaydet</button></div></div></form><aside><section class="panel"><div class="panel-heading"><h2>Çalışma alanı</h2></div><div class="panel-body"><div class="settings-detail"><span>İçerik dilleri</span><strong>Türkçe / English</strong></div><div class="settings-detail"><span>Sürüm</span><strong>0.1 · Yerel taslak</strong></div><div class="settings-detail"><span>Kayıt yöntemi</span><strong>Tarayıcı depolaması</strong></div><p class="muted">Tarayıcı verilerini temizlersen düzenlemelerin silinebilir. JSON yedeği içeriklerini ve yüklediğin görselleri saklar.</p>${btn('export','İçerikleri dışa aktar','download','btn-secondary full-width')}</div></section><div class="notice">Supabase bağlantısı, yönetici girişi ve yayınlama için <a href="#connection">Bağlantı ve yayın</a> ekranını kullan.</div></aside></div>`;
  }
  function field(name,label,value,required=false,type='text') {
    return `<div class="field"><label for="setting-${name}">${label}</label><input id="setting-${name}" name="${name}" type="${type}" value="${esc(value)}" maxlength="180" ${required?'required':''}></div>`;
  }
  function render() {
    $('#navigation').innerHTML = routes.map(([key,label,ico])=>`<a class="nav-link ${route===key&&!query?'active':''}" href="#${key}" ${route===key&&!query?'aria-current="page"':''}>${icon(ico)}<span>${label}</span>${Array.isArray(state[key])?`<span class="nav-count">${state[key].length}</span>`:''}</a>`).join('');
    $('#sidebar-name').textContent = state.settings.fullName;
    $('#breadcrumb-current').textContent = query ? 'Arama sonuçları' : routes.find(r=>r[0]===route)[1];
    let content;
    if (query) {
      const term = query.toLocaleLowerCase('tr-TR');
      const results = records().filter(i=>(i.title.tr+' '+i.title.en+' '+i.body.tr+' '+i.body.en).toLocaleLowerCase('tr-TR').includes(term));
      content = heading('İÇERİK ARAMA',`“${esc(query)}” için sonuçlar`,`${results.length} içerik bulundu. Türkçe ve İngilizce içerikler birlikte aranır.`)+`<section class="panel">${table(results,true)}</section>`;
    } else content = route==='overview'?dashboard():['pages','projects','posts'].includes(route)?collection(route):route==='media'?mediaPage():route==='connection'?window.CMSIntegration.view():settingsPage();
    main.innerHTML = (storageError?`<div class="error-banner" role="alert">${esc(storageError)}</div>`:'')+content;
  }
  function navigate() {
    const next = location.hash.slice(1);
    if (next === 'main') return;
    route = routes.some(r=>r[0]===next)?next:'overview'; statusFilter='all'; query=''; $('#global-search').value='';
    closeMenu(); render();
  }
  function closeMenu() { $('.sidebar').classList.remove('is-open'); $('.sidebar-backdrop').hidden=true; $('#menu-toggle').setAttribute('aria-expanded','false'); }
  function openEditor(group,id) {
    draftGroup = group; editorLanguage='tr'; dirty=false;
    const existing=state[group].find(item=>item.id===id);
    draft=existing?clone(existing):{id:crypto.randomUUID(),type:group==='projects'?'project':'post',title:{tr:'',en:''},body:{tr:'',en:''},slug:'',status:'draft',cover:''};
    renderEditor(); editor.showModal();
  }
  function captureDraft() {
    if (!draft || !$('#entry-title',editor)) return;
    draft.title[editorLanguage]=$('#entry-title',editor).value;
    draft.body[editorLanguage]=$('#entry-body',editor).value;
    draft.slug=$('#entry-slug',editor).value.trim();
    draft.status=$('#entry-status',editor).value;
    draft.cover=$('#entry-cover',editor).value;
    const linkField = $('#entry-link',editor); if (linkField) draft.link = linkField.value.trim();
  }
  function renderEditor() {
    const exists=state[draftGroup].some(i=>i.id===draft.id);
    editor.innerHTML=`<form id="editor-form"><div class="dialog-header"><div><div class="eyebrow">${typeLabel(draft.type).toLocaleUpperCase('tr-TR')}</div><h2 id="editor-title">${exists?'İçeriği düzenle':'Yeni içerik oluştur'}</h2></div><button type="button" class="icon-button" data-action="close-editor" aria-label="Düzenleyiciyi kapat">${icon('close')}</button></div><div class="dialog-body"><div class="editor-tabs" aria-label="Düzenleme dili">${[['tr','Türkçe'],['en','English']].map(([code,label])=>`<button type="button" class="tab ${editorLanguage===code?'active':''}" data-action="editor-language" data-lang="${code}" aria-pressed="${editorLanguage===code}">${icon('globe')}${label}</button>`).join('')}</div><div class="field"><label for="entry-title">İçerik başlığı <span>${editorLanguage.toUpperCase()}</span></label><input id="entry-title" maxlength="240" required value="${esc(draft.title[editorLanguage])}" placeholder="${editorLanguage==='tr'?'Başlığını yaz...':'Enter a title...'}" autofocus></div><div class="field"><label for="entry-body">İçerik / açıklama</label><textarea id="entry-body" rows="11" maxlength="30000" placeholder="İçeriğini buraya yaz...">${esc(draft.body[editorLanguage])}</textarea><small>Düz metin olarak kaydedilir. Paragraflar önizlemede korunur.</small></div><div class="form-row"><div class="field"><label for="entry-slug">Sayfa yolu / kısa ad</label><input id="entry-slug" maxlength="150" value="${esc(draft.slug)}" placeholder="yeni-icerik"></div><div class="field"><label for="entry-status">Hazırlık durumu</label><select id="entry-status"><option value="draft" ${draft.status!=='ready'?'selected':''}>Taslak</option><option value="ready" ${draft.status==='ready'?'selected':''}>Hazır</option></select></div></div><div class="field"><label for="entry-cover">Kapak görseli</label><select id="entry-cover"><option value="">Görsel yok</option>${draft.cover&&!state.media.some(m=>m.src===draft.cover)?`<option value="${esc(draft.cover)}" selected>Mevcut kapak</option>`:""}${state.media.map(m=>`<option value="${esc(m.src)}" ${draft.cover===m.src?'selected':''}>${esc(m.alt||m.name)}</option>`).join('')}</select></div>${draft.type!=='page'?`<div class="field"><label for="entry-link">Proje / yazı bağlantısı (isteğe bağlı)</label><input id="entry-link" maxlength="2000" value="${esc(draft.link||'')}" placeholder="https://..."><small>Boşsa sitede içerik ayrıntısı gösterilir.</small></div>`:''}<div class="notice">${icon('globe')}<span>İki dil ayrı düzenlenir. Kaydettiğinde ikisi de bu tarayıcıda saklanır.</span></div></div><div class="dialog-footer">${exists&&draft.type!=='page'?`<button type="button" class="btn btn-danger btn-small" data-action="delete-entry">${icon('trash')}Sil</button>`:'<span class="small-label">YEREL TASLAK</span>'}<div>${btn('editor-preview','Önizle','eye','btn-secondary','type="button"')}<button class="btn btn-primary" type="submit">${icon('check')}Kaydet</button></div></div></form>`;
  }
  async function confirmAction(title,message,acceptLabel='Devam et') {
    confirmDialog.innerHTML=`<div class="dialog-header"><h2 id="confirm-title">${esc(title)}</h2></div><div class="dialog-body"><p>${esc(message)}</p></div><form method="dialog" class="dialog-footer"><button class="btn btn-secondary" value="cancel" autofocus>Vazgeç</button><button class="btn btn-danger" value="confirm">${esc(acceptLabel)}</button></form>`;
    confirmDialog.returnValue = 'cancel';
    confirmDialog.showModal();
    return new Promise(resolve=>confirmDialog.addEventListener('close',()=>resolve(confirmDialog.returnValue==='confirm'),{once:true}));
  }
  async function closeEditor() {
    if(dirty&&!await confirmAction('Kaydedilmemiş değişiklikler','Düzenlemelerini kaydetmeden kapatmak istiyor musun?','Kaydetmeden kapat'))return;
    editor.close();draft=null;dirty=false;
  }
  function openPreview(record,language='tr') {
    previewRecord=clone(record);previewLanguage=language;renderPreview();if(!preview.open)preview.showModal();
  }
  function renderPreview() {
    const item=previewRecord, isHome=item.id==='home', title=item.title[previewLanguage]||item.title.tr, body=item.body[previewLanguage]||item.body.tr;
    preview.innerHTML=`<div class="dialog-header"><div><div class="eyebrow">İÇERİK ÖNİZLEMESİ</div><h2 id="preview-title">${esc(title)}</h2></div><div class="row-actions">${[['tr','TR'],['en','EN']].map(([lang,label])=>`<button class="btn btn-small ${lang===previewLanguage?'btn-primary':'btn-ghost'}" data-action="preview-language" data-lang="${lang}">${label}</button>`).join('')}<button class="icon-button" data-action="close-preview" aria-label="Önizlemeyi kapat">${icon('close')}</button></div></div><div class="preview-content"><div class="preview-site-nav"><strong>${esc(state.settings.siteName)}<span>.</span></strong><span>${esc(state.settings.role)} · ${previewLanguage.toUpperCase()}</span></div><article class="${isHome?'preview-site-hero':'preview-article'}"><div><span class="preview-eyebrow">${isHome?'PORTFOLYO':esc(typeLabel(item.type).toLocaleUpperCase('tr-TR'))}</span><h${isHome?'1':'2'}>${esc(isHome?state.settings.fullName:title)}</h${isHome?'1':'2'}><div class="preview-body">${esc(body).replace(/\n/g,'<br>')}</div></div>${imgSrc(item.cover)?`<img src="${esc(imgSrc(item.cover))}" alt="${esc(title)}">`:''}</article><div class="preview-site-footer">${esc(state.settings.description||'')} ${state.settings.email?`<span>${esc(state.settings.email)}</span>`:''}</div></div><div class="preview-disclaimer">${icon('eye')} İçerik taslağıdır. Canlı sitenin birebir görünümü değildir.</div>`;
  }
  function exportData() {
    const payload={...clone(state),exportedAt:new Date().toISOString()};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const link=document.createElement('a'),url=URL.createObjectURL(blob);
    link.href=url;link.download=`hanifi-cms-yedek-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('İçerik yedeğin JSON olarak indirildi.');
  }
  document.addEventListener('click',async event=>{
    const target=event.target.closest('[data-action]');if(!target)return;
    const {action,id,group,lang}=target.dataset;
    if(action==='edit')openEditor(group,id);
    else if(action==='edit-home')openEditor('pages',state.pages.find(p=>p.id==='home')?.id||state.pages[0].id);
    else if(action==='new-post')openEditor('posts');
    else if(action==='new-project')openEditor('projects');
    else if(action==='preview-home')openPreview(state.pages.find(p=>p.id==='home')||state.pages[0]);
    else if(action==='preview')openPreview(state[group].find(i=>i.id===id));
    else if(action==='filter'){statusFilter=target.dataset.filter;render();}
    else if(action==='close-editor')await closeEditor();
    else if(action==='editor-language'){captureDraft();editorLanguage=lang;renderEditor();}
    else if(action==='editor-preview'){captureDraft();openPreview(draft,editorLanguage);}
    else if(action==='preview-language'){previewLanguage=lang;renderPreview();}
    else if(action==='close-preview')preview.close();
    else if(action==='export')exportData();
    else if(action==='upload')$('#media-upload').click();
    else if(action==='delete-entry'){
      if(!await confirmAction('İçeriği kaldır','Bu içerik yerel taslaktan kaldırılacak. Kaynak site değişmeyecek.','İçeriği sil'))return;
      const next=clone(state);next[draftGroup]=next[draftGroup].filter(i=>i.id!==draft.id);activity(next,`${draft.title.tr} kaldırıldı`);
      if(commit(next,'İçerik yerel taslaktan kaldırıldı.')){editor.close();draft=null;dirty=false;}
    }else if(action==='media-preview'){
      const m=state.media.find(i=>i.id===id);openPreview({id:m.id,type:'media',title:{tr:m.alt||m.name,en:m.alt||m.name},body:{tr:m.name,en:m.name},cover:m.src});
    }else if(action==='delete-media'){
      const media=state.media.find(i=>i.id===id);
      if(records().some(item=>item.cover===media.src)){toast('Bu görsel bir içerikte kullanılıyor. Önce ilgili kapak görselini değiştir.');return;}
      if(!await confirmAction('Görseli kaldır',`${media.name} bu tarayıcıdaki kütüphaneden kaldırılacak.`,'Görseli kaldır'))return;
      const next=clone(state);next.media=next.media.filter(i=>i.id!==id);activity(next,`${media.name} kaldırıldı`);commit(next,'Görsel kaldırıldı.');
    }
  });
  document.addEventListener('submit',event=>{
    if(event.target.id==='editor-form'){
      event.preventDefault();captureDraft();
      if(!draft.title.tr.trim()){editorLanguage='tr';renderEditor();$('#entry-title',editor).focus();toast('Türkçe başlık gerekli.');return;}
      if (draft.link && !/^https:\/\/[^\s]+$/i.test(draft.link) && !/^(?:projects|image|images)\/[a-zA-Z0-9._%\/-]+$/.test(draft.link)) { toast('Bağlantı HTTPS adresi veya site içindeki projects/image yolu olmalı.'); return; }
      const next=clone(state),item=clone(draft),index=next[draftGroup].findIndex(i=>i.id===item.id);
      item.updatedAt=new Date().toISOString();item.slug=item.slug||item.title.tr.toLocaleLowerCase('tr-TR').replace(/ı/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      if(index<0)next[draftGroup].push(item);else next[draftGroup][index]=item;
      activity(next,`${item.title.tr} ${index<0?'eklendi':'güncellendi'}`);
      if(commit(next,'Değişikliklerin bu tarayıcıya kaydedildi.')){editor.close();draft=null;dirty=false;}
    }else if(event.target.id==='settings-form'){
      event.preventDefault();const form=new FormData(event.target),next=clone(state);
      for(const key of ['siteName','fullName','role','email','description'])next.settings[key]=String(form.get(key)||'').trim();
      if(!next.settings.siteName||!next.settings.fullName||!next.settings.role){toast('Site adı, ad soyad ve unvan boş bırakılamaz.');return;}
      activity(next,'Site ayarları güncellendi');commit(next,'Site ayarların kaydedildi.');
    }
  });
  editor.addEventListener('input',()=>{dirty=true;});
  editor.addEventListener('change',()=>{dirty=true;});
  editor.addEventListener('cancel',event=>{event.preventDefault();closeEditor();});
  $('#media-upload').addEventListener('change',async event=>{
    const files=Array.from(event.target.files);event.target.value='';
    for(const file of files){
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>1024*1024){toast(`${file.name}: JPG, PNG veya WebP ve en fazla 1 MB olmalı.`);continue;}
      try{
        const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
        await new Promise((resolve,reject)=>{const image=new Image();image.onload=resolve;image.onerror=reject;image.src=src;});
        const next=clone(state);next.media.unshift({id:crypto.randomUUID(),name:file.name,src,alt:file.name.replace(/\.[^.]+$/,''),size:file.size,uploaded:true});
        activity(next,`${file.name} yüklendi`);if(!commit(next,`${file.name} kütüphaneye eklendi.`))break;
      }catch{toast(`${file.name} okunamadı. Geçerli bir görsel seç.`);}
    }
  });
  $('#global-search').addEventListener('input',event=>{query=event.target.value.trim();render();});
  $('#menu-toggle').innerHTML=icon('menu');$('#search-icon').innerHTML=icon('search');
  $('#menu-toggle').addEventListener('click',()=>{const open=$('.sidebar').classList.toggle('is-open');$('.sidebar-backdrop').hidden=!open;$('#menu-toggle').setAttribute('aria-expanded',String(open));});
  $('.sidebar-backdrop').addEventListener('click',closeMenu);
  document.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'&&!editor.open&&!preview.open&&!confirmDialog.open){event.preventDefault();$('#global-search').focus();}if(event.key==='Escape')closeMenu();});
  window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
  window.addEventListener('hashchange',navigate);
  window.CMSIntegration?.install({ getState: () => clone(state), replaceState: next => commit(clone(next)), toast, render, confirm: confirmAction });
  navigate();
})();

