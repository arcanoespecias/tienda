#!/usr/bin/env python3
import re

with open('/home/z/my-project/arcano-deploy/js/pages.js', 'r') as f:
    lines = f.readlines()

BT = chr(96)  # backtick

# ============ FIX ESPECIA ACTION BUTTONS (lines 94-98, 0-indexed 93-97) ============
# Line 94 (idx 93): keep as-is, it's correct
# Lines 95-96 (idx 94-95): rewrite with backtick template literals
# Lines 97-98 (idx 96-97): keep as-is, they're correct

lines[94] = '              ' + BT + '<button class="btn btn-sm ${e.enTienda ? ' + "'btn-green'" + ' : ' + "'btn-outline'" + '} mr-4" onclick="ArcanoDB.toggleTienda(' + "'" + "'especia'" + "'" + ',${e.id});App.renderPage(' + "'" + "'productos'" + "'" + ')" title="Tienda">${e.enTienda ? ' + "'" + "'Tienda ON'" + "'" + ' : ' + "'" + "'Tienda'" + "'" + '}</button>' + BT + ' +\n'
