import json, re, os, sys
from collections import defaultdict

sys.stdout.reconfigure(encoding='utf-8')

data_dir = r'C:\Users\User\Desktop\Ai Claud\science-mcq-app\data'
boards_dir = os.path.join(data_dir, 'boards')

with open(os.path.join(data_dir, 'meta.json'), 'r', encoding='utf-8') as f:
    meta = json.load(f)

chapter_names = {}
for subj, info in meta.items():
    chapter_names[subj] = {ch['id']: ch['name'] for ch in info['chapters']}

general_samples = defaultdict(list)

for fname in sorted(os.listdir(boards_dir)):
    if not fname.endswith('.json'):
        continue
    fpath = os.path.join(boards_dir, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    for q in data:
        if q['chapter'] == 'General':
            general_samples[q['subject']].append({
                'id': q['id'],
                'q': re.sub(r'<[^>]+>', '', q['question']).strip(),
                'year': q['year'],
                'board': q['board'],
                'file': fname
            })

for subj in ['Physics 1st Paper', 'Physics 2nd Paper', 'Chemistry 1st Paper', 'Chemistry 2nd Paper', 
             'Math 1st Paper', 'Math 2nd Paper', 'Biology 1st Paper', 'Biology 2nd Paper', 'ICT', 'Bangla 1st Paper']:
    print(f'\n{"="*60}')
    print(f'=== {subj} === ({len(general_samples[subj])} general questions)')
    print(f'{"="*60}')
    chapters = chapter_names.get(subj, {})
    for cid, cname in chapters.items():
        print(f'  {cid}: {cname}')
    print()
    samples = general_samples[subj][:10]
    for s in samples:
        print(f'  Q{s["id"]} ({s["year"]} {s["board"]}): {s["q"][:150]}')
        print()

with open(os.path.join(data_dir, '..', 'general_analysis.txt'), 'w', encoding='utf-8') as f:
    for subj in sorted(general_samples.keys()):
        f.write(f'\n{"="*60}\n')
        f.write(f'=== {subj} === ({len(general_samples[subj])} general questions)\n')
        f.write(f'{"="*60}\n')
        chapters = chapter_names.get(subj, {})
        for cid, cname in chapters.items():
            f.write(f'  {cid}: {cname}\n')
        f.write('\n')
        for s in general_samples[subj]:
            f.write(f'  Q{s["id"]} ({s["year"]} {s["board"]}): {s["q"][:200]}\n\n')

print(f'\nTotal general questions by subject:')
for subj in sorted(general_samples.keys()):
    print(f'  {subj}: {len(general_samples[subj])}')
print(f'\nAnalysis written to general_analysis.txt')
