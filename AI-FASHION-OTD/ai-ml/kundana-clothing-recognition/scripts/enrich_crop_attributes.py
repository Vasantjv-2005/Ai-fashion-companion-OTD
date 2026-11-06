import csv
import re
import os
from collections import defaultdict, Counter

BASE = r"dataset\fashionpedia\processed"

ANNOTATIONS = os.path.join(BASE, "annotations.csv")
CROP_METADATA = os.path.join(BASE, "crop_metadata.csv")
OUTPUT = os.path.join(BASE, "crop_metadata_cleaned.csv")

OVERLAP_THRESHOLD = 0.50
MINIMUM_SCORE_MARGIN = 0.10

# Only these garment categories can receive sleeve or neckline labels.
VALID_GARMENTS = {
    "shirt, blouse",
    "top, t-shirt, sweatshirt",
    "sweater",
    "cardigan",
    "jacket",
    "vest",
    "coat",
    "dress",
    "jumpsuit",
    "cape"
}

SLEEVE_LENGTHS = {
    "sleeveless",
    "short (length)",
    "elbow-length",
    "three quarter (length)",
    "wrist-length"
}

NECKLINE_TYPES = {
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


def parse_bbox(value):
    numbers = re.findall(r"-?\d+(?:\.\d+)?", value)

    if len(numbers) < 4:
        return None

    x, y, w, h = map(float, numbers[:4])

    if w <= 0 or h <= 0:
        return None

    return (x, y, x + w, y + h)


def overlap_ratio(component, garment):
    x1 = max(component[0], garment[0])
    y1 = max(component[1], garment[1])
    x2 = min(component[2], garment[2])
    y2 = min(component[3], garment[3])

    if x2 <= x1 or y2 <= y1:
        return 0.0

    intersection = (x2 - x1) * (y2 - y1)

    component_area = (
        (component[2] - component[0]) *
        (component[3] - component[1])
    )

    return intersection / component_area


# Load garment crops.
garments_by_image = defaultdict(list)

with open(CROP_METADATA, "r", encoding="utf-8-sig") as file:
    for row in csv.DictReader(file):
        category = row["category"].strip().lower()

        if category not in VALID_GARMENTS:
            continue

        bbox = parse_bbox(row["bbox"])

        if bbox is None:
            continue

        garments_by_image[row["image_id"]].append({
            "row": row,
            "bbox": bbox,
            "sleeve": set(),
            "neckline": set()
        })


# Load only relevant sleeve and neckline labels.
components_by_image = defaultdict(list)
ignored_labels = Counter()

with open(ANNOTATIONS, "r", encoding="utf-8-sig") as file:
    for row in csv.DictReader(file):
        category = row["category"].strip().lower()

        if category not in {"sleeve", "neckline"}:
            continue

        allowed = (
            SLEEVE_LENGTHS if category == "sleeve"
            else NECKLINE_TYPES
        )

        attributes = {
            item.strip().lower()
            for item in row["attributes"].split("|")
            if item.strip()
        }

        valid_attributes = attributes & allowed

        for item in attributes - allowed:
            ignored_labels[(category, item)] += 1

        if not valid_attributes:
            continue

        bbox = parse_bbox(row["bbox"])

        if bbox is None:
            continue

        components_by_image[row["image_id"]].append({
            "category": category,
            "attributes": valid_attributes,
            "bbox": bbox
        })


matched = Counter()
unmatched = Counter()
ambiguous = Counter()
low_overlap = Counter()
no_garment = Counter()

# Match component annotations to garment crops.
for image_id, components in components_by_image.items():

    garments = garments_by_image.get(image_id, [])

    for component in components:

        if not garments:
            no_garment[component["category"]] += 1
            continue

        scores = [
            overlap_ratio(component["bbox"], garment["bbox"])
            for garment in garments
        ]

        ranked = sorted(scores, reverse=True)
        best_score = ranked[0]

        if best_score < OVERLAP_THRESHOLD:
            low_overlap[component["category"]] += 1
            unmatched[component["category"]] += 1
            continue

        second_score = ranked[1] if len(ranked) > 1 else 0.0

        if best_score - second_score < MINIMUM_SCORE_MARGIN:
            ambiguous[component["category"]] += 1
            unmatched[component["category"]] += 1
            continue

        best_index = scores.index(best_score)
        target = garments[best_index]

        target[component["category"]].update(
            component["attributes"]
        )

        matched[component["category"]] += 1


# Save cleaned metadata.
sleeve_counts = Counter()
neckline_counts = Counter()

sleeve_crop_count = 0
neckline_crop_count = 0
both_crop_count = 0
category_stats = defaultdict(Counter)
total_crops = 0

with open(OUTPUT, "w", newline="", encoding="utf-8") as file:

    fields = [
        "crop_file",
        "image_id",
        "original_file",
        "category",
        "attributes",
        "sleeve_attributes",
        "neckline_attributes",
        "bbox"
    ]

    writer = csv.DictWriter(file, fieldnames=fields)
    writer.writeheader()

    for garments in garments_by_image.values():

        for garment in garments:
            row = garment["row"]

            sleeve = sorted(garment["sleeve"])
            neckline = sorted(garment["neckline"])

            total_crops += 1

            if sleeve:
                sleeve_crop_count += 1
                category_stats[row["category"]]["sleeve"] += 1
                sleeve_counts.update(sleeve)

            if neckline:
                neckline_crop_count += 1
                category_stats[row["category"]]["neckline"] += 1
                neckline_counts.update(neckline)

            if sleeve and neckline:
                both_crop_count += 1

            writer.writerow({
                "crop_file": row["crop_file"],
                "image_id": row["image_id"],
                "original_file": row["original_file"],
                "category": row["category"],
                "attributes": row["attributes"],
                "sleeve_attributes": " | ".join(sleeve),
                "neckline_attributes": " | ".join(neckline),
                "bbox": row["bbox"]
            })


print("\nCLEAN ATTRIBUTE MATCHING REPORT")
print("=" * 50)
print("Total garment crops:", total_crops)

print("\nSLEEVE ANNOTATIONS")
print("Matched:", matched["sleeve"])
print("Ambiguous rejected:", ambiguous["sleeve"])
print("Low-overlap rejected:", low_overlap["sleeve"])
print("No garment found:", no_garment["sleeve"])

print("\nNECKLINE ANNOTATIONS")
print("Matched:", matched["neckline"])
print("Ambiguous rejected:", ambiguous["neckline"])
print("Low-overlap rejected:", low_overlap["neckline"])
print("No garment found:", no_garment["neckline"])

print("\nCROP ATTRIBUTE COVERAGE")
print("Sleeve crops:", sleeve_crop_count)
print("Neckline crops:", neckline_crop_count)
print("Both attributes:", both_crop_count)

print("\nCATEGORY-WISE COVERAGE")
for category, counts in sorted(category_stats.items()):
    print(
        category,
        "| sleeve:", counts["sleeve"],
        "| neckline:", counts["neckline"]
    )

print("\nSLEEVE LENGTH COUNTS")
for name, count in sleeve_counts.most_common():
    print(name, ":", count)

print("\nNECKLINE TYPE COUNTS")
for name, count in neckline_counts.most_common():
    print(name, ":", count)

print("\nIgnored unrelated labels:", sum(ignored_labels.values()))
print("Saved cleaned dataset:", OUTPUT)
