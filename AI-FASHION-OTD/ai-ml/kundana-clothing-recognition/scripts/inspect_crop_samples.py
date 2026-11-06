import os
import random
import matplotlib.pyplot as plt
from PIL import Image

BASE = r"dataset\fashionpedia\crops"

categories = [
    "dress",
    "pants",
    "jacket",
    "shirt_blouse",
    "top_t_shirt_sweatshirt",
    "skirt",
    "coat",
    "shorts",
    "sweater",
    "cardigan",
    "jumpsuit",
    "vest",
    "cape"
]

samples = []

for category in categories:
    folder = os.path.join(BASE, category)
    files = os.listdir(folder)

    if files:
        filename = random.choice(files)
        samples.append((category, os.path.join(folder, filename)))

fig, axes = plt.subplots(4, 4, figsize=(14, 14))
axes = axes.flatten()

for ax, (category, path) in zip(axes, samples):
    image = Image.open(path)
    ax.imshow(image)
    ax.set_title(category)
    ax.axis("off")

for ax in axes[len(samples):]:
    ax.axis("off")

plt.tight_layout()
plt.savefig(
    r"dataset\fashionpedia\processed\crop_sample_grid.png",
    dpi=150
)
plt.show()
