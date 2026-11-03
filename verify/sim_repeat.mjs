/**
 * sim_repeat.mjs —— 复现 primary-quest 连续 365 天的真实抽题重复率
 * 注入可控 Date + localStorage，直接调用项目真实的 tasks.js / store.js。
 * 运行：cd /data/workspace/_analysis && node sim_repeat.mjs
 */
const RealDate = Date;
const START = new RealDate('2026-01-05T12:00:00+08:00').getTime();
let currentMs = START;

class FakeDate extends RealDate {
  constructor(...args) {
    if (args.length === 0) super(currentMs);
    else super(...args);
  }
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
const { hashString, mulberry32 } = await import('../assets/js/core/rng.js');

/** 与 tasks.js:159-168 的 contentSig 等价 */
function contentSig(q) {
  if (q.type === 'choice') {
    const opts = (q.options || []).map(String).slice().sort().join(',');
    return `choice|${q.prompt}|${opts}|${String((q.options || [])[q.answer])}`;
  }
  if (q.type === 'match') {
    return `match|${q.prompt}|${(q.pairs || []).map((p) => `${p.a}=${p.b}`).sort().join(',')}`;
  }
  return `${q.type}|${q.prompt}|${String(q.answer)}`;
}

/** 认知级签名：抹掉数字，暴露「同一模板换个数」的重复 */
function templateSig(q) {
  return `${q.type}|${String(q.prompt || '').replace(/\d+(\.\d+)?/g, '#')}`;
}

function keyOf(i) {
  const d = new RealDate(START + (i - 1) * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const seen = new Map();
const tplCount = new Map();
const tplExample = new Map();
const perSubject = {};
const stage = { '第1-30天': [0, 0], '第31-90天': [0, 0], '第91-365天': [0, 0] };
let firstDupDay = null, totalQ = 0, totalDup = 0;

for (let i = 1; i <= 365; i++) {
  const day = ensureToday();
  const qs = day.tasks.flatMap((t) => t.questions.map((q) => ({ q, s: t.subject })));
  let dup = 0;
  for (const { q, s } of qs) {
    const sig = contentSig(q);
    const isDup = seen.has(sig);
    if (isDup) { dup++; totalDup++; } else seen.set(sig, i);

    const tp = templateSig(q);
    tplCount.set(tp, (tplCount.get(tp) || 0) + 1);
    if (!tplExample.has(tp)) tplExample.set(tp, String(q.prompt || '').slice(0, 46));

    if (!perSubject[s]) perSubject[s] = { total: 0, dup: 0 };
    perSubject[s].total++;
    if (isDup) perSubject[s].dup++;
  }
  totalQ += qs.length;
  const st = i <= 30 ? '第1-30天' : i <= 90 ? '第31-90天' : '第91-365天';
  stage[st][0] += qs.length;
  stage[st][1] += dup;
  if (dup > 0 && firstDupDay === null) firstDupDay = i;
  currentMs += 86400000;
}

console.log('=== 365 天真实抽题模拟（三年级，2026-01-05 周一起）===');
console.log('总题量:', totalQ, '| 日均:', (totalQ / 365).toFixed(1), '题');
console.log('重复题量:', totalDup, '| 全年重复率:', (100 * totalDup / totalQ).toFixed(1) + '%');
console.log('唯一题面数:', seen.size);
console.log('首次出现重复: 第', firstDupDay, '天', firstDupDay ? `(${keyOf(firstDupDay)})` : '');
for (const [k, [t, d]] of Object.entries(stage)) {
  console.log(`  ${k}: ${d}/${t} = ${(100 * d / t).toFixed(1)}%`);
}
console.log('按科目:');
for (const [s, v] of Object.entries(perSubject)) {
  console.log(`  ${s}: ${v.dup}/${v.total} = ${(100 * v.dup / v.total).toFixed(1)}%`);
}
console.log('高频模板 top 8（数字掩码后，体现「换个数字又来了」）:');
[...tplCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  .forEach(([tp, n]) => console.log(`  ${String(n).padStart(4)} 次 | ${tplExample.get(tp)}`));

/* ---------- 生成器跨 365 天的多样性 ---------- */
console.log('\n=== 生成器跨 365 天多样性（三年级，每天不同日期种子）===');
const { chineseGenerated } = await import('../assets/js/data/knowledge-chinese.js');
const { englishGenerated } = await import('../assets/js/data/knowledge-english.js');
const { scienceGenerated } = await import('../assets/js/data/knowledge-science.js');
const { mathPool } = await import('../assets/js/data/knowledge-math.js');
const gens = [
  ['语文', 'chinese', chineseGenerated],
  ['英语', 'english', englishGenerated],
  ['科学', 'science', scienceGenerated],
  ['数学', 'math', mathPool]
];
for (const [name, sub, fn] of gens) {
  const sigs = new Set(), ids = new Set();
  let n = 0;
  for (let i = 1; i <= 365; i++) {
    const rng = mulberry32(hashString(`${keyOf(i)}:3:${sub}`));
    const arr = fn(3, rng) || [];
    for (const q of arr) { sigs.add(contentSig(q)); ids.add(q.id); n++; }
  }
  console.log(`  ${name}: 累计 ${n} 题 | 唯一内容签名 ${sigs.size} | 唯一 id ${ids.size} | 签名复用 ${(n / Math.max(sigs.size, 1)).toFixed(1)}x`);
}

console.log('\n=== 需求 vs 供给 ===');
console.log('单科全年需求 ≈', Math.round(totalQ / 4), '题');
console.log('单科单年级候选池 ≈ 46~79 题（静态 + 单日生成）');
console.log('容量缺口 ≈', (Math.round(totalQ / 4) / 62).toFixed(0), '倍');
