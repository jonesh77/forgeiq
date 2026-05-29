# ForgeIQ — Platform Capabilities & Technical Reference

> **Copyright © 2026 Y. Alibek · NSMLab (Net Shape Manufacturing Laboratory). All rights reserved.**

A complete, honest reference of what this platform **does**, what **formulas** drive each computation, and — equally important — what the platform **cannot do**.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Program 1 — Cogging](#2-program-1--cogging)
   - 2.1 [Train Model](#21-train-model)
   - 2.2 [Train-Data Correction](#22-train-data-correction)
   - 2.3 [Pass Schedule Optimizer](#23-pass-schedule-optimizer)
3. [Program 2 — Processing Map](#3-program-2--processing-map)
   - 3.1 [Main Graph (2D / 3D)](#31-main-graph-2d--3d)
   - 3.2 [Plot Values Against Strain](#32-plot-values-against-strain)
   - 3.3 [Collect Values for Strain](#33-collect-values-for-strain)
   - 3.4 [Simufact / DEFORM Particle Overlays](#34-simufact--deform-particle-overlays)
4. [Program 3 — 3D Preform](#4-program-3--3d-preform)
5. [Auxiliary Features](#5-auxiliary-features)
6. [What the Platform CANNOT Do](#6-what-the-platform-cannot-do)
7. [Technology Stack](#7-technology-stack)
8. [Performance & Resource Profile](#8-performance--resource-profile)

---

## 1. Platform Overview

**ForgeIQ** is a web workbench for **hot-working / forging-process design**, combining:

- **Machine-learning models** (neural networks) to predict process outcomes from limited experimental data.
- **Numerical optimization** to design multi-pass forging schedules.
- **Materials-science theory** (Prasad processing maps) to identify safe operating windows.
- **Voxel-to-mesh geometry generation** for 3D preform design.

The platform is split into **three independent programs**, each addressing a distinct stage of the forging design pipeline:

| Program | Stage in design flow | Output |
|---|---|---|
| **Cogging** | Predict optimal multi-pass reduction schedule | 7-pass plan, forging ratios, void closure % |
| **Processing Map** | Identify safe temperature × strain-rate operating windows | 2D/3D contour maps of dissipation η and instability ξ |
| **3D Preform** | Generate pre-forging geometry from constraint data | Smoothed STL mesh for downstream simulation/manufacture |

All three share a unified web interface with user accounts (MongoDB-backed), an AI assistant (Google Gemini / OpenAI / Anthropic — first non-failing wins), computation history, bookmarks, PDF export, and trilingual UI (English / O'zbekcha / 한국어).

---

## 2. Program 1 — Cogging

Cogging is the open-die forging operation that progressively reduces the cross-section of a long workpiece (ingot → billet) over multiple passes. ForgeIQ's Cogging program automates two intertwined problems:

1. **Predicting ENE** (Effective Normalized Energy, a quality metric) from process parameters.
2. **Optimizing the 7-pass schedule** that minimizes ENE subject to physical constraints.

### 2.1 Train Model

#### What it does
Trains a small feed-forward neural network that predicts ENE from cogging parameters. The trained model is exported as an `.h5` file and reused in the Pass Schedule step.

#### Input
An `.xlsx` (Sheet1) with these 11 columns (in any order):
```
Feed | Depth Schedule | Number of Rotation | Pass1 | Pass2 | Pass3 | Pass4 | Pass5 | Pass6 | Pass7 | ENE
```

#### Pipeline (per [`fourimages1h5.py`](backend1/cogginglogic/fourimages1h5.py))

1. **Standardization** — all 10 input features → zero mean, unit variance:
   ```
   x' = (x − μ) / σ
   ```
   via `sklearn.preprocessing.StandardScaler`.

2. **Feature selection** — keep the top-10 features (currently all 10, kept for symmetry) ranked by ANOVA F-test against ENE:
   ```
   F = (between-group variance) / (within-group variance)
   ```
   via `sklearn.feature_selection.SelectKBest(f_regression, k=10)`.

3. **Data augmentation** — each row is duplicated 3× with Gaussian noise added:
   ```
   x_aug = x + 𝒩(0, σ_noise²),  σ_noise = 0.01
   ```
   This 4× the dataset before training.

4. **Train/test split** — 80 % train, 20 % test (`random_state=42`).

5. **Neural network architecture**:
   ```
   Input(10)
     → Dense(64, ReLU)
     → Dense(32, ReLU)
     → Dense(1, linear)        # ENE prediction
   ```
   ~2,400 trainable parameters.

6. **Training**:
   - Optimizer: **Adam** (lr=0.001 default)
   - Loss: **Mean Squared Error**, `L = (1/n) Σ (y − ŷ)²`
   - Metric: **MAE**, `(1/n) Σ |y − ŷ|`
   - Epochs: 100 (reduced from 400 for speed)
   - Batch size: 32
   - Validation split: 20 % of the train fold
   - **EarlyStopping** on `val_loss`, patience = 10, restores best weights

#### Output
Returns base64-encoded payload containing:
- **Trained `.h5` model** (Keras saved-model format, ~30–60 KB)
- A 4-panel figure as PNG:
  1. Actual vs Predicted ENE scatter (train + test)
  2. MAE-vs-epoch learning curve
  3. Residuals vs Predicted
  4. Feature importances (F-scores from `SelectKBest`)

#### What it does NOT do
- No hyperparameter tuning (architecture and learning rate are fixed).
- No cross-validation (single 80/20 split — small data sets may produce optimistic test scores).
- No uncertainty estimation (point predictions only).
- No physics-informed loss — it is a pure statistical regressor.

---

### 2.2 Train-Data Correction

#### What it does
Computes a **modified BQI** (Bayesian Quality Index) column that lets the user re-weight rows in the cogging dataset before training, biasing the model toward a target ASTM grain size.

#### Formula (per [`traindatacorrection.py`](backend1/cogginglogic/traindatacorrection.py))
For each row of the input Excel:
```
modify_BQI = Strain · StDev · ASTM_dev / ASTM
           + w · (ASTM_target − ASTM)²
```
where:
- `Strain`, `StDev`, `ASTM`, `ASTM_dev` are columns from the input dataset
- `ASTM_target` is a user-supplied number (target ASTM grain-size number, typically 5–8)
- `w` is a user-supplied **weight factor** (typical 0.1)

Columns `Strain`, `St.Dev`, `ASTM`, `ASTM.dev` are dropped from the output (their information is now folded into `modify_BQI`).

#### Output
A new `.xlsx` file (base64-encoded) with the original data minus the four merged columns and plus the new `modify_BQI` column. The user downloads this and uses it as input to Train Model.

#### What it does NOT do
- The formula itself is **fixed** — users cannot redefine it from the UI.
- It does not validate that columns exist; missing columns raise a Python `KeyError`.

---

### 2.3 Pass Schedule Optimizer

#### What it does
Given a trained ENE model and a starting workpiece, computes the **optimal 7-pass reduction schedule** that minimizes ENE while keeping the predicted ENE above a minimum threshold.

#### Inputs
- `.h5` model file from Train Model
- The same cogging `.xlsx` used to train it (needed to refit the scaler & selector)
- Initial cross-section, initial length, cutting length (all in mm)

#### Pipeline (per [`passschedule.py`](backend1/cogginglogic/passschedule.py))

1. **Refit scaler + selector** on the original Excel (matches the model's training-time transform).

2. **Constrained optimization** with `scipy.optimize.minimize`:
   - **Objective:** `minimize  ENE_predicted(x)`
   - **Constraint:** `ENE_predicted(x) − 0.001 ≥ 0`  (non-trivial energy)
   - **Bounds:** every feature in `[min, max]` observed in the training data
   - **Initial guess:** column means
   - **Method:** `'trust-constr'` (trust-region for constrained problems)
   - **Tolerance:** `1e-1`

3. **Recover the 7-pass plan** from the optimal `x*`:
   - `feed`, `depth_schedule`, `number_of_rotation` (first 3 features)
   - `pass1 … pass7` (next 7 features) — these are **area reduction ratios** (post-pass area / pre-pass area)

4. **Forging ratios — N × N square cross-sections**:
   ```
   A₀ = π · (initial_cross_section)² / 4         (round → square equivalent area)
   N₀ = √(A₀ / pass1)
   Nᵢ = √(Nᵢ₋₁² / pass_{i+1})    for i = 1..6
   ```
   Returned as strings like `"50×50"`, `"40×40"`, ... `"22×22"`.

5. **Length changes** — multiplicative:
   ```
   L₁ = pass1 · L₀
   Lᵢ = pass_{i+1} · Lᵢ₋₁    for i = 2..7
   ```

6. **Cutting lengths** — halve each length until it fits the cutting machine:
   ```
   while Lᵢ > cutting_length:
       Lᵢ ← Lᵢ / 2
       qty ← qty × 2
   ```
   Returned as `"<length> (<qty>)"`.

7. **Void closure %** — empirical polynomial in true strain:
   ```
   ε = ln((L − L₀) / L₀ + 1)              (true strain at pass i)
   V(ε) = 1 + B·ε + C·ε² + D·ε³
       with B = −1.521351466
            C =  0.818014592
            D = −0.145775097
   closure = min(|V(ε) − 1| × 100, 100)    %
   ```
   These coefficients are **fitted from prior NSMLab experiments**; they are constants in the code, not user-tunable.

#### Output
JSON object with:
- `feed`, `depth_schedule`, `number_of_rotation`
- `pass_schedule[7]`  (raw area-reduction ratios)
- `forging_ratios[7]` (`"NxN"` square strings)
- `length_changes[7]` (mm)
- `cutting_lengths[7]` (`"len (qty)"`)
- `void_closure[7]` (%)

The frontend renders this as a table and offers PDF export.

#### What it does NOT do
- It is **bound to the constants B, C, D** for void closure — these were fit on a specific steel and may be wrong for other materials.
- The optimizer has **no awareness of equipment limits** (press tonnage, anvil geometry, billet temperature drop between passes).
- It does not check whether the recommended passes are **physically achievable** — only that the predicted ENE is the lowest the model can find within the data's bounding box.
- A 7-pass schedule is **hard-coded**; cannot optimize for 5- or 10-pass schedules without code changes.

---

## 3. Program 2 — Processing Map

A **processing map** (Prasad / Gegel formulation) visualizes the *safe* operating window for hot deformation as a 2D field of two scalars:

- **Power dissipation η** (the larger, the more energy goes into beneficial microstructural evolution)
- **Plastic instability ξ** (negative values mark zones where flow becomes unstable — to be avoided)

over **temperature × strain-rate** coordinates, at a chosen total strain.

### 3.1 Main Graph (2D / 3D)

#### Input
An `.xlsx` (Sheet1) with **16 strain/stress columns** — `strain1, stress1, strain2, stress2, ... strain16, stress16` — corresponding to **4 temperatures × 4 strain rates** of hot-compression tests:

| | ε̇=0.01 s⁻¹ | ε̇=0.1 s⁻¹ | ε̇=1 s⁻¹ | ε̇=10 s⁻¹ |
|---|---|---|---|---|
| **T=1200°C** | strain1/stress1 | strain5/stress5 | strain9/stress9 | strain13/stress13 |
| **T=1100°C** | strain2/stress2 | strain6/stress6 | strain10/stress10 | strain14/stress14 |
| **T=1000°C** | strain3/stress3 | strain7/stress7 | strain11/stress11 | strain15/stress15 |
| **T=900°C**  | strain4/stress4 | strain8/stress8 | strain12/stress12 | strain16/stress16 |

#### Core formulas (per [`processingmap.py`](backend1/processingmaplogic/processingmap.py))

For each (T, ε̇) cell, at the user-picked strain ε:

1. **Strain-rate sensitivity `m`** — slope of log σ vs log ε̇ at the chosen strain, computed as a cubic-spline finite difference:
   ```
   m(T, ε̇) = ∂ log σ / ∂ log ε̇ ≈ [f(x + h) − f(x − h)] / (2h),  h = 10⁻⁴
   ```
   where `f` is the cubic spline through the four log₁₀(σ) values at this temperature.

2. **Power dissipation η** (Prasad):
   ```
   η = 2m / (m + 1)
   ```

3. **Plastic instability ξ** (Prasad):
   ```
   ξ(ε̇) = ∂ ln[ m / (m + 1) ] / ∂ ln ε̇  +  m
   ```
   computed by another cubic-spline derivative across the four strain rates.

4. **Auxiliary "Jun" value** (NSMLab-specific):
   ```
   J = 2m / η − 1.1
   ```

5. **2-D field by cubic interpolation** (`scipy.interpolate.griddata`, method='cubic') of the 16 (T, log ε̇) points onto a 50×50 grid.

#### Output

- **2D mode (`plot_type='2D'`):** Plotly contour plot — dissipation lines + grey-filled instability region (ξ ≤ 0).
- **Instability 3D (`plot_type='instability'`):** A flat colored surface at `z = strain` with red colormap showing ξ ≤ 0 zones.
- **Dissipation 3D (`plot_type='dissipation'`):** Same but Jet colormap on η, clipped to `[0.3, 0.5]`.

Multiple strains can be stacked into one 3D figure by passing several values in `selected_data`.

#### What it does NOT do
- It assumes the **exact 16-column layout** above. Different test grids (e.g. 5×5, or different temperatures) require code changes.
- It does not estimate **uncertainty** in η or ξ from stress measurement noise.
- It is locked to the **Prasad** dissipation/instability formulation; alternative models (Murty, Babu, etc.) are not implemented.

---

### 3.2 Plot Values Against Strain

#### What it does
Plots either **η** (dissipation) or **ξ** (instability) at one fixed temperature, sweeping strain across [0, 1].

#### Inputs
- Same 16-column Excel as Main Graph
- `plot_by`: `"temperature"` (fixed T, vary ε̇) or `"strainRate"` (fixed ε̇, vary T)
- `value_type`: `"instability"` or `"dissipation"`
- `value`: the fixed temperature or log strain rate
- `steps`: strain increment (default 0.1)

#### Output
A 2D line plot of the chosen quantity vs strain at the fixed coordinate.

---

### 3.3 Collect Values for Strain

#### What it does
Computes the **16 dissipation values** and **16 instability values** at user-selected strains, returns them as a table (for export to PDF or downstream analysis).

---

### 3.4 Simufact / DEFORM Particle Overlays

#### What it does
If you ran a finite-element simulation (Simufact Forming or DEFORM 3D) and extracted per-particle temperature, strain, and strain-rate histories, ForgeIQ can **overlay those particle trajectories** as scatter points on the processing-map 3D plot — so you can verify whether your simulated process visits unsafe (ξ ≤ 0) zones.

#### Inputs
- **Simufact** mode: three CSVs — `t.csv` (temperature), `s.csv` (strain), `sr.csv` (strain rate) — each with particle IDs as columns
- **DEFORM** mode: three `.dat` files in DEFORM's text export format — `t.dat`, `s.dat`, `sr.dat`

#### What it does NOT do
- It does not **run** the simulation; you must export particle data from Simufact / DEFORM yourself.
- It does not parse arbitrary CSV layouts; the columns must match the expected schema (use the sample files as templates).

---

## 4. Program 3 — 3D Preform

The **3D Preform** program predicts an *optimal pre-forging geometry* (a shape blank from which the final part is forged) using a 3D U-Net trained on DEFORM-simulated forging data, and exports it as a smooth STL mesh suitable for 3D printing or downstream FE simulation.

### Inputs
1. **U-Net `.h5`** — the trained 3D segmentation model (typical: 218 MB)
2. **Bounding-box `.csv`** — global min/max coordinates of the workspace (see sample)
3. **`.dat` element file** — DEFORM-format element connectivity (target geometry definition)
4. **`.dat` node file** — DEFORM-format node coordinates

### Pipeline (per [`giveStlModelBase64.py`](backend2/threedlogic/giveStlModelBase64.py))

1. **Parse DEFORM files** → dictionary of `{node_id: (x, y, z)}` and list of element node-id tuples.

2. **Center the target geometry** inside the workspace bounding box (offset = bbox_center − data_center).

3. **Voxelize** the target into a uniform 3D grid (size determined from bbox extent + margin), shape ≈ 128³.

4. **Resize to `(128, 128, 128)`** via `scipy.ndimage.zoom` (cubic spline order=1), normalize and add batch+channel dims.

5. **U-Net inference** — predict 3D voxel probability volume.
   - Custom loss functions used during training (carried in the saved model):
     ```
     dice_coef(y, ŷ) = (2 · Σ y·ŷ + ε) / (Σ y + Σ ŷ + ε)
     voxel_loss      = 1 − dice_coef + BCE(y, ŷ)
     folding_loss    = α · (1 − p_t)^γ · −log(p_t + ε)        (focal)
                      with α=0.25, γ=2.0
     ```
   - Loaded with `_load_or_cache_model` — first load takes ~20–30 s; later calls hit an in-process cache and return in ~5 s.

6. **Threshold** the prediction at `0.4` → binary 3D mask.

7. **Resize back** to the original voxel grid.

8. **Morphological cleanup**:
   ```
   binary_closing  (3×3×3 structuring element)
   binary_fill_holes
   ```

9. **Marching cubes** (`skimage.measure.marching_cubes`, level=0) → triangle mesh (vertices + faces).

10. **STL export** — `numpy-stl` writes a binary STL file.

11. **Post-processing options** (`stl_type`):
    - `"shifted"` — translate vertices by the shift values from the CSV.
    - `"lowstorage"` — `pymeshlab` decimation: remove duplicates, fix non-manifold edges, fill holes ≤ 10000 edges, then **quadric edge-collapse** to half the face count.
    - `"taubin_smoothed"` (default) — PyVista's Taubin smoothing, `n_iter=50`, `pass_band=0.0002` (preserves volume while smoothing surface noise).

12. **Volume comparison** — `trimesh.load_mesh(...).volume` before vs after, returns the % change.

### Output
JSON:
- `final_volume` (mm³, from the chosen STL)
- `volume_change_ratio` (% — positive means the post-processed mesh grew vs the raw marching-cubes mesh)
- `stl_file` (base64-encoded `.stl` binary, viewable in the Three.js viewer or downloadable)

### What it does NOT do
- **It will not learn from new data inside the app.** The U-Net is pre-trained offline; the app only does *inference*.
- It does not handle arbitrary input formats — only DEFORM `.dat`. Abaqus, ANSYS, Forge, etc. would need preprocessing.
- It does **not check manufacturability** (draft angles, undercuts, minimum wall thickness). The output is a *predicted* preform geometry, not a *manufacturable* one.
- It does not provide **mesh quality metrics** beyond volume change.
- The output STL is closed and watertight only insofar as marching cubes + hole filling produced one — for highly noisy predictions, manual repair in MeshLab or Blender may be needed.

---

## 5. Auxiliary Features

| Feature | What it does | Storage |
|---|---|---|
| **User accounts** | Register / login with email + password (bcrypt-hashed). Session via `iron-session` cookie. | MongoDB `users` collection |
| **Computation history** | Every form submission is logged with parameters and timestamp; user can review past runs and re-open with the same inputs. | MongoDB `history` collection (per user) |
| **Bookmarks** | Save named parameter sets on Pass Schedule and Train Data Correction; reapply with one click. | MongoDB `bookmarks` collection (per user) |
| **Compare history entries** | Side-by-side parameter diff between any two history rows; yellow highlight on differing values. | Client-side rendering |
| **PDF export** | Pass Schedule results exportable as a print-ready PDF via `jspdf` + `jspdf-autotable`. | Browser download |
| **Trilingual UI** | English, O'zbekcha, 한국어 — hero, tabs, mode toggle, all top-level navigation. Stored per browser in `localStorage`. | `frontend/src/lib/i18n.tsx` |
| **AI assistant** | In-app chatbot answering platform questions. Provider chain: **Google Gemini → OpenAI → Anthropic Claude → local FAQ**. Maintains last-8-turn context. Streams within thinking-model budget. | `frontend/src/lib/ai-assistant.ts` |
| **"Try with sample" mode** | Every form has a yellow button that runs the computation against bundled sample data — no upload needed. | Backend `samples_lib.py` registers paths |
| **Admin messaging** | Users can leave a "Leave message" to the admin team; admins reply via `/super/message`; replies appear live on the user side via polling. | MongoDB `messages` + `replies` collections |
| **Auto-pipeline workflow** | Chain Train Model → Pass Schedule → 3D Preform as a single guided flow (Sparkles ✨ icon in the menu). | `frontend/src/app/workflow/page.tsx` |
| **Dockerized deployment** | `docker-compose.yml` brings up frontend (Next.js), backend1 (Flask), backend2 (Flask) with health checks. | `.config/docker-compose.yml` |
| **One-click launcher (Windows)** | `run.exe` / `setup-and-run.ps1` create venvs, install dependencies, run all 3 services in separate cmd windows. | `setup-and-run.ps1` |

---

## 6. What the Platform CANNOT Do

This list is deliberately specific — knowing the boundaries is as important as knowing the features.

### Cogging
- **No training-from-scratch via UI.** You provide the dataset; the architecture and hyperparameters are fixed.
- **No multi-material support out of the box.** The void-closure constants `B, C, D` and the ENE definition assume a specific steel.
- **No equipment-aware constraints.** It will happily recommend a 90 % reduction in one pass that no real press could deliver.
- **No live process feedback** (sensor data integration).

### Processing Map
- **Fixed 16-point experimental grid** (4 temperatures × 4 strain rates).
- **Prasad model only** — no Murty, Gegel, or alternative formulations.
- **No measurement-uncertainty propagation** — input stress values are taken as exact.
- **No automatic identification of "safe windows"** — the user must read the map visually.

### 3D Preform
- **Inference only — no online training.** Adding a new geometry class requires re-training the U-Net offline (not exposed in the app).
- **DEFORM `.dat` format only.** No ANSYS, Abaqus, OpenFOAM, or STL input.
- **No mesh-quality control** beyond Taubin smoothing & decimation defaults.
- **No manufacturability checks** (draft angles, undercuts, tooling collision).
- **No multi-physics** (no thermal coupling, no springback, no anisotropy).

### Platform-wide
- **No real-time collaboration** — two users on the same parameters don't see each other's work.
- **No version-control of trained models** — uploading a new `.h5` replaces previous behavior; no rollback.
- **No batch / queue processing** — every request is synchronous; the user waits for the result.
- **No GPU usage by default** — TensorFlow runs on CPU (a CUDA load attempt is logged but failure is ignored).
- **No mobile app** — responsive web only; small screens are functional but not optimized.
- **No SSO / OAuth** (no Google/GitHub login) — only email+password.
- **No automated test suite** — code changes are validated manually.
- **No formal model validation pipeline** — predicted ENE, η, ξ, STL geometries are not cross-validated against held-out experiments by the app itself.

### Honest caveats about the AI assistant
- It runs on commercial API providers; if all keys hit quota/limits, the assistant falls back to keyword FAQ matching.
- The system prompt knows about *this* platform, but it can still **hallucinate** non-existent features or wrong file formats. Always confirm against the `(i)` icon on each form.

---

## 7. Technology Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | Next.js 15 (App Router) + React 19 + Tailwind 4 | Modern SSR/CSR hybrid; rich component ecosystem |
| **UI primitives** | Radix UI + shadcn/ui patterns | Accessible, composable |
| **3D viewer** | Three.js | STL inspection in-browser |
| **Plotting** | Plotly.js + react-plotly.js | Interactive contour / scatter |
| **PDF** | jspdf + jspdf-autotable | Client-side PDF generation |
| **Session** | iron-session + bcryptjs | Stateless sealed-cookie sessions |
| **Database** | MongoDB Atlas (cloud) | Document store for users, history, bookmarks, messages |
| **Backend (general)** | Python 3.9 + Flask + waitress | Light, mature |
| **ML — cogging** | TensorFlow / Keras, scikit-learn, SciPy | Small NN + classical optimization |
| **ML — 3D preform** | TensorFlow / Keras (3D U-Net) | Voxel segmentation |
| **3D mesh** | scikit-image (marching cubes), numpy-stl, trimesh, pymeshlab, PyVista | Voxel → mesh → cleanup → smoothing |
| **Containerization** | Docker, docker-compose | Reproducible deploys |
| **AI assistant** | Google Gemini, OpenAI, Anthropic (all via REST) | Multi-provider with fallback |

---

## 8. Performance & Resource Profile

| Operation | Typical wall time | Memory | Notes |
|---|---|---|---|
| Cogging Train Model | 5–15 s | ~200 MB | 100 epochs on ~100-row datasets |
| Cogging Pass Schedule | 1–3 s | ~50 MB (after model load) | trust-region usually ≤ 20 iterations |
| Processing Map (2D) | < 1 s | ~30 MB | Pure NumPy/SciPy interpolation |
| Processing Map (3D, multi-strain) | 1–4 s | ~100 MB | Stacked Plotly surfaces |
| 3D Preform — *first* sample call | **30–60 s** | ~2 GB RAM | U-Net load + first inference |
| 3D Preform — *subsequent* calls | **~5 s** | (cache hit) | Reuses in-process model |
| AI assistant query | 1–4 s (Gemini), 1–3 s (OpenAI/Claude) | negligible | Network-bound |

### Minimum server requirements
- **CPU:** 2 vCPU (4 vCPU recommended for concurrent users)
- **RAM:** 4 GB minimum, **8 GB recommended** (the U-Net cache alone is ~2 GB)
- **Disk:** 5 GB code + dependencies; **+ ~700 MB for the bundled sample dataset** (U-Net `.h5` + 3 sample `.npy` files — these are **not committed to git** and must be downloaded separately)
- **Network:** outbound HTTPS access to MongoDB Atlas + the AI-assistant providers

---

*This document is part of the ForgeIQ platform.
For licensing & permissions: see [LICENSE](./LICENSE).*

— **Y. Alibek** · NSMLab · Sogang University · 2026
