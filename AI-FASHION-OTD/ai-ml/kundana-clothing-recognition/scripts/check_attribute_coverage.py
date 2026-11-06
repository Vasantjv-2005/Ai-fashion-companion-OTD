import csv
from collections import Counter, defaultdict

path = r"dataset\fashionpedia\processed\crop_metadata_enriched.csv"

total = 0
sleeve_crops = 0
neckline_crops = 0
both_crops = 0

category_stats = defaultdict(Counter)

with open(path, "r", encoding="utf-8-sig") as file:
    for row in csv.DictReader(file):
        total += 1

        category = row["category"]

        sleeve = row["sleeve_attributes"].strip()
        neckline = row["neckline_attributes"].strip()

        has_sleeve = bool(sleeve)
        has_neckline = bool(neckline)

        if has_sleeve:
            sleeve_crops += 1
            category_stats[category]["sleeve"] += 1

        if has_neckline:
            neckline_crops += 1
            category_stats[category]["neckline"] += 1

        if has_sleeve and has_neckline:
            both_crops += 1

print("CROP ATTRIBUTE COVERAGE")
print("=" * 45)
print("Total crops:", total)
print("Crops with sleeve attributes:", sleeve_crops)
print("Crops with neckline attributes:", neckline_crops)
print("Crops with both:", both_crops)

print("\nCATEGORY-WISE COVERAGE")
for category, counts in sorted(category_stats.items()):
    print(
        category,
        "| sleeve:", counts["sleeve"],
        "| neckline:", counts["neckline"]
    )
