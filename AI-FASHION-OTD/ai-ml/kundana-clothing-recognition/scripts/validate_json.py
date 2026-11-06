import json

path = "outputs/clothing_predictions.json"

with open(path, "r", encoding="utf-8") as file:
    data = json.load(file)

required = [
    "filename",
    "category",
    "color",
    "pattern",
    "style",
    "attributes",
    "material_estimation",
    "status"
]

errors = []

for i, item in enumerate(data):
    for field in required:
        if field not in item:
            errors.append(f"Image {i}: Missing {field}")

    if "value" not in item.get("category", {}):
        errors.append(f"Image {i}: Missing category value")

    if "primary" not in item.get("color", {}):
        errors.append(f"Image {i}: Missing primary colour")

    if not item.get("material_estimation"):
        errors.append(f"Image {i}: Missing material estimates")

    if item.get("status") != "success":
        errors.append(f"Image {i}: Processing unsuccessful")

print("Total images:", len(data))
print("Successful:", sum(x.get("status") == "success" for x in data))
print("Validation errors:", len(errors))

for error in errors:
    print(error)

if not errors:
    print("ALL JSON VALIDATION CHECKS PASSED!")
