import os
from src.model_manager import FashionCLIPManager
from src.clothing_classifier import ClothingClassifier

image_folder = "dataset/images"

manager = FashionCLIPManager()
classifier = ClothingClassifier(manager)

print("\n===== TOP 3 CATEGORY PREDICTIONS =====")

for filename in sorted(os.listdir(image_folder)):
    if not filename.lower().endswith((".png", ".jpg", ".jpeg")):
        continue

    path = os.path.join(image_folder, filename)

    print("\nImage:", filename)

    results = classifier.predict(path, top_k=3)

    for rank, result in enumerate(results, start=1):
        print(
            f"{rank}. {result['category']} "
            f"- {result['match_score']}%"
        )
