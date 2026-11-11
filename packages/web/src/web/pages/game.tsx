import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Undo2,
  CircleHelp,
  X,
  Users,
  Monitor,
  Flag,
  Check,
  ChevronDown,
  Grid2X2,
  Bot,
  UserRound,
  ChevronRight,
  ShieldCheck,
  History,
  Lightbulb,
  Target,
  Swords,
  HardDrive,
} from "lucide-react";
import {
  createGame,
  play,
  replay,
  scores,
  captured,
  legal,
  computerMove,
  type Game,
} from "../lib/kropki";
const colors = ["", "#406be1", "#e46a58"];
function initial() {
  try {
    const s = JSON.parse(localStorage.getItem("kropki-v1") || "null");
    if (s?.game?.moves && [13, 17, 21].includes(s.game.w))
      return { ...s, game: { ...replay(s.game.moves, s.game.w, s.game.h), ended: !!s.game.ended } };
  } catch {}
  return { game: createGame(), mode: "computer", level: "normal" };
}
function Emblem({ small = false }: { small?: boolean }) {
  return (
    <svg viewBox="0 0 210 165" aria-hidden="true" className={small ? "emblem-small" : "emblem"}>
      <defs>
        <pattern id="mini-grid" width="26" height="26" patternUnits="userSpaceOnUse">
          <path d="M26 0H0V26" fill="none" stroke="#d8d9d4" strokeWidth=".8" />
        </pattern>
      </defs>
      <rect x="1" y="1" width="208" height="163" fill="url(#mini-grid)" />
      <path
        d="M53 79L79 27L131 27L157 79L131 131L79 131Z"
        fill="#406be1"
        fillOpacity=".09"
        stroke="#406be1"
        strokeWidth="1.8"
      />
      {[
        [53, 79],
        [79, 27],
        [105, 27],
        [131, 27],
        [157, 79],
        [144, 53],
        [144, 105],
        [131, 131],
        [105, 131],
        [79, 131],
        [66, 105],
        [66, 53],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill={colors[1]} />
      ))}
      {[
        [105, 79],
        [105, 105],
        [131, 79],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill={colors[2]} />
      ))}
      <circle cx="183" cy="131" r="4" fill={colors[2]} />
    </svg>
  );
}
export default function GamePage() {
  const [stored] = useState(initial);
  const [game, setGame] = useState<Game>(stored.game);
  const [mode, setMode] = useState<string>(stored.mode);
  const [level, setLevel] = useState(stored.level);
  const [modal, setModal] = useState<"rules" | "new" | "end" | null>(null);
  const [newMode, setNewMode] = useState(mode);
  const [size, setSize] = useState(game.w);
  const [newLevel, setNewLevel] = useState(level);
  const [hover, setHover] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [panel, setPanel] = useState<"play" | "history">("play");
  const dialog = useRef<HTMLDialogElement>(null);
  const score = scores(game);
  const last = game.moves.at(-1);
  const ai = mode === "computer" && game.turn === 2 && !game.ended;
  useEffect(() => {
    try {
      localStorage.setItem("kropki-v1", JSON.stringify({ game, mode, level }));
    } catch {}
  }, [game, mode, level]);
  useEffect(() => {
    if (!ai) {
      return;
    }
    const t = setTimeout(() => {
      const m = computerMove(game, level);
      if (m) setGame(play(game, ...m));
    }, 420);
    return () => clearTimeout(t);
  }, [game, ai, level]);
  useEffect(() => {
    if (modal) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal]);
  function move(x: number, y: number) {
    if (ai || game.ended) return;
    if (!legal(game, x, y)) {
      setNotice("Cette intersection est déjà occupée ou capturée.");
      return;
    }
    const n = play(game, x, y);
    const next = scores(n);
    setNotice(
      next[1] !== score[1] || next[2] !== score[2]
        ? "Un territoire vient de changer de mains."
        : "",
    );
    setGame(n);
  }
  function undo() {
    if (!game.moves.length) return;
    let count = 1;
    if (mode === "computer" && game.moves.at(-1)?.player === 2) count = 2;
    setGame(replay(game.moves.slice(0, -count), game.w, game.h));
    setNotice("Dernier coup annulé.");
  }
  function start() {
    setMode(newMode);
    setLevel(newLevel);
    setGame(createGame(size, size === 13 ? 11 : size === 21 ? 17 : 13));
    setModal(null);
    setNotice("Nouvelle partie. À toi de poser le premier point.");
  }
  const spacing = 32,
    pad = 26,
    vw = (game.w - 1) * spacing + pad * 2,
    vh = (game.h - 1) * spacing + pad * 2;
  const winner =
    score[1] === score[2]
      ? "Égalité parfaite."
      : score[1] > score[2]
        ? "Les bleus remportent la partie."
        : "Les rouges remportent la partie.";
  return (
    <div className="arena" id="top">
      <aside className="navigation-rail" aria-label="Navigation principale">
        <a href="#top" className="brand" aria-label="Kropki accueil">
          <span className="brand-symbol">
            <i />
            <i />
            <i />
            <i />
          </span>
          kropki<span className="brand-period">.</span>
        </a>
        <span className="rail-caption">LE TERRITOIRE T’APPARTIENT.</span>
        <nav className="rail-nav">
          <a href="#plateau" className="rail-link selected" aria-label="Jouer">
            <Grid2X2 size={22} />
            <span>Jouer</span>
          </a>
          <button
            className="rail-link"
            aria-label="Ordinateur"
            onClick={() => {
              setNewMode("computer");
              setNewLevel(level);
              setSize(game.w);
              setModal("new");
            }}
          >
            <Bot size={22} />
            <span>Ordinateur</span>
          </button>
          <button
            className="rail-link"
            aria-label="À deux"
            onClick={() => {
              setNewMode("local");
              setSize(game.w);
              setModal("new");
            }}
          >
            <Users size={22} />
            <span>À deux</span>
          </button>
          <button
            className="rail-link"
            aria-label="Comment jouer"
            onClick={() => setModal("rules")}
          >
            <CircleHelp size={22} />
            <span>Règles du jeu</span>
          </button>
        </nav>
        <div className="rail-bottom">
          <div className="local-version">
            <span /> VERSION LOCALE
          </div>
          <p>
            Tout le plaisir du jeu.
            <br />
            Sans compte, sans attente.
          </p>
          <button onClick={() => setModal("rules")}>
            <CircleHelp size={16} /> Aide et règles
          </button>
        </div>
      </aside>
      <div className="arena-workspace">
        <header className="arena-header">
          <div className="breadcrumb">
            <span>Jouer</span>
            <ChevronRight size={15} />
            <strong>Kropki</strong>
          </div>
          <div className="saved-label">
            <ShieldCheck size={15} />
            <span>Sauvegarde automatique</span>
          </div>
        </header>
        <main className="arena-main">
          <div className="page-heading">
            <div>
              <div className="eyebrow">LE JEU DE TERRITOIRE POLONAIS</div>
              <h1>
                Chaque point compte<span>.</span>
              </h1>
              <p>Ferme tes frontières. Capture ses points. Prends l’avantage.</p>
            </div>
            <button className="rules-shortcut" onClick={() => setModal("rules")}>
              <CircleHelp size={18} />
              <span>Les règles</span>
            </button>
          </div>
          <section id="plateau" className="game-area">
            <div className="board-column">
              <div
                className={
                  "table-player opponent " + (game.turn === 2 && !game.ended ? "is-playing" : "")
                }
              >
                <div className="table-avatar red-avatar">
                  {mode === "computer" ? <Bot size={27} /> : <UserRound size={25} />}
                </div>
                <div className="table-name">
                  <strong>{mode === "computer" ? "Ordinateur" : "Joueur 2"}</strong>
                  <span>
                    <i style={{ background: colors[2] }} /> Les rouges ·{" "}
                    {mode === "computer"
                      ? level === "easy"
                        ? "Découverte"
                        : "Tactique"
                      : "Même écran"}
                  </span>
                </div>
                <div className="player-taken">
                  <span>{score[2]}</span> points capturés
                </div>
                {game.turn === 2 && !game.ended && (
                  <span className="player-turn-indicator">{ai ? "Réfléchit…" : "À son tour"}</span>
                )}
              </div>
              <div className="board-heading">
                <div className="board-title">
                  <Grid2X2 size={13} />
                  <span>
                    {game.w} × {game.h}
                  </span>
                  <span className="board-variant">Territoire</span>
                </div>
                <div className="turn-label" aria-live="polite">
                  <span style={{ background: game.ended ? "#a7a59b" : colors[game.turn] }} />
                  {game.ended
                    ? "Partie terminée"
                    : ai
                      ? "L’ordinateur réfléchit…"
                      : game.turn === 1
                        ? "Aux bleus de jouer"
                        : "Aux rouges de jouer"}
                </div>
              </div>
              <div className={"board-paper " + (ai ? "is-thinking" : "")}>
                <svg
                  className="game-board"
                  viewBox={`0 0 ${vw} ${vh}`}
                  aria-label="Plateau Kropki : sélectionne une intersection pour poser un point"
                  onMouseLeave={() => setHover(null)}
                >
                  {Array.from({ length: game.w }, (_, x) => (
                    <text
                      key={"cx" + x}
                      x={pad + x * spacing}
                      y={12}
                      className="coordinate"
                      textAnchor="middle"
                    >
                      {String.fromCharCode(65 + x)}
                    </text>
                  ))}
                  {Array.from({ length: game.h }, (_, y) => (
                    <text
                      key={"cy" + y}
                      x={9}
                      y={pad + y * spacing + 3}
                      className="coordinate"
                      textAnchor="middle"
                    >
                      {y + 1}
                    </text>
                  ))}
                  {Array.from({ length: game.w }, (_, x) => (
                    <line
                      key={"v" + x}
                      x1={pad + x * spacing}
                      x2={pad + x * spacing}
                      y1={pad}
                      y2={vh - pad}
                      className="grid-line"
                    />
                  ))}
                  {Array.from({ length: game.h }, (_, y) => (
                    <line
                      key={"h" + y}
                      y1={pad + y * spacing}
                      y2={pad + y * spacing}
                      x1={pad}
                      x2={vw - pad}
                      className="grid-line"
                    />
                  ))}
                  {game.zones.map((z, i) => (
                    <g key={i} pointerEvents="none">
                      {z.cells.map((c) => {
                        const rw = game.w * 2 + 3;
                        return (
                          <rect
                            key={c}
                            x={pad + (((c % rw) - 2) * spacing) / 2 - spacing / 4}
                            y={pad + ((Math.floor(c / rw) - 2) * spacing) / 2 - spacing / 4}
                            width={spacing / 2 + 0.1}
                            height={spacing / 2 + 0.1}
                            fill={colors[z.player]}
                            fillOpacity=".10"
                          />
                        );
                      })}
                      {z.edges.map(([x, y, nx, ny], j) => (
                        <line
                          key={j}
                          x1={pad + x * spacing}
                          y1={pad + y * spacing}
                          x2={pad + nx * spacing}
                          y2={pad + ny * spacing}
                          stroke={colors[z.player]}
                          strokeWidth="2"
                        />
                      ))}
                    </g>
                  ))}
                  {game.board.map((p, i) => {
                    const x = i % game.w,
                      y = Math.floor(i / game.w),
                      cx = pad + x * spacing,
                      cy = pad + y * spacing,
                      available = legal(game, x, y) && !ai;
                    return (
                      <g key={i}>
                        {p ? (
                          <>
                            <circle
                              cx={cx}
                              cy={cy}
                              r={captured(game, i) ? 4.6 : 6.2}
                              fill={colors[p]}
                              opacity={captured(game, i) ? 0.42 : 1}
                            />
                            {captured(game, i) && (
                              <path
                                d={`M${cx - 2} ${cy - 2}l4 4m-4 0l4-4`}
                                stroke="#c2d1a8"
                                strokeWidth="1"
                              />
                            )}
                            {last?.x === x && last?.y === y && (
                              <circle
                                cx={cx}
                                cy={cy}
                                r="11"
                                fill="none"
                                stroke={colors[p]}
                                strokeWidth="1"
                                opacity=".55"
                              />
                            )}
                          </>
                        ) : (
                          <circle
                            cx={cx}
                            cy={cy}
                            r="1.3"
                            fill={game.territory[i] ? colors[game.territory[i]] : "#7e916a"}
                            opacity=".7"
                          />
                        )}
                        {hover === i && available && (
                          <circle cx={cx} cy={cy} r="6.2" fill={colors[game.turn]} opacity=".4" />
                        )}
                        <foreignObject
                          x={cx - spacing / 2}
                          y={cy - spacing / 2}
                          width={spacing}
                          height={spacing}
                        >
                          <button
                            data-cell={`${x}-${y}`}
                            tabIndex={available ? 0 : -1}
                            aria-label={`${String.fromCharCode(65 + x)}${y + 1}${p ? ", occupée" : game.territory[i] ? ", capturée" : ""}`}
                            aria-disabled={!available}
                            className={
                              "cell-button " + (available ? "intersection" : "unavailable")
                            }
                            onMouseEnter={() => setHover(i)}
                            onClick={() => move(x, y)}
                          />
                        </foreignObject>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div
                className={
                  "table-player you " + (game.turn === 1 && !game.ended ? "is-playing" : "")
                }
              >
                <div className="table-avatar blue-avatar">
                  <UserRound size={25} />
                </div>
                <div className="table-name">
                  <strong>{mode === "computer" ? "Toi" : "Joueur 1"}</strong>
                  <span>
                    <i style={{ background: colors[1] }} /> Les bleus ·{" "}
                    {mode === "computer" ? "Prêt à conquérir" : "Même écran"}
                  </span>
                </div>
                <div className="player-taken">
                  <span>{score[1]}</span> points capturés
                </div>
                {game.turn === 1 && !game.ended && (
                  <span className="player-turn-indicator your-turn">À ton tour</span>
                )}
              </div>
              <div className="board-bottom">
                <span>
                  <span className="ring-key" /> Dernier point joué
                </span>
                <span>
                  {game.moves.length} {game.moves.length > 1 ? "coups joués" : "coup joué"}
                </span>
              </div>
              <div
                className={"message " + (game.ended ? "finished-message" : "")}
                aria-live="polite"
              >
                {game.ended
                  ? winner
                  : notice || "Clique sur une intersection libre pour poser ton point."}
              </div>
            </div>
            <aside className="right-column">
              <div className="game-sidebar">
                <div className="panel-heading">
                  <div>
                    <Swords size={21} />
                    <h2>Ta partie</h2>
                  </div>
                  <span className={"live-chip " + (game.ended ? "ended" : "")}>
                    <i />
                    {game.ended ? "Terminée" : "En cours"}
                  </span>
                </div>
                <div className="score-list">
                  {([1, 2] as const).map((p) => (
                    <div
                      key={p}
                      className={
                        "player-score " + (game.turn === p && !game.ended ? "current" : "")
                      }
                    >
                      <div className="score-owner">
                        <span style={{ background: colors[p] }} />
                        <strong>{p === 1 ? "Les bleus" : "Les rouges"}</strong>
                      </div>
                      <div className="score-number">
                        {score[p]}
                        <span>capturés</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="panel-tabs">
                  <button
                    className={panel === "play" ? "active" : ""}
                    aria-pressed={panel === "play"}
                    onClick={() => setPanel("play")}
                  >
                    <Grid2X2 size={15} /> Partie
                  </button>
                  <button
                    className={panel === "history" ? "active" : ""}
                    aria-pressed={panel === "history"}
                    onClick={() => setPanel("history")}
                  >
                    <History size={15} /> Historique <span>{game.moves.length}</span>
                  </button>
                </div>
                {panel === "play" ? (
                  <div className="play-panel">
                    <span className="field-caption">MODE DE JEU</span>
                    <div className="mode-selector" aria-label="Mode de jeu">
                      <button
                        className={mode === "computer" ? "active" : ""}
                        onClick={() => {
                          setNewMode("computer");
                          setNewLevel(level);
                          setSize(game.w);
                          setModal("new");
                        }}
                      >
                        <Bot size={18} /> Ordinateur
                      </button>
                      <button
                        className={mode === "local" ? "active" : ""}
                        onClick={() => {
                          setNewMode("local");
                          setSize(game.w);
                          setModal("new");
                        }}
                      >
                        <Users size={18} /> À deux
                      </button>
                    </div>
                    <div className="mode-description">
                      {mode === "computer"
                        ? `Toi contre l’ordinateur · ${level === "easy" ? "Découverte" : "Tactique"}`
                        : "Deux joueurs, un même écran"}
                    </div>
                    <div className="game-facts">
                      <div>
                        <span>Plateau</span>
                        <strong>
                          {game.w} × {game.h}
                        </strong>
                      </div>
                      <div>
                        <span>Règles</span>
                        <strong>Territoire</strong>
                      </div>
                      <div>
                        <span>Objectif</span>
                        <strong>Capturer le plus de points</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="history-panel">
                    <div className="history-heading">
                      <span>COUP</span>
                      <span>
                        <i className="blue-dot" /> BLEUS
                      </span>
                      <span>
                        <i className="red-dot" /> ROUGES
                      </span>
                    </div>
                    {game.moves.length ? (
                      <div className="history-scroll">
                        {Array.from({ length: Math.ceil(game.moves.length / 2) }, (_, i) => {
                          const a = game.moves[i * 2],
                            b = game.moves[i * 2 + 1];
                          return (
                            <div className="history-row" key={i}>
                              <span>{i + 1}.</span>
                              <strong>{a ? String.fromCharCode(65 + a.x) + (a.y + 1) : "—"}</strong>
                              <strong>{b ? String.fromCharCode(65 + b.x) + (b.y + 1) : "—"}</strong>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="history-empty">
                        <History size={28} />
                        <strong>Le premier point t’attend.</strong>
                        <p>
                          Les coordonnées de chaque coup
                          <br />
                          apparaîtront ici.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <div className="panel-controls">
                  <button
                    className="primary-button"
                    onClick={() => {
                      setNewMode(mode);
                      setSize(game.w);
                      setNewLevel(level);
                      setModal("new");
                    }}
                  >
                    <Grid2X2 size={20} /> Nouvelle partie <ArrowRight size={18} />
                  </button>
                  <div className="secondary-actions">
                    <button disabled={!game.moves.length} onClick={undo}>
                      <Undo2 size={17} /> Annuler
                    </button>
                    <button
                      disabled={game.ended || !game.moves.length}
                      onClick={() => setModal("end")}
                    >
                      <Flag size={16} /> Terminer
                    </button>
                  </div>
                </div>
              </div>
              <div className="tip">
                <div className="tip-title">
                  <Lightbulb size={18} />
                  <span>Le coup d’avance</span>
                </div>
                <p>Les diagonales comptent aussi. Relie tes points voisins pour fermer le piège.</p>
                <svg viewBox="0 0 150 40" aria-hidden="true">
                  <path
                    d="M12 30L40 8L68 30L96 8L124 30"
                    fill="none"
                    stroke="#9bc35d"
                    strokeWidth="2"
                  />
                  {[
                    [12, 30],
                    [40, 8],
                    [68, 30],
                    [96, 8],
                    [124, 30],
                  ].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="4" fill="#9bc35d" />
                  ))}
                </svg>
                <button onClick={() => setModal("rules")}>
                  Découvrir les règles <ArrowUpRight size={14} />
                </button>
              </div>
              <div className="device-note">
                <HardDrive size={14} />
                <span>Ta partie reste sur cet appareil.</span>
              </div>
            </aside>
          </section>
          <section className="quick-guide">
            <div className="guide-title">
              <Target size={19} />
              <h2>Simple à apprendre. Subtil à maîtriser.</h2>
            </div>
            <div className="steps">
              <article>
                <span className="step-num">01</span>
                <div>
                  <h3>Pose ton point</h3>
                  <p>Une intersection libre, un point. Chacun son tour.</p>
                </div>
              </article>
              <article>
                <span className="step-num">02</span>
                <div>
                  <h3>Ferme la boucle</h3>
                  <p>Entoure les points adverses, même en diagonale.</p>
                </div>
              </article>
              <article>
                <span className="step-num">03</span>
                <div>
                  <h3>Prends l’avantage</h3>
                  <p>Un point capturé = un point. Le meilleur score gagne.</p>
                </div>
              </article>
            </div>
          </section>
          <footer>
            <span>Kropki · Un point. Tout change.</span>
            <span>Mode local · Ordinateur ou deux joueurs</span>
          </footer>
        </main>
      </div>
      <dialog ref={dialog} onCancel={() => setModal(null)}>
        <div className="dialog-content">
          <button className="close-button" aria-label="Fermer" onClick={() => setModal(null)}>
            <X size={20} />
          </button>
          {modal === "rules" ? (
            <>
              <span className="tiny-label">LE PLAISIR EST DANS LA STRATÉGIE</span>
              <h2>
                Tout commence
                <br />
                par <em>un point.</em>
              </h2>
              <div className="rules-art">
                <Emblem small />
                <p>
                  Une chaîne fermée.
                  <br />
                  Trois points capturés.
                </p>
              </div>
              <ol className="rules-list">
                <li>
                  <strong>Chacun son tour.</strong> Pose un point sur une intersection libre. Les
                  bleus commencent.
                </li>
                <li>
                  <strong>Entoure pour capturer.</strong> Une boucle de points de ta couleur, reliés
                  horizontalement, verticalement ou en diagonale, capture les points adverses à
                  l’intérieur. Les frontières se tracent automatiquement.
                </li>
                <li>
                  <strong>Le territoire est fermé.</strong> Impossible de jouer dans une zone
                  capturée. Une boucle vide ne rapporte rien ; un adversaire qui y entre est capturé
                  si la boucle est toujours intacte.
                </li>
                <li>
                  <strong>Renverse la situation.</strong> Entourer un territoire adverse peut
                  libérer tes propres points. Les scores sont recalculés.
                </li>
                <li>
                  <strong>Le score décide.</strong> Un point adverse capturé = un point. La partie
                  se termine quand le plateau est plein ou en cliquant sur « Terminer ».
                </li>
              </ol>
              <p className="rules-source">
                Variante avec territoire et fermeture automatique.{" "}
                <a
                  href="https://zagram.org/info/kropki-rules.en.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  Référence des règles <ArrowUpRight size={12} />
                </a>
              </p>
              <button className="primary-button" onClick={() => setModal(null)}>
                C’est parti <ArrowRight size={17} />
              </button>
            </>
          ) : modal === "new" ? (
            <>
              <span className="tiny-label">UN PLATEAU. UN NOUVEAU DUEL.</span>
              <h2>
                Une nouvelle
                <br />
                <em>conquête.</em>
              </h2>
              <p className="field-label">Avec qui veux-tu jouer ?</p>
              <div className="dialog-modes">
                <button
                  className={newMode === "computer" ? "chosen" : ""}
                  onClick={() => setNewMode("computer")}
                >
                  <Monitor size={22} />
                  <strong>L’ordinateur</strong>
                  <span>Un duel en solo</span>
                  {newMode === "computer" && <Check size={15} />}
                </button>
                <button
                  className={newMode === "local" ? "chosen" : ""}
                  onClick={() => setNewMode("local")}
                >
                  <Users size={22} />
                  <strong>À deux</strong>
                  <span>Sur le même écran</span>
                  {newMode === "local" && <Check size={15} />}
                </button>
              </div>
              <label className="field-label" htmlFor="board-size">
                Taille du plateau
              </label>
              <div className="select-wrap">
                <select
                  id="board-size"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                >
                  <option value={13}>Petit · 13 × 11</option>
                  <option value={17}>Classique · 17 × 13</option>
                  <option value={21}>Grand · 21 × 17</option>
                </select>
                <ChevronDown size={16} />
              </div>
              {newMode === "computer" && (
                <>
                  <label className="field-label" htmlFor="difficulty">
                    Niveau de l’ordinateur
                  </label>
                  <div className="select-wrap">
                    <select
                      id="difficulty"
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value)}
                    >
                      <option value="easy">Découverte · pour prendre tes marques</option>
                      <option value="normal">Tactique · attaque et défense</option>
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </>
              )}
              {game.moves.length > 0 && (
                <p className="reset-note">La partie en cours sera remplacée.</p>
              )}
              <button className="primary-button" onClick={start}>
                Commencer la partie <ArrowRight size={17} />
              </button>
            </>
          ) : (
            <>
              <span className="tiny-label">LE DERNIER MOT</span>
              <h2>
                Fin du <em>duel ?</em>
              </h2>
              <p className="end-copy">
                La partie sera arrêtée et le gagnant désigné selon les points capturés.
              </p>
              <div className="final-score">
                <span style={{ color: colors[1] }}>{score[1]}</span>
                <span>—</span>
                <span style={{ color: colors[2] }}>{score[2]}</span>
              </div>
              <button
                className="primary-button"
                onClick={() => {
                  setGame({ ...game, ended: true });
                  setModal(null);
                }}
              >
                Terminer la partie <Flag size={16} />
              </button>
              <button className="dialog-back" onClick={() => setModal(null)}>
                Continuer à jouer
              </button>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
