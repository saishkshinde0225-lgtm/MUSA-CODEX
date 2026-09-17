import os
import json
import torch
import sys

from transformers import AutoTokenizer, AutoModelForSequenceClassification
from peft import PeftModel

# Add backend/ml to path
sys.path.append(os.path.join(os.getcwd(), "backend/ml"))
from config import MODEL_SAVE_PATH, DEVICE

class EmotionAnalyzer:
    def __init__(self):
        self.device = DEVICE
        self.model_path = MODEL_SAVE_PATH

        # Load label mapping
        with open(os.path.join(self.model_path, "label_mapping.json"), "r") as f:
            self.label_mapping = json.load(f)

        # Load tokenizer and model
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)

        # Load base model
        base_model = AutoModelForSequenceClassification.from_pretrained(
            "google/muril-base-cased",
            num_labels=len(self.label_mapping),
            attn_implementation="eager"
        ).to(self.device)

        # Load PEFT adapter
        self.model = PeftModel.from_pretrained(base_model, self.model_path).to(self.device)
        self.model.eval()

    def analyze_text(self, text: str):
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=128,
            padding=True
        ).to(self.device)

        with torch.no_grad():
            outputs = self.model(**inputs)

        probs = torch.nn.functional.softmax(outputs.logits, dim=1)
        conf, pred_id = torch.max(probs, dim=1)

        emotion = self.label_mapping.get(str(int(pred_id.item())), "unknown")
        confidence = float(conf.item())

        return {
            "emotion": emotion,
            "confidence": confidence,
            "model": "MuRIL"
        }

# Singleton for easy use
analyzer = None

def get_analyzer():
    global analyzer
    if analyzer is None:
        analyzer = EmotionAnalyzer()
    return analyzer

def analyze_text(text: str):
    return get_analyzer().analyze_text(text)
