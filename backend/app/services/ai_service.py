import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from ai_engine.inference import predict_severity
from ai_engine.condition_mapper import predict_condition
from ai_engine.treatment_engine import suggest_actions
from ai_engine.shap_explainer import explain_prediction

def run_emergency_ai(data):
    severity = predict_severity(data)
    condition = predict_condition(data)
    actions = suggest_actions(severity, condition)
    explanation = explain_prediction(data)

    return {
        "ai_assessment": {
            "severity": severity,
            "possible_condition": condition,
            "suggested_actions": actions,
            "explanation": explanation
        },
        "disclaimer": "AI suggestions only. Final medical decision must be taken by the doctor."
    }
