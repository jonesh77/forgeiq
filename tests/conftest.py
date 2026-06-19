"""
Shared pytest fixtures and import-path setup for the ForgeIQ test suite.

The backend1 logic modules import each other as top-level packages
(``from cogginglogic... import ...``), so we put ``backend1/`` on sys.path
exactly the way the running server does. This lets the tests import the REAL
production code — not a copy — so a green test genuinely proves the shipped
code works.
"""
import os
import sys
import pathlib
import pandas as pd
import pytest

# ── Repository layout ────────────────────────────────────────────────────────
REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
BACKEND1 = REPO_ROOT / "backend1"
BACKEND2 = REPO_ROOT / "backend2"
SAMPLE_DATA = REPO_ROOT / "sample_data"

# Make backend1 importable the same way main.py does at runtime.
for p in (str(BACKEND1), str(BACKEND1 / "cogginglogic"), str(BACKEND1 / "processingmaplogic")):
    if p not in sys.path:
        sys.path.insert(0, p)

# Make backend2 importable as a package root (its `threedlogic` package is
# unique, so this does not clash with backend1). Appended AFTER backend1 so the
# bare names `main` / `samples_lib` still resolve to backend1 by default; the
# backend2 API test loads backend2's main explicitly under its own name.
if str(BACKEND2) not in sys.path:
    sys.path.append(str(BACKEND2))

# Quieter TensorFlow if it ever gets imported by a downstream module.
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")


# ── Path fixtures ────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def repo_root() -> pathlib.Path:
    return REPO_ROOT


@pytest.fixture(scope="session")
def sample_dir() -> pathlib.Path:
    return SAMPLE_DATA


@pytest.fixture(scope="session")
def pmap_xlsx(sample_dir) -> pathlib.Path:
    """Raw processing-map hot-compression data (AISI 4340)."""
    f = sample_dir / "_RAW_Processing map_AISI4340.xlsx"
    if not f.exists():
        pytest.skip(f"sample file missing: {f}")
    return f


@pytest.fixture(scope="session")
def cogging_xlsx(sample_dir) -> pathlib.Path:
    """Raw cogging data — input to the train-data-correction step."""
    f = sample_dir / "Cogging data.xlsx"
    if not f.exists():
        pytest.skip(f"sample file missing: {f}")
    return f


# ── Data fixtures ────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def pmap_df(pmap_xlsx) -> pd.DataFrame:
    return pd.read_excel(pmap_xlsx, sheet_name="Sheet1")


@pytest.fixture(scope="session")
def cogging_df(cogging_xlsx) -> pd.DataFrame:
    return pd.read_excel(cogging_xlsx)


# ── backend2 (3D preform) sample fixtures ────────────────────────────────────
@pytest.fixture(scope="session")
def bbox_csv(sample_dir) -> str:
    f = sample_dir / "shifted_coordinates_and_bbox.csv"
    if not f.exists():
        pytest.skip(f"sample file missing: {f}")
    return str(f)


def _first_dat(folder: pathlib.Path):
    if not folder.exists():
        return None
    files = sorted(folder.glob("*.dat"))
    return str(files[0]) if files else None


@pytest.fixture(scope="session")
def node_dat(sample_dir) -> str:
    f = _first_dat(sample_dir / "Additional_target_node")
    if not f:
        pytest.skip("no node .dat sample found")
    return f


@pytest.fixture(scope="session")
def elem_dat(sample_dir) -> str:
    f = _first_dat(sample_dir / "Additional_target_elem")
    if not f:
        pytest.skip("no elem .dat sample found")
    return f
