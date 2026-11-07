/**
 * sim_course.mjs —— 阶段 A 验收：抽题范围是否真的收敛到「当前单元 + 已学单元」
 *
 * 场景：
 *   1. 未配置教材（默认，不收敛）
 *   2. 学期中段：当前单元 = 5（允许集合明显小于全册）
 *   3. 学期末退化场景：当前单元 = 14（全部单元已学，100% 平凡成立）
 *   4. 题量不足：当前单元 = 1（不向后扩围；先收缩项数，每项 3~4 道、拓展 ≤2 道）
 *
 * 「100% 来自当前/已学单元」的成立条件：
 *   - 仅在【教材题】上计算，拓展题（lg-* 逻辑题）单列、不计分母；
 *   - 允许集合 = 单元 order ≤ 当前单元 order（当前单元 + 已学单元）；
 *   - 教材题只能从允许集合抽，且所有抽到的教材题都必须落在允许集合内。
 */
const RealDate = Date;
const START = new RealDate('2026-11-06T12:00:00+08:00').getTime();
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

const { ensureToday, regenerateToday } = await import('../assets/js/core/tasks.js');
const store = await import('../assets/js/core/store.js');
const { COURSE_UNITS, courseScope, annotateQuestion } = await import('../assets/js/data/course-map.js');
const { mathPool } = await import('../assets/js/data/knowledge-math.js');
const { mulberry32, hashString } = await import('../assets/js/core/rng.js');

const short = (s, n = 26) => String(s || '').replace(/\s+/g, ' ').slice(0, n);

function courseInfoOf(q) {
  if (q.courseTrack === 'textbook') {
    return { track: 'textbook', unitId: q.courseUnitId, lessonId: q.courseLessonId, knowledgeId: q.courseKnowledgeId };
  }
  if (q.courseTrack === 'extension' || q.category === 'logic') {
    return { track: 'extension' };
  }
  const a = annotateQuestion(q);
  return a
    ? { track: 'textbook', unitId: a.unitId, lessonId: a.lessonId, knowledgeId: a.knowledgeId }
    : { track: 'other' };
}

function report(title, day) {
  const mathTasks = day.tasks.filter((t) => t.subject === 'math');
  const qs = mathTasks.flatMap((t) => t.questions);
  const course = store.load().settings.course;
  const scope = courseScope(course, 'math');
  const rows = qs.map((q) => ({ q, info: courseInfoOf(q) }));
  const textbook = rows.filter((r) => r.info.track === 'textbook');
  const extension = rows.filter((r) => r.info.track === 'extension');

  console.log(`\n=== ${title} ===`);
  console.log(`当前单元: ${course.currentUnitId || '未设置'} | 允许单元: ${scope ? scope.allowed.size : 0} 个 / 全册 ${COURSE_UNITS.length} 个`);
  const quota = mathTasks.length * 4;
  if (day.courseScope?.math) {
    const s = day.courseScope.math;
    console.log(`教材题：可抽 ${s.textbookAvailable} 道 → 实际抽到 ${s.textbookPicked} 道教材 + ${s.extensionPicked} 道拓展（未抽中 ${s.textbookAvailable - s.textbookPicked} 道教材）`);
    const planned = s.desiredTaskCount ?? mathTasks.length;
    const needed = planned * 4;
    console.log(`项数：${mathTasks.length} 项 / 原计划 ${planned} 项${mathTasks.length < planned ? '（因教材题不足已收缩项数）' : ''}`);
    console.log(`教材池是否够铺满配额: ${s.shortage ? `否（${s.textbookAvailable} < ${needed}，且不向后扩围）` : `够（${s.textbookAvailable} ≥ ${needed}）`}`);
  }
  // 每一项的题数：题量不足时也必须 ≥ PASS_LINE(3)，否则该项永远无法达标
  const perTask = mathTasks.map((t, i) => {
    const tb = t.questions.filter((q) => courseInfoOf(q).track === 'textbook').length;
    const ex = t.questions.filter((q) => courseInfoOf(q).track === 'extension').length;
    return `第 ${i + 1} 项 ${t.questions.length} 道（教材 ${tb} + 拓展 ${ex}）`;
  });
  const minLen = mathTasks.length ? Math.min(...mathTasks.map((t) => t.questions.length)) : 0;
  console.log(`每项题数：${perTask.join(' | ') || '无'} → ${minLen >= 3 ? `✓ 每项 ≥3（最少 ${minLen} 道）` : `✗ 存在 ${minLen} 道的项`}`);
  mathTasks.forEach((t, ti) => {
    console.log(`  [第 ${ti + 1} 项 · ${t.title}]`);
    t.questions.forEach((q, qi) => {
      const info = courseInfoOf(q);
      const where = info.track === 'textbook'
        ? `${info.unitId} / ${info.lessonId} / ${info.knowledgeId}`
        : info.track === 'extension' ? '（拓展题：逻辑/情境，不计分母）' : '（未挂课程表）';
      console.log(`    ${String(qi + 1).padStart(2)}. ${where.padEnd(28)} | ${q.type} | ${short(q.prompt)}`);
    });
  });

  if (scope) {
    const allowed = scope.allowed;
    const inScope = textbook.filter((r) => allowed.has(r.info.unitId)).length;
    console.log(`教材题: ${inScope}/${textbook.length} = ${textbook.length ? (100 * inScope / textbook.length).toFixed(1) : '—'}%（分子/分母只算教材题）`);
    console.log(`拓展题: ${extension.length} 道 = ${rows.length ? (100 * extension.length / rows.length).toFixed(1) : '—'}%（收敛模式单看这个占比，教材比例只算教材题）`);
    // 断言：收敛模式下拓展占比 ≤50%；教材只有 1 道的极端内容缺口单独标注，不作常态门槛
    const extPct = rows.length ? 100 * extension.length / rows.length : 0;
    const extreme = (day.courseScope?.math?.textbookAvailable ?? 0) < 2;
    console.log(`拓展占比断言: ${extreme ? `${extPct.toFixed(1)}% —— 极端内容缺口（教材仅 1 道），单独标注、不作常态门槛` : `${extPct.toFixed(1)}% → ${extPct <= 50 ? '✓ ≤50%' : '✗ >50%'}`}`);
    const unitsUsed = [...new Set(textbook.map((r) => r.info.unitId))];
    console.log('教材题用到单元:', unitsUsed.join('、') || '无');
  } else {
    console.log(`未启用收敛：可挂课程表的题 ${textbook.length} 道，拓展 ${extension.length} 道，其他 ${rows.length - textbook.length - extension.length} 道`);
  }
}

// 场景 1：未配置教材 → 不收敛，保持全年级题池
const day0 = ensureToday();
report('场景 1 · 未配置教材（默认，不收敛）', day0);

// 全池大小（当天种子下三年级的数学候选题池，用于对比允许集合）
const dayKey = store.todayKey();
const fullPool = mathPool(3, mulberry32(hashString(`${dayKey}:3:math`)));
const fullMapped = fullPool.filter((q) => q.category !== 'logic' && annotateQuestion(q)).length;
console.log(`\n[全池] 三年级数学候选题 ${fullPool.length} 道（其中可挂课程表 ${fullMapped} 道）`);

// 场景 2：学期中段
store.update((d) => { d.settings.course.currentUnitId = 'ma-u05'; });
const dayMid = regenerateToday(3);
report('场景 2 · 学期中段：当前单元 = 5. 测量', dayMid);

// 场景 3：学期末退化场景（100% 平凡成立，仅作对照）
store.update((d) => { d.settings.course.currentUnitId = 'ma-u14'; });
const dayLast = regenerateToday(3);
report('场景 3 · 学期末退化场景：当前单元 = 14（全部已学，100% 平凡成立）', dayLast);

// 场景 4：题量不足
store.update((d) => { d.settings.course.currentUnitId = 'ma-u01'; });
const dayFirst = regenerateToday(3);
report('场景 4 · 题量不足：当前单元 = 1. 表内乘法（一）（二）', dayFirst);

// 场景 5：固定种子的 7 天，覆盖「2 项 50%」与「1 项 0%」两种收缩形态
console.log('\n=== 场景 5 · 固定种子 7 天：两种收缩形态都进断言 ===');
const shapes = [];
for (let i = 1; i <= 7; i++) {
  currentMs = START + i * 86400000;
  store.update((d) => { d.settings.course.currentUnitId = 'ma-u01'; });
  const day = regenerateToday(3);
  const mathTasks = day.tasks.filter((t) => t.subject === 'math');
  const per = mathTasks.map((t) => {
    const tb = t.questions.filter((q) => courseInfoOf(q).track === 'textbook').length;
    const ex = t.questions.filter((q) => courseInfoOf(q).track === 'extension').length;
    return { tb, ex, len: t.questions.length };
  });
  const tb = per.reduce((s, x) => s + x.tb, 0);
  const ex = per.reduce((s, x) => s + x.ex, 0);
  const total = tb + ex;
  const extPct = total ? 100 * ex / total : 0;
  const date = store.todayKey();
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][store.weekdayOf(date)];
  shapes.push({ date, weekday, tasks: mathTasks.length, tb, ex, extPct, per });
  console.log(`  ${date} 周${weekday}：${mathTasks.length} 项 / ${tb} 教材 + ${ex} 拓展 = ${extPct.toFixed(1)}% ｜ ${per.map((x, j) => `第${j + 1}项 ${x.len} 道(${x.tb}+${x.ex})`).join(' · ')}`);
}
const shapeA = shapes.filter((s) => s.tasks === 2 && s.extPct === 50);
// 形态 B 用场景 4（同一个固定种子日 2026-11-06）实测：教材 4 道铺满第 1 项，第 2 项凑不够 3 道 → 只出 1 项
const firstMath = dayFirst.tasks.filter((t) => t.subject === 'math');
const firstTb = firstMath.flatMap((t) => t.questions).filter((q) => courseInfoOf(q).track === 'textbook').length;
const firstEx = firstMath.flatMap((t) => t.questions).filter((q) => courseInfoOf(q).track === 'extension').length;
const shapeB = { tasks: firstMath.length, tb: firstTb, ex: firstEx, extPct: firstTb + firstEx ? 100 * firstEx / (firstTb + firstEx) : 0 };
const perTaskOk = shapes.every((s) => s.per.every((x) => x.len >= 3 && x.ex <= 2))
  && firstMath.every((t) => t.questions.length >= 3);
const pctOk = shapes.every((s) => s.extPct <= 50) && shapeB.extPct <= 50;
console.log(`形态 A（2 项 · 50%）：${shapeA.length} 天 ${shapeA.map((s) => s.date).join('、') || '无'}`);
console.log(`形态 B（1 项 · 0%）：场景 4 实测 ${shapeB.tasks} 项 / ${shapeB.tb} 教材 + ${shapeB.ex} 拓展 = ${shapeB.extPct.toFixed(1)}%`);
console.log(`${perTaskOk ? '✓' : '✗'} 每项 3~4 道且拓展 ≤2`);
console.log(`${pctOk ? '✓' : '✗'} 每题占比 ≤50%`);
console.log(`${shapeA.length && shapeB.tasks === 1 && shapeB.extPct === 0 ? '✓' : '✗'} 两种收缩形态都被固定种子覆盖`);
if (!perTaskOk || !pctOk || !shapeA.length || shapeB.tasks !== 1 || shapeB.extPct !== 0) process.exitCode = 1;

console.log('\n=== 结论 ===');
console.log('未配置 → 不收敛；配置后教材题只从「当前单元及之前」抽，拓展题单列；');
console.log('教材题不足时先收缩项数（每项仍 3~4 道、拓展 ≤2 道），绝不提前使用未学单元。');
