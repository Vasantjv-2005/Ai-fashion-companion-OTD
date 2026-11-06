import torch
from PIL import Image


class AttributeDetector:

    def __init__(self, model_manager):

        self.model = model_manager.model
        self.processor = model_manager.processor
        self.device = model_manager.device

        self.sleeve_labels = [
            "a sleeveless clothing item",
            "a short sleeve shirt",
            "a half sleeve shirt",
            "a three quarter sleeve top",
            "a full sleeve shirt"
        ]

        self.neckline_labels = [
            "a round neckline",
            "a V neckline",
            "a crew neckline",
            "a square neckline",
            "a scoop neckline",
            "a boat neckline",
            "a sweetheart neckline",
            "a collared neckline"
        ]

        print("Attribute Detector Connected!")

    def predict_attribute(self, image, labels):

        inputs = self.processor(
            text=labels,
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
            "attribute": labels[best_index].replace("a ", "").replace(" shirt", "").replace(" top", "").replace(" clothing item", "").title(),
            "match_score": round(
                scores[best_index].item() * 100, 2
            )
        }

    def detect_attributes(self, image_path):

        image = Image.open(image_path).convert("RGB")

        sleeve = self.predict_attribute(
            image,
            self.sleeve_labels
        )

        neckline = self.predict_attribute(
            image,
            self.neckline_labels
        )

        return {
            "sleeve": sleeve,
            "neckline": neckline
        }