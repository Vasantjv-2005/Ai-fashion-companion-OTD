import csv
import os
import random
from collections import defaultdict, Counter

BASE = r"dataset\fashionpedia\processed"

INPUT = os.path.join(BASE, "crop_metadata.csv")

random.seed(42)

groups = defaultdict(list)

with open(INPUT, "r", encoding="utf-8-sig") as file:
    for row in csv.DictReader(file):
        groups[row["image_id"]].append(row)

image_ids = sorted(groups.keys())
random.shuffle(image_ids)

total = len(image_ids)

train_end = int(total * 0.80)
val_end = int(total * 0.90)

splits = {
    "train": image_ids[:train_end],
    "validation": image_ids[train_end:val_end],
    "test": image_ids[val_end:]
}

for split_name, ids in splits.items():
    output = os.path.join(BASE, split_name + ".csv")
    rows = [row for image_id in ids for row in groups[image_id]]

    with open(output, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    print(f"\n{split_name.upper()}")
    print("Images:", len(ids))
    print("Crops:", len(rows))
    print("Categories:", len(set(row["category"] for row in rows)))
    print("Saved:", output)

# Check for image leakage
sets = {name: set(ids) for name, ids in splits.items()}

overlap = (
    sets["train"] & sets["validation"]
    | sets["train"] & sets["test"]
    | sets["validation"] & sets["test"]
)

print("\nSPLIT VALIDATION")
print("=" * 35)
print("Total unique images:", total)
print("Image overlap:", len(overlap))
print("Total crops:", sum(len(v) for v in groups.values()))

if not overlap:
    print("SUCCESS: No image leakage detected!")
else:
    print("ERROR: Image overlap detected!")
