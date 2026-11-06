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

categories = [
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

prompts = [f"a photo of {category}" for category in categories]

print("Loading FashionCLIP...")
processor = CLIPProcessor.from_pretrained(MODEL_NAME)
model = CLIPModel.from_pretrained(MODEL_NAME).to(DEVICE)
model.eval()

with open(CSV_PATH, "r", encoding="utf-8-sig") as file:
    data = list(csv.DictReader(file))

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
        text=prompts,
        images=images,
        return_tensors="pt",
        padding=True
    )

    inputs = {key: value.to(DEVICE) for key, value in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)
        predictions = outputs.logits_per_image.argmax(dim=1).cpu().tolist()

    for row, prediction in zip(rows, predictions):
        actual = row["category"]
        predicted = categories[prediction]

        stats[actual][0] += 1
        stats[actual][1] += int(actual == predicted)
        processed += 1

    if processed % 400 < BATCH_SIZE:
        print(f"Processed: {processed}/{len(data)}")

correct = sum(value[1] for value in stats.values())
accuracy = correct / processed * 100 if processed else 0

print("\nSIMPLE PROMPT BASELINE")
print("=" * 40)
print("Processed:", processed)
print("Skipped:", skipped)
print(f"Top-1 Accuracy: {accuracy:.2f}%")

print("\nCATEGORY RESULTS")

for category in categories:
    count, right = stats[category]
    if count:
        print(f"{category}: {right}/{count} ({right/count*100:.2f}%)")

output = BASE + r"\processed\simple_prompt_validation_results.csv"

with open(output, "w", newline="", encoding="utf-8") as file:
    writer = csv.writer(file)
    writer.writerow(["category", "samples", "correct", "accuracy"])

    for category in categories:
        count, right = stats[category]
        writer.writerow([
            category,
            count,
            right,
            round(right / count * 100, 2) if count else 0
        ])

print("\nSaved:", output)
