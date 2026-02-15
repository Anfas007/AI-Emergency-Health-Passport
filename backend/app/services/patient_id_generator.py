import random

def generate_patient_id():
    part1 = random.randint(1000, 9999)
    part2 = random.randint(1000, 9999)
    return f"HP-{part1}-{part2}"
