import csv

path = r"dataset\fashionpedia\processed\taxonomy.csv"

with open(path, "r", encoding="utf-8-sig") as file:
    rows = list(csv.DictReader(file))

print("ATTRIBUTE LABELS")
print("-" * 50)

for row in rows:
    if row["type"].lower() == "attribute":
        print(
            "ID:", row["id"],
            "| Name:", row["name"],
            "| Supercategory:", row["supercategory"]
        )

print("\nTotal attributes:", sum(
    row["type"].lower() == "attribute" for row in rows
))
