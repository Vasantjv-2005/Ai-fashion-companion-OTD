import csv
import re
import os
from PIL import Image

BASE = r"dataset\fashionpedia"
ANNOTATIONS = BASE + r"\processed\garment_annotations.csv"
OUTPUT = BASE + r"\crops"
CSV_OUTPUT = BASE + r"\processed\crop_metadata.csv"
IMAGE_DIR = BASE + r"\train"

os.makedirs(OUTPUT, exist_ok=True)

total = 0
saved = 0
skipped = 0

with open(ANNOTATIONS, "r", encoding="utf-8-sig") as file:
    reader = csv.DictReader(file)

    with open(CSV_OUTPUT, "w", newline="", encoding="utf-8") as csv_file:
        fields = [
            "crop_file",
            "image_id",
            "original_file",
            "category",
            "attributes",
            "bbox"
        ]

        writer = csv.DictWriter(csv_file, fieldnames=fields)
        writer.writeheader()

        for row in reader:
            total += 1

            values = re.findall(
                r"Decimal\('(-?\d+(?:\.\d+)?)'\)",
                row["bbox"]
            )

            if len(values) != 4:
                skipped += 1
                continue

            x, y, w, h = map(float, values)

            image_path = os.path.join(IMAGE_DIR, row["file_name"])
            category_folder = re.sub(
                r"[^a-zA-Z0-9]+", "_", row["category"]
            ).strip("_").lower()

            output_folder = os.path.join(OUTPUT, category_folder)
            os.makedirs(output_folder, exist_ok=True)

            try:
                with Image.open(image_path) as image:
                    image = image.convert("RGB")

                    left = round(x)
                    top = round(y)
                    right = round(x + w)
                    bottom = round(y + h)

                    if (
                        left < 0 or top < 0
                        or right > image.width
                        or bottom > image.height
                        or right <= left or bottom <= top
                    ):
                        skipped += 1
                        continue

                    crop = image.crop((left, top, right, bottom))

                    crop_name = (
                        f"{row['image_id']}_"
                        f"{row['annotation_id']}.jpg"
                    )

                    crop_path = os.path.join(
                        output_folder, crop_name
                    )

                    crop.save(crop_path, quality=95)

                writer.writerow({
                    "crop_file": os.path.relpath(crop_path, OUTPUT),
                    "image_id": row["image_id"],
                    "original_file": row["file_name"],
                    "category": row["category"],
                    "attributes": row["attributes"],
                    "bbox": row["bbox"]
                })

                saved += 1

            except (OSError, ValueError):
                skipped += 1

            if total % 5000 == 0:
                print(f"Processed {total}/77015 | Saved: {saved}")

print("\nGARMENT CROP GENERATION REPORT")
print("=" * 40)
print("Total annotations:", total)
print("Crops saved:", saved)
print("Skipped:", skipped)
print("Crop folder:", OUTPUT)
print("Metadata CSV:", CSV_OUTPUT)
