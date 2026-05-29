import os
import base64
import numpy as np
import pandas as pd
from stl import mesh
from skimage import measure
from scipy.ndimage import binary_closing, binary_fill_holes
import pymeshlab
import trimesh
import pyvista as pv
import tensorflow as tf
from tensorflow.keras import backend as K
from scipy.ndimage import zoom

result_path = os.environ.get('RESULT_PATH', os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'result'))
os.makedirs(result_path, exist_ok=True)

# Cache the loaded U-Net model in memory, keyed by absolute path.
# Re-loading a 218 MB model on every request takes 20-30s; caching makes
# the second-and-later call return in seconds.
_MODEL_CACHE = {}

grid_size = (128, 128, 128)

# ------------------------ [손실 함수 정의] ------------------------
def dice_coef(y_true, y_pred):
    smooth = 1.0
    y_true_f = K.flatten(K.cast(y_true, 'float32'))
    y_pred_f = K.flatten(K.cast(y_pred, 'float32'))
    intersection = K.sum(y_true_f * y_pred_f)
    return (2. * intersection + smooth) / (K.sum(y_true_f) + K.sum(y_pred_f) + smooth)

def voxel_loss(y_true, y_pred):
    return 1 - dice_coef(y_true, y_pred) + tf.keras.losses.binary_crossentropy(y_true, y_pred)

def folding_loss(y_true, y_pred, alpha=0.25, gamma=2.0):
    epsilon = 1e-6
    y_pred = tf.clip_by_value(y_pred, epsilon, 1.0 - epsilon)
    p_t = tf.where(tf.equal(y_true, 1), y_pred, 1 - y_pred)
    alpha_t = tf.where(tf.equal(y_true, 1), alpha, 1 - alpha)
    weight = alpha_t * tf.pow(1 - p_t, gamma)
    loss = tf.reduce_mean(-weight * tf.math.log(p_t + epsilon))
    return tf.where(tf.reduce_all(tf.equal(y_true, 1)), loss * 0.1, loss)

def weighted_folding_loss(y_true, y_pred):
    return folding_loss(y_true, y_pred)

# ------------------------ [공통 함수] ------------------------
def resize_voxel(voxel, target_shape):
    factors = [t / s for t, s in zip(target_shape, voxel.shape)]
    return zoom(voxel, factors, order=1)

def load_bbox_from_csv(csv_path):
    df = pd.read_csv(csv_path)
    return df['Min Coord'].values, df['Max Coord'].values

def load_shift_values(csv_file):
    df = pd.read_csv(csv_file)
    shift_x = df.loc[df['Axis'] == 'X', 'Shift Value'].values[0]
    shift_y = df.loc[df['Axis'] == 'Y', 'Shift Value'].values[0]
    shift_z = df.loc[df['Axis'] == 'Z', 'Shift Value'].values[0] * 0.8
    return shift_x, shift_y, shift_z

def load_nodes(file_path):
    nodes = {}
    with open(file_path, 'r') as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) >= 4:
                nodes[int(parts[0])] = tuple(map(float, parts[1:4]))
    return nodes

def load_elements(file_path):
    elements = []
    with open(file_path, 'r') as f:
        for line in f:
            parts = line.strip().split()
            try:
                int(parts[0])  # skip element ID
                node_ids = list(map(int, parts[1:]))
                elements.append(node_ids)
            except:
                continue
    return elements

def shift_nodes_to_bbox_center(nodes, min_coords, max_coords):
    coords = np.array(list(nodes.values()))
    data_center = coords.mean(axis=0)
    bbox_center = (min_coords + max_coords) / 2
    offset = bbox_center - data_center
    shifted_nodes = {nid: tuple(np.array(coord) + offset) for nid, coord in nodes.items()}
    return shifted_nodes, offset

def create_voxel(nodes, elements, min_coords, max_coords, margin=2):
    overall_size = max(max_coords - min_coords)
    grid_size = int(overall_size) + margin * 2
    voxels = np.zeros((grid_size, grid_size, grid_size), dtype=np.uint8)

    for elem in elements:
        coords = np.array([nodes[nid] for nid in elem if nid in nodes])
        if coords.size == 0: 
            continue
        min_idx = ((coords.min(axis=0) - min_coords) / overall_size * (grid_size - margin)).astype(int) + margin // 2
        max_idx = ((coords.max(axis=0) - min_coords) / overall_size * (grid_size - margin)).astype(int) + margin // 2
        for x in range(min_idx[0], max_idx[0] + 1):
            for y in range(min_idx[1], max_idx[1] + 1):
                for z in range(min_idx[2], max_idx[2] + 1):
                    voxels[x, y, z] = 1
    return voxels, (grid_size, grid_size, grid_size)

# ------------------------ [단일 dat 처리] ------------------------
def convert_single_dat_to_voxel(dat1_path, dat2_path, min_coords, max_coords):
    nodes = load_nodes(dat2_path)
    elements = load_elements(dat1_path)
    shifted_nodes, offset = shift_nodes_to_bbox_center(nodes, min_coords, max_coords)
    voxels, shape = create_voxel(shifted_nodes, elements, min_coords, max_coords)
    return {
        'voxels': voxels,
        'original_shape': shape,
        'offset': offset.tolist()
    }

# ------------------------ [예측] ------------------------
def predict_single(model, voxel_dict, threshold=0.4):
    original_shape = voxel_dict['original_shape']
    x_input = resize_voxel(voxel_dict['voxels'], grid_size)[np.newaxis, ..., np.newaxis].astype('float32')
    y_pred = model.predict(x_input)
    voxel_pred = (y_pred[0][0, ..., 0] > threshold).astype(np.float32)
    return resize_voxel(voxel_pred, original_shape), voxel_dict['offset']

# ------------------------ [Voxel → STL] ------------------------
def voxel_to_stl(voxels, stl_file):
    if voxels is None or voxels.ndim != 3:
        raise ValueError("Voxel data must be a 3D array.")
    if np.any(voxels):
        voxels = binary_closing(voxels, structure=np.ones((3,3,3)))
        voxels = binary_fill_holes(voxels)
    verts, faces, normals, values = measure.marching_cubes(voxels, level=0.)
    voxel_mesh = mesh.Mesh(np.zeros(faces.shape[0], dtype=mesh.Mesh.dtype))
    for i, f in enumerate(faces):
        for j in range(3):
            voxel_mesh.vectors[i][j] = verts[f[j], :]
    voxel_mesh.vectors = voxel_mesh.vectors[:, ::-1, :]
    voxel_mesh.save(stl_file)
    return stl_file

def calculate_stl_volume(stl_file):
    stl_mesh = trimesh.load_mesh(stl_file)
    return stl_mesh.volume


def analyse_stl_quality(stl_file):
    """Return a manufacturability/quality report for the given STL.

    Uses trimesh's geometry checks. All scalars are plain Python floats / ints
    so the dict is JSON-serializable for the API response.

    Field meanings:
      - watertight              : sealed mesh, no holes → required for 3D printing & FEM
      - winding_consistent      : every face normal points outwards → manifold
      - euler_number / genus    : topology — genus 0 = topologically a sphere (a good preform)
      - vertex_count / face_count
      - volume_mm3              : signed volume (negative ⇒ flipped normals)
      - surface_area_mm2
      - bbox_mm                 : (x, y, z) extents of the axis-aligned bounding box
      - min_wall_thickness_mm   : conservative lower bound (2 × min |signed-distance from inside|)
                                  via trimesh.proximity; None if not estimable
      - aspect_ratio            : max(bbox) / min(bbox) — thin-slab indicator
      - score / grade           : 0..1 aggregate + letter grade for the UI
    """
    m = trimesh.load_mesh(stl_file)

    watertight = bool(m.is_watertight)
    consistent = bool(m.is_winding_consistent)
    euler = int(m.euler_number)
    genus = max(0, (2 - euler) // 2) if watertight else None
    vol = float(abs(m.volume))
    surf = float(m.area)
    bbox = m.extents.tolist() if m.extents is not None else [0.0, 0.0, 0.0]
    bbox = [float(b) for b in bbox]
    aspect = float(max(bbox) / max(min(bbox), 1e-9)) if bbox else None

    # Min wall thickness: sample 1000 surface points, ask trimesh for the
    # nearest *interior* distance and double it (≈ wall thickness at that spot).
    min_wall = None
    try:
        if watertight and len(m.faces) > 0:
            sample_pts, _ = trimesh.sample.sample_surface(m, min(1000, max(50, len(m.faces) // 4)))
            # Move each sample slightly inward then query distance back to the surface
            normals = m.face_normals[_]  # face index for each sample
            inward = sample_pts - normals * 1e-3
            dists = trimesh.proximity.closest_point(m, inward)[1]
            min_wall = float(2.0 * float(dists.min()))
    except Exception:  # noqa: BLE001 — quality probe is best-effort
        min_wall = None

    # Aggregate 0..1 score and a letter grade (used by the UI badge).
    flags = {
        "watertight": watertight,
        "winding_consistent": consistent,
        "manifold_genus_ok": (genus is not None and genus <= 2),
        "aspect_ok": (aspect is not None and aspect < 20.0),
        "thickness_ok": (min_wall is None or min_wall >= 1.0),  # 1 mm typical print floor
    }
    passed = sum(1 for v in flags.values() if v)
    score = passed / len(flags)
    grade = "A" if score >= 0.95 else "B" if score >= 0.8 else "C" if score >= 0.6 else "D"

    return {
        "watertight": watertight,
        "winding_consistent": consistent,
        "euler_number": euler,
        "genus": genus,
        "vertex_count": int(len(m.vertices)),
        "face_count": int(len(m.faces)),
        "volume_mm3": vol,
        "surface_area_mm2": surf,
        "bbox_mm": bbox,
        "aspect_ratio": aspect,
        "min_wall_thickness_mm": min_wall,
        "flags": flags,
        "score": score,
        "grade": grade,
    }

def shift_stl_coordinates(input_stl, output_stl, shift_x, shift_y, shift_z):
    mesh_data = trimesh.load_mesh(input_stl)
    mesh_data.vertices += np.array([shift_x, shift_y, shift_z])
    mesh_data.export(output_stl)
    return output_stl

def fix_and_simplify_stl(file_path, output_path):
    ms = pymeshlab.MeshSet()
    ms.load_new_mesh(file_path)
    ms.meshing_remove_duplicate_faces()
    ms.meshing_remove_duplicate_vertices()
    ms.meshing_repair_non_manifold_edges()
    ms.meshing_close_holes(maxholesize=10000)
    ms.meshing_decimation_quadric_edge_collapse(targetfacenum=ms.current_mesh().face_number() // 2)
    ms.save_current_mesh(output_path)
    return output_path

def apply_taubin_smoothing(input_file, output_file, n_iter=50, pass_band=0.0002):
    mesh = pv.read(input_file)
    smoothed_mesh = mesh.smooth_taubin(n_iter=n_iter, pass_band=pass_band)
    smoothed_mesh.save(output_file)
    return output_file

# ------------------------ [엔트리 함수] ------------------------
def _load_or_cache_model(h5_path):
    """Load the U-Net model, caching the rebuilt float32 model by file path
    and last-modified-time. Cache hits skip the 20-30 second re-load.

    Model interchangeability:
    The plain `build_unet_3d` (train_unet.py) and the upgraded `build_attention_unet_3d`
    (attention_unet.py) produce .h5 files with identical I/O signatures
    (128^3 voxel in -> 128^3 sigmoid out) and the same `custom_objects` map.
    Either one drops in here without code changes — just point the request at
    the new .h5 file.
    """
    abs_path = os.path.abspath(h5_path)
    mtime = os.path.getmtime(abs_path)
    cache_key = (abs_path, mtime)
    cached = _MODEL_CACHE.get(cache_key)
    if cached is not None:
        print("[INFO] Reusing cached model:", abs_path)
        return cached

    print("[INFO] Loading model (first time):", abs_path)
    custom_objects = {
        'voxel_loss': voxel_loss,
        'folding_loss': folding_loss,
        'weighted_folding_loss': weighted_folding_loss,
        'dice_coef': dice_coef
    }
    orig_model = tf.keras.models.load_model(abs_path, custom_objects=custom_objects)
    weights = [w.astype('float32') for w in orig_model.get_weights()]
    config = orig_model.get_config()
    for layer in config['layers']:
        if 'dtype' in layer['config']:
            layer['config']['dtype'] = 'float32'
    model = tf.keras.Model.from_config(config, custom_objects=custom_objects)
    model.set_weights(weights)

    # Single-entry cache (keep memory bounded — drop previous models)
    _MODEL_CACHE.clear()
    _MODEL_CACHE[cache_key] = model
    return model


def run_pipeline(h5_path, csv_path, dat1_path, dat2_path, idx="001", threshold=0.4, stl_type="taubin_smoothed"):
    print("[INFO] Loading bounding box...")
    min_coords, max_coords = load_bbox_from_csv(csv_path)
    model = _load_or_cache_model(h5_path)

    voxel_dict = convert_single_dat_to_voxel(dat1_path, dat2_path, min_coords, max_coords)
    voxels, offset = predict_single(model, voxel_dict, threshold=threshold)

    base_stl = os.path.join(result_path, f"{idx}_base.stl")
    voxel_to_stl(voxels, base_stl)
    initial_volume = calculate_stl_volume(base_stl)

    stl_file = base_stl
    if stl_type == "shifted":
        shift_x, shift_y, shift_z = load_shift_values(csv_path)
        stl_file = shift_stl_coordinates(stl_file, os.path.join(result_path, f"{idx}_shifted.stl"), shift_x, shift_y, shift_z)
    elif stl_type == "lowstorage":
        stl_file = fix_and_simplify_stl(stl_file, os.path.join(result_path, f"{idx}_lowstorage.stl"))
    elif stl_type == "taubin_smoothed":
        stl_file = apply_taubin_smoothing(stl_file, os.path.join(result_path, f"{idx}_taubin_smoothed.stl"))

    final_volume = calculate_stl_volume(stl_file)
    volume_change_ratio = ((final_volume - initial_volume) / initial_volume) * 100
    quality = analyse_stl_quality(stl_file)

    with open(stl_file, "rb") as f:
        stl_b64 = base64.b64encode(f.read()).decode("utf-8")

    return {
        "final_volume": final_volume,
        "volume_change_ratio": volume_change_ratio,
        "stl_file": stl_b64,
        "quality": quality,
    }
