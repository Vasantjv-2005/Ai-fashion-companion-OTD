import csv
from collections import defaultdict, Counter

path = r"dataset\fashionpedia\processed\baseline_full_predictions.csv"

confusion = defaultdict(Counter)

with open(path, "r", encoding="utf-8-sig") as file:
    for row in csv.DictReader(file):
        actual = row["actual"]
        predicted = row["predicted"]
        confusion[actual][predicted] += 1

print("TOP CLASSIFICATION ERRORS")
print("=" * 60)

errors = []

for actual, predictions in confusion.items():
    for predicted, count in predictions.items():
        if actual != predicted:
            errors.append((count, actual, predicted))

errors.sort(reverse=True)

for count, actual, predicted in errors[:20]:
    print(f"{actual} -> {predicted}: {count}")

