
import os
import csv
import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

BASE = r"dataset\fashionpedia"
CSV_PATH = BASE + r"\processed\validation.csv"
CROP_DIR = BASE + r"\crops"
OUTPUT_DIR = BASE + r"\processed"

THRESHOLDS = [0, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0]

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

prompts = [f"a photo of {c}" for c in categories]
crop_prompt = "a photo of a crop top"
texts = prompts + [crop_prompt]

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

methods = ["baseline", "always_crop_top"] + THRESHOLDS

results = {}

for method in methods:
    results[method] = {
        "correct": 0,
        "category": {
            c: [0, 0] for c in categories
        }
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

    inputs = {
        k: v.to(device)
        for k, v in inputs.items()
    }

    with torch.no_grad():
        scores = model(**inputs).logits_per_image

    for i, row in enumerate(rows):
        actual = row["category"]

        base_scores = scores[i, :len(categories)].clone()
        crop_score = scores[i, len(categories)].item()

        original_top_score = base_scores[1].item()
        difference = crop_score - original_top_score

        baseline_pred = categories[
            base_scores.argmax().item()
        ]

        always_scores = base_scores.clone()
        always_scores[1] = crop_score

        always_pred = categories[
            always_scores.argmax().item()
        ]

        predictions = {
            "baseline": baseline_pred,
            "always_crop_top": always_pred
        }

        for threshold in THRESHOLDS:
            adjusted_scores = base_scores.clone()

            if difference > threshold:
                adjusted_scores[1] = crop_score

            predictions[threshold] = categories[
                adjusted_scores.argmax().item()
            ]

        for method, prediction in predictions.items():
            entry = results[method]

            entry["correct"] += int(prediction == actual)
            entry["category"][actual][0] += 1
            entry["category"][actual][1] += int(
                prediction == actual
            )

        processed += 1

    print(f"Processed {processed}/{len(data)}")

# Overall comparison
print("\n===== OVERALL THRESHOLD COMPARISON =====")
print(f'{"METHOD":25} {"ACCURACY":>12}')

for method in methods:
    entry = results[method]

    accuracy = entry["correct"] / processed * 100

    name = (
        method if isinstance(method, str)
        else f"threshold > {method}"
    )

    print(f"{name:25} {accuracy:11.2f}%")

# All 13 category comparisons
print("\n===== ALL CATEGORY-WISE RESULTS =====")

for category in categories:
    print(f"\n{category}")

    for method in methods:
        count, correct = results[method]["category"][category]

        accuracy = (
            correct / count * 100
            if count else 0
        )

        name = (
            method if isinstance(method, str)
            else f"threshold > {method}"
        )

        print(f"  {name:25} {accuracy:7.2f}%")

# Save complete CSV
os.makedirs(OUTPUT_DIR, exist_ok=True)

output_path = os.path.join(
    OUTPUT_DIR,
    "crop_top_threshold_results.csv"
)

with open(output_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)

    category_columns = [
        c.replace(", ", "_").replace(" ", "_")
        for c in categories
    ]

    writer.writerow(
        ["method", "overall_accuracy"]
        + category_columns
        + ["samples"]
    )

    for method in methods:
        entry = results[method]

        name = (
            method if isinstance(method, str)
            else f"threshold_{method}"
        )

        category_accuracies = []

        for category in categories:
            count, correct = entry["category"][category]

            accuracy = (
                round(correct / count * 100, 2)
                if count else 0
            )

            category_accuracies.append(accuracy)

        writer.writerow(
            [
                name,
                round(entry["correct"] / processed * 100, 2)
            ]
            + category_accuracies
            + [processed]
        )

print("\nSaved:", output_path)
