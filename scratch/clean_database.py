import json
import re
import os

base_dir = r"C:\Users\User\Desktop\Ai Claud\science-mcq-app"
data_json_bak_path = os.path.join(base_dir, "data.json.bak")
data_cq_json_path = os.path.join(base_dir, "data_cq.json")

def clean_file(file_path):
    print(f"Reading {file_path}...")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Use regex to find all "chapter": "..." and remove " ℹ️" or "ℹ️" or " ℹ" or "ℹ"
    # We want to replace " ℹ️" or "ℹ️" with "" (nothing) inside the chapter string.
    # Note: ℹ is \u2139, ️ is \ufe0f (variation selector).
    print("Removing info icons from chapter fields...")
    cleaned = re.sub(r'("chapter"\s*:\s*"[^"]*)(?:\s*ℹ️|\s*ℹ|ℹ️|ℹ)([^"]*")', r'\1\2', content)
    
    print(f"Writing {file_path}...")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(cleaned)
    print("Done.")

clean_file(data_json_bak_path)
clean_file(data_cq_json_path)
