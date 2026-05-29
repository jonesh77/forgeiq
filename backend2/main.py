"""3D Preform API (backend2).

Copyright (c) 2026 Y. Alibek (NSMLab). All Rights Reserved.
See LICENSE in the project root.
"""
import logging
import os
import tempfile
import threading
import time
import uuid

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from threedlogic.giveStlModelBase64 import run_pipeline
from samples_lib import resolve_sample, register_sample_routes

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format="[%(asctime)s] [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("backend2")

MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "300"))

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_MB * 1024 * 1024
CORS(app)
register_sample_routes(app)


def fail(message, code=400):
    log.warning("Request failed (%s): %s", code, message)
    return jsonify({"status": "error", "error": message}), code


@app.errorhandler(HTTPException)
def handle_http_exc(e):
    return fail(e.description, code=e.code or 500)


@app.errorhandler(Exception)
def handle_unexpected(e):
    log.exception("Unhandled error")
    return fail(f"Internal server error: {e}", code=500)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "good", "service": "backend2"})


# ============================================================
# In-process async job manager — keeps the 30–60 s 3D Preform
# request off the HTTP request loop so the page never freezes.
# ============================================================
# Single-process: dict + lock. No Redis required. For multi-worker
# deployment (gunicorn -w >1) replace with Redis or a real queue.
_JOBS: dict[str, dict] = {}
_JOBS_LOCK = threading.Lock()
_JOB_TTL_SEC = 60 * 30          # 30 min — sweep after this


def _new_job() -> str:
    jid = uuid.uuid4().hex
    with _JOBS_LOCK:
        _JOBS[jid] = {
            "status": "queued",
            "progress": 0.0,
            "submitted_at": time.time(),
            "started_at": None,
            "finished_at": None,
            "result": None,
            "error": None,
        }
    return jid


def _update_job(jid: str, **patch) -> None:
    with _JOBS_LOCK:
        if jid in _JOBS:
            _JOBS[jid].update(patch)


def _sweep_old_jobs() -> None:
    now = time.time()
    with _JOBS_LOCK:
        stale = [j for j, v in _JOBS.items() if now - v.get("submitted_at", now) > _JOB_TTL_SEC]
        for j in stale:
            _JOBS.pop(j, None)


def _run_preform_job(jid: str, h5_path: str, csv_path: str, dat1: str, dat2: str, used_sample: bool) -> None:
    """Worker target: run the heavy pipeline, then write result back to the job dict."""
    _update_job(jid, status="running", started_at=time.time(), progress=0.05)
    try:
        out = run_pipeline(h5_path, csv_path, dat1, dat2)
        if isinstance(out, dict):
            out["status"] = "good"
            if used_sample:
                out["used_sample"] = True
        _update_job(jid, status="done", finished_at=time.time(), progress=1.0, result=out)
    except Exception as e:  # noqa: BLE001 — surface as a regular failure result
        log.exception("preform job %s failed", jid)
        _update_job(jid, status="error", finished_at=time.time(), error=str(e))


@app.route("/api/threedpreform/submit", methods=["POST"])
def preform_submit():
    """Submit a 3D preform job; returns a job_id to poll. Same input schema as /get_3d_model."""
    _sweep_old_jobs()
    use_sample = request.form.get("_use_sample", "").lower() == "true"

    if use_sample:
        sample_map = {
            "h5_file": "unet_model", "csv_file": "bbox_csv",
            "dat1_file": "target_elem", "dat2_file": "target_node",
        }
        paths = {}
        for key, name in sample_map.items():
            p = resolve_sample(name)
            if not p:
                return fail(f"Sample file missing on server: {name}", code=500)
            paths[key] = p
        jid = _new_job()
        threading.Thread(
            target=_run_preform_job,
            args=(jid, paths["h5_file"], paths["csv_file"], paths["dat1_file"], paths["dat2_file"], True),
            daemon=True,
        ).start()
        return jsonify({"status": "good", "job_id": jid})

    required = ["h5_file", "csv_file", "dat1_file", "dat2_file"]
    for k in required:
        if k not in request.files or not request.files[k].filename:
            return fail(f"Missing required file: {k}")

    # We must copy uploads into a persistent temp dir (the worker outlives the
    # request and the default TemporaryDirectory would be cleaned up too soon).
    tmpdir = tempfile.mkdtemp(prefix="preform_job_")
    saved = {}
    for i, k in enumerate(required, start=1):
        f = request.files[k]
        path = os.path.join(tmpdir, f"{i}_{f.filename}")
        f.save(path)
        saved[k] = path

    jid = _new_job()
    threading.Thread(
        target=_run_preform_job,
        args=(jid, saved["h5_file"], saved["csv_file"], saved["dat1_file"], saved["dat2_file"], False),
        daemon=True,
    ).start()
    return jsonify({"status": "good", "job_id": jid})


@app.route("/api/threedpreform/status/<job_id>", methods=["GET"])
def preform_status(job_id):
    with _JOBS_LOCK:
        job = _JOBS.get(job_id)
        if not job:
            return fail("Unknown job_id (expired or never existed)", code=404)
        # Return a snapshot — copy result outside the lock if huge
        snap = dict(job)
    # Compute elapsed seconds for the UI's progress bar
    if snap["started_at"]:
        elapsed = (snap["finished_at"] or time.time()) - snap["started_at"]
    else:
        elapsed = 0.0
    snap["elapsed_sec"] = round(elapsed, 1)
    return jsonify({"status": "good", **snap})


@app.route("/api/threedpreform/get_3d_model", methods=["POST"])
def upload_4_files():
    use_sample = request.form.get("_use_sample", "").lower() == "true"

    if use_sample:
        sample_map = {
            "h5_file": "unet_model",
            "csv_file": "bbox_csv",
            "dat1_file": "target_elem",
            "dat2_file": "target_node",
        }
        paths = {}
        for key, sample_name in sample_map.items():
            p = resolve_sample(sample_name)
            if not p:
                return fail(f"Sample file missing on server: {sample_name}", code=500)
            paths[key] = p

        try:
            result = run_pipeline(
                paths["h5_file"], paths["csv_file"],
                paths["dat1_file"], paths["dat2_file"],
            )
        except Exception as e:
            log.exception("run_pipeline (sample) failed")
            return fail(f"3D model sample generation failed: {e}", code=500)

        if isinstance(result, dict):
            result.setdefault("status", "good")
            result["used_sample"] = True
        return jsonify(result)

    required_keys = ["h5_file", "csv_file", "dat1_file", "dat2_file"]
    for key in required_keys:
        if key not in request.files or not request.files[key].filename:
            return fail(f"Missing required file: {key}")

    with tempfile.TemporaryDirectory() as tmpdir:
        saved_paths = {}
        for idx, key in enumerate(required_keys, start=1):
            f = request.files[key]
            save_path = os.path.join(tmpdir, f"{idx}_{f.filename}")
            f.save(save_path)
            saved_paths[key] = save_path

        try:
            result = run_pipeline(
                saved_paths["h5_file"],
                saved_paths["csv_file"],
                saved_paths["dat1_file"],
                saved_paths["dat2_file"],
            )
        except Exception as e:
            log.exception("run_pipeline failed")
            return fail(f"3D model generation failed: {e}", code=500)

        if isinstance(result, dict):
            result.setdefault("status", "good")
        return jsonify(result)


if __name__ == "__main__":
    debug = os.environ.get("FLASK_ENV") != "production"
    log.info("Starting backend2 (debug=%s, max_upload=%sMB)", debug, MAX_UPLOAD_MB)
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5001)), debug=debug)
