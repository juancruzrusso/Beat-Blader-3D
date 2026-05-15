import * as THREE from 'three';
import { on } from './events.js';
import { triggerHaptic } from './haptics.js';
import { COLORS } from './constants.js';

// Partículas, screen shake, vibración. Pool simple para no asignar memoria
// en cada hit.

const PARTICLE_COUNT = 64;
let scene = null;
let camera = null;
let particles = [];
let shakeT = 0;
let shakeIntensity = 0;
let baseCamX = 0;
let baseCamY = 0;
let baseSet = false;

export function initEffects(_scene, _camera) {
  scene = _scene;
  camera = _camera;

  const geo = new THREE.SphereGeometry(0.09, 6, 6);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    scene.add(mesh);
    particles.push({
      mesh, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0,
    });
  }

  on('hit', ({ obj }) => {
    spawnBurst(obj.group.position, COLORS.cyan, 10);
    shake(0.08, 0.06);
    triggerHaptic('light');
  });

  on('miss', ({ obj }) => {
    if (obj) spawnBurst(obj.group.position, COLORS.hazard, 14);
    shake(0.3, 0.22);
    triggerHaptic('heavy');
  });

  on('missedtarget', () => {
    shake(0.12, 0.1);
  });
}

function spawnBurst(pos, color, count) {
  let used = 0;
  for (const p of particles) {
    if (p.life > 0) continue;
    if (used++ >= count) break;
    p.mesh.material.color.setHex(color);
    p.mesh.material.opacity = 1;
    p.mesh.position.copy(pos);
    p.mesh.visible = true;
    p.vx = (Math.random() - 0.5) * 8;
    p.vy = (Math.random() - 0.5) * 8 + 1;
    p.vz = (Math.random() - 0.5) * 8;
    p.life = 0.55;
    p.maxLife = 0.55;
  }
}

function shake(intensity, duration) {
  shakeT = Math.max(shakeT, duration);
  shakeIntensity = Math.max(shakeIntensity, intensity);
}

export function updateEffects(dt) {
  if (!camera) return;

  if (!baseSet) {
    baseCamX = camera.position.x;
    baseCamY = camera.position.y;
    baseSet = true;
  }

  if (shakeT > 0) {
    shakeT -= dt;
    const t = Math.max(0, shakeT);
    const intensity = shakeIntensity * (t / 0.22);
    camera.position.x = baseCamX + (Math.random() - 0.5) * intensity;
    camera.position.y = baseCamY + (Math.random() - 0.5) * intensity;
    if (shakeT <= 0) {
      camera.position.x = baseCamX;
      camera.position.y = baseCamY;
      shakeIntensity = 0;
    }
  }

  for (const p of particles) {
    if (p.life <= 0) {
      if (p.mesh.visible) p.mesh.visible = false;
      continue;
    }
    p.life -= dt;
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y += p.vy * dt;
    p.mesh.position.z += p.vz * dt;
    p.vy -= 6 * dt; // gravedad
    p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
    if (p.life <= 0) p.mesh.visible = false;
  }
}
