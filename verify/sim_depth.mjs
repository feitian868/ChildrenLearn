/**
 * sim_depth.mjs —— 在 365 天模拟基础上，量化「认知重复」与 localStorage 体积风险
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

const tpl = new Map(), keys = new Map(), types = new Map(), topics = new Map();
let total = 0, daysWithTplRepeat = 0, maxSameTpl = 0, sumSameTpl = 0;
const volume = [];

for (let i = 1; i <= 365; i++) {
  const day = ensureToday();
  const qs = day.tasks.flatMap((t) => t.questions);
  const dayTpl = new Map();
  for (const q of qs) {
    total++;
    const p = String(q.prompt || '').replace(/\d+(\.\d+)?/g, '#');
    const t = `${q.type}|${p}`;
    tpl.set(t, (tpl.get(t) || 0) + 1);
    dayTpl.set(t, (dayTpl.get(t) || 0) + 1);
    if (q.key) keys.set(q.key, (keys.get(q.key) || 0) + 1);
    types.set(q.type, (types.get(q.type) || 0) + 1);
    if (q.topic) topics.set(q.topic, (topics.get(q.topic) || 0) + 1);
  }
  const peak = Math.max(...dayTpl.values());
  if (peak >= 2) daysWithTplRepeat++;
  maxSameTpl = Math.max(maxSameTpl, peak);
  sumSameTpl += peak;
  currentMs += 86400000;
  if (i % 30 === 0 || i === 365) {
    let chars = 0;
    for (const [k, v] of mem) chars += k.length + v.length;
    volume.push([i, chars]);
  }
}

console.log('=== 认知重复：问法/模板维度 ===');
console.log('全年题量:', total);
console.log('唯一「问法」（题干抹掉数字后）:', tpl.size, '种');
console.log('平均每种问法出现:', (total / tpl.size).toFixed(1), '次');
const sorted = [...tpl.entries()].sort((a, b) => b[1] - a[1]);
for (const n of [1, 3, 5, 10, 20]) {
  const c = sorted.slice(0, n).reduce((s, [, v]) => s + v, 0);
  console.log(`  Top ${String(n).padStart(2)} 种问法覆盖 ${(100 * c / total).toFixed(1)}% 的题目`);
}
console.log('同一天内出现同款问法 ≥2 次的天数:', daysWithTplRepeat, '/365');
console.log('单日同款问法峰值:', maxSameTpl, '次 | 日均峰值:', (sumSameTpl / 365).toFixed(1), '次');

console.log('\n=== 知识点覆盖 ===');
console.log('全年用到的不同 key:', keys.size, '个');
console.log('出现次数 Top 10:');
[...keys.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  .forEach(([k, n]) => console.log(`  ${String(n).padStart(4)} 次 | ${k}`));
console.log('题型分布:', Object.fromEntries([...types.entries()].sort((a, b) => b[1] - a[1])));
console.log('不同 topic 数:', topics.size);

console.log('\n=== localStorage 体积增长（字符数，含 key）===');
volume.forEach(([d, c]) => console.log(`  第 ${String(d).padStart(3)} 天: ${(c / 1024 / 1024).toFixed(2)} M 字符 ≈ ${(c * 2 / 1024 / 1024).toFixed(2)} MB(UTF-16) / ${(c / 1024 / 1024).toFixed(2)} MB(UTF-8)`));
console.log('  ※ 浏览器 localStorage 常见配额 5MB；store.js:101 写入失败仅 console.warn，会被静默吞掉');
