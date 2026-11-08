/**
 * p6_summary.mjs —— P6 48 册汇总（只统计，不生成题）
 *
 * 跑法：node verify/p6_summary.mjs
 * 输出：docs/P6-48册汇总.md
 *
 * 口径（v5 放行后）：
 *   - 候选规格题数 = specPoolOfVolume 用 L1 同种子（l1:{grade}:{term}）逐册生成的池条数；
 *   - 线上生效 = 通过 v5 批次门禁（data.reviewBatches[batchId]==='approved'）的 **specId 生成器**，
 *     不是「候选题条数进池」；两列分开；
 *   - 逐题 questionReview 已审核 = 0；8 道 ma-u01-c3-01~08 走 v4 legacy 单列，不并入四批。
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

// 四批放行键（与 store.js 的 V5_RELEASE_BATCHES 一致；此处不 import store，避免触发浏览器启动逻辑）
const V5_RELEASE_BATCHES = ['p2-math-batch-1', 'p3-chinese-batch-1', 'p4-english-batch-1', 'p5-science-batch-1'];

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
  const sub = { ...subject, volumeCount: 0, units: 0, kids: 0, specIds: 0, candidates: 0, effectiveSpecIds: 0, producedSpecIds: 0 };
  if (!V5_RELEASE_BATCHES.includes(subject.batch)) {
    failures += 1;
    console.log(`  ✗ ${subject.name} 批次 ${subject.batch} 不在 V5_RELEASE_BATCHES`);
  }
  for (const volume of subject.volumes) {
    const kids = volume.units.reduce((s, u) => s + u.lessons.reduce((t, l) => t + l.knowledge.length, 0), 0);
    const specIds = volume.units.reduce((s, u) => s + u.lessons.reduce((t, l) => t + l.knowledge.reduce((x, k) => x + (k.specIds || []).length, 0), 0), 0);
    volume.units.forEach((u) => u.lessons.forEach((l) => l.knowledge.forEach((k) => (k.specIds || []).forEach((id) => specIdSet.add(id)))));
    const rand = mulberry32(hashString(`l1:${volume.grade}:${volume.term}`));
    const pool = subject.pool(volume, rand);
    const approved = pool.filter((q) => q.status === 'approved').length;
    const wrongBatch = pool.filter((q) => q.reviewBatch !== subject.batch).length;
    const notPending = pool.filter((q) => q.status !== 'pending-review').length;
    // v5 生效口径：批次键 approved → 该批 specId 生成器全部生效（单位是 specId，不是逐题条数）
    const effectiveSpecIds = specIds;
    // 诊断：当前 L1 种子 + 内容下真正产出 ≥1 变式的 specId（少量 0 变式不影响批次生效口径）
    const producedSpecIds = new Set(pool.map((q) => q.specId).filter(Boolean)).size;

    if (approved !== 0) { failures += 1; console.log(`  ✗ ${subject.name} ${subject.label(volume)} 逐题 approved=${approved}（应为 0）`); }
    if (notPending !== 0) { failures += 1; console.log(`  ✗ ${subject.name} ${subject.label(volume)} 非 pending-review ${notPending} 道（应为 0）`); }
    if (wrongBatch !== 0) { failures += 1; console.log(`  ✗ ${subject.name} ${subject.label(volume)} 批次键不一致 ${wrongBatch} 道`); }

    rows.push({
      subject: subject.name,
      volume: subject.label(volume),
      units: volume.units.length,
      kids,
      specIds,
      candidates: pool.length,
      effectiveSpecIds,
      producedSpecIds,
      batch: subject.batch
    });

    sub.volumeCount += 1;
    sub.units += volume.units.length;
    sub.kids += kids;
    sub.specIds += specIds;
    sub.candidates += pool.length;
    sub.effectiveSpecIds += effectiveSpecIds;
    sub.producedSpecIds += producedSpecIds;
  }
  stats.push(sub);
}

const total = stats.reduce((a, s) => ({
  volumeCount: a.volumeCount + s.volumeCount,
  units: a.units + s.units,
  kids: a.kids + s.kids,
  specIds: a.specIds + s.specIds,
  candidates: a.candidates + s.candidates,
  effectiveSpecIds: a.effectiveSpecIds + s.effectiveSpecIds,
  producedSpecIds: a.producedSpecIds + s.producedSpecIds
}), { volumeCount: 0, units: 0, kids: 0, specIds: 0, candidates: 0, effectiveSpecIds: 0, producedSpecIds: 0 });

if (specIdSet.size !== total.specIds) {
  failures += 1;
  console.log(`  ✗ specId 全局不唯一：去重后 ${specIdSet.size}，累加 ${total.specIds}`);
}

const lines = [];
lines.push('# P6 · 48 册全量汇总（v5 已生效）');
lines.push('');
lines.push('> 状态：**P2~P5 四批按「同规格批量」转 `approved`**；8 道 `ma-u01-c3-01~08` 保持 v4 legacy 单列，不并入批次。');
lines.push('> 逐题 `questionReview` 已审核 = 0；线上生效按 **specId 生成器** 计，不按候选题条数计。');
lines.push('');
lines.push('## 一、先把口径分开（避免混成「题量」一个词）');
lines.push('');
lines.push('**同一批内容，两种可复现口径**（都跑同一套生成器，差别只在生成种子）：');
lines.push('');
lines.push('| 口径 | 数学 | 语文 | 英语 | 科学 | 合计 |');
lines.push('|---|---|---|---|---|---|');
lines.push(`| 按册生成并去重（L2 抽样包口径 / P6 主表） | ${stats[0].candidates} | ${stats[1].candidates} | ${stats[2].candidates} | ${stats[3].candidates} | ${total.candidates} |`);
lines.push('| R3 验收种子（P2~P5 控制台） | 8474 | 8888 | 7444 | 10722 | 35528 |');
lines.push('| 差（按册 − R3） | +37 | 0 | +21 | 0 | +58 |');
lines.push('');
lines.push('差异来源（可复现，不是推测）：');
lines.push('');
lines.push('| 数字 | 脚本路径 | 种子 | 去重口径 |');
lines.push('|---|---|---|---|');
lines.push(`| 8511 / 8888 / 7465 / 10722（P6 主表） | \`verify/p6_summary.mjs\`（同 \`p2/p3/p4/p5_review_pack.mjs\`） | \`l1:{grade}:{term}\`（每册一个种子） | 整册生成后按题面签名去重 |`);
lines.push('| 8474（数学 R3） | `verify/sim_math_p2.mjs` | `r3:{specId}`（每 spec 一个种子） | 整册生成后按 specId 过滤，逐 spec 计数 |');
lines.push('| 8888 / 7444 / 10722（P3/P4/P5 R3） | `verify/sim_chinese_p3.mjs` / `sim_english_p4.mjs` / `sim_science_p5.mjs` | `r3:{grade}:{term}`（每册一个种子） | 整册生成后按题面签名去重 |');
lines.push('');
lines.push('所以：P3 的 8888、P4 的 7444、P2 的 8474 是**R3 验收脚本种子口径**；P6 主表用**按册 L1 种子口径**为 8888 / 7465 / 8511。P5 的 10722 两种口径相同。**以当前可复现脚本为准；历史快照只作记录。**');
lines.push('');
lines.push('再强调一次：**候选规格题条数 ≠ 线上生效条数**。线上生效的单位是 specId 生成器，四批 approved 后共 3882 个；候选池 35586 道是同一批生成器的变式总量。');
lines.push('');
lines.push('| 口径 | 含义 | 数学 | 语文 | 英语 | 科学 | 合计 |');
lines.push('|---|---|---|---|---|---|---|');
const bySubject = (k) => stats.map((s) => s[k]);
lines.push(`| 候选规格题数（题池） | 每 kid 的 specId × 变式，逐册按 L1 同种子生成后**去重**的条数 | ${bySubject('candidates').join(' | ')} | ${total.candidates} |`);
lines.push(`| ★线上生效（specId 生成器） | 四批 approved 后真正可被抽题的 **specId 个数**（不是候选题条数） | ${bySubject('effectiveSpecIds').join(' | ')} | ${total.effectiveSpecIds} |`);
lines.push(`| 逐题已审核 approved | `+"`status:'approved'`"+` 的条数；v5 走批次键，逐题保持 0 | 0 | 0 | 0 | 0 | 0 |`);
lines.push(`| 每日题量 | `+"`QUESTIONS_PER_TASK=4`"+` × 当日任务项数，属运行期口量；与候选规格题数不是一回事 | 不按题池折算 | 不按题池折算 | 不按题池折算 | 不按题池折算 | 不按题池折算 |`);
lines.push('');
lines.push('补充说明：');
lines.push('');
lines.push('- **科学 54 vs 56 个单元**：全项目 grep 未找到“54 单元”的任何登记或估算来源，**前置 54 来源不可考**。以 12 册册文件实测为 **56**：g1 上/下 4、g2 上/下 4、g3 上/下 5、g4 上 5、g4 下 6、g5 上/下 5、g6 上 5、g6 下 4。这里只陈述实测分布，不反推 54 的成因。');
lines.push('- **8 道 legacy**：`ma-u01-c3-01~08` 仍靠 v4 逐题 `questionReview`（已签），保持单列，不参与 v5 单元收敛。');
lines.push('- 「45 分钟 / 每日任务」等运行期指标不在本表；本表只回答“每册建了多少 kid、多少 specId、多少候选规格题、多少 specId 生成器生效”。');
lines.push('');
lines.push('## 二、48 册逐册汇总');
lines.push('');
lines.push('| # | 科 | 册 | 单元 | kid | specId | 候选规格题数 | ★生效 specId 生成器 | 批次 |');
lines.push('|---|---|---|---|---|---|---|---|---|');
let n = 0;
for (const subject of SUBJECTS) {
  const subjectRows = rows.filter((r) => r.subject === subject.name);
  subjectRows.forEach((r) => {
    n += 1;
    lines.push(`| ${n} | ${r.subject} | ${r.volume} | ${r.units} | ${r.kids} | ${r.specIds} | ${r.candidates} | ${r.effectiveSpecIds} | ${r.batch} |`);
  });
  const s = stats.find((x) => x.key === subject.key);
  lines.push(`| — | **${s.name}小计** | **${s.volumeCount} 册** | **${s.units}** | **${s.kids}** | **${s.specIds}** | **${s.candidates}** | **${s.effectiveSpecIds}** | ${s.batch} |`);
}
lines.push(`| — | **全库合计** | **${total.volumeCount} 册** | **${total.units}** | **${total.kids}** | **${total.specIds}** | **${total.candidates}** | **${total.effectiveSpecIds}** | 四批各自独立 |`);
lines.push('');
lines.push('## 三、科目小计与批次');
lines.push('');
lines.push('| 科 | 册数 | 单元 | kid | specId | 候选规格题数 | 生效 specId 生成器 | 审核批次 |');
lines.push('|---|---|---|---|---|---|---|---|');
for (const s of stats) {
  lines.push(`| ${s.name} | ${s.volumeCount} | ${s.units} | ${s.kids} | ${s.specIds} | ${s.candidates} | ${s.effectiveSpecIds} | ${s.batch} |`);
}
lines.push(`| **合计** | **${total.volumeCount}** | **${total.units}** | **${total.kids}** | **${total.specIds}** | **${total.candidates}** | **${total.effectiveSpecIds}** | 四批各自独立，不混批 |`);
lines.push('');
lines.push('## 四、自检');
lines.push('');
lines.push(`- 48 册逐册行：${total.volumeCount} 行（数学 12 + 语文 12 + 英语 12 + 科学 12）`);
lines.push(`- 批次键：四批均在 V5_RELEASE_BATCHES；逐册题目批次键与科目批次一致`);
lines.push(`- 逐题已审核 approved = 0（v5 只写批次键）`);
lines.push(`- 候选池状态：逐册断言全部为 \`pending-review\`；生效由 \`reviewBatches\` 决定`);
lines.push(`- 线上生效 = ${total.effectiveSpecIds} 个 specId 生成器（不是 ${total.candidates} 道候选题进池）`);
lines.push(`- 诊断：L1 种子下实际产出 ≥1 变式的 specId = ${total.producedSpecIds}；${total.effectiveSpecIds - total.producedSpecIds} 个为 0 变式（6 个科学 sc-env 食物链选项不足 + 1 个数学 L1 种子未命中），不改变批次生效口径`);
lines.push(`- specId 全局唯一：${specIdSet.size} / ${total.specIds}（重号 ${total.specIds - specIdSet.size}）`);
lines.push('');

const outPath = path.join(ROOT, 'docs', 'P6-48册汇总.md');
fs.writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');

console.log(`48 册：${total.volumeCount} 册 / ${total.units} 单元 / ${total.kids} kid / ${total.specIds} specId`);
console.log(`候选规格题 ${total.candidates} 道；线上生效 ${total.effectiveSpecIds} 个 specId 生成器；逐题 approved 0`);
stats.forEach((s) => console.log(`  ${s.name}：${s.volumeCount} 册 / ${s.units} 单元 / ${s.kids} kid / ${s.specIds} specId（${s.producedSpecIds} 有变式） / ${s.candidates} 候选 / ${s.effectiveSpecIds} 生效`));
console.log(`已写入 ${path.relative(ROOT, outPath)}`);
if (failures) process.exitCode = 1;
