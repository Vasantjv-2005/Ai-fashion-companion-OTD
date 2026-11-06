import csv
import os
from collections import Counter

SOURCE = r"dataset\fashionpedia\processed\crop_metadata_cleaned.csv"
OUTPUT = r"dataset\fashionpedia\processed\attribute_evaluation.csv"

sleeve_rows = []
neckline_rows = []

sleeve_categories = Counter()
neckline_categories = Counter()

with open(SOURCE, "r", encoding="utf-8-sig") as file:
    for row in csv.DictReader(file):

        category = row["category"]

        sleeve = [
            x.strip()
            for x in row["sleeve_attributes"].split("|")
            if x.strip()
        ]

        neckline = [
            x.strip()
            for x in row["neckline_attributes"].split("|")
            if x.strip()
        ]

        if len(sleeve) == 1:
            sleeve_rows.append({
                "crop_file": row["crop_file"],
                "image_id": row["image_id"],
                "category": category,
                "attribute_type": "sleeve",
                "ground_truth": sleeve[0]
            })
            sleeve_categories[category] += 1

        if len(neckline) == 1:
            neckline_rows.append({
                "crop_file": row["crop_file"],
                "image_id": row["image_id"],
                "category": category,
                "attribute_type": "neckline",
                "ground_truth": neckline[0]
            })
            neckline_categories[category] += 1

fields = [
    "crop_file",
    "image_id",
    "category",
    "attribute_type",
    "ground_truth"
]

with open(OUTPUT, "w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(file, fieldnames=fields)
    writer.writeheader()
    writer.writerows(sleeve_rows)
    writer.writerows(neckline_rows)

print("\nATTRIBUTE EVALUATION DATASET")
print("=" * 45)
print("Sleeve samples:", len(sleeve_rows))
print("Neckline samples:", len(neckline_rows))
print("Total evaluation records:", len(sleeve_rows) + len(neckline_rows))

print("\nSLEEVE CATEGORY COUNTS")
for name, count in sleeve_categories.most_common():
    print(name, ":", count)

print("\nNECKLINE CATEGORY COUNTS")
for name, count in neckline_categories.most_common():
    print(name, ":", count)

print("\nSaved:", OUTPUT)
