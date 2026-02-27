import random

def generate_patient_id():
    part1 = random.randint(1000, 9999)
    part2 = random.randint(1000, 9999)
    return f"HP-{part1}-{part2}"


def generate_doctor_id():
    """Generate a sequential doctor ID like DR-0001, DR-0002, ..."""
    from app.services.database import doctors_collection
    last = doctors_collection.find_one(
        {"doctor_id": {"$regex": r"^DR-\d{4}$"}},
        sort=[("doctor_id", -1)],
    )
    if last:
        num = int(last["doctor_id"].split("-")[1]) + 1
    else:
        num = 1
    return f"DR-{num:04d}"


def generate_hospital_code():
    """Generate a sequential hospital code like HOSP-0001, HOSP-0002, ..."""
    from app.services.database import hospital_admins_collection
    last = hospital_admins_collection.find_one(
        {"hospital_code": {"$regex": r"^HOSP-\d{4}$"}},
        sort=[("hospital_code", -1)],
    )
    if last:
        num = int(last["hospital_code"].split("-")[1]) + 1
    else:
        num = 1
    return f"HOSP-{num:04d}"
