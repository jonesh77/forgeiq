"""Cogging + Processing Map API (backend1).

Copyright (c) 2026 Y. Alibek (NSMLab). All Rights Reserved.
See LICENSE in the project root.
"""
import json
import logging
import os
import tempfile

import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from cogginglogic.fourimages1h5 import process_excel
from cogginglogic.traindatacorrection import correct_train_data
from cogginglogic.passschedule import process_pass_schedule
from processingmaplogic.processingmap import (
    main_graph,
    collect_values_for_strain_api,
    plot_values_against_strain,
)
from samples_lib import resolve_sample, register_sample_routes

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format="[%(asctime)s] [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("backend1")

MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "100"))

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_MB * 1024 * 1024
CORS(app)
register_sample_routes(app)


def _is_sample_request():
    return request.form.get("_use_sample", "").lower() == "true"


class _LocalFile:
    """Mimics werkzeug FileStorage just enough for downstream code."""
    def __init__(self, path):
        self.path = path
        self.filename = os.path.basename(path)
    def save(self, dest):
        import shutil
        shutil.copy(self.path, dest)
    def read(self):
        with open(self.path, "rb") as f:
            return f.read()


def ok(data=None, **extra):
    body = {"status": "good"}
    if isinstance(data, dict):
        body.update(data)
    if extra:
        body.update(extra)
    return jsonify(body)


def fail(message, code=400):
    log.warning("Request failed (%s): %s", code, message)
    return jsonify({"status": "error", "error": message}), code


def require_file(field):
    f = request.files.get(field)
    if not f or not getattr(f, "filename", ""):
        raise ValueError(f"Missing required file: '{field}'")
    return f


def require_float(field):
    raw = request.form.get(field)
    if raw is None or raw == "":
        raise ValueError(f"Missing required parameter: '{field}'")
    try:
        return float(raw)
    except (TypeError, ValueError):
        raise ValueError(f"Parameter '{field}' must be a number")


def require_str(field):
    raw = request.form.get(field)
    if not raw:
        raise ValueError(f"Missing required parameter: '{field}'")
    return raw


@app.errorhandler(HTTPException)
def handle_http_exc(e):
    return fail(e.description, code=e.code or 500)


@app.errorhandler(Exception)
def handle_unexpected(e):
    log.exception("Unhandled error")
    return fail(f"Internal server error: {e}", code=500)


@app.route("/api/health", methods=["GET"])
def health():
    return ok({"service": "backend1"})


@app.route("/api/cogging/fourimages1h5", methods=["POST"])
def process_file():
    if _is_sample_request():
        sample_path = resolve_sample("cogging_data")
        if not sample_path:
            return fail("Sample cogging dataset not available on server", code=500)
        try:
            result = process_excel(sample_path)
        except Exception as e:
            log.exception("process_excel (sample) failed")
            return fail(f"Failed to process sample: {e}", code=500)
        return ok(result, used_sample=True)

    try:
        uploaded = require_file("file")
    except ValueError as e:
        return fail(str(e))

    with tempfile.TemporaryDirectory() as temp_dir:
        path = os.path.join(temp_dir, uploaded.filename)
        uploaded.save(path)
        try:
            result = process_excel(path)
        except Exception as e:
            log.exception("process_excel failed")
            return fail(f"Failed to process Excel: {e}", code=500)
        return ok(result)


@app.route("/api/cogging/traindatacorrection", methods=["POST"])
def train_data_correction():
    if _is_sample_request():
        path = resolve_sample("cogging_data")
        if not path:
            return fail("Sample cogging dataset not available on server", code=500)
        try:
            target_astm = float(request.form.get("target_astm") or 6.0)
            weight_factor = float(request.form.get("weight_factor") or 0.1)
            with open(path, "rb") as f:
                result = correct_train_data(f, target_astm, weight_factor)
        except Exception as e:
            log.exception("correct_train_data (sample) failed")
            return fail(f"Failed to process sample: {e}", code=500)
        return ok(result, used_sample=True, sample_target_astm=target_astm, sample_weight_factor=weight_factor)

    try:
        f = require_file("file")
        target_astm = require_float("target_astm")
        weight_factor = require_float("weight_factor")
    except ValueError as e:
        return fail(str(e))

    try:
        result = correct_train_data(f, target_astm, weight_factor)
    except Exception as e:
        log.exception("correct_train_data failed")
        return fail(f"Failed to correct train data: {e}", code=500)
    return ok(result)


@app.route("/api/cogging/passschedule", methods=["POST"])
def pass_schedule():
    if _is_sample_request():
        model_path = resolve_sample("pretrained_cogging_model")
        data_path = resolve_sample("cogging_data")
        if not model_path or not data_path:
            return fail("Sample model or data not available on server", code=500)
        try:
            ics = float(request.form.get("initial_cross_section") or 110.0)
            il = float(request.form.get("initial_length") or 1500.0)
            cl = float(request.form.get("cutting_length") or 800.0)
            result = process_pass_schedule(_LocalFile(model_path), data_path, ics, il, cl)
        except Exception as e:
            log.exception("process_pass_schedule (sample) failed")
            return fail(f"Failed to process sample: {e}", code=500)
        return ok(result, used_sample=True)

    try:
        model_file = require_file("model")
        data_file = require_file("data")
        initial_cross_section = require_float("initial_cross_section")
        initial_length = require_float("initial_length")
        cutting_length = require_float("cutting_length")
    except ValueError as e:
        return fail(str(e))

    try:
        result = process_pass_schedule(
            model_file, data_file,
            initial_cross_section, initial_length, cutting_length,
        )
    except Exception as e:
        log.exception("process_pass_schedule failed")
        return fail(f"Failed to compute pass schedule: {e}", code=500)
    return ok(result)


@app.route("/api/processingmap/main_graph", methods=["POST"])
def upload_and_process():
    sample_mode = _is_sample_request()
    if sample_mode:
        sample_path = resolve_sample("processing_map")
        if not sample_path:
            return fail("Sample processing-map dataset not available on server", code=500)

    try:
        if not sample_mode:
            f = require_file("file")
        plot_type = require_str("plot_type")
        selected_data_raw = request.form.get("selected_data") or '[null]'
        steps = require_float("steps")
    except ValueError as e:
        return fail(str(e))

    try:
        selected_data = json.loads(selected_data_raw)
    except json.JSONDecodeError:
        return fail("'selected_data' must be a valid JSON array")
    if not selected_data:
        selected_data = [None]

    with tempfile.TemporaryDirectory() as tmpdir:
        if sample_mode:
            import shutil
            path = os.path.join(tmpdir, os.path.basename(sample_path))
            shutil.copy(sample_path, path)
        else:
            path = os.path.join(tmpdir, f.filename)
            f.save(path)

        extra_folders = {}

        if any((d is not None and "Simufact_particles_" in d) for d in selected_data):
            sim_dir = os.path.join(tmpdir, "simufact")
            os.makedirs(sim_dir, exist_ok=True)
            for key, new_name in {"simufact_t": "t.csv", "simufact_s": "s.csv", "simufact_sr": "sr.csv"}.items():
                if key not in request.files:
                    return fail(f"Missing required Simufact file: {key}")
                request.files[key].save(os.path.join(sim_dir, new_name))
            extra_folders["simufact"] = sim_dir

        if any((d is not None and "DEFORM_particles_" in d) for d in selected_data):
            df_dir = os.path.join(tmpdir, "deform")
            os.makedirs(df_dir, exist_ok=True)
            for key, new_name in {"deform_t": "t.dat", "deform_s": "s.dat", "deform_sr": "sr.dat"}.items():
                if key not in request.files:
                    return fail(f"Missing required DEFORM file: {key}")
                request.files[key].save(os.path.join(df_dir, new_name))
            extra_folders["deform"] = df_dir

        try:
            data1 = pd.read_excel(path, sheet_name="Sheet1")
        except Exception as e:
            return fail(f"Failed to read Excel file: {e}")

        try:
            result = main_graph(data1, plot_type, selected_data, extra_folders, steps)
        except Exception as e:
            log.exception("main_graph failed")
            return fail(f"main_graph failed: {e}", code=500)

        return jsonify(result)


@app.route("/api/processingmap/plot_values_against_strain", methods=["POST"])
def upload_and_process2():
    sample_mode = _is_sample_request()
    sample_path = resolve_sample("processing_map") if sample_mode else None
    if sample_mode and not sample_path:
        return fail("Sample processing-map dataset not available on server", code=500)

    try:
        if not sample_mode:
            f = require_file("file")
        plot_by = require_str("plot_by") if request.form.get("plot_by") else "temperature"
        value_type = require_str("value_type") if request.form.get("value_type") else "instability"
        steps = require_float("steps") if request.form.get("steps") else 0.1
        value = require_str("value") if request.form.get("value") else "1200"
    except ValueError as e:
        return fail(str(e))

    with tempfile.TemporaryDirectory() as tmpdir:
        if sample_mode:
            import shutil
            path = os.path.join(tmpdir, os.path.basename(sample_path))
            shutil.copy(sample_path, path)
        else:
            path = os.path.join(tmpdir, f.filename)
            f.save(path)
        try:
            data1 = pd.read_excel(path, sheet_name="Sheet1")
        except Exception as e:
            return fail(f"Failed to read Excel file: {e}")
        try:
            result = plot_values_against_strain(data1, steps, value, plot_by, value_type)
        except Exception as e:
            log.exception("plot_values_against_strain failed")
            return fail(f"plot_values_against_strain failed: {e}", code=500)
        return jsonify(result)


@app.route("/api/processingmap/collect_values_for_strain", methods=["POST"])
def cv_for_strain():
    sample_mode = _is_sample_request()
    sample_path = resolve_sample("processing_map") if sample_mode else None
    if sample_mode and not sample_path:
        return fail("Sample processing-map dataset not available on server", code=500)

    try:
        if not sample_mode:
            f = require_file("file")
        steps = require_float("steps") if request.form.get("steps") else 0.1
    except ValueError as e:
        return fail(str(e))

    with tempfile.TemporaryDirectory() as tmpdir:
        if sample_mode:
            import shutil
            path = os.path.join(tmpdir, os.path.basename(sample_path))
            shutil.copy(sample_path, path)
        else:
            path = os.path.join(tmpdir, f.filename)
            f.save(path)
        try:
            data1 = pd.read_excel(path, sheet_name="Sheet1")
        except Exception as e:
            return fail(f"Failed to read Excel file: {e}")
        try:
            result = collect_values_for_strain_api(data1, steps)
        except Exception as e:
            log.exception("collect_values_for_strain_api failed")
            return fail(f"collect_values_for_strain failed: {e}", code=500)
        return jsonify(result)


if __name__ == "__main__":
    debug = os.environ.get("FLASK_ENV") != "production"
    log.info("Starting backend1 (debug=%s, max_upload=%sMB)", debug, MAX_UPLOAD_MB)
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=debug)
