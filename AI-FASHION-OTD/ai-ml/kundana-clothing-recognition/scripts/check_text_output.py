import torch
from src.model_manager import FashionCLIPManager

manager = FashionCLIPManager()

inputs = manager.processor(
    text=["a sleeveless garment", "a full sleeve garment"],
    return_tensors="pt",
    padding=True
)

inputs = {k: v.to(manager.device) for k, v in inputs.items()}

with torch.inference_mode():
    output = manager.model.get_text_features(**inputs)

print("Output type:", type(output))
print("Available attributes:", getattr(output, "_fields", None))
print("Output:", output)
