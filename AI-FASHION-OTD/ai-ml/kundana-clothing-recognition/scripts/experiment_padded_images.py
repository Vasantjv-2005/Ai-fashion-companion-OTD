
import json
import joblib
import torch
import pandas as pd
import numpy as np

from pathlib import Path
from PIL import Image, ImageOps
from transformers import CLIPModel, CLIPProcessor
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, balanced_accuracy_score, f1_score

BASE = Path("dataset/fashionpedia")
REPORTS = Path("reports")
FEATURES = BASE / "features"

MODEL_NAME = "patrickjohncyh/fashion-clip"

TRAIN_LIMIT = 5000
VAL_LIMIT = 1000
BATCH_SIZE = 16
SEED = 42


def pad_image(image):
    image = image.convert("RGB")

    width, height = image.size
    side = max(width, height)

    padded = Image.new("RGB", (side, side), (255, 255, 255))

    x = (side - width) // 2
    y = (side - height) // 2

    padded.paste(image, (x, y))

    return padded


def extract_features(df, processor, model, padded):
    all_features = []

    for start in range(0, len(df), BATCH_SIZE):
        batch = df.iloc[start:start + BATCH_SIZE]
        images = []

        for crop_file in batch["crop_file"]:
            path = BASE / "crops" / crop_file

            with Image.open(path) as image:
                image = image.convert("RGB")

                if padded:
                    image = pad_image(image)

                images.append(image)

        inputs = processor(
            images=images,
            return_tensors="pt"
        )

        with torch.inference_mode():
            output = model.get_image_features(**inputs)

            features = (
                output.pooler_output
                if hasattr(output, "pooler_output")
                else output
            )

            features = torch.nn.functional.normalize(
                features.float(), p=2, dim=1
            )

        all_features.append(features.cpu().numpy())

        print(
            f"{'Padded' if padded else 'Standard'}: "
            f"{min(start + BATCH_SIZE, len(df))}/{len(df)}"
        )

    return np.concatenate(all_features, axis=0)


def metrics(name, y_true, y_pred):
    return {
        "model": name,
        "accuracy": accuracy_score(y_true, y_pred) * 100,
        "balanced_accuracy": balanced_accuracy_score(
            y_true, y_pred
        ) * 100,
        "macro_f1": f1_score(
            y_true, y_pred, average="macro"
        ) * 100,
        "weighted_f1": f1_score(
            y_true, y_pred, average="weighted"
        ) * 100
    }


def main():
    REPORTS.mkdir(exist_ok=True)

    torch.manual_seed(SEED)
    np.random.seed(SEED)

    with open(FEATURES / "class_names.json", encoding="utf-8") as f:
        label_map = json.load(f)

    train_df = pd.read_csv(BASE / "processed" / "train.csv")
    val_df = pd.read_csv(BASE / "processed" / "validation.csv")

    train_df = train_df.sample(
        n=TRAIN_LIMIT, random_state=SEED
    ).reset_index(drop=True)

    val_df = val_df.sample(
        n=VAL_LIMIT, random_state=SEED
    ).reset_index(drop=True)

    y_train = np.array([
        label_map[x] for x in train_df["category"]
    ])

    y_val = np.array([
        label_map[x] for x in val_df["category"]
    ])

    print("Loading FashionCLIP...")

    processor = CLIPProcessor.from_pretrained(
        MODEL_NAME, local_files_only=True
    )

    model = CLIPModel.from_pretrained(
        MODEL_NAME, local_files_only=True
    )

    model.eval()

    print("\nExtracting STANDARD features...")
    X_train_standard = extract_features(
        train_df, processor, model, False
    )

    X_val_standard = extract_features(
        val_df, processor, model, False
    )

    print("\nExtracting PADDED features...")
    X_train_padded = extract_features(
        train_df, processor, model, True
    )

    X_val_padded = extract_features(
        val_df, processor, model, True
    )

    print("\nTraining standard pilot model...")

    standard_model = LogisticRegression(
        C=10,
        max_iter=700,
        random_state=42
    )

    standard_model.fit(X_train_standard, y_train)

    print("Training padded pilot model...")

    padded_model = LogisticRegression(
        C=10,
        max_iter=700,
        random_state=42
    )

    padded_model.fit(X_train_padded, y_train)

    standard_predictions = standard_model.predict(X_val_standard)
    padded_predictions = padded_model.predict(X_val_padded)

    results = [
        metrics("standard_pilot", y_val, standard_predictions),
        metrics("padded_pilot", y_val, padded_predictions)
    ]

    result_df = pd.DataFrame(results)

    result_df.to_csv(
        REPORTS / "padding_pilot_comparison.csv",
        index=False
    )

    print("\n===== PADDING PILOT COMPARISON =====")
    print(result_df.round(2).to_string(index=False))

    print("\nExperiment saved:")
    print("reports/padding_pilot_comparison.csv")

    print("\nPADDING PILOT COMPLETE!")


if __name__ == "__main__":
    main()
