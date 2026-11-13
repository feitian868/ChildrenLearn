/**
 * shop.js —— 积分商店
 * 规则：家长承诺类奖励（SHOP_ITEMS，category=parent-reward）每周限兑 1 次，
 *       避免无上限答应孩子。宠物类商品（食物/装饰/乐园）不受周限额，
 *       但装饰/乐园已拥有时禁止重复兑换。
 * 订单写入 dailyTaskData.orders，每条默认 fulfilled=false，家长可在工作台勾选已兑现。
 */

import * as store from './store.js';
import { weekStartKey } from './mastery.js';
import { SHOP_ITEMS } from '../data/rewards.js';
import { PET_FOODS, PET_DECOS, PET_SCENES } from '../data/pet-shop.js';
import { grantShopItem } from './pet.js';

/** 家长承诺类奖励每周限兑 1 次 */
const PARENT_REWARD_WEEKLY_CAP = 1;

/** 合并后所有可兑换商品：家长承诺类 + 宠物三类 */
function allItems() {
  const mapped = SHOP_ITEMS.map((x) => ({ ...x, category: 'parent-reward' }));
  const foods = PET_FOODS.map((x) => ({ ...x, category: 'pet-food' }));
  const decos = PET_DECOS.map((x) => ({ ...x, category: 'pet-deco' }));
  const scenes = PET_SCENES.filter((x) => x.cost > 0).map((x) => ({ ...x, category: 'pet-scene' }));
  return [...mapped, ...foods, ...decos, ...scenes];
}

function weekKeyOf(dateKey) {
  return `W${weekStartKey(dateKey)}`;
}

/** 某商品本周已兑换数（按周一为起点） */
function weeklyCount(data, itemId, category) {
  if (category !== 'parent-reward') return 0;
  const wk = weekKeyOf(store.todayKey());
  return (data.orders || [])
    .filter((o) => o.category === 'parent-reward' && weekKeyOf(o.date) === wk)
    .length;
}

export function shopState() {
  const data = store.load();
  const points = data.profile.points || 0;
  const hasPet = Boolean(data.pet);
  const wk = weekKeyOf(store.todayKey());
  const weeklyParentCount = (data.orders || []).filter(
    (o) => o.category === 'parent-reward' && weekKeyOf(o.date) === wk
  ).length;

  const decorate = (item) => {
    const wc = weeklyCount(data, item.id, item.category);
    return {
      ...item,
      affordable: points >= item.cost,
      shortfall: Math.max(0, item.cost - points),
      // pet 类需要先领养宠物
      lockedForPet: item.category.startsWith('pet-') && !hasPet,
      // 家长承诺类本周已兑满就禁兑
      weeklyCount: wc,
      weeklyCap: item.category === 'parent-reward' ? PARENT_REWARD_WEEKLY_CAP : null,
      weeklyBlocked: item.category === 'parent-reward' && wc >= PARENT_REWARD_WEEKLY_CAP,
    };
  };

  const items = SHOP_ITEMS.map((x) => decorate({ ...x, category: 'parent-reward' }));
  const petFoods = PET_FOODS.map(decorate);
  const petDecos = PET_DECOS.map((d) => {
    const owned = data.pet?.ownedDeco?.includes(d.id);
    return { ...decorate(d), owned };
  });
  const petScenes = PET_SCENES.filter((s) => s.cost > 0).map((s) => {
    const owned = data.pet?.ownedScene?.includes(s.id);
    return { ...decorate(s), owned };
  });

  const orders = (data.orders || []).slice(-8).reverse().map((o) => ({
    ...o,
    fulfilled: o.fulfilled === true, // 家长端可勾
  }));

  return {
    points,
    hasPet,
    items,
    petFoods,
    petDecos,
    petScenes,
    orders,
    weeklyParentCount,
    weeklyParentCap: PARENT_REWARD_WEEKLY_CAP,
  };
}

export function redeemItem(itemId) {
  const item = allItems().find((x) => x.id === itemId);
  if (!item) return { ok: false, reason: 'not-found' };

  const data = store.load();
  const points = data.profile.points || 0;

  // pet 类必须先领养
  if (item.category.startsWith('pet-') && !data.pet) {
    return { ok: false, reason: 'need-pet' };
  }
  // 已经拥有的永久物品不能再买
  if (item.category === 'pet-deco' && data.pet?.ownedDeco?.includes(itemId)) {
    return { ok: false, reason: 'already-owned' };
  }
  if (item.category === 'pet-scene' && data.pet?.ownedScene?.includes(itemId)) {
    return { ok: false, reason: 'already-owned' };
  }
  // 家长承诺类：每周限兑 1 次（按周一为起点）
  if (item.category === 'parent-reward') {
    const wc = weeklyCount(data, item.id, item.category);
    if (wc >= PARENT_REWARD_WEEKLY_CAP) {
      return {
        ok: false,
        reason: 'weekly-cap',
        weeklyCount: wc,
        weeklyCap: PARENT_REWARD_WEEKLY_CAP,
      };
    }
  }

  if (points < item.cost) {
    return { ok: false, reason: 'points', shortfall: item.cost - points };
  }

  // 扣积分
  data.profile.points = points - item.cost;

  // 写入订单（家长端兑现前 fulfilled 为 false）
  const order = {
    id: `ord-${Date.now()}`,
    itemId: item.id,
    name: item.name,
    emoji: item.emoji,
    cost: item.cost,
    category: item.category,
    date: store.todayKey(),
    at: Date.now(),
    fulfilled: false,
  };
  data.orders = [...(data.orders || []), order].slice(-50);

  // 如果是 pet 类，自动解锁/加食物
  if (item.category.startsWith('pet-')) {
    switch (item.category) {
      case 'pet-food': {
        if (!data.pet.inventory.food) data.pet.inventory.food = {};
        data.pet.inventory.food[item.id] = (data.pet.inventory.food[item.id] || 0) + 1;
        break;
      }
      case 'pet-deco': {
        if (!data.pet.ownedDeco.includes(item.id)) data.pet.ownedDeco.push(item.id);
        break;
      }
      case 'pet-scene': {
        if (!data.pet.ownedScene.includes(item.id)) data.pet.ownedScene.push(item.id);
        break;
      }
    }
  }

  store.save(data);
  return { ok: true, order, points: data.profile.points };
}

/** 家长端标记订单是否已兑现 */
export function markOrderFulfilled(orderId, fulfilled = true) {
  const data = store.load();
  const order = (data.orders || []).find((o) => o.id === orderId);
  if (!order) return { ok: false, reason: 'not-found' };
  order.fulfilled = Boolean(fulfilled);
  store.save(data);
  return { ok: true, order };
}
