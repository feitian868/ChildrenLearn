/**
 * sim_storage.mjs —— 阶段 B 终检 P0-1：365 天「每天完整答题」的存储测量
 *
 * 与四脚本的区别：四脚本只调 ensureToday()（只生成任务、不答题），
 * 因此 mastery / reviewQueue / quizzes / masteryTrend / contentGaps 全是空壳。
 * 本脚本每天走真实链路：
 *   ensureToday() → 逐项 completeTask()（内部调用 score.js → applyTaskOutcome）
 *   → 每周一 buildWeeklyQuiz() + saveQuizResult()
 * 然后按 30 / 90 / 180 / 365 天打印真实 localStorage 字符数与 UTF-16 MB。
 *
 * 另起一个 30 天「当前单元 = ma-u01」的收敛场景，制造内容缺口并记录其体积。
 * B′ 后门槛收紧为：任一节点 > 3.6MB(UTF-16) 时退出码 2。
 */
const RealDate = Date;
const START = new RealDate('2026-11-06T12:00:00+08:00').getTime();
const DAY_MS = 86400000;
const DAYS = 365;
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

const { ensureToday } = tasksApi;
const userKey = () => store.getUserKey(store.currentUser());
const rawChars = () => (localStorage.getItem(userKey()) || '').length;
const mb16 = (chars) => (chars * 2) / 1048576;
const sizeOf = (v) => JSON.stringify(v ?? null).length;
const fmt = (n) => `${n} 字符 / ${mb16(n).toFixed(3)} MB(UTF-16)`;

let failures = 0;
function assert(label, ok, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? `：${detail}` : ''}`);
  if (!ok) failures += 1;
}

/** 确定性作答：低掌握知识点 45% 正确，其余 82% 正确（制造错题与复习队列） */
function answerFor(date, taskId, q, qi) {
  const kid = mastery.knowledgeIdOf(q);
  const bias = /ma-u0[12]-k1/.test(kid) ? 0.45 : 0.82;
  return mulberry32(hashString(`${date}:${taskId}:${qi}:answer`))() < bias;
}

function completeDay(day) {
  const tasks = day.tasks;
  tasks.forEach((t) => {
    const results = t.questions.map((q, qi) => answerFor(day.date, t.id, q, qi));
    const wrongReasons = results
      .map((ok, qi) => (!ok ? { reason: ['careless', 'noknow', 'guess'][qi % 3], qIdx: qi } : null))
      .filter(Boolean);
    completeTask(t.id, {
      firstTryCorrect: results.filter(Boolean).length,
      total: t.questions.length,
      questionResults: results,
      wrongReasons
    });
  });
  // 每周一小测：10 题、结果单独存（真实链路是 math.html?quiz=1 → saveQuizResult）
  if (store.weekdayOf(day.date) === 1) {
    const quiz = mastery.buildWeeklyQuiz(store.load(), store.load().grade, day.date);
    if (quiz.items.length) {
      const items = quiz.items.map((q, i) => ({
        kid: q.kid,
        kind: q.quizKind,
        ok: i < 7
      }));
      store.update((d) => {
        mastery.saveQuizResult(d, {
          weekKey: quiz.weekKey,
          date: day.date,
          total: quiz.items.length,
          correct: 7,
          items
        });
      });
    }
  }
}

function snapshot(label, dayIndex) {
  const data = store.load();
  const chars = rawChars();
  const parts = {
    recentByDay: sizeOf(data.recentByDay),
    recentKeys: sizeOf(data.recentKeys),
    reviewOrig: sizeOf(data.reviewOrig),
    days: sizeOf(data.days),
    dailyHistory: sizeOf(data.dailyHistory),
    mastery: sizeOf(data.mastery),
    masteryTrend: sizeOf(data.masteryTrend),
    reviewQueue: sizeOf(data.reviewQueue),
    quizzes: sizeOf(data.quizzes),
    contentGaps: sizeOf(data.contentGaps)
  };
  const queue = Object.values(data.reviewQueue || {}).reduce((s, a) => s + (Array.isArray(a) ? a.length : 0), 0);
  console.log(`\n--- ${label}（第 ${dayIndex} 天）---`);
  console.log(`localStorage: ${fmt(chars)}`);
  console.log(`  字段字符：recentByDay ${parts.recentByDay} · recentKeys ${parts.recentKeys} · reviewOrig ${parts.reviewOrig} · days ${parts.days} · dailyHistory ${parts.dailyHistory}`);
  console.log(`            mastery ${parts.mastery} · trend ${parts.masteryTrend} · reviewQueue ${parts.reviewQueue} · quizzes ${parts.quizzes} · gaps ${parts.contentGaps}`);
  console.log(`  掌握度知识点 ${Object.keys(data.mastery?.keys || {}).length} 个 · 复习条目 ${queue} 条 · 小测 ${Object.keys(data.quizzes || {}).length} 周 · 缺口 ${Object.keys(data.contentGaps || {}).length} 条`);
  console.log(`  data.days=${Object.keys(data.days || {}).length} · dailyHistory=${Object.keys(data.dailyHistory || {}).length}`);
  return { chars, parts, keys: Object.keys(data.mastery?.keys || {}).length, queue };
}

console.log('=== 场景 A：365 天每天完整答题（四科全做，未启用课程收敛）===');
const nodes = [];
for (let d = 0; d < DAYS; d += 1) {
  currentMs = START + d * DAY_MS;
  const day = ensureToday();
  completeDay(day);
  const n = d + 1;
  if (n === 30 || n === 90 || n === 180 || n === 365) {
    nodes.push({ n, date: store.todayKey(), ...snapshot(`${n} 天完整答题`, n) });
  }
}
const worst = nodes.reduce((a, b) => (b.chars > a.chars ? b : a), nodes[0]);
console.log(`\n最大节点：第 ${worst.n} 天 ${fmt(worst.chars)}`);
assert('365 天完整答题存储 ≤ 3.6MB(UTF-16)', nodes.every((x) => mb16(x.chars) <= 3.6),
  `最大 ${mb16(worst.chars).toFixed(3)} MB（门槛 3.6 MB）`);
assert('data.days ≤ 90', Object.keys(store.load().days).length <= 90, `${Object.keys(store.load().days).length}`);

/* 场景 B：当前单元 = ma-u01 收敛 30 天，制造「无变式」内容缺口 */
console.log('\n=== 场景 B：当前单元 ma-u01 收敛 30 天（记录内容缺口体积）===');
store.resetAll();
store.update((d) => {
  d.settings.course.version = '人教版';
  d.settings.course.grade = 3;
  d.settings.course.term = '上册';
  d.settings.course.currentUnitId = 'ma-u01';
  d.settings.course.learnedUnits = [];
});
const gapStart = currentMs;
for (let d = 0; d < 30; d += 1) {
  currentMs = gapStart + d * DAY_MS;
  completeDay(ensureToday());
}
const gapData = store.load();
const gapChars = rawChars();
const gaps = mastery.contentGapSummary(gapData);
console.log(`localStorage: ${fmt(gapChars)}`);
console.log(`内容缺口 ${gaps.length} 条${gaps.length ? `：${gaps.map((g) => `${g.name}×${g.count}（${g.reason}）`).join('、')}` : ''}`);
console.log(`掌握度知识点 ${Object.keys(gapData.mastery.keys).length} 个 · 复习条目 ${Object.values(gapData.reviewQueue).reduce((s, a) => s + a.length, 0)} 条`);

console.log('\n=== 结论 ===');
console.log(`365 天完整答题最大 ${mb16(worst.chars).toFixed(3)} MB(UTF-16)，门槛 3.6 MB（B′ 已实施：recentByDay 签名数组 + 24 位 Base36 + trend 45 天）`);
if (failures) {
  console.log('\n【超限】B′ 紧凑化后仍超 3.6MB：按约定停下贴实测，不自行削 DAYS_KEEP / mastery.keys / reviewQueue / quizzes。');
} else {
  console.log('存储达标（≤3.6MB），可以继续阶段 C。');
}
process.exitCode = failures ? 2 : 0;
