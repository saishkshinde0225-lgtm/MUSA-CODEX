from fastapi import FastAPI
from pydantic import BaseModel

from backend.ml.inference import analyze_text
from backend.language_agent import normalize_text
from backend.privacy.transformer import transform_for_privacy
from backend.supabase_repository import insert_complaint
from backend.tracking import generate_tracking_token, hash_tracking_token


app = FastAPI(
    title="OMNITRIX API",
    description="Privacy-preserving student safety analysis API",
    version="0.1.0",
)


class ComplaintRequest(BaseModel):
    text: str
    category: str | None = None
    location: str | None = None
    timeframe: str | None = None
    desired_action: str | None = None
    urgency: str | None = None


class ComplaintResponse(BaseModel):
    risk_level: str
    distress_category: str
    emotion: str
    confidence: float
    tracking_token: str


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
    # Privacy transformation happens before normalization and MuRIL V5-B inference.
    privacy_safe_text = transform_for_privacy(request.text)

    normalized_text = normalize_text(privacy_safe_text)

    result = analyze_text(normalized_text)

    emotion = result["emotion"]
    confidence = result["confidence"]

    risk_level, distress_category = map_emotion_to_risk(emotion)

    # Generate a tracking token for the student.
    # Only its SHA-256 hash is persisted in Supabase.
    tracking_token = generate_tracking_token()
    tracking_token_hash = hash_tracking_token(tracking_token)

    insert_complaint(
        {
            "tracking_token_hash": tracking_token_hash,
            "privacy_safe_text": privacy_safe_text,
            "category": request.category,
            "location": request.location,
            "timeframe": request.timeframe,
            "desired_action": request.desired_action,
            "urgency": request.urgency,
            "emotion": emotion,
            "confidence": confidence,
            "distress_category": distress_category,
            "risk_level": risk_level,
            "ml_model_version": "MuRIL-V5-B",
            "normalization_applied": True,
        }
    )

    return ComplaintResponse(
        risk_level=risk_level,
        distress_category=distress_category,
        emotion=emotion,
        confidence=confidence,
        tracking_token=tracking_token,
    )