/**
 * sim_bundle.mjs —— P0 首屏体积 + 懒加载边界 + mastery 分层收益
 *
 * 跑法：node verify/sim_bundle.mjs
 * 覆盖：
 *   A. 静态 import 图：course/index.js 不在首屏；48 册中只有已建 4 册可被静态解析
 *   B. 首屏 JS 体积：整页静态体积相对 P0 前增长 ≤ +20%
 *   C. mastery 分层：936 kid 合成数据归档后条目不丢、体积下降、活跃 ≤ 600
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COURSE_MAP_BASELINE = 12333; // P0 前的单册 course-map.js 字节数

const RealDate = Date;
const BASE = new RealDate('2026-11-07T12:00:00+08:00').getTime();
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

/* ================= A/B. 静态 import 图 ================= */
console.log('\n== A/B. 首屏静态 import 图 ==');
const IMPORT_RE = /(?:import\s+[^'"]*from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|export\s+[^'"]*from\s*['"]([^'"]+)['"])/g;

function resolveSpec(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  return path.resolve(path.dirname(fromFile), spec);
}

function walk(entryRel) {
  const seen = new Map(); // abs → bytes
  const stack = [path.resolve(ROOT, entryRel)];
  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file)) continue;
    if (!fs.existsSync(file)) continue;
    const code = fs.readFileSync(file, 'utf8');
    seen.set(file, Buffer.byteLength(code));
    const re = new RegExp(IMPORT_RE.source, 'g');
    let m;
    while ((m = re.exec(code))) {
      const spec = m[1] || m[2] || m[3];
      const dep = resolveSpec(file, spec);
      if (dep && dep.endsWith('.js')) stack.push(dep);
    }
  }
  return seen;
}

const graph = walk('assets/js/pages/math.js');
const totalBytes = [...graph.values()].reduce((a, b) => a + b, 0);
const courseFiles = [...graph.keys()].filter((f) => f.includes(`${path.sep}data${path.sep}course`));
const courseBytes = courseFiles.reduce((s, f) => s + graph.get(f), 0);
const rel = (f) => path.relative(ROOT, f).replaceAll(path.sep, '/');
const lazyIndex = [...graph.keys()].some((f) => rel(f).endsWith('data/course/index.js'));

console.log(`  首屏可达 JS 文件 ${graph.size} 个，合计 ${(totalBytes / 1024).toFixed(1)} KB`);
console.log(`  其中课程数据 ${courseFiles.length} 个文件，${courseBytes} B（P0 前单册 course-map.js 为 ${COURSE_MAP_BASELINE} B）`);
courseFiles.sort().forEach((f) => console.log(`    · ${rel(f)} ${graph.get(f)} B`));

assert(!lazyIndex, 'course/index.js 不在首屏静态图（48 册按需 import）');
const volumeFiles = courseFiles.filter((f) => rel(f).includes('data/course/volumes/'));
assert(volumeFiles.length === 4, `静态可达册文件 = ${volumeFiles.length}（只含已建 4 册骨架）`);
const builtNames = ['math-g2-up.js', 'math-g2-down.js', 'math-g3-up.js', 'math-g3-down.js'];
assert(builtNames.every((n) => volumeFiles.some((f) => f.endsWith(n))), '4 册骨架齐备');
const allVolumeDir = fs.readdirSync(path.join(ROOT, 'assets/js/data/course/volumes'));
assert(allVolumeDir.length === 4, `volumes/ 目录只有 4 个已建文件（其余 44 册未造内容）`);

const baselineTotal = totalBytes - Math.max(0, courseBytes - COURSE_MAP_BASELINE);
const growth = baselineTotal ? (totalBytes / baselineTotal - 1) : 0;
console.log(`  首屏 JS 增幅 ${(growth * 100).toFixed(2)}%（基线 ${(baselineTotal / 1024).toFixed(1)} KB → 现在 ${(totalBytes / 1024).toFixed(1)} KB）`);
assert(growth <= 0.20, `首屏 JS ≤ 现有 +20%（实际 +${(growth * 100).toFixed(2)}%）`);

/* ================= C. mastery 分层 ================= */
console.log('\n== C. mastery 分层（936 kid 合成） ==');
const mastery = await import('../assets/js/core/mastery.js');
const SUBJECT_PREFIX = ['math', 'chinese', 'english', 'science'];
const data = {
  mastery: { v: 1, keys: {}, masteredAt: {}, reviewAt: {}, aliases: {}, archive: {} },
  reviewQueue: { '2026-11-07': [] },
  contentGaps: {}
};
let sumSeen = 0;
for (let i = 0; i < 936; i += 1) {
  const subject = SUBJECT_PREFIX[i % 4];
  const kid = `rj-${subject}-g${(i % 6) + 1}-up-u${String(Math.floor(i / 90) + 1).padStart(2, '0')}-l01-k${String((i % 90) + 1).padStart(2, '0')}`;
  const old = i % 4 !== 0; // 约 3/4 长期未动
  const status = i % 10 === 0 ? 'review' : 'learning';
  const seen = 2 + (i % 7);
  sumSeen += seen;
  data.mastery.keys[kid] = {
    status,
    seen,
    correct: seen - 1,
    lastSeen: old ? '2026-04-01' : '2026-11-01',
    streak: i % 3
  };
}
const sizeOf = () => Buffer.byteLength(JSON.stringify(data.mastery), 'utf8');
const beforeBytes = sizeOf();
const beforeAll = Object.keys(data.mastery.keys).length;
const result = mastery.compactMastery(data, { today: '2026-11-07' });
const afterBytes = sizeOf();
const afterAll = Object.keys(data.mastery.keys).length + Object.keys(data.mastery.archive).length;
const afterSeen = Object.values(data.mastery.keys).reduce((s, r) => s + r.seen, 0)
  + Object.values(data.mastery.archive).reduce((s, a) => s + a[1], 0);
console.log(`  归档：${result.moved} 条；活跃 ${Object.keys(data.mastery.keys).length} / 归档 ${Object.keys(data.mastery.archive).length}`);
console.log(`  mastery 体积 ${beforeBytes} B → ${afterBytes} B（-${Math.round((1 - afterBytes / beforeBytes) * 100)}%）`);
assert(beforeAll === afterAll && afterAll === 936, `记录总数不丢（${beforeAll} → ${afterAll}）`);
assert(afterSeen === sumSeen, `累积 seen 不丢（${sumSeen} → ${afterSeen}）`);
assert(Object.keys(data.mastery.keys).length <= 600, `活跃层 ≤ 600（实际 ${Object.keys(data.mastery.keys).length}）`);
assert(result.moved > 0 && afterBytes < beforeBytes, '归档确实压缩体积（不是空操作）');
const archived = Object.values(data.mastery.archive);
assert(archived.every((a) => Array.isArray(a) && a.length === 5), `归档为压缩数组（${archived.length} 条 × 5 字段）`);
assert(archived.every((a) => a[0] !== 1), 'review 态不归档（状态码 1 不入档）');
assert(archived.reduce((s, a) => s + a[1], 0) > 0, '归档保留 seen 累积值');
assert(afterBytes <= beforeBytes * 0.9, `归档压缩 ≥10%（实际 -${Math.round((1 - afterBytes / beforeBytes) * 100)}%）`);

console.log(`\n=== 汇总：${pass} 通过 / ${fail} 失败 ===`);
if (fail) process.exitCode = 1;
