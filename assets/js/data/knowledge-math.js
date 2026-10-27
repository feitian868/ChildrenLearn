/**
 * knowledge-math.js —— 数学知识点生成器
 * 数学题用参数化生成，保证计算结果精确；每个生成器都标注年级、难度与教材出处。
 * 生成结果同一天同一科目可复现（随机源来自 rng.js 的日期种子）。
 */

import { randInt, shuffle, pick, hashString } from '../core/rng.js';

const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
};
const lcm = (a, b) => (a / gcd(a, b)) * b;
const fmt = (n) => String(Math.round(n * 100) / 100);
const frac = (n, d) => {
  const g = gcd(n, d);
  const nn = n / g;
  const dd = d / g;
  return dd === 1 ? String(nn) : `${nn}/${dd}`;
};
const src = (grade, unit, term = '上册') => `人教版数学${grade}年级${term} · ${unit}`;

function choose(rand, correct, wrongs, base) {
  const list = [];
  [correct, ...wrongs].forEach((item) => {
    if (item !== correct && !list.includes(item)) list.push(item);
  });
  // 干扰项不足 3 个时，用正确答案附近的数补齐，保证选择题始终有 4 个选项
  const numeric = typeof correct === 'number';
  for (let step = 1; list.length < 3 && numeric && step < 100; step++) {
    [correct + step, correct - step].forEach((item) => {
      if (list.length < 3 && item !== correct && !list.includes(item)) list.push(item);
    });
  }
  const options = shuffle(rand, [correct, ...list.slice(0, 3)]);
  return { ...base, type: 'choice', options, answer: options.indexOf(correct) };
}

/* ============================================================
   生成器清单
   ============================================================ */
const GENERATORS = [];

/* 应用题素材：名字 × 物品 × 数量 → 题干组合空间足够 365 天不重复 */
const STORY_NAMES = ['小明', '小红', '小刚', '小丽', '东东', '芳芳', '乐乐', '天天', '贝贝', '阳阳', '小华', '小美'];
const STORY_ITEMS = [
  ['苹果', '个'], ['铅笔', '支'], ['气球', '个'], ['糖果', '颗'], ['本子', '本'], ['贴纸', '张'],
  ['积木', '块'], ['橘子', '个'], ['草莓', '颗'], ['乒乓球', '个'], ['饼干', '块'], ['小汽车', '辆']
];

/* 1. 基础加减 */
GENERATORS.push({
  key: 'addsub-easy',
  grades: [1, 2],
  level: 1,
  variants: () => 6,
  make(rand, grade) {
    if (grade === 1) {
      let a;
      let b;
      do { a = randInt(rand, 1, 9); b = randInt(rand, 1, 9); } while (a + b > 10);
      if (rand() < 0.5) {
        return {
          topic: '10以内的加法',
          source: src(1, '1~5的认识和加减法'),
          prompt: `${a} + ${b} = （ ）`,
          answer: a + b,
          explain: `把 ${a} 和 ${b} 合起来是 ${a + b}。`
        };
      }
      const big = Math.max(a, b);
      const small = Math.min(a, b);
      return {
        topic: '10以内的减法',
        source: src(1, '1~5的认识和加减法'),
        prompt: `${big} - ${small} = （ ）`,
        answer: big - small,
        explain: `从 ${big} 里去掉 ${small}，还剩 ${big - small}。`
      };
    }
    const tens = randInt(rand, 1, 9) * 10;
    const one = randInt(rand, 1, 9);
    if (rand() < 0.5) {
      return {
        topic: '整十数与一位数',
        source: src(2, '100以内的加法和减法（一）'),
        prompt: `${tens} + ${one} = （ ）`,
        answer: tens + one,
        explain: `${tens} 是 ${tens / 10} 个十，再加 ${one} 个一，得 ${tens + one}。`
      };
    }
    return {
      topic: '整十数与一位数',
      source: src(2, '100以内的加法和减法（一）'),
      prompt: `${tens + one} - ${one} = （ ）`,
      answer: tens,
      explain: `${tens + one} 去掉 ${one}，还剩 ${tens}。`
    };
  }
});

/* 2. 进位加 / 退位减 */
GENERATORS.push({
  key: 'addsub-hard',
  grades: [1, 2, 3, 4],
  level: 2,
  variants: (grade) => (grade === 1 ? 4 : grade >= 2 && grade <= 3 ? 3 : 2),
  make(rand, grade) {
    if (grade === 1) {
      if (rand() < 0.5) {
        const a = randInt(rand, 6, 9);
        const b = randInt(rand, 6, 9);
        return {
          topic: '20以内的进位加法',
          source: src(1, '20以内的进位加法'),
          prompt: `${a} + ${b} = （ ）`,
          answer: a + b,
          explain: `先凑十：${a} + ${10 - a} = 10，再加 ${b - (10 - a)}，得 ${a + b}。`
        };
      }
      const a = randInt(rand, 11, 18);
      const b = randInt(rand, a - 9, 9);
      return {
        topic: '20以内的退位减法',
        source: src(1, '20以内的退位减法', '下册'),
        prompt: `${a} - ${b} = （ ）`,
        answer: a - b,
        explain: `把 ${a} 分成 10 和 ${a - 10}，10 - ${b} = ${10 - b}，再加 ${a - 10}，得 ${a - b}。`
      };
    }
    if (grade === 2) {
      const mode = randInt(rand, 0, 3);
      if (mode === 0) {
        const a = randInt(rand, 16, 89);
        const b = randInt(rand, 11, 99 - a > 11 ? 99 - a : 12);
        const bb = Math.min(99 - a, Math.max(b, 11));
        return {
          topic: '两位数加两位数（进位）',
          source: src(2, '100以内的加法和减法（二）'),
          prompt: `${a} + ${bb} = （ ）`,
          answer: a + bb,
          explain: `个位相加满十向十位进 1，结果是 ${a + bb}。`
        };
      }
      if (mode === 1) {
        const a = randInt(rand, 31, 99);
        const b = randInt(rand, 12, a - 10);
        return {
          topic: '两位数减两位数（退位）',
          source: src(2, '100以内的加法和减法（二）'),
          prompt: `${a} - ${b} = （ ）`,
          answer: a - b,
          explain: `个位不够减，从十位退 1 当十，结果是 ${a - b}。`
        };
      }
      // 整百、整千数的加减（二下「万以内数的认识」）
      const a = randInt(rand, 2, 9) * 100;
      const b = randInt(rand, 1, 9) * 100;
      if (rand() < 0.5) {
        return {
          topic: '整百、整千数的加减法',
          source: src(2, '万以内数的认识', '下册'),
          prompt: `${a} + ${b} = （ ）`,
          answer: a + b,
          explain: `${a / 100} 个百加 ${b / 100} 个百是 ${(a + b) / 100} 个百，即 ${a + b}。`
        };
      }
      const big = Math.max(a, b);
      const small = Math.min(a, b);
      return {
        topic: '整百、整千数的加减法',
        source: src(2, '万以内数的认识', '下册'),
        prompt: `${big} - ${small} = （ ）`,
        answer: big - small,
        explain: `${big / 100} 个百减 ${small / 100} 个百是 ${(big - small) / 100} 个百，即 ${big - small}。`
      };
    }
    if (grade === 3) {
      if (rand() < 0.5) {
        const a = randInt(rand, 105, 899);
        const b = randInt(rand, 105, 999 - a);
        return {
          topic: '万以内的加法',
          source: src(3, '万以内的加法和减法（二）'),
          prompt: `${a} + ${b} = （ ）`,
          answer: a + b,
          explain: `相同数位对齐，从个位加起，结果是 ${a + b}。`
        };
      }
      const a = randInt(rand, 300, 999);
      const b = randInt(rand, 105, a - 100);
      return {
        topic: '万以内的减法',
        source: src(3, '万以内的加法和减法（二）'),
        prompt: `${a} - ${b} = （ ）`,
        answer: a - b,
        explain: `相同数位对齐，从个位减起，结果是 ${a - b}。`
      };
    }
    if (rand() < 0.5) {
      const a = randInt(rand, 1205, 7999);
      const b = randInt(rand, 1005, 9999 - a);
      return {
        topic: '大数的加法',
        source: src(4, '大数的认识'),
        prompt: `${a} + ${b} = （ ）`,
        answer: a + b,
        explain: `按数位对齐相加，结果是 ${a + b}。`
      };
    }
    const a = randInt(rand, 3500, 9999);
    const b = randInt(rand, 1005, a - 1000);
    return {
      topic: '大数的减法',
      source: src(4, '大数的认识'),
      prompt: `${a} - ${b} = （ ）`,
      answer: a - b,
      explain: `按数位对齐相减，结果是 ${a - b}。`
    };
  }
});

/* 3. 数的大小比较 */
GENERATORS.push({
  key: 'compare',
  grades: [1, 2, 3, 4],
  level: (grade) => (grade <= 2 ? 1 : 2),
  variants: (grade) => (grade === 3 ? 4 : grade === 4 ? 3 : 2),
  make(rand, grade) {
    const range = { 1: 20, 2: 100, 3: 9999, 4: 999999 }[grade];
    const unitText = { 1: '20以内数的认识', 2: '100以内数的认识', 3: '万以内数的认识', 4: '大数的认识' }[grade];
    const term = grade === 1 ? '上册' : grade === 2 ? '下册' : '上册';
    let a = randInt(rand, 0, range);
    let b = randInt(rand, 0, range);
    if (rand() < 0.15) b = a;
    const correct = a > b ? '>' : a < b ? '<' : '=';
    const wrongs = ['>', '<', '='].filter((x) => x !== correct);
    return choose(rand, correct, wrongs, {
      topic: '数的大小比较',
      source: src(grade, unitText, term),
      prompt: `${a} ○ ${b}，○ 里填什么符号？`,
      explain: `${a} ${correct} ${b}，所以○里填“${correct}”。`
    });
  }
});

/* 4. 表内乘法 */
GENERATORS.push({
  key: 'mul-table',
  grades: [2, 3],
  level: 1,
  variants: () => 4,
  make(rand, grade) {
    const a = randInt(rand, 2, 9);
    const b = randInt(rand, 2, 9);
    return {
      topic: '表内乘法',
      source: src(2, '表内乘法（一）（二）'),
      prompt: `${a} × ${b} = （ ）`,
      answer: a * b,
      explain: `口诀：${a} ${b} ${a * b}，所以 ${a} × ${b} = ${a * b}。`
    };
  }
});

/* 5. 多位数乘法 */
GENERATORS.push({
  key: 'mul-multi',
  grades: [3, 4],
  level: 2,
  variants: () => 3,
  make(rand, grade) {
    if (grade === 3) {
      const a = rand() < 0.5 ? randInt(rand, 12, 99) : randInt(rand, 102, 999);
      const b = randInt(rand, 2, 9);
      return {
        topic: '多位数乘一位数',
        source: src(3, '多位数乘一位数'),
        prompt: `${a} × ${b} = （ ）`,
        answer: a * b,
        explain: `从个位起，用 ${b} 依次乘每一位，结果是 ${a * b}。`
      };
    }
    const a = randInt(rand, 102, 999);
    const b = randInt(rand, 12, 89);
    return {
      topic: '三位数乘两位数',
      source: src(4, '三位数乘两位数'),
      prompt: `${a} × ${b} = （ ）`,
      answer: a * b,
      explain: `先算 ${a} × ${b % 10}，再算 ${a} × ${Math.floor(b / 10)} 个十，最后相加得 ${a * b}。`
    };
  }
});

/* 6. 整除的除法 */
GENERATORS.push({
  key: 'div-exact',
  grades: [2, 3, 4],
  level: 2,
  variants: () => 3,
  make(rand, grade) {
    if (grade === 2) {
      const b = randInt(rand, 2, 9);
      const q = randInt(rand, 2, 9);
      return {
        topic: '表内除法',
        source: src(2, '表内除法（一）（二）', '下册'),
        prompt: `${b * q} ÷ ${b} = （ ）`,
        answer: q,
        explain: `想乘法口诀：${b} × ${q} = ${b * q}，所以 ${b * q} ÷ ${b} = ${q}。`
      };
    }
    if (grade === 3) {
      const b = randInt(rand, 2, 9);
      const q = randInt(rand, 21, Math.floor(999 / b));
      return {
        topic: '除数是一位数的除法',
        source: src(3, '除数是一位数的除法', '下册'),
        prompt: `${b * q} ÷ ${b} = （ ）`,
        answer: q,
        explain: `从最高位除起，${b * q} ÷ ${b} = ${q}。`
      };
    }
    const b = randInt(rand, 11, 49);
    const q = randInt(rand, 10, 20);
    return {
      topic: '除数是两位数的除法',
      source: src(4, '除数是两位数的除法'),
      prompt: `${b * q} ÷ ${b} = （ ）`,
      answer: q,
      explain: `把 ${b} 看作整十数试商，${b * q} ÷ ${b} = ${q}。`
    };
  }
});

/* 7. 同分母分数加减 */
GENERATORS.push({
  key: 'fraction-same',
  grades: [4, 5],
  level: 2,
  variants: () => 2,
  make(rand, grade) {
    const d = randInt(rand, 5, 10);
    let n1;
    let n2;
    let num;
    let sign;
    if (rand() < 0.5) {
      n1 = randInt(rand, 1, d - 3);
      n2 = randInt(rand, 1, d - 1 - n1);
      num = n1 + n2;
      sign = '+';
    } else {
      n1 = randInt(rand, 3, d - 1);
      n2 = randInt(rand, 1, n1 - 1);
      num = n1 - n2;
      sign = '-';
    }
    const correct = frac(num, d);
    const wrongs = [
      frac(num, d + d),
      frac(num + 1, d),
      frac(num, d - 1 || 1),
      frac(Math.abs(n1 - n2), d),
      frac(num + d, d)
    ].filter((x) => x !== correct);
    return choose(rand, correct, wrongs, {
      topic: '同分母分数加减法',
      source: src(grade, grade === 5 ? '分数的加法和减法' : '分数的初步认识', grade === 5 ? '下册' : '上册'),
      prompt: `${n1}/${d} ${sign} ${n2}/${d} = （ ）`,
      explain: `分母不变，分子 ${sign === '+' ? '相加' : '相减'}：${num}/${d}，约分后是 ${correct}。`
    });
  }
});

/* 8. 异分母分数加减 */
GENERATORS.push({
  key: 'fraction-diff',
  grades: [5, 6],
  level: 2,
  variants: () => 3,
  make(rand, grade) {
    const pool = [2, 3, 4, 5, 6, 8, 10];
    const d1 = pick(rand, pool);
    let d2 = pick(rand, pool);
    while (d2 === d1) d2 = pick(rand, pool);
    const n1 = randInt(rand, 1, d1 - 1);
    const n2 = randInt(rand, 1, d2 - 1);
    const L = lcm(d1, d2);
    const add = rand() < 0.55;
    let num = add ? n1 * (L / d1) + n2 * (L / d2) : n1 * (L / d1) - n2 * (L / d2);
    if (num <= 0) num = Math.abs(num) + 1;
    const correct = frac(num, L);
    const wrongs = [
      frac(num + 1, L),
      frac(num, L + 1),
      frac(n1 + n2, d1 + d2),
      frac(num + L, L)
    ].filter((x) => x !== correct && !x.includes('/0'));
    return choose(rand, correct, wrongs, {
      topic: '异分母分数加减法',
      source: src(grade, '分数的加法和减法', '下册'),
      prompt: `${n1}/${d1} ${add ? '+' : '-'} ${n2}/${d2} = （ ）`,
      explain: `先通分，公分母是 ${L}，计算后约分得 ${correct}。`
    });
  }
});

/* 9. 求一个数的几分之几 */
GENERATORS.push({
  key: 'fraction-of',
  grades: [5, 6],
  level: 2,
  variants: () => 3,
  make(rand, grade) {
    const d = pick(rand, [3, 4, 5, 6, 7, 8, 9, 10, 12]);
    const n = randInt(rand, 1, d - 1);
    const k = randInt(rand, 2, 20);
    const total = d * k;
    const ans = total * n / d;
    return {
      topic: '求一个数的几分之几',
      source: src(grade, '分数的乘法', '上册'),
      prompt: `${total} 的 ${n}/${d} 是多少？`,
      answer: ans,
      explain: `${total} ÷ ${d} × ${n} = ${ans}。`
    };
  }
});

/* 10. 小数乘法 */
GENERATORS.push({
  key: 'decimal-mul',
  grades: [5, 6],
  level: 2,
  variants: () => 3,
  make(rand) {
    const tenths = randInt(rand, 11, 99);
    const b = randInt(rand, 2, 9);
    const product = (tenths * b) / 10;
    return {
      topic: '小数乘法',
      source: src(5, '小数乘法'),
      prompt: `${fmt(tenths / 10)} × ${b} = （ ）`,
      answer: Number(fmt(product)),
      explain: `先按整数乘法算 ${tenths} × ${b} = ${tenths * b}，再点上小数点，得 ${fmt(product)}。`
    };
  }
});

/* 11. 小数除法 */
GENERATORS.push({
  key: 'decimal-div',
  grades: [5, 6],
  level: 2,
  variants: () => 3,
  make(rand, grade) {
    const bTenths = randInt(rand, 4, 95);
    const q = randInt(rand, 2, 12);
    const aTenths = bTenths * q;
    return {
      topic: '小数除法',
      source: src(grade, '小数除法'),
      prompt: `${fmt(aTenths / 10)} ÷ ${fmt(bTenths / 10)} = （ ）`,
      answer: q,
      explain: `把除数变成整数：${fmt(aTenths / 10)} ÷ ${fmt(bTenths / 10)} = ${aTenths} ÷ ${bTenths} = ${q}。`
    };
  }
});

/* 12. 小数大小比较 */
GENERATORS.push({
  key: 'decimal-compare',
  grades: [5],
  level: 1,
  variants: (grade) => (grade === 5 ? 4 : 2),
  make(rand) {
    const a = randInt(rand, 10, 99) / 10;
    let b = randInt(rand, 100, 990) / 100;
    if (Math.abs(a - b) < 0.011) b += 0.11;
    const correct = a > b ? '>' : '<';
    return choose(rand, correct, [correct === '>' ? '<' : '>', '='], {
      topic: '小数的大小比较',
      source: src(5, '小数的意义和性质', '下册'),
      prompt: `${fmt(a)} ○ ${fmt(b)}，○ 里填什么符号？`,
      explain: `${fmt(a)} ${correct} ${fmt(b)}，所以填“${correct}”。`
    });
  }
});

/* 12.5 小数加减法（基础） */
GENERATORS.push({
  key: 'decimal-addsub',
  grades: [4, 5, 6],
  level: 1,
  variants: (grade) => (grade >= 6 ? 16 : grade === 5 ? 12 : 8),
  make(rand, grade) {
    const aT = randInt(rand, 1, 99);
    const bT = randInt(rand, 1, 99);
    if (rand() < 0.5) {
      const sum = aT + bT;
      return {
        topic: '小数的加减法',
        source: src(grade, '小数的加法和减法', '下册'),
        prompt: `${fmt(aT / 10)} + ${fmt(bT / 10)} = （ ）`,
        answer: Number(fmt(sum / 10)),
        explain: `小数点对齐相加：${fmt(aT / 10)} + ${fmt(bT / 10)} = ${fmt(sum / 10)}。`
      };
    }
    const big = Math.max(aT, bT);
    const small = Math.min(aT, bT);
    return {
      topic: '小数的加减法',
      source: src(grade, '小数的加法和减法', '下册'),
      prompt: `${fmt(big / 10)} - ${fmt(small / 10)} = （ ）`,
      answer: Number(fmt((big - small) / 10)),
      explain: `小数点对齐相减：${fmt(big / 10)} - ${fmt(small / 10)} = ${fmt((big - small) / 10)}。`
    };
  }
});

/* 12.6 百分数与小数互化（基础） */
GENERATORS.push({
  key: 'percent-decimal',
  grades: [6],
  level: 1,
  variants: () => 8,
  make(rand) {
    const p = randInt(rand, 1, 100);
    if (rand() < 0.5) {
      return {
        topic: '百分数与小数互化',
        source: src(6, '百分数（一）'),
        prompt: `把 ${p}% 化成小数是多少？`,
        answer: Number(fmt(p / 100)),
        explain: `${p}% = ${p} ÷ 100 = ${fmt(p / 100)}。`
      };
    }
    const x = randInt(rand, 1, 99);
    return {
      topic: '百分数与小数互化',
      source: src(6, '百分数（一）'),
      prompt: `把 ${fmt(x / 100)} 化成百分数，百分号前面的数是多少？`,
      answer: x,
      explain: `${fmt(x / 100)} × 100% = ${x}%。`
    };
  }
});

/* 12.7 三位数加减法（三年级基础，组合空间大） */
GENERATORS.push({
  key: 'addsub-3digit',
  grades: [3],
  level: 1,
  variants: () => 8,
  make(rand) {
    const a = randInt(rand, 100, 999);
    const b = randInt(rand, 100, 999);
    if (rand() < 0.5) {
      return {
        topic: '万以内的加法',
        source: src(3, '万以内的加法和减法'),
        prompt: `${a} + ${b} = （ ）`,
        answer: a + b,
        explain: `个位、十位、百位分别对齐相加：${a} + ${b} = ${a + b}。`
      };
    }
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    return {
      topic: '万以内的减法',
      source: src(3, '万以内的加法和减法'),
      prompt: `${big} - ${small} = （ ）`,
      answer: big - small,
      explain: `相同数位对齐再相减：${big} - ${small} = ${big - small}。`
    };
  }
});

/* 12.8 小数乘整数（五、六年级基础） */
GENERATORS.push({
  key: 'decimal-mul-int',
  grades: [5, 6],
  level: 1,
  variants: (grade) => (grade >= 6 ? 8 : 6),
  make(rand, grade) {
    const aT = randInt(rand, 11, 99);
    const n = randInt(rand, 2, 9);
    return {
      topic: '小数乘法',
      source: src(grade, '小数乘法'),
      prompt: `${fmt(aT / 10)} × ${n} = （ ）`,
      answer: Number(fmt((aT * n) / 10)),
      explain: `先按整数算 ${aT} × ${n} = ${aT * n}，再点一位小数，得 ${fmt((aT * n) / 10)}。`
    };
  }
});

/* 13. 长方形周长 */
GENERATORS.push({
  key: 'perimeter',
  grades: [3, 4],
  level: 1,
  variants: () => 5,
  make(rand) {
    const l = randInt(rand, 4, 40);
    const w = randInt(rand, 2, l - 1);
    return {
      topic: '长方形的周长',
      source: src(3, '长方形和正方形'),
      prompt: `一个长方形长 ${l} 厘米，宽 ${w} 厘米，周长是多少厘米？`,
      answer: 2 * (l + w),
      unit: '厘米',
      explain: `长方形周长 =（长 + 宽）× 2 =（${l} + ${w}）× 2 = ${2 * (l + w)} 厘米。`
    };
  }
});

/* 14. 长方形面积 */
GENERATORS.push({
  key: 'area',
  grades: [3, 4],
  level: 1,
  variants: () => 5,
  make(rand) {
    const l = randInt(rand, 4, 30);
    const w = randInt(rand, 2, 24);
    return {
      topic: '长方形的面积',
      source: src(3, '面积', '下册'),
      prompt: `一个长方形长 ${l} 厘米，宽 ${w} 厘米，面积是多少平方厘米？`,
      answer: l * w,
      unit: '平方厘米',
      explain: `长方形面积 = 长 × 宽 = ${l} × ${w} = ${l * w} 平方厘米。`
    };
  }
});

/* 15. 三角形面积 */
GENERATORS.push({
  key: 'triangle-area',
  grades: [5],
  level: 2,
  variants: () => 2,
  make(rand) {
    const b = randInt(rand, 2, 30) * 2;
    const h = randInt(rand, 4, 30);
    return {
      topic: '三角形的面积',
      source: src(5, '多边形的面积'),
      prompt: `一个三角形的底是 ${b} 厘米，高是 ${h} 厘米，面积是多少平方厘米？`,
      answer: (b * h) / 2,
      unit: '平方厘米',
      explain: `三角形面积 = 底 × 高 ÷ 2 = ${b} × ${h} ÷ 2 = ${(b * h) / 2} 平方厘米。`
    };
  }
});

/* 16. 平行四边形面积 */
GENERATORS.push({
  key: 'parallelogram-area',
  grades: [5],
  level: 2,
  variants: () => 2,
  make(rand) {
    const b = randInt(rand, 4, 30);
    const h = randInt(rand, 3, 20);
    return {
      topic: '平行四边形的面积',
      source: src(5, '多边形的面积'),
      prompt: `一个平行四边形的底是 ${b} 厘米，高是 ${h} 厘米，面积是多少平方厘米？`,
      answer: b * h,
      unit: '平方厘米',
      explain: `平行四边形面积 = 底 × 高 = ${b} × ${h} = ${b * h} 平方厘米。`
    };
  }
});

/* 17. 长方体体积 */
GENERATORS.push({
  key: 'volume-box',
  grades: [5, 6],
  level: 2,
  variants: () => 3,
  make(rand) {
    const a = randInt(rand, 2, 10);
    const b = randInt(rand, 2, 10);
    const c = randInt(rand, 2, 10);
    return {
      topic: '长方体的体积',
      source: src(5, '长方体和正方体', '下册'),
      prompt: `一个长方体长 ${a} 厘米、宽 ${b} 厘米、高 ${c} 厘米，体积是多少立方厘米？`,
      answer: a * b * c,
      unit: '立方厘米',
      explain: `长方体体积 = 长 × 宽 × 高 = ${a} × ${b} × ${c} = ${a * b * c} 立方厘米。`
    };
  }
});

/* 18. 圆的周长与面积 */
GENERATORS.push({
  key: 'circle',
  grades: [6],
  level: 2,
  variants: () => 3,
  make(rand) {
    const r = randInt(rand, 2, 30);
    const mode = randInt(rand, 0, 2);
    if (mode === 0) {
      const c = 2 * 3.14 * r;
      return {
        topic: '圆的周长',
        source: src(6, '圆'),
        prompt: `一个圆的半径是 ${r} 厘米，π 取 3.14，它的周长是多少厘米？`,
        answer: Number(fmt(c)),
        unit: '厘米',
        explain: `圆的周长 = 2πr = 2 × 3.14 × ${r} = ${fmt(c)} 厘米。`
      };
    }
    if (mode === 1) {
      const s = 3.14 * r * r;
      return {
        topic: '圆的面积',
        source: src(6, '圆'),
        prompt: `一个圆的半径是 ${r} 厘米，π 取 3.14，它的面积是多少平方厘米？`,
        answer: Number(fmt(s)),
        unit: '平方厘米',
        explain: `圆的面积 = πr² = 3.14 × ${r} × ${r} = ${fmt(s)} 平方厘米。`
      };
    }
    const d = 2 * r;
    const s = 3.14 * r * r;
    return {
      topic: '圆的面积',
      source: src(6, '圆'),
      prompt: `一个圆的直径是 ${d} 厘米，π 取 3.14，它的面积是多少平方厘米？`,
      answer: Number(fmt(s)),
      unit: '平方厘米',
      explain: `半径 = 直径 ÷ 2 = ${d} ÷ 2 = ${r} 厘米，面积 = 3.14 × ${r} × ${r} = ${fmt(s)} 平方厘米。`
    };
  }
});

/* 19. 圆柱体积 */
GENERATORS.push({
  key: 'cylinder-volume',
  grades: [6],
  level: 2,
  variants: () => 2,
  make(rand) {
    const r = randInt(rand, 2, 15);
    const h = randInt(rand, 2, 20);
    const v = 3.14 * r * r * h;
    return {
      topic: '圆柱的体积',
      source: src(6, '圆柱与圆锥', '下册'),
      prompt: `一个圆柱的底面半径是 ${r} 厘米，高是 ${h} 厘米，π 取 3.14，体积是多少立方厘米？`,
      answer: Number(fmt(v)),
      unit: '立方厘米',
      explain: `圆柱体积 = πr²h = 3.14 × ${r} × ${r} × ${h} = ${fmt(v)} 立方厘米。`
    };
  }
});

/* 20. 简易方程 */
GENERATORS.push({
  key: 'equation',
  grades: [5, 6],
  level: 2,
  variants: () => 3,
  make(rand) {
    const x = randInt(rand, 2, 20);
    const mode = randInt(rand, 0, 2);
    if (mode === 0) {
      const a = randInt(rand, 2, 20);
      return {
        topic: '解方程',
        source: src(5, '简易方程'),
        prompt: `解方程：x + ${a} = ${x + a}，x = （ ）`,
        answer: x,
        explain: `两边同时减去 ${a}，x = ${x + a} - ${a} = ${x}。`
      };
    }
    const k = randInt(rand, 2, 5);
    if (mode === 1) {
      const a = randInt(rand, 1, 15);
      return {
        topic: '解方程',
        source: src(5, '简易方程'),
        prompt: `解方程：${k}x + ${a} = ${k * x + a}，x = （ ）`,
        answer: x,
        explain: `两边先减去 ${a}，得 ${k}x = ${k * x}，再同时除以 ${k}，x = ${x}。`
      };
    }
    return {
      topic: '解方程',
      source: src(5, '简易方程'),
      prompt: `解方程：${k}x = ${k * x}，x = （ ）`,
      answer: x,
      explain: `两边同时除以 ${k}，x = ${k * x} ÷ ${k} = ${x}。`
    };
  }
});

/* 21. 百分数 */
GENERATORS.push({
  key: 'percent',
  grades: [6],
  level: 2,
  variants: () => 3,
  make(rand) {
    const base = randInt(rand, 1, 30) * 20;
    const percent = pick(rand, [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 90]);
    const ans = (base * percent) / 100;
    if (rand() < 0.5) {
      return {
        topic: '百分数的应用',
        source: src(6, '百分数（一）'),
        prompt: `${base} 的 ${percent}% 是多少？`,
        answer: ans,
        explain: `${base} × ${percent}% = ${base} × ${percent / 100} = ${fmt(ans)}。`
      };
    }
    return {
      topic: '百分数的应用',
      source: src(6, '百分数（一）'),
      prompt: `一个数的 ${percent}% 是 ${fmt(ans)}，这个数是多少？`,
      answer: base,
      explain: `${fmt(ans)} ÷ ${percent}% = ${fmt(ans)} ÷ ${percent / 100} = ${base}。`
    };
  }
});

/* 22. 化简比 */
GENERATORS.push({
  key: 'ratio',
  grades: [6],
  level: 2,
  variants: () => 3,
  make(rand) {
    const k = randInt(rand, 2, 6);
    const a = randInt(rand, 2, 9) * k;
    const b = randInt(rand, 2, 9) * k;
    const g = gcd(a, b);
    const correct = `${a / g}:${b / g}`;
    const wrongs = [
      `${a}:${b}`,
      `${a / g + 1}:${b / g}`,
      `${b / g}:${a / g}`,
      `${a / g}:${b / g + 1}`
    ].filter((x) => x !== correct);
    return choose(rand, correct, wrongs, {
      topic: '比的基本性质',
      source: src(6, '比'),
      prompt: `把比 ${a}:${b} 化成最简整数比。`,
      explain: `前项和后项同时除以最大公因数 ${g}，得 ${correct}。`
    });
  }
});

/* 23. 平均数 */
GENERATORS.push({
  key: 'average',
  grades: [4],
  level: 2,
  variants: () => 3,
  make(rand) {
    const avg = randInt(rand, 30, 90);
    const m1 = avg - randInt(rand, 1, 5);
    const m2 = avg + randInt(rand, 1, 4);
    const m3 = 3 * avg - m1 - m2;
    return {
      topic: '平均数',
      source: src(4, '平均数与条形统计图', '下册'),
      prompt: `三个数分别是 ${m1}、${m2}、${m3}，它们的平均数是多少？`,
      answer: avg,
      explain: `（${m1} + ${m2} + ${m3}）÷ 3 = ${3 * avg} ÷ 3 = ${avg}。`
    };
  }
});

/* 24. 三角形内角和 / 平角 */
GENERATORS.push({
  key: 'angle',
  grades: [4],
  level: 2,
  variants: () => 3,
  make(rand) {
    if (rand() < 0.6) {
      const a = randInt(rand, 30, 80);
      const b = randInt(rand, 30, 80);
      const c = 180 - a - b;
      return {
        topic: '三角形的内角和',
        source: src(4, '三角形'),
        prompt: `三角形中两个角分别是 ${a}° 和 ${b}°，第三个角是多少度？`,
        answer: c,
        unit: '度',
        explain: `三角形内角和是 180°，180° - ${a}° - ${b}° = ${c}°。`
      };
    }
    const a = randInt(rand, 20, 160);
    return {
      topic: '平角',
      source: src(4, '角的度量'),
      prompt: `一个角是 ${a}°，它与另一个角组成平角，另一个角是多少度？`,
      answer: 180 - a,
      unit: '度',
      explain: `平角是 180°，180° - ${a}° = ${180 - a}°。`
    };
  }
});

/* 25. 找规律 */
GENERATORS.push({
  key: 'sequence',
  grades: [1, 2, 3],
  level: 1,
  variants: (grade) => (grade === 3 ? 14 : 3),
  make(rand, grade) {
    const dir = rand() < 0.75 ? 1 : -1;
    const step = randInt(rand, 1, 9);
    const start = dir === 1
      ? randInt(rand, 1, grade === 1 ? 60 : grade === 2 ? 80 : 200)
      : randInt(rand, 20, grade === 1 ? 90 : 300);
    const list = [start, start + dir * step, start + dir * 2 * step, start + dir * 3 * step];
    if (list.some((n) => n < 0)) return null;
    if (rand() < 0.5) {
      return {
        topic: '找规律',
        source: src(grade, grade === 3 ? '万以内的加法和减法（一）' : '找规律', grade === 2 ? '下册' : '上册'),
        prompt: `${list.join('、')}、（ ）`,
        answer: start + dir * 4 * step,
        explain: `每次${dir === 1 ? '加' : '减'} ${step}，所以下一个数是 ${start + dir * 4 * step}。`
      };
    }
    const blank = randInt(rand, 1, 3);
    const shown = list.map((n, i) => (i === blank ? '（ ）' : n));
    return {
      topic: '找规律',
      source: src(grade, grade === 3 ? '万以内的加法和减法（一）' : '找规律', grade === 2 ? '下册' : '上册'),
      prompt: `${shown.join('、')}，中间缺少的数是几？`,
      answer: start + dir * blank * step,
      explain: `这列数每次${dir === 1 ? '加' : '减'} ${step}，缺少的数是 ${start + dir * blank * step}。`
    };
  }
});

/* 26. 人民币 */
GENERATORS.push({
  key: 'money',
  grades: [1, 2],
  level: 1,
  variants: () => 3,
  make(rand, grade) {
    const mode = randInt(rand, 0, 3);
    const x = randInt(rand, 1, 20);
    if (mode === 0) {
      return {
        topic: '人民币的认识',
        source: src(1, '认识人民币', '下册'),
        prompt: `${x} 元 = （ ）角`,
        answer: x * 10,
        unit: '角',
        explain: `1 元 = 10 角，${x} 元 = ${x * 10} 角。`
      };
    }
    if (mode === 1) {
      const y = randInt(rand, 1, 9);
      return {
        topic: '人民币的认识',
        source: src(1, '认识人民币', '下册'),
        prompt: `${x} 元 ${y} 角 = （ ）角`,
        answer: x * 10 + y,
        unit: '角',
        explain: `${x} 元是 ${x * 10} 角，再加 ${y} 角，共 ${x * 10 + y} 角。`
      };
    }
    if (mode === 2) {
      return {
        topic: '人民币的认识',
        source: src(1, '认识人民币', '下册'),
        prompt: `${x * 10} 角 = （ ）元`,
        answer: x,
        unit: '元',
        explain: `10 角 = 1 元，${x * 10} 角 = ${x} 元。`
      };
    }
    const a = randInt(rand, 1, 30);
    const b = randInt(rand, 1, 20);
    const cost = Math.min(a, b);
    return {
      topic: '人民币的认识',
      source: src(grade, '认识人民币', '下册'),
      prompt: `${STORY_NAMES[0]}有 ${a + b} 元，买文具用了 ${cost} 元，还剩多少元？`,
      answer: a + b - cost,
      unit: '元',
      explain: `${a + b} - ${cost} = ${a + b - cost} 元。`
    };
  }
});

/* 27. 认识钟表 */
GENERATORS.push({
  key: 'clock',
  grades: [1, 2],
  level: 1,
  variants: () => 2,
  make(rand) {
    const h = randInt(rand, 1, 11);
    const mode = randInt(rand, 0, 2);
    if (mode === 0) {
      return choose(rand, `${h}时`, [`${h + 1}时`, `${h + 2}时`, `${h === 1 ? 12 : h - 1}时`], {
        topic: '认识钟表',
        source: src(1, '认识钟表'),
        prompt: `钟面上时针指向 ${h}，分针指向 12，现在是几时？`,
        explain: `分针指向 12，时针指向几就是几时，所以是 ${h}时。`
      });
    }
    if (mode === 1) {
      return choose(rand, `${h}时30分`, [`${h}时`, `${h + 1}时`, `${h + 1}时30分`], {
        topic: '认识钟表',
        source: src(1, '认识钟表'),
        prompt: `钟面上时针刚过 ${h}，分针指向 6，现在是几时几分？`,
        explain: `分针指向 6 是 30 分，时针刚过 ${h}，所以是 ${h}时30分。`
      });
    }
    const n = randInt(rand, 1, 6);
    const to = ((h - 1 + n) % 12) + 1;
    return choose(rand, `${to}时`, [`${h}时`, `${to + 1 > 12 ? 1 : to + 1}时`, `${h + 1 > 12 ? 1 : h + 1}时`], {
      topic: '认识钟表',
      source: src(2, '认识时间', '上册'),
      prompt: `现在是 ${h} 时，再过 ${n} 小时是几时？`,
      explain: `${h} + ${n} = ${h + n}，${h + n} 时就是 ${to}时。`
    });
  }
});

/* 28. 长度单位换算 */
GENERATORS.push({
  key: 'unit-length',
  grades: [1, 2, 3],
  level: 1,
  variants: () => 2,
  make(rand, grade) {
    if (grade >= 3 && rand() < 0.5) {
      const x = randInt(rand, 1, 20);
      return {
        topic: '长度单位换算',
        source: src(3, '测量'),
        prompt: `${x} 千米 = （ ）米`,
        answer: x * 1000,
        unit: '米',
        explain: `1 千米 = 1000 米，${x} 千米 = ${x * 1000} 米。`
      };
    }
    const x = randInt(rand, 1, grade >= 3 ? 30 : 20);
    return {
      topic: '长度单位换算',
      source: src(grade, '长度单位'),
      prompt: `${x} 米 = （ ）厘米`,
      answer: x * 100,
      unit: '厘米',
      explain: `1 米 = 100 厘米，${x} 米 = ${x * 100} 厘米。`
    };
  }
});

/* 29. 质量单位换算 */
GENERATORS.push({
  key: 'unit-weight',
  grades: [3, 4],
  level: 2,
  variants: () => 2,
  make(rand, grade) {
    const x = randInt(rand, 1, 20);
    if (grade >= 4 && rand() < 0.5) {
      return {
        topic: '质量单位换算',
        source: src(4, '公顷和平方千米'),
        prompt: `${x} 吨 = （ ）千克`,
        answer: x * 1000,
        unit: '千克',
        explain: `1 吨 = 1000 千克，${x} 吨 = ${x * 1000} 千克。`
      };
    }
    return {
      topic: '质量单位换算',
      source: src(3, '测量'),
      prompt: `${x} 千克 = （ ）克`,
      answer: x * 1000,
      unit: '克',
      explain: `1 千克 = 1000 克，${x} 千克 = ${x * 1000} 克。`
    };
  }
});

/* 30. 数位组成 */
GENERATORS.push({
  key: 'place-value',
  grades: [4],
  level: 1,
  variants: () => 6,
  make(rand) {
    const t = randInt(rand, 1, 9);
    const h = randInt(rand, 0, 9);
    const ten = randInt(rand, 0, 9);
    const one = randInt(rand, 0, 9);
    const value = t * 1000 + h * 100 + ten * 10 + one;
    return {
      topic: '数的组成',
      source: src(4, '大数的认识'),
      prompt: `一个数由 ${t} 个千、${h} 个百、${ten} 个十和 ${one} 个一组成，这个数是多少？`,
      answer: value,
      explain: `${t} 个千是 ${t * 1000}，${h} 个百是 ${h * 100}，${ten} 个十是 ${ten * 10}，合起来是 ${value}。`
    };
  }
});

/* 31. 数的分与合 */
GENERATORS.push({
  key: 'decompose',
  grades: [1],
  level: 1,
  variants: () => 3,
  make(rand) {
    const total = randInt(rand, 3, 20);
    const part = randInt(rand, 1, total - 1);
    return {
      topic: '数的分与合',
      source: src(1, '1~5的认识和加减法'),
      prompt: `${total} 可以分成 ${part} 和 （ ）`,
      answer: total - part,
      explain: `${part} 和 ${total - part} 合起来是 ${total}。`
    };
  }
});

/* 32. 数数 */
GENERATORS.push({
  key: 'counting',
  grades: [1],
  level: 1,
  variants: () => 3,
  make(rand) {
    const a = randInt(rand, 1, 80);
    const b = randInt(rand, a + 2, a + 12);
    if (rand() < 0.5) {
      return {
        topic: '数数',
        source: src(1, '11~20各数的认识'),
        prompt: `从 ${a} 数到 ${b}，一共数了几个数？`,
        answer: b - a + 1,
        explain: `${b} - ${a} + 1 = ${b - a + 1}，一共数了 ${b - a + 1} 个数。`
      };
    }
    const n = randInt(rand, 1, 10);
    return {
      topic: '数数',
      source: src(1, '11~20各数的认识'),
      prompt: `从 ${a} 往后数 ${n} 个数，数到的数是多少？`,
      answer: a + n,
      explain: `${a} 往后数 ${n} 个数就是 ${a} + ${n} = ${a + n}。`
    };
  }
});

/* 33. 加法应用题 */
GENERATORS.push({
  key: 'story-add',
  grades: [1, 2],
  level: 1,
  variants: () => 6,
  make(rand, grade) {
    const name = pick(rand, STORY_NAMES);
    const [item, unit] = pick(rand, STORY_ITEMS);
    const max = grade === 1 ? 12 : 80;
    const a = randInt(rand, 2, max);
    const b = randInt(rand, 2, max);
    if (rand() < 0.5) {
      return {
        topic: '加法应用题',
        source: src(grade, grade === 1 ? '11~20各数的认识' : '100以内的加法和减法（二）'),
        prompt: `${name}有 ${a} ${unit}${item}，妈妈又买了 ${b} ${unit}，现在一共有多少${unit}？`,
        answer: a + b,
        unit,
        explain: `${a} + ${b} = ${a + b}（${unit}）。`
      };
    }
    return {
      topic: '加法应用题',
      source: src(grade, grade === 1 ? '11~20各数的认识' : '100以内的加法和减法（二）'),
      prompt: `${name}第一次折了 ${a} 只纸鹤，第二次折了 ${b} 只，两次一共折了多少只？`,
      answer: a + b,
      unit: '只',
      explain: `${a} + ${b} = ${a + b}（只）。`
    };
  }
});

/* 34. 减法应用题 */
GENERATORS.push({
  key: 'story-sub',
  grades: [1, 2],
  level: 1,
  variants: () => 5,
  make(rand, grade) {
    const name = pick(rand, STORY_NAMES);
    const [item, unit] = pick(rand, STORY_ITEMS);
    const max = grade === 1 ? 12 : 90;
    const a = randInt(rand, 4, max);
    const b = randInt(rand, 1, a - 1);
    if (rand() < 0.5) {
      return {
        topic: '减法应用题',
        source: src(grade, grade === 1 ? '20以内的退位减法' : '100以内的加法和减法（二）'),
        prompt: `${name}有 ${a} ${unit}${item}，送给了同学 ${b} ${unit}，还剩多少${unit}？`,
        answer: a - b,
        unit,
        explain: `${a} - ${b} = ${a - b}（${unit}）。`
      };
    }
    return {
      topic: '减法应用题',
      source: src(grade, grade === 1 ? '20以内的退位减法' : '100以内的加法和减法（二）'),
      prompt: `书架上原来有 ${a} 本书，被借走了 ${b} 本，还剩多少本？`,
      answer: a - b,
      unit: '本',
      explain: `${a} - ${b} = ${a - b}（本）。`
    };
  }
});

/* 35. 两步应用题（挑战） */
GENERATORS.push({
  key: 'story-two-step',
  grades: [1, 2],
  level: 2,
  variants: (grade) => (grade === 1 ? 10 : 6),
  make(rand, grade) {
    const name = pick(rand, STORY_NAMES);
    const [item, unit] = pick(rand, STORY_ITEMS);
    const max = grade === 1 ? 20 : 100;
    const a = randInt(rand, 5, max);
    const b = randInt(rand, 1, Math.max(2, Math.floor(a / 2)));
    const c = randInt(rand, 1, 9);
    if (rand() < 0.5) {
      return {
        topic: '两步应用题',
        source: src(grade, '解决问题'),
        prompt: `${name}有 ${a} ${unit}${item}，送给同学 ${b} ${unit}，又买了 ${c} ${unit}，现在有多少${unit}？`,
        answer: a - b + c,
        unit,
        explain: `先算剩下 ${a} - ${b} = ${a - b}，再加 ${c}，得 ${a - b + c}（${unit}）。`
      };
    }
    return {
      topic: '两步应用题',
      source: src(grade, '解决问题'),
      prompt: `${name}有 ${a} ${unit}${item}，又买了 ${c} ${unit}，用掉了 ${b} ${unit}，还剩多少${unit}？`,
      answer: a + c - b,
      unit,
      explain: `先算一共 ${a} + ${c} = ${a + c}，再减去 ${b}，得 ${a + c - b}（${unit}）。`
    };
  }
});

/* 36. 乘除应用题（挑战） */
GENERATORS.push({
  key: 'story-muldiv',
  grades: [2, 3],
  level: 2,
  variants: (grade) => (grade === 2 ? 7 : 4),
  make(rand, grade) {
    const name = pick(rand, STORY_NAMES);
    const [item, unit] = pick(rand, STORY_ITEMS);
    const b = randInt(rand, 2, 9);
    const q = randInt(rand, 2, grade === 2 ? 9 : 30);
    if (rand() < 0.5) {
      return {
        topic: '乘法应用题',
        source: src(grade, grade === 2 ? '表内乘法（二）' : '多位数乘一位数'),
        prompt: `${name}每盒有 ${b} ${unit}${item}，一共 ${q} 盒，一共有多少${unit}？`,
        answer: b * q,
        unit,
        explain: `${b} × ${q} = ${b * q}（${unit}）。`
      };
    }
    return {
      topic: '除法应用题',
      source: src(grade, grade === 2 ? '表内除法（二）' : '除数是一位数的除法'),
      prompt: `${name}把 ${b * q} ${unit}${item}平均分给 ${b} 个同学，每人分到多少${unit}？`,
      answer: q,
      unit,
      explain: `${b * q} ÷ ${b} = ${q}（${unit}）。`
    };
  }
});

/* 37. 百分数应用题（挑战） */
GENERATORS.push({
  key: 'story-percent',
  grades: [6],
  level: 2,
  variants: () => 3,
  make(rand) {
    const name = pick(rand, STORY_NAMES);
    const base = pick(rand, [20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150, 200, 240, 300, 400, 500]);
    const percent = pick(rand, [5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 90]);
    const ans = (base * percent) / 100;
    if (rand() < 0.5) {
      return {
        topic: '百分数的应用',
        source: src(6, '百分数（一）'),
        prompt: `一本书共 ${base} 页，${name}读了全书的 ${percent}%，读了多少页？`,
        answer: ans,
        unit: '页',
        explain: `${base} × ${percent}% = ${fmt(ans)}（页）。`
      };
    }
    return {
      topic: '百分数的应用',
      source: src(6, '百分数（一）'),
      prompt: `${name}有 ${base} 元零花钱，用去了 ${percent}%，用去了多少元？`,
      answer: ans,
      unit: '元',
      explain: `${base} × ${percent}% = ${fmt(ans)}（元）。`
    };
  }
});

/* 38. 20 以内加减混合（一年级挑战） */
GENERATORS.push({
  key: 'mix-20',
  grades: [1],
  level: 2,
  variants: () => 4,
  make(rand) {
    const a = randInt(rand, 6, 14);
    const b = randInt(rand, 1, Math.min(a - 1, 9));
    const c = randInt(rand, 1, Math.min(9, 20 - (a - b)));
    return {
      topic: '20以内的加减混合',
      source: src(1, '20以内的加减法'),
      prompt: `${a} - ${b} + ${c} = （ ）`,
      answer: a - b + c,
      explain: `按顺序算：${a} - ${b} = ${a - b}，${a - b} + ${c} = ${a - b + c}。`
    };
  }
});

/* 39. 加减混合运算（二、三年级挑战，结果控制在所学范围内） */
GENERATORS.push({
  key: 'mix-addsub',
  grades: [2, 3],
  level: 2,
  variants: () => 4,
  make(rand, grade) {
    const hi = grade === 2 ? 99 : 900;
    const lo = grade === 2 ? 20 : 120;
    const unit2 = grade === 2 ? '100以内的加法和减法（二）' : '万以内的加法和减法（二）';
    if (rand() < 0.5) {
      const a = randInt(rand, lo, hi - 30);
      const b = randInt(rand, lo, hi - a > lo ? hi - a : lo);
      const sum = a + b;
      const c = randInt(rand, 10, sum - 5);
      return {
        topic: '加减混合运算',
        source: src(grade, unit2),
        prompt: `${a} + ${b} - ${c} = （ ）`,
        answer: sum - c,
        explain: `按从左到右的顺序算：${a} + ${b} = ${sum}，${sum} - ${c} = ${sum - c}。`
      };
    }
    const a = randInt(rand, lo + 30, hi);
    const b = randInt(rand, 11, a - 10);
    const rest = a - b;
    const c = randInt(rand, 10, hi - rest > 10 ? hi - rest : 10);
    return {
      topic: '加减混合运算',
      source: src(grade, unit2),
      prompt: `${a} - ${b} + ${c} = （ ）`,
      answer: rest + c,
      explain: `按从左到右的顺序算：${a} - ${b} = ${rest}，${rest} + ${c} = ${rest + c}。`
    };
  }
});

/* 40. 乘加、乘减混合（二、三年级挑战） */
GENERATORS.push({
  key: 'mul-addsub',
  grades: [2, 3],
  level: 2,
  variants: () => 4,
  make(rand, grade) {
    const a = randInt(rand, 2, 9);
    const b = randInt(rand, 2, 9);
    const product = a * b;
    const topic = '乘加、乘减';
    const source = src(2, '表内乘法（二）');
    if (rand() < 0.5) {
      const c = randInt(rand, 2, grade === 2 ? 50 : 200);
      return {
        topic,
        source,
        prompt: `${a} × ${b} + ${c} = （ ）`,
        answer: product + c,
        explain: `先算乘法 ${a} × ${b} = ${product}，再算 ${product} + ${c} = ${product + c}。`
      };
    }
    const c = randInt(rand, 1, product - 1);
    return {
      topic,
      source,
      prompt: `${a} × ${b} - ${c} = （ ）`,
      answer: product - c,
      explain: `先算乘法 ${a} × ${b} = ${product}，再算 ${product} - ${c} = ${product - c}。`
    };
  }
});

/* 41. 有余数的除法（二、三年级挑战，选择题） */
GENERATORS.push({
  key: 'div-remainder',
  grades: [2, 3],
  level: 2,
  variants: () => 4,
  make(rand) {
    const b = randInt(rand, 3, 9);
    const q = randInt(rand, 2, 9);
    const r = randInt(rand, 1, b - 1);
    const n = b * q + r;
    const correct = `商 ${q} 余 ${r}`;
    const wrongs = [
      `商 ${q + 1} 余 ${r}`,
      `商 ${q} 余 ${r === 1 ? r + 1 : r - 1}`,
      `商 ${q - 1 > 0 ? q - 1 : q + 2} 余 ${r}`
    ].filter((x) => x !== correct);
    return choose(rand, correct, wrongs, {
      topic: '有余数的除法',
      source: src(2, '有余数的除法', '下册'),
      prompt: `${n} ÷ ${b} 的商和余数是多少？`,
      explain: `${b} × ${q} = ${b * q}，${n} - ${b * q} = ${r}，余数要比除数小，所以 ${correct}。`
    });
  }
});

/* 42. 四则混合运算顺序（三、四年级挑战） */
GENERATORS.push({
  key: 'order-ops',
  grades: [3, 4],
  level: 2,
  variants: () => 4,
  make(rand, grade) {
    const hi = grade === 3 ? 200 : 500;
    const mode = randInt(rand, 0, 3);
    if (mode === 0) {
      const a = randInt(rand, 10, hi);
      const b = randInt(rand, 2, 9);
      const c = randInt(rand, 2, 9);
      return {
        topic: '四则混合运算',
        source: src(grade, '四则运算', grade === 3 ? '上册' : '下册'),
        prompt: `${a} + ${b} × ${c} = （ ）`,
        answer: a + b * c,
        explain: `先算乘法 ${b} × ${c} = ${b * c}，再算加法 ${a} + ${b * c} = ${a + b * c}。`
      };
    }
    if (mode === 1) {
      const b = randInt(rand, 2, 9);
      const c = randInt(rand, 2, 9);
      const a = randInt(rand, b * c + 2, b * c + hi);
      return {
        topic: '四则混合运算',
        source: src(grade, '四则运算', grade === 3 ? '上册' : '下册'),
        prompt: `${a} - ${b} × ${c} = （ ）`,
        answer: a - b * c,
        explain: `先算乘法 ${b} × ${c} = ${b * c}，再算减法 ${a} - ${b * c} = ${a - b * c}。`
      };
    }
    const a = randInt(rand, 2, 30);
    const b = randInt(rand, 2, 20);
    const c = randInt(rand, 2, 9);
    return {
      topic: '四则混合运算',
      source: src(grade, '四则运算', grade === 3 ? '上册' : '下册'),
      prompt: `（${a} + ${b}）× ${c} = （ ）`,
      answer: (a + b) * c,
      explain: `有括号先算括号里：${a} + ${b} = ${a + b}，再算 ${a + b} × ${c} = ${(a + b) * c}。`
    };
  }
});

/* 43. 分数乘整数（六年级挑战，选择题） */
GENERATORS.push({
  key: 'fraction-mul',
  grades: [6],
  level: 2,
  variants: () => 3,
  make(rand) {
    const d = pick(rand, [3, 4, 5, 6, 7, 8, 9, 10, 12]);
    const n = randInt(rand, 1, d - 1);
    const k = randInt(rand, 2, 9);
    const num = n * k;
    const correct = frac(num, d);
    const wrongs = [
      frac(num, d * k),
      frac(n + k, d),
      frac(num + 1, d),
      frac(Math.max(1, num - 1), d)
    ].filter((x) => x !== correct);
    return choose(rand, correct, wrongs, {
      topic: '分数乘整数',
      source: src(6, '分数乘法'),
      prompt: `${n}/${d} × ${k} = （ ）`,
      explain: `分子乘整数：${n} × ${k} = ${num}，分母不变，约分后是 ${correct}。`
    });
  }
});

/* ============================================================
   对外接口
   ============================================================ */
export function mathPool(grade, rng) {
  const items = [];
  GENERATORS.forEach((gen) => {
    if (!gen.grades.includes(grade)) return;
    const level = typeof gen.level === 'function' ? gen.level(grade) : gen.level;
    const count = gen.variants(grade);
    for (let i = 0; i < count; i++) {
      const made = gen.make(rng, grade);
      if (!made || made.answer === null || made.answer === undefined) continue;
      if (items.some((x) => x.prompt === made.prompt && x.answer === made.answer)) continue;
      items.push({
        // 用「题干+答案」内容哈希做 id：同一天内可去重，跨天同题 365 天内不再出现
        id: `ma-g${grade}-${hashString(`${made.prompt}|${made.answer}`)}`,
        subject: 'math',
        grade,
        level,
        topic: made.topic,
        type: made.type || 'input',
        prompt: made.prompt,
        ...(made.options ? { options: made.options } : {}),
        answer: made.answer,
        ...(made.unit ? { unit: made.unit } : {}),
        explain: made.explain,
        source: made.source
      });
    }
  });
  return items;
}
