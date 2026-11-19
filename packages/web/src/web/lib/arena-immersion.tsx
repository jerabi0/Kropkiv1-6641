import { useEffect, useState } from "react";

export const TERRAIN_PRESETS = [
  { id: "neon", name: "Cité néon", background: "#07101c", grid: "#24495a", accent: "#4ff3ff", glow: "rgba(79,243,255,.13)" },
  { id: "volcano", name: "Volcan", background: "#190b08", grid: "#633022", accent: "#ff8a3c", glow: "rgba(255,90,35,.16)" },
  { id: "ice", name: "Banquise", background: "#071724", grid: "#315d76", accent: "#9fe8ff", glow: "rgba(159,232,255,.16)" },
  { id: "storm", name: "Plaine orageuse", background: "#0d0c20", grid: "#3c3769", accent: "#ffe14a", glow: "rgba(181,123,255,.15)" },
  { id: "cavern", name: "Caverne obscure", background: "#10091b", grid: "#443052", accent: "#c79bff", glow: "rgba(199,155,255,.16)" },
  { id: "ocean", name: "Océan", background: "#041522", grid: "#1e5474", accent: "#3fa9ff", glow: "rgba(63,169,255,.16)" },
  { id: "steppe", name: "Steppe", background: "#071910", grid: "#28563d", accent: "#7dffb0", glow: "rgba(125,255,176,.13)" },
  { id: "canyon", name: "Canyon", background: "#171007", grid: "#62452a", accent: "#e0a85e", glow: "rgba(224,168,94,.15)" },
  { id: "sanctuary", name: "Sanctuaire", background: "#171509", grid: "#665b30", accent: "#fff2a8", glow: "rgba(255,242,168,.14)" },
  { id: "jungle", name: "Jungle", background: "#08170c", grid: "#315a2b", accent: "#7ee06a", glow: "rgba(126,224,106,.15)" },
  { id: "cosmos", name: "Cosmos", background: "#08081d", grid: "#34356e", accent: "#9a8cff", glow: "rgba(154,140,255,.18)" },
  { id: "crater", name: "Cratère", background: "#100809", grid: "#53232b", accent: "#ff5262", glow: "rgba(255,42,58,.14)" },
] as const;

export const SEAL_PRESETS = [
  { id: "circle", name: "Cercle" },
  { id: "chains", name: "Chaînes" },
  { id: "barrier", name: "Barrière" },
  { id: "talismans", name: "Talismans" },
  { id: "cube", name: "Cube" },
  { id: "lightning", name: "Éclair" },
  { id: "sakura", name: "Sakura" },
  { id: "web", name: "Toile" },
  { id: "inferno", name: "Enfer" },
  { id: "wave", name: "Vague" },
  { id: "skull", name: "Crâne" },
  { id: "constellation", name: "Constellation" },
] as const;

type TerrainId = (typeof TERRAIN_PRESETS)[number]["id"];
type SealId = (typeof SEAL_PRESETS)[number]["id"];
type Preferences = { terrainId: TerrainId; sealId: SealId; sound: boolean };

const DEFAULTS: Preferences = { terrainId: "neon", sealId: "circle", sound: true };
const STORAGE_KEY = "the-world-arena-preferences";

function readPreferences(): Preferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    return {
      terrainId: TERRAIN_PRESETS.some((item) => item.id === saved?.terrainId) ? saved.terrainId : DEFAULTS.terrainId,
      sealId: SEAL_PRESETS.some((item) => item.id === saved?.sealId) ? saved.sealId : DEFAULTS.sealId,
      sound: typeof saved?.sound === "boolean" ? saved.sound : DEFAULTS.sound,
    };
  } catch {
    return DEFAULTS;
  }
}

export function useArenaImmersion() {
  const [preferences, setPreferences] = useState<Preferences>(readPreferences);
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Preferences remain available for the current session if storage is unavailable.
    }
  }, [preferences]);

  return {
    ...preferences,
    terrain: TERRAIN_PRESETS.find((item) => item.id === preferences.terrainId) ?? TERRAIN_PRESETS[0],
    seal: SEAL_PRESETS.find((item) => item.id === preferences.sealId) ?? SEAL_PRESETS[0],
    setTerrain: (terrainId: TerrainId) => setPreferences((current) => ({ ...current, terrainId })),
    setSeal: (sealId: SealId) => setPreferences((current) => ({ ...current, sealId })),
    setSound: (sound: boolean) => setPreferences((current) => ({ ...current, sound })),
  };
}

export function playCaptureSound(enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const now = context.currentTime;
    [440, 660, 880].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index === 2 ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, now + index * 0.065);
      gain.gain.setValueAtTime(0.0001, now + index * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.075, now + index * 0.065 + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.065 + 0.24);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now + index * 0.065);
      oscillator.stop(now + index * 0.065 + 0.25);
    });
    window.setTimeout(() => void context.close(), 700);
  } catch {
    // Audio is optional; a blocked audio context must never interrupt a move.
  }
}

type ControlsProps = {
  terrainId: TerrainId;
  sealId: SealId;
  sound: boolean;
  setTerrain: (id: TerrainId) => void;
  setSeal: (id: SealId) => void;
  setSound: (enabled: boolean) => void;
};

export function ArenaImmersionControls(props: ControlsProps) {
  return (
    <div className="arena-immersion-controls" aria-label="Ambiance de l'arène">
      <label>
        <span>Terrain</span>
        <select value={props.terrainId} onChange={(event) => props.setTerrain(event.target.value as TerrainId)}>
          {TERRAIN_PRESETS.map((terrain) => <option key={terrain.id} value={terrain.id}>{terrain.name}</option>)}
        </select>
      </label>
      <label>
        <span>Scellement</span>
        <select value={props.sealId} onChange={(event) => props.setSeal(event.target.value as SealId)}>
          {SEAL_PRESETS.map((seal) => <option key={seal.id} value={seal.id}>{seal.name}</option>)}
        </select>
      </label>
      <button type="button" className={props.sound ? "sound-enabled" : ""} aria-pressed={props.sound} onClick={() => props.setSound(!props.sound)}>
        {props.sound ? "Son activé" : "Son désactivé"}
      </button>
    </div>
  );
}
