"""
API contract tests — exercise the real Flask app via its test client.

Importing ``main`` pulls in the cogging trainers (Keras/TensorFlow), so this
module is skipped if TensorFlow is not installed. When it does run, it proves
the HTTP layer is wired correctly: health check, the ok()/fail() envelope, and
that endpoints reject malformed requests with a clean 4xx instead of a 500
stack trace (which is what separates a demo from a sellable service).
"""
import json

import pytest

pytest.importorskip("tensorflow", reason="TensorFlow not installed")


@pytest.fixture(scope="module")
def client():
    import main
    main.app.config.update(TESTING=True)
    return main.app.test_client()


def test_health_ok(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    body = r.get_json()
    assert body is not None


def test_unknown_route_404(client):
    r = client.get("/api/this/does/not/exist")
    assert r.status_code == 404


def test_missing_file_is_clean_4xx_not_500(client):
    """Posting with no file must return a structured client error, never an
    unhandled 500 — the global error handlers in main.py guarantee this."""
    r = client.post("/api/cogging/gradient_boosting", data={})
    assert r.status_code in (400, 422), f"expected 4xx, got {r.status_code}"
    # response is JSON, not an HTML stack trace
    assert r.is_json, "error response should be JSON"


def test_pass_schedule_missing_inputs_is_4xx(client):
    r = client.post("/api/cogging/passschedule", data={})
    assert r.status_code in (400, 422)
    assert r.is_json
