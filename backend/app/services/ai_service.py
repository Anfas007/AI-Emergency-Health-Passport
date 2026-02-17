import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from ai_engine.inference import predict_severity, severity_confidence
from ai_engine.condition_mapper import predict_condition
from ai_engine.treatment_engine import suggest_actions
from ai_engine.shap_explainer import explain_prediction
from ai_engine.trend_analyzer import analyze_emergency_trend


def run_emergency_ai(data, past_emergency_cases=None):
    severity = predict_severity(data)
    condition = predict_condition(data)
    actions = suggest_actions(severity, condition)
    # Determine number of actions to return dynamically based on severity and confidence
    conf_float = calculate_confidence(data)
    # Base counts by severity
    if severity == "CRITICAL":
        base_count = 6
    elif severity == "MEDIUM":
        base_count = 4
    else:
        base_count = 3

    # Adjust by confidence: high confidence -> more actions; low confidence -> fewer
    if conf_float >= 0.8:
        max_actions = base_count + 1
    elif conf_float < 0.5:
        max_actions = max(1, base_count - 1)
    else:
        max_actions = base_count

    actions = actions[:max_actions]
    explanation = explain_prediction(data)
    confidence = int(round(conf_float * 100))

    def _confidence_note(percent: int) -> str:
        base = "Model confidence"
        if percent >= 80:
            return f"{base} high; not diagnostic certainty"
        if percent >= 50:
            return f"{base} moderate; not diagnostic certainty"
        return f"{base} low — exercise caution; not diagnostic certainty"

    trend_analysis = analyze_emergency_trend(
        past_emergency_cases or []
    )

    return {
        "ai_assessment": {
            "severity": severity,
            "possible_condition": condition,
            "suggested_actions": actions,
            "explanation": explanation,
            "confidence_score": {
                "value": confidence,
                "note": _confidence_note(confidence)
            },
            "risk_trend": trend_analysis
        },
        "human_in_loop": {
            "doctor_final_authority": True,
            "override_allowed": True
        },
        "disclaimer": "AI suggestions only. Final medical decision must be taken by the doctor."
    }


def calculate_confidence(data):
    # 1️⃣ Completeness
    required_fields = ["age", "heart_rate", "spo2", "systolic_bp", "diastolic_bp"]
    filled = sum(1 for f in required_fields if data.get(f) is not None)
    completeness = filled / len(required_fields)

    # 2️⃣ Freshness (emergency input assumed live)
    freshness = 1.0

    # 3️⃣ Model-based confidence (if available)
    try:
        model_conf = float(severity_confidence(data))
        model_conf = min(max(model_conf, 0.0), 1.0)
    except Exception:
        model_conf = 0.6

    # Weighted average: place meaningful weight on model confidence
    confidence = round((completeness * 0.35 + freshness * 0.2 + model_conf * 0.45), 2)
    return confidence
