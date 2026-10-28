/**
 * speaking.js —— 每日英语口语跟读（三段式）
 *   ① 单词跟读：按年级 2/3/4/5 个，先听发音 → 看中文拼出单词 → 再读一遍（拼写 + 发音双通过）
 *   ② 句子跟读：每日 4 句，听示范后跟读
 *   ③ 情景对话跟读：每日 1 组，逐句跟读 A/B 台词
 * 同一天刷新内容不变；内容 365 天内优先不重复，词库用尽后按「最久未用」轮换。
 */

import * as store from '../core/store.js';
import { hashString, mulberry32, shuffle } from '../core/rng.js';
import { speak, unlockAudio, sfxClick, sfxCorrect, sfxWrong, sfxWin } from '../core/audio.js';
import { el, clear, toast } from '../core/ui.js';
import { WORD_BANK, SENTENCE_BANK, DIALOGUE_BANK } from '../data/speaking-content.js';
import { ENGLISH_BANK } from '../data/knowledge-english.js';

const app = document.getElementById('app');
const data = store.load();
const dayKey = store.todayKey();

const WORDS_PER_DAY = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 5, 6: 5 };
const SENTENCE_COUNT = 4;
const grade = data.grade;

/* ============================================================
   每日内容生成（date-seed + 365 天回避）
   ============================================================ */

const avoid = data.speakingRecent || (data.speakingRecent = {});
const cutoff = store.shiftDateKey(dayKey, -365);
const rng = mulberry32(hashString(`${dayKey}:${grade}:speaking`));

/** 365 天内用过（不含今天自己） */
const isRecent = (sig) => {
  const d = avoid[sig];
  return Boolean(d && d < dayKey && d >= cutoff);
};

/** 先取没在窗口内用过的，不够再用「最久未用」的补 */
function pickFresh(pool, count, sigOf) {
  const fresh = shuffle(rng, pool.filter((x) => !isRecent(sigOf(x))));
  const recycled = pool
    .filter((x) => isRecent(sigOf(x)))
    .sort((a, b) => (avoid[sigOf(a)] < avoid[sigOf(b)] ? -1 : 1));
  return [...fresh, ...recycled].slice(0, count);
}

/* ---------- ① 单词 ---------- */

const wordSig = (it) => `spw:${String(it.word || it.w).toLowerCase()}`;
const wordCount = WORDS_PER_DAY[grade] || 5;
const wordPool = WORD_BANK.filter((w) => w.g <= grade);
const wordItems = pickFresh(wordPool, wordCount, wordSig).map((w) => ({
  id: `w:${w.w.toLowerCase()}`,
  word: w.w,
  zh: w.zh,
  type: 'word'
}));

/* ---------- ② 句子 ---------- */

const CLAUSES = [
  { text: 'Good morning!', zh: '早上好！', minGrade: 1 },
  { text: 'How are you?', zh: '你好吗？', minGrade: 1 },
  { text: 'I am fine, thank you.', zh: '我很好，谢谢。', minGrade: 1 },
  { text: 'My name is Lily.', zh: '我叫莉莉。', minGrade: 1 },
  { text: 'This is my book.', zh: '这是我的书。', minGrade: 1 },
  { text: 'I like apples.', zh: '我喜欢苹果。', minGrade: 1 },
  { text: 'Sit down, please.', zh: '请坐下。', minGrade: 1 },
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
  { text: 'My father teaches English in a school.', zh: '我爸爸在学校教英语。', minGrade: 4 },
  { text: 'The cat is under the chair.', zh: '猫在椅子下面。', minGrade: 4 },
  { text: 'She wears a red dress today.', zh: '她今天穿着一条红裙子。', minGrade: 4 },
  { text: 'We wash hands before meals.', zh: '我们饭前洗手。', minGrade: 4 },
  { text: 'I am going to the library.', zh: '我正要去图书馆。', minGrade: 4 },
  { text: 'He went to the park yesterday.', zh: '他昨天去了公园。', minGrade: 5 },
  { text: 'I will visit my grandma tomorrow.', zh: '我明天要去看望奶奶。', minGrade: 5 },
  { text: 'She wrote a letter last night.', zh: '她昨晚写了一封信。', minGrade: 5 },
  { text: 'They will play football next Sunday.', zh: '他们下周日要踢足球。', minGrade: 5 },
  { text: 'I have finished my homework.', zh: '我已经完成作业了。', minGrade: 5 },
  { text: 'Look! The boys are running.', zh: '看！男孩们正在跑步。', minGrade: 6 },
  { text: 'We had a picnic last weekend.', zh: '我们上周末野餐了。', minGrade: 6 },
  { text: 'There will be a football match tomorrow.', zh: '明天将有一场足球赛。', minGrade: 6 },
  { text: 'If it rains, we will stay at home.', zh: '如果下雨，我们就待在家里。', minGrade: 6 },
  { text: 'She has lived here for ten years.', zh: '她在这里住了十年。', minGrade: 6 }
];

const sentenceSig = (it) => `sps:${it.text.toLowerCase()}`;
/** 三个来源合并去重：内置句子库优先，其次本页短句，最后英语题库里的短语 */
const sentencePool = (() => {
  const map = new Map();
  const push = (text, zh) => {
    const key = String(text || '').toLowerCase();
    if (key && !map.has(key)) map.set(key, { text, zh: zh || '' });
  };
  SENTENCE_BANK.filter((s) => s.g <= grade).forEach((s) => push(s.text, s.zh));
  CLAUSES.filter((c) => c.minGrade <= grade).forEach((c) => push(c.text, c.zh));
  ENGLISH_BANK
    .filter((q) => q.grade <= grade && q.speak && /\s/.test(q.speak))
    .forEach((q) => push(q.speak, (q.explain || '').replace(/[。！？]$/, '')));
  return [...map.values()];
})();
const sentenceItems = pickFresh(sentencePool, SENTENCE_COUNT, sentenceSig).map((s) => ({
  id: `s:${s.text.toLowerCase()}`,
  text: s.text,
  zh: s.zh,
  type: 'sentence'
}));

/* ---------- ③ 情景对话 ---------- */

const dialogueSig = (d) => `spd:${d.title}`;
const dialoguePool = DIALOGUE_BANK.filter((d) => d.g <= grade);
const dialogue = pickFresh(dialoguePool, 1, dialogueSig)[0] || DIALOGUE_BANK[0];
const dialogueLines = dialogue.lines.map((line, i) => ({
  id: `d${i}`,
  who: line.who,
  text: line.text,
  zh: line.zh
}));

/* 生成即登记，明天起 365 天内不再重复（今天的记录会被 isRecent 放过） */
[...wordItems, ...sentenceItems].forEach((it) => {
  avoid[it.type === 'word' ? wordSig(it) : sentenceSig(it)] = dayKey;
});
avoid[dialogueSig(dialogue)] = dayKey;
Object.keys(avoid).forEach((k) => { if (avoid[k] < cutoff) delete avoid[k]; });
store.save(data);

/* ============================================================
   进度
   ============================================================ */

const saved = (data.speakingProgress || {})[dayKey] || {};
const progress = {
  done: new Set(Array.isArray(saved.done) ? saved.done : []),
  passed: new Set(Array.isArray(saved.passed) ? saved.passed : [])
};

const totalSections = wordItems.length + sentenceItems.length + 1;
const passedSections = () =>
  wordItems.filter((i) => progress.passed.has(i.id)).length +
  sentenceItems.filter((i) => progress.passed.has(i.id)).length +
  (dialogueLines.every((l) => progress.passed.has(l.id)) ? 1 : 0);

function persist() {
  data.speakingProgress = data.speakingProgress || {};
  data.speakingProgress[dayKey] = {
    done: [...progress.done],
    passed: [...progress.passed],
    total: totalSections
  };
  if (passedSections() >= totalSections && !(data.speakingAward || {})[dayKey]) {
    data.speakingAward = data.speakingAward || {};
    data.speakingAward[dayKey] = true;
    data.profile.points = (data.profile.points || 0) + 1;
    toast('今天的跟读全部完成，积分 +1 🎉', 'ok');
  }
  store.save(data);
}

/* ============================================================
   语音识别（长按说话 / 松开停止 + 短按兜底自动停）
   ============================================================ */

const SR = (() => {
  try { return new (window.SpeechRecognition || window.webkitSpeechRecognition)(); }
  catch { return null; }
})();
const srEnabled = !!SR;
if (SR) {
  SR.lang = 'en-US';
  SR.continuous = true;       // 长按模式必须开，允许持续录音
  SR.interimResults = true;  // 显示中间识别结果
  SR.maxAlternatives = 3;
}

function judge(target, transcript) {
  const t = target.toLowerCase().replace(/[^a-z'\s]/g, '').trim();
  const u = transcript.toLowerCase().replace(/[^a-z'\s]/g, '').trim();
  if (!u) return false;
  if (t === u) return true;
  const keyWords = new Set(t.split(/\s+/).filter((w) => w.length >= 4));
  if (keyWords.size === 0) return u.includes(t);
  let hit = 0;
  keyWords.forEach((w) => { if (u.includes(w)) hit++; });
  return hit / keyWords.size >= 0.6;
}

/**
 * 长按录音：
 *   - pointerdown / touchstart → 开始录音，按钮变红色「松开结束」
 *   - pointerup / touchend / pointerleave → 停止录音，收集结果
 *   - 兜底 15 秒自动停（防止卡死）
 *   - 不支持长按的环境（PC 鼠标）：短按一次自动录 4 秒再停止
 *
 * @param {HTMLElement} btn   要绑定的按钮元素
 * @param {string}      text  目标文本（用于 judge 打分）
 * @param {function}    onResult  结束回调 ({ passed, transcript })
 */
function recordPress(btn, text, onResult) {
  if (!SR) { onResult({ passed: false, transcript: '' }); return; }

  let holding = false;
  let started = false;
  let finalTranscript = '';
  let autoStopTimer = null;
  let fallBackShortPress = false;
  const isTouch = matchMedia('(pointer: coarse)').matches;

  function resetSR() {
    SR.onresult = null;
    SR.onerror = null;
    SR.onend = null;
  }

  function startRec() {
    if (started) return;
    started = true;
    holding = true;
    finalTranscript = '';
    btn.disabled = false;
    btn.classList.add('is-recording');
    btn.textContent = '🔴 松开结束（或读完再说）';

    SR.onresult = (ev) => {
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) finalTranscript += r[0].transcript;
        else interim += r[0].transcript;
      }
      btn.textContent = interim
        ? `🔴 ${interim.slice(0, 16)}${interim.length > 16 ? '…' : ''}（松开结束）`
        : '🔴 正在听…（松开结束）';
    };
    SR.onerror = () => {
      // 只有不是我们主动 stop 的情况下才报错
      if (holding || started) finish({ passed: false, transcript: finalTranscript });
    };
    SR.onend = () => {
      // 只有不是我们主动 stop 的情况下才兜底 finish
      if (!holding && started) finish({ passed: judge(text, finalTranscript), transcript: finalTranscript });
    };

    // Chrome: 如果 SR 已经在 running，先 stop 等 300ms 再 start
    const tryStart = () => {
      try { SR.start(); }
      catch {
        // "not allowed" / "service not available" — 不可恢复
        finish({ passed: false, transcript: '' });
      }
    };
    if (SR.state === 'running' || SR.state === 'starting') {
      try { SR.stop(); } catch { /* ignore */ }
      setTimeout(tryStart, 350);
    } else {
      tryStart();
    }

    // 兜底 15 秒自动停
    autoStopTimer = setTimeout(() => {
      if (holding) {
        holding = false;
        try { SR.stop(); } catch { /* ignore */ }
      }
    }, 15000);

    // PC 无长按 → 短按后 4 秒自动停
    if (!isTouch) {
      fallBackShortPress = true;
      setTimeout(() => {
        if (holding) {
          holding = false;
          try { SR.stop(); } catch { /* ignore */ }
        }
      }, 4000);
    }
  }

  function stopRec() {
    if (!started) return;
    holding = false;
    clearTimeout(autoStopTimer);
    btn.classList.remove('is-recording');
    btn.textContent = '🎤 跟我读';
    btn.disabled = true;
    try { SR.stop(); } catch { /* ignore */ }
    // SR 停掉后可能还有最后一个 final result
    setTimeout(() => {
      btn.disabled = false;
      finish({ passed: judge(text, finalTranscript), transcript: finalTranscript });
    }, 400);
  }

  function finish(res) {
    started = false;
    holding = false;
    clearTimeout(autoStopTimer);
    btn.classList.remove('is-recording');
    btn.textContent = '🎤 跟我读';
    resetSR();
    onResult(res);
  }

  // 绑定事件
  const pd = (e) => { e.preventDefault(); startRec(); };
  const pu = (e) => { e.preventDefault(); if (started) stopRec(); };
  const pl = (e) => { if (holding) stopRec(); };

  // 触屏 + 鼠标统一用 pointer events
  btn.addEventListener('pointerdown', pd);
  btn.addEventListener('pointerup', pu);
  btn.addEventListener('pointercancel', pl);
  btn.addEventListener('pointerleave', pl);

  // 同时也保留 click 作为 PC 端的兜底短按
  btn.addEventListener('click', (e) => {
    // 如果已经通过 pointerdown 启动过，click 不再触发
    if (started || fallBackShortPress) return;
    startRec();
    // 给 PC 端 4 秒自动停
    setTimeout(() => {
      if (holding) {
        holding = false;
        try { SR.stop(); } catch { /* ignore */ }
      }
    }, 4000);
  }, { once: true });
}

/** 旧版单次录音兼容保留（list 外部入口） */
function recordOnce(btn, text, onResult) {
  recordPress(btn, text, onResult);
}

/* ============================================================
   渲染
   ============================================================ */

function render() {
  unlockAudio();
  clear(app);
  app.className = 'spk';
  const nodes = [renderTop(), renderSummary()];
  if (!srEnabled) {
    nodes.push(el('div', { class: 'spk-banner', html: '⚠ 本浏览器不支持语音识别（或未授权麦克风），跟读评分已降级为「朗读 + 自评」。建议用 Chrome 浏览器。' }));
  }
  nodes.push(
    renderWords(),
    renderSentences(),
    renderDialogue(),
    el('dialog', { class: 'spk-dialog', id: 'spkDialog' })
  );
  app.append(...nodes);
}

function renderTop() {
  return el('div', { class: 'spk-top' }, [
    el('a', { class: 'icon-btn spk-back', href: 'index.html', text: '←' }),
    el('div', { class: 'spk-heading' }, [
      el('h1', { text: '英语口语跟读 🎤' }),
      el('p', { text: `${grade}年级 · 单词 ${wordItems.length} 个 · 句子 ${sentenceItems.length} 句 · 对话 1 组` })
    ])
  ]);
}

function renderSummary() {
  const done = passedSections();
  return el('div', { class: 'spk-foot' }, [
    el('div', { class: 'spk-bar' }, [
      el('div', { class: 'spk-bar-fill', style: { width: `${Math.min(100, (done / totalSections) * 100)}%` } })
    ]),
    el('div', { class: 'spk-foot-text', text: `已完成 ${done} / ${totalSections} 项${done >= totalSections ? ' · 完美！' : ''}` })
  ]);
}

/* ---------- ① 单词列表 ---------- */

function renderWords() {
  const list = el('ul', { class: 'spk-list' });
  wordItems.forEach((item, idx) => {
    const passed = progress.passed.has(item.id);
    list.append(el('li', { class: 'spk-item' }, [
      el('span', { class: `spk-idx ${passed ? 'ok' : ''}`, text: String(idx + 1) }),
      el('div', { class: 'spk-main' }, [
        el('div', { class: 'spk-text spk-word-zh', text: item.zh }),
        el('div', { class: 'spk-zh', text: passed ? item.word : `先听发音，再拼出这个单词（${item.word.length} 个字母）` })
      ]),
      el('button', {
        class: 'btn spk-go', type: 'button', 'data-kind': 'word', 'data-id': item.id,
        text: passed ? '✔ 已完成' : '开始'
      })
    ]));
  });
  return el('section', { class: 'spk-sec' }, [
    el('h2', { class: 'spk-sec-title', text: `① 单词跟读（${wordItems.filter((i) => progress.passed.has(i.id)).length}/${wordItems.length}）` }),
    el('p', { class: 'spk-sec-desc', text: '听发音 → 看中文拼出单词 → 再读一遍，拼写和发音都对了才算完成。' }),
    list
  ]);
}

/* ---------- ② 句子列表 ---------- */

function renderSentences() {
  const list = el('ul', { class: 'spk-list' });
  sentenceItems.forEach((item, idx) => {
    const passed = progress.passed.has(item.id);
    list.append(el('li', { class: 'spk-item' }, [
      el('span', { class: `spk-idx ${passed ? 'ok' : ''}`, text: String(idx + 1) }),
      el('div', { class: 'spk-main' }, [
        el('div', { class: 'spk-text', html: highlight(item.text) }),
        el('div', { class: 'spk-zh', text: item.zh })
      ]),
      el('button', {
        class: 'btn spk-go', type: 'button', 'data-kind': 'sentence', 'data-id': item.id,
        text: passed ? '✔ 已完成' : '开始'
      })
    ]));
  });
  return el('section', { class: 'spk-sec' }, [
    el('h2', { class: 'spk-sec-title', text: `② 句子跟读（${sentenceItems.filter((i) => progress.passed.has(i.id)).length}/${sentenceItems.length}）` }),
    el('p', { class: 'spk-sec-desc', text: '点「开始」听示范，再对着麦克风读一遍。' }),
    list
  ]);
}

/* ---------- ③ 情景对话 ---------- */

function renderDialogue() {
  const doneCount = dialogueLines.filter((l) => progress.passed.has(l.id)).length;
  const passAll = doneCount === dialogueLines.length;
  const rows = el('div', { class: 'spk-lines' });
  dialogueLines.forEach((line) => {
    const passed = progress.passed.has(line.id);
    rows.append(el('div', { class: `spk-line ${line.who === 'A' ? 'is-a' : 'is-b'}` }, [
      el('span', { class: 'spk-who', text: line.who }),
      el('div', { class: 'spk-main' }, [
        el('div', { class: 'spk-text', text: line.text }),
        el('div', { class: 'spk-zh', text: line.zh })
      ]),
      el('button', {
        class: 'btn spk-go', type: 'button', 'data-kind': 'line', 'data-id': line.id,
        text: passed ? '✔' : '🎤 读'
      })
    ]));
  });
  return el('section', { class: 'spk-sec' }, [
    el('h2', { class: 'spk-sec-title', text: `③ 情景对话：${dialogue.title}（${doneCount}/${dialogueLines.length}）` }),
    el('p', { class: 'spk-sec-desc', text: 'A、B 两句都跟读一遍，整组对话就完成了。' }),
    rows,
    passAll ? el('div', { class: 'spk-done-tip', text: '✔ 这组对话已完成，明天换新的！' }) : null
  ]);
}

function highlight(text) {
  const stop = new Set(['the', 'and', 'but', 'with', 'into', 'this', 'that', 'they', 'them', 'have', 'has', 'had', 'will', 'was', 'were', 'been', 'being', 'at', 'on', 'in', 'to', 'is', 'am', 'are', 'my', 'we', 'it']);
  return text.split(' ').map((w) => {
    const clean = w.replace(/[^a-zA-Z']/g, '');
    return clean.length >= 3 && !stop.has(clean.toLowerCase()) ? `<b>${w}</b>` : w;
  }).join(' ');
}

function bindListEvents() {
  app.addEventListener('click', (e) => {
    const btn = e.target.closest('.spk-go');
    if (!btn || btn.disabled) return;
    sfxClick();
    const kind = btn.dataset.kind;
    const id = btn.dataset.id;
    if (kind === 'word') practiceWord(wordItems.find((x) => x.id === id));
    else if (kind === 'sentence') practiceSentence(sentenceItems.find((x) => x.id === id));
    else if (kind === 'line') practiceLine(id);
  });
}

/* ============================================================
   单题练习弹窗
   ============================================================ */

function openDialog(children) {
  const dialog = document.getElementById('spkDialog');
  clear(dialog);
  dialog.className = 'spk-dialog open';
  const body = el('div', { class: 'spk-modal' }, children);
  dialog.append(body);
  dialog.showModal();
  return dialog;
}

function closeDialog() {
  const dialog = document.getElementById('spkDialog');
  dialog.className = 'spk-dialog';
}

/* ---------- 单词：展示 → 拼写 → 发音 ---------- */

function practiceWord(item) {
  if (!item) return;
  // 三阶段：'show' 展示词卡 → 'spell' 拼写检查 → 'done' 完成
  let phase = progress.passed.has(item.id) ? 'done' : 'show';
  const state = { spelled: progress.passed.has(item.id), spoken: progress.passed.has(item.id) };

  const wordEl = el('div', { class: 'spk-m-word is-big', text: item.word });
  const zhEl = el('div', { class: 'spk-m-zh', text: item.zh });
  const input = el('input', {
    class: 'spk-input',
    type: 'text',
    placeholder: '在这里拼出这个单词',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: false,
    style: { display: 'none' }
  });
  const hint = el('div', { class: 'spk-hint', text: '' });
  const logBox = el('div', { class: 'spk-m-log' });

  const listenBtn = el('button', { class: 'btn btn-primary', type: 'button', text: '🔊 听发音' });
  const nextBtn = el('button', { class: 'btn btn-primary', type: 'button', text: '我记住了，开始拼写 ✍️' });
  const checkBtn = el('button', { class: 'btn', type: 'button', text: '✍️ 检查拼写', style: { display: 'none' } });
  const readBtn = el('button', { class: 'btn', type: 'button', text: '🎤 读一读', style: { display: 'none' } });
  const selfBtn = srEnabled ? null : el('button', { class: 'btn btn-outline', type: 'button', text: '✅ 我读对了（自评）', style: { display: 'none' } });
  const closeBtn = el('button', { class: 'btn btn-ghost', type: 'button', text: '返回' });

  function setPhase(p) {
    phase = p;
    // reset
    input.style.display = 'none';
    nextBtn.style.display = 'none';
    checkBtn.style.display = 'none';
    readBtn.style.display = 'none';
    if (selfBtn) selfBtn.style.display = 'none';

    if (p === 'show') {
      wordEl.classList.remove('is-hidden');
      wordEl.textContent = item.word;
      hint.textContent = `看看这个词，然后点「我记住了」开始拼写`;
      nextBtn.style.display = '';
    } else if (p === 'spell') {
      wordEl.classList.add('is-hidden');
      wordEl.textContent = '？ ？ ？';
      input.style.display = '';
      input.value = '';
      hint.textContent = `共 ${item.word.length} 个字母，首字母是 “${item.word[0]}”`;
      checkBtn.style.display = '';
      input.focus();
    } else if (p === 'done') {
      wordEl.classList.remove('is-hidden');
      wordEl.textContent = item.word;
      hint.textContent = state.spoken ? '拼写和发音都对了 ✔' : '拼写正确！再读一遍就完成了';
      checkBtn.style.display = 'none';
      readBtn.style.display = '';
      if (selfBtn) selfBtn.style.display = '';
    }
  }

  const tryFinish = () => {
    if (!(state.spelled && state.spoken)) return;
    progress.passed.add(item.id);
    progress.done.add(item.id);
    persist();
    sfxWin();
    toast(`${item.word} 完成 ✔`, 'ok');
    closeDialog();
    render();
  };

  listenBtn.addEventListener('click', () => { sfxClick(); speak(item.word, 'en-US'); });
  nextBtn.addEventListener('click', () => { sfxClick(); setPhase('spell'); });
  checkBtn.addEventListener('click', () => {
    const val = input.value.trim().toLowerCase();
    if (!val) { toast('先拼一拼再检查哦', 'warn'); return; }
    if (val === item.word.toLowerCase()) {
      state.spelled = true;
      sfxCorrect();
      toast('拼写正确 ✔', 'ok');
      setPhase('done');
      tryFinish();
    } else {
      sfxWrong();
      hint.textContent = `还不对：共 ${item.word.length} 个字母，首字母是 “${item.word[0]}”`;
      toast('再想想～', 'warn');
    }
  });
  readBtn.addEventListener('click', () => {
    recordOnce(readBtn, item.word, ({ passed, transcript }) => {
      logBox.textContent = transcript ? `识别到："${transcript}"` : '';
      if (passed) {
        state.spoken = true;
        sfxCorrect();
        toast('发音通过 ✔', 'ok');
        tryFinish();
      } else {
        sfxWrong();
        toast('再读一遍试试', 'warn');
      }
    });
  });
  if (selfBtn) {
    selfBtn.addEventListener('click', () => { state.spoken = true; tryFinish(); });
  }
  closeBtn.addEventListener('click', () => { sfxClick(); closeDialog(); render(); });

  openDialog([
    el('div', { class: 'spk-m-tag', text: '① 单词跟读' }),
    zhEl,
    wordEl,
    input,
    hint,
    el('div', { class: 'spk-m-ctrls' }, [listenBtn, nextBtn, checkBtn, readBtn, selfBtn, closeBtn]),
    logBox
  ]);
  setPhase('show');          // 先展示单词
  setTimeout(() => speak(item.word, 'en-US'), 250);
}

/* ---------- 句子 ---------- */

function practiceSentence(item) {
  if (!item) return;
  const logBox = el('div', { class: 'spk-m-log' });
  const listenBtn = el('button', { class: 'btn btn-primary', type: 'button', text: '🔊 听一听' });
  const readBtn = el('button', { class: 'btn', type: 'button', disabled: !srEnabled, text: '🎤 跟我读' });
  const selfBtn = srEnabled ? null : el('button', { class: 'btn btn-outline', type: 'button', text: '✅ 我读对了（自评）' });
  const closeBtn = el('button', { class: 'btn btn-ghost', type: 'button', text: '返回' });

  const onPass = () => {
    progress.passed.add(item.id);
    progress.done.add(item.id);
    persist();
    sfxWin();
    closeDialog();
    render();
  };

  listenBtn.addEventListener('click', () => { sfxClick(); speak(item.text, 'en-US'); });
  readBtn.addEventListener('click', () => {
    recordOnce(readBtn, item.text, ({ passed, transcript }) => {
      logBox.textContent = transcript ? `识别到："${transcript}"` : '';
      if (passed) { sfxCorrect(); toast('通过！🎉', 'ok'); onPass(); }
      else { sfxWrong(); toast('没听清，再来一次', 'warn'); }
    });
  });
  if (selfBtn) selfBtn.addEventListener('click', onPass);
  closeBtn.addEventListener('click', () => { sfxClick(); closeDialog(); render(); });

  openDialog([
    el('div', { class: 'spk-m-tag', text: '② 句子跟读' }),
    el('div', { class: 'spk-m-text', html: highlight(item.text) }),
    el('div', { class: 'spk-m-zh', text: item.zh }),
    el('div', { class: 'spk-m-ctrls' }, [listenBtn, readBtn, selfBtn, closeBtn]),
    logBox
  ]);
  setTimeout(() => speak(item.text, 'en-US'), 250);
}

/* ---------- 对话台词 ---------- */

function practiceLine(lineId) {
  const line = dialogueLines.find((l) => l.id === lineId);
  if (!line) return;
  const logBox = el('div', { class: 'spk-m-log' });
  const listenBtn = el('button', { class: 'btn btn-primary', type: 'button', text: '🔊 听一听' });
  const readBtn = el('button', { class: 'btn', type: 'button', disabled: !srEnabled, text: '🎤 跟我读' });
  const selfBtn = srEnabled ? null : el('button', { class: 'btn btn-outline', type: 'button', text: '✅ 我读对了（自评）' });
  const closeBtn = el('button', { class: 'btn btn-ghost', type: 'button', text: '返回' });

  const onPass = () => {
    progress.passed.add(line.id);
    progress.done.add(line.id);
    persist();
    sfxWin();
    closeDialog();
    render();
  };

  listenBtn.addEventListener('click', () => { sfxClick(); speak(line.text, 'en-US'); });
  readBtn.addEventListener('click', () => {
    recordOnce(readBtn, line.text, ({ passed, transcript }) => {
      logBox.textContent = transcript ? `识别到："${transcript}"` : '';
      if (passed) { sfxCorrect(); toast('通过！🎉', 'ok'); onPass(); }
      else { sfxWrong(); toast('没听清，再来一次', 'warn'); }
    });
  });
  if (selfBtn) selfBtn.addEventListener('click', onPass);
  closeBtn.addEventListener('click', () => { sfxClick(); closeDialog(); render(); });

  openDialog([
    el('div', { class: 'spk-m-tag', text: `③ 情景对话 · ${dialogue.title} · 角色 ${line.who}` }),
    el('div', { class: 'spk-m-text', text: line.text }),
    el('div', { class: 'spk-m-zh', text: line.zh }),
    el('div', { class: 'spk-m-ctrls' }, [listenBtn, readBtn, selfBtn, closeBtn]),
    logBox
  ]);
  setTimeout(() => speak(line.text, 'en-US'), 250);
}

/* 启动 */
bindListEvents();
render();
