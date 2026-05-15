import * as Tone from 'tone';

// Track electrónico sintetizado en vivo con Tone.js — sin descarga.
// 120 BPM, progresión Cm - Ab - Eb - Bb (4 compases, en loop), 4/4.
// Cada compás dura 2s, el beatmap está alineado a ese grid.

let started = false;
let parts = [];

export function buildSynthTrack() {
  if (started) return;
  started = true;

  // ---------- Voces ----------
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.04,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.35, sustain: 0.01, release: 0.4 },
  }).toDestination();
  kick.volume.value = -6;

  const snare = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.18, sustain: 0 },
  }).toDestination();
  snare.volume.value = -16;

  const hat = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.06, release: 0.01 },
    harmonicity: 5.1,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5,
  }).toDestination();
  hat.volume.value = -28;

  const bass = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.2 },
    filter: { Q: 4, type: 'lowpass', frequency: 700 },
    filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.5, baseFrequency: 200, octaves: 3 },
  }).toDestination();
  bass.volume.value = -10;

  // Delay para el arp para que tenga un eco synthwave
  const delay = new Tone.PingPongDelay({ delayTime: '8n', feedback: 0.32, wet: 0.3 }).toDestination();
  const arp = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.002, decay: 0.12, sustain: 0.05, release: 0.18 },
    volume: -18,
  }).connect(delay);

  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.6, decay: 0.3, sustain: 0.4, release: 1.4 },
    volume: -24,
  }).toDestination();

  // ---------- Patrones ----------
  // Kick four-on-the-floor
  parts.push(new Tone.Loop((t) => {
    kick.triggerAttackRelease('C1', '8n', t);
  }, '4n').start(0));

  // Snare en beats 2 y 4
  parts.push(new Tone.Loop((t) => {
    snare.triggerAttackRelease('16n', t);
  }, '2n').start('4n'));

  // Hi-hat: 8th notes off-beat
  parts.push(new Tone.Loop((t) => {
    hat.triggerAttackRelease('C6', '32n', t, 0.5);
  }, '8n').start('8n'));

  // Progresión de acordes (1 acorde por compás): Cm - Ab - Eb - Bb
  const chords = [
    ['C3', 'Eb3', 'G3'],
    ['Ab2', 'C3', 'Eb3'],
    ['Eb3', 'G3', 'Bb3'],
    ['Bb2', 'D3', 'F3'],
  ];

  parts.push(new Tone.Sequence((t, chord) => {
    pad.triggerAttackRelease(chord, '1m', t);
  }, chords, '1m').start(0));

  // Bass: nota raíz de cada acorde, ritmo ostinato
  const bassPattern = ['C2', null, 'C2', 'C2', 'Ab1', null, 'Ab1', 'Ab1',
                       'Eb2', null, 'Eb2', 'Eb2', 'Bb1', null, 'Bb1', 'Bb1'];
  parts.push(new Tone.Sequence((t, note) => {
    if (note) bass.triggerAttackRelease(note, '16n', t);
  }, bassPattern, '8n').start(0));

  // Arpegio: 16th notes que recorren cada acorde
  const arpPattern = [
    'C5', 'Eb5', 'G4', 'C5', 'Eb5', 'G5', 'Eb5', 'C5',
    'Ab4', 'C5', 'Eb5', 'C5', 'Ab4', 'Eb5', 'C5', 'Ab4',
    'Eb5', 'G5', 'Bb4', 'Eb5', 'G5', 'Bb5', 'G5', 'Eb5',
    'Bb4', 'D5', 'F5', 'Bb4', 'D5', 'F5', 'Bb4', 'F4',
  ];
  parts.push(new Tone.Sequence((t, note) => {
    arp.triggerAttackRelease(note, '32n', t, 0.6);
  }, arpPattern, '16n').start(0));

  // Master un toque más bajo para evitar clip cuando suenan todas las capas
  Tone.Destination.volume.value = -3;
}
