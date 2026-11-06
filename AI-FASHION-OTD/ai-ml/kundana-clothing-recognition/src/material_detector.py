import torch
from PIL import Image


class MaterialDetector:

    def __init__(self, model_manager):

        self.model = model_manager.model
        self.processor = model_manager.processor
        self.device = model_manager.device

        self.material_prompts = {
            "Cotton": [
                "a cotton fabric clothing item",
                "clothing made of soft cotton",
                "a garment with cotton texture"
            ],
            "Denim": [
                "a denim clothing item",
                "clothing made of denim fabric",
                "a garment with denim texture"
            ],
            "Wool": [
                "a wool clothing item",
                "clothing made of wool",
                "a garment with wool texture"
            ],
            "Silk": [
                "a silk clothing item",
                "clothing made of silk fabric",
                "a garment with smooth silk texture"
            ],
            "Polyester": [
                "a polyester clothing item",
                "clothing made of polyester",
                "a garment with synthetic polyester texture"
            ],
            "Linen": [
                "a linen clothing item",
                "clothing made of linen fabric",
                "a garment with linen texture"
            ],
            "Leather": [
                "a leather clothing item",
                "clothing made of leather",
                "a garment with leather texture"
            ],
            "Nylon": [
                "a nylon clothing item",
                "clothing made of nylon",
                "a garment with nylon texture"
            ],
            "Fleece": [
                "a fleece clothing item",
                "clothing made of fleece",
                "a garment with fleece texture"
            ],
            "Unknown": [
                "a clothing item made of an unknown material",
                "a fabric that cannot be identified",
                "a garment with unclear material texture"
            ]
        }

        print("Material Detector Connected!")

    def detect_material(self, image_path, top_k=3):

        image = Image.open(image_path).convert("RGB")

        materials = list(self.material_prompts.keys())

        all_prompts = [
            prompt
            for prompts in self.material_prompts.values()
            for prompt in prompts
        ]

        inputs = self.processor(
            text=all_prompts,
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

        logits = outputs.logits_per_image[0]

        material_scores = []

        for index, material in enumerate(materials):

            start = index * 3
            end = start + 3

            average_score = logits[start:end].mean()

            material_scores.append(average_score)

        material_scores = torch.stack(material_scores)
        probabilities = material_scores.softmax(dim=0)

        top_k = min(top_k, len(materials))

        values, indices = torch.topk(
            probabilities,
            top_k
        )

        results = []

        for score, index in zip(values, indices):

            results.append({
                "material": materials[index.item()],
                "match_score": round(
                    score.item() * 100, 2
                )
            })

        return results