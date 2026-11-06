import csv
from collections import Counter
from pathlib import Path

BASE = Path("dataset/fashionpedia/processed")

with open(BASE / "simple_prompt_validation_predictions.csv",
          encoding="utf-8-sig") as f:
    predictions = list(csv.DictReader(f))

with open(BASE / "validation.csv",
          encoding="utf-8-sig") as f:
    validation = list(csv.DictReader(f))

prediction_map = {r["crop_file"]: r for r in predictions}

groups = {
    "Top predicted as vest": [],
    "Top predicted correctly": [],
    "Actual vest": []
}

for row in validation:
    pred = prediction_map.get(row["crop_file"])
    if not pred:
        continue

    actual = row["category"]
    predicted = pred["predicted"]

    if actual == "top, t-shirt, sweatshirt" and predicted == "vest":
        group = "Top predicted as vest"
    elif actual == "top, t-shirt, sweatshirt" and predicted == actual:
        group = "Top predicted correctly"
    elif actual == "vest":
        group = "Actual vest"
    else:
        continue

    attributes = [
        a.strip().lower()
        for a in row["attributes"].split("|")
        if a.strip()
    ]

    groups[group].append(attributes)

for group, records in groups.items():
    counts = Counter(
        attribute
        for attributes in records
        for attribute in attributes
    )

    print("\n" + "=" * 60)
    print(group)
    print("Images:", len(records))
    print("=" * 60)

    for attribute, count in counts.most_common(20):
        percentage = count / len(records) * 100
        print(f"{attribute:40} {count:5} ({percentage:.1f}%)")

