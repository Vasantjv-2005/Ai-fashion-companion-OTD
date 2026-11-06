import csv
from collections import Counter

path = r"dataset\fashionpedia\processed\crop_metadata.csv"

sleeve_labels = {
    "sleeveless",
    "short (length)",
    "elbow-length",
    "three quarter (length)",
    "wrist-length"
}

neckline_labels = {
    "collarless",
    "asymmetric (neckline)",
    "crew (neck)",
    "round (neck)",
    "v-neck",
    "surplice (neck)",
    "oval (neck)",
    "u-neck",
    "sweetheart (neckline)",
    "queen anne (neck)",
    "boat (neck)",
    "scoop (neck)",
    "square (neckline)",
    "plunging (neckline)",
    "keyhole (neck)",
    "halter (neck)",
    "crossover (neck)",
    "choker (neck)",
    "high (neck)",
    "turtle (neck)",
    "cowl (neck)",
    "straight across (neck)",
    "illusion (neck)",
    "off-the-shoulder",
    "one shoulder"
}

sleeves = Counter()
necklines = Counter()
total = 0

with open(path, "r", encoding="utf-8-sig") as file:
    for row in csv.DictReader(file):
        total += 1
        attributes = {
            x.strip().lower()
            for x in row["attributes"].split("|")
        }

        sleeves.update(attributes & sleeve_labels)
        necklines.update(attributes & neckline_labels)

print("Total garment crops:", total)

print("\nSLEEVE GROUND-TRUTH COUNTS")
for name, count in sleeves.most_common():
    print(f"{name}: {count}")

print("\nNECKLINE GROUND-TRUTH COUNTS")
for name, count in necklines.most_common():
    print(f"{name}: {count}")

print("\nCrops with sleeve labels:", sum(sleeves.values()))
print("Crops with neckline labels:", sum(necklines.values()))
