// ===================== FIREBASE SYNC MODULE v1 =====================
// Sincronizacion en tiempo real via Firebase Realtime Database.
// Reemplaza completamente a github-sync.js.
// - Sin tokens, sin SHA, sin polling manual.
// - Los cambios se propagan instantaneamente entre dispositivos.
// - Soporte offline: Firebase encola writes y sincroniza al reconectarse.

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBvuJusx4_FvAdXhBl89VVlCicNb-yrdzo",
  authDomain: "arcano-6788d.firebaseapp.com",
  databaseURL: "https://arcano-6788d-default-rtdb.firebaseio.com",
  projectId: "arcano-6788d",
  storageBucket: "arcano-6788d.firebasestorage.app",
  messagingSenderId: "545294699567",
  appId: "1:545294699567:web:f354ae604a0034c6578ada"
};

const FB_DB_PATH = 'arcano/db';

let fbDbRef = null;
let fbInitialized = false;
let _lastPushHash = '';
let _fbConnectionState = false;

// -------------------- Init --------------------

function initFirebase() {
  if (fbInitialized) return;
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    fbDbRef = firebase.database().ref(FB_DB_PATH);
    fbInitialized = true;
    console.log('[Firebase] Inicializado');

    // Monitorear estado de conexion
    firebase.database().ref('.info/connected').on('value', function(snapshot) {
      _fbConnectionState = snapshot.val() === true;
      console.log('[Firebase] Conexion:', _fbConnectionState ? 'ONLINE' : 'OFFLINE');
      updateSyncUI(_fbConnectionState ? 'ok' : 'error', _fbConnectionState ? 'En linea' : 'Offline');
      renderSyncStatus();
    });
  } catch (e) {
    console.error('[Firebase] Error de inicializacion:', e.message);
  }
}

// -------------------- Real-time sync --------------------

function startFirebaseSync(onFirstData) {
  if (!fbInitialized) initFirebase();
  if (!fbDbRef) {
    if (onFirstData) onFirstData(null);
    return;
  }

  console.log('[Firebase] Iniciando sincronizacion en tiempo real...');

  fbDbRef.on('value', function(snapshot) {
    const data = snapshot.val();

    if (!data) {
      // No hay datos en Firebase
      console.log('[Firebase] Sin datos remotos');
      if (onFirstData) { onFirstData(null); onFirstData = null; }

      // Si hay datos locales, subirlos
      var localDB = getDB();
      if (localDB.especias && localDB.especias.length > 0) {
        console.log('[Firebase] Subiendo datos locales...');
        fbPush();
      }
      return;
    }

    // Limpiar campos internos que no vienen de Firebase
    if (data._ghConfig) delete data._ghConfig;
    if (data._lastModified) delete data._lastModified;

    // Saltar nuestro propio eco (lo que acabamos de escribir)
    var incomingHash = JSON.stringify(data);
    if (incomingHash === _lastPushHash) {
      _lastPushHash = '';
      return;
    }

    // Actualizar localStorage con datos de Firebase
    localStorage.setItem(DB_KEY, JSON.stringify(data));
    syncIdCounter(data);

    // Actualizar referencia del usuario actual
    if (typeof currentUser !== 'undefined' && currentUser) {
      var updatedUser = (data.usuarios || []).find(function(u) { return u.id === currentUser.id; });
      if (updatedUser) {
        currentUser = updatedUser;
        console.log('[Firebase] Usuario actualizado:', currentUser.nombre);
        if (typeof updateUserChip === 'function') updateUserChip();
      }
    }

    // Callback de primera carga
    if (onFirstData) {
      console.log('[Firebase] Datos iniciales recibidos');
      onFirstData(data);
      onFirstData = null;
    } else {
      // Actualizacion de otro dispositivo - refrescar UI
      console.log('[Firebase] Datos actualizados desde otro dispositivo');
      refreshCurrentPage();
    }
  });
}

// -------------------- Push --------------------

function fbPush() {
  if (!fbDbRef) return;
  var db = getDB();
  // Clonar profundo y limpiar campos internos
  var clean = JSON.parse(JSON.stringify(db));
  delete clean._ghConfig;
  delete clean._lastModified;
  delete clean._pendingPushSnapshot;

  // Pre-setear hash para ignorar nuestro propio eco
  _lastPushHash = JSON.stringify(clean);

  fbDbRef.set(clean)
    .then(function() {
      console.log('[Firebase] Push OK');
    })
    .catch(function(err) {
      console.error('[Firebase] Push error:', err);
      _lastPushHash = ''; // Resetear para reintentar
    });
}

// -------------------- Force reload --------------------

function fbForceReload() {
  if (!fbDbRef) return;
  _lastPushHash = ''; // Resetear para forzar procesamiento del listener
  fbDbRef.once('value').then(function(snapshot) {
    var data = snapshot.val();
    if (data) {
      if (data._ghConfig) delete data._ghConfig;
      if (data._lastModified) delete data._lastModified;
      localStorage.setItem(DB_KEY, JSON.stringify(data));
      syncIdCounter(data);
      refreshCurrentPage();
      toast('Datos sincronizados desde Firebase');
    } else {
      toast('No hay datos en Firebase');
    }
  }).catch(function(err) {
    toast('Error al sincronizar: ' + err.message, 'err');
  });
}

// -------------------- Status --------------------

function fbIsConnected() {
  return _fbConnectionState;
}

function renderSyncStatus() {
  var badge = document.getElementById('gh-status-badge');
  if (!badge) return;
  if (_fbConnectionState) {
    badge.className = 'badge bg';
    badge.textContent = 'Conectado';
  } else {
    badge.className = 'badge br';
    badge.textContent = 'Desconectado';
  }
}

// -------------------- Clear remote data --------------------

function fbClearRemote() {
  if (!fbDbRef) return;
  if (!confirm('Borrar todos los datos de Firebase? Los demas dispositivos perderan los datos.')) return;
  fbDbRef.set(null).then(function() {
    toast('Datos remotos borrados');
  }).catch(function(err) {
    toast('Error: ' + err.message, 'err');
  });
}