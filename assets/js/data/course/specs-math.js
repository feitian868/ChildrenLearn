/**
 * specs-math.js —— v5 P2 数学题型规格引擎
 *
 * 一个知识点（kid）≥3 个问法规格（specId = {kid}-s01/s02/s03），
 * 每个规格一个参数化生成器（按日期种子每天重建题面，沿用 v4 的 365 天不重复机制）。
 *
 * ★ 新内容默认 status:'pending-review'，不直接进抽题池；
 *   批次抽样 + 同规格批量放行（ROADMAP §4.5）后由 tasks.js 的 approved 集放行。
 * ★ 仿真脚本可传 simulateApproved 观察「放行后」的供给与收敛，不改变线上默认口径。
 * ★ 干扰项来自 typicalErrors（真实易错点），不用随机词。
 */

import { randInt, pick, shuffle, hashString } from '../../core/rng.js';
import { sourceOf } from './edition-profile.js';
import { VOLUME as MATH_G2_UP } from './volumes/math-g2-up.js';
import { VOLUME as MATH_G2_DOWN } from './volumes/math-g2-down.js';
import { VOLUME as MATH_G3_UP } from './volumes/math-g3-up.js';
import { VOLUME as MATH_G3_DOWN } from './volumes/math-g3-down.js';
import { VOLUME as MATH_G1_UP } from './volumes/math-g1-up.js';
import { VOLUME as MATH_G1_DOWN } from './volumes/math-g1-down.js';
import { VOLUME as MATH_G4_UP } from './volumes/math-g4-up.js';
import { VOLUME as MATH_G4_DOWN } from './volumes/math-g4-down.js';
import { VOLUME as MATH_G5_UP } from './volumes/math-g5-up.js';
import { VOLUME as MATH_G5_DOWN } from './volumes/math-g5-down.js';
import { VOLUME as MATH_G6_UP } from './volumes/math-g6-up.js';
import { VOLUME as MATH_G6_DOWN } from './volumes/math-g6-down.js';
import { GENERIC_DOMAINS } from './specs-math-generic.js';
import { EXTRA_DOMAINS } from './specs-math-extra.js';
import { G2_DOMAINS } from './specs-math-g2.js';

export const MATH_VOLUMES = [
  MATH_G1_UP, MATH_G1_DOWN, MATH_G2_UP, MATH_G2_DOWN,
  MATH_G3_UP, MATH_G3_DOWN, MATH_G4_UP, MATH_G4_DOWN,
  MATH_G5_UP, MATH_G5_DOWN, MATH_G6_UP, MATH_G6_DOWN
];

const REVIEW_BATCH = 'p2-math-batch-1';
const VARIANTS = 8;

const pad2 = (n) => String(n).padStart(2, '0');

/** 规格 id：{kid}-s01 / -s02 / -s03 */
export function specIdOf(kid, n) {
  return `${kid}-s${pad2(n)}`;
}

/** 一个 kid 的规格 id 列表：始终 s01/s02/s03…（外壳段由 specParams.specOffset 决定，不进 id） */
export function specIdsOf(kid, count = 3) {
  return Array.from({ length: count }, (_, i) => specIdOf(kid, i + 1));
}

function pickOptions(rand, correct, wrongs, need = 4) {
  const list = [];
  [correct, ...wrongs].forEach((x) => {
    const t = String(x);
    if (t !== String(correct) && !list.includes(t)) list.push(t);
  });
  if (typeof correct === 'number') {
    for (let step = 1; list.length < need - 1 && step < 200; step += 1) {
      [correct + step, correct - step].forEach((x) => {
        if (list.length < need - 1 && x !== correct && !list.includes(String(x))) list.push(String(x));
      });
    }
  }
  const options = shuffle(rand, [String(correct), ...list.slice(0, need - 1)]);
  return { type: 'choice', options, answer: options.indexOf(String(correct)) };
}

/* ============================================================
   领域规格库：每个领域 3 种问法（识记 → 回溯 → 应用/辨析）
   ============================================================ */
const DOMAINS = {
  /* 表内乘法：口诀直算 / 由积回溯 / 每份数×份数 */
  'mul-table': [
    {
      askPattern: 'product-recall', level: 1,
      make(rand) {
        const a = randInt(rand, 2, 9);
        const b = randInt(rand, 2, 9);
        return { prompt: `${a} × ${b} = （ ）`, answer: a * b, explain: `口诀：${a} ${b} ${a * b}，所以 ${a} × ${b} = ${a * b}。` };
      }
    },
    {
      askPattern: 'inverse-recall', level: 1,
      make(rand) {
        const a = randInt(rand, 2, 9);
        const b = randInt(rand, 2, 9);
        const p = a * b;
        return { ...pickOptions(rand, b, [a, b + 1, b - 1, a + 1]), prompt: `（ ）× ${a} = ${p}，括号里填几？`, explain: `想口诀：${a} × ${b} = ${p}，所以括号里填 ${b}。` };
      }
    },
    {
      askPattern: 'apply-solve', level: 2,
      make(rand) {
        const b = randInt(rand, 2, 9);
        const q = randInt(rand, 2, 9);
        return { prompt: `每盒有 ${b} 个苹果，一共 ${q} 盒，一共有多少个？`, answer: b * q, unit: '个', explain: `${b} × ${q} = ${b * q}（个）。` };
      }
    }
  ],

  /* 乘加、乘减：先算乘法 / 逆推 / 情境 */
  'mul-addsub': [
    {
      askPattern: 'product-recall', level: 1,
      make(rand) {
        const a = randInt(rand, 2, 9);
        const b = randInt(rand, 2, 9);
        const c = randInt(rand, 1, 20);
        return { prompt: `${a} × ${b} + ${c} = （ ）`, answer: a * b + c, explain: `先算乘法 ${a} × ${b} = ${a * b}，再算 ${a * b} + ${c} = ${a * b + c}。` };
      }
    },
    {
      askPattern: 'inverse-recall', level: 1,
      make(rand) {
        const a = randInt(rand, 2, 9);
        const b = randInt(rand, 2, 9);
        const p = a * b;
        const c = randInt(rand, 1, p - 1);
        const cFix = c === p - c ? (c + 1 < p ? c + 1 : c - 1) : c;
        return { prompt: `${a} × ${b} - （ ） = ${p - cFix}，括号里填几？`, answer: cFix, explain: `先算 ${a} × ${b} = ${p}，${p} - ${cFix} = ${p - cFix}，所以括号里填 ${cFix}。` };
      }
    },
    {
      askPattern: 'apply-solve', level: 2,
      make(rand) {
        const b = randInt(rand, 2, 9);
        const q = randInt(rand, 2, 6);
        const more = randInt(rand, 1, 9);
        return { prompt: `每排 ${b} 个座位，有 ${q} 排，另外还空着 ${more} 个座位没算进去。若把空座也加上，一共几个座位？`, answer: b * q + more, unit: '个', explain: `${b} × ${q} = ${b * q}，再加 ${more}，得 ${b * q + more}（个）。` };
      }
    }
  ],

  /* 有余数的除法：商余 / 余数上限 / 分物情境 */
  'div-remainder': [
    {
      askPattern: 'product-recall', level: 1,
      make(rand) {
        const b = randInt(rand, 3, 9);
        const q = randInt(rand, 2, 9);
        const r = randInt(rand, 1, b - 1);
        const n = b * q + r;
        return { ...pickOptions(rand, `商 ${q} 余 ${r}`, [`商 ${q + 1} 余 ${r}`, `商 ${q} 余 ${r === 1 ? r + 1 : r - 1}`, `商 ${q - 1 > 0 ? q - 1 : q + 2} 余 ${r}`], 4), prompt: `${n} ÷ ${b} 的商和余数是多少？`, explain: `${b} × ${q} = ${b * q}，${n} - ${b * q} = ${r}，余数要比除数小，所以商 ${q} 余 ${r}。` };
      }
    },
    {
      askPattern: 'inverse-recall', level: 1,
      make(rand) {
        const b = randInt(rand, 3, 9);
        return { prompt: `一个数除以 ${b}，余数最大是几？`, answer: b - 1, explain: `余数必须比除数小，除数是 ${b}，所以余数最大是 ${b - 1}。` };
      }
    },
    {
      askPattern: 'apply-solve', level: 2,
      make(rand) {
        const b = randInt(rand, 3, 9);
        const q = randInt(rand, 2, 9);
        const r = randInt(rand, 1, b - 1);
        const n = b * q + r;
        return { prompt: `有 ${n} 个橘子，每盘放 ${b} 个，能放满几盘？还剩几个？`, answer: `满 ${q} 盘，剩 ${r} 个`, explain: `${n} ÷ ${b} = ${q} 余 ${r}，所以能放满 ${q} 盘，还剩 ${r} 个。` };
      }
    }
  ],

  /* 长度单位换算：米厘米 / 千米米 / 复合 */
  'length-unit': [
    {
      askPattern: 'meaning-translate', level: 1,
      make(rand) {
        const x = randInt(rand, 2, 30);
        return { prompt: `${x} 米 = （ ）厘米`, answer: x * 100, unit: '厘米', explain: `1 米 = 100 厘米，${x} 米 = ${x * 100} 厘米。` };
      }
    },
    {
      askPattern: 'meaning-translate', level: 1,
      make(rand) {
        const x = randInt(rand, 2, 20);
        return { prompt: `${x} 千米 = （ ）米`, answer: x * 1000, unit: '米', explain: `1 千米 = 1000 米，${x} 千米 = ${x * 1000} 米。` };
      }
    },
    {
      askPattern: 'compare-operate', level: 2,
      make(rand) {
        const m = randInt(rand, 1, 9);
        const cm = randInt(rand, 1, 99);
        return { prompt: `${m} 米 ${cm} 厘米 = （ ）厘米`, answer: m * 100 + cm, unit: '厘米', explain: `${m} 米 = ${m * 100} 厘米，再加 ${cm} 厘米，共 ${m * 100 + cm} 厘米。` };
      }
    }
  ],

  /* 质量单位换算：千克克 / 吨千克 / 比较 */
  'mass-unit': [
    {
      askPattern: 'meaning-translate', level: 1,
      make(rand) {
        const x = randInt(rand, 2, 20);
        return { prompt: `${x} 千克 = （ ）克`, answer: x * 1000, unit: '克', explain: `1 千克 = 1000 克，${x} 千克 = ${x * 1000} 克。` };
      }
    },
    {
      askPattern: 'meaning-translate', level: 1,
      make(rand) {
        const x = randInt(rand, 2, 9);
        return { prompt: `${x} 吨 = （ ）千克`, answer: x * 1000, unit: '千克', explain: `1 吨 = 1000 千克，${x} 吨 = ${x * 1000} 千克。` };
      }
    },
    {
      askPattern: 'compare-operate', level: 2,
      make(rand) {
        const kg = randInt(rand, 1, 9);
        const g = randInt(rand, 1, 999);
        return { prompt: `${kg} 千克 ${g} 克 = （ ）克`, answer: kg * 1000 + g, unit: '克', explain: `${kg} 千克 = ${kg * 1000} 克，再加 ${g} 克，共 ${kg * 1000 + g} 克。` };
      }
    }
  ],

  /* 找规律：下一项 / 缺项 / 递减 */
  pattern: [
    {
      askPattern: 'product-recall', level: 1,
      make(rand) {
        const step = randInt(rand, 2, 9);
        const start = randInt(rand, 1, 60);
        const list = [start, start + step, start + 2 * step, start + 3 * step];
        return { prompt: `${list.join('、')}、（ ）`, answer: start + 4 * step, explain: `每次加 ${step}，所以下一个数是 ${start + 4 * step}。` };
      }
    },
    {
      askPattern: 'inverse-recall', level: 1,
      make(rand) {
        const step = randInt(rand, 2, 9);
        const start = randInt(rand, 1, 60);
        const list = [start, start + step, start + 2 * step, start + 3 * step];
        const blank = randInt(rand, 1, 2);
        return { prompt: `${list.map((n, i) => (i === blank ? '（ ）' : n)).join('、')}，缺少的数是几？`, answer: list[blank], explain: `每次加 ${step}，缺少的数是 ${list[blank]}。` };
      }
    },
    {
      askPattern: 'apply-solve', level: 2,
      make(rand) {
        const step = randInt(rand, 2, 9);
        const start = randInt(rand, 40, 90);
        const list = [start, start - step, start - 2 * step, start - 3 * step];
        return { prompt: `${list.join('、')}、（ ）`, answer: start - 4 * step, explain: `每次减 ${step}，所以下一个数是 ${start - 4 * step}。` };
      }
    }
  ],

  /* 数的大小比较：符号 / 最大数 / 相邻 */
  'compare-number': [
    {
      askPattern: 'compare-operate', level: 1,
      make(rand) {
        const a = randInt(rand, 100, 9999);
        const b = randInt(rand, 100, 9999);
        const correct = a > b ? '>' : a < b ? '<' : '=';
        return { ...pickOptions(rand, correct, ['>', '<', '='].filter((x) => x !== correct), 3), prompt: `${a} ○ ${b}，○ 里填什么符号？`, explain: `${a} ${correct} ${b}，所以填「${correct}」。` };
      }
    },
    {
      askPattern: 'inverse-recall', level: 1,
      make(rand) {
        const a = randInt(rand, 100, 999);
        const b = randInt(rand, 100, 999);
        const c = randInt(rand, 100, 999);
        const big = Math.max(a, b, c);
        return { ...pickOptions(rand, big, [a, b, c].filter((x) => x !== big), 3), prompt: `${a}、${b}、${c} 中最大的数是哪个？`, explain: `比较最高位后逐位比，最大的是 ${big}。` };
      }
    },
    {
      askPattern: 'apply-solve', level: 2,
      make(rand) {
        const a = randInt(rand, 1000, 9000);
        return { prompt: `比 ${a} 大 1 的数是（ ）`, answer: a + 1, explain: `${a} 后面一个数是 ${a} + 1 = ${a + 1}。` };
      }
    },
    {
      askPattern: 'apply-solve', level: 2,
      make(rand) {
        const a = randInt(rand, 100, 900);
        const b = randInt(rand, 10, 90);
        return { prompt: `甲数是 ${a}，乙数比甲数大 ${b}，乙数是多少？`, answer: a + b, explain: `乙数 = ${a} + ${b} = ${a + b}。` };
      }
    },
    {
      askPattern: 'inverse-recall', level: 2,
      make(rand) {
        const a = randInt(rand, 100, 900);
        const b = randInt(rand, 100, 900);
        const c = randInt(rand, 100, 900);
        const small = Math.min(a, b, c);
        return { ...pickOptions(rand, String(small), [a, b, c].filter((x) => x !== small), 3), prompt: `在 ${a}、${b}、${c} 这三个数里，最小的是哪一个？`, explain: `逐位比较后，最小的是 ${small}。` };
      }
    }
  ],

  /* 三位数加减：直算 / 填空 / 辨析（op: add|sub|mix） */
  'addsub-3digit': [
    {
      askPattern: 'product-recall', level: 1,
      make(rand, ctx) {
        const op = ctx.params?.op || 'add';
        const a = randInt(rand, 105, 899);
        if (op === 'sub') {
          const b = randInt(rand, 105, a - 100);
          return { prompt: `${a} - ${b} = （ ）`, answer: a - b, explain: `相同数位对齐，从个位减起，结果是 ${a - b}。` };
        }
        if (op === 'mix') {
          const b = randInt(rand, 105, 400);
          const c = randInt(rand, 20, a + b - 10);
          return { prompt: `${a} + ${b} - ${c} = （ ）`, answer: a + b - c, explain: `按从左到右：${a} + ${b} = ${a + b}，再减 ${c}，得 ${a + b - c}。` };
        }
        const b = randInt(rand, 105, 999 - a);
        return { prompt: `${a} + ${b} = （ ）`, answer: a + b, explain: `相同数位对齐，从个位加起，结果是 ${a + b}。` };
      }
    },
    {
      askPattern: 'inverse-recall', level: 1,
      make(rand, ctx) {
        const op = ctx.params?.op === 'sub' ? 'sub' : 'add';
        const a = randInt(rand, 105, 600);
        const b = randInt(rand, 105, 300);
        const c0 = op === 'sub' ? a - b : a + b;
        const c = b === c0 ? c0 - 1 : c0;
        return { prompt: `${a} ${op === 'sub' ? '-' : '+'} （ ） = ${c}，括号里填几？`, answer: b, explain: `由 ${a} ${op === 'sub' ? '-' : '+'} ${b} = ${c0}，得括号里填 ${b}。` };
      }
    },
    {
      askPattern: 'compare-operate', level: 2,
      make(rand, ctx) {
        const op = ctx.params?.op || 'add';
        const a = randInt(rand, 205, 499);
        const b = randInt(rand, 205, 499);
        const correct = op === 'sub' ? `相邻退位后要减 1` : `个位满十要向十位进 1`;
        return { ...pickOptions(rand, correct, ['不用管进位或退位', '从最高位开始加'], 3), prompt: `计算 ${a} ${op === 'sub' ? '-' : '+'} ${b} 时，最容易错在哪里？`, explain: `${op === 'sub' ? '个位不够减要从十位退 1，退位后十位要减 1' : '个位相加满十要向十位进 1，别漏加进位'}。` };
      }
    }
  ],

  /* 估算：大约多少 / 够不够 / 精确还是估算 */
  'estimate-addsub': [
    {
      askPattern: 'apply-solve', level: 1,
      make(rand) {
        const a = randInt(rand, 190, 490);
        const b = randInt(rand, 190, 390);
        const approx = Math.round((a + b) / 100) * 100;
        return { prompt: `${a} + ${b} 大约是多少？（取整百估算）`, answer: approx, explain: `把 ${a} 看作 ${Math.round(a / 100) * 100}，${b} 看作 ${Math.round(b / 100) * 100}，约等于 ${approx}。` };
      }
    },
    {
      askPattern: 'compare-operate', level: 2,
      make(rand) {
        const need = randInt(rand, 300, 600);
        const have = randInt(rand, 200, 500);
        const buy = randInt(rand, 100, 200);
        return { ...pickOptions(rand, `${have + buy >= need ? '够' : '不够'}`, [`${have + buy >= need ? '不够' : '够'}`, '一样多'], 3), prompt: `有 ${have} 元，再带来 ${buy} 元，要买 ${need} 元的东西，钱够吗？`, explain: `${have} + ${buy} = ${have + buy}，${have + buy} ${have + buy >= need ? '≥' : '<'} ${need}，所以${have + buy >= need ? '够' : '不够'}。` };
      }
    },
    {
      askPattern: 'meaning-translate', level: 2,
      make(rand) {
        const a = randInt(rand, 210, 480);
        const b = randInt(rand, 110, 280);
        const exact = a + b;
        return { ...pickOptions(rand, '精确计算', ['估算', '不用算', '只算个位'], 3), prompt: `问「${a} + ${b} 一共是多少」，应该用哪种方法？`, explain: `问「一共是多少」要精确计算，得 ${exact}；只有问「大约」才用估算。` };
      }
    }
  ],

  /* 多位数乘一位数：直算 / 进位辨析 / 应用 */
  'mul-multi-digit': [
    {
      askPattern: 'product-recall', level: 1,
      make(rand) {
        const a = rand() < 0.5 ? randInt(rand, 12, 99) : randInt(rand, 102, 999);
        const b = randInt(rand, 2, 9);
        return { prompt: `${a} × ${b} = （ ）`, answer: a * b, explain: `从个位起，用 ${b} 依次乘每一位，结果是 ${a * b}。` };
      }
    },
    {
      askPattern: 'inverse-recall', level: 1,
      make(rand) {
        const b = randInt(rand, 2, 9);
        const q = randInt(rand, 12, 99);
        return { prompt: `（ ）× ${b} = ${b * q}，括号里填几？`, answer: q, explain: `${b * q} ÷ ${b} = ${q}，所以括号里填 ${q}。` };
      }
    },
    {
      askPattern: 'apply-solve', level: 2,
      make(rand) {
        const a = randInt(rand, 102, 299);
        const b = randInt(rand, 2, 9);
        return { prompt: `一台机器每小时生产 ${a} 个零件，${b} 小时生产多少个？`, answer: a * b, unit: '个', explain: `${a} × ${b} = ${a * b}（个）。` };
      }
    }
  ],

  /* 乘法应用题：正向 / 逆向 / 两步 */
  'mul-application': [
    {
      askPattern: 'apply-solve', level: 1,
      make(rand) {
        const a = randInt(rand, 12, 99);
        const b = randInt(rand, 2, 9);
        return { prompt: `每箱有 ${a} 瓶牛奶，${b} 箱一共有多少瓶？`, answer: a * b, unit: '瓶', explain: `每份 ${a} 瓶，共 ${b} 份：${a} × ${b} = ${a * b}（瓶）。` };
      }
    },
    {
      askPattern: 'inverse-recall', level: 2,
      make(rand) {
        const a = randInt(rand, 12, 50);
        const b = randInt(rand, 3, 9);
        return { prompt: `${a * b} 个鸡蛋平均装进 ${a} 个盒子，每盒装几个？`, answer: b, unit: '个', explain: `${a * b} ÷ ${a} = ${b}（个）。` };
      }
    },
    {
      askPattern: 'apply-solve', level: 2,
      make(rand) {
        const a = randInt(rand, 12, 40);
        const b = randInt(rand, 3, 9);
        const c = randInt(rand, 5, 30);
        return { prompt: `每排 ${a} 人，共 ${b} 排，另有 ${c} 位老师。学生和老师一共多少人？`, answer: a * b + c, unit: '人', explain: `学生 ${a} × ${b} = ${a * b} 人，再加 ${c} 位老师，共 ${a * b + c} 人。` };
      }
    }
  ],

  /* 四则混合运算：先乘后加 / 括号 / 辨析 */
  'order-ops': [
    {
      askPattern: 'product-recall', level: 1,
      make(rand) {
        const a = randInt(rand, 10, 200);
        const b = randInt(rand, 2, 9);
        const c = randInt(rand, 2, 9);
        return { prompt: `${a} + ${b} × ${c} = （ ）`, answer: a + b * c, explain: `先算乘法 ${b} × ${c} = ${b * c}，再算 ${a} + ${b * c} = ${a + b * c}。` };
      }
    },
    {
      askPattern: 'apply-solve', level: 2,
      make(rand) {
        const a = randInt(rand, 10, 40);
        const b = randInt(rand, 10, 40);
        const c = randInt(rand, 2, 9);
        return { prompt: `（${a} + ${b}）× ${c} = （ ）`, answer: (a + b) * c, explain: `先算括号里 ${a} + ${b} = ${a + b}，再乘 ${c}，得 ${(a + b) * c}。` };
      }
    },
    {
      askPattern: 'compare-operate', level: 2,
      make(rand) {
        const a = randInt(rand, 10, 50);
        const b = randInt(rand, 2, 9);
        const c = randInt(rand, 2, 9);
        return { ...pickOptions(rand, '先算乘法', ['从左往右算', '先算加法'], 3), prompt: `计算 ${a} + ${b} × ${c} 时先算什么？`, explain: `没有括号时，先乘除后加减，所以先算 ${b} × ${c}。` };
      }
    },
    {
      askPattern: 'apply-solve', level: 2,
      make(rand) {
        const a = randInt(rand, 2, 9);
        const b = randInt(rand, 3, 8);
        const c = randInt(rand, 5, 30);
        return { prompt: `学校买来 ${a} 盒彩笔，每盒 ${b} 支，又买来 ${c} 支散的，现在一共有多少支？`, answer: a * b + c, unit: '支', explain: `${a} × ${b} = ${a * b}，再加 ${c}，共 ${a * b + c} 支。` };
      }
    },
    {
      askPattern: 'inverse-recall', level: 2,
      make(rand) {
        const per = randInt(rand, 5, 20);
        const days = randInt(rand, 3, 9);
        const total = per * days + randInt(rand, 1, 20);
        return { prompt: `一本故事书有 ${total} 页，小明每天读 ${per} 页，读了 ${days} 天，还剩多少页？`, answer: total - per * days, unit: '页', explain: `已读 ${per} × ${days} = ${per * days} 页，还剩 ${total} - ${per * days} = ${total - per * days} 页。` };
      }
    }
  ],

  /* 长方形周长：直算 / 逆求 / 正方形 */
  'perimeter-rectangle': [
    {
      askPattern: 'apply-solve', level: 1,
      make(rand) {
        const l = randInt(rand, 4, 40);
        const w = randInt(rand, 2, l - 1);
        return { prompt: `一个长方形长 ${l} 厘米，宽 ${w} 厘米，周长是多少厘米？`, answer: 2 * (l + w), unit: '厘米', explain: `周长 =（长 + 宽）× 2 =（${l} + ${w}）× 2 = ${2 * (l + w)} 厘米。` };
      }
    },
    {
      askPattern: 'inverse-recall', level: 2,
      make(rand) {
        const l = randInt(rand, 10, 40);
        const w = randInt(rand, 2, 9);
        const p = 2 * (l + w);
        return { prompt: `一个长方形周长 ${p} 厘米，长 ${l} 厘米，宽是多少厘米？`, answer: w, unit: '厘米', explain: `${p} ÷ 2 = ${l + w}，${l + w} - ${l} = ${w} 厘米。` };
      }
    },
    {
      askPattern: 'apply-solve', level: 1,
      make(rand) {
        const s = randInt(rand, 3, 30);
        return { prompt: `一个正方形的边长是 ${s} 厘米，周长是多少厘米？`, answer: 4 * s, unit: '厘米', explain: `正方形周长 = 边长 × 4 = ${s} × 4 = ${4 * s} 厘米。` };
      }
    }
  ],

  /* 长方形面积：直算 / 逆求 / 单位辨析 */
  'area-rectangle': [
    {
      askPattern: 'apply-solve', level: 1,
      make(rand) {
        const l = randInt(rand, 4, 30);
        const w = randInt(rand, 2, 24);
        return { prompt: `一个长方形长 ${l} 厘米，宽 ${w} 厘米，面积是多少平方厘米？`, answer: l * w, unit: '平方厘米', explain: `面积 = 长 × 宽 = ${l} × ${w} = ${l * w} 平方厘米。` };
      }
    },
    {
      askPattern: 'inverse-recall', level: 2,
      make(rand) {
        const l = randInt(rand, 5, 30);
        const w = randInt(rand, 2, 9);
        return { prompt: `一个长方形面积 ${l * w} 平方厘米，长 ${l} 厘米，宽是多少厘米？`, answer: w, unit: '厘米', explain: `${l * w} ÷ ${l} = ${w} 厘米。` };
      }
    },
    {
      askPattern: 'compare-operate', level: 2,
      make(rand) {
        const l = randInt(rand, 4, 20);
        const w = randInt(rand, 2, 9);
        const correct = '平方厘米';
        return { ...pickOptions(rand, correct, ['厘米', '厘米 × 厘米', '平方'], 3), prompt: `长 ${l} 厘米、宽 ${w} 厘米的长方形，面积单位应该写什么？`, explain: `面积用面积单位，答案是 ${l * w} 平方厘米，单位写「平方厘米」。` };
      }
    }
  ],

  /* 除数是一位数的除法：直算 / 商中间 0 / 应用 */
  'div-1digit': [
    {
      askPattern: 'product-recall', level: 1,
      make(rand) {
        const b = randInt(rand, 2, 9);
        const q = randInt(rand, 21, Math.floor(999 / b));
        return { prompt: `${b * q} ÷ ${b} = （ ）`, answer: q, explain: `从最高位除起，${b * q} ÷ ${b} = ${q}。` };
      }
    },
    {
      askPattern: 'inverse-recall', level: 1,
      make(rand) {
        const b = randInt(rand, 2, 9);
        const q = randInt(rand, 105, 199);
        return { prompt: `${b * q} ÷ ${b} = （ ）`, answer: q, explain: `商中间有 0 不能漏写：${b * q} ÷ ${b} = ${q}。` };
      }
    },
    {
      askPattern: 'apply-solve', level: 2,
      make(rand) {
        const b = randInt(rand, 2, 9);
        const q = randInt(rand, 20, 90);
        return { prompt: `有 ${b * q} 本书，平均分给 ${b} 个班，每班分多少本？`, answer: q, unit: '本', explain: `${b * q} ÷ ${b} = ${q}（本）。` };
      }
    },
    {
      askPattern: 'apply-solve', level: 2,
      make(rand) {
        const b = randInt(rand, 2, 9);
        const q = randInt(rand, 20, 90);
        const rem = randInt(rand, 1, b - 1);
        const n = b * q + rem;
        return { prompt: `${n} 个鸡蛋，每盒装 ${b} 个，能装满多少盒？`, answer: q, unit: '盒', explain: `${n} ÷ ${b} = ${q} 余 ${rem}，能装满 ${q} 盒，还剩 ${rem} 个。` };
      }
    },
    {
      askPattern: 'inverse-recall', level: 2,
      make(rand) {
        const b = randInt(rand, 3, 9);
        const q = randInt(rand, 10, 99);
        return { prompt: `一个数的 ${b} 倍是 ${b * q}，这个数是多少？`, answer: q, explain: `${b * q} ÷ ${b} = ${q}。` };
      }
    }
  ]
};

/* ============================================================
   生成器：kid → 规格题
   ============================================================ */

// P2 通用领域（g1 / g4 / g5 / g6）与试点领域合并
Object.assign(DOMAINS, GENERIC_DOMAINS);
// P2 语义外壳补充域（按年级专用，保证同册 kid 不共用同一问法）
Object.assign(DOMAINS, EXTRA_DOMAINS);
// 二年级骨架册补齐专用域（避开二年级超纲词）
Object.assign(DOMAINS, G2_DOMAINS);

// 规格 id 与领域实际外壳数对齐：同域可用 specParams.specOffset 取不同外壳段
// （同册不同 kid 不共用外壳），每个 kid 至少 3 个外壳，specId 元数据不虚报。
for (const volume of MATH_VOLUMES) {
  for (const unit of volume.units) {
    for (const lesson of unit.lessons || []) {
      for (const kid of lesson.knowledge || []) {
        const domain = DOMAINS[kid.specDomain];
        if (!domain) continue;
        const off = Math.max(0, Number((kid.specParams || {}).specOffset || 1) - 1);
        const start = domain.length - off >= 3 ? off : 0;
        const lim = Number((kid.specParams || {}).specCount || 7);
        const count = Math.max(3, Math.min(7, lim, domain.length - start));
        kid.specIds = specIdsOf(kid.id, count);
      }
    }
  }
}

function makeQuestion(volume, unit, lesson, kid, specNo, domainSpec, rand) {
  const made = domainSpec.make(rand, { params: kid.specParams || {} });
  if (!made || made.answer === undefined || made.answer === null) return null;
  const specId = specIdOf(kid.id, specNo);
  return {
    id: `${specId}-${hashString(`${made.prompt}|${made.answer}`)}`,
    subject: 'math',
    grade: volume.grade,
    level: domainSpec.level,
    difficulty: kid.difficulty || 1,
    topic: lesson.topic,
    type: made.type || 'input',
    prompt: made.prompt,
    ...(made.options ? { options: made.options } : {}),
    answer: made.answer,
    ...(made.unit ? { unit: made.unit } : {}),
    explain: made.explain,
    source: sourceOf(volume, unit.name),
    // v5 结构化字段
    edition: volume.edition,
    term: volume.term,
    unitId: unit.id,
    lessonId: lesson.id,
    knowledgeId: kid.id,
    specId,
    askPattern: domainSpec.askPattern,
    status: 'pending-review',
    reviewBatch: REVIEW_BATCH
  };
}

/**
 * 单册规格题池：按册遍历 kid，每个 kid 的每个 specDomain 产出 VARIANTS 道。
 * simulateApproved=true 仅用于验收仿真（线上默认由 tasks.js 按 approved 过滤）。
 */
export function specPoolOfVolume(volume, rand, { simulateApproved = false } = {}) {
  const items = [];
  for (const unit of volume.units) {
    for (const lesson of unit.lessons) {
      for (const kid of lesson.knowledge || []) {
        const domain = DOMAINS[kid.specDomain];
        if (!domain) continue;
        const off = Math.max(0, Number((kid.specParams || {}).specOffset || 1) - 1);
        const start = domain.length - off >= 3 ? off : 0;
        const count = Math.min(domain.length - start, (kid.specIds || []).length || 3);
        for (let si = 0; si < count; si += 1) {
          const spec = domain[start + si];
          for (let v = 0; v < VARIANTS; v += 1) {
            const q = makeQuestion(volume, unit, lesson, kid, si + 1, spec, rand);
            if (!q) continue;
            if (items.some((x) => x.prompt === q.prompt && x.answer === q.answer)) continue;
            items.push(simulateApproved ? { ...q, status: 'approved' } : q);
          }
        }
      }
    }
  }
  return items;
}

/** 某年级全部册的规格题（用于 mathPool 接入） */
export function specPoolOfGrade(grade, rand, opts = {}) {
  return MATH_VOLUMES
    .filter((v) => v.grade === Number(grade))
    .flatMap((v) => specPoolOfVolume(v, rand, opts));
}

/** 领域覆盖清单（验收报告用） */
export function specDomainNames() {
  return Object.keys(DOMAINS);
}

export const SPEC_VARIANTS_PER_SPEC = VARIANTS;
export const SPEC_REVIEW_BATCH = REVIEW_BATCH;
