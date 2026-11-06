import os
import csv
import torch
from collections import defaultdict

from PIL import Image
from transformers import CLIPModel, CLIPProcessor

MODEL_NAME = "patrickjohncyh/fashion-clip"

BASE = r"dataset\fashionpedia"
TEST_CSV = BASE + r"\processed\test.csv"
CROP_DIR = BASE + r"\crops"
OUTPUT = BASE + r"\processed"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

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
model = CLIPModel.from_pretrained(MODEL_NAME).to(DEVICE)
model.eval()

with open(TEST_CSV, "r", encoding="utf-8-sig") as file:
    data = list(csv.DictReader(file))

print("Total test crops:", len(data))

BATCH_SIZE = 8
processed = 0
skipped = 0
correct_top1 = 0
correct_top3 = 0

category_stats = defaultdict(lambda: [0, 0, 0])
results = []

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
            skipped += 1

    if not images:
        continue

    inputs = processor(
        text=labels,
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
        scores = outputs.logits_per_image.softmax(dim=-1)

    predictions = scores.topk(3, dim=-1).indices.cpu().tolist()

    for row, prediction in zip(valid_rows, predictions):

        actual = row["category"]
        predicted = categories[prediction[0]]
        top3 = [categories[i] for i in prediction]

        top1_ok = predicted == actual
        top3_ok = actual in top3

        correct_top1 += int(top1_ok)
        correct_top3 += int(top3_ok)
        processed += 1

        category_stats[actual][0] += 1
        category_stats[actual][1] += int(top1_ok)
        category_stats[actual][2] += int(top3_ok)

        results.append({
            "actual": actual,
            "predicted": predicted,
            "top3": " | ".join(top3)
        })

    if processed % 400 < BATCH_SIZE:
        print(f"Processed: {processed}/{len(data)}")

top1 = correct_top1 / processed * 100
top3 = correct_top3 / processed * 100

print("\nFULL FASHIONCLIP BASELINE")
print("=" * 45)
print("Model:", MODEL_NAME)
print("Device:", DEVICE)
print("Processed:", processed)
print("Skipped:", skipped)
print(f"Top-1 Accuracy: {top1:.2f}%")
print(f"Top-3 Accuracy: {top3:.2f}%")

print("\nCATEGORY-WISE RESULTS")
print("-" * 45)

for category in categories:
    count, right1, right3 = category_stats[category]

    if count:
        print(
            f"{category}: "
            f"Top-1 {right1/count*100:.2f}% "
            f"| Top-3 {right3/count*100:.2f}% "
            f"| Samples {count}"
        )

prediction_path = os.path.join(
    OUTPUT, "baseline_full_predictions.csv"
)

with open(prediction_path, "w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(
        file,
        fieldnames=["actual", "predicted", "top3"]
    )
    writer.writeheader()
    writer.writerows(results)

metrics_path = os.path.join(
    OUTPUT, "baseline_category_metrics.csv"
)

with open(metrics_path, "w", newline="", encoding="utf-8") as file:
    writer = csv.writer(file)
    writer.writerow([
        "category", "samples",
        "top1_correct", "top1_accuracy",
        "top3_correct", "top3_accuracy"
    ])

    for category in categories:
        count, right1, right3 = category_stats[category]

        if count:
            writer.writerow([
                category,
                count,
                right1,
                round(right1/count*100, 2),
                right3,
                round(right3/count*100, 2)
            ])

print("\nSaved predictions:", prediction_path)
print("Saved category metrics:", metrics_path)
print("\nFull baseline evaluation completed!")
