def predict_condition(data):
    text = data["condition_text"].lower()

    if "chest pain" in text and data["heart_rate"] > 100:
        return "Possible Cardiac Emergency"
    if data["spo2"] < 90:
        return "Possible Respiratory Failure"
    if "seizure" in text:
        return "Possible Neurological Event"

    return "Condition unclear – requires clinical evaluation"
