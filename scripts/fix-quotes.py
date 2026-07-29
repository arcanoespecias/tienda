with open('/home/z/my-project/arcano-deploy/js/tienda-ui.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix card buttons - use double quotes for onclick to avoid escaping issues
old1 = '''' + p.id + ','chico')">'''  
new1 = '''' + p.id + ', "chico")">'''
old2 = '''' + p.id + ','grande')">'''
new2 = '''' + p.id + ', "grande")">'''

content = content.replace(old1, new1)
content = content.replace(old2, new2)

# Also fix the detail price buttons  
old3 = '''addToCartByIdAndSize(' + p.id + ','chico');document'''  
new3 = '''addToCartByIdAndSize(' + p.id + ', "chico");document'''
old4 = '''addToCartByIdAndSize(' + p.id + ','grande');document'''
new4 = '''addToCartByIdAndSize(' + p.id + ', "grande");document'''

content = content.replace(old3, new3)
content = content.replace(old4, new4)

with open('/home/z/my-project/arcano-deploy/js/tienda-ui.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
