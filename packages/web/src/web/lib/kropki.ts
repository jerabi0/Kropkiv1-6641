export type Player = 1 | 2;
export type Move = { x: number; y: number; player: Player };
export type Zone = { player: Player; cells: number[]; edges: number[][] };
export type Game = {
  w: number;
  h: number;
  board: number[];
  territory: number[];
  zones: Zone[];
  moves: Move[];
  turn: Player;
  ended: boolean;
};
export const other = (p: Player): Player => (p === 1 ? 2 : 1);
export const createGame = (w = 17, h = 13): Game => ({
  w,
  h,
  board: Array(w * h).fill(0),
  territory: Array(w * h).fill(0),
  zones: [],
  moves: [],
  turn: 1,
  ended: false,
});
export function captured(g: Game, i: number) {
  return !!g.board[i] && !!g.territory[i] && g.territory[i] !== g.board[i];
}
export function scores(g: Game) {
  const s = [0, 0, 0];
  g.board.forEach((_, i) => {
    if (captured(g, i)) s[g.territory[i]]++;
  });
  return s;
}
export function legal(g: Game, x: number, y: number) {
  return (
    !g.ended &&
    x >= 0 &&
    x < g.w &&
    y >= 0 &&
    y < g.h &&
    !g.board[y * g.w + x] &&
    !g.territory[y * g.w + x]
  );
}
// Rasterize the 8-neighbour chains at double resolution. Four-way flood fill
// cannot cross a diagonal chain, but can reach any unclosed region from outside.
function enclosures(g: Game, p: Player) {
  const rw = g.w * 2 + 3,
    rh = g.h * 2 + 3,
    wall = new Uint8Array(rw * rh),
    active = (i: number) => g.board[i] === p && !captured(g, i);
  const allEdges: number[][] = [];
  for (let y = 0; y < g.h; y++)
    for (let x = 0; x < g.w; x++) {
      const i = y * g.w + x;
      if (!active(i)) continue;
      const xx = 2 * x + 2,
        yy = 2 * y + 2;
      wall[yy * rw + xx] = 1;
      for (const [dx, dy] of [
        [1, 0],
        [0, 1],
        [1, 1],
        [-1, 1],
      ]) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || nx >= g.w || ny >= g.h || !active(ny * g.w + nx)) continue;
        wall[(yy + dy) * rw + xx + dx] = 1;
        allEdges.push([x, y, nx, ny]);
      }
    }
  const visited = new Uint8Array(rw * rh),
    zones: Zone[] = [];
  for (let start = 0; start < wall.length; start++) {
    if (wall[start] || visited[start]) continue;
    const stack = [start],
      cells: number[] = [],
      inside: number[] = [],
      touching = new Set<number>();
    visited[start] = 1;
    let outside = false;
    for (let a = 0; a < stack.length; a++) {
      const t = stack[a],
        x = t % rw,
        y = Math.floor(t / rw);
      cells.push(t);
      if (x === 0 || y === 0 || x === rw - 1 || y === rh - 1) outside = true;
      if (x >= 2 && y >= 2 && x <= 2 * g.w && y <= 2 * g.h && x % 2 === 0 && y % 2 === 0)
        inside.push(((y - 2) / 2) * g.w + (x - 2) / 2);
      for (const n of [
        x > 0 ? t - 1 : -1,
        x < rw - 1 ? t + 1 : -1,
        y > 0 ? t - rw : -1,
        y < rh - 1 ? t + rw : -1,
      ]) {
        if (n < 0) continue;
        if (wall[n]) {
          touching.add(n);
          continue;
        }
        if (!visited[n]) {
          visited[n] = 1;
          stack.push(n);
        }
      }
    }
    if (outside || !inside.some((i) => g.board[i] === other(p) && g.territory[i] !== p)) continue;
    inside.forEach((i) => (g.territory[i] = p));
    const edges = allEdges.filter(([x, y, nx, ny]) => touching.has((y + ny + 2) * rw + x + nx + 2));
    zones.push({ player: p, cells, edges });
  }
  if (zones.length) {
    // An outer capture absorbs enclosed older regions (and releases own dots).
    g.zones = g.zones.filter((z) => !z.cells.some((c) => zones.some((n) => n.cells.includes(c))));
    g.zones.push(...zones);
  }
}
export function play(g: Game, x: number, y: number): Game {
  if (!legal(g, x, y)) return g;
  const n: Game = {
    ...g,
    board: [...g.board],
    territory: [...g.territory],
    zones: [...g.zones],
    moves: [...g.moves, { x, y, player: g.turn }],
    turn: other(g.turn),
  };
  n.board[y * g.w + x] = g.turn;
  enclosures(n, g.turn);
  if (!captured(n, y * g.w + x)) enclosures(n, other(g.turn));
  if (!n.board.some((v, i) => !v && !n.territory[i])) n.ended = true;
  return n;
}
export function replay(moves: Move[], w: number, h: number) {
  let g = createGame(w, h);
  for (const m of moves) g = play(g, m.x, m.y);
  return g;
}
export function computerMove(g: Game, level = "normal"): [number, number] | null {
  const candidates: number[] = [];
  const occupied = g.board.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
  for (let i = 0; i < g.board.length; i++)
    if (
      legal(g, i % g.w, Math.floor(i / g.w)) &&
      (!occupied.length ||
        occupied.some(
          (j) =>
            Math.max(
              Math.abs((j % g.w) - (i % g.w)),
              Math.abs(Math.floor(j / g.w) - Math.floor(i / g.w)),
            ) <= 2,
        ))
    )
      candidates.push(i);
  if (!candidates.length)
    for (let i = 0; i < g.board.length; i++)
      if (legal(g, i % g.w, Math.floor(i / g.w))) candidates.push(i);
  if (!candidates.length) return null;
  const p = g.turn,
    q = other(p),
    before = scores(g);
  let best = -Infinity,
    choice = candidates[0];
  for (const i of candidates) {
    const x = i % g.w,
      y = Math.floor(i / g.w),
      n = play(g, x, y),
      s = scores(n);
    let value = (s[p] - before[p]) * 100 - (s[q] - before[q]) * 110;
    if (level !== "easy") {
      const threat = play({ ...g, turn: q }, x, y),
        ts = scores(threat);
      value += (ts[q] - before[q]) * 85;
    }
    let own = 0,
      enemy = 0,
      near = 0;
    for (const j of occupied) {
      if (captured(g, j)) continue;
      const dx = Math.abs((j % g.w) - x),
        dy = Math.abs(Math.floor(j / g.w) - y),
        d = Math.max(dx, dy);
      if (d === 1) {
        if (g.board[j] === p) own++;
        else enemy++;
      }
      if (d === 2 && g.board[j] === p) near++;
    }
    value +=
      own * 2.5 +
      enemy * 3 +
      near * 0.3 -
      (own > 4 ? 10 : 0) -
      Math.hypot(x - g.w / 2, y - g.h / 2) * 0.12;
    value += Math.random() * (level === "easy" ? 12 : 1.8);
    if (value > best) {
      best = value;
      choice = i;
    }
  }
  return [choice % g.w, Math.floor(choice / g.w)];
}
