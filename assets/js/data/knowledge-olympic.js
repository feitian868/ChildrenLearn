/**
 * knowledge-olympic.js —— 奥数专区题库（全参数化生成器）
 * 经典思维题，数值随机生成，近似无限不重复。
 * choice 的 answer 为正确项索引（数字）；input 的 answer 为字符串数值。
 * 每题附解析与出处标注，level 统一为 2（应用/分析）。
 */

import { shuffle } from '../core/rng.js';

const r = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));

function item(id, topic, type, prompt, answer, explain, opts) {
  return {
    id, subject: 'olympic', grade: 0, level: 2, topic, type, prompt,
    options: opts || undefined,
    answer: type === 'choice' ? answer : String(answer),
    explain,
    source: `奥数思维 · ${topic}`
  };
}

/** 构造 choice：给定正确值与候选错误值，返回 {options, answer} */
function mc(rng, correct, wrongs) {
  const set = [String(correct)];
  for (const w of wrongs) {
    if (set.length >= 4) break;
    if (!set.includes(String(w))) set.push(String(w));
  }
  const options = shuffle(rng, set);
  return { options, answer: options.indexOf(String(correct)) };
}

/* ---------------- 一年级 ---------------- */
const g1 = [
  (rng) => {
    const a = r(rng, 2, 6), b = r(rng, 2, 6);
    return item('ol-g1-pa', '排队问题', 'input',
      `小朋友排成一队，小明前面有 ${a} 人，后面有 ${b} 人，这一队一共有几人？`,
      a + b + 1,
      `前面 ${a} 人 + 后面 ${b} 人 + 小明自己 = ${a}+${b}+1 = ${a + b + 1} 人。`);
  },
  (rng) => {
    const n = r(rng, 4, 6);
    return item('ol-g1-xd', '数图形', 'input',
      `一条直线上有 ${n} 个点，每两个点之间都连成线段，一共能数出几条线段？`,
      n * (n - 1) / 2,
      `${n}×(${n}-1)÷2 = ${n * (n - 1) / 2} 条。`);
  },
  (rng) => {
    const start = r(rng, 1, 5), step = r(rng, 2, 4);
    const seq = [0, 1, 2, 3].map((i) => start + step * i);
    return item('ol-g1-gl', '找规律', 'input',
      `找规律填数：${seq.join('，')}，（ ）`,
      start + step * 4,
      `每次都多 ${step}，所以括号里是 ${seq[3]}+${step} = ${start + step * 4}。`);
  },
  (rng) => {
    const n = r(rng, 5, 15);
    return item('ol-g1-yb', '一半问题', 'input',
      `一袋糖吃了一半后还剩 ${n} 块，这袋糖原来有几块？`,
      n * 2,
      `一半就是 ${n} 块，原来一共 ${n}×2 = ${n * 2} 块。`);
  },
  (rng) => {
    const names = shuffle(rng, ['小华', '小明', '小强']);
    const { options, answer } = mc(rng, names[0], [names[1], names[2]]);
    return item('ol-g1-tl', '逻辑推理', 'choice',
      `三人比高矮：${names[0]}最高，${names[2]}最矮。谁最高？`,
      answer,
      `题目直接告诉我们：${names[0]}最高。`,
      options);
  },
  (rng) => {
    const half = r(rng, 2, 6);
    return item('ol-g1-tl2', '移多补少', 'input',
      `小明比小红多 ${half * 2} 张贴纸，小明给小红几张后两人一样多？`,
      half,
      `把多出来的 ${half * 2} 张平分给两人：${half * 2}÷2 = ${half} 张。`);
  }
];

/* ---------------- 二年级 ---------------- */
const g2 = [
  (rng) => {
    const x = r(rng, 1, 9), m = r(rng, 2, 4), n = r(rng, 5, 7);
    const a = m * 10 + x, b = n * 10 + (10 - x), c = r(rng, 6, 15);
    return item('ol-g2-cz', '凑整巧算', 'input',
      `用简便方法计算：${a} + ${b} + ${c} = ？`,
      a + b + c,
      `先凑整：${a}+${b} = ${a + b}（整十），再加 ${c} 得 ${a + b + c}。`);
  },
  (rng) => {
    const n = r(rng, 3, 6);
    return item('ol-g2-jm', '间隔问题', 'input',
      `把一根木头锯成 ${n} 段，需要锯几次？`,
      n - 1,
      `锯的次数比段数少 1：${n}-1 = ${n - 1} 次。`);
  },
  (rng) => {
    const n = r(rng, 3, 8);
    return item('ol-g2-lt', '爬楼梯', 'input',
      `从 1 楼走到 ${n} 楼，一共要走几层楼梯？`,
      n - 1,
      `楼层数减 1 就是楼梯层数：${n}-1 = ${n - 1} 层。`);
  },
  (rng) => {
    const pat = shuffle(rng, ['红', '黄', '蓝']);
    const n = r(rng, 10, 30);
    const ans = pat[(n - 1) % 3];
    const { options, answer } = mc(rng, ans, ['红', '黄', '蓝'].filter((c) => c !== ans));
    return item('ol-g2-zq', '周期问题', 'choice',
      `彩灯按「${pat.join('、')}、${pat.join('、')}……」的规律排列，第 ${n} 盏灯是什么颜色？`,
      answer,
      `3 盏一组循环，${n}÷3 余 ${(n - 1) % 3 + 1}，对应「${ans}」。`,
      options);
  },
  (rng) => {
    const x = r(rng, 2, 5);
    return item('ol-g2-yd', '移多补少', 'input',
      `甲给乙 ${x} 个苹果后两人一样多，原来甲比乙多几个？`,
      x * 2,
      `给出 ${x} 个后相等，说明原来多 ${x}×2 = ${x * 2} 个。`);
  },
  (rng) => {
    const b = r(rng, 5, 12), k = r(rng, 2, 4);
    const s = b * (k + 1);
    return item('ol-g2-hb', '和倍问题', 'input',
      `两个数的和是 ${s}，大数是小数的 ${k} 倍，小数是多少？`,
      b,
      `小数 = 和÷(倍数+1) = ${s}÷${k + 1} = ${b}。`);
  }
];

/* ---------------- 三年级 ---------------- */
const g3 = [
  (rng) => {
    const t = r(rng, 4, 8), c = r(rng, 1, t - 1);
    const f = c * 2 + (t - c) * 4;
    return item('ol-g3-jt', '鸡兔同笼', 'input',
      `笼子里有鸡和兔共 ${t} 只，数一数腿一共有 ${f} 条，鸡有几只？`,
      c,
      `假设全是兔，应有 ${t}×4=${t * 4} 条腿，多了 ${t * 4 - f} 条；每只鸡换兔少 2 条，鸡 = ${t * 4 - f}÷2 = ${c} 只。`);
  },
  (rng) => {
    const step = [4, 5, 10, 20][r(rng, 0, 3)];
    const len = step * r(rng, 4, 10);
    return item('ol-g3-zs', '植树问题', 'input',
      `一条 ${len} 米长的路，每隔 ${step} 米种一棵树，两端都要种，一共种几棵？`,
      len / step + 1,
      `间隔 ${len}÷${step} = ${len / step} 个，两端都种要加 1：${len / step + 1} 棵。`);
  },
  (rng) => {
    const a = r(rng, 10, 30), d = r(rng, 2, 8) * 2; // 差取偶数，保证整除
    const s = a * 2 - d;
    return item('ol-g3-hc', '和差问题', 'input',
      `两个数的和是 ${s}，差是 ${d}，较大的数是多少？`,
      a,
      `大数 = (和+差)÷2 = (${s}+${d})÷2 = ${a}。`);
  },
  (rng) => {
    const a = r(rng, 2, 4), db = r(rng, 1, 2), b = a + db;
    const people = r(rng, 4, 9);
    const m = r(rng, 1, 3), total = a * people + m;
    const n = b * people - total;
    return item('ol-g3-yk', '盈亏问题', 'input',
      `分苹果：每人分 ${a} 个就多 ${m} 个，每人分 ${b} 个就少 ${n} 个，一共有几人？`,
      people,
      `人数 = (盈+亏)÷两次差 = (${m}+${n})÷(${b}-${a}) = ${(m + n) / db} = ${people} 人。`);
  },
  (rng) => {
    const k = r(rng, 3, 4), b = r(rng, 5, 10);
    const x = (k - 2) * b;
    return item('ol-g3-nl', '年龄问题', 'input',
      `今年爸爸 ${k * b} 岁，小明 ${b} 岁（爸爸正好是小明的 ${k} 倍）。几年后爸爸的年龄是小明的 2 倍？`,
      x,
      `设 x 年后：${k * b}+x = 2×(${b}+x)，解得 x = ${x}。`);
  },
  (rng) => {
    const n = r(rng, 6, 15);
    return item('ol-g3-lj', '连续求和', 'input',
      `巧算：1 + 2 + 3 + … + ${n} = ？`,
      n * (n + 1) / 2,
      `首尾配对：(1+${n})×${n}÷2 = ${n * (n + 1) / 2}。`);
  }
];

/* ---------------- 四年级 ---------------- */
const g4 = [
  (rng) => {
    const b = r(rng, 4, 12), k = r(rng, 2, 4);
    return item('ol-g4-cb', '差倍问题', 'input',
      `甲比乙多 ${b * (k - 1)}，甲正好是乙的 ${k} 倍，乙是多少？`,
      b,
      `乙 = 差÷(倍数-1) = ${b * (k - 1)}÷${k - 1} = ${b}。`);
  },
  (rng) => {
    const v1 = r(rng, 40, 60), v2 = r(rng, 40, 60), t = r(rng, 2, 5);
    return item('ol-g4-xy', '相遇问题', 'input',
      `两车从两地同时相向开出，速度分别是每小时 ${v1} 千米和 ${v2} 千米，${t} 小时后相遇，两地相距多少千米？`,
      (v1 + v2) * t,
      `路程 = 速度和×时间 = (${v1}+${v2})×${t} = ${(v1 + v2) * t} 千米。`);
  },
  (rng) => {
    const b = r(rng, 78, 90), diff = r(rng, 1, 2), a = b + diff;
    const dropped = b + 5 * diff;
    return item('ol-g4-pj', '平均数', 'input',
      `小明 5 次测验的平均分是 ${a} 分，前 4 次的平均分是 ${b} 分，第 5 次考了多少分？`,
      dropped,
      `5 次总分 ${a}×5=${a * 5}，前 4 次 ${b}×4=${b * 4}，第 5 次 = ${a * 5}-${b * 4} = ${dropped} 分。`);
  },
  (rng) => {
    const n = r(rng, 101, 200);
    const digits = 189 + (n - 99) * 3;
    return item('ol-g4-ym', '页码问题', 'input',
      `一本书从第 1 页排到第 ${n} 页，排版一共用了多少个数字？`,
      digits,
      `1-9 页用 9 个，10-99 页用 180 个，100-${n} 页用 (${n}-99)×3 = ${(n - 99) * 3} 个，共 ${digits} 个。`);
  },
  (rng) => {
    const n = r(rng, 4, 8);
    return item('ol-g4-fz', '方阵问题', 'input',
      `同学们排成 ${n} 行 ${n} 列的方阵，最外面一圈一共有多少人？`,
      (n - 1) * 4,
      `每边 ${n} 人，四个角不能重复算：(${n}-1)×4 = ${(n - 1) * 4} 人。`);
  },
  (rng) => {
    const v = [20, 25, 30, 40][r(rng, 0, 3)], t = r(rng, 6, 12);
    const L = v * t / 2;
    return item('ol-g4-hc', '火车过桥', 'input',
      `一列火车长 ${L} 米，以每秒 ${v} 米的速度通过一座长 ${L} 米的桥，从车头进桥到车尾出桥要几秒？`,
      t,
      `总路程 = 车长+桥长 = ${L * 2} 米，时间 = ${L * 2}÷${v} = ${t} 秒。`);
  }
];

/* ---------------- 五年级 ---------------- */
const g5 = [
  (rng) => {
    const diff = r(rng, 2, 4), t = r(rng, 5, 12);
    const v2 = r(rng, 6, 10), v1 = v2 + diff, d = diff * t;
    return item('ol-g5-zj', '追及问题', 'input',
      `小明在小红前面 ${d} 米。小红每秒跑 ${v1} 米，小明每秒跑 ${v2} 米，小红几秒能追上小明？`,
      t,
      `每秒追上 ${v1}-${v2}=${diff} 米，${d}÷${diff} = ${t} 秒。`);
  },
  (rng) => {
    const v = [15, 20, 25][r(rng, 0, 2)], t = r(rng, 12, 18);
    const L1 = 150, L2 = v * t - L1;
    return item('ol-g5-hc', '火车过隧道', 'input',
      `一列长 ${L1} 米的火车以每秒 ${v} 米的速度穿过长 ${L2} 米的隧道，从进隧道到出隧道要几秒？`,
      t,
      `总路程 = ${L1}+${L2} = ${v * t} 米，时间 = ${v * t}÷${v} = ${t} 秒。`);
  },
  (rng) => {
    const a = r(rng, 20, 35), b = r(rng, 20, 35), inter = r(rng, 5, 12);
    return item('ol-g5-rr', '容斥原理', 'input',
      `班里喜欢语文的 ${a} 人，喜欢数学的 ${b} 人，两门都喜欢的 ${inter} 人，至少喜欢一门的有几人？`,
      a + b - inter,
      `${a}+${b} 把都喜欢的人算了两次，减去一次：${a}+${b}-${inter} = ${a + b - inter} 人。`);
  },
  (rng) => {
    const a1 = r(rng, 2, 5), d = r(rng, 3, 7), n = r(rng, 5, 10);
    const an = a1 + d * (n - 1);
    return item('ol-g5-dc', '等差数列', 'input',
      `一个等差数列首项是 ${a1}，公差是 ${d}，共 ${n} 项，这些项的和是多少？`,
      n * (a1 + an) / 2,
      `末项 = ${a1}+${d}×(${n}-1) = ${an}，和 = (${a1}+${an})×${n}÷2 = ${n * (a1 + an) / 2}。`);
  },
  (rng) => {
    const k = r(rng, 2, 5), m = r(rng, 1, 3), a = r(rng, 2, 6), b = r(rng, 1, 4);
    return item('ol-g5-dy', '定义新运算', 'input',
      `规定 a※b = ${k}×a + ${m}×b，那么 ${a}※${b} = ？`,
      k * a + m * b,
      `代入：${k}×${a} + ${m}×${b} = ${k * a}+${m * b} = ${k * a + m * b}。`);
  },
  (rng) => {
    const mod = r(rng, 3, 6), rem = r(rng, 1, mod - 1);
    const n = mod * r(rng, 3, 6) + rem;
    const { options, answer } = mc(rng, n, [n + 1, n + mod, Math.max(mod, n - 1)]);
    return item('ol-g5-bs', '余数问题', 'choice',
      `一个数除以 ${mod} 余 ${rem}，下面哪个数符合条件？`,
      answer,
      `${n}÷${mod} = ${Math.floor(n / mod)} 余 ${rem}，符合条件。`,
      options);
  }
];

/* ---------------- 六年级 ---------------- */
const g6 = [
  (rng) => {
    const pairs = [[4, 12], [6, 12], [10, 15], [12, 24], [6, 30], [10, 10], [8, 8]];
    const [a, b] = pairs[r(rng, 0, pairs.length - 1)];
    const t = a * b / (a + b);
    return item('ol-g6-gc', '工程问题', 'input',
      `一项工程，甲队单独做 ${a} 天完成，乙队单独做 ${b} 天完成，两队合作几天完成？`,
      t,
      `合作效率 = 1/${a}+1/${b} = ${(a + b)}/${a * b}，时间 = ${a * b}÷${a + b} = ${t} 天。`);
  },
  (rng) => {
    const a = r(rng, 2, 5), b = r(rng, 3, 7), k = r(rng, 5, 10);
    const total = (a + b) * k, x = a * k;
    return item('ol-g6-bl', '按比例分配', 'input',
      `把 ${total} 元奖金按 ${a}:${b} 分给甲乙两人，甲分得多少元？`,
      x,
      `甲占 ${a}/(${a}+${b})，${total}×${a}÷${a + b} = ${x} 元。`);
  },
  (rng) => {
    const price = r(rng, 8, 15) * 10, discount = [9, 8, 7][r(rng, 0, 2)];
    return item('ol-g6-zk', '折扣问题', 'input',
      `一件商品原价 ${price} 元，商场打 ${discount} 折出售，现价多少元？`,
      price * discount / 10,
      `打 ${discount} 折就是乘 0.${discount}：${price}×0.${discount} = ${price * discount / 10} 元。`);
  },
  (rng) => {
    const cycles = { 2: [2, 4, 8, 6], 3: [3, 9, 7, 1], 7: [7, 9, 3, 1], 8: [8, 4, 2, 6] };
    const bs = [2, 3, 7, 8][r(rng, 0, 3)];
    const c = cycles[bs];
    const n = r(rng, 10, 40);
    const last = c[(n - 1) % c.length];
    const { options, answer } = mc(rng, last, [(last + 1) % 10, (last + 9) % 10, (last + 3) % 10]);
    return item('ol-g6-gw', '个位周期', 'choice',
      `${bs} 的 ${n} 次方（${bs}^${n}）的个位数字是几？`,
      answer,
      `${bs} 的幂个位按 ${c.join('→')} 循环，第 ${n} 个落在 ${last}。`,
      options);
  },
  (rng) => {
    const m = r(rng, 10, 20) * 10, water = r(rng, 5, 10) * 10;
    const salt = m / 10;
    const pct = Math.round(salt / (m + water) * 100);
    return item('ol-g6-nd', '浓度问题', 'input',
      `${m} 克盐水里有盐 ${salt} 克，再加入 ${water} 克水，现在盐水浓度约是百分之几？（填整数）`,
      pct,
      `盐不变仍是 ${salt} 克，盐水变成 ${m + water} 克，${salt}÷${m + water}≈${pct}%。`);
  },
  (rng) => {
    const { options, answer } = mc(rng, '甲', ['乙', '丙', '无法确定']);
    return item('ol-g6-tl', '逻辑推理', 'choice',
      '甲、乙、丙中只有一人说了真话。甲说：「乙是第一名」；乙说：「我不是第一名」；丙说：「甲不是第一名」。那么第一名是谁？',
      answer,
      '假设甲第一：甲的话为假、乙的话为真、丙的话为假——恰好只有一人说真话，所以第一名是甲。',
      options);
  }
];

const GRADE_GEN = { 1: g1, 2: g2, 3: g3, 4: g4, 5: g5, 6: g6 };

/** 生成一套 4 题（不同题型模板，每次进入页面都新抽） */
export function olympicSet(grade, rng) {
  const gens = shuffle(rng, (GRADE_GEN[grade] || g3).slice());
  return gens.slice(0, 4).map((fn, i) => {
    const q = fn(rng);
    q.id = `${q.id}-${i}`;
    return q;
  });
}

export default olympicSet;
