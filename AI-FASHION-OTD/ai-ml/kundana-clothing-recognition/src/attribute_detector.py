
import torch
from transformers import CLIPModel, CLIPProcessor
from PIL import Image


class AttributeDetector:

    def __init__(self):

        self.model_name = "patrickjohncyh/fashion-clip"

        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        print("Loading Attribute Detection Model...")

        self.processor = CLIPProcessor.from_pretrained(
            self.model_name
        )

        self.model = CLIPModel.from_pretrained(
            self.model_name
        )

        self.model.to(self.device)
        self.model.eval()

        self.sleeve_labels = [
            "a person wearing a sleeveless top",
            "a person wearing a short sleeve t-shirt",
            "a person wearing a half sleeve shirt",
            "a person wearing a three quarter sleeve top",
            "a person wearing a full sleeve shirt"
        ]

        self.neckline_labels = [
            "a garment with a round neckline",
            "a garment with a V neckline",
            "a garment with a crew neckline",
            "a garment with a square neckline",
            "a garment with a scoop neckline",
            "a garment with a boat neckline",
            "a garment with a sweetheart neckline",
            "a garment with a collared neckline"
        ]

        print("Attribute Detector Loaded!")

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

        index = torch.argmax(scores).item()

        return {
            "attribute": labels[index],
            "match_score": round(
                scores[index].item() * 100, 2
            )
        }

    def detect_attributes(self, image_path):

        image = Image.open(image_path).convert("RGB")

        sleeve = self.predict_attribute(
            image, self.sleeve_labels
        )

        neckline = self.predict_attribute(
            image, self.neckline_labels
        )

        return {
            "sleeve": sleeve,
            "neckline": neckline
        }
