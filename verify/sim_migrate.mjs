/**
 * sim_migrate.mjs —— C 收尾 P0-2：旧存档（每题 3 条 KV）迁移兼容实测
 *
 * 构造一份 100 多天的「旧 KV 格式」存档：
 *   recentQuestions: { 's:<32位十进制>': date, 'k:<知识点>': date }
 * 用新代码加载 → 自动迁移成 recentByDay/recentKeys
 * 比对：迁移前后去重条目数、签名集合、知识点冷却集合
 * 再各跑 30 天，比对题面重复率（条目不减 + 重复率不涨 = 没有变相清空 recentQuestions）
 *
 * 跑法：node verify/sim_migrate.mjs
 */
const RealDate = Date;
const BASE = new RealDate('2026-07-01T12:00:00+08:00').getTime();
let currentMs = BASE;
class FakeDate extends RealDate {
  constructor(...args) { if (args.length === 0) super(currentMs); else super(...args); }
  static now() { return currentMs; }
}
globalThis.Date = FakeDate;
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear()
};

const tasksApi = await import('../assets/js/core/tasks.js');
const store = await import('../assets/js/core/store.js');
const { completeTask } = await import('../assets/js/core/score.js');
const { mulberry32, hashString, sig24 } = await import('../assets/js/core/rng.js');

const DAY_MS = 86400000;

function sigOf(q) {
  if (q.type === 'choice') return sig24(`choice|${q.prompt}|${(q.options || []).map(String).slice().sort().join(',')}|${String(q.options[q.answer])}`);
  if (q.type === 'match') return sig24(`match|${q.prompt}|${(q.pairs || []).map((p) => `${p.a}=${p.b}`).sort().join(',')}`);
  return sig24(`${q.type}|${q.prompt}|${String(q.answer)}`);
}

function answerDay(day) {
  day.tasks.forEach((t) => {
    const results = t.questions.map((q, i) => mulberry32(hashString(`${day.date}:${t.id}:${i}:answer`))() < 0.8);
    const wrongReasons = results.map((ok, i) => (!ok ? { reason: ['careless', 'noknow', 'guess'][i % 3], qIdx: i } : null)).filter(Boolean);
    completeTask(t.id, { firstTryCorrect: results.filter(Boolean).length, total: t.questions.length, questionResults: results, wrongReasons });
  });
}

function statsOf(data) {
  let sigs = 0;
  const sigSet = new Set();
  Object.values(data.recentByDay || {}).forEach((arr) => (arr || []).forEach((s) => { sigs += 1; sigSet.add(s); }));
  return { sigs, distinct: sigSet.size, keys: Object.keys(data.recentKeys || {}).length, keySet: new Set(Object.keys(data.recentKeys || {})) };
}

function repeats30() {
  let total = 0;
  let rep = 0;
  for (let d = 0; d < 30; d += 1) {
    currentMs = BASE + (101 + d) * DAY_MS;
    const priors = new Set();
    Object.values(store.load().recentByDay || {}).forEach((arr) => (arr || []).forEach((s) => priors.add(s)));
    const day = tasksApi.ensureToday();
    day.tasks.flatMap((t) => t.questions).forEach((q) => { total += 1; if (priors.has(sigOf(q))) rep += 1; });
    answerDay(day);
  }
  return { total, rep };
}

/* ---------- 1. 用新代码真实跑 100 天，得到新格式存档 ---------- */
console.log('1) 用新代码跑 100 天（含答题），得到新格式存档…');
store.resetAll();
for (let d = 0; d < 100; d += 1) {
  currentMs = BASE + d * DAY_MS;
  const day = tasksApi.ensureToday();
  answerDay(day);
}
const newData = JSON.parse(JSON.stringify(store.load()));
const newStats = statsOf(newData);
console.log(`   新格式：recentByDay 条目 ${newStats.sigs} 条（去重后 ${newStats.distinct} 个签名）, recentKeys ${newStats.keys} 个`);

/* ---------- 2. 反向构造旧 KV 格式 ---------- */
const oldData = JSON.parse(JSON.stringify(newData));
const old = {};
Object.entries(newData.recentByDay || {}).forEach(([date, arr]) => {
  (arr || []).forEach((sig) => {
    const n = parseInt(sig, 36); // 24 位 Base36 → 十进制（低 24 位与迁移公式完全对齐）
    old[`s:${n}`] = date;
  });
});
Object.entries(newData.recentKeys || {}).forEach(([k, date]) => { old[`k:${k}`] = date; });
// 真实旧档里还会有纯 id 条目：迁移时丢弃（同内容必同签名，不损失去重语义）
old['id-math-addsub-10'] = newData.recentByDay[Object.keys(newData.recentByDay)[0]]?.[0] ? Object.keys(newData.recentByDay)[0] : '2026-07-01';
old['id-chinese-pinyin-1'] = '2026-07-05';
old['id-logic-1'] = '2026-07-09';
delete oldData.recentByDay;
delete oldData.recentKeys;
oldData.recentQuestions = old;

const oldSigEntries = Object.keys(old).filter((k) => k.startsWith('s:')).length;
const oldKeyEntries = Object.keys(old).filter((k) => k.startsWith('k:')).length;
const oldIdEntries = Object.keys(old).filter((k) => !k.startsWith('s:') && !k.startsWith('k:')).length;
console.log(`2) 旧格式存档：s: ${oldSigEntries} 条 / k: ${oldKeyEntries} 条 / 纯 id ${oldIdEntries} 条`);

/* ---------- 3. 两个用户：对照（新格式） vs 迁移（旧格式） ---------- */
store.createUser('对照新格式');
store.switchUser('对照新格式');
localStorage.setItem(store.getUserKey('对照新格式'), JSON.stringify(newData));
store.createUser('旧档迁移');
store.switchUser('旧档迁移');
localStorage.setItem(store.getUserKey('旧档迁移'), JSON.stringify(oldData));

// 对照：直接读新格式
const control = store.load();
const controlStats = statsOf(control);
console.log(`3) 对照（新格式直读）：sigs ${controlStats.sigs} 条（去重 ${controlStats.distinct}）、keys ${controlStats.keys}`);

// 迁移：换用户触发重新读取，走 normalize → migrateRecent
store.switchUser('对照新格式');
store.switchUser('旧档迁移');
const migrated = store.load(); // 首次读取即迁移
const migratedStats = statsOf(migrated);
console.log(`   迁移后（旧 KV → 新结构）：sigs ${migratedStats.sigs} 条（去重 ${migratedStats.distinct}）、keys ${migratedStats.keys}`);

/* ---------- 4. 比对 ---------- */
console.log('\n4) 比对（要求：条目不减、签名集合不丢、知识点不丢）');
const sameSigSet = [...controlStats.keySet].length === 0 || true;
let lostSigs = 0;
controlStats.keySet; // eslint 占位
const controlSigSet = new Set();
Object.values(control.recentByDay || {}).forEach((a) => (a || []).forEach((s) => controlSigSet.add(s)));
let missing = 0;
controlSigSet.forEach((s) => { if (![...Object.values(migrated.recentByDay || {}).flat()].includes(s)) missing += 1; });
let missingKeys = 0;
Object.keys(control.recentKeys || {}).forEach((k) => { if (!(k in (migrated.recentKeys || {}))) missingKeys += 1; });
console.log(`   s: 条目 ${oldSigEntries} → 去重签名 ${migratedStats.distinct}（对照 ${controlStats.distinct}），丢失 ${missing} 个签名`);
console.log(`   k: 条目 ${oldKeyEntries} → ${migratedStats.keys}（对照 ${controlStats.keys}），丢失 ${missingKeys} 个知识点`);
console.log(`   纯 id 条目 ${oldIdEntries} 条按设计丢弃（签名已覆盖其去重语义）`);
console.log(`   迁移后仍保留的签名率 ${(100 * (1 - missing / Math.max(1, controlStats.distinct))).toFixed(1)}%`);

/* ---------- 5. 迁移后跑 30 天，比对重复率 ---------- */
console.log('\n5) 从第 101 天起各跑 30 天，比对题面重复');
store.switchUser('对照新格式');
const repControl = repeats30();
store.switchUser('旧档迁移');
const repMigrated = repeats30();
console.log(`   对照（新格式）：出题 ${repControl.total} 道，重复 ${repControl.rep} 道（${(repControl.rep / repControl.total * 100).toFixed(2)}%）`);
console.log(`   迁移（旧档转换后）：出题 ${repMigrated.total} 道，重复 ${repMigrated.rep} 道（${(repMigrated.rep / repMigrated.total * 100).toFixed(2)}%）`);

const ok = missing === 0 && missingKeys === 0 && repMigrated.rep <= repControl.rep;
console.log(`\n${ok ? '✓ PASS' : '✗ FAIL'}：迁移未丢去重条目，重复率未上升（${repControl.rep} → ${repMigrated.rep}）`);
process.exitCode = ok ? 0 : 1;
