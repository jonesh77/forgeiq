"""3D Preform API (backend2).

Copyright (c) 2026 Y. Alibek (NSMLab). All Rights Reserved.
See LICENSE in the project root.
"""
import logging
import os
import tempfile

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
