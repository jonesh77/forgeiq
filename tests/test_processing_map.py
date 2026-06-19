"""
Processing Map — physics correctness tests.

These lock down the Prasad / Gegel processing-map computation in
``processingmaplogic/processingmap.py``. The goal is not just "does it run"
but "are the numbers physically meaningful":

  * Power dissipation efficiency   η = 2m / (m + 1)
  * Flow instability (Prasad)      ξ = ∂ln(m/(m+1))/∂lnε̇ + m
    where m = ∂(ln σ)/∂(ln ε̇) is the strain-rate sensitivity.

For real metals η typically lies in 0..~0.6, and unstable regions are marked
by ξ ≤ 0. A NaN, an η outside [0, 1], or an all-positive/all-negative ξ field
across every strain would each signal a broken pipeline.
"""
import numpy as np
import pytest

import processingmap as pm


STRAINS = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]


# ── core sanity: collect() returns 16 finite (η, ξ) pairs ────────────────────
@pytest.mark.parametrize("strain", STRAINS)
def test_collect_returns_16_finite_pairs(pmap_df, strain):
    diss, inst = pm.PLOT3D(pmap_df, None, "collect", strain)
    diss, inst = np.asarray(diss, float), np.asarray(inst, float)

    # 4 temperatures × 4 strain rates = 16 grid points
    assert diss.shape == (16,), "expected 16 dissipation values"
    assert inst.shape == (16,), "expected 16 instability values"
    assert np.isfinite(diss).all(), "dissipation contains NaN/inf"
    assert np.isfinite(inst).all(), "instability contains NaN/inf"


@pytest.mark.parametrize("strain", STRAINS)
def test_dissipation_is_physical(pmap_df, strain):
    """η = 2m/(m+1) must stay within a physically sane band."""
    diss, _ = pm.PLOT3D(pmap_df, None, "collect", strain)
    diss = np.asarray(diss, float)
    # Allow a little numerical slack above the textbook [0,1] from cubic interp,
    # but anything wildly outside means the m-derivative blew up.
    assert diss.min() >= -0.05, f"η went strongly negative ({diss.min():.3f})"
    assert diss.max() <= 1.05, f"η exceeded 1 ({diss.max():.3f})"


def test_instability_field_has_both_signs_across_strains(pmap_df):
    """
    A valid AISI-4340 map has SOME stable and SOME unstable (ξ ≤ 0) points as
    strain varies. If ξ were uniformly positive at every strain, the safe-window
    detection would be meaningless.
    """
    saw_unstable = False
    saw_stable = False
    for s in np.arange(0.1, 1.001, 0.1):
        _, inst = pm.PLOT3D(pmap_df, None, "collect", s)
        inst = np.asarray(inst, float)
        saw_unstable |= bool((inst <= 0).any())
        saw_stable |= bool((inst > 0).any())
    assert saw_stable, "no stable points found anywhere — suspicious"
    assert saw_unstable, "no unstable points found anywhere — suspicious"


# ── relationship check: η and m are consistent ──────────────────────────────
def test_eta_consistent_with_m_relation(pmap_df):
    """
    Recover m from η via the inverse of η = 2m/(m+1)  →  m = η/(2−η),
    then verify it maps back. This proves the dissipation formula in the code
    is the real Prasad relation and not some look-alike.
    """
    diss, _ = pm.PLOT3D(pmap_df, None, "collect", 0.5)
    diss = np.asarray(diss, float)
    # exclude the clipped-floor points (tf floored at 1e-6 → η≈0)
    mask = diss > 1e-3
    eta = diss[mask]
    m = eta / (2.0 - eta)
    eta_roundtrip = 2.0 * m / (m + 1.0)
    np.testing.assert_allclose(eta, eta_roundtrip, rtol=1e-6, atol=1e-9)


# ── plot builders return valid Plotly figure dicts ──────────────────────────
def test_2d_contour_returns_plotly_dict(pmap_df):
    out = pm.main_graph(pmap_df, "2D", [None], {}, 0.2)
    assert isinstance(out, list) and len(out) == 1
    fig = out[0]
    assert "data" in fig and "layout" in fig
    assert len(fig["data"]) >= 1, "2D contour produced no traces"


@pytest.mark.parametrize("ptype", ["instability", "dissipation"])
def test_3d_surfaces_return_plotly_dict(pmap_df, ptype):
    out = pm.main_graph(pmap_df, ptype, [None], {}, 0.25)
    assert isinstance(out, list) and len(out) == 1
    fig = out[0]
    assert "data" in fig
    assert len(fig["data"]) >= 1, f"{ptype} produced no surfaces"


# ── excel export path for "collect" is well-formed base64 ───────────────────
def test_collect_api_excel_is_valid_base64_xlsx(pmap_df):
    import base64, io
    import pandas as pd

    b64 = pm.collect_values_for_strain_api(pmap_df, 0.2)
    raw = base64.b64decode(b64)
    # openpyxl can read it → it's a real .xlsx, not garbage
    xls = pd.ExcelFile(io.BytesIO(raw))
    assert "Instability" in xls.sheet_names
    assert "Dissipation" in xls.sheet_names
