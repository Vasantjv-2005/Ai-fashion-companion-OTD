
import os
import json
import base64
from io import BytesIO

from dotenv import load_dotenv
from openai import AsyncOpenAI, APIError
from fastapi import FastAPI, UploadFile, File, HTTPException
from PIL import Image, UnidentifiedImageError

load_dotenv()

app = FastAPI(
    title="OTD Fashion AI API",
    description="AI-powered personal fashion companion",
    version="1.0.0",
)

api_key = os.getenv("OPENAI_API_KEY")
model = os.getenv("OPENAI_MODEL", "gpt-5.5")

client = AsyncOpenAI(api_key=api_key) if api_key else None


@app.get("/")
def home():
    return {
        "message": "Welcome to OTD Fashion AI!",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/analyze-clothing")
async def analyze_clothing(file: UploadFile = File(...)):
    if client is None:
        raise HTTPException(
            status_code=503,
            detail="OpenAI API key is not configured in backend/.env",
        )

    allowed_types = {
        "image/jpeg": "jpeg",
        "image/png": "png",
        "image/webp": "webp",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Upload a JPG, PNG, or WEBP image.",
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image must be smaller than 10 MB.",
        )

    try:
        image = Image.open(BytesIO(image_bytes))
        image.verify()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image.",
        )

    mime_type = file.content_type
    encoded_image = base64.b64encode(image_bytes).decode("utf-8")
    image_data_url = f"data:{mime_type};base64,{encoded_image}"

    prompt = """
    You are a clothing analysis assistant for a digital wardrobe.

    Analyse the provided image and return ONLY a valid JSON object
    with these fields:
    {
      "category": "clothing category",
      "color": "main visible color",
      "pattern": "visible pattern or solid",
      "material": "likely material or unknown",
      "style": "casual, formal, sporty, or other",
      "confidence": 0
    }

    Confidence must be an integer from 0 to 100 indicating
    your estimated confidence in the overall visual classification.
    Do not claim certainty about material if it cannot be
    determined from the image. Use "unknown" when necessary.
    If the image is not clothing, set category to "Other"
    and explain that it is not identifiable clothing in the
    material field.
    """

    try:
        response = await client.responses.create(
            model=model,
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": prompt},
                        {
                            "type": "input_image",
                            "image_url": image_data_url,
                            "detail": "auto",
                        },
                    ],
                }
            ],
        )

        result = json.loads(response.output_text)

        required_fields = {
            "category", "color", "pattern",
            "material", "style", "confidence"
        }

        if not required_fields.issubset(result.keys()):
            raise ValueError("AI response is missing required fields")

        confidence = result["confidence"]
        if (
            isinstance(confidence, bool)
            or not isinstance(confidence, int)
            or not 0 <= confidence <= 100
        ):
            raise ValueError("Invalid confidence value")

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="AI returned an invalid JSON response. Please retry.",
        )
    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="AI returned an unexpected result. Please retry.",
        )
    except APIError as e:
        print("OpenAI API error:", repr(e))
        status = getattr(e, "status_code", None)

        if status == 401:
            detail = "Invalid OpenAI API key. Check backend/.env."
        else:
            detail = f"OpenAI API request failed (status {status})."

        raise HTTPException(
            status_code=502,
            detail=detail
        ) from e
    return {
        "filename": file.filename,
        "status": "success",
        "analysis": result,
    }
