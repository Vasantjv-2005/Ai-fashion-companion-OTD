import ijson
import os
import csv

path = r"dataset\fashionpedia\annotations\instances_attributes_train2020.json"
output = r"dataset\fashionpedia\processed"

os.makedirs(output, exist_ok=True)

with open(path, "rb") as f:
    categories = list(ijson.items(f, "categories.item"))

with open(path, "rb") as f:
    attributes = list(ijson.items(f, "attributes.item"))

with open(os.path.join(output, "taxonomy.csv"), "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["type", "id", "name", "supercategory"])

    for item in categories:
        writer.writerow([
            "category",
            item.get("id"),
            item.get("name"),
            item.get("supercategory", "")
        ])

    for item in attributes:
        writer.writerow([
            "attribute",
            item.get("id"),
            item.get("name"),
            item.get("supercategory", "")
        ])

print("TAXONOMY REPORT")
print("=" * 40)

print("\nALL CATEGORIES:")
for item in categories:
    print(item["id"], "-", item["name"])

print("\nALL ATTRIBUTE GROUPS:")
groups = {}

for item in attributes:
    group = item.get("supercategory", "Other")
    groups.setdefault(group, []).append(item["name"])

for group, names in groups.items():
    print("\n" + group + ":")
    for name in names:
        print(" -", name)

print("\nTotal categories:", len(categories))
print("Total attributes:", len(attributes))
print("\nSaved: taxonomy.csv")
