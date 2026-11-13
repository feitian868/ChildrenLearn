﻿﻿﻿/**
 * core/pet.js —— 宠物模块核心逻辑
 *
 * 宠物状态写入 data.pet（整块追加，不改旧字段）：
 *   pet: {
 *     species, nickname, level, exp, hunger, mood,
 *     scene, wear: {head, neck, face, back},
 *     inventory: { food: { cookie: 3 } },
 *     ownedDeco: ['red-bow'], ownedScene: ['garden'],
 *     daily: { played: false, cleaned: false },
 *     lastCareDate: '2026-10-31'
 *   }
 *
 * 所有对宠物的改动都走 store.update() → 写回 localStorage
 * 衰减 tick 在 stateOf() 里每次自动检查（如果 lastCareDate !== todayKey 就衰减）
 */

import * as store from './store.js';
import { PET_FOODS, PET_DECOS, PET_SCENES, foodModifierFor } from '../data/pet-shop.js';
import { SPECIES, DECO_SVG, SCENES, speciesOf } from '../data/pet-assets.js';

/* ============================================================
   常量
   ============================================================ */

/** 每级所需成长值（从 Lv.1 开始，升级需要 exp 达到阈值） */
export const LEVEL_THRESHOLDS = [0, 20, 50, 100, 180, 280, 400, 550, 720, 900, 1100];

/** 满级：Lv.10（1100 点用于把 Lv.10 的进度条填满） */
export const MAX_LEVEL = 10;

/**
 * 升级奖励：每升一级自动发放（不用去商店买）。
 *   food  → 进背包；deco/scene → 直接解锁；已拥有时折成小饼干 ×2
 *   deco  若对应槽位还空着，会自动戴上，升级后立刻能看到外观变化
 */
export const LEVEL_REWARDS = {
  2:  { label: '胡萝卜 ×2', food: [{ id: 'carrot', count: 2 }] },
  3:  { label: '红围巾 + 小饼干 ×2', deco: ['scarf'], food: [{ id: 'cookie', count: 2 }] },
  4:  { label: '小鱼干 ×2 + 鸡腿 ×1', food: [{ id: 'fish', count: 2 }, { id: 'drumstick', count: 1 }] },
  5:  { label: '新乐园「温馨小窝」', scene: ['home'] },
  6:  { label: '红色蝴蝶结 + 水果拼盘 ×1', deco: ['red-bow'], food: [{ id: 'fruits', count: 1 }] },
  7:  { label: '圣诞帽 + 小饼干 ×3', deco: ['xmas-hat'], food: [{ id: 'cookie', count: 3 }] },
  8:  { label: '新乐园「海边沙滩」', scene: ['beach'] },
  9:  { label: '粉色项圈 + 水果拼盘 ×2', deco: ['collar'], food: [{ id: 'fruits', count: 2 }] },
  10: { label: '小皇冠 + 新乐园「糖果王国」', deco: ['crown'], scene: ['candy'] }
};

/** 每日衰减量 */
const DECAY_HUNGER = 20;
const DECAY_MOOD   = 15;

/** 互动给的成长值 */
const EXP_FEED   = 3;
const EXP_TOUCH  = 2;
const EXP_PLAY   = 4;
const EXP_CLEAN  = 1;

/** clamp helper */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** 取食物定义 */
function foodOf(id) { return PET_FOODS.find((f) => f.id === id); }
function decoOf(id) { return PET_DECOS.find((d) => d.id === id); }
function sceneOf(id) { return PET_SCENES.find((s) => s.id === id); }

/* ============================================================
   等级计算
   ============================================================ */

/** 根据当前 exp 算出 level 和当前级进度 */
function computeLevel(exp) {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (exp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  level = Math.min(level, MAX_LEVEL);
  const curStart = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextStart = LEVEL_THRESHOLDS[level] ?? (curStart + 200);
  const progress = clamp((exp - curStart) / (nextStart - curStart), 0, 1);
  return { level, exp, progress, nextAt: nextStart };
}

/**
 * 发放 fromLevel+1 ~ toLevel 的升级奖励。
 * 已拥有的装饰/乐园折成小饼干 ×2，避免重复发放后“什么都没有”。
 */
function grantRewards(pet, fromLevel, toLevel) {
  const gained = [];
  for (let lv = fromLevel + 1; lv <= toLevel; lv += 1) {
    const reward = LEVEL_REWARDS[lv];
    if (!reward) continue;
    const parts = [];

    (reward.food || []).forEach(({ id, count }) => {
      pet.inventory.food[id] = (pet.inventory.food[id] || 0) + count;
      parts.push(`${foodOf(id)?.name || id} ×${count}`);
    });

    (reward.deco || []).forEach((id) => {
      const deco = decoOf(id);
      if (pet.ownedDeco.includes(id)) {
        pet.inventory.food.cookie = (pet.inventory.food.cookie || 0) + 2;
        parts.push('小饼干 ×2（装饰已有）');
        return;
      }
      pet.ownedDeco.push(id);
      // 该槽位还空着就自动戴上 —— 升级后马上能看到外观变化
      if (deco && !pet.wear[deco.slot]) {
        pet.wear[deco.slot] = id;
        parts.push(`${deco.name}（已戴上）`);
      } else {
        parts.push(deco?.name || id);
      }
    });

    (reward.scene || []).forEach((id) => {
      if (pet.ownedScene.includes(id)) {
        pet.inventory.food.cookie = (pet.inventory.food.cookie || 0) + 2;
        parts.push('小饼干 ×2（乐园已有）');
        return;
      }
      pet.ownedScene.push(id);
      parts.push(`乐园「${sceneOf(id)?.name || id}」`);
    });

    gained.push({ level: lv, text: parts.join('、') });
  }
  pet.claimedLevel = toLevel;
  return gained;
}

/**
 * 同步等级并发放奖励，所有加成长值的行为都走这里。
 * claimedLevel 用于记录已发到哪一级，防止重复领取。
 */
function syncLevel(pet) {
  const before = pet.level;
  const lv = computeLevel(pet.exp);
  pet.level = lv.level;
  if (lv.level <= before) {
    if (!pet.claimedLevel) pet.claimedLevel = lv.level;
    return { leveledUp: false, rewards: [] };
  }
  const from = Math.max(pet.claimedLevel || before, before);
  const rewards = grantRewards(pet, from, lv.level);
  return { leveledUp: true, rewards };
}

/** 兼容老存档：等级已经涨上去、但奖励从没发过时，在读档时补发一次 */
function ensureRewards(pet) {
  const claimed = pet.claimedLevel || 1;
  if (pet.level > claimed) return grantRewards(pet, claimed, pet.level);
  if (!pet.claimedLevel) pet.claimedLevel = pet.level;
  return [];
}

/* ============================================================
   核心：stateOf（每次对外的入口，自动衰减 tick）
   ============================================================ */

/**
 * 获取完整宠物状态。如果还没领养返回 null。
 * 内部自动做每日衰减检查。
 */
export function stateOf() {
  const data = store.load();
  if (!data.pet) return null;
  tick(data); // 可能修改 data.pet（含升级奖励）
  if (ensureRewards(data.pet).length) store.save(data); // 老存档补发
  return buildView(data.pet);
}

/** 对 data.pet 做每日衰减（如果今天还没衰减过） */
function tick(data) {
  const pet = data.pet;
  const today = store.todayKey();
  if (pet.lastCareDate === today) return;

  pet.hunger = clamp(pet.hunger - DECAY_HUNGER, 0, 100);
  pet.mood   = clamp(pet.mood   - DECAY_MOOD,   0, 100);

  // 照顾得好（饥饿心情都 >= 50），奖励被动成长值
  if (pet.hunger >= 50 && pet.mood >= 50) {
    pet.exp += 1;
  }

  pet.daily = { played: false, cleaned: false };
  pet.lastCareDate = today;

  // 自动升级（含升级奖励发放）
  syncLevel(pet);

  store.save(data);
}

/** 基于 pet 原始对象，组合出给 UI 用的完整 view（等级进度、表情类名等） */
function buildView(pet) {
  const lv = computeLevel(pet.exp);
  const moodClass = computeMoodFace(pet.hunger, pet.mood);
  const species = speciesOf(pet.species);

  // 合成当前佩戴的装饰 SVG fragments
  const wearFragments = [];
  for (const slot of ['head', 'neck', 'face', 'back']) {
    const decoId = pet.wear[slot];
    if (decoId && DECO_SVG[decoId]) wearFragments.push(DECO_SVG[decoId]);
  }
  // 三套姿态各有独立骨架，每套都有一个 .decorations 锚点 → 必须 replaceAll，
  // 否则站姿/趴卧切换后装饰丢失（只替换第一处是旧 bug）。
  // class="pet" 与物种 CSS 变量已由 pet-assets.js 内联在 svg 根上，这里不再注入。
  const speciesSvg = species.svg.replaceAll(
    '<g class="decorations" data-part="decorations"></g>',
    `<g class="decorations" data-part="decorations">${wearFragments.join('')}</g>`
  );

  // 成长缩放：Lv.1=85% → Lv.5=100% → Lv.10=115%，线性插值
  const growthScale = Math.round((0.85 + ((lv.level - 1) / 9) * 0.3) * 100) / 100;
  // 等级外观档位：越高档，舞台上的光环越明显（1 素净 → 4 金色）
  const levelTier = lv.level <= 2 ? 1 : lv.level <= 5 ? 2 : lv.level <= 8 ? 3 : 4;
  return {
    ...pet,
    level: lv.level,
    levelProgress: lv.progress,
    levelNextAt: lv.nextAt,
    levelTier,        // 1~4，驱动宠物光环样式
    nextReward: LEVEL_REWARDS[lv.level + 1]?.label || '',
    growthScale,      // 宠物长大的缩放倍率 0.85~1.15
    moodClass,        // pet-sad / pet-happy / pet-sleep / ''
    speciesName: species.name,
    speciesEmoji: species.emoji,
    speciesSvg,       // 已合成装饰 + CSS 变量的完整 SVG 字符串
    sceneData: SCENES.find((s) => s.id === pet.scene) || SCENES[0],
  };
}

/** 根据饥饿/心情算表情类名 */
export function computeMoodFace(hunger, mood) {
  if (mood < 20 || hunger < 20) return 'pet-sad';
  if (mood >= 75 && hunger >= 50) return 'pet-happy';
  // sleep 留给未来（比如深夜？简单起见先不自动触发）
  return '';
}

/* ============================================================
   宠物行为
   ============================================================ */

/** 喂食：消耗背包里 1 个食物，按物种喜好加修饰 + 语音反馈 */
export function feed(foodId) {
  const food = foodOf(foodId);
  if (!food) return { ok: false, reason: 'unknown-food' };
  const data = store.load();
  if (!data.pet) return { ok: false, reason: 'no-pet' };
  const inv = data.pet.inventory.food || {};
  if ((inv[foodId] || 0) <= 0) return { ok: false, reason: 'no-food' };

  inv[foodId] -= 1;
  if (inv[foodId] <= 0) delete inv[foodId];

  // 根据物种偏好修饰：喜欢 +50% 效果 +15 心情，讨厌 -30% -10 心情
  const mod = foodModifierFor(foodId, data.pet.species);
  const hunger = Math.round(food.hunger * mod.modifier);
  const moodBonus = mod.tag === 'like' ? 15 : mod.tag === 'hate' ? -10 : 0;
  const mood   = Math.round((food.mood + moodBonus) * mod.modifier);

  data.pet.hunger = clamp(data.pet.hunger + hunger, 0, 100);
  data.pet.mood   = clamp(data.pet.mood   + mood,   0, 100);
  data.pet.exp += EXP_FEED;

  const grew = syncLevel(data.pet);

  store.save(data);

  // 语音由宠物乐园页统一用童声播报（这里不再重复朗读，避免覆盖童声）

  return {
    ok: true, fed: hunger, moodUp: mood,
    leveledUp: grew.leveledUp, rewards: grew.rewards, preference: mod.tag
  };
}

/** 抚摸（免费，次数不限；心情已经满格时不再给成长值，避免一直摸一直刷分） */
export function touch() {
  const data = store.load();
  if (!data.pet) return { ok: false, reason: 'no-pet' };

  const moodBefore = data.pet.mood;
  data.pet.mood = clamp(moodBefore + 20, 0, 100);
  // 只有真正把心情摸上去才给成长值：心情满 100 时继续抚摸不再加分
  const grew = data.pet.mood > moodBefore;
  if (grew) data.pet.exp += EXP_TOUCH;

  const lv = syncLevel(data.pet);
  store.save(data);
  return {
    ok: true, expGain: grew ? EXP_TOUCH : 0,
    leveledUp: lv.leveledUp, rewards: lv.rewards
  };
}

/** 玩耍（每日 1 次，心情大 +） */
export function play() {
  const data = store.load();
  if (!data.pet) return { ok: false, reason: 'no-pet' };
  if (data.pet.daily.played) return { ok: false, reason: 'daily-limit' };

  data.pet.daily.played = true;
  data.pet.mood = clamp(data.pet.mood + 30, 0, 100);
  data.pet.exp += EXP_PLAY;

  const lv = syncLevel(data.pet);
  store.save(data);
  return { ok: true, leveledUp: lv.leveledUp, rewards: lv.rewards };
}

/** 清洁（每日 1 次，小成长） */
export function clean() {
  const data = store.load();
  if (!data.pet) return { ok: false, reason: 'no-pet' };
  if (data.pet.daily.cleaned) return { ok: false, reason: 'daily-limit' };

  data.pet.daily.cleaned = true;
  data.pet.mood = clamp(data.pet.mood + 10, 0, 100);
  data.pet.exp += EXP_CLEAN;

  const lv = syncLevel(data.pet);
  store.save(data);
  return { ok: true, leveledUp: lv.leveledUp, rewards: lv.rewards };
}

/* ============================================================
   装饰 / 乐园 / 昵称
   ============================================================ */

/** 装备装饰（必须先拥有） */
export function equipDeco(decoId) {
  const deco = decoOf(decoId);
  if (!deco) return { ok: false, reason: 'unknown' };
  return store.update((data) => {
    if (!data.pet) return { ok: false, reason: 'no-pet' };
    if (!data.pet.ownedDeco.includes(decoId)) return { ok: false, reason: 'not-owned' };
    data.pet.wear[deco.slot] = decoId;
    return { ok: true };
  });
}

/** 脱下某个槽位的装饰 */
export function unequipDeco(slot) {
  return store.update((data) => {
    if (!data.pet) return { ok: false, reason: 'no-pet' };
    data.pet.wear[slot] = null;
    return { ok: true };
  });
}

/** 切换乐园场景（必须先拥有） */
export function changeScene(sceneId) {
  return store.update((data) => {
    if (!data.pet) return { ok: false, reason: 'no-pet' };
    if (!data.pet.ownedScene.includes(sceneId)) return { ok: false, reason: 'not-owned' };
    data.pet.scene = sceneId;
    return { ok: true };
  });
}

/** 改昵称（1-8 字） */
export function changeNickname(name) {
  const n = String(name || '').trim().slice(0, 8);
  if (!n) return { ok: false, reason: 'empty' };
  return store.update((data) => {
    if (!data.pet) return { ok: false, reason: 'no-pet' };
    data.pet.nickname = n;
    return { ok: true };
  });
}

/* ============================================================
   给商店 / 宝箱用的"解锁"和"加食物"
   ============================================================ */

/** 商店兑换：加食物到背包 */
export function addFood(foodId, count = 1) {
  return store.update((data) => {
    if (!data.pet) return { ok: false, reason: 'no-pet' };
    if (!data.pet.inventory.food) data.pet.inventory.food = {};
    data.pet.inventory.food[foodId] = (data.pet.inventory.food[foodId] || 0) + count;
    return { ok: true, inventory: data.pet.inventory.food };
  });
}

/** 商店兑换：解锁装饰 */
export function unlockDeco(decoId) {
  return store.update((data) => {
    if (!data.pet) return { ok: false, reason: 'no-pet' };
    if (!data.pet.ownedDeco.includes(decoId)) data.pet.ownedDeco.push(decoId);
    return { ok: true };
  });
}

/** 商店兑换：解锁乐园 */
export function unlockScene(sceneId) {
  return store.update((data) => {
    if (!data.pet) return { ok: false, reason: 'no-pet' };
    if (!data.pet.ownedScene.includes(sceneId)) data.pet.ownedScene.push(sceneId);
    return { ok: true };
  });
}

/* ============================================================
   首次领养
   ============================================================ */

/** 创建宠物（首次领养），返回完整 state */
export function createPet(speciesId, nickname) {
  const species = SPECIES.find((s) => s.id === speciesId);
  if (!species) return { ok: false, reason: 'unknown-species' };
  const name = String(nickname || '').trim().slice(0, 8) || '旺财';

  const initialScene = SCENES[0].id; // garden 初始解锁
  const initialDeco = [];           // 初始无装饰

  const pet = {
    species: species.id,
    nickname: name,
    level: 1,
    exp: 0,
    hunger: 80,
    mood: 80,
    scene: initialScene,
    wear: { head: null, neck: null, face: null, back: null },
    inventory: { food: { cookie: 2 } }, // 送 2 个饼干
    ownedDeco: initialDeco,
    ownedScene: [initialScene],
    daily: { played: false, cleaned: false },
    lastCareDate: store.todayKey(),
  };

  return store.update((data) => {
    if (data.pet) return { ok: false, reason: 'already-has-pet' };
    data.pet = pet;
    return { ok: true, pet };
  });
}

/* ============================================================
   给 shop.js / chest.js 消费的类型映射
   ============================================================ */

/** 根据商品 category 走对应的解锁/加食物函数 */
export function grantShopItem(category, id) {
  switch (category) {
    case 'pet-food':  return addFood(id, 1);
    case 'pet-deco':  return unlockDeco(id);
    case 'pet-scene': return unlockScene(id);
    default: return { ok: false, reason: 'unknown-category' };
  }
}
