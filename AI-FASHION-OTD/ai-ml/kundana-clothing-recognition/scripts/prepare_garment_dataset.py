import csv
import os
from collections import Counter

BASE = r"dataset\fashionpedia\processed"

ANNOTATIONS = os.path.join(BASE, "annotations.csv")
MAPPING = os.path.join(BASE, "category_mapping.csv")
OUTPUT = os.path.join(BASE, "garment_annotations.csv")

# Load garment categories
garment_categories = set()

with open(MAPPING, "r", encoding="utf-8-sig") as file:
    for row in csv.DictReader(file):
        if row["otd_group"] == "garment":
            garment_categories.add(row["fashionpedia_category"])

category_counts = Counter()
unique_images = set()
total = 0

# Filter garment annotations
with open(ANNOTATIONS, "r", encoding="utf-8-sig") as source:
    reader = csv.DictReader(source)

    with open(OUTPUT, "w", newline="", encoding="utf-8") as destination:
        fields = [
            "annotation_id",
            "image_id",
            "file_name",
            "category",
            "attributes",
            "bbox"
        ]

        writer = csv.DictWriter(destination, fieldnames=fields)
        writer.writeheader()

        for row in reader:
            if row["category"] not in garment_categories:
                continue

            writer.writerow({
                key: row[key] for key in fields
            })

            total += 1
            category_counts[row["category"]] += 1
            unique_images.add(row["file_name"])

print("\nGARMENT DATASET REPORT")
print("=" * 45)
print("Garment annotations:", total)
print("Unique images containing garments:", len(unique_images))
print("Garment categories:", len(category_counts))

print("\nCATEGORY DISTRIBUTION:")

for category, count in category_counts.most_common():
    print(f"{category}: {count}")

print("\nSaved:", OUTPUT)
print("\nGarment dataset preparation completed!")
