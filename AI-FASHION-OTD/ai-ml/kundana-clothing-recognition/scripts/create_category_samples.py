import csv
import os
import random
from PIL import Image, ImageDraw

random.seed(42)

metadata_path = "dataset/fashionpedia/processed/crop_metadata.csv"
crop_root = "dataset/fashionpedia/crops"
output_path = "outputs/fashionpedia_category_samples.jpg"

categories = [
    "vest",
    "top, t-shirt, sweatshirt",
    "shirt, blouse"
]

folder_names = {
    "vest": "vest",
    "top, t-shirt, sweatshirt": "top_t_shirt_sweatshirt",
    "shirt, blouse": "shirt_blouse"
}

samples = {category: [] for category in categories}

with open(metadata_path, encoding="utf-8-sig") as file:
    for row in csv.DictReader(file):
        category = row["category"]

        if category in samples:
            samples[category].append(row["crop_file"])

for category in categories:
    samples[category] = random.sample(
        samples[category],
        min(12, len(samples[category]))
    )

thumb_w, thumb_h = 170, 210
cell_h = 245
columns = 6
rows = 6

sheet = Image.new(
    "RGB",
    (columns * thumb_w, rows * cell_h),
    "white"
)

draw = ImageDraw.Draw(sheet)

position = 0

for category in categories:
    for crop_file in samples[category]:

        path = os.path.join(crop_root, crop_file)

        image = Image.open(path).convert("RGB")
        image.thumbnail((thumb_w - 12, thumb_h - 35))

        x = (position % columns) * thumb_w
        y = (position // columns) * cell_h

        sheet.paste(image, (x + (thumb_w-image.width)//2, y))

        draw.text(
            (x + 5, y + thumb_h),
            category[:25],
            fill="black"
        )

        position += 1

os.makedirs("outputs", exist_ok=True)
sheet.save(output_path)

print("Contact sheet saved:", output_path)
print("Total samples:", position)
