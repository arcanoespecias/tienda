#!/usr/bin/env python3
"""Rename etiquetas (physical labels) to stickers, keep usage tags as etiquetas de uso"""

# ==================== DB.JS ====================
with open('/home/z/my-project/arcano-deploy/js/db.js', 'r') as f:
    db = f.read()

db = db.replace('   Etiquetas:         por producto, stockChico, stockGrande',
                '   Stickers:           por producto, stockChico, stockGrande')
db = db.replace("etiquetas: 1", "stickers: 1")
db = db.replace("'etiquetas'", "'stickers'")
db = db.replace('_db.etiquetas', '_db.stickers')
db = db.replace("'ETIQUETAS'", "'STICKERS'")
db = db.replace('function getEtiquetas()', 'function getStickers()')
db = db.replace('function _findEtiquetaByNombre', 'function _findStickerByNombre')
db = db.replace('function _getOrCreateEtiqueta', 'function _getOrCreateSticker')
db = db.replace('function getProductosConEtiquetas', 'function getProductosConStickers')
db = db.replace('getProductosConEtiquetas()', 'getProductosConStickers()')
db = db.replace('getEtiquetas: getEtiquetas', 'getStickers: getStickers')
db = db.replace('getProductosConEtiquetas: getProductosConEtiquetas', 'getProductosConStickers: getProductosConStickers')
db = db.replace('etiquetaNombre', 'stickerNombre')
db = db.replace('etiquetasConsumidas', 'stickersConsumidos')
db = db.replace('var etq = _findStickerByNombre', 'var stk = _findStickerByNombre')
db = db.replace('var etq = _getOrCreateSticker', 'var stk = _getOrCreateSticker')
db = db.replace('etq.stock', 'stk.stock')
db = db.replace('etq[etqKey]', 'stk[stkKey]')
db = db.replace('var etqKey =', 'var stkKey =')
db = db.replace('if (etq)', 'if (stk)')
db = db.replace('  etq[stkKey]', '  stk[stkKey]')
db = db.replace('  etq.stock', '  stk.stock')
# Fix the check variable in blend production
# etqStock -> stkStock  
db = db.replace('var etqStock = stk', 'var stkStock = stk')
db = db.replace('etqStock < cantidad', 'stkStock < cantidad')
db = db.replace('etqStock', 'stkStock')

# Stats
# etiquetas -> stickers (local var in getStats)
db = db.replace('  var etiquetas = _filterValid(Object.values(_db.stickers || {}));',
                '  var stickers = _filterValid(Object.values(_db.stickers || {}));')
db = db.replace('  var etqBajo = etiquetas.filter', '  var stkBajo = stickers.filter')
db = db.replace('    etiquetasBajas: etqBajo', '    stickersBajos: stkBajo')

# Error messages
# Already partially handled by _findStickerByNombre rename, fix the error strings
db = db.replace("'Etiquetas '", "'Stickers '")

# Add migration: if old etiquetas key exists, copy to stickers
# Insert after line that ensures stickers exists
old_ensure = "  if (!_db.stickers) _db.stickers = {};"
new_ensure = """  if (!_db.stickers) _db.stickers = {};
  // Migration: copy old etiquetas data to stickers
  if (_db.etiquetas && Object.keys(_db.etiquetas).length > 0 && Object.keys(_db.stickers).length === 0) {
    _db.stickers = _db.etiquetas;
  }
  delete _db.etiquetas;"""
db = db.replace(old_ensure, new_ensure, 1)  # only first occurrence

with open('/home/z/my-project/arcano-deploy/js/db.js', 'w') as f:
    f.write(db)

print('db.js: Done')

# ==================== PAGES.JS ====================
with open('/home/z/my-project/arcano-deploy/js/pages.js', 'r') as f:
    pages = f.read()

# --- Stickers (physical labels) ---
# Dashboard alerts: etiquetasBajas -> stickersBajos
pages = pages.replace('s.etiquetasBajas', 's.stickersBajos')
# Alert badge: ETQ -> Stk
pages = pages.replace("'ETQ: '", "'Stk: '")
# getProductosConEtiquetas -> getProductosConStickers
pages = pages.replace('getProductosConEtiquetas', 'getProductosConStickers')
# Etiquetas section header in Entradas page
pages = pages.replace('<h3>Etiquetas</h3>', '<h3>Stickers</h3>')
# Entrada type option
pages = pages.replace('"etiqueta">Etiquetas', '"sticker">Stickers')
# tipo === 'etiqueta'
pages = pages.replace("tipo === 'etiqueta'", "tipo === 'sticker'")
# etiquetaNombre -> stickerNombre  
pages = pages.replace('.ent-etq-nombre', '.ent-stk-nombre')
# Etq: in production details
pages = pages.replace("'Etq:'", "'Stk:'")

# Stock check section label
pages = pages.replace("'Etiquetas '", "'Stickers '")

# --- Etiquetas de uso (informational tags) ---
# Tab name
pages = pages.replace(">Etiquetas</button>", ">Etiquetas de uso</button>")
# Tab key stays as 'etiquetas' internally - it's used for navigation
# Section comment
pages = pages.replace('// --- TAB: ETIQUETAS ---', '// --- TAB: ETIQUETAS DE USO ---')
# Placeholder
pages = pages.replace('Nueva etiqueta...', 'Nueva etiqueta de uso...')
# Empty state
pages = pages.replace('Sin etiquetas', 'Sin etiquetas de uso')
# Form labels
pages = pages.replace("'<label>Etiquetas</label>", "'<label>Etiquetas de uso</label>")
# Add tag confirm
pages = pages.replace("'La etiqueta ya existe", "'La etiqueta de uso ya existe")
pages = pages.replace("'Eliminar etiqueta'", "'Eliminar etiqueta de uso'")
# Alert section
pages = pages.replace("'Etiquetas' + talla", "'Stickers ' + talla")

# Form section: the tag selector divs keep their IDs as-is (tag-area-esp, tag-area-bl)
# The buildTagSelectorHtml, getSelectedTags, refreshTagSelector, doAddTag, doRemoveTag
# function names stay the same since they manage "tags" (usage tags), not stickers

with open('/home/z/my-project/arcano-deploy/js/pages.js', 'w') as f:
    f.write(pages)

print('pages.js: Done')

# ==================== APP.JS ====================
with open('/home/z/my-project/arcano-deploy/js/app.js', 'r') as f:
    app = f.read()

app = app.replace('getEtiquetas', 'getStickers')
app = app.replace('getProductosConEtiquetas', 'getProductosConStickers')

with open('/home/z/my-project/arcano-deploy/js/app.js', 'w') as f:
    f.write(app)

print('app.js: Done')
