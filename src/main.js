import './style.css';
import * as THREE from 'three';

import { state } from './state.js';
import { initGame, checkWin } from './game.js';
import { initTunnel, updateTunnel } from './tunnel.js';
import { initPlayer, updatePlayer } from './player.js';
import { initObstacles, updateObstacles } from './obstacles.js';
import { updateBeatmap } from './beatmap.js';
import { initCollisions, updateCollisions } from './collisions.js';
import { initUI, updateUI } from './ui.js';
import { initEffects, updateEffects } from './effects.js';
import { tickAudio } from './audio.js';
import { COLORS } from './constants.js';

const canvas = document.getElementById('game-canvas');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.bgDeep);
scene.fog = new THREE.Fog(COLORS.bgDeep, 16, 60);

const camera = new THREE.PerspectiveCamera(
  72,
  window.innerWidth / window.innerHeight,
  0.1, 200,
);
camera.position.set(0, 2.0, 4.8);
camera.lookAt(0, 1.0, -10);

// Iluminación
scene.add(new THREE.AmbientLight(0xffffff, 0.45));
const keyLight = new THREE.DirectionalLight(0xff66ff, 0.6);
keyLight.position.set(2, 6, 3);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x00ffff, 0.4);
rimLight.position.set(-3, 2, -4);
scene.add(rimLight);

initTunnel(scene);
initPlayer(scene);
initObstacles(scene);
initEffects(scene, camera);
initCollisions();
initUI();
initGame();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Loop principal
let lastTime = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  // El túnel siempre se mueve (también en menú queda más vivo)
  updateTunnel(dt);

  if (state.status === 'playing') {
    updatePlayer(dt);
    updateBeatmap();
    updateObstacles(dt);
    updateCollisions();
    tickAudio();
    checkWin();
  } else if (state.status !== 'paused') {
    // En menú/gameover/gamewin animamos explosiones residuales,
    // pero en pausa congelamos todo.
    updateObstacles(dt);
  }

  updateEffects(dt);
  updateUI(dt);

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Service worker para PWA (sólo en build de producción)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(() => {});
  });
}
