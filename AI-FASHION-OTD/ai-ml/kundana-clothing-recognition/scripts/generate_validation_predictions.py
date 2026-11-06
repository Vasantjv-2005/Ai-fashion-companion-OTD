import os
import csv
import torch

from PIL import Image
from transformers import CLIPModel, CLIPProcessor

MODEL_NAME = "patrickjohncyh/fashion-clip"
BASE = r"dataset\fashionpedia"
CSV_PATH = BASE + r"\processed\validation.csv"
CROP_DIR = BASE + r"\crops"
OUTPUT = BASE + r"\processed\simple_prompt_validation_predictions.csv"

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

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

processed = 0
skipped = 0

with open(OUTPUT, "w", newline="", encoding="utf-8") as file:
    writer = csv.writer(file)
    writer.writerow(["crop_file", "actual", "predicted", "top3"])

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

        inputs = {
            key: value.to(DEVICE)
            for key, value in inputs.items()
        }

        with torch.no_grad():
            outputs = model(**inputs)
            scores = outputs.logits_per_image
            top_indices = scores.topk(3, dim=1).indices.cpu().tolist()

        for row, indices in zip(rows, top_indices):
            predicted = categories[indices[0]]
            top3 = " | ".join(categories[i] for i in indices)

            writer.writerow([
                row["crop_file"],
                row["category"],
                predicted,
                top3
            ])

            processed += 1

        if processed % 400 < BATCH_SIZE:
            print(f"Processed: {processed}/{len(data)}")

print("\nValidation prediction generation completed!")
print("Processed:", processed)
print("Skipped:", skipped)
print("Saved:", OUTPUT)
