import os
import json
import time
import torch
import pandas as pd

from pathlib import Path
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

BASE = Path("dataset/fashionpedia")
PROCESSED = BASE / "processed"
OUTPUT = BASE / "features"

MODEL_NAME = "patrickjohncyh/fashion-clip"
BATCH_SIZE = 16
CHUNK_SIZE = 512

def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)

    train_df = pd.read_csv(PROCESSED / "train.csv")
    categories = sorted(train_df["category"].unique())

    label_map = {name: i for i, name in enumerate(categories)}

    with open(OUTPUT / "class_names.json", "w", encoding="utf-8") as f:
        json.dump(label_map, f, indent=4)

    print("Loading cached FashionCLIP...")
    processor = CLIPProcessor.from_pretrained(
        MODEL_NAME, local_files_only=True
    )
    model = CLIPModel.from_pretrained(
        MODEL_NAME, local_files_only=True
    )
    model.eval()

    print("Device: CPU")
    print("Batch size:", BATCH_SIZE)
    print("Chunk size:", CHUNK_SIZE)
    print("Categories:", len(categories))

    for split in ["train", "validation"]:
        csv_path = PROCESSED / f"{split}.csv"
        df = pd.read_csv(csv_path)

        split_output = OUTPUT / split
        split_output.mkdir(parents=True, exist_ok=True)

        total = len(df)
        start_time = time.time()

        print(f"\n===== {split.upper()} EXTRACTION =====")
        print("Total images:", total)

        for chunk_start in range(0, total, CHUNK_SIZE):
            chunk_end = min(chunk_start + CHUNK_SIZE, total)

            chunk_number = chunk_start // CHUNK_SIZE
            chunk_path = split_output / f"chunk_{chunk_number:04d}.pt"

            if chunk_path.exists():
                print(
                    f"Skipping saved chunk {chunk_number + 1} "
                    f"({chunk_start + 1}-{chunk_end})"
                )
                continue

            feature_parts = []
            label_parts = []
            row_parts = []

            for batch_start in range(chunk_start, chunk_end, BATCH_SIZE):
                batch_end = min(batch_start + BATCH_SIZE, chunk_end)
                batch_df = df.iloc[batch_start:batch_end]

                images = []

                for _, row in batch_df.iterrows():
                    image_path = BASE / "crops" / row["crop_file"]

                    try:
                        with Image.open(image_path) as img:
                            images.append(img.convert("RGB"))
                    except Exception as error:
                        raise RuntimeError(
                            f"Image error at CSV row {batch_start}: "
                            f"{image_path}"
                        ) from error

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

                labels = [
                    label_map[name]
                    for name in batch_df["category"]
                ]

                feature_parts.append(features.cpu())
                label_parts.extend(labels)
                row_parts.extend(range(batch_start, batch_end))

            chunk_data = {
                "features": torch.cat(feature_parts, dim=0),
                "labels": torch.tensor(label_parts, dtype=torch.long),
                "row_indices": torch.tensor(row_parts, dtype=torch.long)
            }

            temp_path = chunk_path.with_suffix(".tmp")
            torch.save(chunk_data, temp_path)
            os.replace(temp_path, chunk_path)

            completed = chunk_end
            elapsed = time.time() - start_time

            print(
                f"{split}: {completed}/{total} "
                f"({completed / total * 100:.1f}%) | "
                f"Chunk saved: {chunk_path.name} | "
                f"Elapsed: {elapsed / 60:.1f} min"
            )

        print(f"{split} extraction complete.")

    print("\nALL FEATURE EXTRACTION COMPLETE!")
    print("Saved under:", OUTPUT.resolve())

if __name__ == "__main__":
    main()
