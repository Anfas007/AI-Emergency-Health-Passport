import pandas as pd
import random

df = pd.read_csv("synthetic_emergency_data.csv")

augmented = []

for _, row in df.iterrows():
    for _ in range(700):  # amplify each row
        new_row = row.copy()

        new_row["age"] = int(max(1, row["age"] + random.randint(-5, 5)))
        new_row["heart_rate"] = int(max(30, row["heart_rate"] + random.randint(-10, 10)))
        new_row["spo2"] = int(min(100, max(70, row["spo2"] + random.randint(-3, 3))))
        new_row["systolic_bp"] = int(max(70, row["systolic_bp"] + random.randint(-15, 15)))
        new_row["diastolic_bp"] = int(max(40, row["diastolic_bp"] + random.randint(-10, 10)))

        augmented.append(new_row)

augmented_df = pd.DataFrame(augmented)
augmented_df.to_csv("synthetic_emergency_data_augmented.csv", index=False)

print("Augmented dataset created:", len(augmented_df))
