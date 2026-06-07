/**
 * Material presets shared between the Cogging Pass-Schedule form and the
 * Auto Pipeline (Workflow). Each preset bundles the void-closure polynomial
 * coefficients and the flow-stress model that the backend's
 * `process_pass_schedule` accepts as keyword arguments.
 *
 *   Void closure:  V(ε) = 1 + B·ε + C·ε² + D·ε³
 *   Flow stress:   σ(T) = base + slope · (1200 − T)     [MPa]
 */

export type MaterialPreset = {
  id: "aisi4340" | "aisi1045" | "inconel718" | "custom";
  nameKey: string;
  noteKey: string;
  void_B: number;
  void_C: number;
  void_D: number;
  flow_stress_base_MPa: number;
  flow_stress_slope: number;
};

export const MATERIAL_PRESETS: MaterialPreset[] = [
  {
    id: "aisi4340",
    nameKey: "cog.mat.aisi4340_name",
    noteKey: "cog.mat.aisi4340_note",
    void_B: -1.521351466, void_C: 0.818014592, void_D: -0.145775097,
    flow_stress_base_MPa: 80,  flow_stress_slope: 0.6,
  },
  {
    id: "aisi1045",
    nameKey: "cog.mat.aisi1045_name",
    noteKey: "cog.mat.aisi1045_note",
    void_B: -1.32, void_C: 0.74, void_D: -0.12,
    flow_stress_base_MPa: 70,  flow_stress_slope: 0.55,
  },
  {
    id: "inconel718",
    nameKey: "cog.mat.inconel718_name",
    noteKey: "cog.mat.inconel718_note",
    void_B: -1.80, void_C: 1.05, void_D: -0.20,
    flow_stress_base_MPa: 220, flow_stress_slope: 0.8,
  },
  {
    id: "custom",
    nameKey: "cog.mat.custom_name",
    noteKey: "cog.mat.custom_note",
    void_B: -1.521351466, void_C: 0.818014592, void_D: -0.145775097,
    flow_stress_base_MPa: 80,  flow_stress_slope: 0.6,
  },
];

export const DEFAULT_MATERIAL: MaterialPreset = MATERIAL_PRESETS[0];

export function findPreset(id: string): MaterialPreset {
  return MATERIAL_PRESETS.find((m) => m.id === id) || DEFAULT_MATERIAL;
}
