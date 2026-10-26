/**
 * chest.js —— 今日宝箱
 * 四科全部达标后点亮；当天只能开一次；奖励池来自 data/rewards.js。
 */

import * as store from './store.js';
import { CHEST_REWARDS } from '../data/rewards.js';

export function chestState(day = store.getToday()) {
  if (!day) return { state: 'locked', reward: null };
  if (day.chest?.opened) {
    return {
      state: 'opened',
      reward: CHEST_REWARDS.find((r) => r.id === day.chest.rewardId) || {
        id: day.chest.rewardId,
        name: day.chest.rewardName,
        type: day.chest.rewardType
      }
    };
  }
  return { state: day.chest?.unlocked ? 'unlocked' : 'locked', reward: null };
}

function rollReward() {
  const total = CHEST_REWARDS.reduce((sum, r) => sum + (r.weight || 1), 0);
  let roll = Math.random() * total;
  for (const reward of CHEST_REWARDS) {
    roll -= reward.weight || 1;
    if (roll <= 0) return reward;
  }
  return CHEST_REWARDS[0];
}

export function openChest() {
  const data = store.load();
  const day = store.getToday(data);
  if (!day) return { ok: false, reason: 'no-day' };
  if (!day.chest?.unlocked) return { ok: false, reason: 'locked' };
  if (day.chest.opened) {
    return {
      ok: false,
      reason: 'opened',
      reward: CHEST_REWARDS.find((r) => r.id === day.chest.rewardId) || null
    };
  }

  const reward = rollReward();
  day.chest.opened = true;
  day.chest.openedAt = Date.now();
  day.chest.rewardId = reward.id;
  day.chest.rewardName = reward.name;
  day.chest.rewardType = reward.type;

  if (reward.type === 'points') {
    day.chest.rewardPoints = reward.points;
    data.profile.points = (data.profile.points || 0) + reward.points;
  } else {
    day.chest.rewardPoints = 0;
  }

  store.save(data);
  return { ok: true, reward, points: data.profile.points };
}
