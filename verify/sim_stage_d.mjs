/**
 * sim_stage_d.mjs —— 阶段 D 结构与交互诚实度验收（不需要浏览器）
 *
 * 跑法：node verify/sim_stage_d.mjs
 * 覆盖：
 *   D1 听说练习：评分语义清零、四级发音难度词表规模、+1/+3/+7 跨天队列
 *   D2 奥数闯关：六专题顺序、每专题 4 关、grade/level 真实、废题已下线、无「再来一组」
 *   保留项：WORDS_PER_DAY、g<=grade 筛选、g1~g6 分组
 */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const speakingContent = require('../assets/js/data/speaking-content.js');
const plan = require('../assets/js/data/speaking-plan.js');
const olympic = require('../assets/js/data/knowledge-olympic.js');
const rngmod = require('../assets/js/core/rng.js');
const { mulberry32, hashString } = rngmod;

const { WORD_BANK, SENTENCE_BANK } = speakingContent;
const { LEVELS, levelOfItem, scheduleNext } = plan;
const { olympicTopics, olympicTopicQuestion, TOPIC_SEQUENCE, LEVELS_PER_TOPIC, LEVEL_LABELS } = olympic;

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.log(`  ✗ FAIL: ${msg}`); }
}

/* ================= D1 · 界面语义 ================= */
console.log('\n== D1. 听说练习：不冒充评测 ==');
{
  const src = readFileSync(join(root, 'assets/js/pages/speaking.js'), 'utf8');
  const banned = ['评分', '得分', '已通过', '我读对了', '自评', '发音通过', '完美'];
  banned.forEach((word) => {
    const hit = src.includes(word);
    console.log(`    禁用词「${word}」：${hit ? '仍出现' : '0 处'}`);
    assert(!hit, `speaking.js 不含「${word}」`);
  });
  assert(src.includes('听说练习'), '专区改名为「听说练习」');
  assert(!/function judge\s*\(/.test(src), 'judge() 评分函数已删除');
  assert(!/selfBtn/.test(src), '「我读对了（自评）」按钮已删除');
  assert(src.includes('WORDS_PER_DAY') && src.includes('{ 1: 2, 2: 3, 3: 4, 4: 5, 5: 5, 6: 5 }'),
    'WORDS_PER_DAY 原值保留');
  assert((src.match(/g <= grade/g) || []).length >= 2, '单词/句子词库仍按 g <= grade 筛选');
  assert(src.includes('?sr=0') || src.includes('sr=0'), '提供 ?sr=0 强制关闭语音识别的验收开关');
  const banner = /当前浏览器不支持语音识别[\s\S]{0,80}/.exec(src);
  assert(!!banner, 'SR 不可用时有诚实说明文案');
}

/* ================= D1 · 四级发音难度词表规模 ================= */
console.log('\n== D1. 发音难度四级词表规模（按年级，g<=grade） ==');
{
  const rows = [];
  for (let g = 1; g <= 6; g++) {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    WORD_BANK.filter((w) => w.g <= g).forEach((w) => {
      counts[levelOfItem({ type: 'word', text: w.w })] += 1;
    });
    SENTENCE_BANK.filter((s) => s.g <= g).forEach((s) => {
      counts[levelOfItem({ type: 'sentence', text: s.text })] += 1;
    });
    rows.push({ g, ...counts, total: counts[1] + counts[2] + counts[3] + counts[4] });
  }
  console.log('    年级 | 单音节 | 多音节 | 连读/失去爆破 | 句子重音语调 | 合计');
  rows.forEach((r) => {
    console.log(`    ${r.g}    | ${String(r[1]).padStart(4)}  | ${String(r[2]).padStart(4)}  | ${String(r[3]).padStart(6)}      | ${String(r[4]).padStart(6)}      | ${r.total}`);
  });
  LEVELS.forEach((lv) => {
    const grade3 = rows.find((r) => r.g === 3)[lv.id];
    console.log(`    三年级「${lv.name}」词表规模：${grade3}`);
    assert(grade3 > 0, `三年级「${lv.name}」有可用内容（${grade3}）`);
  });
}

/* ================= D1 · +1/+3/+7 跨天复现 ================= */
console.log('\n== D1. 跨天复习队列（今天练 → +1/+3/+7 天回来 → 毕业） ==');
{
  const origin = '2026-11-07';
  const e0 = scheduleNext(null, origin, 1);
  console.log(`    首次练完：origin=${e0.origin} step=${e0.step} due=${e0.due}`);
  assert(e0.due === '2026-11-08', '第 +1 天回来（2026-11-08）');

  const e1 = scheduleNext(e0, e0.due, 1);
  console.log(`    +1 天复习完：step=${e1.step} due=${e1.due}`);
  assert(e1.due === '2026-11-10', '第 +3 天回来（2026-11-10）');

  const e2 = scheduleNext(e1, e1.due, 1);
  console.log(`    +3 天复习完：step=${e2.step} due=${e2.due}`);
  assert(e2.due === '2026-11-14', '第 +7 天回来（2026-11-14）');

  const e3 = scheduleNext(e2, e2.due, 1);
  console.log(`    +7 天复习完：${e3 === null ? '毕业（移出队列）' : JSON.stringify(e3)}`);
  assert(e3 === null, '+7 天复习完毕业');

  const sameDay = scheduleNext(e0, origin, 1);
  console.log(`    同一天重复练同一项：step 仍为 ${sameDay.step}，due=${sameDay.due}`);
  assert(sameDay.step === 0 && sameDay.due === '2026-11-08', '同一天重复练不会跳级');
}

/* ================= D2 · 专题结构与下线清单 ================= */
console.log('\n== D2. 奥数专题闯关结构 ==');
{
  const src = readFileSync(join(root, 'assets/js/data/knowledge-olympic.js'), 'utf8');
  const removed = ['ol-g1-tl', 'ol-g1-xd', 'ol-g3-zh', 'ol-g6-tl'];
  removed.forEach((id) => {
    const hit = src.includes(`'${id}'`);
    console.log(`    下线模板 ${id}：${hit ? '仍存在' : '已删除'}`);
    assert(!hit, `${id} 已从题库删除`);
  });
  const page = readFileSync(join(root, 'assets/js/pages/olympic.js'), 'utf8');
  assert(!page.includes('再来一组'), '页面不再有无限「再来一组」');
  assert(page.includes('MASTERY_LINE = 3'), '专题掌握度门槛 = 首答对 3/4 关');
  assert(/olympicTopics/.test(page) && /olympicTopicQuestion/.test(page), '页面走专题/关卡生成，不再整套随机刷');
  assert(page.includes('explainSteps'), '答错有分步提示');
  assert(LEVEL_LABELS.join('') === '例题变式挑战综合', '4 关档位：例题→变式→挑战→综合');
  void LEVELS_PER_TOPIC;

  console.log('\n    年级 | 专题序列（模板数）');
  for (let g = 1; g <= 6; g++) {
    const topics = olympicTopics(g);
    const names = topics.map((t) => `${t.name}(${t.templates.length})`);
    console.log(`    ${g}    | ${names.join(' → ')}`);
    assert(topics.length > 0, `${g} 年级至少 1 个专题`);
    const orderIdx = topics.map((t) => TOPIC_SEQUENCE.findIndex((s) => s.id === t.id));
    const ordered = orderIdx.every((v, i) => i === 0 || v > orderIdx[i - 1]);
    assert(ordered, `${g} 年级专题顺序符合 和差倍→盈亏→鸡兔同笼→行程→计数→组合`);
  }

  // 每专题 4 关的 grade/level 真实值（逐题生成但只汇总报一次）
  let checked = 0;
  let bad = [];
  for (let g = 1; g <= 6; g++) {
    for (const t of olympicTopics(g)) {
      for (let lv = 1; lv <= LEVELS_PER_TOPIC; lv++) {
        const tpl = t.templates[(lv - 1) % t.templates.length];
        const rng = mulberry32(hashString(`d:${g}:${t.id}:${lv}`));
        const q = olympicTopicQuestion(g, tpl.genIndex, lv, rng);
        checked += 1;
        if (q.grade !== g || q.level !== lv) bad.push(`${g}/${t.id}/${lv}→${q.grade}/${q.level}`);
      }
    }
  }
  console.log(`    关卡生成抽检 ${checked} 题，grade/level 不符 ${bad.length} 题`);
  assert(bad.length === 0, '所有关卡题目 grade=真实年级、level=关数（1→4）');
}

/* ================= 保留项 ================= */
console.log('\n== 保留项检查 ==');
{
  const data = readFileSync(join(root, 'assets/js/data/knowledge-olympic.js'), 'utf8');
  for (let g = 1; g <= 6; g++) {
    assert(new RegExp(`const g${g} = \\[`).test(data), `g${g} 内容分组仍独立存在`);
  }
}

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
