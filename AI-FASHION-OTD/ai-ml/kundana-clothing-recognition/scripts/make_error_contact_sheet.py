import pandas as pd
from pathlib import Path
from PIL import Image, ImageDraw

BASE = Path("dataset/fashionpedia")
REPORTS = Path("reports")

PAIRS = [
    ("dress", "top, t-shirt, sweatshirt"),
    ("shirt, blouse", "top, t-shirt, sweatshirt"),
    ("skirt", "dress"),
    ("top, t-shirt, sweatshirt", "dress"),
    ("shirt, blouse", "jacket"),
]

CELL_W = 280
CELL_H = 260
COLUMNS = 4


def main():
    errors = pd.read_csv(
        REPORTS / "supervised_validation_errors.csv"
    )

    selected = []

    for actual, predicted in PAIRS:
        pair = errors[
            (errors["actual_category"] == actual) &
            (errors["predicted_category"] == predicted)
        ].head(4)

        selected.extend(pair.to_dict("records"))

    rows = (len(selected) + COLUMNS - 1) // COLUMNS

    sheet = Image.new(
        "RGB",
        (COLUMNS * CELL_W, rows * CELL_H),
        "white"
    )

    draw = ImageDraw.Draw(sheet)

    for index, item in enumerate(selected):
        image_path = BASE / "crops" / item["image_file"]

        try:
            image = Image.open(image_path).convert("RGB")
            image.thumbnail((CELL_W - 20, 195))

            x = (index % COLUMNS) * CELL_W
            y = (index // COLUMNS) * CELL_H

            image_x = x + (CELL_W - image.width) // 2
            sheet.paste(image, (image_x, y + 5))

            draw.text(
                (x + 8, y + 205),
                f"Actual: {item['actual_category'][:30]}",
                fill="black"
            )

            draw.text(
                (x + 8, y + 222),
                f"Predicted: {item['predicted_category'][:30]}",
                fill="red"
            )

            draw.text(
                (x + 8, y + 239),
                f"Confidence: {item['confidence']:.1f}%",
                fill="blue"
            )

        except Exception as error:
            print("Could not load:", image_path, error)

    output = REPORTS / "error_contact_sheet.jpg"
    sheet.save(output, quality=90)

    print("Contact sheet saved:", output)
    print("Images included:", len(selected))


if __name__ == "__main__":
    main()