/**
 * workbench.js —— 工作台：任务、打卡进度、宝箱、商店、数据管理、家长核对
 * 任务卡不可手动勾选，完成状态只由游戏页达标后回写。
 */

import * as store from '../core/store.js';
import { GRADES, GRADE_LABEL, focusTextOf } from '../data/curriculum.js';
import {
  ensureToday,
  regenerateToday,
  subjectProgress,
  dayProgress,
  allSubjectsDone
} from '../core/tasks.js';
import { chestState, openChest } from '../core/chest.js';
import { shopState, redeemItem } from '../core/shop.js';
import { markCelebrated } from '../core/score.js';
import { celebrate } from '../core/fx.js';
import { openMinigame } from '../core/minigames.js';
import {
  setSoundEnabled,
  isSoundEnabled,
  sfxClick,
  unlockAudio
} from '../core/audio.js';
import { el, clear, dialog, longPress, toast } from '../core/ui.js';

const app = document.getElementById('app');
let parentOpen = false;
let day = null;

/* ------------------------- 渲染入口 ------------------------- */

function refresh() {
  const data = store.load();
  day = ensureToday();
  render(data);
}

function render(data) {
  unlockAudio();
  clear(app);
  app.className = 'wb';
  app.append(
    renderTop(data),
    renderUserBar(data),
    renderGradeBar(data),
    el('div', { class: 'wb-grid' }, [
      el('div', { class: 'wb-main' }, [renderProgress(), renderSubjects()]),
      el('div', { class: 'wb-side' }, [renderChest(), renderShop(), renderData()])
    ]),
    renderGrowth(data),
    renderParent(),
    el('div', {
      class: 'wb-foot',
      html: '任务完成状态只能由游戏页达标后回写 · 数据按用户分开保存在本机浏览器'
    })
  );
  maybeCelebrateDaily();
}

/* ------------------------- 用户区 ------------------------- */

function renderUserBar(data) {
  const users = store.listUsers();
  const current = store.currentUser();

  const select = el('select', { class: 'user-select', 'aria-label': '切换用户' });
  users.forEach((name) => {
    select.append(el('option', { value: name, text: name }));
  });
  select.value = current;
  select.addEventListener('change', () => {
    const name = select.value;
    if (name === store.currentUser()) return;
    sfxClick();
    store.switchUser(name); // 当前数据已随操作落盘，这里换键重读
    parentOpen = false;
    refresh();
    toast(`已切换到「${name}」`, 'ok');
  });

  const addBtn = el('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: '＋ 新建用户' });
  addBtn.addEventListener('click', async () => {
    sfxClick();
    const name = await promptUserName();
    if (!name) return;
    const res = store.createUser(name);
    if (!res.ok) {
      toast(res.reason, 'bad');
      return;
    }
    parentOpen = false;
    refresh();
    toast(`欢迎，「${name}」！已切换到新用户`, 'ok');
  });

  const delBtn = el('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: '删除用户' });
  delBtn.addEventListener('click', async () => {
    sfxClick();
    if (users.length <= 1) {
      toast('至少要保留一个用户', 'bad');
      return;
    }
    const ok = await dialog({
      title: `删除用户「${current}」？`,
      body: '该用户的积分、打卡、历史记录和兑换记录都会一起删除，无法恢复。',
      actions: [
        { label: '取消', value: false, kind: 'ghost' },
        { label: '确认删除', value: true, kind: 'danger' }
      ]
    });
    if (!ok) return;
    const res = store.deleteUser(current);
    if (!res.ok) {
      toast(res.reason, 'bad');
      return;
    }
    parentOpen = false;
    refresh();
    toast(`已删除「${current}」，当前为「${res.switchedTo}」`, 'ok');
  });

  return el('div', { class: 'card user-bar' }, [
    el('span', { class: 'user-badge', text: '👤' }),
    el('div', { class: 'user-info' }, [
      el('div', { class: 'user-name', text: current }),
      el('div', { class: 'user-sub', text: `共 ${users.length} 个用户 · 数据互不影响` })
    ]),
    select,
    addBtn,
    delBtn
  ]);
}

/** 新建用户的名字输入弹窗，resolve 名字或 null */
function promptUserName() {
  return new Promise((resolve) => {
    const input = el('input', {
      class: 'user-input',
      type: 'text',
      maxlength: '12',
      placeholder: '输入名字，如：小明',
      'aria-label': '用户名字'
    });
    const overlay = el('div', { class: 'overlay' });
    const done = (value) => {
      overlay.remove();
      resolve(value);
    };
    const cancelBtn = el('button', { class: 'btn btn-ghost', type: 'button', text: '取消' });
    const okBtn = el('button', { class: 'btn btn-primary', type: 'button', text: '创建' });
    cancelBtn.addEventListener('click', () => done(null));
    okBtn.addEventListener('click', () => {
      const name = input.value.trim();
      if (!name) {
        input.classList.add('anim-shake');
        setTimeout(() => input.classList.remove('anim-shake'), 420);
        return;
      }
      done(name);
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') okBtn.click(); });
    overlay.append(el('div', { class: 'sheet' }, [
      el('h3', { text: '新建用户' }),
      el('p', { text: '不需要账号密码，一个名字就是一份独立的数据。' }),
      input,
      el('div', { class: 'sheet-actions' }, [cancelBtn, okBtn])
    ]));
    document.body.append(overlay);
    setTimeout(() => input.focus(), 60);
  });
}

/* ------------------------- 成长记录入口 ------------------------- */

function renderGrowth(data) {
  const history = store.historyWithToday(data);
  const today = store.todayKey();
  const last7 = Array.from({ length: 7 }, (_, i) => store.shiftDateKey(today, i - 6));
  const sum7 = last7.reduce((s, k) => s + (history[k]?.pointsEarned || 0), 0);
  const full7 = last7.filter((k) => history[k]?.total && history[k].completed >= history[k].total).length;

  const go = el('a', { class: 'btn btn-primary', href: 'growth.html', text: '查看成长记录 →' });
  go.addEventListener('click', () => unlockAudio());

  return el('div', { class: 'card growth-entry' }, [
    el('div', { class: 'growth-entry-info' }, [
      el('h3', { text: `📈 成长记录 · ${store.currentUser()}` }),
      el('p', {
        text: `总积分 ${data.profile.points || 0} · 连续打卡 ${data.profile.streak || 0} 天 · 近 7 天 +${sum7} 分，${full7} 天全完成`
      })
    ]),
    go
  ]);
}

/* ------------------------- 顶部 ------------------------- */

function chip(text, cls = '') {
  return el('span', { class: `chip ${cls}`.trim(), text });
}

function renderTop(data) {
  const points = data.profile.points || 0;
  const streak = data.profile.streak || 0;
  const prog = dayProgress(day);

  const soundBtn = el('button', {
    class: 'icon-btn',
    type: 'button',
    title: isSoundEnabled() ? '关闭音效' : '开启音效',
    'aria-label': isSoundEnabled() ? '关闭音效' : '开启音效',
    text: isSoundEnabled() ? '🔔' : '🔕'
  });
  soundBtn.addEventListener('click', () => {
    const next = !isSoundEnabled();
    setSoundEnabled(next);
    store.update((d) => { d.settings.sound = next; });
    if (next) sfxClick();
    render(store.load());
  });

  return el('div', { class: 'wb-top' }, [
    el('div', { class: 'wb-brand' }, [
      el('div', { class: 'wb-logo', text: '🎒' }),
      el('div', {}, [
        el('h1', { text: '小学四科每日任务' }),
        el('p', {
          class: 'wb-sub',
          text: `${store.formatDateCN(store.todayKey())} · ${focusTextOf(day.weekday)} · ${GRADE_LABEL[data.grade]}`
        })
      ])
    ]),
    el('div', { class: 'wb-stats' }, [
      el('span', { class: 'stat' }, [
        el('span', { class: 'stat-icon', text: '⭐' }),
        el('b', { id: 'pointsStat', text: points }),
        el('small', { text: '积分' })
      ]),
      el('span', { class: 'stat' }, [
        el('span', { class: 'stat-icon', text: '🔥' }),
        el('b', { text: streak }),
        el('small', { text: '连续天数' })
      ]),
      el('span', { class: 'stat' }, [
        el('span', { class: 'stat-icon', text: '✅' }),
        el('b', { text: `${prog.done}/${prog.total}` }),
        el('small', { text: '今日任务' })
      ]),
      soundBtn
    ])
  ]);
}

/* ------------------------- 年级 ------------------------- */

function renderGradeBar(data) {
  const list = el('div', { class: 'grade-list' });
  GRADES.forEach((grade) => {
    const btn = el('button', {
      class: 'grade-btn',
      type: 'button',
      text: GRADE_LABEL[grade],
      'aria-pressed': String(grade === data.grade)
    });
    btn.addEventListener('click', async () => {
      sfxClick();
      if (grade === store.load().grade) return;
      const ok = await dialog({
        title: `切换到${GRADE_LABEL[grade]}？`,
        body: '会按新年级重新生成今天的任务，今天的完成记录会清空；积分、连续天数和兑换记录保留。',
        actions: [
          { label: '再想想', value: false, kind: 'ghost' },
          { label: '确认切换', value: true, kind: 'primary' }
        ]
      });
      if (!ok) return;
      regenerateToday(grade);
      parentOpen = false;
      refresh();
      toast(`已切换到${GRADE_LABEL[grade]}`, 'ok');
    });
    list.append(btn);
  });

  return el('div', { class: 'card grade-bar' }, [
    el('span', { class: 'grade-label', text: '选择年级' }),
    list
  ]);
}

/* ------------------------- 总进度 ------------------------- */

function renderProgress() {
  const prog = dayProgress(day);
  const done = allSubjectsDone(day);
  const bar = el('i');
  bar.style.width = `${prog.percent}%`;

  return el('div', { class: 'card progress' }, [
    el('div', { class: 'progress-head' }, [
      el('h2', {}, ['今日进度', el('span', { class: 'date', text: store.formatDateCN(store.todayKey()) })]),
      done ? chip('四科全部达标 🎉', 'chip-ok') : chip(focusTextOf(day.weekday), 'chip-gold')
    ]),
    el('div', { class: 'progress-bar' }, [bar]),
    el('div', { class: 'progress-text' }, [
      el('span', {}, ['已完成 ', el('b', { text: prog.done }), ` / ${prog.total} 项`]),
      el('span', {
        text: done ? '去开启今日宝箱吧 →' : `再完成 ${prog.total - prog.done} 项就点亮宝箱`
      })
    ])
  ]);
}

/* ------------------------- 学科任务 ------------------------- */

function renderSubjects() {
  const progress = subjectProgress(day);
  const wrap = el('div', { class: 'subjects' });

  store.SUBJECTS.forEach((subject) => {
    const meta = store.SUBJECT_META[subject];
    const list = day.tasks.filter((t) => t.subject === subject);
    const info = progress[subject];

    const taskList = el('div', { class: 'task-list' });
    list.forEach((task) => {
      const go = el('a', {
        class: `btn task-go ${task.done ? 'btn-ghost' : 'btn-primary'}`,
        href: `${meta.page}?task=${encodeURIComponent(task.id)}`,
        text: task.done ? '复习' : '去挑战'
      });
      go.addEventListener('click', () => unlockAudio());

      const metaRow = el('div', { class: 'task-meta' }, [
        chip(`${task.questions.length} 题`, 'chip-line'),
        chip(`含 ${task.level2} 道挑战题`, 'chip-level')
      ]);
      if (task.done) metaRow.append(chip('已达标 ✓', 'chip-ok'));

      taskList.append(
        el('div', { class: `task ${task.done ? 'is-done' : ''}`.trim() }, [
          el('div', { class: 'task-info' }, [
            el('div', { class: 'task-name', text: task.title }),
            metaRow
          ]),
          go
        ])
      );
    });

    const headChildren = [
      el('div', { class: 'subject-badge', text: meta.icon }),
      el('div', { class: 'subject-title' }, [
        el('h3', { text: meta.name }),
        el('p', { text: '首答正确 3 题即达标，答错可重试' })
      ])
    ];

    // 数学卡标题行直接给出奥数入口，避免入口埋在卡底部找不到
    if (subject === 'math') {
      const headOly = el('a', {
        class: 'btn olympic-head-btn',
        href: 'olympic.html',
        text: '🧠 奥数',
        'aria-label': '进入奥数专区'
      });
      headOly.addEventListener('click', () => unlockAudio());
      headChildren.push(headOly);
    }

    headChildren.push(el('span', {
      class: `subject-count ${info.done === info.total ? 'done' : ''}`.trim(),
      text: `${info.done}/${info.total}`
    }));

    const cardChildren = [
      el('div', { class: 'subject-head' }, headChildren),
      taskList
    ];

    // 数学卡底部保留完整说明入口
    if (subject === 'math') {
      const olympicGo = el('a', {
        class: 'btn btn-ghost btn-block olympic-entry',
        href: 'olympic.html',
        text: '🧠 奥数专区 · 思维加餐（每日上限 20 分）'
      });
      olympicGo.addEventListener('click', () => unlockAudio());
      cardChildren.push(el('div', { class: 'olympic-entry-wrap' }, [olympicGo]));
    }

    wrap.append(
      el('div', { class: 'card subject', dataset: { subject } }, cardChildren)
    );
  });

  return wrap;
}

/* ------------------------- 宝箱 ------------------------- */

function renderChest() {
  const state = chestState(day);
  const doneCount = day.tasks.filter((t) => t.done).length;
  const missing = day.tasks.length - doneCount;

  let emoji = '🔒';
  let tip = `完成四科全部任务后点亮，还差 ${missing} 项。`;
  let btnText = '宝箱未点亮';
  let btnClass = 'btn btn-ghost btn-block';
  let btnDisabled = true;

  if (state.state === 'unlocked') {
    emoji = '🎁';
    tip = '四科全部达标，宝箱已经点亮！今天只能开一次哦。';
    btnText = '开启今日宝箱';
    btnClass = 'btn btn-gold btn-block';
    btnDisabled = false;
  } else if (state.state === 'opened') {
    emoji = state.reward?.emoji || '🎉';
    tip = `今天抽到了：${state.reward?.name || '惊喜奖励'}。明天再来吧！`;
    btnText = '已领取，明天再来';
    btnClass = 'btn btn-ghost btn-block';
    btnDisabled = true;
  }

  const card = el('div', {
    class: `card chest is-${state.state}`
  }, [
    el('h3', { text: '今日宝箱' }),
    el('div', { class: 'chest-stage', text: emoji }),
    el('p', { class: 'chest-tip', text: tip })
  ]);

  if (state.state === 'opened' && state.reward) {
    card.append(el('div', { class: 'chest-reward', text: `${state.reward.emoji || ''} ${state.reward.name}` }));
  }

  const btn = el('button', { class: btnClass, type: 'button', text: btnText, disabled: btnDisabled });
  btn.addEventListener('click', () => {
    sfxClick();
    handleOpenChest();
  });
  card.append(btn);
  return card;
}

function handleOpenChest() {
  const res = openChest();
  if (!res.ok) {
    if (res.reason === 'locked') toast('完成四科全部任务后才能开宝箱', 'bad');
    else if (res.reason === 'opened') toast('今天已经开过宝箱啦', 'bad');
    return;
  }

  refresh();
  const reward = res.reward;
  if (reward.type === 'points') {
    celebrate({
      emoji: reward.emoji || '⭐',
      title: '宝箱奖励！',
      subtitle: `${reward.name} 已计入积分`,
      points: reward.points,
      variant: 'chest',
      buttonText: '太棒了'
    });
    return;
  }

  celebrate({
    emoji: reward.emoji || '🎁',
    title: reward.name,
    subtitle: reward.desc || '宝箱里的惊喜',
    variant: 'chest',
    buttonText: reward.type === 'minigame' ? '开始玩' : '播放',
    speech: `宝箱开出${reward.name}，你太棒了！`,
    onClose: () => {
      if (reward.type === 'minigame') openMinigame(reward.game);
      else if (reward.type === 'video') openVideo(reward);
    }
  });
}

function openVideo(reward) {
  const overlay = el('div', { class: 'overlay' });
  const video = el('video', {
    src: reward.src,
    controls: true,
    autoplay: true,
    playsInline: true,
    style: { width: '100%', borderRadius: '16px', background: '#000', marginTop: '12px' }
  });
  const sheet = el('div', { class: 'sheet', style: { width: 'min(720px, 100%)' } }, [
    el('h3', { text: `${reward.emoji || '🎬'} ${reward.name}` }),
    el('p', { text: reward.desc || '' }),
    video
  ]);
  const close = el('button', { class: 'btn btn-gold btn-block', type: 'button', text: '看完了' });
  close.addEventListener('click', () => {
    video.pause();
    overlay.remove();
  });
  sheet.append(close);
  overlay.append(sheet);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      video.pause();
      overlay.remove();
    }
  });
  document.body.append(overlay);
}

/* ------------------------- 积分商店 ------------------------- */

function renderShop() {
  const state = shopState();
  const list = el('div', { class: 'shop-list' });

  state.items.forEach((item) => {
    const btn = el('button', {
      class: `btn ${item.affordable ? 'btn-primary' : 'btn-ghost'}`,
      type: 'button',
      text: item.affordable ? '兑换' : `还差 ${item.shortfall} 分`,
      disabled: !item.affordable
    });
    btn.addEventListener('click', async () => {
      sfxClick();
      if (!item.affordable) {
        toast(`还差 ${item.shortfall} 积分，继续完成任务吧`, 'bad');
        return;
      }
      const ok = await dialog({
        title: `兑换「${item.name}」？`,
        body: `将消耗 ${item.cost} 积分。兑换后请和家长一起兑现。`,
        actions: [
          { label: '取消', value: false, kind: 'ghost' },
          { label: '确认兑换', value: true, kind: 'primary' }
        ]
      });
      if (!ok) return;
      const res = redeemItem(item.id);
      if (!res.ok) {
        toast(`还差 ${res.shortfall || 0} 积分`, 'bad');
        return;
      }
      refresh();
      toast('兑换成功，记得兑换奖励哦', 'ok');
    });

    list.append(
      el('div', { class: `shop-item ${item.affordable ? '' : 'is-locked'}`.trim() }, [
        el('div', { class: 'shop-icon', text: item.emoji }),
        el('div', { class: 'shop-info' }, [
          el('div', { class: 'shop-name', text: item.name }),
          el('div', { class: 'shop-cost', text: `${item.cost} 积分${item.desc ? ` · ${item.desc}` : ''}` })
        ]),
        btn
      ])
    );
  });

  const card = el('div', { class: 'card shop' }, [
    el('div', { class: 'shop-head' }, [
      el('h3', { text: '积分商店' }),
      el('span', { class: 'shop-points' }, ['当前 ', el('b', { text: state.points }), ' 分'])
    ]),
    list
  ]);

  if (state.orders.length) {
    const orders = el('div', { class: 'shop-orders' }, [el('h4', { text: '最近兑换' })]);
    const ul = el('ul');
    state.orders.slice(0, 4).forEach((order) => {
      ul.append(el('li', {}, [
        el('span', { text: `${store.formatDateCN(order.date)} · ${order.name}` }),
        el('span', { text: `-${order.cost}` })
      ]));
    });
    orders.append(ul);
    card.append(orders);
  }

  return card;
}

/* ------------------------- 数据管理 ------------------------- */

function renderData() {
  const exportBtn = el('button', { class: 'btn btn-ghost', type: 'button', text: '导出 JSON' });
  exportBtn.addEventListener('click', () => {
    sfxClick();
    const blob = new Blob([store.exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `每日任务备份-${store.currentUser()}-${store.todayKey()}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
    toast('备份文件已开始下载', 'ok');
  });

  const importBtn = el('button', { class: 'btn btn-ghost', type: 'button', text: '导入 JSON' });
  importBtn.addEventListener('click', () => {
    sfxClick();
    pickImportFile();
  });

  const resetBtn = el('button', { class: 'btn danger', type: 'button', text: '重置当前用户数据' });
  resetBtn.addEventListener('click', async () => {
    sfxClick();
    const ok = await dialog({
      title: `重置「${store.currentUser()}」的数据？`,
      body: '该用户的积分、打卡记录、兑换记录都会清空，无法恢复；其他用户不受影响。建议先导出备份。',
      actions: [
        { label: '取消', value: false, kind: 'ghost' },
        { label: '确认重置', value: true, kind: 'danger' }
      ]
    });
    if (!ok) return;
    store.resetAll();
    setSoundEnabled(true);
    parentOpen = false;
    refresh();
    toast('数据已重置', 'ok');
  });

  return el('div', { class: 'card data' }, [
    el('h3', { text: '数据管理' }),
    el('p', { text: '数据只存在本机浏览器，换设备或清理缓存前请先导出备份。' }),
    el('div', { class: 'data-actions' }, [exportBtn, importBtn, resetBtn])
  ]);
}

function pickImportFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = store.parseImport(text);
      // 选择导入到哪个用户
      const current = store.currentUser();
      const actions = store.listUsers().map((name) => ({
        label: name === current ? `${name}（当前用户）` : name,
        value: name,
        kind: name === current ? 'primary' : 'ghost'
      }));
      actions.push({ label: '取消', value: null, kind: 'ghost' });
      const target = await dialog({
        title: '导入到哪个用户？',
        body: `备份包含 ${Object.keys(parsed.days).length} 天的记录，将覆盖所选用户的现有数据。`,
        actions
      });
      if (!target) return;
      const ok = await dialog({
        title: `确认导入到「${target}」？`,
        body: '覆盖后无法恢复，建议先导出该用户的备份。',
        actions: [
          { label: '取消', value: false, kind: 'ghost' },
          { label: '确认导入', value: true, kind: 'primary' }
        ]
      });
      if (!ok) return;
      store.importData(parsed, target);
      if (target === current) {
        setSoundEnabled(store.load().settings?.sound !== false);
        parentOpen = false;
        refresh();
        toast('导入成功', 'ok');
      } else {
        toast(`已导入到「${target}」，切换用户后即可看到`, 'ok');
      }
    } catch (err) {
      toast(err.message || '导入失败', 'bad');
    }
  });
  input.click();
}

/* ------------------------- 家长核对 ------------------------- */

function answerText(q) {
  if (q.type === 'choice') {
    const idx = Number(q.answer);
    return `${'ABCD'[idx] || ''}. ${q.options?.[idx] ?? ''}`;
  }
  if (q.type === 'judge') return q.answer ? '对 ✔' : '错 ✘';
  if (q.type === 'match') return (q.pairs || []).map((p) => `${p.a} — ${p.b}`).join('；');
  if (q.type === 'order') return String(q.answer);
  return `${q.answer}${q.unit ? ` ${q.unit}` : ''}`;
}

function renderParent() {
  const lock = el('button', { class: 'parent-lock', type: 'button' }, [
    el('span', { text: parentOpen ? '🔓' : '🔒' }),
    el('span', { text: parentOpen ? '答案已展开' : '长按 1.5 秒展开' })
  ]);
  longPress(lock, 1500, () => {
    parentOpen = !parentOpen;
    render(store.load());
  });

  const card = el('div', { class: 'card parent' }, [
    el('div', { class: 'parent-head' }, [
      el('h3', { text: '家长核对 · 今日答案与出处' }),
      lock
    ]),
    el('p', {
      class: 'parent-hint',
      text: '每道题都标注了年级、难度、教材出处和解析。长按按钮可展开或收起，避免孩子直接看到答案。'
    })
  ]);

  if (!parentOpen) return card;

  const body = el('div', { class: 'parent-body' });
  store.SUBJECTS.forEach((subject) => {
    const tasks = day.tasks.filter((t) => t.subject === subject);
    if (!tasks.length) return;
    const group = el('div', { class: 'answer-group' }, [
      el('h4', { text: `${store.SUBJECT_META[subject].icon} ${store.SUBJECT_META[subject].name}` })
    ]);

    tasks.forEach((task) => {
      const table = el('table', { class: 'answer-table' });
      table.append(
        el('thead', {}, [
          el('tr', {}, [
            el('th', { text: '题目' }),
            el('th', { text: '答案' }),
            el('th', { text: '解析 / 出处' }),
            el('th', { text: '年级 · 难度' })
          ])
        ])
      );
      const tbody = el('tbody');
      task.questions.forEach((q) => {
        tbody.append(
          el('tr', {}, [
            el('td', { class: 'q', text: q.prompt }),
            el('td', { class: 'ans', text: answerText(q) }),
            el('td', {}, [
              el('div', { text: q.explain }),
              el('div', { class: 'src', text: q.source })
            ]),
            el('td', { class: 'lv', text: `${GRADE_LABEL[q.grade]} · L${q.level}` })
          ])
        );
      });
      table.append(tbody);
      group.append(
        el('div', { style: { marginTop: '10px', fontWeight: '800' }, text: `${task.title}${task.done ? '（已达标）' : ''}` }),
        table
      );
    });
    body.append(group);
  });

  card.append(body);
  return card;
}

/* ------------------------- 每日庆祝 ------------------------- */

function maybeCelebrateDaily() {
  const data = store.load();
  const today = data.days[store.todayKey()];
  if (!today || !today.allDoneBonus || today.celebrated) return;
  markCelebrated();
  celebrate({
    emoji: '🏆',
    title: '今日任务全部完成！',
    subtitle: `连续打卡 ${data.profile.streak || 1} 天 · 四科全部达标`,
    variant: 'daily',
    buttonText: '享受成果',
    speech: `今天的任务全部完成，你太棒了！已经连续打卡 ${data.profile.streak || 1} 天。`
  });
}

/* ------------------------- 启动 ------------------------- */

refresh();
