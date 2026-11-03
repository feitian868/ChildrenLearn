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
import {
  stateOf as petStateOf,
  addFood as petAddFood,
  LEVEL_THRESHOLDS,
} from '../core/pet.js';
import { markCelebrated } from '../core/score.js';
import { celebrate, playerName } from '../core/fx.js';
import { openMinigame } from '../core/minigames.js';
import { SONGS, SONG_MAP, playSong } from '../core/songs.js';
import {
  setSoundEnabled,
  isSoundEnabled,
  sfxClick,
  unlockAudio
} from '../core/audio.js';
import { el, clear, dialog, longPress, toast } from '../core/ui.js';

const app = document.getElementById('app');
let parentOpen = false;

/* ============ 视频场景动画（CSS 关键帧，只注入一次） ============ */
(function injectVideoSceneCSS() {
  if (document.getElementById('__video-scene-css')) return;
  const s = document.createElement('style');
  s.id = '__video-scene-css';
  s.textContent = `
@keyframes vs-sway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
@keyframes vs-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes vs-bubble{0%{transform:translateY(0);opacity:0}20%{opacity:1}100%{transform:translateY(-220px);opacity:0}}
@keyframes vs-wave{0%,100%{transform:translateX(-10px)}50%{transform:translateX(10px)}}
@keyframes vs-swim1{0%{transform:translateX(0) scaleX(1)}49%{transform:translateX(440px) scaleX(1)}50%{transform:translateX(440px) scaleX(-1)}99%{transform:translateX(0) scaleX(-1)}100%{transform:translateX(0) scaleX(1)}}
@keyframes vs-swim2{0%{transform:translateX(0) scaleX(1)}49%{transform:translateX(460px) scaleX(1)}50%{transform:translateX(460px) scaleX(-1)}99%{transform:translateX(0) scaleX(-1)}100%{transform:translateX(0) scaleX(1)}}
@keyframes vs-butterfly1{0%{transform:translate(0,0) rotate(0)}25%{transform:translate(20px,-30px) rotate(15deg)}50%{transform:translate(60px,-10px) rotate(-10deg)}75%{transform:translate(30px,-50px) rotate(10deg)}100%{transform:translate(0,0) rotate(0)}}
@keyframes vs-butterfly2{0%{transform:translate(0,0) rotate(0)}25%{transform:translate(-30px,-20px) rotate(-15deg)}50%{transform:translate(-70px,10px) rotate(10deg)}75%{transform:translate(-40px,-40px) rotate(-5deg)}100%{transform:translate(0,0) rotate(0)}}
@keyframes vs-cloud{0%{transform:translateX(-120px)}100%{transform:translateX(820px)}}
@keyframes vs-bird{0%{transform:translateX(0) translateY(0)}25%{transform:translateX(200px) translateY(-15px)}50%{transform:translateX(400px) translateY(0)}75%{transform:translateX(600px) translateY(-10px)}100%{transform:translateX(800px) translateY(0)}}
  `;
  document.head.appendChild(s);
})();

/** Canvas 粒子层：星星 / 萤火虫 / 雪花 / 气泡 */
function makeParticleCanvas(wrap, { count, color, size, speed, type }) {
  const canvas = el('canvas', {
    style: { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none' }
  });
  wrap.prepend(canvas);
  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    canvas.getContext('2d').scale(dpr, dpr);
  };
  resize();
  window.addEventListener('resize', resize);
  const ctx = canvas.getContext('2d');
  const W = () => canvas.clientWidth;
  const H = () => canvas.clientHeight;

  const particles = Array.from({ length: count }, () => ({
    x: Math.random() * W(),
    y: Math.random() * H(),
    s: size[0] + Math.random() * (size[1] - size[0]),
    vx: (Math.random() - 0.5) * speed[0] * 2,
    vy: (Math.random() - 0.5) * speed[1] * 2,
    a: Math.random() * Math.PI * 2,
    alph: 0.4 + Math.random() * 0.6
  }));

  let raf;
  const draw = () => {
    ctx.clearRect(0, 0, W(), H());
    for (const p of particles) {
      p.a += 0.03;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -20) p.x = W() + 20;
      if (p.x > W() + 20) p.x = -20;
      if (p.y < -20) p.y = H() + 20;
      if (p.y > H() + 20) p.y = -20;

      ctx.save();
      ctx.globalAlpha = type === 'firefly' ? 0.6 + 0.4 * Math.sin(p.a) : p.alph;
      if (type === 'star') {
        // 星星：圆角矩形 + 闪光
        ctx.shadowColor = color; ctx.shadowBlur = 6;
        ctx.fillStyle = color;
        ctx.fillRect(p.x, p.y, p.s, p.s);
      } else if (type === 'firefly') {
        // 萤火虫：发光圆点
        ctx.shadowColor = color; ctx.shadowBlur = 18;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill();
      } else if (type === 'snow') {
        // 雪花
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(255,255,255,.6)'; ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill();
      } else if (type === 'bubble') {
        // 水里浮气泡
        ctx.strokeStyle = color; ctx.lineWidth = 1.2;
        ctx.fillStyle = 'rgba(255,255,255,.15)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }
    raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);

  return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); canvas.remove(); };
}

/** 4 种有 Canvas 粒子 + 渐变 + 多层 emoji 的场景，返回 { el, cleanup } */
const VIDEO_SCENES = {
  forest: () => {
    const wrap = el('div', { style: { position: 'relative', height: '280px', borderRadius: '12px', overflow: 'hidden', background: 'linear-gradient(180deg,#c9e9ff 0%,#a3d99b 55%,#3b6a2a 100%)' } });
    wrap.append(
      el('div', { text: '☀️', style: { position: 'absolute', top: '10px', right: '14px', fontSize: '56px', animation: 'vs-sway 5s ease-in-out infinite' } }),
      el('div', { text: '☁️', style: { position: 'absolute', top: '16px', left: '-80px', fontSize: '32px', animation: 'vs-cloud 20s linear infinite' } }),
      el('div', { text: '☁️', style: { position: 'absolute', top: '48px', left: '-100px', fontSize: '24px', animation: 'vs-cloud 26s linear infinite 8s' } })
    );
    // 树（近处大、远处小）
    for (let i = 0; i < 3; i++) {
      wrap.append(el('div', {
        text: '🌲', style: { position: 'absolute', left: `${8 + i * 30}%`, bottom: '18%', fontSize: '36px', animation: 'vs-sway 4s ease-in-out infinite', zIndex: 1 }
      }));
    }
    for (let i = 0; i < 3; i++) {
      wrap.append(el('div', {
        text: '🌳', style: { position: 'absolute', left: `${18 + i * 28}%`, bottom: '4%', fontSize: `${46 + i * 10}px`, animation: `vs-sway ${3.5 + i}s ease-in-out infinite`, zIndex: 2 }
      }));
    }
    wrap.append(
      el('div', { text: '🦋', style: { position: 'absolute', top: '90px', left: '20%', fontSize: '26px', animation: 'vs-butterfly1 7s ease-in-out infinite' } }),
      el('div', { text: '🐿️', style: { position: 'absolute', bottom: '6px', left: '65%', fontSize: '22px', animation: 'vs-float 3.5s ease-in-out infinite' } }),
      el('div', { style: { position: 'absolute', bottom: '0', left: '0', right: '0', height: '22px', background: 'linear-gradient(180deg,#4c7c3a,#27501a)' } })
    );
    // Canvas 萤火虫
    const cleanupParticles = makeParticleCanvas(wrap, { count: 18, color: '#fff3a8', size: [1.5, 3], speed: [0.6, 0.3], type: 'firefly' });
    return { el: wrap, cleanup: cleanupParticles };
  },

  butterfly: () => {
    const wrap = el('div', { style: { position: 'relative', height: '280px', borderRadius: '12px', overflow: 'hidden', background: 'linear-gradient(180deg,#fff3a8 0%,#d4f4a3 60%,#8ed99a 100%)' } });
    wrap.append(
      el('div', { text: '🌞', style: { position: 'absolute', top: '6px', right: '12px', fontSize: '46px' } }),
      el('div', { text: '🌻', style: { position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', fontSize: '52px', animation: 'vs-sway 5s ease-in-out infinite' } }),
      el('div', { text: '🌸', style: { position: 'absolute', top: '110px', left: '8px', fontSize: '24px', animation: 'vs-float 3s ease-in-out infinite' } }),
      el('div', { text: '🌷', style: { position: 'absolute', top: '150px', right: '10px', fontSize: '22px', animation: 'vs-float 3.4s ease-in-out infinite .6s' } }),
      el('div', { text: '🌼', style: { position: 'absolute', bottom: '6px', left: '38%', fontSize: '20px', animation: 'vs-float 4s ease-in-out infinite' } })
    );
    // 3 只大蝴蝶 + 2 只小蝴蝶
    wrap.append(
      el('div', { text: '🦋', style: { position: 'absolute', top: '70px', left: '18%', fontSize: '34px', animation: 'vs-butterfly1 6s ease-in-out infinite' } }),
      el('div', { text: '🦋', style: { position: 'absolute', top: '40px', right: '18%', fontSize: '28px', animation: 'vs-butterfly2 7s ease-in-out infinite 1.2s' } }),
      el('div', { text: '🦋', style: { position: 'absolute', bottom: '50px', left: '48%', fontSize: '30px', animation: 'vs-butterfly1 5.5s ease-in-out infinite 2.4s' } }),
      el('div', { text: '🐝', style: { position: 'absolute', top: '100px', left: '62%', fontSize: '18px', animation: 'vs-butterfly2 4s ease-in-out infinite' } })
    );
    const cleanupParticles = makeParticleCanvas(wrap, { count: 22, color: '#ffd766', size: [1.5, 3.5], speed: [0.5, 0.2], type: 'firefly' });
    return { el: wrap, cleanup: cleanupParticles };
  },

  ocean: () => {
    const wrap = el('div', { style: { position: 'relative', height: '280px', borderRadius: '12px', overflow: 'hidden', background: 'linear-gradient(180deg,#a8dcff 0%,#3a78c8 45%,#0c1d4a 100%)' } });
    wrap.append(
      el('div', { text: '☀️', style: { position: 'absolute', top: '6px', right: '14px', fontSize: '42px', opacity: '0.85' } }),
      el('div', { style: { position: 'absolute', top: '0', left: '0', right: '0', height: '16px', background: 'linear-gradient(180deg,rgba(255,255,255,.7),transparent)', animation: 'vs-wave 3.2s ease-in-out infinite' } }),
      // 4 层鱼群
      el('div', { text: '🐠', style: { position: 'absolute', top: '50px', left: '-40px', fontSize: '32px', animation: 'vs-swim1 5.5s linear infinite' } }),
      el('div', { text: '🐟', style: { position: 'absolute', top: '90px', left: '-60px', fontSize: '26px', animation: 'vs-swim2 7s linear infinite 1.2s' } }),
      el('div', { text: '🐡', style: { position: 'absolute', top: '140px', left: '-50px', fontSize: '30px', animation: 'vs-swim1 9s linear infinite 3s' } }),
      el('div', { text: '🦑', style: { position: 'absolute', top: '170px', left: '-40px', fontSize: '26px', animation: 'vs-swim2 8s linear infinite 4s' } }),
      // 海底
      el('div', { text: '🪸', style: { position: 'absolute', bottom: '4px', left: '12px', fontSize: '40px' } }),
      el('div', { text: '🌿', style: { position: 'absolute', bottom: '4px', right: '16px', fontSize: '30px', animation: 'vs-sway 4s ease-in-out infinite' } }),
      el('div', { text: '🐚', style: { position: 'absolute', bottom: '2px', left: '45%', fontSize: '18px' } })
    );
    const cleanupParticles = makeParticleCanvas(wrap, { count: 24, color: 'rgba(200,240,255,.7)', size: [2, 5], speed: [0.25, -0.45], type: 'bubble' });
    return { el: wrap, cleanup: cleanupParticles };
  },

  sky: () => {
    const wrap = el('div', { style: { position: 'relative', height: '280px', borderRadius: '12px', overflow: 'hidden', background: 'linear-gradient(180deg,#fde68a 0%,#fb923c 35%,#f472b6 70%,#9b6cf4 100%)' } });
    wrap.append(
      el('div', { text: '🌤️', style: { position: 'absolute', top: '14px', left: '50%', transform: 'translateX(-50%)', fontSize: '60px' } }),
      // 4 层不同速度的云
      el('div', { text: '☁️', style: { position: 'absolute', top: '50px', left: '-140px', fontSize: '44px', animation: 'vs-cloud 22s linear infinite' } }),
      el('div', { text: '☁️', style: { position: 'absolute', top: '100px', left: '-160px', fontSize: '34px', animation: 'vs-cloud 28s linear infinite 6s' } }),
      el('div', { text: '☁️', style: { position: 'absolute', top: '140px', left: '-180px', fontSize: '28px', animation: 'vs-cloud 34s linear infinite 12s' } }),
      el('div', { text: '🕊️', style: { position: 'absolute', top: '70px', left: '-60px', fontSize: '18px', animation: 'vs-bird 12s linear infinite' } }),
      el('div', { text: '🦅', style: { position: 'absolute', top: '160px', left: '-80px', fontSize: '20px', animation: 'vs-bird 15s linear infinite 5s' } })
    );
    // Canvas 星星（黄昏背景中若隐若现）
    const cleanupParticles = makeParticleCanvas(wrap, { count: 40, color: '#fff7b8', size: [1, 3], speed: [0.15, 0.1], type: 'star' });
    return { el: wrap, cleanup: cleanupParticles };
  }
};
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
      el('div', { class: 'wb-side' }, [renderChest(), renderPet(), renderShop(), renderData()])
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
        el('small', { text: '积分 · 每任务+2' })
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

  // 时间预估：未完成任务 × 10 分钟/项，跟读约 10 分钟，奥数可选
  const remaining = prog.total - prog.done;
  let estMin = remaining * 10;
  // 跟读如果没做
  const sk = store.todayKey();
  const spProg = store.load().speakingProgress?.[sk] || {};
  const spTotal = spProg.total || 12;
  if ((spProg.passed?.length || 0) < spTotal) estMin += 10;
  const estText = remaining === 0 ? '四科都完成啦 🎉' : `预计还要 ${estMin} 分钟`;

  return el('div', { class: 'card progress' }, [
    el('div', { class: 'progress-head' }, [
      el('h2', {}, ['今日进度', el('span', { class: 'date', text: store.formatDateCN(store.todayKey()) })]),
      done ? chip('四科全部达标 🎉', 'chip-ok') : chip(focusTextOf(day.weekday), 'chip-gold')
    ]),
    el('div', { class: 'progress-bar' }, [bar]),
    el('div', { class: 'progress-text' }, [
      el('span', {}, ['已完成 ', el('b', { text: prog.done }), ` / ${prog.total} 项`]),
      el('span', {}, [
        done ? '去开启今日宝箱吧 →' : `再完成 ${prog.total - prog.done} 项就点亮宝箱`,
        el('small', { class: 'progress-est', text: ` · ${estText}` })
      ])
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
        el('p', { text: '首答正确 3 题即达标，答错可重试 · 每完成 1 项 +2 分' })
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

      // 奥数今日状态徽章
      const todayOly = day.olympicEarned || 0;
      if (todayOly > 0) {
        headChildren.push(el('span', {
          class: 'chip chip-gold oly-today-chip',
          text: `🧠 +${todayOly}`
        }));
      }
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
        text: '🧠 奥数专区 · 思维加餐（每日上限 5 分）'
      });
      olympicGo.addEventListener('click', () => unlockAudio());
      cardChildren.push(el('div', { class: 'olympic-entry-wrap' }, [olympicGo]));
    }

    wrap.append(
      el('div', { class: 'card subject', dataset: { subject } }, cardChildren)
    );
  });

  // 英语口语跟读（独立卡片，不参与四科进度）
  // 整张卡片就是链接，点标题、进度、按钮任意位置都能进入，避免只有小按钮可点
  const dataNow = store.load();
  const sk = store.todayKey();
  const spProg = dataNow.speakingProgress?.[sk] || {};
  const spTotal = spProg.total || 12;
  const spDone = Math.min(spProg.passed?.length || 0, spTotal);
  const spCard = el('a', {
    class: 'card subject spk-card',
    href: 'speaking.html',
    'aria-label': '进入英语口语跟读'
  }, [
    el('div', { class: 'subject-head' }, [
      el('div', { class: 'subject-badge', text: '🎤' }),
      el('div', { class: 'subject-title' }, [
        el('h3', { text: '英语口语跟读' }),
        el('p', { text: '单词拼写 + 句子 + 情景对话 · 约 10 分钟' })
      ]),
      el('span', {
        class: `subject-count ${spDone >= spTotal ? 'done' : ''}`.trim(),
        text: `${spDone}/${spTotal}`
      })
    ]),
    el('span', {
      class: `btn btn-block ${spDone >= spTotal ? 'btn-ghost' : 'btn-primary'}`,
      text: spDone >= spTotal ? '🔁 再练一遍' : '🎤 开始跟读'
    })
  ]);
  spCard.addEventListener('click', () => { unlockAudio(); sfxClick(); });
  wrap.append(spCard);

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
    tip = `今天抽到了：${state.reward?.name || '惊喜奖励'}。`;
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

/* ------------------------- 宠物 ------------------------- */

function renderPet() {
  const pet = petStateOf(); // null = 还没领养

  const card = el('div', { class: 'card pet-card' });

  if (!pet) {
    // 未领养状态
    card.append(
      el('h3', { text: '🐾 宠物乐园' }),
      el('div', { class: 'pet-stage', style: { background: 'linear-gradient(180deg, #E0E0E0 0%, #BDBDBD 100%)' } }, [
        el('div', { style: { fontSize: '60px', opacity: 0.35 }, text: '🐾' }),
      ]),
      el('p', { class: 'chest-tip', style: { marginTop: '8px' }, text: '还没有小伙伴哦，选一只来陪你学习吧！' }),
      el('button', {
        class: 'btn btn-gold btn-block',
        type: 'button',
        text: '🐾 去领养宠物',
        onclick: () => { sfxClick(); window.location.href = 'pet.html'; }
      }),
    );
    return card;
  }

  // 已领养
  const expNext = pet.levelNextAt - (LEVEL_THRESHOLDS[pet.level - 1] ?? 0);
  const expCur  = pet.exp - (LEVEL_THRESHOLDS[pet.level - 1] ?? 0);
  const expPct = expNext > 0 ? Math.round((expCur / expNext) * 100) : 100;

  const svgWrap = el('div', { class: `pet-stage ${pet.moodClass}` }, [
    el('div', { class: 'pet-wrap-inline', innerHTML: pet.speciesSvg }),
  ]);
  svgWrap.addEventListener('click', () => { window.location.href = 'pet.html'; });

  const barHunger = el('div', { class: 'bar-row hunger' }, [
    el('span', { class: 'lbl', text: '饿' }),
    el('div', { class: 'bar' }, [el('div', { class: 'fill', style: { width: pet.hunger + '%' } })]),
    el('span', { class: 'val', text: pet.hunger }),
  ]);
  const barMood = el('div', { class: 'bar-row mood' }, [
    el('span', { class: 'lbl', text: '心情' }),
    el('div', { class: 'bar' }, [el('div', { class: 'fill', style: { width: pet.mood + '%' } })]),
    el('span', { class: 'val', text: pet.mood }),
  ]);
  const barExp = el('div', { class: 'bar-row exp' }, [
    el('span', { class: 'lbl', text: 'Lv.' + pet.level }),
    el('div', { class: 'bar' }, [el('div', { class: 'fill', style: { width: expPct + '%' } })]),
    el('span', { class: 'val', text: expPct + '%' }),
  ]);

  card.append(
    el('h3', {}, [
      el('span', { class: 'pet-name', text: `${pet.speciesEmoji} ${pet.nickname}` }),
      el('span', { class: 'pet-lv', text: `Lv.${pet.level}` }),
    ]),
    svgWrap,
    el('div', { class: 'pet-bars' }, [barHunger, barMood, barExp]),
    el('div', { class: 'pet-actions' }, [
      el('button', {
        class: 'btn btn-primary btn-block', type: 'button', text: '去乐园',
        onclick: () => { sfxClick(); window.location.href = 'pet.html'; }
      }),
    ]),
  );
  return card;
}

/** 已开过的奖励，再玩一次按钮文案 */
function replayText(reward) {
  if (reward.type === 'minigame') return '再玩一次';
  if (reward.type === 'song') return '再听一遍';
  if (reward.type === 'video') return '再看一遍';
  return '已领取，明天再来';
}

/** 按奖励类型分发：小游戏 / 儿歌 / 动画片 */
function playReward(reward) {
  if (reward.type === 'minigame') openMinigame(reward.game);
  else if (reward.type === 'song') openSong(reward.song ? SONG_MAP[reward.song] : null);
  else if (reward.type === 'video') openVideo(reward);
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

  // 宠物食物包：自动进背包
  if (reward.type === 'pet-food-pack') {
    const hasPet = Boolean(petStateOf());
    if (hasPet) {
      petAddFood(reward.foodId, reward.count);
    }
    celebrate({
      emoji: reward.emoji || '🍪',
      title: reward.name,
      subtitle: hasPet
        ? `已送到宠物背包！去宠物乐园看看吧`
        : `领养宠物后自动进背包，先去领养一只吧`,
      variant: 'chest',
      buttonText: hasPet ? '去看看宠物' : '去领养宠物',
      speech: hasPet
        ? `宝箱给${playerName()}的宠物送了${reward.count}个食物！`
        : `${playerName()}先去领养一只宠物吧`,
      onClose: () => { window.location.href = 'pet.html'; }
    });
    return;
  }

  celebrate({
    emoji: reward.emoji || '🎁',
    title: reward.name,
    subtitle: reward.desc || '宝箱里的惊喜',
    variant: 'chest',
    buttonText: reward.type === 'minigame' ? '开始玩' : reward.type === 'song' ? '听一听' : '播放',
    speech: `宝箱开出${reward.name}，${playerName()}太棒了！`,
    onClose: () => playReward(reward)
  });
}

function openVideo(reward) {
  const sceneFn = VIDEO_SCENES[reward.scene] || VIDEO_SCENES.forest;
  const scene = sceneFn();  // { el, cleanup }
  const overlay = el('div', { class: 'overlay' });
  const sheet = el('div', { class: 'sheet', style: { width: 'min(720px, 100%)' } }, [
    el('h3', { text: `${reward.emoji || '🎬'} ${reward.name}` }),
    el('p', { text: reward.desc || '', style: { color: '#718096', fontSize: '13px', margin: '4px 0 10px' } }),
    scene.el
  ]);
  const close = el('button', { class: 'btn btn-gold btn-block', type: 'button', text: '看完了' });
  const closeAll = () => { scene.cleanup?.(); overlay.remove(); };
  close.addEventListener('click', closeAll);
  sheet.append(close);
  overlay.append(sheet);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeAll(); });
  document.body.append(overlay);
}

/** 儿歌弹层：播放 / 停止，关掉弹层自动停 */
function openSong(song) {
  const item = song || SONGS[0];
  const overlay = el('div', { class: 'overlay' });
  const tip = el('p', { class: 'mini-result', text: item.tip || '点下面的按钮开始播放 🎵' });
  const playBtn = el('button', { class: 'btn btn-gold btn-block', type: 'button', text: '▶ 播放儿歌' });
  const closeBtn = el('button', { class: 'btn btn-ghost btn-block', type: 'button', text: '听完了' });

  let handle = null;
  const stop = (msg) => {
    handle?.stop();
    handle = null;
    playBtn.textContent = '▶ 再听一遍';
    if (msg) tip.textContent = msg;
  };

  playBtn.addEventListener('click', () => {
    sfxClick();
    if (handle) {
      stop('停下来啦，想听就再点一次。');
      return;
    }
    playBtn.textContent = '⏸ 停止';
    tip.textContent = `正在播放：${item.emoji || '🎵'} ${item.name}`;
    handle = playSong(item, {
      onEnd: () => {
        handle = null;
        playBtn.textContent = '▶ 再听一遍';
        tip.textContent = '听完啦，还想听就再点一次 🎶';
      }
    });
  });

  closeBtn.addEventListener('click', () => {
    stop('');
    overlay.remove();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      stop('');
      overlay.remove();
    }
  });

  const sheet = el('div', { class: 'sheet mini-sheet' }, [
    el('h3', { text: `${item.emoji || '🎵'} ${item.name}` }),
    el('p', { text: '用手机、平板的喇叭就能听到，不用联网加载音频。' }),
    playBtn,
    closeBtn,
    tip
  ]);
  overlay.append(sheet);
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
      el('span', { class: 'shop-points' }, ['当前 ', el('b', { text: state.points }), ' 分 · 每完成 1 项任务 +2 分'])
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
  if (!today || today.celebrated || !allSubjectsDone(today)) return;
  markCelebrated();
  celebrate({
    emoji: '🏆',
    title: '今日任务全部完成！',
    subtitle: `连续打卡 ${data.profile.streak || 1} 天 · 四科全部达标`,
    variant: 'daily',
    buttonText: '享受成果',
    speech: `今天的任务全部完成，${playerName()}太棒了！已经连续打卡 ${data.profile.streak || 1} 天。`
  });
}

/* ------------------------- 启动 ------------------------- */

refresh();
