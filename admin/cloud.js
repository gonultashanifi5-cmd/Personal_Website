/* Supabase Auth + PostgREST transport. Sessions are deliberately memory-only. */
(function (root) {
  'use strict';
  const TIMEOUT_MS = 15000;
  let config = null, session = null, refreshing = null, generation = 0;
  function fail(code, message, status) { const e = new Error(message); e.code = code; if (status) e.status = status; return e; }
  function configured() { if (!config) throw fail('NOT_CONFIGURED', 'Önce Supabase proje adresini ve publishable anahtarını ayarla.'); }
  function userCopy() { return session ? {id: session.user.id, email: session.user.email || ''} : null; }
  function validRevision(value) { if (!Number.isSafeInteger(value) || value < 0) throw fail('VALIDATION', 'Geçersiz içerik sürümü. Bulut taslağını yeniden yükle.'); }
  function publicKey(value) {
    if (/^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(value)) return value;
    if (value.startsWith('sb_secret_')) throw fail('VALIDATION', 'Secret veya service_role anahtarı tarayıcıda kullanılamaz. Publishable anahtarını kullan.');
    try {
      const parts = value.split('.');
      if (parts.length !== 3) throw new Error();
      const claims = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (claims.role !== 'anon') throw new Error();
      return value;
    } catch (_) { throw fail('VALIDATION', 'Geçerli bir Supabase publishable (veya eski anon) anahtarı gerekli.'); }
  }
  function httpError(status, body, auth) {
    const code = body && body.code;
    const marker = body && typeof body.message === 'string' ? body.message : '';
    if (status === 409 || code === '40001' || marker === 'CMS_CONFLICT') return fail('CONFLICT', 'Buluttaki taslak başka bir oturumda değişti. Önce bulut taslağını yükle; yerel değişikliklerini yedekle.', status);
    if (marker === 'CMS_NOT_ADMIN' || status === 403 && !auth) return fail('NOT_ADMIN', 'Bu hesap CMS yöneticisi değil. Supabase SQL adımındaki yönetici kaydını kontrol et.', status);
    if (marker === 'CMS_NOT_FOUND') return fail('NOT_FOUND', 'Önce taslağı Supabase’e kaydet.', status);
    if (code === '22023' || marker.startsWith('CMS_INVALID')) return fail('VALIDATION', 'Taslak biçimi veya medya adresi uygun değil. Veri boyutunu, içerik alanlarını ve görsel adreslerini kontrol et.', status);
    if (status === 429) return fail('RATE_LIMIT', 'Çok fazla istek gönderildi. Biraz bekleyip yeniden dene.', status);
    if (auth && [400,401,403].includes(status)) return fail('AUTH_REQUIRED', 'Giriş doğrulanamadı. E-posta, parola ve hesap onayını kontrol edip yeniden giriş yap.', status);
    if (status === 401) return fail('AUTH_REQUIRED', 'Oturumun sona erdi. Yeniden giriş yap.', status);
    if (['PGRST202','42P01','PGRST205'].includes(code)) return fail('SETUP_REQUIRED', 'Supabase tabloları bulunamadı. supabase/setup.sql dosyasını SQL Editor’da çalıştır.', status);
    return fail('SERVER', 'Supabase isteği tamamlanamadı. Proje yapılandırmasını ve bağlantını kontrol et.', status);
  }
  async function request(path, options = {}) {
    configured();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const headers = {'apikey': config.publishableKey, 'Accept': 'application/json'};
    if (options.body !== undefined) headers['Content-Type'] = options.raw ? options.contentType : 'application/json';
    if (options.token) headers.Authorization = 'Bearer ' + options.token;
    try {
      const response = await fetch(config.supabaseUrl + path, {
        method: options.method || 'GET', headers, signal: controller.signal,
        credentials: 'omit', cache: 'no-store', redirect: 'error',
        body: options.body === undefined ? undefined : options.raw ? options.body : JSON.stringify(options.body)
      });
      const raw = await response.text();
      let body = null;
      try { body = raw ? JSON.parse(raw) : null; } catch (_) { /* Never reflect server HTML or secrets. */ }
      if (!response.ok) throw httpError(response.status, body, options.auth);
      if (raw && body === null) throw fail('SERVER', 'Supabase beklenmeyen bir yanıt döndürdü.');
      return body;
    } catch (error) {
      if (error.code) throw error;
      if (error.name === 'AbortError') throw fail('TIMEOUT', 'Supabase yanıtı zaman aşımına uğradı. Kaydetme sonucu belirsizse yeniden denemeden önce bulut taslağını yükle.');
      throw fail('NETWORK', 'Supabase’e ulaşılamadı. İnternet bağlantını ve proje adresini kontrol et.');
    } finally { clearTimeout(timer); }
  }
  function acceptSession(value, epoch) {
    if (epoch !== generation) throw fail('AUTH_REQUIRED', 'Oturum değişti. Yeniden giriş yap.');
    if (!value || typeof value.access_token !== 'string' || typeof value.refresh_token !== 'string' || !value.user || typeof value.user.id !== 'string') throw fail('SERVER', 'Supabase oturum yanıtı geçersiz.');
    const seconds = Number(value.expires_in);
    session = {accessToken: value.access_token, refreshToken: value.refresh_token,
      expiresAt: Date.now() + (Number.isFinite(seconds) && seconds > 0 ? seconds : 3600) * 1000,
      user: {id: value.user.id, email: value.user.email || ''}};
  }
  async function refresh() {
    if (refreshing) return refreshing;
    if (!session) throw fail('AUTH_REQUIRED', 'Önce yönetici hesabınla giriş yap.');
    const epoch = generation, token = session.refreshToken;
    const operation = (async () => {
      try { acceptSession(await request('/auth/v1/token?grant_type=refresh_token', {method: 'POST', body: {refresh_token: token}, auth: true}), epoch); }
      catch (error) { if (epoch === generation && error.code === 'AUTH_REQUIRED') session = null; throw error; }
    })();
    refreshing = operation;
    try { await operation; } finally { if (refreshing === operation) refreshing = null; }
  }
  async function authorized(path, options = {}) {
    configured();
    if (!session) throw fail('AUTH_REQUIRED', 'Önce yönetici hesabınla giriş yap.');
    if (session.expiresAt - Date.now() < 60000) await refresh();
    const epoch = generation, token = session.accessToken;
    try {
      const result = await request(path, {...options, token});
      if (epoch !== generation) throw fail('AUTH_REQUIRED', 'Oturum değişti.');
      return result;
    } catch (error) {
      // Only retry a definite authorization rejection, never ambiguous writes/timeouts.
      if (error.status !== 401 || epoch !== generation || !session) throw error;
      if (session.accessToken === token) await refresh();
      const result = await request(path, {...options, token: session.accessToken});
      if (epoch !== generation) throw fail('AUTH_REQUIRED', 'Oturum değişti.');
      return result;
    }
  }
  function draftResult(value) {
    if (value === null) return null;
    if (!value || !Number.isSafeInteger(value.revision) || value.revision < 1 || !value.payload || value.payload.version !== 1) throw fail('SERVER', 'Bulut taslağının biçimi geçersiz.');
    return {revision: value.revision, payload: value.payload};
  }
  root.CMSCloud = Object.freeze({
    configure(input = {}) {
      const rawUrl = String(input.supabaseUrl || '').trim(), key = String(input.publishableKey || '').trim();
      if (!rawUrl && !key) { generation++; config = null; session = null; refreshing = null; return false; }
      let url;
      try { url = new URL(rawUrl); } catch (_) { throw fail('VALIDATION', 'Supabase proje adresi geçersiz.'); }
      if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !/^\/?$/.test(url.pathname)) throw fail('VALIDATION', 'Supabase proje adresi yalnızca HTTPS kök adresi olmalı.');
      const siteId = String(input.siteId || 'personal-website');
      if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(siteId)) throw fail('VALIDATION', 'Site kimliği küçük harf, rakam, tire veya alt çizgi içermeli.');
      const next = {supabaseUrl: url.origin, publishableKey: publicKey(key), siteId, siteUrl: String(input.siteUrl || '')};
      if (!config || config.supabaseUrl !== next.supabaseUrl || config.publishableKey !== next.publishableKey || config.siteId !== next.siteId) { generation++; session = null; refreshing = null; }
      config = next;
      return true;
    },
    isConfigured: () => !!config,
    isSignedIn: () => !!session,
    getUser: userCopy,
    async signIn(email, password) {
      configured();
      if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) throw fail('VALIDATION', 'E-posta ve parola gerekli.');
      const epoch = ++generation;
      session = null; refreshing = null;
      acceptSession(await request('/auth/v1/token?grant_type=password', {method: 'POST', body: {email: email.trim(), password}, auth: true}), epoch);
      return userCopy();
    },
    async signOut() {
      const token = session && session.accessToken;
      generation++; session = null; refreshing = null;
      if (token && config) {
        try { await request('/auth/v1/logout?scope=local', {method: 'POST', token, auth: true}); }
        catch (error) { if (error.code !== 'AUTH_REQUIRED') throw error; }
      }
    },
    async loadDraft() {
      configured();
      return draftResult(await authorized('/rest/v1/rpc/cms_load_draft', {method: 'POST', body: {p_site_id: config.siteId}}));
    },
    async saveDraft(payload, expectedRevision) {
      configured(); validRevision(expectedRevision);
      return draftResult(await authorized('/rest/v1/rpc/cms_save_draft', {method: 'POST', body: {p_site_id: config.siteId, p_payload: payload, p_expected_revision: expectedRevision}}));
    },
    async publish(expectedRevision) {
      configured(); validRevision(expectedRevision);
      const value = await authorized('/rest/v1/rpc/cms_publish', {method: 'POST', body: {p_site_id: config.siteId, p_expected_revision: expectedRevision}});
      if (!value || !Number.isSafeInteger(value.revision) || typeof value.publishedAt !== 'string') throw fail('SERVER', 'Yayın yanıtının biçimi geçersiz.');
      return {revision: value.revision, publishedAt: value.publishedAt};
    },
    async uploadImage(dataUrl, name) {
      configured();
      if (!session) throw fail('AUTH_REQUIRED', 'Önce yönetici hesabınla giriş yap.');
      if (typeof dataUrl !== 'string' || dataUrl.length > 1400000) throw fail('VALIDATION', 'Görsel en fazla 1 MiB olmalı.');
      const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
      if (!match) throw fail('VALIDATION', 'PNG, JPEG veya WebP görseli gerekli.');
      let binary;
      try { binary = atob(match[2]); } catch (_) { throw fail('VALIDATION', 'Görsel verisi çözümlenemedi.'); }
      if (!binary.length || binary.length > 1048576) throw fail('VALIDATION', 'Görsel en fazla 1 MiB olmalı.');
      const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
      const imageType = match[1];
      const signature = imageType === 'png' ? [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)
        : imageType === 'jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : binary.slice(0,4) === 'RIFF' && binary.slice(8,12) === 'WEBP';
      if (!signature) throw fail('VALIDATION', 'Dosya içeriği belirtilen görsel türüyle eşleşmiyor.');
      // Names never become object paths; prevent traversal and preserve privacy.
      const path = session.user.id + '/' + crypto.randomUUID() + '.' + (imageType === 'jpeg' ? 'jpg' : imageType);
      const epoch = generation, baseUrl = config.supabaseUrl;
      await authorized('/storage/v1/object/cms-media/' + path, {method: 'POST', body: bytes, raw: true, contentType: 'image/' + imageType});
      if (epoch !== generation) throw fail('AUTH_REQUIRED', 'Oturum değişti.');
      return baseUrl + '/storage/v1/object/public/cms-media/' + path;
    }
  });
})(typeof window === 'undefined' ? globalThis : window);
