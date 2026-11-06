import os
import csv
import torch
from collections import defaultdict

from PIL import Image
from transformers import CLIPModel, CLIPProcessor

MODEL_NAME = "patrickjohncyh/fashion-clip"

BASE = r"dataset\fashionpedia"
CSV_PATH = BASE + r"\processed\validation.csv"
CROP_DIR = BASE + r"\crops"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
BATCH_SIZE = 8

prompts = {
    "shirt, blouse": [
        "a photo of a collared shirt or blouse",
        "a photo of a button front shirt",
        "a photo of a women's blouse"
    ],
    "top, t-shirt, sweatshirt": [
        "a photo of a casual t-shirt",
        "a photo of a sweatshirt or hoodie",
        "a photo of a casual upper body top"
    ],
    "sweater": [
        "a photo of a knitted sweater",
        "a photo of a pullover sweater"
    ],
    "cardigan": [
        "a photo of an open front cardigan",
        "a photo of a button front knitted cardigan"
    ],
    "jacket": [
        "a photo of a short outerwear jacket",
        "a photo of a casual jacket"
    ],
    "vest": [
        "a photo of a sleeveless vest",
        "a photo of a waistcoat"
    ],
    "pants": [
        "a photo of long trousers",
        "a photo of full length pants"
    ],
    "shorts": [
        "a photo of short trousers",
        "a photo of knee length shorts"
    ],
    "skirt": [
        "a photo of a separate skirt",
        "a photo of a women's skirt"
    ],
    "coat": [
        "a photo of a long outerwear coat",
        "a photo of a winter coat"
    ],
    "dress": [
        "a photo of a one piece dress",
        "a photo of a full length or short dress"
    ],
    "jumpsuit": [
        "a photo of a one piece jumpsuit",
        "a photo of a garment with connected top and trousers"
    ],
    "cape": [
        "a photo of a cape",
        "a photo of a sleeveless flowing outer garment"
    ]
}

print("Loading FashionCLIP...")
processor = CLIPProcessor.from_pretrained(MODEL_NAME)
model = CLIPModel.from_pretrained(MODEL_NAME).to(DEVICE)
model.eval()

# Flatten descriptions and remember their categories
texts = []
text_categories = []

for category, descriptions in prompts.items():
    for description in descriptions:
        texts.append(description)
        text_categories.append(category)

with open(CSV_PATH, "r", encoding="utf-8-sig") as file:
    data = list(csv.DictReader(file))

print("Validation crops:", len(data))

stats = defaultdict(lambda: [0, 0])
processed = 0
skipped = 0

for start in range(0, len(data), BATCH_SIZE):

    batch = data[start:start + BATCH_SIZE]
    images = []
    rows = []

    for row in batch:
        path = os.path.join(CROP_DIR, row["crop_file"])

        try:
            with Image.open(path) as image:
                images.append(image.convert("RGB"))
            rows.append(row)
        except (OSError, ValueError):
            skipped += 1

    if not images:
        continue

    inputs = processor(
        text=texts,
        images=images,
        return_tensors="pt",
        padding=True
    )

    inputs = {
        key: value.to(DEVICE)
        for key, value in inputs.items()
    }

    with torch.no_grad():
        outputs = model(**inputs)
        scores = outputs.logits_per_image

        # Average the scores of prompts belonging to each category
        category_scores = []

        for category in prompts:
            indices = [
                i for i, name in enumerate(text_categories)
                if name == category
            ]

            category_scores.append(scores[:, indices].mean(dim=1))

        category_scores = torch.stack(category_scores, dim=1)

    predictions = category_scores.argmax(dim=1).cpu().tolist()
    category_names = list(prompts.keys())

    for row, prediction in zip(rows, predictions):
        actual = row["category"]
        predicted = category_names[prediction]

        stats[actual][0] += 1
        stats[actual][1] += int(actual == predicted)
        processed += 1

    if processed % 400 < BATCH_SIZE:
        print(f"Processed: {processed}/{len(data)}")

correct = sum(value[1] for value in stats.values())
accuracy = correct / processed * 100 if processed else 0

print("\nDESCRIPTIVE PROMPT RESULTS")
print("=" * 40)
print("Processed:", processed)
print("Skipped:", skipped)
print(f"Top-1 Accuracy: {accuracy:.2f}%")

print("\nCATEGORY RESULTS")

for category, (count, right) in stats.items():
    if count:
        print(
            f"{category}: {right}/{count} "
            f"({right/count*100:.2f}%)"
        )

output = BASE + r"\processed\prompt_experiment_results.csv"

with open(output, "w", newline="", encoding="utf-8") as file:
    writer = csv.writer(file)
    writer.writerow(["category", "samples", "correct", "accuracy"])

    for category, (count, right) in stats.items():
        writer.writerow([
            category,
            count,
            right,
            round(right/count*100, 2) if count else 0
        ])

print("\nSaved:", output)
print("Prompt experiment completed!")
