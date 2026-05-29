# logic/traindatacorrection.py

import pandas as pd
import base64
from io import BytesIO

def correct_train_data(file, target_astm, weight_factor):
    # Read Excel file directly from uploaded file object
    df = pd.read_excel(file)

    # Perform calculation
    df['modify_BQI'] = (
        df['Strain'] * df['St.Dev'] * df['ASTM.dev'] / df['ASTM'] +
        weight_factor * (target_astm - df['ASTM']) ** 2
    )

    # Drop unnecessary columns
    df = df.drop(["Strain", "St.Dev", "ASTM", "ASTM.dev"], axis=1)

    # Save modified DataFrame to Excel in memory
    buffer = BytesIO()
    df.to_excel(buffer, index=False)
    buffer.seek(0)

    # Convert to base64
    encoded = base64.b64encode(buffer.read()).decode('utf-8')

    return {
        'file': encoded
    }
