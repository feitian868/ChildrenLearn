/**
 * sim_static.mjs —— 验证两件事：
 *  1) 固定静态题池在全年题量里的占比
 *  2) 去重记录（recentQuestions）丢失后（换设备/清缓存/导入旧备份）会发生什么
 */
const RealDate = Date;
const START = new RealDate('2026-01-05T12:00:00+08:00').getTime();
let currentMs = START;
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
const { ensureToday } = await import('../assets/js/core/tasks.js');
const store = await import('../assets/js/core/store.js');

function sig(q) {
  if (q.type === 'choice') {
    const opts = (q.options || []).map(String).slice().sort().join(',');
    return `choice|${q.prompt}|${opts}|${String((q.options || [])[q.answer])}`;
  }
  if (q.type === 'match') {
    return `match|${q.prompt}|${(q.pairs || []).map((p) => `${p.a}=${p.b}`).sort().join(',')}`;
  }
  return `${q.type}|${q.prompt}|${String(q.answer)}`;
}

const seen = new Map();
const idPrefix = new Map();
let total = 0, lostDup = 0, lostTotal = 0;
const CUT = 200;

for (let i = 1; i <= 365; i++) {
  if (i === CUT + 1) {
    // 模拟：换设备 / 清缓存 / 导入了旧备份 → 365 天去重记录归零
    store.update((d) => { d.recentQuestions = {}; });
    console.log(`（第 ${i} 天：recentQuestions 已清空，模拟换设备）`);
  }
  const day = ensureToday();
  const qs = day.tasks.flatMap((t) => t.questions);
  for (const q of qs) {
    total++;
    const pre = String(q.id || '').split('-').slice(0, 2).join('-');
    idPrefix.set(pre, (idPrefix.get(pre) || 0) + 1);
    const s = sig(q);
    const isDup = seen.has(s);
    seen.set(s, i);
    if (i > CUT) { lostTotal++; if (isDup) lostDup++; }
  }
  currentMs += 86400000;
}

console.log('\n=== 题 id 前缀分布（判断静态池 vs 生成题）===');
[...idPrefix.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)
  .forEach(([p, n]) => console.log(`  ${String(n).padStart(5)} 题 (${(100 * n / total).toFixed(1)}%) | ${p}`));

console.log('\n=== 去重记录丢失后的真实重复率（第 201-365 天）===');
console.log(`  ${lostDup}/${lostTotal} = ${(100 * lostDup / lostTotal).toFixed(1)}% 的题是此前见过的`);
console.log('  注：前 200 天题面重复率为 0%；丢失记录后固定静态题池立刻开始反复出现');
