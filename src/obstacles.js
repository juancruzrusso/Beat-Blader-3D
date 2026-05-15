import * as THREE from 'three';
import {
  TUNNEL_SPEED, LANE_X, COLORS, SPAWN_Z, RECYCLE_Z,
} from './constants.js';

// Pool de obstáculos. En vez de crear/destruir, reutilizamos N instancias.
// Cada slot tiene mesh de target Y de hazard — mostramos el que toca.

const POOL_SIZE = 48;
let pool = [];
let scene = null;

export function initObstacles(_scene) {
  scene = _scene;
  for (let i = 0; i < POOL_SIZE; i++) {
    pool.push(createSlot());
  }
}

function createSlot() {
  const group = new THREE.Group();

  // Target (cubo cyan) — un toque más chico para que no tape al personaje
  const targetGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
  const targetMat = new THREE.MeshStandardMaterial({
    color: COLORS.target,
    emissive: COLORS.target,
    emissiveIntensity: 0.9,
    metalness: 0.4,
    roughness: 0.3,
  });
  const target = new THREE.Mesh(targetGeo, targetMat);
  // Outline tipo "wire" para que se vea cyber
  const wireGeo = new THREE.EdgesGeometry(targetGeo);
  const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
  target.add(new THREE.LineSegments(wireGeo, wireMat));

  // Hazard (octaedro/púa roja)
  const hazardGeo = new THREE.OctahedronGeometry(0.5, 0);
  const hazardMat = new THREE.MeshStandardMaterial({
    color: COLORS.hazard,
    emissive: COLORS.hazard,
    emissiveIntensity: 1.0,
    metalness: 0.2,
    roughness: 0.5,
  });
  const hazard = new THREE.Mesh(hazardGeo, hazardMat);
  const hwireGeo = new THREE.EdgesGeometry(hazardGeo);
  const hwireMat = new THREE.LineBasicMaterial({ color: 0xffaaaa, transparent: true, opacity: 0.8 });
  hazard.add(new THREE.LineSegments(hwireGeo, hwireMat));

  group.add(target);
  group.add(hazard);
  group.visible = false;
  scene.add(group);

  return {
    group,
    targetMesh: target,
    hazardMesh: hazard,
    type: null,
    lane: 0,
    active: false,
    scored: false,   // ya contó (hit, miss o pasó)
    dying: false,    // está en animación de explosión
    deathT: 0,
    noteTime: 0,
  };
}

export function spawnObject(type, lane, noteTime = 0) {
  const obj = pool.find(o => !o.active);
  if (!obj) {
    console.warn('Pool de obstáculos lleno, salteamos nota');
    return null;
  }
  obj.active = true;
  obj.scored = false;
  obj.dying = false;
  obj.deathT = 0;
  obj.type = type;
  obj.lane = lane;
  obj.noteTime = noteTime;
  obj.group.visible = true;
  obj.group.position.set(LANE_X[lane], 0.6, SPAWN_Z);
  obj.group.scale.set(1, 1, 1);
  obj.group.rotation.set(0, 0, 0);
  obj.targetMesh.visible = type === 'target';
  obj.hazardMesh.visible = type === 'hazard';
  return obj;
}

export function updateObstacles(dt) {
  for (const obj of pool) {
    if (!obj.active) continue;

    if (obj.dying) {
      // Animación de explosión: shrink rápido
      obj.deathT += dt;
      const s = Math.max(0, 1 - obj.deathT * 7);
      obj.group.scale.set(s, s, s);
      obj.group.rotation.y += dt * 12;
      if (s <= 0.001) recycle(obj);
      continue;
    }

    obj.group.position.z += TUNNEL_SPEED * dt;

    if (obj.type === 'target') {
      const pulse = 1 + Math.sin(performance.now() * 0.008) * 0.04;
      obj.targetMesh.scale.set(pulse, pulse, pulse);
      obj.targetMesh.rotation.y += dt * 1.4;
    } else if (obj.type === 'hazard') {
      obj.hazardMesh.rotation.y += dt * 2.2;
      obj.hazardMesh.rotation.x += dt * 1.6;
    }

    if (obj.group.position.z > RECYCLE_Z) {
      recycle(obj);
    }
  }
}

export function startDeath(obj) {
  obj.dying = true;
  obj.deathT = 0;
  obj.scored = true;
}

export function recycle(obj) {
  obj.active = false;
  obj.dying = false;
  obj.deathT = 0;
  obj.scored = false;
  obj.group.visible = false;
}

export function getActiveObstacles() {
  return pool.filter(o => o.active && !o.dying);
}

export function clearObstacles() {
  for (const obj of pool) recycle(obj);
}
