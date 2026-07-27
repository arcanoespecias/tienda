import re

with open('/home/z/my-project/arcano-deploy/js/pages.js', 'r') as f:
    content = f.read()

# 1. Add QR button for ESPECIAS (before Tienda toggle button)
old_esp = "'<td style=\"white-space:nowrap\">' +\n              '<button class=\"btn btn-sm \"' + (e.enTienda ? \"'btn-green'\" : \"'btn-outline'\") + ' mr-4\" onclick=\"ArcanoDB.toggleTienda(\\'especia\\',' + e.id + ');App.renderPage(\\'productos\\')\" title=\"Tienda\">'"

new_esp = "'<td style=\"white-space:nowrap\">' +\n              '<button class=\"btn btn-sm btn-outline mr-4\" onclick=\"Pages.showQRLabels(\\'especia\\',' + e.id + ')\" title=\"QR Label\">QR</button>' +\n              '<button class=\"btn btn-sm \"' + (e.enTienda ? \"'btn-green'\" : \"'btn-outline'\") + ' mr-4\" onclick=\"ArcanoDB.toggleTienda(\\'especia\\',' + e.id + ');App.renderPage(\\'productos\\')\" title=\"Tienda\">'"

if old_esp in content:
    content = content.replace(old_esp, new_esp, 1)
    print('OK: Added QR button for especias')
else:
    print('WARN: Could not find especias QR insertion point')
    # Try simpler approach
    esp_marker = "'<button class=\"btn btn-sm \"' + (e.enTienda ? \"'btn-green'\" : \"'btn-outline'\") + ' mr-4\" onclick=\"ArcanoDB.toggleTienda(\\'especia\\','"
    if esp_marker in content:
        qr_line = "'<button class=\"btn btn-sm btn-outline mr-4\" onclick=\"Pages.showQRLabels(\\'especia\\',' + e.id + ')\" title=\"QR Label\">QR</button>' +\n              "
        content = content.replace(esp_marker, qr_line + esp_marker, 1)
        print('OK: Added QR button for especias (simple)')
    else:
        print('ERROR: esp_marker not found either')

# 2. Add QR button for BLENDS (before Tienda toggle button)
bl_marker = "'<button class=\"btn btn-sm \"' + (b.enTienda ? \"'btn-green'\" : \"'btn-outline'\") + ' mr-4\" onclick=\"ArcanoDB.toggleTienda(\\'blend\\','"
if bl_marker in content:
    qr_line_bl = "'<button class=\"btn btn-sm btn-outline mr-4\" onclick=\"Pages.showQRLabels(\\'blend\\',' + b.id + ')\" title=\"QR Label\">QR</button>' +\n              "
    content = content.replace(bl_marker, qr_line_bl + bl_marker, 1)
    print('OK: Added QR button for blends')
else:
    print('WARN: Could not find blends QR insertion point')

with open('/home/z/my-project/arcano-deploy/js/pages.js', 'w') as f:
    f.write(content)
print('Done')
