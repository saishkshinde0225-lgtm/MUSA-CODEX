# MuRIL V5-B — Final Evaluation

## Final held-out test

Test samples: 2569

- Accuracy: **59.83%**
- Macro F1: **57.26%**
- Weighted F1: **58.52%**

## Validation

- Accuracy: **58.97%**
- Macro F1: **56.83%**

## Main per-class test F1

| Emotion | F1 |
|---|---:|
| admiration | 0.6587 |
| anger | 0.6013 |
| disapproval | 0.8262 |
| disgust | 0.3458 |
| fear | 0.6126 |
| joy | 0.6485 |
| love | 0.7645 |
| neutral | 0.3529 |
| sadness | 0.4323 |
| surprise | 0.4831 |

## V4 comparison

| Metric | V4 | V5-B |
|---|---:|---:|
| Accuracy | 56.83% | **59.83%** |
| Macro F1 | 51.44% | **57.26%** |
| Weighted F1 | 54.45% | **58.52%** |

## Status

V5-B is the current frozen model.

Training is intentionally paused after V5-B.
Future improvements will be handled as a separate experiment.

Checkpoint:
`muril_emotion_v5b/results/checkpoint-3855`
