#!/usr/bin/env node
/* ===================== ARCANO — SEED STOCKS 99999 =====================
   Poblar todos los productos, stock e insumos con 99999 unidades.
   Usa Firebase REST API (no necesita SDK).
   ===================== */

const https = require('https');
const FB_BASE = 'https://arcano-6788d-default-rtdb.firebaseio.com';
const DB_PATH = 'arcano/db';
const QTY = 99999;

function fbGet(path) {
  return new Promise(function(resolve, reject) {
    var url = FB_BASE + '/' + path + '.json';
    https.get(url, function(res) {
      var data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error for ' + path + ': ' + data.slice(0, 200))); }
      });
    }).on('error', reject);
  });
}

function fbPatch(path, payload) {
  return new Promise(function(resolve, reject) {
    var url = FB_BASE + '/' + path + '.json';
    var body = JSON.stringify(payload);
    var opts = {
      hostname: 'arcano-6788d-default-rtdb.firebaseio.com',
      path: '/' + path + '.json',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    var req = https.request(opts, function(res) {
      var data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve(data); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('=== ARCANO SEED STOCKS 99999 ===');
  console.log('Leyendo base de datos actual...');
  
  var db = await fbGet(DB_PATH);
  if (!db || !db.meta) {
    console.error('ERROR: No se pudo leer la base de datos o no tiene meta.');
    process.exit(1);
  }
  
  var updates = {};
  var count = { especias: 0, blends: 0, stickers: 0, envases: 0, bolsas: 0 };
  
  // 1. ESPECIAS: stockBolsa, stockChico, stockGrande
  if (db.especias) {
    var espKeys = Object.keys(db.especias);
    for (var i = 0; i < espKeys.length; i++) {
      var e = db.especias[espKeys[i]];
      if (!e || typeof e !== 'object') continue;
      updates['especias/' + espKeys[i] + '/stockBolsa'] = QTY;
      updates['especias/' + espKeys[i] + '/stockChico'] = QTY;
      updates['especias/' + espKeys[i] + '/stockGrande'] = QTY;
      count.especias++;
    }
  }
  
  // 2. BLENDS: stockChico, stockGrande
  if (db.blends) {
    var blKeys = Object.keys(db.blends);
    for (var i = 0; i < blKeys.length; i++) {
      var b = db.blends[blKeys[i]];
      if (!b || typeof b !== 'object') continue;
      updates['blends/' + blKeys[i] + '/stockChico'] = QTY;
      updates['blends/' + blKeys[i] + '/stockGrande'] = QTY;
      count.blends++;
    }
  }
  
  // 3. STICKERS: stockChico, stockGrande por cada sticker
  if (db.stickers) {
    var stkKeys = Object.keys(db.stickers);
    for (var i = 0; i < stkKeys.length; i++) {
      var s = db.stickers[stkKeys[i]];
      if (!s || typeof s !== 'object') continue;
      updates['stickers/' + stkKeys[i] + '/stockChico'] = QTY;
      updates['stickers/' + stkKeys[i] + '/stockGrande'] = QTY;
      count.stickers++;
    }
  }
  
  // 4. ENVASES globales: chico y grande
  updates['stockEnvases/chico'] = QTY;
  updates['stockEnvases/grande'] = QTY;
  count.envases = 1;
  
  // 5. BOLSAS globales: chico y grande
  updates['stockBolsas/chico'] = QTY;
  updates['stockBolsas/grande'] = QTY;
  count.bolsas = 1;
  
  var totalUpdates = Object.keys(updates).length;
  console.log('');
  console.log('Resumen de actualizaciones:');
  console.log('  - Especias (stockBolsa + stockChico + stockGrande): ' + count.especias + ' productos');
  console.log('  - Blends (stockChico + stockGrande): ' + count.blends + ' productos');
  console.log('  - Stickers (stockChico + stockGrande): ' + count.stickers + ' productos');
  console.log('  - Envases (chico + grande): global');
  console.log('  - Bolsas (chico + grande): global');
  console.log('  - Total de campos a actualizar: ' + totalUpdates);
  console.log('');
  console.log('Enviando actualizacion a Firebase...');
  
  try {
    var result = await fbPatch(DB_PATH, updates);
    console.log('EXITO: Todos los stocks actualizados a ' + QTY + '.');
    console.log('');
    console.log('Verificacion - leyendo datos actualizados...');
    
    // Verify a few values
    var verify = await fbGet(DB_PATH + '/stockEnvases');
    console.log('  stockEnvases: ' + JSON.stringify(verify));
    verify = await fbGet(DB_PATH + '/stockBolsas');
    console.log('  stockBolsas: ' + JSON.stringify(verify));
    
    if (db.especias) {
      var firstKey = Object.keys(db.especias)[0];
      if (firstKey) {
        verify = await fbGet(DB_PATH + '/especias/' + firstKey);
        console.log('  Ejemplo especia (' + (verify ? verify.nombre : '?') + '): stockBolsa=' + (verify ? verify.stockBolsa : '?') + ', stockChico=' + (verify ? verify.stockChico : '?') + ', stockGrande=' + (verify ? verify.stockGrande : '?'));
      }
    }
    if (db.blends) {
      var firstBlKey = Object.keys(db.blends)[0];
      if (firstBlKey) {
        verify = await fbGet(DB_PATH + '/blends/' + firstBlKey);
        console.log('  Ejemplo blend (' + (verify ? verify.nombre : '?') + '): stockChico=' + (verify ? verify.stockChico : '?') + ', stockGrande=' + (verify ? verify.stockGrande : '?'));
      }
    }
    
    console.log('');
    console.log('=== LISTO === Puedes testear la plataforma con stock completo.');
  } catch (err) {
    console.error('ERROR al actualizar:', err.message);
    process.exit(1);
  }
}

main();
