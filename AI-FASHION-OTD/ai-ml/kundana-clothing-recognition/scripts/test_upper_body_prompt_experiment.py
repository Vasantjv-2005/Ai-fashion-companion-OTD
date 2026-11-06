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
    "sweater", "cardigan", "jacket", "vest",
    "pants", "shorts", "skirt", "coat",
    "dress", "jumpsuit", "cape"
]

baseline = {
    c: [f"a photo of {c}"] for c in categories
}

improved = {c: list(p) for c, p in baseline.items()}

improved["top, t-shirt, sweatshirt"] = [
    "a photo of a T-shirt",
    "a photo of a sleeveless tank top",
    "a photo of a camisole",
    "a photo of a cropped top",
    "a photo of a sweatshirt"
]

improved["shirt, blouse"] = [
    "a photo of a button-front shirt",
    "a photo of a collared shirt",
    "a photo of a blouse"
]

experiments = {
    "baseline": baseline,
    "targeted": improved
}

texts = []
prompt_indices = {}

for experiment, prompts in experiments.items():
    for category in categories:
        indices = []
        for prompt in prompts[category]:
            indices.append(len(texts))
            texts.append(prompt)
        prompt_indices[(experiment, category)] = indices

print("Loading FashionCLIP...")
processor = CLIPProcessor.from_pretrained(MODEL_NAME)
model = CLIPModel.from_pretrained(MODEL_NAME).to(DEVICE)
model.eval()

with open(CSV_PATH, encoding="utf-8-sig") as f:
    data = list(csv.DictReader(f))

stats = {
    name: defaultdict(lambda: [0, 0])
    for name in experiments
}

prediction_rows = []
processed = 0
skipped = 0

for start in range(0, len(data), BATCH_SIZE):
    batch = data[start:start + BATCH_SIZE]
    images = []
    rows = []

    for row in batch:
        path = os.path.join(CROP_DIR, row["crop_file"])

        try:
            with Image.open(path) as img:
                images.append(img.convert("RGB"))
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

    inputs = {k: v.to(DEVICE) for k, v in inputs.items()}

    with torch.no_grad():
        scores = model(**inputs).logits_per_image

    for i, row in enumerate(rows):
        actual = row["category"]
        predictions = {}

        for experiment in experiments:
            category_scores = []

            for category in categories:
                indices = prompt_indices[(experiment, category)]
                category_scores.append(scores[i, indices].mean())

            best = torch.stack(category_scores).argmax().item()
            predicted = categories[best]

            stats[experiment][actual][0] += 1
            stats[experiment][actual][1] += int(actual == predicted)
            predictions[experiment] = predicted

        prediction_rows.append({
            "crop_file": row["crop_file"],
            "actual": actual,
            "baseline": predictions["baseline"],
            "targeted": predictions["targeted"]
        })

        processed += 1

    if processed % 400 < BATCH_SIZE:
        print(f"Processed: {processed}/{len(data)}")

print("\n===== EXPERIMENT RESULTS =====")

for experiment in experiments:
    correct = sum(v[1] for v in stats[experiment].values())
    accuracy = correct / processed * 100

    print(f"\n{experiment.upper()}: {accuracy:.2f}%")

    for category in categories:
        count, right = stats[experiment][category]
        if count:
            print(
                f"{category}: {right}/{count} "
                f"({right/count*100:.2f}%)"
            )

output_dir = BASE + r"\processed"

with open(
    os.path.join(output_dir, "upper_body_prompt_experiment_results.csv"),
    "w", newline="", encoding="utf-8"
) as f:
    writer = csv.writer(f)
    writer.writerow(["experiment", "category", "samples",
                     "correct", "accuracy"])

    for experiment in experiments:
        for category in categories:
            count, right = stats[experiment][category]
            writer.writerow([
                experiment, category, count, right,
                round(right / count * 100, 2) if count else 0
            ])

with open(
    os.path.join(output_dir, "upper_body_prompt_experiment_predictions.csv"),
    "w", newline="", encoding="utf-8"
) as f:
    writer = csv.DictWriter(
        f,
        fieldnames=["crop_file", "actual", "baseline", "targeted"]
    )
    writer.writeheader()
    writer.writerows(prediction_rows)

print("\nProcessed:", processed)
print("Skipped:", skipped)
print("Experiment files saved successfully.")
