
from transformers import pipeline
from pathlib import Path

MODEL_NAME = "wargoninnovation/wargon-clothing-classifier"

print("Loading clothing AI model...")
classifier = pipeline(
    "image-classification",
    model=MODEL_NAME
)

image_path = input("Enter the path of your clothing image: ").strip().strip('"')

if not Path(image_path).is_file():
    print("Error: Image file not found. Check the path and try again.")
else:
    print("\nAnalyzing your clothing image...")
    predictions = classifier(image_path, top_k=5)

    print("\nClothing predictions:")
    for prediction in predictions:
        label = prediction["label"]
        confidence = prediction["score"] * 100
        print(f"{label}: {confidence:.2f}%")
