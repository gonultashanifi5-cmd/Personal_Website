(function imageBackups(root){
 'use strict';
 const MAX=20971520,groups=['pages','projects','posts'];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const clone=v=>JSON.parse(JSON.stringify(v));
 let api,busy=false,rows=[],message='';
 const allowed=()=>root.CMSIntegration?.canAccess()===true;
 function refs(snapshot){return [...new Set(snapshot.media.map(m=>m.src).concat(groups.flatMap(g=>snapshot[g].flatMap(x=>[x.cover,x.seo?.image]))).filter(Boolean))];}
 function sourceURL(src){
   if(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(src))return src;
   if(/^assets\/[A-Za-z0-9_.-]+$/.test(src))return new URL(src,location.href).href;
   const base=root.CMSStudio?.siteRoot()||new URL('../',location.href);
   const url=new URL(src,base);if(url.protocol!=='https:'&&url.origin!==location.origin||url.username||url.password)throw new Error('Görsel adresi desteklenmiyor.');
   return url.href;
 }
 async function digest(blob){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');}
 async function image(blob){
   if(!blob.size||blob.size>MAX)throw new Error('Görsel boş veya 20 MB sınırını aşıyor.');
   const b=new Uint8Array(await blob.slice(0,16).arrayBuffer());let mime,ext;
   if([137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v)){mime='image/png';ext='png';}
   else if(b[0]===255&&b[1]===216&&b[2]===255){mime='image/jpeg';ext='jpg';}
   else if(String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP'){mime='image/webp';ext='webp';}
   else throw new Error('PNG, JPEG veya WebP görseli gerekli.');
   return {blob:new Blob([blob],{type:mime}),mime,ext};
 }
 async function create(snapshot,progress=()=>{},previous=null){
   if(!allowed())throw new Error('Önce giriş yap.');
   const id=crypto.randomUUID(),files=[],failed=[],uploaded=new Map(),sources=[...new Set(refs(snapshot).concat(previous?refs(previous):[]))];
   for(const src of sources){
     progress(`Görsel yedekleniyor: ${files.length+failed.length+1}/${sources.length}`);
     try{
       const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);let value;
       try{
         const response=await fetch(sourceURL(src),{signal:controller.signal,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
         if(!response.ok)throw new Error('Dosya okunamadı ('+response.status+').');
         if(Number(response.headers.get('content-length'))>MAX)throw new Error('20 MB sınırı aşılıyor.');
         let blob;
         if(response.body?.getReader){const reader=response.body.getReader(),chunks=[];let size=0;for(;;){const chunk=await reader.read();if(chunk.done)break;size+=chunk.value.length;if(size>MAX){await reader.cancel();throw new Error('20 MB sınırı aşılıyor.');}chunks.push(chunk.value);}blob=new Blob(chunks);}else blob=await response.blob();
         value=await image(blob);
       }finally{clearTimeout(timer);}
       const hash=await digest(value.blob),name=hash+'.'+value.ext;
       let path=uploaded.get(hash);
       if(!path){path=await root.CMSCloud.putBackupFile(id,name,value.blob);uploaded.set(hash,path);}
       files.push({source:src,path,sha256:hash,mime:value.mime,size:value.blob.size,name});
     }catch(error){failed.push({source:src.startsWith('data:')?'Yeni yüklenen görsel':src,error:error.message});}
   }
   const manifest={version:1,createdAt:new Date().toISOString(),snapshot:clone(previous||snapshot),files,failed};
   await root.CMSCloud.putBackupFile(id,'manifest.json',new Blob([JSON.stringify(manifest)],{type:'application/json'}));
   await root.CMSCloud.registerFileBackup(id,files.length,failed.length);
   return manifest;
 }
 async function read(path){
   const blob=await root.CMSCloud.getBackupFile(path);if(blob.size>MAX)throw new Error('Yedek manifesti çok büyük.');
   const data=JSON.parse(await blob.text());
   if(data.version!==1||data.snapshot?.version!==1||!Array.isArray(data.files)||!Array.isArray(data.failed)||!Array.isArray(data.snapshot.media)||!groups.every(g=>Array.isArray(data.snapshot[g])))throw new Error('Yedek biçimi geçersiz.');
   return data;
 }
 async function bytes(file){
   const blob=await root.CMSCloud.getBackupFile(file.path);
   if(blob.size!==file.size||await digest(blob)!==file.sha256)throw new Error('Yedek dosyasının bütünlüğü doğrulanamadı.');
   return (await image(blob)).blob;
 }
 // Dependency-free ZIP store writer. Every file is accompanied by SHA-256 in manifest.json.
 function zip(entries){
   const encoder=new TextEncoder(),parts=[],central=[];let offset=0,centralSize=0;
   const table=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);return c>>>0;});
   const crc=bytes=>{let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;};
   for(const entry of entries){
     const name=encoder.encode(entry.name),data=entry.data,checksum=crc(data),header=new Uint8Array(30+name.length),h=new DataView(header.buffer);
     h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(12,0x21,true);h.setUint32(14,checksum,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);header.set(name,30);
     const directory=new Uint8Array(46+name.length),d=new DataView(directory.buffer);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint16(14,0x21,true);d.setUint32(16,checksum,true);d.setUint32(20,data.length,true);d.setUint32(24,data.length,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);directory.set(name,46);
     parts.push(header,data);central.push(directory);offset+=header.length+data.length;centralSize+=directory.length;
   }
   const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,entries.length,true);e.setUint16(10,entries.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);
   return new Blob([...parts,...central,end],{type:'application/zip'});
 }
 function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function view(){
   return `<div class="page-heading"><div><div class="eyebrow">DOSYA YEDEKLERİ</div><h1>Görsel yedekleri</h1><p>Fotoğrafların dosyalarını özel depoda sakla, ZIP indir veya taslağa geri getir.</p></div><div class="heading-actions"><button class="btn btn-primary" data-action="backup-create" ${busy?'disabled':''}>Şimdi yedekle</button><button class="btn btn-secondary" data-action="backup-list" ${busy?'disabled':''}>Yedekleri yükle</button></div></div><p class="connection-message" role="status">${esc(message||'Her yayın öncesinde dosya yedeği alınır. Dosyalar yönetici hesabına özel saklanır.')}</p><section class="panel"><div class="panel-body"><ul class="history-list">${rows.map(row=>`<li><div><strong>${esc(new Date(row.created_at).toLocaleString('tr-TR'))}</strong><small>${row.file_count} dosya · ${row.failed_count?'Eksik: '+row.failed_count:'Tam yedek'}</small></div><div class="row-actions"><button class="btn btn-secondary btn-small" data-action="backup-download" data-id="${esc(row.id)}" ${busy?'disabled':''}>ZIP indir</button><button class="btn btn-secondary btn-small" data-action="backup-restore" data-id="${esc(row.id)}" ${busy?'disabled':''}>Geri yükle</button></div></li>`).join('')||'<li>Yedekleri görmek için Yedekleri yükle düğmesini kullan.</li>'}</ul></div></section>`;
 }
 root.CMSAssets={create,view,zip,refs,image,digest,install(workspace){api=workspace;
   document.addEventListener('click',async event=>{
     const target=event.target.closest('[data-action^="backup-"]');if(!target||busy||target.disabled||!allowed())return;
     const action=target.dataset.action.slice(7),row=rows.find(x=>x.id===target.dataset.id);busy=true;message='İşlem sürüyor…';api.render();
     try{
       if(action==='create'){const result=await create(api.getState(),text=>{message=text;api.render();});message=`${result.files.length} dosya yedeklendi.${result.failed.length?' Eksik dosyalar: '+result.failed.map(x=>x.source+' — '+x.error).join('; '):' Tam yedek oluşturuldu.'}`;rows=await root.CMSCloud.listFileBackups();}
       else if(action==='list'){rows=await root.CMSCloud.listFileBackups();message=rows.length+' dosya yedeği bulundu.';}
       else if(row){
         const manifest=await read(row.path);
         if(action==='download'){
           const manifestBytes=new TextEncoder().encode(JSON.stringify(manifest,null,2)),uniqueFiles=[...new Map(manifest.files.map(file=>[file.name,file])).values()];
           if(uniqueFiles.reduce((n,f)=>n+f.size,manifestBytes.length)>104857600)throw new Error('Bu yedek ZIP indirme için 100 MB sınırını aşıyor.');
           const entries=[{name:'manifest.json',data:manifestBytes}],seen=new Set();
           for(const file of manifest.files)if(!seen.has(file.name)){seen.add(file.name);entries.push({name:'images/'+file.name,data:new Uint8Array(await(await bytes(file)).arrayBuffer())});}
           download(zip(entries),'hanifi-gorsel-yedegi-'+row.id+'.zip');message='Görselleri ve içerik kaydını içeren ZIP indirildi.';
         }else if(action==='restore'){
           if(!root.CMSIntegration.isDraftLoaded())throw new Error('Önce güncel bulut taslağını yükle.');
           if(manifest.failed.length)throw new Error('Bu yedek eksik dosyalar içeriyor. Önce ZIP indirerek eksik dosya listesini kontrol et.');
           const before=api.getState();
           if(!await api.confirm('Dosya yedeğini geri yükle','Görseller yeni adreslerle Storage’a yüklenir ve herkese açık olur. Yerel içerik bu yedekle değişir; canlı sayfalar yayınlayana kadar değişmez.','Geri yükle'))return;
           const replacements=new Map(),uploaded=new Map(),wanted=new Set(refs(manifest.snapshot));
           for(const file of manifest.files){if(!wanted.has(file.source))continue;let src=uploaded.get(file.sha256);if(!src){src=await root.CMSCloud.restoreImage(await bytes(file));uploaded.set(file.sha256,src);}replacements.set(file.source,src);}
           if(!allowed()||JSON.stringify(before)!==JSON.stringify(api.getState()))throw new Error('Taslak değişti. Düzenlemelerin korundu; yeniden dene.');
           const next=clone(manifest.snapshot);
           next.media.forEach(m=>{if(replacements.has(m.src)){const file=manifest.files.find(f=>f.source===m.src);m.src=replacements.get(m.src);m.size=file.size;m.uploaded=true;}});
           for(const group of groups)for(const item of next[group]){if(replacements.has(item.cover)){item.cover=replacements.get(item.cover);item.updatedAt=new Date().toISOString();}if(item.seo&&replacements.has(item.seo.image))item.seo.image=replacements.get(item.seo.image);}
           if(!api.replaceState(next))throw new Error('Görseller yüklendi ancak yerel taslak kaydedilemedi.');
           message='Dosyalar ve içerik taslağa geri yüklendi. Buluta kaydet ve yayınla.';
         }
       }
     }catch(error){message=error.message||'Dosya yedeği işlemi tamamlanamadı.';api.toast(message);}
     finally{busy=false;if(allowed())api.render();}
   });
 }};
})(window);
