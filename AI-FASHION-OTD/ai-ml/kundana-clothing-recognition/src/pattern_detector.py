
import torch
from transformers import CLIPModel, CLIPProcessor
from PIL import Image


class PatternDetector:

    def __init__(self):

        self.model_name = "patrickjohncyh/fashion-clip"

        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        print("Loading Pattern Detection Model...")

        self.processor = CLIPProcessor.from_pretrained(
            self.model_name
        )

        self.model = CLIPModel.from_pretrained(
            self.model_name
        )

        self.model.to(self.device)
        self.model.eval()

        self.patterns = [
            "a photo of plain clothing",
            "a photo of floral patterned clothing",
            "a photo of striped clothing",
            "a photo of checked clothing",
            "a photo of polka dot clothing",
            "a photo of printed clothing",
            "a photo of geometric patterned clothing"
        ]

        print("Pattern Detector Loaded!")

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

        index = torch.argmax(scores).item()

        pattern = self.patterns[index]

        pattern = pattern.replace(
            "a photo of ", ""
        ).replace(" clothing", "")

        return {
            "pattern": pattern.title(),
            "match_score": round(scores[index].item() * 100, 2)
        }
