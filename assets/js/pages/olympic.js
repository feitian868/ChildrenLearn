/**
 * olympic.js —— 奥数专区（数学思维加餐）
 * 不占每日任务、不影响宝箱；每套 4 题，首答对 +2、重试对 +1，每日上限 20 分。
 * 得分写入 days[今天].olympicEarned，成长记录会统计。
 */

import * as store from '../core/store.js';
import { ensureToday } from '../core/tasks.js';
import { olympicSet } from '../data/knowledge-olympic.js';
import { GRADE_LABEL } from '../data/curriculum.js';
import { el, clear, toast } from '../core/ui.js';
import { celebrate } from '../core/fx.js';
import { sfxClick, sfxCorrect, sfxWrong, unlockAudio } from '../core/audio.js';
import { mulberry32, hashString } from '../core/rng.js';

const DAILY_CAP = 20;
const app = document.getElementById('app');
document.body.dataset.subject = 'math';

let questions = [];
let index = 0;
let results = [];      // 'first' | 'retry'
let locked = false;
let earnedThisSet = 0;

function todayEarned() {
  return store.getToday()?.olympicEarned || 0;
}

function newSet() {
  // 真随机：每次进入/再来一组都换新数值
  const rng = mulberry32(hashString(`oly-${Date.now()}-${Math.random()}`));
  const data = store.load();
  questions = olympicSet(data.grade, rng);
  index = 0;
  results = [];
  earnedThisSet = 0;
  render();
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
  const top = el('div', { class: 'game-top' }, [
    back,
    el('div', { class: 'game-heading' }, [
      el('h1', { text: `🧠 奥数专区 · ${gradeLabel}` }),
      el('p', { text: `思维训练加餐 · 今日已得 ${todayEarned()}/${DAILY_CAP} 分` })
    ]),
    dots
  ]);

  const stage = el('div', { class: 'game-stage' });
  const card = el('div', { class: 'q-card' }, [
    el('div', { class: 'q-head' }, [
      el('span', { class: 'q-topic', text: `${q.topic} · 第 ${index + 1}/${questions.length} 题` }),
      el('div', { class: 'q-prompt', text: q.prompt })
    ])
  ]);
  const feedback = el('div', { class: 'oly-feedback', role: 'status' });
  card.append(q.type === 'choice' ? renderChoice(q, feedback) : renderInput(q, feedback));
  card.append(feedback);
  stage.append(card);

  app.append(top, stage, el('div', { class: 'game-foot', text: '答错可以重试，首答对 +2 分，重试对 +1 分' }));
}

/* ------------------------- 作答反馈 ------------------------- */

/** 答对：显示「答对啦」+ 解析 + 下一题按钮，让孩子清楚看到结果 */
function showCorrect(feedback, q) {
  clear(feedback);
  feedback.className = 'oly-feedback is-correct';

  const isLast = index + 1 >= questions.length;
  const nextBtn = el('button', {
    class: 'btn btn-primary oly-next',
    type: 'button',
    text: isLast ? '查看本组结果' : '下一题'
  });
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

/** 答错：常驻提示，直到答对为止 */
function showWrong(feedback) {
  clear(feedback);
  feedback.className = 'oly-feedback is-wrong';
  feedback.append(
    el('div', { class: 'oly-fb-head' }, [
      el('span', { class: 'oly-fb-icon', text: '❌' }),
      el('span', { text: '答错了，再试一次' })
    ])
  );
}

/* ------------------------- 选择题 ------------------------- */

function renderChoice(q, feedback) {
  const wrap = el('div', { class: 'choices' });
  let tried = false;
  q.options.forEach((opt, i) => {
    const btn = el('button', { class: 'choice', type: 'button' }, [
      el('span', { class: 'opt-key', text: 'ABCD'[i] }),
      el('span', { text: String(opt) })
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
        showWrong(feedback);
        toast('再想想，你可以的！', 'info');
      }
    });
    wrap.append(btn);
  });
  return wrap;
}

/* ------------------------- 数字输入题 ------------------------- */

function renderInput(q, feedback) {
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
      showWrong(feedback);
      toast('再算一次，接近了！', 'info');
    }
  };

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
  const pts = kind === 'first' ? 2 : 1;
  // todayEarned() 读的是 store 实时值，已包含本组之前的得分，不能再减 earnedThisSet
  const room = Math.max(0, DAILY_CAP - todayEarned());
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
  const capped = todayEarned() >= DAILY_CAP;

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
          : `本组获得 +${earnedThisSet} 分 · 今日累计 ${todayEarned()}/${DAILY_CAP} 分` }),
        el('div', { class: 'mini-actions', style: { display: 'flex', gap: '12px', justifyContent: 'center' } }, [
          again,
          el('a', { class: 'btn btn-ghost', href: 'index.html', text: '回到工作台' })
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
