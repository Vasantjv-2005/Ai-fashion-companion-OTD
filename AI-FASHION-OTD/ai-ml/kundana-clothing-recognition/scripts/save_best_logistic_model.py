import json
import torch
import numpy as np
import joblib

from pathlib import Path
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    f1_score,
    classification_report
)

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
    print("Loading training features...")
    X_train, y_train = load_features("train")

    print("Loading validation features...")
    X_val, y_val = load_features("validation")

    model = LogisticRegression(
        C=10.0,
        solver="lbfgs",
        class_weight=None,
        max_iter=700,
        random_state=42
    )

    print("\nTraining final candidate: Logistic Regression C=10...")
    model.fit(X_train, y_train)

    predictions = model.predict(X_val)

    metrics = {
        "model": "FashionCLIP Logistic Regression",
        "C": 10.0,
        "class_weight": None,
        "accuracy": accuracy_score(y_val, predictions) * 100,
        "balanced_accuracy": balanced_accuracy_score(y_val, predictions) * 100,
        "macro_f1": f1_score(y_val, predictions, average="macro") * 100,
        "weighted_f1": f1_score(y_val, predictions, average="weighted") * 100,
        "iterations": int(model.n_iter_[0])
    }

    model_path = BASE / "fashionclip_logistic_classifier_C10.joblib"
    joblib.dump(model, model_path)

    with open(BASE / "class_names.json", encoding="utf-8") as f:
        class_names = json.load(f)

    metrics["classes"] = class_names

    metrics_path = REPORTS / "final_candidate_validation_metrics.json"

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=4)

    report = classification_report(
        y_val,
        predictions,
        output_dict=True,
        zero_division=0
    )

    import pandas as pd
    pd.DataFrame(report).transpose().to_csv(
        REPORTS / "final_candidate_classification_report.csv"
    )

    print("\n===== FINAL CANDIDATE VALIDATION =====")
    for key, value in metrics.items():
        print(f"{key}: {value}")

    print("\nModel saved:", model_path)
    print("Metrics saved:", metrics_path)
    print("\nMODEL SAVING COMPLETE!")

if __name__ == "__main__":
    main()
