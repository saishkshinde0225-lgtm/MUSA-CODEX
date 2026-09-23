Bilkul. Ye **current-state README v1** hai — sirf abhi tak actually implemented/merged work ko document karta hai. V6, transformer hardening, UI cleanup etc. ko future/in-progress rakha hai.

`README.md` ka pura existing content replace karke ye paste karo:

````markdown
# OMNITRIX — Privacy-Preserving Student Safety Intelligence

OMNITRIX is a privacy-focused NLP system designed to analyse anonymous student safety complaints and identify high-level distress signals while reducing unnecessary exposure of personally identifying and stylistic information.

The system combines an Android complaint client, a FastAPI backend, a privacy transformation layer, multilingual/code-mixed text normalization, a fine-tuned MuRIL emotion classifier, Supabase persistence, and an administrative dashboard.

> **Current status:** Core backend, privacy pipeline, ML inference, Supabase persistence, Admin API, and React/Vite admin dashboard are integrated. Privacy hardening, model upgrades, UI refinement, database cleanup, and final validation are still in progress.

---

## Problem Statement

Anonymous student complaints can contain important distress signals expressed through:

- Indirect or emotional language
- Hinglish and code-mixed text
- Regional-language phrases
- Spelling and transliteration variations
- Informal or fragmented writing
- Repeated punctuation and expressive writing styles

Simply removing explicit names or contact information is not sufficient for strong privacy protection. Writing style itself can potentially provide information that helps link multiple anonymous complaints.

OMNITRIX therefore introduces a privacy transformation stage before downstream language normalization and ML inference.

The objective is to extract safety-relevant signals while minimizing unnecessary identifying and stylistic information.

---

## Core Pipeline

```text
Anonymous Complaint
        |
        v
Privacy Transformation
        |
        v
Multilingual / Code-Mixed Normalization
        |
        v
MuRIL V5-B Emotion Classification
        |
        v
Risk + Distress Mapping
        |
        v
Privacy-Safe Database Persistence
        |
        v
Admin Dashboard
````

The privacy transformation is performed before normalization and inference.

The system does not intentionally persist the original complaint field. The database stores the transformed `privacy_safe_text` representation along with analysis metadata.

---

## System Architecture

```text
                    ┌──────────────────────┐
                    │      Android App     │
                    │    Kotlin / Compose  │
                    └──────────┬───────────┘
                               │
                               v
                    ┌──────────────────────┐
                    │    FastAPI Backend   │
                    └──────────┬───────────┘
                               │
                               v
                    ┌──────────────────────┐
                    │ Privacy Transformation│
                    │      Layer           │
                    └──────────┬───────────┘
                               │
                               v
                    ┌──────────────────────┐
                    │ Language Normalizer  │
                    │ Hinglish / Marathi   │
                    │ / Code-Mixed Text    │
                    └──────────┬───────────┘
                               │
                               v
                    ┌──────────────────────┐
                    │      MuRIL V5-B      │
                    │ Emotion Classifier   │
                    └──────────┬───────────┘
                               │
                               v
                    ┌──────────────────────┐
                    │ Risk / Distress     │
                    │ Mapping             │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┴──────────────┐
                 │                            │
                 v                            v
        ┌──────────────────┐        ┌──────────────────┐
        │     Supabase     │        │ Admin Dashboard  │
        │ Privacy-Safe DB  │        │ React + Vite     │
        └──────────────────┘        └──────────────────┘
```

---

# Privacy Transformation

The privacy layer is implemented in:

```text
backend/privacy/transformer.py
```

The current transformation pipeline includes:

1. Unicode normalization
2. Direct identifier masking
3. Contextual identifier masking
4. Word-elongation normalization
5. Punctuation normalization
6. Whitespace normalization
7. Capitalization normalization

### Currently handled identifier patterns

* Email addresses
* Phone numbers
* URLs
* Student IDs
* Roll numbers
* Enrollment / registration numbers
* Social-media handles
* Long numeric identifiers
* Titled person references
* Room numbers
* Academic context identifiers
* Division identifiers

Example transformation:

```text
Raw:
My roll number is 23AIML12345 and my email is student@example.com.

Privacy-transformed:
my roll number is [STUDENT_ID] and my email is [EMAIL].
```

The transformation also reduces some stylistic signals such as:

```text
Soooo scared!!! 
```

being normalized toward a less stylistically distinctive representation.

### Privacy limitation

The current transformer is an engineering privacy layer and **does not constitute a mathematical proof that re-identification is impossible**.

The transformer is still being hardened against:

* False-positive masking
* Indian names
* Context-dependent names
* Hinglish/lowercase names
* Cross-complaint stylometric linkage
* Adversarial writing-style patterns

Stronger privacy claims will only be made after dedicated adversarial evaluation.

---

# Machine Learning

## Base Model

```text
google/muril-base-cased
```

MuRIL (Multilingual Representations for Indian Languages) is used as the multilingual transformer backbone.

The project uses parameter-efficient fine-tuning with LoRA/PEFT adapters.

## Current Model

```text
MuRIL V5-B
```

The current classifier performs 10-class emotion classification.

The emotion labels include:

```text
admiration
anger
disapproval
disgust
fear
joy
love
neutral
sadness
surprise
```

## Current Validation Metrics

The repository currently contains the following V5-B validation results:

| Metric              |  Value |
| ------------------- | -----: |
| Validation Accuracy | 0.5897 |
| Macro F1            | 0.5683 |
| Evaluation Loss     | 1.2937 |

These are validation metrics for the emotion-classification model and should not be interpreted as real-world safety-detection accuracy.

---

# Emotion to Risk Mapping

The backend currently converts emotion predictions into higher-level safety indicators.

```text
Anger
Disapproval
Disgust
Fear
        ↓
HIGH RISK
DISTRESS
```

```text
Sadness
        ↓
MEDIUM RISK
DISTRESS
```

```text
Joy
Admiration
Surprise
        ↓
LOW RISK
POSITIVE
```

Other/neutral predictions are mapped to:

```text
LOW RISK
NEUTRAL
```

This risk mapping is a deterministic application-layer rule and is separate from the underlying emotion classifier.

---

# Multilingual Normalization

OMNITRIX includes an optional language-normalization layer implemented in:

```text
backend/language_agent.py
```

The normalization layer is designed to handle:

* English
* Hindi
* Hinglish
* Marathi
* Regional/code-mixed phrasing
* Spelling variations
* Transliteration variations

The current default OpenRouter model is:

```text
qwen/qwen3-8b
```

The normalization stage occurs after privacy transformation.

Therefore, the intended order is:

```text
Raw Complaint
      ↓
Privacy Transformation
      ↓
External/Local Normalization
      ↓
MuRIL Inference
```

If an OpenRouter API key is not configured, the system continues operating using the privacy-transformed text without making an external normalization request.

---

# Backend

## Technology Stack

* Python
* FastAPI
* Uvicorn
* Pydantic
* PyTorch
* Transformers
* PEFT / LoRA
* MuRIL
* Supabase
* OpenRouter

## Main Complaint API

```text
POST /api/complaint
```

Request:

```json
{
  "text": "student complaint text",
  "category": "optional category",
  "location": "optional location",
  "timeframe": "optional timeframe",
  "desired_action": "optional requested action",
  "urgency": "optional urgency"
}
```

Response:

```json
{
  "risk_level": "HIGH",
  "distress_category": "DISTRESS",
  "emotion": "fear",
  "confidence": 0.82,
  "tracking_token": "..."
}
```

The exact output depends on the model prediction.

---

## Health Endpoint

```text
GET /
```

Example response:

```json
{
  "service": "OMNITRIX",
  "status": "online"
}
```

---

# Tracking Token

Each complaint receives a generated tracking token.

The backend performs:

```text
Generated Tracking Token
        ↓
SHA-256 Hash
        ↓
Persist Hash in Database
```

The raw tracking token is returned to the client while only the hash is persisted.

Implementation:

```text
backend/tracking.py
```

---

# Supabase Database

Supabase is used for complaint persistence.

The complaint schema is designed around privacy-safe data rather than storing an `original_complaint` field.

The database stores information such as:

* Privacy-safe complaint text
* Category
* Location
* Timeframe
* Desired action
* Urgency
* Emotion
* Confidence
* Distress category
* Risk level
* ML model version
* Normalization status
* Complaint status
* Tracking-token hash
* Created/updated timestamps

## Complaint Statuses

```text
NEW
UNDER_REVIEW
ACTION_REQUIRED
RESOLVED
CLOSED
```

A separate status-history table records complaint status transitions.

Row Level Security is enabled in the current database design. Production authorization policies and additional database hardening are still part of future cleanup.

---

# Admin Dashboard

The admin frontend is integrated into the repository:

```text
admin-frontend/
```

Technology:

* React
* TypeScript
* Vite
* Lucide React

The dashboard communicates with the FastAPI backend.

## Current Dashboard Features

* Complaint listing
* Complaint summary statistics
* Category filtering
* Complaint detail view
* Privacy-safe complaint text display
* Risk information
* Emotion information
* Complaint status updates
* Status history
* API-backed data retrieval
* Local/demo operator authentication flow

---

# Admin API

The current admin API is exposed under:

```text
/api/admin
```

Available endpoints:

```text
GET   /api/admin/summary

GET   /api/admin/complaints

GET   /api/admin/complaints/{complaint_id}

PATCH /api/admin/complaints/{complaint_id}/status

GET   /api/admin/complaints/{complaint_id}/history
```

The admin repository intentionally exposes the privacy-safe complaint representation instead of the original complaint field.

### Current Authentication Limitation

The current admin authentication flow is a local/demo frontend flow.

It should **not be considered production-grade backend authorization**.

Production authentication and authorization still need to be implemented and hardened.

---

# Project Structure

```text
MUSA-CODEX/
│
├── admin-frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── assets/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.ts
│
├── backend/
│   ├── main.py
│   ├── admin_routes.py
│   ├── admin_repository.py
│   ├── language_agent.py
│   ├── supabase_client.py
│   ├── supabase_repository.py
│   ├── tracking.py
│   │
│   ├── ml/
│   │   ├── config.py
│   │   ├── inference.py
│   │   ├── models/
│   │   ├── results/
│   │   └── scripts/
│   │
│   └── privacy/
│       └── transformer.py
│
├── tests/
│   ├── test_privacy.py
│   └── test_privacy_integration.py
│
├── requirements.txt
├── .gitignore
└── README.md
```

---

# Local Setup

## 1. Clone Repository

```bash
git clone https://github.com/saishkshinde0225-lgtm/MUSA-CODEX.git
cd MUSA-CODEX
```

## 2. Backend Environment

Create a Python virtual environment.

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

## 3. Environment Variables

Create a local `.env` file.

Example:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_server_side_secret

OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=qwen/qwen3-8b
```

Never commit:

* API keys
* Supabase secret keys
* Passwords
* Authentication tokens
* Other credentials

The repository ignores the local environment files.

---

# Start Backend

From the repository root:

```powershell
uvicorn backend.main:app --reload
```

Default local address:

```text
http://127.0.0.1:8000
```

---

# Start Admin Dashboard

Open another terminal:

```powershell
cd admin-frontend
npm install
npm run dev
```

The frontend API configuration uses:

```env
VITE_API_MODE=api
VITE_API_BASE_URL=http://127.0.0.1:8000
```

The local `.env` file should remain untracked.

---

# Testing

Privacy tests are located under:

```text
tests/
├── test_privacy.py
└── test_privacy_integration.py
```

Run the test suite:

```powershell
python -m pytest -q
```

The integration tests verify that the privacy transformation occurs before downstream normalization and model inference.

The privacy test suite is being expanded with additional adversarial cases.

---

# Privacy Threat Model

OMNITRIX considers the following categories privacy-relevant:

### Direct identifiers

* Names
* Email addresses
* Phone numbers
* Student IDs
* Roll numbers
* Registration numbers
* Social handles

### Contextual identifiers

* Staff references
* Room numbers
* Academic identifiers
* Other contextual information that may narrow identity

### Stylometric signals

* Capitalization habits
* Repeated punctuation
* Word elongation
* Decorative punctuation
* Other unnecessary writing-style characteristics

### External processing

Any text sent to an external normalization service must already have passed through the privacy transformation stage.

### Persistence

The database is designed to persist the privacy-safe representation rather than the original complaint text.

---

# Current Development Status

## Completed

* [x] FastAPI backend
* [x] Complaint API
* [x] Android/backend integration foundation
* [x] MuRIL-based emotion inference
* [x] MuRIL V5-B model integration
* [x] Privacy transformation layer
* [x] Privacy-safe complaint persistence
* [x] Hashed tracking tokens
* [x] Supabase integration
* [x] Admin API
* [x] React/Vite admin dashboard
* [x] Complaint listing
* [x] Complaint detail view
* [x] Complaint status workflow
* [x] Status history
* [x] Multilingual/code-mixed normalization layer
* [x] Basic privacy integration tests
* [x] End-to-end admin dashboard integration

## Currently In Progress

* [ ] Privacy transformer hardening
* [ ] False-positive masking fixes
* [ ] Better Indian-name/context handling
* [ ] Cross-complaint stylometric privacy evaluation
* [ ] V5-C / V6 model development and integration
* [ ] Backend cleanup
* [ ] Database cleanup and authorization hardening
* [ ] Admin UI refinement
* [ ] Full regression testing

---

# Future Work

Planned improvements include:

1. Stronger privacy transformation and adversarial evaluation.
2. Improved handling of names in Indian and code-mixed text.
3. Cross-complaint stylometric linkage testing.
4. Improved emotion-classification model performance.
5. V5-C / V6 model integration.
6. Production-grade admin authentication and authorization.
7. Database schema and security-policy cleanup.
8. Admin dashboard UI refinement.
9. Full end-to-end regression testing.
10. Final system benchmarking and documentation.

---

# Important Limitations

OMNITRIX is currently a hackathon/student project and should not be treated as a production safety or disciplinary decision-making system.

The current ML model predicts emotion classes and the application maps those predictions to risk categories. It is not a standalone ground-truth detector of actual incidents.

The current privacy layer reduces direct identifiers and selected stylistic signals, but it does not provide a formal mathematical guarantee of zero re-identification risk.

The admin authentication layer is currently suitable for the demonstrated workflow and requires production-grade authorization before deployment in a real institutional environment.

---

# Repository Workflow

The repository currently uses:

```text
main
```

as the stable integrated branch.

Development and experimental work is performed on:

```text
feature/dashboard
```

The development branch can be tested and stabilized before changes are merged into `main`.

---

# Project Status

OMNITRIX currently has an integrated working foundation covering:

```text
Android Client
      ↓
Privacy Transformation
      ↓
Language Normalization
      ↓
MuRIL V5-B
      ↓
Risk Mapping
      ↓
Supabase
      ↓
Admin API
      ↓
Admin Dashboard
```

The next development phase focuses on privacy hardening, model improvement, backend/database cleanup, UI refinement, and complete system validation.

---

## License

This project is currently developed as a student hackathon project.

Licensing and redistribution terms should be finalized before public production distribution.

````






