# OTD – AI Clothing Recognition

An AI-powered clothing recognition system built using Python, FashionCLIP, OpenCV, and FastAPI.

## Project Overview

This project identifies clothing items from uploaded images and extracts useful attributes to support the OTD (Outfit of the Day) application.

## Features

- Clothing category classification
- Dominant colour detection
- Pattern recognition
- Sleeve and neckline detection
- Style classification
- Material estimation
- REST API for image-based predictions

## Technologies Used

- Python
- FashionCLIP
- Hugging Face Transformers
- PyTorch
- OpenCV
- NumPy
- FastAPI
- Uvicorn

## Project Structure

```text
OTD-AI-Clothing-Recognition/
├── dataset/
│   └── images/
├── src/
│   ├── clothing_classifier.py
│   ├── color_detector.py
│   ├── pattern_detector.py
│   ├── attribute_detector.py
│   ├── style_detector.py
│   └── material_detector.py
├── tests/
├── outputs/
├── models/
├── main.py
├── api.py
├── requirements.txt
└── README.md
```

## Run Locally

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the API:

```bash
uvicorn api:app --reload
```

Open the API documentation:

```text
http://127.0.0.1:8000/docs
```

## Current Status

The initial prototype supports clothing classification and attribute detection. It has been tested with 10 sample clothing images.

## Limitations

- Material detection is an estimation from images.
- Style classification can be subjective.
- Similarity scores are not measured accuracy.
- Performance may vary with image quality, lighting, and backgrounds.

## Project Role

AI/ML and Computer Vision – OTD Project