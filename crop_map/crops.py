import pandas as pd
import json

with open("data.json") as f:
    data = json.load(f)

df = pd.DataFrame(data)
df.to_csv("data.csv", index=False)