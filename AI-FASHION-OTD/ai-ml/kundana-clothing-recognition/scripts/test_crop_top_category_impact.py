import os
import csv
import torch
from collections import defaultdict
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

BASE = r"dataset\fashionpedia"
CSV_PATH = BASE + r"\processed\validation.csv"
CROP_DIR = BASE + r"\crops"

categories = [
    "shirt, blouse", "top, t-shirt, sweatshirt",
    "sweater", "cardigan", "jacket", "vest",
    "pants", "shorts", "skirt", "coat",
    "dress", "jumpsuit", "cape"
]

prompts = [
    f"a photo of {c}" for c in categories
]

crop_prompt = "a photo of a crop top"
texts = prompts + [crop_prompt]

processor = CLIPProcessor.from_pretrained(
    "patrickjohncyh/fashion-clip"
)
model = CLIPModel.from_pretrained(
    "patrickjohncyh/fashion-clip"
).to("cuda" if torch.cuda.is_available() else "cpu")
model.eval()

device = next(model.parameters()).device

with open(CSV_PATH, encoding="utf-8-sig") as f:
    data = list(csv.DictReader(f))

stats = {
    name: defaultdict(lambda: [0, 0])
    for name in ["baseline", "crop_top"]
}

for start in range(0, len(data), 8):
    rows, images = [], []

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

        base_pred = categories[
            scores[i, :len(categories)].argmax().item()
        ]

        crop_scores = scores[i, :len(categories)].clone()
        crop_scores[1] = scores[i, len(categories)]

        crop_pred = categories[crop_scores.argmax().item()]

        for name, pred in [
            ("baseline", base_pred),
            ("crop_top", crop_pred)
        ]:
            stats[name][actual][0] += 1
            stats[name][actual][1] += int(actual == pred)

print("\n===== CATEGORY-WISE COMPARISON =====")
print(f'{"CATEGORY":32} {"BASELINE":>10} {"CROP TOP":>10}')

for category in categories:
    output = []
    for name in ["baseline", "crop_top"]:
        count, right = stats[name][category]
        accuracy = right / count * 100 if count else 0
        output.append(f"{accuracy:.2f}%")

    print(f"{category:32} {output[0]:>10} {output[1]:>10}")

output_path = BASE + r"\processed\crop_top_category_impact.csv"

with open(output_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["category", "samples",
                     "baseline_accuracy", "crop_top_accuracy"])

    for category in categories:
        count, base_right = stats["baseline"][category]
        _, crop_right = stats["crop_top"][category]

        writer.writerow([
            category, count,
            round(base_right / count * 100, 2),
            round(crop_right / count * 100, 2)
        ])

print("\nSaved:", output_path)
