# OTD – AI-Powered Digital Closet

## 1. Project Overview

OTD Digital Closet is an AI-powered application that allows users to upload clothing images, automatically analyse clothing attributes, save items to a digital wardrobe, and receive outfit recommendations based on occasions.

## 2. My Contribution – AI/ML + Integration

My primary responsibility is integrating the AI model with the OTD application and connecting the frontend, backend, AI service, and database.

### Key Contributions
- Set up the FastAPI backend.
- Integrated a pretrained Hugging Face clothing classification model.
- Implemented clothing image upload and AI analysis.
- Added clothing colour detection.
- Connected AI analysis results with the frontend.
- Integrated database operations for saving and managing clothing items.
- Tested outfit recommendation functionality.

## 3. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | Python, FastAPI |
| AI Model | Hugging Face Transformers |
| Model | wargoninnovation/wargon-clothing-classifier |
| Database | SQLite |
| ORM | SQLAlchemy |
| API Testing | FastAPI Swagger UI |

## 4. AI Integration Workflow

The application follows this workflow:

1. **Frontend:** User uploads a clothing image.
2. **API:** React sends the image to the FastAPI backend.
3. **AI Service:** The pretrained model analyses the clothing image.
4. **Processing:** Backend processes the predicted category, confidence, and detected colour.
5. **Database:** User can save the analysed clothing item.
6. **Frontend:** Analysis results and saved clothing items are displayed.

## 5. Main API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Checks backend health |
| POST | `/analyze-clothing` | Analyses uploaded clothing images |
| GET | `/clothing-items` | Retrieves saved clothing items |
| POST | `/clothing-items` | Saves a clothing item |
| PUT | `/clothing-items/{item_id}` | Updates a clothing item |
| DELETE | `/clothing-items/{item_id}` | Deletes a clothing item |
| GET | `/recommend-outfit` | Generates outfit recommendations |

## 6. AI Analysis Output

The AI analysis provides:
- Clothing category
- Detected colour
- Model confidence score
- Alternative classification predictions

**Note:** Fabric and pattern are not currently detected by the integrated classification model.

## 7. Testing and Validation

The following tests were completed successfully:

| Test | Status |
|---|---|
| Backend health check | Passed |
| Clothing image upload | Passed |
| AI clothing analysis | Passed |
| Save clothing to database | Passed |
| Retrieve saved clothing | Passed |
| Outfit recommendations | Passed |

No errors were reported during the latest testing.

## 8. Running the Application

### Start Backend

```powershell
cd C:\Users\katta\OneDrive\Documents\Desktop\OTD\backend
..\.venv\Scripts\python.exe -m uvicorn main:app --reload
```

Backend URL: `http://127.0.0.1:8000`

API documentation: `http://127.0.0.1:8000/docs`

### Start Frontend

Open another terminal:

```powershell
cd C:\Users\katta\OneDrive\Documents\Desktop\OTD\frontend
npm.cmd run dev
```

Frontend URL: `http://localhost:5173/`

## 9. Future Improvements

- Improve clothing classification accuracy.
- Explore dedicated models for fabric and pattern detection.
- Improve colour detection using clothing segmentation.
- Evaluate model performance using a labelled clothing image dataset.
- Improve outfit recommendations using AI-based matching.

## 10. Conclusion

The AI integration prototype successfully connects the React frontend, FastAPI backend, pretrained Hugging Face model, and database. Users can upload clothing images, view AI-generated analysis, save clothing items, and receive outfit recommendations.