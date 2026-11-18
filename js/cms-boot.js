/* Runs in <head>, before the static document can paint. No script = normal fallback. */
(function(root){
  'use strict';
  const html=document.documentElement;
  const style=document.createElement('style');
  style.textContent='html[data-cms-pending] body{visibility:hidden!important}html[data-cms-pending]::before{content:attr(data-cms-loading-label);position:fixed;inset:0;display:grid;place-items:center;background:#222435;color:#f8f9fb;font:500 16px/1.5 system-ui,sans-serif;z-index:2147483647}';
  document.head.appendChild(style);
  html.dataset.cmsLoadingLabel=html.lang==='tr'?'İçerik yükleniyor…':'Loading content…';
  html.setAttribute('data-cms-pending','');
  let released=false;
  const timer=setTimeout(()=>release(),12000);
  function release(){if(released)return;released=true;clearTimeout(timer);html.removeAttribute('data-cms-pending');html.removeAttribute('data-cms-loading-label');}
  root.HANIFI_CMS_READY=release;
})(window);
