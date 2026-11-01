
import os
import tempfile

from fastapi import FastAPI, UploadFile, File, HTTPException

from src.clothing_classifier import ClothingClassifier
from src.color_detector import ColorDetector
from src.pattern_detector import PatternDetector
from src.attribute_detector import AttributeDetector
from src.style_detector import StyleDetector
from src.material_detector import MaterialDetector


app = FastAPI(
    title="OTD Clothing Recognition API",
    description="AI-powered clothing image recognition",
    version="1.0"
)


# Load AI models once when the API starts
print("Loading OTD AI Models...")

classifier = ClothingClassifier()
color_detector = ColorDetector()
pattern_detector = PatternDetector()
attribute_detector = AttributeDetector()
style_detector = StyleDetector()
material_detector = MaterialDetector()

print("All OTD AI Models Loaded!")


BOTTOMWEAR = [
    "jeans", "trousers", "shorts", "leggings", "skirt"
]

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}


@app.get("/")
def home():

    return {
        "message": "OTD Clothing Recognition API is running",
        "status": "success"
    }


@app.post("/predict")
async def predict_clothing(file: UploadFile = File(...)):

    image_path = None

    try:

        # Validate image extension
        extension = os.path.splitext(file.filename or "")[1].lower()

        if extension not in ALLOWED_EXTENSIONS:

            raise HTTPException(
                status_code=400,
                detail="Only JPG, JPEG and PNG images are supported"
            )

        # Read uploaded image
        image_bytes = await file.read()

        if not image_bytes:

            raise HTTPException(
                status_code=400,
                detail="Uploaded image is empty"
            )

        if len(image_bytes) > 10 * 1024 * 1024:

            raise HTTPException(
                status_code=413,
                detail="Image size must be 10 MB or less"
            )

        # Save image temporarily
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=extension
        ) as temp_file:

            temp_file.write(image_bytes)
            image_path = temp_file.name

        # 1. Clothing category
        category_result = classifier.predict(
            image_path, top_k=1
        )

        category = category_result[0]["category"]

        category = category.replace("a photo of a ", "")
        category = category.replace("a photo of ", "")
        category = category.title()

        # 2. Colour detection
        color_result = color_detector.detect_color(image_path)

        # 3. Pattern detection
        pattern_result = pattern_detector.detect_pattern(image_path)

        # 4. Style detection
        style_result = style_detector.detect_style(image_path)

        # 5. Sleeve and neckline detection
        if category.lower() not in BOTTOMWEAR:

            detected_attributes = (
                attribute_detector.detect_attributes(image_path)
            )

            sleeve = detected_attributes["sleeve"]["attribute"]
            neckline = detected_attributes["neckline"]["attribute"]

            sleeve = sleeve.replace("a person wearing ", "")
            neckline = neckline.replace("a garment with ", "")

            sleeve = sleeve.title()
            neckline = neckline.title()

        else:

            sleeve = "Not applicable"
            neckline = "Not applicable"

        # 6. Material estimation
        material_results = material_detector.detect_material(
            image_path
        )

        best_material = material_results[0]

        # 7. JSON response
        return {
            "status": "success",

            "data": {

                "category": category,

                "color": color_result["color"],

                "secondaryColor": color_result["secondary_color"],

                "attributes": {

                    "material": best_material["material"],

                    "pattern": pattern_result["pattern"],

                    "style": style_result["style"],

                    "sleeve": sleeve,

                    "neckline": neckline
                },

                "confidenceScores": {

                    "category": category_result[0]["match_score"],

                    "pattern": pattern_result["match_score"],

                    "style": style_result["match_score"],

                    "material": best_material["match_score"]
                },

                "colorRGB": color_result["rgb"]
            }
        }

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Clothing recognition failed: {str(error)}"
        )

    finally:

        if image_path and os.path.exists(image_path):
            os.remove(image_path)
