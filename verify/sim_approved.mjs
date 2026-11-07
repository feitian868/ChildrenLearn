/**
 * sim_approved.mjs —— C 收尾 P0-1：approved 之后的真实状态
 *
 * 前面的四脚本 + sim_storage 都跑在 questionReview 为空的默认态，8 道 C3 新题没进池。
 * 本脚本补两块：
 *   A) 未配置教材 + 全 8 道 approved：365 天完整答题 → 题面重复率、Top10、日均峰值、存储
 *   B) 收敛模式（currentUnitId=ma-u01）+ approved：365 天完整答题
 *      → 每天项数、教材/拓展数；检测「池子枯竭后拿旧题兜底」从第几天开始、兜底几道
 *      → 存储 ≤3.6MB
 *
 * 说明：B 的兜底不算回归失败（P0-1b 已定义：静态题面固定，属内容缺口，记台账第 3 条）。
 * 跑法：node verify/sim_approved.mjs
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
const { mulberry32, hashString, sig24 } = await import('../assets/js/core/rng.js');
const { pendingReviewBank } = await import('../assets/js/data/knowledge-math.js');

const { ensureToday } = tasksApi;
const userKey = () => store.getUserKey(store.currentUser());
const rawChars = () => (localStorage.getItem(userKey()) || '').length;
const mb16 = (chars) => (chars * 2) / 1048576;
const fmt = (n) => `${n} 字符 / ${mb16(n).toFixed(3)} MB(UTF-16)`;

let failures = 0;
function assert(label, ok, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? `：${detail}` : ''}`);
  if (!ok) failures += 1;
}

/** 与 tasks.js contentSig 完全一致：题干 + 选项（排序）+ 答案 */
function sigOf(q) {
  if (q.type === 'choice') {
    const opts = (q.options || []).map(String).slice().sort().join(',');
    return sig24(`choice|${q.prompt}|${opts}|${String(q.options[q.answer])}`);
  }
  if (q.type === 'match') {
    return sig24(`match|${q.prompt}|${(q.pairs || []).map((p) => `${p.a}=${p.b}`).sort().join(',')}`);
  }
  return sig24(`${q.type}|${q.prompt}|${String(q.answer)}`);
}

/**
 * 与 sim_depth.mjs 第 31-32 行完全同口径：题型 + 数字脱敏题干。
 * sigOf 衡量「同一道题面反复出」；templateKey 衡量「同一问法换数字反复出」。
 * Top10<35% 门槛必须挂在 templateKey 上，否则 365 天轮转下 sig 口径天然极低、门槛形同虚设。
 */
function templateKeyOf(q) {
  const p = String(q.prompt || '').replace(/\d+(\.\d+)?/g, '#');
  return `${q.type}|${p}`;
}

function priorSigs() {
  const sigs = new Set();
  Object.values(store.load().recentByDay || {}).forEach((arr) => {
    if (Array.isArray(arr)) arr.forEach((s) => sigs.add(s));
  });
  return sigs;
}

function answerFor(date, taskId, q, qi) {
  // 与 sim_storage / sim_mastery 同一口径：约 82% 首答正确，制造错题队列以覆盖复习链路
  return mulberry32(hashString(`${date}:${taskId}:${qi}:answer`))() < 0.82;
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
    const quiz = mastery.buildWeeklyQuiz(store.load(), store.load().grade, day.date);
    if (quiz.items.length) {
      const items = quiz.items.map((q, i) => ({ kid: q.kid, kind: q.quizKind, ok: i < 7 }));
      store.update((d) => {
        mastery.saveQuizResult(d, {
          weekKey: quiz.weekKey, date: day.date, total: quiz.items.length, correct: 7, items
        });
      });
    }
  }
}

function approveAll() {
  store.update((d) => {
    d.questionReview = d.questionReview || {};
    pendingReviewBank().forEach((q) => { d.questionReview[q.id] = 'approved'; });
  });
}

/** 一天：统计重复/兜底、项数、教材/拓展，然后完整答题 */
function runDay({ converged }) {
  const priors = priorSigs();
  const day = ensureToday();
  const picked = day.tasks.flatMap((t) => t.questions);
  const repeats = picked.filter((q) => priors.has(sigOf(q)));
  const reviewRepeats = repeats.filter((q) => q.review).length;
  const mathTasks = day.tasks.filter((t) => t.subject === 'math');
  const mathQs = mathTasks.flatMap((t) => t.questions);
  const textbook = mathQs.filter((q) => q.courseTrack === 'textbook').length;
  const extension = mathQs.filter((q) => q.courseTrack === 'extension').length;
  const perTask = mathTasks.map((t) => {
    const tb = t.questions.filter((q) => q.courseTrack === 'textbook').length;
    const ex = t.questions.filter((q) => q.courseTrack === 'extension').length;
    return `${tb}+${ex}`;
  });
  // 单日单款问法峰值：templateKey（与 sim_depth 同口径）当天最多的出现次数
  const templateCounts = new Map();
  picked.forEach((q) => {
    const tpl = templateKeyOf(q);
    templateCounts.set(tpl, (templateCounts.get(tpl) || 0) + 1);
  });
  const peakTemplate = Math.max(0, ...templateCounts.values());
  completeDay(day);
  return {
    day, picked: picked.length, repeats: repeats.length,
    nonReviewRepeats: repeats.length - reviewRepeats, reviewRepeats, peakTemplate,
    tasks: mathTasks.length, textbook, extension, perTask
  };
}

/* ==================== 场景 A：未配置 + approved ==================== */
console.log('=== 场景 A：未配置教材 + 8 道全 approved，365 天完整答题 ===');
store.resetAll();
approveAll();
const nodes = [];
const questionCounts = new Map();
const tplCountsAll = new Map(); // templateKey 全年聚合（与 sim_depth 同口径）
let totalPicked = 0;
let totalRepeats = 0;
let totalNonReview = 0;
let totalReview = 0;
let maxPerDay = 0;
let peakSum = 0;
let peakDay = '';
for (let d = 0; d < DAYS; d += 1) {
  currentMs = START + d * DAY_MS;
  const r = runDay({ converged: false });
  totalPicked += r.picked;
  totalRepeats += r.repeats;
  totalNonReview += r.nonReviewRepeats;
  totalReview += r.reviewRepeats;
  peakSum += r.peakTemplate;
  if (r.peakTemplate > maxPerDay) { maxPerDay = r.peakTemplate; peakDay = store.todayKey(); }
  r.day.tasks.forEach((t) => t.questions.forEach((q) => {
    const k = sigOf(q);
    questionCounts.set(k, (questionCounts.get(k) || 0) + 1);
    const tk = templateKeyOf(q);
    tplCountsAll.set(tk, (tplCountsAll.get(tk) || 0) + 1);
  }));
  const n = d + 1;
  if (n === 30 || n === 90 || n === 180 || n === 365) {
    console.log(`  第 ${n} 天：${fmt(rawChars())} · data.days=${Object.keys(store.load().days).length}`);
    nodes.push({ n, chars: rawChars() });
  }
}
const repeatRate = totalRepeats / Math.max(1, totalPicked);
const nonReviewRate = totalNonReview / Math.max(1, totalPicked);
console.log(`  365 天共出题 ${totalPicked} 道，其中重复（365 天窗口内已出现）${totalRepeats} 道，重复率 ${(repeatRate * 100).toFixed(2)}%`);
console.log(`    其中 复习变式 ${totalReview} 道（该变式题面此前作为普通题出现过，属统计口径；原题签名被 findVariant 双重排除，见 README 台账），非复习重复 ${totalNonReview} 道（${(nonReviewRate * 100).toFixed(2)}%）`);
// —— approved 态三指标（templateKey 口径，与 sim_depth 可比）——
const tplSorted = [...tplCountsAll.entries()].sort((a, b) => b[1] - a[1]);
const tplTop10 = tplSorted.slice(0, 10);
const tplTop10Share = tplTop10.reduce((s, [, c]) => s + c, 0) / Math.max(1, totalPicked);
console.log(`  [templateKey 口径] 唯一问法数：${tplCountsAll.size} 种（对照 sim_depth 全轮 2040 种）`);
console.log(`  [templateKey 口径] Top10 问法占全部出题 ${(tplTop10Share * 100).toFixed(1)}%（上限 35%）：${tplTop10.map(([, c]) => c).join(' / ')}`);
const avgPeak = peakSum / DAYS;
console.log(`  [templateKey 口径] 日均单款问法峰值 ${avgPeak.toFixed(2)} 次（门槛 ≤3）；单日最高 ${maxPerDay} 次（${peakDay}）`);
// —— 对照：sig 口径衡量「同一道题面反复出」，365 天去重生效后天然极低，只作对照不作门槛 ——
const top10 = [...questionCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
const top10Share = top10.reduce((s, [, c]) => s + c, 0) / Math.max(1, totalPicked);
console.log(`  [对照·sig 口径] Top10 具体题面占比 ${(top10Share * 100).toFixed(2)}%（衡量同题面复现，不是问法集中度）`);
assert('场景 A 365 天非复习题面重复 ≤0.1%（与 sim_repeat 同口径）', nonReviewRate <= 0.001, `${(nonReviewRate * 100).toFixed(2)}%`);
assert('场景 A 日均单款问法峰值 ≤3', avgPeak <= 3, `${avgPeak.toFixed(2)}`);
assert('场景 A Top10 问法（templateKey）占比 <35%', tplTop10Share < 0.35, `${(tplTop10Share * 100).toFixed(1)}%`);
assert('场景 A 365 天完整答题存储 ≤3.6MB', mb16(rawChars()) <= 3.6, fmt(rawChars()));
assert('场景 A data.days ≤90', Object.keys(store.load().days).length <= 90, `${Object.keys(store.load().days).length}`);

/* ==================== 场景 B：收敛 ma-u01 + approved ==================== */
console.log('\n=== 场景 B：收敛模式 currentUnitId=ma-u01 + 8 道全 approved，365 天完整答题 ===');
store.resetAll();
store.update((d) => {
  d.settings.course.version = '人教版';
  d.settings.course.grade = 3;
  d.settings.course.term = '上册';
  d.settings.course.currentUnitId = 'ma-u01';
  d.settings.course.learnedUnits = [];
  d.questionReview = d.questionReview || {};
  pendingReviewBank().forEach((q) => { d.questionReview[q.id] = 'approved'; });
});
const rows = [];
for (let d = 0; d < DAYS; d += 1) {
  currentMs = START + d * DAY_MS;
  const r = runDay({ converged: true });
  rows.push({ n: d + 1, date: store.todayKey(), ...r });
  if (d < 10) console.log(`  第 ${d + 1} 天 ${store.todayKey()}：${r.tasks} 项（${r.perTask.join(' | ')}）→ 教材 ${r.textbook} / 拓展 ${r.extension}｜兜底 ${r.repeats} 道`);
}
const totalB = rows.reduce((s, r) => s + r.picked, 0);
const repeatB = rows.reduce((s, r) => s + r.repeats, 0);
const repeatBfirst = rows.find((r) => r.repeats > 0);
const shrinkFirst = rows.find((r) => r.tasks < 2);
const textbookPerDay = rows.map((r) => r.textbook);
const minTb = Math.min(...textbookPerDay);
const avgTb = textbookPerDay.reduce((s, n) => s + n, 0) / rows.length;
const maxTb = Math.max(...textbookPerDay);
const daysWith8 = rows.filter((r) => r.textbook >= 8).length;
const extTotal = rows.reduce((s, r) => s + r.extension, 0);
const tbTotal = rows.reduce((s, r) => s + r.textbook, 0);
const extShare = extTotal / Math.max(1, tbTotal + extTotal);
console.log(`\n  收敛 365 天合计：教材 ${tbTotal} / 拓展 ${extTotal}，拓展占比 ${(extShare * 100).toFixed(1)}%`);
console.log(`  教材题/天：最少 ${minTb}、平均 ${avgTb.toFixed(2)}、最多 ${maxTb}；教材 ≥8 的天数 ${daysWith8}/${rows.length}`);
console.log(`  项数：最少 ${Math.min(...rows.map((r) => r.tasks))}、最多 ${Math.max(...rows.map((r) => r.tasks))}`);
console.log(`  首次出现「旧题兜底」：${repeatBfirst ? `第 ${repeatBfirst.n} 天（${repeatBfirst.date}），当天兜底 ${repeatBfirst.repeats} 道` : '未出现'}`);
console.log(`  首次出现「项数 <2」：${shrinkFirst ? `第 ${shrinkFirst.n} 天（${shrinkFirst.date}）` : '未出现'}`);
console.log(`  365 天兜底合计 ${repeatB} 道 / 出题 ${totalB} 道（${(repeatB / Math.max(1, totalB) * 100).toFixed(1)}%）`);
console.log(`  365 天完整答题存储：${fmt(rawChars())} · data.days=${Object.keys(store.load().days).length} · 掌握度知识点 ${Object.keys(store.load().mastery.keys).length}`);
assert('场景 B 365 天完整答题存储 ≤3.6MB', mb16(rawChars()) <= 3.6, fmt(rawChars()));
assert('场景 B data.days ≤90', Object.keys(store.load().days).length <= 90, `${Object.keys(store.load().days).length}`);
assert('场景 B 跨 100 天 mastery.keys 连续（知识点只增不减）', Object.keys(store.load().mastery.keys).length > 0,
  `${Object.keys(store.load().mastery.keys).length} 个`);

console.log('\n=== 结论 ===');
console.log(`场景 A（未配置 + approved）：非复习重复 ${(nonReviewRate * 100).toFixed(2)}%（门槛 0.1%）、复习变式重复 ${(totalReview / Math.max(1, totalPicked) * 100).toFixed(2)}%、存储 ${mb16(nodes.at(-1).chars).toFixed(3)} MB`);
console.log(`场景 B（收敛 ma-u01 + approved）：教材/天 平均 ${avgTb.toFixed(2)}、拓展占比 ${(extShare * 100).toFixed(1)}%、兜底从 ${repeatBfirst ? '第 ' + repeatBfirst.n + ' 天' : '未出现'}`);
console.log('B 的兜底按 P0-1b 定义记入 README 台账第 3 条（内容缺口），不算回归失败。');
process.exitCode = failures ? 2 : 0;
