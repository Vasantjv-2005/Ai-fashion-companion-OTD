import csv

path = r"dataset\fashionpedia\processed\garment_annotations.csv"

with open(path, "r", encoding="utf-8-sig") as file:
    reader = csv.DictReader(file)

    for i, row in enumerate(reader):
        print("Category:", row["category"])
        print("Bounding box:", repr(row["bbox"]))
        print("-" * 40)

        if i == 4:
            break
