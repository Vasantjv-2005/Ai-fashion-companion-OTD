import torch
from transformers import CLIPModel, CLIPProcessor


class FashionCLIPManager:

    def __init__(self):

        self.model_name = "patrickjohncyh/fashion-clip"

        self.device = (
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        print("Loading shared FashionCLIP model...")
        print("Device:", self.device)

        self.processor = CLIPProcessor.from_pretrained(
            self.model_name
        )

        self.model = CLIPModel.from_pretrained(
            self.model_name
        )

        self.model.to(self.device)
        self.model.eval()

        print("Shared FashionCLIP model loaded!")