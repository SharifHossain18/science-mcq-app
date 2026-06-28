import os

base_dir = r"C:\Users\User\Desktop\Ai Claud\science-mcq-app\data"
found = 0
for root, dirs, files in os.walk(base_dir):
    for file in files:
        if file.endswith('.json'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'ℹ' in content:
                    print(f"Found in {path}")
                    found += 1
                    if found > 10:
                        break
    if found > 10:
        break

if found == 0:
    print("All JSON files in data/ are clean of ℹ")
else:
    print(f"Total files with info icon: {found}")
