// Constantes globales del juego. Cambiar acá afecta a todo.

export const TUNNEL_SPEED = 28;          // unidades por segundo (hardcore)
export const TUNNEL_WIDTH = 4;           // ancho visible del túnel
export const TUNNEL_HEIGHT = 3.5;

// 3 lanes más juntas para que un golpe corto te lleve de borde a borde en mobile
export const LANE_X = [-1.2, 0, 1.2];

// Zonas del túnel sobre el eje Z
export const SPAWN_Z = -45;              // dónde aparecen los obstáculos (lejos)
export const RECYCLE_Z = 6;              // dónde se reciclan (detrás de la cámara)
export const PLAYER_Z = 0;               // posición Z del player

export const MAX_LIVES = 3;

export const COLORS = {
  cyan: 0x00ffff,
  magenta: 0x9d00ff,
  bgDeep: 0x05021a,
  target: 0x00d4ff,
  hazard: 0xff0033,
  player: 0xffffff,
};

// Multiplicador de combo: x1, x2, x3, x5 según combo actual.
export const COMBO_TIERS = [
  { min: 60, mult: 5 },
  { min: 30, mult: 3 },
  { min: 10, mult: 2 },
  { min: 0, mult: 1 },
];

// Cuánto antes de que la nota llegue al player tenemos que spawnearla.
// Se calcula a partir de la distancia y la velocidad del túnel.
export const LOOKAHEAD_SECONDS = (Math.abs(SPAWN_Z) + Math.abs(PLAYER_Z)) / TUNNEL_SPEED;
