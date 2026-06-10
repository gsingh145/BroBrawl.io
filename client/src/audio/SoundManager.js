let ctx = null;
let musicNode = null;
let musicGain = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playBuffer(buf, vol = 1) {
  const c = getCtx();
  const s = c.createBufferSource();
  s.buffer = buf;
  const g = c.createGain();
  g.gain.value = vol;
  s.connect(g).connect(c.destination);
  s.start();
}

function noiseBuffer(len, gain = 0.3) {
  const c = getCtx();
  const sr = c.sampleRate;
  const buf = c.createBuffer(1, sr * len, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * gain * (1 - i / d.length);
  return buf;
}

function toneBuffer(freq, len, type = 'square', gain = 0.2) {
  const c = getCtx();
  const sr = c.sampleRate;
  const buf = c.createBuffer(1, sr * len, sr);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / sr;
    const env = 1 - i / d.length;
    let v = 0;
    if (type === 'square') v = Math.sign(Math.sin(2 * Math.PI * freq * t));
    else if (type === 'sawtooth') v = 2 * (freq * t - Math.floor(freq * t + 0.5));
    else v = Math.sin(2 * Math.PI * freq * t);
    d[i] = v * env * gain;
  }
  return buf;
}

// Generated fallback music
function lobbyMusic() {
  const bpm = 100;
  const spb = 60 / bpm;
  const beats = 8;
  const duration = spb * beats;
  return makeLoopBuffer(duration, (d, sr, len, dur) => {
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const beat = (t / spb) % beats;
      const beatPhase = (t % spb) / spb;
      let sample = 0;
      const padFreqs = [130.81, 164.81, 196.00];
      for (const f of padFreqs) {
        const env = Math.min(1, (t % spb) * 4) * (1 - (t % spb) / spb * 0.3);
        sample += Math.sin(2 * Math.PI * f * t) * env * 0.06;
        sample += Math.sin(2 * Math.PI * f * 0.5 * t) * env * 0.03;
      }
      if (Math.floor(beat) % 4 === 0) {
        const kEnv = Math.exp(-beatPhase * 20);
        sample += Math.sin(2 * Math.PI * 80 * Math.exp(-beatPhase * 8) * t) * kEnv * 0.2;
      }
      if (beatPhase > 0.45 && beatPhase < 0.55) {
        sample += (Math.random() * 2 - 1) * 0.04;
      }
      const bassFreq = [130.81, 130.81, 164.81, 130.81][Math.floor(beat) % 4];
      const bEnv = Math.exp(-beatPhase * 6);
      sample += Math.sin(2 * Math.PI * bassFreq * t) * bEnv * 0.08;
      d[i] = sample;
    }
  });
}

function battleMusic() {
  const bpm = 130;
  const spb = 60 / bpm;
  const beats = 16;
  const duration = spb * beats;
  return makeLoopBuffer(duration, (d, sr, len, dur) => {
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const beat = (t / spb) % beats;
      const beatPhase = (t % spb) / spb;
      let sample = 0;
      const bassNotes = [110, 110, 130.81, 110, 146.83, 146.83, 130.81, 110,
                          98, 98, 110, 98, 130.81, 130.81, 110, 98];
      const bf = bassNotes[Math.floor(beat)];
      const bEnv = Math.exp(-beatPhase * 8);
      sample += Math.sign(Math.sin(2 * Math.PI * bf * t)) * bEnv * 0.12;
      if (Math.floor(beat) % 2 === 0) {
        const kEnv = Math.exp(-beatPhase * 15);
        sample += Math.sin(2 * Math.PI * 60 * Math.exp(-beatPhase * 6) * t) * kEnv * 0.25;
      }
      if (Math.floor(beat) === 4 || Math.floor(beat) === 12) {
        const sEnv = Math.exp(-beatPhase * 12);
        sample += (Math.random() * 2 - 1) * sEnv * 0.15;
      }
      if (beatPhase > 0.45 && beatPhase < 0.55 || beatPhase > 0.95 && beatPhase < 1.0) {
        sample += (Math.random() * 2 - 1) * 0.05;
      }
      const arpFreqs = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 261.63, 329.63];
      const af = arpFreqs[Math.floor(beat * 2) % arpFreqs.length];
      const aEnv = 0.5 + 0.5 * Math.sin(beatPhase * Math.PI);
      sample += Math.sin(2 * Math.PI * af * t) * aEnv * 0.04 * (1 - 0.5 * Math.sin(beatPhase * Math.PI));
      d[i] = Math.max(-0.5, Math.min(0.5, sample));
    }
  });
}

function makeLoopBuffer(duration, fn) {
  const c = getCtx();
  const sr = c.sampleRate;
  const len = sr * duration;
  const buf = c.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  fn(d, sr, len, duration);
  return buf;
}

let sounds = null;
let mp3Lobby = null;
const mp3Battle = [];

export async function loadMusic() {
  const c = getCtx();
  try {
    const r1 = await fetch('/audio/lobby.mp3');
    mp3Lobby = await c.decodeAudioData(await r1.arrayBuffer());
  } catch { /* fallback */ }
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(`/audio/battle_${i}.mp3`);
      if (!r.ok) break;
      mp3Battle.push(await c.decodeAudioData(await r.arrayBuffer()));
    } catch { break; }
  }
}

export function initSounds() {
  if (sounds) return sounds;
  const c = getCtx();
  sounds = {
    hit: noiseBuffer(0.12, 0.25),
    attack: noiseBuffer(0.08, 0.15),
    jump: toneBuffer(260, 0.12, 'sine', 0.15),
    dash: noiseBuffer(0.1, 0.12),
    shield: toneBuffer(800, 0.06, 'square', 0.1),
    select: toneBuffer(600, 0.05, 'sine', 0.12),
    confirm: toneBuffer(440, 0.08, 'sine', 0.15),
    ko: (() => {
      const sr = c.sampleRate;
      const buf = c.createBuffer(1, sr * 0.6, sr);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        const env = 1 - i / d.length;
        const f = 300 - t * 300;
        d[i] = Math.sign(Math.sin(2 * Math.PI * f * t)) * env * 0.25;
      }
      return buf;
    })(),
    die: (() => {
      const sr = c.sampleRate;
      const buf = c.createBuffer(1, sr * 0.4, sr);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        const env = 1 - i / d.length;
        const f = 200 + t * 400;
        d[i] = (Math.random() * 2 - 1) * env * 0.2;
      }
      return buf;
    })(),
    musicLobby: lobbyMusic(),
    musicBattle: battleMusic(),
  };
  return sounds;
}

export function playSound(name, vol) {
  const s = initSounds()[name];
  if (s) playBuffer(s, vol);
}

export function startMusic(type, trackIndex) {
  stopMusic();
  const c = getCtx();
  let buf;
  if (type === 'battle') {
    const pool = mp3Battle.length ? mp3Battle : [initSounds().musicBattle];
    buf = (trackIndex != null && pool[trackIndex]) ? pool[trackIndex] : pool[Math.floor(Math.random() * pool.length)];
  } else {
    buf = mp3Lobby || initSounds().musicLobby;
  }
  if (!buf) return;
  musicNode = c.createBufferSource();
  musicNode.buffer = buf;
  musicNode.loop = true;
  musicGain = c.createGain();
  musicGain.gain.value = 0.4;
  musicNode.connect(musicGain).connect(c.destination);
  musicNode.start();
}

export function stopMusic() {
  if (musicNode) {
    try { musicNode.stop(); } catch {}
    try { musicNode.disconnect(); } catch {}
    musicNode = null;
  }
}
