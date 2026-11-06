import os
import json

from src.model_manager import FashionCLIPManager
from src.clothing_classifier import ClothingClassifier
from src.color_detector import ColorDetector
from src.pattern_detector import PatternDetector
from src.attribute_detector import AttributeDetector
from src.style_detector import StyleDetector
from src.material_detector import MaterialDetector


def main():

    print("\n===== OTD AI CLOTHING RECOGNITION =====")

    image_folder = "dataset/images"
    output_folder = "outputs"

    os.makedirs(output_folder, exist_ok=True)

    # Load FashionCLIP only once
    model_manager = FashionCLIPManager()

    # Initialize all detectors
    classifier = ClothingClassifier(model_manager)
    color_detector = ColorDetector()
    pattern_detector = PatternDetector(model_manager)
    attribute_detector = AttributeDetector(model_manager)
    style_detector = StyleDetector(model_manager)
    material_detector = MaterialDetector(model_manager)

    bottomwear = [
        "jeans", "trousers", "shorts",
        "leggings", "skirt", "pants"
    ]

    predictions = []

    for filename in sorted(os.listdir(image_folder)):

        if not filename.lower().endswith(
            (".png", ".jpg", ".jpeg")
        ):
            continue

        image_path = os.path.join(image_folder, filename)

        print("\n================================")
        print("Image:", filename)

        try:

            # 1. Clothing Classification
            category_result = classifier.predict(
                image_path, top_k=1
            )[0]

            category = category_result["category"]

            category = category.replace(
                "a photo of a ", ""
            ).replace(
                "a photo of ", ""
            ).title()

            # 2. Colour Detection
            color_result = color_detector.detect_color(
                image_path
            )

            # 3. Pattern Detection
            pattern_result = pattern_detector.detect_pattern(
                image_path
            )

            # 4. Style Detection
            style_result = style_detector.detect_style(
                image_path
            )

            # 5. Attribute Detection
            if category.lower() in bottomwear:

                sleeve = None
                neckline = None

            else:

                attributes = attribute_detector.detect_attributes(
                    image_path
                )

                sleeve = attributes["sleeve"]["attribute"]
                neckline = attributes["neckline"]["attribute"]

            # 6. Material Estimation
            material_results = material_detector.detect_material(
                image_path, top_k=3
            )

            # Structured prediction
            result = {
                "filename": filename,

                "category": {
                    "value": category,
                    "match_score": category_result["match_score"]
                },

                "color": {
                    "primary": color_result["color"],
                    "secondary": color_result["secondary_color"],
                    "rgb": list(color_result["rgb"])
                },

                "pattern": {
                    "value": pattern_result["pattern"],
                    "match_score": pattern_result["match_score"]
                },

                "style": {
                    "value": style_result["style"],
                    "match_score": style_result["match_score"]
                },

                "attributes": {
                    "sleeve": sleeve,
                    "neckline": neckline
                },

                "material_estimation": material_results,

                "status": "success"
            }

            predictions.append(result)

            # Display results
            print("Category:", category)
            print(
                "Category Match Score:",
                category_result["match_score"], "%"
            )

            print("Primary Colour:", color_result["color"])
            print("Secondary Colour:", color_result["secondary_color"])
            print("RGB:", color_result["rgb"])

            print("Pattern:", pattern_result["pattern"])
            print("Style:", style_result["style"])
            print("Sleeve:", sleeve or "Not applicable")
            print("Neckline:", neckline or "Not applicable")

            print("Estimated Materials:")
            for material in material_results:
                print(
                    " -",
                    material["material"],
                    ":",
                    material["match_score"],
                    "%"
                )

        except Exception as error:

            print("Error processing image:", error)

            predictions.append({
                "filename": filename,
                "status": "failed",
                "error": str(error)
            })

    # Save JSON output
    output_path = os.path.join(
        output_folder,
        "clothing_predictions.json"
    )

    with open(output_path, "w", encoding="utf-8") as file:

        json.dump(
            predictions,
            file,
            indent=4,
            ensure_ascii=False
        )

    successful = sum(
        1 for item in predictions
        if item["status"] == "success"
    )

    failed = len(predictions) - successful

    print("\n===== OTD PROCESS COMPLETED =====")
    print("Total Images:", len(predictions))
    print("Successful:", successful)
    print("Failed:", failed)
    print("JSON Saved:", output_path)


if __name__ == "__main__":
    main()
