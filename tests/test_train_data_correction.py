"""
Train-Data Correction — formula correctness tests.

Locks the modify_BQI computation in
``cogginglogic/traindatacorrection.py``:

    modify_BQI = Strain · St.Dev · ASTM.dev / ASTM
               + w · (ASTM_target − ASTM)²

and verifies the four merged columns are dropped while every other column
survives, and that the returned payload is a valid base64-encoded .xlsx.
"""
import base64
import io

import numpy as np
import pandas as pd
import pytest

from traindatacorrection import correct_train_data


def _decode(payload) -> pd.DataFrame:
    raw = base64.b64decode(payload["file"])
    return pd.read_excel(io.BytesIO(raw))


def _expected_bqi(df, target, w):
    return (
        df["Strain"] * df["St.Dev"] * df["ASTM.dev"] / df["ASTM"]
        + w * (target - df["ASTM"]) ** 2
    )


def test_bqi_formula_matches_hand_computation(cogging_xlsx, cogging_df):
    target, w = 6.0, 0.1
    out = _decode(correct_train_data(str(cogging_xlsx), target, w))
    expected = _expected_bqi(cogging_df, target, w).round(10)
    got = out["modify_BQI"].round(10)
    np.testing.assert_allclose(got.to_numpy(), expected.to_numpy(), rtol=1e-9, atol=1e-9)


def test_merged_columns_are_dropped(cogging_xlsx):
    out = _decode(correct_train_data(str(cogging_xlsx), 6.0, 0.1))
    for col in ("Strain", "St.Dev", "ASTM", "ASTM.dev"):
        assert col not in out.columns, f"{col} should have been merged away"
    assert "modify_BQI" in out.columns


def test_non_merged_columns_survive(cogging_xlsx, cogging_df):
    out = _decode(correct_train_data(str(cogging_xlsx), 6.0, 0.1))
    survivors = [c for c in cogging_df.columns
                 if c not in ("Strain", "St.Dev", "ASTM", "ASTM.dev")]
    for col in survivors:
        assert col in out.columns, f"{col} unexpectedly dropped"


def test_output_row_count_preserved(cogging_xlsx, cogging_df):
    out = _decode(correct_train_data(str(cogging_xlsx), 7.0, 0.2))
    assert len(out) == len(cogging_df)


@pytest.mark.parametrize("target,w", [(5.0, 0.0), (8.0, 0.5), (6.5, 0.1)])
def test_weight_factor_zero_drops_penalty_term(cogging_xlsx, cogging_df, target, w):
    """With w=0 the penalty term vanishes; with w>0 it strictly adds a
    non-negative quantity. This guards the sign/placement of the penalty."""
    out = _decode(correct_train_data(str(cogging_xlsx), target, w))
    base = (cogging_df["Strain"] * cogging_df["St.Dev"]
            * cogging_df["ASTM.dev"] / cogging_df["ASTM"])
    penalty = out["modify_BQI"].to_numpy() - base.to_numpy()
    if w == 0.0:
        np.testing.assert_allclose(penalty, 0.0, atol=1e-9)
    else:
        assert (penalty >= -1e-9).all(), "penalty term went negative"
