#!/usr/bin/env python3
"""
Apply ALL fixes to pages.js in one clean pass:
1. Add hidden especiaId/blendId inputs to forms
2. Add precioTiendaChico/Grande fields to formEspecia
3. Add precioTiendaChicoB/GrandeB fields to formBlend
4. Add guardarEspecia/guardarBlend as Pages methods
5. Expose window.guardarEspecia/window.guardarBlend
"""

import re, subprocess, sys

with open('/home/z/my-project/arcano-deploy/js/pages.js', 'r') as f:
    lines = f.readlines()

print(f'Starting with {len(lines)} lines')

# ============================================================
# FIND KEY POSITIONS
# ============================================================

def find_function_range(lines, func_name):
    """Find the start and end line of a function definition."""
    start = None; end = None; brace = 0
    for i, line in enumerate(lines):
        if f'function {func_name}(' in line:
            start = i
            brace = line.count('{') - line.count('}')
            continue
        if start is not None:
            brace += line.count('{') - line.count('}')
            if brace <= 0:
                end = i
                break
    return start, end

def find_next_div_close(lines, start, limit):
    """Find next </div> line after start."""
    for j in range(start + 1, min(start + 5, limit + 1)):
        if '</div>' in lines[j]:
            return j
    return None

def find_line_containing(lines, text, start=0, end=None):
    """Find line index containing text."""
    limit = end or len(lines)
    for i in range(start, limit):
        if text in lines[i]:
            return i
    return None

def find_input_line(lines, id_attr, func_start, func_end):
    """Find line with input having given id attribute."""
    for i in range(func_start, func_end + 1):
        if f'id="{id_attr}"' in lines[i]:
            return i
    return None

# Find function ranges
especia_start, especia_end = find_function_range(lines, 'formEspecia')
blend_start, blend_end = find_function_range(lines, 'formBlend')

print(f'formEspecia: lines {especia_start+1}-{especia_end+1}')
print(f'formBlend: lines {blend_start+1}-{blend_end+1}')

# Find precioChico/precioGrande input lines and their </div>
especia_pc_line = find_input_line(lines, 'precioChico', especia_start, especia_end)
especia_pc_close = find_next_div_close(lines, especia_pc_line, especia_end) if especia_pc_line else None

especia_pg_line = find_input_line(lines, 'precioGrande', especia_start, especia_end)
especia_pg_close = find_next_div_close(lines, especia_pg_line, especia_end) if especia_pg_line else None

blend_pc_line = find_input_line(lines, 'precioChico', blend_start, blend_end)
blend_pc_close = find_next_div_close(lines, blend_pc_line, blend_end) if blend_pc_line else None

blend_pg_line = find_input_line(lines, 'precioGrande', blend_start, blend_end)
blend_pg_close = find_next_div_close(lines, blend_pg_line, blend_end) if blend_pg_line else None

print(f'especia precioChico input: {especia_pc_line+1}, </div>: {especia_pc_close+1 if especia_pc_close else "N/A"}')
print(f'especia precioGrande input: {especia_pg_line+1}, </div>: {especia_pg_close+1 if especia_pg_close else "N/A"}')
print(f'blend precioChico input: {blend_pc_line+1}, </div>: {blend_pc_close+1 if blend_pc_close else "N/A"}')
print(f'blend precioGrande input: {blend_pg_line+1}, </div>: {blend_pg_close+1 if blend_pg_close else "N/A"}')

# Find the Pages object closing }; and window.Pages = Pages;
pages_close_line = None
window_pages_line = None
brace = 0; in_pages = False
for i, line in enumerate(lines):
    if 'const Pages = {' in line:
        in_pages = True
        brace = line.count('{') - line.count('}')
        continue
    if in_pages:
        brace += line.count('{') - line.count('}')
        if brace == 0 and '};' in line:
            pages_close_line = i
            in_pages = False
    if 'window.Pages = Pages;' in line:
        window_pages_line = i

print(f'Pages closing }}; at line {pages_close_line+1 if pages_close_line else "N/A"}')
print(f'window.Pages = Pages; at line {window_pages_line+1 if window_pages_line else "N/A"}')

# Find the form opening line in each function (for hidden input insertion)
especia_form_line = find_line_containing(lines, "h += '<form", especia_start, especia_end)
blend_form_line = find_line_containing(lines, "h += '<form", blend_start, blend_end)
print(f'especia form tag at line {especia_form_line+1 if especia_form_line else "N/A"}')
print(f'blend form tag at line {blend_form_line+1 if blend_form_line else "N/A"}')

# Verify all positions found
assert especia_pc_close, 'Could not find especia precioChico </div>'
assert especia_pg_close, 'Could not find especia precioGrande </div>'
assert blend_pc_close, 'Could not find blend precioChico </div>'
assert blend_pg_close, 'Could not find blend precioGrande </div>'
assert pages_close_line is not None, 'Could not find Pages closing };'
assert window_pages_line is not None, 'Could not find window.Pages = Pages;'
assert especia_form_line, 'Could not find especia form tag'
assert blend_form_line, 'Could not find blend form tag'

# ============================================================
# VERIFY BUTTON ONCLICK
# ============================================================
especia_uses_guardar = any('guardarEspecia()' in lines[i] for i in range(especia_start, especia_end+1))
blend_uses_guardar = any('guardarBlend()' in lines[i] for i in range(blend_start, blend_end+1))
print(f'\nformEspecia button calls guardarEspecia(): {especia_uses_guardar}')
print(f'formBlend button calls guardarBlend(): {blend_uses_guardar}')
assert especia_uses_guardar, 'formEspecia does NOT call guardarEspecia()!'
assert blend_uses_guardar, 'formBlend does NOT call guardarBlend()!'

# ============================================================
# GET INDENTATION FROM EXISTING FORM LINES
# ============================================================
indent = '    '  # Default 4-space indent

# ============================================================
# BUILD INSERTION LINES
# ============================================================

# Hidden ID inputs (insert after form opening tag)
hidden_especia = [f"{indent}h += '<input type=\"hidden\" id=\"especiaId\" value=\"' + (id || '') + '\">';\n"]
hidden_blend = [f"{indent}h += '<input type=\"hidden\" id=\"blendId\" value=\"' + (id || '') + '\">';\n"]

# precioTienda fields for especia (insert after precioChico/precioGrande </div>)
tienda_chico_e = [
    f"{indent}h += '<div class=\"form-group\">';\n",
    f"{indent}h += '<label class=\"form-label\" style=\"color:var(--green);font-weight:600\">Precio Tienda Chico (Venta al publico)</label>';\n",
    f"{indent}h += '<input type=\"number\" id=\"precioTiendaChico\" class=\"form-input\" placeholder=\"Ej: 45\" step=\"0.01\" value=\"' + ((esp && esp.precioTiendaChico) || '') + '\">';\n",
    f"{indent}h += '</div>';\n",
]

tienda_grande_e = [
    f"{indent}h += '<div class=\"form-group\">';\n",
    f"{indent}h += '<label class=\"form-label\" style=\"color:var(--green);font-weight:600\">Precio Tienda Grande (Venta al publico)</label>';\n",
    f"{indent}h += '<input type=\"number\" id=\"precioTiendaGrande\" class=\"form-input\" placeholder=\"Ej: 85\" step=\"0.01\" value=\"' + ((esp && esp.precioTiendaGrande) || '') + '\">';\n",
    f"{indent}h += '</div>';\n",
]

tienda_chico_b = [
    f"{indent}h += '<div class=\"form-group\">';\n",
    f"{indent}h += '<label class=\"form-label\" style=\"color:var(--green);font-weight:600\">Precio Tienda Chico (Venta al publico)</label>';\n",
    f"{indent}h += '<input type=\"number\" id=\"precioTiendaChicoB\" class=\"form-input\" placeholder=\"Ej: 50\" step=\"0.01\" value=\"' + ((bl && bl.precioTiendaChico) || '') + '\">';\n",
    f"{indent}h += '</div>';\n",
]

tienda_grande_b = [
    f"{indent}h += '<div class=\"form-group\">';\n",
    f"{indent}h += '<label class=\"form-label\" style=\"color:var(--green);font-weight:600\">Precio Tienda Grande (Venta al publico)</label>';\n",
    f"{indent}h += '<input type=\"number\" id=\"precioTiendaGrandeB\" class=\"form-input\" placeholder=\"Ej: 95\" step=\"0.01\" value=\"' + ((bl && bl.precioTiendaGrande) || '') + '\">';\n",
    f"{indent}h += '</div>';\n",
]

# guardar functions (insert as last methods before Pages closing });
guardar_funcs = [
    '\n',
    '  guardarEspecia: function() {\n',
    '    var id = document.getElementById("especiaId") ? document.getElementById("especiaId").value : "";\n',
    '    var data = {\n',
    '      nombre: document.getElementById("nombre").value.trim(),\n',
    '      origen: document.getElementById("origen").value.trim(),\n',
    '      descripcion: document.getElementById("descripcion").value.trim(),\n',
    '      gramosChico: parseFloat(document.getElementById("gramosChico").value) || 0,\n',
    '      precioChico: parseFloat(document.getElementById("precioChico").value) || 0,\n',
    '      precioTiendaChico: parseFloat(document.getElementById("precioTiendaChico").value) || 0,\n',
    '      gramosGrande: parseFloat(document.getElementById("gramosGrande").value) || 0,\n',
    '      precioGrande: parseFloat(document.getElementById("precioGrande").value) || 0,\n',
    '      precioTiendaGrande: parseFloat(document.getElementById("precioTiendaGrande").value) || 0,\n',
    '      tags: document.getElementById("tags").value.trim(),\n',
    '      notas: document.getElementById("notas").value.trim()\n',
    '    };\n',
    '    if (!data.nombre) { alert("El nombre es obligatorio"); return; }\n',
    '    ArcanoDB.saveEspecia(id, data);\n',
    '    App.navigate("especias");\n',
    '  },\n',
    '\n',
    '  guardarBlend: function() {\n',
    '    var id = document.getElementById("blendId") ? document.getElementById("blendId").value : "";\n',
    '    var data = {\n',
    '      nombre: document.getElementById("nombreB").value.trim(),\n',
    '      descripcion: document.getElementById("descripcionB").value.trim(),\n',
    '      gramosChico: parseFloat(document.getElementById("gramosChico").value) || 0,\n',
    '      precioChico: parseFloat(document.getElementById("precioChico").value) || 0,\n',
    '      precioTiendaChico: parseFloat(document.getElementById("precioTiendaChicoB").value) || 0,\n',
    '      gramosGrande: parseFloat(document.getElementById("gramosGrande").value) || 0,\n',
    '      precioGrande: parseFloat(document.getElementById("precioGrande").value) || 0,\n',
    '      precioTiendaGrande: parseFloat(document.getElementById("precioTiendaGrandeB").value) || 0,\n',
    '      tags: document.getElementById("tagsB").value.trim(),\n',
    '      notas: document.getElementById("notasB").value.trim()\n',
    '    };\n',
    '    if (!data.nombre) { alert("El nombre es obligatorio"); return; }\n',
    '    ArcanoDB.saveBlend(id, data);\n',
    '    App.navigate("blends");\n',
    '  },\n',
    '\n',
]

# Window exposures (insert after window.Pages = Pages;)
window_exposures = [
    'window.guardarEspecia = function() { Pages.guardarEspecia(); };\n',
    'window.guardarBlend = function() { Pages.guardarBlend(); };\n',
]

# ============================================================
# VERIFY FORM IDs MATCH GUARDAR READS
# ============================================================
import re as re_mod

# Get formEspecia IDs after our planned insertions
# (we need to predict what IDs will exist)
fe_ids = set(m.group(1) for m in re_mod.finditer(r'id="([^"]+)"', '\n'.join(lines[especia_start:especia_end+1])))
fe_ids.update(['especiaId', 'precioTiendaChico', 'precioTiendaGrande'])  # Our additions

ge_reads = set(m.group(1) for m in re_mod.finditer(r'getElementById\([\'"]([^\'"]+)[\'"]\)', '\n'.join(guardar_funcs)))
ge_reads.add('especiaId')  # Also reads especiaId

missing_e = ge_reads - fe_ids
missing_e_safe = missing_e - {'especiaId'}  # especiaId has safe check
if missing_e_safe:
    print(f'\nWARNING: guardarEspecia reads {missing_e_safe} not in form!')
    sys.exit(1)

# Same for blend
fb_ids = set(m.group(1) for m in re_mod.finditer(r'id="([^"]+)"', '\n'.join(lines[blend_start:blend_end+1])))
fb_ids.update(['blendId', 'precioTiendaChicoB', 'precioTiendaGrandeB'])

gb_reads = set(m.group(1) for m in re_mod.finditer(r'getElementById\([\'"]([^\'"]+)[\'"]\)', '\n'.join(guardar_funcs)))
gb_reads.add('blendId')

# Only check blend-specific reads (nombreB, descripcionB, tagsB, notasB, precioTiendaChicoB, precioTiendaGrandeB)
blend_specific = {'nombreB', 'descripcionB', 'tagsB', 'notasB', 'precioTiendaChicoB', 'precioTiendaGrandeB', 'blendId'}
missing_b = (gb_reads & blend_specific) - fb_ids
if missing_b:
    print(f'\nWARNING: guardarBlend reads {missing_b} not in form!')
    sys.exit(1)

print('\nAll form IDs match guardar reads. OK!')

# ============================================================
# APPLY ALL INSERTIONS (bottom to top to preserve line numbers)
# ============================================================

# We need to track cumulative offset
offset = 0

# 1. Window exposures (after window.Pages = Pages;)
wp = window_pages_line + offset
for j, wl in enumerate(window_exposures):
    lines.insert(wp + 1 + j, wl)
offset += 1
print(f'1. Inserted window exposures after line {wp+1}')

# 2. guardar functions (before Pages closing };)
# Need to add comma after the last method before our insertion
pc = pages_close_line + offset
prev_line = lines[pc - 1].rstrip()
if prev_line.endswith('}') and not prev_line.endswith('},'):
    lines[pc - 1] = prev_line + ',\n'
    print(f'2a. Added comma to line {pc}')

for j, gl in enumerate(guardar_funcs):
    lines.insert(pc + j, gl)
offset += 1
print(f'2b. Inserted guardar functions at line {pc+1}')

# 3. Hidden blendId (after blend form tag)
bf = blend_form_line + offset
for j, hl in enumerate(hidden_blend):
    lines.insert(bf + 1 + j, hl)
offset += 1
print(f'3. Inserted hidden blendId after line {bf+1}')

# 4. precioTiendaGrandeB (after blend precioGrande </div>)
bpg = blend_pg_close + offset
for j, tl in enumerate(tienda_grande_b):
    lines.insert(bpg + 1 + j, tl)
offset += 1
print(f'4. Inserted precioTiendaGrandeB after line {bpg+1}')

# 5. precioTiendaChicoB (after blend precioChico </div>)
bpc = blend_pc_close + offset
for j, tl in enumerate(tienda_chico_b):
    lines.insert(bpc + 1 + j, tl)
offset += 1
print(f'5. Inserted precioTiendaChicoB after line {bpc+1}')

# 6. Hidden especiaId (after especia form tag)
ef = especia_form_line + offset
for j, hl in enumerate(hidden_especia):
    lines.insert(ef + 1 + j, hl)
offset += 1
print(f'6. Inserted hidden especiaId after line {ef+1}')

# 7. precioTiendaGrande (after especia precioGrande </div>)
epg = especia_pg_close + offset
for j, tl in enumerate(tienda_grande_e):
    lines.insert(epg + 1 + j, tl)
offset += 1
print(f'7. Inserted precioTiendaGrande after line {epg+1}')

# 8. precioTiendaChico (after especia precioChico </div>)
epc = especia_pc_close + offset
for j, tl in enumerate(tienda_chico_e):
    lines.insert(epc + 1 + j, tl)
offset += 1
print(f'8. Inserted precioTiendaChico after line {epc+1}')

# ============================================================
# WRITE BACK AND VERIFY
# ============================================================

with open('/home/z/my-project/arcano-deploy/js/pages.js', 'w') as f:
    f.writelines(lines)

print(f'\nWrote {len(lines)} lines')

# Syntax check
result = subprocess.run(['node', '-c', '/home/z/my-project/arcano-deploy/js/pages.js'],
                       capture_output=True, text=True)
if result.returncode != 0:
    print(f'\nSYNTAX ERROR: {result.stderr}')
    sys.exit(1)
else:
    print('Syntax check: OK')

# Content verification
with open('/home/z/my-project/arcano-deploy/js/pages.js', 'r') as f:
    content = f.read()

checks = [
    ('precioTiendaChico in formEspecia', 'id="precioTiendaChico"' in content),
    ('precioTiendaGrande in formEspecia', 'id="precioTiendaGrande"' in content),
    ('precioTiendaChicoB in formBlend', 'id="precioTiendaChicoB"' in content),
    ('precioTiendaGrandeB in formBlend', 'id="precioTiendaGrandeB"' in content),
    ('guardarEspecia in Pages', 'guardarEspecia: function' in content),
    ('guardarBlend in Pages', 'guardarBlend: function' in content),
    ('window.guardarEspecia', 'window.guardarEspecia' in content),
    ('window.guardarBlend', 'window.guardarBlend' in content),
    ('hidden especiaId', 'id="especiaId"' in content),
    ('hidden blendId', 'id="blendId"' in content),
]

all_pass = True
for name, result in checks:
    status = 'OK' if result else 'FALLO'
    if not result: all_pass = False
    print(f'  [{status}] {name}')

# Structural check: guardar functions INSIDE Pages
pages_start_pos = content.find('const Pages = {')
pages_open_pos = content.find('{', pages_start_pos)
brace = 0; pages_close_pos = pages_open_pos
for i in range(pages_open_pos, len(content)):
    if content[i] == '{': brace += 1
    elif content[i] == '}':
        brace -= 1
        if brace == 0: pages_close_pos = i; break

pages_body = content[pages_open_pos:pages_close_pos]
after_pages = content[pages_close_pos:]

struct_checks = [
    ('guardarEspecia INSIDE Pages', 'guardarEspecia: function' in pages_body),
    ('guardarBlend INSIDE Pages', 'guardarBlend: function' in pages_body),
    ('window.guardarEspecia OUTSIDE Pages', 'window.guardarEspecia' in after_pages),
    ('window.guardarBlend OUTSIDE Pages', 'window.guardarBlend' in after_pages),
]

for name, result in struct_checks:
    status = 'OK' if result else 'FALLO'
    if not result: all_pass = False
    print(f'  [{status}] {name}')

if all_pass:
    print(f'\nALL {len(checks) + len(struct_checks)} CHECKS PASSED!')
else:
    print('\nSOME CHECKS FAILED!')
    sys.exit(1)
