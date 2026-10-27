/**
 * game-kit.js —— 四种题型渲染 + 首答正确统计 + 达标回写工作台
 * 游戏页只负责传入科目，其余全部由这里完成。
 */

import * as store from './store.js';
import { GRADE_LABEL, LEVEL_LABEL, PASS_LINE, SUBJECT_TIP } from '../data/curriculum.js';
import { getTaskById } from './tasks.js';
import { completeTask, markCelebrated } from './score.js';
import { celebrate, playerName } from './fx.js';
import { sfxClick, sfxCorrect, sfxWrong, speak, unlockAudio } from './audio.js';
import { el, clear } from './ui.js';
import { shuffle } from './rng.js';
import { pinyinize, needsPinyin } from '../data/pinyin-map.js';

/** 一年级语文自动标拼音，其他年级/英语科学数学原样 */
function pyHtml(grade, text) {
  const s = text == null ? '' : String(text);
  return needsPinyin(grade) ? pinyinize(s) : s;
}

const SUBJECT_EMOJI = {
  chinese: '📖',
  english: '🔤',
  math: '🔢',
  science: '🔬'
};

const ACHIEVEMENTS = {
  chinese: ['识字小达人', '阅读小能手', '语文小博士'],
  english: ['单词小达人', '开口小明星', '英语小达人'],
  math: ['口算小能手', '计算小侦探', '数学小冠军'],
  science: ['观察小达人', '科学小实验家', '小小科学家']
};

const WRONG_HINTS = [
  '没关系，再想一想～',
  '差一点点，再试一次！',
  '答错不扣分，慢慢来。',
  '看看题目里的关键词，再选一次。'
];

function achievementFor(subject, correct, total) {
  const list = ACHIEVEMENTS[subject] || ['学习小达人'];
  if (correct >= total) return list[2];
  if (correct >= PASS_LINE) return list[1];
  return list[0];
}

function emptyView(app, message) {
  document.body.dataset.subject = '';
  app.append(
    el('div', { class: 'game-top' }, [
      el('a', { class: 'icon-btn game-back', href: 'index.html', 'aria-label': '返回工作台', text: '←' }),
      el('div', { class: 'game-heading' }, [
        el('h1', { text: '今天的任务还没准备好' }),
        el('p', { text: '请先回到工作台生成任务' })
      ])
    ]),
    el('div', { class: 'game-stage' }, [
      el('div', { class: 'empty' }, [
        el('div', { class: 'e-icon', text: '🗂️' }),
        el('h2', { text: '没有找到这项任务' }),
        el('p', { text: message }),
        el('a', { class: 'btn btn-primary', href: 'index.html', text: '回到工作台' })
      ])
    ])
  );
}

export function mountGame(subject) {
  unlockAudio();
  document.body.dataset.subject = subject;

  const app = document.getElementById('app');
  if (!app) return;
  app.className = 'game';
  clear(app);

  const params = new URLSearchParams(location.search);
  const taskId = params.get('task');
  const task = taskId ? getTaskById(taskId) : null;

  if (!task || task.subject !== subject) {
    emptyView(app, task ? '这个任务不属于当前科目。' : '任务可能已经过期，回到工作台重新进入即可。');
    return;
  }

  const replay = Boolean(task.done);
  let results = new Array(task.questions.length).fill(null);
  let index = 0;
  let locked = false;

  const heading = el('div', { class: 'game-heading' });
  const dots = el('div', { class: 'dots', role: 'status' });
  const stage = el('div', { class: 'game-stage' });

  app.append(
    el('div', { class: 'game-top' }, [
      el('a', { class: 'icon-btn game-back', href: 'index.html', 'aria-label': '返回工作台', text: '←' }),
      heading,
      dots
    ]),
    stage,
    el('div', { class: 'game-foot', text: SUBJECT_TIP[subject] || '答错不扣分，都可以再试一次。' })
  );

  function renderHeader(q, i) {
    clear(heading);
    // 拔高题来自高一年级，头部仍显示当前年级，避免误导
    const gradeText = GRADE_LABEL[q.stretch ? (task.grade || q.grade) : q.grade];
    heading.append(
      el('h1', { text: `${task.subjectName} · ${task.title}` }),
      el('p', {
        text: `${gradeText} · 第 ${i + 1}/${task.questions.length} 题 · ${q.stretch ? '🚀 拔高题' : `${LEVEL_LABEL[q.level]}题`}`
      })
    );
  }

  function renderDots() {
    clear(dots);
    task.questions.forEach((_, i) => {
      const cls = ['dot'];
      if (results[i] === 'correct') cls.push('is-correct');
      else if (results[i] === 'miss') cls.push('is-miss');
      else if (i === index) cls.push('is-current');
      dots.append(el('span', { class: cls.join(' ') }));
    });
  }

  function makeHint() {
    const text = el('span', { text: '' });
    const box = el('div', { class: 'hint', role: 'status' }, [
      el('span', { class: 'h-icon', text: '💡' }),
      text
    ]);
    box.show = (msg) => {
      text.textContent = msg;
      box.classList.add('show');
    };
    box.hide = () => box.classList.remove('show');
    return box;
  }

  let wrongIndex = 0;

  function wrongMessage() {
    const msg = WRONG_HINTS[wrongIndex % WRONG_HINTS.length];
    wrongIndex += 1;
    return msg;
  }

  function markFirst(ok) {
    if (results[index] === null) results[index] = ok ? 'correct' : 'miss';
    else if (ok && results[index] === 'miss') {
      // 首次答错后答对，仍记为 miss
    }
    renderDots();
  }

  function nextQuestion() {
    index += 1;
    if (index >= task.questions.length) {
      finish();
      return;
    }
    locked = false;
    showQuestion(index);
  }

  function correctThenNext(hint) {
    if (locked) return;
    locked = true;
    markFirst(true);
    sfxCorrect();
    hint?.show('答对啦！');
    setTimeout(nextQuestion, 720);
  }

  function wrongThenRetry(hint, extra) {
    markFirst(false);
    sfxWrong();
    hint.show(wrongMessage());
    extra?.();
  }

  /* ---------------- 选择题 ---------------- */
  function renderChoice(q, hint) {
    const grid = el('div', { class: 'choices' });
    q.options.forEach((option, idx) => {
      const btn = el('button', { class: 'choice', type: 'button' }, [
        el('span', { class: 'opt-key', text: 'ABCD'[idx] || '' }),
        el('span', { html: pyHtml(task.grade, option) })
      ]);
      btn.addEventListener('click', () => {
        if (locked || btn.disabled) return;
        sfxClick();
        if (idx === q.answer) {
          btn.classList.add('is-correct');
          grid.querySelectorAll('.choice').forEach((b) => { b.disabled = true; });
          correctThenNext(hint);
        } else {
          btn.classList.add('is-wrong');
          btn.disabled = true;
          setTimeout(() => btn.classList.add('is-dim'), 320);
          wrongThenRetry(hint);
        }
      });
      grid.append(btn);
    });
    return grid;
  }

  /* ---------------- 判断题 ---------------- */
  function renderJudge(q, hint) {
    const row = el('div', { class: 'judge-row' });
    [
      { label: '对', sign: '✔', value: true, cls: 'yes' },
      { label: '错', sign: '✘', value: false, cls: 'no' }
    ].forEach((item) => {
      const btn = el('button', { class: `judge ${item.cls}`, type: 'button' }, [
        el('span', { class: 'sign', text: item.sign }),
        el('span', { text: item.label })
      ]);
      btn.addEventListener('click', () => {
        if (locked || btn.disabled) return;
        sfxClick();
        if (item.value === q.answer) {
          btn.classList.add('is-correct');
          row.querySelectorAll('.judge').forEach((b) => { b.disabled = true; });
          correctThenNext(hint);
        } else {
          btn.classList.add('is-wrong');
          btn.disabled = true;
          wrongThenRetry(hint);
        }
      });
      row.append(btn);
    });
    return row;
  }

  /* ---------------- 连线配对（Pointer Events 拖拽 + 点选） ---------------- */
  function renderMatch(q, hint) {
    const pairs = q.pairs || [];
    const wrap = el('div', { class: 'match-wrap' });
    const leftCol = el('div', { class: 'match-col' });
    const rightCol = el('div', { class: 'match-col' });
    wrap.append(leftCol, rightCol);

    const leftTiles = [];
    const rightTiles = [];
    let selected = null;
    let matchedCount = 0;
    let missMarked = false;
    let drag = null;

    const makeTile = (text, side) => {
      const attrs = { class: `match-tile ${side}`, type: 'button' };
      attrs.dataset = side === 'left' ? { a: text } : { b: text };
      return el('button', attrs, [el('span', { html: pyHtml(task.grade, text) })]);
    };

    shuffle(Math.random, pairs.map((p) => p.a)).forEach((text) => {
      const tile = makeTile(text, 'left');
      leftTiles.push(tile);
      leftCol.append(tile);
    });
    shuffle(Math.random, pairs.map((p) => p.b)).forEach((text) => {
      const tile = makeTile(text, 'right');
      rightTiles.push(tile);
      rightCol.append(tile);
    });

    const clearSelection = () => {
      selected?.classList.remove('is-selected');
      selected = null;
    };

    const targetAt = (x, y) => {
      const node = document.elementFromPoint(x, y);
      const tile = node?.closest?.('.match-tile.right');
      if (!tile || tile.classList.contains('is-matched')) return null;
      return tile;
    };

    const attempt = (leftTile, rightTile) => {
      if (locked) return;
      if (!leftTile || !rightTile) return;
      if (leftTile.classList.contains('is-matched') || rightTile.classList.contains('is-matched')) return;

      const ok = pairs.some((p) => p.a === leftTile.dataset.a && p.b === rightTile.dataset.b);
      if (ok) {
        sfxCorrect();
        leftTile.classList.add('is-matched');
        rightTile.classList.add('is-matched');
        leftTile.disabled = true;
        rightTile.disabled = true;
        clearSelection();
        matchedCount += 1;
        if (matchedCount === pairs.length) correctThenNext(hint);
      } else {
        sfxWrong();
        if (!missMarked) {
          missMarked = true;
          markFirst(false);
        }
        hint.show(wrongMessage());
        [leftTile, rightTile].forEach((tile) => {
          tile.classList.add('is-wrong');
          setTimeout(() => tile.classList.remove('is-wrong'), 480);
        });
        clearSelection();
      }
    };

    leftTiles.forEach((tile) => {
      tile.addEventListener('pointerdown', (e) => {
        if (locked || tile.classList.contains('is-matched')) return;
        if (e.button != null && e.button !== 0) return;
        clearSelection();
        selected = tile;
        tile.classList.add('is-selected');
        drag = { tile, startX: e.clientX, startY: e.clientY, moved: false, ghost: null };
        try { tile.setPointerCapture(e.pointerId); } catch { /* 忽略 */ }
      });

      tile.addEventListener('pointermove', (e) => {
        if (!drag || drag.tile !== tile) return;
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        if (!drag.moved && Math.hypot(dx, dy) > 8) {
          drag.moved = true;
          drag.ghost = el('div', { class: 'drag-ghost', text: tile.textContent });
          drag.ghost.style.left = `${e.clientX}px`;
          drag.ghost.style.top = `${e.clientY}px`;
          document.body.append(drag.ghost);
          tile.classList.add('is-ghost-source');
        }
        if (drag.moved && drag.ghost) {
          drag.ghost.style.left = `${e.clientX}px`;
          drag.ghost.style.top = `${e.clientY}px`;
          rightTiles.forEach((t) => t.classList.toggle('is-target', t === targetAt(e.clientX, e.clientY)));
        }
      });

      const endDrag = (e, cancelled) => {
        if (!drag || drag.tile !== tile) return;
        const wasMoved = drag.moved;
        drag.ghost?.remove();
        tile.classList.remove('is-ghost-source');
        rightTiles.forEach((t) => t.classList.remove('is-target'));
        drag = null;
        if (!wasMoved || cancelled) return;
        const target = targetAt(e.clientX, e.clientY);
        if (target) attempt(tile, target);
      };

      tile.addEventListener('pointerup', (e) => endDrag(e, false));
      tile.addEventListener('pointercancel', (e) => endDrag(e, true));
    });

    rightTiles.forEach((tile) => {
      tile.addEventListener('click', () => {
        if (locked || tile.classList.contains('is-matched')) return;
        if (!selected) {
          hint.show('先点左边的卡片，再点右边和它配对。');
          return;
        }
        attempt(selected, tile);
      });
    });

    return wrap;
  }

  /* ---------------- 字母/字符排序 ---------------- */
  function renderOrder(q, hint) {
    const answer = String(q.answer);
    const tiles = shuffle(Math.random, (q.tiles || []).slice());
    const slots = Array.from({ length: answer.length }, () => el('div', { class: 'order-slot' }));
    const slotRow = el('div', { class: 'order-slots' }, slots);
    const bank = el('div', { class: 'order-bank' });
    let picked = [];
    let checking = false;

    const reset = () => {
      picked = [];
      slots.forEach((slot) => {
        slot.textContent = '';
        slot.classList.remove('filled');
      });
      tiles.forEach((tile) => tile.classList.remove('used'));
      slotRow.classList.remove('is-wrong');
      checking = false;
    };

    const check = () => {
      checking = true;
      const text = slots.map((s) => s.textContent).join('');
      if (text === answer) {
        slotRow.classList.add('is-correct');
        correctThenNext(hint);
        return;
      }
      slotRow.classList.add('is-wrong');
      hint.show(wrongMessage());
      markFirst(false);
      sfxWrong();
      setTimeout(reset, 680);
    };

    tiles.forEach((text) => {
      const tile = el('button', { class: 'tile', type: 'button', text });
      tile.addEventListener('click', () => {
        if (locked || checking || tile.classList.contains('used')) return;
        const empty = slots.findIndex((s) => !s.classList.contains('filled'));
        if (empty === -1) return;
        sfxClick();
        slots[empty].textContent = text;
        slots[empty].classList.add('filled');
        tile.classList.add('used');
        picked.push({ tile, slot: empty });
        if (picked.length === slots.length) setTimeout(check, 220);
      });
      bank.append(tile);
    });

    return el('div', { class: 'order-wrap' }, [slotRow, bank]);
  }

  /* ---------------- 数字键盘输入 ---------------- */
  function renderInput(q, hint) {
    let value = '';
    const valueNode = el('span', { text: '?' });
    const box = el('div', { class: 'calc-box' }, [valueNode, el('i', { class: 'caret' })]);

    const paint = () => {
      valueNode.textContent = value || '?';
      valueNode.style.color = value ? '' : 'var(--muted)';
    };

    const keypad = el('div', { class: 'keypad is-calc' });

    const submit = el('button', {
      class: 'key key-ok',
      type: 'button',
      text: '确定',
      'aria-label': '确定'
    });

    const keys = [
      { key: '1', col: 1, row: 1 },
      { key: '2', col: 2, row: 1 },
      { key: '3', col: 3, row: 1 },
      { key: '⌫', col: 4, row: 1, fn: true },
      { key: '4', col: 1, row: 2 },
      { key: '5', col: 2, row: 2 },
      { key: '6', col: 3, row: 2 },
      { key: '7', col: 1, row: 3 },
      { key: '8', col: 2, row: 3 },
      { key: '9', col: 3, row: 3 },
      { key: '.', col: 1, row: 4 },
      { key: '0', col: 2, row: 4 },
      { key: '清空', col: 3, row: 4, fn: true }
    ];

    keys.forEach(({ key, col, row, fn }) => {
      const btn = el('button', {
        class: `key ${fn ? 'key-fn' : ''}`.trim(),
        type: 'button',
        text: key,
        'aria-label': key === '⌫' ? '删除' : key
      });
      btn.style.gridColumn = String(col);
      btn.style.gridRow = String(row);
      btn.addEventListener('click', () => {
        if (locked) return;
        sfxClick();
        if (key === '⌫') {
          value = value.slice(0, -1);
        } else if (key === '清空') {
          value = '';
        } else if (key === '.') {
          if (!value.includes('.') && value.length < 8) value = value ? `${value}.` : '0.';
        } else if (value.length < 9) {
          value = value === '0' ? key : value + key;
        }
        paint();
        hint.hide();
      });
      keypad.append(btn);
    });

    submit.style.gridColumn = '4';
    submit.style.gridRow = '2 / span 3';

    submit.addEventListener('click', () => {
      if (locked) return;
      sfxClick();
      if (!value) {
        hint.show('先用数字键输入答案，再点确定。');
        return;
      }
      const num = Number(value);
      const target = Number(q.answer);
      if (Number.isFinite(num) && Number.isFinite(target) && Math.abs(num - target) < 0.001) {
        correctThenNext(hint);
      } else {
        box.classList.add('anim-shake');
        setTimeout(() => box.classList.remove('anim-shake'), 420);
        wrongThenRetry(hint, () => {
          setTimeout(() => {
            value = '';
            paint();
          }, 500);
        });
      }
    });
    keypad.append(submit);

    paint();
    return el('div', { class: 'calc-wrap' }, [
      box,
      q.unit ? el('div', { class: 'q-sub', text: `单位：${q.unit}` }) : null,
      keypad
    ]);
  }

  /* ---------------- 单题渲染 ---------------- */
  function showQuestion(i) {
    const q = task.questions[i];
    renderHeader(q, i);
    renderDots();
    clear(stage);

    const card = el('div', { class: 'q-card reveal' });
    const head = el('div', { class: 'q-head' }, [
      el('span', {
        class: q.stretch ? 'q-topic is-stretch' : 'q-topic',
        text: q.stretch ? `🚀 拔高 · ${q.topic}` : `${LEVEL_LABEL[q.level]} · ${q.topic}`
      }),
      el('div', { class: 'q-prompt', html: pyHtml(task.grade, q.prompt) })
    ]);

    if (q.speak) {
      const speakBtn = el('button', { class: 'btn btn-ghost speak-btn', type: 'button' }, [
        el('span', { class: 'icon', text: '🔊' }),
        el('span', { text: '听一听' })
      ]);
      speakBtn.addEventListener('click', () => speak(q.speak, 'en-US'));
      head.append(speakBtn);
    }

    const hint = makeHint();
    card.append(head, hint);

    let body;
    if (q.type === 'choice') body = renderChoice(q, hint);
    else if (q.type === 'judge') body = renderJudge(q, hint);
    else if (q.type === 'match') body = renderMatch(q, hint);
    else if (q.type === 'order') body = renderOrder(q, hint);
    else body = renderInput(q, hint);

    card.append(body);
    stage.append(card);
  }

  /* ---------------- 结算 ---------------- */
  function finish() {
    locked = true;
    const total = task.questions.length;
    const first = results.filter((r) => r === 'correct').length;
    const passed = first >= PASS_LINE;

    if (!passed) {
      renderResult({ passed: false, first, total });
      return;
    }

    if (replay) {
      celebrate({
        emoji: SUBJECT_EMOJI[task.subject] || '🎉',
        title: '复习完成！',
        subtitle: `首答正确 ${first}/${total} · ${task.title}`,
        variant: 'task',
        buttonText: '继续',
        speech: `${playerName()}太棒了！复习完成，知识又巩固了一遍！`,
        onClose: () => renderResult({ passed: true, first, total, replay: true })
      });
      return;
    }

    const res = completeTask(task.id, { firstTryCorrect: first, total });
    if (!res || res.already) {
      celebrate({
        emoji: SUBJECT_EMOJI[task.subject] || '🎉',
        title: '已经达标啦',
        subtitle: `首答正确 ${first}/${total} · ${task.title}`,
        variant: 'task',
        buttonText: '继续',
        speech: `${playerName()}太棒了！这项任务已经达标过啦，再来一遍也很厉害！`,
        onClose: () => renderResult({ passed: true, first, total, replay: true })
      });
      return;
    }

    const achievement = achievementFor(task.subject, first, total);
    celebrate({
      emoji: SUBJECT_EMOJI[task.subject] || '🎉',
      title: achievement,
      subtitle: `首答正确 ${first}/${total} · ${task.title}`,
      points: res.taskPoints,
      variant: 'task',
      buttonText: '继续',
      onClose: () => {
        const today = store.getToday();
        if (res.allDone && res.dailyBonus && today && !today.celebrated) {
          markCelebrated();
          celebrate({
            emoji: '🏆',
            title: '今日任务全部完成！',
            subtitle: `连续打卡 ${res.streak} 天`,
            points: res.dailyBonus + res.streakBonus,
            variant: 'daily',
            buttonText: '享受成果',
            onClose: () => renderResult({ passed: true, first, total, result: res, achievement })
          });
        } else {
          renderResult({ passed: true, first, total, result: res, achievement });
        }
      }
    });
  }

  function chip(text, cls = '') {
    return el('span', { class: `chip ${cls}`.trim(), text });
  }

  function renderResult({ passed, first, total, replay: isReplay, result, achievement }) {
    clear(stage);
    const emoji = passed ? '🎉' : '🌱';
    const title = passed ? (isReplay ? '复习完成！' : '本项达标！') : '再试一次就好';
    let body;
    if (isReplay) {
      body = '这次是复习，不重复加分，但知识又巩固了一遍。';
    } else if (passed) {
      body = `首答正确 ${first}/${total}，达标线是 ${PASS_LINE} 题。`;
    } else {
      body = `首答正确 ${first}/${total}，达标需要 ${PASS_LINE} 题。答错不扣分，看看提示再来一次。`;
    }

    const stats = el('div', { class: 'result-stats' }, [chip(`首答 ${first}/${total}`, 'chip-line')]);
    if (result?.points) stats.append(chip(`+${result.points} 积分`, 'chip-gold'));
    if (result?.streak) stats.append(chip(`连续 ${result.streak} 天`, 'chip-ok'));

    const panel = el('div', { class: 'result' }, [
      el('div', { class: 'result-emoji', text: emoji }),
      el('h2', { text: title }),
      el('p', { text: body }),
      stats
    ]);

    if (passed && achievement) {
      panel.append(el('div', { class: 'result-achievement', text: `成就：${achievement}` }));
    }

    const again = el('button', { class: 'btn btn-ghost', type: 'button', text: '再练一次' });
    again.addEventListener('click', () => {
      results = new Array(task.questions.length).fill(null);
      index = 0;
      locked = false;
      wrongIndex = 0;
      showQuestion(0);
    });

    panel.append(
      el('div', { class: 'result-actions' }, [
        el('a', { class: 'btn btn-primary', href: 'index.html', text: '回到工作台' }),
        again
      ])
    );

    stage.append(panel);
  }

  showQuestion(0);
}
