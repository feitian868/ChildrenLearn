/**
 * specs-math-extra.js —— P2 语义外壳补充域（按年级专用）
 *
 * 目的：同册内不同 kid 不共用同一 templateKey（题干抹数字后的问法键）。
 * 每个域 3 个【语义不同】的外壳（不是同一句式换数字）：
 *   识记/理解 → 回溯/换算 → 应用/辨析。
 * 仅做参数化生成，不产生新题入库；默认 status 由 specs-math.js 统一置 pending-review。
 *
 * 低参数空间域（数序/钟表/图形/余数）在这里扩了可枚举对象池，
 * 供给证据由 verify/sim_math_p2.mjs 的 R1/R2 输出。
 */

import { randInt, pick } from '../../core/rng.js';

const r = (rand, a, b) => randInt(rand, a, b);
const fmt = (n) => String(Math.round(Number(n) * 100) / 100);

/* g1：数一数 / 数序 / 组成 / 凑十 / 情境 / 相差 / 十几 / 两位数加减 / 人民币 */
const countObject = [
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const rows = r(rand, 2, 4);
    const per = r(rand, 4, 6);
    return { prompt: `一盒鸡蛋每行 ${per} 个，摆了 ${rows} 行，一共有多少个？`, answer: per * rows, unit: '个', explain: `每行 ${per} 个，${rows} 行就是 ${rows} 个 ${per}，${per} × ${rows} = ${per * rows}（个）。` };
  } },
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const a = r(rand, 5, 9);
    const b = r(rand, 1, 4);
    return { prompt: `先数了 ${a} 个，接着又数 ${b} 个，一共数到多少个？`, answer: a + b, unit: '个', explain: `从 ${a} 接着往后数 ${b} 个，数到 ${a + b}。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const groups = r(rand, 2, 4);
    return { prompt: `把 ${groups * 10} 颗糖每 10 颗装一袋，能装几袋？`, answer: groups, unit: '袋', explain: `每 10 颗一袋，${groups * 10} 里面有 ${groups} 个十，能装 ${groups} 袋。` };
  } },
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const a = r(rand, 5, 12);
    const b = r(rand, 1, 5);
    return { prompt: `桌上有 ${a} 个杯子，又拿来 ${b} 个，现在一共有多少个？`, answer: a + b, unit: '个', explain: `${a} + ${b} = ${a + b}（个）。` };
  } }
];

const numberOrder = [
  { askPattern: 'inverse-recall', level: 1, make(rand) {
    const n = r(rand, 5, 35);
    return { prompt: `${n} 后面的一个数是几？`, answer: n + 1, explain: `数序里 ${n} 的后面一个数是 ${n + 1}。` };
  } },
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const n = r(rand, 6, 30);
    return { prompt: `一排小朋友从前往后数，小红排第 ${n}，她前面有几人？`, answer: n - 1, unit: '人', explain: `第 ${n} 个人前面有 ${n - 1} 人。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const a = r(rand, 3, 12);
    return { prompt: `从 ${a} 开始两个两个地数，数到的第 4 个数是几？`, answer: a + 6, explain: `从 ${a} 开始：${a}、${a + 2}、${a + 4}、${a + 6}，第 4 个数是 ${a + 6}。` };
  } },
  { askPattern: 'inverse-recall', level: 1, make(rand) {
    const n = r(rand, 2, 30);
    return { prompt: `比 ${n} 小 1 的数是几？`, answer: n - 1, explain: `数序里 ${n} 前面的一个数是 ${n - 1}。` };
  } }
];

const numberCompose = [
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const t = r(rand, 1, 1);
    const o = r(rand, 1, 9);
    return { prompt: `1 个十和 ${o} 个一合起来是多少？`, answer: 10 + o, explain: `1 个十是 10，再加 ${o} 个一，得 ${10 + o}。` };
  } },
  { askPattern: 'inverse-recall', level: 1, make(rand) {
    const total = r(rand, 5, 10);
    const part = r(rand, 1, total - 1);
    return { prompt: `${total} 可以分成 ${part} 和（ ）`, answer: total - part, explain: `${total} 减去 ${part} 还剩 ${total - part}。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const have = r(rand, 3, 8);
    return { prompt: `盒子里有 ${have} 颗糖，还要放几颗才满 10 颗？`, answer: 10 - have, unit: '颗', explain: `凑十：${have} 再加 ${10 - have} 就是 10。` };
  } }
];

const makeTen = [
  { askPattern: 'inverse-recall', level: 1, make(rand) {
    const a = r(rand, 6, 9);
    return { prompt: `${a} 再加几就凑成 10？`, answer: 10 - a, explain: `凑十法：${a} 和 ${10 - a} 合成 10。` };
  } },
  { askPattern: 'product-recall', level: 2, make(rand) {
    const a = r(rand, 6, 9);
    const b = r(rand, 6, 9);
    const need = 10 - a;
    return { prompt: `算 ${a} + ${b} 时，先把 ${b} 分成 ${need} 和（ ），括号里填几？`, answer: b - need, explain: `${a} 先和 ${need} 凑成 10，${b} 里剩下 ${b - need}。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const a = r(rand, 5, 9);
    const b = r(rand, 5, 9);
    return { prompt: `小明先数了 ${a} 个，又数了 ${b} 个，一共多少个？`, answer: a + b, unit: '个', explain: `把 ${b} 分成 ${10 - a} 和 ${b - (10 - a)}，${a} + ${10 - a} = 10，10 + ${b - (10 - a)} = ${a + b}。` };
  } },
  { askPattern: 'product-recall', level: 1, make(rand) {
    const b = r(rand, 2, 9);
    return { prompt: `用凑十法算 9 + ${b} = （ ）`, answer: 9 + b, explain: `把 ${b} 分成 1 和 ${b - 1}，9 + 1 = 10，10 + ${b - 1} = ${9 + b}。` };
  } },
  { askPattern: 'product-recall', level: 1, make(rand) {
    const b = r(rand, 3, 9);
    return { prompt: `用凑十法算 8 + ${b} = （ ）`, answer: 8 + b, explain: `把 ${b} 分成 2 和 ${b - 2}，8 + 2 = 10，10 + ${b - 2} = ${8 + b}。` };
  } },
  { askPattern: 'product-recall', level: 1, make(rand) {
    const b = r(rand, 4, 9);
    return { prompt: `用凑十法算 7 + ${b} = （ ）`, answer: 7 + b, explain: `把 ${b} 分成 3 和 ${b - 3}，7 + 3 = 10，10 + ${b - 3} = ${7 + b}。` };
  } }
];

const addsubStory = [
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const a = r(rand, 2, 9);
    const b = r(rand, 2, 9);
    return { prompt: `树上原来有 ${a} 只小鸟，又飞来 ${b} 只，现在有几只？`, answer: a + b, unit: '只', explain: `${a} + ${b} = ${a + b}（只）。` };
  } },
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const total = r(rand, 6, 15);
    const gone = r(rand, 2, 5);
    return { prompt: `盘子里有 ${total} 个饺子，吃了 ${gone} 个，还剩几个？`, answer: total - gone, unit: '个', explain: `${total} - ${gone} = ${total - gone}（个）。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const left = r(rand, 2, 8);
    const used = r(rand, 2, 6);
    return { prompt: `用掉 ${used} 支笔后还剩 ${left} 支，原来有几支？`, answer: left + used, unit: '支', explain: `剩下的 ${left} 加用掉的 ${used}，原来有 ${left + used} 支。` };
  } }
];

const addsubCompare = [
  { askPattern: 'compare-operate', level: 1, make(rand) {
    const a = r(rand, 5, 9);
    const d = r(rand, 1, a - 1);
    return { prompt: `小红有 ${a} 朵花，小丽比小红少 ${d} 朵，小丽有几朵？`, answer: a - d, unit: '朵', explain: `${a} 少 ${d} 就是 ${a - d}。` };
  } },
  { askPattern: 'compare-operate', level: 1, make(rand) {
    const a = r(rand, 3, 8);
    const d = r(rand, 1, 4);
    return { prompt: `第一排 ${a} 人，第二排比第一排多 ${d} 人，第二排几人？`, answer: a + d, unit: '人', explain: `${a} 多 ${d} 就是 ${a + d}。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const big = r(rand, 8, 15);
    const small = r(rand, 2, 6);
    return { prompt: `男生 ${big} 人，女生 ${small} 人，男生比女生多几人？`, answer: big - small, unit: '人', explain: `${big} - ${small} = ${big - small}（人）。` };
  } }
];

const teenNumber = [
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const n = r(rand, 11, 19);
    return { prompt: `${n} 里面有几个十和几个一？`, answer: `1 个十和 ${n - 10} 个一`, explain: `${n} = 10 + ${n - 10}，所以是 1 个十和 ${n - 10} 个一。` };
  } },
  { askPattern: 'inverse-recall', level: 1, make(rand) {
    const o = r(rand, 1, 9);
    return { prompt: `十位上是 1，个位上是 ${o}，这个数是多少？`, answer: 10 + o, explain: `十位 1 表示 10，个位 ${o} 表示 ${o}，合起来是 ${10 + o}。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const a = r(rand, 11, 19);
    const b = r(rand, 11, 19);
    const big = Math.max(a, b);
    return { prompt: `${a} 和 ${b} 比较，较大的数是几？`, answer: big, explain: `十几比较，先看个位，${big} 较大。` };
  } }
];

const addsub2Digit = [
  { askPattern: 'product-recall', level: 1, make(rand) {
    const tens = r(rand, 2, 9) * 10;
    const one = r(rand, 1, 9);
    return { prompt: `${tens} + ${one} = （ ）`, answer: tens + one, explain: `${tens} 是 ${tens / 10} 个十，再加 ${one} 个一，得 ${tens + one}。` };
  } },
  { askPattern: 'inverse-recall', level: 1, make(rand) {
    const tens = r(rand, 3, 9) * 10;
    const one = r(rand, 1, 9);
    return { prompt: `${tens + one} - （ ） = ${tens}`, answer: one, explain: `${tens + one} 去掉 ${one} 个一，剩 ${tens}。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const a = r(rand, 21, 49);
    const b = r(rand, 11, 30);
    return { prompt: `书架上有 ${a} 本书，又放上 ${b} 本，一共多少本？`, answer: a + b, unit: '本', explain: `${a} + ${b} = ${a + b}（本）。` };
  } }
];

const moneyUnit = [
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const y = r(rand, 1, 9);
    return { prompt: `${y} 元 = （ ）角`, answer: y * 10, unit: '角', explain: `1 元 = 10 角，${y} 元 = ${y * 10} 角。` };
  } },
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const a = r(rand, 2, 9);
    const b = r(rand, 2, 9);
    return { prompt: `一支笔 ${a} 元，一本本子 ${b} 元，买一支笔和一本本子一共几元？`, answer: a + b, unit: '元', explain: `${a} + ${b} = ${a + b}（元）。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const pay = r(rand, 10, 20);
    const price = r(rand, 3, 9);
    return { prompt: `付 ${pay} 元买 ${price} 元的文具，应找回几元？`, answer: pay - price, unit: '元', explain: `${pay} - ${price} = ${pay - price}（元）。` };
  } }
];

/* g3：万以内加减应用 / 验算 / 除法应用 */
const addsubWord = [
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const a = r(rand, 120, 499);
    const b = r(rand, 101, 400);
    return { prompt: `图书馆有 ${a} 本书，又购入 ${b} 本，现在共有多少本？`, answer: a + b, unit: '本', explain: `${a} + ${b} = ${a + b}（本）。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const big = r(rand, 500, 999);
    const small = r(rand, 105, 400);
    return { prompt: `果园收苹果 ${big} 千克，梨 ${small} 千克，苹果比梨多多少千克？`, answer: big - small, unit: '千克', explain: `${big} - ${small} = ${big - small}（千克）。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const used = r(rand, 120, 400);
    const left = r(rand, 100, 300);
    return { prompt: `一批货物运走 ${used} 箱后还剩 ${left} 箱，原来有多少箱？`, answer: used + left, unit: '箱', explain: `运走的加剩下的：${used} + ${left} = ${used + left}（箱）。` };
  } }
];

const addsubCheck = [
  { askPattern: 'inverse-recall', level: 1, make(rand) {
    const a = r(rand, 105, 400);
    const b = r(rand, 105, 400);
    return { prompt: `${a} + ${b} = ${a + b}，用减法验算应写成 ${a + b} - ${a} = （ ）`, answer: b, explain: `加法用减法验算：${a + b} - ${a} = ${b}。` };
  } },
  { askPattern: 'product-recall', level: 2, make(rand) {
    const a = r(rand, 200, 600);
    const b = r(rand, 105, 300);
    const c = a - b;
    return { prompt: `${a} - ${b} 的差是多少？`, answer: c, explain: `相同数位对齐相减，${a} - ${b} = ${c}。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const a = r(rand, 105, 350);
    const b = r(rand, 105, 350);
    const guess = a + b + r(rand, 1, 3);
    return { prompt: `小明算 ${a} + ${b} 得 ${guess}，他算对了吗？`, answer: '不对', explain: `${a} + ${b} = ${a + b}，比 ${guess} 多 ${guess - a - b}，所以不对。` };
  } }
];

const divWord = [
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const b = r(rand, 2, 9);
    const q = r(rand, 2, 9);
    return { prompt: `有 ${b * q} 朵花，平均插在 ${b} 个花瓶里，每瓶几朵？`, answer: q, unit: '朵', explain: `${b * q} ÷ ${b} = ${q}（朵）。` };
  } },
  { askPattern: 'meaning-translate', level: 2, make(rand) {
    const b = r(rand, 3, 9);
    const q = r(rand, 2, 9);
    const extra = r(rand, 1, b - 1);
    return { prompt: `${b * q} 个苹果，每 ${b} 个装一袋，最多能装满几袋？`, answer: q, unit: '袋', explain: `${b * q} ÷ ${b} = ${q}，能装满 ${q} 袋。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const q = r(rand, 2, 9);
    const b = r(rand, 2, 9);
    return { prompt: `${q} 的 ${b} 倍是多少？`, answer: q * b, explain: `求 ${q} 的 ${b} 倍，用 ${q} × ${b} = ${q * b}。` };
  } }
];

/* g4：小数数位 / 三角形角 / 平行垂直 / 统计读图 / 优化 */
const decimalPlace = [
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const w = r(rand, 1, 9);
    const d1 = r(rand, 1, 9);
    const d2 = r(rand, 1, 9);
    return { prompt: `${w}.${d1}${d2} 中，十分位上的数字是几？`, answer: d1, explain: `小数点后第一位是十分位，${w}.${d1}${d2} 的十分位是 ${d1}。` };
  } },
  { askPattern: 'inverse-recall', level: 1, make(rand) {
    const w = r(rand, 1, 9);
    const d1 = r(rand, 1, 9);
    return { prompt: `${w} 个一和 ${d1} 个十分之一组成的数是多少？`, answer: `${w}.${d1}`, explain: `${w} 个一是 ${w}，${d1} 个十分之一是 ${d1}.0 的十分位，合起来是 ${w}.${d1}。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const a = `${r(rand, 1, 9)}.${r(rand, 1, 9)}`;
    const b = `${r(rand, 1, 9)}.${r(rand, 1, 9)}`;
    const big = Number(a) > Number(b) ? a : Number(a) < Number(b) ? b : a === b ? a : a;
    return { prompt: `${a} 和 ${b} 比较，较大的数是多少？`, answer: Number(a) >= Number(b) ? a : b, explain: `先比整数部分，再比十分位，较大的是 ${big}。` };
  } }
];

const triangleAngle = [
  { askPattern: 'inverse-recall', level: 1, make(rand) {
    const a = r(rand, 30, 80);
    const b = r(rand, 30, 80);
    return { prompt: `三角形两个角分别是 ${a}° 和 ${b}°，第三个角是多少度？`, answer: 180 - a - b, unit: '度', explain: `三角形内角和 180°，180 - ${a} - ${b} = ${180 - a - b}。` };
  } },
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const a = r(rand, 40, 80);
    return { prompt: `一个等腰三角形的顶角是 ${a}°，一个底角是多少度？`, answer: (180 - a) / 2, unit: '度', explain: `两个底角相等，(180 - ${a}) ÷ 2 = ${(180 - a) / 2}。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const big = r(rand, 81, 110);
    const correct = big < 90 ? '锐角三角形' : big === 90 ? '直角三角形' : '钝角三角形';
    return { prompt: `一个三角形中最大的角是 ${big}°，它是什么三角形？`, answer: correct, explain: `最大角 ${big}° 是${correct.replace('三角形', '角')}，所以是${correct}。` };
  } }
];

const shapeParallel = [
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const a = r(rand, 2, 3);
    return { prompt: `在同一平面内不相交的两条直线互相（ ）`, answer: '平行', explain: `同一平面内不相交的两条直线互相平行。` };
  } },
  { askPattern: 'compare-operate', level: 1, make(rand) {
    const h = r(rand, 3, 8);
    const w = r(rand, 4, 9);
    return { prompt: `平行四边形底 ${w} 厘米、高 ${h} 厘米，它的面积是多少平方厘米？`, answer: w * h, unit: '平方厘米', explain: `平行四边形面积 = 底 × 高 = ${w} × ${h} = ${w * h}。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const up = r(rand, 2, 6);
    const down = r(rand, 5, 9);
    const h = r(rand, 2, 6);
    return { prompt: `梯形上底 ${up} 厘米、下底 ${down} 厘米、高 ${h} 厘米，面积是多少平方厘米？`, answer: (up + down) * h / 2, unit: '平方厘米', explain: `梯形面积 =（上底 + 下底）× 高 ÷ 2 =（${up} + ${down}）× ${h} ÷ 2 = ${(up + down) * h / 2}。` };
  } }
];

const statisticsChart = [
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const a = r(rand, 4, 12);
    const b = r(rand, 4, 12);
    const c = r(rand, 4, 12);
    const big = Math.max(a, b, c);
    return { prompt: `条形统计图的三组数据为 ${a}、${b}、${c}，最高的一组是多少？`, answer: big, explain: `${a}、${b}、${c} 中最大的是 ${big}。` };
  } },
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const a = r(rand, 4, 12);
    const b = r(rand, 4, 12);
    return { prompt: `统计图中男生 ${a} 人、女生 ${b} 人，一共有多少人？`, answer: a + b, unit: '人', explain: `${a} + ${b} = ${a + b}（人）。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const a = r(rand, 6, 15);
    const b = r(rand, 2, 5);
    return { prompt: `统计图中一组有 ${a} 人，另一组有 ${b} 人，相差多少人？`, answer: a - b, unit: '人', explain: `${a} - ${b} = ${a - b}（人）。` };
  } }
];

const logicOptimize = [
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const a = r(rand, 2, 5);
    const b = r(rand, 1, 3);
    return { prompt: `烙一张饼要 ${a} 分钟，一次最多烙 ${b} 张，烙 ${b * 2} 张至少需要多少分钟？`, answer: a * 2, unit: '分钟', explain: `分 ${2} 次烙完，每次 ${a} 分钟，共 ${a * 2} 分钟。` };
  } },
  { askPattern: 'meaning-translate', level: 2, make(rand) {
    const a = r(rand, 6, 15);
    const b = r(rand, 2, 5);
    return { prompt: `沏茶时烧水要 ${a} 分钟，洗茶杯要 ${b} 分钟，洗茶杯可以在烧水时做，最少几分钟能喝上茶？`, answer: Math.max(a, b), unit: '分钟', explain: `烧水的 ${a} 分钟里可以洗 ${b} 分钟的茶杯，最少 ${Math.max(a, b)} 分钟。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const a = r(rand, 3, 9);
    const b = r(rand, 2, 6);
    return { prompt: `用 ${a} 分钟和 ${b} 分钟的两件事，合理安排后最少需要多少分钟？`, answer: Math.max(a, b), unit: '分钟', explain: `两件事可以重叠做，最少取较长的那件，${Math.max(a, b)} 分钟。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const n = r(rand, 5, 12);
    const m = r(rand, 2, 4);
    return { prompt: `河边有 ${n} 人，每条船最多坐 ${m} 人，至少要运几次？`, answer: Math.ceil(n / m), unit: '次', explain: `${n} ÷ ${m} = ${Math.ceil(n / m)} 次（最后一次可能没坐满）。` };
  } }
];

/* g5：小数计算 / 可能性 / 体积 / 植树 / 分数加减 */
const decimalCalc = [
  { askPattern: 'product-recall', level: 1, make(rand) {
    const a = r(rand, 12, 89) / 10;
    const b = r(rand, 2, 9);
    return { prompt: `${a} × ${b} = （ ）`, answer: fmt(a * b), explain: `按整数乘法算 ${a * 10} × ${b} = ${a * 10 * b}，再缩小 10 倍得 ${fmt(a * b)}。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const b = r(rand, 2, 9);
    const q = r(rand, 11, 60) / 10;
    return { prompt: `（ ）× ${b} = ${fmt(b * q)}`, answer: fmt(q), explain: `${fmt(b * q)} ÷ ${b} = ${fmt(q)}。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const price = r(rand, 25, 99) / 10;
    const kg = r(rand, 2, 5);
    return { prompt: `每千克 ${price} 元，买 ${kg} 千克要多少元？`, answer: fmt(price * kg), unit: '元', explain: `${price} × ${kg} = ${fmt(price * kg)}（元）。` };
  } }
];

const statisticsChance = [
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const red = r(rand, 3, 8);
    const blue = r(rand, 1, 3);
    return { prompt: `盒子里红球 ${red} 个、蓝球 ${blue} 个，摸一次最可能摸到什么颜色？`, answer: '红球', explain: `红球数量多，摸到红球的可能性大。` };
  } },
  { askPattern: 'compare-operate', level: 1, make(rand) {
    const a = r(rand, 10, 30);
    const b = r(rand, 31, 60);
    return { prompt: `折线统计图前 ${1} 天是 ${a}，后一天是 ${b}，是上升还是下降？`, answer: '上升', explain: `从 ${a} 到 ${b} 变大，所以是上升。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const total = r(rand, 6, 12);
    const red = r(rand, 2, total - 2);
    return { prompt: `袋里共 ${total} 个球，红球 ${red} 个，其余是白球，白球几个？`, answer: total - red, unit: '个', explain: `${total} - ${red} = ${total - red}（个）。` };
  } }
];

const geometryVolume = [
  { askPattern: 'product-recall', level: 1, make(rand) {
    const a = r(rand, 2, 9);
    const b = r(rand, 2, 9);
    const c = r(rand, 2, 6);
    return { prompt: `长方体长 ${a} 厘米、宽 ${b} 厘米、高 ${c} 厘米，体积是多少立方厘米？`, answer: a * b * c, unit: '立方厘米', explain: `体积 = 长 × 宽 × 高 = ${a} × ${b} × ${c} = ${a * b * c}。` };
  } },
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const a = r(rand, 3, 9);
    return { prompt: `棱长 ${a} 厘米的正方体，表面积是多少平方厘米？`, answer: 6 * a * a, unit: '平方厘米', explain: `正方体表面积 = 棱长 × 棱长 × 6 = ${a} × ${a} × 6 = ${6 * a * a}。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const a = r(rand, 2, 9);
    const b = r(rand, 2, 9);
    const h = r(rand, 2, 6);
    return { prompt: `底面积 ${a * b} 平方厘米、高 ${h} 厘米的长方体，体积是多少立方厘米？`, answer: a * b * h, unit: '立方厘米', explain: `体积 = 底面积 × 高 = ${a * b} × ${h} = ${a * b * h}。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const a = r(rand, 2, 9);
    const b = r(rand, 2, 9);
    const c = r(rand, 2, 6);
    return { prompt: `一个长方体木箱，长 ${a} 分米、宽 ${b} 分米、高 ${c} 分米，它的容积是多少立方分米？`, answer: a * b * c, unit: '立方分米', explain: `容积 = ${a} × ${b} × ${c} = ${a * b * c}（立方分米）。` };
  } },
  { askPattern: 'meaning-translate', level: 2, make(rand) {
    const a = r(rand, 3, 9);
    return { prompt: `一个正方体礼盒棱长 ${a} 厘米，做这样一个盒子至少需要多少平方厘米的纸板？`, answer: 6 * a * a, unit: '平方厘米', explain: `正方体有 6 个面，${a} × ${a} × 6 = ${6 * a * a}（平方厘米）。` };
  } }
];

const logicTree = [
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const len = r(rand, 20, 60);
    const gap = r(rand, 2, 6);
    const segs = Math.floor(len / gap);
    return { prompt: `一条 ${len} 米的小路，每隔 ${gap} 米种一棵树（两端都种），一共种几棵？`, answer: segs + 1, unit: '棵', explain: `间隔数 ${len} ÷ ${gap} = ${segs}（取整），两端都种加 1，共 ${segs + 1} 棵。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const gap = r(rand, 2, 6);
    const trees = r(rand, 6, 12);
    return { prompt: `每隔 ${gap} 米种一棵树，两端都种，种了 ${trees} 棵，这段路长多少米？`, answer: (trees - 1) * gap, unit: '米', explain: `间隔数是 ${trees} - 1 = ${trees - 1}，路长 ${trees - 1} × ${gap} = ${(trees - 1) * gap} 米。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const len = r(rand, 20, 60);
    const gap = r(rand, 2, 6);
    const segs = Math.floor(len / gap);
    return { prompt: `一条 ${len} 米的路，每隔 ${gap} 米种一棵树（只种一端），一共种几棵？`, answer: segs, unit: '棵', explain: `只种一端，棵数等于间隔数：${len} ÷ ${gap} = ${segs}（取整）棵。` };
  } }
];

const fractionAdd = [
  { askPattern: 'product-recall', level: 1, make(rand) {
    const d = r(rand, 3, 15);
    const a = r(rand, 1, d - 1);
    const b = r(rand, 1, d - 1);
    return { prompt: `${a}/${d} + ${b}/${d} = （ ）`, answer: `${a + b}/${d}`, explain: `同分母分数相加，分母不变，分子相加：${a + b}/${d}。` };
  } },
  { askPattern: 'inverse-recall', level: 1, make(rand) {
    const d = r(rand, 3, 9);
    const a = r(rand, 1, d - 1);
    return { prompt: `1 - ${a}/${d} = （ ）`, answer: `${d - a}/${d}`, explain: `1 化成 ${d}/${d}，减去 ${a}/${d} 得 ${d - a}/${d}。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const d = r(rand, 4, 9);
    const a = r(rand, 1, d - 2);
    const b = r(rand, 1, d - a - 1);
    return { prompt: `一段绳子用去 ${a}/${d}，又用去 ${b}/${d}，一共用去几分之几？`, answer: `${a + b}/${d}`, explain: `${a}/${d} + ${b}/${d} = ${a + b}/${d}。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const d = r(rand, 5, 9);
    const a = r(rand, 1, d - 2);
    const b = r(rand, 1, d - a - 1);
    return { prompt: `一块蛋糕，小明吃了 ${a}/${d}，小红吃了 ${b}/${d}，两人一共吃了这块蛋糕的几分之几？`, answer: `${a + b}/${d}`, explain: `${a}/${d} + ${b}/${d} = ${a + b}/${d}。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const d = r(rand, 3, 9);
    const a = r(rand, 1, d - 1);
    return { prompt: `一根彩带长 1 米，用去 ${a}/${d} 米，还剩多少米？`, answer: `${d - a}/${d}`, explain: `1 - ${a}/${d} = ${d}/${d} - ${a}/${d} = ${d - a}/${d}。` };
  } }
];

/* g6：分数乘除 / 比例尺 / 圆柱圆锥 / 概率 / 鸽巢 */
const fractionCalc = [
  { askPattern: 'product-recall', level: 1, make(rand) {
    const b = r(rand, 3, 45);
    const a = r(rand, 1, b - 1);
    const c = r(rand, 2, 12);
    return { prompt: `${a}/${b} × ${c} = （ ）`, answer: fmt((a * c) / b), explain: `${a}/${b} × ${c} = ${a * c}/${b} = ${fmt((a * c) / b)}。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const a = r(rand, 1, 4);
    const b = a + r(rand, 1, 3);
    const c = r(rand, 2, 6);
    return { prompt: `（ ）× ${a}/${b} = ${fmt((a * c) / b)}`, answer: c, explain: `${fmt((a * c) / b)} ÷ ${a}/${b} = ${c}。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const total = r(rand, 12, 60);
    const d = r(rand, 2, 5);
    return { prompt: `一本书共 ${total} 页，已读 ${1}/${d}，读了多少页？`, answer: total / d, unit: '页', explain: `${total} ÷ ${d} = ${total / d}（页）。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const a = r(rand, 1, 4);
    const b = a + r(rand, 1, 4);
    const k = r(rand, 2, 6);
    return { prompt: `一根 ${b * k} 米长的彩带，用去它的 ${a}/${b}，用去多少米？`, answer: a * k, unit: '米', explain: `${b * k} × ${a}/${b} = ${a * k}（米）。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const a = r(rand, 1, 4);
    const b = a + r(rand, 1, 4);
    const k = r(rand, 2, 6);
    return { prompt: `一个数的 ${a}/${b} 是 ${a * k}，这个数是多少？`, answer: b * k, explain: `${a * k} ÷ ${a}/${b} = ${b * k}。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const b = r(rand, 3, 12);
    const a = r(rand, 1, b - 1);
    const k = r(rand, 2, 5);
    return { prompt: `一桶油重 ${b * k} 千克，用去 ${a}/${b}，用去多少千克？`, answer: a * k, unit: '千克', explain: `${b * k} × ${a}/${b} = ${a * k}（千克）。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const b = r(rand, 3, 20);
    const a = r(rand, 1, b - 1);
    const c = r(rand, 2, 15);
    return { prompt: `${a}/${b} 的 ${c} 倍是多少？`, answer: fmt((a * c) / b), explain: `${a}/${b} × ${c} = ${fmt((a * c) / b)}。` };
  } }
];

const ratioScale = [
  { askPattern: 'product-recall', level: 1, make(rand) {
    const [a, b] = pick(rand, [[1, 2], [1, 3], [1, 4], [1, 5], [2, 3], [2, 5], [3, 4], [3, 5], [4, 5]]);
    const m = r(rand, 2, 6);
    return { prompt: `把 ${a * m} : ${b * m} 化成最简比是多少？`, answer: `${a}:${b}`, explain: `前后项同时除以 ${m}，得到 ${a}:${b}。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const total = r(rand, 20, 60);
    const a = r(rand, 1, 2);
    const b = r(rand, 2, 4);
    return { prompt: `把 ${total} 个苹果按 ${a}:${b} 分给两人，较多的一份是多少个？`, answer: Math.round(total * Math.max(a, b) / (a + b)), unit: '个', explain: `总份数 ${a + b}，一份 ${total} ÷ ${a + b} = ${fmt(total / (a + b))}，较多份 ${Math.max(a, b)} 份是 ${Math.round(total * Math.max(a, b) / (a + b))} 个。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const a = r(rand, 1, 3);
    const b = r(rand, 2, 5);
    return { prompt: `${a} : ${b} 的比值是多少？`, answer: fmt(a / b), explain: `比值 = 前项 ÷ 后项 = ${a} ÷ ${b} = ${fmt(a / b)}。` };
  } }
];

const geometryCylinder = [
  { askPattern: 'product-recall', level: 2, make(rand) {
    const rr = r(rand, 1, 5);
    const h = r(rand, 2, 8);
    return { prompt: `圆柱底面半径 ${rr} 厘米、高 ${h} 厘米，体积是多少立方厘米？（π 取 3）`, answer: 3 * rr * rr * h, unit: '立方厘米', explain: `V = πr²h = 3 × ${rr} × ${rr} × ${h} = ${3 * rr * rr * h}。` };
  } },
  { askPattern: 'meaning-translate', level: 2, make(rand) {
    const rr = r(rand, 1, 5);
    const h = r(rand, 2, 8);
    return { prompt: `圆柱底面半径 ${rr} 厘米、高 ${h} 厘米，侧面积是多少平方厘米？（π 取 3）`, answer: 2 * 3 * rr * h, unit: '平方厘米', explain: `侧面积 = 2πrh = 2 × 3 × ${rr} × ${h} = ${2 * 3 * rr * h}。` };
  } },
  { askPattern: 'compare-operate', level: 3, make(rand) {
    const rr = r(rand, 1, 4);
    const h = r(rand, 3, 9);
    return { prompt: `等底等高的圆锥与圆柱，圆柱体积是圆锥的几倍？`, answer: 3, explain: `圆锥体积是圆柱的三分之一，所以圆柱是圆锥的 3 倍。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const d = r(rand, 2, 6) * 2;
    const h = r(rand, 2, 8);
    return { prompt: `一个圆柱形水桶底面直径 ${d} 厘米、高 ${h} 厘米，能装多少立方厘米水？（π 取 3）`, answer: 3 * (d / 2) * (d / 2) * h, unit: '立方厘米', explain: `半径 ${d / 2} 厘米，V = 3 × ${d / 2} × ${d / 2} × ${h} = ${3 * (d / 2) * (d / 2) * h}。` };
  } },
  { askPattern: 'meaning-translate', level: 2, make(rand) {
    const rr = r(rand, 2, 6);
    const h = r(rand, 2, 8);
    return { prompt: `一个圆锥底面半径 ${rr} 厘米、高 ${h} 厘米，体积是多少立方厘米？（π 取 3）`, answer: rr * rr * h, unit: '立方厘米', explain: `V = πr²h ÷ 3 = 3 × ${rr} × ${rr} × ${h} ÷ 3 = ${rr * rr * h}。` };
  } }
];

const statisticsProb = [
  { askPattern: 'meaning-translate', level: 2, make(rand) {
    const n = r(rand, 2, 6);
    return { prompt: `掷一枚均匀骰子，掷出 ${n} 点的可能性是几分之一？`, answer: '1/6', explain: `骰子有 6 个面，每面可能性相同，都是 1/6。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const a = r(rand, 2, 8);
    const b = r(rand, 2, 8);
    return { prompt: `盒子里有 ${a} 个红球和 ${b} 个黄球，任意摸一个，摸到红球的可能性是多少？`, answer: `${a}/${a + b}`, explain: `红球 ${a} 个，共 ${a + b} 个，可能性是 ${a}/${a + b}。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const a = r(rand, 3, 9);
    const b = r(rand, 2, 8);
    return { prompt: `甲袋红球 ${a} 个、共 ${a + b} 个；乙袋红球 ${b} 个、共 ${a + b} 个。哪袋摸到红球的可能性大？`, answer: '甲袋', explain: `甲袋红球更多，可能性更大。` };
  } },
  { askPattern: 'meaning-translate', level: 2, make(rand) {
    const n = r(rand, 2, 8);
    return { prompt: `一个转盘平均分成 ${n} 份，指针停在任意指定一份的可能性是多少？`, answer: `1/${n}`, explain: `平均分成 ${n} 份，每份可能性相同，都是 1/${n}。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const red = r(rand, 2, 6);
    const white = red + r(rand, 1, 4);
    return { prompt: `袋中有 ${red} 个红球、${white} 个白球，任意摸一个，摸到白球的可能性是多少？`, answer: `${white}/${red + white}`, explain: `白球 ${white} 个，共 ${red + white} 个，可能性是 ${white}/${red + white}。` };
  } }
];

const logicPigeon = [
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const n = r(rand, 3, 6);
    return { prompt: `把 ${n + 1} 个苹果放进 ${n} 个抽屉，至少有一个抽屉放几个？`, answer: 2, unit: '个', explain: `苹果比抽屉多 1，至少有一个抽屉放 2 个。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const n = r(rand, 2, 5);
    const k = r(rand, 2, 3);
    return { prompt: `保证有一个抽屉至少放 ${k} 个苹果，最少要准备多少个苹果放进 ${n} 个抽屉？`, answer: n * (k - 1) + 1, unit: '个', explain: `最坏情况每抽屉先放 ${k - 1} 个，再放 1 个，共 ${n} × ${k - 1} + 1 = ${n * (k - 1) + 1} 个。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const n = r(rand, 3, 6);
    return { prompt: `${n} 只鸽子飞进 ${n} 个鸽巢，至少有一个巢飞进几只鸽子？`, answer: 1, unit: '只', explain: `鸽子数和巢数相同，不保证有巢多于 1 只，至少 1 只。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const n = r(rand, 3, 12);
    return { prompt: `把 ${n} 个苹果放进 2 个抽屉，至少有一个抽屉至少放几个？`, answer: Math.ceil(n / 2), unit: '个', explain: `尽量平均分，${n} ÷ 2，至少有一个抽屉放 ${Math.ceil(n / 2)} 个。` };
  } },
  { askPattern: 'inverse-recall', level: 3, make(rand) {
    const c = r(rand, 2, 4);
    const k = r(rand, 2, 3);
    return { prompt: `盒子里有 ${c} 种颜色的球，至少摸出几个球才能保证有 ${k} 个同色？`, answer: c * (k - 1) + 1, unit: '个', explain: `最坏情况每种颜色先摸 ${k - 1} 个，再摸 1 个，共 ${c} × ${k - 1} + 1 = ${c * (k - 1) + 1} 个。` };
  } }
];

/* g2/g3 补充：竖式对位 / 估算应用 / 表内除法 / 年月日 */
const addsubVertical = [
  { askPattern: 'product-recall', level: 1, make(rand) {
    const a = r(rand, 105, 499);
    const b = r(rand, 105, 499);
    return { prompt: `竖式计算 ${a} + ${b}，个位相加满十要向（ ）进 1`, answer: '十位', explain: `个位相加满十，向十位进 1，结果是 ${a + b}。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const a = r(rand, 300, 700);
    const b = r(rand, 105, 299);
    return { prompt: `竖式计算 ${a} - ${b}，十位不够减要从百位退 1 当（ ）`, answer: '10', explain: `从百位退 1 当 10 个十，再减，结果是 ${a - b}。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const a = r(rand, 200, 500);
    const b = r(rand, 100, 300);
    const bad = a + b + 10;
    return { prompt: `小明竖式算 ${a} + ${b} 得 ${bad}，他忘记（ ）`, answer: '进位', explain: `${a} + ${b} = ${a + b}，他多算 10，漏了进位。` };
  } }
];

const estimateApply = [
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const a = r(rand, 200, 400);
    const b = r(rand, 150, 350);
    return { prompt: `学校有 ${a} 名学生，又来了约 ${b} 名，大约一共多少人？`, answer: Math.round((a + b) / 100) * 100, unit: '人', explain: `把 ${a} 和 ${b} 估成整百：约 ${Math.round(a / 100) * 100} + ${Math.round(b / 100) * 100} = ${Math.round((a + b) / 100) * 100}。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const a = r(rand, 400, 900);
    const b = r(rand, 100, a - 100);
    return { prompt: `${a} - ${b} 的差大约是多少？（估成整百）`, answer: Math.round((a - b) / 100) * 100, explain: `估成整百：${Math.round(a / 100) * 100} - ${Math.round(b / 100) * 100} = ${Math.round((a - b) / 100) * 100}。` };
  } },
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const n = r(rand, 295, 304);
    return { prompt: `${n} 最接近哪个整百数？`, answer: Math.round(n / 100) * 100, explain: `${n} 离 ${Math.round(n / 100) * 100} 最近。` };
  } }
];

const divQuotient = [
  { askPattern: 'product-recall', level: 1, make(rand) {
    const b = r(rand, 2, 9);
    const q = r(rand, 2, 9);
    return { prompt: `${b * q} ÷ ${b} = （ ）`, answer: q, explain: `想口诀：${b} × ${q} = ${b * q}，所以商是 ${q}。` };
  } },
  { askPattern: 'inverse-recall', level: 1, make(rand) {
    const b = r(rand, 2, 9);
    const q = r(rand, 2, 9);
    return { prompt: `（ ）÷ ${b} = ${q}`, answer: b * q, explain: `被除数 = 除数 × 商 = ${b} × ${q} = ${b * q}。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const b = r(rand, 2, 9);
    const q = r(rand, 2, 9);
    return { prompt: `${b * q} 个桃子平均分给 ${q} 只小猴，每只分几个？`, answer: b, unit: '个', explain: `${b * q} ÷ ${q} = ${b}（个）。` };
  } }
];

const calendar = [
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const m = r(rand, 1, 12);
    const big = [1, 3, 5, 7, 8, 10, 12].includes(m);
    return { prompt: `${m} 月有多少天？`, answer: big ? 31 : (m === 2 ? 28 : 30), unit: '天', explain: `${m} 月${big ? '是大月，有 31 天' : m === 2 ? '是 2 月，平年 28 天' : '是小月，有 30 天'}。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const d = r(rand, 3, 20);
    const add = r(rand, 3, 10);
    return { prompt: `从 ${d} 日起再过 ${add} 天是几日？`, answer: d + add, unit: '日', explain: `${d} + ${add} = ${d + add}（日）。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const y = r(rand, 2004, 2030);
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    return { prompt: `${y} 年全年有多少天？`, answer: leap ? 366 : 365, unit: '天', explain: `${y} 年${leap ? '是闰年，有 366 天' : '是平年，有 365 天'}。` };
  } }
];

/* 集合（重叠问题）：三组语义不同外壳 ×3，供 G3 三个 kid 用 specOffset 1/4/7 分段使用 */
const logicOverlap = [
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const c = r(rand, 2, 8);
    const a = c + r(rand, 4, 15);
    const b = c + r(rand, 4, 15);
    return { prompt: `参加合唱队的有 ${a} 人，参加舞蹈队的有 ${b} 人，两队都参加的有 ${c} 人，至少参加一队的有多少人？`, answer: a + b - c, unit: '人', explain: `${a} + ${b} = ${a + b}，把都参加的 ${c} 人重复算了一次，再减去：${a + b - c}（人）。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const c = r(rand, 2, 8);
    const a = c + r(rand, 4, 15);
    const b = c + r(rand, 4, 15);
    const t = a + b - c;
    return { prompt: `至少参加一队的有 ${t} 人，其中参加合唱队的有 ${a} 人，两队都参加的有 ${c} 人，只参加舞蹈队的有多少人？`, answer: t - a, unit: '人', explain: `至少参加一队的 ${t} 人里去掉参加合唱队的 ${a} 人，剩下 ${t - a} 人只参加舞蹈队。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const c = r(rand, 2, 8);
    const a = c + r(rand, 4, 15);
    return { prompt: `参加合唱队的有 ${a} 人，两队都参加的有 ${c} 人，只参加合唱队的有多少人？`, answer: a - c, unit: '人', explain: `从 ${a} 人里去掉两队都参加的 ${c} 人，只剩 ${a - c} 人。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const c = r(rand, 2, 8);
    const a = c + r(rand, 4, 15);
    const b = c + r(rand, 4, 15);
    return { prompt: `爱吃苹果的有 ${a} 人，爱吃梨的有 ${b} 人，两种都爱吃的有 ${c} 人，一共调查了多少人？`, answer: a + b - c, unit: '人', explain: `${a} + ${b} - ${c} = ${a + b - c}（人），都吃的人被算了两遍，要减掉一次。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const c = r(rand, 2, 8);
    const a = c + r(rand, 4, 15);
    const b = c + r(rand, 4, 15);
    const within = a + b - c;
    const n = within + r(rand, 2, 8);
    return { prompt: `班级有 ${n} 人，喜欢数学的有 ${a} 人，喜欢语文的有 ${b} 人，两科都喜欢的有 ${c} 人，两科都不喜欢的有多少人？`, answer: n - within, unit: '人', explain: `至少喜欢一科的有 ${a} + ${b} - ${c} = ${within} 人，${n} - ${within} = ${n - within}（人）两科都不喜欢。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const c = r(rand, 2, 8);
    const a = c + r(rand, 4, 15);
    const b = c + r(rand, 4, 15);
    return { prompt: `喜欢数学的有 ${a} 人，喜欢语文的有 ${b} 人，两科都喜欢的有 ${c} 人，只喜欢一科的有多少人？`, answer: a + b - 2 * c, unit: '人', explain: `两科人数相加是 ${a + b}，两科都喜欢的 ${c} 人被算了两次，减去 2 次：${a + b - 2 * c}（人）。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const c = r(rand, 2, 8);
    const a = c + r(rand, 4, 15);
    const b = c + r(rand, 4, 15);
    const within = a + b - c;
    const n = within + r(rand, 2, 8);
    return { prompt: `一组报名的有 ${a} 人，二组报名的有 ${b} 人，两组都报名的有 ${c} 人，全班 ${n} 人，两个组都没报的有多少人？`, answer: n - within, unit: '人', explain: `至少报一个组的有 ${within} 人，${n} - ${within} = ${n - within}（人）两个组都没报。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const c = r(rand, 2, 8);
    const a = c + r(rand, 4, 15);
    return { prompt: `参加跑步的有 ${a} 人，两项都参加的有 ${c} 人，只参加跑步的有多少人？`, answer: a - c, unit: '人', explain: `${a} - ${c} = ${a - c}（人）只参加跑步。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const c = r(rand, 2, 8);
    const a = c + r(rand, 4, 15);
    const b = c + r(rand, 4, 15);
    return { prompt: `得到红花的有 ${a} 人，得到星星的有 ${b} 人，两样都得到的有 ${c} 人，至少得到一样的有多少人？`, answer: a + b - c, unit: '人', explain: `${a} + ${b} - ${c} = ${a + b - c}（人）。` };
  } }
];

/* 倍的关系：求倍数 / 求几倍量 / 情境比较 */
const timesRelation = [
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const b = r(rand, 2, 9);
    const k = r(rand, 2, 9);
    return { prompt: `${b * k} 是 ${b} 的几倍？`, answer: k, explain: `${b * k} ÷ ${b} = ${k}，所以是 ${k} 倍。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const b = r(rand, 3, 12);
    const k = r(rand, 2, 9);
    return { prompt: `二年级有 ${b} 人参加合唱，三年级参加的人数是二年级的 ${k} 倍，三年级有多少人参加？`, answer: b * k, unit: '人', explain: `${b} × ${k} = ${b * k}（人）。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const b = r(rand, 2, 9);
    const k = r(rand, 3, 9);
    return { prompt: `果园里有 ${b} 棵梨树，苹果树的棵数是梨树的 ${k} 倍，苹果树比梨树多多少棵？`, answer: b * k - b, unit: '棵', explain: `苹果树 ${b} × ${k} = ${b * k} 棵，比梨树多 ${b * k} - ${b} = ${b * k - b} 棵。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const b = r(rand, 2, 9);
    const k = r(rand, 2, 8);
    const m = r(rand, 1, 9);
    return { prompt: `比 ${b} 的 ${k} 倍多 ${m} 的数是多少？`, answer: b * k + m, explain: `先算 ${b} × ${k} = ${b * k}，再加 ${m}，得 ${b * k + m}。` };
  } }
];

/* 2、5、3 的倍数特征：三个外壳题面都带变量，避免同册内去重后为空 */
const multipleFeatures = [
  { askPattern: 'meaning-translate', level: 2, make(rand) {
    const n = r(rand, 101, 999);
    const sum = [...String(n)].reduce((s, d) => s + Number(d), 0);
    return { prompt: `${n} 的各位数字之和是多少？`, answer: sum, explain: `把各位数字相加：${[...String(n)].join(' + ')} = ${sum}，可以用它判断 ${n} 是不是 3 的倍数。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const tail = pick(rand, [0, 2, 4, 6, 8]);
    return { prompt: `个位数字为 ${tail} 的数，一定是（ ）的倍数。`, answer: '2', explain: '个位是 0、2、4、6、8 的数都是 2 的倍数。' };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const ok = r(rand, 0, 1) === 0;
    const base = r(rand, 20, 90) * 5;
    const n = ok ? base : base + 1;
    return { prompt: `${n} 是 5 的倍数吗？`, answer: ok ? '对' : '不对', explain: `5 的倍数个位是 0 或 5，${n} 的个位是 ${String(n).slice(-1)}，所以${ok ? '是' : '不是'}。` };
  } }
];

/* 找次品（天平）：三个外壳题面都带变量 */
const findDefective = [
  { askPattern: 'apply-solve', level: 3, make(rand) {
    const list = [[3, 1], [8, 2], [9, 2], [12, 3], [20, 3], [27, 3]];
    const [n, times] = pick(rand, list);
    return { prompt: `有 ${n} 个零件，其中 1 个是次品（轻一些），用天平至少称几次一定能找出次品？`, answer: times, unit: '次', explain: `把零件尽量平均分成 3 份，${n} 个至少要称 ${times} 次。` };
  } },
  { askPattern: 'inverse-recall', level: 3, make(rand) {
    const k = r(rand, 1, 3);
    return { prompt: `用天平称 ${k} 次，最多能从多少个零件中找出 1 个次品？`, answer: 3 ** k, unit: '个', explain: `每称一次把范围缩小到三分之一，${k} 次最多可从 3 的 ${k} 次方 = ${3 ** k} 个中找出。` };
  } },
  { askPattern: 'compare-operate', level: 3, make(rand) {
    const n = pick(rand, [6, 9, 12, 15, 18, 21, 24, 27]);
    return { prompt: `${n} 个零件里有 1 个次品，用天平称，第一次应该把这 ${n} 个尽量平均分成几份？`, answer: 3, unit: '份', explain: `把 ${n} 个尽量平均分成 3 份，称一次就能把范围缩小到三分之一。` };
  } }
];

export const EXTRA_DOMAINS = {
  'g1-count': countObject,
  'g1-order': numberOrder,
  'g1-compose': numberCompose,
  'g1-make10': makeTen,
  'g1-story': addsubStory,
  'g1-compare-q': addsubCompare,
  'g1-teen': teenNumber,
  'g1-addsub2': addsub2Digit,
  'g1-money': moneyUnit,
  'g3-addsub-word': addsubWord,
  'g3-addsub-check': addsubCheck,
  'g3-addsub-vertical': addsubVertical,
  'g3-estimate-apply': estimateApply,
  'g3-div-word': divWord,
  'div-quotient': divQuotient,
  calendar,
  'decimal-place': decimalPlace,
  'triangle-angle': triangleAngle,
  'shape-parallel': shapeParallel,
  'statistics-chart': statisticsChart,
  'logic-optimize': logicOptimize,
  'decimal-calc': decimalCalc,
  'statistics-chance': statisticsChance,
  'geometry-volume': geometryVolume,
  'logic-tree': logicTree,
  'fraction-add': fractionAdd,
  'fraction-calc': fractionCalc,
  'ratio-scale': ratioScale,
  'geometry-cylinder': geometryCylinder,
  'statistics-prob': statisticsProb,
  'logic-pigeon': logicPigeon,
  'logic-overlap': logicOverlap,
  'times-relation': timesRelation,
  'multiple-features': multipleFeatures,
  'find-defective': findDefective
};
