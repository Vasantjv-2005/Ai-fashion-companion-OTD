import json
import torch
import numpy as np
import pandas as pd

from pathlib import Path
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report

BASE = Path("dataset/fashionpedia/features")
REPORTS = Path("reports")

def load_features(split):
    X_parts = []
    y_parts = []

    for file in sorted((BASE / split).glob("chunk_*.pt")):
        data = torch.load(file, map_location="cpu", weights_only=True)
        X_parts.append(data["features"].numpy())
        y_parts.append(data["labels"].numpy())

    return np.concatenate(X_parts), np.concatenate(y_parts)


def main():
    with open(BASE / "class_names.json", encoding="utf-8") as f:
        mapping = json.load(f)

    categories = [
        name for name, index in
        sorted(mapping.items(), key=lambda item: item[1])
    ]

    X_train, y_train = load_features("train")
    X_val, y_val = load_features("validation")

    configurations = [
        ("unbalanced_C10", None, 10.0),
        ("balanced_C1", "balanced", 1.0)
    ]

    comparison = []

    for name, weights, C in configurations:
        print(f"\nEvaluating {name}...")

        model = LogisticRegression(
            C=C,
            solver="lbfgs",
            class_weight=weights,
            max_iter=500,
            random_state=42
        )

        model.fit(X_train, y_train)
        predictions = model.predict(X_val)

        report = classification_report(
            y_val,
            predictions,
            labels=list(range(len(categories))),
            target_names=categories,
            output_dict=True,
            zero_division=0
        )

        for category in categories:
            comparison.append({
                "model": name,
                "category": category,
                "precision": report[category]["precision"] * 100,
                "recall": report[category]["recall"] * 100,
                "f1_score": report[category]["f1-score"] * 100,
                "support": report[category]["support"]
            })

    df = pd.DataFrame(comparison)

    output = REPORTS / "category_model_comparison.csv"
    df.to_csv(output, index=False)

    print("\n===== CATEGORY-WISE MODEL COMPARISON =====")

    pivot = df.pivot(
        index="category",
        columns="model",
        values="f1_score"
    )

    print(pivot.round(2).to_string())

    print("\nSaved:", output)
    print("\nCATEGORY COMPARISON COMPLETE!")


if __name__ == "__main__":
    main()
