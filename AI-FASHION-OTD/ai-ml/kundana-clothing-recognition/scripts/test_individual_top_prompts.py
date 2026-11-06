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

base_prompts = {
    c: f"a photo of {c}" for c in categories
}

candidates = {
    "baseline": None,
    "tshirt": "a photo of a T-shirt",
    "tank_top": "a photo of a tank top",
    "camisole": "a photo of a camisole",
    "crop_top": "a photo of a crop top",
    "sweatshirt": "a photo of a sweatshirt"
}

all_texts = list(base_prompts.values())
for prompt in candidates.values():
    if prompt and prompt not in all_texts:
        all_texts.append(prompt)

text_index = {text: i for i, text in enumerate(all_texts)}

experiment_indices = {}

for name, prompt in candidates.items():
    indices = []
    for category in categories:
        if category == "top, t-shirt, sweatshirt" and prompt:
            text = prompt
        else:
            text = base_prompts[category]
        indices.append(text_index[text])

    experiment_indices[name] = indices

print("Loading FashionCLIP...")
processor = CLIPProcessor.from_pretrained(MODEL_NAME)
model = CLIPModel.from_pretrained(MODEL_NAME).to(DEVICE)
model.eval()

with open(CSV_PATH, encoding="utf-8-sig") as f:
    data = list(csv.DictReader(f))

stats = {
    name: defaultdict(lambda: [0, 0])
    for name in candidates
}

prediction_changes = defaultdict(int)
processed = 0
skipped = 0

for start in range(0, len(data), BATCH_SIZE):
    batch = data[start:start + BATCH_SIZE]
    images, rows = [], []

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
        text=all_texts,
        images=images,
        return_tensors="pt",
        padding=True
    )
    inputs = {k: v.to(DEVICE) for k, v in inputs.items()}

    with torch.no_grad():
        scores = model(**inputs).logits_per_image

    for i, row in enumerate(rows):
        actual = row["category"]

        for name, indices in experiment_indices.items():
            best = scores[i, indices].argmax().item()
            predicted = categories[best]

            stats[name][actual][0] += 1
            stats[name][actual][1] += int(actual == predicted)

        processed += 1

    if processed % 400 < BATCH_SIZE:
        print(f"Processed: {processed}/{len(data)}")

print("\n===== TOP PROMPT COMPARISON =====")

for name in candidates:
    values = stats[name]
    total_correct = sum(v[1] for v in values.values())
    overall = total_correct / processed * 100

    count, right = values["top, t-shirt, sweatshirt"]
    top_accuracy = right / count * 100

    print(
        f"{name:12} | "
        f"Top: {top_accuracy:6.2f}% | "
        f"Overall: {overall:6.2f}%"
    )

output = BASE + r"\processed\individual_top_prompt_results.csv"

with open(output, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow([
        "prompt", "top_samples", "top_correct",
        "top_accuracy", "overall_accuracy"
    ])

    for name in candidates:
        values = stats[name]
        count, right = values["top, t-shirt, sweatshirt"]
        total_correct = sum(v[1] for v in values.values())

        writer.writerow([
            name, count, right,
            round(right / count * 100, 2),
            round(total_correct / processed * 100, 2)
        ])

print("\nProcessed:", processed)
print("Skipped:", skipped)
print("Saved:", output)
