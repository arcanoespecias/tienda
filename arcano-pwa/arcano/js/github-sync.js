// ===================== GITHUB SYNC MODULE =====================
// La config de GitHub se embebe en el archivo de datos sincronizado.
// Así, una vez que el admin configura, todos los dispositivos lo heredan automáticamente.
// También soporta auto-config por hash de URL (para compartir link al operador).

const GH_SYNC_KEY = 'arcano_github_config';
const GH_DATA_PATH = 'data/arcano-data.json';
const GH_POLL_INTERVAL = 5000; // 5 segundos

let ghConfig = null;
let ghRemoteSha = null;       // SHA del archivo en GitHub
let ghPollTimer = null;
let ghSyncInProgress = false;
let ghPushErrors = 0;         // contador de errores de push

// -------------------- Config --------------------

function getGhConfig() {
  if (ghConfig) return ghConfig;
  // 1. localStorage local
  try {
    const saved = JSON.parse(localStorage.getItem(GH_SYNC_KEY) || 'null');
    if (saved && saved.token && saved.owner && saved.repo) {
      ghConfig = saved;
      return ghConfig;
    }
  } catch {}
  // 2. Config embebida en la DB sincronizada (heredada del admin)
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
  } catch {
    history.replaceState(null, '', window.location.pathname);
    return false;
  }
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
  if (!cfg) throw new Error('Configuración de GitHub no encontrada');
  // Cache-busting: cada request tiene timestamp unico
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

// -------------------- Pull (leer desde GitHub) --------------------

async function ghPull() {
  if (ghSyncInProgress) return false;
  ghSyncInProgress = true;
  try {
    const data = await ghApiRequest('GET');
    if (!data) {
      ghRemoteSha = null;
      return false;
    }

    // Si el SHA es igual al que ya tenemos, no hay cambios
    if (data.sha === ghRemoteSha) return false;

    // El SHA cambió: hay datos nuevos
    ghRemoteSha = data.sha;
    const remoteDB = JSON.parse(atob(data.content));

    // Extraer config embebida del remoto
    if (remoteDB._ghConfig && remoteDB._ghConfig.token && remoteDB._ghConfig.owner && remoteDB._ghConfig.repo) {
      if (!getGhConfig()) {
        saveGhConfig(remoteDB._ghConfig);
      }
    }

    // Actualizar localStorage con los datos remotos
    localStorage.setItem(DB_KEY, JSON.stringify(remoteDB));
    if (remoteDB._ghConfig) {
      saveGhConfig(remoteDB._ghConfig);
    }
    syncIdCounter(remoteDB);
    return true;
  } catch (err) {
    console.warn('[GitHub Sync] Error en pull:', err.message);
    return false;
  } finally {
    ghSyncInProgress = false;
  }
}

// -------------------- Push (escribir a GitHub) --------------------

async function ghPush() {
  if (ghSyncInProgress) return;
  ghSyncInProgress = true;
  try {
    const dbRaw = localStorage.getItem(DB_KEY);
    if (!dbRaw) return;
    const db = JSON.parse(dbRaw);

    // Embeber la config actual en los datos antes de subir
    const cfg = getGhConfig();
    if (cfg) {
      db._ghConfig = { owner: cfg.owner, repo: cfg.repo, branch: cfg.branch, token: cfg.token };
    }

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(db, null, 2))));

    const body = {
      message: 'sync: ' + new Date().toISOString(),
      content: content
    };

    if (ghRemoteSha) {
      body.sha = ghRemoteSha;
    }

    const result = await ghApiRequest('PUT', '', body);
    ghRemoteSha = result.content.sha;
    ghPushErrors = 0; // resetear contador de errores
  } catch (err) {
    console.warn('[GitHub Sync] Error en push:', err.message);
    ghPushErrors++;
    // Mostrar error al usuario (maximo 1 vez cada 30 segundos)
    if (ghPushErrors <= 2 && typeof toast === 'function') {
      toast('Error al sincronizar con GitHub: ' + err.message, 'err');
    }
    if (err.message && (err.message.includes('409') || err.message.includes('sha'))) {
      ghRemoteSha = null;
      const pulled = await ghPull();
      if (pulled) {
        ghSyncInProgress = false;
        return ghPush();
      }
    }
  } finally {
    ghSyncInProgress = false;
  }
}

// -------------------- Sincronizar contador de IDs --------------------

function syncIdCounter(db) {
  try {
    const allIds = [
      ...(db.especias || []).map(e => e.id || 0),
      ...(db.blends || []).map(b => b.id || 0),
      ...(db.ventas || []).map(v => v.id || 0),
      ...(db.movimientos || []).map(m => m.id || 0),
      ...(db.usuarios || []).map(u => u.id || 0),
    ];
    const maxId = Math.max(0, ...allIds);
    if (maxId >= _idC) _idC = maxId;
  } catch {}
}

// -------------------- Polling --------------------

function startGhPolling() {
  stopGhPolling();
  if (!getGhConfig()) return;

  console.log('[GitHub Sync] Polling iniciado cada', GH_POLL_INTERVAL, 'ms');
  ghPollTimer = setInterval(async () => {
    const updated = await ghPull();
    if (updated) {
      console.log('[GitHub Sync] Datos actualizados desde GitHub');
      refreshCurrentPage();
      if (currentUser) toast('Datos actualizados desde GitHub');
    }
  }, GH_POLL_INTERVAL);
}

function stopGhPolling() {
  if (ghPollTimer) {
    clearInterval(ghPollTimer);
    ghPollTimer = null;
  }
}

// -------------------- Sync al recuperar foco --------------------

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && getGhConfig()) {
    ghPull().then(updated => {
      if (updated) {
        refreshCurrentPage();
        if (currentUser) toast('Datos actualizados desde GitHub');
      }
    });
  }
});

// -------------------- Refresh --------------------

function refreshCurrentPage() {
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  const pageId = activePage.id.replace('page-', '');
  const renders = {
    dashboard: renderDashboard,
    costos: renderCostos,
    especias: renderEspecias,
    blends: renderBlends,
    ventas: renderVentas,
    reportes: renderReportes,
    ajustes: renderAjustes,
  };
  if (renders[pageId]) renders[pageId]();
}

// -------------------- Conexión de prueba --------------------

async function ghTestConnection() {
  try {
    const cfg = getGhConfig();
    if (!cfg) return { ok: false, msg: 'Configuración incompleta' };

    const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Authorization': 'Bearer ' + cfg.token,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Arcano-PWA'
      }
    });

    if (!res.ok) {
      if (res.status === 404) return { ok: false, msg: 'Repositorio no encontrado o sin acceso' };
      if (res.status === 401) return { ok: false, msg: 'Token inválido o sin permisos' };
      return { ok: false, msg: `Error ${res.status}: verifica el token y el repositorio` };
    }

    const dataUrl = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${GH_DATA_PATH}${cfg.branch ? '?ref=' + cfg.branch : ''}`;
    const dataRes = await fetch(dataUrl, {
      cache: 'no-store',
      headers: {
        'Authorization': 'Bearer ' + cfg.token,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Arcano-PWA'
      }
    });

    if (dataRes.status === 404) {
      return { ok: true, msg: 'Conexión OK. Se creará el archivo de datos al guardar.' };
    }

    if (dataRes.ok) {
      ghRemoteSha = (await dataRes.json()).sha;
      return { ok: true, msg: 'Conexión OK. Archivo de datos encontrado.' };
    }

    return { ok: false, msg: 'No se pudo acceder al archivo de datos' };
  } catch (err) {
    return { ok: false, msg: err.message };
  }
}

// -------------------- Inicialización --------------------

async function initGithubSync() {
  // 1. Verificar si hay config por hash de URL (link compartido)
  const hashConfigured = checkHashConfig();

  const cfg = getGhConfig();
  if (!cfg) {
    console.log('[GitHub Sync] Sin configuración de GitHub');
    return false;
  }

  console.log('[GitHub Sync] Configuración encontrada:', cfg.owner + '/' + cfg.repo);

  // 2. Pull inicial
  const updated = await ghPull();
  if (updated) {
    console.log('[GitHub Sync] Datos iniciales descargados de GitHub');
  }

  // 3. Si vino por hash y se acaba de configurar, hacer push
  if (hashConfigured) {
    await ghPush();
    toast('Configuración recibida por link. Sincronizando...');
  }

  // 4. SIEMPRE iniciar polling
  startGhPolling();
  return true;
}

// -------------------- Estado de sincronización UI --------------------

function getGhSyncStatus() {
  if (!getGhConfig()) return 'not_configured';
  if (ghPollTimer) return 'syncing';
  return 'configured';
}