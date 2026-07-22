#!/usr/bin/env python3
"""Fix remaining etiqueta references after initial rename"""

# ==================== DB.JS ====================
with open('/home/z/my-project/arcano-deploy/js/db.js', 'r') as f:
    db = f.read()

db = db.replace('etiquetas)', 'stickers)', 1)  # comment line 3 only

# _emptyDB
# Already renamed in the columns array by the script, let me check
db = db.replace("entradas: {}, etiquetas: {},", "entradas: {}, stickers: {},")

# Comment on getProductosConStickers
db = db.replace('with their etiqueta stock merged', 'with their sticker stock merged')

# tipo === 'etiqueta' in saveEntrada
db = db.replace("tipo === 'etiqueta'", "tipo === 'sticker'")

with open('/home/z/my-project/arcano-deploy/js/db.js', 'w') as f:
    f.write(db)

print('db.js: Fixed remaining')

# ==================== PAGES.JS ====================
with open('/home/z/my-project/arcano-deploy/js/pages.js', 'r') as f:
    pages = f.read()

# Line 422: entrada detail display
pages = pages.replace(
    "it.tipo==='etiqueta') return 'Etq ' + (it.etiquetaNombre||'?')",
    "it.tipo==='sticker') return 'Stk ' + (it.stickerNombre||'?')"
)

# Line 552-553: sticker name reading
pages = pages.replace('item.etiquetaNombre', 'item.stickerNombre')
pages = pages.replace("'Falta nombre de etiqueta en item", "'Falta nombre de sticker en item")

# Line 594: production detail
pages = pages.replace('p.etiquetasConsumidas', 'p.stickersConsumidos')
pages = pages.replace("'Etq:'", "'Stk:'")

# Lines 691-702: stock check in formProduccionRapida
pages = pages.replace('// Etiquetas\n      var etqAvail = 0;',
                       '// Stickers\n      var stkAvail = 0;')
pages = pages.replace('var etqKeys = Object.keys(db.etiquetas', 'var stkKeys = Object.keys(db.stickers')
pages = pages.replace('for (var j = 0; j < etqKeys.length; j++)', 'for (var j = 0; j < stkKeys.length; j++)')
pages = pages.replace('if (db.etiquetas[etqKeys[j]].nombre', 'if (db.stickers[stkKeys[j]].nombre')
pages = pages.replace('etqAvail = Number(db.etiquetas[etqKeys[j]]', 'stkAvail = Number(db.stickers[stkKeys[j]]')
pages = pages.replace('var etqOk = etqAvail >= cant;', 'var stkOk = stkAvail >= cant;')
pages = pages.replace('if (!etqOk) allOk = false;', 'if (!stkOk) allOk = false;')
pages = pages.replace("'Stickers ' + talla + '</span><span class="' + (etqOk?", "'Stickers ' + talla + '</span><span class="' + (stkOk?")
pages = pages.replace("' + etqAvail + ' → necesita", "' + stkAvail + ' → necesita")
pages = pages.replace("' + (etqOk?'OK':'FALTA') + '", "' + (stkOk?'OK':'FALTA') + '")

# Line 1269: empty tag state
pages = pages.replace('No hay etiquetas para esta categoria.', 'No hay etiquetas de uso para esta categoria.')

# Line 1309: remove tag confirm
pages = pages.replace('Eliminar etiqueta "' + tagName + '"?', 'Eliminar etiqueta de uso "' + tagName + '"?')

with open('/home/z/my-project/arcano-deploy/js/pages.js', 'w') as f:
    f.write(pages)

print('pages.js: Fixed remaining')
