(function integrationUI(root) {
  'use strict';
  const CLOUD_KEY = 'hanifi-cms-connection-v1';
  const LIVE = 'https://gonultashanifi5-cmd.github.io/Personal_Website/';
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone = v=>JSON.parse(JSON.stringify(v));
  let api, config = {...(root.CMS_CONFIG||{}),siteUrl:LIVE}, revision = 0, loaded = false, busy = false, feedback = '', lastPublication = '';
  const cloud = ()=>root.CMSCloud;
  const error = message=>{ feedback=message;api.toast(message);api.render(); };
  function validState(value) {
    return value && value.version===1 && value.settings && typeof value.settings.fullName==='string' &&
      ['pages','projects','posts','media','activity'].every(k=>Array.isArray(value[k])) &&
      ['pages','projects','posts'].every(k=>value[k].every(x=>typeof x.id==='string'&&x.title&&typeof x.title.tr==='string'&&x.body&&typeof x.body.tr==='string'));
  }
  function configure() { if(!cloud())return; cloud().configure(config);revision=0;loaded=false; }
  const disable = condition=>condition?'disabled':'';
  const actionButton = (action,label,disabled=false,primary=false)=>`<button class="btn ${primary?'btn-primary':'btn-secondary'}" data-action="cloud-${action}" ${disable(busy||disabled)}>${label}</button>`;
  function connectionView() {
    const configured=cloud()?.isConfigured(), signed=cloud()?.isSignedIn(), user=cloud()?.getUser();
    const ready=api.getState().pages.concat(api.getState().projects,api.getState().posts).filter(x=>x.status!=='draft').length;
    return `<div class="page-heading"><div><div class="eyebrow">GITHUB PAGES + SUPABASE</div><h1>Sitenle bağlantı kur.</h1><p>Düzenle, buluta kaydet ve hazır olduğunda yayınla.</p></div><a class="btn btn-secondary" href="${LIVE}" target="_blank" rel="noopener noreferrer">Canlı siteyi aç ↗</a></div>
      <div class="connection-flow"><div><b>01</b><strong>Yerel düzenleme</strong><span>Değişiklikler bu tarayıcıda</span></div><i>→</i><div><b>02</b><strong>Supabase taslağı</strong><span>${signed&&loaded?'Bulut sürümü: '+revision:configured?'Giriş bekleniyor':'Proje bağlantısı bekleniyor'}</span></div><i>→</i><div><b>03</b><strong>Canlı yayın</strong><span>Yalnızca yayınlama sonrası</span></div></div>
      ${feedback?`<div class="connection-message" role="status">${esc(feedback)}</div>`:''}
      <div class="connection-grid"><div><section class="panel"><div class="panel-heading"><div><h2>Supabase projesi</h2><p>${configured?'Proje ayarları kayıtlı.':'Proje URL’si ve genel API anahtarını ekle.'}</p></div><span class="badge badge-${configured?'ready':'draft'}">${configured?'Yapılandırıldı':'Kurulum bekliyor'}</span></div>
      <form id="connection-form" class="panel-body"><div class="field"><label for="supabase-url">Project URL</label><input id="supabase-url" name="supabaseUrl" type="url" placeholder="https://proje-kimligi.supabase.co" value="${esc(config.supabaseUrl||'')}" required ${disable(busy)}></div><div class="field"><label for="supabase-key">Publishable API key</label><input id="supabase-key" name="publishableKey" autocomplete="off" spellcheck="false" placeholder="sb_publishable_..." value="${esc(config.publishableKey||'')}" required ${disable(busy)}><small>Project Settings → API Keys içindeki genel anahtar. Secret anahtar kullanılmaz.</small></div><div class="field"><label for="site-address">Bağlı web sitesi</label><input id="site-address" value="${LIVE}" readonly></div><button class="btn btn-primary" type="submit" ${disable(busy)}>Bağlantıyı kaydet</button></form></section>
      <section class="panel"><div class="panel-heading"><div><h2>Yönetici oturumu</h2><p>Supabase Auth içinde oluşturulan yönetici hesabın.</p></div></div><div class="panel-body">${signed?`<div class="signed-in"><span class="avatar">✓</span><div><strong>Oturum açık</strong><p>${esc(user?.email||'Yönetici')}</p></div>${actionButton('logout','Çıkış yap')}</div><p class="muted">Oturum bu sekmede tutulur. Sayfa yenilendiğinde tekrar giriş yaparsın.</p>`:`<form id="cloud-login-form"><div class="field"><label for="cloud-email">E-posta</label><input id="cloud-email" name="email" type="email" autocomplete="username" required ${disable(!configured||busy)}></div><div class="field"><label for="cloud-password">Parola</label><input id="cloud-password" name="password" type="password" autocomplete="current-password" required ${disable(!configured||busy)}></div><button class="btn btn-primary" ${disable(!configured||busy)}>Giriş yap</button></form>`}</div></section></div>
      <aside><section class="panel"><div class="panel-heading"><h2>İçerik ve yayın</h2></div><div class="panel-body"><p class="muted">Yerel kayıtlar otomatik yayınlanmaz. “Taslak” içeriklerin önceki yayını korunur; yeni taslaklar yayına alınmaz.</p><div class="publish-actions">${actionButton('load','Buluttaki taslağı yükle',!signed)}${actionButton('save','Taslağı buluta kaydet',!signed||!loaded)}${actionButton('publish','Sitede yayınla',!signed||!loaded,true)}</div><div class="settings-detail"><span>Yayına uygun içerik</span><strong>${ready}</strong></div><div class="settings-detail"><span>Bulut sürümü</span><strong>${loaded?revision:'—'}</strong></div>${lastPublication?`<p class="muted">Son yayın: ${esc(lastPublication)}</p>`:''}<small>Yeni görseller, “Sitede yayınla” işleminde Supabase Storage’a yüklenir ve herkese açık olur.</small></div></section>
      <section class="panel"><div class="panel-heading"><h2>İlk bağlantı</h2></div><div class="panel-body"><ol class="setup-steps"><li>Supabase projesini oluştur.</li><li>Proje klasöründeki <code>supabase/setup.sql</code> dosyasını SQL Editor’da çalıştır.</li><li>Auth hesabını oluştur, SQL kurulumundaki yönetici kaydını ekle.</li><li>Buradan giriş yap ve taslağını buluta kaydet.</li><li>Site bağlantı dosyasını GitHub’a ekleyip ilk sürümü yayınla.</li></ol>${actionButton('download-config','Site bağlantı dosyasını indir',!configured)}<small class="setup-footnote">GitHub’daki <code>cms-config.js</code> ve yönetim panelindeki <code>admin/config.js</code> aynı projeye bağlanmalıdır.</small></div></section></aside></div>`;
  }
  async function run(task) {
    if(busy)return;
    busy=true;feedback='İşlem sürüyor…';api.render();
    try{await task();}
    catch(e){feedback=e.message||'İşlem tamamlanamadı.';if(['CONFLICT','TIMEOUT','NETWORK'].includes(e.code))loaded=false;api.toast(feedback);}
    finally{busy=false;api.render();}
  }
  async function acceptCloudDraft(prompt=true) {
    const remote=await cloud().loadDraft();
    if(remote&&!validState(remote.payload))throw new Error('Buluttaki içerik biçimi okunamadı; yerel taslak korunuyor.');
    if(remote) {
      if(prompt&&!await api.confirm('Buluttaki taslağı yükle','Bu tarayıcıdaki içerik, buluttaki taslakla değişecek. Yerel düzenlemelerin gerekiyorsa önce JSON yedeği al.','Buluttan yükle')) {feedback='Yerel taslak korundu. Kaydetmeden önce buluttaki sürümü yükle.';loaded=false;return;}
      if(!api.replaceState(remote.payload))throw new Error('Bulut taslağı bu tarayıcıya kaydedilemedi.');
      revision=remote.revision;
    }else revision=0;
    loaded=true;feedback=remote?'Buluttaki taslak bu tarayıcıya yüklendi.':'Bulutta henüz içerik yok. Mevcut site içeriğini kaydedebilirsin.';
  }
  async function save(publish=false) {
    if(!loaded)throw new Error('Önce buluttaki taslağı yükle.');
    let snapshot=api.getState(), before=JSON.stringify(snapshot);

    if(publish){
      if(!await api.confirm('Bu sürümü sitede yayınla','Siteden alınan ve “Hazır” içerikler canlı sitede gösterilecek. Taslakların önceki yayını korunur. Yeni görseller herkese açılacak.','Yayınla')){feedback='Yayınlama iptal edildi.';return;}
      const replacements=new Map();
      for(const media of snapshot.media) {
        if(media.src.startsWith('data:')){
          feedback=`Görsel yükleniyor: ${media.name}`;api.render();
          if(!replacements.has(media.src))replacements.set(media.src,await cloud().uploadImage(media.src,media.name));
          media.src=replacements.get(media.src);
        }
      }
      for(const group of ['pages','projects','posts'])for(const item of snapshot[group])if(replacements.has(item.cover))item.cover=replacements.get(item.cover);
      if(JSON.stringify(api.getState())!==before)throw new Error('Yükleme sırasında yerel içerik değişti. Düzenlemelerin korundu; güncel taslakla yeniden yayınla.');
    }
    const saved=await cloud().saveDraft(snapshot,revision);revision=saved.revision;
    if(publish){
      // A local edit can finish while the cloud save is pending. Keep that edit
      // and the known saved revision; a new publish attempt can save it safely.
      if(JSON.stringify(api.getState())!==before)throw new Error('Bulut kaydı sırasında yerel içerik değişti. Yeni düzenlemelerin korundu; önceki taslak buluta kaydedildi ancak yayınlanmadı. Güncel taslakla yeniden yayınla.');
      if(!api.replaceState(snapshot))throw new Error('Taslak buluta kaydedildi ancak bu tarayıcıya kaydedilemedi. Yayınlama durduruldu; yerel depolamayı kontrol edip yeniden dene.');
      const result=await cloud().publish(revision);
      lastPublication=new Date(result.publishedAt).toLocaleString('tr-TR');
      feedback=`Sürüm ${result.revision} Supabase’de yayınlandı. Site bağlantı dosyası yüklüyse yeni içerik sayfa yenilendiğinde görünür.`;
    }else feedback=`Taslak Supabase’e kaydedildi · sürüm ${revision}. Canlı yayın değişmedi.`;
    api.toast(feedback);
  }
  function downloadConfig(){
    const output={siteId:config.siteId,siteUrl:LIVE,supabaseUrl:config.supabaseUrl,publishableKey:config.publishableKey};
    const blob=new Blob(['window.HANIFI_CMS_CONFIG = '+JSON.stringify(output,null,2)+';\n'],{type:'text/javascript'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='cms-config.js';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    feedback='cms-config.js indirildi. Bu dosyayı sitenin GitHub deposunun köküne ekle.';api.render();
  }
  root.CMSIntegration={
    view:connectionView,
    install(workspace){
      api=workspace;
      try{
        const stored=JSON.parse(localStorage.getItem(CLOUD_KEY)||'null');
        if(stored&&typeof stored==='object'&&!config.supabaseUrl)config={...config,...stored,siteId:'hanifi-personal',siteUrl:LIVE};
        configure();
      }catch(e){feedback=e.message||'Bağlantı ayarları okunamadı.';}
      document.addEventListener('submit',event=>{
        if(event.target.id==='connection-form'){
          event.preventDefault();const form=new FormData(event.target);
          const next={...config,supabaseUrl:String(form.get('supabaseUrl')).trim(),publishableKey:String(form.get('publishableKey')).trim(),siteId:'hanifi-personal',siteUrl:LIVE};
          try{cloud().configure(next);localStorage.setItem(CLOUD_KEY,JSON.stringify(next));config=next;revision=0;loaded=false;feedback='Bağlantı ayarları kaydedildi. Yönetici hesabınla giriş yap.';api.render();}
          catch(e){error(e.message);}
        }else if(event.target.id==='cloud-login-form'){
          event.preventDefault();const form=new FormData(event.target),email=String(form.get('email')),password=String(form.get('password'));event.target.reset();
          run(async()=>{await cloud().signIn(email,password);loaded=false;const remote=await cloud().loadDraft();if(remote){feedback='Giriş başarılı. Düzenlemeye devam etmeden önce buluttaki taslağı yükle.';}else{revision=0;loaded=true;feedback='Giriş başarılı. İlk taslağını buluta kaydedebilirsin.';}});
        }
      });
      document.addEventListener('click',event=>{
        const target=event.target.closest('[data-action^="cloud-"]');if(!target||target.disabled)return;
        const action=target.dataset.action.slice(6);
        if(action==='download-config')downloadConfig();
        else run(async()=>{
          if(action==='logout'){await cloud().signOut();revision=0;loaded=false;feedback='Oturum kapatıldı. Yerel içeriklerin korundu.';}
          else if(action==='load')await acceptCloudDraft();
          else if(action==='save')await save();
          else if(action==='publish')await save(true);
        });
      });
    }
  };
})(window);


