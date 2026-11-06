import torch
from PIL import Image


class StyleDetector:

    def __init__(self, model_manager):

        self.model = model_manager.model
        self.processor = model_manager.processor
        self.device = model_manager.device

        self.styles = [
            "casual clothing",
            "formal clothing",
            "party wear clothing",
            "ethnic clothing",
            "sportswear",
            "streetwear",
            "business casual clothing",
            "traditional clothing"
        ]

        print("Style Detector Connected!")

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

        best_index = torch.argmax(scores).item()

        return {
            "style": self.styles[best_index].replace(" clothing", "").title(),
            "match_score": round(
                scores[best_index].item() * 100, 2
            )
        }