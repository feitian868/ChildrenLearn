/**
 * score.js —— 积分结算
 * 规则：每完成一个任务 +2 分；四科全完成当日 +5 分，连续天数每多一天再 +2 分。
 * 只有游戏页真实达标后才会调用 completeTask，工作台不能手动勾选。
 */

import * as store from './store.js';
import { allSubjectsDone } from './tasks.js';

export const TASK_POINTS = 2;   // 每完成 1 个挑战 +2
export const DAILY_BONUS = 5;   // 当天四科全完成的基础奖励
export const STREAK_PER_DAY = 2; // 连续天数每多一天的额外加成（第 N 天 allDone 加 (N-1)*2）

export function completeTask(taskId, result = {}) {
  const data = store.load();
  const day = store.getToday(data);
  if (!day) return null;
  const task = day.tasks.find((t) => t.id === taskId);
  if (!task) return null;

  if (task.done) {
    return {
      already: true,
      points: 0,
      allDone: allSubjectsDone(day),
      chestUnlocked: Boolean(day.chest?.unlocked),
      streak: data.profile.streak || 0
    };
  }

  task.done = true;
  task.doneAt = Date.now();
  task.firstTryCorrect = Number.isFinite(result.firstTryCorrect) ? result.firstTryCorrect : null;
  task.resultTotal = Number.isFinite(result.total) ? result.total : task.questions.length;
  task.attempts = (task.attempts || 0) + 1;
  // v3 新增：答题详情（错因、每题首答结果）
  if (Array.isArray(result.wrongReasons) && result.wrongReasons.length) {
    task.wrongReasons = result.wrongReasons;
  }
  if (Array.isArray(result.questionResults)) {
    task.questionResults = result.questionResults;
  }

  const profile = data.profile;
  let awarded = TASK_POINTS;
  profile.points = (profile.points || 0) + TASK_POINTS;

  let dailyBonus = 0;
  let streakBonus = 0;
  let streak = profile.streak || 0;
  const allDone = allSubjectsDone(day);

  if (allDone) day.chest.unlocked = true;

  if (allDone && !day.allDoneBonus) {
    // 先更新连续天数，连签加成要用到新 streak
    if (profile.lastFullDate !== day.date) {
      const yesterday = store.shiftDateKey(day.date, -1);
      streak = profile.lastFullDate === yesterday ? (profile.streak || 0) + 1 : 1;
      profile.streak = streak;
      profile.lastFullDate = day.date;
    } else {
      streak = profile.streak || 1;
    }

    // 基础 5 分 + 连续天数每多一天 +2（第 1 天 streak=1 → 额外 +0，第 2 天 → +2，第 3 天 → +4 …）
    dailyBonus = DAILY_BONUS;
    streakBonus = Math.max(0, (streak - 1)) * STREAK_PER_DAY;

    day.allDoneBonus = dailyBonus;
    day.streakBonus = streakBonus;

    awarded += dailyBonus + streakBonus;
  }

  profile.points += dailyBonus + streakBonus;
  store.save(data);

  return {
    already: false,
    points: awarded,
    taskPoints: TASK_POINTS,
    dailyBonus,
    streakBonus,
    streak,
    allDone,
    chestUnlocked: Boolean(day.chest?.unlocked)
  };
}

/** 标记今日庆祝动画已播放，避免工作台与游戏页重复弹出 */
export function markCelebrated() {
  return store.update((data) => {
    const day = data.days[store.todayKey()];
    if (day) day.celebrated = true;
  });
}

export function todayScoreSummary() {
  const data = store.load();
  const day = store.getToday(data);
  return {
    points: data.profile.points || 0,
    streak: data.profile.streak || 0,
    allDone: day ? allSubjectsDone(day) : false
  };
}
