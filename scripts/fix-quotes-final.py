with open('/home/z/my-project/arcano-deploy/js/tienda-ui.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix card price buttons: replace ', "chico")' with ', &#39;chico&#39;)'
content = content.replace(', "chico")">', ', &#39;chico&#39;)">')
content = content.replace(', "grande")">', ', &#39;grande&#39;)">')

with open('/home/z/my-project/arcano-deploy/js/tienda-ui.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed card buttons')
