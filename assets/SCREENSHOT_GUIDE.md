# Screenshot Guide — How to capture images for the PPT yourself

> Authenticated pages cannot be captured by automated tools. This guide walks you through taking the remaining screenshots manually in ~10 minutes.

---

## Already done for you (in `assets/`)

### Public screenshots (no login needed)

- `screenshots/02_login.png` — Login page
- `screenshots/03_register.png` — Register page

### Diagrams (ready for PPT)

- `diagrams/01_architecture.png` + `.svg` — System architecture
- `diagrams/02_workflow_pipeline.png` + `.svg` — Closed-loop pipeline
- `diagrams/03_before_after.png` + `.svg` — Before vs After ForgeIQ
- `diagrams/04_personas.png` + `.svg` — Three user personas
- `diagrams/05_mesh_quality_grades.png` + `.svg` — Grade A–D cards
- `diagrams/06_cost_breakdown.png` + `.svg` — Total cost of ownership

**Use the SVG** in PowerPoint 2016+ (right-click → Insert → Picture → SVG). The image scales perfectly with no quality loss. Use the PNG if your version of PowerPoint doesn't support SVG.

---

## What you still need to capture (15 screenshots)

The following pages require login. Use this checklist.

### Setup

1. Open Chrome or Edge **in normal mode** (not incognito)
2. Go to `https://forgeiq.dev` → login with your credentials
3. Press **F11** for full-screen mode (cleaner screenshots)
4. Set browser zoom to **100%** (Ctrl + 0)
5. Press **Win + Shift + S** to open Windows Snipping Tool
6. Or install [ShareX](https://getsharex.com) for batch captures (recommended)

### Saving convention

Save screenshots to `f:\project_sayt\nsmlab-forgeiq\assets\screenshots\` with this naming:

```
04_home_authenticated.png       — for slide 8
05_cogging_quick.png            — for slide 9
06_cogging_result.png           — for slide 9
07_cogging_advanced.png         — for slide 10
08_cogging_advanced_result.png  — for slide 10
09_pmap_main_graph.png          — for slide 11
10_pmap_pinn.png                — for slide 11
11_3d_preform_quick.png         — for slide 12
12_3d_preform_result.png        — for slide 12
13_workflow_form.png            — for slide 13
14_workflow_log.png             — for slide 13
15_workflow_result.png          — for slide 13
16_compare.png                  — for slide 14
17_history.png                  — for slide 15
18_ai_assistant.png             — for slide 16
19_messages.png                 — for slide 16
```

---

## Step-by-step capture instructions

### 04 — Home (authenticated)

1. After login, go to `https://forgeiq.dev`
2. Capture the full hero section (top of the page)
3. Save as `04_home_authenticated.png`

### 05 — Cogging Quick mode

1. Navigate to `https://forgeiq.dev/cogging`
2. Click the **"Quick"** tab (yellow button at top)
3. Capture the form with ASTM and Weight Factor inputs visible
4. Save as `05_cogging_quick.png`

### 06 — Cogging result

1. From the same Quick mode form, set ASTM = 6, Weight Factor = 0.1
2. Click **"Generate"**
3. Wait for the result (~2 seconds)
4. Capture the result panel showing the chart + download buttons
5. Save as `06_cogging_result.png`

### 07 — Cogging Advanced mode

1. On `/cogging`, click the **"Advanced (upload files)"** tab
2. Capture the form showing the file picker
3. Save as `07_cogging_advanced.png`

### 08 — Cogging Advanced result (OPTIONAL — only if you have a sample Excel)

1. Upload your sample `.xlsx` (from `sample_data/Cogging data.xlsx`)
2. Click Generate, wait for completion (~30s)
3. Capture the result with model + plot
4. Save as `08_cogging_advanced_result.png`

### 09 — Processing Map main graph

1. Navigate to `https://forgeiq.dev/processing_map`
2. The default tab "Main Graph" should be active
3. Click **Run** (or wait for auto-render)
4. Capture the 2D contour map result
5. Save as `09_pmap_main_graph.png`

### 10 — PINN Surrogate tab

1. On `/processing_map`, click the **"PINN Surrogate"** tab
2. Click **Run**
3. Wait for the green "Recommended operating window" box
4. Capture both the contour map + the green box
5. Save as `10_pmap_pinn.png`

### 11 — 3D Preform Quick mode

1. Navigate to `https://forgeiq.dev/3d_preform`
2. Make sure "Quick" tab is selected
3. Capture the form with the hologram-style 3D viewer (purple gradient)
4. Save as `11_3d_preform_quick.png`

### 12 — 3D Preform result

1. From the form, click **"Generate 3D model"**
2. Wait 30–60 seconds (first run loads the U-Net)
3. The 3D model appears in the viewer
4. Capture the viewer + the mesh quality report card
5. Save as `12_3d_preform_result.png`

### 13 — Workflow form

1. Navigate to `https://forgeiq.dev/workflow`
2. Scroll to the input form (left panel)
3. Capture the form with all 4 stages checked
4. Save as `13_workflow_form.png`

### 14 — Workflow log

1. Click **"Run pipeline"**
2. Wait until you see all 4 green ✓ DONE marks (~35s)
3. Capture only the log panel (right side)
4. Save as `14_workflow_log.png`

### 15 — Workflow result

1. After the pipeline completes, scroll down to the result panel
2. Capture the full result with 3D viewer + metrics chips
3. Save as `15_workflow_result.png`

### 16 — Compare

1. Navigate to `https://forgeiq.dev/compare`
2. Capture the top section showing the 3 comparison cards (Cogging / Pmap / U-Net)
3. Save as `16_compare.png`

### 17 — History

1. Navigate to `https://forgeiq.dev/history`
2. After running a few features, this page will show your past runs
3. Capture the list
4. Save as `17_history.png`

### 18 — AI Assistant

1. On any page, click the AI Assistant chat icon (bottom right)
2. Type a question (e.g., "What does Weight Factor mean?")
3. Wait for response
4. Capture the chat panel with your message + AI response
5. Save as `18_ai_assistant.png`

### 19 — Messages

1. Navigate to `https://forgeiq.dev/message` (or `/super/message` if admin)
2. Click **"New thread"** to show the form
3. Capture the page with the message form
4. Save as `19_messages.png`

---

## Pro tips

### Use Light Mode

Most screenshots look better in light mode (white background). If you have dark mode set, switch via the user menu (top right) before capturing.

### Crop unnecessary whitespace

After capturing, open the image in Paint or [Photopea](https://www.photopea.com) and crop tight to the relevant content. Don't include large blank areas.

### Annotate when useful

For the User Guide PPT, adding red arrows or boxes to highlight UI elements helps users follow along. Use:

- PowerPoint shapes (insert circle/arrow)
- [Skitch](https://evernote.com/products/skitch) (Mac)
- [Greenshot](https://getgreenshot.org) (Windows, free)

### Save as PNG

Always save as PNG (not JPG) — text stays crisp.

### Naming

Use the number prefix in the filename (04_*, 05_*, etc.) so they sort correctly in File Explorer.

---

## Quick reference — keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| **Win + Shift + S** | Windows Snipping Tool (region capture) |
| **PrtSc** | Full screen to clipboard |
| **Alt + PrtSc** | Active window to clipboard |
| **F11** | Browser fullscreen toggle |
| **Ctrl + 0** | Browser zoom to 100% |
| **Ctrl + L** | Focus address bar (then type URL + Enter) |

---

## After you've captured all 16

1. Move them to `assets/screenshots/`
2. Open PowerPoint
3. Drag and drop each screenshot onto the corresponding slide
4. Resize and position
5. Add captions / annotations as needed

---

## Need help?

If a specific page doesn't look right or a feature fails:

1. Check that you're logged in
2. Refresh the page (Ctrl + R)
3. Open DevTools (F12) → Console tab → check for red errors
4. If still stuck, take a screenshot of the error and ask the developer

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Public screenshots | 2 | ✅ Done by automation |
| Diagrams | 6 | ✅ Done by automation |
| Authenticated screenshots | 16 | ⏳ You capture manually |
| **TOTAL ASSETS** | **24** | — |

Total estimated capture time: **~10–15 minutes**.

Good luck! 🎯
