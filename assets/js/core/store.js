/**
 * store.js —— localStorage 的唯一读写入口（多用户版）
 *
 * 键位规划：
 *   app_users                    用户列表数组
 *   app_currentUser              当前用户名
 *   user_<用户名>_dailyTaskData   每个用户的完整数据
 *
 * 其他模块一律通过这里读写，统一走 getUserKey()，不散落硬编码键名。
 */

export const APP_USERS_KEY = 'app_users';
export const APP_CURRENT_KEY = 'app_currentUser';
export const VERSION = 2;
export const HISTORY_KEEP = 90; // dailyHistory 只保留最近 90 天

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
    days: {},
    dailyHistory: {}, // { [dateKey]: { completed, total, pointsEarned, chestOpened, streak, firstTry:{correct,total} } }
    recentQuestions: {}, // { [questionId]: 最后使用日期 }，抽题回避用，保留 365 天
    orders: [],
    settings: {
      sound: true,
      parentUnlocked: false
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

function writeRaw(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn('[store] 写入失败（可能为隐私模式或空间不足）', err);
  }
}

export function listUsers() {
  try {
    const arr = JSON.parse(readRaw(APP_USERS_KEY) || '[]');
    if (Array.isArray(arr) && arr.length) return arr.filter((n) => typeof n === 'string' && n);
  } catch { /* 落到默认 */ }
  return ['默认用户'];
}

export function currentUser() {
  const name = readRaw(APP_CURRENT_KEY);
  const users = listUsers();
  return name && users.includes(name) ? name : users[0];
}

function saveUsers(users, current) {
  writeRaw(APP_USERS_KEY, JSON.stringify(users));
  writeRaw(APP_CURRENT_KEY, current);
}

/** 首次打开：无用户则建“默认用户”；旧版 dailyTaskData 键自动迁移（旧数据优先） */
function bootstrapUsers() {
  if (!readRaw(APP_USERS_KEY)) {
    saveUsers(['默认用户'], '默认用户');
  }
  const cur = currentUser();
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
 * @returns {{ok:boolean, reason?:string}}
 */
export function createUser(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return { ok: false, reason: '名字不能为空' };
  if (trimmed.length > 12) return { ok: false, reason: '名字最长 12 个字' };
  const users = listUsers();
  if (users.includes(trimmed)) return { ok: false, reason: '已经有同名用户了' };
  users.push(trimmed);
  saveUsers(users, trimmed);
  writeRaw(getUserKey(trimmed), JSON.stringify(defaultData()));
  memoryCache = null;
  return { ok: true };
}

/** 删除用户及其数据键；不允许删除最后一个用户 */
export function deleteUser(name) {
  const users = listUsers();
  if (!users.includes(name)) return { ok: false, reason: '用户不存在' };
  if (users.length <= 1) return { ok: false, reason: '至少要保留一个用户' };
  try { localStorage.removeItem(getUserKey(name)); } catch { /* 忽略 */ }
  const rest = users.filter((n) => n !== name);
  const next = currentUser() === name ? rest[0] : currentUser();
  saveUsers(rest, next);
  memoryCache = null;
  return { ok: true, switchedTo: next };
}

/** 切换用户：当前数据随时随 update 落盘，这里只需清缓存换键 */
export function switchUser(name) {
  const users = listUsers();
  if (!users.includes(name)) return { ok: false, reason: '用户不存在' };
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
  if (snapshotHistory(data)) save(data);
  return data;
}

export function save(data) {
  memoryCache = data;
  writeRaw(getUserKey(currentUser()), JSON.stringify(data));
  return data;
}

export function update(mutator) {
  const data = load();
  mutator(data);
  return save(data);
}

function normalize(raw) {
  if (!raw || typeof raw !== 'object') return defaultData();
  const grade = Number(raw.grade);
  const base = defaultData(Number.isInteger(grade) && grade >= 1 && grade <= 6 ? grade : 3);

  const data = {
    ...base,
    grade: base.grade,
    profile: { ...base.profile, ...(raw.profile || {}) },
    days: raw.days && typeof raw.days === 'object' ? raw.days : {},
    dailyHistory: raw.dailyHistory && typeof raw.dailyHistory === 'object' ? raw.dailyHistory : {},
    recentQuestions: raw.recentQuestions && typeof raw.recentQuestions === 'object' ? raw.recentQuestions : {},
    orders: Array.isArray(raw.orders) ? raw.orders : [],
    settings: { ...base.settings, ...(raw.settings || {}) }
  };
  if (!Array.isArray(data.profile.streakBonusDays)) data.profile.streakBonusDays = [];

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
    done.length * 5 +
    (day.allDoneBonus || 0) +
    (day.streakBonus || 0) +
    (day.chest?.rewardPoints || 0) +
    (day.olympicEarned || 0); // 奥数专区得分也计入当日
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
      : null
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
