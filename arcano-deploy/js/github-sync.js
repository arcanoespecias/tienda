// ===================== GITHUB SYNC MODULE v5 =====================

const GH_SYNC_KEY = 'arcano_github_config';
const GH_DATA_PATH = 'data/arcano-data.json';
const GH_POLL_INTERVAL = 3000; // 3 segundos para sync mas rapido

let ghConfig = null;
let ghRemoteSha = null;
let ghPollTimer = null;
let ghSyncInProgress = false;
let ghPushErrors = 0;

// -------------------- Config --------------------

function getGhConfig() {
  if (ghConfig) return ghConfig;
  try {
    const saved = JSON.parse(localStorage.getItem(GH_SYNC_KEY) || 'null');
    if (saved && saved.token && saved.owner && saved.repo) { ghConfig = saved; return ghConfig; }
  } catch {}
  try {
    const dbRaw = localStorage.getItem(DB_KEY);
    if (dbRaw) {
      const db = JSON.parse(dbRaw);
      if (db._ghConfig && db._ghConfig.token && db._ghConfig.owner && db._ghConfig.repo) {
        ghConfig = db._ghConfig;
        localStorage.setItem(GH_SYNC_KEY, JSON.stringify(ghConfig));
        return ghConfig;
      }
    }
  } catch {}
  return null;
}

function saveGhConfig(config) {
  ghConfig = config;
  localStorage.setItem(GH_SYNC_KEY, JSON.stringify(config));
  try {
    const dbRaw = localStorage.getItem(DB_KEY);
    if (dbRaw) {
      const db = JSON.parse(dbRaw);
      db._ghConfig = { owner: config.owner, repo: config.repo, branch: config.branch, token: config.token };
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    }
  } catch {}
}

function clearGhConfig() {
  ghConfig = null;
  ghRemoteSha = null;
  localStorage.removeItem(GH_SYNC_KEY);
  try {
    const dbRaw = localStorage.getItem(DB_KEY);
    if (dbRaw) {
      const db = JSON.parse(dbRaw);
      delete db._ghConfig;
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    }
  } catch {}
  stopGhPolling();
}

// -------------------- Auto-config por URL hash --------------------

function checkHashConfig() {
  try {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#gh=')) return false;
    const encoded = hash.slice(4);
    history.replaceState(null, '', window.location.pathname);
    const parts = decodeURIComponent(atob(encoded)).split('|');
    if (parts.length < 4) return false;
    const [owner, repo, branch, token] = parts;
    if (!owner || !repo || !token) return false;
    saveGhConfig({ owner, repo, branch: branch || 'main', token });
    return true;
  } catch { history.replaceState(null, '', window.location.pathname); return false; }
}

function generarLinkConexion() {
  const cfg = getGhConfig();
  if (!cfg) return '';
  const payload = btoa(unescape(encodeURIComponent(
    [cfg.owner, cfg.repo, cfg.branch || 'main', cfg.token].join('|')
  )));
  return window.location.origin + window.location.pathname + '#gh=' + payload;
}

// -------------------- API calls --------------------

async function ghApiRequest(method, endpoint, body) {
  const cfg = getGhConfig();
  if (!cfg) throw new Error('Configuracion de GitHub no encontrada');
  const sep = cfg.branch ? '&' : '?';
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${GH_DATA_PATH}${cfg.branch ? '?ref=' + cfg.branch : ''}${sep}_t=${Date.now()}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': 'Bearer ' + cfg.token,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Arcano-PWA'
    },
    cache: 'no-store',
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 404 && method === 'GET') return null;
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `GitHub API error ${res.status}`);
  }
  return res.json();
}

// -------------------- Pull --------------------

async function ghPull() {
  if (ghSyncInProgress) return false;
  ghSyncInProgress = true;
  try {
    const data = await ghApiRequest('GET');
    if (!data) { ghRemoteSha = null; return false; }
    if (data.sha === ghRemoteSha) return false;

    ghRemoteSha = data.sha;
    const remoteDB = JSON.parse(atob(data.content));

    if (remoteDB._ghConfig && remoteDB._ghConfig.token && remoteDB._ghConfig.owner && remoteDB._ghConfig.repo) {
      if (!getGhConfig()) saveGhConfig(remoteDB._ghConfig);
    }

    localStorage.setItem(DB_KEY, JSON.stringify(remoteDB));
    if (remoteDB._ghConfig) saveGhConfig(remoteDB._ghConfig);
    syncIdCounter(remoteDB);

    // Actualizar referencia del usuario actual
    if (typeof currentUser !== 'undefined' && currentUser) {
      const updatedUser = (remoteDB.usuarios || []).find(u => u.id === currentUser.id);
      if (updatedUser) {
        currentUser = updatedUser;
        console.log('[Sync] Usuario actualizado:', currentUser.nombre, currentUser.rol);
        if (typeof updateUserChip === 'function') updateUserChip();
      }
    }

    console.log('[Sync] Pull OK - SHA:', ghRemoteSha.slice(0,7));
    if (typeof updateSyncUI === 'function') updateSyncUI('ok', 'Ahora');
    return true;
  } catch (err) {
    console.warn('[Sync] Pull error:', err.message);
    if (typeof updateSyncUI === 'function') updateSyncUI('error', 'Pull');
    return false;
  } finally { ghSyncInProgress = false; }
}

// -------------------- Push --------------------

async function ghPush() {
  if (ghSyncInProgress) return;
  ghSyncInProgress = true;
  try {
    const dbRaw = localStorage.getItem(DB_KEY);
    if (!dbRaw) return;
    const db = JSON.parse(dbRaw);
    const cfg = getGhConfig();
    if (cfg) db._ghConfig = { owner: cfg.owner, repo: cfg.repo, branch: cfg.branch, token: cfg.token };
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(db, null, 2))));
    const body = { message: 'sync: ' + new Date().toISOString(), content };
    if (ghRemoteSha) body.sha = ghRemoteSha;
    const result = await ghApiRequest('PUT', '', body);
    ghRemoteSha = result.content.sha;
    ghPushErrors = 0;
    console.log('[Sync] Push OK - SHA:', ghRemoteSha.slice(0,7));
    if (typeof updateSyncUI === 'function') updateSyncUI('ok', 'OK');
  } catch (err) {
    console.warn('[Sync] Push error:', err.message);
    ghPushErrors++;
    if (typeof updateSyncUI === 'function') updateSyncUI('error', 'Push');
    if (ghPushErrors <= 3 && typeof toast === 'function') toast('Error sync: ' + err.message, 'err');
    if (err.message && (err.message.includes('409') || err.message.includes('sha'))) {
      ghRemoteSha = null;
      const pulled = await ghPull();
      if (pulled) { ghSyncInProgress = false; return ghPush(); }
    }
  } finally { ghSyncInProgress = false; }
}

// -------------------- Sync ID counter --------------------

function syncIdCounter(db) {
  try {
    const allIds = [
      ...(db.especias||[]).map(e=>e.id||0),
      ...(db.blends||[]).map(b=>b.id||0),
      ...(db.ventas||[]).map(v=>v.id||0),
      ...(db.movimientos||[]).map(m=>m.id||0),
      ...(db.usuarios||[]).map(u=>u.id||0),
    ];
    const maxId = Math.max(0, ...allIds);
    if (maxId >= _idC) _idC = maxId;
  } catch {}
}

// -------------------- Polling --------------------

function startGhPolling() {
  stopGhPolling();
  if (!getGhConfig()) return;
  console.log('[Sync] Polling cada', GH_POLL_INTERVAL, 'ms');
  ghPollTimer = setInterval(async () => {
    try {
      const updated = await ghPull();
      if (updated) {
        refreshCurrentPage();
        if (currentUser) toast('Datos actualizados');
      }
    } catch(e) { console.warn('[Sync] Poll error:', e.message); }
  }, GH_POLL_INTERVAL);
}

function stopGhPolling() {
  if (ghPollTimer) { clearInterval(ghPollTimer); ghPollTimer = null; }
}

// -------------------- Sync al recuperar foco --------------------

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && getGhConfig()) {
    ghPull().then(updated => {
      if (updated) { refreshCurrentPage(); if (currentUser) toast('Datos actualizados'); }
    });
  }
});

// -------------------- Refresh --------------------

function refreshCurrentPage() {
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  const pageId = activePage.id.replace('page-', '');
  const renders = {
    dashboard: renderDashboard, costos: renderCostos, especias: renderEspecias,
    blends: renderBlends, ventas: renderVentas, reportes: renderReportes, ajustes: renderAjustes,
  };
  if (renders[pageId]) renders[pageId]();
}

// -------------------- Test connection --------------------

async function ghTestConnection() {
  try {
    const cfg = getGhConfig();
    if (!cfg) return { ok: false, msg: 'Configuracion incompleta' };
    const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'Authorization': 'Bearer ' + cfg.token, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Arcano-PWA' }
    });
    if (!res.ok) {
      if (res.status === 404) return { ok: false, msg: 'Repo no encontrado o sin acceso' };
      if (res.status === 401) return { ok: false, msg: 'Token invalido o sin permisos' };
      return { ok: false, msg: `Error ${res.status}` };
    }
    const dataUrl = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${GH_DATA_PATH}${cfg.branch ? '?ref=' + cfg.branch : ''}`;
    const dataRes = await fetch(dataUrl, {
      cache: 'no-store',
      headers: { 'Authorization': 'Bearer ' + cfg.token, 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'Arcano-PWA' }
    });
    if (dataRes.status === 404) return { ok: true, msg: 'Conexion OK. Se creara el archivo al guardar.' };
    if (dataRes.ok) { ghRemoteSha = (await dataRes.json()).sha; return { ok: true, msg: 'Conexion OK. Archivo encontrado.' }; }
    return { ok: false, msg: 'No se pudo acceder al archivo de datos' };
  } catch (err) { return { ok: false, msg: err.message }; }
}

// -------------------- Init --------------------

async function initGithubSync() {
  const hashConfigured = checkHashConfig();
  const cfg = getGhConfig();
  if (!cfg) {
    console.log('[Sync] Sin configuracion de GitHub');
    if (typeof updateSyncUI === 'function') updateSyncUI('error', 'No cfg');
    return false;
  }
  console.log('[Sync] Config:', cfg.owner + '/' + cfg.repo);
  const updated = await ghPull();
  if (updated) console.log('[Sync] Datos iniciales descargados');
  if (hashConfigured) { await ghPush(); toast('Config recibida por link. Sincronizando...'); }
  startGhPolling();
  return true;
}

function getGhSyncStatus() {
  if (!getGhConfig()) return 'not_configured';
  if (ghPollTimer) return 'syncing';
  return 'configured';
}
