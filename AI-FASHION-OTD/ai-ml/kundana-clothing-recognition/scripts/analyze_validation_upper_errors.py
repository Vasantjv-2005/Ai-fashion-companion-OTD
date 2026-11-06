import csv
from pathlib import Path

base = Path("dataset/fashionpedia/processed")

focus = [
    "shirt, blouse",
    "top, t-shirt, sweatshirt",
    "vest"
]

for filename in ["baseline_confusion_matrix.csv", "crop_top_confusion_matrix.csv"]:
    print("\n==========", filename, "==========")

    with open(base / filename, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)

        for row in reader:
            actual = row["actual_category"]

            if actual not in focus:
                continue

            errors = []
            for predicted, count in row.items():
                if predicted == "actual_category" or predicted == actual:
                    continue
                if int(count) > 0:
                    errors.append((predicted, int(count)))

            errors.sort(key=lambda x: x[1], reverse=True)

            print("\nACTUAL:", actual)
            for predicted, count in errors[:8]:
                print(f"  Predicted as {predicted}: {count}")

