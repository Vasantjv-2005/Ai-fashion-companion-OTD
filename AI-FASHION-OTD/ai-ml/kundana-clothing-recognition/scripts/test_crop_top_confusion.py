import os
import csv
import torch
from collections import Counter, defaultdict
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

BASE = r"dataset\fashionpedia"
CSV_PATH = BASE + r"\processed\validation.csv"
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

baseline_matrix = defaultdict(Counter)
crop_matrix = defaultdict(Counter)
transitions = Counter()

total = 0
batch_size = 8

for start in range(0, len(data), batch_size):
    rows = []
    images = []

    for row in data[start:start + batch_size]:
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
        key: value.to(device)
        for key, value in inputs.items()
    }

    with torch.no_grad():
        scores = model(**inputs).logits_per_image

    for i, row in enumerate(rows):
        actual = row["category"]

        baseline_index = scores[i, :len(categories)].argmax().item()
        baseline_pred = categories[baseline_index]

        crop_scores = scores[i, :len(categories)].clone()
        crop_scores[1] = scores[i, len(categories)]

        crop_index = crop_scores.argmax().item()
        crop_pred = categories[crop_index]

        baseline_matrix[actual][baseline_pred] += 1
        crop_matrix[actual][crop_pred] += 1

        transitions[(actual, baseline_pred, crop_pred)] += 1
        total += 1

    print(f"Processed {min(start + batch_size, len(data))}/{len(data)}")

# Save confusion matrices
for name, matrix in [
    ("baseline", baseline_matrix),
    ("crop_top", crop_matrix)
]:
    path = os.path.join(
        OUTPUT_DIR,
        name + "_confusion_matrix.csv"
    )

    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["actual_category"] + categories)

        for actual in categories:
            writer.writerow([
                actual
            ] + [
                matrix[actual][predicted]
                for predicted in categories
            ])

# Save prediction transitions
transition_path = os.path.join(
    OUTPUT_DIR,
    "crop_top_prediction_changes.csv"
)

with open(transition_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)

    writer.writerow([
        "actual_category",
        "baseline_prediction",
        "crop_top_prediction",
        "samples"
    ])

    for (actual, baseline_pred, crop_pred), count in sorted(
        transitions.items()
    ):
        writer.writerow([
            actual,
            baseline_pred,
            crop_pred,
            count
        ])

print("\n===== IMPORTANT MISCLASSIFICATIONS =====")

focus_categories = [
    "top, t-shirt, sweatshirt",
    "shirt, blouse",
    "vest"
]

for actual in focus_categories:
    print(f"\nACTUAL: {actual}")

    for name, matrix in [
        ("BASELINE", baseline_matrix),
        ("CROP TOP", crop_matrix)
    ]:
        print(f"\n{name}:")

        errors = [
            (pred, count)
            for pred, count in matrix[actual].items()
            if pred != actual
        ]

        for pred, count in sorted(
            errors, key=lambda x: x[1], reverse=True
        )[:8]:
            print(f"  Predicted {pred}: {count}")

print("\nTotal processed:", total)
print("\nSaved files:")
print("baseline_confusion_matrix.csv")
print("crop_top_confusion_matrix.csv")
print("crop_top_prediction_changes.csv")
