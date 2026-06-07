/* ForgeIQ video — male-voice narration (Web Speech) synced to the timeline,
   plus an in-browser screen+audio recorder that downloads the clip. */

/* Narration script — English, timed to the scenes. */
const CUES = [
  { time: 0.9,  text: "ForgeIQ — an A I metallurgy simulation platform." },
  { time: 8.2,  text: "Traditional forging design takes one to two weeks per iteration. Model, mesh, solve, repeat. Slow, and expert only." },
  { time: 19.7, text: "ForgeIQ replaces that slow loop with trained neural surrogates." },
  { time: 24.0, text: "Results in seconds, not weeks." },
  { time: 29.7, text: "One workbench, four programs. Cogging, Processing Map, 3 D Preform, and the Auto Pipeline." },
  { time: 42.6, text: "Predict void closure for every pass, and check each one against your press." },
  { time: 51.5, text: "The Auto Pipeline chains all four surrogates into one closed loop, ending in a graded preform." },
  { time: 57.6, text: "ForgeIQ. Forge smarter. Visit forgeiq dot dev." },
];

/* Pick the best available English male voice. */
function pickMaleVoice() {
  const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  if (!voices.length) return null;
  const en = voices.filter(v => /^en/i.test(v.lang));
  const pool = en.length ? en : voices;
  const malePref = /(david|daniel|alex|fred|arthur|james|george|guy|male|mark|matthew|rishi|aaron|tom)/i;
  return pool.find(v => malePref.test(v.name)) ||
         pool.find(v => /male/i.test(v.name)) ||
         pool.find(v => /UK English/i.test(v.name)) ||
         pool[0];
}

/* Engine: lives inside <Stage>, reads the playhead, speaks each cue once. */
function NarrationEngine() {
  const t = useTime();
  const spoken = React.useRef(new Set());
  const lastT = React.useRef(0);
  const voiceRef = React.useRef(null);

  React.useEffect(() => {
    const load = () => { voiceRef.current = pickMaleVoice(); };
    load();
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = load;
  }, []);

  React.useEffect(() => {
    if (!window.speechSynthesis) return;
    if (!window.__voiceOn) { return; }
    // scrubbed backward → resync (mark earlier cues as already spoken, don't replay)
    if (t < lastT.current - 0.4) {
      window.speechSynthesis.cancel();
      spoken.current = new Set(CUES.map((c, i) => i).filter(i => CUES[i].time <= t));
    }
    lastT.current = t;
    CUES.forEach((c, i) => {
      if (!spoken.current.has(i) && t >= c.time && t < c.time + 0.7) {
        spoken.current.add(i);
        const u = new SpeechSynthesisUtterance(c.text);
        if (voiceRef.current) u.voice = voiceRef.current;
        u.rate = 0.98; u.pitch = 0.92; u.volume = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }
    });
  }, [t]);

  return null;
}

/* Floating controls (rendered OUTSIDE the Stage): voice toggle + recorder. */
function VideoControls() {
  const [voice, setVoice] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [guide, setGuide] = React.useState(false);
  const recRef = React.useRef(null);

  const toggleVoice = () => {
    const next = !voice;
    setVoice(next);
    window.__voiceOn = next;
    if (!next && window.speechSynthesis) window.speechSynthesis.cancel();
    else if (next) {
      // unlock speech with this user gesture
      try { const u = new SpeechSynthesisUtterance(" "); window.speechSynthesis.speak(u); } catch {}
    }
  };

  const resetToStart = () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "0" }));

  const startRecording = async () => {
    if (recording) { recRef.current && recRef.current.stop(); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert("Your browser does not support screen recording. Please use Chrome or Edge.");
      return;
    }
    setGuide(false);
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
    } catch (e) { return; /* user cancelled */ }
    const mime = MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4"
               : MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus"
               : "video/webm";
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
    recRef.current = rec;
    const chunks = [];
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      stream.getTracks().forEach(tr => tr.stop());
      const blob = new Blob(chunks, { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "forgeiq-explainer." + (mime.includes("mp4") ? "mp4" : "webm");
      a.click();
      setRecording(false);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
    // turn voice on, reset to start, then record one full pass (~62.5s)
    if (!voice) toggleVoice();
    window.__voiceOn = true;
    resetToStart();
    setRecording(true);
    rec.start();
    setTimeout(() => { if (rec.state !== "inactive") rec.stop(); }, 63000);
  };

  const wrap = { position: "fixed", top: 14, right: 14, zIndex: 100, display: "flex", gap: 8, fontFamily: "'Public Sans', system-ui, sans-serif" };
  const btn = (active) => ({
    display: "inline-flex", alignItems: "center", gap: 7, height: 38, padding: "0 15px", borderRadius: 10,
    fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid rgba(255,255,255,0.18)",
    background: active ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "rgba(255,255,255,0.08)",
    color: "#fff", backdropFilter: "blur(8px)",
  });
  return (
    <React.Fragment>
      <div style={wrap}>
        <button style={btn(voice)} onClick={toggleVoice} title="Male voice narration">
          {voice ? "🔊" : "🔇"} Voice {voice ? "on" : "off"}
        </button>
        <button style={btn(recording)} onClick={() => recording ? startRecording() : setGuide(true)} title="Download the video as MP4">
          {recording ? "■ Recording…" : "🎬 Download video"}
        </button>
      </div>

      {guide && (
        <div onClick={() => setGuide(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(2,6,23,0.72)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Public Sans', system-ui, sans-serif" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 440, background: "#fff", borderRadius: 18, padding: 28, boxShadow: "0 30px 60px -20px rgba(0,0,0,0.5)" }}>
            <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 22, color: "#0f172a" }}>Download video 🎬</div>
            <div style={{ fontSize: 14, color: "#475569", marginTop: 8, lineHeight: 1.5 }}>Your browser will record this tab with audio. Follow these 3 steps:</div>
            <ol style={{ margin: "16px 0 0", paddingLeft: 20, color: "#334155", fontSize: 14, lineHeight: 1.7 }}>
              <li>In the prompt that opens, choose <b>«This Tab»</b>.</li>
              <li>At the bottom, ✅ <b>enable</b> the <b>«Share tab audio»</b> checkbox (otherwise there will be no sound).</li>
              <li>Click <b>«Share»</b> — the video starts from 0, records for ~62 seconds, and downloads automatically.</li>
            </ol>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 14, lineHeight: 1.5 }}>Note: Chrome/Edge output <code>.webm</code>, Safari outputs <code>.mp4</code>. Convert <code>.webm</code> to MP4 via CloudConvert if needed.</div>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={() => setGuide(false)} style={{ flex: 1, height: 44, borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
              <button onClick={startRecording} style={{ flex: 2, height: 44, borderRadius: 10, border: "none", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Start recording →</button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

Object.assign(window, { NarrationEngine, VideoControls, CUES });
