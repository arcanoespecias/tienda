import re, os, base64, sys

dir_path = sys.argv[1] if len(sys.argv) > 1 else '/home/z/my-project/docs'
html_path = os.path.join(dir_path, 'index.html')
logo_path = os.path.join(dir_path, 'icons', 'logo.png')

with open(html_path, 'r') as f:
    html = f.read()

m = re.search(r'src="(data:image/png;base64,[A-Za-z0-9+/=]+)"', html)
if m:
    b64 = m.group(1).replace('data:image/png;base64,', '')
    img = base64.b64decode(b64)
    with open(logo_path, 'wb') as out:
        out.write(img)
    new_html = re.sub(r'src="data:image/png;base64,[A-Za-z0-9+/=]+"', 'src="icons/logo.png"', html)
    with open(html_path, 'w') as f:
        f.write(new_html)
    print(f'HTML: {os.path.getsize(html_path)} bytes')
    print(f'Logo: {os.path.getsize(logo_path)} bytes')
else:
    print('No base64 logo found')
