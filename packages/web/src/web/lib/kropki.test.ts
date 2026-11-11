import { test, expect } from "bun:test";
import { createGame, play, legal, scores, captured, computerMove, replay } from "./kropki";
test("alternance et intersection occupée", () => {
  const g = play(createGame(), 4, 4);
  expect(g.turn).toBe(2);
  expect(play(g, 4, 4)).toBe(g);
  expect(g.moves.length).toBe(1);
});
test("capture diagonale et territoire fermé", () => {
  const g = createGame(7, 7);
  g.board[3 * 7 + 3] = 2;
  for (const [x, y] of [
    [3, 2],
    [4, 3],
    [3, 4],
  ])
    g.board[y * 7 + x] = 1;
  const n = play(g, 2, 3);
  expect(scores(n)[1]).toBe(1);
  expect(captured(n, 24)).toBe(true);
  expect(n.zones.length).toBe(1);
});
test("une boucle ouverte ne capture pas", () => {
  const g = createGame(7, 7);
  g.board[24] = 2;
  g.board[2 * 7 + 3] = 1;
  g.board[3 * 7 + 4] = 1;
  const n = play(g, 3, 4);
  expect(scores(n)[1]).toBe(0);
  expect(n.zones.length).toBe(0);
});
test("maison vide et intrusion", () => {
  let g = createGame(7, 7);
  for (const [x, y] of [
    [3, 2],
    [4, 3],
    [3, 4],
  ])
    g.board[y * 7 + x] = 1;
  g = play(g, 2, 3);
  expect(legal(g, 3, 3)).toBe(true);
  expect(g.zones.length).toBe(0);
  g = play(g, 3, 3);
  expect(scores(g)[1]).toBe(1);
});
test("libération par une capture extérieure", () => {
  let g = createGame(9, 9);
  g.turn = 2;
  g.board[4 * 9 + 4] = 1;
  for (const [x, y] of [
    [4, 3],
    [5, 4],
    [4, 5],
  ])
    g.board[y * 9 + x] = 2;
  g = play(g, 3, 4);
  expect(scores(g)[2]).toBe(1);
  for (let i = 1; i <= 7; i++) {
    g.board[1 * 9 + i] = 1;
    g.board[7 * 9 + i] = 1;
    g.board[i * 9 + 1] = 1;
    g.board[i * 9 + 7] = 1;
  }
  g.board[1 * 9 + 4] = 0;
  g.turn = 1;
  g = play(g, 4, 1);
  expect(scores(g)[2]).toBe(0);
  expect(scores(g)[1]).toBe(4);
  expect(captured(g, 4 * 9 + 4)).toBe(false);
  expect(g.zones.every((z) => z.player === 1)).toBe(true);
  expect(legal(g, 2, 2)).toBe(false);
});
test("replay conserve une partie", () => {
  let g = createGame();
  for (const [x, y] of [
    [5, 5],
    [6, 5],
    [5, 6],
    [6, 6],
  ])
    g = play(g, x, y);
  expect(replay(g.moves, g.w, g.h)).toEqual(g);
});
test("ordinateur trouve une capture immédiate", () => {
  const g = createGame(7, 7);
  g.turn = 2;
  g.board[3 * 7 + 3] = 1;
  for (const [x, y] of [
    [3, 2],
    [4, 3],
    [3, 4],
  ])
    g.board[y * 7 + x] = 2;
  expect(computerMove(g)).toEqual([2, 3]);
});
test("simulation complète ordinateur sans coup illégal", () => {
  let g = createGame(13, 11);
  for (let i = 0; i < 90 && !g.ended; i++) {
    const m = computerMove(g);
    expect(m).not.toBeNull();
    expect(legal(g, ...m!)).toBe(true);
    g = play(g, ...m!);
  }
  expect(g.moves.length).toBeGreaterThan(20);
});
