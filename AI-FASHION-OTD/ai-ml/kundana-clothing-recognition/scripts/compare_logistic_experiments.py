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
    f1_score
)

BASE = Path("dataset/fashionpedia/features")
REPORTS = Path("reports")
REPORTS.mkdir(exist_ok=True)

def load_features(split):
    folder = BASE / split
    files = sorted(folder.glob("chunk_*.pt"))

    X_parts = []
    y_parts = []

    for file in files:
        data = torch.load(
            file,
            map_location="cpu",
            weights_only=True
        )
        X_parts.append(data["features"].numpy())
        y_parts.append(data["labels"].numpy())

    return np.concatenate(X_parts), np.concatenate(y_parts)


def main():
    print("Loading features...")
    X_train, y_train = load_features("train")
    X_val, y_val = load_features("validation")

    experiments = []

    configurations = [
        (None, 0.1),
        (None, 1.0),
        (None, 10.0),
        ("balanced", 0.1),
        ("balanced", 1.0),
        ("balanced", 10.0)
    ]

    print("\nStarting six Logistic Regression experiments...")

    for class_weight, C in configurations:
        start = time.time()

        model = LogisticRegression(
            C=C,
            solver="lbfgs",
            class_weight=class_weight,
            max_iter=500,
            random_state=42
        )

        model.fit(X_train, y_train)
        predictions = model.predict(X_val)

        accuracy = accuracy_score(y_val, predictions)
        balanced = balanced_accuracy_score(y_val, predictions)
        macro_f1 = f1_score(
            y_val, predictions,
            average="macro",
            zero_division=0
        )
        weighted_f1 = f1_score(
            y_val, predictions,
            average="weighted",
            zero_division=0
        )

        result = {
            "class_weight": str(class_weight),
            "C": C,
            "accuracy": accuracy * 100,
            "balanced_accuracy": balanced * 100,
            "macro_f1": macro_f1 * 100,
            "weighted_f1": weighted_f1 * 100,
            "iterations": int(model.n_iter_.max()),
            "seconds": round(time.time() - start, 2)
        }

        experiments.append(result)

        print(
            f"\nWeights={class_weight}, C={C} | "
            f"Accuracy={accuracy*100:.2f}% | "
            f"Balanced={balanced*100:.2f}% | "
            f"Macro F1={macro_f1*100:.2f}% | "
            f"Time={result['seconds']}s"
        )

    results = pd.DataFrame(experiments)
    results = results.sort_values(
        ["accuracy", "macro_f1"],
        ascending=False
    )

    results.to_csv(
        REPORTS / "logistic_regression_experiments.csv",
        index=False
    )

    print("\n===== EXPERIMENT COMPARISON =====")
    print(results.to_string(index=False))

    print("\nSaved:")
    print(REPORTS / "logistic_regression_experiments.csv")
    print("\nEXPERIMENTS COMPLETE!")


if __name__ == "__main__":
    main()
