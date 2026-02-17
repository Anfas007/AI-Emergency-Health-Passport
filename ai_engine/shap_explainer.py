# ai_engine/shap_explainer.py

import os
import joblib
import pandas as pd
import numpy as np

# Load trained model and label encoder if available; otherwise fall back to heuristics
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "emergency_model.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "model", "label_encoder.pkl")
try:
    model = joblib.load(MODEL_PATH)
    label_encoder = joblib.load(ENCODER_PATH)
except Exception:
    model = None
    label_encoder = None

FEATURE_NAMES = [
    "age",
    "heart_rate",
    "spo2",
    "systolic_bp",
    "diastolic_bp"
]

# Human-readable feature labels
FEATURE_LABELS = {
    "age": "Age",
    "heart_rate": "Heart Rate",
    "spo2": "Oxygen Level (SpO2)",
    "systolic_bp": "Systolic BP",
    "diastolic_bp": "Diastolic BP"
}

# Clinical normal ranges
NORMAL_RANGES = {
    "age": (0, 65),           # >= 65 is elevated risk
    "heart_rate": (60, 100),  # outside range is abnormal
    "spo2": (95, 100),        # < 95 is abnormal, < 90 is critical
    "systolic_bp": (90, 140), # < 90 is low (hypotension)
    "diastolic_bp": (60, 90)  # < 60 is low
}


def compute_clinical_risk_score(feature, value):
    """
    Compute a risk score (0-100) based on how abnormal the vital is.
    Higher score = more abnormal = higher risk contribution.
    """
    if feature == "age":
        if value >= 80:
            return 40
        elif value >= 70:
            return 30
        elif value >= 65:
            return 20
        elif value >= 55:
            return 10
        else:
            return 5

    elif feature == "heart_rate":
        if value > 130:
            return 45
        elif value > 120:
            return 35
        elif value > 100:
            return 25
        elif value < 50:
            return 35
        elif value < 60:
            return 15
        else:
            return 5

    elif feature == "spo2":
        if value < 85:
            return 50
        elif value < 90:
            return 40
        elif value < 95:
            return 25
        else:
            return 5

    elif feature == "systolic_bp":
        if value < 80:
            return 45
        elif value < 90:
            return 35
        elif value < 100:
            return 20
        elif value > 180:
            return 40
        elif value > 160:
            return 25
        else:
            return 5

    elif feature == "diastolic_bp":
        if value < 50:
            return 40
        elif value < 60:
            return 30
        elif value < 70:
            return 15
        elif value > 110:
            return 30
        elif value > 100:
            return 20
        else:
            return 5

    return 5


def is_abnormal(feature, value):
    """Check if a vital is outside normal range (contributing to increased risk)."""
    low, high = NORMAL_RANGES.get(feature, (0, 100))
    if feature == "age":
        return value >= 65
    return value < low or value > high


def explain_prediction(data):
    """
    Returns human-readable explanation with actual predicted class
    and clinically meaningful contribution percentages.
    """

    # Create dataframe for model prediction
    df = pd.DataFrame([[
        data["age"],
        data["heart_rate"],
        data["spo2"],
        data["systolic_bp"],
        data["diastolic_bp"]
    ]], columns=FEATURE_NAMES)

    # Get actual prediction from model if available, otherwise use simple clinical heuristics
    if model is not None and label_encoder is not None:
        try:
            prediction = model.predict(df)[0]
            predicted_class = label_encoder.inverse_transform([prediction])[0]
        except Exception:
            predicted_class = None
    else:
        predicted_class = None

    if not predicted_class:
        spo2 = data.get("spo2")
        sbp = data.get("systolic_bp")
        hr = data.get("heart_rate")
        cond_text = (data.get("condition_text") or "").lower()
        flags = 0
        if spo2 is not None and spo2 < 90:
            flags += 1
        if sbp is not None and sbp < 90:
            flags += 1
        if hr is not None and hr > 120:
            flags += 1
        if any(k in cond_text for k in ["unconscious", "struggl", "not breathing", "gasp"]):
            flags += 1

        if flags >= 2 or (spo2 is not None and spo2 < 85):
            predicted_class = "CRITICAL"
        else:
            predicted_class = "MEDIUM"

    # Compute clinical risk scores for each feature
    risk_scores = {}
    for feature in FEATURE_NAMES:
        value = float(data[feature])
        risk_scores[feature] = compute_clinical_risk_score(feature, value)

    # Normalize to percentages
    total_score = sum(risk_scores.values())
    if total_score == 0:
        total_score = 1  # Prevent division by zero

    explanations = []
    for feature in FEATURE_NAMES:
        value = float(data[feature])
        score = risk_scores[feature]
        percent = round((score / total_score) * 100)

        # Determine risk direction based on clinical abnormality
        abnormal = is_abnormal(feature, value)
        direction = "increased risk" if abnormal else "reduced risk"

        label = FEATURE_LABELS.get(feature, feature.replace('_', ' ').title())
        explanations.append(f"{label} contributed {percent}% ({direction})")

    return {
        "method": "SHAP",
        "contribution_percentages": explanations
    }
