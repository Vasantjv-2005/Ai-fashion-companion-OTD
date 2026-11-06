
import sys
import os

# Add the main project folder to Python's path
sys.path.append(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from src.color_detector import ColorDetector

detector = ColorDetector()

images = [
    "dataset/images/black_tshirt.png",
    "dataset/images/blue_jeans.png",
    "dataset/images/floral_dress.png",
    "dataset/images/hoodie.png",
    "dataset/images/white_shirt.png"
]

for image in images:

    result = detector.detect_color(image)

    print("\nImage:", image)
    print("Detected Color:", result["color"])
    print("RGB Value:", result["rgb"])
