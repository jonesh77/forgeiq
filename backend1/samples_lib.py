"""Sample file registry + serving for backend1 endpoints.

Lets each endpoint optionally load a built-in sample file when the form
field `_use_sample=true` is sent. Also exposes a download endpoint so
the frontend can let users grab the raw sample.
"""
import os
from flask import jsonify, send_file, abort

SAMPLE_DIR = os.path.abspath(
    os.environ.get(
        "SAMPLE_DIR",
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample_data"),
    )
)

# Logical name -> (relative path, friendly display name, description)
SAMPLES = {
    "cogging_data":             ("Cogging data.xlsx",                "cogging_data.xlsx",           "Cogging training/correction dataset"),
    "pretrained_cogging_model": ("pretrained_cogging_model.h5",      "pretrained_cogging_model.h5", "Pre-trained Keras model for Pass Schedule"),
    "processing_map":           ("_RAW_Processing map_AISI4340.xlsx", "processing_map.xlsx",         "Processing-map raw data (AISI4340 steel)"),
    "simufact_t":               ("../backend1/processingmaplogic/Simufact_particle/t.csv",  "simufact_t.csv",  "Simufact particle temperatures"),
    "simufact_s":               ("../backend1/processingmaplogic/Simufact_particle/s.csv",  "simufact_s.csv",  "Simufact particle strains"),
    "simufact_sr":              ("../backend1/processingmaplogic/Simufact_particle/sr.csv", "simufact_sr.csv", "Simufact particle strain rates"),
    "deform_t":                 ("../backend1/processingmaplogic/deform_particle/T.dat",    "deform_T.dat",    "DEFORM particle temperatures"),
    "deform_s":                 ("../backend1/processingmaplogic/deform_particle/S.dat",    "deform_S.dat",    "DEFORM particle strains"),
    "deform_sr":                ("../backend1/processingmaplogic/deform_particle/SR.dat",   "deform_SR.dat",   "DEFORM particle strain rates"),
}


def resolve_sample(name):
    """Return absolute path to a sample file, or None if not found."""
    if name not in SAMPLES:
        return None
    rel, _, _ = SAMPLES[name]
    path = os.path.normpath(os.path.join(SAMPLE_DIR, rel))
    return path if os.path.exists(path) else None


def sample_info():
    """Return JSON metadata for every available sample."""
    out = {}
    for key, (rel, display, desc) in SAMPLES.items():
        path = resolve_sample(key)
        out[key] = {
            "available": path is not None,
            "filename": display,
            "description": desc,
            "size_bytes": (os.path.getsize(path) if path else 0),
        }
    return out


def register_sample_routes(app):
    """Attach /api/samples/* routes to the given Flask app."""

    @app.route("/api/samples", methods=["GET"])
    def samples_list():
        return jsonify({"status": "good", "samples": sample_info(), "sample_dir": SAMPLE_DIR})

    @app.route("/api/samples/<name>", methods=["GET"])
    def samples_download(name):
        path = resolve_sample(name)
        if not path:
            return jsonify({"status": "error", "error": f"Sample '{name}' not found"}), 404
        _, display, _ = SAMPLES[name]
        return send_file(path, as_attachment=True, download_name=display)
