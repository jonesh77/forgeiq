"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GoDownload } from "react-icons/go";
import { RiScreenshot2Fill } from "react-icons/ri";
import { TbRotate360, TbGrid4X4 } from "react-icons/tb";
import { MdOutlineWbSunny, MdOutlineDarkMode } from "react-icons/md";
import { LuMaximize2 } from "react-icons/lu";
import { useT } from "@/lib/i18n";

/**
 * Professional STL viewer:
 *  - PBR-style material (MeshStandardMaterial with metalness/roughness)
 *  - Multi-light setup (ambient + key + fill + rim + hemisphere)
 *  - Radial gradient background (light theme: slate-100 → slate-300)
 *  - Optional rotating grid floor + soft shadow
 *  - Auto-rotate toggle, wireframe overlay, theme switch, fit view
 *  - Higher resolution rendering (devicePixelRatio aware)
 */
export default function STLViewer({ stlBase64 }: { stlBase64: string }) {
  const { t } = useT();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const wireframeRef = useRef<THREE.LineSegments | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const groundRef = useRef<THREE.Mesh | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);

  const [autoRotate, setAutoRotate] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);

  useEffect(() => {
    if (!stlBase64 || !mountRef.current) return;

    // --- cleanup previous instance ---
    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (mountRef.current.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
    }

    const mountEl = mountRef.current;
    const width = mountEl.clientWidth;
    const height = mountEl.clientHeight;

    // ---- Scene ----
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // ---- Camera ----
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
    cameraRef.current = camera;

    // ---- Renderer (high DPI, soft shadows) ----
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mountEl.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ---- Orbit controls (smooth) ----
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = true;
    controlsRef.current = controls;

    // ---- Lighting rig: ambient + hemisphere + key + fill + rim ----
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x404060, 0.5);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 1.0);
    key.position.set(80, 120, 80);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 600;
    key.shadow.camera.left = -150;
    key.shadow.camera.right = 150;
    key.shadow.camera.top = 150;
    key.shadow.camera.bottom = -150;
    key.shadow.bias = -0.0005;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xcfdfff, 0.4);
    fill.position.set(-80, 40, -60);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xfff0d6, 0.5);
    rim.position.set(0, 60, -120);
    scene.add(rim);

    // ---- Parse STL ----
    const loader = new STLLoader();
    const binary = atob(stlBase64);
    const arrayBuffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);

    const geometry = loader.parse(arrayBuffer);
    geometry.computeVertexNormals();
    geometry.center();

    // ---- Material (brushed steel look) ----
    const material = new THREE.MeshStandardMaterial({
      color: 0xb8c0d0,
      metalness: 0.6,
      roughness: 0.35,
      envMapIntensity: 0.8,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshRef.current = mesh;

    // ---- Wireframe overlay (toggleable) ----
    const wireGeo = new THREE.EdgesGeometry(geometry, 25);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.4 });
    const wireSegments = new THREE.LineSegments(wireGeo, wireMat);
    wireSegments.visible = false;
    mesh.add(wireSegments);
    wireframeRef.current = wireSegments;

    // ---- Compute bounds → place camera / ground ----
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const distance = (maxDim / Math.tan(fov / 2)) * 0.7;

    camera.position.set(distance * 0.7, distance * 0.5, distance * 0.9);
    controls.target.set(0, 0, 0);
    controls.update();

    // ---- Ground plane (shadow catcher) ----
    const groundY = box.min.y - 1;
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(maxDim * 2.5, 64),
      new THREE.ShadowMaterial({ opacity: 0.18 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = groundY;
    ground.receiveShadow = true;
    scene.add(ground);
    groundRef.current = ground;

    // ---- Grid helper ----
    const grid = new THREE.GridHelper(maxDim * 4, 30, 0x94a3b8, 0xcbd5e1);
    grid.position.y = groundY + 0.01;
    (grid.material as THREE.Material & { opacity: number }).opacity = 0.35;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);
    gridRef.current = grid;

    applyTheme(scene, renderer, darkTheme);
    grid.visible = showGrid;

    // ---- Resize ----
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // ---- Loop ----
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (autoRotateRef.current && meshRef.current) {
        meshRef.current.rotation.y += 0.004;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (mountRef.current?.contains(rendererRef.current.domElement)) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stlBase64]);

  // Track autoRotate without re-running the heavy useEffect
  const autoRotateRef = useRef(autoRotate);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);

  // Toggle wireframe
  useEffect(() => {
    if (wireframeRef.current) wireframeRef.current.visible = wireframe;
  }, [wireframe]);

  // Toggle grid
  useEffect(() => {
    if (gridRef.current) gridRef.current.visible = showGrid;
  }, [showGrid]);

  // Toggle theme
  useEffect(() => {
    if (sceneRef.current && rendererRef.current) {
      applyTheme(sceneRef.current, rendererRef.current, darkTheme);
    }
  }, [darkTheme]);

  // ---- Fit view ----
  const fitView = () => {
    if (!meshRef.current || !cameraRef.current || !controlsRef.current) return;
    const box = new THREE.Box3().setFromObject(meshRef.current);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cameraRef.current.fov * (Math.PI / 180);
    const distance = (maxDim / Math.tan(fov / 2)) * 0.7;
    cameraRef.current.position.set(distance * 0.7, distance * 0.5, distance * 0.9);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  // ---- Screenshot ----
  const handleScreenshot = () => {
    if (!rendererRef.current || !cameraRef.current || !sceneRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataUrl = rendererRef.current.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `preform_${Date.now()}.png`;
    link.click();
  };

  // ---- STL Download ----
  const handleDownloadSTL = () => {
    if (!stlBase64) return;
    const binary = atob(stlBase64);
    const arrayBuffer = new ArrayBuffer(binary.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
    const blob = new Blob([arrayBuffer], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "preform.stl";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "600px" }}
      className={
        "relative rounded-2xl overflow-hidden border " +
        (darkTheme
          ? "bg-gradient-to-br from-slate-900 via-slate-950 to-black border-slate-800"
          : "bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 border-slate-300")
      }
    >
      {/* Toolbar */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <ToolButton onClick={handleDownloadSTL} dark={darkTheme} title={t("viewer.dl_stl")}><GoDownload /></ToolButton>
        <ToolButton onClick={handleScreenshot} dark={darkTheme} title={t("viewer.screenshot")}><RiScreenshot2Fill /></ToolButton>
        <Divider dark={darkTheme} />
        <ToolButton onClick={fitView} dark={darkTheme} title={t("viewer.fit_view")}><LuMaximize2 /></ToolButton>
        <ToolButton onClick={() => setAutoRotate((v) => !v)} active={autoRotate} dark={darkTheme} title={t("viewer.auto_rotate")}><TbRotate360 /></ToolButton>
        <ToolButton onClick={() => setShowGrid((v) => !v)} active={showGrid} dark={darkTheme} title={t("viewer.toggle_grid")}><TbGrid4X4 /></ToolButton>
        <ToolButton onClick={() => setWireframe((v) => !v)} active={wireframe} dark={darkTheme} title={t("viewer.wireframe")}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2L8 1L14 2L13 8L14 14L8 15L2 14L3 8L2 2Z M2 2L13 8 M14 2L3 8 M8 1L13 14 M2 14L14 14"
              stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </ToolButton>
        <Divider dark={darkTheme} />
        <ToolButton onClick={() => setDarkTheme((v) => !v)} dark={darkTheme} title={t("viewer.toggle_theme")}>
          {darkTheme ? <MdOutlineWbSunny /> : <MdOutlineDarkMode />}
        </ToolButton>
      </div>

      {/* Bottom hint */}
      <div className={
        "absolute bottom-4 left-4 px-3 py-1.5 rounded-md text-[11px] " +
        (darkTheme ? "bg-slate-800/70 text-slate-300 border border-slate-700" : "bg-white/70 text-slate-600 border border-slate-300")
      }>
        {t("viewer.hint")}
      </div>
    </div>
  );
}

function applyTheme(scene: THREE.Scene, renderer: THREE.WebGLRenderer, dark: boolean) {
  if (dark) {
    scene.background = null;
    scene.fog = new THREE.Fog(0x0f172a, 200, 800);
    renderer.toneMappingExposure = 1.4;
  } else {
    scene.background = null;
    scene.fog = new THREE.Fog(0xe2e8f0, 250, 800);
    renderer.toneMappingExposure = 1.1;
  }
}

function ToolButton({
  children, onClick, title, active = false, dark = false,
}: {
  children: React.ReactNode; onClick: () => void; title: string; active?: boolean; dark?: boolean;
}) {
  const base =
    "cursor-pointer w-9 h-9 rounded-md flex items-center justify-center text-base transition-all backdrop-blur-md border ";
  const cls = dark
    ? (active
        ? "bg-indigo-500/80 border-indigo-400 text-white"
        : "bg-slate-800/60 border-slate-700 text-slate-200 hover:bg-slate-700/70")
    : (active
        ? "bg-indigo-600 border-indigo-500 text-white"
        : "bg-white/85 border-slate-300 text-slate-700 hover:bg-white");
  return (
    <button type="button" onClick={onClick} title={title} className={base + cls}>
      {children}
    </button>
  );
}

function Divider({ dark }: { dark: boolean }) {
  return <div className={"h-px w-full " + (dark ? "bg-slate-700" : "bg-slate-300")}></div>;
}
