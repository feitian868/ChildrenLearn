/**
 * sim_structure.mjs —— P0 结构完整性 + id 迁移证据
 *
 * 跑法：node verify/sim_structure.mjs
 * 覆盖：
 *   A. 48 册目录：科目 × 年级 × 上下册齐全、键唯一
 *   B. 已建册结构：单元 / 课 / 知识点 id 全局唯一、先修链无环且只记录
 *   C. 册归属：单元自带 metaGrade/metaTerm 与所在册一致（跨册错挂 = 0）
 *   D. id 规范：legacy → canonical 1:1 别名表；规范 id 构造器可复原
 *   E. 迁移证据：18 个 kid 的掌握度 / 掌握日期 / 复习队列 / 曲线 / 内容缺口
 *      走生产代码 migrateKnowledgeId，迁移前后 kid 数、正确率、状态、曲线连续
 */
import { loadBuiltVolumes, listVolumes } from '../assets/js/data/course/index.js';
import { buildAliasMap, checkAliasMap, ID_SPEC_VERSION } from '../assets/js/data/course/id-spec.js';
import { EDITION_ID, SUBJECTS, GRADES, TERMS, SUBJECT_PROFILES } from '../assets/js/data/course/edition-profile.js';
import { UNIT_SPECS } from '../assets/js/data/question-spec.js';

const RealDate = Date;
const BASE = new RealDate('2026-11-06T12:00:00+08:00').getTime();
class FakeDate extends RealDate {
  constructor(...args) { if (args.length === 0) super(BASE); else super(...args); }
  static now() { return BASE; }
}
globalThis.Date = FakeDate;
const _mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (_mem.has(k) ? _mem.get(k) : null),
  setItem: (k, v) => _mem.set(k, String(v)),
  removeItem: (k) => _mem.delete(k),
  clear: () => _mem.clear()
};

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.log(`  ✗ FAIL: ${msg}`); }
}

const volumes = await loadBuiltVolumes();
const units = volumes.flatMap((v) => v.units.map((u) => ({ ...u, _volume: v })));

/* ================= A. 48 册目录 ================= */
console.log('\n== A. 48 册目录 ==');
const catalog = listVolumes();
assert(catalog.length === SUBJECTS.length * GRADES.length * TERMS.length,
  `目录共 ${catalog.length} 册 = ${SUBJECTS.length} 科 × ${GRADES.length} 年级 × ${TERMS.length} 册次`);
assert(new Set(catalog.map((v) => v.key)).size === catalog.length, '册键唯一');
assert(catalog.every((v) => v.edition === EDITION_ID), '全部册目同属 editionProfile');
const builtCount = catalog.filter((v) => v.built).length;
assert(builtCount === volumes.length && builtCount === 36,
  `已建册 ${builtCount} 册（P2 数学 12 + P3 语文 12 + P4 英语 12），其余 ${catalog.length - builtCount} 册只登记目录（不伪造单元）`);
assert(catalog.filter((v) => !v.built).every((v) => v.units === undefined), '未建册不含虚构单元字段');

/* ================= B. 已建册结构 ================= */
console.log('\n== B. 已建册结构 ==');
const unitIds = units.map((u) => u.id);
const lessonIds = units.flatMap((u) => u.lessons.map((l) => l.id));
const kids = units.flatMap((u) => u.lessons.flatMap((l) => l.knowledge.map((k) => k.id)));
assert(new Set(unitIds).size === unitIds.length, `单元 id 唯一（${unitIds.length} 个）`);
assert(new Set(lessonIds).size === lessonIds.length, `课 id 唯一（${lessonIds.length} 个）`);
assert(new Set(kids).size === kids.length, `知识点 id 唯一（${kids.length} 个）`);
assert(COURSE_LIKE_ORDER(), '单元 order 单调且无重复');
function COURSE_LIKE_ORDER() {
  const orders = units.map((u) => u.order).sort((a, b) => a - b);
  return orders.every((o, i) => o === i + 1);
}
// 先修链：只记录、引用必须存在、无环
const kidSet = new Set(kids);
const prereqOk = units.every((u) => u.lessons.every((l) => l.knowledge.every(
  (k) => (k.prerequisites || []).every((p) => kidSet.has(p))
)));
assert(prereqOk, '先修引用全部指向已建册知识点（prerequisites 仍只记录、不参与计算）');
const graph = new Map();
units.forEach((u) => u.lessons.forEach((l) => l.knowledge.forEach(
  (k) => graph.set(k.id, k.prerequisites || [])
)));
function hasCycle() {
  const state = new Map(); // 0 未访问 1 栈上 2 完成
  const visit = (id) => {
    if (state.get(id) === 1) return true;
    if (state.get(id) === 2) return false;
    state.set(id, 1);
    for (const p of graph.get(id) || []) if (visit(p)) return true;
    state.set(id, 2);
    return false;
  };
  for (const id of graph.keys()) if (visit(id)) return true;
  return false;
}
assert(!hasCycle(), '先修链无环');
// 内容门禁 R3 只报告（P2 才判定）
const specCovered = kids.filter((k) => UNIT_SPECS[k.replace(/-k\d+$/, '')] || UNIT_SPECS[k]);
console.log(`  · specId 覆盖：${specCovered.length}/${kids.length} 个 kid 已有规格书（P2 内容门禁，P0 不判定）`);

/* ================= C. 册归属 ================= */
console.log('\n== C. 册归属（跨册错挂）==');
let misplaced = 0;
for (const u of units) {
  if (u.metaGrade !== u._volume.grade || u.metaTerm !== u._volume.term) {
    misplaced += 1;
    console.log(`  ✗ ${u.id} 声明 ${u.metaGrade}${u.metaTerm}，却在 ${u._volume.grade}${u._volume.term} 册`);
  }
}
assert(misplaced === 0, `跨册错挂 = ${misplaced}`);
volumes.forEach((v) => {
  assert(v.edition === EDITION_ID && ['math', 'chinese', 'english'].includes(v.subject) && v.grade && v.term,
    `${v.key}：册元数据 ${v.edition} / ${v.subject} / ${v.grade} / ${v.term}`);
});

/* ================= D. id 规范与别名 ================= */
console.log('\n== D. id 规范与别名 ==');
const aliases = buildAliasMap(volumes);
const problems = checkAliasMap(aliases);
assert(problems.length === 0, `别名表 1:1 无冲突${problems.length ? `（${problems.join('；')}）` : ''}`);
assert(Object.keys(aliases.units).length === unitIds.length
  && Object.keys(aliases.lessons).length === lessonIds.length
  && Object.keys(aliases.knowledge).length === kids.length,
  `别名覆盖 单元 ${Object.keys(aliases.units).length} / 课 ${Object.keys(aliases.lessons).length} / 知识点 ${Object.keys(aliases.knowledge).length}`);
assert(Object.values(aliases.knowledge).every((v) => /^rj-(math|chinese|english)-g\d-(up|down)-u\d{2}-l\d{2}-k\d{2}$/.test(v)),
  `规范 kid 形如 rj-math-g3-up-u01-l01-k01 / rj-chinese-g1-up-u01-l01-k01 / rj-english-g3-up-u01-l01-k01（${ID_SPEC_VERSION}）`);

/* ================= E. 迁移证据（生产代码） ================= */
console.log('\n== E. 掌握度 id 迁移证据 ==');
const mastery = await import('../assets/js/core/mastery.js');
const legacyKids = kids.slice();
const data = {
  mastery: { v: 1, keys: {}, masteredAt: {}, reviewAt: {}, aliases: {}, archive: {} },
  masteryTrend: {},
  reviewQueue: {},
  contentGaps: {}
};
legacyKids.forEach((kid, i) => {
  data.mastery.keys[kid] = {
    status: i % 3 === 0 ? 'mastered' : i % 3 === 1 ? 'learning' : 'review',
    seen: 5 + i,
    correct: 3 + (i % 5),
    lastSeen: '2026-07-01',
    streak: i % 3
  };
  if (i % 3 === 0) data.mastery.masteredAt[kid] = '2026-07-02';
  if (i % 3 === 2) data.mastery.reviewAt[kid] = '2026-07-03';
  data.contentGaps[kid] = { first: '2026-07-01', last: '2026-07-02', count: 2, reason: 'no-variant' };
  for (let d = 0; d < 100; d += 1) {
    const dt = new RealDate(BASE + d * 86400000);
    const date = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    data.masteryTrend[date] = { ...(data.masteryTrend[date] || {}), [kid]: 40 + (i % 50) };
  }
});
data.reviewQueue['2026-07-04'] = legacyKids.map((kid) => `${kid}~0~aaaaa~bbbbb~n~1`);

function snap(d) {
  const m = d.mastery;
  const kidsNow = Object.keys(m.keys);
  const sum = kidsNow.reduce((s, k) => ({ seen: s.seen + m.keys[k].seen, correct: s.correct + m.keys[k].correct }), { seen: 0, correct: 0 });
  const statuses = kidsNow.map((k) => m.keys[k].status).join('|');
  const trendVals = Object.entries(d.masteryTrend).map(([date, row]) => `${date}:${Object.values(row).length}`).sort();
  return {
    count: kidsNow.length,
    sum,
    statuses,
    trendRows: trendVals.length,
    trendPoints: Object.values(d.masteryTrend).reduce((s, row) => s + Object.keys(row).length, 0),
    gaps: Object.keys(d.contentGaps).length,
    aliases: Object.keys(m.aliases).length,
    queueKids: Object.values(d.reviewQueue).flat().map((e) => String(e).split('~')[0])
  };
}

const before = snap(data);
const beforeTrendValues = Object.entries(data.masteryTrend).map(([d, row]) => `${d}:${legacyKids.map((k) => row[k]).join(',')}`).join('|');
legacyKids.forEach((kid) => mastery.migrateKnowledgeId(data, kid, aliases.knowledge[kid]));
const after = snap(data);
const afterTrendValues = Object.entries(data.masteryTrend).map(([d, row]) => `${d}:${legacyKids.map((k) => row[aliases.knowledge[k]]).join(',')}`).join('|');

console.log(`  迁移前：kid ${before.count} 个 / seen ${before.sum.seen} / correct ${before.sum.correct} / 缺口 ${before.gaps} / 别名 ${before.aliases}`);
console.log(`  迁移后：kid ${after.count} 个 / seen ${after.sum.seen} / correct ${after.sum.correct} / 缺口 ${after.gaps} / 别名 ${after.aliases}`);
assert(before.count === kids.length && after.count === kids.length, `迁移前后 kid 数一致（${before.count} → ${after.count}）`);
assert(before.sum.seen === after.sum.seen && before.sum.correct === after.sum.correct,
  `累积值一致（seen ${before.sum.seen}→${after.sum.seen}，correct ${before.sum.correct}→${after.sum.correct}）`);
assert(before.statuses === after.statuses, '状态集合一致（mastered / learning / review 不丢）');
assert(before.trendRows === after.trendRows && before.trendPoints === after.trendPoints,
  `100 天曲线连续（${before.trendPoints} 个点 → ${after.trendPoints}）`);
assert(beforeTrendValues === afterTrendValues, '曲线数值逐日一致（只换键名，不改值）');
assert(after.gaps === kids.length, `内容缺口不丢（${before.gaps} → ${after.gaps}）`);
const isCanonicalKid = (k) => /^rj-(math|chinese|english)-/.test(k);
assert(Object.keys(data.contentGaps).every(isCanonicalKid), '内容缺口台账同步改写为规范 id');
assert(after.aliases === kids.length, `别名全部登记（${after.aliases} 条）`);
assert(after.queueKids.every(isCanonicalKid), '复习队列条目同步改写为规范 id');
assert(Object.keys(data.mastery.keys).every(isCanonicalKid), '迁移后不再残留 legacy key');

console.log(`\n=== 汇总：${pass} 通过 / ${fail} 失败 ===`);
if (fail) process.exitCode = 1;
