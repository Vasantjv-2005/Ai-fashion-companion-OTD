import csv
from collections import Counter

path = r"dataset\fashionpedia\processed\crop_metadata.csv"

counts = Counter()

with open(path, "r", encoding="utf-8-sig") as file:
    for row in csv.DictReader(file):
        for attribute in row["attributes"].split(" | "):
            if any(word in attribute.lower()
                   for word in ["pattern", "stripe", "check", "plaid", "floral"]):
                counts[attribute.strip()] += 1

print("AVAILABLE PATTERN ATTRIBUTES")
print("=" * 50)

for name, count in counts.most_common():
    print(f"{name}: {count}")
