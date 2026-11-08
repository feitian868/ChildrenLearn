/**
 * p6_merge_packs.mjs —— 把 P2/P3/P4/P5 四份 L2 抽样包合并成一份汇总签字清单
 *
 * 跑法：node verify/p6_merge_packs.mjs
 * 输出：docs/P6-汇总签字清单.md
 *
 * 说明：
 *   - 用户原话点的是 P3/P4/P5 三份；但 48 册要齐，P2 数学 12 册也必须并入，
 *     否则“每册代表题”缺 12 册；8 道 v4 遗留题本就在 P2 包里，单独抽成一节。
 *   - 每册的代表题 = 各包「二、L2 抽样清单」里每 kid 至少 1 道的样题，原样搬运、不删行。
 *   - 一份文档、一个签字栏；签字只表示抽样通过，不代表内容背书，也不改变 pending-review。
 *   - 包内禁止出现内容背书类字样（只描述抽样事实，不下结论）。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { annotateQuestion } = await import('../assets/js/data/course-map.js');
const { pendingReviewBank } = await import('../assets/js/data/knowledge-math.js');
const { checkQuestionV5 } = await import('../assets/js/data/question-check.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKS = [
  { subject: '数学', file: 'P2-L2-抽样包.md' },
  { subject: '语文', file: 'P3-L2-抽样包.md' },
  { subject: '英语', file: 'P4-L2-抽样包.md' },
  { subject: '科学', file: 'P5-L2-抽样包.md' }
];

const answerText = (q) => {
  if (q.type === 'judge') return q.answer ? '对' : '错';
  return q.type === 'choice' && Array.isArray(q.options) ? String(q.options[q.answer]) : String(q.answer);
};

/** 从包中提取「二、L2 抽样清单」下的每册标题与表格行 */
function extractSample(text) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((l) => /^##\s*二、L2 抽样清单/.test(l));
  if (start < 0) throw new Error('找不到「二、L2 抽样清单」段');
  const volumes = [];
  let current = null;
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^##\s+/.test(line)) break;
    const m = line.match(/^###\s+(.+?)（抽样\s+(\d+)\s*道）/);
    if (m) {
      current = { name: m[1].trim(), declared: Number(m[2]), rows: [] };
      volumes.push(current);
      continue;
    }
    if (!current) continue;
    if (!line.startsWith('|')) continue;
    if (/^\|\s*id\s*\|/.test(line)) continue;
    if (/^\|[\s|:-]+\|$/.test(line)) continue;
    current.rows.push(line);
  }
  return volumes;
}

let failures = 0;
const merged = [];
for (const pack of PACKS) {
  const full = path.join(ROOT, 'docs', pack.file);
  if (!fs.existsSync(full)) { console.log(`  ✗ 缺包：${pack.file}`); failures += 1; continue; }
  const volumes = extractSample(fs.readFileSync(full, 'utf8'));
  if (volumes.length !== 12) { console.log(`  ✗ ${pack.file} 册数 = ${volumes.length}（应为 12）`); failures += 1; }
  volumes.forEach((v) => {
    if (v.declared !== v.rows.length) { console.log(`  ✗ ${pack.file} ${v.name} 声明 ${v.declared} 行，实际 ${v.rows.length} 行`); failures += 1; }
  });
  merged.push({ ...pack, volumes });
  console.log(`  ${pack.subject}：${volumes.length} 册 / ${volumes.reduce((s, v) => s + v.rows.length, 0)} 道代表题`);
}

/* v4 遗留 8 道：与 P2 包同一来源 pendingReviewBank()。
 * 核对结论（不是推测）：annotateQuestion 对 8 道全部成功，挂到 ma-u01 / ma-u01-l1 / k1~k3；
 * 首次“挂接失败 ×8”是校验脚本拿 info.unitId 与 q.unitId 比较，而这 8 道 v4 题没有 unitId 字段。
 * 采用 B：legacy 单列、显式标注“不参与 v5 单元收敛”；不补映射、不静默丢弃、不改断言掩盖。 */
const legacy = pendingReviewBank();
const legacyChecked = legacy.map((q) => ({ q, v: checkQuestionV5(q), info: annotateQuestion(q) }));
legacyChecked.forEach(({ q, v, info }) => {
  if (v.length) { console.log(`  ✗ v4 遗留 ${q.id} L1 未过：${v.map((x) => x.rule).join('、')}`); failures += 1; }
  if (!info) { console.log(`  ✗ v4 遗留 ${q.id} 课程索引挂接失败（不允许静默丢弃）`); failures += 1; }
});

const totalRows = merged.reduce((s, p) => s + p.volumes.reduce((t, v) => t + v.rows.length, 0), 0);
const out = [];
out.push('# P6 · 汇总签字清单（48 册 · 一次签字）');
out.push('');
out.push('> 状态：**未签字、未放行**。上面所有代表题与 8 道 v4 遗留题均为 `pending-review`，线上题池不变。');
out.push('> 签字只表示**抽样通过**，不代表内容背书；教材措辞与年级适配仍需审核人（L3）自行判断。');
out.push('> 本清单合并自 `docs/P2-L2-抽样包.md` / `P3` / `P4` / `P5`，原包保留可追溯；这里不删题、不改答案。');
out.push('');
out.push(`- 覆盖：48 册（数学 12 + 语文 12 + 英语 12 + 科学 12）`);
out.push(`- 代表题：${totalRows} 道（每 kid 至少 1 道，与各册 L2 抽样数一致）`);
out.push(`- v4 遗留：${legacy.length} 道（${legacy.map((q) => q.id).join('、')}）`);
out.push('');
out.push('## 一、使用方式');
out.push('');
out.push('1. 先看每册的代表题（题干 / 答案 / 解析），重点判断教材措辞、年级适配、答案是否符合课本说法。');
out.push('2. 发现问题就在下方签字栏写「驳回：册 + id + 原因」；没有异议再签。');
out.push('3. 签完仍不立即生效：需要用户明确说「放行」，才会按「同规格批量放行」批量转 approved 并重跑生效态清单。');
out.push('4. 未签字期间，四批（p2-math-batch-1 / p3-chinese-batch-1 / p4-english-batch-1 / p5-science-batch-1）全部保持 `pending-review`。');
out.push('');
for (const pack of merged) {
  out.push(`## 二、${pack.subject}（12 册）`);
  out.push('');
  pack.volumes.forEach((v) => {
    out.push(`### ${pack.subject} · ${v.name}（抽样 ${v.rows.length} 道）`);
    out.push('');
    out.push('| id | kid | specId | 问法 | 题目 | 答案 | 解析 |');
    out.push('|---|---|---|---|---|---|---|');
    v.rows.forEach((r) => out.push(r));
    out.push('');
  });
}
out.push('## 三、v4 遗留 8 道（并入本清单）');
out.push('');
out.push('> 核对结论：8 道 v4 遗留题 `annotateQuestion` 全部可挂接（`ma-u01` / `ma-u01-l1` / `k1~k3`）。');
out.push('> 首次“挂接失败 ×8”是校验脚本拿 `info.unitId` 与 `q.unitId` 比较，而这 8 道 v4 题没有 `unitId` 字段；不是 P0 别名迁移缺口。');
out.push('> 处理方式取 B：legacy 单列，**显式标注“不参与 v5 单元收敛”**；不补映射、不静默丢弃、不把断言改到不报错就算完。');
out.push('');
out.push('| id | L1 结果 | 挂接（v4 遗留，不参与 v5 单元收敛） | 题目 | 答案 | 解析 |');
out.push('|---|---|---|---|---|---|');
legacyChecked.forEach(({ q, v, info }) => {
  const mount = info ? `${info.unitId} / ${info.lessonId} / ${info.knowledgeIds.join('、')}` : '挂接失败';
  out.push(`| ${q.id} | ${v.length ? v.map((x) => x.rule).join('、') : '通过'} | ${mount}（legacy，不参与 v5 单元收敛） | ${String(q.prompt).replace(/\|/g, '｜')} | ${answerText(q)} | ${String(q.explain || '').replace(/\|/g, '｜')} |`);
});
out.push('');
out.push('## 四、签字（一次签字，覆盖 48 册）');
out.push('');
out.push('- [ ] 我已阅读上表 48 册代表题与 8 道 v4 遗留题。');
out.push('- [ ] 我对教材措辞与年级适配的判断已记录（有异议写在下方）。');
out.push('- [ ] 我同意，在用户明确说「放行」后，按「同规格批量放行」处理四批 pending 题；此签字不替代逐题 L3 复核，也不改变“当前尚未生效”的事实。');
out.push('');
out.push('异议 / 驳回记录：');
out.push('');
out.push('```');
out.push('（册 + id + 原因，可留空）');
out.push('```');
out.push('');
out.push('审核人（真人签名）：__________  日期：__________');
out.push('');
out.push('> 未签字前，本清单内全部题目保持 `pending-review`；线上题池不含本批内容。本清单本身不构成放行。');
out.push('');

const outPath = path.join(ROOT, 'docs', 'P6-汇总签字清单.md');
fs.writeFileSync(outPath, `${out.join('\n')}\n`, 'utf8');
console.log(`合并：${merged.length} 科 / ${merged.reduce((s, p) => s + p.volumes.length, 0)} 册 / ${totalRows} 道代表题 + v4 遗留 ${legacy.length} 道`);
console.log(`已写入 ${path.relative(ROOT, outPath)}`);
if (failures) process.exitCode = 1;
