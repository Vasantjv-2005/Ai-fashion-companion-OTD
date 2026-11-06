import os
import csv
import ijson
from collections import Counter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

JSON_PATH = os.path.join(
    BASE_DIR, "dataset", "fashionpedia",
    "annotations", "instances_attributes_train2020.json"
)

IMAGE_DIR = os.path.join(
    BASE_DIR, "dataset", "fashionpedia", "train"
)

OUTPUT_DIR = os.path.join(
    BASE_DIR, "dataset", "fashionpedia", "processed"
)

os.makedirs(OUTPUT_DIR, exist_ok=True)

print("\nFASHIONPEDIA DATA PROCESSING")
print("=" * 50)

# 1. Load category and attribute definitions
with open(JSON_PATH, "rb") as file:
    categories = list(ijson.items(file, "categories.item"))

with open(JSON_PATH, "rb") as file:
    attributes = list(ijson.items(file, "attributes.item"))

category_map = {
    item["id"]: item["name"] for item in categories
}

attribute_map = {
    item["id"]: item["name"] for item in attributes
}

print("Categories loaded:", len(category_map))
print("Attributes loaded:", len(attribute_map))

# 2. Load image information
image_map = {}

with open(JSON_PATH, "rb") as file:
    for image in ijson.items(file, "images.item"):
        image_map[image["id"]] = image

print("Images in JSON:", len(image_map))

# 3. Check actual image files
actual_images = set(os.listdir(IMAGE_DIR))

matched_images = 0
missing_images = 0

for image in image_map.values():
    if image["file_name"] in actual_images:
        matched_images += 1
    else:
        missing_images += 1

print("Matched images:", matched_images)
print("Missing images:", missing_images)

# 4. Export image metadata
images_csv = os.path.join(OUTPUT_DIR, "images.csv")

with open(images_csv, "w", newline="", encoding="utf-8") as file:
    writer = csv.writer(file)

    writer.writerow([
        "image_id", "file_name", "width", "height"
    ])

    for image in image_map.values():
        writer.writerow([
            image["id"],
            image["file_name"],
            image.get("width"),
            image.get("height")
        ])

# 5. Export annotation information
annotations_csv = os.path.join(
    OUTPUT_DIR, "annotations.csv"
)

category_counts = Counter()
attribute_counts = Counter()
annotation_count = 0
unmatched_annotations = 0

with open(annotations_csv, "w", newline="", encoding="utf-8") as file:
    writer = csv.writer(file)

    writer.writerow([
        "annotation_id",
        "image_id",
        "file_name",
        "category",
        "attributes",
        "bbox"
    ])

    with open(JSON_PATH, "rb") as json_file:

        for annotation in ijson.items(
            json_file, "annotations.item"
        ):

            annotation_count += 1

            image_id = annotation["image_id"]
            image = image_map.get(image_id)

            if image is None:
                unmatched_annotations += 1
                continue

            category_id = annotation["category_id"]

            category = category_map.get(
                category_id, "Unknown"
            )

            attribute_ids = annotation.get(
                "attribute_ids", []
            )

            attribute_names = [
                attribute_map.get(aid, "Unknown")
                for aid in attribute_ids
            ]

            category_counts[category] += 1

            for attribute in attribute_names:
                attribute_counts[attribute] += 1

            writer.writerow([
                annotation.get("id"),
                image_id,
                image["file_name"],
                category,
                " | ".join(attribute_names),
                annotation.get("bbox", [])
            ])

print("\nPROCESSING REPORT")
print("=" * 50)

print("Total images:", len(image_map))
print("Matched images:", matched_images)
print("Missing images:", missing_images)
print("Total annotations:", annotation_count)
print("Unmatched annotations:", unmatched_annotations)

print("\nTOP 10 CATEGORIES:")

for name, count in category_counts.most_common(10):
    print(name, ":", count)

print("\nTOP 10 ATTRIBUTES:")

for name, count in attribute_counts.most_common(10):
    print(name, ":", count)

print("\nOUTPUT FILES:")
print(images_csv)
print(annotations_csv)

print("\nFashionpedia processing completed!")
