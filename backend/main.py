from fastapi import FastAPI
from pydantic import BaseModel
from backend.ml.inference import analyze_text
from backend.language_agent import normalize_text

app = FastAPI(
    title="OMNITRIX API",
    description="Privacy-preserving student safety analysis API",
    version="0.1.0",
)

class ComplaintRequest(BaseModel):
    text: str

class ComplaintResponse(BaseModel):
    risk_level: str
    distress_category: str
    emotion: str
    confidence: float

def map_emotion_to_risk(emotion: str):
    high_risk = {"disapproval", "anger", "disgust", "fear"}
    medium_risk = {"sadness"}
    positive = {"joy", "admiration", "surprise"}

    if emotion in high_risk:
        return "HIGH", "DISTRESS"
    elif emotion in medium_risk:
        return "MEDIUM", "DISTRESS"
    elif emotion in positive:
        return "LOW", "POSITIVE"
    else:
        return "LOW", "NEUTRAL"

@app.get("/")
def root():
    return {
        "service": "OMNITRIX",
        "status": "online",
    }

@app.post("/api/complaint", response_model=ComplaintResponse)
def analyze_complaint(request: ComplaintRequest):
    # Perform actual inference using MuRIL v3
    normalized_text = normalize_text(request.text)
    result = analyze_text(normalized_text)
    emotion = result["emotion"]
    confidence = result["confidence"]

    risk_level, distress_category = map_emotion_to_risk(emotion)

    return ComplaintResponse(
        risk_level=risk_level,
        distress_category=distress_category,
        emotion=emotion,
        confidence=confidence
    )