#!/usr/bin/env node
/* ===================== ARCANO UPLOADER GENERATOR =====================
   Reads all files from arcano-deploy/, embeds them as JSON,
   produces a single self-contained arcano-uploader.html that
   pushes to GitHub Pages via the GitHub API.

   CRITICAL: After JSON.stringify, escape </ to <\/ to prevent
   the browser from interpreting </script> inside embedded JSON.

   Owner: arcanoespecias  |  Repo: arcano-v2
   ===================== */

const fs = require('fs');
const path = require('path');

const DEPLOY_DIR = path.join(__dirname, '..', 'arcano-deploy');
const OUTPUT = path.join(__dirname, '..', 'download', 'arcano-uploader.html');
const OWNER = 'arcanoespecias';
const REPO = 'arcano-v2';

// Files to embed (relative to DEPLOY_DIR) — admin panel
const FILES_TO_EMBED = [
  'index.html',
  'css/style.css',
  'js/db.js',
  'js/pages.js',
  'js/core.js',
  'sw.js',
  'manifest.json',
  'version.json'
];

// Tienda files — read by Node and embedded as TIENDA_FILES in browser
const TIENDA_FILES_LIST = [
  'tienda.html',
  'css/tienda.css',
  'js/tienda-data.js',
  'js/tienda-ui.js'
];

// Extra files to upload (relative to DEPLOY_DIR)
const EXTRA_FILES_LIST = [
  'scripts/generate-recetas.js',
  '.github/workflows/recetas-semanales.yml'
];

// Binary files to upload as-is
const BINARY_FILES = [
  'icons/favicon.png',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

function escapeJson(jsonStr) {
  return jsonStr.replace(/<\//g, '<\\/');
}

function main() {
  console.log('=== Arcano Uploader Generator ===');
  console.log(`Owner: ${OWNER}  Repo: ${REPO}`);
  console.log(`Deploy dir: ${DEPLOY_DIR}`);
  console.log(`Output: ${OUTPUT}\n`);

  // Read admin files
  const filesObj = {};
  for (const rel of FILES_TO_EMBED) {
    const abs = path.join(DEPLOY_DIR, rel);
    if (!fs.existsSync(abs)) { console.error(`ERROR: File not found: ${abs}`); process.exit(1); }
    filesObj[rel] = fs.readFileSync(abs, 'utf8');
    console.log(`  Read: ${rel} (${filesObj[rel].length} chars)`);
  }

  // Read binary files as base64
  const binaryObj = {};
  for (const rel of BINARY_FILES) {
    const abs = path.join(DEPLOY_DIR, rel);
    if (fs.existsSync(abs)) {
      binaryObj[rel] = fs.readFileSync(abs).toString('base64');
      console.log(`  Read binary: ${rel}`);
    } else {
      console.warn(`  WARN: Binary file not found: ${rel} (skipping)`);
    }
  }

  // Read tienda files
  const tiendaObj = {};
  for (const rel of TIENDA_FILES_LIST) {
    const abs = path.join(DEPLOY_DIR, rel);
    if (fs.existsSync(abs)) {
      tiendaObj[rel] = fs.readFileSync(abs, 'utf8');
      console.log(`  Read tienda: ${rel} (${tiendaObj[rel].length} chars)`);
    } else {
      console.warn(`  WARN: Tienda file not found: ${rel} (skipping)`);
    }
  }

  // Read extra files
  const extraObj = {};
  for (const rel of EXTRA_FILES_LIST) {
    const abs = path.join(DEPLOY_DIR, rel);
    if (fs.existsSync(abs)) {
      extraObj[rel] = fs.readFileSync(abs, 'utf8');
      console.log(`  Read extra: ${rel} (${extraObj[rel].length} chars)`);
    } else {
      console.warn(`  WARN: Extra file not found: ${rel} (skipping)`);
    }
  }

  // Create safe JSON strings
  const safeJson = escapeJson(JSON.stringify(filesObj));
  const safeBinaryJson = escapeJson(JSON.stringify(binaryObj));
  const safeTiendaJson = escapeJson(JSON.stringify(tiendaObj));
  const safeExtraJson = escapeJson(JSON.stringify(extraObj));

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Arcano - Deploy to GitHub Pages</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#1b0b07;color:#ece0d0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#241209;border:1px solid #3a2218;border-radius:16px;padding:40px;max-width:520px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,.6)}
.logo{width:64px;height:64px;background:#e8b84b;color:#1b0b07;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:2rem}
h1{color:#e8b84b;font-size:1.4rem;margin:16px 0 4px;letter-spacing:.1em}
.sub{color:#9a8a78;font-size:.85rem;margin-bottom:24px}
label{display:block;font-size:.75rem;font-weight:600;color:#9a8a78;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;margin-top:12px}
input,select{width:100%;padding:10px 12px;border-radius:8px;border:1px solid #4a2c20;background:#1b0b07;color:#ece0d0;font-size:14px;margin-bottom:4px;outline:none}
input:focus,select:focus{border-color:#a07828}
button{width:100%;padding:12px;border-radius:8px;border:none;background:#e8b84b;color:#1b0b07;font-size:14px;font-weight:700;cursor:pointer;margin-top:16px}
button:hover{background:#c9963a}
button:disabled{opacity:.5;cursor:not-allowed}
#log{margin-top:16px;max-height:300px;overflow-y:auto;font-size:.78rem;color:#9a8a78;line-height:1.6;white-space:pre-wrap;word-break:break-all}
.log-ok{color:#27ae60}.log-err{color:#e74c3c}.log-info{color:#5dade2}
</style>
</head>
<body>
<div class="card">
  <div class="logo">A</div>
  <h1>ARCANO DEPLOY</h1>
  <p class="sub">Desplegar a GitHub Pages</p>

  <label>GitHub Token</label>
  <input type="password" id="token" placeholder="ghp_xxxx...">

  <label>Owner</label>
  <input type="text" id="owner" value="${OWNER}">

  <label>Repo</label>
  <input type="text" id="repo" value="${REPO}">

  <button id="deploy-btn" onclick="doDeploy()">Desplegar</button>
  <div id="log"></div>
</div>

<script>
var FILES = ${safeJson};
var BINARIES = ${safeBinaryJson};
var TIENDA_FILES = ${safeTiendaJson};
var EXTRA = ${safeExtraJson};

function log(m,c){var el=document.getElementById('log');el.innerHTML+='<div class="'+(c||'')+'">'+m+'</div>';el.scrollTop=el.scrollHeight}

async function doDeploy(){
  var btn=document.getElementById('deploy-btn');
  var token=document.getElementById('token').value.trim();
  var owner=document.getElementById('owner').value.trim();
  var repo=document.getElementById('repo').value.trim();
  if(!token){log('Token requerido','log-err');return}
  btn.disabled=true;btn.textContent='Desplegando...';log('Iniciando deploy...','log-info');

  try{
    var h={'Authorization':'Bearer '+token,'User-Agent':'Arcano','Content-Type':'application/json'};

    // 1. Get default branch
    var rr=await fetch('https://api.github.com/repos/'+owner+'/'+repo,h);
    if(!rr.ok) throw new Error('Repo no encontrado ('+rr.status+'). Verifica owner/repo y token.');
    var ri=await rr.json();
    var branch=ri.default_branch;
    log('Branch: '+branch);

    // 2. Get latest commit SHA and its tree SHA
    var cr=await fetch('https://api.github.com/repos/'+owner+'/'+repo+'/git/refs/heads/'+branch,h);
    var sha='';
    var treeSha='';
    if(cr.ok){
      var ci=await cr.json();
      sha=ci.object.sha;
      log('Commit SHA: '+sha.substring(0,8));
      // Fetch the commit to get the actual tree SHA
      var commitReq=await fetch('https://api.github.com/repos/'+owner+'/'+repo+'/git/commits/'+sha,h);
      if(commitReq.ok){
        var commitData=await commitReq.json();
        treeSha=commitData.tree.sha;
        log('Tree SHA: '+treeSha.substring(0,8));
      } else {
        log('No se pudo obtener tree SHA, se usara commit SHA como fallback','log-info');
        treeSha=sha;
      }
    } else {
      log('Branch vacio o sin commits, se creara tree desde cero','log-info');
    }

    // 3. Build tree entries from all file sources
    var tree=[];

    // Admin files
    var paths=Object.keys(FILES);
    for(var i=0;i<paths.length;i++){
      var p=paths[i];
      var content=btoa(unescape(encodeURIComponent(FILES[p])));
      var br=await fetch('https://api.github.com/repos/'+owner+'/'+repo+'/git/blobs',{
        method:'POST',headers:h,body:JSON.stringify({content:content,encoding:'base64'})
      });
      if(!br.ok){var be=await br.json();throw new Error('Blob error for '+p+': '+(be.message||br.status))}
      var bd=await br.json();
      tree.push({path:p,mode:'100644',type:'blob',sha:bd.sha});
      log('Blob: '+p+' ('+FILES[p].length+' chars) → '+bd.sha.substring(0,8),'log-info');
    }

    // Binary files
    var bpaths=Object.keys(BINARIES);
    for(var j=0;j<bpaths.length;j++){
      var bp=bpaths[j];
      var bbr=await fetch('https://api.github.com/repos/'+owner+'/'+repo+'/git/blobs',{
        method:'POST',headers:h,body:JSON.stringify({content:BINARIES[bp],encoding:'base64'})
      });
      if(!bbr.ok) throw new Error('Blob error for '+bp+': '+bbr.status);
      var bbd=await bbr.json();
      tree.push({path:bp,mode:'100644',type:'blob',sha:bbd.sha});
      log('Blob binario: '+bp+' → '+bbd.sha.substring(0,8),'log-info');
    }

    // Tienda files
    var tiendaPaths=Object.keys(TIENDA_FILES);
    for(var k=0;k<tiendaPaths.length;k++){
      var tp=tiendaPaths[k];
      var tb64=btoa(unescape(encodeURIComponent(TIENDA_FILES[tp])));
      var tbr=await fetch('https://api.github.com/repos/'+owner+'/'+repo+'/git/blobs',{
        method:'POST',headers:h,body:JSON.stringify({content:tb64,encoding:'base64'})
      });
      if(!tbr.ok) throw new Error('Blob error for tienda '+tp+': '+tbr.status);
      var tbd=await tbr.json();
      tree.push({path:tp,mode:'100644',type:'blob',sha:tbd.sha});
      log('Blob tienda: '+tp+' → '+tbd.sha.substring(0,8),'log-info');
    }

    // Extra files (scripts, workflows)
    var extraPaths=Object.keys(EXTRA);
    for(var x=0;x<extraPaths.length;x++){
      var xp=extraPaths[x];
      var xb64=btoa(unescape(encodeURIComponent(EXTRA[xp])));
      var xbr=await fetch('https://api.github.com/repos/'+owner+'/'+repo+'/git/blobs',{
        method:'POST',headers:h,body:JSON.stringify({content:xb64,encoding:'base64'})
      });
      if(!xbr.ok) throw new Error('Blob error for extra '+xp+': '+xbr.status);
      var xbd=await xbr.json();
      tree.push({path:xp,mode:'100644',type:'blob',sha:xbd.sha});
      log('Blob extra: '+xp+' → '+xbd.sha.substring(0,8),'log-info');
    }

    // 4. Create tree (use treeSha as base_tree, fallback without it if repo is empty)
    log('Creando tree con '+tree.length+' archivos...');
    var treePayload={tree:tree};
    if(treeSha) treePayload.base_tree=treeSha;
    var tr=await fetch('https://api.github.com/repos/'+owner+'/'+repo+'/git/trees',{
      method:'POST',headers:h,body:JSON.stringify(treePayload)
    });
    if(!tr.ok){var te=await tr.json();throw new Error('Tree error: '+(te.message||JSON.stringify(te))+' (status: '+tr.status+')')}
    var td=await tr.json();
    log('Tree SHA: '+td.sha.substring(0,8),'log-ok');

    // 5. Create commit
    log('Creando commit...');
    var commitPayload={message:'Arcano v3 deploy - sidebar recetas + redes sociales',tree:td.sha};
    if(sha) commitPayload.parents=[sha];
    var cc=await fetch('https://api.github.com/repos/'+owner+'/'+repo+'/git/commits',{
      method:'POST',headers:h,body:JSON.stringify(commitPayload)
    });
    if(!cc.ok){var ce=await cc.json();throw new Error('Commit error: '+(ce.message||cc.status))}
    var cd=await cc.json();
    log('Commit: '+cd.sha.substring(0,8),'log-ok');

    // 6. Update or create ref
    log('Actualizando '+branch+'...');
    var refUrl='https://api.github.com/repos/'+owner+'/'+repo+'/git/refs/heads/'+branch;
    var ur=await fetch(refUrl,{method:'PATCH',headers:h,body:JSON.stringify({sha:cd.sha})});
    if(!ur.ok){
      // If PATCH fails (404), try creating the ref (first commit)
      log('PATCH fallo ('+ur.status+'), intentando crear ref...','log-info');
      ur=await fetch(refUrl,{method:'POST',headers:h,body:JSON.stringify({ref:'refs/heads/'+branch,sha:cd.sha})});
    }
    if(!ur.ok) throw new Error('Ref update error: '+ur.status);
    log('DEPLOY EXITOSO','log-ok');
    log('https://'+owner+'.github.io/'+repo+'/','log-ok');

  }catch(e){
    log('ERROR: '+e.message,'log-err');
  }finally{
    btn.disabled=false;btn.textContent='Desplegar';
  }
}
<\/script>
</body>
</html>`;

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, html, 'utf8');
  console.log(`\n=== Generated: ${OUTPUT} ===`);
  console.log(`Size: ${(html.length / 1024).toFixed(1)} KB`);

  // Validate: check no unescaped </script> in the output
  const content = fs.readFileSync(OUTPUT, 'utf8');
  const badMatches = content.match(/<\/script>/g);
  if (badMatches && badMatches.length > 1) {
    console.error('\n!!! WARNING: Found unescaped </script> tags in output!');
    console.error('    Expected exactly 1 closing </script> tag.');
  } else {
    console.log('Validation: </script> escape check PASSED');
  }

  // Validate DB_KEY consistency
  const dbContent = filesObj['js/db.js'];
  if (dbContent && dbContent.includes("const DB_KEY = 'arcano_v3'")) {
    console.log('Validation: DB_KEY = arcano_v3 OK');
  } else {
    console.error('ERROR: DB_KEY not found or wrong in db.js!');
  }

  // Validate Firebase config in tienda-data.js
  const tiendaData = tiendaObj['js/tienda-data.js'];
  if (tiendaData && tiendaData.includes('AIzaSyBvuJusx4_FvAdXhBl89VVlCicNb-yrdzo')) {
    console.log('Validation: Firebase config in tienda-data.js OK');
  } else {
    console.error('ERROR: Firebase config missing in tienda-data.js!');
  }

  // Validate tienda-ui.js has sidebar functions
  const tiendaUI = tiendaObj['js/tienda-ui.js'];
  if (tiendaUI && tiendaUI.includes('toggleSidebar') && tiendaUI.includes('renderRecetas') && tiendaUI.includes('renderSocialLinks')) {
    console.log('Validation: Sidebar functions in tienda-ui.js OK');
  } else {
    console.error('ERROR: Missing sidebar functions in tienda-ui.js!');
  }

  // Validate extra files
  if (extraObj['scripts/generate-recetas.js']) {
    console.log('Validation: generate-recetas.js present OK');
  }
  if (extraObj['.github/workflows/recetas-semanales.yml']) {
    console.log('Validation: recetas-semanales.yml present OK');
  }
}

main();
