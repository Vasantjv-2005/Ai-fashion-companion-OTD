
import torch
from PIL import Image


class PatternDetector:

    def __init__(self, model_manager):

        self.model = model_manager.model
        self.processor = model_manager.processor
        self.device = model_manager.device

        self.patterns = [
            "a plain clothing item",
            "a floral patterned clothing item",
            "a striped clothing item",
            "a checked clothing item",
            "a polka dot clothing item",
            "a printed clothing item",
            "a geometric patterned clothing item"
        ]

        print("Pattern Detector Connected!")

    def detect_pattern(self, image_path):

        image = Image.open(image_path).convert("RGB")

        inputs = self.processor(
            text=self.patterns,
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

        pattern = self.patterns[best_index]
        pattern = pattern.replace("a ", "")
        pattern = pattern.replace(" clothing item", "")

        return {
            "pattern": pattern.title(),
            "match_score": round(
                scores[best_index].item() * 100, 2
            )
        }
