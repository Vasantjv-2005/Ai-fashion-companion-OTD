import csv
from collections import Counter

path = r"dataset\fashionpedia\processed\annotations.csv"

categories = Counter()
sleeve_attributes = Counter()
neckline_attributes = Counter()

with open(path, "r", encoding="utf-8-sig") as file:
    for row in csv.DictReader(file):
        category = row["category"].strip().lower()
        categories[category] += 1

        attributes = [
            x.strip()
            for x in row["attributes"].split("|")
            if x.strip()
        ]

        if category == "sleeve":
            sleeve_attributes.update(attributes)

        elif category == "neckline":
            neckline_attributes.update(attributes)

print("ANNOTATION CATEGORY COUNTS")
for name, count in categories.most_common():
    print(f"{name}: {count}")

print("\nSLEEVE ATTRIBUTES")
for name, count in sleeve_attributes.most_common():
    print(f"{name}: {count}")

print("\nNECKLINE ATTRIBUTES")
for name, count in neckline_attributes.most_common():
    print(f"{name}: {count}")

