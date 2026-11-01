
import torch
from transformers import CLIPModel, CLIPProcessor
from PIL import Image


class MaterialDetector:

    def __init__(self):

        self.model_name = "patrickjohncyh/fashion-clip"
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        print("Loading Material Detection Model...")

        self.processor = CLIPProcessor.from_pretrained(
            self.model_name
        )

        self.model = CLIPModel.from_pretrained(
            self.model_name
        )

        self.model.to(self.device)
        self.model.eval()

        self.materials = [
            "a close-up photo of cotton fabric",
            "a close-up photo of denim fabric",
            "a close-up photo of wool fabric",
            "a close-up photo of silk fabric",
            "a close-up photo of polyester fabric",
            "a close-up photo of linen fabric",
            "a close-up photo of leather material",
            "a clothing image where the fabric material is unclear"
        ]

        print("Material Detector Loaded!")

    def detect_material(self, image_path):

        image = Image.open(image_path).convert("RGB")

        inputs = self.processor(
            text=self.materials,
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

        top_indices = torch.topk(
            scores, k=3
        ).indices

        results = []

        for index in top_indices:

            material = self.materials[index.item()]

            material = material.replace(
                "a close-up photo of ", ""
            )

            material = material.replace(
                "a clothing image where the fabric material is unclear",
                "Unknown"
            )

            results.append({
                "material": material.replace(" fabric", "").title(),
                "match_score": round(
                    scores[index].item() * 100, 2
                )
            })

        return results
