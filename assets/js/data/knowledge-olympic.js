/**
 * knowledge-olympic.js —— 奥数专区题库（全参数化生成器）
 * 12 种题型模板 × 6 年级 = 72 个生成器，参数范围宽 → 近乎无限不重复。
 * olympicSet() 支持：bag 轮询（保证所有模板轮流出现）+ prompt hash 去重（30 天内不重复相同题目）。
 *
 * choice 的 answer 为正确项索引（数字）；input 的 answer 为字符串数值。
 * 每题附解析与出处标注，level 统一为 2（应用/分析）。
 */

import { shuffle, hashString } from '../core/rng.js';

const r = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));

function item(templateId, topic, type, prompt, answer, explain, opts) {
  const q = {
    templateId, subject: 'olympic', grade: 0, level: 2, topic, type, prompt,
    options: opts || undefined,
    answer: type === 'choice' ? answer : String(answer),
    explain,
    source: `奥数思维 · ${topic}`
  };
  q.promptHash = hashString(prompt);
  return q;
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

/* ==================== 一年级（g1） ==================== */
const g1 = [
  (rng) => { // 排队问题
    const a = r(rng, 2, 8), b = r(rng, 2, 8);
    return item('ol-g1-pa', '排队问题', 'input',
      `小朋友排成一队，小明前面有 ${a} 人，后面有 ${b} 人，这一队一共有几人？`,
      a + b + 1,
      `前面 ${a} 人 + 后面 ${b} 人 + 小明自己 = ${a}+${b}+1 = ${a + b + 1} 人。`);
  },
  (rng) => { // 数图形
    const n = r(rng, 4, 8);
    return item('ol-g1-xd', '数图形', 'input',
      `一条直线上有 ${n} 个点，每两个点之间都连成线段，一共能数出几条线段？`,
      n * (n - 1) / 2,
      `${n}×(${n}-1)÷2 = ${n * (n - 1) / 2} 条。`);
  },
  (rng) => { // 找规律（等差）
    const start = r(rng, 1, 9), step = r(rng, 2, 5);
    const seq = [0, 1, 2, 3].map((i) => start + step * i);
    return item('ol-g1-gl', '找规律', 'input',
      `找规律填数：${seq.join('，')}，（ ）`,
      start + step * 4,
      `每次都多 ${step}，所以括号里是 ${seq[3]}+${step} = ${start + step * 4}。`);
  },
  (rng) => { // 一半问题
    const n = r(rng, 5, 20);
    return item('ol-g1-yb', '一半问题', 'input',
      `一袋糖吃了一半后还剩 ${n} 块，这袋糖原来有几块？`,
      n * 2,
      `一半就是 ${n} 块，原来一共 ${n}×2 = ${n * 2} 块。`);
  },
  (rng) => { // 逻辑推理（比高矮）
    const names = shuffle(rng, ['小华', '小明', '小强']);
    const { options, answer } = mc(rng, names[0], [names[1], names[2]]);
    return item('ol-g1-tl', '逻辑推理', 'choice',
      `三人比高矮：${names[0]}最高，${names[2]}最矮。谁最高？`,
      answer,
      `题目直接告诉我们：${names[0]}最高。`,
      options);
  },
  (rng) => { // 移多补少
    const half = r(rng, 2, 8);
    return item('ol-g1-yb2', '移多补少', 'input',
      `小明比小红多 ${half * 2} 张贴纸，小明给小红几张后两人一样多？`,
      half,
      `把多出来的 ${half * 2} 张平分给两人：${half * 2}÷2 = ${half} 张。`);
  },
  // ---- 新增 6 个 ----
  (rng) => { // 双数单数
    const n = r(rng, 10, 30);
    const ans = n % 2 === 0;
    const { options, answer } = mc(rng, ans ? '双数' : '单数', [ans ? '单数' : '双数', '都不是', '都是']);
    return item('ol-g1-ds', '双数单数', 'choice',
      `${n} 是双数还是单数？`,
      answer,
      `${n}÷2 = ${Math.floor(n/2)} ${ans ? '能整除' : '余1'}，所以是${ans ? '双数' : '单数'}。`,
      options);
  },
  (rng) => { // 比大小凑数
    const target = r(rng, 10, 20);
    const a = r(rng, 2, target - 3);
    const b = target - a;
    return item('ol-g1-cn', '凑数游戏', 'input',
      `算式 ${a} + ( ) = ${target}，括号里填几？`,
      b,
      `${target} - ${a} = ${b}，所以填 ${b}。`);
  },
  (rng) => { // 数方块
    const top = r(rng, 2, 4), bot = r(rng, top + 1, 6);
    return item('ol-g1-fk', '数方块', 'input',
      `积木两层，上面一层有 ${top} 块，下面一层有 ${bot} 块，一共有几块？`,
      top + bot,
      `${top} + ${bot} = ${top + bot} 块。`);
  },
  (rng) => { // 月份常识
    const m = r(rng, 1, 12);
    const days = [31,28,31,30,31,30,31,31,30,31,30,31][m-1];
    return item('ol-g1-yy', '月份天数', 'input',
      `${m} 月有多少天？`,
      days,
      `${m} 月是大/小月，有 ${days} 天。`);
  },
  (rng) => { // 简单乘法（几个几）
    const group = r(rng, 2, 5), per = r(rng, 2, 5);
    return item('ol-g1-jc', '几个几', 'input',
      `有 ${group} 盘苹果，每盘 ${per} 个，一共多少个苹果？`,
      group * per,
      `${group} × ${per} = ${group * per} 个。`);
  },
  (rng) => { // 年龄差
    const dad = r(rng, 28, 40), me = r(rng, 4, 10);
    const diff = dad - me;
    return item('ol-g1-nl', '年龄差', 'input',
      `爸爸今年 ${dad} 岁，我今年 ${me} 岁。10 年后爸爸比我大几岁？`,
      diff,
      `年龄差永远不变：${dad} - ${me} = ${diff} 岁。10 年后还是 ${diff} 岁。`);
  }
];

/* ==================== 二年级（g2） ==================== */
const g2 = [
  (rng) => { // 凑整巧算
    const x = r(rng, 1, 9), m = r(rng, 2, 4), n = r(rng, 5, 7);
    const a = m * 10 + x, b = n * 10 + (10 - x), c = r(rng, 6, 15);
    return item('ol-g2-cz', '凑整巧算', 'input',
      `用简便方法计算：${a} + ${b} + ${c} = ？`,
      a + b + c,
      `先凑整：${a}+${b} = ${a + b}（整十），再加 ${c} 得 ${a + b + c}。`);
  },
  (rng) => { // 间隔问题（锯木头）
    const n = r(rng, 3, 8);
    return item('ol-g2-jm', '间隔问题', 'input',
      `把一根木头锯成 ${n} 段，需要锯几次？`,
      n - 1,
      `锯的次数比段数少 1：${n}-1 = ${n - 1} 次。`);
  },
  (rng) => { // 爬楼梯
    const n = r(rng, 3, 10);
    return item('ol-g2-lt', '爬楼梯', 'input',
      `从 1 楼走到 ${n} 楼，一共要走几层楼梯？`,
      n - 1,
      `楼层数减 1 就是楼梯层数：${n}-1 = ${n - 1} 层。`);
  },
  (rng) => { // 周期问题（彩灯）
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
  (rng) => { // 移多补少（反向）
    const x = r(rng, 2, 8);
    return item('ol-g2-yd', '移多补少', 'input',
      `甲给乙 ${x} 个苹果后两人一样多，原来甲比乙多几个？`,
      x * 2,
      `给出 ${x} 个后相等，说明原来多 ${x}×2 = ${x * 2} 个。`);
  },
  (rng) => { // 和倍问题
    const b = r(rng, 5, 15), k = r(rng, 2, 5);
    const s = b * (k + 1);
    return item('ol-g2-hb', '和倍问题', 'input',
      `两个数的和是 ${s}，大数是小数的 ${k} 倍，小数是多少？`,
      b,
      `小数 = 和÷(倍数+1) = ${s}÷${k + 1} = ${b}。`);
  },
  // ---- 新增 6 个 ----
  (rng) => { // 找规律（平方数）
    const n = r(rng, 4, 8);
    const seq = [1,4,9,16,25].slice(0, n - 1);
    return item('ol-g2-pf', '平方数规律', 'input',
      `按规律填：${seq.join('、')}、( )`,
      n * n,
      `每个数是第几项的平方：第${n}项 = ${n}×${n} = ${n * n}。`);
  },
  (rng) => { // 时钟角度
    const h = r(rng, 1, 6), m = 0;
    const ans = h * 30;
    return item('ol-g2-ss', '时钟角度', 'input',
      `${h}:00 整的时候，时针和分针的夹角是多少度？`,
      ans,
      `钟面 12 格 = 360°，每格 30°，${h} 点正对 ${h} 格，${h}×30 = ${ans}°。`);
  },
  (rng) => { // 排列组合（穿衣）
    const tops = r(rng, 2, 4), pants = r(rng, 2, 4);
    return item('ol-g2-pz', '搭配问题', 'input',
      `有 ${tops} 件上衣和 ${pants} 条裤子，一共可以搭配出几套不同的穿法？`,
      tops * pants,
      `每件上衣配 ${pants} 条裤子，${tops}×${pants} = ${tops * pants} 套。`);
  },
  (rng) => { // 鸡兔同笼 mini
    const t = r(rng, 5, 10);
    const c = r(rng, 1, t - 1);
    const legs = c * 2 + (t - c) * 4;
    return item('ol-g2-jt', '鸡兔同笼', 'input',
      `鸡兔共 ${t} 只，腿共 ${legs} 条，鸡有几只？`,
      c,
      `假设全是兔有 ${t * 4} 条腿，实际少 ${t * 4 - legs}，每把兔换成鸡少 2 腿，鸡 = ${c}。`);
  },
  (rng) => { // 乘法口诀应用
    const a = r(rng, 3, 9), b = r(rng, 3, 9);
    return item('ol-g2-cj', '乘法巧算', 'input',
      `${a} × ${b} = ？`,
      a * b,
      `直接用乘法口诀：${a}×${b} = ${a * b}。`);
  },
  (rng) => { // 数字谜
    const a = r(rng, 1, 9), b = r(rng, 1, 9), c = r(rng, 1, 9);
    const res = a * 100 + b * 10 + c;
    const { options, answer } = mc(rng, res, [res + 1, res - 1, res + 10]);
    return item('ol-g2-sz', '数字谜', 'choice',
      `三位数，百位是 ${a}，十位是 ${b}，个位是 ${c}，这个数是多少？`,
      answer,
      `百位 ${a} 表示 ${a} 个百，十位 ${b} 表示 ${b} 个十，个位 ${c}，合起来是 ${res}。`,
      options);
  }
];

/* ==================== 三年级（g3） ==================== */
const g3 = [
  (rng) => { // 鸡兔同笼
    const t = r(rng, 6, 12), c = r(rng, 1, t - 1);
    const f = c * 2 + (t - c) * 4;
    return item('ol-g3-jt', '鸡兔同笼', 'input',
      `笼子里有鸡和兔共 ${t} 只，数一数腿一共有 ${f} 条，鸡有几只？`,
      c,
      `假设全是兔，应有 ${t}×4=${t * 4} 条腿，多了 ${t * 4 - f} 条；每只鸡换兔少 2 条，鸡 = ${t * 4 - f}÷2 = ${c} 只。`);
  },
  (rng) => { // 植树问题
    const step = [4, 5, 10, 20][r(rng, 0, 3)];
    const len = step * r(rng, 4, 12);
    return item('ol-g3-zs', '植树问题', 'input',
      `一条 ${len} 米长的路，每隔 ${step} 米种一棵树，两端都要种，一共种几棵？`,
      len / step + 1,
      `间隔 ${len}÷${step} = ${len / step} 个，两端都种要加 1：${len / step + 1} 棵。`);
  },
  (rng) => { // 和差问题
    const a = r(rng, 10, 40), d = r(rng, 2, 10) * 2;
    const s = a * 2 - d;
    return item('ol-g3-hc', '和差问题', 'input',
      `两个数的和是 ${s}，差是 ${d}，较大的数是多少？`,
      a,
      `大数 = (和+差)÷2 = (${s}+${d})÷2 = ${a}。`);
  },
  (rng) => { // 盈亏问题
    const a = r(rng, 2, 5), db = r(rng, 1, 2), b = a + db;
    const people = r(rng, 4, 9);
    const m = r(rng, 1, 3), total = a * people + m;
    const n = b * people - total;
    return item('ol-g3-yk', '盈亏问题', 'input',
      `分苹果：每人分 ${a} 个就多 ${m} 个，每人分 ${b} 个就少 ${n} 个，一共有几人？`,
      people,
      `人数 = (盈+亏)÷两次差 = (${m}+${n})÷(${b}-${a}) = ${(m + n) / db} = ${people} 人。`);
  },
  (rng) => { // 年龄问题
    const k = r(rng, 3, 5), b = r(rng, 5, 12);
    const x = (k - 2) * b;
    return item('ol-g3-nl', '年龄问题', 'input',
      `今年爸爸 ${k * b} 岁，小明 ${b} 岁（爸爸正好是小明的 ${k} 倍）。几年后爸爸的年龄是小明的 2 倍？`,
      x,
      `设 x 年后：${k * b}+x = 2×(${b}+x)，解得 x = ${x}。`);
  },
  (rng) => { // 连续求和
    const n = r(rng, 6, 20);
    return item('ol-g3-lj', '连续求和', 'input',
      `巧算：1 + 2 + 3 + … + ${n} = ？`,
      n * (n + 1) / 2,
      `首尾配对：(1+${n})×${n}÷2 = ${n * (n + 1) / 2}。`);
  },
  // ---- 新增 6 个 ----
  (rng) => { // 方阵问题
    const n = r(rng, 3, 8);
    return item('ol-g3-fz', '方阵问题', 'input',
      `同学们排成 ${n} 行 ${n} 列的方阵，最外面一圈一共有多少人？`,
      (n - 1) * 4,
      `每边 ${n} 人，四个角不能重复算：(${n}-1)×4 = ${(n - 1) * 4} 人。`);
  },
  (rng) => { // 等差数列求和（带公差）
    const a1 = r(rng, 2, 10), d = r(rng, 2, 6), n = r(rng, 4, 8);
    const an = a1 + d * (n - 1);
    return item('ol-g3-dc', '等差数列', 'input',
      `等差数列 第 1 项=${a1}，公差=${d}，共 ${n} 项，求所有项的和。`,
      n * (a1 + an) / 2,
      `末项 = ${a1}+${d}×${n - 1} = ${an}，和 = (${a1}+${an})×${n}÷2 = ${n * (a1 + an) / 2}。`);
  },
  (rng) => { // 抽屉原理
    const color = r(rng, 3, 5);
    return item('ol-g3-ct', '抽屉原理', 'input',
      `袋子里有红、黄、蓝等 ${color} 种颜色的球，至少取几个球，才能保证一定有两个同色？`,
      color + 1,
      `最坏情况先把每种颜色各取 1 个，${color} 个还没同色，再取 1 个必有重复 = ${color + 1}。`);
  },
  (rng) => { // 找规律（等比）
    const start = r(rng, 1, 3), ratio = r(rng, 2, 3);
    const seq = [start];
    for (let i = 1; i < 4; i++) seq.push(seq[i - 1] * ratio);
    return item('ol-g3-ds', '等比数列', 'input',
      `找规律填数：${seq.join('，')}，（ ）`,
      seq[3] * ratio,
      `每个数乘 ${ratio} 得到下一个，所以括号里是 ${seq[3]}×${ratio} = ${seq[3] * ratio}。`);
  },
  (rng) => { // 页码数字计数
    const n = r(rng, 20, 99);
    const digits = 9 + (n - 9) * 2;
    return item('ol-g3-ym', '页码问题', 'input',
      `一本书从第 1 页排到第 ${n} 页，排版一共用了多少个数字？`,
      digits,
      `1-9 页各用 1 个共 9 个，10-${n} 页每页 2 个，共 ${digits} 个。`);
  },
  (rng) => { // 简单逻辑（话说真话）
    const { options, answer } = mc(rng, '乙', ['甲', '丙', '丁']);
    return item('ol-g3-zh', '真话假话', 'choice',
      `甲乙两人中一人说真话、一人说假话。甲说「乙说假话」。请问谁说真话？`,
      answer,
      `如果甲说真话→乙说谎→甲说的是真的→乙确实说谎，自洽！所以甲说真话，乙说谎。`,
      options);
  }
];

/* ==================== 四年级（g4） ==================== */
const g4 = [
  (rng) => { // 差倍问题
    const b = r(rng, 4, 15), k = r(rng, 2, 5);
    return item('ol-g4-cb', '差倍问题', 'input',
      `甲比乙多 ${b * (k - 1)}，甲正好是乙的 ${k} 倍，乙是多少？`,
      b,
      `乙 = 差÷(倍数-1) = ${b * (k - 1)}÷${k - 1} = ${b}。`);
  },
  (rng) => { // 相遇问题
    const v1 = r(rng, 40, 70), v2 = r(rng, 40, 70), t = r(rng, 2, 6);
    return item('ol-g4-xy', '相遇问题', 'input',
      `两车从两地同时相向开出，速度分别是每小时 ${v1} 千米和 ${v2} 千米，${t} 小时后相遇，两地相距多少千米？`,
      (v1 + v2) * t,
      `路程 = 速度和×时间 = (${v1}+${v2})×${t} = ${(v1 + v2) * t} 千米。`);
  },
  (rng) => { // 平均数（加权）
    const b = r(rng, 75, 92), diff = r(rng, 1, 3), a = b + diff;
    const dropped = b + 5 * diff;
    return item('ol-g4-pj', '平均数', 'input',
      `小明 5 次测验的平均分是 ${a} 分，前 4 次的平均分是 ${b} 分，第 5 次考了多少分？`,
      dropped,
      `5 次总分 ${a}×5=${a * 5}，前 4 次 ${b}×4=${b * 4}，第 5 次 = ${a * 5}-${b * 4} = ${dropped} 分。`);
  },
  (rng) => { // 页码数字（3位数）
    const n = r(rng, 101, 300);
    const digits = 189 + (n - 99) * 3;
    return item('ol-g4-ym', '页码问题', 'input',
      `一本书从第 1 页排到第 ${n} 页，排版一共用了多少个数字？`,
      digits,
      `1-9 页用 9 个，10-99 页用 180 个，100-${n} 页用 (${n}-99)×3 = ${(n - 99) * 3} 个，共 ${digits} 个。`);
  },
  (rng) => { // 方阵（外层）
    const n = r(rng, 4, 10);
    return item('ol-g4-fz', '方阵问题', 'input',
      `同学们排成 ${n} 行 ${n} 列的方阵，最外面一圈一共有多少人？`,
      (n - 1) * 4,
      `每边 ${n} 人，四个角不能重复算：(${n}-1)×4 = ${(n - 1) * 4} 人。`);
  },
  (rng) => { // 火车过桥
    const v = [20, 25, 30, 40][r(rng, 0, 3)], t = r(rng, 6, 15);
    const L = v * t / 2;
    return item('ol-g4-hc', '火车过桥', 'input',
      `一列火车长 ${L} 米，以每秒 ${v} 米的速度通过一座长 ${L} 米的桥，从车头进桥到车尾出桥要几秒？`,
      t,
      `总路程 = 车长+桥长 = ${L * 2} 米，时间 = ${L * 2}÷${v} = ${t} 秒。`);
  },
  // ---- 新增 6 个 ----
  (rng) => { // 追及问题
    const v1 = r(rng, 50, 80), v2 = r(rng, 40, 60), t = r(rng, 3, 8);
    const distance = (v1 - v2) * t;
    return item('ol-g4-zj', '追及问题', 'input',
      `快车每小时 ${v1} 千米，慢车每小时 ${v2} 千米，快车落后 ${distance} 千米，几小时追上？`,
      t,
      `速度差 = ${v1}-${v2} = ${v1 - v2}，${distance}÷${v1 - v2} = ${t} 小时。`);
  },
  (rng) => { // 盈亏（买东西）
    const price = r(rng, 6, 15), t = r(rng, 4, 9);
    const have = price * t - price;
    return item('ol-g4-mz', '购物盈亏', 'input',
      `买 ${t} 个苹果少 ${price} 元，买 ${t - 1} 个刚好用完。小明带了多少钱？`,
      have,
      `每个苹果 ${price} 元，带的钱 = ${price}×${t} - ${price} = ${have} 元。`);
  },
  (rng) => { // 数字换位
    const a = r(rng, 2, 5), b = r(rng, 1, 4);
    const orig = a * 10 + b;
    const swapped = b * 10 + a;
    return item('ol-g4-wh', '数字换位', 'input',
      `一个两位数，十位是 ${a}，个位是 ${b}。把十位和个位交换后，新数比原数小多少？`,
      orig - swapped,
      `原数 ${orig}，新数 ${swapped}，差 = ${orig} - ${swapped} = ${orig - swapped}。`);
  },
  (rng) => { // 工程（两人合作）
    const a = r(rng, 6, 15), b = r(rng, 6, 15);
    const t = Math.round(a * b / (a + b) * 10) / 10;
    return item('ol-g4-gc', '工程问题', 'input',
      `一项工程，甲单独做 ${a} 天完成，乙单独做 ${b} 天完成，两人合作几天完成？（保留 1 位小数）`,
      t,
      `效率和 = 1/${a}+1/${b}，时间 = 1÷效率 ≈ ${t} 天。`);
  },
  (rng) => { // 年龄（几年后/前）
    const dad = r(rng, 30, 45), me = r(rng, 8, 14);
    const t = dad - 2 * me; // 几年后爸爸是我的 2 倍
    return item('ol-g4-nl', '年龄问题', 'input',
      `爸爸 ${dad} 岁，小明 ${me} 岁。几年后爸爸的年龄是小明的 2 倍？`,
      t,
      `设 x 年后：${dad}+x = 2×(${me}+x) → x = ${dad - 2 * me}。`);
  },
  (rng) => { // 浓度（盐水）
    const salt = r(rng, 2, 6), water = r(rng, 20, 80);
    const pct = Math.round(salt / (salt + water) * 100);
    return item('ol-g4-nd', '浓度问题', 'input',
      `${salt} 克盐放入 ${water} 克水中，盐水的浓度是百分之几？（盐÷盐水×100%，整数）`,
      pct,
      `盐水总重 ${salt + water} 克，浓度 = ${salt}÷${salt + water}≈${pct}%。`);
  }
];

/* ==================== 五年级（g5） ==================== */
const g5 = [
  (rng) => { // 追及问题
    const diff = r(rng, 2, 5), t = r(rng, 5, 12);
    const v2 = r(rng, 6, 12), v1 = v2 + diff, d = diff * t;
    return item('ol-g5-zj', '追及问题', 'input',
      `小明在小红前面 ${d} 米。小红每秒跑 ${v1} 米，小明每秒跑 ${v2} 米，小红几秒能追上小明？`,
      t,
      `每秒追上 ${v1}-${v2}=${diff} 米，${d}÷${diff} = ${t} 秒。`);
  },
  (rng) => { // 火车过隧道
    const v = [15, 20, 25, 30][r(rng, 0, 3)], t = r(rng, 10, 20);
    const L1 = 150, L2 = v * t - L1;
    return item('ol-g5-hc', '火车过隧道', 'input',
      `一列长 ${L1} 米的火车以每秒 ${v} 米的速度穿过长 ${L2} 米的隧道，从进隧道到出隧道要几秒？`,
      t,
      `总路程 = ${L1}+${L2} = ${v * t} 米，时间 = ${v * t}÷${v} = ${t} 秒。`);
  },
  (rng) => { // 容斥原理
    const a = r(rng, 20, 45), b = r(rng, 20, 45), inter = r(rng, 5, 15);
    return item('ol-g5-rr', '容斥原理', 'input',
      `班里喜欢语文的 ${a} 人，喜欢数学的 ${b} 人，两门都喜欢的 ${inter} 人，至少喜欢一门的有几人？`,
      a + b - inter,
      `${a}+${b} 把都喜欢的人算了两次，减去一次：${a}+${b}-${inter} = ${a + b - inter} 人。`);
  },
  (rng) => { // 等差数列求和
    const a1 = r(rng, 2, 5), d = r(rng, 3, 8), n = r(rng, 5, 12);
    const an = a1 + d * (n - 1);
    return item('ol-g5-dc', '等差数列', 'input',
      `一个等差数列首项是 ${a1}，公差是 ${d}，共 ${n} 项，这些项的和是多少？`,
      n * (a1 + an) / 2,
      `末项 = ${a1}+${d}×(${n}-1) = ${an}，和 = (${a1}+${an})×${n}÷2 = ${n * (a1 + an) / 2}。`);
  },
  (rng) => { // 定义新运算
    const k = r(rng, 2, 5), m = r(rng, 1, 3), a = r(rng, 2, 6), b = r(rng, 1, 5);
    return item('ol-g5-dy', '定义新运算', 'input',
      `规定 a※b = ${k}×a + ${m}×b，那么 ${a}※${b} = ？`,
      k * a + m * b,
      `代入：${k}×${a} + ${m}×${b} = ${k * a}+${m * b} = ${k * a + m * b}。`);
  },
  (rng) => { // 余数问题（选）
    const mod = r(rng, 3, 7), rem = r(rng, 1, mod - 1);
    const n = mod * r(rng, 3, 8) + rem;
    const { options, answer } = mc(rng, n, [n + 1, n + mod, Math.max(mod, n - 1)]);
    return item('ol-g5-bs', '余数问题', 'choice',
      `一个数除以 ${mod} 余 ${rem}，下面哪个数符合条件？`,
      answer,
      `${n}÷${mod} = ${Math.floor(n / mod)} 余 ${rem}，符合条件。`,
      options);
  },
  // ---- 新增 6 个 ----
  (rng) => { // 排列（排队照相）
    const n = r(rng, 3, 6);
    let ans = 1; for (let i = 1; i <= n; i++) ans *= i;
    return item('ol-g5-pl', '排列问题', 'input',
      `${n} 个人排队照相，有几种不同的排法？`,
      ans,
      `n 人全排列 = n! = ${n}×${n - 1}×...×1 = ${ans} 种。`);
  },
  (rng) => { // 相遇后继续走
    const v1 = r(rng, 40, 70), v2 = r(rng, 30, 60);
    const t = r(rng, 2, 5), extra = r(rng, 2, 5);
    const dist = (v1 + v2) * t + (v1 + v2) * extra;
    return item('ol-g5-sj', '相遇后继续', 'input',
      `甲乙两船从两地相向开出，速度 ${v1} 和 ${v2} 千米/时，${t} 小时后相遇，相遇后继续走 ${extra} 小时，此时两船相距多少千米？`,
      (v1 + v2) * extra,
      `相遇后继续走，两船背向而行，距离 = 速度和×时间 = (${v1}+${v2})×${extra} = ${(v1 + v2) * extra} 千米。`);
  },
  (rng) => { // 完全平方数
    const n = r(rng, 4, 15);
    return item('ol-g5-wq', '完全平方数', 'input',
      `${n} 的平方是多少？`,
      n * n,
      `${n} × ${n} = ${n * n}。`);
  },
  (rng) => { // 因数个数
    const primes = [2, 3, 5, 7, 11];
    const p1 = primes[r(rng, 0, 2)], p2 = primes[r(rng, 1, 3)];
    const n = p1 * p2;
    const count = 4; // 1, p1, p2, n
    return item('ol-g5-ys', '因数个数', 'input',
      `${n} 这个数有几个因数？`,
      count,
      `${n} = ${p1}×${p2}，因数有 1、${p1}、${p2}、${n}，共 4 个。`);
  },
  (rng) => { // 奇偶分析
    const n = r(rng, 4, 10);
    const sum = n * (n + 1) / 2;
    const { options, answer } = mc(rng, sum % 2 === 0 ? '偶数' : '奇数', ['奇数', '偶数', '都有可能']);
    return item('ol-g5-jo', '奇偶分析', 'choice',
      `1 + 2 + 3 + ... + ${n} 的和是奇数还是偶数？`,
      answer,
      `和 = ${n}×(${n}+1)÷2 = ${sum}，是${sum % 2 === 0 ? '偶数' : '奇数'}。`,
      options);
  },
  (rng) => { // 分数求和（裂项）
    const n = r(rng, 2, 5);
    const ans = 1 - 1 / (n + 1);
    return item('ol-g5-lx', '裂项巧算', 'input',
      `1/(1×2) + 1/(2×3) + ... + 1/(${n}×${n + 1}) = ？（保留 3 位小数）`,
      Math.round(ans * 1000) / 1000,
      `裂项：1/(k×(k+1)) = 1/k - 1/(k+1)，中间抵消后 = 1 - 1/${n + 1} ≈ ${Math.round(ans * 1000) / 1000}。`);
  }
];

/* ==================== 六年级（g6） ==================== */
const g6 = [
  (rng) => { // 工程问题
    const pairs = [[4, 12], [6, 12], [10, 15], [12, 24], [6, 30], [8, 8], [15, 10]];
    const [a, b] = pairs[r(rng, 0, pairs.length - 1)];
    const t = a * b / (a + b);
    return item('ol-g6-gc', '工程问题', 'input',
      `一项工程，甲队单独做 ${a} 天完成，乙队单独做 ${b} 天完成，两队合作几天完成？`,
      Math.round(t * 10) / 10,
      `合作效率 = 1/${a}+1/${b} = ${(a + b)}/${a * b}，时间 = ${a * b}÷${a + b} ≈ ${Math.round(t * 10) / 10} 天。`);
  },
  (rng) => { // 按比例分配
    const a = r(rng, 2, 6), b = r(rng, 3, 8), k = r(rng, 5, 15);
    const total = (a + b) * k, x = a * k;
    return item('ol-g6-bl', '按比例分配', 'input',
      `把 ${total} 元奖金按 ${a}:${b} 分给甲乙两人，甲分得多少元？`,
      x,
      `甲占 ${a}/(${a}+${b})，${total}×${a}÷${a + b} = ${x} 元。`);
  },
  (rng) => { // 折扣问题
    const price = r(rng, 8, 25) * 10, discount = [9, 8, 7, 6][r(rng, 0, 3)];
    return item('ol-g6-zk', '折扣问题', 'input',
      `一件商品原价 ${price} 元，商场打 ${discount} 折出售，现价多少元？`,
      price * discount / 10,
      `打 ${discount} 折就是乘 0.${discount}：${price}×0.${discount} = ${price * discount / 10} 元。`);
  },
  (rng) => { // 个位周期（幂）
    const cycles = { 2: [2, 4, 8, 6], 3: [3, 9, 7, 1], 7: [7, 9, 3, 1], 8: [8, 4, 2, 6] };
    const bs = [2, 3, 7, 8][r(rng, 0, 3)];
    const c = cycles[bs];
    const n = r(rng, 10, 50);
    const last = c[(n - 1) % c.length];
    const { options, answer } = mc(rng, last, [(last + 1) % 10, (last + 9) % 10, (last + 3) % 10]);
    return item('ol-g6-gw', '个位周期', 'choice',
      `${bs} 的 ${n} 次方（${bs}^${n}）的个位数字是几？`,
      answer,
      `${bs} 的幂个位按 ${c.join('→')} 循环，第 ${n} 个落在 ${last}。`,
      options);
  },
  (rng) => { // 浓度问题
    const m = r(rng, 10, 25) * 10, water = r(rng, 5, 15) * 10;
    const salt = m / 10;
    const pct = Math.round(salt / (m + water) * 100);
    return item('ol-g6-nd', '浓度问题', 'input',
      `${m} 克盐水里有盐 ${salt} 克，再加入 ${water} 克水，现在盐水浓度约是百分之几？（填整数）`,
      pct,
      `盐不变仍是 ${salt} 克，盐水变成 ${m + water} 克，${salt}÷${m + water}≈${pct}%。`);
  },
  (rng) => { // 逻辑推理（真话假话）
    const { options, answer } = mc(rng, '甲', ['乙', '丙', '无法确定']);
    return item('ol-g6-tl', '逻辑推理', 'choice',
      '甲、乙、丙中只有一人说了真话。甲说：「乙是第一名」；乙说：「我不是第一名」；丙说：「甲不是第一名」。那么第一名是谁？',
      answer,
      '假设甲第一：甲的话为假、乙的话为真、丙的话为假——恰好只有一人说真话，所以第一名是甲。',
      options);
  },
  // ---- 新增 6 个 ----
  (rng) => { // 利润问题
    const cost = r(rng, 50, 150), rate = r(rng, 10, 40);
    const profit = Math.round(cost * rate / 10);
    return item('ol-g6-lr', '利润问题', 'input',
      `一件商品进价 ${cost} 元，按 ${rate}% 的利润率定价，利润是多少元？`,
      profit,
      `利润 = 进价×利润率 = ${cost}×${rate}% = ${profit} 元。`);
  },
  (rng) => { // 鸡兔同笼（复杂版）
    const t = r(rng, 15, 30);
    const c = r(rng, 5, t - 5);
    const rabbits = t - c;
    const heads = t * 2; // 假设还有鸭子（2腿）
    return item('ol-g6-jt', '鸡兔鸭同笼', 'input',
      `鸡和兔共 ${t} 只，鸡比兔多 ${c - rabbits} 只。鸡有几只？`,
      c,
      `鸡 + 兔 = ${t}，鸡 - 兔 = ${Math.abs(c - rabbits) || 0}，所以鸡 = ${c} 只。`);
  },
  (rng) => { // 概率（骰子）
    const sum = r(rng, 5, 9);
    let ways = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === sum) ways++;
    const { options, answer } = mc(rng, `${ways}/36`, ['1/6', '1/9', `${ways + 1}/36`]);
    return item('ol-g6-gv', '概率初步', 'choice',
      `掷两个骰子，两颗点数之和为 ${sum} 的可能性是几分之几？`,
      answer,
      `两个骰子共 36 种组合，和为 ${sum} 的有 ${ways} 种，所以概率 ${ways}/36。`,
      options);
  },
  (rng) => { // 公约数
    const a = r(rng, 12, 60), b = r(rng, 12, 60);
    const gcdVal = (function gcd(x, y) { return y === 0 ? x : gcd(y, x % y); })(a, b);
    return item('ol-g6-gy', '最大公约数', 'input',
      `${a} 和 ${b} 的最大公约数是多少？`,
      gcdVal,
      `辗转相除法：gcd(${a},${b}) = ${gcdVal}。`);
  },
  (rng) => { // 排列（数字不重复）
    const digits = shuffle(rng, [1, 2, 3, 4, 5]).slice(0, 3);
    const total = 5 * 4 * 3;
    return item('ol-g6-pm', '排列计数', 'input',
      `用 1、2、3、4、5 这五个数字，能组成多少个没有重复数字的三位数？`,
      total,
      `百位 5 种选择，十位 4 种，个位 3 种，5×4×3 = ${total} 个。`);
  },
  (rng) => { // 速度平均数（上坡下坡）
    const up = r(rng, 20, 40), down = r(rng, 50, 80);
    const avg = Math.round(2 * up * down / (up + down));
    return item('ol-g6-sp', '上下坡平均速度', 'input',
      `汽车上山速度 ${up} 千米/时，下山速度 ${down} 千米/时，上下山的平均速度是多少？（千米/时）`,
      avg,
      `设路程 s，总时间 s/${up} + s/${down}，平均速度 = 2s÷(总时间) = 2×${up}×${down}÷(${up}+${down}) ≈ ${avg}。`);
  }
];

const GRADE_GEN = { 1: g1, 2: g2, 3: g3, 4: g4, 5: g5, 6: g6 };

/**
 * 生成一套 4 题。支持两种去重：
 *   1. templateId 级：避开最近用过的模板（bag 轮询）
 *   2. promptHash 级：避开完全相同的题目实例（30 天内不重复）
 *
 * @param {number} grade - 年级 1-6
 * @param {Function} rng - mulberry32 随机数
 * @param {Object} [opts]
 * @param {Set<string>} [opts.excludeTemplateIds] - 要避开的模板 ID 集合
 * @param {Set<number>}  [opts.excludePromptHashes] - 要避开的 prompt hash 集合
 * @returns {{questions: any[], usedTemplateIds: string[], usedHashes: number[]}}
 */
export function olympicSet(grade, rng, opts = {}) {
  const allGens = (GRADE_GEN[grade] || g3).slice();
  const excludeIds = opts.excludeTemplateIds || new Set();
  const excludeHashes = opts.excludePromptHashes || new Set();

  // 1) 先把模板按「是否在排除列表」排序：不在排除列表的优先
  const fresh = allGens.filter((g) => !excludeIds.has(g.templateId));
  const stale = allGens.filter((g) => excludeIds.has(g.templateId));
  const pool = shuffle(rng, fresh).concat(shuffle(rng, stale));

  // 2) 逐个生成，避开 prompt hash 冲突
  const questions = [];
  const usedTemplateIds = [];
  const usedHashes = [];

  for (let i = 0; i < pool.length && questions.length < 4; i++) {
    const gen = pool[i];
    let q = null;
    // 最多尝试 20 次生成不同参数，避免撞 hash
    for (let attempt = 0; attempt < 20; attempt++) {
      q = gen(rng);
      if (!excludeHashes.has(q.promptHash) && !usedHashes.includes(q.promptHash)) break;
    }
    // 如果试了 20 次还冲突，接受最后生成的（极端罕见情况）
    q.id = `${q.templateId}-${questions.length}`;
    questions.push(q);
    usedTemplateIds.push(q.templateId);
    usedHashes.push(q.promptHash);
  }

  return { questions, usedTemplateIds, usedHashes };
}

export default olympicSet;
