import json, re, os, sys

data_dir = r'C:\Users\User\Desktop\Ai Claud\science-mcq-app\data'

with open(os.path.join(data_dir, 'meta.json'), 'r', encoding='utf-8') as f:
    meta = json.load(f)

lines = ['=== SUBJECTS AND CHAPTERS ===']
for subj, info in meta.items():
    lines.append(f'\n## {subj}')
    for ch in info['chapters']:
        lines.append(f'  {ch["id"]}: {ch["name"]}')

with open(os.path.join(data_dir, '..', 'chapters_output.txt'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print('Written to chapters_output.txt')
