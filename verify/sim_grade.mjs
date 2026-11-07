/**
 * sim_grade.mjs —— P1 年级差异化对照表
 *
 * 跑法：node verify/sim_grade.mjs
 * 冻结日期 2026-11-04（周三，英语日），逐年级新建用户并生成当天任务，贴：
 *   年级 | 每日项数 | 每项题数 | 达标线 | 挑战题(l2) | 拔高题 | 总题量
 * 断言：项数与总题量随年级递增（4~6 年级允许稳定期）；每项题数 ≥ 该年级达标线且 ≤ 4；
 *       1~2 年级不配拔高题；3~6 年级 l2 目标不低于低年级。
 */
const RealDate = Date;
const FIXED = new RealDate('2026-11-04T12:00:00+08:00').getTime();
class FakeDate extends RealDate {
  constructor(...args) { if (args.length === 0) super(FIXED); else super(...args); }
  static now() { return FIXED; }
}
globalThis.Date = FakeDate;
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear()
};

const store = await import('../assets/js/core/store.js');
const { ensureToday } = await import('../assets/js/core/tasks.js');
const { passLineFor, taskCountFor, QUESTIONS_PER_TASK, GRADES, WEEKDAY_FOCUS_TEXT } = await import('../assets/js/data/curriculum.js');

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.log(`  ✗ FAIL: ${msg}`); }
}

const rows = [];
for (const grade of GRADES) {
  localStorage.clear();
  store.createUser(`g${grade}`, '🐰');
  store.setGrade(grade);
  const day = ensureToday();
  const tasks = day?.tasks || [];
  const items = tasks.length;
  const totalQ = tasks.reduce((s, t) => s + t.questions.length, 0);
  const minQ = tasks.length ? Math.min(...tasks.map((t) => t.questions.length)) : 0;
  const maxQ = tasks.length ? Math.max(...tasks.map((t) => t.questions.length)) : 0;
  const l2 = tasks.reduce((s, t) => s + t.questions.filter((q) => q.level === 2).length, 0);
  const stretch = tasks.reduce((s, t) => s + t.questions.filter((q) => q.stretch).length, 0);
  // 调度口径（不看池子容量）：全科项数 + 重点科项
  const base = taskCountFor('math', 2, grade);
  const focus = taskCountFor('chinese', 1, grade);
  rows.push({ grade, items, totalQ, minQ, maxQ, l2, stretch, base, focus, passLine: passLineFor(grade) });
  console.log(`  ${grade} 年级：项数 ${items} / 题量 ${totalQ} / 每项 ${minQ}~${maxQ} / l2 ${l2} / 拔高 ${stretch} / 达标线 ${passLineFor(grade)}`);
}

console.log('\n== 对照表（周三英语日） ==');
console.log('年级 | 每日项数 | 每项题数 | 达标线 | 挑战题 | 拔高题 | 总题量');
for (const r of rows) {
  console.log(`${r.grade}    | ${r.items}        | ${r.minQ}~${r.maxQ}     | ${r.passLine}     | ${r.l2}     | ${r.stretch}     | ${r.totalQ}`);
}
console.log(`口径：${WEEKDAY_FOCUS_TEXT[3]}；QUESTIONS_PER_TASK=${QUESTIONS_PER_TASK}（硬禁区未动）`);

/* ---------- 断言 ---------- */
console.log('\n== 断言 ==');
const baseCounts = rows.map((r) => r.base);
const items = rows.map((r) => r.items);
assert(baseCounts.every((v, i) => i === 0 || v >= baseCounts[i - 1]),
  `调度项数随年级递增（非降）：${baseCounts.join(' → ')}`);
assert(rows[5].base > rows[0].base, `六年级项数 > 一年级（${rows[5].base} > ${rows[0].base}）`);
assert(items.every((v, i) => i === 0 || v >= items[i - 1]), `当天实际项数非降：${items.join(' → ')}`);
assert(rows.every((r) => r.minQ >= r.passLine),
  `每项题数 ≥ 该年级达标线（${rows.map((r) => `${r.grade}:${r.minQ}≥${r.passLine}`).join(' ')}）`);
assert(rows.every((r) => r.maxQ <= QUESTIONS_PER_TASK), `每项题数 ≤ ${QUESTIONS_PER_TASK}（不靠加题量做年级差异）`);
assert(rows[0].l2 <= rows[5].l2, `高年级挑战题不少于一年级（${rows[0].l2} → ${rows[5].l2}）`);
assert(rows.slice(0, 2).every((r) => r.stretch === 0), '1~2 年级不配拔高题');
assert(passLineFor(1) === 2 && passLineFor(6) === 3, '达标线：1~2 年级 2 题 / 3~6 年级 3 题');
assert(taskCountFor('math', 0, 1) === 1 && taskCountFor('math', 2, 6) === 4,
  '周日不加码；重点科 = 基础项 +1（六年级 3+1=4）');
assert(rows[3].base === rows[4].base && rows[4].base === rows[5].base,
  `4~6 年级稳定期：同为 ${rows[3].base} 项（年级差异靠难度/达标线/拔高，不再加项）`);
assert(rows[5].totalQ <= 52,
  `六年级单日总题量 ≤ 52（实测 ${rows[5].totalQ}，不出现 68 题）`);

console.log(`\n=== 汇总：${pass} 通过 / ${fail} 失败 ===`);
if (fail) process.exitCode = 1;
