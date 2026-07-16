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

// Files to embed (relative to DEPLOY_DIR)
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

// Binary files to upload as-is
const BINARY_FILES = [
  'icons/favicon.png',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

function main() {
  console.log('=== Arcano Uploader Generator ===');
  console.log(`Owner: ${OWNER}  Repo: ${REPO}`);
  console.log(`Deploy dir: ${DEPLOY_DIR}`);
  console.log(`Output: ${OUTPUT}\n`);

  // Read all text files
  const filesObj = {};
  for (const rel of FILES_TO_EMBED) {
    const abs = path.join(DEPLOY_DIR, rel);
    if (!fs.existsSync(abs)) {
      console.error(`ERROR: File not found: ${abs}`);
      process.exit(1);
    }
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

  // JSON.stringify the files object, then escape </ to prevent HTML breakage
  const jsonStr = JSON.stringify(filesObj);
  const safeJson = jsonStr.replace(/<\//g, '<\\/');

  const binaryJson = JSON.stringify(binaryObj);
  const safeBinaryJson = binaryJson.replace(/<\//g, '<\\/');

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

    // 2. Get latest commit SHA
    var cr=await fetch('https://api.github.com/repos/'+owner+'/'+repo+'/git/refs/heads/'+branch,h);
    if(!cr.ok) throw new Error('No se pudo obtener ref del branch');
    var ci=await cr.json();
    var sha=ci.object.sha;
    log('SHA: '+sha.substring(0,8));

    // 3. Create blobs for each file, then build tree with SHAs
    var tree=[];
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

    log('Creando tree con '+tree.length+' archivos...');
    var tr=await fetch('https://api.github.com/repos/'+owner+'/'+repo+'/git/trees',{
      method:'POST',headers:h,body:JSON.stringify({base_tree:sha,tree:tree})
    });
    if(!tr.ok){var te=await tr.json();throw new Error('Tree error: '+(te.message||tr.status))}
    var td=await tr.json();
    log('Tree SHA: '+td.sha.substring(0,8),'log-ok');

    // 4. Create commit
    log('Creando commit...');
    var cc=await fetch('https://api.github.com/repos/'+owner+'/'+repo+'/git/commits',{
      method:'POST',headers:h,body:JSON.stringify({message:'Arcano v2 deploy',tree:td.sha,parents:[sha]})
    });
    if(!cc.ok) throw new Error('Commit error: '+cc.status);
    var cd=await cc.json();
    log('Commit: '+cd.sha.substring(0,8),'log-ok');

    // 5. Update ref
    log('Actualizando '+branch+'...');
    var ur=await fetch('https://api.github.com/repos/'+owner+'/'+repo+'/git/refs/heads/'+branch,{
      method:'PATCH',headers:h,body:JSON.stringify({sha:cd.sha})
    });
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
  if (dbContent.includes("const DB_KEY = 'arcano_v3'")) {
    console.log('Validation: DB_KEY = arcano_v3 OK');
  } else {
    console.error('ERROR: DB_KEY not found or wrong in db.js!');
  }

  // Validate Firebase config
  if (dbContent.includes('AIzaSyBvuJusx4_FvAdXhBl89VVlCicNb-yrdzo')) {
    console.log('Validation: Firebase API key present OK');
  }

  // Validate Firebase set() call
  if (dbContent.includes('ref.set(_db)')) {
    console.log('Validation: Firebase set() call present OK');
  }
}

main();