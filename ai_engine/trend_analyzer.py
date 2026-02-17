# ai_engine/trend_analyzer.py

def analyze_emergency_trend(past_cases: list):
    """
    past_cases: list of dicts with severity + vitals
    Example:
    [
        {"severity": "Medium", "spo2": 95},
        {"severity": "High", "spo2": 90},
        {"severity": "Critical", "spo2": 85}
    ]
    """

    if len(past_cases) < 2:
        return {
            "trend": "Not enough historical data to determine trend",
            "risk_direction": "Unknown"
        }

    severity_map = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}

    scores = [
        severity_map.get(case["severity"], 0)
        for case in past_cases
    ]

    if scores[-1] > scores[0]:
        trend = "Worsening"
    elif scores[-1] < scores[0]:
        trend = "Improving"
    else:
        trend = "Stable"

    return {
        "trend": trend,
        "risk_direction": "Upward" if trend == "Worsening" else "Downward or Stable"
    }
