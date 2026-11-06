
import sys
import os

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from src.style_detector import StyleDetector

detector = StyleDetector()

images = [
    "dataset/images/black_tshirt.png",
    "dataset/images/blue_jeans.png",
    "dataset/images/floral_dress.png",
    "dataset/images/hoodie.png",
    "dataset/images/white_shirt.png"
]

for image in images:

    result = detector.detect_style(image)

    print("\nImage:", image)
    print("Detected Style:", result["style"])
    print("Match Score:", result["match_score"], "%")
