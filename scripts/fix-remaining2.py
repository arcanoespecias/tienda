#!/usr/bin/env python3

with open('/home/z/my-project/arcano-deploy/js/pages.js', 'r') as f:
    pages = f.read()

# Line 422: entrada detail display
pages = pages.replace(
    "it.tipo==='etiqueta') return 'Etq ' + (it.etiquetaNombre||'?')",
    "it.tipo==='sticker') return 'Stk ' + (it.stickerNombre||'?')"
)

# Line 552-553: sticker name
pages = pages.replace('item.etiquetaNombre', 'item.stickerNombre')
pages = pages.replace("'Falta nombre de etiqueta en item", "'Falta nombre de sticker en item")

# Line 594: production detail
pages = pages.replace('p.etiquetasConsumidas', 'p.stickersConsumidos')
pages = pages.replace("'Etq:'", "'Stk:'")

# Line 1269: empty tag state
pages = pages.replace('No hay etiquetas para esta categoria.', 'No hay etiquetas de uso para esta categoria.')

with open('/home/z/my-project/arcano-deploy/js/pages.js', 'w') as f:
    f.write(pages)
print('pages.js: Fixed remaining')
