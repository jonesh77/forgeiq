/* ForgeIQ explainer — the seven scenes. 1280×720. Technical lab vibe.
   Everything reads the GLOBAL playhead via useTime() and tweens with animate(). */

const A = (t, from, to, s, e, ease = Easing.easeOutCubic) => animate({ from, to, start: s, end: e, ease })(t);
const fadeUp = (t, s, e = s + 0.5) => ({ opacity: A(t, 0, 1, s, e), transform: `translateY(${A(t, 18, 0, s, e)}px)` });

/* Scene wrapper: paints full-frame bg + crossfades at its edges. */
function Scene({ start, end, bg, children }) {
  const t = useTime();
  if (t < start - 0.6 || t > end + 0.6) return null;
  const op = Math.min(clamp((t - start) / 0.5, 0, 1), clamp((end - t) / 0.5, 0, 1));
  return <div style={{ position: "absolute", inset: 0, opacity: op, background: bg, overflow: "hidden" }}>{children}</div>;
}

/* ───────────── SCENE 1 — BRAND TITLE (0–7.5) ───────────── */
function SceneTitle() {
  const t = useTime();
  const wm = A(t, 0.85, 1, 1.0, 2.0, Easing.easeOutBack);
  return (
    <Scene start={0} end={7.5} bg={V.heroGrad}>
      <GridBG color="rgba(255,255,255,0.05)" size={52} opacity={A(t, 0, 0.6, 0.2, 2)} drift={Math.sin(t * 0.4) * 6} />
      <Blob x={-140 + Math.sin(t * 0.5) * 30} y={120 + Math.cos(t * 0.4) * 20} color="rgba(99,102,241,0.28)" size={520} />
      <Blob x={840 + Math.cos(t * 0.45) * 30} y={300 + Math.sin(t * 0.5) * 24} color="rgba(139,92,246,0.22)" size={520} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ ...fadeUp(t, 0.5), marginBottom: 28 }}>
          <Pill bg="rgba(255,255,255,0.1)" color={V.indigo300} border="1px solid rgba(255,255,255,0.2)">
            <VIcon name="sparkles" size={15} color={V.amber} /> AI Metallurgy Platform
          </Pill>
        </div>
        <div style={{ transform: `scale(${wm})`, opacity: A(t, 0, 1, 1.0, 1.6) }}>
          <Wordmark size={132} dark />
        </div>
        <div style={{ ...fadeUp(t, 2.3), marginTop: 26, fontFamily: V.display, fontWeight: 600, fontSize: 30, color: V.slate300, letterSpacing: "-0.01em" }}>
          Design forgings, <span style={{ color: "#fff" }}>not meshes.</span>
        </div>
        <div style={{ ...fadeUp(t, 3.1), marginTop: 22, fontFamily: V.body, fontSize: 16, color: V.slate500, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          by NSMLab · Sogang University
        </div>
      </div>
    </Scene>
  );
}

/* ───────────── SCENE 2 — THE PROBLEM (7.5–19) ───────────── */
const FEM_STEPS = [["Model", "box"], ["Mesh", "grid-3x3"], ["Solve", "cpu"], ["Iterate", "refresh-cw"]];
function SceneProblem() {
  const t = useTime();
  const day = Math.floor(A(t, 1, 14, 11.2, 16.5, Easing.linear));
  const prog = A(t, 0.04, 0.92, 11.2, 16.8, Easing.linear);
  const activeStep = Math.floor(A(t, 0, 3.99, 11, 16.5, Easing.linear));
  return (
    <Scene start={7.5} end={19} bg={`linear-gradient(180deg, ${V.slate50}, ${V.slate100})`}>
      <div style={{ position: "absolute", left: 96, top: 150, width: 470 }}>
        <div style={{ ...fadeUp(t, 8.0), fontFamily: V.body, fontWeight: 700, fontSize: 16, letterSpacing: "0.16em", textTransform: "uppercase", color: V.slate400 }}>The old way</div>
        <div style={{ ...fadeUp(t, 8.3), marginTop: 16, fontFamily: V.display, fontWeight: 700, fontSize: 56, lineHeight: 1.05, letterSpacing: "-0.02em", color: V.slate900 }}>
          1–2 weeks<br /><span style={{ color: V.slate500 }}>per forging<br />iteration.</span>
        </div>
        <div style={{ ...fadeUp(t, 9.2), marginTop: 26, fontFamily: V.body, fontSize: 20, lineHeight: 1.55, color: V.slate600, maxWidth: 420 }}>
          Build a finite-element model, mesh it, solve, post-process, repeat. The inner loop is slow — and expert-only.
        </div>
      </div>
      {/* FEM loop card */}
      <div style={{ position: "absolute", right: 96, top: 168, width: 470, ...fadeUp(t, 9.0) }}>
        <div style={{ background: "#fff", border: `1px solid ${V.slate200}`, borderRadius: 24, boxShadow: "0 25px 50px -18px rgba(2,6,23,0.18)", padding: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: V.mono, fontSize: 13, color: V.slate400 }}>
            <VIcon name="clock" size={16} color={V.slate400} /> deform.run · day {day} / 14
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", margin: "28px 0 8px" }}>
            {FEM_STEPS.map(([label, icon], i) => {
              const on = i <= activeStep;
              return (
                <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: 92, opacity: on ? 1 : 0.4, transition: "opacity .3s" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: on ? V.slate900 : V.slate100, color: on ? "#fff" : V.slate400, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <VIcon name={icon} size={24} color={on ? "#fff" : V.slate400} />
                  </div>
                  <div style={{ fontFamily: V.body, fontSize: 14, fontWeight: 600, color: on ? V.slate800 : V.slate400 }}>{label}</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 22, height: 10, borderRadius: 6, background: V.slate100, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${prog * 100}%`, background: `linear-gradient(90deg, ${V.slate400}, ${V.slate600})`, borderRadius: 6 }} />
          </div>
          <div style={{ marginTop: 12, fontFamily: V.mono, fontSize: 13, color: V.slate500, textAlign: "right" }}>solving… {(prog * 100).toFixed(0)}%</div>
        </div>
      </div>
    </Scene>
  );
}

/* ───────────── SCENE 3 — THE SOLUTION (19–29) ───────────── */
function NeuralNet({ t, x, y }) {
  const layers = [4, 6, 6, 3];
  const colW = 120, rowH = 64;
  const nodes = [];
  layers.forEach((cnt, li) => {
    for (let i = 0; i < cnt; i++) {
      const cx = x + li * colW;
      const cy = y + (i - (cnt - 1) / 2) * rowH;
      nodes.push({ li, i, cx, cy });
    }
  });
  const lines = [];
  for (let li = 0; li < layers.length - 1; li++) {
    for (let a = 0; a < layers[li]; a++) for (let b = 0; b < layers[li + 1]; b++) {
      const n1 = nodes.find(n => n.li === li && n.i === a), n2 = nodes.find(n => n.li === li + 1 && n.i === b);
      lines.push({ x1: n1.cx, y1: n1.cy, x2: n2.cx, y2: n2.cy, li });
    }
  }
  return (
    <svg width="520" height="360" viewBox={`${x - 30} ${y - 180} 520 360`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {lines.map((l, k) => {
        const on = A(t, 0, 1, 21.3 + l.li * 0.4, 22.0 + l.li * 0.4);
        return <line key={k} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={V.indigo500} strokeWidth="1" opacity={0.12 + on * 0.25} />;
      })}
      {nodes.map((n, k) => {
        const pop = A(t, 0, 1, 21.0 + n.li * 0.4, 21.5 + n.li * 0.4, Easing.easeOutBack);
        const pulse = 1 + Math.sin(t * 3 + n.li + n.i) * 0.12 * clamp(pop, 0, 1);
        return <circle key={k} cx={n.cx} cy={n.cy} r={7 * pop * pulse} fill="#fff" stroke={V.indigo400} strokeWidth="2" opacity={pop} />;
      })}
    </svg>
  );
}
function SceneSolution() {
  const t = useTime();
  const secs = Math.floor(A(t, 60, 3, 24.6, 27.0, Easing.easeOutCubic));
  return (
    <Scene start={19} end={29} bg={V.heroGrad}>
      <GridBG color="rgba(99,102,241,0.07)" size={44} drift={Math.sin(t * 0.4) * 5} />
      <Blob x={700} y={-120} color="rgba(99,102,241,0.22)" size={480} />
      <div style={{ position: "absolute", left: 96, top: 150, width: 560 }}>
        <div style={{ ...fadeUp(t, 19.4) }}>
          <Pill bg="rgba(99,102,241,0.18)" color={V.indigo300} border="1px solid rgba(129,140,248,0.3)">
            <span style={{ width: 7, height: 7, borderRadius: 9, background: V.indigo400, display: "inline-block" }} /> The ForgeIQ way
          </Pill>
        </div>
        <div style={{ ...fadeUp(t, 19.8), marginTop: 22, fontFamily: V.display, fontWeight: 700, fontSize: 56, lineHeight: 1.05, letterSpacing: "-0.02em", color: "#fff" }}>
          Trained neural<br />surrogates.
        </div>
        <div style={{ ...fadeUp(t, 23.0), marginTop: 30, display: "flex", alignItems: "baseline", gap: 18 }}>
          <span style={{ fontFamily: V.display, fontWeight: 800, fontSize: 96, lineHeight: 1, color: V.indigo300, letterSpacing: "-0.03em" }}>{secs}s</span>
          <span style={{ fontFamily: V.body, fontSize: 22, color: V.slate400 }}>per run, not weeks.</span>
        </div>
        <div style={{ ...fadeUp(t, 24.0), marginTop: 18, fontFamily: V.body, fontSize: 20, color: V.slate400, maxWidth: 480, lineHeight: 1.5 }}>
          Physics-informed models return results in seconds — explore the whole design space in one session.
        </div>
      </div>
      <div style={{ position: "absolute", right: 70, top: 360 }}>
        <NeuralNet t={t} x={760} y={360} />
      </div>
    </Scene>
  );
}

/* ───────────── SCENE 4 — FOUR PROGRAMS (29–42) ───────────── */
const PROG_CARDS = [
  { title: "Cogging", icon: "hammer", grad: `linear-gradient(135deg,${V.cog},${V.indigo600})`, tint: V.cog50, ring: V.cog, desc: "Void-closure surrogates for open-die forging." },
  { title: "Processing Map", icon: "map", grad: `linear-gradient(135deg,${V.pmap},#0d9488)`, tint: V.pmap50, ring: V.pmap, desc: "η / ξ heatmaps reveal the safe window." },
  { title: "3D Preform", icon: "box", grad: `linear-gradient(135deg,${V.pre},${V.fuchsia})`, tint: V.pre50, ring: V.pre, desc: "Voxel → watertight STL, graded A–D." },
  { title: "Auto Pipeline", icon: "workflow", grad: `linear-gradient(135deg,${V.indigo600},${V.violet600})`, tint: V.indigo50, ring: V.indigo600, desc: "All four stages, one closed loop." },
];
function ScenePrograms() {
  const t = useTime();
  return (
    <Scene start={29} end={42} bg={`linear-gradient(180deg, ${V.white}, ${V.slate50})`}>
      <div style={{ position: "absolute", top: 78, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ ...fadeUp(t, 29.4), fontFamily: V.body, fontWeight: 700, fontSize: 16, letterSpacing: "0.16em", textTransform: "uppercase", color: V.indigo600 }}>The workbench</div>
        <div style={{ ...fadeUp(t, 29.7), marginTop: 12, fontFamily: V.display, fontWeight: 700, fontSize: 50, letterSpacing: "-0.02em", color: V.slate900 }}>
          One workbench. Four programs.
        </div>
      </div>
      <div style={{ position: "absolute", top: 232, left: 96, right: 96, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 26 }}>
        {PROG_CARDS.map((c, i) => {
          const s = 30.4 + i * 0.45;
          const op = A(t, 0, 1, s, s + 0.5);
          const ty = A(t, 26, 0, s, s + 0.5);
          const glow = 0.5 + 0.5 * Math.sin(t * 2 + i);
          return (
            <div key={c.title} style={{ opacity: op, transform: `translateY(${ty}px)`, background: "#fff", border: `1px solid ${V.slate200}`, borderRadius: 22, padding: "26px 30px", display: "flex", alignItems: "center", gap: 24, boxShadow: `0 14px 30px -16px ${c.ring}${Math.round(glow * 80).toString(16).padStart(2, "0")}` }}>
              <div style={{ flexShrink: 0, width: 72, height: 72, borderRadius: 18, background: c.grad, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 20px -6px ${c.ring}88` }}>
                <VIcon name={c.icon} size={34} color="#fff" stroke={2} />
              </div>
              <div>
                <div style={{ display: "inline-block", fontFamily: V.body, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: c.ring, background: c.tint, padding: "3px 9px", borderRadius: 999 }}>0{i + 1}</div>
                <div style={{ fontFamily: V.display, fontWeight: 700, fontSize: 27, color: V.slate900, marginTop: 7 }}>{c.title}</div>
                <div style={{ fontFamily: V.body, fontSize: 16, color: V.slate600, marginTop: 4 }}>{c.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Scene>
  );
}

/* ───────────── SCENE 5 — DEMO: VOID CLOSURE (42–51) ───────────── */
function SceneDemo() {
  const t = useTime();
  const voids = [12.4, 9.8, 7.1, 5.3, 3.9, 2.8, 2.1];
  const W = 760, H = 300, padL = 54, padR = 30, padT = 24, padB = 50;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const maxV = 14;
  const xs = voids.map((_, i) => padL + (i / (voids.length - 1)) * plotW);
  const ys = voids.map(v => padT + (1 - v / maxV) * plotH);
  const line = xs.map((x, i) => (i ? "L" : "M") + x.toFixed(1) + " " + ys[i].toFixed(1)).join(" ");
  const area = line + ` L${xs[xs.length - 1]} ${padT + plotH} L${xs[0]} ${padT + plotH} Z`;
  const draw = A(t, 1, 0, 43.2, 46.4, Easing.easeInOutCubic); // dashoffset fraction 1→0
  const scale = A(t, 0.97, 1, 42, 43, Easing.easeOutCubic);
  return (
    <Scene start={42} end={51} bg={`linear-gradient(180deg, ${V.slate50}, ${V.slate100})`}>
      <div style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ ...fadeUp(t, 42.2), fontFamily: V.body, fontWeight: 700, fontSize: 15, letterSpacing: "0.16em", textTransform: "uppercase", color: V.cog }}>Cogging · live demo</div>
        <div style={{ ...fadeUp(t, 42.45), marginTop: 10, fontFamily: V.display, fontWeight: 700, fontSize: 44, letterSpacing: "-0.02em", color: V.slate900 }}>
          Void closure, predicted per pass
        </div>
      </div>
      <div style={{ position: "absolute", top: 200, left: "50%", transform: `translateX(-50%) scale(${scale})`, width: 880, background: "#fff", border: `1px solid ${V.slate200}`, borderRadius: 24, boxShadow: "0 30px 60px -24px rgba(37,99,235,0.25)", padding: 28, ...fadeUp(t, 42.4) }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
          <defs>
            <linearGradient id="vArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={V.cog500} stopOpacity="0.3" /><stop offset="100%" stopColor={V.indigo500} stopOpacity="0" /></linearGradient>
            <linearGradient id="vLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={V.cog} /><stop offset="100%" stopColor={V.indigo600} /></linearGradient>
          </defs>
          {[0, 0.5, 1].map((g, i) => {
            const y = padT + g * plotH;
            return <g key={i}><line x1={padL} y1={y} x2={W - padR} y2={y} stroke={V.slate200} strokeWidth="1" strokeDasharray="3 5" /><text x={padL - 10} y={y + 4} textAnchor="end" style={{ fontFamily: V.mono, fontSize: 12, fill: V.slate400 }}>{(maxV * (1 - g)).toFixed(0)}</text></g>;
          })}
          <path d={area} fill="url(#vArea)" opacity={A(t, 0, 1, 43.5, 46)} />
          <path d={line} fill="none" stroke="url(#vLine)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" style={{ strokeDasharray: 1600, strokeDashoffset: draw * 1600 }} />
          {xs.map((x, i) => {
            const on = A(t, 0, 1, 43.5 + i * 0.32, 43.9 + i * 0.32, Easing.easeOutBack);
            return <g key={i} opacity={on}>
              <circle cx={x} cy={ys[i]} r={6 * on} fill="#fff" stroke={V.indigo600} strokeWidth="3" />
              <text x={x} y={H - 16} textAnchor="middle" style={{ fontFamily: V.mono, fontSize: 13, fill: V.slate500 }}>P{i + 1}</text>
            </g>;
          })}
        </svg>
        {/* feasibility chips */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 14 }}>
          {voids.map((v, i) => {
            const on = A(t, 0, 1, 46.3 + i * 0.18, 46.7 + i * 0.18, Easing.easeOutBack);
            return <div key={i} style={{ flex: 1, opacity: on, transform: `scale(${on})`, background: V.ok50, border: `1px solid ${V.ok100}`, borderRadius: 10, padding: "8px 4px", textAlign: "center" }}>
              <div style={{ fontFamily: V.body, fontSize: 10, fontWeight: 700, color: V.slate500 }}>P{i + 1}</div>
              <div style={{ fontFamily: V.display, fontWeight: 700, fontSize: 16, color: V.ok }}>{v}%</div>
            </div>;
          })}
        </div>
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, opacity: A(t, 0, 1, 48.2, 48.8), fontFamily: V.body, fontSize: 18, color: V.slate700 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: V.ok, fontWeight: 700 }}><VIcon name="check" size={20} color={V.ok} /> All passes feasible</span>
          <span style={{ color: V.slate300 }}>·</span>
          <span>min void <b style={{ color: V.slate900 }}>2.1%</b></span>
        </div>
      </div>
    </Scene>
  );
}

/* ───────────── SCENE 6 — AUTO PIPELINE (51–57) ───────────── */
function ScenePipeline() {
  const t = useTime();
  const nodes = [{ x: 360, y: 250, label: "Processing Map", icon: "map" }, { x: 920, y: 250, label: "Pass Schedule", icon: "hammer" }, { x: 920, y: 470, label: "3D Preform", icon: "box" }, { x: 360, y: 470, label: "Correction", icon: "refresh-cw" }];
  const order = [0, 1, 2, 3];
  const loopPos = (A(t, 0, 4, 52.4, 56.2, Easing.linear)) % 4;
  return (
    <Scene start={51} end={57} bg={V.heroGrad}>
      <GridBG color="rgba(99,102,241,0.06)" size={44} drift={Math.sin(t * 0.4) * 5} />
      <div style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ ...fadeUp(t, 51.2), fontFamily: V.body, fontWeight: 700, fontSize: 15, letterSpacing: "0.16em", textTransform: "uppercase", color: V.indigo300 }}>Auto Pipeline</div>
        <div style={{ ...fadeUp(t, 51.45), marginTop: 10, fontFamily: V.display, fontWeight: 700, fontSize: 46, letterSpacing: "-0.02em", color: "#fff" }}>
          One click. Four surrogates. <span style={{ color: V.indigo300 }}>A finished preform.</span>
        </div>
      </div>
      <svg width="1280" height="720" style={{ position: "absolute", inset: 0 }}>
        {/* loop connectors */}
        {order.map((from, k) => {
          const a = nodes[from], b = nodes[order[(k + 1) % 4]];
          const lit = A(t, 0, 1, 51.8 + k * 0.25, 52.2 + k * 0.25);
          return <line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={V.indigo500} strokeWidth="2" opacity={0.2 + lit * 0.4} strokeDasharray="6 8" />;
        })}
      </svg>
      {nodes.map((n, i) => {
        const pop = A(t, 0, 1, 51.6 + i * 0.22, 52.1 + i * 0.22, Easing.easeOutBack);
        const active = Math.floor(loopPos) === i && t > 52.4;
        return <div key={i} style={{ position: "absolute", left: n.x - 92, top: n.y - 42, width: 184, opacity: pop, transform: `scale(${pop})` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: active ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.06)", border: `1px solid ${active ? V.indigo400 : "rgba(255,255,255,0.14)"}`, borderRadius: 16, padding: "14px 16px", boxShadow: active ? `0 0 30px -4px ${V.indigo500}` : "none", transition: "background .2s, box-shadow .2s, border-color .2s" }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: active ? V.indigo500 : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <VIcon name={n.icon} size={20} color="#fff" />
            </div>
            <div style={{ fontFamily: V.body, fontSize: 16, fontWeight: 600, color: "#fff" }}>{n.label}</div>
          </div>
        </div>;
      })}
      {/* center badge */}
      <div style={{ position: "absolute", left: "50%", top: 360, transform: "translate(-50%,-50%)", opacity: A(t, 0, 1, 53.2, 53.8) }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <VIcon name="refresh-cw" size={34} color={V.indigo300} />
          <div style={{ fontFamily: V.mono, fontSize: 14, color: V.slate400 }}>iterate → grade A</div>
        </div>
      </div>
    </Scene>
  );
}

/* ───────────── SCENE 7 — CTA (57–62) ───────────── */
function SceneCTA() {
  const t = useTime();
  const wm = A(t, 0.9, 1, 57.2, 58.0, Easing.easeOutBack);
  return (
    <Scene start={57} end={62} bg={V.heroGrad}>
      <GridBG color="rgba(255,255,255,0.05)" size={52} opacity={0.6} drift={Math.sin(t * 0.4) * 6} />
      <Blob x={-120} y={380} color="rgba(99,102,241,0.25)" size={500} />
      <Blob x={860} y={-120} color="rgba(139,92,246,0.22)" size={500} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ transform: `scale(${wm})`, opacity: A(t, 0, 1, 57.2, 57.8) }}><Wordmark size={104} dark /></div>
        <div style={{ ...fadeUp(t, 58.1), marginTop: 22, fontFamily: V.display, fontWeight: 600, fontSize: 34, color: V.slate300 }}>
          Forge <span style={{ color: "#fff" }}>smarter.</span>
        </div>
        <div style={{ ...fadeUp(t, 58.7), marginTop: 34 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 28px", borderRadius: 999, background: "#fff", color: V.slate900, fontFamily: V.body, fontWeight: 700, fontSize: 20 }}>
            <VIcon name="arrow-right" size={20} color={V.indigo600} /> forgeiq.dev
          </span>
        </div>
        <div style={{ ...fadeUp(t, 59.3), marginTop: 30, fontFamily: V.body, fontSize: 15, color: V.slate500, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          NSMLab · Net Shape Manufacturing Laboratory
        </div>
      </div>
    </Scene>
  );
}

function ForgeIQVideo() {
  return (
    <Stage width={1280} height={720} duration={62} background={V.navy} persistKey="forgeiq-video">
      <ClockLabel />
      <NarrationEngine />
      <SceneTitle />
      <SceneProblem />
      <SceneSolution />
      <ScenePrograms />
      <SceneDemo />
      <ScenePipeline />
      <SceneCTA />
    </Stage>
  );
}

Object.assign(window, { ForgeIQVideo });
