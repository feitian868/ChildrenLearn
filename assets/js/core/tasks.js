/**
 * tasks.js —— 每日任务生成
 * 同一天、同一年级生成的任务固定（刷新不会变），跨天自动换新。
 * 每科 2~3 项，每项 4 题，且至少包含 1 道 level 2 题。
 *
 * 防重复：近 365 天做过的题优先回避（recentQuestions），池子耗尽时
 * 按「最久没做过」兜底轮换，保证永远能出满题。
 * 难度递进：按近 7 天首答正确率自适应每项任务的 level 2 数量——
 *   正确率 ≥85% → 3 道挑战题；≥60% → 2 道；否则 1 道（保底）。
 */

import * as store from './store.js';
import { hashString, mulberry32, shuffle } from '../core/rng.js';
import {
  QUESTIONS_PER_TASK,
  focusOf,
  taskCountFor
} from '../data/curriculum.js';
import { CHINESE_BANK, chineseGenerated } from '../data/knowledge-chinese.js';
import { ENGLISH_BANK, englishGenerated } from '../data/knowledge-english.js';
import { SCIENCE_BANK, scienceGenerated } from '../data/knowledge-science.js';
import { mathPool } from '../data/knowledge-math.js';

const STATIC_BANKS = {
  chinese: CHINESE_BANK,
  english: ENGLISH_BANK,
  science: SCIENCE_BANK
};

/** 每日参数化生成器：静态题库之外，每天再生成一批新题 */
const GENERATORS = {
  chinese: chineseGenerated,
  english: englishGenerated,
  science: scienceGenerated
};

const AVOID_DAYS = 365;       // 同一道题（题面+选项完全一致）365 天内不重复
const COOLDOWN_DAYS = 10;     // 同一知识点至少间隔 10 天再考
const ADAPT_DAYS = 7;         // 自适应看近 7 天首答正确率

const poolCache = new Map();

function getPool(subject, grade, rng) {
  if (subject === 'math') {
    // 数学题每次用同一日期种子重建，保证当天各科任务题目一致
    return mathPool(grade, rng);
  }
  const cacheKey = `${subject}:${grade}`;
  if (!poolCache.has(cacheKey)) {
    poolCache.set(cacheKey, STATIC_BANKS[subject].filter((item) => item.grade === grade));
  }
  const staticPool = poolCache.get(cacheKey);
  const gen = GENERATORS[subject];
  // 生成题 id 由「题干+选项」内容哈希，知识点 key 用于冷却调度
  return gen ? [...staticPool, ...gen(grade, rng)] : staticPool;
}

/** 近 7 天首答正确率 → 每项任务的 level 2 目标数（1~3，保底 1） */
function level2Target(data) {
  const today = store.todayKey();
  let correct = 0;
  let total = 0;
  for (let i = 1; i <= ADAPT_DAYS; i++) {
    const h = data.dailyHistory?.[store.shiftDateKey(today, -i)];
    if (h?.firstTry?.total) {
      correct += h.firstTry.correct;
      total += h.firstTry.total;
    }
  }
  if (!total) return 1; // 无历史：默认配比
  const acc = correct / total;
  if (acc >= 0.85) return 3;
  if (acc >= 0.6) return 2;
  return 1;
}



function pickQuestions(rng, pool, used, usedKeys, avoidMap, l2t, dayKey) {
  const avail = pool.filter((item) => !used.has(item.id));
  // 知识点冷却起点：key 在 COOLDOWN_DAYS 内考过，本轮先让位给别的知识点
  const coolFrom = store.shiftDateKey(dayKey, -COOLDOWN_DAYS);
  const keyHot = (item) => {
    if (!item.key) return '';
    const d = avoidMap[`k:${item.key}`];
    return d && d >= coolFrom ? d : '';
  };
  // 第一优先一定是「365 天内没出现过的题面」，冷却只是同档内的排序偏好，
  // 不能因为知识点冷却把已出过的题顶上来（否则会出现同年重复）。
  const unseen = avail.filter((item) => !avoidMap[item.id]);
  const seenBefore = avail
    .filter((item) => avoidMap[item.id])
    .sort((a, b) => ((avoidMap[a.id] || '') < (avoidMap[b.id] || '') ? -1 : 1));
  const split = (list) => {
    const fresh = shuffle(rng, list.filter((item) => !keyHot(item)));
    const cool = shuffle(rng, list.filter((item) => keyHot(item)));
    return { fresh, cool };
  };
  const l2 = split(unseen.filter((item) => item.level === 2));
  const l1 = split(unseen.filter((item) => item.level === 1));

  const picked = [];
  const take = (list, upTo, allowSameKey = false) => {
    for (const q of list) {
      if (picked.length >= upTo) break;
      if (picked.includes(q)) continue;
      // 同一天同一科目不重复考同一个知识点（兜底轮换时才允许复用）
      if (!allowSameKey && q.key && usedKeys.has(q.key)) continue;
      picked.push(q);
      if (q.key) usedKeys.add(q.key);
    }
  };

  take([...l2.fresh, ...l2.cool], l2t);              // 1. L2 配到目标数
  take([...l1.fresh, ...l1.cool], QUESTIONS_PER_TASK); // 2. 没用过的 L1 补
  take([...l2.fresh, ...l2.cool], QUESTIONS_PER_TASK); // 3. 不够先用没用过的 L2 补
  take(seenBefore, QUESTIONS_PER_TASK, true);        // 4. 最后才用「最久未做」的旧题兜底
  if (picked.length < QUESTIONS_PER_TASK) return [];
  picked.forEach((item) => used.add(item.id));
  return picked;
}

function titleOf(questions) {
  const topics = [];
  questions.forEach((q) => {
    if (q.topic && !topics.includes(q.topic)) topics.push(q.topic);
  });
  return topics.slice(0, 2).join(' · ');
}

function buildDay(key, grade, data) {
  const weekday = store.weekdayOf(key);
  const focus = focusOf(weekday);
  const tasks = [];
  const avoidMap = data?.recentQuestions || {};
  const l2t = level2Target(data || {});

  store.SUBJECTS.forEach((subject) => {
    const meta = store.SUBJECT_META[subject];
    const count = taskCountFor(subject, weekday);
    const rng = mulberry32(hashString(`${key}:${grade}:${subject}`));
    const pool = getPool(subject, grade, rng);
    const used = new Set();
    const usedKeys = new Set();
    for (let i = 0; i < count; i++) {
      const questions = pickQuestions(rng, pool, used, usedKeys, avoidMap, l2t, key);
      if (!questions.length) break;
      tasks.push({
        id: `${subject}-${key}-${i + 1}`,
        subject,
        subjectName: meta.name,
        icon: meta.icon,
        title: titleOf(questions),
        questions: questions.map((q) => ({ ...q })),
        level2: questions.filter((q) => q.level === 2).length,
        done: false,
        doneAt: null,
        firstTryCorrect: null,
        attempts: 0
      });
    }
  });

  return {
    date: key,
    grade,
    weekday,
    focus,
    tasks,
    chest: {
      unlocked: false,
      opened: false,
      rewardId: null,
      rewardName: null,
      rewardType: null
    },
    allDoneBonus: 0,
    celebrated: false,
    streakBonus: 0,
    generatedAt: Date.now()
  };
}

/** 把今天用到的题写进 recentQuestions，并裁剪 365 天前的记录 */
function markUsed(data, day) {
  const map = data.recentQuestions || (data.recentQuestions = {});
  day.tasks.forEach((t) => t.questions.forEach((q) => {
    map[q.id] = day.date;
    if (q.key) map[`k:${q.key}`] = day.date;
  }));
  const cutoff = store.shiftDateKey(day.date, -AVOID_DAYS);
  Object.keys(map).forEach((id) => { if (map[id] < cutoff) delete map[id]; });
}

/** 保证今天的任务已经生成，返回今天的 day 对象 */
export function ensureToday() {
  const data = store.load();
  const key = store.todayKey();
  let day = data.days[key];

  if (day && Array.isArray(day.tasks) && day.tasks.length && day.grade === data.grade) {
    return day;
  }
  if (day && day.chest?.opened) {
    // 已经领过宝箱的当天不重排，避免奖励丢失
    return day;
  }

  day = buildDay(key, data.grade, data);
  // 重建（如年级变化）时继承当天已入账的奥数积分，避免与 profile.points 不一致
  const prevOlympic = data.days[key]?.olympicEarned;
  if (prevOlympic) day.olympicEarned = prevOlympic;
  data.days[key] = day;
  markUsed(data, day);
  store.save(data);
  return day;
}

/** 切换年级时重新生成今天的任务（积分与历史保留） */
export function regenerateToday(grade) {
  const data = store.load();
  const key = store.todayKey();
  const oly = data.days[key]?.olympicEarned || 0;
  data.grade = grade;
  delete data.days[key];
  // 占位让 ensureToday 重建时继承当天奥数积分（积分已入账 profile，不能丢）
  if (oly) data.days[key] = { date: key, olympicEarned: oly };
  store.save(data);
  return ensureToday();
}

export function getTaskById(taskId) {
  const day = ensureToday();
  return day.tasks.find((t) => t.id === taskId) || null;
}

export function subjectProgress(day) {
  const map = {};
  store.SUBJECTS.forEach((subject) => {
    const list = day.tasks.filter((t) => t.subject === subject);
    map[subject] = {
      total: list.length,
      done: list.filter((t) => t.done).length
    };
  });
  return map;
}

export function dayProgress(day) {
  const total = day.tasks.length;
  const done = day.tasks.filter((t) => t.done).length;
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}

export function allSubjectsDone(day) {
  return store.SUBJECTS.every((subject) => {
    const list = day.tasks.filter((t) => t.subject === subject);
    return list.length > 0 && list.every((t) => t.done);
  });
}

/** 找到某科下一项未完成的任务（工作台“开始”按钮用） */
export function nextTaskOf(day, subject) {
  const list = day.tasks.filter((t) => t.subject === subject);
  return list.find((t) => !t.done) || list[0] || null;
}
