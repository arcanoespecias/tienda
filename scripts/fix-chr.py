with open('/home/z/my-project/arcano-deploy/js/tienda-ui.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("chr(39)", "String.fromCharCode(39)")

with open('/home/z/my-project/arcano-deploy/js/tienda-ui.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed chr -> String.fromCharCode')
