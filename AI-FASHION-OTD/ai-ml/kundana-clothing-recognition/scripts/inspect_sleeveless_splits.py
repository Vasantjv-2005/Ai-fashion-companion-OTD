import csv
from collections import Counter

base = "dataset/fashionpedia/processed/"

splits = {
    "Train": "train.csv",
    "Validation": "validation.csv",
    "Test": "test.csv"
}

image_splits = {}

for name, filename in splits.items():
    with open(base + filename, encoding="utf-8-sig") as f:
        image_splits[name] = {
            row["image_id"] for row in csv.DictReader(f)
        }

counts = {
    name: Counter()
    for name in splits
}

with open(base + "crop_metadata_cleaned.csv",
          encoding="utf-8-sig") as f:

    for row in csv.DictReader(f):
        image_id = row["image_id"]
        sleeve = row["sleeve_attributes"].lower()

        if "sleeveless" not in sleeve:
            continue

        for name, ids in image_splits.items():
            if image_id in ids:
                counts[name]["total"] += 1

                if sleeve == "sleeveless":
                    counts[name]["exclusive"] += 1

                counts[name][row["category"]] += 1
                break

for name, counter in counts.items():
    print(f"\n===== {name.upper()} =====")
    print("All sleeveless annotations:", counter["total"])
    print("Exclusive sleeveless labels:", counter["exclusive"])

    for category, count in counter.most_common():
        if category not in ("total", "exclusive"):
            print(category, ":", count)
