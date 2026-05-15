import * as THREE from 'three';
import { COLORS, PLAYER_Z, TUNNEL_WIDTH } from './constants.js';

// El player es un cubo blanco con glow cyan. Se mueve en eje X con teclado
// (flechas) o touch (arrastrar el dedo lateralmente).

const X_MIN = -(TUNNEL_WIDTH / 2 - 0.5);
const X_MAX = +(TUNNEL_WIDTH / 2 - 0.5);
const MOVE_SPEED = 9;          // unidades/seg cuando mantenés la tecla
const TOUCH_SENSITIVITY = 0.012;
const SMOOTH = 14;             // factor de suavizado hacia targetX
const TILT_FACTOR = 0.6;       // inclinación visual al moverse

let player;
let targetX = 0;
let tiltZ = 0;
const inputs = { left: false, right: false };
let touchStartX = null;
let touchBaseX = 0;

export function initPlayer(scene) {
  const group = new THREE.Group();

  const geo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const mat = new THREE.MeshStandardMaterial({
    color: COLORS.player,
    emissive: COLORS.cyan,
    emissiveIntensity: 0.6,
    metalness: 0.4,
    roughness: 0.25,
    transparent: true,
    opacity: 0.92,
  });
  const cube = new THREE.Mesh(geo, mat);
  group.add(cube);

  // Aura translúcida alrededor para el glow
  const glowGeo = new THREE.BoxGeometry(1.3, 1.3, 1.3);
  const glowMat = new THREE.MeshBasicMaterial({
    color: COLORS.cyan,
    transparent: true,
    opacity: 0.13,
  });
  group.add(new THREE.Mesh(glowGeo, glowMat));

  group.position.set(0, 0.55, PLAYER_Z);
  scene.add(group);
  player = group;

  setupInputs();
}

function setupInputs() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputs.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputs.right = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') inputs.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') inputs.right = false;
  });

  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;

  canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchBaseX = targetX;
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (touchStartX === null) return;
    const dx = e.touches[0].clientX - touchStartX;
    targetX = clamp(touchBaseX + dx * TOUCH_SENSITIVITY, X_MIN, X_MAX);
  }, { passive: true });

  canvas.addEventListener('touchend', () => {
    touchStartX = null;
  });
  canvas.addEventListener('touchcancel', () => {
    touchStartX = null;
  });
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function updatePlayer(dt) {
  if (!player) return;

  if (inputs.left) targetX -= MOVE_SPEED * dt;
  if (inputs.right) targetX += MOVE_SPEED * dt;
  targetX = clamp(targetX, X_MIN, X_MAX);

  const k = 1 - Math.exp(-SMOOTH * dt);
  const prevX = player.position.x;
  player.position.x += (targetX - player.position.x) * k;

  // Inclinación: se inclina hacia donde se está moviendo
  const dxFrame = player.position.x - prevX;
  const desiredTilt = clamp(-dxFrame * 6, -0.5, 0.5);
  tiltZ += (desiredTilt - tiltZ) * Math.min(1, dt * 12);
  player.rotation.z = tiltZ;

  // Animación idle: rotación lenta en Y
  player.rotation.y += dt * 0.6;
}

export function getPlayerPosition() {
  return player ? player.position : new THREE.Vector3();
}

export function resetPlayer() {
  targetX = 0;
  tiltZ = 0;
  if (player) {
    player.position.x = 0;
    player.rotation.set(0, 0, 0);
  }
}
