(function studio(root){
 'use strict';
 const groups=['pages','projects','posts'],clone=x=>JSON.parse(JSON.stringify(x));
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const label={pages:'Sayfa',projects:'Proje',posts:'Yazı',media:'Görsel'};
 let api,activePreview=null,liveNonce='',liveMessage='Henüz kontrol edilmedi.';
 function siteRoot(){return new URL(location.pathname.includes('/admin/')?'../':'website-integration/',location.href);}
 function project(snapshot,previous){
   const value={version:1,settings:clone(snapshot.settings),media:snapshot.media.map(({id,name,src,alt,size})=>({id,name,src,alt,size}))};
   for(const group of groups)value[group]=snapshot[group].flatMap(item=>{
     if(item.status==='draft'){const old=previous?.[group]?.find(x=>x.id===item.id);return old?[clone(old)]:[];}
     const copy=clone(item);delete copy.status;return [copy];
   });
   return value;
 }
 function comparable(item){const value=clone(item);delete value.updatedAt;delete value.status;return value;}
 function stable(value){if(Array.isArray(value))return value.map(stable);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));return value;}
 const same=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
 const translated=(item,lang)=>[item.title?.[lang],item.body?.[lang],item.seo?.title?.[lang],item.seo?.description?.[lang]];
 function review(snapshot,previous){
   const after=project(snapshot,previous),changes=[],warnings=[];
   for(const group of [...groups,'media']){
     const old=new Map((previous?.[group]||[]).map(x=>[x.id,x]));
     for(const item of after[group]){
       const before=old.get(item.id),name=item.title?.tr||item.alt||item.name||item.id;
       if(!before)changes.push(`${label[group]} eklenecek: ${name}`);
       else if(!same(comparable(before),comparable(item)))changes.push(`${label[group]} değişecek: ${name}`);
       if(group!=='media'){
         const locales=['tr','en'];
         for(const lang of locales){const other=lang==='tr'?'en':'tr';
           const changed=!!before&&!same(translated(item,lang),translated(before,lang));
           const unchanged=!!before&&same(translated(item,other),translated(before,other));
           if(changed&&unchanged)warnings.push(`${name}: ${lang.toUpperCase()} değişti; ${other.toUpperCase()} aynı kaldı.`);
         }
         if(!item.title?.en?.trim()||!item.body?.en?.trim())warnings.push(`${name}: İngilizce başlık veya içerik eksik.`);
       }
       old.delete(item.id);
     }
     for(const item of old.values())changes.push(`${label[group]} silinecek: ${item.title?.tr||item.alt||item.name||item.id}`);
   }
   if(!same(after.settings,previous?.settings||{}))changes.push('Site kimliği veya iletişim ayarları değişecek.');
   return {changes,warnings,text:(changes.length?changes.join('\n'):'Yayınlanacak içerikte değişiklik yok.')+(warnings.length?'\n\nDil kontrolü (otomatik çeviri yapılmaz):\n'+warnings.join('\n'):'')+'\n\nTaslak durumundaki içeriklerin önceki yayını korunur.'};
 }
 function seoFields(item,lang,media){
   const seo=item.seo||{title:{tr:'',en:''},description:{tr:'',en:''},image:''};
   return `<details class="seo-fields"><summary>Arama motoru ve paylaşım ayarları · ${lang.toUpperCase()}</summary><div class="field"><label for="seo-title">Arama sonucu başlığı</label><input id="seo-title" maxlength="120" value="${esc(seo.title?.[lang])}" placeholder="Boşsa sayfa başlığı kullanılır"></div><div class="field"><label for="seo-description">Arama sonucu açıklaması</label><textarea id="seo-description" maxlength="500" rows="3">${esc(seo.description?.[lang])}</textarea></div><div class="field"><label for="seo-image">Paylaşım görseli</label><select id="seo-image"><option value="">Sayfa kapağını kullan</option>${seo.image&&!media.some(m=>m.src===seo.image)?`<option value="${esc(seo.image)}" selected>Mevcut görsel</option>`:''}${media.map(m=>`<option value="${esc(m.src)}" ${m.src===seo.image?'selected':''}>${esc(m.alt||m.name)}</option>`).join('')}</select></div><small>Bu alanlar tarayıcıda güncellenir. JavaScript çalıştırmayan sosyal paylaşım robotları için statik HTML güncellemesi gerekir.</small></details>`;
 }
 function previewHTML(item,state,language){
   const payload=clone(state),group=groups.find(g=>payload[g].some(x=>x.id===item.id))||(item.type==='project'?'projects':'posts');
   const edited=clone(item);edited.updatedAt=new Date().toISOString();
   const index=payload[group].findIndex(x=>x.id===item.id);if(index>=0)payload[group][index]=edited;else payload[group].push(edited);
   const page=item.type==='page'?item.id:item.type==='project'?'projects':'blog';
   const filename=(page==='home'?'index':page)+(language==='tr'?'-tr':'')+'.html';
   const url=new URL(filename,siteRoot());url.searchParams.set('cms-preview','1');
   activePreview=payload;
   return `<div class="dialog-header"><div><div class="eyebrow">GERÇEK SİTE · TASLAK</div><h2 id="preview-title">${esc(item.title?.[language]||item.title?.tr)}</h2></div><div class="row-actions"><button class="btn btn-small ${language==='tr'?'btn-primary':'btn-ghost'}" data-action="preview-language" data-lang="tr">TR</button><button class="btn btn-small ${language==='en'?'btn-primary':'btn-ghost'}" data-action="preview-language" data-lang="en">EN</button><button class="icon-button" data-action="close-preview" aria-label="Önizlemeyi kapat">×</button></div></div><p class="preview-disclaimer">Yayınlanmamış taslak. Yalnızca bu tarayıcıda görünür. Bağlantılara tıklamak yerine önizlemeyi kapatıp ilgili sayfayı panelden aç.</p><iframe id="site-draft-preview" title="Web sitesinde taslak önizlemesi" sandbox="allow-scripts allow-same-origin" src="${esc(url.href)}" class="site-draft-frame"></iframe>`;
 }
 function metadataHTML(html,page,lang,settings){
   const title=page.seo?.title?.[lang]||(page.title[lang]||page.title.tr)+' — '+settings.siteName,description=page.seo?.description?.[lang]||settings.description||'';
   const base='https://gonultashanifi5-cmd.github.io/Personal_Website/',file=(page.id==='home'?'index':page.id)+(lang==='tr'?'-tr':'')+'.html';
   let image=page.seo?.image||page.cover||'';if(image.startsWith('assets/'))image='image/'+image.slice(7);if(image)image=new URL(image,base).href;
   const tags=[['name','description',description],['property','og:title',title],['property','og:description',description],['property','og:image',image],['property','og:url',base+file],['name','twitter:title',title],['name','twitter:description',description],['name','twitter:image',image],['name','twitter:card',image?'summary_large_image':'summary']];
   const names=new Set(tags.map(x=>x[1]));
   return html.replace(/<head\b[^>]*>[\s\S]*?<\/head>/i,head=>{
     head=head.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i,()=>'<title>'+esc(title)+'</title>');
     head=head.replace(/<meta\b[^>]*>/gi,tag=>{const key=tag.match(/\b(?:name|property)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();return names.has(key)?'':tag;});
     head=head.replace(/<link\b[^>]*>/gi,tag=>/\brel\s*=\s*["']canonical["']/i.test(tag)?'':tag);
     return head.replace(/<\/head>/i,()=>tags.map(([kind,name,value])=>`<meta ${kind}="${name}" content="${esc(value)}">`).join('\n')+`\n<link rel="canonical" href="${esc(base+file)}">\n</head>`);
   });
 }
 function healthHTML(){return `<section class="panel"><div class="panel-heading"><h2>Yayın kontrolü ve geri yükleme</h2></div><div class="panel-body"><p role="status">${esc(liveMessage)}</p><div class="publish-actions"><button class="btn btn-secondary" data-action="studio-check">Canlı sürümü kontrol et</button><button class="btn btn-secondary" data-action="studio-export-seo">Statik SEO dosyalarını indir</button><button class="btn btn-secondary" data-action="studio-import">JSON yedeğini geri yükle</button></div><p class="muted">Sosyal paylaşım robotları için yayınladıktan sonra SEO ZIP dosyasını indir; HTML dosyalarını site deposuna ekleyip pushla.</p><div id="live-check-container"></div></div></section>`;}
 root.CMSStudio={siteRoot,project,review,seoFields,previewHTML,healthHTML,metadataHTML,install(workspace){api=workspace;
   root.addEventListener('message',event=>{
     const frame=document.querySelector('#site-draft-preview');
     if(event.data?.type==='cms-preview-ready'&&frame&&event.source===frame.contentWindow&&event.origin===new URL(frame.src).origin&&activePreview&&root.CMSIntegration.canAccess())frame.contentWindow.postMessage({type:'cms-preview-payload',payload:activePreview},event.origin);
     const live=document.querySelector('#live-check-frame');
     if(event.data?.type==='cms-live-status'&&live&&event.source===live.contentWindow&&event.origin===new URL(live.src).origin&&event.data.nonce===liveNonce){
       const cloudRevision=live.dataset.revision;
       liveMessage=event.data.source==='supabase'&&String(event.data.revision)===cloudRevision?`Doğrulandı: canlı sayfa Supabase sürüm ${cloudRevision} içeriğini gösteriyor.`:`Eşleşme doğrulanamadı. Bulut sürümü ${cloudRevision}; sayfa ${event.data.source||'bilinmeyen kaynak'} / ${event.data.revision||'sürüm yok'} gösteriyor. Site dosyalarının push edildiğini kontrol et.`;
       liveNonce='';api.render();
     }
   });
   document.addEventListener('click',async event=>{
     const target=event.target.closest('[data-action^="studio-"]');if(!target||!root.CMSIntegration.canAccess())return;
     if(target.dataset.action==='studio-check'){
       target.disabled=true;liveMessage='Canlı sayfa açılıp içerik sürümü doğrulanıyor…';
       try{
         const publication=await root.CMSCloud.loadPublication();if(!publication)throw new Error('Henüz yayınlanmış sürüm yok.');
         if(!root.CMSIntegration.canAccess())return;api.render();liveNonce=crypto.randomUUID();
         const url=new URL('index-tr.html',root.CMS_CONFIG.siteUrl||'https://gonultashanifi5-cmd.github.io/Personal_Website/');url.searchParams.set('cms-check',liveNonce);
         const frame=document.createElement('iframe');frame.id='live-check-frame';frame.title='Canlı yayın sürüm doğrulaması';frame.hidden=true;frame.dataset.revision=String(publication.revision);frame.src=url.href;
         document.querySelector('#live-check-container')?.appendChild(frame);const nonce=liveNonce;
         setTimeout(()=>{if(liveNonce===nonce){liveNonce='';liveMessage='Canlı sayfa doğrulama yanıtı vermedi. Entegrasyon dosyaları henüz yayınlanmamış veya sayfa bağlantısı engellenmiş olabilir.';if(root.CMSIntegration.canAccess())api.render();}},15000);
       }catch(error){liveMessage=error.message;api.render();}
     }else if(target.dataset.action==='studio-import'){
       if(!root.CMSIntegration.isDraftLoaded()){api.toast('Önce güncel bulut taslağını yükle.');return;}
       const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
       input.addEventListener('change',async()=>{
         const file=input.files?.[0];if(!file)return;const before=api.getState();
         try{
           if(file.size>12582912)throw new Error('JSON yedeği 12 MB sınırını aşıyor.');
           let payload;try{payload=JSON.parse(await file.text());}catch{throw new Error('Dosya geçerli bir JSON yedeği değil.');}
           if(!payload||Array.isArray(payload)||payload.version!==1)throw new Error('Yedek sürümü desteklenmiyor.');delete payload.exportedAt;
           if(await root.CMSCloud.validateDraft(payload)!==true)throw new Error('Yedek doğrulanamadı.');
           if(!root.CMSIntegration.canAccess())return;
           if(!await api.confirm('JSON yedeğini geri yükle',file.name+' içindeki içerik yerel taslağın yerini alacak. Mevcut içerik için otomatik geri alma kaydı oluşturulur. Canlı site yayınlayana kadar değişmez.','Taslağa geri yükle'))return;
           if(!root.CMSIntegration.canAccess()||JSON.stringify(before)!==JSON.stringify(api.getState()))throw new Error('Dosya okunurken taslak değişti. Yeniden dene.');
           if(api.replaceState(payload))api.toast('JSON yedeği yerel taslağa geri yüklendi. Buluta kaydet ve yayınla.');
         }catch(error){api.toast(error.message||'Yedek geri yüklenemedi.');}
       },{once:true});input.click();
     }else if(target.dataset.action==='studio-export-seo'){
       target.disabled=true;
       try{
         const publication=await root.CMSCloud.loadPublication();if(!publication)throw new Error('Önce sitende bir sürüm yayınla.');
         const entries=[];
         for(const page of publication.payload.pages)for(const lang of ['tr','en']){
           if(!['home','about','services','skills','projects','gallery','blog','contact'].includes(page.id))continue;
           const name=(page.id==='home'?'index':page.id)+(lang==='tr'?'-tr':'')+'.html',response=await fetch(new URL(name,siteRoot()),{cache:'no-store',credentials:'omit'});
           if(!response.ok)throw new Error('Site şablonu okunamadı: '+name);
           const html=await response.text();if(!/<head\b/i.test(html)||!html.includes('js/cms-content.js'))throw new Error('Güncel site entegrasyonu bulunamadı: '+name);
           entries.push({name,data:new TextEncoder().encode(metadataHTML(html,page,lang,publication.payload.settings))});
         }
         if(!root.CMSIntegration.canAccess())return;
         const blob=root.CMSAssets.zip(entries),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='hanifi-seo-surum-'+publication.revision+'.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);api.toast('SEO dosyaları indirildi. HTML dosyalarını site deposuna ekleyip pushla.');
       }catch(error){api.toast(error.message);}finally{target.disabled=false;}
     }else if(target.dataset.action==='studio-media-edit'){
       const media=api.getState().media.find(m=>m.id===target.dataset.id);if(!media)return;
       let dialog=document.querySelector('#media-edit-dialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='media-edit-dialog';dialog.className='editor-dialog';document.body.appendChild(dialog);}
       dialog.innerHTML=`<form id="media-details-form" data-id="${esc(media.id)}"><div class="dialog-header"><h2>Görsel açıklaması</h2><button type="button" data-action="studio-media-close" class="icon-button" aria-label="Kapat">×</button></div><div class="dialog-body"><p>${esc(media.name)}</p><div class="field"><label for="media-alt">Alternatif metin</label><textarea id="media-alt" maxlength="1000" rows="4">${esc(media.alt)}</textarea><small>Fotoğrafta ne olduğunu kısa ve anlamlı biçimde açıkla.</small></div></div><div class="dialog-footer"><button class="btn btn-primary">Kaydet</button></div></form>`;dialog.showModal();
     }else if(target.dataset.action==='studio-media-close')document.querySelector('#media-edit-dialog')?.close();
   });
   document.addEventListener('submit',event=>{
     if(event.target.id!=='media-details-form'||!root.CMSIntegration.canAccess())return;event.preventDefault();
     const next=api.getState(),media=next.media.find(m=>m.id===event.target.dataset.id);if(!media)return;
     media.alt=document.querySelector('#media-alt').value.trim();if(api.replaceState(next)){document.querySelector('#media-edit-dialog').close();api.toast('Görsel açıklaması kaydedildi. Buluta kaydet ve yayınla.');}
   });
 }};
})(window);
