/**
 * p7_storage.mjs —— 摘要瘦身后 365 天「完整答题」存储实测
 *
 * 两场景同一脚本、同一链路：
 *   P（pending 基线）：reviewBatches = {}，规格题不进池
 *   A（approved 放行）：reviewBatches = 四批 approved，规格题整批进池
 *
 * ★ 真实链路：ensureToday → 逐项 completeTask（score.js → applyTaskOutcome）
 *   每周一 buildWeeklyQuiz + saveQuizResult；不用未答题空壳路径。
 * ★ days 写时瘦身：近 7 天保留完整题面快照，更早只留
 *   { id, kid, specId, firstTry, wrongReason, attempts, result }。
 * 门槛：approved 态 365 天 ≤3.6MB(UTF-16)，90 天节点也 ≤3.6MB；data.days ≤90。
 */
const RealDate = Date;
const START = new RealDate('2026-11-06T12:00:00+08:00').getTime();
const DAY_MS = 86400000;
const DAYS = 365;
const LIMIT_MB = 3.6;
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

const BATCHES = {
  'p2-math-batch-1': 'approved',
  'p3-chinese-batch-1': 'approved',
  'p4-english-batch-1': 'approved',
  'p5-science-batch-1': 'approved'
};
const userKey = () => store.getUserKey(store.currentUser());
const rawChars = () => (localStorage.getItem(userKey()) || '').length;
const mb16 = (chars) => (chars * 2) / 1048576;
const fmt = (n) => `${n} 字符 / ${mb16(n).toFixed(3)} MB(UTF-16)`;

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

function completeDay(day) {
  day.tasks.forEach((t) => {
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
  if (store.weekdayOf(day.date) === 1) {
    const data = store.load();
    const quiz = mastery.buildWeeklyQuiz(data, data.grade, day.date);
    if (quiz.items.length) {
      const items = quiz.items.map((q, i) => ({ kid: q.kid, kind: q.quizKind, ok: i < 7 }));
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
  const dayKeys = Object.keys(data.days || {}).sort();
  const queueEntries = Object.values(data.reviewQueue || {}).flat();
  const queueDays = Object.keys(data.reviewQueue || {}).length;
  // 快照当场取摘要形状：后续天数会继续改 data（trimDays 会删旧 day），不能只留引用
  const oldDay = data.days[dayKeys[0]] || {};
  const recentDay = data.days[dayKeys[dayKeys.length - 1]] || {};
  const oldQ = (oldDay.tasks || []).flatMap((t) => t.questions || [])[0] || {};
  const recentQ = (recentDay.tasks || []).flatMap((t) => t.questions || [])[0] || {};
  const checks = {
    oldKey: dayKeys[0],
    recentKey: dayKeys[dayKeys.length - 1],
    oldKeys: Object.keys(oldQ),
    oldHasPrompt: !!oldQ.prompt,
    oldHasOptions: !!oldQ.options,
    oldHasAnswer: !!oldQ.answer,
    oldHasExplain: !!oldQ.explain,
    recentHasPrompt: !!recentQ.prompt,
    recentHasExplain: !!recentQ.explain,
    masteryKeys: Object.keys(data.mastery?.keys || {}).length,
    trendDays: Object.keys(data.masteryTrend || {}).length
  };
  console.log(`\n--- ${label}（第 ${dayIndex} 天）---`);
  console.log(`localStorage: ${fmt(chars)}`);
  console.log(`  data.days=${dayKeys.length} · 复习队列 ${queueEntries.length} 条 / ${queueDays} 个日期 · 掌握度 ${checks.masteryKeys} · masteryTrend ${checks.trendDays} 天`);
  console.log(`  reviewBatches=${JSON.stringify(data.reviewBatches)} · 逐题 questionReview=${Object.keys(data.questionReview || {}).length}`);
  return { chars, days: dayKeys.length, checks, queueEntries };
}

function checkSlimmed(node) {
  const c = node.checks;
  const expected = ['attempts', 'firstTry', 'id', 'kid', 'result', 'specId', 'wrongReason'];
  assert('旧 day 题面/选项/答案/解析不落盘', !c.oldHasPrompt && !c.oldHasOptions && !c.oldHasAnswer && !c.oldHasExplain,
    `${c.oldKey} keys=${c.oldKeys.join(',')}`);
  assert('旧 day 摘要字段恰为 7 列', c.oldKeys.slice().sort().join(',') === expected.join(','),
    c.oldKeys.slice().sort().join(','));
  assert('近 7 天保留完整快照（家长核对可看答案/解析）', c.recentHasPrompt && c.recentHasExplain,
    `${c.recentKey} prompt=${c.recentHasPrompt}`);
  assert('mastery.keys 未被裁', c.masteryKeys > 0, `${c.masteryKeys} 个`);
  assert('masteryTrend 45 天窗口生效', c.trendDays <= 45, `${c.trendDays} 天`);
  const bad = node.queueEntries.filter((e) => {
    const p = String(e).split('~');
    return p.length !== 6 || !/^[0-9a-z]{5}$/.test(p[2]) || !/^[0-9a-z]{5}$/.test(p[3]);
  });
  assert('reviewQueue 按日期分组 + 6 字段 + 5 位 Base36 签名', bad.length === 0,
    `${node.queueEntries.length} 条，异常 ${bad.length}`);
}

function runScenario(label, batches) {
  console.log(`\n=== 场景 ${label}：365 天每天完整答题（四科全做）===`);
  store.resetAll();
  store.update((d) => { d.reviewBatches = { ...batches }; });
  const nodes = [];
  let specQuestions = 0;
  for (let d = 0; d < DAYS; d += 1) {
    currentMs = START + d * DAY_MS;
    const day = ensureToday();
    completeDay(day);
    day.tasks.forEach((t) => t.questions.forEach((q) => { if (q.specId) specQuestions += 1; }));
    const n = d + 1;
    if (n === 30 || n === 90 || n === 180 || n === 365) {
      nodes.push({ n, ...snapshot(`${label} · ${n} 天完整答题`, n) });
    }
  }
  const worst = nodes.reduce((a, b) => (b.chars > a.chars ? b : a), nodes[0]);
  console.log(`\n场景 ${label} 最大节点：第 ${worst.n} 天 ${fmt(worst.chars)}；全年抽到规格题 ${specQuestions} 道`);
  return { nodes, worst, specQuestions };
}

const pending = runScenario('P（pending 基线）', {});
assert('P 规格题不进池', pending.specQuestions === 0, `${pending.specQuestions} 道`);
assert('P 365 天存储 ≤3.6MB', pending.nodes.every((x) => mb16(x.chars) <= LIMIT_MB), `最大 ${mb16(pending.worst.chars).toFixed(3)} MB`);
checkSlimmed(pending.nodes.find((x) => x.n === 90));

const approved = runScenario('A（approved 放行）', BATCHES);
assert('A 规格题整批进池', approved.specQuestions > 0, `${approved.specQuestions} 道`);
const node90 = approved.nodes.find((x) => x.n === 90);
const node365 = approved.nodes.find((x) => x.n === 365);
assert('A 90 天节点存储 ≤3.6MB', mb16(node90.chars) <= LIMIT_MB, fmt(node90.chars));
assert('A 365 天存储 ≤3.6MB', mb16(node365.chars) <= LIMIT_MB, fmt(node365.chars));
assert('A 365 天 data.days ≤90', node365.days <= 90, `${node365.days}`);
checkSlimmed(node90);

console.log('\n=== 结论 ===');
console.log(`pending 最大 ${mb16(pending.worst.chars).toFixed(3)} MB；approved 90 天 ${mb16(node90.chars).toFixed(3)} MB；approved 365 天 ${mb16(node365.chars).toFixed(3)} MB（门槛 3.6 MB）`);
if (failures) {
  console.log('\n【红线失败】停下：回滚到 7cb3740 + 清 reviewBatches，不硬凑、不改常数。');
} else {
  console.log('存储红线通过。');
}
process.exitCode = failures ? 2 : 0;
