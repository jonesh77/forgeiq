/* ForgeIQ explainer video — shared atoms (icons, backgrounds, brand bits).
   Hardcoded brand hex so the video is self-contained. */

const V = {
  navy: "#020617", slate900: "#0f172a", slate800: "#1e293b", slate700: "#334155",
  slate600: "#475569", slate500: "#64748b", slate400: "#94a3b8", slate300: "#cbd5e1",
  slate200: "#e2e8f0", slate100: "#f1f5f9", slate50: "#f8fafc", white: "#ffffff",
  indigo700: "#4338ca", indigo600: "#4f46e5", indigo500: "#6366f1", indigo400: "#818cf8",
  indigo300: "#a5b4fc", indigo100: "#e0e7ff", indigo50: "#eef2ff",
  violet600: "#7c3aed", violet500: "#8b5cf6", fuchsia: "#c026d3",
  cog: "#2563eb", cog500: "#3b82f6", cog100: "#dbeafe", cog50: "#eff6ff",
  pmap: "#059669", pmap500: "#10b981", pmap100: "#d1fae5", pmap50: "#ecfdf5",
  pre: "#7c3aed", pre500: "#8b5cf6", pre100: "#ede9fe", pre50: "#faf5ff",
  amber: "#f59e0b", ok: "#059669", ok100: "#d1fae5", ok50: "#ecfdf5",
  warn: "#d97706", warn100: "#fef3c7", warn50: "#fffbeb", bad: "#dc2626",
  heroGrad: "linear-gradient(135deg,#020617,#0f172a 45%,#1e1b4b)",
  display: "'Montserrat', system-ui, sans-serif",
  body: "'Public Sans', system-ui, sans-serif",
  mono: "'Public Sans', ui-monospace, monospace",
};

/* Lucide icon, injected ONCE (memoised) so Stage's per-frame re-renders
   don't thrash. Props are primitive → effect runs only when they change. */
const VIcon = React.memo(function VIcon({ name, size = 24, color = "#fff", stroke = 2 }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && window.lucide) {
      ref.current.innerHTML = "";
      const i = document.createElement("i");
      i.setAttribute("data-lucide", name);
      ref.current.appendChild(i);
      window.lucide.createIcons({ attrs: { width: size, height: size, "stroke-width": stroke, stroke: color } });
    }
  }, [name, size, color, stroke]);
  return <span ref={ref} style={{ display: "inline-flex", lineHeight: 0, color }} />;
});

/* Full-frame animated blueprint grid (dark scenes). */
function GridBG({ color = "rgba(255,255,255,0.05)", size = 48, opacity = 1, drift = 0 }) {
  return (
    <div style={{
      position: "absolute", inset: -2, opacity,
      backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
      backgroundSize: `${size}px ${size}px`,
      transform: `translate(${drift}px, ${drift}px)`,
    }} />
  );
}

/* Drifting blurred color blob. */
function Blob({ x, y, size = 460, color, blur = 80 }) {
  return <div style={{ position: "absolute", left: x, top: y, width: size, height: size, borderRadius: "50%", background: color, filter: `blur(${blur}px)`, pointerEvents: "none" }} />;
}

/* ForgeIQ wordmark. */
function Wordmark({ size = 64, dark = false }) {
  return (
    <span style={{ fontFamily: V.display, fontWeight: 800, fontSize: size, letterSpacing: "-0.02em", color: dark ? "#fff" : V.slate900, lineHeight: 1 }}>
      Forge<span style={{ color: dark ? V.indigo300 : V.indigo600 }}>IQ</span>
    </span>
  );
}

/* Pill badge. */
function Pill({ children, bg, color, border }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px", borderRadius: 999, background: bg, color, border: border || "none", fontFamily: V.body, fontSize: 15, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

/* timestamp label updater — writes current second to root data-screen-label. */
function ClockLabel() {
  const t = useTime();
  React.useEffect(() => {
    const root = document.getElementById("video-root");
    if (root) root.setAttribute("data-screen-label", "t=" + t.toFixed(1) + "s");
  }, [Math.floor(t)]);
  return null;
}

Object.assign(window, { V, VIcon, GridBG, Blob, Wordmark, Pill, ClockLabel });
