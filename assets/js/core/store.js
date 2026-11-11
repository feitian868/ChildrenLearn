﻿/**
 * store.js —— localStorage 的唯一读写入口（多用户版）
 *
 * 键位规划：
 *   app_users                    用户列表数组
 *   app_currentUser              当前用户名
 *   user_<用户名>_dailyTaskData   每个用户的完整数据
 *
 * 其他模块一律通过这里读写，统一走 getUserKey()，不散落硬编码键名。
 */

// 注意：不能导入 score.js（会形成循环依赖），这里的 2 必须和 score.js 的 TASK_POINTS 保持一致

export const APP_USERS_KEY = 'app_users';
export const APP_CURRENT_KEY = 'app_currentUser';
export const VERSION = 4;
export const HISTORY_KEEP = 90; // dailyHistory 只保留最近 90 天
export const DAYS_KEEP = 90;   // days 同样只留 90 天（否则 localStorage 会被撑爆）
const SNAPSHOT_DAYS = 7;       // 近 7 天保留完整题目快照（家长核对页看答案/解析），更早只存摘要
const RECENT_KEEP = 365;       // recentByDay/recentKeys 回避窗口，必须与 tasks.js 的 AVOID_DAYS 一致
const TREND_KEEP = 45;         // masteryTrend 只留 45 天，必须与 mastery.js 的 TREND_KEEP 一致

/**
 * v5 放行：P2~P5 四批按「同规格批量」整批生效，只写 4 个批次键。
 * 8 道 ma-u01-c3-01~08 仍走 v4 逐题 questionReview，单列、不并入批次。
 */
export const V5_RELEASE_BATCHES = [
  'p2-math-batch-1', 'p3-chinese-batch-1', 'p4-english-batch-1', 'p5-science-batch-1'
];

function releaseBatches() {
  const out = {};
  V5_RELEASE_BATCHES.forEach((b) => { out[b] = 'approved'; });
  return out;
}

/** 可选的头像 emoji 池，新建/切换时挑选。纯字符，不占存储。 */
export const AVATAR_POOL = [
  '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸',
  '🐵', '🐧', '🐥', '🦄', '🐙', '🐳', '🦉', '🦋',
  '🌞', '🌈', '⭐', '🍎', '🍓', '🎃', '🍀', '🌸'
];
export const DEFAULT_AVATAR = '👤';

export const SUBJECTS = ['chinese', 'english', 'math', 'science'];

export const SUBJECT_META = {
  chinese: { name: '语文', icon: '📖', page: 'chinese.html' },
  english: { name: '英语', icon: '🔤', page: 'english.html' },
  math: { name: '数学', icon: '🔢', page: 'math.html' },
  science: { name: '科学', icon: '🔬', page: 'science.html' }
};

/** 统一的用户数据键名，全系统唯一出处 */
export function getUserKey(username) {
  return `user_${username}_dailyTaskData`;
}

/* ------------------------- 日期工具 ------------------------- */

export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey() {
  return dateKey(new Date());
}

export function weekdayOf(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).getDay(); // 0=周日
}

export function shiftDateKey(key, delta) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d + delta);
  return dateKey(date);
}

export function formatDateCN(key) {
  const [, m, d] = key.split('-').map(Number);
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][weekdayOf(key)];
  return `${m} 月 ${d} 日 ${week}`;
}

/* ------------------------- 默认结构 ------------------------- */

function defaultData(grade = 3) {
  return {
    version: VERSION,
    grade,
    profile: {
      points: 0,
      streak: 0,
      lastFullDate: null,
      streakBonusDays: []
    },
    pet: null, // null = 未领养；完整结构见 pet.js 的 createPet()
    days: {},
    dailyHistory: {}, // { [dateKey]: { completed, total, pointsEarned, chestOpened, streak, firstTry:{correct,total} } }
    // B′ 存储紧凑化：取代旧 recentQuestions「每题 3 条 KV」
    recentByDay: {},   // { [dateKey]: [sig24] } 当日用过的题面签名，抽题回避用，保留 365 天
    recentKeys: {},    // { [key]: 最后使用日期 } 知识点冷却用，保留 365 天
    reviewOrig: {},    // { [sig24]: 首次出错日期 } 复习条目 origDate，按签名只存一份不随队列重复
    questionReview: {}, // { [questionId]: 'approved'|'rejected' } v4 逐题审核（8 道 legacy 单列）
    reviewBatches: releaseBatches(), // v5 批次级审核：四批默认生效，只写 4 个批次键
    reviewBatchesMigratedV5: true,   // 老存档一次性迁移标记，回滚后不复写
    // 阶段 B：掌握度是【累积状态】，不从 dailyHistory 重算（历史只留 90 天，重算会失忆）
    mastery: { v: 1, keys: {}, masteredAt: {}, aliases: {} },
    masteryTrend: {},  // { [dateKey]: { [knowledgeId]: 掌握度 0~100 } }，成长页曲线用
    reviewQueue: {},   // { [dateKey]: [ 'kid~stage~origSig~lastSig~reason~level', ... ] } 紧凑队列
    contentGaps: {},   // { [knowledgeId]: { first,last,count,reason } } 无变式时记内容缺口，交阶段 C
    quizzes: {},       // { [weekKey]: { date,total,correct,items:[[kid,ok,old]] } } 每周小测结果单独存
    speakingProgress: {}, // { [dateKey]: { practiced: [id], total } } 听说练习当日记录（只记练过）
    speakingQueue: {},     // { [id]: { kind,text,zh,level,origin,step,due } } 跨天复习队列 +1/+3/+7
    speakingRecent: {},    // { [sig]: 最后使用日期 } 听读内容回避用，保留 365 天
    speakingAward: {},     // { [dateKey]: true } 当日听说练习全部练完的加分已发放标记
    orders: [],
    settings: {
      sound: true,
      parentUnlocked: false,
      // 课程结构：教材版本/册次/当前单元均为空，等家长按课本封面确认后填写
      // 数学沿用 course（存量字段，不迁移）；其余三科放 courseBySubject
      course: {
        subject: 'math',
        mode: 'unit',
        version: '',
        grade: null,
        term: '',
        bookKey: '',
        currentUnitId: null,
        learnedUnits: []
      },
      courseBySubject: {
        chinese: {
          subject: 'chinese',
          mode: 'book',
          version: '',
          grade: null,
          term: '',
          bookKey: '',
          currentUnitId: null,
          learnedUnits: []
        },
        english: {
          subject: 'english',
          mode: 'unit',
          version: '',
          grade: null,
          term: '',
          bookKey: '',
          currentUnitId: null,
          learnedUnits: []
        },
        science: {
          subject: 'science',
          mode: 'unit',
          version: '',
          grade: null,
          term: '',
          bookKey: '',
          currentUnitId: null,
          learnedUnits: []
        }
      }
    }
  };
}

/* ------------------------- 用户管理 ------------------------- */

function readRaw(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn('[store] 读取失败', err);
    return null;
  }
}

let lastWriteError = null;

/** 最近一次写入是否成功：写满时必须让家长看到，否则进度会静默丢失 */
export function storageHealthy() { return lastWriteError === null; }

function writeRaw(key, value) {
  try {
    localStorage.setItem(key, value);
    lastWriteError = null;
  } catch (err) {
    lastWriteError = err;
    console.error('[store] 写入失败：本次进度不会保存', err);
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('store:write-failed', { detail: { error: String(err) } }));
    }
  }
}

/** 内部：把任意历史格式的用户列表统一成 [{name, avatar}]，并顺手写回标准格式 */
function readUserStore() {
  const raw = readRaw(APP_USERS_KEY);
  let list = null;      // 读到的原始数组（可能是字符串或对象）
  let needWrite = false;

  try {
    const parsed = JSON.parse(raw || 'null');
    if (parsed && Array.isArray(parsed.users)) {
      list = parsed.users;                    // 新版 { users: [...] }
    } else if (Array.isArray(parsed)) {
      list = parsed;                          // 更早的版本直接存数组
      needWrite = true;
    }
  } catch { /* 坏数据，重新初始化 */ }

  if (list && list.length) {
    const normalized = list
      .map((u) => {
        // 兼容三种历史形态：字符串 / {name,avatar} / {avatar}（旧版漏存了 name）
        if (typeof u === 'string') {
          const name = u.trim();
          return name ? { name, avatar: DEFAULT_AVATAR } : null;
        }
        if (u && typeof u === 'object' && u.name) {
          return {
            name: String(u.name).trim(),
            // avatar 可能被旧代码写成对象/空值，非字符串一律回落到默认头像
            avatar: typeof u.avatar === 'string' && u.avatar.trim() ? u.avatar.trim() : DEFAULT_AVATAR
          };
        }
        return null;
      })
      .filter(Boolean);

    if (normalized.length) {
      if (needWrite || normalized.length !== list.length || raw.indexOf('"name"') === -1) {
        writeRaw(APP_USERS_KEY, JSON.stringify({ users: normalized }));
      }
      return normalized;
    }
    needWrite = true; // 数组全被过滤掉了，重建
  }

  // 完全没有可用用户 → 初始化一个"默认用户"
  const seed = [{ name: '默认用户', avatar: DEFAULT_AVATAR }];
  writeRaw(APP_USERS_KEY, JSON.stringify({ users: seed }));
  if (!readRaw(APP_CURRENT_KEY)) writeRaw(APP_CURRENT_KEY, '默认用户');
  return seed;
}

/** 内部：把 [{name, avatar}] 对象数组写回 */
function writeUserStore(users, current) {
  writeRaw(APP_USERS_KEY, JSON.stringify({ users }));
  writeRaw(APP_CURRENT_KEY, current);
}

/** 对外：返回纯字符串数组（保持与 currentUser / switchUser 等旧调用的兼容） */
export function listUsers() {
  return readUserStore().map((u) => u.name);
}

export function getUserAvatar(name = currentUser()) {
  const users = readUserStore();
  const match = users.find((u) => u.name === name);
  return match ? match.avatar : DEFAULT_AVATAR;
}

/** 更新某个用户的头像 emoji */
export function setUserAvatar(name, avatar) {
  const users = readUserStore();
  const u = users.find((x) => x.name === name);
  if (!u) return { ok: false, reason: '用户不存在' };
  if (typeof avatar !== 'string' || !avatar.trim()) avatar = DEFAULT_AVATAR;
  u.avatar = avatar.trim();
  writeUserStore(users, currentUser());
  return { ok: true };
}

export function currentUser() {
  const name = readRaw(APP_CURRENT_KEY);
  const users = listUsers();
  if (name && users.includes(name)) return name;
  const fallback = users[0];
  // 旧版本可能把当前用户写成了 "undefined"/对象串，这里顺手修正，避免下次又读到脏值
  if (fallback && fallback !== name) writeRaw(APP_CURRENT_KEY, fallback);
  return fallback;
}

/** 首次打开：无用户则建"默认用户"；旧版 dailyTaskData 键自动迁移（旧数据优先） */
function bootstrapUsers() {
  const users = readUserStore();
  const cur = currentUser();
  if (!users.find((u) => u.name === cur)) {
    users.push({ name: cur, avatar: DEFAULT_AVATAR });
    writeUserStore(users, cur);
  }
  // 旧版单用户数据迁移：旧数据比新建的空数据珍贵，直接覆盖
  const legacy = readRaw('dailyTaskData');
  if (legacy) {
    writeRaw(getUserKey(cur), legacy);
    try { localStorage.removeItem('dailyTaskData'); } catch { /* 忽略 */ }
  }
  // 确保当前用户有数据文件
  if (!readRaw(getUserKey(cur))) writeRaw(getUserKey(cur), JSON.stringify(defaultData()));
}

/**
 * 新建用户并切换过去
 * @param {string} name
 * @param {string} [avatar] emoji 头像
 * @returns {{ok:boolean, reason?:string}}
 */
export function createUser(name, avatar) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return { ok: false, reason: '名字不能为空' };
  if (trimmed.length > 12) return { ok: false, reason: '名字最长 12 个字' };
  const users = readUserStore();
  if (users.some((u) => u.name === trimmed)) return { ok: false, reason: '已经有同名用户了' };
  const chosenAvatar = (typeof avatar === 'string' && avatar.trim()) ? avatar.trim() : DEFAULT_AVATAR;
  users.push({ name: trimmed, avatar: chosenAvatar });
  writeUserStore(users, trimmed);
  writeRaw(getUserKey(trimmed), JSON.stringify(defaultData()));
  memoryCache = null;
  return { ok: true };
}

/** 删除用户及其数据键；不允许删除最后一个用户 */
export function deleteUser(name) {
  const users = readUserStore();
  const match = users.find((u) => u.name === name);
  if (!match) return { ok: false, reason: '用户不存在' };
  if (users.length <= 1) return { ok: false, reason: '至少要保留一个用户' };
  try { localStorage.removeItem(getUserKey(name)); } catch { /* 忽略 */ }
  const rest = users.filter((u) => u.name !== name);
  const next = currentUser() === name ? rest[0].name : currentUser();
  writeUserStore(rest, next);
  memoryCache = null;
  return { ok: true, switchedTo: next };
}

/** 切换用户：当前数据随时随 update 落盘，这里只需清缓存换键 */
export function switchUser(name) {
  const users = readUserStore();
  if (!users.some((u) => u.name === name)) return { ok: false, reason: '用户不存在' };
  if (name === currentUser()) return { ok: true };
  memoryCache = null; // 清掉当前用户缓存，下次 load 读目标用户
  writeRaw(APP_CURRENT_KEY, name);
  if (!readRaw(getUserKey(name))) writeRaw(getUserKey(name), JSON.stringify(defaultData()));
  return { ok: true };
}

/* ------------------------- 读写（当前用户） ------------------------- */

let memoryCache = null; // 隐私模式等场景的兜底

export function load() {
  let data = memoryCache;
  if (!data) {
    try {
      const raw = readRaw(getUserKey(currentUser()));
      if (!raw) {
        data = defaultData();
        save(data);
        return data;
      }
      data = normalize(JSON.parse(raw));
      memoryCache = data;
    } catch (err) {
      console.warn('[store] 读取失败，使用内存数据', err);
      data = defaultData();
      memoryCache = data;
    }
  }
  // 命中缓存也补历史快照：跨天后同一页面再操作时不漏记昨天
  if (snapshotHistory(data) || slimOldDays(data)) save(data);
  return data;
}

export function save(data) {
  memoryCache = data;
  trimDays(data);
  slimOldDays(data); // 写时统一瘦身：近 7 天留完整快照，更早只留摘要
  writeRaw(getUserKey(currentUser()), JSON.stringify(data));
  return data;
}

export function update(mutator) {
  const data = load();
  // 把 mutator 的返回值原样带出：宠物模块的 update 回调返回 { ok, reason, ... }，
  // 若只返回 data，调用方拿不到 ok，会导致「领养/改名其实成功但 UI 报失败」。
  const result = mutator(data);
  save(data);
  return result === undefined ? data : result;
}

/**
 * B′ 迁移：旧 recentQuestions「每题 3 条 KV」→ recentByDay/recentKeys。
 * - `k:` 前缀 → recentKeys（知识点冷却，原样保留）；
 * - `s:<32位十进制>` → 截断为 24 位 Base36 后按日期进 recentByDay，
 *   与 rng.sig24 对同一内容串的结果完全一致，365 天去重语义不丢失；
 * - 纯 id 条目丢弃：同内容必同签名，s: 签名已覆盖其去重语义，丢弃不损失；
 * - 已经是新格式时原样保留，再把两边都裁剪到 365 天窗口。
 */
function migrateRecent(raw) {
  const byDay = raw.recentByDay && typeof raw.recentByDay === 'object' ? raw.recentByDay : {};
  const keys = raw.recentKeys && typeof raw.recentKeys === 'object' ? raw.recentKeys : {};
  const old = raw.recentQuestions;
  if (old && typeof old === 'object') {
    Object.entries(old).forEach(([k, date]) => {
      if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
      if (k.startsWith('k:')) {
        const kk = k.slice(2);
        if (!keys[kk] || keys[kk] < date) keys[kk] = date;
        return;
      }
      if (k.startsWith('s:')) {
        const n = Number(k.slice(2));
        if (!Number.isFinite(n)) return;
        const sig = ((n >>> 0) & 0xffffff).toString(36).padStart(5, '0');
        const arr = byDay[date] || (byDay[date] = []);
        if (!arr.includes(sig)) arr.push(sig);
      }
      // 纯 id 条目：不迁移（签名已覆盖，见上）
    });
  }
  const cutoff = shiftDateKey(todayKey(), -RECENT_KEEP);
  Object.keys(byDay).forEach((d) => {
    if (d < cutoff || !Array.isArray(byDay[d])) delete byDay[d];
  });
  Object.keys(keys).forEach((k) => {
    if (typeof keys[k] !== 'string' || keys[k] < cutoff) delete keys[k];
  });
  return { recentByDay: byDay, recentKeys: keys };
}

function normalize(raw) {
  if (!raw || typeof raw !== 'object') return defaultData();
  const grade = Number(raw.grade);
  const base = defaultData(Number.isInteger(grade) && grade >= 1 && grade <= 6 ? grade : 3);
  // v5 放行：老存档一次性补写四批 approved；已有显式状态不覆盖（rejected 保留）
  const batches = raw.reviewBatches && typeof raw.reviewBatches === 'object' ? { ...raw.reviewBatches } : {};
  if (raw.reviewBatchesMigratedV5 !== true) {
    V5_RELEASE_BATCHES.forEach((b) => { if (batches[b] === undefined) batches[b] = 'approved'; });
  }

  const data = {
    ...base,
    grade: base.grade,
    profile: { ...base.profile, ...(raw.profile || {}) },
    days: raw.days && typeof raw.days === 'object' ? raw.days : {},
    dailyHistory: raw.dailyHistory && typeof raw.dailyHistory === 'object' ? raw.dailyHistory : {},
    // B′：读时兼容旧 recentQuestions（迁移见 migrateRecent），写时只写新格式
    ...migrateRecent(raw),
    reviewOrig: raw.reviewOrig && typeof raw.reviewOrig === 'object' ? raw.reviewOrig : {},
    questionReview: raw.questionReview && typeof raw.questionReview === 'object' ? raw.questionReview : {},
    reviewBatches: batches,
    reviewBatchesMigratedV5: true,
    // 阶段 B：老存档没有这些字段时补空结构；已有则原样保留（累积状态不能重置）
    mastery: {
      v: 1,
      keys: raw.mastery?.keys && typeof raw.mastery.keys === 'object' ? raw.mastery.keys : {},
      masteredAt: raw.mastery?.masteredAt && typeof raw.mastery.masteredAt === 'object' ? raw.mastery.masteredAt : {},
      // P0 分层：历史归档不是「裁剪」，读回时必须原样保留
      archive: raw.mastery?.archive && typeof raw.mastery.archive === 'object' ? raw.mastery.archive : {},
      aliases: raw.mastery?.aliases && typeof raw.mastery.aliases === 'object' ? raw.mastery.aliases : {}
    },
    masteryTrend: raw.masteryTrend && typeof raw.masteryTrend === 'object' ? raw.masteryTrend : {},
    reviewQueue: raw.reviewQueue && typeof raw.reviewQueue === 'object' ? raw.reviewQueue : {},
    contentGaps: raw.contentGaps && typeof raw.contentGaps === 'object' ? raw.contentGaps : {},
    quizzes: raw.quizzes && typeof raw.quizzes === 'object' ? raw.quizzes : {},
    speakingProgress: raw.speakingProgress && typeof raw.speakingProgress === 'object' ? raw.speakingProgress : {},
    speakingRecent: raw.speakingRecent && typeof raw.speakingRecent === 'object' ? raw.speakingRecent : {},
    speakingAward: raw.speakingAward && typeof raw.speakingAward === 'object' ? raw.speakingAward : {},
    orders: Array.isArray(raw.orders) ? raw.orders : [],
    pet: raw.pet ?? base.pet,
    settings: {
      ...base.settings,
      ...(raw.settings || {}),
      // course 是嵌套对象，浅合并会把旧存档的 course 字段抹掉，这里单独兜底
      course: {
        ...base.settings.course,
        ...((raw.settings || {}).course || {}),
        learnedUnits: Array.isArray((raw.settings || {}).course?.learnedUnits)
          ? raw.settings.course.learnedUnits
          : []
      },
      // 三科各自兜底，避免旧存档缺字段或只存了其中一科时被整体覆盖
      courseBySubject: {
        chinese: {
          ...base.settings.courseBySubject.chinese,
          ...((raw.settings || {}).courseBySubject || {}).chinese || {}
        },
        english: {
          ...base.settings.courseBySubject.english,
          ...((raw.settings || {}).courseBySubject || {}).english || {}
        },
        science: {
          ...base.settings.courseBySubject.science,
          ...((raw.settings || {}).courseBySubject || {}).science || {}
        }
      }
    }
  };
  if (!Array.isArray(data.profile.streakBonusDays)) data.profile.streakBonusDays = [];

  // B′：masteryTrend 裁到 45 天——只裁曲线；mastery.keys / reviewQueue / quizzes 一律不裁，
  // 它们是「跨 100 天不失忆」的载体（与 mastery.js 头部的硬约束注释保持一致）
  const trendCutoff = shiftDateKey(todayKey(), -(TREND_KEEP - 1));
  Object.keys(data.masteryTrend).forEach((k) => { if (k < trendCutoff) delete data.masteryTrend[k]; });

  // 补齐每天的字段，兼容旧数据
  Object.values(data.days).forEach((day) => {
    if (!day || typeof day !== 'object') return;
    if (!Array.isArray(day.tasks)) day.tasks = [];
    if (!Array.isArray(day.focus)) day.focus = [];
    day.chest = {
      unlocked: false, opened: false, rewardId: null, rewardName: null, rewardType: null, rewardPoints: 0,
      ...(day.chest || {})
    };
  });
  return data;
}

/* ------------------------- 每日历史快照 ------------------------- */

/** 由某一天的数据算出快照 */
function snapshotOf(day, data) {
  const done = day.tasks.filter((t) => t.done);
  const pointsEarned =
    done.length * 2 +  // 与 score.js 的 TASK_POINTS 保持一致：每完成一个任务 +2 分
    (day.allDoneBonus || 0) +
    (day.streakBonus || 0) +
    (day.chest?.rewardPoints || 0) +
    (day.olympicEarned || 0); // 奥数专区得分也计入当日

  // --- 学科维度的首答正确率 ---
  const subjectStats = {};
  day.tasks.forEach((t) => {
    if (!t.subject || !t.done) return;
    if (!subjectStats[t.subject]) subjectStats[t.subject] = { correct: 0, total: 0 };
    subjectStats[t.subject].correct += t.firstTryCorrect || 0;
    subjectStats[t.subject].total += t.resultTotal || t.questions?.length || 4;
  });

  // --- 错题错因分布 ---
  /** @type {{careless:number|key:string, noknow:number|key:string, guess:number|key:string, nokey:{key:string,topic:string,miss:number,total:number}[]}} */
  let reasonStats = null;
  let weakKeys = null;
  const hasReasons = done.some((t) => Array.isArray(t.wrongReasons) && t.wrongReasons.length);
  if (hasReasons) {
    reasonStats = { careless: 0, noknow: 0, guess: 0 };
    const keyMiss = new Map();
    const keyTotal = new Map();
    done.forEach((t) => {
      (t.wrongReasons || []).forEach((entry, idx) => {
        reasonStats[entry.reason] = (reasonStats[entry.reason] || 0) + 1;
        const q = t.questions?.[idx];
        if (q?.key) {
          keyMiss.set(q.key, (keyMiss.get(q.key) || 0) + 1);
          keyTotal.set(q.key, (keyTotal.get(q.key) || 0)); // 同任务不同题不重复算 total
        }
      });
      // 同任务的题目 total 计数
      const taskKeys = new Set((t.questions || []).map((q) => q.key).filter(Boolean));
      taskKeys.forEach((k) => keyTotal.set(k, (keyTotal.get(k) || 0) + 1));
    });
    // 薄弱知识点 TOP（错题数 >= 2 的）
    weakKeys = Array.from(keyMiss.entries())
      .map(([key, miss]) => {
        // 找一个有这个 key 的题目拿 topic 名字
        const q = day.tasks.flatMap((t) => t.questions || []).find((x) => x.key === key);
        return { key, topic: q?.topic || key, miss, total: keyTotal.get(key) || 1 };
      })
      .filter((x) => x.miss >= 2)
      .sort((a, b) => b.miss - a.miss)
      .slice(0, 8);
  }

  return {
    completed: done.length,
    total: day.tasks.length,
    pointsEarned,
    chestOpened: Boolean(day.chest?.opened),
    streak: data.profile.streak || 0,
    // 首答正确统计：自适应难度的依据（旧数据没有该字段时为 null）
    firstTry: done.some((t) => t.firstTryCorrect != null)
      ? {
          correct: done.reduce((s, t) => s + (t.firstTryCorrect || 0), 0),
          total: done.reduce((s, t) => s + (t.resultTotal || t.questions?.length || 4), 0)
        }
      : null,
    // 以下是 v3 新增：诊断性评估数据
    subjectStats: Object.keys(subjectStats).length ? subjectStats : null,
    wrongReasons: reasonStats,
    weakKeys
  };
}

/**
 * 把「今天之前、尚未快照」的每一天写入 dailyHistory，并只保留最近 90 天。
 * @returns {boolean} 是否有改动
 */
function snapshotHistory(data) {
  const today = todayKey();
  let changed = false;
  Object.keys(data.days).forEach((key) => {
    if (key >= today) return;
    if (data.dailyHistory[key]) return;
    const day = data.days[key];
    if (!day || !Array.isArray(day.tasks)) return;
    data.dailyHistory[key] = snapshotOf(day, data);
    changed = true;
  });
  const keys = Object.keys(data.dailyHistory).sort();
  if (keys.length > HISTORY_KEEP) {
    keys.slice(0, keys.length - HISTORY_KEEP).forEach((k) => { delete data.dailyHistory[k]; });
    changed = true;
  }
  // days 必须一起裁：每个 day 含完整的 questions 数组，
  // 不裁的话用到半年会超过 localStorage 5MB 配额。
  // 历史统计已全部落在 dailyHistory，成长记录不依赖旧 days。
  if (trimDays(data)) changed = true;
  return changed;
}

/** days 只保留最近 DAYS_KEEP 天；写入时也调用，避免「今天新建一天」后变成 91 天 */
function trimDays(data) {
  const keys = Object.keys(data.days || {}).sort();
  if (keys.length <= DAYS_KEEP) return false;
  keys.slice(0, keys.length - DAYS_KEEP).forEach((k) => { delete data.days[k]; });
  return true;
}

/**
 * 单日瘦身：day.questions 只留 { id, kid, specId, firstTry, wrongReason, attempts, result }，
 * 题面/选项/答案/解析/source 不落盘，由「日期种子 + specId」按需重建。
 * 兼容旧存档：带 prompt 的整题结构按同口径投影；已是摘要的题原样保留（幂等）。
 * @returns {boolean} 是否有改动
 */
export function slimDay(day) {
  if (!day || !Array.isArray(day.tasks)) return false;
  let changed = false;
  day.tasks.forEach((task) => {
    if (!Array.isArray(task.questions)) return;
    const results = Array.isArray(task.questionResults) ? task.questionResults : [];
    const reasonByIdx = new Map(
      (Array.isArray(task.wrongReasons) ? task.wrongReasons : []).map((r) => [r?.qIdx, r?.reason])
    );
    task.questions = task.questions.map((q, i) => {
      if (!q || !q.prompt) return q; // 已是摘要（或空题），不重复投影
      changed = true;
      const firstTry = typeof results[i] === 'boolean' ? results[i] : null;
      return {
        id: q.id,
        kid: q.knowledgeId || q.courseKnowledgeId || q.key || '',
        specId: q.specId || '',
        firstTry,
        wrongReason: reasonByIdx.get(i) || null,
        attempts: task.attempts || 0,
        result: firstTry == null ? null : firstTry
      };
    });
    // 逐题结果已经投影进 stub，任务级的重复数组不再落盘
    if (Array.isArray(task.questionResults)) { delete task.questionResults; changed = true; }
    if (Array.isArray(task.wrongReasons)) { delete task.wrongReasons; changed = true; }
  });
  return changed;
}

/** 近 SNAPSHOT_DAYS 天保留完整快照，更早的天只存摘要 */
function slimOldDays(data) {
  const cutoff = shiftDateKey(todayKey(), -(SNAPSHOT_DAYS - 1));
  let changed = false;
  Object.keys(data.days || {}).forEach((key) => {
    if (key >= cutoff) return;
    if (slimDay(data.days[key])) changed = true;
  });
  return changed;
}

/** 成长记录用：历史快照 + 今天（实时计算）合并，键为日期 */
export function historyWithToday(data = load()) {
  const map = { ...(data.dailyHistory || {}) };
  const today = getToday(data);
  if (today) map[todayKey()] = snapshotOf(today, data);
  return map;
}

/* ------------------------- 查询 ------------------------- */

export function getDay(key = todayKey(), data = load()) {
  return data.days[key] || null;
}

export function getToday(data = load()) {
  return getDay(todayKey(), data);
}

export function getTask(taskId, data = load()) {
  const today = getToday(data);
  if (!today) return null;
  return today.tasks.find((t) => t.id === taskId) || null;
}

export function setGrade(grade) {
  return update((d) => { d.grade = grade; });
}

/* ------------------------- 数据管理 ------------------------- */

export function exportJSON() {
  return JSON.stringify(load(), null, 2);
}

export function parseImport(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('文件不是合法的 JSON');
  }
  if (!data || typeof data !== 'object') throw new Error('文件内容不是一个数据对象');
  if (!data.days || typeof data.days !== 'object') throw new Error('缺少 days 字段，可能不是本系统的备份');
  if (!data.profile || typeof data.profile !== 'object') throw new Error('缺少 profile 字段，可能不是本系统的备份');

  const normalized = normalize(data);
  normalized.version = VERSION;
  return normalized;
}

/** 导入到指定用户（默认当前用户）；导入其他用户不影响当前缓存 */
export function importData(data, username = currentUser()) {
  const normalized = normalize(data);
  writeRaw(getUserKey(username), JSON.stringify(normalized));
  if (username === currentUser()) memoryCache = normalized;
}

/** 重置当前用户的数据（保留用户本身与其他用户） */
export function resetAll() {
  memoryCache = null;
  try { localStorage.removeItem(getUserKey(currentUser())); } catch (err) { console.warn(err); }
  return load();
}

/* ------------------------- 启动 ------------------------- */

bootstrapUsers();
