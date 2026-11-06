import csv
import random
from pathlib import Path
import matplotlib.pyplot as plt
from PIL import Image

BASE = Path("dataset/fashionpedia")
CSV_PATH = BASE / "processed/validation.csv"
CROP_DIR = BASE / "crops"
OUTPUT = BASE / "processed/validation_top_contact_sheet.png"

with open(CSV_PATH, encoding="utf-8-sig") as f:
    rows = [
        row for row in csv.DictReader(f)
        if row["category"] == "top, t-shirt, sweatshirt"
    ]

random.seed(42)
samples = random.sample(rows, min(40, len(rows)))

fig, axes = plt.subplots(5, 8, figsize=(18, 13))
axes = axes.flatten()

for ax, row in zip(axes, samples):
    path = CROP_DIR / row["crop_file"]

    try:
        with Image.open(path) as img:
            ax.imshow(img.convert("RGB"))
        ax.set_title(Path(row["crop_file"]).name, fontsize=7)
    except (OSError, ValueError):
        ax.set_title("Image unavailable", fontsize=7)

    ax.axis("off")

for ax in axes[len(samples):]:
    ax.axis("off")

plt.suptitle("Fashionpedia Validation Set - Top/T-shirt/Sweatshirt Samples")
plt.tight_layout()
plt.savefig(OUTPUT, dpi=150, bbox_inches="tight")
plt.close()

print("Total validation top samples:", len(rows))
print("Images selected:", len(samples))
print("Saved:", OUTPUT)
