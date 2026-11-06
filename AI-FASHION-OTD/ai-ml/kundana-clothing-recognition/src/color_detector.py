
import cv2
import numpy as np
from sklearn.cluster import KMeans


class ColorDetector:

    def get_color_name(self, rgb):

        r, g, b = map(int, rgb)

        pixel = np.uint8([[[r, g, b]]])

        h, s, v = cv2.cvtColor(
            pixel, cv2.COLOR_RGB2HSV
        )[0][0]

        if v < 50:
            return "Black"
        elif s < 35 and v > 200:
            return "White"
        elif s < 35:
            return "Grey"
        elif h < 10 or h >= 170:
            return "Red"
        elif h < 22:
            return "Brown" if v < 180 else "Orange"
        elif h < 35:
            return "Yellow"
        elif h < 85:
            return "Green"
        elif h < 135:
            return "Blue"
        else:
            return "Purple"

    def detect_color(self, image_path):

        image = cv2.imread(image_path)

        if image is None:
            raise FileNotFoundError("Image not found")

        image = cv2.resize(image, (300, 300))

        height, width = image.shape[:2]

        mask = np.zeros((height, width), np.uint8)

        bg_model = np.zeros((1, 65), np.float64)
        fg_model = np.zeros((1, 65), np.float64)

        rect = (10, 10, width - 20, height - 20)

        cv2.grabCut(
            image,
            mask,
            rect,
            bg_model,
            fg_model,
            5,
            cv2.GC_INIT_WITH_RECT
        )

        foreground = np.where(
            (mask == cv2.GC_FGD) |
            (mask == cv2.GC_PR_FGD),
            1, 0
        )

        pixels = image[foreground == 1]

        if len(pixels) < 100:
            raise ValueError("Could not identify clothing region")

        pixels = cv2.cvtColor(
            pixels.reshape(-1, 1, 3),
            cv2.COLOR_BGR2RGB
        ).reshape(-1, 3)

        kmeans = KMeans(
            n_clusters=3,
            random_state=42,
            n_init=10
        )

        kmeans.fit(pixels)

        counts = np.bincount(kmeans.labels_)
        order = np.argsort(counts)[::-1]

        # Primary colour
        primary_rgb = kmeans.cluster_centers_[order[0]]
        primary_color = self.get_color_name(primary_rgb)

        # Secondary colour
        secondary_rgb = kmeans.cluster_centers_[order[1]]
        secondary_color = self.get_color_name(secondary_rgb)

        secondary_percentage = counts[order[1]] / len(pixels)

        if (
            secondary_percentage >= 0.15
            and secondary_color != primary_color
        ):
            secondary = secondary_color
        else:
            secondary = None

        return {
            "color": primary_color,
            "secondary_color": secondary,
            "rgb": tuple(map(int, primary_rgb))
        }
