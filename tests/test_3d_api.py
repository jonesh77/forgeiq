"""
3D Preform — API contract tests (backend2).

Backend1 and backend2 both ship a module called ``main`` and one called
``samples_lib``. To avoid the name clash we load backend2's ``main.py`` under a
dedicated module name (``backend2_main``) with backend2 placed first on the
import path, so its own ``samples_lib`` / ``threedlogic`` resolve correctly.

Proves the HTTP surface is production-safe: health probe, clean JSON 4xx for
missing files (never a raw 500 stack trace), and 404 for an unknown job id.

Needs TensorFlow (main imports the 3D pipeline). Skips otherwise.
"""
import importlib.util
import pathlib
import sys

import pytest

pytest.importorskip("tensorflow", reason="TensorFlow not installed")

BACKEND2 = pathlib.Path(__file__).resolve().parents[1] / "backend2"


@pytest.fixture(scope="module")
def b2_client():
    # Put backend2 first so its samples_lib/threedlogic win during load.
    added = str(BACKEND2)
    sys.path.insert(0, added)
    for cached in ("samples_lib", "main"):
        sys.modules.pop(cached, None)

    try:
        spec = importlib.util.spec_from_file_location("backend2_main", str(BACKEND2 / "main.py"))
        mod = importlib.util.module_from_spec(spec)
        sys.modules["backend2_main"] = mod
        spec.loader.exec_module(mod)
    finally:
        # Undo the path/module pollution so backend1's bare `main` / `samples_lib`
        # still resolve to backend1 in tests that run after this one.
        try:
            sys.path.remove(added)
        except ValueError:
            pass
        for cached in ("samples_lib", "main"):
            sys.modules.pop(cached, None)

    mod.app.config.update(TESTING=True)
    return mod.app.test_client()


def test_health_reports_backend2(b2_client):
    r = b2_client.get("/api/health")
    assert r.status_code == 200
    body = r.get_json()
    assert body["status"] == "good"
    assert body["service"] == "backend2"


def test_get_3d_model_missing_files_is_clean_4xx(b2_client):
    r = b2_client.post("/api/threedpreform/get_3d_model", data={})
    assert r.status_code in (400, 422)
    assert r.is_json, "error must be JSON, not an HTML stack trace"
    assert r.get_json().get("status") == "error"


def test_submit_missing_files_is_clean_4xx(b2_client):
    r = b2_client.post("/api/threedpreform/submit", data={})
    assert r.status_code in (400, 422)
    assert r.is_json


def test_status_unknown_job_is_404(b2_client):
    r = b2_client.get("/api/threedpreform/status/does-not-exist")
    assert r.status_code == 404
    assert r.is_json


def test_unknown_route_404(b2_client):
    r = b2_client.get("/api/nope")
    assert r.status_code == 404
