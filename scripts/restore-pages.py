with open('/home/z/my-project/tool-results/read_1785123261733_5109a6d56fb6.txt', 'r') as f:
    raw_lines = f.readlines()

tool_lines = []
for line in raw_lines:
    idx = line.find('\u2192')
    if idx >= 0:
        content = line[idx+1:]
        tool_lines.append(content)

print(f'Extracted {len(tool_lines)} lines')

# Find STOCK section
stock_start = -1
for i, line in enumerate(tool_lines):
    if '     STOCK' in line or 'STOCK' in line:
        if i > 0 and '===' in tool_lines[i-1]:
            stock_start = i - 2  # include blank line and comment start
            break

if stock_start < 0:
    # Fallback: search for 'renderStock'
    for i, line in enumerate(tool_lines):
        if 'renderStock' in line:
            stock_start = i - 3
            break

if stock_start < 1:
    print('ERROR: STOCK not found')
    exit(1)

print(f'STOCK section starts at extracted line {stock_start}')
remaining = tool_lines[stock_start:]
print(f'Restoring {len(remaining)} lines')

# Read current file
with open('/home/z/my-project/arcano-deploy/js/pages.js', 'r') as f:
    current = f.readlines()

# Remove trailing empty/close
while current and current[-1].strip() in ('', '};'):
    current.pop()

result = current + ['\n'] + remaining

if result[-1].strip() != '};':
    result.append('};\n')

with open('/home/z/my-project/arcano-deploy/js/pages.js', 'w') as f:
    f.writelines(result)

print(f'Done! {len(result)} lines total')
