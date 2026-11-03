/**
 * sim_logic.mjs —— 逻辑 / 场景题接入效果专项验证
 * 关注：占比、按阶段是否枯竭、题型分布、模板多样性、答案一致性
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
const { logicPool } = await import('../assets/js/data/knowledge-logic.js');
const { mulberry32, hashString } = await import('../assets/js/core/rng.js');

function keyOf(i) {
  const d = new RealDate(START + (i - 1) * 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function sig(q) {
  if (q.type === 'choice') {
    const opts = (q.options || []).map(String).slice().sort().join(',');
    return `choice|${q.prompt}|${opts}|${String((q.options || [])[q.answer])}`;
  }
  if (q.type === 'match') return `match|${q.prompt}|${(q.pairs || []).map((p) => `${p.a}=${p.b}`).sort().join(',')}`;
  return `${q.type}|${q.prompt}|${String(q.answer)}`;
}

const stages = { '第1-30天': [0, 0], '第31-90天': [0, 0], '第91-180天': [0, 0], '第181-365天': [0, 0] };
const bySubject = {}, byTopic = {}, byType = {}, byTemplateId = {};
const seen = new Set();
let total = 0, logicTotal = 0, dup = 0, logicDup = 0;
const perDay = [];

for (let i = 1; i <= 365; i++) {
  const day = ensureToday();
  const qs = day.tasks.flatMap((t) => t.questions.map((q) => ({ q, s: t.subject })));
  let dayLogic = 0;
  for (const { q, s } of qs) {
    total++;
    const isLogic = q.category === 'logic';
    const sSig = sig(q);
    const isDup = seen.has(sSig);
    seen.add(sSig);
    if (isDup) { dup++; if (isLogic) logicDup++; }
    if (isLogic) {
      logicTotal++; dayLogic++;
      bySubject[s] = (bySubject[s] || 0) + 1;
      byTopic[q.topic] = (byTopic[q.topic] || 0) + 1;
      byType[q.type] = (byType[q.type] || 0) + 1;
      byTemplateId[q.templateId] = (byTemplateId[q.templateId] || 0) + 1;
    }
  }
  const st = i <= 30 ? '第1-30天' : i <= 90 ? '第31-90天' : i <= 180 ? '第91-180天' : '第181-365天';
  stages[st][0] += dayLogic; stages[st][1] += qs.length;
  perDay.push(dayLogic);
  currentMs += 86400000;
}

console.log('=== 逻辑 / 场景题接入效果（三年级 365 天）===');
console.log('全年题量:', total, '| 逻辑题:', logicTotal, `( ${(100 * logicTotal / total).toFixed(1)}% )`);
console.log('题面重复:', dup, `( ${(100 * dup / total).toFixed(2)}% )`, '| 其中逻辑题重复:', logicDup);
console.log('每日逻辑题数: 最少', Math.min(...perDay), '最多', Math.max(...perDay), '平均', (logicTotal / 365).toFixed(1));
console.log('\n按阶段占比（检查供给是否随时间枯竭）:');
for (const [k, [l, t]] of Object.entries(stages)) console.log(`  ${k}: ${l}/${t} = ${(100 * l / t).toFixed(1)}%`);
console.log('\n逻辑题按科目:', bySubject);
console.log('逻辑题 topic 数:', Object.keys(byTopic).length);
console.log('  Top 10:', Object.entries(byTopic).sort((a, b) => b[1] - a[1]).slice(0, 10));
console.log('逻辑题题型:', byType);
console.log('逻辑题不同 templateId:', Object.keys(byTemplateId).length);

// 生成器跨 365 天的唯一题面供给（只看逻辑池本身）
console.log('\n=== 逻辑题池跨 365 天唯一供给（三年级）===');
for (const sub of ['math', 'chinese', 'science', 'english']) {
  const sigs = new Set(); let n = 0;
  for (let i = 1; i <= 365; i++) {
    const rng = mulberry32(hashString(`${keyOf(i)}:3:${sub}:logic`));
    for (const q of logicPool(sub, 3, rng)) { sigs.add(sig(q)); n++; }
  }
  console.log(`  ${sub}: 累计 ${n} 题 | 唯一题面 ${sigs.size} | 复用 ${(n / Math.max(sigs.size, 1)).toFixed(2)}x`);
}

// 答案一致性抽查
console.log('\n=== 答案一致性抽查（每天每科首道逻辑题）===');
let checked = 0, wrong = 0;
for (const sub of ['math', 'chinese', 'science', 'english']) {
  for (let i = 1; i <= 60; i++) {
    const rng = mulberry32(hashString(`${keyOf(i)}:3:${sub}:logic`));
    for (const q of logicPool(sub, 3, rng)) {
      checked++;
      if (q.type === 'choice') {
        if (!q.options || q.options.length < 3 || q.options[q.answer] === undefined) wrong++;
        if (new Set(q.options).size !== q.options.length) wrong++;
      }
      if (q.type === 'judge' && typeof q.answer !== 'boolean') wrong++;
      if (!q.explain || !q.key || !q.templateId || !q.source) wrong++;
      break;
    }
  }
}
console.log(`  抽查 ${checked} 道，异常 ${wrong} 道`);
