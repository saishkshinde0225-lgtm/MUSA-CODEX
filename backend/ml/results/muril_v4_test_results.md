# MuRIL V4 — Final Test Evaluation

## Checkpoint

`checkpoint-3855`

## Test Set

2,569 samples

## Final Test Metrics

- Accuracy: **56.83%**
- Macro F1: **51.44%**
- Weighted F1: **54.45%**

## Epoch 3 Validation

- Validation Accuracy: **54.885%**
- Validation Macro F1: **49.769%**

## Classification Summary

| Emotion | Precision | Recall | F1 |
|---|---:|---:|---:|
| admiration | 0.6743 | 0.6788 | 0.6766 |
| anger | 0.3961 | 0.6241 | 0.4846 |
| disapproval | 0.7519 | 0.9668 | 0.8459 |
| disgust | 0.0000 | 0.0000 | 0.0000 |
| fear | 0.5848 | 0.5051 | 0.5420 |
| joy | 0.6091 | 0.6448 | 0.6265 |
| love | 0.7143 | 0.7736 | 0.7428 |
| neutral | 0.3460 | 0.4205 | 0.3797 |
| sadness | 0.5286 | 0.4152 | 0.4651 |
| surprise | 0.7097 | 0.2604 | 0.3810 |

## Current Error-Analysis Targets

- `disgust`: F1 = 0.0000
- `neutral`: F1 = 0.3797
- `surprise`: F1 = 0.3810

## Status

V4 training is complete.
Checkpoint-3855 is preserved.
Final held-out test evaluation is complete.

Next phase: V4 error analysis before deciding whether V5 training is required.
