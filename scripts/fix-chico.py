#!/usr/bin/env python3
# Replace 'Chico' with 'Pequeño' in display text only (not code identifiers)
import re

files = [
  '/home/z/my-project/arcano-deploy/js/pages.js',
  '/home/z/my-project/arcano-deploy/js/tienda-ui.js',
]

# Each tuple: (pattern, replacement)
# These patterns ONLY match display text, not code identifiers like stockChico, precioChico
replacements = [
  # Table headers
  ('\$Chico', '$Pequeño'),
  ('Fr\.Chico', 'Fr.Pequeño'),
  ('Stk\.Chico', 'Stk.Pequeño'),
  ('Stock Ch', 'Stock Pq'),
  ('Grs/Chico', 'Grs/Pequeño'),
  ('Grs/Ch>', 'Grs/Pq>'),
  ('Precio Chico', 'Precio Pequeño'),
  ('Precio Frasco Chico', 'Precio Frasco Pequeño'),
  ('Precio Tienda Chico', 'Precio Tienda Pequeño'),
  ('Gramos por Frasco Chico', 'Gramos por Frasco Pequeño'),
  ('Grs por Frasco Chico', 'Grs por Frasco Pequeño'),
  # Labels
  ('Frascos Chicos', 'Frascos Pequeños'),
  ('Env\. Chicos', 'Env. Pequeños'),
  ('Frasco Chico \(unidades\)', 'Frasco Pequeño (unidades)'),
  ('>Chico<', '>Pequeño<'),
  ("'Chico'", "'Pequeño'"),
  # Stock text
  1,  # placeholder
]

# Simpler approach: line-by-line text replacements
# that won't touch code identifiers (stockChico, precioChico, etc.)
simple_replacements = [
  ('$Chico', '$Pequeño'),
  ('Fr.Chico', 'Fr.Pequeño'),
  ('Stk.Chico', 'Stk.Pequeño'),
  ('Stock Ch', 'Stock Pq'),
  ('Grs/Chico', 'Grs/Pequeño'),
  ('Grs/Ch>', 'Grs/Pq>'),
  ('Precio Frasco Chico', 'Precio Frasco Pequeño'),
  ('Precio Tienda Chico', 'Precio Tienda Pequeño'),
  ('Precio Chico', 'Precio Pequeño'),
  ('Gramos por Frasco Chico', 'Gramos por Frasco Pequeño'),
  ('Grs por Frasco Chico', 'Grs por Frasco Pequeño'),
  ('Frascos Chicos', 'Frascos Pequeños'),
  ('Env. Chicos', 'Env. Pequeños'),
  ('Frasco Chico (unidades)', 'Frasco Pequeño (unidades)'),
  ('>Chico<', '>Pequeño<'),
  ("'Chico'", "'Pequeño'"),
  ('fr chico', 'fr pequeño'),
  ("' ch / '", "' pq / '"),
  ('Chico: ', 'Pequeño: '),
  ('Ch: ', 'Pq: '),
]

for filepath in files:
  with open(filepath, 'r') as f:
    content = f.read()
  
  original = content
  for old, new in simple_replacements:
    content = content.replace(old, new)
  
  if content != original:
    with open(filepath, 'w') as f:
      f.write(content)
    count = sum(1 for o, n in simple_replacements if o in original)
    print(f'{filepath}: {count} patterns replaced')
  else:
    print(f'{filepath}: no changes')

print('Done')
