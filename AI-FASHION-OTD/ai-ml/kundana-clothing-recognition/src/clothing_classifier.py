# OTD Clothing Recognition
# Model: FashionCLIP

import torch
from transformers import CLIPModel, CLIPProcessor
from PIL import Image


class ClothingClassifier:

    def __init__(self):
        self.model_name = "patrickjohncyh/fashion-clip"

        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        print("Loading FashionCLIP model...")
        print("Device:", self.device)

        self.processor = CLIPProcessor.from_pretrained(
            self.model_name
        )

        self.model = CLIPModel.from_pretrained(
            self.model_name
        )

        self.model.to(self.device)
        self.model.eval()

        self.categories = [
            "a photo of a t-shirt",
            "a photo of a shirt",
            "a photo of jeans",
            "a photo of trousers",
            "a photo of a dress",
            "a photo of a skirt",
            "a photo of a jacket",
            "a photo of a hoodie",
            "a photo of shorts",
            "a photo of a sweater",
            "a photo of a coat",
            "a photo of a blouse",
            "a photo of leggings",
            "a photo of a kurta",
            "a photo of a saree",
            "a photo of a jumpsuit"
        ]

        print("FashionCLIP loaded successfully!")

    def predict(self, image_path, top_k=5):

        image = Image.open(image_path).convert("RGB")

        inputs = self.processor(
            text=self.categories,
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

        top_k = min(top_k, len(self.categories))
        values, indices = torch.topk(scores, top_k)

        predictions = []

        for score, index in zip(values, indices):
            category = self.categories[index.item()]
            category = category.replace("a photo of a ", "")

            predictions.append({
                "category": category,
                "match_score": round(score.item() * 100, 2)
            })

        return predictions