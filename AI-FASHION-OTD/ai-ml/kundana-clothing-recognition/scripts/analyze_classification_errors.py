
import json
import joblib
import numpy as np
import pandas as pd

from pathlib import Path
from PIL import Image
from transformers import CLIPModel, CLIPProcessor
import torch

from sklearn.metrics import confusion_matrix

BASE = Path("dataset/fashionpedia")
PROCESSED = BASE / "processed"
FEATURES = BASE / "features"
REPORTS = Path("reports")

MODEL_NAME = "patrickjohncyh/fashion-clip"
BATCH_SIZE = 16


def main():
    REPORTS.mkdir(exist_ok=True)

    device = "cuda" if torch.cuda.is_available() else "cpu"

    print("Loading category names...")
    with open(FEATURES / "class_names.json", encoding="utf-8") as f:
        label_map = json.load(f)

    categories = [
        name for name, index in
        sorted(label_map.items(), key=lambda item: item[1])
    ]

    print("Loading validation data...")
    df = pd.read_csv(PROCESSED / "validation.csv")

    y_true = np.array([label_map[name] for name in df["category"]])

    print("Loading supervised classifier...")
    classifier = joblib.load(
        FEATURES / "fashionclip_logistic_classifier_C10.joblib"
    )

    print("Loading FashionCLIP...")
    processor = CLIPProcessor.from_pretrained(
        MODEL_NAME, local_files_only=True
    )
    clip = CLIPModel.from_pretrained(
        MODEL_NAME, local_files_only=True
    )
    clip.to(device)
    clip.eval()

    predictions = []
    confidences = []

    print("\nAnalysing validation images...")

    for start in range(0, len(df), BATCH_SIZE):
        batch = df.iloc[start:start + BATCH_SIZE]
        images = []

        for crop_file in batch["crop_file"]:
            image_path = BASE / "crops" / crop_file

            with Image.open(image_path) as image:
                images.append(image.convert("RGB"))

        inputs = processor(images=images, return_tensors="pt")
        pixel_values = inputs["pixel_values"].to(device)

        with torch.inference_mode():
            output = clip.get_image_features(
                pixel_values=pixel_values
            )

            features = (
                output.pooler_output
                if hasattr(output, "pooler_output")
                else output
            )

            features = torch.nn.functional.normalize(
                features.float(), p=2, dim=1
            )

        probabilities = classifier.predict_proba(
            features.cpu().numpy()
        )

        batch_predictions = probabilities.argmax(axis=1)
        batch_confidences = probabilities.max(axis=1)

        predictions.extend(batch_predictions.tolist())
        confidences.extend(batch_confidences.tolist())

        completed = min(start + BATCH_SIZE, len(df))
        print(f"Processed {completed}/{len(df)}")

    y_pred = np.array(predictions)

    results = pd.DataFrame({
        "image_file": df["crop_file"].values,
        "actual_category": df["category"].values,
        "predicted_category": [
            categories[index] for index in y_pred
        ],
        "confidence": np.array(confidences) * 100,
        "correct": y_true == y_pred
    })

    errors = results[results["correct"] == False].copy()

    errors.to_csv(
        REPORTS / "supervised_validation_errors.csv",
        index=False
    )

    confusion_rows = []

    matrix = confusion_matrix(
        y_true,
        y_pred,
        labels=list(range(len(categories)))
    )

    for actual_id, actual_category in enumerate(categories):
        for predicted_id, predicted_category in enumerate(categories):
            count = int(matrix[actual_id, predicted_id])

            if actual_id != predicted_id and count > 0:
                confusion_rows.append({
                    "actual_category": actual_category,
                    "predicted_category": predicted_category,
                    "mistakes": count
                })

    confusion_df = pd.DataFrame(confusion_rows)

    confusion_df = confusion_df.sort_values(
        "mistakes", ascending=False
    )

    confusion_df.to_csv(
        REPORTS / "supervised_top_confusions.csv",
        index=False
    )

    print("\n===== TOP 20 CLASSIFICATION ERRORS =====")
    print(confusion_df.head(20).to_string(index=False))

    print("\n===== WEAK CATEGORY EXAMPLES =====")

    weak_categories = [
        "dress", "skirt", "jumpsuit",
        "vest", "cardigan", "cape"
    ]

    for category in weak_categories:
        examples = errors[
            errors["actual_category"] == category
        ].head(5)

        print(f"\nActual category: {category}")

        if examples.empty:
            print("No errors found.")
        else:
            print(
                examples[
                    ["image_file", "predicted_category", "confidence"]
                ].to_string(index=False)
            )

    print("\nTotal validation images:", len(results))
    print("Incorrect predictions:", len(errors))
    print(
        "Error rate:",
        round(len(errors) / len(results) * 100, 2),
        "%"
    )

    print("\nReports saved:")
    print("reports/supervised_validation_errors.csv")
    print("reports/supervised_top_confusions.csv")

    print("\nERROR ANALYSIS COMPLETE!")


if __name__ == "__main__":
    main()
