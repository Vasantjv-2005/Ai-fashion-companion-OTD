import os
import csv
import random
import torch

from PIL import Image
from transformers import CLIPModel, CLIPProcessor

MODEL_NAME = "patrickjohncyh/fashion-clip"

BASE = r"dataset\fashionpedia"
TEST_CSV = BASE + r"\processed\test.csv"
CROP_DIR = BASE + r"\crops"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Fashionpedia garment categories
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

labels = [f"a photo of {category}" for category in categories]

print("Loading FashionCLIP...")
print("Device:", DEVICE)

processor = CLIPProcessor.from_pretrained(MODEL_NAME)
model = CLIPModel.from_pretrained(MODEL_NAME)
model.to(DEVICE)
model.eval()

print("FashionCLIP loaded successfully!")

# Load test dataset
with open(TEST_CSV, "r", encoding="utf-8-sig") as file:
    data = list(csv.DictReader(file))

# Test on 100 random crops first
random.seed(42)
data = random.sample(data, min(100, len(data)))

correct_top1 = 0
correct_top3 = 0
processed = 0
results = []

BATCH_SIZE = 8

for start in range(0, len(data), BATCH_SIZE):

    batch = data[start:start + BATCH_SIZE]

    images = []
    valid_rows = []

    for row in batch:
        image_path = os.path.join(CROP_DIR, row["crop_file"])

        try:
            with Image.open(image_path) as image:
                images.append(image.convert("RGB"))

            valid_rows.append(row)

        except (OSError, ValueError):
            continue

    if not images:
        continue

    inputs = processor(
        text=labels,
        images=images,
        return_tensors="pt",
        padding=True
    )

    inputs = {key: value.to(DEVICE) for key, value in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)
        scores = outputs.logits_per_image.softmax(dim=-1)

    predictions = scores.topk(3, dim=-1).indices.cpu().tolist()

    for row, prediction in zip(valid_rows, predictions):

        actual = row["category"]
        predicted = categories[prediction[0]]

        if predicted == actual:
            correct_top1 += 1

        if actual in [categories[i] for i in prediction]:
            correct_top3 += 1

        processed += 1

        results.append({
            "actual": actual,
            "predicted": predicted,
            "top3": " | ".join(categories[i] for i in prediction)
        })

    print(f"Processed: {processed}/100")

# Calculate accuracy
top1 = correct_top1 / processed * 100 if processed else 0
top3 = correct_top3 / processed * 100 if processed else 0

print("\nFASHIONCLIP BASELINE RESULTS")
print("=" * 40)
print("Model:", MODEL_NAME)
print("Device:", DEVICE)
print("Test images:", processed)
print(f"Top-1 Accuracy: {top1:.2f}%")
print(f"Top-3 Accuracy: {top3:.2f}%")

# Save predictions
output_path = BASE + r"\processed\baseline_sample_results.csv"

with open(output_path, "w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(
        file,
        fieldnames=["actual", "predicted", "top3"]
    )
    writer.writeheader()
    writer.writerows(results)

print("\nResults saved:", output_path)
