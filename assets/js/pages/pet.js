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
import { sfxClick, sfxWin, unlockAudio, speakPet, setSoundEnabled,
  sfxPetPet, sfxPetEat, sfxPetPlay, sfxPetClean,
  sfxPetLevelUp, sfxPetYawn, sfxPetWalk, sfxPetHappy, sfxPetSad, sfxPetUnlock,
  sfxPetWhine, sfxPetNo, sfxPetPop, sfxPetSparkle, sfxPetChirp, sfxPetBite
} from '../core/audio.js';
import {
  stateOf, createPet, feed, touch, play, clean,
  equipDeco, unequipDeco, changeScene, changeNickname,
  LEVEL_THRESHOLDS,
} from '../core/pet.js';
import { SPECIES, SCENES } from '../data/pet-assets.js';
import { PET_FOODS, PET_DECOS, PET_SCENES, SPECIES_TRAITS, foodModifierFor } from '../data/pet-shop.js';
import { shopState, redeemItem } from '../core/shop.js';

const app = document.getElementById('pet-app');
let currentTab = 'feed';
let _greeted = false;

/* ============================================================
   童声互动：头顶气泡 + 语音
   ============================================================ */

// 物种台词缺失时的通用台词（保证任何宠物都有话说）
const FALLBACK_VOICES = {
  pet: '真舒服啊~再摸摸我嘛~',
  feed: '真好吃啊~谢谢~',
  play: '好开心呀！再来一次嘛~',
  clean: '洗得香香的，真舒服~',
  dress: '哇，我好漂亮呀！',
  undress: '咦，摘掉啦~',
  scene: '新家真好看~',
  limit: '今天玩累啦，明天再玩吧~',
  hungry: '肚子饿啦，去商店换点吃的吧~',
};

/** 取当前宠物的台词：优先物种专属，其次通用台词 */
function voiceOf(key) {
  const pet = stateOf();
  const line = pet && SPECIES_TRAITS[pet.species]?.voices?.[key];
  return line || FALLBACK_VOICES[key] || '';
}

let _bubbleTimer = 0;

/** 宠物说话：头顶气泡展示台词，同时用童声读出来 */
function say(text) {
  if (!text) return;
  const arena = document.querySelector('.pet-arena');
  if (arena) {
    let bubble = arena.querySelector('.pet-bubble');
    if (!bubble) {
      bubble = el('div', { class: 'pet-bubble' });
      arena.append(bubble);
    }
    bubble.textContent = text;
    bubble.classList.remove('show');
    void bubble.offsetWidth; // 重排以重播弹出动画
    bubble.classList.add('show');
    clearTimeout(_bubbleTimer);
    _bubbleTimer = setTimeout(() => bubble.classList.remove('show'), 2600);
  }
  speakPet(text, 200);
}

/* ============================================================
   积分商店（乐园内直接兑换食物 / 装饰 / 乐园）
   完成每日挑战任务每项 +2 分，积分可用于这里兑换
   ============================================================ */
function openShop() {
  if (document.querySelector('.pet-shop-overlay')) return;
  sfxClick();

  const body = el('div', { class: 'pet-shop-body' });
  const pointsLine = el('div', { class: 'pet-shop-points' });
  const overlay = el('div', { class: 'pet-shop-overlay' });
  const close = () => { overlay.remove(); render(); };
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  const sheet = el('div', { class: 'pet-shop-sheet' }, [
    el('div', { class: 'pet-shop-head' }, [
      el('h2', { text: '🛒 积分商店' }),
      el('button', { class: 'btn btn-ghost', type: 'button', text: '关闭', onclick: close }),
    ]),
    pointsLine,
    body,
  ]);
  overlay.append(sheet);
  document.body.append(overlay);

  const petNow = () => stateOf() || {};

  function itemCard(item, kind) {
    const s = shopState();
    const count = kind === 'food' ? (petNow().inventory?.food?.[item.id] || 0) : 0;
    const owned = kind === 'deco' ? (petNow().ownedDeco || []).includes(item.id)
      : kind === 'scene' ? (petNow().ownedScene || []).includes(item.id) : false;
    const affordable = s.points >= item.cost;
    const cls = 'panel-item shop-item' + (owned ? ' owned' : affordable ? ' can-buy' : ' disabled');
    const priceText = kind === 'food' && count > 0 ? `已兑换 ×${count}` : owned ? '已拥有' : `${item.cost} 分`;
    const actionText = kind === 'food' ? (affordable ? '兑换' : `还差 ${item.cost - s.points} 分`)
      : owned ? '已解锁' : affordable ? '兑换' : `还差 ${item.cost - s.points} 分`;
    const box = el('div', { class: cls, title: `${item.name} · ${item.cost} 分` }, [
      el('div', { class: 'emoji', text: item.emoji }),
      el('div', { class: 'name', text: item.name }),
      el('div', { class: 'price', text: priceText }),
    ]);
    box.append(el('div', { class: 'shop-buy', text: actionText }));

    box.addEventListener('click', () => {
      if (owned) { toast('已经拥有啦', 'bad'); return; }
      const res = redeemItem(item.id);
      if (res.ok) {
        sfxPetUnlock();
        toast(`兑换成功：${item.name}`, 'ok');
        fill();
        render();
      } else if (res.reason === 'points') {
        sfxPetNo();
        toast(`还差 ${res.shortfall} 分，完成挑战任务就能加分啦`, 'bad');
      } else if (res.reason === 'already-owned') {
        toast('已经拥有啦', 'bad');
      } else {
        sfxPetNo();
        toast('暂时换不了', 'bad');
      }
    });
    return box;
  }

  function section(title, items, kind) {
    return el('div', { class: 'pet-shop-sec' }, [
      el('h3', { text: title }),
      el('div', { class: 'panel-grid' }, items.map((it) => itemCard(it, kind))),
    ]);
  }

  function fill() {
    const s = shopState();
    pointsLine.textContent = `当前 ${s.points} 分 · 每完成 1 个挑战任务 +2 分 · 兑换后立即到账`;
    clear(body);
    body.append(
      section('🍪 食物（可重复兑换）', PET_FOODS, 'food'),
      section('💄 装饰（永久解锁）', PET_DECOS, 'deco'),
      section('🏖️ 乐园（永久解锁）', PET_SCENES.filter((x) => x.cost > 0), 'scene'),
    );
  }
  fill();
}

// 全局定时器（render 时先清再重建，避免重影）
let _behaviorTimers = [];
function clearBehaviorTimers() {
  _behaviorTimers.forEach((t) => clearTimeout(t));
  _behaviorTimers = [];
}

/* ============================================================
   入口
   ============================================================ */
// 继承工作台里的音效开关设置（静音时不朗读、不出声）
setSoundEnabled(store.load()?.settings?.sound !== false);
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
    // 首次进入时让宠物用童声打招呼
    if (!_greeted) {
      _greeted = true;
      const trait = SPECIES_TRAITS[pet.species];
      if (trait) setTimeout(() => say(trait.voices.hi), 500);
    }
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
    el('div', { class: 'pet-title', style: 'font-weight:700; font-size:15px;', text: `${pet.speciesEmoji} ${pet.nickname} · Lv.${pet.level}` }),
    el('button', { class: 'btn btn-ghost', type: 'button', text: '🛒', title: `积分商店（${store.load().profile?.points || 0} 分）`, 'aria-label': '积分商店', onclick: openShop }),
    el('button', { class: 'btn btn-ghost', type: 'button', text: '🔄', title: '刷新', onclick: () => render() }),
  ]);

  // 乐园舞台容器
  const sceneWrap = el('div', { class: 'pet-arena', style: { background: pet.sceneData.bg } });
  sceneWrap.innerHTML = pet.sceneData.extra || '';

  // 宠物：绝对定位 left 50%，带成长缩放，从底部往上涨
  const scale = pet.growthScale;
  const petWrap = el('div', { class: `pet-wrap ${pet.moodClass}`, 'data-scale': scale, style: {
    left: '50%', transform: `translateX(-50%) scale(${scale})`,
    transformOrigin: '50% 100%', transition: 'left 2.4s ease-in-out, transform .5s ease',
  } });
  petWrap.innerHTML = pet.speciesSvg;
  // 点宠物 = 抚摸
  petWrap.addEventListener('click', () => triggerTouch(sceneWrap, petWrap));
  sceneWrap.append(petWrap);

  // 快捷互动按钮（每个触发独立手势）
  const actionRow = el('div', { class: 'pet-quick-actions', style: {
    position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
    display: 'flex', gap: '8px', zIndex: '10',
  } }, [
    el('button', { class: 'btn btn-ghost', type: 'button', text: '🤲 抚摸', title: '无限次', onclick: () => triggerTouch(sceneWrap, petWrap) }),
    el('button', { class: 'btn btn-ghost', type: 'button', text: '🍪 喂养', title: '先去背包选食物', onclick: () => { sfxClick(); currentTab = 'feed'; render(); } }),
    el('button', { class: 'btn btn-ghost', type: 'button', 'data-act': 'play', text: '🎾 玩耍' + (pet.daily.played ? ' ✓' : ''), title: '每天一次', onclick: () => triggerPlay(sceneWrap, petWrap) }),
    el('button', { class: 'btn btn-ghost', type: 'button', 'data-act': 'clean', text: '🛁 清洁' + (pet.daily.cleaned ? ' ✓' : ''), title: '每天一次', onclick: () => triggerClean(sceneWrap, petWrap) }),
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

/** 找到 petWrap 里的 svg.pet，切 act-* class 触发骨骼动画 */
const ACT_CLASSES = ['act-pat', 'act-feed', 'act-play', 'act-clean'];
/* 移除 act-* 的 DUR 必须覆盖 iteration-count 的总时长：
   act-pat 的尾巴 swayJoy = .35s × 6 = 2.1s（不能只按 head 的 .9s 移除）。 */
const ACT_DUR = { 'act-pat': 2100, 'act-feed': 1100, 'act-play': 900, 'act-clean': 800 };
const _actTimers = new WeakMap();

function getPetSvg(petWrap) { return petWrap.querySelector('svg.pet'); }

function actOn(petWrap, actClass) {
  const svg = getPetSvg(petWrap);
  if (!svg) return;
  const prev = _actTimers.get(svg);
  if (prev) clearTimeout(prev);
  _actTimers.delete(svg);
  svg.classList.remove(...ACT_CLASSES);
  void svg.offsetWidth; // 强制 reflow，让同名动画重新开始
  if (!actClass) return;
  svg.classList.add(actClass);
  const dur = ACT_DUR[actClass] ?? 900;
  _actTimers.set(svg, setTimeout(() => {
    svg.classList.remove(actClass);
    _actTimers.delete(svg);
  }, dur));
}

function resetPetAnim(petWrap) {
  petWrap.classList.remove('pet-feed', 'pet-touching', 'pet-play', 'pet-clean', 'pet-idle-yawn', 'pet-idle-tilt', 'pet-idle-lick', 'pet-idle-hop', 'pet-walking');
  const svg = getPetSvg(petWrap);
  if (svg) {
    const t = _actTimers.get(svg);
    if (t) clearTimeout(t);
    _actTimers.delete(svg);
    svg.classList.remove(...ACT_CLASSES);
    void svg.offsetWidth;
  }
}

/** 喂养：手从上落 + 食物飞入 + 宠物张嘴吃 + 舔嘴
 *  preference: 'like' | 'normal' | 'hate' —— 影响粒子和音效反馈 */
function triggerFeed(sceneWrap, petWrap, foodEmoji = '🍪', preference = 'normal') {
  resetPetAnim(petWrap);
  actOn(petWrap, 'act-feed');
  sfxPetEat();
  petWrap.classList.add('pet-feed');

  // 啃食声叠加（略晚一点，食物入口时）
  setTimeout(() => sfxPetBite(), 400);
  setTimeout(() => sfxPetBite(), 750);

  // 手从上方落下
  const hand = el('div', { class: 'feed-hand', text: '🤲' });
  sceneWrap.append(hand);
  setTimeout(() => hand.remove(), 1200);

  // 食物飞入
  const food = el('div', { class: 'food-fly', text: foodEmoji });
  sceneWrap.append(food);
  setTimeout(() => food.remove(), 1000);

  // 根据偏好的差异化粒子和音效
  if (preference === 'like') {
    spawnParticles(sceneWrap, '💖', 5);              // 最爱：5颗爱心
    setTimeout(() => sfxPetChirp(), 1200);           // 开心吱啾
  } else if (preference === 'hate') {
    spawnParticles(sceneWrap, '💔', 3);              // 讨厌：3颗碎心
    setTimeout(() => sfxPetSad(), 1200);             // 低鸣不开心
  } else {
    spawnParticles(sceneWrap, '💖', 3);              // 一般：3颗爱心
    if (Math.random() < 0.35) setTimeout(() => sfxPetChirp(), 1200);
  }

  // 童声台词：按偏好说不同的话
  say(preference === 'hate' ? voiceOf('hate') : preference === 'like' ? voiceOf('like') : voiceOf('feed'));
}

/** 抚摸：手左右扫 + 宠物耳朵贴平 + 眯眼享受 */
function triggerTouch(sceneWrap, petWrap) {
  resetPetAnim(petWrap);
  actOn(petWrap, 'act-pat');
  sfxPetPet();
  petWrap.classList.add('pet-touching');
  const r = touch();
  if (r.ok) syncStatus();

  const hand = el('div', { class: 'pet-hand', text: '🤚' });
  sceneWrap.append(hand);
  setTimeout(() => hand.remove(), 1500);

  spawnParticles(sceneWrap, '💖', 2);
  say(voiceOf('pet'));

  // 30% 概率享受得吱啾一声
  if (Math.random() < 0.3) setTimeout(() => sfxPetChirp(), 900);

  if (r.leveledUp) {
    setTimeout(() => {
      sfxPetLevelUp(); sfxPetSparkle(); sfxPetHappy();
      toast('🎉 升级啦！', 'ok');
    }, 600);
  }
}

/** 玩耍：球飞来 + 宠物跳起来接 + 星星爆炸 */
function triggerPlay(sceneWrap, petWrap) {
  const r = play();
  if (!r.ok) {
    sfxPetNo();
    say(voiceOf('limit'));
    toast(r.reason === 'daily-limit' ? '今天玩过啦，明天再来' : r.reason, 'bad');
    return;
  }
  // 顺序必须是先 reset 再 actOn，否则 reset 会把刚加上的 act-play 清掉
  resetPetAnim(petWrap);
  actOn(petWrap, 'act-play');
  sfxPetPlay();
  petWrap.classList.add('pet-play');
  syncStatus();

  const ball = el('div', { class: 'play-ball', text: '⚽' });
  sceneWrap.append(ball);
  setTimeout(() => ball.remove(), 1400);

  spawnParticles(sceneWrap, '⭐', 6);
  say(voiceOf('play'));

  // 接到球后吱啾
  setTimeout(() => sfxPetChirp(), 600);

  if (r.leveledUp) {
    setTimeout(() => {
      sfxPetLevelUp(); sfxPetSparkle(); sfxPetHappy();
      toast('🎉 升级啦！', 'ok');
    }, 900);
  }
}

/** 清洁：泡泡覆盖 + 宠物抖动 + 闪闪发亮 */
function triggerClean(sceneWrap, petWrap) {
  const r = clean();
  if (!r.ok) {
    sfxPetNo();
    say(voiceOf('limit'));
    toast(r.reason === 'daily-limit' ? '今天清洁过啦' : r.reason, 'bad');
    return;
  }
  // 同样先 reset 再 actOn，避免 act-clean 被 reset 立刻移除
  resetPetAnim(petWrap);
  actOn(petWrap, 'act-clean');
  sfxPetClean();
  petWrap.classList.add('pet-clean');
  syncStatus();

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

  // 清洁完亮一下 + 吱啾
  setTimeout(() => sfxPetSparkle(), 1200);
  setTimeout(() => sfxPetChirp(), 1600);
  say(voiceOf('clean'));

  if (r.leveledUp) {
    setTimeout(() => {
      sfxPetLevelUp(); sfxPetSparkle(); sfxPetHappy();
      toast('🎉 升级啦！', 'ok');
    }, 1400);
  }
}

/* ============================================================
   自发行为调度（渲染完成后启动，render 时清）
   ============================================================ */
function scheduleIdleBehaviors() {
  const arena = document.querySelector('.pet-arena');
  const petWrap = document.querySelector('.pet-wrap');
  if (!arena || !petWrap) return;

  // 心情差/饥饿时，偶尔发出撒娇/低鸣声（25-45s 一次）
  if (petWrap.classList.contains('pet-sad')) {
    const delay = 25000 + Math.random() * 20000;
    const t = setTimeout(() => {
      if (petWrap.classList.contains('pet-sad') &&
          ![...petWrap.classList].some((c) => c.startsWith('pet-feed') || c.startsWith('pet-play') || c.startsWith('pet-clean') || c.startsWith('pet-touching'))) {
        sfxPetSad();
        setTimeout(() => sfxPetWhine(), 300);
      }
      // 一次性，render 时会重建
    }, delay);
    _behaviorTimers.push(t);
  }

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
        if (act === 'yawn') sfxPetYawn();
        else if (act === 'hop') sfxPetHappy();
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
      sfxPetWalk();
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
    const s = petWrap.dataset.scale || 1;
    petWrap.style.left = pos.left;
    petWrap.style.transform = `translateX(-50%) scale(${s}) scaleX(${pos.scaleX})`;
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
  const wrap = el('div', { class: 'pet-status', style: { padding: '10px 16px', background: 'white', borderBottom: '1px solid #eee' } });
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

/* 交互后只同步顶栏 / 状态条 / 快捷按钮，不重建舞台（避免打断正在播的动画） */
function syncStatus() {
  const pet = stateOf();
  if (!pet) return;
  const title = document.querySelector('.pet-title');
  if (title) title.textContent = `${pet.speciesEmoji} ${pet.nickname} · Lv.${pet.level}`;
  const bars = document.querySelector('.pet-status');
  if (bars) bars.replaceWith(renderBars(pet));
  const pw = document.querySelector('.pet-wrap');
  if (pw) {
    pw.dataset.scale = String(pet.growthScale);
    if (!pw.classList.contains('pet-walking')) {
      pw.style.transform = `translateX(-50%) scale(${pet.growthScale})`;
    }
  }
  const playBtn = document.querySelector('.pet-arena [data-act="play"]');
  if (playBtn) playBtn.textContent = '🎾 玩耍' + (pet.daily.played ? ' ✓' : '');
  const cleanBtn = document.querySelector('.pet-arena [data-act="clean"]');
  if (cleanBtn) cleanBtn.textContent = '🛁 清洁' + (pet.daily.cleaned ? ' ✓' : '');
}

function barRow(icon, label, pct) {
  return el('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' } }, [
    el('span', { style: { fontSize: '13px', whiteSpace: 'nowrap', minWidth: '52px' }, text: icon + ' ' + label }),
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
  const pts = store.load().profile?.points || 0;
  const shopBtn = () => el('button', { class: 'btn btn-ghost shop-entry', type: 'button', text: `🛒 积分商店 · ${pts} 分`, onclick: openShop });

  if (currentTab === 'feed') {
    panel.append(
      el('div', { class: 'pet-panel-head' }, [
        el('h3', { text: '🍪 宠物背包' }),
        shopBtn(),
      ]),
      el('p', { style: { fontSize: '12px', color: 'var(--ink2)', marginBottom: '10px' }, text: '每种动物喜欢/讨厌的食物不一样哦！喂对了 +50% 效果，喂错了它会不开心～' }),
      el('div', { class: 'panel-grid' },
        PET_FOODS.map((f) => {
          const count = invFoods[f.id] || 0;
          const mod = foodModifierFor(f.id, pet.species);
          // 预览修饰后的真实效果值
          const hungerPreview = Math.round(f.hunger * mod.modifier);
          const moodBonus = mod.tag === 'like' ? 15 : mod.tag === 'hate' ? -10 : 0;
          const moodPreview = Math.round((f.mood + moodBonus) * mod.modifier);
          // 偏好徽章
          let prefBadge, prefStyle;
          if (mod.tag === 'like') { prefBadge = '❤️最爱'; prefStyle = 'color:#ff4757;background:#ffe6e6;'; }
          else if (mod.tag === 'hate') { prefBadge = '😣讨厌'; prefStyle = 'color:#888;background:#eee;'; }
          else { prefBadge = '😐一般'; prefStyle = 'color:#aaa;background:#f5f5f5;'; }
          const box = el('div', { class: 'panel-item' + (count > 0 ? ' can-buy' : ' disabled'), title: `${pet.nickname}吃了：饥饿+${hungerPreview} 心情${moodPreview >= 0 ? '+' : ''}${moodPreview}` }, [
            el('div', { class: 'emoji', text: f.emoji }),
            el('div', { class: 'name', text: f.name }),
            el('div', { style: 'font-size:10px; padding:1px 6px; border-radius:8px; margin-top:2px; display:inline-block;' + prefStyle, text: prefBadge }),
            el('div', { style: 'font-size:10px; color:var(--ink2); margin-top:2px;', text: `饥+${hungerPreview} 心${moodPreview >= 0 ? '+' : ''}${moodPreview}` }),
            count > 0 ? el('div', { class: 'count', text: `× ${count}` }) : el('div', { class: 'price', text: '背包里没有' }),
          ]);
          box.addEventListener('click', () => {
            if (count <= 0) {
              sfxPetNo();
              say(voiceOf('hungry')); // 没食物时也有童声台词
              toast('去商店兑换点食物吧～', 'bad');
              openShop();
              return;
            }
            const res = feed(f.id);
            if (res.ok) {
              // toast 显示修饰后的真实数值 + 偏好提示
              let extraMsg = '';
              if (res.preference === 'like') extraMsg = ' 它超爱！';
              else if (res.preference === 'hate') extraMsg = '（不太喜欢…）';
              toast(`吃饱啦！饥饿 +${res.fed} 心情 ${res.moodUp >= 0 ? '+' : ''}${res.moodUp}${extraMsg}`, res.preference === 'hate' ? 'bad' : 'ok');
              // 触发喂养动画 + 音效（带上偏好做差异化反馈）
              const arena = document.querySelector('.pet-arena');
              const pw = document.querySelector('.pet-wrap');
              if (arena && pw) triggerFeed(arena, pw, f.emoji, res.preference);
              syncStatus();
              if (res.leveledUp) {
                sfxPetLevelUp();
                sfxPetSparkle();
                setTimeout(() => sfxPetHappy(), 400);
                toast(`🎉 ${pet.nickname}升到 Lv.${stateOf()?.level ?? pet.level + 1} 啦！`, 'ok');
              }
              setTimeout(() => render(), 1400); // 动画播完再刷新
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
      el('div', { class: 'pet-panel-head' }, [
        el('h3', { text: '💄 我的装饰' }),
        shopBtn(),
      ]),
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
            if (!owned) { sfxPetNo(); toast('去商店解锁吧', 'bad'); openShop(); return; }
            sfxClick();
            if (wornHere) { unequipDeco(d.slot); sfxPetPop(); toast('脱下了', 'ok'); render(); say(voiceOf('undress')); }
            else { equipDeco(d.id); sfxPetUnlock(); toast('穿上啦！', 'ok'); render(); say(voiceOf('dress')); }
          });
          return box;
        })
      ),
    );
  }

  else if (currentTab === 'scene') {
    panel.append(
      el('div', { class: 'pet-panel-head' }, [
        el('h3', { text: '🏖️ 乐园场景' }),
        shopBtn(),
      ]),
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
            if (!owned) { sfxPetNo(); toast('去商店解锁吧', 'bad'); openShop(); return; }
            if (cur) return;
            sfxPetUnlock(); changeScene(s.id);
            setTimeout(() => sfxPetChirp(), 300);
            render();
            say(voiceOf('scene'));
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
