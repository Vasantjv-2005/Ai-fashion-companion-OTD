
import os
import csv
import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

BASE = r"dataset\fashionpedia"
CSV_PATH = BASE + r"\processed\test.csv"
CROP_DIR = BASE + r"\crops"
OUTPUT_DIR = BASE + r"\processed"

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

texts = [f"a photo of {c}" for c in categories]
texts.append("a photo of a crop top")

print("Loading FashionCLIP...")

processor = CLIPProcessor.from_pretrained(
    "patrickjohncyh/fashion-clip"
)

model = CLIPModel.from_pretrained(
    "patrickjohncyh/fashion-clip"
).to("cuda" if torch.cuda.is_available() else "cpu")

model.eval()
device = next(model.parameters()).device

print("Device:", device)

with open(CSV_PATH, encoding="utf-8-sig") as f:
    data = list(csv.DictReader(f))

methods = ["baseline", "threshold_0"]

results = {
    method: {
        "correct": 0,
        "category": {c: [0, 0] for c in categories}
    }
    for method in methods
}

processed = 0

for start in range(0, len(data), 8):
    rows = []
    images = []

    for row in data[start:start + 8]:
        path = os.path.join(CROP_DIR, row["crop_file"])

        try:
            with Image.open(path) as img:
                images.append(img.convert("RGB"))
            rows.append(row)
        except (OSError, ValueError):
            continue

    if not images:
        continue

    inputs = processor(
        text=texts,
        images=images,
        return_tensors="pt",
        padding=True
    )

    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        scores = model(**inputs).logits_per_image

    for i, row in enumerate(rows):
        actual = row["category"]

        base_scores = scores[i, :len(categories)].clone()
        crop_score = scores[i, len(categories)].item()

        difference = crop_score - base_scores[1].item()

        baseline_pred = categories[
            base_scores.argmax().item()
        ]

        adjusted_scores = base_scores.clone()

        if difference > 0:
            adjusted_scores[1] = crop_score

        threshold_pred = categories[
            adjusted_scores.argmax().item()
        ]

        predictions = {
            "baseline": baseline_pred,
            "threshold_0": threshold_pred
        }

        for method, prediction in predictions.items():
            entry = results[method]

            entry["correct"] += int(prediction == actual)
            entry["category"][actual][0] += 1
            entry["category"][actual][1] += int(
                prediction == actual
            )

        processed += 1

    print(f"Processed {processed}/{len(data)}")

if processed == 0:
    raise RuntimeError("No test images were processed.")

print("\n===== FINAL TEST RESULTS =====")

for method in methods:
    accuracy = results[method]["correct"] / processed * 100
    print(f"{method:15} {accuracy:.2f}%")

print("\n===== CATEGORY-WISE TEST RESULTS =====")

for category in categories:
    print(f"\n{category}")

    for method in methods:
        count, correct = results[method]["category"][category]

        accuracy = correct / count * 100 if count else 0

        print(f"  {method:15} {accuracy:.2f}%")

output_path = os.path.join(
    OUTPUT_DIR,
    "final_crop_top_test_results.csv"
)

with open(output_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)

    writer.writerow([
        "category",
        "samples",
        "baseline_accuracy",
        "threshold_0_accuracy"
    ])

    for category in categories:
        count, baseline_correct = results["baseline"]["category"][category]
        _, threshold_correct = results["threshold_0"]["category"][category]

        writer.writerow([
            category,
            count,
            round(baseline_correct / count * 100, 2) if count else 0,
            round(threshold_correct / count * 100, 2) if count else 0
        ])

    writer.writerow([
        "OVERALL",
        processed,
        round(results["baseline"]["correct"] / processed * 100, 2),
        round(results["threshold_0"]["correct"] / processed * 100, 2)
    ])

print("\nSaved:", output_path)
