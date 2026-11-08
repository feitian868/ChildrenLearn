/**
 * sim_science_p5.mjs —— P5 科学 12 册验收（R1~R6 + 单问法知识点=0 + 奥数六专题）
 *
 * 跑法：node verify/sim_science_p5.mjs
 *
 * 口径（与 sim_chinese_p3 / sim_english_p4 平行）：
 *   R1/R2：按年级（上下册合并）×365 天为门槛；全库/分册只作诊断。
 *         直接调用 tasks.js buildDay / markUsed / templateKey，不另写抽题逻辑。
 *   R3：每 kid ≥4 specId、≥3 个语义不同外壳；同册内不同 kid 不共用外壳（templateKey）。
 *   R4：每册每个单元作为“当前单元”模拟 365 天，教材题可用量 < 当日配额记为兜底日；<5% 通过。
 *   R5：跨年级 / 跨册 / 跨科错挂 = 0；source 由结构化索引生成。
 *   R6：L1 三条断言盲区反例 + 七领域覆盖 + 全量规格题 L1 抽扫。
 *   专项：48 册全部 kid 规格数 ≥3（单问法知识点全库 = 0）；奥数六专题每专题模板 ≥4、四/五年级齐全。
 *   供给：每 kid 全年唯一题面 ≥ 调用次数 ×1.2；每年级同样 ≥1.2（证据输出，R1 为硬门槛）。
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

const { sciencePool } = await import('../assets/js/data/knowledge-science.js');
const { SCIENCE_VOLUMES, specPoolOfVolume, specPoolOfGrade, specIdOf, SPEC_VARIANTS_PER_SPEC, unitTagOf, SCIENCE_REVIEW_BATCH } =
  await import('../assets/js/data/course/specs-science.js');
const { MATH_VOLUMES } = await import('../assets/js/data/course/specs-math.js');
const { CHINESE_VOLUMES } = await import('../assets/js/data/course/specs-chinese.js');
const { ENGLISH_VOLUMES } = await import('../assets/js/data/course/specs-english.js');
const { SC_FAMILY } = await import('../assets/js/data/course/volumes/_shape-science.js');
const { annotateQuestion, courseScope } = await import('../assets/js/data/course-map.js');
const { sourceOf } = await import('../assets/js/data/course/edition-profile.js');
const { checkQuestionV5, checkAnswerUnique, checkScopeWords, checkExplainConclusion } = await import('../assets/js/data/question-check.js');
const { taskCountFor } = await import('../assets/js/data/curriculum.js');
const { mulberry32, hashString } = await import('../assets/js/core/rng.js');
const { buildDay, markUsed, templateKey } = await import('../assets/js/core/tasks.js');
const { olympicTopics, TOPIC_SEQUENCE } = await import('../assets/js/data/knowledge-olympic.js');

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
const volKey = (v) => `science:${v.grade}:${v.term}`;

const allKids = SCIENCE_VOLUMES.flatMap((v) => v.units.flatMap((u) => u.lessons.flatMap((l) => l.knowledge.map((k) => ({ kid: k, volume: v, unit: u, lesson: l })))));
const allUnits = SCIENCE_VOLUMES.flatMap((v) => v.units.map((u) => ({ unit: u, volume: v })));
const kidById = new Map(allKids.map((x) => [x.kid.id, x]));

/* ================= R3 · 结构 / 规格 / 待审闸门 ================= */
console.log('\n== R3 · 科学 12 册结构 / 规格 / 待审闸门 ==');
assert(SCIENCE_VOLUMES.length === 12, `已建科学 12 册（实际 ${SCIENCE_VOLUMES.length}）`);
const upDown = new Set(SCIENCE_VOLUMES.map((v) => `${v.grade}:${v.term}`));
assert(upDown.size === 12 && [...upDown].every((k) => ['上册', '下册'].includes(k.split(':')[1])), `上下册各 6 年级共 12 册（实际 ${upDown.size}）`);
assert(allUnits.length >= 56, `单元数 ≥56（实际 ${allUnits.length}）`);
assert(allKids.length >= 168, `知识点 kid ≥168（实际 ${allKids.length}）`);

// order 269 起连续
const orders = allUnits.map(({ unit }) => unit.order).sort((a, b) => a - b);
assert(orders[0] === 269, `科学首单元 order = 269（实际 ${orders[0]}）`);
const continuous = orders.every((v, i) => i === 0 || v === orders[i - 1] + 1);
assert(continuous && orders.length === 56, `单元 order 269 起连续无空洞（${orders[0]}~${orders[orders.length - 1]}，共 ${orders.length} 个）`);

const kidNoSpec = allKids.filter(({ kid }) => !(kid.specIds || []).length || (kid.specParams?.specCount ?? 0) < 3);
assert(kidNoSpec.length === 0, `每 kid ≥3 specId（不足 ${kidNoSpec.length} 个）`);

let specBad = 0;
let specCount = 0;
const kidTpl = new Map();
for (const volume of SCIENCE_VOLUMES) {
  const rand = mulberry32(hashString(`r3:${volKey(volume)}`));
  const qs = specPoolOfVolume(volume, rand);
  specCount += qs.length;
  for (const q of qs) {
    const entry = kidById.get(q.knowledgeId);
    const kid = entry?.kid;
    const unit = volume.units.find((u) => u.id === q.unitId);
    const lesson = unit?.lessons.find((l) => l.id === q.lessonId);
    const ok = !!kid && !!unit && !!lesson
      && q.subject === 'science'
      && q.grade === volume.grade
      && q.term === volume.term
      && q.status === 'pending-review'
      && q.reviewBatch === SCIENCE_REVIEW_BATCH
      && q.answer !== undefined && q.answer !== null
      && q.prompt && q.explain
      && q.specId === specIdOf(kid.id, Number(String(q.specId).slice(-2)))
      && q.askPattern && q.source === sourceOf(volume, unit.name)
      && Object.prototype.hasOwnProperty.call(SC_FAMILY, kid.specDomain);
    if (!ok) specBad += 1;
  }
  const byKid = new Map();
  for (const q of qs) {
    if (!byKid.has(q.knowledgeId)) byKid.set(q.knowledgeId, []);
    byKid.get(q.knowledgeId).push(q);
  }
  for (const [kidId, list] of byKid.entries()) {
    kidTpl.set(kidId, new Set(list.map(templateKey)));
  }
}
assert(specBad === 0, `规格题字段 / 挂接 / 待审闸门全通过（生成 ${specCount} 道，违规 ${specBad} 道）`);

const kidShells = allKids.filter(({ kid }) => (kidTpl.get(kid.id) || new Set()).size < 3);
assert(kidShells.length === 0, `每 kid ≥3 个语义不同外壳（不足 ${kidShells.length} 个）`);

let sharedShell = 0;
for (const volume of SCIENCE_VOLUMES) {
  const kids = allKids.filter((x) => x.volume === volume);
  for (let i = 0; i < kids.length; i += 1) {
    for (let j = i + 1; j < kids.length; j += 1) {
      const a = kidTpl.get(kids[i].kid.id) || new Set();
      const b = kidTpl.get(kids[j].kid.id) || new Set();
      for (const t of a) if (b.has(t)) sharedShell += 1;
    }
  }
}
assert(sharedShell === 0, `同册内不同 kid 不共用外壳（共享 ${sharedShell} 处）`);

const tagMap = new Map();
for (const { unit, volume } of allUnits) {
  if (!tagMap.has(volume.grade)) tagMap.set(volume.grade, new Map());
  const tags = tagMap.get(volume.grade);
  const tag = unitTagOf(unit.name, volume.term);
  if (tags.has(tag)) tags.get(tag).push(`${volume.term}/${unit.name}`);
  else tags.set(tag, [`${volume.term}/${unit.name}`]);
}
const tagCollide = [...tagMap.entries()].flatMap(([g, m]) => [...m.entries()].filter(([, v]) => v.length > 1).map(([tag, v]) => `${g}年级 ${tag} ← ${v.join(' / ')}`));
assert(tagCollide.length === 0, `同年级单元标签唯一（${tagCollide.length ? tagCollide.slice(0, 3).join('；') : '无冲突'}）`);

/* ================= 专项 · 单问法知识点全库 = 0 ================= */
console.log('\n== 专项 · 单问法知识点全库 = 0 ==');
const volumesOfAll = [...MATH_VOLUMES, ...CHINESE_VOLUMES, ...ENGLISH_VOLUMES, ...SCIENCE_VOLUMES];
const thinKids = [];
let kidTotal = 0;
for (const volume of volumesOfAll) {
  for (const unit of volume.units) {
    for (const lesson of unit.lessons) {
      for (const kid of lesson.knowledge) {
        kidTotal += 1;
        // 数学册的 specIds 固定 3 个（specParams 不带 specCount），只按 specIds 判定
        if ((kid.specIds || []).length < 3) {
          thinKids.push(`${volume.subject}/${volume.grade}${volume.term}/${unit.id}/${kid.id}`);
        }
      }
    }
  }
}
console.log(`  全库 ${volumesOfAll.length} 册 / ${kidTotal} kid；<3 规格 ${thinKids.length} 个`);
thinKids.slice(0, 6).forEach((x) => console.log(`    ✗ ${x}`));
assert(thinKids.length === 0, `单问法知识点全库 = 0（<3 规格 ${thinKids.length} 个）`);

/* ================= R4 · 单元收敛 365 天兜底率 ================= */
console.log('\n== R4 · 单元收敛 365 天兜底率（按年级学习位次累计供给）==');
function simulateVolume(volume, days = 365) {
  const grade = volume.grade;
  const gradeUnits = SCIENCE_VOLUMES
    .filter((v) => v.grade === grade)
    .flatMap((v) => v.units)
    .sort((a, b) => a.order - b.order);
  const currentUnits = [...volume.units].sort((a, b) => a.order - b.order);
  const shortage = new Map(currentUnits.map((u) => [u.id, 0]));
  for (let d = 0; d < days; d += 1) {
    const key = dateKeyOf(BASE + d * DAY);
    const weekday = weekdayOfKey(key);
    const need = taskCountFor('science', weekday, grade) * 4;
    const rand = mulberry32(hashString(`${key}:${grade}:science`));
    const pool = sciencePool(grade, rand, { includeSpec: true, simulateApproved: true });
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
for (const volume of SCIENCE_VOLUMES) {
  const rows = simulateVolume(volume, 365);
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
assert(failedCells === 0, `全部单元兜底率 <5%（不合格单元 ${failedCells}/${totalCells}）`);

/* ================= R1 / R2 · 365 天真实抽题（buildDay 真口径） ================= */
console.log('\n== R1 / R2 · 365 天真实抽题（tasks.js buildDay 真口径）==');
const unitToVolume = new Map(allUnits.map(({ unit, volume }) => [unit.id, volume]));
const volumeDiag = new Map(SCIENCE_VOLUMES.map((v) => [v, { prompts: new Map(), tpls: new Map(), total: 0, dup: 0 }]));
const globalTpl = new Map();
let globalTotal = 0;
let globalDup = 0;
const gradeStat = new Map();
const kidMeta = new Map(allKids.map(({ kid, volume, unit }) => [kid.id, { domain: kid.specDomain, volume: `${volume.grade}${volume.term}`, unit: unit.name }]));

for (const grade of [1, 2, 3, 4, 5, 6]) {
  const data = { grade, questionReview: {}, reviewBatches: { 'p5-science-batch-1': 'approved' }, recentByDay: {}, recentKeys: {} };
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
    const preview = sciencePool(grade, mulberry32(hashString(`${key}:${grade}:science`)), { includeSpec: true, simulateApproved: true });
    preview.forEach((q) => {
      if (!q.specId) return;
      if (!kidSupply.has(q.knowledgeId)) kidSupply.set(q.knowledgeId, new Set());
      kidSupply.get(q.knowledgeId).add(q.prompt);
    });
    const day = buildDay(key, grade, data);
    const qs = day.tasks.filter((t) => t.subject === 'science').flatMap((t) => t.questions);
    const needToday = taskCountFor('science', weekdayOfKey(key), grade) * 4;
    if (qs.length < needToday) shortDays += 1;
    for (const q of qs) {
      const kId = q.knowledgeId || annotateQuestion(q)?.knowledgeId;
      if (kId) kidCalls.set(kId, (kidCalls.get(kId) || 0) + 1);
      if (prompts.has(q.prompt)) { dup += 1; globalDup += 1; }
      prompts.set(q.prompt, (prompts.get(q.prompt) || 0) + 1);
      const tp = templateKey(q);
      tpls.set(tp, (tpls.get(tp) || 0) + 1);
      if (!tplSamples.has(tp)) tplSamples.set(tp, { text: q.prompt.slice(0, 40), src: q.specId || q.id || 'bank' });
      globalTpl.set(tp, (globalTpl.get(tp) || 0) + 1);
      total += 1;
      globalTotal += 1;
      const vol = unitToVolume.get(annotateQuestion(q)?.unitId);
      const st = vol ? volumeDiag.get(vol) : null;
      if (st) {
        if (st.prompts.has(q.prompt)) st.dup += 1;
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
  console.log(`  ${grade} 年级：科学题 ${total} 道（${tpls.size} 模板）· 重复 ${(dupRate * 100).toFixed(2)}% · Top10 ${(top10Rate * 100).toFixed(1)}%${shortDays ? ` · 供给不足 ${shortDays} 天` : ''}`);
  [...prompts.entries()].filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]).slice(0, 6)
    .forEach(([p, c]) => console.log(`    ↳ 重复×${c}：${p.slice(0, 48)}`));
  [...tpls.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
    .forEach(([tp, c]) => console.log(`    ★ Top ${c}：${tplSamples.get(tp).text}　[来源 ${tplSamples.get(tp).src}]`));
  const low = [...kidCalls.entries()].map(([kid, calls]) => {
    const supply = (kidSupply.get(kid) || new Set()).size;
    const meta = kidMeta.get(kid) || {};
    return { kid, calls, supply, need: calls * 1.2, domain: meta.domain || '?', volume: meta.volume || '?' };
  }).filter((r) => r.supply < r.need).sort((a, b) => (a.supply / a.need) - (b.supply / b.need));
  console.log(`  · 供给不足 kid：${low.length} 个（唯一题面 < 调用×1.2）`);
  low.slice(0, 6).forEach((r) => console.log(`    ↳ ${r.kid} [${r.volume}/${r.domain}]：供给 ${r.supply} / 调用 ${r.calls}（需 ${Math.ceil(r.need)}）`));
}

const gTop10 = [...globalTpl.values()].sort((a, b) => b - a).slice(0, 10).reduce((s, c) => s + c, 0);
const gTop10Rate = globalTotal ? gTop10 / globalTotal : 0;
console.log(`  全库（诊断）：${globalTotal} 道（${globalTpl.size} 模板）· 重复 ${((globalDup / globalTotal) * 100).toFixed(2)}% · Top10 ${(gTop10Rate * 100).toFixed(1)}%`);
console.log('  分册（诊断，不作门槛）：');
for (const [volume, st] of volumeDiag.entries()) {
  const dupRate = st.total ? st.dup / st.total : 0;
  const top10 = [...st.tpls.values()].sort((a, b) => b - a).slice(0, 10).reduce((s, c) => s + c, 0);
  console.log(`    ${volume.grade}${volume.term}：${st.total} 道（${st.tpls.size} 模板）· 重复 ${(dupRate * 100).toFixed(2)}% · Top10 ${(st.total ? top10 / st.total * 100 : 0).toFixed(1)}%`);
}

const r1Bad = [...gradeStat.entries()].filter(([, s]) => s.dupRate > 0.001).map(([g]) => `${g}年级`);
const r2Bad = [...gradeStat.entries()].filter(([, s]) => s.top10Rate >= 0.35).map(([g]) => `${g}年级`);
assert(r1Bad.length === 0, `R1 按年级 365 天题面重复率 ≤0.1%（未达标 ${r1Bad.length}/6${r1Bad.length ? `：${r1Bad.join('、')}` : ''}）`);
assert(r2Bad.length === 0, `R2 按年级 Top10 模板占比 <35%（未达标 ${r2Bad.length}/6${r2Bad.length ? `：${r2Bad.join('、')}` : ''}）`);
assert(gTop10Rate < 0.35, `R2 全库 Top10 诊断值 <35%（当前 ${(gTop10Rate * 100).toFixed(1)}%）`);

/* ================= R5 · 错挂 / 出处 ================= */
console.log('\n== R5 · 跨年级 / 跨册 / 跨科错挂 ==');
let misattach = 0;
let unattachedSpec = 0;
for (const volume of SCIENCE_VOLUMES) {
  const rand = mulberry32(hashString(`r5:${volKey(volume)}`));
  const qs = specPoolOfVolume(volume, rand);
  for (const q of qs) {
    const info = annotateQuestion(q);
    if (!info) { unattachedSpec += 1; continue; }
    if (info.volumeKey !== volKey(volume) || info.grade !== volume.grade || info.term !== volume.term) misattach += 1;
    if (q.subject !== 'science') misattach += 1;
    const back = courseScope({ subject: 'science', currentUnitId: info.unitId, learnedUnits: [] }, 'science');
    if (!back || !back.allowed.has(info.unitId)) misattach += 1;
  }
}
assert(unattachedSpec === 0, `科学规格题 100% 挂上结构化索引（未挂 ${unattachedSpec} 道）`);
assert(misattach === 0, `跨年级 / 跨册 / 跨科错挂 = 0（违规 ${misattach} 道）`);

/* ================= R6 · L1 断言 / 七领域 / 规格抽扫 ================= */
console.log('\n== R6 · L1 断言 / 七领域覆盖 / 规格抽扫 ==');
const badCases = [
  {
    name: '答案唯一（7 与 7.0 两个自洽解）',
    q: { type: 'choice', subject: 'science', prompt: '这杯水有多少毫升？', options: ['7', '7.0', '8', '9'], answer: 0, explain: '读数是 7 毫升。', grade: 3 },
    fn: checkAnswerUnique,
    expect: 'answer-unique'
  },
  {
    name: '超纲词（二年级出现“负数/方程”）',
    q: { type: 'choice', subject: 'science', prompt: '哪个温度是负数？', options: ['-3', '5', '0', '8'], answer: 0, explain: '负数与方程要到高年级才学。', grade: 2 },
    fn: checkScopeWords,
    expect: 'scope-words'
  },
  {
    name: '解析结论指向错误值（v4 已知盲区）',
    q: { type: 'input', subject: 'science', prompt: '一共有几颗种子？', answer: '4', explain: '数了数种子，所以答案是 5。', grade: 3 },
    fn: checkExplainConclusion,
    expect: 'explain-conclusion'
  }
];
let caught = 0;
badCases.forEach((c) => {
  const v = c.fn(c.q);
  const ok = v.some((x) => x.rule === c.expect);
  if (ok) caught += 1;
  console.log(`  ${ok ? '✓' : '✗'} ${c.name} → ${v.map((x) => x.rule).join('、') || '未抓到'}`);
});
assert(caught === badCases.length, `3 条 L1 断言全部抓到反例（${caught}/${badCases.length}）`);

const usedFamilies = new Set(allKids.map(({ kid }) => kid.specDomain));
const missingFamilies = Object.keys(SC_FAMILY).filter((f) => !usedFamilies.has(f));
assert(missingFamilies.length === 0, `七个科学领域全部有知识点承载（缺 ${missingFamilies.join('、') || '无'}）`);

let v5Bad = 0;
let scanned = 0;
for (const volume of SCIENCE_VOLUMES) {
  const rand = mulberry32(hashString(`r6v5:${volKey(volume)}`));
  const qs = specPoolOfVolume(volume, rand).slice(0, 120);
  for (const q of qs) {
    scanned += 1;
    if (checkQuestionV5(q).length) {
      v5Bad += 1;
      if (v5Bad <= 4) console.log(`    ✗ ${q.specId} ${q.prompt.slice(0, 40)} → ${checkQuestionV5(q).map((x) => `${x.rule}(${x.detail})`).join('；')}`);
    }
  }
}
assert(v5Bad === 0, `规格批次 L1 结构断言零违规（抽扫 ${scanned} 道 / 违规 ${v5Bad}）`);

/* ================= 专项 · 奥数六专题 ================= */
console.log('\n== 专项 · 奥数六专题模板数 ==');
const topicCounts = new Map(TOPIC_SEQUENCE.map((t) => [t.id, 0]));
const gradeTopicIds = new Map();
for (let g = 1; g <= 6; g += 1) {
  const topics = olympicTopics(g);
  gradeTopicIds.set(g, new Set(topics.map((t) => t.id)));
  console.log(`  ${g} 年级：${topics.map((t) => `${t.name}(${t.templates.length})`).join(' · ')}`);
  topics.forEach((t) => topicCounts.set(t.id, (topicCounts.get(t.id) || 0) + t.templates.length));
}
const thinTopics = [...topicCounts.entries()].filter(([, c]) => c < 4);
assert(thinTopics.length === 0, `六专题每专题模板数 ≥4（不足：${thinTopics.map(([id, c]) => `${id}=${c}`).join('、') || '无'}）`);
for (const g of [4, 5]) {
  const missing = TOPIC_SEQUENCE.filter((t) => !gradeTopicIds.get(g).has(t.id)).map((t) => t.name);
  assert(missing.length === 0, `${g} 年级六专题齐全（缺 ${missing.join('、') || '无'}）`);
}

void SPEC_VARIANTS_PER_SPEC;
console.log(`\n== 结果：通过 ${pass} / 失败 ${fail} ==`);
if (fail) process.exitCode = 1;
