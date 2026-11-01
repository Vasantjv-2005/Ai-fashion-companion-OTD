
import sys
import os

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from src.attribute_detector import AttributeDetector

detector = AttributeDetector()

images = [
    "dataset/images/sleeveless.png",
    "dataset/images/short_sleeve.png",
    "dataset/images/half_sleeve.png",
    "dataset/images/long_sleeve.png",
    "dataset/images/dress_neckline.png"
]

for image in images:

    print("\n----------------------------")
    print("Image:", image)

    result = detector.detect_attributes(image)

    print(
        "Sleeve:",
        result["sleeve"]["attribute"]
    )

    print(
        "Neckline:",
        result["neckline"]["attribute"]
    )

    print(
        "Sleeve Match:",
        result["sleeve"]["match_score"], "%"
    )

    print(
        "Neckline Match:",
        result["neckline"]["match_score"], "%"
    )
