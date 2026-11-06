import csv
from collections import defaultdict, Counter

path = r"dataset\fashionpedia\processed\baseline_full_predictions.csv"

confusion = defaultdict(Counter)

with open(path, "r", encoding="utf-8-sig") as file:
    for row in csv.DictReader(file):
        actual = row["actual"]
        predicted = row["predicted"]

        if actual != predicted:
            confusion[actual][predicted] += 1

print("\nTOP CLASSIFICATION MISTAKES")
print("=" * 55)

all_errors = []

for actual, predictions in confusion.items():
    for predicted, count in predictions.items():
        all_errors.append((count, actual, predicted))

all_errors.sort(reverse=True)

for count, actual, predicted in all_errors[:20]:
    print(f"{actual} predicted as {predicted}: {count} times")

print("\nCONFUSION ANALYSIS COMPLETED!")
