/**
 * p3_review_pack.mjs —— P3 语文批次审核包生成（L1 全量 + L2 抽样清单）
 *
 * 跑法：node verify/p3_review_pack.mjs
 * 输出：控制台摘要 + docs/P3-L2-抽样包.md
 *
 * 口径：
 *   - L1（v4 四断言 + v5 三断言）对【全部语文规格题】跑一遍，违规自动判废；
 *   - L2 抽样：每册 ≥10 道、每 kid 至少 1 道代表题；
 *   - 所有题目仍为 pending-review，线上题池不变；签字栏留空，必须真人签署；
 *   - L0/L1 只证明结构与断言，教材措辞与年级适配靠抽样签字；
 *     本包不出现「内容可靠 / 已验证科学性」字样。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { CHINESE_VOLUMES, specPoolOfVolume, CHINESE_REVIEW_BATCH } = await import('../assets/js/data/course/specs-chinese.js');
const { annotateQuestion } = await import('../assets/js/data/course-map.js');
const { checkQuestionV5 } = await import('../assets/js/data/question-check.js');
const { mulberry32, hashString } = await import('../assets/js/core/rng.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const answerText = (q) => (q.type === 'choice' && Array.isArray(q.options) ? String(q.options[q.answer]) : String(q.answer));

/* ---------- 全量 L1 ---------- */
let total = 0;
let kidCount = 0;
const rejected = [];
const allByVolume = new Map();
const shellByKid = new Map();
for (const volume of CHINESE_VOLUMES) {
  kidCount += volume.units.reduce((s, u) => s + u.lessons.reduce((t, l) => t + l.knowledge.length, 0), 0);
  const rand = mulberry32(hashString(`l1:${volume.grade}:${volume.term}`));
  const pool = specPoolOfVolume(volume, rand);
  allByVolume.set(`${volume.grade}${volume.term}`, pool);
  pool.forEach((q) => {
    total += 1;
    const v = checkQuestionV5(q);
    const info = annotateQuestion(q);
    if (!info || info.unitId !== q.unitId) v.push({ rule: 'annotate', detail: '课程索引挂接失败' });
    if (!shellByKid.has(q.knowledgeId)) shellByKid.set(q.knowledgeId, new Set());
    shellByKid.get(q.knowledgeId).add(q.specId);
    if (v.length) rejected.push({ id: q.id, specId: q.specId, violations: v });
  });
}

/* ---------- L2 抽样：每册 ≥10 道、每 kid ≥1 道 ---------- */
const sample = [];
for (const [label, pool] of allByVolume) {
  const byKid = new Map();
  pool.forEach((q) => {
    if (!byKid.has(q.knowledgeId)) byKid.set(q.knowledgeId, []);
    byKid.get(q.knowledgeId).push(q);
  });
  const list = [];
  byKid.forEach((items) => { list.push(items[0]); });
  let i = 1;
  while (list.length < 10) {
    const arr = [...byKid.values()][i % byKid.size] || [];
    const pickQ = arr[i % arr.length];
    if (pickQ && !list.includes(pickQ)) list.push(pickQ);
    i += 1;
  }
  sample.push({ volume: label, items: list });
}

const lowShellKid = [...shellByKid.entries()].filter(([, s]) => s.size < 3);

/* ---------- 报告 ---------- */
const lines = [];
lines.push(`# P3 语文批次审核包（批次 ${CHINESE_REVIEW_BATCH}）`);
lines.push('');
lines.push('> 本包用于 L2 批次抽样。签字仅表示**抽样通过**；教材措辞与年级适配需审核人自行判断。');
lines.push('> L0/L1 只证明结构与断言，不构成内容背书。');
lines.push('');
lines.push('## 一、L1 全量结果');
lines.push('');
lines.push(`- 规格题全量：**${total}** 道（12 册 / ${kidCount} kid / 每 kid ≥3 规格 × 8 变式）`);
lines.push(`- L1 判废：**${rejected.length}** 道`);
lines.push(`- 每 kid 外壳数不足 3 的 kid：**${lowShellKid.length}** 个`);
if (rejected.length) {
  lines.push('');
  lines.push('| id | 规格 | 违规 |');
  lines.push('|---|---|---|');
  rejected.slice(0, 60).forEach((r) => {
    lines.push(`| ${r.id} | ${r.specId} | ${r.violations.map((v) => `${v.rule}: ${v.detail}`).join('<br>')} |`);
  });
  if (rejected.length > 60) lines.push(`| … | 其余 ${rejected.length - 60} 道见控制台 | |`);
}
lines.push('');
lines.push('## 二、L2 抽样清单（每册 ≥10 道、每 kid ≥1 道）');
lines.push('');
lines.push('> 全部样题状态：`pending-review`；线上题池不变，真人签字前不生效。');
sample.forEach((s) => {
  lines.push('');
  lines.push(`### ${s.volume}（抽样 ${s.items.length} 道）`);
  lines.push('');
  lines.push('| id | kid | specId | 问法 | 题目 | 答案 | 解析 |');
  lines.push('|---|---|---|---|---|---|---|');
  s.items.forEach((q) => {
    lines.push(`| ${q.id} | ${q.knowledgeId} | ${q.specId} | ${q.askPattern} | ${q.prompt.replace(/\|/g, '｜')} | ${answerText(q)} | ${String(q.explain).replace(/\|/g, '｜')} |`);
  });
});
lines.push('');
lines.push('## 三、P2 遗留 8 道的位置');
lines.push('');
lines.push('- v4 待审题 `ma-u01-c3-01 ~ 08` 已并入 P2 批次抽样包（docs/P2-L2-抽样包.md 第三节），不重复列入本语文批次。');
lines.push('');
lines.push('## 四、签字');
lines.push('');
lines.push(`- [ ] 家长/审核人已抽样阅读上表，同意按「同规格批量放行」把 ${CHINESE_REVIEW_BATCH} 其余同规格题转 approved`);
lines.push('- 审核人（真人签名）：__________  日期：__________');
lines.push('');
lines.push('> 未签字前，本批次全部题目保持 `pending-review`，线上题池不含本批内容。');
lines.push('');

const outPath = path.join(ROOT, 'docs', 'P3-L2-抽样包.md');
fs.writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');

console.log(`规格题全量 ${total} 道，L1 判废 ${rejected.length} 道`);
rejected.slice(0, 20).forEach((r) => console.log(`  ✗ ${r.id} (${r.specId}) ${r.violations.map((v) => v.rule).join('、')}`));
console.log(`L2 抽样：${sample.reduce((s, x) => s + x.items.length, 0)} 道 / ${sample.length} 册`);
console.log(`外壳不足 kid：${lowShellKid.length} 个`);
console.log(`审核包已写入 ${path.relative(ROOT, outPath)}`);
if (rejected.length || lowShellKid.length) process.exitCode = 1;
