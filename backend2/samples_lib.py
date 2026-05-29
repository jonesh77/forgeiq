"""Sample file registry for backend2 (3D Preform)."""
import os
from flask import jsonify, send_file

SAMPLE_DIR = os.path.abspath(
    os.environ.get(
        "SAMPLE_DIR",
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample_data"),
    )
)

SAMPLES = {
    "unet_model":       ("unet_model.h5",                    "unet_model.h5",       "Pre-trained U-Net model for 3D preform prediction"),
    "bbox_csv":         ("shifted_coordinates_and_bbox.csv", "bbox.csv",            "Shifted coordinates + bounding-box CSV"),
    "target_elem":      ("Additional_target_elem/01.dat",    "additional_elem.dat", "Element data (DEFORM format)"),
    "target_node":      ("Additional_target_node/01.dat",    "additional_node.dat", "Node data (DEFORM format)"),
}


def resolve_sample(name):
    if name not in SAMPLES:
        return None
    rel, _, _ = SAMPLES[name]
    path = os.path.normpath(os.path.join(SAMPLE_DIR, rel))
    return path if os.path.exists(path) else None


def sample_info():
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
