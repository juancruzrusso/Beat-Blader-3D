import { state, resetRun, persistBest } from './state.js';
import { on } from './events.js';
import {
  initAudio, playSong, pause as pauseAudio, resume as resumeAudio,
  stop as stopAudio, setOnEnd,
} from './audio.js';
import { loadBeatmap, resetBeatmap, getTargetCount, isFinished } from './beatmap.js';
import { resetPlayer } from './player.js';
import { clearObstacles } from './obstacles.js';
import { resetHUD } from './ui.js';

let menuEl, loadingEl, gameoverEl, winEl, pauseEl;

const SCREENS_HTML = `
  <div id="menu" class="screen">
    <div class="brand">
      <span class="brand-blade" aria-hidden="true"></span>
      <h1 class="title">BEAT BLADER</h1>
      <span class="brand-blade" aria-hidden="true"></span>
    </div>
    <p class="subtitle">Cortá al ritmo · Esquivá las púas</p>
    <button id="btn-play" class="btn-big">PLAY</button>
    <p class="hint">Flechas o arrastrar · ESC pausa · R retry</p>
  </div>
  <div id="loading" class="screen hidden">
    <p class="title-cyan">LOADING…</p>
  </div>
  <div id="gameover" class="screen hidden">
    <h2 class="title-red">GAME OVER</h2>
    <p class="final-score">Score: 0</p>
    <p class="best-score">Best: 0</p>
    <div class="btn-row">
      <button id="btn-retry-go" class="btn-med">RETRY</button>
      <button id="btn-menu-go" class="btn-med">MENU</button>
    </div>
  </div>
  <div id="gamewin" class="screen hidden">
    <h2 class="title-cyan">PERFECT RUN!</h2>
    <p class="final-score">Score: 0</p>
    <p class="accuracy">Accuracy: 0%</p>
    <p class="stars">★☆☆</p>
    <div class="btn-row">
      <button id="btn-retry-win" class="btn-med">RETRY</button>
      <button id="btn-menu-win" class="btn-med">MENU</button>
    </div>
  </div>
  <div id="pause" class="screen hidden">
    <h2 class="title-cyan">PAUSED</h2>
    <div class="btn-row">
      <button id="btn-resume" class="btn-med">RESUME</button>
      <button id="btn-menu-pause" class="btn-med">MENU</button>
    </div>
  </div>
`;

export async function initGame() {
  document.body.insertAdjacentHTML('beforeend', SCREENS_HTML);
  menuEl = document.getElementById('menu');
  loadingEl = document.getElementById('loading');
  gameoverEl = document.getElementById('gameover');
  winEl = document.getElementById('gamewin');
  pauseEl = document.getElementById('pause');

  document.getElementById('btn-play').addEventListener('click', start);
  document.getElementById('btn-retry-go').addEventListener('click', start);
  document.getElementById('btn-menu-go').addEventListener('click', showMenu);
  document.getElementById('btn-retry-win').addEventListener('click', start);
  document.getElementById('btn-menu-win').addEventListener('click', showMenu);
  document.getElementById('btn-resume').addEventListener('click', resumeGame);
  document.getElementById('btn-menu-pause').addEventListener('click', showMenu);

  on('gameover', () => endGame(false));

  window.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
      if (state.status === 'playing' || state.status === 'gameover' || state.status === 'gamewin') {
        start();
      }
    }
    if (e.key === 'Escape') togglePause();
  });

  showLoading();
  await Promise.all([initAudio(), loadBeatmap('song1')]);
  hideLoading();
  showMenu();
}

function showLoading() {
  state.status = 'loading';
  hideAll();
  loadingEl?.classList.remove('hidden');
}

function hideLoading() {
  loadingEl?.classList.add('hidden');
}

function showMenu() {
  state.status = 'menu';
  hideAll();
  stopAudio();
  resetBeatmap();
  clearObstacles();
  menuEl?.classList.remove('hidden');
}

function hideAll() {
  for (const el of [menuEl, loadingEl, gameoverEl, winEl, pauseEl]) {
    el?.classList.add('hidden');
  }
}

async function start() {
  hideAll();
  resetPlayer();
  resetBeatmap();
  clearObstacles();
  resetRun();
  resetHUD();
  setOnEnd(() => { if (state.status === 'playing') endGame(true); });
  state.status = 'playing';
  await playSong();
}

function endGame(win) {
  if (state.status !== 'playing') return;
  state.status = win ? 'gamewin' : 'gameover';
  stopAudio();
  persistBest();
  hideAll();

  if (win) {
    const total = Math.max(1, getTargetCount());
    const accuracy = Math.round((state.hits / total) * 100);
    const stars = accuracy >= 90 ? '★★★' : accuracy >= 65 ? '★★☆' : '★☆☆';
    winEl.querySelector('.final-score').textContent = `Score: ${state.score}`;
    winEl.querySelector('.accuracy').textContent = `Accuracy: ${accuracy}% · Best combo: ${state.bestCombo}`;
    winEl.querySelector('.stars').textContent = stars;
    winEl.classList.remove('hidden');
  } else {
    gameoverEl.querySelector('.final-score').textContent = `Score: ${state.score}`;
    gameoverEl.querySelector('.best-score').textContent = `Best: ${state.bestScore}`;
    gameoverEl.classList.remove('hidden');
  }
}

export function checkWin() {
  if (state.status === 'playing' && isFinished()) endGame(true);
}

function togglePause() {
  if (state.status === 'playing') {
    state.status = 'paused';
    pauseAudio();
    pauseEl?.classList.remove('hidden');
  } else if (state.status === 'paused') {
    resumeGame();
  }
}

function resumeGame() {
  pauseEl?.classList.add('hidden');
  state.status = 'playing';
  resumeAudio();
}
