
import re
import pandas as pd

from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

BASE = Path("dataset/fashionpedia")
REPORTS = Path("reports")

PAIRS = [
    ("dress", "top, t-shirt, sweatshirt"),
    ("shirt, blouse", "top, t-shirt, sweatshirt"),
    ("skirt", "dress"),
    ("top, t-shirt, sweatshirt", "dress"),
    ("shirt, blouse", "jacket"),
]

CELL_W = 560
CELL_H = 300
COLUMNS = 2


def parse_bbox(value):
    numbers = re.findall(r"-?\d+(?:\.\d+)?", str(value))

    if len(numbers) < 4:
        return None

    return [float(x) for x in numbers[:4]]


def draw_image_panel(sheet, image_path, x, y, panel_w, panel_h,
                     bbox=None):
    image = Image.open(image_path).convert("RGB")
    original_w, original_h = image.size

    scale = min(
        panel_w / original_w,
        panel_h / original_h
    )

    new_w = int(original_w * scale)
    new_h = int(original_h * scale)

    image = image.resize((new_w, new_h))

    offset_x = x + (panel_w - new_w) // 2
    offset_y = y + (panel_h - new_h) // 2

    sheet.paste(image, (offset_x, offset_y))

    if bbox:
        bx, by, bw, bh = bbox

        left = offset_x + bx * scale
        top = offset_y + by * scale
        right = offset_x + (bx + bw) * scale
        bottom = offset_y + (by + bh) * scale

        draw = ImageDraw.Draw(sheet)
        draw.rectangle(
            (left, top, right, bottom),
            outline="red",
            width=3
        )


def main():
    errors = pd.read_csv(
        REPORTS / "supervised_validation_errors.csv"
    )

    validation = pd.read_csv(
        BASE / "processed" / "validation.csv"
    )

    data = errors.merge(
        validation,
        left_on="image_file",
        right_on="crop_file",
        how="left"
    )

    selected = []

    for actual, predicted in PAIRS:
        pair = data[
            (data["actual_category"] == actual) &
            (data["predicted_category"] == predicted)
        ].head(4)

        selected.extend(pair.to_dict("records"))

    if not selected:
        print("No matching errors found.")
        return

    rows = (len(selected) + COLUMNS - 1) // COLUMNS

    sheet = Image.new(
        "RGB",
        (COLUMNS * CELL_W, rows * CELL_H),
        "white"
    )

    draw = ImageDraw.Draw(sheet)

    for index, item in enumerate(selected):
        x = (index % COLUMNS) * CELL_W
        y = (index // COLUMNS) * CELL_H

        original_path = BASE / "train" / str(item["original_file"])
        crop_path = BASE / "crops" / str(item["crop_file"])

        draw.text(
            (x + 10, y + 5),
            f"Actual: {item['actual_category']} | "
            f"Predicted: {item['predicted_category']}",
            fill="black"
        )

        draw.text(
            (x + 10, y + 23),
            f"Confidence: {item['confidence']:.1f}%",
            fill="blue"
        )

        panel_y = y + 48
        panel_w = 265
        panel_h = 220

        draw.text((x + 10, y + 35), "ORIGINAL + ANNOTATION", fill="red")
        draw.text((x + 285, y + 35), "MODEL INPUT CROP", fill="green")

        try:
            bbox = parse_bbox(item["bbox"])

            draw_image_panel(
                sheet,
                original_path,
                x + 5,
                panel_y,
                panel_w,
                panel_h,
                bbox
            )

            draw_image_panel(
                sheet,
                crop_path,
                x + 280,
                panel_y,
                panel_w,
                panel_h
            )

        except Exception as error:
            draw.text(
                (x + 10, y + 100),
                f"Could not load image: {error}",
                fill="red"
            )

    output = REPORTS / "original_vs_crop_inspection.jpg"
    sheet.save(output, quality=92)

    print("Inspection sheet saved:", output)
    print("Images included:", len(selected))


if __name__ == "__main__":
    main()
