import json
import torch
from pathlib import Path

base = Path("dataset/fashionpedia/features")
expected = {"train": 61616, "validation": 7721}

with open(base / "class_names.json", encoding="utf-8") as f:
    class_names = json.load(f)

print("Number of categories:", len(class_names))
print("Categories:", list(class_names.keys()))

for split, expected_count in expected.items():
    folder = base / split
    files = sorted(folder.glob("chunk_*.pt"))

    all_rows = []
    total_features = 0
    valid = True

    for file in files:
        data = torch.load(file, map_location="cpu", weights_only=True)
        features = data["features"]
        labels = data["labels"]
        rows = data["row_indices"]

        if features.ndim != 2 or features.shape[1] != 512:
            valid = False
        if len(features) != len(labels) or len(features) != len(rows):
            valid = False
        if not torch.isfinite(features).all():
            valid = False
        if labels.min() < 0 or labels.max() >= len(class_names):
            valid = False

        total_features += len(features)
        all_rows.extend(rows.tolist())

    print(f"\n===== {split.upper()} =====")
    print("Chunk files:", len(files))
    print("Feature vectors:", total_features)
    print("Expected vectors:", expected_count)
    print("Feature dimension: 512")
    print("Unique row indices:", len(set(all_rows)))
    print("Rows cover complete split:", sorted(all_rows) == list(range(expected_count)))
    print("All checks passed:", valid and total_features == expected_count
          and len(set(all_rows)) == expected_count
          and sorted(all_rows) == list(range(expected_count)))

print("\nFEATURE VALIDATION FINISHED")
