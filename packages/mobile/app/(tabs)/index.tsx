import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
  useWindowDimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  captured,
  computerMove,
  createGame,
  legal,
  play,
  replay,
  scores,
  type Game,
} from "../../../web/src/web/lib/kropki";

const COLORS = { blue: "#5c8dff", red: "#ff776d", ink: "#f4f6fb", muted: "#9ba8bd", panel: "#151e2c" };
const TERRAIN = [
  { id: "neon", name: "Cité néon", bg: "#07101c", grid: "#24495a", accent: "#4ff3ff" },
  { id: "volcano", name: "Volcan", bg: "#190b08", grid: "#633022", accent: "#ff8a3c" },
  { id: "ice", name: "Banquise", bg: "#071724", grid: "#315d76", accent: "#9fe8ff" },
  { id: "storm", name: "Orage", bg: "#0d0c20", grid: "#3c3769", accent: "#ffe14a" },
  { id: "cavern", name: "Caverne", bg: "#10091b", grid: "#443052", accent: "#c79bff" },
  { id: "ocean", name: "Océan", bg: "#041522", grid: "#1e5474", accent: "#3fa9ff" },
  { id: "steppe", name: "Steppe", bg: "#071910", grid: "#28563d", accent: "#7dffb0" },
  { id: "canyon", name: "Canyon", bg: "#171007", grid: "#62452a", accent: "#e0a85e" },
  { id: "sanctuary", name: "Sanctuaire", bg: "#171509", grid: "#665b30", accent: "#fff2a8" },
  { id: "jungle", name: "Jungle", bg: "#08170c", grid: "#315a2b", accent: "#7ee06a" },
  { id: "cosmos", name: "Cosmos", bg: "#08081d", grid: "#34356e", accent: "#9a8cff" },
  { id: "crater", name: "Cratère", bg: "#100809", grid: "#53232b", accent: "#ff5262" },
] as const;
const SEALS = [
  { id: "circle", name: "Cercle", style: "solid" as const },
  { id: "chains", name: "Chaînes", style: "dashed" as const },
  { id: "barrier", name: "Barrière", style: "solid" as const },
  { id: "talismans", name: "Talismans", style: "dotted" as const },
  { id: "cube", name: "Cube", style: "dashed" as const },
  { id: "lightning", name: "Éclair", style: "dotted" as const },
  { id: "sakura", name: "Sakura", style: "dashed" as const },
  { id: "web", name: "Toile", style: "dotted" as const },
  { id: "inferno", name: "Enfer", style: "dashed" as const },
  { id: "wave", name: "Vague", style: "solid" as const },
  { id: "skull", name: "Crâne", style: "dotted" as const },
  { id: "constellation", name: "Constellation", style: "dotted" as const },
] as const;

type Mode = "computer" | "local";

export default function Index() {
  const { width } = useWindowDimensions();
  const [game, setGame] = useState<Game>(() => createGame(13, 11));
  const [mode, setMode] = useState<Mode>("computer");
  const [level, setLevel] = useState("normal");
  const [terrainId, setTerrainId] = useState<(typeof TERRAIN)[number]["id"]>("neon");
  const [sealId, setSealId] = useState<(typeof SEALS)[number]["id"]>("circle");
  const [haptics, setHaptics] = useState(true);
  const [notice, setNotice] = useState("À toi de jouer. Pose ton premier point.");
  const [captureId, setCaptureId] = useState(0);
  const capturePulse = useRef(new Animated.Value(0)).current;
  const terrain = TERRAIN.find((item) => item.id === terrainId) ?? TERRAIN[0];
  const seal = SEALS.find((item) => item.id === sealId) ?? SEALS[0];
  const score = scores(game);
  const aiTurn = mode === "computer" && game.turn === 2 && !game.ended;
  const cellSize = Math.max(19, Math.min(28, Math.floor((width - 40) / game.w)));

  const commitMove = useCallback((source: Game, x: number, y: number) => {
    const next = play(source, x, y);
    if (next === source) return;
    const newZones = next.zones.filter((zone) => !source.zones.includes(zone));
    if (newZones.length) {
      setCaptureId((value) => value + 1);
      setNotice("Scellement réussi ! Territoire capturé.");
      if (haptics && Platform.OS !== "web") Vibration.vibrate(75);
    } else {
      setNotice("");
    }
    setGame(next);
  }, [haptics]);

  useEffect(() => {
    if (!aiTurn) return;
    const timer = setTimeout(() => {
      const move = computerMove(game, level);
      if (move) commitMove(game, move[0], move[1]);
    }, 480);
    return () => clearTimeout(timer);
  }, [aiTurn, game, level, commitMove]);

  useEffect(() => {
    if (!captureId) return;
    capturePulse.setValue(0);
    Animated.sequence([
      Animated.timing(capturePulse, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(capturePulse, { toValue: 0, duration: 520, useNativeDriver: true }),
    ]).start();
  }, [captureId, capturePulse]);

  function place(x: number, y: number) {
    if (aiTurn || game.ended) return;
    if (!legal(game, x, y)) {
      setNotice("Cette intersection est occupée ou déjà capturée.");
      return;
    }
    commitMove(game, x, y);
  }

  function newGame() {
    setGame(createGame(13, 11));
    setNotice("Nouvelle partie. Les bleus commencent.");
    setCaptureId(0);
  }

  function undo() {
    if (!game.moves.length || aiTurn) return;
    const count = mode === "computer" && game.moves.at(-1)?.player === 2 ? 2 : 1;
    setGame(replay(game.moves.slice(0, -count), game.w, game.h));
    setNotice("Dernier coup annulé.");
  }

  const winner = score[1] === score[2]
    ? "Égalité"
    : score[1] > score[2] ? "Les bleus gagnent" : "Les rouges gagnent";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topline}>
          <View>
            <Text style={styles.kicker}>THE WORLD · ARENA</Text>
            <Text style={styles.title}>Chaque point compte.</Text>
            <Text style={styles.subtitle}>Ferme tes frontières. Capture le territoire.</Text>
          </View>
          <View style={styles.live}><View style={[styles.liveDot, { backgroundColor: game.ended ? "#8792a5" : "#7ee0a1" }]} /><Text style={styles.liveText}>{game.ended ? "FIN" : "EN JEU"}</Text></View>
        </View>

        <View style={styles.modeRow}>
          <Pressable onPress={() => setMode("computer")} style={[styles.modeButton, mode === "computer" && styles.modeActive]}>
            <Text style={[styles.modeText, mode === "computer" && styles.modeTextActive]}>⚔  Contre l'IA</Text>
          </Pressable>
          <Pressable onPress={() => setMode("local")} style={[styles.modeButton, mode === "local" && styles.modeActive]}>
            <Text style={[styles.modeText, mode === "local" && styles.modeTextActive]}>♟  À deux</Text>
          </Pressable>
        </View>

        {mode === "computer" && (
          <View style={styles.levelRow}>
            <Text style={styles.smallLabel}>NIVEAU</Text>
            <Pressable onPress={() => setLevel("easy")} style={[styles.levelChip, level === "easy" && styles.levelActive]}><Text style={styles.levelText}>Découverte</Text></Pressable>
            <Pressable onPress={() => setLevel("normal")} style={[styles.levelChip, level === "normal" && styles.levelActive]}><Text style={styles.levelText}>Tactique</Text></Pressable>
          </View>
        )}

        <View style={styles.scoreRow}>
          <View style={[styles.playerCard, game.turn === 1 && !game.ended && styles.playerActive]}>
            <View style={[styles.playerDot, { backgroundColor: COLORS.blue }]} />
            <View style={styles.playerInfo}><Text style={styles.playerName}>BLEUS</Text><Text style={styles.playerCaption}>Toi</Text></View>
            <Text style={[styles.score, { color: COLORS.blue }]}>{score[1]}</Text>
          </View>
          <Text style={styles.vs}>VS</Text>
          <View style={[styles.playerCard, game.turn === 2 && !game.ended && styles.playerActive]}>
            <View style={[styles.playerDot, { backgroundColor: COLORS.red }]} />
            <View style={styles.playerInfo}><Text style={styles.playerName}>ROUGES</Text><Text style={styles.playerCaption}>{mode === "computer" ? "Ordinateur" : "Joueur 2"}</Text></View>
            <Text style={[styles.score, { color: COLORS.red }]}>{score[2]}</Text>
          </View>
        </View>

        <View style={styles.boardHeader}>
          <Text style={styles.sectionTitle}>PLATEAU · {game.w} × {game.h}</Text>
          <Text style={styles.turnText}>{game.ended ? winner : aiTurn ? "L'IA réfléchit…" : game.turn === 1 ? "À toi de jouer" : "Aux rouges de jouer"}</Text>
        </View>
        <View style={[styles.boardFrame, { backgroundColor: terrain.bg, borderColor: terrain.accent }]}>
          <View style={styles.board}>
            {game.board.map((point, index) => {
              const x = index % game.w;
              const y = Math.floor(index / game.w);
              const owner = game.territory[index];
              const isCaptured = captured(game, index);
              return (
                <Pressable
                  key={index}
                  onPress={() => place(x, y)}
                  disabled={!!point || !!owner || aiTurn || game.ended}
                  accessibilityRole="button"
                  accessibilityLabel={`Intersection ${x + 1}, ${y + 1}${point ? ", occupée" : owner ? ", capturée" : ""}`}
                  style={[
                    styles.cell,
                    { width: cellSize, height: cellSize, borderColor: terrain.grid },
                    owner ? { backgroundColor: owner === 1 ? "rgba(92,141,255,0.19)" : "rgba(255,119,109,0.19)", borderColor: owner === 1 ? COLORS.blue : COLORS.red, borderStyle: seal.style, borderWidth: 1.1 } : null,
                  ]}
                >
                  {point ? <View style={[styles.stone, { backgroundColor: point === 1 ? COLORS.blue : COLORS.red, opacity: isCaptured ? 0.48 : 1 }]} /> : null}
                </Pressable>
              );
            })}
          </View>
          <Animated.View pointerEvents="none" style={[styles.captureFlash, { opacity: capturePulse }]} />
        </View>

        <Text style={styles.boardHint}>Appuie sur une intersection libre pour poser un point.</Text>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <View style={styles.actions}>
          <Pressable onPress={newGame} style={styles.primaryAction}><Text style={styles.primaryActionText}>Nouvelle partie</Text></Pressable>
          <Pressable onPress={undo} disabled={!game.moves.length || aiTurn} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>↶ Annuler</Text></Pressable>
          <Pressable onPress={() => setHaptics((value) => !value)} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>{haptics ? "Vibration ✓" : "Vibration —"}</Text></Pressable>
        </View>

        <View style={styles.customizer}>
          <Text style={styles.customizerTitle}>AMBIANCE DE L'ARÈNE</Text>
          <Text style={styles.customizerLabel}>TERRAINS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {TERRAIN.map((item) => <Pressable key={item.id} onPress={() => setTerrainId(item.id)} style={[styles.chip, terrainId === item.id && { borderColor: item.accent, backgroundColor: item.bg }]}><Text style={[styles.chipText, terrainId === item.id && { color: item.accent }]}>{item.name}</Text></Pressable>)}
          </ScrollView>
          <Text style={styles.customizerLabel}>SCELLEMENTS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {SEALS.map((item) => <Pressable key={item.id} onPress={() => setSealId(item.id)} style={[styles.chip, sealId === item.id && { borderColor: terrain.accent }]}><Text style={[styles.chipText, sealId === item.id && { color: terrain.accent }]}>{item.name}</Text></Pressable>)}
          </ScrollView>
        </View>

        <View style={styles.footer}><Text style={styles.footerTitle}>Sans grimoires. Sans niveaux. La stratégie décide.</Text><Text style={styles.footerCaption}>Les réglages visuels ne changent pas les règles de capture.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b111b" },
  content: { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 35, gap: 14 },
  topline: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  kicker: { color: "#7f9bb8", fontSize: 9, fontWeight: "800", letterSpacing: 1.8 },
  title: { color: COLORS.ink, fontSize: 24, fontWeight: "800", marginTop: 5, letterSpacing: -0.6 },
  subtitle: { color: COLORS.muted, fontSize: 11, marginTop: 5 },
  live: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#172333", borderRadius: 20, paddingHorizontal: 9, paddingVertical: 7 },
  liveDot: { width: 6, height: 6, borderRadius: 4 },
  liveText: { color: "#b7c5d8", fontSize: 8, fontWeight: "800", letterSpacing: 0.7 },
  modeRow: { flexDirection: "row", backgroundColor: "#121c2a", borderRadius: 10, padding: 4, gap: 5 },
  modeButton: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 7 },
  modeActive: { backgroundColor: "#26374b" },
  modeText: { color: "#8495aa", fontSize: 11, fontWeight: "700" },
  modeTextActive: { color: "#edf5ff" },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  smallLabel: { color: "#71849c", fontSize: 8, fontWeight: "800", marginRight: 3 },
  levelChip: { borderWidth: 1, borderColor: "#29384a", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20 },
  levelActive: { backgroundColor: "#24374b", borderColor: "#59789a" },
  levelText: { color: "#bdc9d8", fontSize: 9 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  playerCard: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: "#253247", borderRadius: 9, paddingHorizontal: 9, paddingVertical: 10 },
  playerActive: { borderColor: "#7894b7" },
  playerDot: { width: 8, height: 8, borderRadius: 5 },
  playerInfo: { flex: 1 },
  playerName: { color: "#dce5f1", fontSize: 9, fontWeight: "800", letterSpacing: 0.7 },
  playerCaption: { color: "#8b9bb0", fontSize: 8, marginTop: 3 },
  score: { fontSize: 22, fontWeight: "800" },
  vs: { color: "#65748a", fontSize: 8, fontWeight: "800" },
  boardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 2 },
  sectionTitle: { color: "#a8b8ca", fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  turnText: { color: terrain.accent, fontSize: 9, fontWeight: "700" },
  boardFrame: { alignSelf: "center", borderWidth: 2, borderRadius: 10, padding: 6, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 12, elevation: 5, overflow: "hidden" },
  board: { flexDirection: "row", flexWrap: "wrap", width: cellSize * 13 },
  cell: { alignItems: "center", justifyContent: "center", borderWidth: 0.55, borderRadius: 3 },
  stone: { width: 8, height: 8, borderRadius: 5, borderWidth: 1, borderColor: "#ffffff80" },
  captureFlash: { ...StyleSheet.absoluteFillObject, borderWidth: 3, borderColor: "#ffffff", borderRadius: 7, backgroundColor: "#ffffff12" },
  boardHint: { textAlign: "center", color: "#7e8ea3", fontSize: 9 },
  notice: { textAlign: "center", color: "#c9d8e9", fontSize: 10, fontWeight: "600", marginTop: -5 },
  actions: { flexDirection: "row", gap: 7 },
  primaryAction: { flex: 1.3, alignItems: "center", justifyContent: "center", backgroundColor: "#a8d46d", paddingVertical: 12, borderRadius: 8 },
  primaryActionText: { color: "#15220c", fontSize: 10, fontWeight: "800" },
  secondaryAction: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#1a2737", paddingVertical: 12, borderRadius: 8 },
  secondaryActionText: { color: "#c0cddd", fontSize: 9, fontWeight: "700" },
  customizer: { backgroundColor: "#121b28", borderWidth: 1, borderColor: "#243247", borderRadius: 10, paddingVertical: 13, gap: 10 },
  customizerTitle: { color: "#dfe8f3", fontSize: 10, fontWeight: "800", letterSpacing: 1, paddingHorizontal: 12 },
  customizerLabel: { color: "#8294aa", fontSize: 8, fontWeight: "800", letterSpacing: 1, paddingHorizontal: 12, marginTop: 2 },
  chips: { paddingHorizontal: 12, gap: 7 },
  chip: { borderWidth: 1, borderColor: "#2b3a4d", backgroundColor: "#182435", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20 },
  chipText: { color: "#aab8c9", fontSize: 9, fontWeight: "600" },
  footer: { alignItems: "center", gap: 4, paddingTop: 6 },
  footerTitle: { color: "#a9bbd0", fontSize: 9, fontWeight: "700", textAlign: "center" },
  footerCaption: { color: "#708198", fontSize: 8, textAlign: "center" },
});
