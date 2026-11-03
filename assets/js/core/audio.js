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

/** 供儿歌合成等模块复用同一个已解锁的 AudioContext（关闭音效时返回 null） */
export function getAudioContext() {
  return ensureContext();
}

/** tone 基础合成；portamento = 起始滑到结束频率 */
function tone(freq, delay, duration, { type = 'sine', gain = 0.12, portamento = null } = {}) {
  const c = ensureContext();
  if (!c) return;
  const osc = c.createOscillator();
  const vol = c.createGain();
  const t0 = c.currentTime + delay;

  osc.type = type;
  if (portamento) {
    // 从 portamento 滑到 freq，营造"啾"的可爱感
    osc.frequency.setValueAtTime(portamento, t0);
    osc.frequency.exponentialRampToValueAtTime(freq, t0 + duration * 0.7);
  } else {
    osc.frequency.setValueAtTime(freq, t0);
  }
  vol.gain.setValueAtTime(0.0001, t0);
  vol.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  vol.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(vol).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** 多 tone 叠加（和弦感） */
function chord(notes, delay = 0, duration = 0.2, opts = {}) {
  notes.forEach((f, i) => tone(f, delay + (opts.stagger || 0) * i, duration, opts));
}

/* ============================================================
   宠物专属音效（软萌风，给小朋友的电子合成音）
   ============================================================ */

/** 🐾 抚摸：柔和啾 + 高音甜（喵~） */
export function sfxPetPet() {
  tone(660, 0, 0.18, { type: 'sine', gain: 0.08, portamento: 880 });
  tone(990, 0.12, 0.22, { type: 'sine', gain: 0.06, portamento: 1200 });
}

/** 🍪 喂养：短促"吧唧" + 下一个音表示饱了 */
export function sfxPetEat() {
  // 吧唧嘴声：短促的三角波 + 滑音
  tone(520, 0, 0.08, { type: 'triangle', gain: 0.12, portamento: 780 });
  tone(650, 0.12, 0.1, { type: 'triangle', gain: 0.1, portamento: 500 });
  // 满足感小和弦
  tone(784, 0.24, 0.2, { gain: 0.07 });
  tone(988, 0.28, 0.2, { gain: 0.06 });
}

/** 🎾 玩耍：活泼三连跳音 + 球弹跳 */
export function sfxPetPlay() {
  // 跳 1 跳 2 跳 3 成功
  tone(520, 0, 0.1, { type: 'square', gain: 0.05 });
  tone(660, 0.1, 0.1, { type: 'square', gain: 0.05 });
  tone(880, 0.2, 0.1, { type: 'square', gain: 0.06 });
  // 叮！接到了
  tone(1320, 0.35, 0.25, { type: 'sine', gain: 0.08, portamento: 880 });
}

/** 🛁 清洁：水滴 + 泡泡 pop */
export function sfxPetClean() {
  // 3 颗水滴
  [0, 0.1, 0.2].forEach((d, i) => {
    tone(880 + i * 120, d, 0.12, { type: 'sine', gain: 0.07, portamento: 440 + i * 80 });
  });
  // 泡泡破的高频
  tone(1760, 0.32, 0.08, { type: 'sine', gain: 0.05 });
  tone(1980, 0.36, 0.08, { type: 'sine', gain: 0.05 });
  // 满足的长音
  tone(660, 0.45, 0.3, { type: 'sine', gain: 0.06 });
}

/** 🎉 升级：闪亮上扬 5 音琶音 */
export function sfxPetLevelUp() {
  [523, 659, 784, 1046, 1318].forEach((f, i) => {
    tone(f, i * 0.08, 0.2, { gain: 0.09, type: 'triangle' });
  });
  // 最后一个低音定音
  tone(1568, 0.5, 0.35, { gain: 0.08 });
}

/** 😴 打哈欠：滑音从高到低（懒洋洋） */
export function sfxPetYawn() {
  tone(1100, 0, 0.6, { type: 'sine', gain: 0.05, portamento: 520 });
}

/** 🐾 走路：轻轻"嗒嗒"两步 */
export function sfxPetWalk() {
  tone(200, 0, 0.05, { type: 'square', gain: 0.025 });
  tone(220, 0.15, 0.05, { type: 'square', gain: 0.025 });
}

/** 💝 心情好：小鸟欢叫（两个快速滑音） */
export function sfxPetHappy() {
  tone(880, 0, 0.12, { type: 'sine', gain: 0.07, portamento: 1320 });
  tone(1100, 0.14, 0.12, { type: 'sine', gain: 0.07, portamento: 1600 });
  tone(880, 0.28, 0.14, { type: 'sine', gain: 0.06, portamento: 1320 });
}

/** 😢 心情差：低沉慢音（温柔安慰感，不刺耳） */
export function sfxPetSad() {
  tone(440, 0, 0.3, { type: 'sine', gain: 0.06, portamento: 330 });
  tone(330, 0.25, 0.35, { type: 'sine', gain: 0.05, portamento: 262 });
}

/** 🎁 解锁装饰/乐园：闪亮叮 */
export function sfxPetUnlock() {
  tone(1046, 0, 0.15, { type: 'triangle', gain: 0.08 });
  tone(1318, 0.08, 0.15, { type: 'triangle', gain: 0.07 });
  tone(1568, 0.16, 0.2, { type: 'triangle', gain: 0.06 });
}

/* ---------- 扩展互动反馈音效 ---------- */

/** 🐾 撒娇/低鸣（心情差/饥饿）：柔滑下降 + 微弱颤音 */
export function sfxPetWhine() {
  tone(660, 0, 0.45, { type: 'sine', gain: 0.06, portamento: 392 });
  tone(520, 0.3, 0.3, { type: 'sine', gain: 0.04, portamento: 330 });
}

/** ❌ 拒绝/不行（次数用完/没食物）：两个短促下降软音 */
export function sfxPetNo() {
  tone(440, 0, 0.12, { type: 'triangle', gain: 0.06, portamento: 330 });
  tone(330, 0.14, 0.14, { type: 'triangle', gain: 0.05, portamento: 247 });
}

/** 🫧 脱下装饰：高频啵声 */
export function sfxPetPop() {
  tone(1760, 0, 0.08, { type: 'sine', gain: 0.07, portamento: 2200 });
  tone(1320, 0.06, 0.1, { type: 'sine', gain: 0.05 });
}

/** ✨ 升级闪光：高频三角波短琶音（叠加在 levelUp 上） */
export function sfxPetSparkle() {
  [1318, 1568, 2093].forEach((f, i) =>
    tone(f, i * 0.05, 0.14, { type: 'triangle', gain: 0.05 })
  );
}

/** 🐤 吱啾（开心的小互动）：快速双滑音 */
export function sfxPetChirp() {
  tone(1320, 0, 0.08, { type: 'sine', gain: 0.05, portamento: 1760 });
  tone(1760, 0.07, 0.08, { type: 'sine', gain: 0.045, portamento: 2200 });
}

/** 🦴 啃食（吃的过程中）：两个软短咔 */
export function sfxPetBite() {
  tone(880, 0, 0.06, { type: 'triangle', gain: 0.07, portamento: 660 });
  tone(990, 0.18, 0.06, { type: 'triangle', gain: 0.06, portamento: 740 });
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
 * prefer 用于宠物童声：按名字优先匹配小朋友/女声语音（如 Microsoft Yaoyao）。
 */
const FEMALE_HINTS = ['yaoyao', 'huihui', 'xiaoxiao', 'xiaoyi', 'ting-ting', 'tingting',
  'meijia', 'mei-jia', 'sin-ji', 'hanhan', 'lili', 'female', 'girl', '女'];
const MALE_HINTS = ['kangkang', 'david', 'yunxi', 'yunjian', 'li-mu', 'male', '男'];

function pickVoice(lang, prefer = []) {
  const all = voiceCache.length ? voiceCache : (window.speechSynthesis.getVoices() || []);
  if (!all.length) return null;
  const base = String(lang).toLowerCase().split('-')[0];
  const same = all.filter((v) => v.lang && v.lang.toLowerCase().split('-')[0] === base);
  const localSame = same.filter((v) => v.localService);
  const pool = localSame.length ? localSame : same;
  const nameOf = (v) => (v.name || '').toLowerCase();

  for (const hint of prefer) {
    const hit = pool.find((v) => nameOf(v).includes(hint));
    if (hit) return hit;
  }
  const female = pool.find((v) => FEMALE_HINTS.some((h) => nameOf(v).includes(h)));
  if (female) return female;
  const notMale = pool.find((v) => !MALE_HINTS.some((h) => nameOf(v).includes(h)));
  return pool[0] || notMale || all.find((v) => v.localService) || null;
}

/**
 * 真正调用 speak。
 * Chrome 在 cancel() 后立刻 speak() 会吞掉语音（只触发 start、不触发 end 甚至无声），
 * 因此必须隔开一小段再播。
 */
function speakNow(text, { lang = 'zh-CN', rate = 1, pitch = 1.1, voice: preset } = {}) {
  const syn = window.speechSynthesis;
  const start = () => {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      const voice = preset || pickVoice(lang);
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

/* ------------------------- 宠物童声台词 ------------------------- */

let petSpeechTimer = 0;

// 优先挑本机的小朋友/女声语音（Windows 自带 Microsoft Yaoyao 即中文童声）
const CHILD_VOICE_HINTS = ['yaoyao', 'xiaoyi', 'xiaoxiao', 'ting-ting', 'tingting',
  'meijia', 'mei-jia', 'child', 'kid', 'girl', '女'];

/**
 * 宠物说童声台词（抚摸/喂养/玩耍/清洁/戴装饰等）
 * 若本机有小朋友语音（如 Microsoft Yaoyao）直接用，只轻微升调；
 * 没有童声时退回女声并把音高拉高，尽量接近奶音。跟随音效开关。
 * 连续点击时 cancel 掉上一句，只保留最新一句，避免声音叠加。
 * @param {string} text 台词
 * @param {number} [delay] 延迟毫秒，用来错开音效
 */
export function speakPet(text, delay = 0) {
  if (!speechReady || !enabled || !text) return;
  clearTimeout(petSpeechTimer);
  petSpeechTimer = setTimeout(() => {
    const voice = pickVoice('zh-CN', CHILD_VOICE_HINTS);
    const isChildVoice = !!voice && /yaoyao|xiaoyi|xiaoxiao|child|kid|girl/i.test(voice.name || '');
    speakNow(text, {
      lang: 'zh-CN',
      voice,
      rate: isChildVoice ? 1.06 : 1.16,
      pitch: isChildVoice ? 1.3 : 1.85,
    });
  }, delay);
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
