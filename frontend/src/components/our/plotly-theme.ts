/**
 * Modern Plotly layout / config overrides applied to every chart we render.
 *
 * The Flask backend produces minimal `fig.to_dict()` output. We deep-merge our
 * theme on top so the charts look like part of the rest of the UI (Inter/Public
 * Sans, slate gridlines, modern colour scales).
 */

export const PLOT_CONFIG = {
  responsive: true,
  displaylogo: false,
  toImageButtonOptions: { format: "png" as const, scale: 2 },
  modeBarButtonsToRemove: ["lasso2d", "select2d"],
};

const FONT = { family: "Public Sans, Inter, system-ui, sans-serif", size: 13, color: "#334155" };

const COMMON_LAYOUT_OVERRIDES: Record<string, any> = {
  paper_bgcolor: "rgba(255,255,255,0)",
  plot_bgcolor: "rgba(248,250,252,0.7)",
  font: FONT,
  title: {
    font: { family: FONT.family, size: 18, color: "#0f172a", weight: 600 } as any,
    pad: { t: 4, b: 14 },
    x: 0.02,
    xanchor: "left",
  },
  margin: { l: 70, r: 30, t: 60, b: 60 },
  hoverlabel: {
    bgcolor: "#0f172a",
    bordercolor: "#1e293b",
    font: { family: FONT.family, size: 12, color: "#f8fafc" },
  },
  legend: {
    bgcolor: "rgba(255,255,255,0.85)",
    bordercolor: "#e2e8f0",
    borderwidth: 1,
    font: { ...FONT, size: 11 },
  },
  colorway: ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"],
};

const AXIS_OVERRIDES = {
  gridcolor: "#e2e8f0",
  zerolinecolor: "#cbd5e1",
  linecolor: "#94a3b8",
  tickfont: { family: FONT.family, size: 11, color: "#64748b" },
  title: { font: { family: FONT.family, size: 12, color: "#475569" } } as any,
  showgrid: true,
  gridwidth: 1,
};

const SCENE_OVERRIDES = {
  xaxis: { ...AXIS_OVERRIDES, backgroundcolor: "rgba(255,255,255,0.95)", showbackground: true },
  yaxis: { ...AXIS_OVERRIDES, backgroundcolor: "rgba(255,255,255,0.95)", showbackground: true },
  zaxis: { ...AXIS_OVERRIDES, backgroundcolor: "rgba(248,250,252,0.95)", showbackground: true },
  camera: { eye: { x: 1.6, y: 1.6, z: 1.0 } },
  bgcolor: "rgba(248,250,252,0.5)",
};

/** Apply theme to a layout object returned from Plotly. */
export function themeLayout(layout: any = {}): any {
  const out: any = {
    ...COMMON_LAYOUT_OVERRIDES,
    ...layout,
    font: { ...FONT, ...(layout.font || {}) },
    title: { ...COMMON_LAYOUT_OVERRIDES.title, ...(typeof layout.title === "string" ? { text: layout.title } : layout.title || {}) },
    margin: { ...COMMON_LAYOUT_OVERRIDES.margin, ...(layout.margin || {}) },
    hoverlabel: { ...COMMON_LAYOUT_OVERRIDES.hoverlabel, ...(layout.hoverlabel || {}) },
    legend: { ...COMMON_LAYOUT_OVERRIDES.legend, ...(layout.legend || {}) },
    colorway: layout.colorway || COMMON_LAYOUT_OVERRIDES.colorway,
    autosize: true,
  };

  // 2D axes
  if (layout.xaxis) out.xaxis = { ...AXIS_OVERRIDES, ...layout.xaxis, title: { ...AXIS_OVERRIDES.title, ...(typeof layout.xaxis.title === "string" ? { text: layout.xaxis.title } : layout.xaxis.title || {}) } };
  if (layout.yaxis) out.yaxis = { ...AXIS_OVERRIDES, ...layout.yaxis, title: { ...AXIS_OVERRIDES.title, ...(typeof layout.yaxis.title === "string" ? { text: layout.yaxis.title } : layout.yaxis.title || {}) } };
  // also handle plots without xaxis/yaxis (axis lookup)
  if (!out.xaxis) out.xaxis = AXIS_OVERRIDES;
  if (!out.yaxis) out.yaxis = AXIS_OVERRIDES;

  // 3D scene
  if (layout.scene) {
    out.scene = {
      ...SCENE_OVERRIDES,
      ...layout.scene,
      xaxis: { ...SCENE_OVERRIDES.xaxis, ...(layout.scene.xaxis || {}), title: { ...SCENE_OVERRIDES.xaxis.title, ...(typeof layout.scene.xaxis?.title === "string" ? { text: layout.scene.xaxis.title } : layout.scene.xaxis?.title || {}) } },
      yaxis: { ...SCENE_OVERRIDES.yaxis, ...(layout.scene.yaxis || {}), title: { ...SCENE_OVERRIDES.yaxis.title, ...(typeof layout.scene.yaxis?.title === "string" ? { text: layout.scene.yaxis.title } : layout.scene.yaxis?.title || {}) } },
      zaxis: { ...SCENE_OVERRIDES.zaxis, ...(layout.scene.zaxis || {}), title: { ...SCENE_OVERRIDES.zaxis.title, ...(typeof layout.scene.zaxis?.title === "string" ? { text: layout.scene.zaxis.title } : layout.scene.zaxis?.title || {}) } },
    };
  }

  return out;
}

/** Apply colour-scale upgrades to traces (contour / surface / scatter). */
export function themeData(data: any[] = []): any[] {
  return data.map((trace) => {
    const t: any = { ...trace };
    // Modern colourscale for contour/surface plots
    if ((t.type === "contour" || t.type === "surface") && !t._themed) {
      // If the user-supplied colorscale is the dim default "Jet", upgrade to Viridis
      if (!t.colorscale || t.colorscale === "Jet") {
        t.colorscale = "Viridis";
      }
      if (t.type === "contour") {
        t.line = { ...(t.line || {}), smoothing: 0.85, width: 0.8 };
        t.contours = { ...(t.contours || {}), coloring: t.contours?.coloring || "heatmap" };
      }
      t._themed = true;
    }
    // Make scatter/line strokes a touch nicer
    if (t.type === "scatter" || t.type === "scatter3d") {
      if (t.line) t.line = { ...t.line, width: t.line.width || 2 };
      if (t.marker) t.marker = { ...t.marker, line: { width: 0.5, color: "rgba(0,0,0,0.15)" } };
    }
    return t;
  });
}
