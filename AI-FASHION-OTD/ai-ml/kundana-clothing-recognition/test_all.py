import requests
import json
from pathlib import Path

API_URL = "http://127.0.0.1:8000/predict"
IMAGE_FOLDER = Path("dataset/images")

images = [
    "black_tshirt.png",
    "blue_jeans.png",
    "floral_dress.png",
    "hoodie.png",
    "white_shirt.png",
    "dress_neckline.png",
    "half_sleeve.png",
    "long_sleeve.png",
    "short_sleeve.png",
    "sleeveless.png"
]

results = []

for image_name in images:
    image_path = IMAGE_FOLDER / image_name

    if not image_path.exists():
        print(f"NOT FOUND: {image_name}")
        continue

    try:
        with open(image_path, "rb") as image:
            response = requests.post(
                API_URL,
                files={"file": (image_name, image)}
            )

        print(f"\n--- {image_name} ---")
        print("Status:", response.status_code)
        print(response.text)

        results.append({
            "image": image_name,
            "status_code": response.status_code,
            "output": response.json()
        })

    except Exception as error:
        print("ERROR:", error)

with open("week2_test_results.json", "w") as file:
    json.dump(results, file, indent=4)

print("\nTesting completed!")
print("Successful:", sum(r["status_code"] == 200 for r in results))
print("Failed:", sum(r["status_code"] != 200 for r in results))