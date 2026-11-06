import csv
import re

path = r"dataset\fashionpedia\processed\garment_annotations.csv"

total = 0
valid = 0
invalid = 0

with open(path, "r", encoding="utf-8-sig") as file:
    for row in csv.DictReader(file):
        total += 1

        values = re.findall(
            r"Decimal\('(-?\d+(?:\.\d+)?)'\)",
            row["bbox"]
        )

        if len(values) == 4:
            x, y, width, height = map(float, values)

            if width > 0 and height > 0:
                valid += 1
            else:
                invalid += 1
        else:
            invalid += 1

print("\nBOUNDING BOX VALIDATION")
print("=" * 35)
print("Total:", total)
print("Valid:", valid)
print("Invalid:", invalid)
