import { getActiveObstacles, startDeath } from './obstacles.js';
import { getPlayerPosition } from './player.js';
import { PLAYER_Z, COMBO_TIERS } from './constants.js';
import { state } from './state.js';
import { emit } from './events.js';

// Colisión simple por proximidad en X y Z. No usamos Box3 porque sabemos
// los tamaños de antemano; un AABB esférico aproximado es suficiente.

const HIT_DZ = 0.7;
const HIT_DX = 0.7;

export function initCollisions() {
  // Nada que inicializar (las dependencias se importan directamente).
}

function getMultiplier(combo) {
  for (const tier of COMBO_TIERS) {
    if (combo >= tier.min) return tier.mult;
  }
  return 1;
}

export function updateCollisions() {
  const pPos = getPlayerPosition();
  const obstacles = getActiveObstacles();

  for (const obj of obstacles) {
    if (obj.scored) continue;
    const oz = obj.group.position.z;
    const ox = obj.group.position.x;

    const dz = Math.abs(oz - pPos.z);
    const dx = Math.abs(ox - pPos.x);

    if (dz < HIT_DZ && dx < HIT_DX) {
      if (obj.type === 'target') registerHit(obj);
      else registerHazardHit(obj);
    } else if (oz > pPos.z + HIT_DZ) {
      // Pasó al jugador sin colisionar
      if (obj.type === 'target') registerMissedTarget(obj);
      else obj.scored = true; // hazard esquivado: nada que hacer
    }
  }
}

function registerHit(obj) {
  const mult = getMultiplier(state.combo);
  state.score += 10 * mult;
  state.combo += 1;
  state.hits += 1;
  if (state.combo > state.bestCombo) state.bestCombo = state.combo;
  emit('hit', { score: state.score, combo: state.combo, mult, obj });
  startDeath(obj);
  console.log(`[hit] +${10 * mult} score=${state.score} combo=${state.combo}`);
}

function registerHazardHit(obj) {
  state.combo = 0;
  state.lives -= 1;
  state.misses += 1;
  emit('miss', { lives: state.lives, obj });
  startDeath(obj);
  console.log(`[miss] hazard lives=${state.lives}`);
  if (state.lives <= 0) emit('gameover', { score: state.score });
}

function registerMissedTarget(obj) {
  obj.scored = true;
  state.combo = 0;
  emit('missedtarget', { obj });
  console.log('[miss] target sin pegar');
}

export function getScore() { return state.score; }
export function getCombo() { return state.combo; }
export function getLives() { return state.lives; }
