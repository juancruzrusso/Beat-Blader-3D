import * as THREE from 'three';
import {
  TUNNEL_SPEED, TUNNEL_WIDTH, TUNNEL_HEIGHT,
  COLORS, SPAWN_Z, RECYCLE_Z, LANE_X,
} from './constants.js';

// Pool de segmentos: cada uno es un "anillo" rectangular que va viajando
// del fondo del túnel hacia la cámara, y cuando pasa atrás se recicla.

const SEGMENT_LENGTH = 4;
const NUM_SEGMENTS = Math.ceil((Math.abs(SPAWN_Z) + Math.abs(RECYCLE_Z)) / SEGMENT_LENGTH) + 2;

let segments = [];
let group;

export function initTunnel(scene) {
  group = new THREE.Group();
  scene.add(group);

  for (let i = 0; i < NUM_SEGMENTS; i++) {
    const seg = createSegment(i);
    seg.position.z = SPAWN_Z + i * SEGMENT_LENGTH;
    group.add(seg);
    segments.push(seg);
  }

  // Piso semitransparente con líneas para sentir velocidad
  addFloor(scene);

  // Marcas de lane (3 líneas en el suelo) — guían al jugador
  addLaneMarkers(scene);
}

function createSegment(index) {
  const g = new THREE.Group();
  const alt = index % 2 === 0;
  const color = alt ? COLORS.cyan : COLORS.magenta;

  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0.85,
  });

  const halfW = TUNNEL_WIDTH / 2;
  const top = TUNNEL_HEIGHT;

  // Anillo rectangular alrededor del túnel
  const ringPts = [
    new THREE.Vector3(-halfW, 0, 0),
    new THREE.Vector3(-halfW, top, 0),
    new THREE.Vector3(halfW, top, 0),
    new THREE.Vector3(halfW, 0, 0),
    new THREE.Vector3(-halfW, 0, 0),
  ];
  const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
  g.add(new THREE.Line(ringGeo, mat));

  // Dos líneas verticales en las paredes para enfatizar profundidad
  const wallMat = new THREE.LineBasicMaterial({
    color: alt ? COLORS.magenta : COLORS.cyan,
    transparent: true,
    opacity: 0.45,
  });
  const leftLine = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-halfW, 0, -SEGMENT_LENGTH / 2),
    new THREE.Vector3(-halfW, top, -SEGMENT_LENGTH / 2),
  ]);
  const rightLine = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(halfW, 0, -SEGMENT_LENGTH / 2),
    new THREE.Vector3(halfW, top, -SEGMENT_LENGTH / 2),
  ]);
  g.add(new THREE.Line(leftLine, wallMat));
  g.add(new THREE.Line(rightLine, wallMat));

  return g;
}

function addFloor(scene) {
  const floorLength = Math.abs(SPAWN_Z) + Math.abs(RECYCLE_Z);
  const geo = new THREE.PlaneGeometry(TUNNEL_WIDTH, floorLength);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x0a0420,
    transparent: true,
    opacity: 0.75,
  });
  const floor = new THREE.Mesh(geo, mat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, (SPAWN_Z + RECYCLE_Z) / 2);
  scene.add(floor);
}

function addLaneMarkers(scene) {
  const length = Math.abs(SPAWN_Z) + Math.abs(RECYCLE_Z);
  for (const x of LANE_X) {
    const pts = [
      new THREE.Vector3(x, 0.01, SPAWN_Z),
      new THREE.Vector3(x, 0.01, RECYCLE_Z),
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0.18,
    });
    scene.add(new THREE.Line(geo, mat));
  }
}

export function updateTunnel(dt) {
  for (const seg of segments) {
    seg.position.z += TUNNEL_SPEED * dt;
    if (seg.position.z > RECYCLE_Z) {
      seg.position.z -= NUM_SEGMENTS * SEGMENT_LENGTH;
    }
  }
}
