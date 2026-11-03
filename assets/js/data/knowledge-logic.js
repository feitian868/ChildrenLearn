/**
 * knowledge-logic.js —— 逻辑推理 / 生活场景题生成器
 *
 * 目标：把四科题库从「记忆 + 计算」往「推理 + 应用」补一层。
 * 全部复用 game-kit.js 已有的 5 种题型（choice / judge / order / input / match），
 * 不新增渲染器、不改判分逻辑，接入成本最低。
 *
 * 设计约束（与 tasks.js 的去重机制对齐）：
 *   1. id 用「题干 + 答案 + 选项」内容哈希 → 365 天题面去重自动生效；
 *   2. 每道题显式带 templateId，且句式模板足够多 → 不会被
 *      MAX_TEMPLATE_PER_DAY 的当日上限卡住；
 *   3. key 细分到「逻辑类型 + 具体情境」→ 知识点 10 天冷却真正生效；
 *   4. 每天按日期种子重新生成 → 候选题天天是新的，不会抽空题池；
 *   5. source 明确标注「情境题」，不冒充教材原题。
 *
 * 题目字段与现有题库完全一致：
 *   id / subject / grade / level / topic / type / prompt / options / answer /
 *   explain / source / key / category:'logic' / templateId
 */

import { hashString, pick, sample, shuffle, randInt } from '../core/rng.js';

/* ============================================================
   公共词库（参数化用，保证同一模板每天换出不同的题）
   ============================================================ */

const PEOPLE = ['小明', '小红', '小刚', '小丽', '小军', '小芳', '乐乐', '冬冬', '丁丁', '苗苗', '亮亮', '圆圆'];
const PLACES = ['公园', '图书馆', '教室', '操场', '超市', '食堂', '车站', '医院', '动物园', '厨房'];
const THINGS = ['苹果', '饼干', '铅笔', '本子', '气球', '糖果', '贴纸', '橘子', '橡皮', '图书'];
const COLORS = ['红', '蓝', '黄', '绿', '白'];
const ANIMALS = ['小猫', '小狗', '兔子', '熊猫', '小鸟', '小鱼'];
const WEEK = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const SHOPS = ['文具店', '面包店', '书店', '水果店', '超市'];

/** 统一构造：补齐公共字段、生成内容哈希 id */
function mk(subject, grade, o) {
  const opts = o.options || null;
  const ans = o.answer;
  const body = `${o.prompt}|${opts ? opts.slice().sort().join(',') : ''}|${String(ans)}`;
  const id = `lg-${subject}-g${grade}-${hashString(body).toString(36)}`;
  return {
    id,
    subject,
    grade,
    level: o.level ?? 2,
    topic: o.topic,
    type: o.type || 'choice',
    prompt: o.prompt,
    ...(opts ? { options: opts } : {}),
    ...(o.tiles ? { tiles: o.tiles } : {}),
    ...(o.pairs ? { pairs: o.pairs } : {}),
    ...(o.unit ? { unit: o.unit } : {}),
    answer: ans,
    explain: o.explain,
    source: `情境题 · ${o.source || '逻辑推理'}`,
    key: o.key,
    category: 'logic',
    templateId: o.templateId
  };
}

/** 把正确项与干扰项打乱，返回 { options, answer }（answer 为下标） */
function choiceOf(rng, correct, distractors) {
  const pool = [String(correct), ...distractors.map(String)];
  const uniq = [...new Set(pool)];
  const opts = shuffle(rng, uniq);
  return { options: opts, answer: opts.indexOf(String(correct)) };
}

/** 数字选项：围绕正确答案造 3 个 nearby 干扰项 */
function numChoices(rng, correct, spread = 3) {
  const set = new Set([String(correct)]);
  let guard = 0;
  while (set.size < 4 && guard < 40) {
    guard++;
    const d = randInt(rng, 1, spread) * (rng() < 0.5 ? -1 : 1);
    const v = Number(correct) + d;
    if (v >= 0 && v !== Number(correct)) set.add(String(v));
  }
  while (set.size < 4) set.add(String(Number(correct) + set.size));
  const opts = shuffle(rng, [...set]);
  return { options: opts, answer: opts.indexOf(String(correct)) };
}

const P = (rng) => sample(rng, PEOPLE, 3);
const CAP = (g) => (g <= 2 ? 20 : g <= 4 ? 100 : g <= 5 ? 500 : 1000);

/* ============================================================
   一、数学：逻辑推理 + 生活场景（主战场）
   ============================================================ */

const MATH_FAMILIES = [
  /* ---------- 找规律 ---------- */
  {
    key: 'lg:m:seq', topic: '找规律', grades: [1, 2, 3, 4, 5, 6], templates: 4,
    make(rng, g) {
      const cap = CAP(g);
      const start = randInt(rng, 1, Math.max(2, Math.floor(cap / 8)));
      const step = randInt(rng, 2, Math.min(9, Math.max(3, Math.floor(cap / 10))));
      const seq = [0, 1, 2, 3].map((i) => start + step * i);
      const ans = start + step * 4;
      const lines = [
        `按规律填数：${seq.join('、')}、（ ）`,
        `接下来该填几？${seq.join('，')}，下一个是（ ）`,
        `观察这串数：${seq.join('  ')}  （ ）。横线上写几？`,
        `数字接龙：${seq.join(' → ')} → （ ）`
      ];
      const prompt = pick(rng, lines);
      const c = numChoices(rng, ans, Math.max(3, step));
      return mk('math', g, {
        ...c, prompt,
        explain: `每次多 ${step}，所以 ${seq[3]} + ${step} = ${ans}。`,
        source: '数列规律', key: `lg:m:seq:${step}`, templateId: `m-seq-${lines.indexOf(prompt)}`
      });
    }
  },
  {
    key: 'lg:m:seq2', topic: '找规律', grades: [3, 4, 5, 6], templates: 3,
    make(rng, g) {
      const a = randInt(rng, 1, 6);
      const seq = [a, a * 2, a * 3, a * 4];
      const ans = a * 5;
      const lines = [
        `找规律填数：${seq.join('、')}、（ ）`,
        `${seq.join('，')}，括号里应该是几？`,
        `一组数：${seq.join('  ')}  （ ）。请接着写。`
      ];
      const prompt = pick(rng, lines);
      const c = numChoices(rng, ans, 6);
      return mk('math', g, {
        ...c, prompt,
        explain: `第 n 个数是 ${a}×n，所以第 5 个是 ${a}×5=${ans}。`,
        source: '数列规律', key: `lg:m:seq2:${a}`, templateId: `m-seq2-${lines.indexOf(prompt)}`
      });
    }
  },
  /* ---------- 比较推理 ---------- */
  {
    key: 'lg:m:compare', topic: '比较推理', grades: [1, 2, 3, 4, 5, 6], templates: 3,
    make(rng, g) {
      const [a, b, c] = P(rng);
      const attr = pick(rng, ['高', '重', '跑得快', '年龄大', '跳得远']);
      const lines = [
        `${a}比${b}${attr}，${b}比${c}${attr}，三人中谁最${attr}？`,
        `${a}没有${b}${attr}，${c}比${b}还要${attr}。谁最${attr}？`,
        `按「${attr}」排队：${a} < ${b} < ${c}。最${attr}的是谁？`
      ];
      const idx = lines.indexOf(pick(rng, lines));
      const prompt = lines[idx];
      // 句式 0 是 a > b > c，答案 a；句式 1/2 是 a < b < c，答案 c
      const correct = idx === 0 ? a : c;
      const cc = choiceOf(rng, correct, [a, b, c].filter((x) => x !== correct));
      return mk('math', g, {
        ...cc, prompt,
        explain: idx === 0
          ? `顺着关系排：${a} > ${b} > ${c}，所以最${attr}的是${a}。`
          : `顺着关系排：${a} < ${b} < ${c}，所以最${attr}的是${c}。`,
        source: '关系推理', key: `lg:m:compare:${attr}`, templateId: `m-cmp-${idx}`
      });
    }
  },
  /* ---------- 排除 / 条件推理 ---------- */
  {
    key: 'lg:m:exclude', topic: '条件推理', grades: [2, 3, 4, 5, 6], templates: 3,
    make(rng, g) {
      const cap = CAP(g);
      const lo = randInt(rng, 2, Math.floor(cap / 4));
      const hi = lo + randInt(rng, 6, 14);
      // 大于 lo 的最小偶数；hi - lo >= 6，必然严格落在 (lo, hi) 内
      const target = lo % 2 === 0 ? lo + 2 : lo + 1;
      const lines = [
        `一个数比 ${lo} 大、比 ${hi} 小，还是双数。下面哪个可能是它？`,
        `从四个数里挑：要比 ${lo} 大、比 ${hi} 小，并且是 2 的倍数，选哪个？`,
        `这四个数中，只有一个「大于 ${lo} 且小于 ${hi} 且为偶数」，是哪一个？`
      ];
      const prompt = pick(rng, lines);
      // 三个干扰项各自至少违反一条：越界 / 越界 / 奇数
      const wrong = [lo, hi, target + 1];
      const cc = choiceOf(rng, target, wrong);
      return mk('math', g, {
        ...cc, prompt,
        explain: `${target} 大于 ${lo}、小于 ${hi}，也是双数；其余三个至少不满足一条。`,
        source: '条件筛选', key: 'lg:m:exclude', templateId: `m-exc-${lines.indexOf(prompt)}`
      });
    }
  },
  /* ---------- 逆推 ---------- */
  {
    key: 'lg:m:reverse', topic: '逆推', grades: [2, 3, 4, 5, 6], templates: 3,
    make(rng, g) {
      const x = randInt(rng, 2, CAP(g) / 10);
      const add = randInt(rng, 2, 9);
      const mul = randInt(rng, 2, 4);
      const ans = x;
      const result = (x + add) * mul;
      const lines = [
        `想一个数，加上 ${add} 再乘 ${mul}，结果是 ${result}。原来的数是多少？`,
        `一个数先加 ${add}、再扩大 ${mul} 倍，得到 ${result}。这个数是几？`,
        `（□ + ${add}）× ${mul} = ${result}，□ 里应填几？`
      ];
      const prompt = pick(rng, lines);
      const c = numChoices(rng, ans, 4);
      return mk('math', g, {
        ...c, prompt,
        explain: `倒着算：${result} ÷ ${mul} = ${result / mul}，再减 ${add} 得 ${ans}。`,
        source: '还原问题', key: 'lg:m:reverse', templateId: `m-rev-${lines.indexOf(prompt)}`
      });
    }
  },
  /* ---------- 排队 / 间隔 ---------- */
  {
    key: 'lg:m:queue', topic: '排队与间隔', grades: [1, 2, 3, 4, 5, 6], templates: 4,
    make(rng, g) {
      const front = randInt(rng, 1, 8);
      const back = randInt(rng, 1, 8);
      const ans = front + back + 1;
      const lines = [
        `小朋友排成一队，${PEOPLE[0]}前面有 ${front} 人，后面有 ${back} 人。这队一共多少人？`,
        `排队买票时，${PEOPLE[1]}的前面站着 ${front} 人、后面站着 ${back} 人，队伍共几人？`,
        `从前往后数 ${PEOPLE[2]}是第 ${front + 1} 个，从后往前数是第 ${back + 1} 个，一共几人？`,
        `一列队伍里，${PEOPLE[3]}左边 ${front} 人、右边 ${back} 人，总共多少人？`
      ];
      const prompt = pick(rng, lines);
      const c = numChoices(rng, ans, 3);
      return mk('math', g, {
        ...c, prompt,
        explain: `别忘了算上本人：${front} + ${back} + 1 = ${ans} 人。`,
        source: '排队问题', key: 'lg:m:queue', templateId: `m-que-${lines.indexOf(prompt)}`, level: g <= 2 ? 1 : 2
      });
    }
  },
  {
    key: 'lg:m:cut', topic: '间隔问题', grades: [2, 3, 4, 5, 6], templates: 3,
    make(rng, g) {
      const cuts = randInt(rng, 3, 9);
      const ans = cuts + 1;
      const thing = pick(rng, ['绳子', '木条', '彩带', '纸条']);
      const lines = [
        `一根${thing}剪 ${cuts} 刀，最多能剪成几段？`,
        `把${thing}剪开，剪了 ${cuts} 次，一共得到几段？`,
        `(${thing}) 每剪一次断成两截，剪 ${cuts} 次后有几段？`
      ];
      const prompt = pick(rng, lines);
      const c = numChoices(rng, ans, 3);
      return mk('math', g, {
        ...c, prompt,
        explain: `段数比剪的次数多 1：${cuts} + 1 = ${ans} 段。`,
        source: '剪绳问题', key: 'lg:m:cut', templateId: `m-cut-${lines.indexOf(prompt)}`
      });
    }
  },
  {
    key: 'lg:m:stairs', topic: '间隔问题', grades: [3, 4, 5, 6], templates: 2,
    make(rng, g) {
      const to = randInt(rng, 3, 8);
      const per = randInt(rng, 10, 20);
      const ans = (to - 1) * per;
      const lines = [
        `从 1 楼走到 ${to} 楼，每层有 ${per} 级台阶，一共要走多少级？`,
        `小明家住 ${to} 楼，每层楼梯 ${per} 级，从 1 楼走到家要走几级？`
      ];
      const prompt = pick(rng, lines);
      const c = numChoices(rng, ans, per);
      return mk('math', g, {
        ...c, prompt,
        explain: `1 楼到 ${to} 楼只走 ${to - 1} 层楼梯：${to - 1} × ${per} = ${ans} 级。`,
        source: '爬楼问题', key: 'lg:m:stairs', templateId: `m-sta-${lines.indexOf(prompt)}`
      });
    }
  },
  /* ---------- 时间推理 ---------- */
  {
    key: 'lg:m:time', topic: '时间推理', grades: [2, 3, 4, 5, 6], templates: 3,
    make(rng, g) {
      const h = randInt(rng, 7, 18);
      const m = randInt(rng, 0, 5) * 10;
      const add = randInt(rng, 1, 5) * 10 + 5;
      const total = h * 60 + m + add;
      const nh = Math.floor(total / 60) % 24;
      const nm = total % 60;
      const ans = `${nh} 点 ${nm} 分`;
      const start = `${h} 点 ${m} 分`;
      const lines = [
        `现在 ${start}，过 ${add} 分钟是几点几分？`,
        `动画片 ${start} 开始，播 ${add} 分钟，什么时候结束？`,
        `从 ${start} 开始做作业，用了 ${add} 分钟，做完时是几点几分？`
      ];
      const prompt = pick(rng, lines);
      // 三个明确错误的干扰项：直接把分钟相加、少加 10 分、多进 1 小时
      const wrong = [
        `${h} 点 ${m + add} 分`,
        `${nh} 点 ${(nm + 50) % 60} 分`,
        `${(nh + 1) % 24} 点 ${nm} 分`
      ].filter((x) => x !== ans);
      const cc = choiceOf(rng, ans, wrong);
      return mk('math', g, {
        ...cc, prompt,
        explain: `${m} + ${add} = ${m + add} 分，满 60 分进 1 小时，所以是 ${ans}。`,
        source: '时间计算', key: 'lg:m:time', templateId: `m-tim-${lines.indexOf(prompt)}`
      });
    }
  },
  /* ---------- 购物场景 ---------- */
  {
    key: 'lg:m:shop', topic: '购物情境', grades: [1, 2, 3, 4, 5, 6], templates: 4,
    make(rng, g) {
      const price = randInt(rng, 2, Math.min(9, CAP(g) / 10));
      const count = randInt(rng, 2, 8);
      const pay = price * count + randInt(rng, 1, 15);
      const ans = pay - price * count;
      const item = pick(rng, THINGS);
      const shop = pick(rng, SHOPS);
      const lines = [
        `在${shop}买 ${count} 个${item}，每个 ${price} 元，付了 ${pay} 元，应找回多少元？`,
        `${item}每个 ${price} 元，买 ${count} 个，给售货员 ${pay} 元，找回几元？`,
        `带 ${pay} 元去${shop}，买了 ${count} 个 ${price} 元的${item}，还剩多少元？`,
        `${shop}里${item}单价 ${price} 元，${count} 个一共多少钱？付 ${pay} 元找多少？`
      ];
      const prompt = pick(rng, lines);
      const c = numChoices(rng, ans, 5);
      return mk('math', g, {
        ...c, prompt, unit: '元',
        explain: `先算总价 ${price} × ${count} = ${price * count} 元，再算 ${pay} − ${price * count} = ${ans} 元。`,
        source: '购物找零', key: 'lg:m:shop', templateId: `m-sho-${lines.indexOf(prompt)}`, level: g <= 2 ? 1 : 2
      });
    }
  },
  {
    key: 'lg:m:budget', topic: '购物情境', grades: [2, 3, 4, 5, 6], templates: 2,
    make(rng, g) {
      const budget = randInt(rng, 15, CAP(g));
      const a = randInt(rng, 5, Math.floor(budget / 2));
      const b = randInt(rng, 3, Math.floor(budget / 2));
      const ans = budget - a >= b;
      const lines = [
        `带 ${budget} 元，先花了 ${a} 元买书，剩下的钱够买 ${b} 元的本子吗？`,
        `有 ${budget} 元，买 ${a} 元的文具后，还能买 ${b} 元的东西吗？`
      ];
      const prompt = pick(rng, lines);
      return mk('math', g, {
        type: 'judge', prompt, answer: ans,
        explain: `${budget} − ${a} = ${budget - a} 元，${budget - a >= b ? '够' : '不够'}买 ${b} 元的东西。`,
        source: '预算判断', key: 'lg:m:budget', templateId: `m-bud-${lines.indexOf(prompt)}`, level: 1
      });
    }
  },
  /* ---------- 分配场景 ---------- */
  {
    key: 'lg:m:divide', topic: '分配情境', grades: [2, 3, 4, 5, 6], templates: 3,
    make(rng, g) {
      const per = randInt(rng, 2, 7);
      const people = randInt(rng, 2, 6);
      const rest = randInt(rng, 1, per - 1);
      const total = per * people + rest;
      const item = pick(rng, THINGS);
      const lines = [
        `${total} 个${item}平均分给 ${people} 个小朋友，每人分到几个？`,
        `把 ${total} 块${item}分给 ${people} 人，尽量平均分，每人得几块？`,
        `${total} 个${item}，${people} 个人平分，一个人能拿几个（只看整数部分）？`
      ];
      const idx = lines.indexOf(pick(rng, lines));
      const prompt = lines[idx];
      const c = numChoices(rng, per, 3);
      return mk('math', g, {
        ...c, prompt,
        explain: `${total} ÷ ${people} = ${per} 余 ${rest}，所以每人分到 ${per} 个，还剩 ${rest} 个。`,
        source: '有余数除法', key: 'lg:m:divide', templateId: `m-div-${idx}`
      });
    }
  },
  /* ---------- 统筹优化 ---------- */
  {
    key: 'lg:m:optimize', topic: '统筹优化', grades: [4, 5, 6], templates: 3,
    make(rng, g) {
      const fast = randInt(rng, 1, 4);
      const slow = fast + randInt(rng, 2, 6);
      const lines = [
        `只有一台复印机，${PEOPLE[0]}要印 ${fast} 分钟、${PEOPLE[1]}要印 ${slow} 分钟。怎样安排，两人等待的总时间最短？`,
        `两人排队接水：${PEOPLE[2]}用 ${fast} 分钟、${PEOPLE[3]}用 ${slow} 分钟。谁先接，两人合计等得更少？`,
        `复印室只剩一台机器，快的要 ${fast} 分钟、慢的要 ${slow} 分钟。想让「等待时间之和」最小，应该让谁先用？`
      ];
      const idx = lines.indexOf(pick(rng, lines));
      const correct = idx === 1
        ? `让用时 ${fast} 分钟的人先`
        : '让用时短的人先做';
      const distract = [
        '让用时久的人先做',
        '两人同时用',
        '谁先谁后都一样'
      ];
      const cc = choiceOf(rng, correct, distract);
      return mk('math', g, {
        ...cc, prompt: lines[idx],
        explain: `先让 ${fast} 分钟的人完成，另一个只等 ${fast} 分钟；反过来要等 ${slow} 分钟。所以「短作业优先」总等待最少。`,
        source: '统筹安排', key: 'lg:m:optimize', templateId: `m-opt-${idx}`
      });
    }
  },
  /* ---------- 和差 / 鸡兔同笼 ---------- */
  {
    key: 'lg:m:sumdiff', topic: '和差问题', grades: [4, 5, 6], templates: 2,
    make(rng, g) {
      const small = randInt(rng, 5, 40);
      const diff = randInt(rng, 2, 18);
      const big = small + diff;
      const sum = small + big;
      const lines = [
        `两个数的和是 ${sum}，差是 ${diff}，较大的数是多少？`,
        `两数相加得 ${sum}，大数比小数多 ${diff}，大数是几？`
      ];
      const prompt = pick(rng, lines);
      const c = numChoices(rng, big, 5);
      return mk('math', g, {
        ...c, prompt,
        explain: `大数 = (和 + 差) ÷ 2 = (${sum} + ${diff}) ÷ 2 = ${big}。`,
        source: '和差问题', key: 'lg:m:sumdiff', templateId: `m-sd-${lines.indexOf(prompt)}`
      });
    }
  },
  {
    key: 'lg:m:chicken', topic: '鸡兔同笼', grades: [5, 6], templates: 2,
    make(rng, g) {
      const rabbit = randInt(rng, 3, 12);
      const chicken = randInt(rng, 3, 15);
      const heads = rabbit + chicken;
      const feet = rabbit * 4 + chicken * 2;
      const lines = [
        `笼子里有鸡和兔共 ${heads} 只，脚一共 ${feet} 只。兔有几只？`,
        `鸡兔同笼，共 ${heads} 个头、${feet} 只脚，兔有多少只？`
      ];
      const prompt = pick(rng, lines);
      const c = numChoices(rng, rabbit, 4);
      return mk('math', g, {
        ...c, prompt,
        explain: `假设全是鸡，脚应为 ${heads}×2=${heads * 2}，多出 ${feet - heads * 2} 只脚，每换一只兔多 2 只脚，所以兔 = ${(feet - heads * 2) / 2} = ${rabbit} 只。`,
        source: '鸡兔同笼', key: 'lg:m:chicken', templateId: `m-chk-${lines.indexOf(prompt)}`
      });
    }
  },
  /* ---------- 容斥 ---------- */
  {
    key: 'lg:m:overlap', topic: '重叠问题', grades: [4, 5, 6], templates: 2,
    make(rng, g) {
      const a = randInt(rng, 12, 30);
      const b = randInt(rng, 10, 28);
      const both = randInt(rng, 3, Math.min(a, b) - 1);
      const ans = a + b - both;
      const lines = [
        `班里有 ${a} 人参加数学组、${b} 人参加语文组，其中 ${both} 人两组都参加。至少参加一组的共有多少人？`,
        `参加跳绳的 ${a} 人、参加踢毽的 ${b} 人，两项都参加的 ${both} 人，参加活动的至少有多少人？`
      ];
      const prompt = pick(rng, lines);
      const c = numChoices(rng, ans, 5);
      return mk('math', g, {
        ...c, prompt,
        explain: `两组相加会把重叠的 ${both} 人数两遍：${a} + ${b} − ${both} = ${ans} 人。`,
        source: '容斥原理', key: 'lg:m:overlap', templateId: `m-ovl-${lines.indexOf(prompt)}`
      });
    }
  }
];

/* ============================================================
   二、语文：语言逻辑 + 生活情境
   ============================================================ */

const CONNECTORS = [
  { pair: '如果……就……', scene: '明天下雨 / 运动会延期' },
  { pair: '因为……所以……', scene: '下了大雨 / 操场湿了' },
  { pair: '虽然……但是……', scene: '题目很难 / 他还是做出来了' },
  { pair: '不但……而且……', scene: '会画画 / 会弹琴' },
  { pair: '一……就……', scene: '放学铃响 / 冲出教室' }
];

const CHINESE_FAMILIES = [
  {
    key: 'lg:z:connect', topic: '关联词逻辑', grades: [2, 3, 4, 5, 6],
    make(rng, g) {
      const right = pick(rng, CONNECTORS);
      const [a, b] = right.scene.split(' / ');
      const lines = [
        `{p}在造句：「（ ）${a}，（ ）${b}。」括号里填哪组关联词最合适？`,
        `{p}把两件事连起来：「${a}」「${b}」，用哪一组词最通顺？`,
        `下面哪组关联词填进「（ ）${a}，（ ）${b}」最恰当？（{p}已经想了很久）`
      ];
      const prompt = pick(rng, lines);
      const cc = choiceOf(rng, right.pair, CONNECTORS.filter((x) => x !== right).map((x) => x.pair).slice(0, 3));
      return mk('chinese', g, {
        ...cc, prompt,
        explain: `前半句是条件/原因/让步，后半句是结果/转折，用「${right.pair}」最顺。`,
        source: '关联词运用', key: `lg:z:connect:${right.pair}`, templateId: `z-con-${lines.indexOf(prompt)}`
      });
    }
  },
  {
    key: 'lg:z:order', topic: '做事顺序', grades: [1, 2, 3, 4, 5, 6],
    make(rng, g) {
      const scenes = [
        { task: '给{p}做一张生日贺卡', steps: ['准备彩纸', '写上祝福语', '贴上贴纸', '送给朋友'], first: '准备彩纸' },
        { task: '泡 {d} 杯牛奶', steps: ['拿出杯子和奶粉', '倒入奶粉', '冲入温水', '搅匀再喝'], first: '拿出杯子和奶粉' },
        { task: '在{pl}种一盆小葱', steps: ['准备花盆和土', '撒上种子', '浇一点水', '放到有阳光处'], first: '准备花盆和土' },
        { task: '写一篇 {d} 字的观察日记', steps: ['先仔细观察', '记下看到的变化', '整理成句子', '写上日期'], first: '先仔细观察' }
      ];
      const s = pick(rng, scenes);
      const lines = [
        `${s.task}，下面哪一步应该最先做？`,
        `要${s.task}，第一步该做什么？`,
        `下面是${s.task}的几个步骤，排在最先的是哪一步？`
      ];
      const prompt = pick(rng, lines);
      const cc = choiceOf(rng, s.first, s.steps.filter((x) => x !== s.first));
      return mk('chinese', g, {
        ...cc, prompt,
        explain: `做事要先准备、再动手：${s.steps.join(' → ')}，所以先「${s.first}」。`,
        source: '流程排序', key: `lg:z:order:${s.task}`, templateId: `z-ord-${lines.indexOf(prompt)}`, level: 1
      });
    }
  },
  {
    key: 'lg:z:react', topic: '情境应对', grades: [1, 2, 3, 4, 5, 6],
    make(rng, g) {
      const scenes = [
        { q: '{p}不小心碰掉你的 {d} 本书，马上说了「对不起」，你会（ ）', ok: '说「没关系」并一起捡起来', bad: ['也把他的书碰掉', '不理他', '大声责备他'] },
        { q: '在{pl}想问管理员借 {d} 本书，最合适的说法是（ ）', ok: '「老师，请问这本书在哪里？」', bad: ['「喂，书呢？」', '直接把书拿走', '大声喊同伴'] },
        { q: '看到 {d} 位低年级同学摔倒了，最应该（ ）', ok: '上前扶他并告诉老师', bad: ['站在旁边笑', '当作没看见', '绕开走'] },
        { q: '妈妈正在休息，你想看 {d} 分钟电视，最好（ ）', ok: '先调小音量或戴耳机', bad: ['把声音开到最大', '直接吵醒妈妈', '一直换台'] }
      ];
      const s = pick(rng, scenes);
      const cc = choiceOf(rng, s.ok, s.bad);
      return mk('chinese', g, {
        ...cc, prompt: s.q,
        explain: `既把事情处理好、又顾及别人感受的做法是「${s.ok}」。`,
        source: '口语交际', key: `lg:z:react:${s.q.slice(0, 8)}`, templateId: 'z-react-0', level: 1
      });
    }
  },
  {
    key: 'lg:z:infer', topic: '语义推断', grades: [2, 3, 4, 5, 6],
    make(rng, g) {
      const scenes = [
        { q: '「{p}一进门就直奔厨房，连 {d} 分钟都没耽搁」，猜猜他最可能（ ）', ok: '饿了', bad: ['困了', '刚运动完很热', '想睡觉'] },
        { q: '「妹妹把礼物紧紧抱在怀里，{d} 天都不肯放下」，说明她（ ）', ok: '非常喜欢这份礼物', bad: ['嫌礼物太重', '想把礼物丢掉', '没看见礼物'] },
        { q: '「教室忽然安静下来，连 {d} 秒都没人说话」，最可能发生了什么？（ ）', ok: '老师走进了教室', bad: ['下课铃响了', '大家全回家了', '停电了'] },
        { q: '「{p}反复擦了 {d} 遍，还是觉得没擦干净」，可以看出他做事（ ）', ok: '很认真', bad: ['很马虎', '很着急', '不喜欢打扫'] }
      ];
      const s = pick(rng, scenes);
      const lines = [s.q, `${s.q}（根据句子猜一猜）`];
      const prompt = pick(rng, lines);
      const cc = choiceOf(rng, s.ok, s.bad);
      return mk('chinese', g, {
        ...cc, prompt,
        explain: `句子里的动作给出了线索，最合理的推断是「${s.ok}」。`,
        source: '阅读理解 · 推断', key: `lg:z:infer:${s.q.slice(0, 8)}`, templateId: `z-inf-${lines.indexOf(prompt)}`
      });
    }
  },
  {
    key: 'lg:z:idiom', topic: '成语运用', grades: [3, 4, 5, 6],
    make(rng, g) {
      const scenes = [
        { q: '平时不复习，离考试只剩 {d} 天才熬夜看书，这叫（ ）', ok: '临阵磨枪', bad: ['胸有成竹', '一目了然', '画蛇添足'] },
        { q: '{p}把事情做完了，又多添 {d} 笔反而弄坏，这叫（ ）', ok: '画蛇添足', bad: ['锦上添花', '一举两得', '亡羊补牢'] },
        { q: '发现 {d} 个问题后马上想办法补救，还不算晚，这叫（ ）', ok: '亡羊补牢', bad: ['守株待兔', '掩耳盗铃', '刻舟求剑'] },
        { q: '{p}自己骗自己，以为 {d} 个人都不知道，这叫（ ）', ok: '掩耳盗铃', bad: ['熟能生巧', '举一反三', '专心致志'] }
      ];
      const s = pick(rng, scenes);
      const cc = choiceOf(rng, s.ok, s.bad);
      return mk('chinese', g, {
        ...cc, prompt: s.q,
        explain: `情境对应的成语是「${s.ok}」，其余几个说的是别的意思。`,
        source: '成语情境', key: `lg:z:idiom:${s.ok}`, templateId: 'z-idi-0'
      });
    }
  },
  {
    key: 'lg:z:cohere', topic: '句子衔接', grades: [2, 3, 4, 5, 6],
    make(rng, g) {
      const ok = '大家赶紧撑起伞往回跑';
      const head = pick(rng, ['天忽然下起大雨，{d} 分钟都没停。', '放学时天空突然下起大雨，{p}没带伞。', '刚到{pl}，天就下起了大雨。']);
      const lines = [
        `「${head}」后面接哪一句最合适？`,
        `读一读：「${head}」（ ）」，括号里选哪句最连贯？`,
        `给「${head}」挑一句接得最自然的话。`
      ];
      const prompt = pick(rng, lines);
      const bad = ['太阳立刻出来了', '操场马上变干了', '我们继续在户外排队'];
      const cc = choiceOf(rng, ok, bad);
      return mk('chinese', g, {
        ...cc, prompt,
        explain: `前面说下大雨，后面应接下雨时的反应；「${ok}」最连贯。`,
        source: '句子衔接', key: 'lg:z:cohere', templateId: `z-coh-${lines.indexOf(prompt)}`
      });
    }
  },
  {
    key: 'lg:z:antonym', topic: '语境辨词', grades: [1, 2, 3, 4, 5, 6],
    make(rng, g) {
      const sets = [
        { s: '{p}做事很马虎', w: '马虎', ok: '认真', bad: ['粗心', '大意', '随便'] },
        { s: '这条 {d} 米长的小路很狭窄', w: '狭窄', ok: '宽阔', bad: ['窄小', '弯弯曲曲', '安静'] },
        { s: '听到消息{p}十分慌张', w: '慌张', ok: '镇定', bad: ['着急', '紧张', '害怕'] },
        { s: '{p}摸了摸冬天的河水，觉得很冰冷', w: '冰冷', ok: '滚烫', bad: ['凉快', '寒冷', '刺骨'] }
      ];
      const x = pick(rng, sets);
      const lines = [
        `「${x.s}」，句中「${x.w}」的反义词是（ ）`,
        `与「${x.w}」意思相反的是哪个词？（句子：${x.s}）`,
        `读「${x.s}」，找出「${x.w}」的反义词。`
      ];
      const prompt = pick(rng, lines);
      const cc = choiceOf(rng, x.ok, x.bad);
      return mk('chinese', g, {
        ...cc, prompt,
        explain: `「${x.w}」的反面是「${x.ok}」，其余几个都和它意思相近。`,
        source: '反义词运用', key: `lg:z:antonym:${x.w}`, templateId: `z-ant-${lines.indexOf(prompt)}`, level: 1
      });
    }
  }
];

/* ============================================================
   三、科学：因果推理 + 实验逻辑 + 生活现象
   ============================================================ */

const SCIENCE_FAMILIES = [
  {
    key: 'lg:s:predict', topic: '因果预测', grades: [1, 2, 3, 4, 5, 6],
    make(rng, g) {
      const scenes = [
        { q: '把一盆绿植放进完全黑暗的柜子里，{d} 天后最可能（ ）', ok: '叶子发黄、长势变差', bad: ['长得更高更绿', '开出很多花', '和原来一模一样'], why: '植物需要光进行光合作用，长期缺光会黄叶。' },
        { q: '一杯水放在敞口杯里，{d} 天后水面明显下降，主要因为（ ）', ok: '水蒸发到空气中了', bad: ['杯子漏了', '水被空气吃掉了', '水变成了冰'], why: '液态水会慢慢变成水蒸气散到空气里。' },
        { q: '把 {d} 块冰放在室温下，过一会儿会（ ）', ok: '化成水', bad: ['变得更硬', '变成石头', '消失得无影无踪'], why: '吸热后冰融化成液态水，并没有消失。' },
        { q: '把 {d} 粒种子一直泡在水里、不给空气，最可能（ ）', ok: '发不了芽甚至烂掉', bad: ['长得特别快', '马上开花', '和土里一样'], why: '种子萌发需要水、空气和适宜温度，缺空气不行。' }
      ];
      const s = pick(rng, scenes);
      const lines = [s.q, `预测一下：${s.q}`, `如果这样做了，结果会怎样？${s.q}`];
      const prompt = pick(rng, lines);
      const cc = choiceOf(rng, s.ok, s.bad);
      return mk('science', g, {
        ...cc, prompt,
        explain: s.why,
        source: '现象预测', key: `lg:s:predict:${s.q.slice(0, 10)}`, templateId: `s-pre-${lines.indexOf(prompt)}`, level: g <= 2 ? 1 : 2
      });
    }
  },
  {
    key: 'lg:s:variable', topic: '控制变量', grades: [3, 4, 5, 6],
    make(rng, g) {
      const scenes = [
        { q: '想研究「浇水多少会不会影响 {d} 株豆苗的高度」，两组实验应该（ ）', ok: '只改变浇水量，其余条件都相同', bad: ['一组放窗台、一组放柜子', '用两种不同的种子', '一组白天浇、一组晚上浇'] },
        { q: '要比较「有光和无光」对 {d} 粒种子发芽的影响，必须保证两组（ ）', ok: '只有光照不同，水、种子、温度都一样', bad: ['水量也不同', '种子品种不同', '一组盖盖子一组不盖'] },
        { q: '让小车从 {d} 个不同坡度的斜面滑下，研究「越陡是否滑得越远」，应该只改变（ ）', ok: '斜面的坡度', bad: ['小车的重量', '地面的材料', '小车颜色和坡度一起改'] }
      ];
      const s = pick(rng, scenes);
      const cc = choiceOf(rng, s.ok, s.bad);
      return mk('science', g, {
        ...cc, prompt: s.q,
        explain: `公平对比只能有一个变量不同，其余全部保持一致，才能把结果归因到这个变量上。`,
        source: '对比实验', key: 'lg:s:variable', templateId: 's-var-0'
      });
    }
  },
  {
    key: 'lg:s:explain', topic: '现象解释', grades: [2, 3, 4, 5, 6],
    make(rng, g) {
      const scenes = [
        { q: '冬天从室外走进 {d} 度的暖屋子，眼镜片马上变模糊，这是因为（ ）', ok: '空气中的水蒸气遇冷在镜片上液化成小水珠', bad: ['镜片脏了', '眼镜坏了', '屋里光线太暗'] },
        { q: '{p}把 {d} 件湿衣服晾在通风有太阳的地方，干得快，主要因为（ ）', ok: '温度高、空气流动快，蒸发更快', bad: ['衣服变轻了', '太阳把水吸走了', '风把水吹成了冰'] },
        { q: '把 {d} 根筷子斜插进装水的杯子，看起来像折断了，这是因为（ ）', ok: '光从水到空气发生折射', bad: ['筷子真的弯了', '水把筷子泡软了', '杯子是弯的'] }
      ];
      const s = pick(rng, scenes);
      const cc = choiceOf(rng, s.ok, s.bad);
      return mk('science', g, {
        ...cc, prompt: s.q,
        explain: `正确解释是「${s.ok}」；这类题要找现象背后的物理原因，而不是凭感觉猜。`,
        source: '生活现象', key: `lg:s:explain:${s.q.slice(0, 10)}`, templateId: 's-exp-0'
      });
    }
  },
  {
    key: 'lg:s:chain', topic: '推理链', grades: [3, 4, 5, 6],
    make(rng, g) {
      const chains = [
        { q: '草 → 兔 → 鹰。如果 {d} 只鹰被移走，短期内兔子会（ ）', ok: '变多', bad: ['变少', '不变', '全部消失'] },
        { q: '蚜虫被瓢虫吃，瓢虫被小鸟吃。若 {d} 只小鸟飞走，瓢虫最可能（ ）', ok: '变多', bad: ['变少', '不变', '立刻死光'] },
        { q: '池塘里水草 → 小鱼 → 大鱼。若 {d} 平方米水草因污染枯死，最先减少的是（ ）', ok: '小鱼', bad: ['大鱼', '水里的石头', '岸边的树'] }
      ];
      const s = pick(rng, chains);
      const cc = choiceOf(rng, s.ok, s.bad);
      return mk('science', g, {
        ...cc, prompt: s.q,
        explain: `顺着「谁吃谁」的链条一级一级推：上一环变了，直接依赖它的那一环先受影响。`,
        source: '食物链推理', key: `lg:s:chain:${s.q.slice(0, 8)}`, templateId: 's-cha-0'
      });
    }
  },
  {
    key: 'lg:s:safety', topic: '安全判断', grades: [1, 2, 3, 4, 5, 6],
    make(rng, g) {
      const items = [
        { q: '打雷时躲在 {d} 米外的大树底下比待在屋里更安全。', ok: false, why: '大树容易遭雷击，应待在室内并远离金属。' },
        { q: '{p}发现有人触电，应该先用手直接去拉他。', ok: false, why: '要先切断电源，用绝缘物挑开电线，不能直接用手。' },
        { q: '{p}在{pl}闻到煤气味，应立刻开窗通风、不开关电器。', ok: true, why: '开窗降低燃气浓度，开关电器可能产生火花。' },
        { q: '实验里闻 {d} 号瓶里未知气体的气味，直接把鼻子凑到瓶口最准确。', ok: false, why: '应用手轻轻扇闻，避免直接吸入。' },
        { q: '过马路时即使绿灯还剩 {d} 秒，也要先看左右来车。', ok: true, why: '确认安全再走，防止有车辆违规。' }
      ];
      const s = pick(rng, items);
      return mk('science', g, {
        type: 'judge', prompt: s.q, answer: s.ok,
        explain: s.why,
        source: '安全常识', key: `lg:s:safety:${s.q.slice(0, 8)}`, templateId: 's-saf-0', level: 1
      });
    }
  },
  {
    key: 'lg:s:tool', topic: '工具选择', grades: [2, 3, 4, 5, 6],
    make(rng, g) {
      const need = pick(rng, [
        { q: '要准确量出 {d} 毫升水，最好用（ ）', ok: '量筒', bad: ['汤勺', '天平', '温度计'] },
        { q: '{p}想知道今天气温是多少，该用（ ）', ok: '温度计', bad: ['量筒', '直尺', '秒表'] },
        { q: '要比较 {d} 块石头谁更重，该用（ ）', ok: '天平', bad: ['放大镜', '温度计', '量筒'] },
        { q: '{p}想观察 {d} 只蚂蚁的触角细不细，最好用（ ）', ok: '放大镜', bad: ['天平', '秒表', '量筒'] }
      ]);
      const cc = choiceOf(rng, need.ok, need.bad);
      return mk('science', g, {
        ...cc, prompt: need.q,
        explain: `先想清楚要测的是「体积 / 温度 / 质量 / 细节」，再选对应工具：${need.ok}。`,
        source: '测量工具', key: `lg:s:tool:${need.ok}`, templateId: 's-too-0', level: 1
      });
    }
  }
];

/* ============================================================
   四、英语：情景交际 + 语境推断
   ============================================================ */

const ENGLISH_FAMILIES = [
  {
    key: 'lg:e:reply', topic: '情景应答', grades: [1, 2, 3, 4, 5, 6],
    make(rng, g) {
      const scenes = [
        { q: '{p}帮你捡起 {d} 本书，说 "Here you are." 你应该回答：（ ）', ok: 'Thank you!', bad: ['Sorry.', 'Goodbye!', 'Hello!'] },
        { q: '{p}对你说 "Happy birthday!" 最合适的回答是（ ）', ok: 'Thank you!', bad: ['You too.', 'Good night.', 'See you.'] },
        { q: '不小心踩到 {p} 的脚，应该先说（ ）', ok: "I'm sorry.", bad: ['Thank you.', 'How are you?', 'Great!'] },
        { q: '早上去{pl}见到老师，最合适的问候是（ ）', ok: 'Good morning!', bad: ['Good night.', 'Goodbye!', 'See you tomorrow.'] },
        { q: '想知道 {p} 的名字，应该问（ ）', ok: "What's your name?", bad: ['How old is he?', 'Where is the zoo?', 'Thank you!'] }
      ];
      const s = pick(rng, scenes);
      const cc = choiceOf(rng, s.ok, s.bad);
      return mk('english', g, {
        ...cc, prompt: s.q,
        explain: `这个场景下的固定应答是 "${s.ok}"。`,
        source: '日常交际', key: `lg:e:reply:${s.q.slice(0, 12)}`, templateId: 'e-rep-0', level: 1
      });
    }
  },
  {
    key: 'lg:e:context', topic: '语境选词', grades: [2, 3, 4, 5, 6],
    make(rng, g) {
      const scenes = [
        { q: "{p} says: It's raining outside. Take your _____.", ok: 'umbrella', bad: ['sunglasses', 'ball', 'ice cream'] },
        { q: "After {d} minutes of running, I'm thirsty. I want some _____.", ok: 'water', bad: ['book', 'chair', 'pencil'] },
        { q: "It's only {d} degrees today. Put on your _____.", ok: 'coat', bad: ['T-shirt', 'shorts', 'sandals'] },
        { q: 'We read {d} books in the _____.', ok: 'library', bad: ['kitchen', 'playground', 'bus stop'] },
        { q: '{p} works in a hospital and helps {d} sick people. A _____ does this job.', ok: 'doctor', bad: ['farmer', 'driver', 'painter'] }
      ];
      const s = pick(rng, scenes);
      const cc = choiceOf(rng, s.ok, s.bad);
      return mk('english', g, {
        ...cc, prompt: s.q,
        explain: `根据句子的情境线索，只有 "${s.ok}" 说得通。`,
        source: '语境理解', key: `lg:e:context:${s.ok}`, templateId: 'e-ctx-0', level: 1
      });
    }
  },
  {
    key: 'lg:e:infer', topic: '情境推断', grades: [2, 3, 4, 5, 6],
    make(rng, g) {
      const a = randInt(rng, 3, 9);
      const give = randInt(rng, 1, a - 1);
      const ans = a - give;
      const who = pick(rng, ['Tom', 'Amy', 'Lily', 'Ben']);
      const lines = [
        `${who} has ${a} apples. He/She gives ${give} to a friend. How many apples are left?`,
        `There are ${a} apples. ${who} eats ${give}. How many are left now?`,
        `${who} had ${a} stickers and gave away ${give}. How many does ${who} have?`
      ];
      const prompt = pick(rng, lines);
      const c = numChoices(rng, ans, 3);
      return mk('english', g, {
        ...c, prompt,
        explain: `${a} − ${give} = ${ans}. Read the situation, then subtract.`,
        source: '情境应用题', key: 'lg:e:infer', templateId: `e-inf-${lines.indexOf(prompt)}`, level: 1
      });
    }
  },
  {
    key: 'lg:e:compare', topic: '情境比较', grades: [2, 3, 4, 5, 6],
    make(rng, g) {
      const x = randInt(rng, 6, 11);
      const y = x + randInt(rng, 1, 4);
      const a = pick(rng, ['Amy', 'Lily', 'Anna']);
      const b = pick(rng, ['Ben', 'Tom', 'Jack']);
      const older = y > x ? b : a;
      const lines = [
        `${a} is ${x}. ${b} is ${y}. Who is older?`,
        `${a} is ${x} years old and ${b} is ${y}. Who is younger?`,
        `Two children: ${a} (${x}) and ${b} (${y}). Which one is older?`
      ];
      const idx = lines.indexOf(pick(rng, lines));
      const correct = idx === 1 ? a : older;
      const cc = choiceOf(rng, correct, [a, b].filter((n) => n !== correct).concat(['Both are the same']));
      return mk('english', g, {
        ...cc, prompt: lines[idx],
        explain: `${x} < ${y}，所以 ${b} 更大、${a} 更小。注意题目问的是 older 还是 younger。`,
        source: '情境比较', key: 'lg:e:compare', templateId: `e-cmp-${idx}`, level: 1
      });
    }
  },
  {
    key: 'lg:e:place', topic: '场所推断', grades: [3, 4, 5, 6],
    make(rng, g) {
      const scenes = [
        { q: '{p} wants to see {d} animals. Where do you go?', ok: 'zoo', bad: ['library', 'hospital', 'supermarket'] },
        { q: '{p} is ill and needs a doctor. Where should you go?', ok: 'hospital', bad: ['park', 'cinema', 'school'] },
        { q: 'You need to buy {d} loaves of bread and milk. Where do you go?', ok: 'supermarket', bad: ['zoo', 'library', 'classroom'] },
        { q: '{p} wants to borrow {d} story books. Where do you go?', ok: 'library', bad: ['kitchen', 'playground', 'bus'] }
      ];
      const s = pick(rng, scenes);
      const cc = choiceOf(rng, s.ok, s.bad);
      return mk('english', g, {
        ...cc, prompt: s.q,
        explain: `先看要做什么，再找对应的场所：${s.ok}。`,
        source: '场所推断', key: `lg:e:place:${s.ok}`, templateId: 'e-pla-0', level: 1
      });
    }
  }
];

/* ============================================================
   对外接口
   ============================================================ */

const FAMILIES = {
  math: MATH_FAMILIES,
  chinese: CHINESE_FAMILIES,
  science: SCIENCE_FAMILIES,
  english: ENGLISH_FAMILIES
};

/**
 * 生成某科某年级当天的逻辑 / 场景题池。
 * 每个模板族每天出 1 道；同一族有多套句式，靠日期种子轮换。
 * @returns {Array} 题目数组，字段与现有题库完全兼容
 */
export function logicPool(subject, grade, rng) {
  const list = FAMILIES[subject] || [];
  const out = [];
  const ids = new Set();
  for (const fam of list) {
    if (!fam.grades.includes(grade)) continue;
    const n = typeof fam.variants === 'function' ? fam.variants(grade) : 1;
    for (let i = 0; i < n; i++) {
      let q;
      try { q = fam.make(rng, grade); } catch (err) {
        console.warn('[logicPool] 生成失败', fam.key, err);
        continue;
      }
      if (!q || !q.prompt || q.answer === undefined || q.answer === null) continue;

      // 情境参数：把 {d}/{p}/{pl}/{th} 换成当日随机值。
      // 固定场景库本身只有 4~5 条，靠这个数字/人物参数才能让题面每天不同，
      // 否则语文/科学的逻辑题一年只能贡献几十道唯一题面，占比会随时间枯竭。
      if (q.prompt.includes('{')) {
        const v = {
          d: randInt(rng, 2, 99),
          p: pick(rng, PEOPLE),
          pl: pick(rng, PLACES),
          th: pick(rng, THINGS)
        };
        q.prompt = q.prompt
          .replace(/\{d\}/g, String(v.d))
          .replace(/\{p\}/g, v.p)
          .replace(/\{pl\}/g, v.pl)
          .replace(/\{th\}/g, v.th);
        // prompt 变了，内容哈希 id 必须同步重算
        q.id = `lg-${subject}-g${grade}-${hashString(
          `${q.prompt}|${(q.options || []).slice().sort().join(',')}|${String(q.answer)}`
        ).toString(36)}`;
      }
      // family 上的 topic 是题目的知识点标签，补齐给渲染头部与家长核对页
      if (!q.topic) q.topic = fam.topic || '逻辑推理';
      // 有些族用「题干前 10 字」当 key，会带进未替换的 {d}/{p} 占位符；
      // 统一收敛到 family 的稳定 key，让 10 天冷却按「逻辑类型」而非「某次情境」生效
      if (q.key && q.key.includes('{')) q.key = fam.key;
      if (ids.has(q.id)) continue;
      ids.add(q.id);
      out.push(q);
    }
  }
  return out;
}

/** 供诊断/测试用：返回各科目模板族数量 */
export function logicFamilyCount(subject) {
  return (FAMILIES[subject] || []).length;
}
