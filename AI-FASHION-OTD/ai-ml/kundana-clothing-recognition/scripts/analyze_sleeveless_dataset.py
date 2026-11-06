import csv
from collections import Counter, defaultdict

path = "dataset/fashionpedia/processed/crop_metadata_cleaned.csv"

category_counts = Counter()
sleeveless_counts = Counter()
sleeve_counts = Counter()

total = 0
sleeveless_total = 0

with open(path, encoding="utf-8-sig") as file:
    for row in csv.DictReader(file):

        category = row["category"]
        sleeve = row["sleeve_attributes"].strip().lower()

        total += 1
        category_counts[category] += 1

        if sleeve:
            sleeve_counts[sleeve] += 1

        if sleeve == "sleeveless":
            sleeveless_counts[category] += 1
            sleeveless_total += 1

print("\n===== DATASET SUMMARY =====")
print("Total garment crops:", total)
print("Sleeveless crops:", sleeveless_total)

print("\n===== SLEEVELESS BY CATEGORY =====")

for category, count in sleeveless_counts.most_common():
    percentage = count / category_counts[category] * 100
    print(
        f"{category}: {count} / {category_counts[category]} "
        f"({percentage:.2f}%)"
    )

print("\n===== ALL SLEEVE ATTRIBUTE LABELS =====")

for label, count in sleeve_counts.most_common():
    print(f"{label}: {count}")
