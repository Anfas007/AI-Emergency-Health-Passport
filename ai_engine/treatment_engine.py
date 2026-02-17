def suggest_actions(severity, condition):
    """
    Generate comprehensive suggested actions based on severity and condition.
    Returns a list of clinically appropriate actions.
    """
    actions = []

    # ============ SEVERITY-BASED ACTIONS ============
    if severity == "CRITICAL":
        actions.extend([
            "Ensure airway and breathing",
            "Administer oxygen",
            "Prepare ventilatory support",
            "Activate emergency response team immediately",
            "Establish IV access with large-bore cannula",
            "Continuous cardiac monitoring",
            "Prepare emergency resuscitation equipment",
            "Notify senior physician/intensivist on call"
        ])
    elif severity == "MEDIUM":
        actions.extend([
            "Perform focused clinical assessment",
            "Administer supplemental oxygen if SpO2 < 94%",
            "Establish IV access",
            "Continuous vital signs monitoring (every 15 min)",
            "Order relevant blood investigations (CBC, BMP, Cardiac enzymes)",
            "Prepare for possible escalation",
            "Notify attending physician"
        ])
    else:  # LOW
        actions.extend([
            "Complete standard clinical assessment",
            "Monitor vital signs (every 30-60 min)",
            "Provide symptomatic treatment as needed",
            "Reassess in 1-2 hours",
            "Document findings and plan"
        ])

    # ============ CONDITION-BASED ACTIONS ============
    condition_lower = condition.lower() if condition else ""

    # Cardiac conditions
    if "cardiac" in condition_lower or "heart" in condition_lower or "chest pain" in condition_lower:
        actions.extend([
            "Obtain 12-lead ECG immediately",
            "Give Aspirin 300mg (if no contraindications)",
            "Check Troponin levels stat",
            "Alert cardiology team",
            "Keep patient nil by mouth",
            "Have defibrillator on standby"
        ])

    # Respiratory conditions
    if "respiratory" in condition_lower or "breathing" in condition_lower or "dyspnea" in condition_lower:
        actions.extend([
            "Position patient upright (45-90 degrees)",
            "Obtain arterial blood gas (ABG)",
            "Prepare nebulizer with bronchodilator",
            "Order chest X-ray",
            "Have ventilatory support equipment ready",
            "Monitor respiratory rate and SpO2 continuously"
        ])

    # Stroke / Neurological
    if "stroke" in condition_lower or "neurolog" in condition_lower or "unconscious" in condition_lower:
        actions.extend([
            "Perform FAST stroke assessment",
            "Check blood glucose immediately",
            "Obtain CT head scan urgently",
            "Alert neurology/stroke team",
            "Keep patient NPO",
            "Document time of symptom onset",
            "Assess GCS and pupil response"
        ])

    # Trauma
    if "trauma" in condition_lower or "injury" in condition_lower or "accident" in condition_lower:
        actions.extend([
            "Immobilize cervical spine",
            "Perform primary trauma survey (ABCDE)",
            "Control any active bleeding",
            "Order trauma panel labs",
            "Arrange imaging (X-ray/CT as indicated)",
            "Alert surgical team if needed"
        ])

    # Hypotension / Shock
    if "shock" in condition_lower or "hypotension" in condition_lower:
        actions.extend([
            "Position patient supine with legs elevated",
            "Administer IV fluid bolus (500-1000ml crystalloid)",
            "Identify and treat underlying cause",
            "Consider vasopressor support",
            "Monitor urine output"
        ])

    # Allergic reaction / Anaphylaxis
    if "allerg" in condition_lower or "anaphyla" in condition_lower:
        actions.extend([
            "Administer Epinephrine IM (0.5mg) if severe",
            "Give IV antihistamines",
            "Administer IV corticosteroids",
            "Prepare for airway management",
            "Monitor for biphasic reaction"
        ])

    # Sepsis
    if "sepsis" in condition_lower or "infection" in condition_lower:
        actions.extend([
            "Obtain blood cultures before antibiotics",
            "Start broad-spectrum IV antibiotics within 1 hour",
            "Administer IV fluid resuscitation",
            "Check lactate levels",
            "Monitor urine output (target >0.5ml/kg/hr)"
        ])

    # Diabetic emergency
    if "diabet" in condition_lower or "hypoglyc" in condition_lower or "hyperglyc" in condition_lower:
        actions.extend([
            "Check blood glucose immediately",
            "If hypoglycemic: Give IV dextrose or oral glucose",
            "If DKA suspected: Start insulin and IV fluids",
            "Check ketones and electrolytes",
            "Monitor glucose hourly"
        ])

    # Overdose / Poisoning
    if "overdose" in condition_lower or "poison" in condition_lower or "toxic" in condition_lower:
        actions.extend([
            "Contact Poison Control Center",
            "Identify substance if possible",
            "Consider activated charcoal (if appropriate)",
            "Administer specific antidote if available",
            "Supportive care and monitoring"
        ])

    # If no specific condition matched but severity warrants action
    if "unclear" in condition_lower or not condition:
        if severity in ["CRITICAL", "MEDIUM"]:
            actions.extend([
                "Perform comprehensive physical examination",
                "Order basic lab panel (CBC, CMP, Urinalysis)",
                "Consider ECG and chest X-ray",
                "Obtain detailed history from patient/family"
            ])

    # Remove duplicates while preserving order
    seen = set()
    unique_actions = []
    for action in actions:
        if action not in seen:
            seen.add(action)
            unique_actions.append(action)

    return unique_actions
