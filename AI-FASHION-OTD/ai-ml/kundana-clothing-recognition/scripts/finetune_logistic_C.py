import json
import torch
import numpy as np
import pandas as pd

from pathlib import Path
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, balanced_accuracy_score, f1_score

BASE = Path("dataset/fashionpedia/features")
REPORTS = Path("reports")
REPORTS.mkdir(exist_ok=True)

def load_features(split):
    X_parts, y_parts = [], []

    for file in sorted((BASE / split).glob("chunk_*.pt")):
        data = torch.load(file, map_location="cpu", weights_only=True)
        X_parts.append(data["features"].numpy())
        y_parts.append(data["labels"].numpy())

    return np.concatenate(X_parts), np.concatenate(y_parts)

def main():
    X_train, y_train = load_features("train")
    X_val, y_val = load_features("validation")

    results = []

    for C in [5.0, 10.0, 20.0, 50.0]:
        print(f"\nTraining Logistic Regression C={C}...")

        model = LogisticRegression(
            C=C,
            solver="lbfgs",
            class_weight=None,
            max_iter=700,
            random_state=42
        )

        model.fit(X_train, y_train)
        predictions = model.predict(X_val)

        results.append({
            "C": C,
            "accuracy": accuracy_score(y_val, predictions) * 100,
            "balanced_accuracy": balanced_accuracy_score(y_val, predictions) * 100,
            "macro_f1": f1_score(y_val, predictions, average="macro") * 100,
            "weighted_f1": f1_score(y_val, predictions, average="weighted") * 100,
            "iterations": int(model.n_iter_[0])
        })

    df = pd.DataFrame(results)
    df = df.sort_values("accuracy", ascending=False)

    output = REPORTS / "logistic_C_finetuning.csv"
    df.to_csv(output, index=False)

    print("\n===== C VALUE COMPARISON =====")
    print(df.round(2).to_string(index=False))
    print("\nSaved:", output)
    print("\nFINE-TUNING COMPLETE!")

if __name__ == "__main__":
    main()
