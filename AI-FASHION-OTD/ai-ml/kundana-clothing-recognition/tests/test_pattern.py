
import sys
import os

sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from src.pattern_detector import PatternDetector

detector = PatternDetector()

images = [
    "dataset/images/black_tshirt.png",
    "dataset/images/blue_jeans.png",
    "dataset/images/floral_dress.png",
    "dataset/images/hoodie.png",
    "dataset/images/white_shirt.png"
]

for image in images:

    result = detector.detect_pattern(image)

    print("\nImage:", image)
    print("Detected Pattern:", result["pattern"])
    print("Match Score:", result["match_score"], "%")
