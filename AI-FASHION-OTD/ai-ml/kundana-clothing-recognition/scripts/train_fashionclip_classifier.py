import json
import time
import torch
import numpy as np
import pandas as pd

from pathlib import Path
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    f1_score,
    classification_report,
    confusion_matrix
)
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
import joblib

BASE = Path("dataset/fashionpedia/features")
REPORTS = Path("reports")
REPORTS.mkdir(exist_ok=True)

DEVICE = "cpu"

def load_features(split):
    folder = BASE / split
    files = sorted(folder.glob("chunk_*.pt"))

    feature_parts = []
    label_parts = []

    for file in files:
        data = torch.load(
            file,
            map_location="cpu",
            weights_only=True
        )

        feature_parts.append(data["features"].numpy())
        label_parts.append(data["labels"].numpy())

    X = np.concatenate(feature_parts, axis=0)
    y = np.concatenate(label_parts, axis=0)

    return X, y


def main():
    start = time.time()

    with open(BASE / "class_names.json", encoding="utf-8") as f:
        class_names = json.load(f)

    categories = [
        name for name, index in
        sorted(class_names.items(), key=lambda item: item[1])
    ]

    print("Loading training features...")
    X_train, y_train = load_features("train")

    print("Loading validation features...")
    X_val, y_val = load_features("validation")

    print("\nDataset shapes:")
    print("Training:", X_train.shape)
    print("Validation:", X_val.shape)
    print("Categories:", len(categories))

    print("\nTraining Logistic Regression...")

    model = LogisticRegression(
        C=1.0,
        solver="lbfgs",
        class_weight="balanced",
        max_iter=500,
        random_state=42
    )

    model.fit(X_train, y_train)

    print("Training complete.")
    print("Iterations:", model.n_iter_.max())

    print("\nEvaluating on validation data...")

    predictions = model.predict(X_val)

    accuracy = accuracy_score(y_val, predictions)
    balanced_accuracy = balanced_accuracy_score(y_val, predictions)
    macro_f1 = f1_score(
        y_val,
        predictions,
        average="macro",
        zero_division=0
    )
    weighted_f1 = f1_score(
        y_val,
        predictions,
        average="weighted",
        zero_division=0
    )

    print("\n===== VALIDATION RESULTS =====")
    print(f"Accuracy:          {accuracy * 100:.2f}%")
    print(f"Balanced Accuracy: {balanced_accuracy * 100:.2f}%")
    print(f"Macro F1:          {macro_f1 * 100:.2f}%")
    print(f"Weighted F1:       {weighted_f1 * 100:.2f}%")

    report = classification_report(
        y_val,
        predictions,
        labels=list(range(len(categories))),
        target_names=categories,
        output_dict=True,
        zero_division=0
    )

    report_df = pd.DataFrame(report).transpose()
    report_df.to_csv(
        REPORTS / "supervised_validation_report.csv"
    )

    matrix = confusion_matrix(
        y_val,
        predictions,
        labels=list(range(len(categories)))
    )

    pd.DataFrame(
        matrix,
        index=categories,
        columns=categories
    ).to_csv(REPORTS / "supervised_validation_confusion_matrix.csv")

    metrics = {
        "model": "FashionCLIP Logistic Regression",
        "training_samples": len(X_train),
        "validation_samples": len(X_val),
        "feature_dimension": int(X_train.shape[1]),
        "categories": categories,
        "accuracy": float(accuracy),
        "balanced_accuracy": float(balanced_accuracy),
        "macro_f1": float(macro_f1),
        "weighted_f1": float(weighted_f1),
        "iterations": int(model.n_iter_.max()),
        "training_seconds": round(time.time() - start, 2)
    }

    with open(
        REPORTS / "supervised_validation_metrics.json",
        "w",
        encoding="utf-8"
    ) as f:
        json.dump(metrics, f, indent=4)

    joblib.dump(
        model,
        BASE / "fashionclip_logistic_classifier.joblib"
    )

    print("\nSaved model:")
    print(BASE / "fashionclip_logistic_classifier.joblib")

    print("\nSaved reports:")
    print(REPORTS / "supervised_validation_metrics.json")
    print(REPORTS / "supervised_validation_report.csv")
    print(REPORTS / "supervised_validation_confusion_matrix.csv")

    print("\n===== CLASSIFICATION REPORT =====")
    print(
        classification_report(
            y_val,
            predictions,
            target_names=categories,
            zero_division=0
        )
    )

    print("\nTotal time:", round(time.time() - start, 2), "seconds")
    print("\nSUPERVISED TRAINING COMPLETE!")


if __name__ == "__main__":
    main()
