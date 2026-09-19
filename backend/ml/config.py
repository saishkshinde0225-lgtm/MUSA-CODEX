import torch

# Model Configuration
MODEL_NAME = "google/muril-base-cased"

# Training Hyperparameters
MAX_SEQ_LENGTH = 128
BATCH_SIZE = 4
EPOCHS = 3
LEARNING_RATE = 5e-5

# Paths
RAW_DATA_PATH = "backend/ml/data/raw/emotion_hinghlish_dataset.xlsx"
PROCESSED_DIR = "backend/ml/data/processed"
MODEL_SAVE_PATH = "backend/ml/models/muril_emotion_v5b/model"

# Device Detection
def get_device():
    if torch.backends.mps.is_available():
        return torch.device("mps")
    elif torch.cuda.is_available():
        return torch.device("cuda")
    else:
        return torch.device("cpu")

DEVICE = get_device()
