/**
 * pet.js —— 宠物乐园独立页（升级 v2）
 *
 * 动画体系：
 *   - 空闲循环：呼吸 / 眨眼 / 耳朵抽动 / 尾巴摇摆（CSS infinite）
 *   - 自发行为（每 5-15s 随机）：打哈欠 / 歪头 / 舔爪子 / 蹦跶
 *   - 走动（每 10-25s）：JS 改 pet-wrap.left，CSS transition 平滑移动
 *   - 4 种互动（一次性 class 触发，配合手势 SVG 叠加层）：
 *     feed  → pet-feed    + 🤲手下落 + 🍪食物飞入 + 大嘴吃
 *     touch → pet-touching + 🤲手左右扫 + 耳朵贴平 + 眯眼
 *     play  → pet-play     + ⚽球飞来 + 跳起来接
 *     clean → pet-clean    + 🫧泡泡覆盖 + 抖动 + 闪光
 */

import * as store from '../core/store.js';
import { el, clear, toast } from '../core/ui.js';
import { sfxClick, sfxWin, unlockAudio } from '../core/audio.js';
import {
  stateOf, createPet, feed, touch, play, clean,
  equipDeco, unequipDeco, changeScene, changeNickname,
  LEVEL_THRESHOLDS,
} from '../core/pet.js?v=20261031c';
import { SPECIES, SCENES } from '../data/pet-assets.js';
import { PET_FOODS, PET_DECOS, PET_SCENES } from '../data/pet-shop.js';

const app = document.getElementById('pet-app');
let currentTab = 'feed';

// 全局定时器（render 时先清再重建，避免重影）
let _behaviorTimers = [];
function clearBehaviorTimers() {
  _behaviorTimers.forEach((t) => clearTimeout(t));
  _behaviorTimers = [];
}

/* ============================================================
   入口
   ============================================================ */
unlockAudio();
render();

function render() {
  clearBehaviorTimers();
  const pet = stateOf();
  clear(app);
  if (!pet) {
    app.append(renderAdoptModal());
  } else {
    app.append(renderArena(pet));
    scheduleIdleBehaviors(); // 大舞台渲染完后开启自发行为定时器
  }
}

/* ============================================================
   领养弹窗（不变）
   ============================================================ */
function renderAdoptModal() {
  let selected = null;
  const nameInput = el('input', { class: 'adopt-name-input', type: 'text', maxlength: 8, placeholder: '给宠物起个名字' });
  const grid = el('div', { class: 'adopt-grid' });
  const cards = SPECIES.map((s) => {
    const card = el('div', { class: 'adopt-card', 'data-species': s.id });
    card.innerHTML = s.svg;
    card.append(el('div', { class: 'species-name', text: `${s.emoji} ${s.name}` }));
    card.addEventListener('click', () => {
      selected = s.id;
      cards.forEach((c) => c.classList.toggle('selected', c === card));
    });
    return card;
  });
  cards.forEach((c) => grid.append(c));

  const confirmBtn = el('button', { class: 'btn btn-gold btn-block', type: 'button', text: '确认领养', disabled: true });
  confirmBtn.addEventListener('click', () => {
    if (!selected) return;
    const res = createPet(selected, nameInput.value);
    if (res.ok) { sfxWin(); render(); }
    else toast(res.reason || '领养失败', 'bad');
  });
  cards.forEach((c) => c.addEventListener('click', () => { confirmBtn.disabled = !selected; }));

  const sheet = el('div', { class: 'sheet adopt-modal', style: 'max-width:600px;' });
  sheet.append(
    el('h2', { text: '🐾 选一只宠物陪你学习' }),
    el('p', { style: 'color:var(--ink2); font-size:13px; margin:6px 0 14px;', text: '选好之后永久绑定哦，照顾它每天都能获得成长值！' }),
    grid,
    el('div', { style: 'margin-bottom:8px' }, [nameInput]),
    confirmBtn,
    el('p', { style: 'text-align:center; font-size:12px; color:var(--ink2); margin-top:10px;', text: '送你 2 个小饼干，赶紧去喂它吧！' }),
  );
  return sheet;
}

/* ============================================================
   大舞台（重写 v2）
   ============================================================ */
function renderArena(pet) {
  const arena = el('div', { class: 'pet-page' });

  // 顶部栏
  const topBar = el('div', { style: 'display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:white; border-bottom:1px solid #eee;' }, [
    el('button', { class: 'btn btn-ghost', type: 'button', text: '← 回工作台', onclick: () => { sfxClick(); window.location.href = 'index.html'; } }),
    el('div', { style: 'font-weight:700; font-size:15px;', text: `${pet.speciesEmoji} ${pet.nickname} · Lv.${pet.level}` }),
    el('button', { class: 'btn btn-ghost', type: 'button', text: '🔄', title: '刷新', onclick: () => render() }),
  ]);

  // 乐园舞台容器
  const sceneWrap = el('div', { class: 'pet-arena', style: { background: pet.sceneData.bg } });
  sceneWrap.innerHTML = pet.sceneData.extra || '';

  // 宠物：绝对定位 left 50%，JS 会改它让它"走"
  const petWrap = el('div', { class: `pet-wrap ${pet.moodClass}`, style: { left: '50%', transform: 'translateX(-50%)' } });
  petWrap.innerHTML = pet.speciesSvg;
  // 点宠物 = 抚摸
  petWrap.addEventListener('click', () => triggerTouch(sceneWrap, petWrap));
  sceneWrap.append(petWrap);

  // 快捷互动按钮（每个触发独立手势）
  const actionRow = el('div', { style: {
    position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: '8px', zIndex: '10',
  } }, [
    el('button', { class: 'btn btn-ghost', type: 'button', text: '🤲 抚摸', title: '无限次', onclick: () => triggerTouch(sceneWrap, petWrap) }),
    el('button', { class: 'btn btn-ghost', type: 'button', text: '🍪 喂养', title: '先去背包选食物', onclick: () => { sfxClick(); currentTab = 'feed'; render(); } }),
    el('button', { class: 'btn btn-ghost', type: 'button', text: '🎾 玩耍' + (pet.daily.played ? ' ✓' : ''), title: '每天一次', onclick: () => triggerPlay(sceneWrap, petWrap) }),
    el('button', { class: 'btn btn-ghost', type: 'button', text: '🛁 清洁' + (pet.daily.cleaned ? ' ✓' : ''), title: '每天一次', onclick: () => triggerClean(sceneWrap, petWrap) }),
  ]);
  sceneWrap.append(actionRow);

  arena.append(topBar, sceneWrap);
  arena.append(renderBars(pet));

  // Tab 栏
  const tabBar = el('div', { class: 'pet-tabs' });
  const tabs = [
    { id: 'feed',  label: '🍪 喂养' },
    { id: 'deco',  label: '💄 装饰' },
    { id: 'scene', label: '🏖️ 乐园' },
    { id: 'me',    label: '📖 我的' },
  ];
  tabs.forEach((t) => {
    const btn = el('button', { class: 'tab' + (t.id === currentTab ? ' active' : ''), type: 'button', text: t.label });
    btn.addEventListener('click', () => { currentTab = t.id; render(); });
    tabBar.append(btn);
  });
  arena.append(tabBar, renderPanel(pet));
  return arena;
}

/* ============================================================
   4 种互动：各有独立手势 + 独立动画 class
   JS 触发方式：先强制 reflow 重置动画，再加新 class
   render() 会清除并重建舞台（定时器清空），所以动画里的定时器必须用 _behaviorTimers 之外的单独数组
   ============================================================ */

// 一次性动画定时器（独立于 _behaviorTimers，因为互动后我们不想清）
const _fxTimers = [];

function resetPetAnim(petWrap) {
  // 先清掉所有交互 class
  petWrap.classList.remove('pet-feed', 'pet-touching', 'pet-play', 'pet-clean', 'pet-idle-yawn', 'pet-idle-tilt', 'pet-idle-lick', 'pet-idle-hop', 'pet-walking');
  void petWrap.offsetWidth; // 强制 reflow 让 CSS 重放
}

/** 喂养：手从上落 + 食物飞入 + 宠物张嘴吃 + 舔嘴 */
function triggerFeed(sceneWrap, petWrap, foodEmoji = '🍪') {
  resetPetAnim(petWrap);
  sfxClick();
  petWrap.classList.add('pet-feed');

  // 手从上方落下
  const hand = el('div', { class: 'feed-hand', text: '🤲' });
  sceneWrap.append(hand);
  setTimeout(() => hand.remove(), 1200);

  // 食物飞入
  const food = el('div', { class: 'food-fly', text: foodEmoji });
  sceneWrap.append(food);
  setTimeout(() => food.remove(), 1000);

  // 冒爱心
  spawnParticles(sceneWrap, '💖', 3);
}

/** 抚摸：手左右扫 + 宠物耳朵贴平 + 眯眼享受 */
function triggerTouch(sceneWrap, petWrap) {
  resetPetAnim(petWrap);
  sfxClick();
  petWrap.classList.add('pet-touching');
  touch();

  const hand = el('div', { class: 'pet-hand', text: '🤚' });
  sceneWrap.append(hand);
  setTimeout(() => hand.remove(), 1500);

  spawnParticles(sceneWrap, '💖', 2);
}

/** 玩耍：球飞来 + 宠物跳起来接 + 星星爆炸 */
function triggerPlay(sceneWrap, petWrap) {
  const r = play();
  if (!r.ok) { toast(r.reason === 'daily-limit' ? '今天玩过啦，明天再来' : r.reason, 'bad'); return; }
  sfxClick();
  resetPetAnim(petWrap);
  petWrap.classList.add('pet-play');

  const ball = el('div', { class: 'play-ball', text: '⚽' });
  sceneWrap.append(ball);
  setTimeout(() => ball.remove(), 1400);

  spawnParticles(sceneWrap, '⭐', 6);
}

/** 清洁：泡泡覆盖 + 宠物抖动 + 闪闪发亮 */
function triggerClean(sceneWrap, petWrap) {
  const r = clean();
  if (!r.ok) { toast(r.reason === 'daily-limit' ? '今天清洁过啦' : r.reason, 'bad'); return; }
  sfxClick();
  resetPetAnim(petWrap);
  petWrap.classList.add('pet-clean');

  // 生成 5-7 个泡泡
  const rect = sceneWrap.getBoundingClientRect();
  for (let i = 0; i < 6; i++) {
    const b = el('div', { class: 'clean-bubble', text: ['🫧', '💧', '✨'][i % 3] });
    b.style.left = (rect.width * 0.3 + Math.random() * rect.width * 0.4) + 'px';
    b.style.top  = (rect.height * 0.2 + Math.random() * rect.height * 0.4) + 'px';
    b.style.animationDelay = (i * 0.15) + 's';
    sceneWrap.append(b);
    setTimeout(() => b.remove(), 1800);
  }
}

/* ============================================================
   自发行为调度（渲染完成后启动，render 时清）
   ============================================================ */
function scheduleIdleBehaviors() {
  const arena = document.querySelector('.pet-arena');
  const petWrap = document.querySelector('.pet-wrap');
  if (!arena || !petWrap) return;

  // 1. 自发行为：每 6-14 秒随机做一个小动作
  const idleActions = ['yawn', 'tilt', 'lick', 'hop'];
  function scheduleNextIdle() {
    const delay = 6000 + Math.random() * 8000; // 6-14s
    const t = setTimeout(() => {
      // 用户正在互动（有 pet-feed/play/clean/touching 就跳过）
      if (!petWrap.classList.contains('pet-feed') &&
          !petWrap.classList.contains('pet-play') &&
          !petWrap.classList.contains('pet-clean') &&
          !petWrap.classList.contains('pet-touching')) {
        const act = idleActions[Math.floor(Math.random() * idleActions.length)];
        petWrap.classList.add('pet-idle-' + act);
        setTimeout(() => petWrap.classList.remove('pet-idle-' + act), 1500);
      }
      scheduleNextIdle();
    }, delay);
    _behaviorTimers.push(t);
  }
  scheduleNextIdle();

  // 2. 走路：每 10-25 秒让宠物在舞台里左右走一段
  function scheduleNextWalk() {
    const delay = 10000 + Math.random() * 15000; // 10-25s
    const t = setTimeout(() => {
      // 如果正在互动或自发行为，跳过
      if ([...petWrap.classList].some((c) => c.startsWith('pet-feed') || c.startsWith('pet-play') || c.startsWith('pet-clean') || c.startsWith('pet-touching') || c.startsWith('pet-idle'))) {
        scheduleNextWalk();
        return;
      }
      walkStep(arena, petWrap);
      scheduleNextWalk();
    }, delay);
    _behaviorTimers.push(t);
  }
  scheduleNextWalk();
}

/** 让宠物走一段：从中间 → 30% 位置 → 80% 位置 → 中间（每段 2.5s transition） */
function walkStep(arena, petWrap) {
  const positions = [
    { left: '50%',   scaleX: 1 },
    { left: '25%',   scaleX: -1 }, // 面向左
    { left: '75%',   scaleX: 1 },  // 面向右
    { left: '40%',   scaleX: -1 },
    { left: '50%',   scaleX: 1 },
  ];
  let idx = Math.floor(Math.random() * positions.length);

  petWrap.classList.add('pet-walking');
  function next() {
    const pos = positions[idx % positions.length];
    petWrap.style.left = pos.left;
    petWrap.style.transform = `translateX(-50%) scaleX(${pos.scaleX})`;
    idx++;
    if (idx <= 3) {
      setTimeout(next, 2500);
    } else {
      setTimeout(() => {
        petWrap.classList.remove('pet-walking');
      }, 2500);
    }
  }
  next();
}

/* ============================================================
   进度条 + Bar
   ============================================================ */
function renderBars(pet) {
  const expNext = pet.levelNextAt - (LEVEL_THRESHOLDS[pet.level - 1] ?? 0);
  const expCur  = pet.exp - (LEVEL_THRESHOLDS[pet.level - 1] ?? 0);
  const expPct = expNext > 0 ? Math.round((expCur / expNext) * 100) : 100;
  const wrap = el('div', { style: { padding: '10px 16px', background: 'white', borderBottom: '1px solid #eee' } });
  wrap.append(
    barRow('🍖', '饥饿', pet.hunger),
    barRow('💚', '心情', pet.mood),
    el('div', { style: { fontSize: '12px', color: 'var(--ink2)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' } }, [
      el('span', { text: `Lv.${pet.level} → Lv.${pet.level + 1}` }),
      el('span', { text: `${expCur} / ${expNext} (${expPct}%)` }),
    ]),
    el('div', { class: 'pet-level-bar' }, [el('div', { class: 'fill', style: { width: expPct + '%' } })]),
  );
  return wrap;
}

function barRow(icon, label, pct) {
  return el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' } }, [
    el('span', { style: { width: '40px', fontSize: '13px' }, text: icon + ' ' + label }),
    el('div', { style: { flex: 1, height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' } }, [
      el('div', { style: { width: pct + '%', height: '100%', background: icon === '💚' ? 'linear-gradient(90deg,#6BCB77,#4DA6FF)' : 'linear-gradient(90deg,#FF6B6B,#FFD93D)', borderRadius: '4px', transition: 'width .35s' } }),
    ]),
    el('span', { style: { width: '36px', textAlign: 'right', fontSize: '12px', color: 'var(--ink2)' }, text: pct + '%' }),
  ]);
}

/* ============================================================
   Tab 面板（基本不变，但喂养 Tab 要主动画 triggerFeed）
   ============================================================ */
function renderPanel(pet) {
  const panel = el('div', { class: 'pet-panel active', style: { maxHeight: '40vh', overflowY: 'auto' } });
  const invFoods = pet.inventory?.food || {};

  if (currentTab === 'feed') {
    panel.append(
      el('h3', { text: '🍪 宠物背包' }),
      el('p', { style: { fontSize: '12px', color: 'var(--ink2)', marginBottom: '10px' }, text: '食物不够了？去商店积分兑换，或者开宝箱有概率送食物包！' }),
      el('div', { class: 'panel-grid' },
        PET_FOODS.map((f) => {
          const count = invFoods[f.id] || 0;
          const box = el('div', { class: 'panel-item' + (count > 0 ? ' can-buy' : ' disabled'), title: `饥饿+${f.hunger} 心情+${f.mood}` }, [
            el('div', { class: 'emoji', text: f.emoji }),
            el('div', { class: 'name', text: f.name }),
            count > 0 ? el('div', { class: 'count', text: `× ${count}` }) : el('div', { class: 'price', text: '背包里没有' }),
          ]);
          box.addEventListener('click', () => {
            if (count <= 0) { toast('去商店兑换点食物吧～', 'bad'); return; }
            const res = feed(f.id);
            if (res.ok) {
              toast(`吃饱啦！饥饿 +${f.hunger}`, 'ok');
              if (res.leveledUp) toast('🎉 升级啦！', 'ok');
              // 触发喂养动画（找当前舞台）
              const arena = document.querySelector('.pet-arena');
              const pw = document.querySelector('.pet-wrap');
              if (arena && pw) triggerFeed(arena, pw, f.emoji);
              setTimeout(() => render(), 1200); // 动画播完再刷新
            }
          });
          return box;
        })
      ),
    );
  }

  else if (currentTab === 'deco') {
    const worn = pet.wear;
    panel.append(
      el('h3', { text: '💄 我的装饰' }),
      el('p', { style: { fontSize: '12px', color: 'var(--ink2)', marginBottom: '10px' }, text: '4 个位置，穿上后宠物会戴上对应的装饰' }),
      el('div', { class: 'panel-grid' },
        PET_DECOS.map((d) => {
          const owned = pet.ownedDeco.includes(d.id);
          const wornHere = worn[d.slot] === d.id;
          const cls = 'panel-item' + (owned ? (wornHere ? ' equipped' : ' owned') : ' disabled');
          const box = el('div', { class: cls, title: owned ? (wornHere ? '点一下脱下' : '点一下穿上') : '去商店解锁' }, [
            el('div', { class: 'emoji', text: d.emoji }),
            el('div', { class: 'name', text: d.name }),
            owned
              ? (wornHere ? el('div', { class: 'count', text: '✓ 已戴上' }) : el('div', { class: 'count', style: { color: '#4DA6FF' }, text: '点击穿上' }))
              : el('div', { class: 'price', text: `未解锁 (${d.cost}分)` }),
          ]);
          box.addEventListener('click', () => {
            if (!owned) { toast('去商店解锁吧', 'bad'); return; }
            sfxClick();
            if (wornHere) { unequipDeco(d.slot); toast('脱下了', 'ok'); }
            else { equipDeco(d.id); toast('穿上啦！', 'ok'); }
            render();
          });
          return box;
        })
      ),
    );
  }

  else if (currentTab === 'scene') {
    panel.append(
      el('h3', { text: '🏖️ 乐园场景' }),
      el('p', { style: { fontSize: '12px', color: 'var(--ink2)', marginBottom: '10px' }, text: '解锁后点击就切换乐园背景' }),
      el('div', { class: 'panel-grid' },
        PET_SCENES.map((s) => {
          const owned = pet.ownedScene.includes(s.id);
          const cur = pet.scene === s.id;
          const cls = 'panel-item' + (owned ? (cur ? ' equipped' : ' owned') : ' disabled');
          const box = el('div', { class: cls, title: owned ? (cur ? '当前场景' : '点击切换') : '去商店解锁' }, [
            el('div', { class: 'emoji', text: s.emoji }),
            el('div', { class: 'name', text: s.name }),
            owned
              ? (cur ? el('div', { class: 'count', text: '✓ 当前' }) : el('div', { class: 'count', style: { color: '#4DA6FF' }, text: '点击切换' }))
              : (s.cost === 0 ? el('div', { class: 'price', text: '初始' }) : el('div', { class: 'price', text: `${s.cost} 积分` })),
          ]);
          box.addEventListener('click', () => {
            if (!owned) { toast('去商店解锁吧', 'bad'); return; }
            if (cur) return;
            sfxClick(); changeScene(s.id); render();
          });
          return box;
        })
      ),
    );
  }

  else if (currentTab === 'me') {
    panel.append(
      el('h3', { text: '📖 我的宠物' }),
      el('div', { class: 'pet-stats', style: { marginBottom: '12px' } }, [
        el('div', { class: 'pet-stat-box' }, [el('div', { class: 'num', text: pet.level }), el('div', { class: 'lbl', text: '等级' })]),
        el('div', { class: 'pet-stat-box' }, [el('div', { class: 'num', text: pet.exp }), el('div', { class: 'lbl', text: '累计成长值' })]),
        el('div', { class: 'pet-stat-box' }, [el('div', { class: 'num', text: pet.hunger + '%' }), el('div', { class: 'lbl', text: '当前饥饿度' })]),
        el('div', { class: 'pet-stat-box' }, [el('div', { class: 'num', text: pet.mood + '%' }), el('div', { class: 'lbl', text: '当前心情值' })]),
      ]),
      el('h3', { text: '改个名字', style: { fontSize: '14px', marginTop: '12px' } }),
      el('div', { style: { display: 'flex', gap: '8px', marginTop: '6px' } }, [
        el('input', { class: 'adopt-name-input', style: 'margin-bottom:0', type: 'text', value: pet.nickname, maxlength: 8, placeholder: '最多 8 个字', id: 'nick-input' }),
        el('button', { class: 'btn btn-gold', type: 'button', text: '保存', onclick: () => {
          const v = document.getElementById('nick-input')?.value;
          const r = changeNickname(v);
          if (r.ok) { sfxClick(); toast('改好啦！', 'ok'); render(); }
          else toast(r.reason || '失败', 'bad');
        }}),
      ]),
      el('h3', { text: '今天', style: { fontSize: '14px', marginTop: '16px' } }),
      el('ul', { style: { fontSize: '13px', color: 'var(--ink2)', lineHeight: '1.9', paddingLeft: '18px', marginTop: '4px' } }, [
        el('li', { text: `玩耍：${pet.daily.played ? '玩过啦 ✓' : '还没玩'}` }),
        el('li', { text: `清洁：${pet.daily.cleaned ? '清洁过啦 ✓' : '还没清洁'}` }),
        el('li', { text: `背包食物：${Object.entries(invFoods).map(([k, n]) => PET_FOODS.find((f) => f.id === k)?.emoji + n).join(' ') || '空空如也'}` }),
      ]),
    );
  }

  return panel;
}

/* ============================================================
   粒子
   ============================================================ */
function spawnParticles(container, emoji, count = 1) {
  for (let i = 0; i < count; i++) {
    const p = el('div', { class: 'particle', text: emoji });
    p.style.left = (container.clientWidth / 2 + (Math.random() * 60 - 30)) + 'px';
    p.style.top  = (container.clientHeight * 0.5 + (Math.random() * 40 - 20)) + 'px';
    container.append(p);
    setTimeout(() => p.remove(), 1200);
  }
}
