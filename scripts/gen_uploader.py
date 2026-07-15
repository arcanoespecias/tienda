#!/usr/bin/env python3
"""Regenerate arcano-uploader.html with current deploy files."""
import base64
import os
import json

DEPLOY_DIR = '/home/z/my-project/arcano-deploy'
OUTPUT = '/home/z/my-project/download/arcano-uploader.html'

# Files to embed (relative to deploy dir, using forward slashes for GitHub)
TEXT_FILES = [
    'index.html',
    'css/style.css',
    'js/db.js',
    'js/firebase-sync.js',
    'js/core.js',
    'js/pages.js',
    'sw.js',
    'manifest.json',
    'version.json',
    '_headers',
]

BINARY_FILES = [
    'icons/favicon.png',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/logo-header.png',
    'icons/logo-pin.png',
]

def read_b64(path):
    with open(path, 'rb') as f:
        return base64.b64encode(f.read()).decode('ascii')

# Build FILES map
files_map = {}
for rel in TEXT_FILES + BINARY_FILES:
    full = os.path.join(DEPLOY_DIR, rel)
    if os.path.exists(full):
        files_map[rel] = read_b64(full)
        print(f"  Embedded: {rel} ({len(files_map[rel])} chars)")
    else:
        print(f"  MISSING:  {rel}")

files_json = json.dumps(files_map, separators=(',', ':'))

html = '''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Arcano - Subir a GitHub</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0d1117;color:#c9d1d9;min-height:100vh;padding:20px}
.container{max-width:600px;margin:0 auto}
h1{color:#f0c040;font-size:1.5rem;margin-bottom:6px}
.sub{color:#8b949e;font-size:.85rem;margin-bottom:24px}
.card{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:20px;margin-bottom:16px}
label{display:block;font-size:.75rem;font-weight:700;color:#8b949e;text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px}
input{width:100%;background:#0d1117;border:1px solid #30363d;border-radius:8px;color:#c9d1d9;font-size:.9rem;padding:10px 12px;outline:none;margin-bottom:12px}
input:focus{border-color:#f0c040}
.btn{width:100%;border:none;border-radius:8px;font-size:1rem;font-weight:700;padding:14px;cursor:pointer;transition:opacity .2s}
.btn:hover{opacity:.9}
.btn-go{background:linear-gradient(135deg,#c9963a,#e8b84b);color:#1a0e00}
.btn-go:disabled{opacity:.4;cursor:not-allowed}
.log{background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:12px;font-family:'SF Mono',Monaco,monospace;font-size:.78rem;max-height:300px;overflow-y:auto;margin-top:12px}
.log div{padding:3px 0;border-bottom:1px solid #21262d}
.log .ok{color:#3fb950}
.log .err{color:#f85149}
.log .info{color:#58a6ff}
.progress{background:#21262d;border-radius:8px;height:8px;margin-top:12px;overflow:hidden}
.progress-bar{height:100%;background:linear-gradient(90deg,#c9963a,#e8b84b);border-radius:8px;transition:width .3s;width:0%}
.steps{margin-top:16px}
.step{display:flex;align-items:center;gap:10px;padding:8px 0;font-size:.85rem;color:#8b949e}
.step .icon{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.7rem;background:#21262d;flex-shrink:0}
.step.done .icon{background:#238636;color:#fff}
.step.active .icon{background:#f0c040;color:#1a0e00}
.step.error .icon{background:#da3633;color:#fff}
.step.done{color:#3fb950}
.step.error{color:#f85149}
</style>
</head>
<body>
<div class="container">
  <h1>Arcano - Deploy a GitHub</h1>
  <p class="sub">Sube todos los archivos de la app directamente a tu repositorio usando la API de GitHub.</p>

  <div class="card">
    <label>Owner / Usuario de GitHub</label>
    <input id="inp-owner" value="arcanoespecias" placeholder="ej: mi-usuario">
    <label>Repositorio</label>
    <input id="inp-repo" value="arcano-v2" placeholder="ej: mi-repo">
    <label>Branch</label>
    <input id="inp-branch" value="main" placeholder="main">
    <label>Personal Access Token (PAT)</label>
    <input id="inp-token" type="password" placeholder="ghp_xxxxxxxxxxxx">
    <button class="btn btn-go" id="btn-go" onclick="deploy()">Subir a GitHub Pages</button>
    <div class="progress"><div class="progress-bar" id="pbar"></div></div>
    <div class="log" id="log"></div>
  </div>

  <div class="steps" id="steps"></div>
</div>

<script>
var FILES = ''' + files_json + ''';

function log(msg, cls) {
  var el = document.getElementById('log');
  var d = document.createElement('div');
  if (cls) d.className = cls;
  d.textContent = msg;
  el.appendChild(d);
  el.scrollTop = el.scrollHeight;
}

function setStep(i, cls, text) {
  var el = document.getElementById('steps');
  if (!el.children[i]) {
    var s = document.createElement('div');
    s.className = 'step';
    s.innerHTML = '<span class="icon"></span><span></span>';
    el.appendChild(s);
  }
  var s = el.children[i];
  s.className = 'step ' + (cls || '');
  s.querySelector('.icon').textContent = cls === 'done' ? '\\u2713' : cls === 'error' ? '!' : (i + 1);
  s.querySelector('span').textContent = text || '';
}

async function deploy() {
  var btn = document.getElementById('btn-go');
  var owner = document.getElementById('inp-owner').value.trim();
  var repo = document.getElementById('inp-repo').value.trim();
  var branch = document.getElementById('inp-branch').value.trim() || 'main';
  var token = document.getElementById('inp-token').value.trim();
  if (!owner || !repo || !token) { alert('Completa todos los campos'); return; }

  btn.disabled = true;
  btn.textContent = 'Subiendo...';
  document.getElementById('log').innerHTML = '';
  document.getElementById('steps').innerHTML = '';
  document.getElementById('pbar').style.width = '0%';

  var files = Object.keys(FILES);
  var total = files.length;
  var done = 0;

  try {
    // Get current commit SHA
    setStep(0, 'active', 'Obteniendo commit actual...');
    var refRes = await fetch('https://api.github.com/repos/' + owner + '/' + repo + '/git/ref/heads/' + branch, {
      headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json' }
    });
    if (!refRes.ok) {
      var refErr = await refRes.json().catch(function() { return {}; });
      throw new Error('No se pudo obtener la ref: ' + (refErr.message || refRes.status));
    }
    var refData = await refRes.json();
    var sha = refData.object.sha;
    log('Base commit: ' + sha.substring(0, 7), 'info');
    setStep(0, 'done', 'Commit base obtenido');

    // Create blobs and tree
    setStep(1, 'active', 'Creando blobs...');
    var treeItems = [];
    for (var i = 0; i < files.length; i++) {
      var path = files[i];
      var content = FILES[path];
      var blobRes = await fetch('https://api.github.com/repos/' + owner + '/' + repo + '/git/blobs', {
        method: 'POST',
        headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content, encoding: 'base64' })
      });
      if (!blobRes.ok) {
        var blobErr = await blobRes.json().catch(function() { return {}; });
        throw new Error('Error en blob ' + path + ': ' + (blobErr.message || blobRes.status));
      }
      var blobData = await blobRes.json();
      treeItems.push({ path: path, mode: '100644', type: 'blob', sha: blobData.sha });
      done++;
      document.getElementById('pbar').style.width = Math.round(done / total * 70) + '%';
      log('Blob OK: ' + path, 'ok');
    }
    setStep(1, 'done', files.length + ' blobs creados');

    // Create tree
    setStep(2, 'active', 'Creando arbol...');
    var treeRes = await fetch('https://api.github.com/repos/' + owner + '/' + repo + '/git/trees', {
      method: 'POST',
      headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ base_tree: sha, tree: treeItems })
    });
    if (!treeRes.ok) throw new Error('Error creando arbol: ' + treeRes.status);
    var treeData = await treeRes.json();
    log('Tree SHA: ' + treeData.sha.substring(0, 7), 'info');
    document.getElementById('pbar').style.width = '80%';
    setStep(2, 'done', 'Arbol creado');

    // Create commit
    setStep(3, 'active', 'Creando commit...');
    var commitRes = await fetch('https://api.github.com/repos/' + owner + '/' + repo + '/git/commits', {
      method: 'POST',
      headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'deploy: Arcano ERP v5', tree: treeData.sha, parents: [sha] })
    });
    if (!commitRes.ok) throw new Error('Error creando commit: ' + commitRes.status);
    var commitData = await commitRes.json();
    log('Commit: ' + commitData.sha.substring(0, 7), 'ok');
    document.getElementById('pbar').style.width = '90%';
    setStep(3, 'done', 'Commit creado');

    // Update ref
    setStep(4, 'active', 'Actualizando branch...');
    var updateRes = await fetch('https://api.github.com/repos/' + owner + '/' + repo + '/git/refs/heads/' + branch, {
      method: 'PATCH',
      headers: { 'Authorization': 'token ' + token, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ sha: commitData.sha })
    });
    if (!updateRes.ok) throw new Error('Error actualizando ref: ' + updateRes.status);
    document.getElementById('pbar').style.width = '100%';
    setStep(4, 'done', 'Branch actualizado');
    log('DEPLOY COMPLETADO - ' + total + ' archivos subidos', 'ok');

  } catch(e) {
    log('ERROR: ' + e.message, 'err');
    // Mark remaining steps as error
    for (var j = 0; j < 5; j++) {
      var stepEl = document.getElementById('steps').children[j];
      if (stepEl && !stepEl.classList.contains('done')) {
        stepEl.className = 'step error';
        if (!stepEl.querySelector('span').textContent) {
          stepEl.querySelector('span').textContent = 'Error';
        }
      }
    }
  }

  btn.disabled = false;
  btn.textContent = 'Subir a GitHub Pages';
}
</script>
</body>
</html>'''

with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write(html)

print(f"\nUploader written to {OUTPUT} ({len(html)} chars)")