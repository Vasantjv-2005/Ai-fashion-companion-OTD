import json
import torch
import numpy as np
import pandas as pd
import joblib

from pathlib import Path
from PIL import Image
from transformers import CLIPModel, CLIPProcessor
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    f1_score,
    classification_report
)

BASE = Path("dataset/fashionpedia")
PROCESSED = BASE / "processed"
FEATURES = BASE / "features"
REPORTS = Path("reports")
REPORTS.mkdir(exist_ok=True)

MODEL_NAME = "patrickjohncyh/fashion-clip"

PROMPTS = {
    "cape": ["a photo of a cape"],
    "cardigan": ["a photo of a cardigan"],
    "coat": ["a photo of a coat"],
    "dress": ["a photo of a dress"],
    "jacket": ["a photo of a jacket"],
    "jumpsuit": ["a photo of a jumpsuit"],
    "pants": ["a photo of trousers", "a photo of pants"],
    "shirt, blouse": ["a photo of a shirt", "a photo of a blouse"],
    "shorts": ["a photo of shorts"],
    "skirt": ["a photo of a skirt"],
    "sweater": ["a photo of a sweater"],
    "top, t-shirt, sweatshirt": [
        "a photo of a t-shirt",
        "a photo of a top",
        "a photo of a sweatshirt"
    ],
    "vest": ["a photo of a vest"]
}

BATCH_SIZE = 16

def main():
    device = "cuda" if torch.cuda.is_available() else "cpu"

    with open(FEATURES / "class_names.json", encoding="utf-8") as f:
        label_map = json.load(f)

    categories = [
        name for name, index in
        sorted(label_map.items(), key=lambda item: item[1])
    ]

    if set(categories) != set(PROMPTS):
        raise ValueError("Prompt categories do not match model categories.")

    print("Loading validation data...")
    df = pd.read_csv(PROCESSED / "validation.csv")

    y_true = np.array([label_map[name] for name in df["category"]])

    print("Loading supervised classifier...")
    supervised = joblib.load(
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

    prompt_texts = [
        prompt
        for category in categories
        for prompt in PROMPTS[category]
    ]

    prompt_owners = [
        label_map[category]
        for category in categories
        for _ in PROMPTS[category]
    ]

    prompt_inputs = processor(
        text=prompt_texts,
        return_tensors="pt",
        padding=True
    )

    prompt_inputs = {
        key: value.to(device)
        for key, value in prompt_inputs.items()
    }

    with torch.inference_mode():
        text_features = clip.get_text_features(
            input_ids=prompt_inputs["input_ids"],
            attention_mask=prompt_inputs["attention_mask"]
        )

    text_features = (
        text_features.pooler_output
        if hasattr(text_features, "pooler_output")
        else text_features
    )

    text_features = torch.nn.functional.normalize(
        text_features.float(), p=2, dim=1
    )

    prompt_owners = torch.tensor(prompt_owners, device=device)

    supervised_predictions = []
    prompt_predictions = []

    print("\nEvaluating validation images...")

    for start in range(0, len(df), BATCH_SIZE):
        batch = df.iloc[start:start + BATCH_SIZE]
        images = []

        for crop_file in batch["crop_file"]:
            path = BASE / "crops" / crop_file

            with Image.open(path) as img:
                images.append(img.convert("RGB"))

        inputs = processor(images=images, return_tensors="pt")
        pixel_values = inputs["pixel_values"].to(device)

        with torch.inference_mode():
            image_output = clip.get_image_features(
                pixel_values=pixel_values
            )

            image_features = (
                image_output.pooler_output
                if hasattr(image_output, "pooler_output")
                else image_output
            )

            image_features = torch.nn.functional.normalize(
                image_features.float(), p=2, dim=1
            )

            logits = image_features @ text_features.T

            category_scores = torch.stack(
                [
                    logits[:, prompt_owners == class_id].mean(dim=1)
                    for class_id in range(len(categories))
                ],
                dim=1
            )

            prompt_batch_predictions = category_scores.argmax(dim=1)

        supervised_batch_predictions = supervised.predict(
            image_features.cpu().numpy()
        )

        prompt_predictions.extend(
            prompt_batch_predictions.cpu().numpy().tolist()
        )

        supervised_predictions.extend(
            supervised_batch_predictions.tolist()
        )

        completed = min(start + BATCH_SIZE, len(df))
        print(f"Processed {completed}/{len(df)}")

    results = {
        "prompt_based": np.array(prompt_predictions),
        "supervised_C10": np.array(supervised_predictions)
    }

    summary = []

    for name, predictions in results.items():
        summary.append({
            "model": name,
            "accuracy": accuracy_score(y_true, predictions) * 100,
            "balanced_accuracy": balanced_accuracy_score(
                y_true, predictions
            ) * 100,
            "macro_f1": f1_score(
                y_true, predictions, average="macro"
            ) * 100,
            "weighted_f1": f1_score(
                y_true, predictions, average="weighted"
            ) * 100
        })

        report = classification_report(
            y_true,
            predictions,
            labels=list(range(len(categories))),
            target_names=categories,
            output_dict=True,
            zero_division=0
        )

        pd.DataFrame(report).transpose().to_csv(
            REPORTS / f"{name}_validation_report.csv"
        )

    summary_df = pd.DataFrame(summary)
    summary_df.to_csv(
        REPORTS / "prompt_vs_supervised_validation.csv",
        index=False
    )

    category_rows = []

    for name, predictions in results.items():
        report = classification_report(
            y_true,
            predictions,
            labels=list(range(len(categories))),
            target_names=categories,
            output_dict=True,
            zero_division=0
        )

        for category in categories:
            category_rows.append({
                "model": name,
                "category": category,
                "precision": report[category]["precision"] * 100,
                "recall": report[category]["recall"] * 100,
                "f1_score": report[category]["f1-score"] * 100,
                "support": report[category]["support"]
            })

    pd.DataFrame(category_rows).to_csv(
        REPORTS / "prompt_vs_supervised_category_comparison.csv",
        index=False
    )

    print("\n===== PROMPT VS SUPERVISED VALIDATION =====")
    print(summary_df.round(2).to_string(index=False))

    print("\nSaved comparison reports in:", REPORTS)
    print("\nVALIDATION COMPARISON COMPLETE!")

if __name__ == "__main__":
    main()
