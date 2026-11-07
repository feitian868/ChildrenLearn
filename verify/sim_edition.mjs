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
assert(mismatched === 0, `跨年级 / 跨册错挂 = ${mismatched}`);

/* ================= D. 跨科不串 ================= */
console.log('\n== D. 跨科不串 ==');
const foreign = [
  ...CHINESE_BANK.slice(0, 40),
  ...ENGLISH_BANK.slice(0, 40),
  ...SCIENCE_BANK.slice(0, 40)
];
const foreignMounted = foreign.filter((q) => annotateQuestion(q));
assert(foreignMounted.length === 0, `语/英/科 ${foreign.length} 道样本挂进数学课程表 = ${foreignMounted.length}`);

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
