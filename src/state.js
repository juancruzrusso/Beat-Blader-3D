// Estado mutable compartido. Importás `state` desde cualquier archivo
// y leés/modificás sus campos. Para el MVP no necesitamos algo más sofisticado.

import { MAX_LIVES } from './constants.js';

const BEST_KEY = 'beatblader_best';

export const state = {
  status: 'boot',           // boot | loading | menu | playing | paused | gameover | gamewin
  score: 0,
  combo: 0,
  bestCombo: 0,
  lives: MAX_LIVES,
  hits: 0,
  misses: 0,
  bestScore: parseInt(localStorage.getItem(BEST_KEY) || '0', 10),
};

export function resetRun() {
  state.score = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.lives = MAX_LIVES;
  state.hits = 0;
  state.misses = 0;
}

export function persistBest() {
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    try { localStorage.setItem(BEST_KEY, String(state.bestScore)); } catch {}
  }
}
