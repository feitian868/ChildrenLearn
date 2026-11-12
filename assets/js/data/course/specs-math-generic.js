/**
 * specs-math-generic.js —— P2 通用问法领域（g1 / g4 / g5 / g6 复用）
 *
 * 每个领域 3 种问法（识记/理解 → 回溯 → 应用/辨析），由 kid.specParams 决定具体形态。
 * 与 specs-math.js 的试点领域合并使用；不产生新题入库，只做参数化生成。
 */

import { randInt, pick, shuffle } from '../../core/rng.js';

const fmt = (n) => String(Math.round(Number(n) * 100) / 100);
const gcd = (a, b) => {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
};
const frac = (n, d) => {
  const g = gcd(n, d);
  const nn = n / g;
  const dd = d / g;
  return dd === 1 ? String(nn) : `${nn}/${dd}`;
};

function pickOptions(rand, correct, wrongs, need = 4) {
  const list = [];
  [correct, ...wrongs].forEach((x) => {
    if (String(x) !== String(correct) && !list.includes(String(x))) list.push(String(x));
  });
  if (typeof correct === 'number') {
    for (let step = 1; list.length < need - 1 && step < 200; step += 1) {
      [correct + step, correct - step].forEach((x) => {
        if (list.length < need - 1 && !list.includes(String(x))) list.push(String(x));
      });
    }
  }
  const options = shuffle(rand, [String(correct), ...list.slice(0, need - 1)]);
  return { type: 'choice', options, answer: options.indexOf(String(correct)) };
}

/* ---------- 领域实现 ---------- */

const arith = [
  {
    askPattern: 'product-recall', level: 1,
    make(rand, ctx) {
      const p = ctx.params || {};
      const op = p.op || '+';
      const min = p.min ?? (op === '×' || op === '÷' ? 2 : 1);
      const max = p.max ?? 100;
      let a = randInt(rand, min, max);
      let b = randInt(rand, min, max);
      if (op === '-' || op === '÷') { if (a < b) [a, b] = [b, a]; }
      if (op === '÷') { const q = randInt(rand, min, max); b = randInt(rand, 2, 9); a = b * q; }
      const ans = op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : a / b;
      return { prompt: `${a} ${op} ${b} = （ ）`, answer: ans, explain: `按 ${op} 计算，${a} ${op} ${b} = ${fmt(ans)}。` };
    }
  },
  {
    askPattern: 'inverse-recall', level: 1,
    make(rand, ctx) {
      const p = ctx.params || {};
      const op = p.op || '+';
      const min = p.min ?? 1;
      const max = p.max ?? 50;
      if (op === '×') {
        const b = randInt(rand, 2, 9);
        const q = randInt(rand, min, max);
        return { prompt: `（ ）× ${b} = ${b * q}，括号里填几？`, answer: q, explain: `${b * q} ÷ ${b} = ${q}，所以括号里填 ${q}。` };
      }
      let a = randInt(rand, min, max);
      let b = randInt(rand, min, max);
      if (op === '-' && a < b) { const t = a; a = b; b = t; }
      // 避免「括号答案 = 等号右边结果」的巧合，否则会被误判为答案泄漏
      if (b === (op === '-' ? a - b : a + b)) b = b === min ? b + 1 : b - 1;
      if (op === '-' && a < b) { const t = a; a = b; b = t; }
      const c = op === '-' ? a - b : a + b;
      return { prompt: `${a} ${op} （ ） = ${c}，括号里填几？`, answer: b, explain: `由 ${a} ${op} ${b} = ${c}，所以括号里填 ${b}。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand, ctx) {
      const p = ctx.params || {};
      const op = p.op || '+';
      const min = p.min ?? 1;
      const max = p.max ?? 50;
      const a = randInt(rand, min, max);
      const b = randInt(rand, min, max);
      if (op === '-') {
        const big = Math.max(a, b);
        const small = Math.min(a, b);
        return { prompt: `篮子里有 ${big} 个苹果，拿走 ${small} 个，还剩多少个？`, answer: big - small, unit: '个', explain: `${big} - ${small} = ${big - small}（个）。` };
      }
      if (op === '×') {
        return { prompt: `每盒 ${a} 支笔，${b} 盒一共多少支？`, answer: a * b, unit: '支', explain: `${a} × ${b} = ${a * b}（支）。` };
      }
      if (op === '÷') {
        return { prompt: `${a * b} 块糖平均分给 ${b} 人，每人几块？`, answer: a, unit: '块', explain: `${a * b} ÷ ${b} = ${a}（块）。` };
      }
      return { prompt: `小明有 ${a} 张卡片，又得到 ${b} 张，一共多少张？`, answer: a + b, unit: '张', explain: `${a} + ${b} = ${a + b}（张）。` };
    }
  }
];

const numberRead = [
  {
    askPattern: 'compare-operate', level: 1,
    make(rand, ctx) {
      const p = ctx.params || {};
      const max = p.max ?? 100;
      const a = randInt(rand, 1, max);
      const b = randInt(rand, 1, max);
      const correct = a > b ? '>' : a < b ? '<' : '=';
      return { ...pickOptions(rand, correct, ['>', '<', '='].filter((x) => x !== correct), 3), prompt: `${a} ○ ${b}，○ 里填什么？`, explain: `${a} ${correct} ${b}，所以填「${correct}」。` };
    }
  },
  {
    askPattern: 'meaning-translate', level: 1,
    make(rand, ctx) {
      const p = ctx.params || {};
      const max = p.max ?? 100;
      // max < 20 时在 2~max 内变化，避免固定成 10 导致题面重复
      const lo = max < 20 ? Math.min(2, max) : 11;
      const n = randInt(rand, lo, max);
      if (n < 10) {
        return { prompt: `从 1 数到 ${n}，一共数了几个数？`, answer: n, explain: `从 1 数到 ${n}，一共 ${n} 个数。` };
      }
      const ten = Math.floor(n / 10);
      const one = n % 10;
      return { prompt: `${n} 是由（ ）个十和 ${one} 个一组成的。`, answer: ten, explain: `${n} 的十位是 ${ten}、个位是 ${one}，所以是 ${ten} 个十和 ${one} 个一。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand, ctx) {
      const p = ctx.params || {};
      const max = p.max ?? 100;
      const a = randInt(rand, 2, max - 1);
      const mode = p.mode || 'next';
      if (mode === 'prev') return { prompt: `比 ${a} 小 1 的数是（ ）`, answer: a - 1, explain: `${a} 前面一个数是 ${a - 1}。` };
      return { prompt: `比 ${a} 大 1 的数是（ ）`, answer: a + 1, explain: `${a} 后面一个数是 ${a + 1}。` };
    }
  }
];

const measure = [
  {
    askPattern: 'meaning-translate', level: 1,
    make(rand, ctx) {
      const p = ctx.params || {};
      const factor = p.factor || 100;
      const from = p.from || '米';
      const to = p.to || '厘米';
      const x = randInt(rand, 2, 30);
      return { prompt: `${x} ${from} = （ ）${to}`, answer: x * factor, unit: to, explain: `1 ${from} = ${factor} ${to}，${x} ${from} = ${x * factor} ${to}。` };
    }
  },
  {
    askPattern: 'inverse-recall', level: 1,
    make(rand, ctx) {
      const p = ctx.params || {};
      const factor = p.factor || 100;
      const from = p.from || '米';
      const to = p.to || '厘米';
      const x = randInt(rand, 2, 20);
      return { prompt: `${x * factor} ${to} = （ ）${from}`, answer: x, unit: from, explain: `${x * factor} ÷ ${factor} = ${x}，所以是 ${x} ${from}。` };
    }
  },
  {
    askPattern: 'compare-operate', level: 2,
    make(rand, ctx) {
      const p = ctx.params || {};
      const factor = p.factor || 100;
      const from = p.from || '米';
      const to = p.to || '厘米';
      const big = randInt(rand, 1, 9);
      const small = randInt(rand, 1, factor - 1);
      return { prompt: `${big} ${from} ${small} ${to} = （ ）${to}`, answer: big * factor + small, unit: to, explain: `${big} ${from} = ${big * factor} ${to}，再加 ${small} ${to}，共 ${big * factor + small} ${to}。` };
    }
  }
];

const PLANE_SHAPES = ['长方形', '正方形', '三角形', '圆', '五边形', '六边形'];
const SOLID_SHAPES = ['正方体', '长方体', '圆柱', '球', '三棱柱'];
const PLANE_ATTRS = [
  { shape: '长方形', attr: '条边', n: 4 },
  { shape: '长方形', attr: '个角', n: 4 },
  { shape: '正方形', attr: '条边', n: 4 },
  { shape: '正方形', attr: '个角', n: 4 },
  { shape: '三角形', attr: '条边', n: 3 },
  { shape: '三角形', attr: '个角', n: 3 },
  { shape: '五边形', attr: '条边', n: 5 },
  { shape: '六边形', attr: '条边', n: 6 }
];
const SOLID_ATTRS = [
  { shape: '正方体', attr: '个面', n: 6 },
  { shape: '正方体', attr: '条棱', n: 12 },
  { shape: '正方体', attr: '个顶点', n: 8 },
  { shape: '长方体', attr: '个面', n: 6 },
  { shape: '长方体', attr: '条棱', n: 12 },
  { shape: '三棱柱', attr: '个面', n: 5 },
  { shape: '三棱柱', attr: '条棱', n: 9 }
];
const SHAPE_PROPS = {
  plane: [
    { correct: '三角形', wrong: ['长方形', '正方形', '圆'], prompt: '哪种图形具有稳定性，最不容易变形？', why: '三角形具有稳定性。' },
    { correct: '圆', wrong: ['长方形', '三角形', '五边形'], prompt: '哪种图形没有角？', why: '圆是一条封闭曲线，没有角。' },
    { correct: '正方形', wrong: ['长方形', '三角形', '圆'], prompt: '哪种图形的四条边一样长？', why: '正方形四条边一样长。' },
    { correct: '长方形', wrong: ['三角形', '圆', '五边形'], prompt: '哪种图形的对边相等，四个角都是直角？', why: '长方形对边相等，四个角都是直角。' },
    { correct: '五边形', wrong: ['三角形', '正方形', '圆'], prompt: '哪种图形由五条边围成？', why: '五边形由五条边围成。' },
    { correct: '六边形', wrong: ['五边形', '三角形', '长方形'], prompt: '哪种图形有六条边？', why: '六边形有六条边。' }
  ],
  solid: [
    { correct: '球', wrong: ['正方体', '长方体', '圆柱'], prompt: '哪种立体图形没有平平的面，放在桌上能向各个方向滚动？', why: '球没有平平的面，向各个方向都能滚动。' },
    { correct: '圆柱', wrong: ['正方体', '长方体', '球'], prompt: '哪种立体图形上下两个面都是圆？', why: '圆柱上下两个面都是圆。' },
    { correct: '正方体', wrong: ['长方体', '圆柱', '球'], prompt: '哪种立体图形的每个面都是正方形？', why: '正方体每个面都是正方形。' },
    { correct: '三棱柱', wrong: ['正方体', '圆柱', '球'], prompt: '哪种立体图形有五个面？', why: '三棱柱有五个面。' }
  ]
};

const shape = [
  {
    askPattern: 'meaning-translate', level: 1,
    make(rand, ctx) {
      const p = ctx.params || {};
      const solid = p.kind === 'solid';
      const set = solid ? SOLID_SHAPES : PLANE_SHAPES;
      const correct = pick(rand, set);
      return { ...pickOptions(rand, correct, set.filter((x) => x !== correct), 4), prompt: `下面哪个是${solid ? '立体' : '平面'}图形？`, explain: `${correct} 是${solid ? '立体' : '平面'}图形。` };
    }
  },
  {
    askPattern: 'product-recall', level: 1,
    make(rand, ctx) {
      const p = ctx.params || {};
      const target = pick(rand, p.kind === 'solid' ? SOLID_ATTRS : PLANE_ATTRS);
      return { prompt: `一个${target.shape}有（ ）${target.attr}。`, answer: target.n, explain: `${target.shape}有 ${target.n} ${target.attr}。` };
    }
  },
  {
    askPattern: 'compare-operate', level: 2,
    make(rand, ctx) {
      const p = ctx.params || {};
      const bank = SHAPE_PROPS[p.kind === 'solid' ? 'solid' : 'plane'];
      const item = pick(rand, bank);
      return { ...pickOptions(rand, item.correct, item.wrong, 4), prompt: item.prompt, explain: item.why };
    }
  },
  {
    askPattern: 'inverse-recall', level: 1,
    make(rand, ctx) {
      const solid = (ctx.params || {}).kind === 'solid';
      if (solid) {
        return { ...pickOptions(rand, '三棱柱', ['正方体', '圆柱', '球'], 4), prompt: '哪种立体图形有 5 个面？', explain: '三棱柱有 5 个面。' };
      }
      const n = pick(rand, [3, 5, 6]);
      const correct = n === 3 ? '三角形' : n === 5 ? '五边形' : '六边形';
      return { ...pickOptions(rand, correct, PLANE_SHAPES.filter((x) => x !== correct), 4), prompt: `哪种平面图形有 ${n} 条边？`, explain: `${correct}有 ${n} 条边。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand, ctx) {
      const solid = (ctx.params || {}).kind === 'solid';
      const a = randInt(rand, 2, 9); const b = randInt(rand, 2, 9); const c = randInt(rand, 2, 9);
      if (solid) {
        return { prompt: `桌上有 ${a} 个正方体、${b} 个圆柱、${c} 个球，一共有几个立体图形？`, answer: a + b + c, unit: '个', explain: `${a} + ${b} + ${c} = ${a + b + c}（个）。` };
      }
      return { prompt: `桌上有 ${a} 个长方形、${b} 个三角形、${c} 个圆，一共有几个平面图形？`, answer: a + b + c, unit: '个', explain: `${a} + ${b} + ${c} = ${a + b + c}（个）。` };
    }
  }
];

const geometry = [
  {
    askPattern: 'apply-solve', level: 1,
    make(rand) { return null; } // 占位，实际由下方公式分派覆盖
  }
];

function geometryMake(kind, mode) {
  return (rand) => {
    if (kind === 'rect-perimeter') {
      const l = randInt(rand, 4, 40); const w = randInt(rand, 2, l - 1);
      if (mode === 'inverse') return { prompt: `长方形周长 ${2 * (l + w)} 厘米，长 ${l} 厘米，宽是多少厘米？`, answer: w, unit: '厘米', explain: `周长 ÷ 2 = ${l + w}，再减长 ${l} 得宽 ${w}。` };
      return { prompt: `长方形长 ${l} 厘米、宽 ${w} 厘米，周长是多少？`, answer: 2 * (l + w), unit: '厘米', explain: `（${l} + ${w}）× 2 = ${2 * (l + w)} 厘米。` };
    }
    if (kind === 'rect-area') {
      const l = randInt(rand, 4, 30); const w = randInt(rand, 2, 20);
      if (mode === 'inverse') return { prompt: `长方形面积 ${l * w} 平方厘米，长 ${l} 厘米，宽是多少？`, answer: w, unit: '厘米', explain: `${l * w} ÷ ${l} = ${w} 厘米。` };
      return { prompt: `长方形长 ${l} 厘米、宽 ${w} 厘米，面积是多少？`, answer: l * w, unit: '平方厘米', explain: `${l} × ${w} = ${l * w} 平方厘米。` };
    }
    if (kind === 'triangle-area' && mode === 'inverse') {
      const b = randInt(rand, 2, 10) * 2; const h = randInt(rand, 3, 15);
      return { prompt: `一个三角形的面积是 ${b * h / 2} 平方厘米，底是 ${b} 厘米，高是多少厘米？`, answer: h, unit: '厘米', explain: `面积 × 2 ÷ 底 = ${b * h / 2} × 2 ÷ ${b} = ${h} 厘米。` };
    }
    if (kind === 'triangle-area') {
      const b = randInt(rand, 4, 20) * 2; const h = randInt(rand, 3, 15);
      return { prompt: `三角形底 ${b} 厘米、高 ${h} 厘米，面积是多少？`, answer: b * h / 2, unit: '平方厘米', explain: `底 × 高 ÷ 2 = ${b} × ${h} ÷ 2 = ${b * h / 2} 平方厘米。` };
    }
    if (kind === 'parallelogram-area') {
      const b = randInt(rand, 4, 20); const h = randInt(rand, 3, 15);
      return { prompt: `平行四边形底 ${b} 厘米、高 ${h} 厘米，面积是多少？`, answer: b * h, unit: '平方厘米', explain: `底 × 高 = ${b} × ${h} = ${b * h} 平方厘米。` };
    }
    if (kind === 'trapezoid-area') {
      const a = randInt(rand, 2, 10); const b = a + randInt(rand, 2, 10); const h = randInt(rand, 2, 12);
      return { prompt: `梯形上底 ${a} 厘米、下底 ${b} 厘米、高 ${h} 厘米，面积是多少？`, answer: (a + b) * h / 2, unit: '平方厘米', explain: `（上底 + 下底）× 高 ÷ 2 =（${a} + ${b}）× ${h} ÷ 2 = ${(a + b) * h / 2}。` };
    }
    if (kind === 'circle-area' && mode === 'inverse') {
      const r = randInt(rand, 2, 10);
      return { prompt: `一个圆的面积是 ${fmt(3.14 * r * r)} 平方厘米，它的半径是多少厘米？（π 取 3.14）`, answer: r, unit: '厘米', explain: `3.14 × r² = ${fmt(3.14 * r * r)}，r² = ${r * r}，半径是 ${r} 厘米。` };
    }
    if (kind === 'circle-circumference' && mode === 'inverse') {
      const r = randInt(rand, 2, 10);
      return { prompt: `一个圆的周长是 ${fmt(2 * 3.14 * r)} 厘米，它的半径是多少厘米？（π 取 3.14）`, answer: r, unit: '厘米', explain: `2 × 3.14 × r = ${fmt(2 * 3.14 * r)}，半径是 ${r} 厘米。` };
    }
    if (kind === 'circle-area') {
      const r = randInt(rand, 2, 10);
      return { prompt: `圆的半径 ${r} 厘米，面积是多少？（π 取 3.14）`, answer: fmt(3.14 * r * r), unit: '平方厘米', explain: `πr² = 3.14 × ${r} × ${r} = ${fmt(3.14 * r * r)} 平方厘米。` };
    }
    if (kind === 'circle-circumference') {
      const r = randInt(rand, 2, 10);
      return { prompt: `圆的半径 ${r} 厘米，周长是多少？（π 取 3.14）`, answer: fmt(2 * 3.14 * r), unit: '厘米', explain: `2πr = 2 × 3.14 × ${r} = ${fmt(2 * 3.14 * r)} 厘米。` };
    }
    if (kind === 'cuboid-volume') {
      const a = randInt(rand, 2, 12); const b = randInt(rand, 2, 12); const c = randInt(rand, 2, 12);
      return { prompt: `长方体长 ${a} 厘米、宽 ${b} 厘米、高 ${c} 厘米，体积是多少？`, answer: a * b * c, unit: '立方厘米', explain: `${a} × ${b} × ${c} = ${a * b * c} 立方厘米。` };
    }
    if (kind === 'cuboid-surface') {
      const a = randInt(rand, 2, 8); const b = randInt(rand, 2, 8); const c = randInt(rand, 2, 8);
      return { prompt: `长方体长 ${a} 厘米、宽 ${b} 厘米、高 ${c} 厘米，表面积是多少？`, answer: 2 * (a * b + a * c + b * c), unit: '平方厘米', explain: `2×（ab + ac + bc）= ${2 * (a * b + a * c + b * c)} 平方厘米。` };
    }
    if (kind === 'cylinder-volume') {
      const r = randInt(rand, 2, 8); const h = randInt(rand, 2, 12);
      return { prompt: `圆柱底面半径 ${r} 厘米、高 ${h} 厘米，体积是多少？（π 取 3.14）`, answer: fmt(3.14 * r * r * h), unit: '立方厘米', explain: `πr²h = 3.14 × ${r} × ${r} × ${h} = ${fmt(3.14 * r * r * h)}。` };
    }
    if (kind === 'cone-volume') {
      const r = randInt(rand, 2, 8) * 3; const h = randInt(rand, 2, 9) * 3;
      return { prompt: `圆锥底面半径 ${r} 厘米、高 ${h} 厘米，体积是多少？（π 取 3.14）`, answer: fmt(3.14 * r * r * h / 3), unit: '立方厘米', explain: `πr²h ÷ 3 = ${fmt(3.14 * r * r * h / 3)} 立方厘米。` };
    }
    return null;
  };
}

geometry[0].make = geometryMake('rect-area', 'direct');
geometry.push(
  { askPattern: 'inverse-recall', level: 2, make: geometryMake('rect-perimeter', 'inverse') },
  { askPattern: 'compare-operate', level: 2, make: (rand) => ({ ...pickOptions(rand, '平方厘米', ['厘米', '立方厘米'], 3), prompt: '计算面积时应该用什么单位？', explain: '面积用面积单位，常用「平方厘米」。' }) }
);

// 按 formula 分派：用 ctx.params.formula 覆盖第一个规格
geometry[0] = {
  askPattern: 'apply-solve', level: 1,
  make(rand, ctx) {
    const kind = (ctx.params || {}).formula || 'rect-area';
    return geometryMake(kind, 'direct')(rand);
  }
};
geometry[1] = {
  askPattern: 'inverse-recall', level: 2,
  make(rand, ctx) {
    const kind = (ctx.params || {}).formula || 'rect-area';
    if (kind === 'rect-area' || kind === 'rect-perimeter' || kind === 'cuboid-volume'
      || kind === 'triangle-area' || kind === 'circle-area' || kind === 'circle-circumference') {
      return geometryMake(kind, 'inverse')(rand);
    }
    return geometryMake(kind, 'direct')(rand);
  }
};
geometry[2] = {
  askPattern: 'compare-operate', level: 2,
  make(rand, ctx) {
    const kind = (ctx.params || {}).formula || 'rect-area';
    const unit = kind.includes('volume') ? '立方厘米' : '平方厘米';
    return { ...pickOptions(rand, unit, [unit === '立方厘米' ? '平方厘米' : '立方厘米', '厘米'], 3), prompt: `计算「${(ctx.params || {}).label || '这个图形'}」时，结果应使用什么单位？`, explain: `${(ctx.params || {}).label || '该图形'}求的是${unit === '立方厘米' ? '体积' : '面积'}，单位用「${unit}」。` };
  }
};

// 应用题外壳（题干换成真实情境，避免与其他 kid 共用同一句式）
geometry.push(
  {
    askPattern: 'apply-solve', level: 2,
    make(rand, ctx) {
      const kind = (ctx.params || {}).formula || 'rect-area';
      if (kind === 'rect-area') {
        const l = randInt(rand, 4, 20); const w = randInt(rand, 2, 15);
        return { prompt: `一块长方形菜地长 ${l} 米、宽 ${w} 米，面积是多少平方米？`, answer: l * w, unit: '平方米', explain: `${l} × ${w} = ${l * w}（平方米）。` };
      }
      if (kind === 'triangle-area') {
        const b = randInt(rand, 2, 10) * 2; const h = randInt(rand, 3, 10);
        return { prompt: `一块三角形花坛底 ${b} 米、高 ${h} 米，面积是多少平方米？`, answer: b * h / 2, unit: '平方米', explain: `${b} × ${h} ÷ 2 = ${b * h / 2}（平方米）。` };
      }
      if (kind === 'cuboid-volume') {
        const a = randInt(rand, 2, 8); const b = randInt(rand, 2, 8); const c = randInt(rand, 2, 6);
        return { prompt: `一个长方体水箱长 ${a} 分米、宽 ${b} 分米、高 ${c} 分米，容积是多少立方分米？`, answer: a * b * c, unit: '立方分米', explain: `${a} × ${b} × ${c} = ${a * b * c}（立方分米）。` };
      }
      if (kind === 'circle-area') {
        const r = randInt(rand, 2, 30);
        return { prompt: `一个圆形花坛半径 ${r} 米，面积是多少平方米？（π 取 3.14）`, answer: fmt(3.14 * r * r), unit: '平方米', explain: `3.14 × ${r} × ${r} = ${fmt(3.14 * r * r)}（平方米）。` };
      }
      if (kind === 'circle-circumference') {
        const r = randInt(rand, 2, 30);
        return { prompt: `一个圆形水池半径 ${r} 米，绕水池走一周是多少米？（π 取 3.14）`, answer: fmt(2 * 3.14 * r), unit: '米', explain: `2 × 3.14 × ${r} = ${fmt(2 * 3.14 * r)}（米）。` };
      }
      return geometryMake(kind, 'direct')(rand);
    }
  },
  {
    askPattern: 'inverse-recall', level: 2,
    make(rand, ctx) {
      const kind = (ctx.params || {}).formula || 'rect-area';
      if (kind === 'rect-area') {
        const l = randInt(rand, 4, 20); const w = randInt(rand, 2, 15);
        return { prompt: `一块长方形菜地面积 ${l * w} 平方米、长 ${l} 米，宽是多少米？`, answer: w, unit: '米', explain: `${l * w} ÷ ${l} = ${w}（米）。` };
      }
      if (kind === 'rect-perimeter') {
        const l = randInt(rand, 4, 20); const w = randInt(rand, 2, l - 1);
        return { prompt: `用一根绳子正好围成长方形，周长 ${2 * (l + w)} 厘米，长 ${l} 厘米，宽是多少厘米？`, answer: w, unit: '厘米', explain: `${2 * (l + w)} ÷ 2 - ${l} = ${w}（厘米）。` };
      }
      if (kind === 'cuboid-volume') {
        const a = randInt(rand, 2, 8); const b = randInt(rand, 2, 8); const c = randInt(rand, 2, 6);
        return { prompt: `一个长方体水箱容积 ${a * b * c} 立方分米，长 ${a} 分米、宽 ${b} 分米，高是多少分米？`, answer: c, unit: '分米', explain: `${a * b * c} ÷ ${a} ÷ ${b} = ${c}（分米）。` };
      }
      if (kind === 'triangle-area') {
        const b = randInt(rand, 2, 10) * 2; const h = randInt(rand, 3, 10);
        return { prompt: `一块三角形花坛面积 ${b * h / 2} 平方米、底 ${b} 米，高是多少米？`, answer: h, unit: '米', explain: `${b * h / 2} × 2 ÷ ${b} = ${h}（米）。` };
      }
      if (kind === 'circle-area') {
        const r = randInt(rand, 2, 30);
        return { prompt: `一个圆形花坛面积 ${fmt(3.14 * r * r)} 平方米，它的直径是多少米？（π 取 3.14）`, answer: 2 * r, unit: '米', explain: `由 πr² 得半径 ${r} 米，直径 ${2 * r} 米。` };
      }
      if (kind === 'circle-circumference') {
        const r = randInt(rand, 2, 30);
        return { prompt: `一个圆形水池一周长 ${fmt(2 * 3.14 * r)} 米，它的直径是多少米？（π 取 3.14）`, answer: 2 * r, unit: '米', explain: `周长 ÷ π = 直径，直径是 ${2 * r} 米。` };
      }
      return geometryMake(kind, 'direct')(rand);
    }
  },
  {
    askPattern: 'apply-solve', level: 3,
    make(rand, ctx) {
      const kind = (ctx.params || {}).formula || 'rect-area';
      if (kind !== 'circle-area' && kind !== 'circle-circumference') {
        return geometryMake(kind, 'direct')(rand);
      }
      const d = randInt(rand, 4, 30);
      if (kind === 'circle-area') {
        return { prompt: `一个圆形草坪的直径是 ${d} 米，它的面积是多少平方米？（π 取 3.14）`, answer: fmt(3.14 * (d / 2) * (d / 2)), unit: '平方米', explain: `半径 ${d / 2} 米，3.14 × ${d / 2} × ${d / 2} = ${fmt(3.14 * (d / 2) * (d / 2))}（平方米）。` };
      }
      return { prompt: `一个圆形花坛的直径是 ${d} 米，绕花坛走一周是多少米？（π 取 3.14）`, answer: fmt(3.14 * d), unit: '米', explain: `3.14 × ${d} = ${fmt(3.14 * d)}（米）。` };
    }
  }
);

const fraction = [
  {
    askPattern: 'meaning-translate', level: 1,
    make(rand, ctx) {
      const d = (ctx.params || {}).denom || randInt(rand, 2, 9);
      const n = randInt(rand, 1, d - 1);
      return { ...pickOptions(rand, `${n}/${d}`, [`${d}/${n}`, `${n}/${d + 1}`, `${n + 1}/${d}`], 4), prompt: `把一个整体平均分成 ${d} 份，取其中 ${n} 份，用分数表示是多少？`, explain: `平均分成 ${d} 份取 ${n} 份，是 ${n}/${d}。` };
    }
  },
  {
    askPattern: 'product-recall', level: 1,
    make(rand, ctx) {
      const p = ctx.params || {};
      const d = p.denom || randInt(rand, 4, 9);
      const a = randInt(rand, 1, d - 2);
      const b = randInt(rand, 1, d - a);
      const op = p.mode === 'sub' ? '-' : '+';
      const num = op === '+' ? a + b : Math.abs(a - b);
      return { prompt: `${a}/${d} ${op} ${b}/${d} = （ ）`, answer: frac(num, d), explain: `同分母分数${op === '+' ? '相加' : '相减'}，分母不变，分子${op === '+' ? '相加' : '相减'}，得 ${frac(num, d)}。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand, ctx) {
      const p = ctx.params || {};
      if (p.mode === 'mul') {
        const a = randInt(rand, 1, 5); const b = randInt(rand, 2, 6);
        const c = randInt(rand, 1, 5); const d = randInt(rand, 2, 6);
        return { prompt: `${a}/${b} × ${c}/${d} = （ ）`, answer: frac(a * c, b * d), explain: `分子乘分子、分母乘分母，约分后得 ${frac(a * c, b * d)}。` };
      }
      if (p.mode === 'div') {
        const a = randInt(rand, 1, 5); const b = randInt(rand, 2, 6);
        const c = randInt(rand, 1, 5); const d = randInt(rand, 2, 6);
        return { prompt: `${a}/${b} ÷ ${c}/${d} = （ ）`, answer: frac(a * d, b * c), explain: `除以一个分数等于乘它的倒数，得 ${frac(a * d, b * c)}。` };
      }
      const total = randInt(rand, 4, 40);
      const d = randInt(rand, 2, 6);
      return { prompt: `一根绳子长 ${total} 米，用去它的 1/${d}，用去多少米？`, answer: fmt(total / d), unit: '米', explain: `${total} ÷ ${d} = ${fmt(total / d)} 米。` };
    }
  },
  {
    askPattern: 'meaning-translate', level: 2,
    make(rand) {
      const d = randInt(rand, 2, 9);
      return { prompt: `把一根绳子平均剪成 ${d} 段，每段是全长的（ ）`, answer: `1/${d}`, explain: `平均分成 ${d} 段，每段是 1/${d}。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand) {
      const d = randInt(rand, 2, 6); const k = randInt(rand, 2, 8);
      return { prompt: `把 ${d * k} 个苹果平均放进 ${d} 个盘子，每个盘子放几个？`, answer: k, unit: '个', explain: `${d * k} ÷ ${d} = ${k}（个）。` };
    }
  }
];

const decimal = [
  {
    askPattern: 'meaning-translate', level: 1,
    make(rand, ctx) {
      const p = ctx.params || {};
      const x = randInt(rand, 1, 9);
      const y = randInt(rand, 1, 99);
      const val = `${x}.${String(y).padStart(2, '0')}`;
      if (p.mode === 'place') return { prompt: `${val} 中，十分位上的数字是几？`, answer: y >= 10 ? Number(String(y)[0]) : 0, explain: `${val} 的十分位是小数点后第一位。` };
      const y2 = y === 99 ? 98 : y + 1;
      const x2 = x === 9 ? 8 : x + 1;
      const yPad = String(y).padStart(2, '0');
      return { ...pickOptions(rand, val, [`${x}.${String(y2).padStart(2, '0')}`, `${x2}.${yPad}`, `${x + 2}.${yPad}`], 4), prompt: `${x} 个一和 ${y} 个百分之一组成的数是（ ）`, explain: `${x} 个一是 ${x}，${y} 个百分之一是 0.${yPad}，合起来是 ${val}。` };
    }
  },
  {
    askPattern: 'product-recall', level: 1,
    make(rand, ctx) {
      const op = (ctx.params || {}).op === '-' ? '-' : '+';
      const a = randInt(rand, 10, 400) / 10;
      const b = randInt(rand, 10, 400) / 10;
      const big = Math.max(a, b); const small = Math.min(a, b);
      const ans = op === '-' ? big - small : a + b;
      return { prompt: `${fmt(op === '-' ? big : a)} ${op} ${fmt(op === '-' ? small : b)} = （ ）`, answer: fmt(ans), explain: `小数点对齐，${op === '-' ? '从末位减起' : '满十进一'}，得 ${fmt(ans)}。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand, ctx) {
      const p = ctx.params || {};
      if (p.mode === 'mul') {
        const a = randInt(rand, 10, 200) / 10;
        const b = randInt(rand, 2, 9);
        return { prompt: `每千克 ${fmt(a)} 元，买 ${b} 千克要多少元？`, answer: fmt(a * b), unit: '元', explain: `${fmt(a)} × ${b} = ${fmt(a * b)}（元）。` };
      }
      if (p.mode === 'div') {
        const b = randInt(rand, 2, 9);
        const q = randInt(rand, 10, 200) / 10;
        return { prompt: `${fmt(b * q)} 元平均分给 ${b} 人，每人多少元？`, answer: fmt(q), unit: '元', explain: `${fmt(b * q)} ÷ ${b} = ${fmt(q)}（元）。` };
      }
      const a = randInt(rand, 10, 500) / 10;
      const b = randInt(rand, 10, 500) / 10;
      return { prompt: `一支笔 ${fmt(a)} 元，一本本子 ${fmt(b)} 元，一共多少元？`, answer: fmt(a + b), unit: '元', explain: `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}（元）。` };
    }
  },
  {
    askPattern: 'compare-operate', level: 2,
    make(rand) {
      const aT = randInt(rand, 20, 99);
      const bT = randInt(rand, 1, aT - 1);
      return { prompt: `一支笔 ${fmt(aT / 10)} 元，一块橡皮 ${fmt(bT / 10)} 元，笔比橡皮贵多少元？`, answer: fmt((aT - bT) / 10), unit: '元', explain: `${fmt(aT / 10)} - ${fmt(bT / 10)} = ${fmt((aT - bT) / 10)}（元）。` };
    }
  },
  {
    askPattern: 'inverse-recall', level: 2,
    make(rand) {
      const xs = shuffle(rand, [randInt(rand, 11, 99) / 10, randInt(rand, 11, 99) / 10, randInt(rand, 11, 99) / 10]);
      const big = Math.max(...xs);
      const list = xs.map((x) => fmt(x)).join('、');
      return { prompt: `在 ${list} 三个小数中，最大的数是（ ）`, answer: fmt(big), explain: `比较整数部分和十分位，最大的是 ${fmt(big)}。` };
    }
  }
];

const ratioPercent = [
  {
    askPattern: 'product-recall', level: 1,
    make(rand, ctx) {
      const p = ctx.params || {};
      if (p.kind === 'proportion') {
        const a = randInt(rand, 2, 8);
        let b = randInt(rand, 2, 9);
        if (b === a) b = a === 9 ? 8 : a + 1;
        const k = randInt(rand, 2, 6);
        const ans = b * k;
        return { prompt: `${a} : ${b} = ${a * k} : （ ）`, answer: ans, explain: `前项乘 ${k}，后项也乘 ${k}，得 ${ans}。` };
      }
      const a = randInt(rand, 2, 12); const b = randInt(rand, 2, 12);
      const g = gcd(a, b);
      return { prompt: `${a} : ${b} 化成最简整数比是（ ）`, answer: `${a / g}:${b / g}`, explain: `前后项同时除以 ${g}，得 ${a / g}:${b / g}。` };
    }
  },
  {
    askPattern: 'inverse-recall', level: 1,
    make(rand, ctx) {
      const p = ctx.params || {};
      if (p.kind === 'proportion') {
        const a = randInt(rand, 2, 9); const b = randInt(rand, 2, 9); const c = a * randInt(rand, 2, 6);
        let ans = b * (c / a);
        // 避免答案恰好等于题干右侧已知项（会被误判成答案泄漏）
        if (ans === c) ans += 1;
        return { prompt: `${a} : ${b} = ${c} : （ ）`, answer: ans, explain: `${a} 扩大到 ${c}（×${c / a}），后项也乘 ${c / a}，得 ${ans}。` };
      }
      const base = randInt(rand, 20, 200);
      const pct = pick(rand, [10, 20, 25, 50]);
      return { prompt: `${base} 的 ${pct}% 是（ ）`, answer: fmt(base * pct / 100), explain: `${base} × ${pct}% = ${fmt(base * pct / 100)}。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand, ctx) {
      const p = ctx.params || {};
      if (p.kind === 'percent') {
        const price = randInt(rand, 50, 400);
        const pct = pick(rand, [10, 20, 25]);
        return { prompt: `一件商品 ${price} 元，打 ${100 - pct} 折（降价 ${pct}%），现价多少元？`, answer: fmt(price * (100 - pct) / 100), unit: '元', explain: `${price} × ${100 - pct}% = ${fmt(price * (100 - pct) / 100)} 元。` };
      }
      if (p.kind === 'proportion') {
        const a = randInt(rand, 2, 8); const b = randInt(rand, 2, 8); const x = randInt(rand, 3, 12);
        return { prompt: `${a} 个物品 ${b} 元，${a * x} 个物品多少元？`, answer: b * x, unit: '元', explain: `${a * x} ÷ ${a} = ${x} 份，${b} × ${x} = ${b * x} 元。` };
      }
      const total = randInt(rand, 50, 300);
      const part = randInt(rand, 10, total - 10);
      return { prompt: `全班 ${total} 人，其中女生 ${part} 人，女生占全班的百分之几？`, answer: `${fmt(part / total * 100)}%`, explain: `${part} ÷ ${total} = ${fmt(part / total * 100)}%。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand) {
      const total = randInt(rand, 40, 400) / 10 * 10; const pct = pick(rand, [10, 20, 25, 50]);
      return { prompt: `六年级共有 ${total} 人，其中男生占 ${pct}%，男生有多少人？`, answer: fmt(total * pct / 100), unit: '人', explain: `${total} × ${pct}% = ${fmt(total * pct / 100)}（人）。` };
    }
  },
  {
    askPattern: 'inverse-recall', level: 2,
    make(rand) {
      const pct = pick(rand, [10, 20, 25, 50]); const val = randInt(rand, 2, 40) * pct / 10 * 10;
      return { prompt: `一个数的 ${pct}% 是 ${fmt(val)}，这个数是多少？`, answer: fmt(val * 100 / pct), explain: `${fmt(val)} ÷ ${pct}% = ${fmt(val * 100 / pct)}。` };
    }
  }
];

const statistics = [
  {
    askPattern: 'product-recall', level: 1,
    make(rand, ctx) {
      const kind = (ctx.params || {}).kind || 'bar';
      const a = randInt(rand, 3, 20); const b = randInt(rand, 3, 20); const c = randInt(rand, 3, 20);
      if (kind === 'average') {
        return { prompt: `三个数 ${a}、${b}、${c} 的平均数是多少？`, answer: fmt((a + b + c) / 3), explain: `（${a} + ${b} + ${c}）÷ 3 = ${fmt((a + b + c) / 3)}。` };
      }
      return { prompt: `统计表中三组数据为 ${a}、${b}、${c}，最多的一组是多少？`, answer: Math.max(a, b, c), explain: `比较 ${a}、${b}、${c}，最大的是 ${Math.max(a, b, c)}。` };
    }
  },
  {
    askPattern: 'inverse-recall', level: 1,
    make(rand, ctx) {
      const kind = (ctx.params || {}).kind || 'bar';
      if (kind === 'average') {
        const avg = randInt(rand, 6, 20);
        // 另一个数必须为正：其中一个数要小于总和 2×avg
        let b = randInt(rand, 3, 2 * avg - 2);
        if (b === avg) b = b + 1;
        return { prompt: `两个数的平均数是 ${avg}，其中一个数是 ${b}，另一个数是（ ）`, answer: 2 * avg - b, explain: `总和 ${2 * avg}，另一个数 ${2 * avg} - ${b} = ${2 * avg - b}。` };
      }
      const a = randInt(rand, 3, 20); const b = randInt(rand, 3, 20); const c = randInt(rand, 3, 20);
      return { prompt: `统计表中三组数据为 ${a}、${b}、${c}，最大的一组比最小的一组多多少？`, answer: Math.max(a, b, c) - Math.min(a, b, c), explain: `${Math.max(a, b, c)} - ${Math.min(a, b, c)} = ${Math.max(a, b, c) - Math.min(a, b, c)}。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand, ctx) {
      const kind = (ctx.params || {}).kind || 'bar';
      if (kind === 'probability') {
        const red = randInt(rand, 1, 8); const blue = randInt(rand, 1, 8);
        const correct = red > blue ? '红球' : red < blue ? '蓝球' : '一样大';
        return { ...pickOptions(rand, correct, ['红球', '蓝球', '一样大'].filter((x) => x !== correct), 3), prompt: `袋里有 ${red} 个红球、${blue} 个蓝球，任意摸一个，摸到哪种球的可能性大？`, explain: `${red} 与 ${blue} 比较，${correct}的可能性${correct === '一样大' ? '一样' : '大'}。` };
      }
      const total = randInt(rand, 10, 20);
      const part = randInt(rand, Math.floor(total / 2) + 1, total - 1);
      const rest = total - part;
      return { prompt: `总共 ${total} 人，其中 ${part} 人喜欢跳绳，其余喜欢踢球。喜欢跳绳的比喜欢踢球的多多少人？`, answer: part - rest, unit: '人', explain: `${part} - ${rest} = ${part - rest}（人）。` };
    }
  },
  {
    askPattern: 'product-recall', level: 1,
    make(rand) {
      const a = randInt(rand, 3, 20); const b = randInt(rand, 3, 20); const c = randInt(rand, 3, 20);
      return { prompt: `统计表中三组数据为 ${a}、${b}、${c}，最少的一组是多少？`, answer: Math.min(a, b, c), explain: `比较 ${a}、${b}、${c}，最小的是 ${Math.min(a, b, c)}。` };
    }
  },
  {
    askPattern: 'compare-operate', level: 2,
    make(rand) {
      const a = randInt(rand, 3, 20); const b = randInt(rand, 3, 20); const c = randInt(rand, 3, 20);
      const big = Math.max(a, b, c); const small = Math.min(a, b, c);
      return { prompt: `统计表中三组数据为 ${a}、${b}、${c}，最多的一组比最少的一组多多少？`, answer: big - small, explain: `最多 ${big}，最少 ${small}，${big} - ${small} = ${big - small}。` };
    }
  }
];

const position = [
  {
    askPattern: 'meaning-translate', level: 1,
    make(rand, ctx) {
      const kind = (ctx.params || {}).kind || 'relative';
      if (kind === 'rowcol') {
        const c = randInt(rand, 1, 8); const r = randInt(rand, 1, 8);
        return { ...pickOptions(rand, `(${c},${r})`, [`(${r},${c})`, `(${c + 1},${r})`, `(${c},${r + 1})`], 4), prompt: `第 ${c} 列第 ${r} 行的位置用数对表示是（ ）`, explain: `数对先列后行，是 (${c},${r})。` };
      }
      return { ...pickOptions(rand, '上', ['下', '左', '右'], 4), prompt: '课本的封面在桌面上方，课本在桌面的哪个方向？', explain: '在桌面上方，所以填「上」。' };
    }
  },
  {
    askPattern: 'inverse-recall', level: 1,
    make(rand, ctx) {
      const kind = (ctx.params || {}).kind || 'relative';
      if (kind === 'rowcol') {
        const c = randInt(rand, 1, 8); const r = randInt(rand, 1, 8);
        return { prompt: `数对 (${c},${r}) 表示第几列第几行？`, answer: `第 ${c} 列第 ${r} 行`, explain: `数对先列后行，是第 ${c} 列第 ${r} 行。` };
      }
      return { ...pickOptions(rand, '前', ['后', '左', '右'], 4), prompt: '面向黑板时，黑板在你的哪个方向？', explain: '面向黑板，黑板在前面。' };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand, ctx) {
      const kind = (ctx.params || {}).kind || 'relative';
      if (kind === 'direction') {
        const deg = pick(rand, [30, 45, 60]);
        return { ...pickOptions(rand, `北偏东 ${deg}°`, [`东偏北 ${deg}°`, `北偏西 ${deg}°`, `南偏东 ${deg}°`], 4), prompt: `从北方向向东偏 ${deg}°，方向是（ ）`, explain: `从北向东偏 ${deg}°，记作北偏东 ${deg}°。` };
      }
      const c = randInt(rand, 2, 7); const r = randInt(rand, 2, 7);
      return { prompt: `小明在第 ${c} 列第 ${r} 行，他后面一位同学的位置是（ ）`, answer: `(${c},${r + 1})`, explain: `后面一行行数加 1，是 (${c},${r + 1})。` };
    }
  },
  {
    askPattern: 'inverse-recall', level: 2,
    make(rand, ctx) {
      const kind = (ctx.params || {}).kind || 'relative';
      if (kind === 'rowcol') {
        const c = randInt(rand, 2, 8); const r = randInt(rand, 1, 8);
        return { prompt: `小明坐在第 ${c} 列第 ${r} 行，他左边的同学坐在第几列第几行？`, answer: `第 ${c - 1} 列第 ${r} 行`, explain: `左边一列列数减 1，是第 ${c - 1} 列第 ${r} 行。` };
      }
      if (kind === 'direction') {
        const deg = randInt(rand, 5, 85);
        return { ...pickOptions(rand, `南偏东 ${deg}°`, [`东偏南 ${deg}°`, `南偏西 ${deg}°`, `北偏东 ${deg}°`], 4), prompt: `从南方向向东偏 ${deg}°，方向记作（ ）`, explain: `从南向东偏 ${deg}°，记作南偏东 ${deg}°。` };
      }
      const dir = pick(rand, ['东', '南', '西', '北']);
      const left = { 东: '北', 南: '东', 西: '南', 北: '西' }[dir];
      return { ...pickOptions(rand, left, ['东', '南', '西', '北'].filter((x) => x !== left), 4), prompt: `面向${dir}时，你的左边是（ ）方`, explain: `面向${dir}时，左边是${left}方。` };
    }
  },
  {
    askPattern: 'compare-operate', level: 2,
    make(rand, ctx) {
      const kind = (ctx.params || {}).kind || 'relative';
      if (kind === 'rowcol') {
        const c = randInt(rand, 2, 8); const r = randInt(rand, 2, 8);
        return { ...pickOptions(rand, '列', ['行', '排', '层'], 4), prompt: `数对 (${c},${r}) 中，第一个数 ${c} 表示（ ）`, explain: '数对先列后行，第一个数表示列。' };
      }
      if (kind === 'direction') {
        const deg = randInt(rand, 5, 85);
        return { ...pickOptions(rand, `北偏东 ${90 - deg}°`, [`东偏北 ${deg}°`, `北偏西 ${90 - deg}°`, `南偏东 ${90 - deg}°`], 4), prompt: `东偏北 ${deg}° 也可以说成（ ）`, explain: `东偏北 ${deg}° 与北偏东 ${90 - deg}° 是同一个方向。` };
      }
      const item = pick(rand, [
        { p: '地图上通常是上北下南，左边是（ ）方', a: '西' },
        { p: '地图上通常是上北下南，右边是（ ）方', a: '东' },
        { p: '太阳每天从哪个方向升起？', a: '东' },
        { p: '太阳每天从哪个方向落下？', a: '西' }
      ]);
      return { ...pickOptions(rand, item.a, ['东', '南', '西', '北'].filter((x) => x !== item.a), 4), prompt: item.p, explain: `正确答案是${item.a}方。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 1,
    make(rand) {
      const n = randInt(rand, 3, 12); const k = randInt(rand, 1, n);
      return { prompt: `书架有 ${n} 层，一本书放在从上往下数第 ${k} 层，从下往上数是第几层？`, answer: n - k + 1, unit: '层', explain: `从上往下第 ${k} 层，从下往上就是第 ${n - k + 1} 层。` };
    }
  },
  {
    askPattern: 'compare-operate', level: 2,
    make(rand) {
      const k = randInt(rand, 1, 8); const m = randInt(rand, 1, 8);
      return { prompt: `小动物排队，从前往后数小明是第 ${k} 个，他后面还有 ${m} 只，这一队一共有几只？`, answer: k + m, unit: '只', explain: `前面有 ${k - 1} 只，加上小明和后面 ${m} 只，共 ${k + m} 只。` };
    }
  }
];

const equation = [
  {
    askPattern: 'meaning-translate', level: 1,
    make(rand, ctx) {
      const k = randInt(rand, 2, 5);
      return { ...pickOptions(rand, `${k}a`, [`a + ${k}`, `a - ${k}`, `${k} + a`], 4), prompt: `a 的 ${k} 倍用式子表示是（ ）`, explain: `${k} 个 a 相加记作 ${k}a。` };
    }
  },
  {
    askPattern: 'inverse-recall', level: 1,
    make(rand) {
      const b = randInt(rand, 2, 30); const x = randInt(rand, 2, 40);
      return { prompt: `x + ${b} = ${x + b}，x = （ ）`, answer: x, explain: `两边同时减 ${b}，x = ${x + b} - ${b} = ${x}。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand) {
      const b = randInt(rand, 2, 9); const x = randInt(rand, 2, 30);
      return { prompt: `每盒 ${x} 支笔，买了 ${b} 盒，共 ${x * b} 支。设每盒 x 支，列方程是（ ）`, answer: `${b}x = ${x * b}`, explain: `每盒 x 支，${b} 盒共 ${b}x 支，所以 ${b}x = ${x * b}。` };
    }
  },
  {
    askPattern: 'inverse-recall', level: 2,
    make(rand) {
      const b = randInt(rand, 2, 30); const x = randInt(rand, 2, 40);
      return { prompt: `x - ${b} = ${x - b}，x = （ ）`, answer: x, explain: `两边同时加 ${b}，x = ${x - b} + ${b} = ${x}。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand) {
      const a = randInt(rand, 2, 5); const c = randInt(rand, 1, 9); const x = randInt(rand, 2, 20);
      return { prompt: `${a}x + ${c} = ${a * x + c}，x = （ ）`, answer: x, explain: `两边先减 ${c} 得 ${a}x = ${a * x}，再除以 ${a}，x = ${x}。` };
    }
  }
];

const logic = [
  {
    askPattern: 'apply-solve', level: 1,
    make(rand, ctx) {
      const kind = (ctx.params || {}).kind || 'planting';
      if (kind === 'chicken-rabbit') {
        const chickens = randInt(rand, 2, 12); const rabbits = randInt(rand, 2, 12);
        return { prompt: `鸡兔同笼，共 ${chickens + rabbits} 个头、${chickens * 2 + rabbits * 4} 只脚，兔有几只？`, answer: rabbits, explain: `假设全是鸡，脚少 ${(chickens * 2 + rabbits * 4) - (chickens + rabbits) * 2} 只，每只兔多 2 只脚，兔有 ${rabbits} 只。` };
      }
      if (kind === 'pigeonhole') {
        const n = randInt(rand, 3, 9);
        return { prompt: `把 ${n + 1} 个苹果放进 ${n} 个抽屉，至少有一个抽屉放几个？`, answer: 2, explain: `苹果比抽屉多 1 个，至少有一个抽屉放 2 个。` };
      }
      if (kind === 'optimize') {
        const n = randInt(rand, 3, 6);
        return { prompt: `烙 ${n} 张饼，每次最多烙 2 张，每面 3 分钟，最少需要几分钟？`, answer: n * 3, explain: `两张同时烙，${n} 张需要 ${n} × 3 = ${n * 3} 分钟。` };
      }
      if (kind === 'find-defective') {
        const n = pick(rand, [3, 9]);
        return { prompt: `有 ${n} 个零件，其中 1 个次品较轻，用天平至少称几次能找出？`, answer: n === 3 ? 1 : 2, explain: `${n} 个分成三份，${n === 3 ? '称 1 次' : '称 2 次'}可以找出次品。` };
      }
      if (kind === 'number-shape') {
        const n = randInt(rand, 3, 9);
        return { prompt: `第 ${n} 个图形需要几根小棒？（每个图形 3 根，首尾共用 1 根）`, answer: 2 * n + 1, explain: `3 + (${n} - 1) × 2 = ${2 * n + 1} 根。` };
      }
      const len = randInt(rand, 2, 12); const gap = randInt(rand, 1, 5);
      return { prompt: `在 ${len} 米的路边每 ${gap} 米种一棵树（两端都种），一共种几棵？`, answer: Math.floor(len / gap) + 1, explain: `${len} ÷ ${gap} = ${Math.floor(len / gap)} 段，两端都种要加 1，共 ${Math.floor(len / gap) + 1} 棵。` };
    }
  },
  {
    askPattern: 'inverse-recall', level: 2,
    make(rand, ctx) {
      const kind = (ctx.params || {}).kind || 'planting';
      if (kind === 'chicken-rabbit') {
        const chickens = randInt(rand, 2, 12); const rabbits = randInt(rand, 2, 12);
        return { prompt: `鸡兔同笼，共 ${chickens + rabbits} 个头、${chickens * 2 + rabbits * 4} 只脚，鸡有几只？`, answer: chickens, explain: `假设全是兔，脚多 ${(chickens + rabbits) * 4 - (chickens * 2 + rabbits * 4)} 只，每只鸡少 2 只脚，鸡有 ${chickens} 只。` };
      }
      if (kind === 'pigeonhole') {
        const n = randInt(rand, 3, 9);
        return { prompt: `把 ${2 * n} 个苹果放进 ${n} 个抽屉，总有一个抽屉至少放几个？`, answer: 2, explain: `${2 * n} ÷ ${n} = 2，平均放也有 2 个，所以至少有一个抽屉放 2 个。` };
      }
      if (kind === 'optimize') {
        const n = randInt(rand, 3, 6);
        return { prompt: `每次最多烙 2 张饼，两面都要烙，${n} 张饼至少要烙几次？`, answer: n, unit: '次', explain: `${n} 张饼共 ${2 * n} 个面，每次烙 2 个面，至少要烙 ${2 * n} ÷ 2 = ${n} 次。` };
      }
      if (kind === 'find-defective') {
        const k = randInt(rand, 2, 3);
        return { prompt: `用天平称 ${k} 次，最多能从几个零件中找出 1 个较轻的次品？`, answer: 3 ** k, unit: '个', explain: `每次都把零件分成三份，称 ${k} 次最多能区分 ${3 ** k} 个零件。` };
      }
      if (kind === 'number-shape') {
        const n = randInt(rand, 3, 9);
        return { prompt: `第 ${n} 个图形用了 ${2 * n + 1} 根小棒，第 ${n - 1} 个图形用几根？`, answer: 2 * n - 1, explain: `每个图形比前一个多 2 根，${2 * n + 1} - 2 = ${2 * n - 1} 根。` };
      }
      const gap = randInt(rand, 2, 5); const trees = randInt(rand, 3, 12);
      return { prompt: `路边每隔 ${gap} 米种一棵树，两端都种，共 ${trees} 棵，这条路长多少米？`, answer: (trees - 1) * gap, unit: '米', explain: `${trees} 棵之间有 ${trees - 1} 段，总长 ${(trees - 1) * gap} 米。` };
    }
  },
  {
    askPattern: 'compare-operate', level: 2,
    make(rand, ctx) {
      const kind = (ctx.params || {}).kind || 'planting';
      if (kind === 'chicken-rabbit') {
        const heads = randInt(rand, 8, 20); const legs = randInt(rand, 6, 14);
        return { ...pickOptions(rand, '假设法', ['随便猜', '只数头'], 3), prompt: `笼子里有若干只鸡和兔，共 ${heads} 个头、${heads * 2 + legs * 2} 只脚。解决这类问题最常用的方法是（ ）`, explain: '用假设法：假设全是鸡或全是兔，再按脚数差调整。' };
      }
      const topic = pick(rand, ['鸡兔同笼', '植树问题', '找次品', '烙饼问题', '数与形']);
      return { ...pickOptions(rand, '先找规律再算', ['直接数', '不用算'], 3), prompt: `解决「${topic}」这类数学广角问题，一般思路是（ ）`, explain: '先观察规律，再用规律计算。' };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand) {
      const floor = randInt(rand, 3, 8); const step = randInt(rand, 5, 12);
      return { prompt: `小明从第 1 层走到第 ${floor} 层，每相邻两层之间 ${step} 级台阶，一共走了多少级？`, answer: (floor - 1) * step, unit: '级', explain: `从 1 层到 ${floor} 层要上 ${floor - 1} 段，${floor - 1} × ${step} = ${(floor - 1) * step}（级）。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand) {
      const parts = randInt(rand, 3, 8); const min = randInt(rand, 2, 6);
      return { prompt: `把一根木头锯成 ${parts} 段，每锯一次要 ${min} 分钟，一共需要几分钟？`, answer: (parts - 1) * min, unit: '分钟', explain: `锯成 ${parts} 段要锯 ${parts - 1} 次，${parts - 1} × ${min} = ${(parts - 1) * min}（分钟）。` };
    }
  }
];

const clock = [
  {
    askPattern: 'meaning-translate', level: 1,
    make(rand) {
      const h = randInt(rand, 1, 12); const half = rand() < 0.5;
      return { ...pickOptions(rand, `${h} 时${half ? '半' : ''}`, [`${h} 时${half ? '' : '半'}`, `${h + 1} 时`, `${h} 时 1 分`], 4), prompt: `钟面上时针指向 ${h}${half ? ' 和 6 中间' : ''}，分针指向 ${half ? 6 : 12}，是几时？`, explain: `分针指 ${half ? 6 : 12} 是${half ? '半' : '整'}时，读作 ${h} 时${half ? '半' : ''}。` };
    }
  },
  {
    askPattern: 'product-recall', level: 1,
    make(rand) {
      const h1 = randInt(rand, 1, 8); const h2 = h1 + randInt(rand, 1, 4);
      return { prompt: `从 ${h1} 时到 ${h2} 时，经过了（ ）小时`, answer: h2 - h1, unit: '小时', explain: `${h2} - ${h1} = ${h2 - h1} 小时。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand) {
      const m = randInt(rand, 10, 38);
      return { prompt: `一节课 40 分钟，已经上了 ${m} 分钟，还剩多少分钟？`, answer: 40 - m, unit: '分钟', explain: `40 - ${m} = ${40 - m} 分钟。` };
    }
  }
];

const negative = [
  {
    askPattern: 'compare-operate', level: 1,
    make(rand) {
      const a = -randInt(rand, 1, 40); const b = -randInt(rand, 1, 40);
      const correct = a > b ? '>' : a < b ? '<' : '=';
      return { ...pickOptions(rand, correct, ['>', '<', '='].filter((x) => x !== correct), 3), prompt: `${a} ○ ${b}，○ 里填什么？`, explain: `负数比较，绝对值大的反而小，${a} ${correct} ${b}。` };
    }
  },
  {
    askPattern: 'product-recall', level: 1,
    make(rand) {
      const t1 = randInt(rand, -10, 10); const t2 = randInt(rand, -10, 10);
      const big = Math.max(t1, t2); const small = Math.min(t1, t2);
      return { prompt: `气温从 ${big}℃ 降到 ${small}℃，下降了（ ）℃`, answer: big - small, unit: '℃', explain: `${big} - ${small} = ${big - small}℃。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand) {
      const v = randInt(rand, 1, 9);
      return { ...pickOptions(rand, `-${v}`, [`${v}`, `0`, `-${v + 1}`], 4), prompt: `规定向东为正，向西走 ${v} 米记作（ ）`, explain: `向西与正方向相反，记作 -${v} 米。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand) {
      const cold = -randInt(rand, 1, 10); const warm = randInt(rand, 1, 10);
      return { prompt: `清晨气温 ${cold}℃，中午升到 ${warm}℃，一共升高了多少℃？`, answer: warm - cold, unit: '℃', explain: `${warm} - （${cold}） = ${warm - cold}（℃）。` };
    }
  },
  {
    askPattern: 'meaning-translate', level: 2,
    make(rand) {
      const a = randInt(rand, 1, 9); const b = randInt(rand, 1, 9);
      return { ...pickOptions(rand, `-${b} 米`, [`+${b} 米`, `-${a} 米`, `${b} 米`], 4), prompt: `以海平面为 0，高出海平面 ${a} 米记作 +${a} 米，低于海平面 ${b} 米记作（ ）`, explain: `低于海平面与正方向相反，记作 -${b} 米。` };
    }
  }
];

const factorMultiple = [
  {
    askPattern: 'product-recall', level: 1,
    make(rand) {
      const a = randInt(rand, 2, 9);
      const bRaw = randInt(rand, 2, 9) === a ? a + 1 : randInt(rand, 2, 9);
      let bb = bRaw > 9 ? 9 : bRaw;
      if (bb === a) bb = a === 9 ? 8 : a + 1;
      return { prompt: `${a * bb} 是 ${a} 的（ ）倍`, answer: bb, explain: `${a * bb} ÷ ${a} = ${bb}。` };
    }
  },
  {
    askPattern: 'inverse-recall', level: 2,
    make(rand) {
      let a = randInt(rand, 2, 9); let b = randInt(rand, 2, 9);
      let lcm = (a * b) / gcd(a, b);
      while (lcm === a || lcm === b) {
        a = randInt(rand, 2, 9); b = randInt(rand, 2, 9);
        lcm = (a * b) / gcd(a, b);
      }
      return { prompt: `${a} 和 ${b} 的最小公倍数是（ ）`, answer: lcm, explain: `最小公倍数 = ${a} × ${b} ÷ ${gcd(a, b)} = ${lcm}。` };
    }
  },
  {
    askPattern: 'compare-operate', level: 2,
    make(rand) {
      const n = randInt(rand, 2, 20);
      const isPrime = n > 1 && Array.from({ length: n - 2 }, (_, i) => i + 2).every((d) => n % d !== 0);
      return { ...pickOptions(rand, isPrime ? '质数' : '合数', [isPrime ? '合数' : '质数', '既不是质数也不是合数'], 3), prompt: `${n} 是质数还是合数？`, explain: `${n} ${isPrime ? '只有 1 和它本身两个因数，是质数' : '除了 1 和它本身还有别的因数，是合数'}。` };
    }
  },
  {
    askPattern: 'inverse-recall', level: 2,
    make(rand) {
      let a = randInt(rand, 2, 9); let b = randInt(rand, 2, 9);
      let lcm = (a * b) / gcd(a, b);
      while (lcm === a || lcm === b) {
        a = randInt(rand, 2, 9); b = randInt(rand, 2, 9);
        lcm = (a * b) / gcd(a, b);
      }
      return { prompt: `一个数同时是 ${a} 的倍数和 ${b} 的倍数，它最小是多少？`, answer: lcm, explain: `取最小公倍数：${a} × ${b} ÷ ${gcd(a, b)} = ${lcm}。` };
    }
  },
  {
    askPattern: 'product-recall', level: 2,
    make(rand) {
      const n = pick(rand, [6, 8, 9, 10, 12, 15, 16, 18, 20, 24]);
      let count = 0;
      for (let d = 1; d <= n; d += 1) if (n % d === 0) count += 1;
      return { prompt: `${n} 一共有几个因数？`, answer: count, unit: '个', explain: `把 ${n} 的因数全部列出来，一共有 ${count} 个。` };
    }
  }
];

const opLaws = [
  {
    askPattern: 'product-recall', level: 1,
    make(rand) {
      const a = randInt(rand, 2, 20);
      let b = randInt(rand, 2, 20);
      if (b === a) b = a === 20 ? 19 : a + 1;
      return { prompt: `${a} × ${b} = ${b} × （ ）`, answer: a, explain: '乘法交换律：两个数相乘，交换位置积不变。' };
    }
  },
  {
    askPattern: 'inverse-recall', level: 2,
    make(rand) {
      const a = randInt(rand, 2, 20); const b = randInt(rand, 2, 20);
      let c = randInt(rand, 2, 20);
      if (c === a) c = a === 20 ? 19 : a + 1;
      return { prompt: `(${a} × ${b}) × ${c} = ${a} × (${b} × （ ）)`, answer: c, explain: '乘法结合律：先乘前两个或先乘后两个，积不变。' };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand) {
      const a = randInt(rand, 2, 20); const b = randInt(rand, 2, 20); const c = randInt(rand, 2, 9);
      return { prompt: `${a} × ${c} + ${b} × ${c} 用乘法分配律简算，结果是（ ）`, answer: (a + b) * c, explain: `（${a} + ${b}）× ${c} = ${(a + b) * c}。` };
    }
  },
  {
    askPattern: 'product-recall', level: 1,
    make(rand) {
      const a = randInt(rand, 5, 90);
      let b = randInt(rand, 5, 90);
      if (b === a) b = a === 90 ? 89 : a + 1;
      return { prompt: `${a} + ${b} = ${b} + （ ）`, answer: a, explain: '加法交换律：两个数相加，交换位置和不变。' };
    }
  },
  {
    askPattern: 'inverse-recall', level: 1,
    make(rand) {
      const a = randInt(rand, 5, 60); const b = randInt(rand, 5, 60);
      let c = randInt(rand, 5, 60);
      if (c === a) c = a === 60 ? 59 : a + 1;
      return { prompt: `(${a} + ${b}) + ${c} = ${a} + (${b} + （ ）)`, answer: c, explain: '加法结合律：先加前两个或先加后两个，和不变。' };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand) {
      const a = randInt(rand, 12, 60); const b = randInt(rand, 12, 40);
      const c2 = 100 - a;
      return { prompt: `${a} + ${b} + ${c2} 用加法结合律简算，结果是（ ）`, answer: a + b + c2, explain: `先把 ${a} 和 ${c2} 凑成 100，再加 ${b}，得 ${a + b + c2}。` };
    }
  }
];

const triangle = [
  {
    askPattern: 'meaning-translate', level: 1,
    make(rand) {
      const deg = pick(rand, [30, 45, 60, 90, 120]);
      const correct = deg < 90 ? '锐角三角形' : deg === 90 ? '直角三角形' : '钝角三角形';
      return { ...pickOptions(rand, correct, ['锐角三角形', '直角三角形', '钝角三角形'].filter((x) => x !== correct), 3), prompt: `一个三角形最大的角是 ${deg}°，它是什么三角形？`, explain: `最大角 ${deg}° 属于${correct.replace('三角形', '角')}，所以是${correct}。` };
    }
  },
  {
    askPattern: 'product-recall', level: 1,
    make(rand) {
      const a = randInt(rand, 30, 80);
      let b = randInt(rand, 20, 180 - a - 20);
      if (180 - a - b === a || 180 - a - b === b) b = b === 80 ? 79 : b + 1;
      return { prompt: `三角形两个角是 ${a}° 和 ${b}°，第三个角是（ ）°`, answer: 180 - a - b, unit: '°', explain: `180° - ${a}° - ${b}° = ${180 - a - b}°。` };
    }
  },
  {
    askPattern: 'compare-operate', level: 2,
    make(rand) {
      const a = randInt(rand, 2, 8); const b = randInt(rand, 2, 8);
      const lo = Math.abs(a - b); const hi = a + b;
      return { ...pickOptions(rand, `大于 ${lo} 且小于 ${hi}`, [`大于 ${hi}`, `小于 ${lo}`, '任意长度'], 3), prompt: `三角形两边长 ${a} 厘米和 ${b} 厘米，第三边应满足（ ）`, explain: `三角形两边之和大于第三边、两边之差小于第三边，所以大于 ${lo} 且小于 ${hi}。` };
    }
  }
];

const symmetry = [
  {
    askPattern: 'product-recall', level: 1,
    make(rand, ctx) {
      const kind = (ctx.params || {}).kind || 'axis';
      if (kind === 'rotation') {
        const n = randInt(rand, 1, 4); const m = randInt(rand, 1, 4);
        return { prompt: `图形先旋转 ${n} 个直角，再旋转 ${m} 个直角，一共转了多少度？`, answer: 90 * (n + m), unit: '°', explain: `${n} + ${m} = ${n + m} 个直角，${n + m} × 90° = ${90 * (n + m)}°。` };
      }
      const shape = pick(rand, ['长方形', '正方形', '等腰三角形', '圆']);
      return { ...pickOptions(rand, '对称轴', ['对称点', '对称中心', '对角线'], 4), prompt: `${shape}沿一条直线对折，两边能完全重合，这条直线叫它的（ ）`, explain: `对折后两边完全重合的直线叫对称轴，${shape}也有这样的对称轴。` };
    }
  },
  {
    askPattern: 'inverse-recall', level: 2,
    make(rand, ctx) {
      const kind = (ctx.params || {}).kind || 'axis';
      if (kind === 'rotation') {
        const m = randInt(rand, 5, 30);
        return { prompt: `钟面上分针走了 ${m} 分钟，一共转过了多少度？`, answer: 6 * m, unit: '°', explain: `分针每分钟转 6°，${m} × 6° = ${6 * m}°。` };
      }
      const step = randInt(rand, 3, 15);
      return { ...pickOptions(rand, '平移', ['旋转', '对称', '放大'], 4), prompt: `一个图形沿直线移动了 ${step} 格，形状和方向都不变，这种运动叫（ ）`, explain: `沿直线移动且方向不变是平移，移动 ${step} 格也不改变形状。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand, ctx) {
      const kind = (ctx.params || {}).kind || 'axis';
      const n = randInt(rand, 1, 12);
      return { prompt: `一个图形向右平移 ${n} 格，平移后与原来相比，形状和大小（ ）`, answer: '不变', explain: `平移只改变位置，形状和大小不变。` };
    }
  },
  {
    askPattern: 'product-recall', level: 1,
    make(rand) {
      const item = pick(rand, [{ s: '正方形', a: '4 条' }, { s: '长方形', a: '2 条' }, { s: '等边三角形', a: '3 条' }, { s: '圆', a: '无数条' }]);
      return { ...pickOptions(rand, item.a, ['1 条', '2 条', '3 条', '4 条', '无数条'].filter((x) => x !== item.a), 4), prompt: `${item.s}有几条对称轴？`, explain: `${item.s}有 ${item.a}对称轴。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand) {
      const h = randInt(rand, 1, 11);
      return { prompt: `钟表分针从 12 走到 ${h}，转过了（ ）°`, answer: 30 * h, unit: '°', explain: `分针走 ${h} 大格，每格 30°，共 ${30 * h}°。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand) {
      const n = randInt(rand, 2, 10); const m = randInt(rand, 1, 10);
      return { prompt: `一个图形先向左平移 ${n} 格，再向右平移 ${m} 格，最后位置相当于从原位置（ ）`, answer: n > m ? `向左 ${n - m} 格` : m > n ? `向右 ${m - n} 格` : '没有移动', explain: `向右和向左的格数相互抵消，最后相当于${n > m ? `向左 ${n - m} 格` : m > n ? `向右 ${m - n} 格` : '没有移动'}。` };
    }
  }
];

const mixedReview = [
  {
    askPattern: 'apply-solve', level: 1,
    make(rand) {
      const a = randInt(rand, 10, 99); const b = randInt(rand, 10, 99); const c = randInt(rand, 2, 9);
      return { prompt: `${a} + ${b} × ${c} = （ ）`, answer: a + b * c, explain: `先算 ${b} × ${c} = ${b * c}，再加 ${a}，得 ${a + b * c}。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand) {
      const a = randInt(rand, 30, 99); const b = randInt(rand, 10, a - 1);
      return { prompt: `小明有 ${a} 元，买书花了 ${b} 元，还剩多少元？`, answer: a - b, unit: '元', explain: `${a} - ${b} = ${a - b}（元）。` };
    }
  },
  {
    askPattern: 'compare-operate', level: 1,
    make(rand) {
      const a = randInt(rand, 2, 20); const b = a + randInt(rand, 1, 20);
      return { ...pickOptions(rand, String(b), [a, b, a + b].filter((x) => x !== b), 3), prompt: `${a} 和 ${b} 中较大的数是（ ）`, explain: `比较后较大的是 ${b}。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand) {
      const b = randInt(rand, 2, 9); const c = randInt(rand, 2, 9); const a = randInt(rand, 1, 30);
      return { prompt: `一箱牛奶有 ${b} 瓶，${c} 箱，另外还有散装 ${a} 瓶，一共有多少瓶？`, answer: b * c + a, unit: '瓶', explain: `${b} × ${c} = ${b * c}，再加 ${a}，共 ${b * c + a}（瓶）。` };
    }
  },
  {
    askPattern: 'inverse-recall', level: 2,
    make(rand) {
      const b = randInt(rand, 5, 40); const a = b + randInt(rand, 1, 30);
      return { prompt: `小明和小红一共有 ${a} 元，小明有 ${b} 元，小红有多少元？`, answer: a - b, unit: '元', explain: `${a} - ${b} = ${a - b}（元）。` };
    }
  }
];

const mul3x2 = [
  {
    askPattern: 'product-recall', level: 1,
    make(rand) {
      const a = randInt(rand, 102, 999);
      const b = randInt(rand, 12, 99);
      return { prompt: `${a} × ${b} = （ ）`, answer: a * b, explain: `用 ${b} 的十位和个位分别乘 ${a}，再把两个部分积相加，得 ${a * b}。` };
    }
  },
  {
    askPattern: 'inverse-recall', level: 1,
    make(rand) {
      const a = randInt(rand, 102, 500);
      const b = randInt(rand, 12, 40);
      return { prompt: `${a * b} ÷ ${a} = （ ）`, answer: b, explain: `${a * b} ÷ ${a} = ${b}，可用“部分积”检验。` };
    }
  },
  {
    askPattern: 'apply-solve', level: 2,
    make(rand) {
      const a = randInt(rand, 120, 480);
      const b = randInt(rand, 12, 35);
      return { prompt: `每箱 ${a} 包，${b} 箱一共多少包？`, answer: a * b, unit: '包', explain: `${a} × ${b} = ${a * b}（包）。` };
    }
  }
];

export const GENERIC_DOMAINS = {
  arith, 'number-read': numberRead, measure, shape, geometry, fraction, decimal,
  'ratio-percent': ratioPercent, statistics, position, equation, logic, clock,
  negative, 'factor-multiple': factorMultiple, 'op-laws': opLaws, triangle,
  symmetry, 'mixed-review': mixedReview, mul3x2
};
