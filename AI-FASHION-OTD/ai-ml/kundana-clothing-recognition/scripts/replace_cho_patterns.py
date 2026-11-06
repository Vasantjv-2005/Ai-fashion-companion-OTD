import os
import csv
import re
import shutil
import random
from collections import defaultdict
from PIL import Image

ROOT = "dataset/fashionpedia"
META = os.path.join(ROOT, "processed", "crop_metadata.csv")
VAL = os.path.join(ROOT, "processed", "validation.csv")
OUTPUT = os.path.join(ROOT, "share_with_cho")
PATTERN_DIR = os.path.join(OUTPUT, "02_patterns")
LABELS = os.path.join(OUTPUT, "sample_labels.csv")

random.seed(42)

# Read validation image IDs
with open(VAL, "r", encoding="utf-8-sig") as f:
    val_ids = {row["image_id"] for row in csv.DictReader(f)}

# Read metadata
with open(META, "r", encoding="utf-8-sig") as f:
    rows = list(csv.DictReader(f))

patterns = {
    "plain": re.compile(r"plain \(pattern\)", re.I),
    "floral": re.compile(r"\bfloral\b", re.I),
    "striped": re.compile(r"\bstripe\b", re.I),
    "checked": re.compile(r"\bcheck\b", re.I),
}

selected = []
used_images = set()

for pattern_name, pattern_regex in patterns.items():
    candidates = []

    for row in rows:
        if row["image_id"] not in val_ids:
            continue

        if not pattern_regex.search(row["attributes"]):
            continue

        crop_path = os.path.join(
            ROOT, "crops", row["crop_file"].replace("\\", os.sep)
        )

        if not os.path.isfile(crop_path):
            continue

        try:
            with Image.open(crop_path) as img:
                width, height = img.size
                area = width * height

            # Avoid tiny crops
            if width < 100 or height < 100:
                continue

            candidates.append((area, row, crop_path))
        except Exception:
            continue

    candidates.sort(key=lambda x: x[0], reverse=True)

    count = 0
    for area, row, crop_path in candidates:
        if row["image_id"] in used_images:
            continue

        selected.append((pattern_name, row, crop_path))
        used_images.add(row["image_id"])
        count += 1

        if count == 2:
            break

    print(f"{pattern_name}: {count} selected")

    if count < 2:
        raise RuntimeError(
            f"Not enough suitable validation samples for {pattern_name}"
        )

# Prepare replacement folder
os.makedirs(PATTERN_DIR, exist_ok=True)

for filename in os.listdir(PATTERN_DIR):
    path = os.path.join(PATTERN_DIR, filename)
    if os.path.isfile(path):
        os.remove(path)

new_labels = []

for index, (pattern_name, row, crop_path) in enumerate(selected, start=1):
    filename = f"sample_{index:02d}.jpg"
    destination = os.path.join(PATTERN_DIR, filename)

    shutil.copy2(crop_path, destination)

    new_row = dict(row)
    new_labels.append({
        "group": "02_patterns",
        "filename": filename,
        "crop_file": row["crop_file"],
        "image_id": row["image_id"],
        "original_file": row["original_file"],
        "correct_category": row["category"],
        "attributes": row["attributes"],
        "colour_label": "Not supplied; verify visually",
        "bbox": row["bbox"],
    })

# Preserve other sample labels
with open(LABELS, "r", encoding="utf-8-sig", newline="") as f:
    existing = list(csv.DictReader(f))
    fieldnames = list(existing[0].keys())

existing = [r for r in existing if r["group"] != "02_patterns"]
existing.extend(new_labels)

with open(LABELS, "w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(existing)

print("\nPattern samples replaced successfully.")
print("Other folders and their labels were preserved.")

