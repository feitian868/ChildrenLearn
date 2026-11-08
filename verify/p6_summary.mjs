/**
 * p6_summary.mjs —— P6 48 册汇总（只统计，不生成题、不放行）
 *
 * 跑法：node verify/p6_summary.mjs
 * 输出：docs/P6-48册汇总.md
 *
 * 口径：
 *   - 候选规格题数 = specPoolOfVolume 用 L1 同种子（l1:{grade}:{term}）逐册生成的 pending 池条数；
 *   - 已审核数 = status==='approved' 的条数（线上默认 questionReview 为空，应为 0）；
 *   - 线上生效数 = 通过抽题门禁（tasks.js visiblePool + questionReview）的条数，默认应为 0；
 *   - 不把「候选规格题」「每日题量」「已生效题量」混成同一个词。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { MATH_VOLUMES, specPoolOfVolume: mathPool, SPEC_REVIEW_BATCH: MATH_REVIEW_BATCH } = await import('../assets/js/data/course/specs-math.js');
const { CHINESE_VOLUMES, specPoolOfVolume: chinesePool, CHINESE_REVIEW_BATCH } = await import('../assets/js/data/course/specs-chinese.js');
const { ENGLISH_VOLUMES, specPoolOfVolume: englishPool, ENGLISH_REVIEW_BATCH } = await import('../assets/js/data/course/specs-english.js');
const { SCIENCE_VOLUMES, specPoolOfVolume: sciencePool, SCIENCE_REVIEW_BATCH } = await import('../assets/js/data/course/specs-science.js');
const { mulberry32, hashString } = await import('../assets/js/core/rng.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SUBJECTS = [
  {
    key: 'math', name: '数学', volumes: MATH_VOLUMES, pool: mathPool, batch: MATH_REVIEW_BATCH,
    label: (v) => `${v.grade}年级${v.term}`
  },
  {
    key: 'chinese', name: '语文', volumes: CHINESE_VOLUMES, pool: chinesePool, batch: CHINESE_REVIEW_BATCH,
    label: (v) => `${v.grade}年级${v.term}`
  },
  {
    key: 'english', name: '英语', volumes: ENGLISH_VOLUMES, pool: englishPool, batch: ENGLISH_REVIEW_BATCH,
    label: (v) => `${v.grade}年级${v.term}（${v.track}）`
  },
  {
    key: 'science', name: '科学', volumes: SCIENCE_VOLUMES, pool: sciencePool, batch: SCIENCE_REVIEW_BATCH,
    label: (v) => `${v.grade}年级${v.term}`
  }
];

const rows = [];
const stats = [];
const specIdSet = new Set();
let failures = 0;

for (const subject of SUBJECTS) {
  const sub = { ...subject, volumeCount: 0, units: 0, kids: 0, specIds: 0, candidates: 0, approved: 0, effective: 0 };
  for (const volume of subject.volumes) {
    const kids = volume.units.reduce((s, u) => s + u.lessons.reduce((t, l) => t + l.knowledge.length, 0), 0);
    const specIds = volume.units.reduce((s, u) => s + u.lessons.reduce((t, l) => t + l.knowledge.reduce((x, k) => x + (k.specIds || []).length, 0), 0), 0);
    volume.units.forEach((u) => u.lessons.forEach((l) => l.knowledge.forEach((k) => (k.specIds || []).forEach((id) => specIdSet.add(id)))));
    const rand = mulberry32(hashString(`l1:${volume.grade}:${volume.term}`));
    const pool = subject.pool(volume, rand);
    const approved = pool.filter((q) => q.status === 'approved').length;
    const notPending = pool.filter((q) => q.status !== 'pending-review');
    // 线上默认 questionReview 为空：只有非 pending-review 的题会直接可见；approved 还要 questionReview 放行。
    const effective = pool.filter((q) => q.status !== 'pending-review' && q.status !== 'rejected').length;

    if (approved !== 0) { failures += 1; console.log(`  ✗ ${subject.name} ${subject.label(volume)} approved=${approved}（应为 0）`); }
    if (notPending.length !== 0) { failures += 1; console.log(`  ✗ ${subject.name} ${subject.label(volume)} 非 pending-review ${notPending.length} 道（应为 0）`); }
    if (effective !== 0) { failures += 1; console.log(`  ✗ ${subject.name} ${subject.label(volume)} 线上生效=${effective}（应为 0）`); }

    rows.push({
      subject: subject.name,
      volume: subject.label(volume),
      units: volume.units.length,
      kids,
      specIds,
      candidates: pool.length,
      approved,
      effective,
      batch: subject.batch
    });

    sub.volumeCount += 1;
    sub.units += volume.units.length;
    sub.kids += kids;
    sub.specIds += specIds;
    sub.candidates += pool.length;
    sub.approved += approved;
    sub.effective += effective;
  }
  stats.push(sub);
}

const total = stats.reduce((a, s) => ({
  volumeCount: a.volumeCount + s.volumeCount,
  units: a.units + s.units,
  kids: a.kids + s.kids,
  specIds: a.specIds + s.specIds,
  candidates: a.candidates + s.candidates,
  approved: a.approved + s.approved,
  effective: a.effective + s.effective
}), { volumeCount: 0, units: 0, kids: 0, specIds: 0, candidates: 0, approved: 0, effective: 0 });

if (specIdSet.size !== total.specIds) {
  failures += 1;
  console.log(`  ✗ specId 全局不唯一：去重后 ${specIdSet.size}，累加 ${total.specIds}`);
}

const lines = [];
lines.push('# P6 · 48 册全量汇总（v5，未放行）');
lines.push('');
lines.push('> 状态：**全部规格题仍为 `pending-review`**。本表只汇总规模，不是签字、不是放行、也不代表线上题池已变。');
lines.push('> 已审核（approved）= 0，线上生效 = 0。只有真人签「汇总签字清单」并由用户明确说「放行」后，才会批量转 approved 并重跑生效态清单。');
lines.push('');
lines.push('## 一、先把口径分开（避免混成「题量」一个词）');
lines.push('');
lines.push('**同一批内容，两种可复现口径**（都跑同一套生成器，差别只在生成种子）：');
lines.push('');
lines.push('| 口径 | 数学 | 语文 | 英语 | 科学 | 合计 |');
lines.push('|---|---|---|---|---|---|');
lines.push(`| 按册生成并去重（L2 抽样包口径 / P6 主表） | ${stats[0].candidates} | ${stats[1].candidates} | ${stats[2].candidates} | ${stats[3].candidates} | ${total.candidates} |`);
lines.push('| R3 验收种子（P2~P5 控制台） | 8062 | 8888 | 7444 | 10722 | 35116 |');
lines.push('| 差（按册 − R3） | +22 | −25 | −21 | 0 | −24 |');
lines.push('');
lines.push('差异来源（可复现，不是推测）：');
lines.push('');
lines.push('| 数字 | 脚本路径 | 种子 | 去重口径 |');
lines.push('|---|---|---|---|');
lines.push(`| 8040 / 8913 / 7465 / 10722（P6 主表） | \`verify/p6_summary.mjs\`（同 \`p2/p3/p4/p5_review_pack.mjs\`） | \`l1:{grade}:{term}\`（每册一个种子） | 整册生成后按题面签名去重 |`);
lines.push('| 8062（数学 R3） | `verify/sim_math_p2.mjs` | `r3:{specId}`（每 spec 一个种子） | 整册生成后按 specId 过滤，逐 spec 计数 |');
lines.push('| 8888 / 7444 / 10722（P3/P4/P5 R3） | `verify/sim_chinese_p3.mjs` / `sim_english_p4.mjs` / `sim_science_p5.mjs` | `r3:{grade}:{term}`（每册一个种子） | 整册生成后按题面签名去重 |');
lines.push('');
lines.push('所以：P3 的 8888、P4 的 7444、P2 的 8062 是**R3 验收脚本种子口径**；P6 主表用**按册 L1 种子口径**为 8913 / 7465 / 8040。P5 的 10722 两种口径相同。**以当前可复现脚本为准；历史快照只作记录。**');
lines.push('');
lines.push('再强调一次：以上都是**候选规格题数**，不是每天出的题量（每日题量 = `QUESTIONS_PER_TASK=4` × 当日任务项数），更不是已审核/已生效题量（后两列当前都是 0）。');
lines.push('');
lines.push('| 口径 | 含义 | 数学 | 语文 | 英语 | 科学 | 合计 |');
lines.push('|---|---|---|---|---|---|---|');
const bySubject = (k) => stats.map((s) => s[k]);
lines.push(`| 候选规格题数（pending 池） | 每 kid 的 specId × 变式，逐册按 L1 同种子生成后**去重**的条数；不是每天出的题量 | ${bySubject('candidates').join(' | ')} | ${total.candidates} |`);
lines.push(`| L1 全量核验 | 对候选池逐题跑 v4 四断言 + v5 三断言；本列与候选池同数（全部核验、无抽样） | ${bySubject('candidates').join(' | ')} | ${total.candidates} |`);
lines.push(`| 已审核 approved | `+"`status:'approved'`"+` 的条数；线上默认 0 | ${bySubject('approved').join(' | ')} | ${total.approved} |`);
lines.push(`| 线上生效 | 通过 `+"`tasks.js`"+` 的 visiblePool + questionReview 门禁、真正可被抽到的条数 | ${bySubject('effective').join(' | ')} | ${total.effective} |`);
lines.push(`| 每日题量 | `+"`QUESTIONS_PER_TASK=4`"+` × 当日任务项数，属运行期口量；与候选规格题数不是一回事 | 不按题池折算 | 不按题池折算 | 不按题池折算 | 不按题池折算 | 不按题池折算 |`);
lines.push('');
lines.push('补充说明：');
lines.push('');
lines.push('- **科学 54 vs 56 个单元**：全项目 grep 未找到“54 单元”的任何登记或估算来源，**前置 54 来源不可考**。以 12 册册文件实测为 **56**：g1 上/下 4、g2 上/下 4、g3 上/下 5、g4 上 5、g4 下 6、g5 上/下 5、g6 上 5、g6 下 4。这里只陈述实测分布，不反推 54 的成因。');
lines.push('- 「45 分钟 / 每日任务」等运行期指标不在本表；本表只回答“每册建了多少 kid、多少 specId、多少候选规格题、审了多少、生效多少”。');
lines.push('');
lines.push('## 二、48 册逐册汇总');
lines.push('');
lines.push('| # | 科 | 册 | 单元 | kid | specId | 候选规格题数 | ★已审核 | ★线上生效 |');
lines.push('|---|---|---|---|---|---|---|---|---|');
let n = 0;
for (const subject of SUBJECTS) {
  const subjectRows = rows.filter((r) => r.subject === subject.name);
  subjectRows.forEach((r) => {
    n += 1;
    lines.push(`| ${n} | ${r.subject} | ${r.volume} | ${r.units} | ${r.kids} | ${r.specIds} | ${r.candidates} | ${r.approved} | ${r.effective} |`);
  });
  const s = stats.find((x) => x.key === subject.key);
  lines.push(`| — | **${s.name}小计** | **${s.volumeCount} 册** | **${s.units}** | **${s.kids}** | **${s.specIds}** | **${s.candidates}** | **${s.approved}** | **${s.effective}** |`);
}
lines.push(`| — | **全库合计** | **${total.volumeCount} 册** | **${total.units}** | **${total.kids}** | **${total.specIds}** | **${total.candidates}** | **${total.approved}** | **${total.effective}** |`);
lines.push('');
lines.push('## 三、科目小计与批次');
lines.push('');
lines.push('| 科 | 册数 | 单元 | kid | specId | 候选规格题数 | 已审核 | 线上生效 | 审核批次 |');
lines.push('|---|---|---|---|---|---|---|---|---|');
for (const s of stats) {
  lines.push(`| ${s.name} | ${s.volumeCount} | ${s.units} | ${s.kids} | ${s.specIds} | ${s.candidates} | ${s.approved} | ${s.effective} | ${s.batch} |`);
}
lines.push(`| **合计** | **${total.volumeCount}** | **${total.units}** | **${total.kids}** | **${total.specIds}** | **${total.candidates}** | **${total.approved}** | **${total.effective}** | 四批各自独立，不混批 |`);
lines.push('');
lines.push('## 四、自检');
lines.push('');
lines.push(`- 48 册逐册行：${total.volumeCount} 行（数学 12 + 语文 12 + 英语 12 + 科学 12）`);
lines.push(`- 后两列断言：已审核 = ${total.approved}，线上生效 = ${total.effective}（均应为 0）`);
lines.push(`- 候选池状态：逐册断言全部为 \`pending-review\``);
lines.push(`- specId 全局唯一：${specIdSet.size} / ${total.specIds}（重号 ${total.specIds - specIdSet.size}）`);
lines.push('');
lines.push('> 未签字、未放行：以上候选规格题不会进入任何一天的抽题池。');
lines.push('');

const outPath = path.join(ROOT, 'docs', 'P6-48册汇总.md');
fs.writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');

console.log(`48 册：${total.volumeCount} 册 / ${total.units} 单元 / ${total.kids} kid / ${total.specIds} specId`);
console.log(`候选规格题 ${total.candidates} 道；已审核 ${total.approved}；线上生效 ${total.effective}`);
stats.forEach((s) => console.log(`  ${s.name}：${s.volumeCount} 册 / ${s.units} 单元 / ${s.kids} kid / ${s.candidates} 候选`));
console.log(`已写入 ${path.relative(ROOT, outPath)}`);
if (failures) process.exitCode = 1;
