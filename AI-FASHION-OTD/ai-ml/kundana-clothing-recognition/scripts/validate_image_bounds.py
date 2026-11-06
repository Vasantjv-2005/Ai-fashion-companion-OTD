import csv
import re
import os
from PIL import Image
from collections import Counter

BASE = r"dataset\fashionpedia"
ANNOTATIONS = BASE + r"\processed\garment_annotations.csv"
IMAGE_DIR = BASE + r"\train"

dimensions = {}
total = valid = invalid = missing = 0
errors = Counter()

with open(ANNOTATIONS, "r", encoding="utf-8-sig") as file:
    reader = csv.DictReader(file)

    for row in reader:
        total += 1

        values = re.findall(
            r"Decimal\('(-?\d+(?:\.\d+)?)'\)",
            row["bbox"]
        )

        if len(values) != 4:
            invalid += 1
            errors["Invalid format"] += 1
            continue

        x, y, w, h = map(float, values)
        filename = row["file_name"]

        if filename not in dimensions:
            image_path = os.path.join(IMAGE_DIR, filename)

            try:
                with Image.open(image_path) as image:
                    dimensions[filename] = image.size
            except (FileNotFoundError, OSError):
                dimensions[filename] = None

        size = dimensions[filename]

        if size is None:
            missing += 1
            errors["Missing or unreadable image"] += 1
            continue

        image_width, image_height = size

        if (
            x >= 0 and y >= 0
            and w > 0 and h > 0
            and x + w <= image_width
            and y + h <= image_height
        ):
            valid += 1
        else:
            invalid += 1
            errors["Outside image boundaries"] += 1

        if total % 10000 == 0:
            print(f"Checked {total}/{77015} annotations...")

print("\nIMAGE BOUNDING BOX VALIDATION")
print("=" * 40)
print("Total annotations:", total)
print("Unique images checked:", len(dimensions))
print("Valid boxes:", valid)
print("Invalid boxes:", invalid)
print("Missing images:", missing)
print("Issues:", dict(errors))
