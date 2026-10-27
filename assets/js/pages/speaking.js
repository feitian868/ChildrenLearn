/**
 * speaking.js —— 每日 10 分钟英语口语跟读
 * 12 句/天，date-seed + 365 天回避；每句 3 次机会，至少 1 次通过算完成。
 * 完成 12 句额外 +1 分（store 积分）。
 *
 * 依赖 Web Speech API：speechSynthesis 播放 + SpeechRecognition 录音。
 * 不支持 SR 的浏览器降级为「朗读 + 用户自评勾选」。
 */

import * as store from '../core/store.js';
import { hashString, mulberry32, shuffle } from '../core/rng.js';
import { speak, unlockAudio, sfxClick, sfxCorrect, sfxWrong, sfxWin } from '../core/audio.js';
import { el, clear, toast } from '../core/ui.js';

const app = document.getElementById('app');
const data = store.load();

/* ============================================================
   内容生成：复用 WORD_GROUPS（词汇）+ SENTENCE_BANK（短句）
   ------------------------------------------------------------
   低年级以单句词汇为主，高年级过渡到完整短句。
   每年级固定 12 条，同日同年级固定，365 天内内容不重复。
   ============================================================ */

import { englishGenerated, ENGLISH_BANK } from '../data/knowledge-english.js';

// 从静态题库里抽 speak 字段（一年级/二年级的静态题已经带 speak: 字段）
function pullStaticSpeeches(grade) {
  return ENGLISH_BANK.filter((q) => q.grade === grade && q.speak).map((q) => ({
    text: q.speak,
    zh: q.explain.replace(/[。！？]$/, ''),
    topic: q.topic,
    source: q.source
  }));
}

// 从 SENTENCE_BANK（englishGenerated 内部的）里抽适合高年级的短句
function pullClauses(grade, rng) {
  // 复用 englishGenerated 里的 SENTENCE_BANK（但它在函数内部），
  // 这里用硬编码副本，范围只取适合当前年级的
  const BANK = [
    // g3 短句
    { text: 'I get up at seven.', zh: '我早上七点起床。', minGrade: 3 },
    { text: 'I go to school by bus.', zh: '我乘公交车去上学。', minGrade: 3 },
    { text: 'We learn English every day.', zh: '我们每天学英语。', minGrade: 3 },
    { text: 'There are many books on the desk.', zh: '课桌上有很多书。', minGrade: 3 },
    { text: 'I watch TV in the evening.', zh: '我晚上看电视。', minGrade: 3 },
    { text: 'Spring is warm and sunny.', zh: '春天温暖又晴朗。', minGrade: 3 },
    { text: 'The bird can fly high.', zh: '鸟能飞得很高。', minGrade: 3 },
    { text: 'Elephants have long noses.', zh: '大象有长鼻子。', minGrade: 3 },
    { text: 'We have PE class on Monday.', zh: '我们星期一有体育课。', minGrade: 3 },
    { text: 'I do my homework after dinner.', zh: '晚饭后我做作业。', minGrade: 3 },
    // g4 短句
    { text: 'My father teaches English in a school.', zh: '我爸爸在学校教英语。', minGrade: 4 },
    { text: 'The cat is under the chair.', zh: '猫在椅子下面。', minGrade: 4 },
    { text: 'She wears a red dress today.', zh: '她今天穿着一条红裙子。', minGrade: 4 },
    { text: 'We wash hands before meals.', zh: '我们饭前洗手。', minGrade: 4 },
    // g5 短句（时态）
    { text: 'He went to the park yesterday.', zh: '他昨天去了公园。', minGrade: 5 },
    { text: 'I will visit my grandma tomorrow.', zh: '我明天要去看望奶奶。', minGrade: 5 },
    { text: 'She wrote a letter last night.', zh: '她昨晚写了一封信。', minGrade: 5 },
    { text: 'They will play football next Sunday.', zh: '他们下周日要踢足球。', minGrade: 5 },
    // g6 短句
    { text: 'Look! The boys are running.', zh: '看！男孩们正在跑步。', minGrade: 6 },
    { text: 'We had a picnic last weekend.', zh: '我们上周末野餐了。', minGrade: 6 },
    { text: 'There will be a football match tomorrow.', zh: '明天将有一场足球赛。', minGrade: 6 }
  ];
  const pool = BANK.filter((x) => x.minGrade <= grade);
  return shuffle(rng, pool).slice(0, 4); // 短句最多 4 条，其余用词汇填空
}

const TOTAL = 12; // 每日 12 句，约 10 分钟

/**
 * 生成当天跟读清单（每天固定，同一天内刷新不变）。
 * 用独立的 contentSig 签名做 365 天回避（与 tasks.js 的 recentQuestions 隔离）。
 */
function buildSpeakingDay(grade, dayKey) {
  const rng = mulberry32(hashString(`${dayKey}:${grade}:speaking`));
  const avoid = (data.speakingRecent || (data.speakingRecent = {}));

  const staticPool = pullStaticSpeeches(grade);
  const clausePool = grade >= 3 ? pullClauses(grade, rng) : [];

  // 按年级组合：g1-2 纯单词/短语；g3-4 单词 + 短句混；g5-6 短句为主
  const pickSet = [];
  if (grade <= 2) {
    // 低年级：12 个单词/短语
    const shuffled = shuffle(rng, staticPool);
    pickSet.push(...shuffled.slice(0, TOTAL));
  } else {
    // 中高年级：4 个短句 + 8 个单词/短语
    const wordShuf = shuffle(rng, staticPool);
    pickSet.push(...clausePool.slice(0, 4));
    pickSet.push(...wordShuf.slice(0, TOTAL - 4));
  }

  // 365 天回避：如果签名已出现过，从同池找替换
  // 注意只排除「今天之前」用过且仍在窗口内的；今天自己的记录要放过（否则刷新后一条都不剩）
  const cutoff = store.shiftDateKey(dayKey, -365);
  const tooRecent = (sig) => Boolean(avoid[sig] && avoid[sig] < dayKey && avoid[sig] >= cutoff);
  const out = [];
  const usedSig = new Set();
  for (const item of pickSet) {
    const sig = `sp:${item.text.toLowerCase()}`;
    if (tooRecent(sig)) continue;
    if (usedSig.has(sig)) continue;
    out.push({
      id: `sp-${hashString(sig).toString(36)}`,
      text: item.text,
      zh: item.zh,
      topic: item.topic,
      source: item.source,
      sig
    });
    usedSig.add(sig);
  }

  // 还不够 12？从 englishGenerated 的当天题里找 speak 字段兜底
  if (out.length < TOTAL) {
    const fallback = englishGenerated(grade, rng).filter((q) => q.speak);
    for (const q of fallback) {
      if (out.length >= TOTAL) break;
      const sig = `sp:${q.speak.toLowerCase()}`;
      if (tooRecent(sig)) continue;
      if (usedSig.has(sig)) continue;
      out.push({
        id: `sp-${hashString(sig).toString(36)}`,
        text: q.speak,
        zh: q.explain.replace(/[。！？]$/, ''),
        topic: q.topic,
        source: q.source,
        sig
      });
      usedSig.add(sig);
    }
  }

  const items = out.slice(0, TOTAL);
  // 生成即登记：明天起 365 天内不再重复出现（今天的记录由 tooRecent 放过，刷新不受影响）
  items.forEach((it) => { avoid[it.sig] = dayKey; });
  Object.keys(avoid).forEach((k) => { if (avoid[k] < cutoff) delete avoid[k]; });
  store.save(data);
  return items;
}

/* ============================================================
   主流程：列表 → 单题练习 → 完成
   ============================================================ */

const dayKey = store.todayKey();
const speakingItems = buildSpeakingDay(data.grade, dayKey);

const savedProgress = (data.speakingProgress || {})[dayKey] || {};
const progress = {
  done: new Set(Array.isArray(savedProgress.done) ? savedProgress.done : []),
  passed: new Set(Array.isArray(savedProgress.passed) ? savedProgress.passed : [])
};

/** 进度以数组形式落盘（Set 无法 JSON 序列化），并处理 12 句全过的加分 */
function persistProgress() {
  data.speakingProgress = data.speakingProgress || {};
  data.speakingProgress[dayKey] = { done: [...progress.done], passed: [...progress.passed] };
  if (progress.passed.size >= TOTAL && !(data.speakingAward || {})[dayKey]) {
    data.speakingAward = data.speakingAward || {};
    data.speakingAward[dayKey] = true;
    data.profile.points = (data.profile.points || 0) + 1;
    toast('12 句全部通过，积分 +1 🎉', 'ok');
  }
  store.save(data);
}

const SR = (() => {
  try { return new (window.SpeechRecognition || window.webkitSpeechRecognition)(); }
  catch { return null; }
})();
let srEnabled = !!SR;
if (SR) {
  SR.lang = 'en-US';
  SR.continuous = false;
  SR.interimResults = false;
  SR.maxAlternatives = 3;
}

/* ---------------- 渲染 ---------------- */

function render() {
  unlockAudio();
  clear(app);
  app.className = 'spk';
  const nodes = [
    renderTop(),
    renderIntro(),
    renderList(),
    renderControls(),
    el('dialog', { class: 'spk-dialog', id: 'spkDialog' })
  ];
  if (!srEnabled) {
    nodes.splice(1, 0, el('div', { class: 'spk-banner', html: '⚠ 本浏览器不支持语音识别（或未授权麦克风），已降级为「朗读 + 自评」模式。建议用 Chrome 浏览器。' }));
  }
  app.append(...nodes);
}

function renderTop() {
  const back = el('a', { class: 'icon-btn spk-back', href: 'index.html', text: '←' });
  const gradeText = `${data.grade}年级`;
  return el('div', { class: 'spk-top' }, [
    back,
    el('div', { class: 'spk-heading' }, [
      el('h1', { text: '英语口语跟读 🎤' }),
      el('p', { text: `${gradeText} · 12 句 · 约 10 分钟 · 每句 3 次机会` })
    ])
  ]);
}

function renderIntro() {
  return el('div', { class: 'spk-intro' }, [
    el('p', { text: '① 听一听：点「🔊 听一听」，把整句读出来' }),
    el('p', { text: '② 点「🎤 跟我读」对着麦克风说一遍' }),
    el('p', { text: '③ 判定：识别到关键词即通过；没识别到可以再试（3 次/句）' })
  ]);
}

function renderList() {
  const list = el('ul', { class: 'spk-list' });
  speakingItems.forEach((item, idx) => {
    const passed = progress.passed.has(item.id);
    const done = progress.done.has(item.id);
    list.append(el('li', { class: 'spk-item' }, [
      el('span', { class: `spk-idx ${passed ? 'ok' : done ? 'miss' : ''}`, text: `${idx + 1}` }),
      el('div', { class: 'spk-main' }, [
        el('div', { class: 'spk-text', html: highlight(item.text) }),
        el('div', { class: 'spk-zh', text: item.zh }),
        el('button', { class: 'btn spk-go', 'data-id': item.id, type: 'button', text: passed ? '✔ 已通过' : done ? '重练' : '开始' })
      ])
    ]));
  });
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.spk-go');
    if (!btn) return;
    sfxClick();
    const id = btn.dataset.id;
    const item = speakingItems.find((x) => x.id === id);
    if (item) practice(item);
  });
  return list;
}

function highlight(text) {
  // 句子里的关键词（实词）稍微高亮一下，帮学生抓重点
  const words = text.split(' ');
  const hl = words.map((w) => {
    const clean = w.replace(/[^a-zA-Z']/g, '');
    if (clean.length >= 3 && !['the', 'and', 'but', 'with', 'into', 'this', 'that', 'they', 'them', 'have', 'has', 'had', 'will', 'was', 'were', 'been', 'being'].includes(clean.toLowerCase())) {
      return `<b>${w}</b>`;
    }
    return w;
  });
  return hl.join(' ');
}

function renderControls() {
  const done = progress.passed.size;
  const allDone = done >= TOTAL;
  const bar = el('div', { class: 'spk-bar' }, [
    el('div', { class: 'spk-bar-fill', style: `width: ${(done / TOTAL) * 100}%` })
  ]);
  return el('div', { class: 'spk-foot' }, [
    bar,
    el('div', { class: 'spk-foot-text', text: `通过 ${done} / ${TOTAL} 句${allDone ? ' · 完美！' : ''}` })
  ]);
}

/* ============================================================
   单题练习：模态框 + SR 录音 + 判定
   ============================================================ */

function practice(item) {
  const dialog = document.getElementById('spkDialog');
  clear(dialog);
  dialog.className = 'spk-dialog open';

  const body = el('div', { class: 'spk-modal' }, [
    el('div', { class: 'spk-m-text', html: highlight(item.text) }),
    el('div', { class: 'spk-m-zh', text: item.zh })
  ]);
  const ctrlWrap = el('div', { class: 'spk-m-ctrls' });
  const logBox = el('div', { class: 'spk-m-log' });
  body.append(ctrlWrap, logBox);

  const listenBtn = el('button', { class: 'btn btn-primary', type: 'button' }, [el('span', { text: '🔊 听一听' })]);
  const recordBtn = el('button', { class: 'btn', type: 'button', disabled: !srEnabled }, [el('span', { text: '🎤 跟我读' })]);
  const selfBtn = !srEnabled
    ? el('button', { class: 'btn btn-outline', type: 'button' }, [el('span', { text: '✅ 我读对了（自评）' })])
    : null;
  const closeBtn = el('button', { class: 'btn btn-ghost', type: 'button' }, [el('span', { text: '返回列表' })]);
  ctrlWrap.append(listenBtn, recordBtn, selfBtn, closeBtn);

  const log = [];
  const onPass = () => {
    progress.passed.add(item.id);
    progress.done.add(item.id);
    persistProgress();
    sfxWin();
    render();
  };

  listenBtn.addEventListener('click', () => { sfxClick(); speak(item.text, 'en-US'); });
  recordBtn.addEventListener('click', () => startRecord(item, recordBtn, logBox, log, 3, onPass));
  if (selfBtn) {
    selfBtn.addEventListener('click', () => {
      sfxClick();
      progress.passed.add(item.id);
      progress.done.add(item.id);
      persistProgress();
      toast('自评通过 ✔', 'ok');
      render();
    });
  }
  closeBtn.addEventListener('click', () => { dialog.className = 'spk-dialog'; });

  dialog.append(body);
  dialog.showModal();
  setTimeout(() => speak(item.text, 'en-US'), 200);
}

function startRecord(item, recordBtn, logBox, log, attemptsLeft, onPass) {
  if (!SR) return;
  SFX(); // sfxClick
  recordBtn.disabled = true;
  recordBtn.innerHTML = '<span>🎤 录音中…</span>';
  logBox.innerHTML = '';
  const startAt = Date.now();

  const onResult = (ev) => {
    const transcript = (ev.results[0][0].transcript || '').toLowerCase();
    SR.stop();
    const passed = judge(item.text, transcript);
    log.push({ transcript, passed, time: Math.round((Date.now() - startAt) / 1000) });
    const div = el('div', { class: `spk-m-log-line ${passed ? 'ok' : 'miss'}` }, [
      el('span', { text: passed ? '✔' : '✘' }),
      el('span', { text: `"${transcript}"` }),
      el('span', { text: `${log[log.length - 1].time}s` })
    ]);
    logBox.append(div);
    recordBtn.disabled = false;
    recordBtn.innerHTML = '<span>🎤 跟我读</span>';
    if (passed) {
      sfxCorrect();
      toast('通过！🎉', 'ok');
      onPass();
    } else if (log.length >= attemptsLeft) {
      sfxWrong();
      toast('3 次未过，先跳过吧', 'warn');
      progress.done.add(item.id);
      persistProgress();
      render();
    }
  };
  const onError = () => {
    SR.stop();
    recordBtn.disabled = false;
    recordBtn.innerHTML = '<span>🎤 跟我读</span>';
    toast('没听清，再来一次', 'warn');
  };
  SR.onresult = onResult;
  SR.onerror = onError;
  SR.onend = () => {}; // 已经在 onresult 里处理
  try { SR.start(); } catch { onError(); }
}

function judge(target, transcript) {
  const t = target.toLowerCase().replace(/[^a-z'\s]/g, '').trim();
  const u = transcript.toLowerCase().replace(/[^a-z'\s]/g, '').trim();
  // 简化判定：
  // 1) 完全或几乎完全匹配（编辑距离 ≤ 总词数 × 2）
  // 2) 目标句的关键词（长度 ≥ 4 的词）至少出现一半
  if (!u) return false;
  if (t === u) return true;
  // 关键词：长度 ≥ 4 的词
  const keyWords = new Set(t.split(/\s+/).filter((w) => w.length >= 4));
  if (keyWords.size === 0) return u.includes(t); // 短句整句包含即可
  let hit = 0;
  for (const w of keyWords) if (u.includes(w)) hit++;
  return hit / keyWords.size >= 0.6;
}

/* 简单 sfxClick 别名（audio.js 已导出 sfxClick，但在脚本里用 SFX） */
function SFX() { try { sfxClick(); } catch {} }

/* 启动 */
render();
