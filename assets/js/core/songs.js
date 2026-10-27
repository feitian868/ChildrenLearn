/**
 * songs.js —— 儿歌播放器
 * 用 WebAudio 现场合成旋律，不需要任何音频文件，离线也能听。
 *
 * 曲谱格式：[音名, 拍数]，音名如 'C4' / 'F#4'，'R' 表示休止。
 */

import { getAudioContext, isSoundEnabled, unlockAudio } from './audio.js';

const SEMITONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** 音名转频率，例如 C4 → 261.63 */
export function freqOf(name) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(String(name));
  if (!m) return 0;
  const semis = SEMITONE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const midi = (Number(m[3]) + 1) * 12 + semis;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export const SONGS = [
  {
    id: 'twinkle',
    name: '小星星',
    emoji: '⭐',
    tempo: 104,
    tip: '一闪一闪亮晶晶，满天都是小星星。',
    notes: [
      ['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 2],
      ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 1], ['D4', 1], ['C4', 2],
      ['G4', 1], ['G4', 1], ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 2],
      ['G4', 1], ['G4', 1], ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 2],
      ['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 2],
      ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 1], ['D4', 1], ['C4', 2]
    ]
  },
  {
    id: 'two-tigers',
    name: '两只老虎',
    emoji: '🐯',
    tempo: 120,
    tip: '两只老虎，两只老虎，跑得快，跑得快。',
    notes: [
      ['C4', 1], ['D4', 1], ['E4', 1], ['C4', 1],
      ['C4', 1], ['D4', 1], ['E4', 1], ['C4', 1],
      ['E4', 1], ['F4', 1], ['G4', 2],
      ['E4', 1], ['F4', 1], ['G4', 2],
      ['G4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F4', 0.5], ['E4', 1], ['C4', 1],
      ['G4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F4', 0.5], ['E4', 1], ['C4', 1],
      ['C4', 1], ['G3', 1], ['C4', 2],
      ['C4', 1], ['G3', 1], ['C4', 2]
    ]
  },
  {
    id: 'mary-lamb',
    name: '玛丽有只小羊羔',
    emoji: '🐑',
    tempo: 108,
    tip: '玛丽有只小羊羔，雪白羊毛真漂亮。',
    notes: [
      ['E4', 1], ['D4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['E4', 1], ['E4', 2],
      ['D4', 1], ['D4', 1], ['D4', 2], ['E4', 1], ['G4', 1], ['G4', 2],
      ['E4', 1], ['D4', 1], ['C4', 1], ['D4', 1], ['E4', 1], ['E4', 1], ['E4', 1], ['E4', 1],
      ['D4', 1], ['D4', 1], ['E4', 1], ['D4', 1], ['C4', 2]
    ]
  },
  {
    id: 'birthday',
    name: '生日快乐',
    emoji: '🎂',
    tempo: 100,
    tip: '祝你生日快乐，祝你生日快乐！',
    notes: [
      ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
      ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
      ['G4', 0.75], ['G4', 0.25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
      ['F5', 0.75], ['F5', 0.25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2]
    ]
  }
];

export const SONG_MAP = Object.fromEntries(SONGS.map((s) => [s.id, s]));

/** 弹一个单音（小小钢琴用） */
export function playNote(name, dur = 0.55, { type = 'triangle', gain = 0.09 } = {}) {
  unlockAudio();
  const ctx = getAudioContext();
  const freq = freqOf(name);
  if (!ctx || !freq || !isSoundEnabled()) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  vol.gain.setValueAtTime(0.0001, t0);
  vol.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  vol.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(vol).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/**
 * 播放一首儿歌
 * @param {string|object} song 曲目 id 或对象
 * @param {object} [opts]
 * @param {(i:number, name:string) => void} [opts.onNote] 每个音开始时回调
 * @param {() => void} [opts.onEnd] 播完回调
 * @returns {{ stop: () => void, duration: number }}
 */
export function playSong(song, { onNote, onEnd } = {}) {
  const item = typeof song === 'string' ? (SONG_MAP[song] || SONGS[0]) : (song || SONGS[0]);
  unlockAudio();
  const ctx = getAudioContext();
  const master = ctx ? ctx.createGain() : null;
  if (master) {
    master.gain.value = isSoundEnabled() ? 1 : 0;
    master.connect(ctx.destination);
  }

  const beat = 60 / (item.tempo || 100);
  const timers = [];
  let cursor = 0; // 秒
  const base = ctx ? ctx.currentTime + 0.09 : 0;

  item.notes.forEach(([name, beats], i) => {
    const dur = Math.max(0.08, (beats || 1) * beat);
    if (name !== 'R' && master) {
      const freq = freqOf(name);
      if (freq) {
        const osc = ctx.createOscillator();
        const vol = ctx.createGain();
        const s = base + cursor;
        const e = s + dur * 0.9;
        osc.type = item.tone || 'triangle';
        osc.frequency.setValueAtTime(freq, s);
        vol.gain.setValueAtTime(0.0001, s);
        vol.gain.exponentialRampToValueAtTime(0.11, s + Math.min(0.05, dur / 3));
        vol.gain.exponentialRampToValueAtTime(0.0001, e);
        osc.connect(vol).connect(master);
        osc.start(s);
        osc.stop(e + 0.04);
      }
    }
    const at = cursor * 1000;
    timers.push(setTimeout(() => { if (name !== 'R') onNote?.(i, name); }, at));
    cursor += dur;
  });

  const duration = cursor;
  let stopped = false;
  const cleanup = () => {
    timers.forEach(clearTimeout);
    timers.length = 0;
    if (master) {
      try { master.gain.value = 0; } catch { /* 忽略 */ }
      setTimeout(() => { try { master.disconnect(); } catch { /* 忽略 */ } }, 80);
    }
  };
  timers.push(setTimeout(() => {
    if (!stopped) onEnd?.();
  }, duration * 1000 + 120));

  return {
    duration,
    stop() {
      if (stopped) return;
      stopped = true;
      cleanup();
    }
  };
}
