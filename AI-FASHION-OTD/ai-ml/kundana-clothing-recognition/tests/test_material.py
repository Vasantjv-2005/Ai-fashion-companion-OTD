
import sys
import os

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from src.material_detector import MaterialDetector

detector = MaterialDetector()

images = [
    "dataset/images/black_tshirt.png",
    "dataset/images/blue_jeans.png",
    "dataset/images/floral_dress.png",
    "dataset/images/hoodie.png",
    "dataset/images/white_shirt.png"
]

for image in images:

    results = detector.detect_material(image)

    print("\nImage:", image)
    print("Possible Materials:")

    for result in results:
        print(
            result["material"],
            "-",
            result["match_score"],
            "%"
        )
