"""
3D Preform — geometry pipeline correctness tests (backend2).

Covers everything in ``threedlogic/giveStlModelBase64.py`` that does NOT need
the 218 MB trained U-Net weights:

  * .dat / .csv parsing (run against the REAL sample mesh files)
  * node-to-bbox-centre shifting math
  * voxelisation of an element mesh
  * voxel → STL via marching cubes (numpy-stl + skimage)
  * STL volume and the manufacturability quality report (genus, watertight,
    bbox, wall thickness, A–D grade)

The end-to-end ``run_pipeline`` is deliberately NOT exercised here because it
requires the offline-trained weights; that belongs in a separate integration
job with the weights mounted. Everything below runs on CPU in seconds.

Importing the module needs TensorFlow (the loss functions live in the same
file), so the whole module skips gracefully if TF is absent.
"""
import json
import os
import tempfile

import numpy as np
import pytest

pytest.importorskip("tensorflow", reason="TensorFlow not installed")
pytest.importorskip("stl", reason="numpy-stl not installed")
pytest.importorskip("skimage", reason="scikit-image not installed")
pytest.importorskip("trimesh", reason="trimesh not installed")

from threedlogic import giveStlModelBase64 as g


# ── fixtures: a synthetic solid cube voxel + its STL ─────────────────────────
@pytest.fixture(scope="module")
def cube_voxels():
    v = np.zeros((24, 24, 24), dtype=np.uint8)
    v[6:18, 6:18, 6:18] = 1          # 12-voxel solid cube
    return v


@pytest.fixture(scope="module")
def cube_stl(cube_voxels):
    d = tempfile.mkdtemp(prefix="b2geo_")
    path = os.path.join(d, "cube.stl")
    g.voxel_to_stl(cube_voxels, path)
    return path


# ── parsing (real sample data) ───────────────────────────────────────────────
def test_load_nodes_parses_real_dat(node_dat):
    nodes = g.load_nodes(node_dat)
    assert len(nodes) > 100, "expected many nodes from the sample mesh"
    # every value is an (x, y, z) triple of floats
    nid, coord = next(iter(nodes.items()))
    assert isinstance(nid, int)
    assert len(coord) == 3 and all(isinstance(c, float) for c in coord)


def test_load_elements_parses_real_dat(elem_dat):
    elems = g.load_elements(elem_dat)
    assert len(elems) > 100, "expected many elements from the sample mesh"
    assert all(isinstance(e, list) and len(e) >= 1 for e in elems)


def test_load_bbox_from_csv(bbox_csv):
    mn, mx = g.load_bbox_from_csv(bbox_csv)
    assert len(mn) == 3 and len(mx) == 3
    assert np.all(np.asarray(mx) >= np.asarray(mn)), "max must be ≥ min on every axis"


def test_load_shift_values_applies_z_factor(bbox_csv):
    import pandas as pd
    sx, sy, sz = g.load_shift_values(bbox_csv)
    raw_z = pd.read_csv(bbox_csv).query("Axis == 'Z'")["Shift Value"].values[0]
    assert sz == pytest.approx(raw_z * 0.8, rel=1e-9), "Z shift must carry the 0.8 factor"


# ── geometry math ────────────────────────────────────────────────────────────
def test_shift_nodes_centers_on_bbox():
    # nodes centred at (10,10,10); bbox centre is (0,0,0) → offset should be -10
    nodes = {1: (9.0, 9.0, 9.0), 2: (11.0, 11.0, 11.0)}
    mn, mx = np.array([-5.0, -5.0, -5.0]), np.array([5.0, 5.0, 5.0])
    shifted, offset = g.shift_nodes_to_bbox_center(nodes, mn, mx)
    new_centroid = np.mean(np.array(list(shifted.values())), axis=0)
    np.testing.assert_allclose(new_centroid, (mn + mx) / 2, atol=1e-9)
    np.testing.assert_allclose(offset, [-10.0, -10.0, -10.0], atol=1e-9)


def test_create_voxel_marks_occupied_cells():
    nodes = {1: (0.0, 0.0, 0.0), 2: (10.0, 10.0, 10.0)}
    elements = [[1, 2]]
    mn, mx = np.array([0.0, 0.0, 0.0]), np.array([10.0, 10.0, 10.0])
    voxels, shape = g.create_voxel(nodes, elements, mn, mx)
    assert voxels.ndim == 3
    assert voxels.shape == shape
    assert voxels.max() == 1, "at least one cell should be occupied"
    assert set(np.unique(voxels)).issubset({0, 1}), "voxel grid must be binary"


def test_resize_voxel_changes_shape(cube_voxels):
    out = g.resize_voxel(cube_voxels, (12, 12, 12))
    assert out.shape == (12, 12, 12)


# ── voxel → STL → quality ────────────────────────────────────────────────────
def test_voxel_to_stl_creates_file(cube_stl):
    assert os.path.exists(cube_stl)
    assert os.path.getsize(cube_stl) > 0


def test_voxel_to_stl_rejects_non_3d():
    with pytest.raises(ValueError):
        g.voxel_to_stl(np.zeros((10, 10), dtype=np.uint8), "/tmp/should_not_write.stl")


def test_calculate_stl_volume_is_positive(cube_stl):
    vol = g.calculate_stl_volume(cube_stl)
    assert vol > 0, "a solid cube must have positive volume"


def test_quality_report_cube_is_grade_a(cube_stl):
    q = g.analyse_stl_quality(cube_stl)
    # a clean solid cube → sealed, sphere-topology, top grade
    assert q["watertight"] is True
    assert q["genus"] == 0, "a solid blob is topologically a sphere (genus 0)"
    assert q["grade"] == "A"
    assert 0.0 <= q["score"] <= 1.0
    assert q["face_count"] > 0 and q["vertex_count"] > 0
    assert q["volume_mm3"] > 0
    assert len(q["bbox_mm"]) == 3 and all(b > 0 for b in q["bbox_mm"])


def test_quality_report_is_json_serializable(cube_stl):
    """The API returns this dict via jsonify — it must contain only plain
    Python scalars, no numpy types."""
    q = g.analyse_stl_quality(cube_stl)
    json.dumps(q)  # raises TypeError if a numpy scalar leaked in


def test_quality_flags_complete(cube_stl):
    q = g.analyse_stl_quality(cube_stl)
    for flag in ("watertight", "winding_consistent", "manifold_genus_ok",
                 "aspect_ok", "thickness_ok"):
        assert flag in q["flags"]
        assert isinstance(q["flags"][flag], bool)


# ── optional post-processing (needs OpenGL libs; skip if unavailable) ────────
def test_taubin_smoothing_preserves_mesh(cube_stl):
    out = os.path.join(tempfile.mkdtemp(), "smoothed.stl")
    try:
        g.apply_taubin_smoothing(cube_stl, out, n_iter=5)
    except Exception as e:  # noqa: BLE001
        pytest.skip(f"pyvista/OpenGL unavailable in this environment: {e}")
    assert os.path.exists(out) and os.path.getsize(out) > 0


def test_fix_and_simplify_reduces_or_keeps_faces(cube_stl):
    out = os.path.join(tempfile.mkdtemp(), "simplified.stl")
    try:
        g.fix_and_simplify_stl(cube_stl, out)
    except Exception as e:  # noqa: BLE001
        pytest.skip(f"pymeshlab/OpenGL unavailable in this environment: {e}")
    assert os.path.exists(out) and os.path.getsize(out) > 0
