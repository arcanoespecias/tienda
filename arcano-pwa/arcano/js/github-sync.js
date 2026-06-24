// ===================== GITHUB SYNC MODULE =====================
// Almacena la data en un archivo JSON del repositorio via GitHub Contents API.
// Estrategia: last-write-wins con polling cada 15s + sync al recuperar foco.

const GH_SYNC_KEY = 'arcano_github_config';
const GH_DATA_PATH = 'data/arcano-data.json';
const GH_POLL_INTERVAL = 15000; // 15 segundos

let ghConfig = null;
let ghRemoteSha = null;       // SHA del archivo en GitHub (para PUT optimista)
let ghPollTimer = null;
let ghSyncInProgress = false; // evita operaciones simultáneas
let ghLastPullTimestamp = 0;

// -------------------- Config --------------------

function getGhConfig() {
  if (ghConfig) return ghConfig;
  try {
    const saved = JSON.parse(localStorage.getItem(GH_SYNC_KEY) || 'null');
    if (saved && saved.token && saved.owner && saved.repo) {
      ghConfig = saved;
      return ghConfig;
    }
  } catch {}
  return null;
}

function saveGhConfig(config) {
  ghConfig = config;
  localStorage.setItem(GH_SYNC_KEY, JSON.stringify(config));
}

function clearGhConfig() {
  ghConfig = null;
  ghRemoteSha = null;
  localStorage.removeItem(GH_SYNC_KEY);
  stopGhPolling();
}

// -------------------- API calls --------------------

async function ghApiRequest(method, endpoint, body) {
  const cfg = getGhConfig();
  if (!cfg) throw new Error('Configuración de GitHub no encontrada');
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${GH_DATA_PATH}${cfg.branch ? '?ref=' + cfg.branch : ''}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': 'Bearer ' + cfg.token,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Arcano-PWA'
    },
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
      // El archivo no existe en GitHub, no hay nada que descargar
      ghRemoteSha = null;
      return false;
    }
    ghRemoteSha = data.sha;
    const remoteDB = JSON.parse(atob(data.content));

    // Si no hay datos locales, usar los de GitHub directamente
    const localRaw = localStorage.getItem(DB_KEY);
    if (!localRaw || localRaw === '{}') {
      localStorage.setItem(DB_KEY, JSON.stringify(remoteDB));
      return true; // datos cargados desde GitHub
    }

    // Comparar timestamps: usar el más reciente
    const localDB = JSON.parse(localRaw);
    const localTs = getMaxTimestamp(localDB);
    const remoteTs = getMaxTimestamp(remoteDB);

    if (remoteTs > localTs) {
      // Remoto es más reciente: sobreescribir local
      localStorage.setItem(DB_KEY, JSON.stringify(remoteDB));
      return true; // se actualizó
    }
    return false;
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
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(db, null, 2))));

    const body = {
      message: 'sync: ' + new Date().toISOString(),
      content: content
    };

    // Si tenemos el SHA, lo usamos para update; si no, es create
    if (ghRemoteSha) {
      body.sha = ghRemoteSha;
    }

    const result = await ghApiRequest('PUT', '', body);
    ghRemoteSha = result.content.sha;
  } catch (err) {
    console.warn('[GitHub Sync] Error en push:', err.message);
    // Si falla por conflicto de SHA (409), re-pull y re-push
    if (err.message && (err.message.includes('409') || err.message.includes('sha'))) {
      ghRemoteSha = null;
      const pulled = await ghPull();
      if (pulled) {
        // Reintentar push después de pull
        ghSyncInProgress = false;
        return ghPush();
      }
    }
  } finally {
    ghSyncInProgress = false;
  }
}

// -------------------- Timestamp helper --------------------

function getMaxTimestamp(db) {
  let maxTs = 0;
  // Buscar timestamps en ventas
  if (db.ventas && db.ventas.length) {
    const ventaTs = db.ventas.map(v => new Date(v.fecha).getTime()).sort((a, b) => b - a)[0];
    maxTs = Math.max(maxTs, ventaTs);
  }
  // Buscar timestamps en movimientos
  if (db.movimientos && db.movimientos.length) {
    const movTs = db.movimientos.map(m => new Date(m.fecha).getTime()).sort((a, b) => b - a)[0];
    maxTs = Math.max(maxTs, movTs);
  }
  // Timestamp de última modificación global (si existe)
  if (db._lastModified) {
    maxTs = Math.max(maxTs, new Date(db._lastModified).getTime());
  }
  return maxTs;
}

// -------------------- Polling --------------------

function startGhPolling() {
  stopGhPolling();
  if (!getGhConfig()) return;

  ghPollTimer = setInterval(async () => {
    const updated = await ghPull();
    if (updated) {
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

    // Primero verificar que el token funciona con el repo
    const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}`;
    const res = await fetch(url, {
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

    // Intentar leer el archivo de datos
    const dataUrl = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${GH_DATA_PATH}${cfg.branch ? '?ref=' + cfg.branch : ''}`;
    const dataRes = await fetch(dataUrl, {
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
  const cfg = getGhConfig();
  if (!cfg) return false;

  // Intentar pull inicial (siempre)
  await ghPull();

  // SIEMPRE iniciar polling, sin importar si hubo update o no
  startGhPolling();
  return true;
}

// -------------------- Estado de sincronización UI --------------------

function getGhSyncStatus() {
  if (!getGhConfig()) return 'not_configured';
  if (ghPollTimer) return 'syncing';
  return 'configured';
}