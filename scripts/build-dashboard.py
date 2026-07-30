#!/usr/bin/env python3
"""Replace renderDashboard in pages.js."""

JS_FILE = '/home/z/my-project/arcano-deploy/js/pages.js'

with open(JS_FILE, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find start (line 4, 0-indexed = 3) and end (line 89, 0-indexed = 88)
start_idx = 3  # Line 4: /* ==== DASHBOARD
end_idx = 88   # Line 89: /* ==== PRODUCTOS

print(f'Replacing lines {start_idx+1} to {end_idx+1} ({end_idx - start_idx} lines)')

with open('/home/z/my-project/scripts/dashboard-func.js', 'r', encoding='utf-8') as f:
    new_func = f.read()

new_lines = lines[:start_idx] + [new_func + '\n'] + lines[end_idx:]

with open(JS_FILE, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('OK: Dashboard replaced')
