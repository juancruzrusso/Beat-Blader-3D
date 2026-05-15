import * as THREE from 'three';
import { COLORS, PLAYER_Z, LANE_X } from './constants.js';
import { on } from './events.js';

// Personaje low-poly procedural: torso + cabeza + piernas + brazos + espada.
// La espada va anclada a la mano derecha. Animación de carrera permanente
// (las piernas se mueven) y "slash" cuando se emite el evento 'hit'.

// El movimiento se limita a un pelín más allá del lane externo, así no se sale
// del FOV en portrait pero permite snappear contra el borde.
const X_MIN = LANE_X[0] - 0.15;
const X_MAX = LANE_X[LANE_X.length - 1] + 0.15;
const MOVE_SPEED = 7.5;             // unidades/seg con teclado
const TOUCH_SENSITIVITY = 0.022;    // px → mundo. Más alto = menos drag necesario
const SMOOTH = 16;                  // suavizado hacia targetX
const RUN_HZ = 2.2;                 // ciclos de carrera por segundo
const SWING_DURATION = 0.22;

let player;
let body, head, leftLeg, rightLeg, leftArm, rightArm;
let swordPivot, sword, swordGlow;
let targetX = 0;
let tiltZ = 0;
let runPhase = 0;
let swingT = 0;
const inputs = { left: false, right: false };
let touchStartX = null;
let touchBaseX = 0;

export function initPlayer(scene) {
  player = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a0830,
    emissive: 0x00ffff,
    emissiveIntensity: 0.55,
    metalness: 0.55,
    roughness: 0.32,
  });
  const headMat = new THREE.MeshStandardMaterial({
    color: 0x0a0420,
    emissive: 0x9d00ff,
    emissiveIntensity: 0.45,
    metalness: 0.6,
    roughness: 0.3,
  });
  const limbMat = bodyMat.clone();

  // Anatomía (todas las Y son respecto al player.position, con el pie en y=0):
  //   pie 0 · cadera 0.5 · hombro 1.0 · cabeza 1.22 · top 1.39
  body = makePart(new THREE.BoxGeometry(0.42, 0.5, 0.26), bodyMat, 0, 0.75, 0);
  player.add(body);

  head = makePart(new THREE.BoxGeometry(0.34, 0.34, 0.34), headMat, 0, 1.22, 0);
  player.add(head);
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.07, 0.02),
    new THREE.MeshBasicMaterial({ color: COLORS.cyan }),
  );
  visor.position.set(0, 1.24, 0.16);
  player.add(visor);

  // Piernas: pivot en la cadera (y=0.5), cuelgan hasta el pie (y=0)
  leftLeg = makeLimb(new THREE.BoxGeometry(0.16, 0.5, 0.2), limbMat, -0.11, 0.5, 0);
  rightLeg = makeLimb(new THREE.BoxGeometry(0.16, 0.5, 0.2), limbMat, 0.11, 0.5, 0);
  player.add(leftLeg);
  player.add(rightLeg);

  // Brazos: pivot en el hombro (y=1.0)
  leftArm = makeLimb(new THREE.BoxGeometry(0.14, 0.42, 0.16), limbMat, -0.24, 1.0, 0);
  rightArm = makeLimb(new THREE.BoxGeometry(0.14, 0.42, 0.16), limbMat, 0.24, 1.0, 0);
  player.add(leftArm);
  player.add(rightArm);

  // Espada en la mano derecha — montamos un swordPivot al final del brazo
  // para que rote junto al brazo (slash).
  swordPivot = new THREE.Group();
  swordPivot.position.set(0, -0.42, 0); // muñeca = punta inferior del brazo
  rightArm.add(swordPivot);

  const swordMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x00ffff,
    emissiveIntensity: 1.8,
    metalness: 0.7,
    roughness: 0.15,
  });
  const swordGeo = new THREE.BoxGeometry(0.06, 1.15, 0.06);
  swordGeo.translate(0, 0.55, 0); // pivot en la empuñadura
  sword = new THREE.Mesh(swordGeo, swordMat);
  swordPivot.add(sword);

  // Guarda (cross-guard) magenta para que se distinga del resto del cuerpo
  const guard = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.05, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x9d00ff,
      emissive: 0x9d00ff,
      emissiveIntensity: 1.2,
    }),
  );
  guard.position.y = 0.05;
  swordPivot.add(guard);

  // Halo translúcido alrededor de la hoja
  const glowGeo = new THREE.BoxGeometry(0.22, 1.25, 0.22);
  glowGeo.translate(0, 0.55, 0);
  swordGlow = new THREE.Mesh(
    glowGeo,
    new THREE.MeshBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0.25,
    }),
  );
  swordPivot.add(swordGlow);

  // Pose por defecto: el brazo derecho sostiene la espada al frente-arriba.
  rightArm.rotation.x = -0.55;
  rightArm.rotation.z = -0.15;

  player.position.set(0, 0, PLAYER_Z);
  scene.add(player);

  setupInputs();
  on('hit', () => { swingT = SWING_DURATION; });
}

function makePart(geo, mat, x, y, z) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  return mesh;
}

// Como las extremidades giran desde el extremo superior, movemos la
// geometría hacia abajo del origen para que el pivot quede en la articulación.
function makeLimb(geo, mat, x, y, z) {
  geo.translate(0, -geo.parameters.height / 2, 0);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  return mesh;
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

  canvas.addEventListener('touchend', () => { touchStartX = null; });
  canvas.addEventListener('touchcancel', () => { touchStartX = null; });
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

export function updatePlayer(dt) {
  if (!player) return;

  if (inputs.left) targetX -= MOVE_SPEED * dt;
  if (inputs.right) targetX += MOVE_SPEED * dt;
  targetX = clamp(targetX, X_MIN, X_MAX);

  const k = 1 - Math.exp(-SMOOTH * dt);
  const prevX = player.position.x;
  player.position.x += (targetX - player.position.x) * k;

  // Inclinación lateral del torso al cambiar de lane
  const dxFrame = player.position.x - prevX;
  const desiredTilt = clamp(-dxFrame * 7, -0.45, 0.45);
  tiltZ += (desiredTilt - tiltZ) * Math.min(1, dt * 12);
  player.rotation.z = tiltZ;

  // Animación de carrera: piernas alternadas + brazo izq libre + bob vertical
  runPhase += dt * RUN_HZ * Math.PI * 2;
  const legSwing = Math.sin(runPhase) * 0.7;
  leftLeg.rotation.x = legSwing;
  rightLeg.rotation.x = -legSwing;
  leftArm.rotation.x = -legSwing * 0.55;
  player.position.y = Math.abs(Math.sin(runPhase)) * 0.06;

  // Brazo de la espada: base estática + slash si hay hit reciente
  let rightArmX = -0.55;
  let swordEmissive = 1.8;
  if (swingT > 0) {
    swingT -= dt;
    const k = 1 - swingT / SWING_DURATION; // 0..1
    rightArmX = -0.55 + Math.sin(k * Math.PI) * 1.8; // arco grande hacia adelante
    swordEmissive = 1.8 + Math.sin(k * Math.PI) * 2.5;
    swordGlow.material.opacity = 0.25 + Math.sin(k * Math.PI) * 0.5;
  } else {
    swordGlow.material.opacity = 0.25;
  }
  rightArm.rotation.x = rightArmX;
  sword.material.emissiveIntensity = swordEmissive;

  // El visor / cabeza giran muy sutil
  head.rotation.y = Math.sin(performance.now() * 0.001) * 0.08;
}

export function getPlayerPosition() {
  return player ? player.position : new THREE.Vector3();
}

export function resetPlayer() {
  targetX = 0;
  tiltZ = 0;
  swingT = 0;
  runPhase = 0;
  if (player) {
    player.position.x = 0;
    player.position.y = 0;
    player.rotation.set(0, 0, 0);
  }
}
