import { state } from './state.js';
import { getProgress } from './beatmap.js';
import { on } from './events.js';
import { MAX_LIVES } from './constants.js';

// HUD HTML encima del canvas. Inyectamos el DOM en initUI()
// y lo refrescamos cada frame en updateUI().

let scoreEl, comboEl, livesEl, progressEl, feedbackEl, fpsEl, flashEl;
let displayedScore = 0;
let comboFade = 0;
let feedbackFade = 0;
let fpsFrames = 0;
let fpsAccum = 0;

const HUD_HTML = `
  <div id="hud">
    <div id="score-wrap"><div id="score">000000</div></div>
    <div id="progress-wrap"><div id="progress"></div></div>
    <div id="lives" aria-label="lives">
      ${Array.from({ length: MAX_LIVES }).map(() => '<span class="heart">&hearts;</span>').join('')}
    </div>
    <div id="combo"></div>
    <div id="feedback"></div>
    <div id="fps">FPS —</div>
  </div>
  <div id="flash"></div>
`;

export function initUI() {
  document.body.insertAdjacentHTML('beforeend', HUD_HTML);
  scoreEl = document.getElementById('score');
  comboEl = document.getElementById('combo');
  livesEl = document.getElementById('lives');
  progressEl = document.getElementById('progress');
  feedbackEl = document.getElementById('feedback');
  fpsEl = document.getElementById('fps');
  flashEl = document.getElementById('flash');

  on('hit', ({ combo, mult }) => {
    bumpScore();
    if (combo >= 2) showCombo(`x${mult}`);
    showFeedback(mult >= 3 ? 'PERFECT!' : 'GOOD!', '#00ffff');
  });

  on('miss', () => {
    showFeedback('MISS', '#ff3355');
    flashRed();
    updateLives();
  });

  on('missedtarget', () => {
    showFeedback('MISSED', '#ffaa00');
  });
}

function bumpScore() {
  if (!scoreEl) return;
  scoreEl.classList.remove('bump');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('bump');
}

function showCombo(txt) {
  if (!comboEl) return;
  comboEl.textContent = txt;
  comboEl.style.opacity = '1';
  comboFade = 0.65;
}

function showFeedback(txt, color) {
  if (!feedbackEl) return;
  feedbackEl.textContent = txt;
  feedbackEl.style.color = color;
  feedbackEl.style.opacity = '1';
  feedbackFade = 0.55;
}

function flashRed() {
  if (!flashEl) return;
  flashEl.style.opacity = '0.7';
  setTimeout(() => { if (flashEl) flashEl.style.opacity = '0'; }, 160);
}

function updateLives() {
  if (!livesEl) return;
  const hearts = livesEl.querySelectorAll('.heart');
  hearts.forEach((h, i) => {
    h.classList.toggle('lost', i >= state.lives);
  });
}

export function updateUI(dt) {
  // FPS counter — recalc cada 0.5s
  fpsFrames++;
  fpsAccum += dt;
  if (fpsAccum >= 0.5) {
    const fps = Math.round(fpsFrames / fpsAccum);
    if (fpsEl) fpsEl.textContent = `FPS ${fps}`;
    fpsFrames = 0;
    fpsAccum = 0;
  }

  // Score animado (cuenta hacia el valor real)
  if (displayedScore !== state.score) {
    const diff = state.score - displayedScore;
    const step = Math.max(1, Math.ceil(Math.abs(diff) * 0.18));
    displayedScore += Math.sign(diff) * step;
    if ((diff > 0 && displayedScore > state.score) ||
        (diff < 0 && displayedScore < state.score)) {
      displayedScore = state.score;
    }
    if (scoreEl) scoreEl.textContent = String(displayedScore).padStart(6, '0');
  }

  if (progressEl) progressEl.style.width = `${getProgress() * 100}%`;

  if (comboFade > 0) {
    comboFade -= dt;
    if (comboEl) comboEl.style.opacity = String(Math.max(0, comboFade / 0.65));
  }
  if (feedbackFade > 0) {
    feedbackFade -= dt;
    if (feedbackEl) feedbackEl.style.opacity = String(Math.max(0, feedbackFade / 0.55));
  }
}

export function resetHUD() {
  displayedScore = 0;
  if (scoreEl) scoreEl.textContent = '000000';
  if (comboEl) comboEl.style.opacity = '0';
  if (feedbackEl) feedbackEl.style.opacity = '0';
  if (progressEl) progressEl.style.width = '0%';
  updateLives();
}
