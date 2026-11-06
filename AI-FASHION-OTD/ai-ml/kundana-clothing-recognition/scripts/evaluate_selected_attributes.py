import os
import csv
import torch
import torch.nn.functional as F

from PIL import Image
from sklearn.metrics import accuracy_score, f1_score, classification_report

from src.model_manager import FashionCLIPManager


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CSV_PATH = os.path.join(
    ROOT, "dataset", "fashionpedia", "processed",
    "attribute_test.csv"
)

CROPS_DIR = os.path.join(
    ROOT, "dataset", "fashionpedia", "crops"
)

OUTPUT_PATH = os.path.join(
    ROOT, "dataset", "fashionpedia", "processed",
    "attribute_test_prompt_comparison.csv"
)


CLASSES = {
    "sleeve": [
        "Sleeveless",
        "Short Sleeve",
        "Half Sleeve",
        "Three Quarter Sleeve",
        "Full Sleeve"
    ],
    "neckline": [
        "Round Neckline",
        "V Neckline",
        "Crew Neckline",
        "Square Neckline",
        "Scoop Neckline",
        "Boat Neckline",
        "Sweetheart Neckline"
    ]
}


GROUND_TRUTH = {
    "sleeve": {
        "sleeveless": "Sleeveless",
        "short (length)": "Short Sleeve",
        "elbow-length": "Half Sleeve",
        "three quarter (length)": "Three Quarter Sleeve",
        "wrist-length": "Full Sleeve"
    },
    "neckline": {
        "round (neck)": "Round Neckline",
        "v-neck": "V Neckline",
        "crew (neck)": "Crew Neckline",
        "square (neckline)": "Square Neckline",
        "scoop (neck)": "Scoop Neckline",
        "boat (neck)": "Boat Neckline",
        "sweetheart (neckline)": "Sweetheart Neckline"
    }
}


PROMPTS = {
    "baseline": {
        "sleeve": [
            "a sleeveless clothing item",
            "a short sleeve shirt",
            "a half sleeve shirt",
            "a three quarter sleeve top",
            "a full sleeve shirt"
        ],
        "neckline": [
            "a round neckline",
            "a V neckline",
            "a crew neckline",
            "a square neckline",
            "a scoop neckline",
            "a boat neckline",
            "a sweetheart neckline"
        ]
    },

    "clothing_focused": {
        "sleeve": [
            "a photo of a sleeveless garment",
            "a photo of a garment with short sleeves",
            "a photo of a garment with half-length sleeves",
            "a photo of a garment with three-quarter-length sleeves",
            "a photo of a garment with full-length sleeves"
        ],
        "neckline": [
            "a garment with a round-shaped neckline",
            "a garment with a V-shaped neckline",
            "a garment with a crew neckline",
            "a garment with a square neckline",
            "a garment with a scoop neckline",
            "a garment with a boat neckline",
            "a garment with a sweetheart neckline"
        ]
    },

    "fashion_product": {
        "sleeve": [
            "fashion product photo of a sleeveless top",
            "fashion product photo of a short sleeve top",
            "fashion product photo of a half sleeve top",
            "fashion product photo of a three quarter sleeve top",
            "fashion product photo of a full sleeve top"
        ],
        "neckline": [
            "fashion product photo showing a round neckline",
            "fashion product photo showing a V neckline",
            "fashion product photo showing a crew neckline",
            "fashion product photo showing a square neckline",
            "fashion product photo showing a scoop neckline",
            "fashion product photo showing a boat neckline",
            "fashion product photo showing a sweetheart neckline"
        ]
    }
}


def load_text_features(model, processor, device):

    features = {}

    for version, groups in PROMPTS.items():

        features[version] = {}

        for attribute_type, prompts in groups.items():

            inputs = processor(
                text=prompts,
                return_tensors="pt",
                padding=True
            )

            inputs = {
                key: value.to(device)
                for key, value in inputs.items()
            }

            with torch.inference_mode():
                text_output = model.text_model(**inputs)
                text_vectors = model.text_projection(text_output.pooler_output)

            text_vectors = F.normalize(text_vectors, dim=-1)

            features[version][attribute_type] = text_vectors

    return features


def predict(image, processor, model, device, text_features, attribute_type):

    inputs = processor(
        images=image,
        return_tensors="pt"
    )

    pixel_values = inputs["pixel_values"].to(device)

    with torch.inference_mode():
        image_output = model.vision_model(pixel_values=pixel_values)
        image_vectors = model.visual_projection(image_output.pooler_output)

    image_vectors = F.normalize(image_vectors, dim=-1)

    predictions = {}

    for version in PROMPTS:

        similarities = (
            image_vectors @ text_features[version][attribute_type].T
        )

        index = similarities.argmax(dim=1).item()

        predictions[version] = CLASSES[attribute_type][index]

    return predictions


def print_metrics(attribute_type, records):

    print("\n" + "=" * 55)
    print(attribute_type.upper(), "PROMPT COMPARISON")
    print("=" * 55)

    labels = CLASSES[attribute_type]

    for version in PROMPTS:

        actual = [
            row["ground_truth"]
            for row in records
        ]

        predicted = [
            row[version]
            for row in records
        ]

        accuracy = accuracy_score(actual, predicted)

        macro = f1_score(
            actual, predicted,
            labels=labels,
            average="macro",
            zero_division=0
        )

        weighted = f1_score(
            actual, predicted,
            labels=labels,
            average="weighted",
            zero_division=0
        )

        print("\nPrompt version:", version)
        print("Samples:", len(records))
        print("Accuracy:", round(accuracy * 100, 2), "%")
        print("Macro F1:", round(macro, 4))
        print("Weighted F1:", round(weighted, 4))

    print("\nDetailed results for each prompt version:")

    for version in PROMPTS:

        print("\n---", version, "---")

        actual = [row["ground_truth"] for row in records]
        predicted = [row[version] for row in records]

        print(
            classification_report(
                actual,
                predicted,
                labels=labels,
                zero_division=0
            )
        )


def main():

    print("\n===== ATTRIBUTE PROMPT EXPERIMENT =====")

    manager = FashionCLIPManager()

    model = manager.model
    processor = manager.processor
    device = manager.device

    print("\nPreparing text embeddings...")

    text_features = load_text_features(
        model, processor, device
    )

    print("Text embeddings ready!")

    with open(CSV_PATH, "r", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)
        rows = list(reader)

    results = {
        "sleeve": [],
        "neckline": []
    }

    skipped = 0
    failed = 0

    usable_rows = []

    for row in rows:

        attribute_type = row["attribute_type"].strip().lower()
        ground_truth = row["ground_truth"].strip().lower()

        if attribute_type not in GROUND_TRUTH:
            skipped += 1
            continue

        mapped = GROUND_TRUTH[attribute_type].get(ground_truth)

        if mapped is None:
            skipped += 1
            continue

        row["mapped_ground_truth"] = mapped
        usable_rows.append(row)

    print("Validation records:", len(rows))
    print("Supported records:", len(usable_rows))
    print("Unsupported records skipped:", skipped)

    for index, row in enumerate(usable_rows, start=1):

        attribute_type = row["attribute_type"].strip().lower()

        image_path = os.path.join(
            CROPS_DIR,
            row["crop_file"].replace("/", os.sep)
        )

        try:

            image = Image.open(image_path).convert("RGB")

            predictions = predict(
                image,
                processor,
                model,
                device,
                text_features,
                attribute_type
            )

            result = {
                "crop_file": row["crop_file"],
                "attribute_type": attribute_type,
                "ground_truth": row["mapped_ground_truth"],
                "baseline": predictions["baseline"],
                "clothing_focused": predictions["clothing_focused"],
                "fashion_product": predictions["fashion_product"]
            }

            results[attribute_type].append(result)

        except Exception as error:

            failed += 1
            print("Failed:", row["crop_file"], "|", str(error))

        if index % 100 == 0:
            print(f"Processed {index}/{len(usable_rows)}")

    for attribute_type in ["sleeve", "neckline"]:

        print_metrics(
            attribute_type,
            results[attribute_type]
        )

    all_results = (
        results["sleeve"] + results["neckline"]
    )

    with open(
        OUTPUT_PATH,
        "w",
        newline="",
        encoding="utf-8"
    ) as file:

        fieldnames = [
            "crop_file",
            "attribute_type",
            "ground_truth",
            "baseline",
            "clothing_focused",
            "fashion_product"
        ]

        writer = csv.DictWriter(
            file,
            fieldnames=fieldnames
        )

        writer.writeheader()
        writer.writerows(all_results)

    print("\n===== EXPERIMENT COMPLETED =====")
    print("Successful predictions:", len(all_results))
    print("Failed predictions:", failed)
    print("Results saved:", OUTPUT_PATH)


if __name__ == "__main__":
    main()



