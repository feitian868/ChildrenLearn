/**
 * olympic.js —— 奥数专区（数学思维加餐）
 * 不占每日任务、不影响宝箱；每套 4 题，首答对 +1，每日上限 5 分。
 * 得分写入 days[今天].olympicEarned，成长记录会统计。
 */

import * as store from '../core/store.js?v=20261028h';
import { ensureToday } from '../core/tasks.js?v=20261028h';
import { olympicSet } from '../data/knowledge-olympic.js?v=20261028h';
import { GRADE_LABEL } from '../data/curriculum.js?v=20261028h';
import { el, clear, toast } from '../core/ui.js?v=20261028h';
import { celebrate } from '../core/fx.js?v=20261028h';
import { sfxClick, sfxCorrect, sfxWrong, unlockAudio } from '../core/audio.js?v=20261028h';
import { mulberry32, hashString } from '../core/rng.js?v=20261028h';
import { pinyinize, needsPinyin } from '../data/pinyin-map.js?v=20261030a';

const BASE_CAP = 5;
const OVER_CAP = 8;   // 四科全完成后的上限
const SET_SIZE = 4;
const RECENT_SETS = 2;               // 模板去重：只避开最近 2 套用过的（保留 8 个）
const MAX_RECENT_TEMPLATES = SET_SIZE * RECENT_SETS;
const MAX_RECENT_HASHES = 400;       // hash 去重：保留最近 400 个题目实例
const app = document.getElementById('app');
document.body.dataset.subject = 'math';

let questions = [];
let index = 0;
let results = [];      // 'first' | 'retry'
let locked = false;
let earnedThisSet = 0;
let py = false;        // 当前年级是否需要拼音（newSet 里设）

/* ---------------- 去重持久化 ---------------- */

/** 从 profile 里读出去重相关字段（兼容旧数据） */
function readDedup(data) {
  const p = data.profile || {};
  return {
    // { [grade: number]: templateId[] }
    templates: p.olympicSeenTemplates || {},
    // number[] —— 最近见过的 prompt hash
    hashes: p.olympicSeenHashes || []
  };
}

/** 写入新用过的 template IDs 和 prompt hashes */
function writeDedup(grade, templateIds, hashes) {
  store.update((d) => {
    const p = d.profile = d.profile || {};
    // templates per grade
    const gradeKey = String(grade);
    const existing = (p.olympicSeenTemplates?.[gradeKey] || []).slice();
    templateIds.forEach((id) => {
      // 去重：同一个模板如果之前在 list 里，先删掉旧位置再 push 到末尾
      const i = existing.indexOf(id);
      if (i >= 0) existing.splice(i, 1);
      existing.push(id);
    });
    // 只保留最近 N 个（够覆盖 5 轮 bag 刷新）
    p.olympicSeenTemplates = {
      ...(p.olympicSeenTemplates || {}),
      [gradeKey]: existing.slice(-MAX_RECENT_TEMPLATES)
    };
    // hashes：全局滑动窗口
    const all = (p.olympicSeenHashes || []).slice();
    hashes.forEach((h) => {
      if (!all.includes(h)) all.push(h);
    });
    p.olympicSeenHashes = all.slice(-MAX_RECENT_HASHES);
  });
}

function allTodayDone() {
  const d = store.getToday();
  if (!d) return false;
  return d.tasks.length > 0 && d.tasks.every((t) => t.done);
}
function dailyCap() {
  return allTodayDone() ? OVER_CAP : BASE_CAP;
}

function todayEarned() {
  return store.getToday()?.olympicEarned || 0;
}

function newSet() {
  // 真随机：每次进入/再来一组都换新数值
  const rng = mulberry32(hashString(`oly-${Date.now()}-${Math.random()}`));
  const data = store.load();
  const grade = data.grade;
  py = needsPinyin(grade);

  // 读出去重池
  const dedup = readDedup(data);
  const recentTemplates = new Set(dedup.templates[String(grade)] || []);
  const recentHashes = new Set(dedup.hashes || []);

  // 生成（olympicSet 返回 {questions, usedTemplateIds, usedHashes}）
  const { questions: qs, usedTemplateIds, usedHashes } = olympicSet(grade, rng, {
    excludeTemplateIds: recentTemplates,
    excludePromptHashes: recentHashes
  });
  questions = qs;

  // 写回去重池
  writeDedup(grade, usedTemplateIds, usedHashes);

  index = 0;
  results = [];
  earnedThisSet = 0;
  render();
}

function pyHtml(text) {
  return py ? pinyinize(text) : text;
}

function render() {
  unlockAudio();
  clear(app);
  if (index >= questions.length) return renderResult();

  const q = questions[index];
  locked = false;

  const back = el('a', { class: 'btn btn-ghost game-back', href: 'index.html', text: '←', 'aria-label': '返回工作台' });
  const dots = el('div', { class: 'dots' });
  questions.forEach((_, i) => {
    dots.append(el('span', {
      class: `dot${i < index ? (results[i] === 'first' ? ' is-correct' : ' is-miss') : ''}${i === index ? ' is-current' : ''}`
    }));
  });

  const gradeLabel = GRADE_LABEL[store.load().grade];
  const cap = dailyCap();
  const overHint = allTodayDone()
    ? '🌟 四科已全完成，奥数上限提升到 8 分！'
    : `四科全部完成后上限提升到 ${OVER_CAP} 分`;
  const top = el('div', { class: 'game-top' }, [
    back,
    el('div', { class: 'game-heading' }, [
      el('h1', { text: `🧠 奥数专区 · ${gradeLabel}` }),
      el('p', { text: `思维训练加餐 · 每套 ${questions.length} 题 · 今日已得 ${todayEarned()}/${cap} 分 · ${overHint}` })
    ]),
    dots
  ]);

  const stage = el('div', { class: 'game-stage' });
  const card = el('div', { class: 'q-card' }, [
    el('div', { class: 'q-head' }, [
      el('span', { class: 'q-topic', text: `${q.topic} · 第 ${index + 1}/${questions.length} 题` }),
      el('div', { class: 'q-prompt', html: pyHtml(q.prompt) })
    ])
  ]);
  const feedback = el('div', { class: 'oly-feedback', role: 'status' });
  // 把 reset 函数传给 choice/input，用于重试
  let resetFn = null;
  if (q.type === 'choice') {
    card.append(renderChoice(q, feedback, (fn) => { resetFn = fn; }));
  } else {
    card.append(renderInput(q, feedback, (fn) => { resetFn = fn; }));
  }
  card.append(feedback);
  stage.append(card);

  const foot = el('div', { class: 'game-foot oly-foot' }, [
    el('span', { text: '答错可以重试，首答对 +1 分' }),
    el('a', { class: 'btn btn-ghost oly-back-home', href: 'index.html', text: '🏠 返回工作台' })
  ]);
  // 让 showWrong 可以拿到 resetFn
  card._reset = () => resetFn && resetFn();
  feedback._reset = () => resetFn && resetFn();

  app.append(top, stage, foot);
}

/* ------------------------- 作答反馈 ------------------------- */

/** 答对：显示「答对啦」+ 解析 + 下一题大按钮 */
function showCorrect(feedback, q) {
  clear(feedback);
  feedback.className = 'oly-feedback is-correct';

  const isLast = index + 1 >= questions.length;
  const nextBtn = el('button', {
    class: 'btn btn-primary oly-next',
    type: 'button'
  });
  nextBtn.append(
    el('span', { class: 'oly-next-main', text: isLast ? '🏁 查看本组结果' : '▶ 下一题' }),
    el('span', { class: 'oly-next-sub', text: isLast ? '去算积分 · 领奖励' : '继续加油！' })
  );
  nextBtn.addEventListener('click', () => {
    sfxClick();
    next();
  });

  feedback.append(
    el('div', { class: 'oly-fb-head' }, [
      el('span', { class: 'oly-fb-icon', text: '✅' }),
      el('span', { text: '答对啦！' })
    ]),
    el('div', { class: 'oly-fb-text', text: q.explain ? `解析：${q.explain}` : `正确答案：${q.answer}` }),
    nextBtn
  );
}

/** 答错：显示「❌ 再试一次」+ 明确的重试按钮（恢复所有选项/输入） */
function showWrong(feedback, reset) {
  clear(feedback);
  feedback.className = 'oly-feedback is-wrong';

  const retryBtn = el('button', {
    class: 'btn oly-retry',
    type: 'button',
    text: '🔄 重新作答'
  });
  retryBtn.addEventListener('click', () => {
    sfxClick();
    reset && reset();
    clear(feedback);
  });

  feedback.append(
    el('div', { class: 'oly-fb-head' }, [
      el('span', { class: 'oly-fb-icon', text: '❌' }),
      el('span', { text: '答错了，再试一次' })
    ]),
    retryBtn
  );
}

/* ------------------------- 选择题 ------------------------- */

function renderChoice(q, feedback, onReset) {
  const wrap = el('div', { class: 'choices' });
  let tried = false;
  const buttons = [];
  q.options.forEach((opt, i) => {
    const btn = el('button', { class: 'choice', type: 'button' }, [
      el('span', { class: 'opt-key', text: 'ABCD'[i] }),
      el('span', { html: pyHtml(String(opt)) })
    ]);
    btn.addEventListener('click', () => {
      if (locked || btn.disabled) return;
      unlockAudio();
      if (i === q.answer) {
        locked = true;
        sfxCorrect();
        btn.classList.add('is-correct');
        record(tried ? 'retry' : 'first');
        showCorrect(feedback, q);
      } else {
        tried = true;
        sfxWrong();
        btn.classList.add('is-wrong');
        btn.disabled = true;
        showWrong(feedback, reset);
        toast('再想想，你可以的！', 'info');
      }
    });
    buttons.push(btn);
    wrap.append(btn);
  });
  // 暴露重置函数：恢复所有选项可点
  const reset = () => {
    tried = false;
    buttons.forEach(b => { b.disabled = false; b.classList.remove('is-wrong', 'is-correct'); });
  };
  onReset(reset);
  return wrap;
}

/* ------------------------- 数字输入题 ------------------------- */

function renderInput(q, feedback, onReset) {
  let value = '';
  let tried = false;
  const box = el('div', { class: 'calc-box', text: '?' });
  const keypad = el('div', { class: 'keypad is-calc' });

  const refresh = () => { box.textContent = value || '?'; };
  const submit = () => {
    if (locked || !value) return;
    unlockAudio();
    if (Math.abs(Number(value) - Number(q.answer)) < 0.001) {
      locked = true;
      sfxCorrect();
      box.classList.add('is-correct');
      record(tried ? 'retry' : 'first');
      showCorrect(feedback, q);
    } else {
      tried = true;
      sfxWrong();
      box.classList.add('anim-shake');
      setTimeout(() => box.classList.remove('anim-shake'), 420);
      value = '';
      refresh();
      showWrong(feedback, reset);
      toast('再算一次，接近了！', 'info');
    }
  };

  const reset = () => {
    tried = false;
    value = '';
    box.classList.remove('is-correct', 'anim-shake');
    refresh();
  };
  onReset(reset);

  ['1','2','3','4','5','6','7','8','9','.','0','⌫'].forEach((k) => {
    const btn = el('button', { class: 'key', type: 'button', text: k });
    btn.addEventListener('click', () => {
      if (locked) return;
      sfxClick();
      if (k === '⌫') value = value.slice(0, -1);
      else if (k === '.' && value.includes('.')) return;
      else if (value.length < 8) value += k;
      refresh();
    });
    keypad.append(btn);
  });
  const okBtn = el('button', {
    class: 'key key-ok', type: 'button', text: '确定',
    style: { gridColumn: '4', gridRow: '1 / 5' }
  });
  okBtn.addEventListener('click', submit);
  keypad.append(okBtn);

  return el('div', { class: 'calc-wrap' }, [box, keypad]);
}

/* ------------------------- 记分与流程 ------------------------- */

function record(kind) {
  results.push(kind);
  const pts = kind === 'first' ? 1 : 0;
  // todayEarned() 读的是 store 实时值，已包含本组之前的得分，不能再减 earnedThisSet
  const room = Math.max(0, dailyCap() - todayEarned());
  const add = Math.min(pts, room);
  earnedThisSet += add;
  if (add > 0) {
    store.update((d) => {
      d.profile.points += add;
      const day = d.days[store.todayKey()];
      if (day) day.olympicEarned = (day.olympicEarned || 0) + add;
    });
  }
}

function next() {
  index++;
  render();
}

function renderResult() {
  clear(app);
  const firsts = results.filter((x) => x === 'first').length;
  const capped = todayEarned() >= dailyCap();

  const again = el('button', { class: 'btn btn-primary', type: 'button', text: '再来一组' });
  again.addEventListener('click', () => { sfxClick(); newSet(); });

  app.append(
    el('div', { class: 'game-top' }, [
      el('a', { class: 'btn btn-ghost game-back', href: 'index.html', text: '←', 'aria-label': '返回工作台' }),
      el('div', { class: 'game-heading' }, [el('h1', { text: '🧠 奥数专区' }), el('p', { text: '本组完成' })])
    ]),
    el('div', { class: 'game-stage' }, [
      el('div', { class: 'q-card', style: { textAlign: 'center' } }, [
        el('div', { class: 'q-prompt', text: `${firsts}/${questions.length} 题一次答对` }),
        el('div', { class: 'q-sub', text: capped && earnedThisSet === 0
          ? '今日奥数积分已领满，明天再来吧！'
          : `本组获得 +${earnedThisSet} 分 · 今日累计 ${todayEarned()}/${dailyCap()} 分` }),
        el('div', { class: 'mini-actions', style: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' } }, [
          again,
          el('a', { class: 'btn btn-ghost', href: 'index.html', style: { background: '#eef2ff', color: 'var(--accent)', border: '2px solid var(--accent-2)', fontWeight: 800 }, text: '🏠 回到工作台' })
        ])
      ])
    ])
  );

  if (firsts >= 3) {
    celebrate({
      emoji: '🧠',
      title: firsts === 4 ? '奥数小天才' : '思维小达人',
      subtitle: `${firsts} 题一次答对`,
      points: earnedThisSet,
      variant: 'task',
      buttonText: '继续'
    });
  }
}

/* ------------------------- 启动 ------------------------- */

// 供自动化测试读取当前题目 / 重置当日奥数分（不影响功能）
window.__olyDebug = {
  current: () => questions[index],
  index: () => index,
  total: () => questions.length,
  resetOlympic: () => store.update((d) => {
    const day = d.days[store.todayKey()];
    if (day) day.olympicEarned = 0;
  })
};

ensureToday(); // 保证今天 day 存在（olympicEarned 挂在 day 上）
newSet();
