import csv
import os

output = r"dataset\fashionpedia\processed"
os.makedirs(output, exist_ok=True)

garments = [
    "shirt, blouse",
    "top, t-shirt, sweatshirt",
    "sweater",
    "cardigan",
    "jacket",
    "vest",
    "pants",
    "shorts",
    "skirt",
    "coat",
    "dress",
    "jumpsuit",
    "cape"
]

parts = [
    "collar",
    "lapel",
    "epaulette",
    "sleeve",
    "pocket",
    "neckline",
    "hood"
]

accessories = [
    "glasses",
    "hat",
    "headband, head covering, hair accessory",
    "tie",
    "glove",
    "watch",
    "belt",
    "shoe",
    "bag, wallet",
    "scarf",
    "sock",
    "tights, stockings"
]

path = os.path.join(output, "category_mapping.csv")

with open(path, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["fashionpedia_category", "otd_group"])

    for item in garments:
        writer.writerow([item, "garment"])

    for item in parts:
        writer.writerow([item, "clothing_part"])

    for item in accessories:
        writer.writerow([item, "accessory"])

print("Category mapping created!")
print("Garments:", len(garments))
print("Clothing parts:", len(parts))
print("Accessories:", len(accessories))
print("Saved:", path)
