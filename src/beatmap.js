import { LOOKAHEAD_SECONDS } from './constants.js';
import { spawnObject, clearObstacles } from './obstacles.js';
import { getCurrentTime, getDuration } from './audio.js';

// Loader del JSON con notas + dispatch a obstáculos.
// La clave es el "look-ahead": spawneamos la nota antes para que llegue
// al player exactamente en note.time.

let beatmap = null;
let nextNoteIndex = 0;

export async function loadBeatmap(songId = 'song1') {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}beatmaps/${songId}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    beatmap = await res.json();
    nextNoteIndex = 0;
    console.log(`[beatmap] ${beatmap.notes.length} notas, duración ${beatmap.duration}s, lookahead ${LOOKAHEAD_SECONDS.toFixed(2)}s`);
    return beatmap;
  } catch (e) {
    console.error('[beatmap] No se pudo cargar', e);
    beatmap = null;
    return null;
  }
}

export function resetBeatmap() {
  nextNoteIndex = 0;
  clearObstacles();
}

export function updateBeatmap() {
  if (!beatmap) return;
  const t = getCurrentTime();
  while (nextNoteIndex < beatmap.notes.length) {
    const note = beatmap.notes[nextNoteIndex];
    if (note.time - LOOKAHEAD_SECONDS <= t) {
      spawnObject(note.type, note.lane, note.time);
      nextNoteIndex++;
    } else {
      break;
    }
  }
}

export function getBeatmap() {
  return beatmap;
}

export function getProgress() {
  const t = getCurrentTime();
  const dur = beatmap?.duration || getDuration() || 1;
  return Math.min(1, t / dur);
}

export function isFinished() {
  if (!beatmap) return false;
  return getCurrentTime() >= beatmap.duration && nextNoteIndex >= beatmap.notes.length;
}

export function getTargetCount() {
  if (!beatmap) return 0;
  return beatmap.notes.filter(n => n.type === 'target').length;
}
