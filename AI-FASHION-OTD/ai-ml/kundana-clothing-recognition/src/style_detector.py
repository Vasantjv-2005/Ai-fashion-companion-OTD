
import torch
from transformers import CLIPModel, CLIPProcessor
from PIL import Image


class StyleDetector:

    def __init__(self):

        self.model_name = "patrickjohncyh/fashion-clip"
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        print("Loading Style Detection Model...")

        self.processor = CLIPProcessor.from_pretrained(
            self.model_name
        )

        self.model = CLIPModel.from_pretrained(
            self.model_name
        )

        self.model.to(self.device)
        self.model.eval()

        self.styles = [
            "a photo of casual clothing",
            "a photo of formal clothing",
            "a photo of party wear clothing",
            "a photo of ethnic clothing",
            "a photo of sportswear",
            "a photo of streetwear",
            "a photo of business casual clothing",
            "a photo of traditional clothing"
        ]

        print("Style Detector Loaded!")

    def detect_style(self, image_path):

        image = Image.open(image_path).convert("RGB")

        inputs = self.processor(
            text=self.styles,
            images=image,
            return_tensors="pt",
            padding=True
        )

        inputs = {
            key: value.to(self.device)
            for key, value in inputs.items()
        }

        with torch.inference_mode():
            outputs = self.model(**inputs)

        scores = outputs.logits_per_image.softmax(dim=1)[0]

        index = torch.argmax(scores).item()

        style = self.styles[index]
        style = style.replace("a photo of ", "")
        style = style.replace(" clothing", "")

        return {
            "style": style.title(),
            "match_score": round(
                scores[index].item() * 100, 2
            )
        }
