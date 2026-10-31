/**
 * shop.js —— 积分商店
 * 兑换后立即扣分，并记录日期与商品，写入 dailyTaskData.orders。
 * pet 商品（食物/装饰/乐园）同时会自动解锁到 pet 模块。
 */

import * as store from './store.js';
import { SHOP_ITEMS } from '../data/rewards.js';
import { PET_FOODS, PET_DECOS, PET_SCENES } from '../data/pet-shop.js';
import { grantShopItem } from './pet.js';

/** 合并后所有可兑换商品：家长承诺类 + 宠物三类 */
function allItems() {
  const mapped = SHOP_ITEMS.map((x) => ({ ...x, category: 'parent-reward' }));
  const foods = PET_FOODS.map((x) => ({ ...x, category: 'pet-food' }));
  const decos = PET_DECOS.map((x) => ({ ...x, category: 'pet-deco' }));
  const scenes = PET_SCENES.filter((x) => x.cost > 0).map((x) => ({ ...x, category: 'pet-scene' }));
  return [...mapped, ...foods, ...decos, ...scenes];
}

export function shopState() {
  const data = store.load();
  const points = data.profile.points || 0;
  const hasPet = Boolean(data.pet);

  const decorate = (item) => ({
    ...item,
    affordable: points >= item.cost,
    shortfall: Math.max(0, item.cost - points),
    // pet 类需要先领养宠物
    lockedForPet: item.category.startsWith('pet-') && !hasPet,
  });

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

  return {
    points,
    hasPet,
    items,
    petFoods,
    petDecos,
    petScenes,
    orders: (data.orders || []).slice(-8).reverse(),
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
  if (item.category === 'pet-food' && points < item.cost) {
    // 食物可以重复买，只要积分够
  }

  if (points < item.cost) {
    return { ok: false, reason: 'points', shortfall: item.cost - points };
  }

  // 扣积分
  data.profile.points = points - item.cost;

  // 写入订单
  const order = {
    id: `ord-${Date.now()}`,
    itemId: item.id,
    name: item.name,
    emoji: item.emoji,
    cost: item.cost,
    category: item.category,
    date: store.todayKey(),
    at: Date.now(),
  };
  data.orders = [...(data.orders || []), order].slice(-50);

  // 如果是 pet 类，自动解锁/加食物
  if (item.category.startsWith('pet-')) {
    // 用 grantShopItem —— 但我们已经在 store 里，直接原地改 pet 更高效
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
