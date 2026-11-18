(function historyUI(root){
  'use strict';
  const KEY='hanifi-cms-history-v1',groups=['pages','projects','posts','media'];
  const clone=value=>JSON.parse(JSON.stringify(value));
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=value=>new Date(value).toLocaleString('tr-TR');
  let api,rows=[],trash=[],selection=null,busy=false,message='',more=false;
  const allowed=()=>root.CMSIntegration?.canAccess()===true;
  function local(){try{const data=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(data)?data.filter(x=>x.id&&x.payload?.version===1):[];}catch{return [];}}
  function capture(payload,label){
    const entries=local();
    if(entries[0]&&JSON.stringify(entries[0].payload)===JSON.stringify(payload))return;
    entries.unshift({id:crypto.randomUUID(),created_at:new Date().toISOString(),label:label||'Düzenleme öncesi',payload:clone(payload)});
    while(entries.length>20||(entries.length>1&&JSON.stringify(entries).length>2000000))entries.pop();
    localStorage.setItem(KEY,JSON.stringify(entries));
    selection=null;message='';
  }
  function deleted(){
    const current=api.getState(),found=new Map();
    for(const entry of local())for(const group of groups)for(const item of entry.payload[group]||[]){
      const key=group+':'+item.id;
      if(!found.has(key)&&!current[group].some(x=>x.id===item.id))found.set(key,{group,itemId:item.id,title:item.title?.tr||item.alt||item.name,localId:entry.id});
    }
    for(const item of trash){const key=item.group+':'+item.itemId;if(!found.has(key)&&!current[item.group]?.some(x=>x.id===item.itemId))found.set(key,item);}
    return [...found.values()];
  }
  function view(){
    const backups=local(),removed=deleted();
    const button=(action,label,attrs='')=>`<button class="btn btn-secondary btn-small" data-action="history-${action}" ${attrs} ${busy?'disabled':''}>${label}</button>`;
    const versions=rows.map(row=>`<li><div><strong>${row.kind==='draft'?'Bulut taslağı':'Canlı yayın'} · Sürüm ${esc(row.revision)}</strong><small>${esc(date(row.created_at))}</small></div>${button('open','İncele',`data-id="${esc(row.id)}"`)}</li>`).join('');
    const locals=backups.map(row=>`<li><div><strong>${esc(row.label)}</strong><small>${esc(date(row.created_at))}</small></div>${button('local','İncele',`data-id="${esc(row.id)}"`)}</li>`).join('');
    let details='';
    if(selection){
      details=`<section class="panel history-selection"><div class="panel-heading"><div><h2>Seçili sürüm</h2><p>${esc(selection.label)}</p></div>${button('restore-all','Bu sürüme dön')}</div><div class="panel-body"><p>İstersen yalnızca bir içeriği geri getir. Diğer içeriklerin korunur.</p>${groups.map(group=>(selection.payload[group]||[]).map(item=>`<details><summary>${esc(item.title?.tr||item.alt||item.name)}</summary><p class="history-copy">${esc(item.body?.tr||item.src||'')}</p>${item.body?.en?`<p class="history-copy" lang="en">${esc(item.body.en)}</p>`:''}${button('restore-item','Bu içeriği geri getir',`data-group="${group}" data-id="${esc(item.id)}"`)}</details>`).join('')).join('')}</div></section>`;
    }
    return `<div class="page-heading"><div><div class="eyebrow">GERİ ALMA</div><h1>Geçmiş ve çöp kutusu</h1><p>Eski metinleri, fotoğraf seçimlerini ve silinen içerikleri geri getir.</p></div>${button('refresh',busy?'Yükleniyor…':'Bulut geçmişini yükle')}</div><div class="notice"><span>Geri yükleme önce bu tarayıcıdaki taslağı değiştirir. Sonrasında buluta kaydet ve yayınla. Bulut geçmişi bu özelliğin kurulduğu tarihten itibaren tutulur.</span></div>${message?`<p role="status" class="connection-message">${esc(message)}</p>`:''}${details}<div class="history-grid"><section class="panel"><div class="panel-heading"><h2>Bulut sürümleri</h2></div><div class="panel-body"><ul class="history-list">${versions||'<li>Geçmişi görmek için bulut geçmişini yükle.</li>'}</ul>${more?button('older','Daha eski sürümler'):''}</div></section><section class="panel"><div class="panel-heading"><h2>Yerel geri alma kayıtları</h2></div><div class="panel-body"><p>Bu tarayıcıdaki son 20 kayıt; depolama sınırında daha azı tutulabilir.</p><ul class="history-list">${locals||'<li>Bir sonraki düzenlemenden önce otomatik kayıt oluşturulacak.</li>'}</ul></div></section></div><section class="panel"><div class="panel-heading"><h2>Çöp kutusu · ${removed.length}</h2></div><div class="panel-body"><ul class="history-list">${removed.map((item,index)=>`<li><div><strong>${esc(item.title)}</strong><small>${item.localId?'Bu tarayıcıdaki yedek':'Bulut yedeği'}</small></div>${button('trash','Geri getir',`data-index="${index}"`)}</li>`).join('')||'<li>Yedeklerde bulunan silinmiş içerik yok.</li>'}</ul></div></section>`;
  }
  function normalize(payload){
    const next=clone(payload);next.activity=Array.isArray(next.activity)?next.activity:[];
    for(const group of ['pages','projects','posts'])for(const item of next[group]||[]){if(!item.status)item.status='ready';}
    return next;
  }
  async function snapshot(id){
    const value=await root.CMSCloud.getHistory(id);
    if(!value?.payload||value.payload.version!==1||!groups.every(g=>Array.isArray(value.payload[g])))throw new Error('Yedek okunamadı.');
    return {payload:normalize(value.payload),label:`${value.kind==='draft'?'Bulut taslağı':'Canlı yayın'} · Sürüm ${value.revision}`};
  }
  async function restore(payload,group,id){
    if(!root.CMSIntegration.isDraftLoaded()){api.toast('Önce Bağlantı ve yayın bölümünden güncel bulut taslağını yükle.');return;}
    const before=api.getState();
    const accepted=await api.confirm(group?'İçeriği geri getir':'Bu sürüme dön',group?'Seçili içerik eski kaydıyla değişecek. Diğer içerikler korunacak.':'Tüm yerel içerik bu sürümle değişecek. Mevcut taslağın için otomatik geri alma kaydı oluşturulacak.','Taslağa geri yükle');
    if(!accepted||!allowed())return;
    if(JSON.stringify(api.getState())!==JSON.stringify(before))throw new Error('Onay sırasında taslak değişti. Yeniden dene.');
    let next=normalize(payload);
    if(group){
      const item=next[group]?.find(x=>x.id===id);if(!item)throw new Error('Yedekte içerik bulunamadı.');
      next=before;const index=next[group].findIndex(x=>x.id===id);
      if(group!=='media'){item.updatedAt=new Date().toISOString();item.status='ready';}
      if(index<0)next[group].push(item);else next[group][index]=item;
      // Recover referenced media metadata as well; Storage objects are retained.
      if(item.cover){const media=payload.media?.find(m=>m.src===item.cover);if(media&&!next.media.some(m=>m.id===media.id))next.media.push(clone(media));}
    }
    if(api.replaceState(next)){selection=null;message='İçerik yerel taslağa geri yüklendi. Buluta kaydet ve yayınla.';api.toast(message);}
  }
  root.CMSHistory={capture,view,install(workspace){
    api=workspace;
    document.addEventListener('click',async event=>{
      const target=event.target.closest('[data-action^="history-"]');if(!target||target.disabled||!allowed()||busy)return;
      const action=target.dataset.action.slice(8),id=target.dataset.id;
      busy=true;message='';api.render();
      try{
        if(action==='refresh'||action==='older'){
          const before=action==='older'?rows.at(-1)?.id:null;
          const [versions,removed]=await Promise.all([root.CMSCloud.listHistory(before),root.CMSCloud.listTrash()]);
          if(!allowed())return;if(!Array.isArray(versions)||!Array.isArray(removed))throw new Error('Bulut geçmişi okunamadı.');
          rows=before?rows.concat(versions):versions;trash=removed;more=versions.length===100;message='Bulut geçmişi güncellendi.';
        }else if(action==='open')selection=await snapshot(id);
        else if(action==='local'){const entry=local().find(x=>x.id===id);if(entry)selection={payload:entry.payload,label:entry.label};}
        else if(action==='restore-all'&&selection)await restore(selection.payload);
        else if(action==='restore-item'&&selection)await restore(selection.payload,target.dataset.group,id);
        else if(action==='trash'){
          const item=deleted()[Number(target.dataset.index)];if(!item)throw new Error('Çöp kutusu değişti. Yeniden dene.');
          const entry=item.localId?local().find(x=>x.id===item.localId):await snapshot(item.historyId);
          if(entry)await restore(entry.payload,item.group,item.itemId);
        }
      }catch(error){message=error.message||'Geçmiş işlemi tamamlanamadı.';api.toast(message);}
      finally{busy=false;if(allowed())api.render();}
    });
  }};
})(window);
