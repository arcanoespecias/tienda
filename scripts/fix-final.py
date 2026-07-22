#!/usr/bin/env python3

# ==================== DB.JS ====================
with open('/home/z/my-project/arcano-deploy/js/db.js', 'r') as f:
    db = f.read()

# Function calls that still use old names
db = db.replace('_findEtiquetaByNombre', '_findStickerByNombre')
db = db.replace('_getOrCreateEtiqueta', '_getOrCreateSticker')

# Fix var etq -> var stk (all occurrences)
db = db.replace('var etq =', 'var stk =')
db = db.replace('var existing = _findStickerByNombre', 'var existing = _findStickerByNombre')  # keep 'existing'

# Fix etq references to stk
db = db.replace('etq ? (Number(etq[', 'stk ? (Number(stk[')  # broken pattern from first script
db = db.replace('etq ? (Number(stk.stockChico)', 'stk ? (Number(stk.stockChico)')  # fix: stk.stockChico not stk[...]
db = db.replace('etq[talla', 'stk[talla')

db = db.replace('etq.stock', 'stk.stock')
db = db.replace('etq[stkKey]', 'stk[stkKey]')
db = db.replace('etq[etqKey]', 'stk[stkKey]')

with open('/home/z/my-project/arcano-deploy/js/db.js', 'w') as f:
    f.write(db)
print('db.js: Fixed')

# ==================== PAGES.JS ====================
with open('/home/z/my-project/arcano-deploy/js/pages.js', 'r') as f:
    pages = f.read()

# Tab key: rename 'etiquetas' to 'uso' for internal navigation
pages = pages.replace("window._prodTab='etiquetas'", "window._prodTab='uso'")
pages = pages.replace("tab==='etiquetas'", "tab==='uso'")

# Form labels: the script missed these because of quote differences
pages = pages.replace(">Etiquetas</label>", ">Etiquetas de uso</label>")

# Comment
pages = pages.replace('// Etiquetas\n    h', '// Stickers\n    h')

# CSS class for sticker selector
pages = pages.replace('.ent-etq-nombre', '.ent-stk-nombre')

# Table headers Etq. -> Stk.
pages = pages.replace('Etq.Chico', 'Stk.Chico')
pages = pages.replace('Etq.Grande', 'Stk.Grande')

# Production detail Etq:
pages = pages.replace('Etq:', 'Stk:')

with open('/home/z/my-project/arcano-deploy/js/pages.js', 'w') as f:
    f.write(pages)
print('pages.js: Fixed')
