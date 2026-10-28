(function websiteContent(root) {
  'use strict';
  const config = root.HANIFI_CMS_CONFIG || {};
  const file = location.pathname.split('/').pop() || 'index.html';
  const language = /-tr\.html$/i.test(file) || document.documentElement.lang === 'tr' ? 'tr' : 'en';
  const key = file.replace(/-tr\.html$|\.html$/gi,'') || 'index';
  const pageId = key === 'index' ? 'home' : key;
  const tr = language==='tr';
  const $=(s,el=document)=>el.querySelector(s), all=(s,el=document)=>Array.from(el.querySelectorAll(s));
  const text=(value)=>typeof value==='string'?value:'';
  const local=(value)=>value&&typeof value==='object'?text(value[language]||value.tr):'';
  const lines=value=>text(value).split(/\n+/).map(x=>x.trim()).filter(Boolean);
  function url(value,image=false){
    if(typeof value!=='string'||!value||value.length>2048||/[\s<>"\\]/.test(value))return '';
    if(/^assets\/[A-Za-z0-9_.-]+$/.test(value))value='image/'+value.slice(7);
    if(/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value)){
      try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}
    }
    if(value.startsWith('//')||value.startsWith('/')||/(^|\/)\.\.?($|\/)/.test(value)||/%2e|%2f|%5c/i.test(value))return '';
    if(image&&!/^(image|images|projects|projectimage)\/[A-Za-z0-9_.%/-]+$/.test(value))return '';
    if(!image&&!/^(?:projects\/[A-Za-z0-9_.%/-]+|[A-Za-z0-9_-]+\.html(?:#[A-Za-z0-9_-]+)?)$/.test(value))return '';
    const u=new URL(value,location.href);return u.origin===location.origin?u.href:'';
  }
  function element(tag,className,content){
    const node=document.createElement(tag);if(className)node.className=className;if(content!==undefined)node.textContent=content;return node;
  }
  function setText(selector,value,scope=document){const target=$(selector,scope);if(target&&typeof value==='string')target.textContent=value;return target;}
  function setImage(node,src,alt){if(node&&src===''){node.remove();return;}const safe=url(src,true);if(node&&safe){node.src=safe;node.alt=alt||'';node.loading='lazy';}}
  function recordValid(item,type){
    return item&&typeof item.id==='string'&&item.type===type&&item.title&&item.body&&typeof item.title.tr==='string'&&typeof item.body.tr==='string';
  }
  function valid(payload){
    return payload&&payload.version===1&&payload.settings&&typeof payload.settings.siteName==='string'&&
      ['pages','projects','posts','media'].every(k=>Array.isArray(payload[k])&&payload[k].length<=500)&&
      payload.pages.every(x=>recordValid(x,'page'))&&payload.projects.every(x=>recordValid(x,'project'))&&payload.posts.every(x=>recordValid(x,'post'))&&
      payload.media.every(x=>x&&typeof x.id==='string'&&typeof x.src==='string'&&url(x.src,true));
  }
  function setHome(page,settings){
    if(!page?.updatedAt)return;
    const parts=lines(local(page.body)),name=$('.typewriter-name'),tw=$('#typewriter-text');
    if(name)name.textContent=parts.shift()||settings.fullName||'';
    // The old timer retains its old DOM reference; it can no longer overwrite CMS text.
    if(tw){const fresh=tw.cloneNode(false);fresh.textContent=parts.join(' · ');fresh.style.fontSize='1.35rem';fresh.style.lineHeight='1.6';tw.replaceWith(fresh);}
    setImage($('#home-section img'),page.cover,settings.fullName);
  }
  function pageDetails(page,settings){
    if(!page?.updatedAt)return;
    const section=$('#'+pageId+'-section');if(!section)return;
    setText('.heading-section h2',local(page.title),section);
    document.title=local(page.title)+' — '+settings.siteName;
    const body=local(page.body);
    if(pageId==='about'){
      const bio=$('.bio-section p',section);if(bio){bio.textContent=body;bio.style.whiteSpace='pre-line';}
      setImage($('.about-photo',section),page.cover,settings.fullName);
    }else if(pageId==='contact'){
      const p=$('.heading-section p',section);if(p){p.textContent=body;p.style.whiteSpace='pre-line';}
    }else if(pageId==='services'){
      const originals=all('.services-1',section),labels=lines(body);
      const parent=originals[0]?.parentElement.parentElement;
      if(parent&&originals.length){
        const template=originals[0].parentElement.cloneNode(true);
        originals.forEach(card=>card.parentElement.remove());
        labels.forEach((label,index)=>{
          const col=index<originals.length?originals[index].parentElement:template.cloneNode(true);
          const card=$('.services-1',col);setText('h3',label,card);
          col.classList.remove('ftco-animate');col.style.opacity='1';
          if(index>=originals.length){const description=$('.desc p',card);if(description)description.textContent='';all('span[style*="position: absolute"]',card).forEach(n=>n.remove());card.removeAttribute('href');card.style.cursor='default';}
          parent.appendChild(col);
        });
      }
    }else if(pageId==='skills'){
      const parts=body.split(/\n\s*\n/),skills=$('.skill-list',section),languages=$('.language-list',section);
      if(skills){skills.replaceChildren(...lines(parts[0]).map(s=>{const item=element('div','skill-item');item.appendChild(element('span','',s));return item;}));skills.style.opacity='1';}
      if(languages)languages.replaceChildren(...lines(parts.slice(1).join('\n')).map(s=>element('span','language-pill',s)));
    }else if(['projects','blog'].includes(pageId)){
      // Collection contents are managed in their own editors; page body is the introduction.
      const intro=$('.heading-section p',section);if(intro){intro.textContent=body;intro.style.whiteSpace='pre-line';}
    }
  }
  function projects(items){
    const cards=all('#projects-section .project-template'),container=cards[0]?.parentElement;if(!container)return;
    const template=cards[0].cloneNode(true),map=new Map(cards.map((node,i)=>['project-'+(i+1),node]));
    const anchor=document.createComment('CMS projects');container.insertBefore(anchor,cards[0]);
    cards.forEach(n=>n.remove());
    for(const item of items){
      let card=map.get(item.id);
      if(!card){card=template.cloneNode(true);card.removeAttribute('id');all('[id]',card).forEach(n=>n.removeAttribute('id'));card.classList.remove('flex-row-reverse');}
      if(item.updatedAt||!map.has(item.id)){
        setText('h3',local(item.title),card);
        const heading=$('h3',card),desc=heading?.nextElementSibling;
        if(desc){desc.textContent=local(item.body);desc.style.whiteSpace='pre-line';}
        const image=$('img',card);if(item.cover)setImage(image,item.cover,local(item.title));else if(image)image.remove();
        const link=$('a.btn',card)||$('a',card),href=url(item.link);
        if(link){if(href){link.href=href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=tr?'Projeyi aç':'Open project';}else link.remove();}
      }
      container.insertBefore(card,anchor);
    }
    anchor.remove();
  }
  function posts(items){
    const cards=all('#blog-section .blog-card-container');if(!cards.length)return;
    const containers=[...new Set(cards.map(n=>n.parentElement))],parent=containers[0],originalMap=new Map(cards.map((n,i)=>['post-'+(i+1),n]));
    const template=cards[0].cloneNode(true);
    cards.forEach(n=>n.remove());
    containers.slice(1).forEach(n=>{if(!n.children.length)n.remove();});
    for(const item of items){
      const original=originalMap.get(item.id);
      if(original&&!item.updatedAt){parent.appendChild(original);continue;}
      const card=template.cloneNode(true),entry=$('.blog-entry',card);
      if(entry)entry.removeAttribute('data-index');
      const head=$('h3',card);if(head)head.replaceChildren(element('span','',local(item.title)));
      const meta=$('.meta',card);if(meta)meta.remove();
      const image=$('.block-20',card);
      if(image){const cover=url(item.cover,true);image.classList.remove('blog-card-btn');image.removeAttribute('onclick');image.style.cursor='default';image.style.backgroundImage=cover?'url("'+cover.replace(/"/g,'%22')+'")':'none';image.setAttribute('aria-label',local(item.title));if(image.tagName==='BUTTON'){const div=element('div',image.className);div.style.cssText=image.style.cssText;image.replaceWith(div);}}
      const summary=$('.text p',card),body=local(item.body);
      if(summary)summary.textContent=body.length>170?body.slice(0,167)+'…':body;
      const details=element('details','cms-article-details'),label=element('summary','',tr?'Yazıyı oku':'Read article'),content=element('div','cms-article-body',body);
      details.append(label,content);($('.text',card)||entry||card).appendChild(details);
      const href=url(item.link);if(href){const link=element('a','',tr?'Kaynağı aç ↗':'Open source ↗');link.href=href;link.target='_blank';link.rel='noopener noreferrer';details.append(link);}
      parent.appendChild(card);
    }
  }
  function gallery(media,page){
    const nodes=all('#gallery-section .gallery-item'),parent=nodes[0]?.parentElement;if(!parent)return;
    const sourceNames=['duden.jpg','kaleici.jpg','olympos.webp','patara.jpg','side.jpg','xanthos.jpg'];
    const map=new Map(nodes.map((node,i)=>[sourceNames[i],node])),template=nodes[0].cloneNode(true);
    const captions=page?.updatedAt?lines(local(page.body)):[];
    nodes.forEach(n=>n.remove());
    let position=0;
    for(const item of media.filter(m=>!/(^|\/)(homepp|profile)\.png(?:[?#]|$)/i.test(m.src))){
      const filename=item.src.split('/').pop(),existing=map.get(filename),card=existing||template.cloneNode(true);
      const img=$('img',card),title=$('.gallery-info h3',card)||$('.gallery-info h4',card)||$('.gallery-info strong',card);
      setImage(img,item.src,item.alt||item.name);
      if(title&&(captions[position]||!existing))title.textContent=captions[position]||item.alt||item.name;
      if(!existing){card.tabIndex=0;const info=$('.gallery-info',card);if(info){const show=()=>info.style.transform='translateY(0)';const hide=()=>info.style.transform='translateY(100%)';card.addEventListener('mouseenter',show);card.addEventListener('mouseleave',hide);card.addEventListener('focusin',show);card.addEventListener('focusout',hide);}all('.gallery-info p',card).forEach(n=>n.remove());all('[onclick]',card).forEach(n=>n.removeAttribute('onclick'));}
      const anchor=$('a',card),href=url(item.src,true);if(anchor&&href){anchor.href=href;anchor.target='_blank';anchor.rel='noopener noreferrer';}
      parent.appendChild(card);position++;
    }
  }
  function apply(payload){
    if(!valid(payload))throw new Error('Invalid publication');
    const settings=payload.settings,page=payload.pages.find(x=>x.id===pageId);
    all('.navbar-brand').forEach(n=>{n.textContent=settings.siteName;});
    if(settings.email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)){
      all('a[href^="mailto:"]').forEach(n=>{n.href='mailto:'+settings.email;n.textContent=settings.email;});
      all('#contact-section .box p a').filter(n=>n.href.includes('mail.google.com')).forEach(n=>{n.href='mailto:'+settings.email;n.textContent=settings.email;});
    }
    if(pageId==='home')setHome(page,settings);else pageDetails(page,settings);
    if(pageId==='projects')projects(payload.projects);
    if(pageId==='blog')posts(payload.posts);
    if(pageId==='gallery')gallery(payload.media,page);
    document.documentElement.dataset.cmsSource='supabase';
  }
  async function start(){
    if(!config.supabaseUrl||!config.publishableKey)return;
    let endpoint;
    try{endpoint=new URL(config.supabaseUrl);if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.pathname!=='/'||/^sb_secret_/.test(config.publishableKey))return;}catch{return;}
    if(!/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey)){
      try{const parts=config.publishableKey.split('.');if(parts.length!==3||JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/'))).role!=='anon')return;}catch{return;}
    }
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch(endpoint.origin+'/rest/v1/cms_publications?site_id=eq.'+encodeURIComponent(config.siteId||'hanifi-personal')+'&select=payload,revision&limit=1',{headers:{apikey:config.publishableKey},signal:controller.signal,cache:'no-store',credentials:'omit',redirect:'error'});
      if(!response.ok)throw new Error('Publication unavailable');
      const body=await response.text();if(body.length>6291456)throw new Error('Publication too large');
      const rows=JSON.parse(body);
      if(Array.isArray(rows)&&rows[0]?.payload)apply(rows[0].payload);
    }catch{document.documentElement.dataset.cmsSource='static';}
    finally{clearTimeout(timer);}
  }
  const style=element('style','');
  style.textContent='.cms-article-details{margin-top:1rem;color:inherit}.cms-article-details summary{cursor:pointer;color:#b08b22;font-weight:600}.cms-article-body{white-space:pre-line;line-height:1.8;margin:1rem 0;overflow-wrap:anywhere}.blog-entry .cms-article-details a{color:#b08b22}';
  document.head.appendChild(style);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window);
