import csv
from pathlib import Path

BASE = Path("dataset/fashionpedia/processed")

with open(BASE / "simple_prompt_validation_predictions.csv",
          encoding="utf-8-sig") as f:
    predictions = list(csv.DictReader(f))

wrong_files = {
    row["crop_file"]
    for row in predictions
    if row["actual"] == "top, t-shirt, sweatshirt"
    and row["predicted"] == "vest"
}

with open(BASE / "validation.csv", encoding="utf-8-sig") as f:
    validation = list(csv.DictReader(f))

matches = [
    row for row in validation
    if row["crop_file"] in wrong_files
]

print("Misclassified images found:", len(matches))
print("\n===== ATTRIBUTE EXAMPLES =====")

for row in matches[:20]:
    print("\nImage:", row["crop_file"])
    print("Attributes:", row["attributes"])

