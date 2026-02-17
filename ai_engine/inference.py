import joblib
import pandas as pd
import os

# Load model artifacts if available; fallback gracefully if missing
try:
    model = joblib.load(os.path.join(os.path.dirname(__file__), "model", "emergency_model.pkl"))
    label_encoder = joblib.load(os.path.join(os.path.dirname(__file__), "model", "label_encoder.pkl"))
except Exception:
    model = None
    label_encoder = None


def predict_severity(data):
    df = pd.DataFrame([{
        "age": data.get("age"),
        "heart_rate": data.get("heart_rate"),
        "spo2": data.get("spo2"),
        "systolic_bp": data.get("systolic_bp"),
        "diastolic_bp": data.get("diastolic_bp")
    }])

    # Try model prediction if model is available
    severity = None
    if model is not None and label_encoder is not None:
        try:
            prediction = model.predict(df)[0]
            severity = label_encoder.inverse_transform([prediction])[0]
        except Exception:
            severity = None

    # Rule-based heuristic override for clear critical presentations
    spo2 = data.get("spo2")
    sbp = data.get("systolic_bp")
    hr = data.get("heart_rate")
    cond_text = (data.get("condition_text") or "").lower()

    critical_flags = 0
    if spo2 is not None and spo2 < 90:
        critical_flags += 1
    if sbp is not None and sbp < 90:
        critical_flags += 1
    if hr is not None and hr > 120:
        critical_flags += 1
    if any(k in cond_text for k in ["unconscious", "struggl", "not breathing", "gasp"]):
        critical_flags += 1

    # If multiple critical indicators present, force CRITICAL
    if critical_flags >= 2 or (spo2 is not None and spo2 < 85):
        return "CRITICAL"

    # Fall back to model prediction or a conservative default
    if severity:
        return severity

    return "MEDIUM"


def severity_confidence(data):
    """Return a model-based confidence (0.0-1.0) for the severity prediction.

    Uses the loaded `model` if it supports `predict_proba`. Falls back to
    heuristic confidence when the model or probabilities are unavailable.
    """
    # If the rule-based logic force-returns CRITICAL, give high confidence
    spo2 = data.get("spo2")
    sbp = data.get("systolic_bp")
    hr = data.get("heart_rate")
    cond_text = (data.get("condition_text") or "").lower()

    critical_flags = 0
    if spo2 is not None and spo2 < 90:
        critical_flags += 1
    if sbp is not None and sbp < 90:
        critical_flags += 1
    if hr is not None and hr > 120:
        critical_flags += 1
    if any(k in cond_text for k in ["unconscious", "struggl", "not breathing", "gasp"]):
        critical_flags += 1

    if critical_flags >= 2 or (spo2 is not None and spo2 < 85):
        return 0.95

    # Build dataframe same as used for prediction
    try:
        df = pd.DataFrame([{
            "age": data.get("age"),
            "heart_rate": data.get("heart_rate"),
            "spo2": data.get("spo2"),
            "systolic_bp": data.get("systolic_bp"),
            "diastolic_bp": data.get("diastolic_bp")
        }])
    except Exception:
        return 0.5

    # If model provides probabilities, use the max predicted probability
    if model is not None:
        try:
            if hasattr(model, "predict_proba"):
                probs = model.predict_proba(df)[0]
                max_prob = float(max(probs))
                # keep within reasonable bounds
                return min(max(max_prob, 0.05), 0.99)
            # Some models don't have predict_proba; fall back to a moderate value
            return 0.65
        except Exception:
            return 0.6

    # No model available: base confidence on how many vital fields are present
    required_fields = ["age", "heart_rate", "spo2", "systolic_bp", "diastolic_bp"]
    filled = sum(1 for f in required_fields if data.get(f) is not None)
    completeness = filled / len(required_fields)
    # Conservative mapping: if only 1-2 fields, low; 3-4 moderate; 5 high
    if completeness >= 0.9:
        return 0.7
    if completeness >= 0.6:
        return 0.55
    return 0.35
