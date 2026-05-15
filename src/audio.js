import * as Tone from 'tone';

// Wrapper de Tone.js. Si existe public/songs/song1.mp3 lo reproducimos,
// si no, fallback a un metrónomo a 120 BPM. En ambos casos getCurrentTime()
// devuelve Tone.Transport.seconds — timing preciso.

const DEFAULT_BPM = 120;
const DEFAULT_DURATION = 30;   // duración del fallback metrónomo

let songLoaded = false;
let player = null;
let metronomeScheduled = false;
let duration = DEFAULT_DURATION;
let bpm = DEFAULT_BPM;
let onEndCb = null;

export async function initAudio(songPath = '/songs/song1.mp3') {
  Tone.Transport.bpm.value = bpm;

  // Probamos si el .mp3 existe — un HEAD a Vite responde 404 si no está
  let songExists = false;
  try {
    const r = await fetch(songPath, { method: 'HEAD' });
    songExists = r.ok && (r.headers.get('content-type') || '').includes('audio');
  } catch {
    songExists = false;
  }

  if (songExists) {
    try {
      player = new Tone.Player(songPath).toDestination();
      await Tone.loaded();
      player.sync().start(0);
      duration = player.buffer?.duration || DEFAULT_DURATION;
      songLoaded = true;
      console.log(`[audio] Canción cargada: ${songPath} (${duration.toFixed(1)}s)`);
    } catch (e) {
      console.warn('[audio] No se pudo cargar la canción, uso metrónomo', e);
      songLoaded = false;
    }
  } else {
    console.log('[audio] No hay song1.mp3, usando metrónomo fallback @ 120 BPM');
  }

  if (!songLoaded && !metronomeScheduled) {
    const synth = new Tone.MembraneSynth({
      pitchDecay: 0.04,
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.08 },
    }).toDestination();
    synth.volume.value = -14;
    Tone.Transport.scheduleRepeat((time) => {
      synth.triggerAttackRelease('C2', '16n', time);
    }, '4n');
    metronomeScheduled = true;
    duration = DEFAULT_DURATION;
  }
}

export async function playSong() {
  // Tone.start() requiere user gesture (lo llamamos desde el handler del PLAY)
  await Tone.start();
  Tone.Transport.stop();
  Tone.Transport.position = 0;

  // Re-sincronizar el player si está cargado (sin borrar los scheduleRepeat)
  if (songLoaded && player) {
    player.unsync();
    player.sync().start(0);
  }

  Tone.Transport.start();
  console.log('[audio] Transport started');
}

export function pause() {
  if (Tone.Transport.state === 'started') Tone.Transport.pause();
}

export function resume() {
  if (Tone.Transport.state === 'paused') Tone.Transport.start();
}

export function stop() {
  Tone.Transport.stop();
}

export function getCurrentTime() {
  return Tone.Transport.seconds;
}

export function isPlaying() {
  return Tone.Transport.state === 'started';
}

export function getDuration() {
  return duration;
}

export function setOnEnd(cb) {
  onEndCb = cb;
}

export function tickAudio() {
  if (onEndCb && Tone.Transport.state === 'started' && Tone.Transport.seconds >= duration) {
    const cb = onEndCb;
    onEndCb = null;
    cb();
  }
}
