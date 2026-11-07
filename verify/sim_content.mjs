/**
 * sim_content.mjs —— 阶段 C 验收：规格书 + 入库检查器 + 存量题库扫描 + 待审题审核链路
 *
 * 跑法：node verify/sim_content.mjs
 * 覆盖：
 *   A. 规格书 schema：ma-u01 示范合规；通用规格 version/grade/term 留空（骨架待核对）
 *   B. 入库检查器扫【现有全部题库】：4 条断言，只报告不修存量（阶段 D2 已下线的废题不得回归）
 *   C. 8 道 ma-u01 待审题：100% 过检查器、100% pending-review、问法互不相同
 *   D. 审核链路：默认不进抽题池；approved 后 ma-u01 可抽教材题 ≥8、拓展占比回落
 */

import { createRequire } from 'node:module';

/* ---------------- localStorage 桩 + FakeDate（与 sim_course 同款） ---------------- */

const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear()
};

let fakeNow = new Date('2026-11-06T12:00:00+08:00');
const RealDate = Date;
class FakeDate extends RealDate {
  constructor(...args) { super(...(args.length ? args : [fakeNow.getTime()])); }
  static now() { return fakeNow.getTime(); }
}
globalThis.Date = FakeDate;

const require = createRequire(import.meta.url);
const store = require('../assets/js/core/store.js');
const tasks = require('../assets/js/core/tasks.js');
const rngmod = require('../assets/js/core/rng.js');
const courseMap = require('../assets/js/data/course-map.js');
const mathBank = require('../assets/js/data/knowledge-math.js');
const chineseBank = require('../assets/js/data/knowledge-chinese.js');
const englishBank = require('../assets/js/data/knowledge-english.js');
const scienceBank = require('../assets/js/data/knowledge-science.js');
const logicBank = require('../assets/js/data/knowledge-logic.js');
const olympicBank = require('../assets/js/data/knowledge-olympic.js');
const specMod = require('../assets/js/data/question-spec.js');
const checker = require('../assets/js/data/question-check.js');

const { annotateQuestion, specOf } = { annotateQuestion: courseMap.annotateQuestion, specOf: specMod.specOf };
const { checkQuestion, scanBank, checkBankVariety, checkSetProgression, templateOf } = checker;
const { checkSpec, GENERIC_ABILITY_SPEC, UNIT_SPECS } = specMod;
const { mulberry32, hashString } = rngmod;

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.log(`  ✗ FAIL: ${msg}`); }
}
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/* ================= A. 规格书 schema ================= */
console.log('\n== A. 题型规格书 schema ==');
{
  const problems = checkSpec(UNIT_SPECS['ma-u01']);
  assert(problems.length === 0, `ma-u01 规格书通过 schema 校验${problems.length ? '（问题：' + problems.join('；') + '）' : ''}`);
  assert(UNIT_SPECS['ma-u01'].askPatterns.length >= 3 && UNIT_SPECS['ma-u01'].askPatterns.length <= 5,
    `问法 3~5 种（实际 ${UNIT_SPECS['ma-u01'].askPatterns.length} 种）`);
  assert(GENERIC_ABILITY_SPEC.version === '' && GENERIC_ABILITY_SPEC.grade === null && GENERIC_ABILITY_SPEC.term === '',
    '通用能力规格 version/grade/term 留空（骨架待核对，不按 source 推断）');
  assert(UNIT_SPECS['ma-u01'].version === '' && UNIT_SPECS['ma-u01'].grade === null && UNIT_SPECS['ma-u01'].term === '',
    'ma-u01 示范 version/grade/term 留空（骨架待核对）');
}

/* ================= B. 入库检查器扫现有全部题库（只报告，不修存量） ================= */
console.log('\n== B. 检查器扫现有全部题库（只报告，不修） ==');

function buildFullBank() {
  const bank = [];
  const tag = (q, subject) => ({ ...q, subject: q.subject || subject });
  for (let g = 1; g <= 6; g++) {
    mathBank.mathPool(g, mulberry32(hashString(`scan:math:${g}`))).forEach((q) => bank.push(tag(q, 'math')));
    chineseBank.CHINESE_BANK.filter((q) => q.grade === g).forEach((q) => bank.push(tag(q, 'chinese')));
    chineseBank.chineseGenerated(g, mulberry32(hashString(`scan:zh:${g}`))).forEach((q) => bank.push(tag(q, 'chinese')));
    englishBank.ENGLISH_BANK.filter((q) => q.grade === g).forEach((q) => bank.push(tag(q, 'english')));
    englishBank.englishGenerated(g, mulberry32(hashString(`scan:en:${g}`))).forEach((q) => bank.push(tag(q, 'english')));
    scienceBank.SCIENCE_BANK.filter((q) => q.grade === g).forEach((q) => bank.push(tag(q, 'science')));
    scienceBank.scienceGenerated(g, mulberry32(hashString(`scan:sci:${g}`))).forEach((q) => bank.push(tag(q, 'science')));
    ['math', 'chinese', 'english', 'science'].forEach((subj) => {
      logicBank.logicPool(subj, g, mulberry32(hashString(`scan:logic:${subj}:${g}`))).forEach((q) => bank.push(tag(q, 'logic')));
    });
    // 奥数：连续多日取 olympicSet，按 templateId 收集全部模板（bag 轮询保证收敛）
    const seen = new Set();
    for (let day = 0; day < 60 && seen.size < 12; day++) {
      const { questions } = olympicBank.olympicSet(g, mulberry32(hashString(`scan:oly:${g}:${day}`)));
      questions.forEach((q) => {
        if (!seen.has(q.templateId)) { seen.add(q.templateId); bank.push(tag(q, 'logic')); }
      });
    }
  }
  return bank;
}

const specOfQ = (q) => {
  const info = annotateQuestion(q);
  return info ? specOf(info.unitId) : null;
};
const groupOf = (q) => {
  const info = annotateQuestion(q);
  return info ? info.knowledgeId : `${q.subject}|${q.topic || '?'}`;
};

{
  const bankAll = buildFullBank();
  // 存量题库 = 排除 C3 待审题（它们还不是抽题池内容，单列在第 C 节验收）
  const bank = bankAll.filter((q) => q.status !== 'pending-review');
  console.log(`  存量题库总量：${bank.length} 道（数学/语文/英语/科学/逻辑+奥数，1~6 年级全量；不含 ${bankAll.length - bank.length} 道待审题）`);

  // 断言 1/2/3（单题级）
  const bad = scanBank(bank, specOfQ);
  const leaks = bad.filter((b) => b.violations.some((v) => v.rule === 'answer-not-in-stem'));
  const distractor = bad.filter((b) => b.violations.some((v) => v.rule === 'distractors-real'));
  const difficulty = bad.filter((b) => b.violations.some((v) => v.rule === 'difficulty-declared'));
  const explainBad = bad.filter((b) => b.violations.some((v) => v.rule === 'explain-consistent'));
  console.log(`\n  [断言1 答案不泄漏在题干] 抓到 ${leaks.length} 道：`);
  leaks.forEach((b) => console.log(`    ✗ [${b.id}] ${b.prompt}（${b.source}）`));
  console.log(`  [断言2 干扰项非随机词] 抓到 ${distractor.length} 道：`);
  distractor.forEach((b) => console.log(`    ✗ [${b.id}] ${b.prompt} → ${b.violations.map((v) => v.detail).join('；')}`));
  console.log(`  [断言3 难度挂在规格书路径上] 抓到 ${difficulty.length} 道（只有 ma-u01 写了规格书示范，其他单元不推断）`);
  difficulty.forEach((b) => console.log(`    ✗ [${b.id}] ${b.prompt} → ${b.violations.map((v) => v.detail).join('；')}`));
  console.log(`  [断言5 解析与答案一致] 抓到 ${explainBad.length} 道：`);
  explainBad.forEach((b) => console.log(`    ✗ [${b.id}] ${b.prompt} → ${b.violations.filter((v) => v.rule === 'explain-consistent').map((v) => v.detail).join('；')}`));

  // 阶段 D2 已下线该废题：本脚本改为守「它不能回来」
  const waste = leaks.find((b) => String(b.prompt).includes('三人比高矮'));
  console.log(`  [D2 下线复核] 奥数废题「三人比高矮」：${waste ? '仍在题库（未下线）' : '已下线'}`);
  assert(!waste, '奥数废题「三人比高矮」已下线，且没有重新混入题库');

  // 断言 4（题库级）
  const variety = checkBankVariety(bank, groupOf, 4);
  console.log(`\n  [断言4 不只换数字] 抓到 ${variety.length} 个知识点「≥4 题但只有 1 种问法」：`);
  variety.forEach((v) => console.log(`    ✗ ${v.group}：${v.count} 道题共用同一问法，如「${v.template}」`));
  const maU01Variety = variety.find((v) => v.group === 'ma-u01-k1');
  assert(!!maU01Variety, 'ma-u01-k1 现状被标出（存量 4 道全是「a×b=（ ）」一种问法）——只报告不修，靠 C3 新题补问法');

  /* ---------- P1 检查器自测：注入 3 道反例，必须都能抓到 ---------- */
  console.log('\n  [P1 检查器自测：3 道注入反例 + 1 道刁钻反例（E 轮疑点⑤）]');
  const spec = UNIT_SPECS['ma-u01'];
  const counterExamples = [
    {
      name: '同义干扰项（7 vs 7.0）',
      q: {
        id: 'self-1', subject: 'math', grade: 3, level: 1, type: 'choice', topic: '表内乘法',
        prompt: '7 × 8 = （ ）', options: ['56', '56.0', '48', '63'], answer: 0,
        explain: '口诀：七八五十六，所以 7 × 8 = 56。'
      }
    },
    {
      name: '解析与答案矛盾（答案 30，解析算成 11）',
      q: {
        id: 'self-2', subject: 'math', grade: 3, level: 1, type: 'input', topic: '表内乘法',
        prompt: '5 × 6 = （ ）', answer: 30, explain: '5 × 6 = 11。'
      }
    },
    {
      // E 轮疑点⑤：中间量（60）+ 提到正确答案数值（52）+ 结论指向错误数值（48）。
      // 现规则见 52 出现在解析里即判「分步讲解」跳过 → 抓不到。这是已知盲区：
      // 本脚本如实记录，不当作失败；「误报 0」不等于检查器可靠。
      name: '刁钻反例：中间量+正确数值+错误结论（预期漏报，记台账）',
      expectMiss: true,
      q: {
        id: 'self-4', subject: 'math', grade: 3, level: 2, type: 'input', topic: '表内乘法',
        prompt: '小明有 5 盒铅笔，每盒 12 支，送给同学 8 支，还剩多少支？',
        answer: 52,
        explain: '先算总数 5 × 12 = 60 支，再算 60 - 8 = 48 支，所以还剩 48 支。（正确答案应为 52）'
      }
    },
    {
      name: '难度没升档（整批都停在 level 1）',
      batch: [
        { id: 'self-3a', subject: 'math', grade: 3, level: 1, type: 'input', topic: '表内乘法', prompt: '4 × 7 = （ ）', answer: 28, explain: '四七二十八。' },
        { id: 'self-3b', subject: 'math', grade: 3, level: 1, type: 'input', topic: '表内乘法', prompt: '6 × 8 = （ ）', answer: 48, explain: '六八四十八。' }
      ]
    }
  ];
  // 反例 1/2/刁钻 走单题检查
  counterExamples.filter((c) => c.q).forEach((c) => {
    const v = checkQuestion(c.q, spec);
    if (c.expectMiss) {
      console.log(`    ${v.length ? '✓ 意外抓到（规则已增强，台账可销）' : '⊙ 未抓到（已知盲区，记 README 台账，不阻塞 E）'}：${c.name}`);
      return; // 已知盲区实证：不计入 pass/fail
    }
    console.log(`    ${v.length ? '✓ 抓到' : '✗ 漏报'}：${c.name} → ${v.map((x) => x.detail).join('；') || '无违规'}`);
    assert(v.length > 0, `检查器抓到反例：${c.name}`);
  });
  // 反例 3 走组级递进检查
  counterExamples.filter((c) => c.batch).forEach((c) => {
    const v = checkSetProgression(c.batch, spec);
    console.log(`    ${v.length ? '✓ 抓到' : '✗ 漏报'}：${c.name} → ${v.map((x) => x.detail).join('；') || '无违规'}`);
    assert(v.length > 0, `检查器抓到反例：${c.name}`);
  });
}

/* ================= C. 8 道待审题：过检查器 + pending-review + 问法互异 ================= */
console.log('\n== C. ma-u01 待审核新题（C3 生成，硬上限 8 道） ==');
{
  const list = mathBank.pendingReviewBank();
  assert(list.length === 8, `数量 = 8（硬上限，实际 ${list.length}）`);
  const spec = UNIT_SPECS['ma-u01'];
  const allPass = list.every((q) => checkQuestion(q, spec).length === 0);
  if (!allPass) {
    list.forEach((q) => {
      const v = checkQuestion(q, spec);
      if (v.length) console.log(`    ✗ [${q.id}] ${v.map((x) => x.detail).join('；')}`);
    });
  }
  assert(allPass, '8 道新题 100% 过入库检查器（断言 1/2/3）');
  assert(list.every((q) => q.status === 'pending-review'), '8 道新题 100% status:pending-review');
  const progression = checkSetProgression(list, spec);
  assert(progression.length === 0, `8 道新题整批覆盖难度递增路径（level 1 → 2）${progression.length ? '：' + progression.map((v) => v.detail).join('；') : ''}`);
  const templates = new Set(list.map(templateOf));
  assert(templates.size === 8, `问法互不相同（数字脱敏模板 ${templates.size}/8）`);
  const annotated = list.every((q) => annotateQuestion(q)?.unitId === 'ma-u01');
  assert(annotated, '8 道新题全部挂进 ma-u01（课程收敛可抽到）');
}

/* ================= D. 审核链路：默认不进池；approved 后 ≥8 且拓展回落 ================= */
console.log('\n== D. 审核开关生效链路 ==');

function runCourseDay({ approved }) {
  storage.clear();
  const questionReview = {};
  if (approved) mathBank.pendingReviewBank().forEach((q) => { questionReview[q.id] = 'approved'; });
  const base = store.load();
  store.save({
    ...base,
    grade: 3,
    days: {}, // store.load 有模块级缓存，storage.clear 不够，必须显式清掉 days 才能强制重建
    questionReview,
    settings: {
      ...(base.settings || {}),
      stretch: false,
      course: { subject: 'math', version: '人教版', grade: 3, term: '上册', currentUnitId: 'ma-u01', learnedUnits: [] }
    }
  });
  const day = iso(fakeNow);
  const res = tasks.ensureToday();
  return { res, day };
}

function courseInfoOf(q) {
  if (q.courseTrack === 'textbook') return 'textbook';
  if (q.courseTrack === 'extension' || q.category === 'logic') return 'extension';
  return annotateQuestion(q) ? 'textbook' : 'other';
}

function poolTextbookMaU01(approved) {
  // 模拟抽题口径：mathPool(3) 挂 ma-u01 且通过 questionReview 过滤后的教材题
  const pool = mathBank.mathPool(3, mulberry32(hashString('d:3:math')));
  return pool.filter((q) =>
    annotateQuestion(q)?.unitId === 'ma-u01' &&
    (q.status !== 'pending-review' || approved)
  );
}

{
  // 默认（未审核）：8 道新题不进池
  const { day } = runCourseDay({ approved: false });
  const idsInTasks = new Set((store.load().days[day].tasks || []).flatMap((t) => t.questions.map((q) => q.id)));
  const nonePicked = mathBank.pendingReviewBank().every((q) => !idsInTasks.has(q.id));
  assert(nonePicked, '默认（未审核）8 道新题 0 道进入当日任务（不进抽题池）');

  // 连续 7 天对比：未审核（存量 4 道 1 问法）vs 全部 approved（12 道 9 问法）
  const simulate7Days = (approved) => {
    const rows = [];
    const startMs = fakeNow.getTime();
    for (let i = 0; i < 7; i++) {
      fakeNow = new RealDate(startMs + i * 86400000);
      const { day: dk } = runCourseDay({ approved });
      const data = store.load();
      const mathTasks = (data.days[dk]?.tasks || []).filter((t) => t.subject === 'math');
      const tb = mathTasks.flatMap((t) => t.questions).filter((q) => courseInfoOf(q) === 'textbook').length;
      const ex = mathTasks.flatMap((t) => t.questions).filter((q) => courseInfoOf(q) === 'extension').length;
      const perTask = mathTasks.map((t) => {
        const t1 = t.questions.filter((q) => courseInfoOf(q) === 'textbook').length;
        const t2 = t.questions.filter((q) => courseInfoOf(q) === 'extension').length;
        return `${t1}+${t2}`;
      });
      rows.push({ day: dk, tasks: mathTasks.length, tb, ex, perTask });
      // 标记当天全部完成并写正确率，推进到次日（让 365 天去重/冷却真实累积）
      store.update((d) => {
        (d.days[dk].tasks || []).forEach((t) => { t.done = true; t.firstTryCorrect = t.questions.length; });
      });
    }
    fakeNow = new RealDate(startMs);
    return rows;
  };

  console.log('  【未审核 · 7 天】（存量 ma-u01 教材 4 道、1 种问法）');
  const before7 = simulate7Days(false);
  before7.forEach((r) => console.log(`    ${r.day}：${r.tasks} 项（${r.perTask.join(' | ')}）→ 教材 ${r.tb} / 拓展 ${r.ex}`));
  const sumB = before7.reduce((s, r) => ({ tb: s.tb + r.tb, ex: s.ex + r.ex, tasks: s.tasks + r.tasks }), { tb: 0, ex: 0, tasks: 0 });
  const extPctB = sumB.ex / Math.max(1, sumB.tb + sumB.ex);
  console.log(`    合计 ${sumB.tasks} 项：教材 ${sumB.tb} / 拓展 ${sumB.ex}，拓展占比 ${(extPctB * 100).toFixed(1)}%`);

  console.log('  【全部 approved · 7 天】（ma-u01 教材 12 道、9 种问法）');
  const after7 = simulate7Days(true);
  after7.forEach((r) => console.log(`    ${r.day}：${r.tasks} 项（${r.perTask.join(' | ')}）→ 教材 ${r.tb} / 拓展 ${r.ex}`));
  const sumA = after7.reduce((s, r) => ({ tb: s.tb + r.tb, ex: s.ex + r.ex, tasks: s.tasks + r.tasks }), { tb: 0, ex: 0, tasks: 0 });
  const extPctA = sumA.ex / Math.max(1, sumA.tb + sumA.ex);
  console.log(`    合计 ${sumA.tasks} 项：教材 ${sumA.tb} / 拓展 ${sumA.ex}，拓展占比 ${(extPctA * 100).toFixed(1)}%`);

  const after = poolTextbookMaU01(true);
  const templatesAfter = new Set(after.map(templateOf));
  assert(after.length >= 8, `C4④-a approved 后 ma-u01 可抽教材题 ≥8（实际 ${after.length}）`);
  assert(templatesAfter.size >= 5, `C4④-c 问法 ≥5 种（实际 ${templatesAfter.size} 种）`);
  assert(sumA.tasks >= sumB.tasks && Math.min(...after7.map((r) => r.tasks)) >= Math.min(...before7.map((r) => r.tasks)),
    `C4④-a 单元 1 不再收缩项数（未审核 ${before7.map((r) => r.tasks).join('/')} → approved ${after7.map((r) => r.tasks).join('/')}）`);
  const tbPerDay = after7.map((r) => r.tb);
  console.log(`  C4④-b 教材题/天：${tbPerDay.join(' / ')}（平均 ${(sumA.tb / after7.length).toFixed(2)}）`);
  console.log(`  C4④-d 拓展占比：${(extPctA * 100).toFixed(1)}%（目标 15~30%）`);
  // ②④ 未达标是「内容缺口」，不是抽题算法回归：ma-u01 可新生成的教材题只有约 4 道/天，
  // 8 道手写题在 365 天不重题的约束下一次性用完（第 1 天 8 道，之后 4 道/天）。
  // 已按 P0-1b 记入 README 台账第 3 条；不再靠放开 365 天去重或新增题目来凑指标。
  console.log(`  ⚠ C4④-b/d 未达标（内容缺口，台账第 3 条）：教材供给约 4 道/天，`);
  console.log(`    在「365 天不重题 + 不新增题目」约束下无法做到 ≥8 道/天与拓展 15~30%。`);
  console.log(`    教材优先已生效：项数不再收缩、问法 1 → 9 种、教材绝对量上升。`);
}

/* ================= 汇总 ================= */
console.log(`\n== 汇总：${pass} 通过 / ${fail} 失败 ==`);
process.exit(fail ? 1 : 0);
