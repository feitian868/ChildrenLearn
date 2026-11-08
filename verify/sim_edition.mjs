/**
 * sim_edition.mjs —— P0 版本一致性 / 跨年级错挂
 *
 * 跑法：node verify/sim_edition.mjs
 * 覆盖：
 *   A. 出处由结构化索引生成：每册单元的 source == sourceOf(册, 单元名)
 *   B. 挂接严格按索引：source 或 topic 任一不符 → 不挂（不再按 topic 猜）
 *   C. 跨年级错挂 = 0：题自带 source 的年级/册次必须与所挂单元的册一致
 *   D. 跨科不串：语/英/科题库进数学课程表必须全部返回 null
 *   E. 英语两套 sub-track 不合并（1~2 新起点 / 3~6 PEP）
 *   F. courseScope 兼容 v4 短 id 与 v5 规范 id
 */
import { loadBuiltVolumes, listVolumes } from '../assets/js/data/course/index.js';
import { sourceOf, SUBJECT_PROFILES } from '../assets/js/data/course/edition-profile.js';
import { COURSE_UNITS, annotateQuestion, courseScope, resolveUnitId } from '../assets/js/data/course-map.js';
import { mathPool } from '../assets/js/data/knowledge-math.js';
import { CHINESE_BANK } from '../assets/js/data/knowledge-chinese.js';
import { specPoolOfGrade as zhSpecPoolOfGrade } from '../assets/js/data/course/specs-chinese.js';
import { specPoolOfGrade as enSpecPoolOfGrade, ENGLISH_VOLUMES } from '../assets/js/data/course/specs-english.js';
import { ENGLISH_BANK } from '../assets/js/data/knowledge-english.js';
import { SCIENCE_BANK } from '../assets/js/data/knowledge-science.js';
import { mulberry32, hashString } from '../assets/js/core/rng.js';

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.log(`  ✗ FAIL: ${msg}`); }
}

const volumes = await loadBuiltVolumes();

/* ================= A. source 由索引生成 ================= */
console.log('\n== A. source 由索引生成 ==');
let badSource = 0;
volumes.forEach((v) => v.units.forEach((u) => {
  const generated = sourceOf(v, u.name);
  const inMap = COURSE_UNITS.find((x) => x.id === u.id)?.source;
  if (generated !== inMap) {
    badSource += 1;
    console.log(`  ✗ ${u.id}: 索引 ${generated} ≠ 课程表 ${inMap}`);
  }
}));
assert(badSource === 0, `已建册 ${volumes.length} 册 / ${COURSE_UNITS.length} 单元出处全部由索引生成`);

/* ================= B. 挂接严格按索引 ================= */
console.log('\n== B. 挂接严格按索引 ==');
const sample = COURSE_UNITS[0];
const lesson0 = sample.lessons[0];
assert(annotateQuestion({ source: sample.source, topic: lesson0.topic })?.unitId === sample.id, 'source + topic 一致 → 正常挂接');
assert(annotateQuestion({ source: '人教版数学9年级上册 · 不存在的单元', topic: lesson0.topic }) === null, 'topic 对但 source 不符 → 不挂');
assert(annotateQuestion({ source: sample.source, topic: '不存在的主题' }) === null, 'source 对但 topic 不符 → 不挂');

/* ================= C. 跨年级错挂 ================= */
console.log('\n== C. 跨年级 / 跨册错挂 ==');
const PARSE = /人教版数学(\d)年级(上|下)册/;
let annotatedTotal = 0;
let mismatched = 0;
let reviewMaterial = 0;
for (let grade = 1; grade <= 6; grade += 1) {
  const pool = mathPool(grade, mulberry32(hashString(`edition-check:${grade}`)));
  pool.forEach((q) => {
    const info = annotateQuestion(q);
    if (!info) return;
    annotatedTotal += 1;
    const m = PARSE.exec(q.source || '');
    if (!m) { mismatched += 1; return; }
    if (Number(m[1]) !== info.grade || m[2] !== info.term.slice(0, 1)) {
      mismatched += 1;
      console.log(`  ✗ ${q.id} source=${q.source} → ${info.volumeKey}（题 ${grade} 年级池）`);
    }
    // 降年级复习素材：出处年级 < 当前年级池，属于「已学内容回练」，不是错挂
    if (Number(m[1]) !== q.grade) reviewMaterial += 1;
  });
}
console.log(`  可挂接题目 ${annotatedTotal} 道；其中跨年级复习素材 ${reviewMaterial} 道（出处年级 ≠ 当前年级池，挂到出处自己的册，不算错挂）`);
assert(mismatched === 0, `数学跨年级 / 跨册错挂 = ${mismatched}`);

// 语文规格题同口径
const ZH_PARSE = /统编版语文(\d)年级(上|下)册/;
let zhAnnotated = 0;
let zhMismatch = 0;
for (let grade = 1; grade <= 6; grade += 1) {
  const pool = zhSpecPoolOfGrade(grade, mulberry32(hashString(`edition-zh:${grade}`)));
  pool.forEach((q) => {
    const info = annotateQuestion(q);
    if (!info) { zhMismatch += 1; return; }
    zhAnnotated += 1;
    const m = ZH_PARSE.exec(q.source || '');
    if (!m || Number(m[1]) !== info.grade || m[2] !== info.term.slice(0, 1)) {
      zhMismatch += 1;
      console.log(`  ✗ ${q.id} source=${q.source} → ${info.volumeKey}`);
    }
    if (q.grade !== info.grade || q.term !== info.term) zhMismatch += 1;
  });
}
assert(zhMismatch === 0, `语文跨年级 / 跨册错挂 = ${zhMismatch}（可挂接 ${zhAnnotated} 道）`);

// 英语规格题（两套 sub-track）同口径
const EN_PARSE = /人教\s*(?:新起点|PEP)\s*英语(\d)年级(上|下)册/;
let enAnnotated = 0;
let enMismatch = 0;
for (let grade = 1; grade <= 6; grade += 1) {
  const pool = enSpecPoolOfGrade(grade, mulberry32(hashString(`edition-en:${grade}`)));
  pool.forEach((q) => {
    const info = annotateQuestion(q);
    if (!info) { enMismatch += 1; return; }
    enAnnotated += 1;
    const m = EN_PARSE.exec(q.source || '');
    if (!m || Number(m[1]) !== info.grade || m[2] !== info.term.slice(0, 1)) {
      enMismatch += 1;
      console.log(`  ✗ ${q.id} source=${q.source} → ${info.volumeKey}`);
    }
    if (q.grade !== info.grade || q.term !== info.term) enMismatch += 1;
    if (!info.volumeKey.startsWith('english:')) enMismatch += 1;
  });
}
assert(enMismatch === 0, `英语跨年级 / 跨册 / 跨科错挂 = ${enMismatch}（可挂接 ${enAnnotated} 道）`);

/* ================= D. 跨科不串 ================= */
console.log('\n== D. 跨科不串（数学 / 语文 / 英语各挂各的）==');
const mathAnnotated = mathPool(3, mulberry32(hashString('edition-check:cross:math')))
  .map((q) => ({ q, info: annotateQuestion(q) })).filter((x) => x.info);
const mathLeak = mathAnnotated.filter((x) => !x.info.volumeKey.startsWith('math:'));
assert(mathLeak.length === 0, `数学题只挂数学单元（样本 ${mathAnnotated.length} 道，越界 ${mathLeak.length} 道）`);

const zhSpecs = zhSpecPoolOfGrade(3, mulberry32(hashString('edition-check:cross:chinese')));
const zhAttached = zhSpecs.map((q) => ({ q, info: annotateQuestion(q) }));
const zhLeak = zhAttached.filter((x) => !x.info || !x.info.volumeKey.startsWith('chinese:'));
assert(zhLeak.length === 0, `语文规格题只挂语文单元（样本 ${zhSpecs.length} 道，越界 ${zhLeak.length} 道）`);

const enSpecs = enSpecPoolOfGrade(3, mulberry32(hashString('edition-check:cross:english')));
const enAttached = enSpecs.map((q) => ({ q, info: annotateQuestion(q) }));
const enLeak = enAttached.filter((x) => !x.info || !x.info.volumeKey.startsWith('english:'));
assert(enLeak.length === 0, `英语规格题只挂英语单元（样本 ${enSpecs.length} 道，越界 ${enLeak.length} 道）`);

const zhBank = CHINESE_BANK.slice(0, 60).map((q) => ({ q, info: annotateQuestion(q) }));
const bankLeak = zhBank.filter((x) => x.info && !x.info.volumeKey.startsWith('chinese:'));
assert(bankLeak.length === 0, `语文旧题库不挂进数学单元（样本 ${zhBank.length} 道，越界 ${bankLeak.length} 道）`);
const zhBankMounted = zhBank.filter((x) => x.info).length;
console.log(`  · 语文旧题库样本挂接 ${zhBankMounted}/${zhBank.length} 道（无单元出处的题目不挂，属正常）`);

// 旧英/科题库不挂任何单元；英语规格题走自己那一册（上面已单独验证）
const foreign = [
  ...ENGLISH_BANK.slice(0, 40),
  ...SCIENCE_BANK.slice(0, 40)
];
const foreignMounted = foreign.filter((q) => annotateQuestion(q));
assert(foreignMounted.length === 0, `旧英/科题库 ${foreign.length} 道样本不进课程表 = ${foreignMounted.length}`);

/* ================= E. 英语两套 track ================= */
console.log('\n== E. 英语两套 track ==');
const catalog = listVolumes();
const eng = catalog.filter((v) => v.subject === 'english');
assert(eng.length === 12, `英语 ${eng.length} 册`);
const trackOfGrade = (g) => eng.filter((v) => v.grade === g).map((v) => v.track);
assert(trackOfGrade(1).every((t) => t === 'newstart') && trackOfGrade(2).every((t) => t === 'newstart'),
  '1~2 年级全部 newstart（人教新起点）');
assert([3, 4, 5, 6].every((g) => trackOfGrade(g).every((t) => t === 'pep')), '3~6 年级全部 pep');
assert([1, 2, 3, 4, 5, 6].every((g) => new Set(trackOfGrade(g)).size === 1), '同一册次内不混两套 track');
assert(SUBJECT_PROFILES.english.tracks[3] === 'pep' && SUBJECT_PROFILES.english.tracks[2] === 'newstart',
  'profile 与目录口径一致');

// 已建册实体的 track 与规格题挂载都不跨 sub-track
assert(ENGLISH_VOLUMES.length === 12, `已建英语实体 ${ENGLISH_VOLUMES.length} 册`);
const trackBad = ENGLISH_VOLUMES.filter((v) => v.track !== SUBJECT_PROFILES.english.tracks[v.grade]);
assert(trackBad.length === 0, `12 册实体 track 与 profile 一致（不符 ${trackBad.map((v) => `${v.grade}${v.term}`).join('、') || 0}）`);
let crossTrack = 0;
for (const volume of ENGLISH_VOLUMES) {
  const pool = enSpecPoolOfGrade(volume.grade, mulberry32(hashString(`edition-track:${volume.grade}:${volume.term}`)));
  pool.forEach((q) => {
    const info = annotateQuestion(q);
    if (info && info.grade !== volume.grade) crossTrack += 1;
  });
}
assert(crossTrack === 0, `英语题不跨年级挂载（越界 ${crossTrack} 道）`);

/* ================= F. courseScope 兼容两种 id ================= */
console.log('\n== F. courseScope 兼容 legacy / canonical ==');
const scoped = courseScope({ subject: 'math', currentUnitId: 'ma-u05', learnedUnits: [] }, 'math');
const canonicalScoped = courseScope({ subject: 'math', currentUnitId: 'rj-math-g3-up-u02', learnedUnits: [] }, 'math');
assert(scoped?.currentUnitId === 'ma-u05' && scoped.allowed.size === 5, `v4 短 id：当前 5 → 允许 ${scoped?.allowed.size} 个`);
assert(canonicalScoped?.currentUnitId === 'ma-u05' && canonicalScoped.allowed.size === scoped.allowed.size,
  `v5 规范 id：rj-math-g3-up-u02 解析为 ${canonicalScoped?.currentUnitId}，允许 ${canonicalScoped?.allowed.size} 个`);
assert(resolveUnitId('rj-math-g3-up-u02') === 'ma-u05', '规范 id → 旧存档单元 id 映射正确');

console.log(`\n=== 汇总：${pass} 通过 / ${fail} 失败 ===`);
if (fail) process.exitCode = 1;
