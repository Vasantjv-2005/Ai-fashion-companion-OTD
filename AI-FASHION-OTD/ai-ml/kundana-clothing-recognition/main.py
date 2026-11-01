
import os

from src.clothing_classifier import ClothingClassifier
from src.color_detector import ColorDetector
from src.pattern_detector import PatternDetector
from src.attribute_detector import AttributeDetector
from src.style_detector import StyleDetector
from src.material_detector import MaterialDetector


def main():

    print("\n===== OTD AI CLOTHING RECOGNITION =====")

    image_folder = "dataset/images"

    classifier = ClothingClassifier()
    color_detector = ColorDetector()
    pattern_detector = PatternDetector()
    attribute_detector = AttributeDetector()
    style_detector = StyleDetector()
    material_detector = MaterialDetector()

    bottomwear = ["jeans", "trousers", "shorts", "leggings", "skirt"]

    for filename in sorted(os.listdir(image_folder)):

        if not filename.lower().endswith((".png", ".jpg", ".jpeg")):
            continue

        image_path = os.path.join(image_folder, filename)

        print("\n================================")
        print("Image:", filename)

        # 1. Clothing Category
        category_result = classifier.predict(image_path, top_k=1)
        category = category_result[0]["category"]

        category = category.replace("a photo of a ", "")
        category = category.replace("a photo of ", "")
        category = category.title()

        # 2. Colour
        color_result = color_detector.detect_color(image_path)

        # 3. Pattern
        pattern_result = pattern_detector.detect_pattern(image_path)

        # 4. Style
        style_result = style_detector.detect_style(image_path)

        print("Category:", category)
        print("Colour:", color_result["color"])
        print("RGB:", color_result["rgb"])
        print("Pattern:", pattern_result["pattern"])
        print("Style:", style_result["style"])

        # 5. Sleeve and Neckline
        if category.lower() not in bottomwear:

            attributes = attribute_detector.detect_attributes(image_path)

            sleeve = attributes["sleeve"]["attribute"]
            neckline = attributes["neckline"]["attribute"]

            sleeve = sleeve.replace("a person wearing ", "")
            neckline = neckline.replace("a garment with ", "")

            print("Sleeve:", sleeve.title())
            print("Neckline:", neckline.title())

        else:
            print("Sleeve: Not applicable")
            print("Neckline: Not applicable")

        # 6. Material Estimation
        material_results = material_detector.detect_material(image_path)

        best_material = material_results[0]

        print(
            "Estimated Material:",
            best_material["material"]
        )

        print(
            "Material Match Score:",
            best_material["match_score"],
            "%"
        )

    print("\n===== OTD PROCESS COMPLETED =====")


if __name__ == "__main__":
    main()
