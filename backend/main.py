
import base64
import uuid
import itertools
import re
from io import BytesIO
from pathlib import Path
from typing import Optional

import numpy as np
from PIL import Image, ImageOps

from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Depends,
    HTTPException
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from pydantic import BaseModel
from sqlalchemy.orm import Session

from transformers import pipeline

import models
from database import engine, get_db


# ==================================================
# APPLICATION SETUP
# ==================================================

app = FastAPI(
    title="OTD Digital Closet API",
    description="AI-powered personal digital wardrobe",
    version="2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Create database tables without deleting existing data.
models.Base.metadata.create_all(bind=engine)

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory=str(UPLOAD_DIR)),
    name="uploads"
)


# ==================================================
# AI MODEL SETUP
# ==================================================

MODEL_NAME = "wargoninnovation/wargon-clothing-classifier"

classifier = None
model_error = None


def load_classifier():
    global classifier, model_error

    if classifier is not None:
        return classifier

    if model_error is not None:
        raise RuntimeError(model_error)

    try:
        print("\nLoading clothing classification model...")

        classifier = pipeline(
            "image-classification",
            model=MODEL_NAME
        )

        print("\n========== AI MODEL LABELS ==========")
        print(classifier.model.config.id2label)
        print("=====================================\n")

        print("Clothing AI model loaded successfully.")

        return classifier

    except Exception as error:
        model_error = str(error)

        raise RuntimeError(
            "Could not load the clothing AI model: " + str(error)
        )


# ==================================================
# CATEGORY DETECTION AND LABEL HANDLING
# ==================================================

CATEGORY_MAPPING = {
    "t shirt": "T-Shirt",
    "tshirt": "T-Shirt",
    "tee shirt": "T-Shirt",
    "trouser": "Trousers",
    "trousers": "Trousers",
    "jean": "Jeans",
    "jeans": "Jeans",
    "sneaker": "Sneakers",
    "sneakers": "Sneakers",
    "footwear": "Shoes",
    "shoe": "Shoes",
    "shoes": "Shoes",
    "handbag": "Bag",
    "purse": "Bag",
    "coat": "Coat",
    "jacket": "Jacket",
    "shirt": "Shirt",
    "dress": "Dress",
    "skirt": "Skirt",
    "blouse": "Blouse",
    "sweater": "Sweater",
    "hoodie": "Hoodie",
    "shorts": "Shorts",
    "legging": "Leggings",
    "leggings": "Leggings"
}


def format_category(label, model=None):
    """
    Converts model labels into readable clothing categories.

    It does not assume that LABEL_13 means Shirt.
    If a model returns an unknown numeric label, we report
    Unknown rather than inventing a category.
    """

    original_label = str(label).strip()

    if model is not None:
        id2label = getattr(
            model.model.config,
            "id2label",
            {}
        )

        match = re.fullmatch(
            r"LABEL[_ -]?(\d+)",
            original_label,
            flags=re.IGNORECASE
        )

        if match:
            label_index = int(match.group(1))

            mapped_label = (
                id2label.get(label_index)
                or id2label.get(str(label_index))
            )

            if mapped_label:
                original_label = str(mapped_label).strip()

    normalized = original_label.replace("_", " ").strip()

    if re.fullmatch(
        r"LABEL[_ -]?\d+",
        normalized,
        flags=re.IGNORECASE
    ):
        return "Unknown"

    normalized_key = normalized.lower()

    if normalized_key in CATEGORY_MAPPING:
        return CATEGORY_MAPPING[normalized_key]

    return normalized.title()


# ==================================================
# COLOUR DETECTION
# ==================================================

COLOR_VALUES = {
    "Black": (20, 20, 20),
    "White": (245, 245, 245),
    "Grey": (128, 128, 128),
    "Red": (220, 35, 45),
    "Blue": (35, 90, 200),
    "Navy Blue": (25, 40, 95),
    "Green": (35, 145, 65),
    "Olive": (125, 125, 45),
    "Yellow": (245, 220, 40),
    "Orange": (245, 135, 35),
    "Pink": (235, 145, 175),
    "Purple": (130, 65, 165),
    "Brown": (120, 75, 45),
    "Beige": (215, 195, 155),
    "Cream": (245, 240, 215),
    "Maroon": (125, 25, 45),
    "Peach": (245, 180, 150),
    "Gold": (205, 170, 55),
    "Silver": (185, 190, 195)
}


def detect_color(image):
    """
    Estimates the dominant colour from the central region.

    This reduces some background influence, but it is not
    clothing segmentation. Background pixels can still affect
    the result if the clothing does not fill the central region.
    """

    image = image.convert("RGB")

    width, height = image.size

    left = int(width * 0.20)
    top = int(height * 0.20)
    right = int(width * 0.80)
    bottom = int(height * 0.80)

    cropped = image.crop(
        (left, top, right, bottom)
    )

    cropped.thumbnail((120, 120))

    pixels = np.asarray(
        cropped,
        dtype=np.float32
    ).reshape(-1, 3)

    if len(pixels) == 0:
        return "Unknown"

    # Quantize colours to reduce the effect of tiny variations.
    quantized = (
        np.round(pixels / 16) * 16
    )

    quantized = np.clip(
        quantized,
        0,
        255
    )

    # Find the most frequently occurring colour group.
    groups, counts = np.unique(
        quantized.astype(np.uint8),
        axis=0,
        return_counts=True
    )

    dominant_pixel = groups[
        np.argmax(counts)
    ].astype(np.float32)

    # Compare using weighted RGB distance.
    # Green and blue differences are weighted slightly more.
    def color_distance(reference):
        difference = dominant_pixel - np.array(
            reference,
            dtype=np.float32
        )

        return np.sqrt(
            0.30 * difference[0] ** 2
            + 0.59 * difference[1] ** 2
            + 0.11 * difference[2] ** 2
        )

    nearest_color = min(
        COLOR_VALUES,
        key=lambda name: color_distance(
            COLOR_VALUES[name]
        )
    )

    return nearest_color


# ==================================================
# PYDANTIC SCHEMAS
# ==================================================

class ClothingCreate(BaseModel):
    category: str
    color: str

    fabric: Optional[str] = "Unknown"
    pattern: Optional[str] = "Unknown"
    confidence: Optional[float] = None
    image_path: Optional[str] = None


class ClothingUpdate(BaseModel):
    category: Optional[str] = None
    color: Optional[str] = None

    fabric: Optional[str] = None
    pattern: Optional[str] = None
    confidence: Optional[float] = None
    image_path: Optional[str] = None


# ==================================================
# IMAGE STORAGE
# ==================================================

def save_uploaded_image(image_data):
    try:
        if not image_data:
            return None

        if image_data.startswith("data:"):
            if "," not in image_data:
                raise ValueError("Invalid image data URL.")

            image_data = image_data.split(",", 1)[1]

        image_bytes = base64.b64decode(
            image_data,
            validate=True
        )

        if len(image_bytes) > 10 * 1024 * 1024:
            raise ValueError("Image size must be below 10 MB.")

        image = Image.open(
            BytesIO(image_bytes)
        )

        image = ImageOps.exif_transpose(image)
        image = image.convert("RGB")

        filename = f"{uuid.uuid4().hex}.jpg"
        filepath = UPLOAD_DIR / filename

        # Save as actual JPEG instead of assigning a .jpg
        # extension to PNG or WebP bytes.
        image.save(
            filepath,
            format="JPEG",
            quality=90,
            optimize=True
        )

        return f"/uploads/{filename}"

    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image data: {str(error)}"
        )


def prepare_image(contents):
    try:
        image = Image.open(
            BytesIO(contents)
        )

        image = ImageOps.exif_transpose(image)
        image = image.convert("RGB")

        return image

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image."
        )


# ==================================================
# ITEM SERIALIZATION
# ==================================================

def serialize_item(item):
    return {
        "id": item.id,
        "category": item.category,
        "color": item.color,
        "fabric": item.fabric,
        "pattern": item.pattern,
        "confidence": item.confidence,
        "image_path": item.image_path
    }


# ==================================================
# ROOT AND HEALTH ENDPOINTS
# ==================================================

@app.get("/")
def home():
    return {
        "status": "success",
        "message": "OTD Digital Closet API is running",
        "version": "2.0"
    }


@app.get("/health")
def health():
    return {
        "status": "success",
        "database": "connected",
        "ai_model": (
            "loaded" if classifier is not None
            else "not loaded yet"
        ),
        "model_name": MODEL_NAME
    }


# ==================================================
# AI CLOTHING IMAGE ANALYSIS
# ==================================================

@app.post("/analyze-clothing")
async def analyze_clothing(
    file: UploadFile = File(...)
):

    allowed_types = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG or WebP image."
        )

    try:
        contents = await file.read()

        if not contents:
            raise HTTPException(
                status_code=400,
                detail="The uploaded image is empty."
            )

        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="Image size must be below 10 MB."
            )

        image = prepare_image(contents)

        model = load_classifier()

        predictions = model(
            image,
            top_k=5
        )

        if not predictions:
            raise HTTPException(
                status_code=500,
                detail="The AI model could not identify the clothing."
            )

        alternatives = []

        for prediction in predictions:

            category = format_category(
                prediction["label"],
                model
            )

            confidence = round(
                float(prediction["score"]) * 100,
                2
            )

            alternatives.append({
                "category": category,
                "confidence": confidence
            })

        best_prediction = predictions[0]

        category = format_category(
            best_prediction["label"],
            model
        )

        confidence = round(
            float(best_prediction["score"]) * 100,
            2
        )

        color = detect_color(image)

        return {
            "status": "success",
            "analysis": {
                "category": category,
                "color": color,
                "confidence": confidence,
                "alternatives": alternatives,
                "fabric": "Unknown",
                "pattern": "Unknown",
                "attribute_notes": {
                    "category": "Predicted by the clothing classification model.",
                    "color": "Estimated using dominant colour sampling.",
                    "fabric": "Not detected by the current model. Please select manually.",
                    "pattern": "Not detected by the current model. Please select manually."
                }
            }
        }

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Image analysis failed: {str(error)}"
        )

    finally:
        await file.close()


# ==================================================
# GET ALL CLOTHING ITEMS
# ==================================================

@app.get("/clothing-items")
def get_clothing_items(
    db: Session = Depends(get_db)
):

    items = (
        db.query(models.ClothingItem)
        .order_by(models.ClothingItem.id.desc())
        .all()
    )

    return [
        serialize_item(item)
        for item in items
    ]


# ==================================================
# ADD CLOTHING ITEM
# ==================================================

@app.post("/clothing-items")
def add_clothing_item(
    clothing: ClothingCreate,
    db: Session = Depends(get_db)
):

    saved_image_path = None

    if clothing.image_path:
        saved_image_path = save_uploaded_image(
            clothing.image_path
        )

    new_item = models.ClothingItem(
        category=clothing.category,
        color=clothing.color,
        fabric=clothing.fabric or "Unknown",
        pattern=clothing.pattern or "Unknown",
        confidence=clothing.confidence,
        image_path=saved_image_path
    )

    try:
        db.add(new_item)
        db.commit()
        db.refresh(new_item)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not save the clothing item."
        )

    return {
        "status": "success",
        "message": "Clothing item saved successfully",
        "item": serialize_item(new_item)
    }


# ==================================================
# UPDATE CLOTHING ITEM
# ==================================================

@app.put("/clothing-items/{item_id}")
def update_clothing_item(
    item_id: int,
    clothing: ClothingUpdate,
    db: Session = Depends(get_db)
):

    item = (
        db.query(models.ClothingItem)
        .filter(models.ClothingItem.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Clothing item not found"
        )

    update_data = clothing.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():

        if field == "image_path":
            if value and value.startswith("data:"):
                value = save_uploaded_image(value)

        if value is not None:
            setattr(item, field, value)

    try:
        db.commit()
        db.refresh(item)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not update the clothing item."
        )

    return {
        "status": "success",
        "message": "Clothing item updated successfully",
        "item": serialize_item(item)
    }


# ==================================================
# DELETE CLOTHING ITEM
# ==================================================

@app.delete("/clothing-items/{item_id}")
def delete_clothing_item(
    item_id: int,
    db: Session = Depends(get_db)
):

    item = (
        db.query(models.ClothingItem)
        .filter(models.ClothingItem.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Clothing item not found"
        )

    image_file = None

    if item.image_path:
        filename = Path(item.image_path).name
        image_file = UPLOAD_DIR / filename

    try:
        db.delete(item)
        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not delete the clothing item."
        )

    if image_file and image_file.exists():
        try:
            image_file.unlink()
        except OSError:
            pass

    return {
        "status": "success",
        "message": "Clothing item deleted successfully"
    }


# ==================================================
# OUTFIT RECOMMENDATION HELPERS
# ==================================================

def get_item_group(category):

    category = (category or "").lower().strip()

    dresses = [
        "dress", "gown", "saree", "lehenga",
        "jumpsuit", "one piece"
    ]

    tops = [
        "shirt", "t-shirt", "top", "blouse",
        "kurti", "kurta", "sweater", "hoodie",
        "jacket", "blazer", "coat", "suit"
    ]

    bottoms = [
        "jeans", "trousers", "trouser", "pants",
        "leggings", "shorts", "skirt", "palazzo"
    ]

    shoes = [
        "shoes", "sneakers", "sandals", "heels",
        "boots", "footwear"
    ]

    accessories = [
        "bag", "accessories", "watch", "belt",
        "scarf", "jewellery", "jewelry",
        "sunglasses", "hat", "cap"
    ]

    if any(word in category for word in dresses):
        return "dress"

    if any(word in category for word in tops):
        return "top"

    if any(word in category for word in bottoms):
        return "bottom"

    if any(word in category for word in shoes):
        return "shoes"

    if any(word in category for word in accessories):
        return "accessory"

    return "other"


# ==================================================
# OCCASION MATCHING
# ==================================================

def occasion_score(item, occasion):

    category = (item.category or "").lower()
    fabric = (item.fabric or "").lower()

    occasion = occasion.lower()

    score = 0

    formal_words = [
        "office", "formal", "interview",
        "business", "meeting"
    ]

    casual_words = [
        "college", "casual", "daily",
        "shopping", "outing"
    ]

    party_words = [
        "party", "birthday", "club",
        "celebration", "wedding"
    ]

    traditional_words = [
        "traditional", "festival",
        "ethnic", "puja", "function"
    ]

    sports_words = [
        "gym", "sports", "workout",
        "running", "exercise"
    ]

    if any(word in occasion for word in formal_words):

        if any(word in category for word in [
            "shirt", "trouser", "blazer",
            "coat", "suit", "kurta"
        ]):
            score += 5

        if fabric in ["cotton", "linen", "wool"]:
            score += 2

    elif any(word in occasion for word in casual_words):

        if any(word in category for word in [
            "t-shirt", "jeans", "top",
            "kurti", "shorts", "sneakers"
        ]):
            score += 5

    elif any(word in occasion for word in party_words):

        if any(word in category for word in [
            "dress", "gown", "heels",
            "blazer", "lehenga"
        ]):
            score += 5

        if fabric in ["silk", "satin", "velvet"]:
            score += 2

    elif any(word in occasion for word in traditional_words):

        if any(word in category for word in [
            "saree", "lehenga", "kurta",
            "kurti", "ethnic", "traditional"
        ]):
            score += 6

    elif any(word in occasion for word in sports_words):

        if any(word in category for word in [
            "sportswear", "shorts", "t-shirt",
            "sneakers", "leggings"
        ]):
            score += 5

    return score


# ==================================================
# BASIC COLOUR COMPATIBILITY
# ==================================================

COLOR_FAMILIES = {
    "Black": "neutral",
    "White": "neutral",
    "Grey": "neutral",
    "Silver": "neutral",
    "Cream": "neutral",
    "Beige": "neutral",
    "Brown": "neutral",
    "Navy Blue": "blue",
    "Blue": "blue",
    "Red": "red",
    "Maroon": "red",
    "Pink": "pink",
    "Peach": "pink",
    "Green": "green",
    "Olive": "green",
    "Yellow": "yellow",
    "Gold": "yellow",
    "Orange": "orange",
    "Purple": "purple"
}


def color_compatibility_score(outfit):

    colors = [
        (item.color or "").strip().title()
        for item in outfit
    ]

    colors = [
        color for color in colors
        if color in COLOR_FAMILIES
    ]

    if len(colors) < 2:
        return 0

    families = [
        COLOR_FAMILIES[color]
        for color in colors
    ]

    neutral_count = families.count("neutral")
    unique_families = set(families)

    score = 0

    # Neutral colours work with many other colours.
    score += neutral_count * 2

    # A limited number of colour families generally
    # makes an outfit easier to coordinate.
    if len(unique_families) <= 2:
        score += 4
    elif len(unique_families) == 3:
        score += 1
    else:
        score -= 2

    # Avoid excessive repeated colours in one outfit.
    if len(families) != len(set(families)):
        score += 1

    return score


def outfit_score(outfit, occasion):

    occasion_points = sum(
        occasion_score(item, occasion)
        for item in outfit
    )

    color_points = color_compatibility_score(outfit)

    return occasion_points + color_points


# ==================================================
# GENERATE MULTIPLE OUTFIT COMBINATIONS
# ==================================================

@app.get("/recommend-outfit")
def recommend_outfit(
    occasion: str = "Casual Wear",
    variation: int = 0,
    db: Session = Depends(get_db)
):

    if variation < 0:
        raise HTTPException(
            status_code=400,
            detail="Variation must be zero or greater."
        )

    occasion = occasion.strip()

    if not occasion:
        raise HTTPException(
            status_code=400,
            detail="Please provide an occasion."
        )

    all_items = (
        db.query(models.ClothingItem)
        .order_by(models.ClothingItem.id.asc())
        .all()
    )

    if not all_items:
        return {
            "status": "success",
            "occasion": occasion,
            "message": "Your closet is empty. Add clothing items first.",
            "total_outfits": 0,
            "outfit": [],
            "outfits": []
        }

    groups = {
        "top": [],
        "bottom": [],
        "dress": [],
        "shoes": [],
        "accessory": [],
        "other": []
    }

    for item in all_items:
        group = get_item_group(item.category)
        groups[group].append(item)

    # Sort relevant items first.
    for group_name in groups:

        groups[group_name].sort(
            key=lambda item: (
                occasion_score(item, occasion),
                item.id
            ),
            reverse=True
        )

    # Limit the number of combinations.
    tops = groups["top"][:20]
    bottoms = groups["bottom"][:20]
    dresses = groups["dress"][:20]
    shoes = groups["shoes"][:15]
    accessories = groups["accessory"][:15]

    combinations = []

    shoe_options = shoes if shoes else [None]

    accessory_options = (
        accessories[:5] if accessories else [None]
    )

    # Dress-based combinations.
    for dress in dresses:

        for shoe, accessory in itertools.product(
            shoe_options,
            accessory_options
        ):

            outfit = [dress]

            if shoe:
                outfit.append(shoe)

            if accessory:
                outfit.append(accessory)

            combinations.append(outfit)

    # Top + bottom combinations.
    for top, bottom in itertools.product(
        tops,
        bottoms
    ):

        for shoe, accessory in itertools.product(
            shoe_options,
            accessory_options
        ):

            outfit = [top, bottom]

            if shoe:
                outfit.append(shoe)

            if accessory:
                outfit.append(accessory)

            combinations.append(outfit)

    # Fallback when complete outfits are unavailable.
    if not combinations:

        fallback_items = (
            tops + bottoms + dresses + shoes + accessories
        )

        if not fallback_items:
            fallback_items = groups["other"]

        if fallback_items:
            combinations = [
                [item] for item in fallback_items
            ]

    # Remove duplicate combinations.
    unique_combinations = []
    seen = set()

    for outfit in combinations:

        outfit_key = tuple(
            sorted(item.id for item in outfit)
        )

        if outfit_key not in seen:
            seen.add(outfit_key)
            unique_combinations.append(outfit)

    # Rank by occasion and colour compatibility.
    unique_combinations.sort(
        key=lambda outfit: (
            outfit_score(outfit, occasion),
            len(outfit)
        ),
        reverse=True
    )

    if not unique_combinations:
        return {
            "status": "success",
            "occasion": occasion,
            "message": "Not enough clothing items to create an outfit.",
            "total_outfits": 0,
            "outfit": [],
            "outfits": []
        }

    # Rotate results for Generate Another Outfit.
    total = len(unique_combinations)

    start_index = (variation * 3) % total

    rotated = (
        unique_combinations[start_index:]
        + unique_combinations[:start_index]
    )

    selected_outfits = rotated[:3]

    response_outfits = []

    for index, outfit in enumerate(selected_outfits):

        response_outfits.append({
            "outfit_number": index + 1,
            "items": [
                serialize_item(item)
                for item in outfit
            ],
            "match_score": outfit_score(
                outfit,
                occasion
            )
        })

    return {
        "status": "success",
        "occasion": occasion,
        "message": (
            f"Found {len(response_outfits)} outfit "
            f"combination(s) for {occasion}."
        ),
        "total_outfits": total,
        "outfit": response_outfits[0]["items"],
        "outfits": response_outfits
    }
