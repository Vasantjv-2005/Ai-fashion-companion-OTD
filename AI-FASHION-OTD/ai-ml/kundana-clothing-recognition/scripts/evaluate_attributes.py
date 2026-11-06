import csv
import os
import json
from collections import defaultdict

from PIL import Image
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

from src.model_manager import FashionCLIPManager
from src.attribute_detector import AttributeDetector


BASE = r"dataset\fashionpedia"
PROCESSED = os.path.join(BASE, "processed")
CROP_DIR = os.path.join(BASE, "crops")

TEST_CSV = os.path.join(PROCESSED, "attribute_test.csv")

PREDICTIONS_CSV = os.path.join(
    PROCESSED, "attribute_test_predictions.csv"
)

METRICS_JSON = os.path.join(
    PROCESSED, "attribute_test_metrics.json"
)


# Fashionpedia ground-truth labels mapped to model outputs.
LABEL_MAPPING = {
    "sleeve": {
        "sleeveless": "Sleeveless",
        "short (length)": "Short Sleeve",
        "elbow-length": "Half Sleeve",
        "three quarter (length)": "Three Quarter Sleeve",
        "wrist-length": "Full Sleeve"
    },

    "neckline": {
        "round (neck)": "Round Neckline",
        "v-neck": "V Neckline",
        "crew (neck)": "Crew Neckline",
        "square (neckline)": "Square Neckline",
        "scoop (neck)": "Scoop Neckline",
        "boat (neck)": "Boat Neckline",
        "sweetheart (neckline)": "Sweetheart Neckline"
    }
}


MODEL_LABELS = {
    "sleeve": [
        "Sleeveless",
        "Short Sleeve",
        "Half Sleeve",
        "Three Quarter Sleeve",
        "Full Sleeve"
    ],

    "neckline": [
        "Round Neckline",
        "V Neckline",
        "Crew Neckline",
        "Square Neckline",
        "Scoop Neckline",
        "Boat Neckline",
        "Sweetheart Neckline",
        "Collared Neckline"
    ]
}


def evaluate():

    print("\n===== FASHIONCLIP ATTRIBUTE EVALUATION =====")

    # Load shared model once.
    model_manager = FashionCLIPManager()
    detector = AttributeDetector(model_manager)

    actual = defaultdict(list)
    predicted = defaultdict(list)
    prediction_rows = []

    skipped_unsupported = 0
    skipped_missing = 0
    failed = 0

    with open(TEST_CSV, "r", encoding="utf-8-sig") as file:
        rows = list(csv.DictReader(file))

    total = len(rows)

    for index, row in enumerate(rows, start=1):

        attribute_type = row["attribute_type"].strip().lower()
        ground_truth = row["ground_truth"].strip().lower()

        mapping = LABEL_MAPPING.get(attribute_type, {})

        if ground_truth not in mapping:
            skipped_unsupported += 1
            continue

        expected = mapping[ground_truth]

        image_path = os.path.join(
            CROP_DIR,
            row["crop_file"]
        )

        if not os.path.isfile(image_path):
            skipped_missing += 1
            continue

        try:

            with Image.open(image_path) as image:
                image = image.convert("RGB")

                result = detector.predict_attribute(
                    image,
                    detector.sleeve_labels
                    if attribute_type == "sleeve"
                    else detector.neckline_labels
                )

            prediction = result["attribute"]

            actual[attribute_type].append(expected)
            predicted[attribute_type].append(prediction)

            prediction_rows.append({
                "crop_file": row["crop_file"],
                "image_id": row["image_id"],
                "category": row["category"],
                "attribute_type": attribute_type,
                "ground_truth": expected,
                "prediction": prediction,
                "match_score": result["match_score"],
                "correct": expected == prediction
            })

        except Exception as error:
            failed += 1
            print(
                "\nFailed:",
                row["crop_file"],
                "|",
                str(error)
            )

        if index % 100 == 0:
            print(f"Processed {index}/{total}")

    # Save individual predictions.
    fields = [
        "crop_file",
        "image_id",
        "category",
        "attribute_type",
        "ground_truth",
        "prediction",
        "match_score",
        "correct"
    ]

    with open(
        PREDICTIONS_CSV,
        "w",
        newline="",
        encoding="utf-8"
    ) as file:

        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        writer.writerows(prediction_rows)

    # Calculate metrics.
    metrics = {}

    for attribute_type in ("sleeve", "neckline"):

        y_true = actual[attribute_type]
        y_pred = predicted[attribute_type]

        labels = MODEL_LABELS[attribute_type]

        print(f"\n===== {attribute_type.upper()} RESULTS =====")

        if not y_true:
            print("No eligible samples.")
            continue

        accuracy = accuracy_score(y_true, y_pred)

        report = classification_report(
            y_true,
            y_pred,
            labels=labels,
            output_dict=True,
            zero_division=0
        )

        matrix = confusion_matrix(
            y_true,
            y_pred,
            labels=labels
        )

        print("Samples:", len(y_true))
        print("Accuracy:", round(accuracy * 100, 2), "%")
        print(
            "Macro F1:",
            round(report["macro avg"]["f1-score"], 4)
        )
        print(
            "Weighted F1:",
            round(report["weighted avg"]["f1-score"], 4)
        )

        print("\nPer-class results:")

        for label in labels:
            values = report[label]

            print(
                label,
                "| Precision:", round(values["precision"], 3),
                "| Recall:", round(values["recall"], 3),
                "| F1:", round(values["f1-score"], 3),
                "| Support:", int(values["support"])
            )

        print("\nConfusion Matrix:")
        print("Class order:", labels)
        print(matrix)

        metrics[attribute_type] = {
            "samples": len(y_true),
            "accuracy": accuracy,
            "macro_f1": report["macro avg"]["f1-score"],
            "weighted_f1": report["weighted avg"]["f1-score"],
            "classification_report": report,
            "confusion_matrix": matrix.tolist(),
            "class_order": labels
        }

    # Save complete metrics.
    output = {
        "model": "patrickjohncyh/fashion-clip",
        "evaluation_split": "test",
        "skipped_unsupported": skipped_unsupported,
        "skipped_missing": skipped_missing,
        "failed": failed,
        "evaluated_records": len(prediction_rows),
        "results": metrics
    }

    with open(METRICS_JSON, "w", encoding="utf-8") as file:
        json.dump(output, file, indent=4)

    print("\n===== EVALUATION COMPLETED =====")
    print("Evaluated records:", len(prediction_rows))
    print("Unsupported labels skipped:", skipped_unsupported)
    print("Missing images:", skipped_missing)
    print("Failed predictions:", failed)
    print("\nPredictions saved:", PREDICTIONS_CSV)
    print("Metrics saved:", METRICS_JSON)


if __name__ == "__main__":
    evaluate()
