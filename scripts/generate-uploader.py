#!/usr/bin/env python3
"""Genera un HTML auto-contenido que sube todos los archivos de Arcano a GitHub via API."""

import json
import base64
import os

DEPLOY_DIR = '/home/z/my-project/arcano-deploy'
OUTPUT = '/home/z/my-project/download/arcano-uploader.html'

files = {}

with open(os.path.join(DEPLOY_DIR, 'index.html'), 'r', encoding='utf-8') as f:
    files['index.html'] = f.read()

with open(os.path.join(DEPLOY_DIR, 'css', 'style.css'), 'r', encoding='utf-8') as f:
    files['css/style.css'] = f.read()

with open(os.path.join(DEPLOY_DIR, 'js', 'db.js'), 'r', encoding='utf-8') as f:
    files['js/db.js'] = f.read()

with open(os.path.join(DEPLOY_DIR, 'js', 'github-sync.js'), 'r', encoding='utf-8') as f:
    files['js/github-sync.js'] = f.read()

with open(os.path.join(DEPLOY_DIR, 'js', 'modules1.js'), 'r', encoding='utf-8') as f:
    files['js/modules1.js'] = f.read()

with open(os.path.join(DEPLOY_DIR, 'js', 'modules2.js'), 'r', encoding='utf-8') as f:
    files['js/modules2.js'] = f.read()

with open(os.path.join(DEPLOY_DIR, 'manifest.json'), 'r', encoding='utf-8') as f:
    files['manifest.json'] = f.read()

for icon_name in ['icons/icon-192.png', 'icons/icon-512.png', 'icons/logo-header.png', 'icons/logo-pin.png', 'icons/favicon.png']:
    with open(os.path.join(DEPLOY_DIR, icon_name), 'rb') as f:
        files[icon_name] = base64.b64encode(f.read()).decode('ascii')

# Convert to base64 for embedding in JSON
files_b64 = {}
for path, content in files.items():
    if path.endswith('.png'):
        files_b64[path] = content
    else:
        files_b64[path] = base64.b64encode(content.encode('utf-8')).decode('ascii')

files_json_str = json.dumps(files_b64, ensure_ascii=False)

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
    <input id="inp-repo" value="arcano-app" placeholder="ej: mi-repo">
    <label>Branch</label>
    <input id="inp-branch" value="main" placeholder="main">
    <label>Personal Access Token (PAT)</label>
    <input id="inp-token" type="password" placeholder="ghp_xxxxxxxxxxxx">
    <p style="font-size:.75rem;color:#8b949e;margin-bottom:12px">Si no tenes un token: and&aacute; a GitHub &rarr; Settings &rarr; Developer settings &rarr; Personal access tokens &rarr; Generate new token (Classic). D&aacute;le permiso de <strong>repo</strong> (completo).</p>
    <button class="btn btn-go" id="btn-upload" onclick="startUpload()">Subir todo al repositorio</button>
    <div class="progress" id="progress-wrap" style="display:none">
      <div class="progress-bar" id="progress-bar"></div>
    </div>
  </div>

  <div class="card" id="steps-card" style="display:none">
    <div class="steps" id="steps"></div>
  </div>

  <div class="card" id="log-card" style="display:none">
    <label>Log de operaciones</label>
    <div class="log" id="log"></div>
  </div>

  <div class="card" id="done-card" style="display:none">
    <div style="text-align:center;padding:10px 0">
      <div style="font-size:2.5rem;margin-bottom:8px">&#9989;</div>
      <div style="font-size:1.1rem;font-weight:700;color:#3fb950">Todos los archivos subidos correctamente</div>
      <p style="color:#8b949e;margin-top:8px;font-size:.85rem">Tu app deberia estar disponible en segundos en:</p>
      <a id="app-url" href="#" target="_blank" style="color:#f0c040;font-size:.9rem;word-break:break-all"></a>
      <p style="color:#8b949e;margin-top:12px;font-size:.78rem">Abri la app en todos tus dispositivos. La primera vez carga sin cache viejo.</p>
    </div>
  </div>
</div>

<script>
var FILES = ''' + files_json_str + ''';

function addLog(msg, type) {
  var log = document.getElementById('log');
  var div = document.createElement('div');
  div.className = type || '';
  div.textContent = msg;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function updateStep(index, status) {
  var steps = document.querySelectorAll('.step');
  if (steps[index]) steps[index].className = 'step ' + status;
}

function setProgress(pct) {
  document.getElementById('progress-bar').style.width = pct + '%';
}

async function githubPut(owner, repo, path, contentB64, branch, token, sha) {
  var url = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + path;
  var body = { message: 'Arcano v13 - full theming + PWA config', content: contentB64, branch: branch };
  if (sha) body.sha = sha;
  var res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Arcano-Deploy'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    var err = await res.json().catch(function() { return {}; });
    throw new Error(err.message || 'Error HTTP ' + res.status);
  }
  return res.json();
}

async function githubGetSha(owner, repo, path, branch, token) {
  try {
    var url = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + path + '?ref=' + branch;
    var res = await fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Arcano-Deploy'
      }
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Error ' + res.status);
    var data = await res.json();
    return data.sha;
  } catch(e) { return null; }
}

async function startUpload() {
  var owner = document.getElementById('inp-owner').value.trim();
  var repo = document.getElementById('inp-repo').value.trim();
  var branch = document.getElementById('inp-branch').value.trim() || 'main';
  var token = document.getElementById('inp-token').value.trim();

  if (!owner || !repo || !token) { alert('Completar owner, repo y token'); return; }

  var btn = document.getElementById('btn-upload');
  btn.disabled = true;
  btn.textContent = 'Subiendo...';
  document.getElementById('progress-wrap').style.display = 'block';
  document.getElementById('steps-card').style.display = 'block';
  document.getElementById('log-card').style.display = 'block';
  document.getElementById('done-card').style.display = 'none';

  var filePaths = Object.keys(FILES);
  var stepsEl = document.getElementById('steps');
  stepsEl.innerHTML = filePaths.map(function(p) {
    return '<div class="step" id="step-' + p.replace(/[^a-z0-9]/gi,'-') + '"><div class="icon">-</div><span>' + p + '</span></div>';
  }).join('');

  addLog('Iniciando deploy a ' + owner + '/' + repo + ' (' + branch + ')', 'info');
  addLog('Archivos a subir: ' + filePaths.length, 'info');

  var ok = 0, fail = 0;

  for (var i = 0; i < filePaths.length; i++) {
    var filePath = filePaths[i];
    updateStep(i, 'active');
    setProgress(Math.round((i / filePaths.length) * 100));

    try {
      var sha = await githubGetSha(owner, repo, filePath, branch, token);
      if (sha) {
        addLog(filePath + ' existe (SHA:' + sha.slice(0,7) + '), actualizando...', 'info');
      } else {
        addLog(filePath + ' es nuevo, creando...', 'info');
      }
      await githubPut(owner, repo, filePath, FILES[filePath], branch, token, sha);
      addLog(filePath + ' - OK', 'ok');
      updateStep(i, 'done');
      ok++;
    } catch(e) {
      addLog(filePath + ' - ERROR: ' + e.message, 'err');
      updateStep(i, 'error');
      fail++;
    }

    if (i < filePaths.length - 1) {
      await new Promise(function(r) { setTimeout(r, 500); });
    }
  }

  setProgress(100);

  if (fail === 0) {
    addLog('DEPLOY COMPLETADO - ' + ok + '/' + filePaths.length + ' archivos OK', 'ok');
    document.getElementById('done-card').style.display = 'block';
    var appUrl = 'https://' + owner + '.github.io/' + repo + '/';
    document.getElementById('app-url').href = appUrl;
    document.getElementById('app-url').textContent = appUrl;
  } else {
    addLog('ERRORES: ' + ok + ' OK, ' + fail + ' fallaron', 'err');
  }

  btn.disabled = false;
  btn.textContent = fail === 0 ? 'Subido correctamente' : 'Reintentar';
}
</script>
</body>
</html>'''

with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write(html)

print(f'Generated: {OUTPUT}')
print(f'Files: {len(files)}')
for path in files:
    print(f'  {path}: {len(files_b64[path])} chars (b64)')