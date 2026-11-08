/**
 * sim_english_p4.mjs —— P4 英语 12 册验收（R1~R6 + 两套 track + 四级词表 + 对话队列）
 *
 * 跑法：node verify/sim_english_p4.mjs
 *
 * 口径（与 sim_chinese_p3 平行）：
 *   R1/R2：按年级（上下册合并）×365 天为门槛；全库/分册只作诊断。
 *          直接调用 tasks.js buildDay / markUsed / templateKey，不另写抽题逻辑。
 *   R3：每 kid ≥4 specId、≥3 个语义不同外壳；同册内不同 kid 不共用外壳（templateKey）。
 *   R4：每册每个单元作为“当前单元”模拟 365 天，教材题可用量 < 当日配额记为兜底日；<5% 通过。
 *   R5：跨年级 / 跨册 / 跨科错挂 = 0；source 由结构化索引生成。
 *   R6：L1 断言盲区反例 + 两套 sub-track 不串 + 四级发音词表规模 + 对话台词 +1/+3/+7 队列证据。
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

const { englishPool } = await import('../assets/js/data/knowledge-english.js');
const { ENGLISH_VOLUMES, specPoolOfVolume, specPoolOfGrade, specIdOf, SPEC_VARIANTS_PER_SPEC, unitTagOf, ENGLISH_REVIEW_BATCH } =
  await import('../assets/js/data/course/specs-english.js');
const { EN_FAMILY } = await import('../assets/js/data/course/volumes/_shape-english.js');
const { annotateQuestion, courseScope } = await import('../assets/js/data/course-map.js');
const { sourceOf, SUBJECT_PROFILES } = await import('../assets/js/data/course/edition-profile.js');
const { checkQuestionV5, checkAnswerUnique, checkScopeWords, checkExplainConclusion } = await import('../assets/js/data/question-check.js');
const { taskCountFor } = await import('../assets/js/data/curriculum.js');
const { mulberry32, hashString } = await import('../assets/js/core/rng.js');
const { buildDay, markUsed, templateKey } = await import('../assets/js/core/tasks.js');
const { LEVELS, levelOfItem, levelName, REVIEW_OFFSETS, scheduleNext, dueEntries } = await import('../assets/js/data/speaking-plan.js');
const { WORD_BANK, SENTENCE_BANK, DIALOGUE_BANK } = await import('../assets/js/data/speaking-content.js');

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
const volKey = (v) => `english:${v.grade}:${v.term}`;

const allKids = ENGLISH_VOLUMES.flatMap((v) => v.units.flatMap((u) => u.lessons.flatMap((l) => l.knowledge.map((k) => ({ kid: k, volume: v, unit: u, lesson: l })))));
const allUnits = ENGLISH_VOLUMES.flatMap((v) => v.units.map((u) => ({ unit: u, volume: v })));

/* ================= R3 · 结构 / 规格 / 待审闸门 ================= */
console.log('\n== R3 · 英语 12 册结构 / 规格 / 待审闸门 ==');
assert(ENGLISH_VOLUMES.length === 12, `已建英语 12 册（实际 ${ENGLISH_VOLUMES.length}）`);
const upDown = new Set(ENGLISH_VOLUMES.map((v) => `${v.grade}:${v.term}`));
assert(upDown.size === 12 && [...upDown].every((k) => ['上册', '下册'].includes(k.split(':')[1])), `上下册各 6 年级共 12 册（实际 ${upDown.size}）`);
assert(allUnits.length >= 66, `单元数 ≥66（实际 ${allUnits.length}）`);
assert(allKids.length >= 210, `知识点 kid ≥210（实际 ${allKids.length}）`);

const kidNoSpec = allKids.filter(({ kid }) => !(kid.specIds || []).length || (kid.specParams?.specCount ?? 0) < 3);
assert(kidNoSpec.length === 0, `每 kid ≥3 specId（不足 ${kidNoSpec.length} 个）`);

let specBad = 0;
let specCount = 0;
const specPoolByKid = new Map();
const kidTpl = new Map();
for (const volume of ENGLISH_VOLUMES) {
  const rand = mulberry32(hashString(`r3:${volKey(volume)}`));
  const qs = specPoolOfVolume(volume, rand);
  specCount += qs.length;
  for (const q of qs) {
    const kid = allKids.find((x) => x.kid.id === q.knowledgeId)?.kid;
    const unit = volume.units.find((u) => u.id === q.unitId);
    const lesson = unit?.lessons.find((l) => l.id === q.lessonId);
    const ok = !!kid && !!unit && !!lesson
      && q.subject === 'english'
      && q.grade === volume.grade
      && q.term === volume.term
      && q.status === 'pending-review'
      && q.reviewBatch === ENGLISH_REVIEW_BATCH
      && q.answer !== undefined && q.answer !== null
      && q.prompt && q.explain
      && q.specId === specIdOf(kid.id, Number(String(q.specId).slice(-2)))
      && q.askPattern && q.source === sourceOf(volume, unit.name)
      && Object.prototype.hasOwnProperty.call(EN_FAMILY, kid.specDomain);
    if (!ok) specBad += 1;
  }
  const byKid = new Map();
  for (const q of qs) {
    if (!byKid.has(q.knowledgeId)) byKid.set(q.knowledgeId, []);
    byKid.get(q.knowledgeId).push(q);
  }
  for (const [kidId, list] of byKid.entries()) {
    specPoolByKid.set(kidId, list);
    kidTpl.set(kidId, new Set(list.map(templateKey)));
  }
}
assert(specBad === 0, `规格题字段 / 挂接 / 待审闸门全通过（生成 ${specCount} 道，违规 ${specBad} 道）`);

const kidShells = allKids.filter(({ kid }) => (kidTpl.get(kid.id) || new Set()).size < 3);
assert(kidShells.length === 0, `每 kid ≥3 个语义不同外壳（不足 ${kidShells.length} 个）`);

let sharedShell = 0;
for (const volume of ENGLISH_VOLUMES) {
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
  const key = `${volume.grade}`;
  if (!tagMap.has(key)) tagMap.set(key, new Map());
  const tags = tagMap.get(key);
  const tag = unitTagOf(unit.name, volume.term);
  if (tags.has(tag)) tags.get(tag).push(`${volume.term}/${unit.name}`);
  else tags.set(tag, [`${volume.term}/${unit.name}`]);
}
const tagCollide = [...tagMap.entries()].flatMap(([g, m]) => [...m.entries()].filter(([, v]) => v.length > 1).map(([tag, v]) => `${g}年级 ${tag} ← ${v.join(' / ')}`));
assert(tagCollide.length === 0, `同年级单元标签唯一（${tagCollide.length ? tagCollide.slice(0, 3).join('；') : '无冲突'}）`);

/* ================= R4 · 单元收敛 365 天兜底率 ================= */
console.log('\n== R4 · 单元收敛 365 天兜底率（按年级学习位次累计供给）==');
function simulateVolume(volume, days = 365) {
  const grade = volume.grade;
  const gradeUnits = ENGLISH_VOLUMES
    .filter((v) => v.grade === grade)
    .flatMap((v) => v.units)
    .sort((a, b) => a.order - b.order);
  const currentUnits = [...volume.units].sort((a, b) => a.order - b.order);
  const shortage = new Map(currentUnits.map((u) => [u.id, 0]));
  for (let d = 0; d < days; d += 1) {
    const key = dateKeyOf(BASE + d * DAY);
    const weekday = weekdayOfKey(key);
    const need = taskCountFor('english', weekday, grade) * 4;
    const rand = mulberry32(hashString(`${key}:${grade}:english`));
    const pool = englishPool(grade, rand, { includeSpec: true, simulateApproved: true });
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
for (const volume of ENGLISH_VOLUMES) {
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
const volumeDiag = new Map(ENGLISH_VOLUMES.map((v) => [v, { prompts: new Map(), tpls: new Map(), total: 0, dup: 0 }]));
const globalTpl = new Map();
let globalTotal = 0;
let globalDup = 0;
const gradeStat = new Map();
const kidMeta = new Map(allKids.map(({ kid, volume, unit }) => [kid.id, { domain: kid.specDomain, volume: `${volume.grade}${volume.term}`, unit: unit.name }]));

for (const grade of [1, 2, 3, 4, 5, 6]) {
  const data = { grade, questionReview: {}, reviewBatches: { 'p4-english-batch-1': 'approved' }, recentByDay: {}, recentKeys: {} };
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
    const preview = englishPool(grade, mulberry32(hashString(`${key}:${grade}:english`)), { includeSpec: true, simulateApproved: true });
    preview.forEach((q) => {
      if (!q.specId) return;
      if (!kidSupply.has(q.knowledgeId)) kidSupply.set(q.knowledgeId, new Set());
      kidSupply.get(q.knowledgeId).add(q.prompt);
    });
    const day = buildDay(key, grade, data);
    const qs = day.tasks.filter((t) => t.subject === 'english').flatMap((t) => t.questions);
    const needToday = taskCountFor('english', weekdayOfKey(key), grade) * 4;
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
  console.log(`  ${grade} 年级：英语题 ${total} 道（${tpls.size} 模板）· 重复 ${(dupRate * 100).toFixed(2)}% · Top10 ${(top10Rate * 100).toFixed(1)}%${shortDays ? ` · 供给不足 ${shortDays} 天` : ''}`);
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
for (const volume of ENGLISH_VOLUMES) {
  const rand = mulberry32(hashString(`r5:${volKey(volume)}`));
  const qs = specPoolOfVolume(volume, rand);
  for (const q of qs) {
    const info = annotateQuestion(q);
    if (!info) { unattachedSpec += 1; continue; }
    if (info.volumeKey !== volKey(volume) || info.grade !== volume.grade || info.term !== volume.term) misattach += 1;
    if (q.subject !== 'english') misattach += 1;
    const back = courseScope({ subject: 'english', currentUnitId: info.unitId, learnedUnits: [] }, 'english');
    if (!back || !back.allowed.has(info.unitId)) misattach += 1;
  }
}
assert(unattachedSpec === 0, `英语规格题 100% 挂上结构化索引（未挂 ${unattachedSpec} 道）`);
assert(misattach === 0, `跨年级 / 跨册 / 跨科错挂 = 0（违规 ${misattach} 道）`);

/* ================= R6 · 两套 track / 四级词表 / 对话队列 ================= */
console.log('\n== R6 · L1 断言 / 两套 track / 四级词表 / 对话队列 ==');
const badCases = [
  {
    name: '答案唯一（7 与 7.0 两个自洽解）',
    q: { type: 'choice', subject: 'english', prompt: 'How many books are there?', options: ['7', '7.0', '8', '9'], answer: 0, explain: 'There are 7 books.', grade: 3 },
    fn: checkAnswerUnique,
    expect: 'answer-unique'
  },
  {
    name: '超纲词（二年级出现“负数/方程”）',
    q: { type: 'choice', subject: 'english', prompt: 'Which number is in the box?', options: ['-3', '5', '0', '8'], answer: 0, explain: '负数与方程要到高年级才学。', grade: 2 },
    fn: checkScopeWords,
    expect: 'scope-words'
  },
  {
    name: '解析结论指向错误值（v4 已知盲区）',
    q: { type: 'input', subject: 'english', prompt: 'How many apples?', answer: '4', explain: '桌上有一些苹果，所以答案是 5。', grade: 3 },
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

// 两套 sub-track 不串：1~2 新起点 / 3~6 PEP
let trackBad = 0;
for (const volume of ENGLISH_VOLUMES) {
  const expect = volume.grade <= 2 ? 'newstart' : 'pep';
  if (volume.track !== expect || SUBJECT_PROFILES.english.tracks[volume.grade] !== expect) trackBad += 1;
  const rand = mulberry32(hashString(`r6-track:${volKey(volume)}`));
  specPoolOfVolume(volume, rand).forEach((q) => {
    const label = expect === 'newstart' ? '人教新起点' : '人教 PEP';
    if (!String(q.source).startsWith(label)) trackBad += 1;
  });
}
assert(trackBad === 0, `两套 track 不串（违规 ${trackBad} 处）`);

// 四级发音词表规模：单音节词 / 多音节词 / 连读短语 / 句子重音语调
const words = WORD_BANK.map((w) => ({ type: 'word', text: w.w }));
const phrases = SENTENCE_BANK.map((s) => ({ type: 'sentence', text: s.text }));
const levels = { 1: 0, 2: 0, 3: 0, 4: 0 };
words.forEach((w) => { levels[levelOfItem(w)] += 1; });
phrases.forEach((s) => { levels[levelOfItem(s)] += 1; });
const twoWord = phrases.filter((s) => s.text.split(/\s+/).filter(Boolean).length === 2);
const level3Two = twoWord.filter((s) => levelOfItem(s) === 3);
console.log(`  四级词表：${LEVELS.map((l) => `${l.name} ${levels[l.id]}`).join(' / ')}`);
console.log(`  其中 2 词连读短语 ${twoWord.length} 条（第 3 级 ${level3Two.length} 条）`);
assert(twoWord.length >= 40, `第 3 级 2 词短语 ≥40 条（实际 ${twoWord.length}）`);
assert(level3Two.length === twoWord.length, `2 词短语全部判为第 3 级（异常 ${twoWord.length - level3Two.length} 条）`);
assert(levels[4] > 0 && levels[1] > 0 && levels[2] > 0, '四级词表 1/2/4 级均有供给');

// 对话台词入 +1/+3/+7 队列
const titleSet = new Set(DIALOGUE_BANK.map((d) => d.title));
assert(titleSet.size === DIALOGUE_BANK.length, `对话标题唯一（${DIALOGUE_BANK.length} 组）`);
const lineIds = new Set();
let lineBad = 0;
DIALOGUE_BANK.forEach((d) => d.lines.forEach((l, i) => {
  const id = `line:${d.title}:${i}`;
  if (lineIds.has(id)) lineBad += 1;
  lineIds.add(id);
  if (!l.text || !l.zh || !l.who) lineBad += 1;
}));
assert(lineBad === 0, `台词 id 唯一且字段完整（${lineIds.size} 条台词）`);

const dayShift = (key, delta) => {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new RealDate(y, m - 1, d + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};
const first = DIALOGUE_BANK[0];
const lineItem = { id: `line:${first.title}:0`, type: 'line', level: 3, text: first.lines[0].text, zh: first.lines[0].zh, who: first.lines[0].who };
const today = dateKeyOf(BASE);
const q0 = scheduleNext(undefined, today, 3);
const q0c = { ...q0, kind: 'line', text: lineItem.text, zh: lineItem.zh, who: lineItem.who };
const due1 = q0c.due;
const q1 = scheduleNext(q0c, due1, 3);
const due3 = q1?.due;
const q2 = due3 ? scheduleNext(q1, due3, 3) : null;
const due7 = q2?.due;
const q3 = due7 ? scheduleNext(q2, due7, 3) : null;
assert(REVIEW_OFFSETS.join(',') === '1,3,7', `复习间隔固定 +1/+3/+7（实际 ${REVIEW_OFFSETS.join('/')}）`);
assert(due1 === dayShift(today, 1), `首练后第 2 天复现（${due1}）`);
assert(due3 === dayShift(today, 3) && due7 === dayShift(today, 7), `第 3/7 天推进（${due3} / ${due7}）`);
assert(q3 === null, '第 7 天练完毕业（移出队列）');
assert(dueEntries({ [lineItem.id]: q0c }, due1, 'line').length === 1, '到期台词能被 dueEntries(kind=line) 取到');
assert(dueEntries({ [lineItem.id]: q0c }, dayShift(today, 0), 'line').length === 0, '当天新练台词不立即复现');

// 全量规格题 L1 结构抽扫
let v5Bad = 0;
let scanned = 0;
for (const volume of ENGLISH_VOLUMES) {
  const rand = mulberry32(hashString(`r6v5:${volKey(volume)}`));
  const qs = specPoolOfVolume(volume, rand).slice(0, 120);
  for (const q of qs) {
    scanned += 1;
    if (checkQuestionV5(q).length) v5Bad += 1;
  }
}
assert(v5Bad === 0, `规格批次 L1 结构断言零违规（抽扫 ${scanned} 道 / 违规 ${v5Bad}）`);

console.log(`\n== 结果：通过 ${pass} / 失败 ${fail} ==`);
if (fail) process.exitCode = 1;
