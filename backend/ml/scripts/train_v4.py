
import os
import json
import torch
import pandas as pd
from torch.utils.data import Dataset
from sklearn.metrics import accuracy_score, f1_score

from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    Trainer,
    TrainingArguments,
    DataCollatorWithPadding,
    TrainerCallback,
)

from peft import LoraConfig, get_peft_model, TaskType

MODEL_NAME = "google/muril-base-cased"
MAX_LENGTH = 128
DATA_DIR = "backend/ml/data/processed"
OUTPUT_DIR = "backend/ml/models/muril_emotion_v4"

class EmotionDataset(Dataset):
    def __init__(self, csv_path, tokenizer):
        self.df = pd.read_csv(csv_path)
        self.tokenizer = tokenizer

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        text = str(self.df.iloc[idx]["text"])
        label = int(self.df.iloc[idx]["label"])

        enc = self.tokenizer(
            text,
            truncation=True,
            max_length=MAX_LENGTH,
            padding=False,
        )

        return {
            "input_ids": torch.tensor(enc["input_ids"], dtype=torch.long),
            "attention_mask": torch.tensor(
                enc["attention_mask"], dtype=torch.long
            ),
            "labels": torch.tensor(label, dtype=torch.long),
        }

class DifferentialLRTrainer(Trainer):
    def create_optimizer(self):
        if self.optimizer is not None:
            return self.optimizer

        lora_params = []
        classifier_params = []

        for name, param in self.model.named_parameters():
            if not param.requires_grad:
                continue

            if "lora_" in name:
                lora_params.append(param)
            elif "classifier" in name or ".score" in name:
                classifier_params.append(param)
            else:
                raise RuntimeError(
                    f"Unexpected trainable parameter: {name}"
                )

        self.optimizer = torch.optim.AdamW([
            {
                "params": lora_params,
                "lr": 1e-4,
                "weight_decay": 0.01,
            },
            {
                "params": classifier_params,
                "lr": 1e-2,
                "weight_decay": 0.01,
            },
        ])

        return self.optimizer

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

train_ds = EmotionDataset(
    f"{DATA_DIR}/train.csv",
    tokenizer,
)

val_ds = EmotionDataset(
    f"{DATA_DIR}/val.csv",
    tokenizer,
)

with open(f"{DATA_DIR}/label_mapping.json", "r") as f:
    label_mapping = json.load(f)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME,
    num_labels=len(label_mapping),
    attn_implementation="eager",
).to(device)
peft_config = LoraConfig(
    task_type=TaskType.SEQ_CLS,
    inference_mode=False,
    r=16,
    lora_alpha=32,
    lora_dropout=0.0,
    target_modules=["query", "value"],
)

model = get_peft_model(model, peft_config)
model = model.to(device)
model.print_trainable_parameters()

# Gradient safety check
model.train()

collator = DataCollatorWithPadding(tokenizer=tokenizer)
batch = collator([train_ds[i] for i in range(4)])
batch = {k: v.to(device) for k, v in batch.items()}
out = model(**batch)
out.loss.backward()

lora_grad = sum(
    p.grad.norm().item()
    for n, p in model.named_parameters()
    if p.grad is not None and "lora_" in n
)

classifier_grad = sum(
    p.grad.norm().item()
    for n, p in model.named_parameters()
    if p.grad is not None
    and ("classifier" in n or ".score" in n)
)

print("Initial loss:", out.loss.item())
print("LoRA gradient:", lora_grad)
print("Classifier gradient:", classifier_grad)

if lora_grad <= 0 or classifier_grad <= 0:
    raise RuntimeError("Gradient safety check failed.")

model.zero_grad(set_to_none=True)

args = TrainingArguments(
    output_dir="./results_v4",
    num_train_epochs=3,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=8,
    per_device_eval_batch_size=2,
    learning_rate=1e-4,
    weight_decay=0.01,
    warmup_steps=500,
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="macro_f1",
    greater_is_better=True,
    logging_steps=25,
    save_total_limit=2,
    fp16=True,
    report_to="none",
    dataloader_num_workers=2,
    dataloader_pin_memory=True,
)

def compute_metrics(pred):
    labels = pred.label_ids
    preds = pred.predictions.argmax(-1)

    return {
        "accuracy": accuracy_score(labels, preds),
        "macro_f1": f1_score(
            labels,
            preds,
            average="macro",
            zero_division=0,
        ),
    }

class Logger(TrainerCallback):
    def on_log(self, args, state, control, logs=None, **kwargs):
        if logs:
            print(
                f"STEP={state.global_step} "
                f"LOSS={logs.get('loss')} "
                f"EVAL_ACC={logs.get('eval_accuracy')} "
                f"EVAL_F1={logs.get('eval_macro_f1')}"
            )

trainer = DifferentialLRTrainer(
    model=model,
    args=args,
    train_dataset=train_ds,
    eval_dataset=val_ds,
    data_collator=collator,
    compute_metrics=compute_metrics,
    callbacks=[Logger()],
)

trainer.train()

os.makedirs(OUTPUT_DIR, exist_ok=True)

trainer.model.save_pretrained(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

with open(f"{OUTPUT_DIR}/label_mapping.json", "w") as f:
    json.dump(label_mapping, f)

metrics = trainer.evaluate()

with open(f"{OUTPUT_DIR}/v4_validation_metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)

print("\nFINAL VALIDATION:")
print(metrics)
print("Saved:", OUTPUT_DIR)
