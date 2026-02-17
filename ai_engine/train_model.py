import pandas as pd
import joblib
import os

from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

# ---------- Paths ----------
BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, "synthetic_emergency_data_augmented.csv")
MODEL_DIR = os.path.join(BASE_DIR, "model")

os.makedirs(MODEL_DIR, exist_ok=True)

# ---------- Load Data ----------
# If the primary synthetic file does not exist, fall back to the bundled dataset
if not os.path.exists(DATA_PATH):
    fallback = os.path.join(BASE_DIR, "model", "emergency_dataset.csv")
    if os.path.exists(fallback):
        print(f"[train_model] primary data not found at {DATA_PATH}, falling back to {fallback}")
        DATA_PATH = fallback
    else:
        raise FileNotFoundError(
            f"Could not find training data. Checked: {DATA_PATH} and {fallback}."
        )

df = pd.read_csv(DATA_PATH)

FEATURES = ["age", "heart_rate", "spo2", "systolic_bp", "diastolic_bp"]
TARGET = "severity"

X = df[FEATURES]
y = df[TARGET]

# ---------- Encode Labels ----------
label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

# ---------- Train / Test Split ----------
try:
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
except ValueError:
    # Dataset too small for stratified split; fall back to non-stratified
    print("[train_model] dataset too small for stratified split, proceeding without stratify")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42
    )

# ---------- Train Model ----------
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=10,
    min_samples_split=10,
    class_weight="balanced",
    random_state=42
)

model.fit(X_train, y_train)

# ---------- Save Artifacts ----------
joblib.dump(model, os.path.join(MODEL_DIR, "emergency_model.pkl"))
joblib.dump(label_encoder, os.path.join(MODEL_DIR, "label_encoder.pkl"))

print("✅ Model trained successfully")
print("Classes:", label_encoder.classes_)
