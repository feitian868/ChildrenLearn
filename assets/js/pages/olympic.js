/**
 * olympic.js —— 奥数专题闯关（阶段 D：只重组现有题库，不新增题目）
 *   专题顺序：和差倍 → 盈亏 → 鸡兔同笼 → 行程 → 计数 → 组合（本年级没有的专题直接跳过）
 *   每专题 4 关：例题 → 变式 → 挑战 → 综合，答对才进下一关；
 *   4 关里首答对 ≥3 关才算专题掌握，未达标重练本专题，不放行下一专题。
 * 不占每日任务、不影响宝箱；首答对 +1，每日上限 5 分（四科全完成后 8 分）。
 * 得分写入 days[今天].olympicEarned，成长记录会统计。
 */

import * as store from '../core/store.js';
import { ensureToday } from '../core/tasks.js';
import {
  olympicTopics,
  olympicTopicQuestion,
  LEVELS_PER_TOPIC,
  LEVEL_LABELS
} from '../data/knowledge-olympic.js';
import { GRADE_LABEL } from '../data/curriculum.js';
import { el, clear, toast } from '../core/ui.js';
import { celebrate } from '../core/fx.js';
import { sfxClick, sfxCorrect, sfxWrong, unlockAudio } from '../core/audio.js';
import { mulberry32, hashString } from '../core/rng.js';
import { pinyinize, needsPinyin } from '../data/pinyin-map.js';

const BASE_CAP = 5;
const OVER_CAP = 8;   // 四科全完成后的上限
const MASTERY_LINE = 3; // 4 关里首答对 ≥3 才算专题过关
const app = document.getElementById('app');
document.body.dataset.subject = 'math';

const data = store.load();
const grade = data.grade;
const topics = olympicTopics(grade);
const py = needsPinyin(grade);

let topicIndex = 0;
let levelIndex = 0;
let run = { first: 0, total: 0 }; // 本专题本轮 4 关的首答对/总数
let earnedThisTopic = 0;
let q = null;
let locked = false;
let hintLevel = 0; // 当前题已揭示的提示步数

/* ---------------- 进度持久化 ---------------- */

function progressOf() {
  const all = data.olympicProgress || (data.olympicProgress = {});
  const p = all[grade] || (all[grade] = { topicIndex: 0, levelIndex: 0, stats: {} });
  if (p.topicIndex >= topics.length) p.topicIndex = 0; // 全部过关后回到第 1 专题巩固
  return p;
}

function saveProgress() {
  const p = progressOf();
  p.topicIndex = topicIndex;
  p.levelIndex = levelIndex;
  p.run = { ...run };
  store.save(data);
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

/* ---------------- 关卡生成（沿用现有模板参数化，不新增题目） ---------------- */

function topic() {
  return topics[topicIndex];
}

function makeQuestion() {
  const t = topic();
  const tpl = t.templates[levelIndex % t.templates.length];
  const rng = mulberry32(hashString(`oly:${grade}:${t.id}:${levelIndex}:${Date.now()}:${Math.random()}`));
  q = olympicTopicQuestion(grade, tpl.genIndex, levelIndex + 1, rng);
  locked = false;
  hintLevel = 0;
}

function startTopic(index) {
  topicIndex = index;
  levelIndex = 0;
  run = { first: 0, total: 0 };
  earnedThisTopic = 0;
  saveProgress();
  makeQuestion();
  render();
}

/* ---------------- 渲染 ---------------- */

function pyHtml(text) {
  return py ? pinyinize(text) : text;
}

function render() {
  unlockAudio();
  clear(app);
  if (!topics.length) return renderNoTopic();
  if (topicIndex >= topics.length) return renderAllDone();
  if (!q) makeQuestion();

  const t = topic();
  const label = LEVEL_LABELS[levelIndex] || `第 ${levelIndex + 1} 关`;
  const cap = dailyCap();
  const overHint = allTodayDone()
    ? '🌟 四科已全完成，奥数上限提升到 8 分！'
    : `四科全部完成后上限提升到 ${OVER_CAP} 分`;

  const dots = el('div', { class: 'dots' });
  for (let i = 0; i < LEVELS_PER_TOPIC; i++) {
    dots.append(el('span', {
      class: `dot${i < levelIndex ? ' is-correct' : ''}${i === levelIndex ? ' is-current' : ''}`
    }));
  }

  const top = el('div', { class: 'game-top' }, [
    el('a', { class: 'btn btn-ghost game-back', href: 'index.html', text: '←', 'aria-label': '返回工作台' }),
    el('div', { class: 'game-heading' }, [
      el('h1', { text: `🧠 奥数专题闯关 · ${GRADE_LABEL[grade]}` }),
      el('p', { text: `专题 ${topicIndex + 1}/${topics.length}「${t.name}」· 第 ${levelIndex + 1}/${LEVELS_PER_TOPIC} 关（${label}）· 今日已得 ${todayEarned()}/${cap} 分 · ${overHint}` })
    ]),
    dots
  ]);

  const stage = el('div', { class: 'game-stage' });
  const card = el('div', { class: 'q-card' }, [
    el('div', { class: 'q-head' }, [
      el('span', { class: 'q-topic', text: `${t.name} · ${q.topic} · ${label}` }),
      el('div', { class: 'q-prompt', html: pyHtml(q.prompt) })
    ])
  ]);
  const feedback = el('div', { class: 'oly-feedback', role: 'status' });
  let resetFn = null;
  if (q.type === 'choice') {
    card.append(renderChoice(q, feedback, (fn) => { resetFn = fn; }));
  } else {
    card.append(renderInput(q, feedback, (fn) => { resetFn = fn; }));
  }
  card.append(feedback);
  stage.append(card);

  const foot = el('div', { class: 'game-foot oly-foot' }, [
    el('span', { text: `本专题掌握度 ${run.first}/${Math.max(run.total, 1)} · 首答对 ${MASTERY_LINE}/${LEVELS_PER_TOPIC} 关即过关 · 答错可重试` }),
    el('a', { class: 'btn btn-ghost oly-back-home', href: 'index.html', text: '🏠 返回工作台' })
  ]);
  card._reset = () => resetFn && resetFn();
  feedback._reset = () => resetFn && resetFn();

  app.append(top, stage, foot);
}

/* ------------------------- 作答反馈（分步提示） ------------------------- */

/** 把解析拆成 1~4 步；只有一句时按逗号再拆一次 */
function explainSteps(text) {
  const raw = String(text || '').trim();
  if (!raw) return [];
  let parts = raw.split(/[；。]/).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 1) parts = raw.split(/[，]/).map((s) => s.trim()).filter(Boolean);
  return parts.slice(0, 4);
}

function showCorrect(feedback, question) {
  clear(feedback);
  feedback.className = 'oly-feedback is-correct';

  const isLast = levelIndex + 1 >= LEVELS_PER_TOPIC;
  const nextBtn = el('button', { class: 'btn btn-primary oly-next', type: 'button' });
  nextBtn.append(
    el('span', { class: 'oly-next-main', text: isLast ? '🏁 查看本专题结果' : '▶ 下一关' }),
    el('span', { class: 'oly-next-sub', text: isLast ? '看掌握度是否过关' : `下一关：${LEVEL_LABELS[levelIndex + 1]}` })
  );
  nextBtn.addEventListener('click', () => {
    sfxClick();
    advance();
  });

  const steps = explainSteps(question.explain);
  const stepBox = el('div', { class: 'oly-steps' });
  (steps.length ? steps : [question.explain || `正确答案：${question.answer}`]).forEach((s, i) => {
    stepBox.append(el('div', { class: 'oly-step', text: `${i + 1}. ${s}` }));
  });

  feedback.append(
    el('div', { class: 'oly-fb-head' }, [
      el('span', { class: 'oly-fb-icon', text: '✅' }),
      el('span', { text: '答对啦！' })
    ]),
    stepBox,
    nextBtn
  );
}

function showWrong(feedback, reset) {
  clear(feedback);
  feedback.className = 'oly-feedback is-wrong';

  const steps = explainSteps(q.explain);
  hintLevel = Math.min(hintLevel + 1, Math.max(1, steps.length));
  const shown = steps.slice(0, hintLevel);

  const hintBox = el('div', { class: 'oly-steps' });
  shown.forEach((s, i) => hintBox.append(el('div', { class: 'oly-step', text: `提示 ${i + 1}：${s}` })));

  const retryBtn = el('button', { class: 'btn oly-retry', type: 'button', text: '🔄 重新作答' });
  retryBtn.addEventListener('click', () => {
    sfxClick();
    reset && reset();
    clear(feedback);
  });

  const moreBtn = hintLevel < steps.length
    ? el('button', { class: 'btn oly-retry', type: 'button', text: '💡 再提示一步' })
    : null;
  if (moreBtn) {
    moreBtn.addEventListener('click', () => {
      sfxClick();
      showWrong(feedback, reset);
    });
  }

  feedback.append(
    el('div', { class: 'oly-fb-head' }, [
      el('span', { class: 'oly-fb-icon', text: '❌' }),
      el('span', { text: '答错了，先看一步提示再试' })
    ]),
    hintBox,
    el('div', { class: 'mini-actions', style: { display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' } }, [
      moreBtn,
      retryBtn
    ].filter(Boolean))
  );
}

/* ------------------------- 选择题 ------------------------- */

function renderChoice(question, feedback, onReset) {
  const wrap = el('div', { class: 'choices' });
  let tried = false;
  const buttons = [];
  question.options.forEach((opt, i) => {
    const btn = el('button', { class: 'choice', type: 'button' }, [
      el('span', { class: 'opt-key', text: 'ABCD'[i] }),
      el('span', { html: pyHtml(String(opt)) })
    ]);
    btn.addEventListener('click', () => {
      if (locked || btn.disabled) return;
      unlockAudio();
      if (i === question.answer) {
        locked = true;
        sfxCorrect();
        btn.classList.add('is-correct');
        record(tried ? 'retry' : 'first');
        showCorrect(feedback, question);
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
  const reset = () => {
    tried = false;
    buttons.forEach((b) => { b.disabled = false; b.classList.remove('is-wrong', 'is-correct'); });
  };
  onReset(reset);
  return wrap;
}

/* ------------------------- 数字输入题 ------------------------- */

function renderInput(question, feedback, onReset) {
  let value = '';
  let tried = false;
  const box = el('div', { class: 'calc-box', text: '?' });
  const keypad = el('div', { class: 'keypad is-calc' });

  const refresh = () => { box.textContent = value || '?'; };
  const submit = () => {
    if (locked || !value) return;
    unlockAudio();
    if (Math.abs(Number(value) - Number(question.answer)) < 0.001) {
      locked = true;
      sfxCorrect();
      box.classList.add('is-correct');
      record(tried ? 'retry' : 'first');
      showCorrect(feedback, question);
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

  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].forEach((k) => {
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
  run.total += 1;
  if (kind === 'first') run.first += 1;
  saveProgress();
  const pts = kind === 'first' ? 1 : 0;
  const room = Math.max(0, dailyCap() - todayEarned());
  const add = Math.min(pts, room);
  earnedThisTopic += add;
  if (add > 0) {
    store.update((d) => {
      d.profile.points += add;
      const day = d.days[store.todayKey()];
      if (day) day.olympicEarned = (day.olympicEarned || 0) + add;
    });
  }
}

/** 答对后点「下一关」：本专题 4 关走完进入结果页 */
function advance() {
  levelIndex += 1;
  if (levelIndex >= LEVELS_PER_TOPIC) {
    renderTopicResult();
    return;
  }
  saveProgress();
  makeQuestion();
  render();
}

function renderTopicResult() {
  clear(app);
  const t = topic();
  const passed = run.first >= MASTERY_LINE;
  const p = progressOf();
  p.stats[t.id] = { passed, first: run.first, total: run.total };
  if (passed) p.topicIndex = Math.min(topicIndex + 1, topics.length);
  else p.topicIndex = topicIndex;
  store.save(data);

  const action = el('button', { class: 'btn btn-primary', type: 'button' });
  if (passed && topicIndex + 1 < topics.length) {
    action.textContent = `▶ 进入下一专题：${topics[topicIndex + 1].name}`;
    action.addEventListener('click', () => { sfxClick(); startTopic(topicIndex + 1); });
  } else if (passed) {
    action.textContent = '🏁 完成本年级全部专题';
    action.addEventListener('click', () => { sfxClick(); renderAllDone(); });
  } else {
    action.textContent = '🔁 重练本专题（4 关）';
    action.addEventListener('click', () => { sfxClick(); startTopic(topicIndex); });
  }

  const capped = todayEarned() >= dailyCap();
  app.append(
    el('div', { class: 'game-top' }, [
      el('a', { class: 'btn btn-ghost game-back', href: 'index.html', text: '←', 'aria-label': '返回工作台' }),
      el('div', { class: 'game-heading' }, [
        el('h1', { text: `🧠 ${t.name} · 专题结果` }),
        el('p', { text: `第 ${topicIndex + 1}/${topics.length} 个专题 · 4 关已完成` })
      ])
    ]),
    el('div', { class: 'game-stage' }, [
      el('div', { class: 'q-card', style: { textAlign: 'center' } }, [
        el('div', { class: 'q-prompt', text: `本专题掌握度 ${run.first}/${LEVELS_PER_TOPIC}` }),
        el('div', { class: 'q-sub', text: passed
          ? `达标（首答对 ≥${MASTERY_LINE} 关），可以进入下一专题。`
          : `未达标（首答对需 ≥${MASTERY_LINE} 关），先把这个专题再练一遍。` }),
        el('div', { class: 'q-sub', text: capped && earnedThisTopic === 0
          ? '今日奥数积分已领满，明天再来吧！'
          : `本轮获得 +${earnedThisTopic} 分 · 今日累计 ${todayEarned()}/${dailyCap()} 分` }),
        el('div', { class: 'mini-actions', style: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' } }, [
          action,
          el('a', { class: 'btn btn-ghost', href: 'index.html', style: { background: '#eef2ff', color: 'var(--accent)', border: '2px solid var(--accent-2)', fontWeight: 800 }, text: '🏠 回到工作台' })
        ])
      ])
    ])
  );

  if (passed) {
    celebrate({
      emoji: '🧠',
      title: '专题过关！',
      subtitle: `${t.name} · 首答对 ${run.first}/${LEVELS_PER_TOPIC}`,
      points: earnedThisTopic,
      variant: 'task',
      buttonText: '继续'
    });
  }
}

function renderAllDone() {
  clear(app);
  app.append(
    el('div', { class: 'game-top' }, [
      el('a', { class: 'btn btn-ghost game-back', href: 'index.html', text: '←', 'aria-label': '返回工作台' }),
      el('div', { class: 'game-heading' }, [el('h1', { text: '🧠 奥数专题闯关' }), el('p', { text: '本年级专题已全部过关' })])
    ]),
    el('div', { class: 'game-stage' }, [
      el('div', { class: 'q-card', style: { textAlign: 'center' } }, [
        el('div', { class: 'q-prompt', text: '🎉 全部专题已完成' }),
        el('div', { class: 'q-sub', text: '明天可以再从第 1 个专题开始巩固，仍然只练现有题库。' }),
        el('a', { class: 'btn btn-primary', href: 'index.html', text: '🏠 回到工作台' })
      ])
    ])
  );
}

function renderNoTopic() {
  clear(app);
  app.append(
    el('div', { class: 'game-top' }, [
      el('a', { class: 'btn btn-ghost game-back', href: 'index.html', text: '←', 'aria-label': '返回工作台' }),
      el('div', { class: 'game-heading' }, [el('h1', { text: '🧠 奥数专题闯关' }), el('p', { text: '本年级暂无可用专题（不新增题目）' })])
    ])
  );
}

/* ------------------------- 启动 ------------------------- */

// 供自动化测试读取当前题目与专题结构
window.__olyDebug = {
  current: () => q,
  state: () => ({
    grade,
    topicIndex,
    levelIndex,
    run: { ...run },
    topics: topics.map((t) => ({ id: t.id, name: t.name, templates: t.templates.length }))
  }),
  resetOlympic: () => store.update((d) => {
    const day = d.days[store.todayKey()];
    if (day) day.olympicEarned = 0;
  })
};

ensureToday(); // 保证今天 day 存在（olympicEarned 挂在 day 上）
{
  const p = progressOf();
  topicIndex = Math.min(p.topicIndex || 0, Math.max(0, topics.length - 1));
  levelIndex = Math.max(0, Math.min(p.levelIndex || 0, LEVELS_PER_TOPIC));
  run = p.run ? { first: p.run.first || 0, total: p.run.total || 0 } : { first: 0, total: 0 };
  if (levelIndex >= LEVELS_PER_TOPIC) {
    renderTopicResult();
  } else {
    makeQuestion();
    render();
  }
}
