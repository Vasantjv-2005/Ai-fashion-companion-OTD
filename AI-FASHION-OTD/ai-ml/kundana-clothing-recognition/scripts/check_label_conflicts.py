import csv
from collections import Counter

path = r"dataset\fashionpedia\processed\crop_metadata_cleaned.csv"

sleeve_conflicts = []
neckline_conflicts = []

sleeve_counts = Counter()
neckline_counts = Counter()

with open(path, "r", encoding="utf-8-sig") as file:
    for row in csv.DictReader(file):

        sleeve = [
            x.strip() for x in row["sleeve_attributes"].split("|")
            if x.strip()
        ]

        neckline = [
            x.strip() for x in row["neckline_attributes"].split("|")
            if x.strip()
        ]

        sleeve_counts[len(sleeve)] += 1
        neckline_counts[len(neckline)] += 1

        if len(sleeve) > 1:
            sleeve_conflicts.append((row["crop_file"], sleeve))

        if len(neckline) > 1:
            neckline_conflicts.append((row["crop_file"], neckline))

print("SLEEVE LABEL DISTRIBUTION")
for count, total in sorted(sleeve_counts.items()):
    print(f"{count} labels: {total} crops")

print("\nNECKLINE LABEL DISTRIBUTION")
for count, total in sorted(neckline_counts.items()):
    print(f"{count} labels: {total} crops")

print("\nMULTIPLE SLEEVE LABELS:", len(sleeve_conflicts))
for item in sleeve_conflicts[:10]:
    print(item)

print("\nMULTIPLE NECKLINE LABELS:", len(neckline_conflicts))
for item in neckline_conflicts[:10]:
    print(item)
