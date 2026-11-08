/**
 * p7_rebuild.mjs —— 摘要题重建一致性断言（逐日 90 天）
 *
 * 生成 90 天（approved 池，含规格题），记录每道题抽到时的题面签名；
 * 触发生产同款瘦身（近 7 天完整快照，更早只留摘要），再逐题按
 * 「日期种子 + specId」重建，比较 contentSig。
 * 要求：90 天逐题 0 不一致，否则家长核对页可能显示错题。
 */
const RealDate = Date;
const START = new RealDate('2026-11-06T12:00:00+08:00').getTime();
const DAY_MS = 86400000;
const DAYS = 90;
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

const tasksApi = await import('../assets/js/core/tasks.js');
const store = await import('../assets/js/core/store.js');
const { completeTask } = await import('../assets/js/core/score.js');
const mastery = await import('../assets/js/core/mastery.js');
const { mulberry32, hashString } = await import('../assets/js/core/rng.js');
const { ensureToday, contentSig, rebuildDayQuestion } = tasksApi;

const BATCHES = {
  'p2-math-batch-1': 'approved',
  'p3-chinese-batch-1': 'approved',
  'p4-english-batch-1': 'approved',
  'p5-science-batch-1': 'approved'
};

let failures = 0;
function assert(label, ok, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? `：${detail}` : ''}`);
  if (!ok) failures += 1;
}

function answerFor(date, taskId, q, qi) {
  const kid = mastery.knowledgeIdOf(q);
  const bias = /ma-u0[12]-k1/.test(kid) ? 0.45 : 0.82;
  return mulberry32(hashString(`${date}:${taskId}:${qi}:answer`))() < bias;
}

store.resetAll();
store.update((d) => { d.reviewBatches = { ...BATCHES }; });

const originals = {};
let totalQuestions = 0;
let specQuestions = 0;
for (let d = 0; d < DAYS; d += 1) {
  currentMs = START + d * DAY_MS;
  const day = ensureToday();
  // 先记录抽题时的题面签名（这就是当天展示给孩子的题）
  originals[day.date] = day.tasks.map((t) => t.questions.map((q) => {
    totalQuestions += 1;
    if (q.specId) specQuestions += 1;
    return { id: q.id, specId: q.specId || '', sig: contentSig(q) };
  }));
  day.tasks.forEach((t) => {
    const results = t.questions.map((q, qi) => answerFor(day.date, t.id, q, qi));
    completeTask(t.id, {
      firstTryCorrect: results.filter(Boolean).length,
      total: t.questions.length,
      questionResults: results,
      wrongReasons: results.map((ok, qi) => (!ok ? { reason: 'noknow', qIdx: qi } : null)).filter(Boolean)
    });
  });
}

const data = store.load();
const keys = Object.keys(data.days).sort();
assert('90 天 day 都在（未裁 data.days 条数）', keys.length === DAYS, `${keys.length} 天`);

// 生产状态：近 7 天完整快照
const recentKey = keys[keys.length - 1];
const recentQ = data.days[recentKey].tasks.flatMap((t) => t.questions)[0];
assert('近 7 天仍是完整快照', !!recentQ.prompt && !!recentQ.explain, `${recentKey}`);

// 为覆盖「逐日 90 天」，把近 7 天也在内存里投影成摘要，再逐题重建比对
keys.forEach((k) => store.slimDay(data.days[k]));

let rebuilt = 0;
let specRebuilt = 0;
let mismatch = 0;
const bad = [];
keys.forEach((k) => {
  const day = data.days[k];
  const org = originals[k] || [];
  day.tasks.forEach((task, ti) => {
    task.questions.forEach((stub, qi) => {
      const q = rebuildDayQuestion(day.date, task.subject, task.grade || day.grade, stub);
      rebuilt += 1;
      if (q && q.specId) specRebuilt += 1;
      const expect = org[ti]?.[qi];
      const sig = q ? contentSig(q) : '';
      const ok = !!q && !!expect && q.id === expect.id
        && (!stub.specId || q.specId === stub.specId)
        && sig === expect.sig;
      if (!ok) {
        mismatch += 1;
        if (bad.length < 6) bad.push(`${k} ${task.subject} ${stub.id} 期望=${expect?.sig} 实得=${sig}`);
      }
    });
  });
});

assert('逐日 90 天全部题目可重建', rebuilt === totalQuestions, `重建 ${rebuilt} / 原题 ${totalQuestions}`);
assert('approved 池确实含规格题', specQuestions > 0 && specRebuilt === specQuestions,
  `原 ${specQuestions} 道 / 重建 ${specRebuilt} 道`);
assert('重建题面签名与抽题时 0 不一致', mismatch === 0, `${DAYS} 天 / ${rebuilt} 道，不一致 ${mismatch}`);
if (bad.length) bad.forEach((x) => console.log(`  ✗ ${x}`));

console.log('\n=== 结论 ===');
console.log(`${DAYS} 天 / ${rebuilt} 道题逐题重建，题面签名不一致 ${mismatch} 处；规格题 ${specQuestions} 道全部命中 specId。`);
if (failures) {
  console.log('【红线失败】重建不一致比存储超标更严重：停下，不继续放行。');
} else {
  console.log('重建一致性红线通过。');
}
process.exitCode = failures ? 2 : 0;
