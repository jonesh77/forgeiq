# ForgeIQ — Backend Test Suite

Automated tests that **prove the backend programs produce correct results**, not
just that they run. Every test imports the real production modules from
`backend1/` and runs them against the real sample data in `sample_data/`.

## Run it

```bash
pip install -r requirements-dev.txt
pytest                      # everything
pytest tests/test_processing_map.py -v   # one module, verbose
```

The **core** modules need no TensorFlow and finish in ~20 s. The pass-schedule
and API-contract modules need TensorFlow/Keras and **skip automatically** if it
is not installed.

## What each module proves

| Module | Proves | Needs TF? |
|---|---|---|
| `test_processing_map.py` | Prasad processing-map physics is correct: η = 2m/(m+1) stays physical, instability ξ has both signs across strains, the η↔m relation round-trips, and all plot builders return valid Plotly figures + a real `.xlsx` export. | No |
| `test_train_data_correction.py` | The `modify_BQI` formula matches a hand computation to 1e-9, the four merged columns are dropped, all other columns and the row count survive, and the penalty term has the correct sign. | No |
| `test_cogging_pipeline.py` | The full chain **Cogging data → correction → gradient-boosting trainer** yields a well-formed payload: finite cross-validated metrics, an 80% prediction-interval coverage in [0,100]%, a valid PNG diagnostic, a loadable model bundle whose adapter returns `(n,1)` predictions, and bit-identical results across runs (determinism). | No |
| `test_pass_schedule.py` | The optimizer returns all 7-pass fields; void closure stays in [0,100]% and matches the documented polynomial exactly; forging ratios are square `N×N`; temperatures decay by the per-pass drop; and an aggressive temperature drop correctly raises a feasibility warning. | Yes |
| `test_api_contract.py` | The backend1 Flask app answers `/api/health`, 404s unknown routes, and returns a clean JSON 4xx (never a raw 500 stack trace) when a request is missing its file or form fields. | Yes |
| `test_3d_geometry.py` | The 3D-preform geometry pipeline: real `.dat`/`.csv` parsing, node→bbox-centre shifting, voxelisation, voxel→STL marching cubes, STL volume, and the manufacturability report (a solid cube is watertight, genus 0, grade A; the report is JSON-serializable). | Yes |
| `test_3d_model.py` | The custom losses behave correctly (Dice of identical = 1, disjoint ≈ 0, all finite) and the Attention U-Net honours its I/O contract: cubic voxel grid in → same-size sigmoid (0..1) grid out, at multiple sizes. | Yes |
| `test_3d_api.py` | The backend2 Flask app reports `service: backend2`, returns clean JSON 4xx for missing files on both the sync and async submit endpoints, and 404s an unknown job id. Loaded in isolation so it never clashes with backend1's identically-named `main`. | Yes |

### Notes for the 3D (backend2) tests

- They import TensorFlow (the custom losses live next to the inference code), so
  they **skip** if TF is absent.
- The mesh post-processing tests (Taubin smoothing, quadric decimation) need
  native OpenGL libraries. On a bare CI runner install them first:
  `apt-get install -y libgl1 libglu1-mesa`. Without them those two tests skip
  themselves; everything else still runs.
- The full `run_pipeline` (U-Net inference end-to-end) is **not** covered here
  because it needs the offline-trained ~218 MB weights, which are not in git.
  That belongs in a separate integration job with the weights mounted.

## Why this matters

Before this suite, the only way to know a change didn't break the science was to
click through the UI by hand. Now a single `pytest` run — and the GitHub Actions
badge on every commit — gives an objective, repeatable answer. That is the
difference between a demo and something a buyer, collaborator, or visa reviewer
can trust.
