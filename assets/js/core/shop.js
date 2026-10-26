/**
 * shop.js —— 积分商店
 * 兑换后立即扣分，并记录日期与商品，写入 dailyTaskData.orders。
 */

import * as store from './store.js';
import { SHOP_ITEMS } from '../data/rewards.js';

export function shopState() {
  const data = store.load();
  return {
    points: data.profile.points || 0,
    items: SHOP_ITEMS.map((item) => ({
      ...item,
      affordable: (data.profile.points || 0) >= item.cost,
      shortfall: Math.max(0, item.cost - (data.profile.points || 0))
    })),
    orders: (data.orders || []).slice(-8).reverse()
  };
}

export function redeemItem(itemId) {
  const data = store.load();
  const item = SHOP_ITEMS.find((x) => x.id === itemId);
  if (!item) return { ok: false, reason: 'not-found' };

  const points = data.profile.points || 0;
  if (points < item.cost) {
    return { ok: false, reason: 'points', shortfall: item.cost - points };
  }

  data.profile.points = points - item.cost;
  const order = {
    id: `ord-${Date.now()}`,
    itemId: item.id,
    name: item.name,
    emoji: item.emoji,
    cost: item.cost,
    date: store.todayKey(),
    at: Date.now()
  };
  data.orders = [...(data.orders || []), order].slice(-50);
  store.save(data);

  return { ok: true, order, points: data.profile.points };
}
