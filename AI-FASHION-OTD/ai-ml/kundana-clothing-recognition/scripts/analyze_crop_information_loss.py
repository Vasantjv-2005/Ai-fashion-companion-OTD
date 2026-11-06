
import pandas as pd
import numpy as np

from pathlib import Path
from PIL import Image

BASE = Path("dataset/fashionpedia")
SPLITS = ["train", "validation"]


def main():
    results = []

    for split in SPLITS:
        df = pd.read_csv(
            BASE / "processed" / f"{split}.csv"
        )

        print(f"\nAnalysing {split} images...")

        for index, row in df.iterrows():
            path = BASE / "crops" / row["crop_file"]

            with Image.open(path) as image:
                width, height = image.size

            aspect_ratio = width / height

            retained = min(aspect_ratio, 1 / aspect_ratio)

            results.append({
                "split": split,
                "category": row["category"],
                "width": width,
                "height": height,
                "aspect_ratio": aspect_ratio,
                "retained_area_percent": retained * 100
            })

            if (index + 1) % 10000 == 0:
                print(f"Processed {index + 1}/{len(df)}")

    result_df = pd.DataFrame(results)

    output = Path("reports")
    output.mkdir(exist_ok=True)

    result_df.to_csv(
        output / "crop_information_loss.csv",
        index=False
    )

    for split in SPLITS:
        subset = result_df[
            result_df["split"] == split
        ]

        print(f"\n===== {split.upper()} RESULTS =====")

        print(
            "Average retained area:",
            round(subset["retained_area_percent"].mean(), 2),
            "%"
        )

        print(
            "Images losing more than 30%:",
            (subset["retained_area_percent"] < 70).sum()
        )

        print("\nCATEGORY-WISE RESULTS:")

        print(
            subset.groupby("category")[
                "retained_area_percent"
            ].agg(["count", "mean", "median"])
            .round(2)
            .to_string()
        )

    print("\nAnalysis saved: reports/crop_information_loss.csv")


if __name__ == "__main__":
    main()
