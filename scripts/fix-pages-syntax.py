#!/usr/bin/env python3
BT = chr(96)  # backtick character

with open('/home/z/my-project/arcano-deploy/js/pages.js', 'r') as f:
    content = f.read()

# 1. Fix especia action buttons (lines 94-99 area)
old_esp = """            '<td style="white-space:nowrap">' +
              \\"`<button class="btn btn-sm ${e.enTienda ? 'btn-green' : 'btn-outline'} mr-4\""" + "\"" + "\"" + """ onclick="ArcanoDB.toggleTienda('especia',${e.id});App.renderPage('productos')""" + "\"" + """ title="Tienda">${e.enTienda ? 'Tienda ON' : 'Tienda'}</button>\\`""" + """ +
              \\"`<button class="btn btn-sm btn-green mr-4\""" + "\"" + """ onclick="Pages.formProduccionRapida('especia',${e.id})">Producir</button>\\`""" + """ +
              '<button class="btn btn-sm btn-outline mr-8" onclick="Pages.formEspecia(' + e.id + ')">Editar</button>' +
              '<button class="btn btn-sm btn-red" onclick="Pages.delEspecia(' + e.id + ')">X</button>' +
            '</td></tr>';"""

print(f"Looking for old_esp in content...")
if old_esp in content:
    print("FOUND old_esp!")
else:
    print("NOT FOUND")

# Actually let me just do this line by line
print("Current lines 93-99:")
lines = content.split('\n')
for i in range(93, 99):
    print(f"  {i+1}: {repr(lines[i])}")
