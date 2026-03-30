from pathlib import Path
import sys
from typing import Dict, List


PROJECT_ROOT = Path(__file__).resolve().parents[3]
project_root_str = str(PROJECT_ROOT)
if project_root_str not in sys.path:
    sys.path.insert(0, project_root_str)

from ai_engine.ai_service import (  # noqa: E402
    build_patient_risk_profile,
    evaluate_prescription_safety,
)


def get_patient_risk_and_summary(patient: Dict) -> Dict:
    try:
        result = build_patient_risk_profile(patient or {})
        return {
            "important_alerts": result.get("important_alerts", {}),
            "emergency_summary": result.get("emergency_summary", {}),
        }
    except Exception:
        return {
            "important_alerts": {
                "title": "⚠ Important Alerts",
                "alerts": [],
                "has_alerts": False,
                "critical_count": 0,
            },
            "emergency_summary": {
                "title": "Emergency Medical Summary",
                "summary": {},
                "summary_text": "",
            },
        }


def get_drug_interaction_warnings(patient: Dict, prescribed_drugs: List[str]) -> Dict:
    try:
        return evaluate_prescription_safety(patient or {}, prescribed_drugs or [])
    except Exception:
        return {
            "title": "⚠ Drug Interaction Warning",
            "warnings": [],
            "has_warnings": False,
            "warning_count": 0,
            "highest_severity": "none",
        }
