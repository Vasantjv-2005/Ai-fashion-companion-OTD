import os
import csv
import random
import shutil
import zipfile
from collections import defaultdict

BASE = r"dataset\fashionpedia"
META = BASE + r"\processed\crop_metadata.csv"
VALIDATION = BASE + r"\processed\validation.csv"
CROP_DIR = BASE + r"\crops"
ORIGINAL_DIR = BASE + r"\train"

OUTPUT = BASE + r"\share_with_cho"
ZIP_PATH = BASE + r"\Fashionpedia_Samples_for_Cho.zip"

random.seed(42)

if os.path.exists(OUTPUT):
    shutil.rmtree(OUTPUT)

os.makedirs(OUTPUT)

with open(META, encoding="utf-8-sig") as f:
    metadata = list(csv.DictReader(f))

with open(VALIDATION, encoding="utf-8-sig") as f:
    validation = list(csv.DictReader(f))

valid_files = {r["crop_file"].replace("/", "\\") for r in validation}
rows = [
    r for r in metadata
    if r["crop_file"].replace("/", "\\") in valid_files
]

used = set()
manifest = []
counters = defaultdict(int)

def add_crop(row, group):
    source = os.path.join(CROP_DIR, row["crop_file"])
    if not os.path.isfile(source):
        return False

    counters[group] += 1
    folder = os.path.join(OUTPUT, group)
    os.makedirs(folder, exist_ok=True)

    filename = f"sample_{counters[group]:02d}.jpg"
    shutil.copy2(source, os.path.join(folder, filename))

    manifest.append({
        "group": group,
        "filename": filename,
        "crop_file": row["crop_file"],
        "image_id": row["image_id"],
        "original_file": row["original_file"],
        "correct_category": row["category"],
        "attributes": row["attributes"],
        "colour_label": "Not supplied; verify visually",
        "bbox": row["bbox"]
    })

    used.add(row["crop_file"])
    return True

def select(group, condition, limit):
    candidates = [
        r for r in rows
        if r["crop_file"] not in used and condition(r)
    ]
    random.shuffle(candidates)

    count = 0
    for row in candidates:
        if count >= limit:
            break
        if add_crop(row, group):
            count += 1

    print(f"{group}: {count} selected")
    return count

# 1. Basic clothing
group = "01_basic_clothing"
select(group, lambda r: r["category"] == "shirt, blouse", 2)
select(group, lambda r: r["category"] == "top, t-shirt, sweatshirt", 2)
select(group, lambda r: r["category"] == "pants"
       and "jeans" in r["attributes"].lower(), 2)
select(group, lambda r: r["category"] == "pants"
       and "jeans" not in r["attributes"].lower(), 2)

# 2. Patterns: use exact Fashionpedia attribute names
group = "02_patterns"
select(group, lambda r: "plain (pattern)" in r["attributes"].lower(), 2)
select(group, lambda r: "floral" in r["attributes"].lower(), 2)
select(group, lambda r: "stripe" in r["attributes"].lower(), 2)
select(group, lambda r: "check" in r["attributes"].lower(), 2)

# 3. Clothing types
group = "03_clothing_types"
for category in [
    "dress", "skirt", "jacket", "top, t-shirt, sweatshirt"
]:
    select(group, lambda r, c=category: r["category"] == c, 2)

# 4. Colour candidates - these need manual visual verification
select("04_colour_candidates", lambda r: True, 12)

# 5. Original images with multiple annotated garment categories
by_image = defaultdict(list)
for row in rows:
    by_image[row["image_id"]].append(row)

candidates = [
    (image_id, items)
    for image_id, items in by_image.items()
    if len(set(r["category"] for r in items)) >= 2
]
random.shuffle(candidates)

group = "05_difficult_cases"
folder = os.path.join(OUTPUT, group)
os.makedirs(folder, exist_ok=True)

multiple_count = 0
for image_id, items in candidates:
    if multiple_count >= 3:
        break

    original = items[0]["original_file"]
    source = os.path.join(ORIGINAL_DIR, original)
    if not os.path.isfile(source):
        continue

    filename = f"multiple_{multiple_count + 1}.jpg"
    shutil.copy2(source, os.path.join(folder, filename))

    manifest.append({
        "group": group,
        "filename": filename,
        "crop_file": "",
        "image_id": image_id,
        "original_file": original,
        "correct_category": " | ".join(
            sorted(set(r["category"] for r in items))
        ),
        "attributes": " | ".join(sorted(set(
            a for r in items for a in r["attributes"].split(" | ")
        ))),
        "colour_label": "Not supplied; verify visually",
        "bbox": "See source annotations"
    })
    multiple_count += 1

print("Multiple-garment original images:", multiple_count)

# 6. Garment crops touching original image boundaries
import re
from PIL import Image

partial_count = 0

for row in rows:
    if partial_count >= 3:
        break

    values = [
        float(x) for x in re.findall(
            r"-?\d+(?:\.\d+)?", row["bbox"]
        )
    ]
    if len(values) != 4:
        continue

    x, y, w, h = values
    source = os.path.join(ORIGINAL_DIR, row["original_file"])

    try:
        with Image.open(source) as img:
            width, height = img.size
    except OSError:
        continue

    if (x <= 3 or y <= 3 or
        x + w >= width - 3 or y + h >= height - 3):
        if add_crop(row, group):
            partial_count += 1

print("Edge-touching garment candidates:", partial_count)

# Save manifest
csv_path = os.path.join(OUTPUT, "sample_labels.csv")
with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
    writer = csv.DictWriter(f, fieldnames=list(manifest[0].keys()))
    writer.writeheader()
    writer.writerows(manifest)

# Rebuild ZIP
if os.path.exists(ZIP_PATH):
    os.remove(ZIP_PATH)

with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as archive:
    for root, dirs, files in os.walk(OUTPUT):
        for filename in files:
            path = os.path.join(root, filename)
            archive.write(path, os.path.relpath(path, OUTPUT))

print("\nPACKAGE REBUILT")
print("Total labelled samples:", len(manifest))
print("ZIP:", ZIP_PATH)
