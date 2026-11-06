import csv
from collections import Counter

path = "dataset/fashionpedia/processed/crop_metadata.csv"

counts = Counter()

with open(path, encoding="utf-8-sig") as f:
    for row in csv.DictReader(f):
        counts[row["category"]] += 1

print("\n===== RELEVANT FASHIONPEDIA CATEGORIES =====")

for category in [
    "shirt, blouse",
    "top, t-shirt, sweatshirt",
    "vest",
    "sweater",
    "cardigan"
]:
    print(f"{category}: {counts[category]} crops")
