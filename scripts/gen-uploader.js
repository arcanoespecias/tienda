// Generator for arcano-uploader.html
// Escapes </ in JSON output AFTER stringify to prevent HTML </script> closing
var fs = require('fs');
var path = require('path');

var DEPLOY_DIR = '/home/z/my-project/arcano-deploy';
var OUTPUT = '/home/z/my-project/download/arcano-uploader.html';

var BINARY_EXT = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'];

function getAllFiles(dir, base) {
  base = base || '';
  var results = [];
  fs.readdirSync(dir).forEach(function(item) {
    var full = path.join(dir, item);
    var rel = base ? base + '/' + item : item;
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(getAllFiles(full, rel));
    } else {
      results.push({ path: rel, full: full });
    }
  });
  return results;
}

var files = getAllFiles(DEPLOY_DIR);
var filesObj = {};

files.forEach(function(f) {
  var ext = path.extname(f.path).toLowerCase();
  if (BINARY_EXT.indexOf(ext) >= 0) {
    var buf = fs.readFileSync(f.full);
    filesObj[f.path] = 'data:' + (ext === '.svg' ? 'image/svg+xml' : 'image/png') + ';base64,' + buf.toString('base64');
  } else {
    filesObj[f.path] = fs.readFileSync(f.full, 'utf8');
  }
});

// JSON.stringify produces valid JS. Then escape </ to <\/ in the OUTPUT
// so HTML parser doesn't see </script> inside <script> tag.
// JS engine treats \/ same as /, so runtime value is unchanged.
var filesJson = JSON.stringify(filesObj);
filesJson = filesJson.replace(/<\//g, '<\\/');
// Also escape </ in base64 data URIs just in case (unlikely but safe)
// No need - base64 won't contain <

var css = [
  '*{box-sizing:border-box;margin:0;padding:0}',
  'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0d1117;color:#c9d1d9;min-height:100vh;padding:20px}',
  '.container{max-width:600px;margin:0 auto}',
  'h1{color:#f0c040;font-size:1.5rem;margin-bottom:6px}',
  '.sub{color:#8b949e;font-size:.85rem;margin-bottom:24px}',
  '.card{background:#161b22;border:1px solid #30363d;border-radius:12px;padding:20px;margin-bottom:16px}',
  'label{display:block;font-size:.75rem;font-weight:700;color:#8b949e;text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px}',
  'input{width:100%;background:#0d1117;border:1px solid #30363d;border-radius:8px;color:#c9d1d9;font-size:.9rem;padding:10px 12px;outline:none;margin-bottom:12px}',
  'input:focus{border-color:#f0c040}',
  '.btn{width:100%;border:none;border-radius:8px;font-size:1rem;font-weight:700;padding:14px;cursor:pointer;transition:opacity .2s}',
  '.btn:hover{opacity:.9}',
  '.btn-go{background:linear-gradient(135deg,#c9963a,#e8b84b);color:#1a0e00}',
  '.btn-go:disabled{opacity:.4;cursor:not-allowed}',
  '.log{background:#0d1117;border:1px solid #30363d;border-radius:8px;padding:12px;font-family:"SF Mono",Monaco,monospace;font-size:.78rem;max-height:300px;overflow-y:auto;margin-top:12px}',
  '.log div{padding:3px 0;border-bottom:1px solid #21262d}',
  '.log .ok{color:#3fb950}',
  '.log .err{color:#f85149}',
  '.log .info{color:#58a6ff}',
  '.progress{background:#21262d;border-radius:8px;height:8px;margin-top:12px;overflow:hidden}',
  '.progress-bar{height:100%;background:linear-gradient(90deg,#c9963a,#e8b84b);border-radius:8px;transition:width .3s;width:0%}'
].join('\n');

var deployFn = [
  'function log(m,c){var e=document.getElementById("log");var d=document.createElement("div");d.textContent=m;d.className=c||"";e.appendChild(d);e.scrollTop=e.scrollHeight}',
  'function setPct(p){document.getElementById("pfill").style.width=p+"%"}',
  'async function deploy(){',
  '  var token=document.getElementById("token").value.trim();',
  '  var owner=document.getElementById("owner").value.trim();',
  '  var repo=document.getElementById("repo").value.trim();',
  '  var branch=document.getElementById("branch").value.trim()||"main";',
  '  if(!token||!owner||!repo){log("Completa todos los campos","err");return}',
  '  var btn=document.getElementById("go");btn.disabled=true;btn.textContent="Deploying...";',
  '  var logEl=document.getElementById("log");logEl.innerHTML="";',
  '  try{',
  '    log("Obteniendo ref...","info");',
  '    var r=await fetch("https://api.github.com/repos/"+owner+"/"+repo+"/git/ref/heads/"+branch,{headers:{Authorization:"Bearer "+token,"User-Agent":"Arcano"}});',
  '    if(!r.ok)throw new Error("Ref error: "+r.status);',
  '    var refData=await r.json();',
  '    var sha=refData.object.sha;',
  '    log("SHA actual: "+sha.substr(0,7),"ok");',
  '    log("Creando blobs...","info");',
  '    var paths=Object.keys(FILES);',
  '    var blobs={};',
  '    for(var i=0;i<paths.length;i++){',
  '      var p=paths[i];',
  '      var content=FILES[p];',
  '      var isBin=content.indexOf("data:")===0;',
  '      var body=isBin?{content:content.split(",")[1],encoding:"base64"}:{content:content,encoding:"utf-8"};',
  '      var br=await fetch("https://api.github.com/repos/"+owner+"/"+repo+"/git/blobs",{method:"POST",headers:{Authorization:"Bearer "+token,"User-Agent":"Arcano","Content-Type":"application/json"},body:JSON.stringify(body)});',
  '      if(!br.ok)throw new Error("Blob error "+p+": "+br.status);',
  '      var bd=await br.json();',
  '      blobs[p]=bd.sha;',
  '      setPct(Math.round((i+1)/paths.length*60));',
  '    }',
  '    log("Blobs creados: "+paths.length,"ok");',
  '    log("Creando tree...","info");',
  '    var tree=paths.map(function(p){return{path:p,mode:"100644",type:"blob",sha:blobs[p]}});',
  '    var tr=await fetch("https://api.github.com/repos/"+owner+"/"+repo+"/git/trees",{method:"POST",headers:{Authorization:"Bearer "+token,"User-Agent":"Arcano","Content-Type":"application/json"},body:JSON.stringify({base_tree:sha,tree:tree})});',
  '    if(!tr.ok)throw new Error("Tree error: "+tr.status);',
  '    var td=await tr.json();',
  '    log("Tree creado: "+td.sha.substr(0,7),"ok");',
  '    setPct(80);',
  '    log("Creando commit...","info");',
  '    var cr=await fetch("https://api.github.com/repos/"+owner+"/"+repo+"/git/commits",{method:"POST",headers:{Authorization:"Bearer "+token,"User-Agent":"Arcano","Content-Type":"application/json"},body:JSON.stringify({message:"Arcano v7-dbkey-save-fix",tree:td.sha,parents:[sha]})});',
  '    if(!cr.ok)throw new Error("Commit error: "+cr.status);',
  '    var cd=await cr.json();',
  '    log("Commit: "+cd.sha.substr(0,7),"ok");',
  '    setPct(90);',
  '    log("Actualizando ref...","info");',
  '    var ur=await fetch("https://api.github.com/repos/"+owner+"/"+repo+"/git/refs/heads/"+branch,{method:"PATCH",headers:{Authorization:"Bearer "+token,"User-Agent":"Arcano","Content-Type":"application/json"},body:JSON.stringify({sha:cd.sha})});',
  '    if(!ur.ok)throw new Error("Ref update error: "+ur.status);',
  '    setPct(100);',
  '    log("DEPLOY COMPLETADO","ok");',
  '    btn.textContent="Done!";',
  '  }catch(e){log("ERROR: "+e.message,"err");btn.disabled=false;btn.textContent="Reintentar"}',
  '}'
].join('\n');

// Build output: HTML shell + script with FILES + deploy function
var html = '<!DOCTYPE html>\n<html lang="es">\n<head>\n' +
  '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
  '<title>Arcano - Subir a GitHub</title>\n' +
  '<style>\n' + css + '\n</style>\n</head>\n<body>\n' +
  '<div class="container">\n' +
  '<h1>Arcano Deploy</h1>\n' +
  '<p class="sub">v7-dbkey-save-fix</p>\n' +
  '<div class="card">\n' +
  '<label>Token de GitHub</label>\n' +
  '<input type="password" id="token" placeholder="ghp_xxxx...">\n' +
  '<label>Owner</label>\n' +
  '<input type="text" id="owner" placeholder="tu-usuario">\n' +
  '<label>Repo</label>\n' +
  '<input type="text" id="repo" placeholder="arcano">\n' +
  '<label>Rama (branch)</label>\n' +
  '<input type="text" id="branch" value="main">\n' +
  '<button class="btn btn-go" id="go" onclick="deploy()">Deploy</button>\n' +
  '<div class="progress" id="pbar"><div class="progress-bar" id="pfill"></div></div>\n' +
  '<div class="log" id="log"></div>\n' +
  '</div>\n</div>\n' +
  '<script>\nvar FILES = ' + filesJson + ';\n' + deployFn + '\n</script>\n</body>\n</html>';

fs.writeFileSync(OUTPUT, html, 'utf8');
var sizeKB = (html.length / 1024).toFixed(0);
console.log('Generated ' + OUTPUT + ' (' + sizeKB + ' KB, ' + files.length + ' files)');

// ===== VALIDATION =====
var errors = [];

// 1. Check no raw </script> or </style> inside the script section
var scriptStart = html.indexOf('<script>') + 8;
var scriptEnd = html.lastIndexOf('</script>');
var scriptSection = html.substring(scriptStart, scriptEnd);
if (/<\/script/i.test(scriptSection)) {
  errors.push('Found raw </script> inside script section!');
}
if (/<\/style/i.test(scriptSection)) {
  errors.push('Found raw </style> inside script section!');
}

// 2. Verify JSON is parseable (unescape our <\/ back to </ first for validation)
var filesStart = scriptSection.indexOf('var FILES = ') + 12;
var depth = 0, endIdx = -1;
for (var i = filesStart; i < scriptSection.length; i++) {
  if (scriptSection[i] === '{') depth++;
  if (scriptSection[i] === '}') depth--;
  if (depth === 0 && scriptSection[i] === '}') { endIdx = i + 1; break; }
}
var filesStr = scriptSection.substring(filesStart, endIdx);
// Unescape our <\/ back to </ for JSON validation
var unescaped = filesStr.replace(/<\\\//g, '</');
try {
  var parsed = JSON.parse(unescaped);
  if (Object.keys(parsed).length !== files.length) {
    errors.push('File count mismatch: expected ' + files.length + ', got ' + Object.keys(parsed).length);
  }
  // Verify index.html has real </script> tags (not escaped ones)
  var idxContent = parsed['index.html'] || '';
  var scriptTags = idxContent.match(/<\/script>/g) || [];
  if (scriptTags.length < 5) {
    errors.push('index.html seems corrupted - only ' + scriptTags.length + ' </script> tags found (expected ~7)');
  }
  console.log('JSON validation OK: ' + Object.keys(parsed).length + ' files, index.html has ' + scriptTags.length + ' script tags');
} catch(e) {
  errors.push('JSON parse error: ' + e.message);
}

// 3. Check db.js has correct DB_KEY
try {
  var dbContent = JSON.parse(unescaped)['js/db.js'] || '';
  if (dbContent.indexOf('arcano_db_v3') < 0) {
    errors.push('js/db.js missing arcano_db_v3!');
  }
  if (dbContent.indexOf('_dbCached') < 0) {
    errors.push('js/db.js missing _dbCached fix!');
  }
  console.log('db.js validation OK');
} catch(e) {}

if (errors.length > 0) {
  console.log('\nERRORS:');
  errors.forEach(function(e) { console.log('  ! ' + e); });
  process.exit(1);
} else {
  console.log('All validations passed.');
}