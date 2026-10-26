/**
 * audio.js —— WebAudio 合成音效 + 浏览器朗读
 * 不依赖任何音频文件，避免 GitHub Pages 资源问题。
 */

let ctx = null;
let enabled = true;

export function setSoundEnabled(value) {
  enabled = Boolean(value);
}

export function isSoundEnabled() {
  return enabled;
}

function ensureContext() {
  if (!enabled) return null;
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** 首次用户手势时调用，解锁 iOS/Android 的音频上下文 */
export function unlockAudio() {
  const c = ensureContext();
  if (c && c.state === 'suspended') c.resume();
}

function tone(freq, delay, duration, { type = 'sine', gain = 0.12 } = {}) {
  const c = ensureContext();
  if (!c) return;
  const osc = c.createOscillator();
  const vol = c.createGain();
  const t0 = c.currentTime + delay;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  vol.gain.setValueAtTime(0.0001, t0);
  vol.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  vol.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(vol).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export function sfxClick() {
  tone(520, 0, 0.08, { type: 'triangle', gain: 0.06 });
}

export function sfxCorrect() {
  tone(660, 0, 0.14, { gain: 0.1 });
  tone(880, 0.1, 0.18, { gain: 0.1 });
}

export function sfxWrong() {
  // 非惩罚性：柔和、不带刺耳的下行音
  tone(330, 0, 0.16, { type: 'sine', gain: 0.07 });
  tone(262, 0.12, 0.2, { type: 'sine', gain: 0.06 });
}

export function sfxWin() {
  [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.1, 0.28, { gain: 0.09 }));
}

export function sfxChest() {
  [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.07, 0.3, { type: 'triangle', gain: 0.08 }));
}

export function sfxDaily() {
  [523, 587, 659, 784, 880, 1046].forEach((f, i) => tone(f, i * 0.12, 0.35, { gain: 0.08 }));
  tone(1046, 0.9, 0.6, { gain: 0.07 });
}

export function sfxTick() {
  tone(880, 0, 0.05, { type: 'square', gain: 0.035 });
}

/* ------------------------- 朗读 ------------------------- */

let speechReady = 'speechSynthesis' in window;
let voiceCache = [];

function refreshVoices() {
  if (!speechReady) return;
  try { voiceCache = window.speechSynthesis.getVoices() || []; } catch { voiceCache = []; }
}
if (speechReady) {
  refreshVoices();
  try { window.speechSynthesis.addEventListener('voiceschanged', refreshVoices); } catch { /* 忽略 */ }
}

/**
 * 选语音：只用本机可用的语音。
 * 本机没有英文语音时，en-US 只剩 Google 在线语音，在受限网络下会卡住且完全没声音，
 * 因此优先本地同语言语音，退而用任意本地语音（用中文语音读英文单词，至少有声音）。
 */
function pickVoice(lang) {
  const all = voiceCache.length ? voiceCache : (window.speechSynthesis.getVoices() || []);
  if (!all.length) return null;
  const base = String(lang).toLowerCase().split('-')[0];
  const same = all.filter((v) => v.lang && v.lang.toLowerCase().split('-')[0] === base);
  return same.find((v) => v.localService) || all.find((v) => v.localService) || same[0] || null;
}

/**
 * 真正调用 speak。
 * Chrome 在 cancel() 后立刻 speak() 会吞掉语音（只触发 start、不触发 end 甚至无声），
 * 因此必须隔开一小段再播。
 */
function speakNow(text, { lang = 'zh-CN', rate = 1, pitch = 1.1 } = {}) {
  const syn = window.speechSynthesis;
  const start = () => {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(lang);
      if (voice) {
        utter.voice = voice;
        utter.lang = voice.lang;
      } else {
        utter.lang = lang;
      }
      utter.rate = rate;
      utter.pitch = pitch;
      syn.speak(utter);
    } catch (err) {
      console.warn('[audio] 朗读失败', err);
    }
  };
  if (syn.speaking || syn.pending) {
    try { syn.cancel(); } catch { /* 忽略 */ }
    setTimeout(start, 150);
  } else {
    start();
  }
}

export function speak(text, lang = 'en-US') {
  if (!speechReady || !text) return;
  speakNow(text, { lang, rate: 0.85, pitch: 1.05 });
}

/* ------------------------- 祝贺语音 ------------------------- */

let congratsTimer = 0;

/**
 * 中文语音播报祝贺语（跟随音效开关，关闭音效时也静音）
 * @param {string} text 播报内容
 * @param {number} [delay] 延迟毫秒，避免与庆祝音效撞在一起
 */
export function speakCongrats(text, delay = 0) {
  if (!speechReady || !enabled || !text) return;
  clearTimeout(congratsTimer);
  congratsTimer = setTimeout(() => speakNow(text, { lang: 'zh-CN', rate: 1, pitch: 1.15 }), delay);
}

/** 只停止尚未开始的祝贺语音；已开始播放的不打断，避免点“继续”时把声音掐掉 */
export function stopSpeak() {
  clearTimeout(congratsTimer);
}

/**
 * 首次真实手势时解锁音频：AudioContext 若在非手势环境创建会一直 suspended，
 * 导致庆祝音效完全没声音。
 */
if (typeof window !== 'undefined') {
  const unlockOnce = () => {
    unlockAudio();
    if (speechReady && window.speechSynthesis.paused) {
      try { window.speechSynthesis.resume(); } catch { /* 忽略 */ }
    }
  };
  ['pointerdown', 'keydown', 'touchend'].forEach((ev) =>
    window.addEventListener(ev, unlockOnce, { once: true, capture: true, passive: true })
  );
}
