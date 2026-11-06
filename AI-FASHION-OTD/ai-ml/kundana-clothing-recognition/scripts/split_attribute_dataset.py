import csv
import os
from collections import Counter

BASE = r"dataset\fashionpedia\processed"

SPLIT_FILES = {
    "train": os.path.join(BASE, "train.csv"),
    "validation": os.path.join(BASE, "validation.csv"),
    "test": os.path.join(BASE, "test.csv")
}

SOURCE = os.path.join(BASE, "attribute_evaluation.csv")

# Map each original image ID to its split.
image_splits = {}
split_image_counts = Counter()

for split, path in SPLIT_FILES.items():
    with open(path, "r", encoding="utf-8-sig") as file:
        for row in csv.DictReader(file):
            image_id = row["image_id"]

            if image_id in image_splits and image_splits[image_id] != split:
                raise ValueError(
                    f"Image leakage detected: {image_id}"
                )

            image_splits[image_id] = split

    split_image_counts[split] = sum(
        1 for value in image_splits.values() if value == split
    )

# Prepare output files.
fields = [
    "crop_file",
    "image_id",
    "category",
    "attribute_type",
    "ground_truth"
]

outputs = {}
writers = {}

for split in SPLIT_FILES:
    path = os.path.join(BASE, f"attribute_{split}.csv")
    outputs[split] = open(path, "w", newline="", encoding="utf-8")
    writers[split] = csv.DictWriter(
        outputs[split],
        fieldnames=fields
    )
    writers[split].writeheader()

counts = Counter()
attribute_counts = Counter()
unmatched = 0

try:
    with open(SOURCE, "r", encoding="utf-8-sig") as file:
        for row in csv.DictReader(file):

            image_id = row["image_id"]
            split = image_splits.get(image_id)

            if split is None:
                unmatched += 1
                continue

            writers[split].writerow(row)
            counts[split] += 1
            attribute_counts[(split, row["attribute_type"])] += 1

finally:
    for output in outputs.values():
        output.close()

print("\nATTRIBUTE DATASET SPLIT REPORT")
print("=" * 45)

for split in SPLIT_FILES:
    print(f"\n{split.upper()}")
    print("Records:", counts[split])
    print("Sleeve:", attribute_counts[(split, "sleeve")])
    print("Neckline:", attribute_counts[(split, "neckline")])
    print("Original images:", split_image_counts[split])

print("\nUnmatched records:", unmatched)
print("Total records assigned:", sum(counts.values()))

print("\nCreated:")
for split in SPLIT_FILES:
    print(f"attribute_{split}.csv")

if unmatched:
    print("\nWARNING: Some records were not assigned to a split.")
else:
    print("\nAll attribute records assigned successfully.")
