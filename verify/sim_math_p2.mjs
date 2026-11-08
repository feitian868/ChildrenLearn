/**
 * sim_math_p2.mjs —— P2 数学试点验收（R3 / R4 / R6 + ma-u01 供给）
 *
 * 跑法：node verify/sim_math_p2.mjs
 *
 * 口径：
 *   R3 结构：已建数学册每个 kid 有 ≥3 个 specId；每个 specId 能生成题；
 *            规格题字段齐全、source 由索引生成、无跨年级错挂。
 *   R4 供给：每册每个单元作为“当前单元”，模拟 365 天，
 *            教材题可用量 < 当日配额（项数 × 4）记为兜底日；兜底率 <5% 为通过。
 *            ★ 仿真用 reviewBatches 批次键放行规格题（生成器仍输出 pending-review，由 data 层门禁放行）。
 *   R6 L1：v5 新增 3 条断言必须抓到已知盲区反例，且规格批次零违规。
 *   ma-u01：教材题每天 ≥8 道的天数占比 ≥80%。
 *
 * 注意：本脚本不生成任何新题入库；只读规格引擎与现有题库。
 */

const RealDate = Date;
const BASE = new RealDate('2026-11-07T12:00:00+08:00').getTime();
let currentMs = BASE;
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

const { mathPool } = await import('../assets/js/data/knowledge-math.js');
const { specPoolOfVolume, specPoolOfGrade, specIdOf, SPEC_VARIANTS_PER_SPEC } = await import('../assets/js/data/course/specs-math.js');
const { MATH_VOLUMES } = await import('../assets/js/data/course/specs-math.js');
const { annotateQuestion, courseScope } = await import('../assets/js/data/course-map.js');
const { sourceOf } = await import('../assets/js/data/course/edition-profile.js');
const { checkQuestionV5, checkAnswerUnique, checkScopeWords, checkExplainConclusion } = await import('../assets/js/data/question-check.js');
const { taskCountFor } = await import('../assets/js/data/curriculum.js');
const { mulberry32, hashString, shuffle } = await import('../assets/js/core/rng.js');

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.log(`  ✗ FAIL: ${msg}`); }
}

const DAY = 86400000;
const dateKeyOf = (ms) => {
  const d = new RealDate(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const weekdayOfKey = (key) => new RealDate(`${key}T12:00:00+08:00`).getDay();

const allKids = MATH_VOLUMES.flatMap((v) => v.units.flatMap((u) => u.lessons.flatMap((l) => l.knowledge.map((k) => ({ kid: k, volume: v, unit: u, lesson: l })))));

/* ================= R3 结构 ================= */
console.log('\n== R3 · 每 kid ≥3 specId + 规格题结构 ==');
let shortSpec = 0;
allKids.forEach(({ kid }) => {
  const ids = kid.specIds || [];
  if (ids.length < 3 || !kid.specDomain) {
    shortSpec += 1;
    console.log(`  ✗ ${kid.id}: specId ${ids.length} 个 / 领域 ${kid.specDomain || '无'}`);
  }
  ids.forEach((sid, i) => {
    if (sid !== specIdOf(kid.id, i + 1)) {
      shortSpec += 1;
      console.log(`  ✗ ${kid.id}: specId 命名 ${sid} ≠ ${specIdOf(kid.id, i + 1)}`);
    }
  });
});
assert(shortSpec === 0, `已建册 ${allKids.length} 个 kid 全部 ≥3 specId 且命名规范（不足 ${shortSpec} 个）`);

// 每个 specId 至少能生成 1 道；字段/出处/年级一致
let generated = 0;
let badSpecQuestions = 0;
const unitOf = new Map(MATH_VOLUMES.flatMap((v) => v.units.map((u) => [u.id, { v, u }])));
for (const volume of MATH_VOLUMES) {
  for (const unit of volume.units) {
    for (const lesson of unit.lessons) {
      for (const kid of lesson.knowledge) {
        const domainCount = (kid.specIds || []).length;
        for (let s = 1; s <= domainCount; s += 1) {
          const sid = specIdOf(kid.id, s);
          const rand = mulberry32(hashString(`r3:${sid}`));
          const pool = specPoolOfVolume(volume, rand).filter((q) => q.specId === sid);
          if (!pool.length) {
            badSpecQuestions += 1;
            console.log(`  ✗ ${sid}: 生成 0 道（领域生成器缺失）`);
            continue;
          }
          generated += pool.length;
          pool.forEach((q) => {
            const problems = [];
            if (q.knowledgeId !== kid.id) problems.push('knowledgeId 不符');
            if (q.specId !== sid) problems.push('specId 不符');
            if (q.unitId !== unit.id) problems.push('unitId 不符');
            if (q.lessonId !== lesson.id) problems.push('lessonId 不符');
            if (q.grade !== volume.grade || q.term !== volume.term) problems.push('册次不符');
            if (q.source !== sourceOf(volume, unit.name)) problems.push('source 非索引生成');
            if (annotateQuestion(q)?.unitId !== unit.id) problems.push('annotate 挂接失败');
            if (q.status !== 'pending-review') problems.push('默认未走待审闸门');
            if (problems.length) {
              badSpecQuestions += 1;
              console.log(`  ✗ ${q.id}: ${problems.join('；')}`);
            }
          });
        }
      }
    }
  }
}
assert(badSpecQuestions === 0, `规格题结构/挂接/待审闸门全通过（生成 ${generated} 道，违规 ${badSpecQuestions} 道）`);
console.log(`  · 每 spec 每天生成 ${SPEC_VARIANTS_PER_SPEC} 道；kid ${allKids.length} × 3 spec`);

/* ================= R4 365 天供给 ================= */
console.log('\n== R4 · 单元收敛 365 天兜底率 ==');
function simulate(volume, days = 365) {
  const grade = volume.grade;
  // 同年级两册合并成一个“学习位次”序列（order 全局唯一）
  const gradeUnits = MATH_VOLUMES
    .filter((v) => v.grade === grade)
    .flatMap((v) => v.units)
    .sort((a, b) => a.order - b.order);
  const currentUnits = [...volume.units].sort((a, b) => a.order - b.order);
  const shortage = new Map(currentUnits.map((u) => [u.id, 0]));
  for (let d = 0; d < days; d += 1) {
    const key = dateKeyOf(BASE + d * DAY);
    const weekday = weekdayOfKey(key);
    const need = taskCountFor('math', weekday, grade) * 4;
    const rand = mulberry32(hashString(`${key}:${grade}:math`));
    const pool = mathPool(grade, rand, { includeSpec: true, simulateApproved: true });
    const byUnit = new Map();
    pool.forEach((q) => {
      const info = annotateQuestion(q);
      if (!info || q.grade !== grade) return;
      if (!byUnit.has(info.unitId)) byUnit.set(info.unitId, new Set());
      byUnit.get(info.unitId).add(`${q.prompt}|${q.answer}`);
    });
    const cumulative = new Set();
    for (const unit of gradeUnits) {
      (byUnit.get(unit.id) || new Set()).forEach((x) => cumulative.add(x));
      if (shortage.has(unit.id) && cumulative.size < need) shortage.set(unit.id, shortage.get(unit.id) + 1);
    }
  }
  return currentUnits.map((u) => ({ unitId: u.id, unitName: u.name, rate: shortage.get(u.id) / days }));
}

let totalCells = 0;
let failedCells = 0;
for (const volume of MATH_VOLUMES) {
  const rows = simulate(volume, 365);
  const worst = rows.reduce((a, b) => (a.rate > b.rate ? a : b));
  const avg = rows.reduce((s, r) => s + r.rate, 0) / rows.length;
  console.log(`  ${volume.grade}${volume.term}：${rows.length} 个单元 / 365 天 · 平均兜底 ${(avg * 100).toFixed(2)}% · 最差 ${worst.unitId} ${(worst.rate * 100).toFixed(2)}%`);
  rows.forEach((r) => {
    totalCells += 1;
    if (r.rate >= 0.05) {
      failedCells += 1;
      console.log(`    ✗ ${r.unitId} ${r.unitName}：兜底 ${(r.rate * 100).toFixed(2)}%`);
    }
  });
}
assert(failedCells === 0, `全部单元兜底率 <5%（不合格单元 ${failedCells}/${totalCells}；v4 基线 12.2%）`);

/* ================= ma-u01 供给 ================= */
console.log('\n== ma-u01 · 每天教材题 ≥8 道的天数占比 ==');
{
  const volume = MATH_VOLUMES.find((v) => v.units.some((u) => u.id === 'ma-u01'));
  const unit = volume.units.find((u) => u.id === 'ma-u01');
  let okDays = 0;
  for (let d = 0; d < 365; d += 1) {
    const key = dateKeyOf(BASE + d * DAY);
    const rand = mulberry32(hashString(`${key}:${volume.grade}:math`));
    const pool = mathPool(volume.grade, rand, { includeSpec: true, simulateApproved: true });
    const count = new Set(
      pool
        .filter((q) => annotateQuestion(q)?.unitId === unit.id)
        .map((q) => `${q.prompt}|${q.answer}`)
    ).size;
    if (count >= 8) okDays += 1;
  }
  const rate = okDays / 365;
  console.log(`  ma-u01 教材题 ≥8 道：${okDays}/365 天 = ${(rate * 100).toFixed(1)}%`);
  assert(rate >= 0.8, `ma-u01 每天教材题 ≥8 道的天数占比 ≥80%（实际 ${(rate * 100).toFixed(1)}%）`);
}

/* ================= R1 / R2 · 365 天真实抽题（直接调用 tasks.js buildDay） =================
 * 调用点：tasks.js:358 `export function buildDay(key, grade, data)`
 *        任务内抽题：tasks.js:158 `export function pickQuestions(...)`
 *        模板键：tasks.js:346 `export function templateKey(q)`
 *        用后落盘：tasks.js:515 `export function markUsed(data, day)`
 * 口径：每册按年级上下册合并 ×365 天（门槛）；分册数字仅诊断。
 * 仿真只做一件事——把 `p2-math-batch-1` 写成 approved（批次放行的最坏口径）；
 * 生成器仍输出 pending-review，是否可抽由 tasks.js 的 visiblePool 按 reviewBatches 批次键放行。
 */
console.log('\n== R1 / R2 · 365 天真实抽题（tasks.js buildDay 真口径）==');
const { buildDay, markUsed, templateKey } = await import('../assets/js/core/tasks.js');
const unitToVolume = new Map(MATH_VOLUMES.flatMap((v) => v.units.map((u) => [u.id, v])));
const volumeDiag = new Map(MATH_VOLUMES.map((v) => [v, { prompts: new Map(), tpls: new Map(), total: 0, dup: 0 }]));
const globalTpl = new Map();
let globalTotal = 0;
let globalDup = 0;
const gradeStat = new Map();

const kidMeta = new Map(allKids.map(({ kid, volume, unit }) => [kid.id, { domain: kid.specDomain, volume: `${volume.grade}${volume.term}`, unit: unit.name }]));
for (const grade of [1, 2, 3, 4, 5, 6]) {
  const data = { grade, questionReview: {}, reviewBatches: { 'p2-math-batch-1': 'approved' }, recentByDay: {}, recentKeys: {} };
  const prompts = new Map();
  const tpls = new Map();
  const tplSamples = new Map();
  const kidSupply = new Map();
  const kidCalls = new Map();
  let total = 0;
  let dup = 0;
  let shortDays = 0;
  for (let d = 0; d < 365; d += 1) {
    const key = dateKeyOf(BASE + d * DAY);
    // 批次放行仿真：p2-math-batch-1 整批 approved（由 data.reviewBatches 门禁生效）
    const preview = mathPool(grade, mulberry32(hashString(`${key}:${grade}:math`)), { includeSpec: true, simulateApproved: true });
    preview.forEach((q) => {
      if (!q.specId) return;
      // 供给诊断：该 kid 全年生成过的唯一题面
      if (!kidSupply.has(q.knowledgeId)) kidSupply.set(q.knowledgeId, new Set());
      kidSupply.get(q.knowledgeId).add(q.prompt);
    });
    const day = buildDay(key, grade, data);
    const qs = day.tasks.filter((t) => t.subject === 'math').flatMap((t) => t.questions);
    const needToday = taskCountFor('math', weekdayOfKey(key), grade) * 4;
    if (qs.length < needToday) shortDays += 1;
    for (const q of qs) {
      const kId = q.knowledgeId || annotateQuestion(q)?.kidId;
      if (kId) kidCalls.set(kId, (kidCalls.get(kId) || 0) + 1);
      const repeat = prompts.has(q.prompt);
      if (repeat) { dup += 1; globalDup += 1; }
      prompts.set(q.prompt, (prompts.get(q.prompt) || 0) + 1);
      const tp = templateKey(q);
      tpls.set(tp, (tpls.get(tp) || 0) + 1);
      if (!tplSamples.has(tp)) tplSamples.set(tp, { text: q.prompt.slice(0, 40), src: q.specId || q.id || 'bank' });
      globalTpl.set(tp, (globalTpl.get(tp) || 0) + 1);
      total += 1;
      globalTotal += 1;
      // 分册诊断（不作门槛）
      const vol = unitToVolume.get(annotateQuestion(q)?.unitId);
      const st = vol ? volumeDiag.get(vol) : null;
      if (st) {
        const vRepeat = st.prompts.has(q.prompt);
        if (vRepeat) st.dup += 1;
        st.prompts.set(q.prompt, (st.prompts.get(q.prompt) || 0) + 1);
        st.tpls.set(tp, (st.tpls.get(tp) || 0) + 1);
        st.total += 1;
      }
    }
    markUsed(data, day);
  }
  const dupRate = total ? dup / total : 0;
  const top10 = [...tpls.values()].sort((a, b) => b - a).slice(0, 10).reduce((s, c) => s + c, 0);
  const top10Rate = total ? top10 / total : 0;
  gradeStat.set(grade, { total, dup, dupRate, top10Rate, tpls, prompts });
  console.log(`  ${grade} 年级：数学题 ${total} 道（${tpls.size} 模板）· 重复 ${(dupRate * 100).toFixed(2)}% · Top10 ${(top10Rate * 100).toFixed(1)}%${shortDays ? ` · 供给不足 ${shortDays} 天` : ''}`);
  // 诊断：重复最多的题面（供低参数领域扩池定位）
  [...prompts.entries()].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .forEach(([p, c]) => console.log(`    ↳ 重复×${c}：${p.slice(0, 48)}`));
  // 诊断：Top10 模板样本（供高集中度领域加外壳定位）
  [...tpls.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
    .forEach(([tp, c]) => console.log(`    ★ Top ${c}：${tplSamples.get(tp).text}　[来源 ${tplSamples.get(tp).src}]`));
  // 供给诊断：低参数领域「全年唯一题面供给 ≥ 调用次数 ×1.2」
  const low = [...kidCalls.entries()].map(([kid, calls]) => {
    const supply = (kidSupply.get(kid) || new Set()).size;
    const meta = kidMeta.get(kid) || {};
    return { kid, calls, supply, need: calls * 1.2, domain: meta.domain || '?', volume: meta.volume || '?' };
  }).filter((r) => r.supply < r.need).sort((a, b) => (a.supply / a.need) - (b.supply / b.need));
  console.log(`  · 供给不足 kid：${low.length} 个（唯一题面 < 调用×1.2）`);
  low.slice(0, 8).forEach((r) => console.log(`    ↳ ${r.kid} [${r.volume}/${r.domain}]：供给 ${r.supply} / 调用 ${r.calls}（需 ${Math.ceil(r.need)}）`));
}

const gTop10 = [...globalTpl.values()].sort((a, b) => b - a).slice(0, 10).reduce((s, c) => s + c, 0);
const gTop10Rate = globalTotal ? gTop10 / globalTotal : 0;
console.log(`  全库（诊断）：${globalTotal} 道（${globalTpl.size} 模板）· 重复 ${((globalDup / globalTotal) * 100).toFixed(2)}% · Top10 ${(gTop10Rate * 100).toFixed(1)}%`);
console.log('  分册（诊断，不作门槛）：');
for (const [volume, st] of volumeDiag.entries()) {
  const dupRate = st.total ? st.dup / st.total : 0;
  const top10 = [...st.tpls.values()].sort((a, b) => b - a).slice(0, 10).reduce((s, c) => s + c, 0);
  const top10Rate = st.total ? top10 / st.total : 0;
  console.log(`    ${volume.grade}${volume.term}：${st.total} 道（${st.tpls.size} 模板）· 重复 ${(dupRate * 100).toFixed(2)}% · Top10 ${(top10Rate * 100).toFixed(1)}%`);
}

const r1Bad = [...gradeStat.entries()].filter(([, s]) => s.dupRate > 0.001).map(([g]) => `${g}年级`);
const r2Bad = [...gradeStat.entries()].filter(([, s]) => s.top10Rate >= 0.35).map(([g]) => `${g}年级`);
assert(r1Bad.length === 0, `R1 按年级 365 天题面重复率 ≤0.1%（未达标 ${r1Bad.length}/6${r1Bad.length ? `：${r1Bad.join('、')}` : ''}）`);
assert(r2Bad.length === 0, `R2 按年级 Top10 模板占比 <35%（未达标 ${r2Bad.length}/6${r2Bad.length ? `：${r2Bad.join('、')}` : ''}）`);
assert(gTop10Rate < 0.35, `R2 全库 Top10 诊断值 <35%（当前 ${(gTop10Rate * 100).toFixed(1)}%）`);

/* ================= R6 · 新增 3 断言 ================= */
console.log('\n== R6 · L1 新增 3 断言的盲区反例 ==');
const badCases = [
  {
    name: '答案唯一（7 与 7.0 两个自洽解）',
    q: { type: 'choice', prompt: '（ ）× 8 = 56，括号里填几？', options: ['6', '7', '7.0', '8'], answer: 1, explain: '想口诀七八五十六，所以填 7。', grade: 3 },
    expect: 'answer-unique'
  },
  {
    name: '超纲词（二年级出现负数）',
    q: { type: 'input', prompt: '算一算 -3 + 5 = （ ）', answer: 2, explain: '负数相加，所以得 2。', grade: 2 },
    expect: 'scope-words'
  },
  {
    name: '解析结论指向错误值（v4 已知盲区）',
    q: { type: 'input', prompt: '7 × 8 = （ ）', answer: 56, explain: '7 × 8 = 56，所以答案是 54。', grade: 3 },
    expect: 'explain-conclusion'
  }
];
let caught = 0;
badCases.forEach((c) => {
  const v = c.expect === 'answer-unique' ? checkAnswerUnique(c.q)
    : c.expect === 'scope-words' ? checkScopeWords(c.q) : checkExplainConclusion(c.q);
  const ok = v.some((x) => x.rule === c.expect);
  if (ok) caught += 1;
  console.log(`  ${ok ? '✓' : '✗'} ${c.name} → ${v.map((x) => x.rule).join('、') || '未抓到'}`);
});
assert(caught === badCases.length, `3 条新断言全部抓到反例（${caught}/${badCases.length}）`);

// 规格批次零违规（抽样：每册前 2 个单元 + 每 spec 前 2 道）
let scanned = 0;
let violations = 0;
for (const volume of MATH_VOLUMES) {
  for (const unit of volume.units.slice(0, 2)) {
    const rand = mulberry32(hashString(`r6:${volume.grade}:${unit.id}`));
    const pool = specPoolOfVolume(volume, rand).filter((q) => q.unitId === unit.id);
    const sample = pool.filter((_, i) => i % 4 === 0);
    sample.forEach((q) => {
      scanned += 1;
      const v = checkQuestionV5(q);
      if (v.length) {
        violations += 1;
        console.log(`  ✗ ${q.id}: ${v.map((x) => `${x.rule}(${x.detail})`).join('；')}`);
      }
    });
  }
}
assert(violations === 0, `规格批次 L1（v4 四断言 + v5 三断言）零违规（扫描 ${scanned} 道）`);

console.log(`\n=== 汇总：${pass} 通过 / ${fail} 失败 ===`);
console.log('说明：R4 仿真按“批次放行后”口径计算（data.reviewBatches）；v5-release 已写四批 approved。');
if (fail) process.exitCode = 1;
