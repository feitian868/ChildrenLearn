/**
 * specs-math-g2.js —— 二年级语义外壳补充域（P2 补齐骨架册用）
 *
 * 目的：同册内不同 kid 不共用同一 templateKey（题干抹数字后的问法键）。
 * 每个域 3 个【语义不同】的外壳（识记/理解 → 回溯/换算 → 应用/辨析），
 * 不产生新题入库；默认 status 由 specs-math.js 统一置 pending-review。
 *
 * 只收录二年级可用内容：避开 L1 超纲词（分数/小数/负数/方程/百分数/比例/π/面积/体积）。
 */

import { randInt } from '../../core/rng.js';

const r = (rand, a, b) => randInt(rand, a, b);

/** 4 选项单选题：正确项 + 3 个干扰项，随机打乱 */
const pickG2 = (rand, correct, wrongs) => {
  const options = [String(correct)];
  wrongs.forEach((w) => { if (!options.includes(String(w))) options.push(String(w)); });
  for (let i = options.length - 1; i > 0; i -= 1) {
    const j = randInt(rand, 0, i);
    const t = options[i]; options[i] = options[j]; options[j] = t;
  }
  return { type: 'choice', options, answer: options.indexOf(String(correct)) };
};

/** 观察物体：固体 → 从某个方向看到的形状 */
const pickG2Item = (rand) => {
  const list = [
    { s: '球', shape: '圆', dir: '正面' },
    { s: '正方体', shape: '正方形', dir: '正面' },
    { s: '圆柱', shape: '长方形', dir: '正面' },
    { s: '长方体', shape: '长方形', dir: '上面' }
  ];
  return list[randInt(rand, 0, list.length - 1)];
};

const g2Mul = [
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const a = r(rand, 2, 9);
    const b = r(rand, 2, 9);
    return { prompt: `每盒有 ${a} 支铅笔，${b} 盒一共有多少支？`, answer: a * b, unit: '支', explain: `每盒 ${a} 支，${b} 盒就是 ${a} × ${b} = ${a * b} 支。` };
  } },
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const a = r(rand, 2, 9);
    const b = r(rand, 2, 9);
    return { prompt: `${b} 个 ${a} 相加，和是多少？`, answer: a * b, explain: `${b} 个 ${a} 相加，写成 ${a} × ${b}，得 ${a * b}。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const a = r(rand, 2, 9);
    const b = r(rand, 2, 9);
    return { prompt: `${a} × ${b} 表示几个 ${a} 相加？`, answer: b, explain: `乘法算式 ${a} × ${b} 表示 ${b} 个 ${a} 相加。` };
  } }
];

const g2AddSub = [
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const a = r(rand, 35, 78);
    const b = r(rand, 6, 22);
    return { prompt: `小明有 ${a} 张卡片，又得到 ${b} 张，现在一共有多少张？`, answer: a + b, unit: '张', explain: `${a} + ${b} = ${a + b}（张）。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const a = r(rand, 45, 92);
    const b = r(rand, 7, 28);
    return { prompt: `一本书有 ${a} 页，已经读了 ${b} 页，还剩多少页没读？`, answer: a - b, unit: '页', explain: `${a} - ${b} = ${a - b}（页）。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const a = r(rand, 40, 90);
    const b = r(rand, 6, 30);
    return { prompt: `甲得了 ${a} 分，乙得了 ${b} 分，甲比乙多多少分？`, answer: a - b, unit: '分', explain: `${a} - ${b} = ${a - b}，甲比乙多 ${a - b} 分。` };
  } }
];

const g2Angle = [
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const n = r(rand, 1, 12);
    return { prompt: `${n} 个角一共有几个顶点？`, answer: n, unit: '个', explain: `每个角有 1 个顶点，${n} 个角共有 ${n} 个顶点。` };
  } },
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const h = r(rand, 1, 5);
    const deg = Math.min(h, 12 - h) * 30;
    const kind = deg === 90 ? '直角' : deg < 90 ? '锐角' : '钝角';
    return { prompt: `钟面上 ${h} 时整，时针和分针组成的角是什么角？`, answer: kind, explain: `${h} 时整分针指向 12，时针指向 ${h}，两针夹角 ${deg}°，是${kind}。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const n = r(rand, 1, 2);
    return { prompt: `用三角尺上的直角比一比，比直角小的角叫（ ）`, answer: '锐角', explain: `比直角小的角是锐角，比直角大的角是钝角。三角尺有 ${n} 个直角。` };
  } },
  { askPattern: 'product-recall', level: 1, make(rand) {
    const h = r(rand, 1, 12);
    return { prompt: `钟面上 ${h} 时整，时针指向数字几？`, answer: h, explain: `${h} 时整，时针正好指向数字 ${h}。` };
  } },
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const n = r(rand, 1, 12);
    return { prompt: `${n} 个角一共有几条边？`, answer: n * 2, unit: '条', explain: `每个角有 2 条边，${n} 个角共有 ${n * 2} 条边。` };
  } },
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const n = r(rand, 1, 11);
    return { prompt: `分针指向 ${n}，表示经过了（ ）分`, answer: n * 5, unit: '分', explain: `分针指向 ${n}，走了 ${n} 大格，每大格 5 分，共 ${n * 5} 分。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const kind = r(rand, 0, 4);
    if (kind === 0) return { prompt: `比直角小的角叫（ ）`, answer: '锐角', explain: `比直角小的角叫锐角。` };
    if (kind === 1) return { prompt: `比直角大的角叫（ ）`, answer: '钝角', explain: `比直角大的角叫钝角。` };
    if (kind === 2) return { prompt: `大小正好是 90° 的角叫（ ）`, answer: '直角', explain: `大小正好是 90° 的角叫直角。` };
    if (kind === 3) return { prompt: `把一个角的两条边都延长，这个角的大小（ ）`, answer: '不变', explain: `角的大小只与两边张开的程度有关，延长边不改变角的大小。` };
    return { prompt: `角的大小与边的方向（ ）`, answer: '无关', explain: `角的大小由两边张开的程度决定，与边的方向无关。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const onLength = r(rand, 0, 1) === 0;
    if (onLength) {
      return { ...pickG2(rand, '无关', ['有关', '说不清', '越长越大']), prompt: `角的大小与边的长短（ ）`, explain: `角的大小与边的长短无关，只与两边张开的程度有关。` };
    }
    return { ...pickG2(rand, '有关', ['无关', '说不清', '越长越小']), prompt: `角的大小与两边张开的程度（ ）`, explain: `角的大小与两边张开的程度有关。` };
  } },
  { askPattern: 'meaning-translate', level: 2, make(rand) {
    const n = r(rand, 2, 4);
    return { prompt: `${n} 个直角合起来是多少度？`, answer: n * 90, unit: '°', explain: `${n} × 90° = ${n * 90}°${n === 2 ? '，就是 1 个平角' : n === 4 ? '，就是 1 个周角' : ''}。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const a = r(rand, 10, 70);
    const b = r(rand, a + 20, Math.min(a + 80, 170));
    return { prompt: `角的一边对准量角器的 ${a}° 刻度线，另一边对准 ${b}° 刻度线，这个角是多少度？`, answer: b - a, unit: '°', explain: `${b}° - ${a}° = ${b - a}°，就是这个角的大小。` };
  } },
  { askPattern: 'product-recall', level: 2, make(rand) {
    const m = r(rand, 2, 8);
    return { prompt: `分针从数字 12 走到数字 ${m}，转过了多少度？`, answer: m * 30, unit: '°', explain: `一大格是 30°，走 ${m} 大格就是 ${m} × 30° = ${m * 30}°。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const a = r(rand, 10, 80);
    return { prompt: `一个 ${a}° 的角比直角小多少度？`, answer: 90 - a, unit: '°', explain: `直角是 90°，90° - ${a}° = ${90 - a}°。` };
  } }
];

const g2View = [
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const obj = ['长方体', '正方体', '圆柱'][r(rand, 0, 2)];
    return { prompt: `观察一个${obj}，最多能同时看到几个面？`, answer: 3, unit: '个', explain: `从任一位置观察${obj}，最多同时看到 3 个面。` };
  } },
  { askPattern: 'product-recall', level: 1, make(rand) {
    const dir = ['上面', '正面', '侧面'][r(rand, 0, 2)];
    return { prompt: `从${dir}看一个球，看到的平面图形是（ ）`, answer: '圆', explain: `球从任何方向看都是圆。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const obj = ['物体', '长方体', '圆柱', '正方体', '球'][r(rand, 0, 4)];
    return { prompt: `从不同位置观察同一个${obj}，看到的形状可能（ ）`, answer: '不同', explain: `观察位置不同，看到的形状可能不同。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const pick4 = r(rand, 0, 3);
    const item = pick4 === 0 ? { s: '球', shape: '圆' } : pick4 === 1 ? { s: '正方体', shape: '正方形' } : pick4 === 2 ? { s: '圆柱', shape: '圆' } : { s: '长方体', shape: '长方形' };
    return { ...pickG2(rand, item.shape, ['三角形', '正方形', '圆', '长方形'].filter((x) => x !== item.shape)), prompt: `从上面看一个${item.s}，看到的形状是（ ）`, explain: `从上面看${item.s}，看到的是${item.shape}。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const item = pickG2Item(rand);
    return { ...pickG2(rand, item.shape, ['三角形', '正方形', '圆', '长方形'].filter((x) => x !== item.shape)), prompt: `从${item.dir}看一个${item.s}，看到的形状是（ ）`, explain: `从${item.dir}看${item.s}，看到的是${item.shape}。` };
  } },
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const n = r(rand, 2, 20);
    return { prompt: `把 ${n} 个小正方体排成一排，从正面能看到几个正方形？`, answer: n, unit: '个', explain: `每个小正方体从正面看是 1 个正方形，${n} 个一排能看到 ${n} 个正方形。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const obj = r(rand, 0, 1) === 0 ? { s: '长方体', shape: '长方形' } : { s: '正方体', shape: '正方形' };
    return { ...pickG2(rand, obj.shape, ['正方形', '三角形', '圆', '长方形'].filter((x) => x !== obj.shape)), prompt: `把一个${obj.s}平放在桌面上，从正上方看下去，看到的是（ ）`, explain: `${obj.s}平放时从正上方看下去，看到的是${obj.shape}。` };
  } }
];

const g2Time = [
  { askPattern: 'product-recall', level: 1, make(rand) {
    const n = r(rand, 1, 9);
    return { prompt: `分针走 ${n} 小格，经过了几分？`, answer: n, unit: '分', explain: `分针走 1 小格是 1 分，走 ${n} 小格是 ${n} 分。` };
  } },
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const h = r(rand, 1, 3);
    return { prompt: `1 时等于多少分？`, answer: 60, unit: '分', explain: `时针走 1 大格是 1 时，分针要走 60 分（这里从 ${h} 时说起）。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const big = r(rand, 2, 11);
    return { prompt: `分针从 12 走到 ${big}，经过多少分？`, answer: big * 5, unit: '分', explain: `分针走 1 大格是 5 分，走到 ${big} 是 ${big * 5} 分。` };
  } },
  { askPattern: 'product-recall', level: 1, make(rand) {
    const n = r(rand, 1, 11);
    return { prompt: `分针走 ${n} 大格，经过多少分？`, answer: n * 5, unit: '分', explain: `分针走 1 大格是 5 分，${n} 大格是 ${n * 5} 分。` };
  } }
];

const g2Match = [
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const tops = r(rand, 2, 6);
    const pants = r(rand, 2, 4);
    return { prompt: `${tops} 件上衣和 ${pants} 条裤子，一共有多少种搭配？`, answer: tops * pants, unit: '种', explain: `每件上衣都能配 ${pants} 条裤子，共 ${tops} × ${pants} = ${tops * pants} 种。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const n = 3;
    return { prompt: `用 1、2、3 三张数字卡片排成两位数（数字不重复），能排成几个？`, answer: 6, unit: '个', explain: `十位有 ${n} 种选法，个位剩 2 种，共 ${n} × 2 = 6 个。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const n = r(rand, 3, 12);
    return { prompt: `从 ${n} 个人中选 2 人参加比赛，有多少种选法？`, answer: n * (n - 1) / 2, unit: '种', explain: `${n} 人两两组合，共 ${n} × ${n - 1} ÷ 2 = ${n * (n - 1) / 2} 种。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const tops = r(rand, 2, 8);
    return { prompt: `有 ${tops} 件上衣和 2 条裤子搭配，如果再添 1 条裤子，搭配种数会增加几种？`, answer: tops, unit: '种', explain: `每条新裤子都能和 ${tops} 件上衣搭配，增加 ${tops} 种。` };
  } },
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const m = r(rand, 2, 6);
    const n = r(rand, 2, 4);
    return { prompt: `${m} 种主食和 ${n} 种汤，每样各选一种，一共有几种搭配？`, answer: m * n, unit: '种', explain: `每种主食配 ${n} 种汤，共 ${m} × ${n} = ${m * n} 种。` };
  } }
];

const g2Data = [
  { askPattern: 'product-recall', level: 1, make(rand) {
    const a = r(rand, 8, 20);
    const b = r(rand, 5, 18);
    return { prompt: `调查发现喜欢跳绳的有 ${a} 人，喜欢踢球的有 ${b} 人，一共调查了多少人？`, answer: a + b, unit: '人', explain: `${a} + ${b} = ${a + b}（人）。` };
  } },
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const n = r(rand, 2, 6);
    return { prompt: `用画「正」字的方法记录人数，一个「正」字表示几人？`, answer: 5, unit: '人', explain: `「正」字有 5 笔，一笔记 1 人，一个「正」字记 5 人（这里记 ${n} 组）。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const a = r(rand, 5, 15);
    const b = r(rand, 16, 30);
    return { prompt: `喜欢苹果的有 ${b} 人，喜欢梨的有 ${a} 人，喜欢苹果的比喜欢梨的多几人？`, answer: b - a, unit: '人', explain: `${b} - ${a} = ${b - a}（人）。` };
  } }
];

const g2Div = [
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const b = r(rand, 2, 9);
    const per = r(rand, 2, 8);
    return { prompt: `把 ${b * per} 个苹果平均分给 ${b} 个小朋友，每人分几个？`, answer: per, unit: '个', explain: `${b * per} ÷ ${b} = ${per}（个）。` };
  } },
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const per = r(rand, 2, 9);
    const b = r(rand, 2, 8);
    return { prompt: `${per * b} 个苹果，每 ${per} 个装一袋，能装几袋？`, answer: b, unit: '袋', explain: `${per * b} ÷ ${per} = ${b}（袋）。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const a = r(rand, 2, 9);
    const b = r(rand, 2, 8);
    return { prompt: `${a * b} ÷ ${a} = （ ）`, answer: b, explain: `${a * b} ÷ ${a} = ${b}，想口诀 ${a} ${b} 得 ${a * b}。` };
  } }
];

const g2Div2 = [
  { askPattern: 'product-recall', level: 2, make(rand) {
    const a = r(rand, 2, 9);
    const b = r(rand, 2, 9);
    return { prompt: `${a} × ${b} = ${a * b}，那么 ${a * b} ÷ ${b} = （ ）`, answer: a, explain: `乘除互逆：${a * b} ÷ ${b} = ${a}。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const b = r(rand, 2, 8);
    const per = r(rand, 2, 9);
    return { prompt: `有 ${b * per} 个鸡蛋，平均放在 ${b} 个盒子里，每盒放几个？`, answer: per, unit: '个', explain: `${b * per} ÷ ${b} = ${per}（个）。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const a = r(rand, 2, 9);
    const b = r(rand, 2, 8);
    return { prompt: `计算 ${a * b} ÷ ${a} 时，用哪句口诀？下面结果是多少？`, answer: b, explain: `用口诀「${a} ${b} 得 ${a * b}」，结果是 ${b}。` };
  } }
];

const g2Move = [
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const n = r(rand, 2, 15);
    return { prompt: `电梯从 1 楼升到 ${n} 楼，这种运动属于什么现象？`, answer: '平移', explain: `电梯沿直线上下运动，是平移（从 1 楼到 ${n} 楼）。` };
  } },
  { askPattern: 'product-recall', level: 1, make(rand) {
    const n = r(rand, 1, 8);
    return { prompt: `风车叶片绕中心转了 ${n} 圈，这属于什么现象？`, answer: '旋转', explain: `风车绕中心转动，是旋转（这里转 ${n} 圈）。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    return { prompt: `把长方形沿一条直线对折，两边完全重合，它是（ ）图形。`, answer: '轴对称', explain: `对折后两边完全重合的图形是轴对称图形。` };
  } },
  { askPattern: 'product-recall', level: 1, make(rand) {
    const moving = r(rand, 0, 1) === 0;
    const list = moving
      ? [{ c: '电梯上下运动', w: ['风车转动', '钟摆摆动'] }, { c: '推拉抽屉', w: ['风车转动', '钟摆摆动'] }, { c: '升国旗', w: ['风车转动', '钟摆摆动'] }, { c: '火车沿直线前进', w: ['风车转动', '钟摆摆动'] }, { c: '缆车沿索道移动', w: ['风车转动', '钟摆摆动'] }, { c: '自动扶梯载人上行', w: ['风车转动', '钟摆摆动'] }, { c: '传送带运送货物', w: ['风车转动', '钟摆摆动'] }]
      : [{ c: '风车转动', w: ['电梯上下运动', '推拉抽屉'] }, { c: '钟摆摆动', w: ['电梯上下运动', '推拉抽屉'] }, { c: '拧开水龙头', w: ['电梯上下运动', '推拉抽屉'] }, { c: '旋转门转动', w: ['电梯上下运动', '推拉抽屉'] }, { c: '电风扇叶片转动', w: ['电梯上下运动', '推拉抽屉'] }, { c: '摩天轮转动', w: ['电梯上下运动', '推拉抽屉'] }, { c: '地球仪转动', w: ['电梯上下运动', '推拉抽屉'] }];
    const item = list[r(rand, 0, list.length - 1)];
    return { ...pickG2(rand, item.c, item.w), prompt: `下面哪种现象属于${moving ? '平移' : '旋转'}？`, explain: `${item.c}${moving ? '沿直线移动，是平移' : '绕中心转动，是旋转'}。` };
  } },
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const n = r(rand, 1, 12);
    return { prompt: `推拉抽屉 ${n} 次，抽屉的运动属于什么现象？`, answer: '平移', explain: `推拉抽屉沿直线移动，是平移（这里推拉 ${n} 次）。` };
  } },
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const h = r(rand, 1, 11);
    return { prompt: `钟面上时针从 ${h} 时走到 ${h + 1} 时，时针做的是（ ）`, answer: '旋转', explain: `时针绕钟面中心转动，是旋转（从 ${h} 时到 ${h + 1} 时）。` };
  } }
];

const g2Mass = [
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const n = r(rand, 2, 6);
    return { prompt: `一袋大米重 ${n} 千克，合多少克？`, answer: n * 1000, unit: '克', explain: `1 千克 = 1000 克，${n} 千克 = ${n * 1000} 克。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const per = r(rand, 100, 500);
    return { prompt: `一袋盐重 ${per} 克，两袋一共重多少克？`, answer: per * 2, unit: '克', explain: `${per} × 2 = ${per * 2}（克）。` };
  } },
  { askPattern: 'product-recall', level: 2, make(rand) {
    const kg = r(rand, 2, 4);
    return { prompt: `妈妈买了 ${kg} 千克苹果，合多少克？`, answer: kg * 1000, unit: '克', explain: `1 千克 = 1000 克，${kg} 千克 = ${kg * 1000} 克。` };
  } }
];

const g2Reason = [
  { askPattern: 'apply-solve', level: 1, make(rand) {
    return { prompt: `甲、乙、丙三人比高矮，甲不是最高的，乙比丙高，谁最高？`, answer: '乙', explain: `甲不是最高，乙又比丙高，所以最高的是乙。` };
  } },
  { askPattern: 'inverse-recall', level: 1, make(rand) {
    const who = ['小红', '小明'][r(rand, 0, 1)];
    const subj = ['数学', '语文'][r(rand, 0, 1)];
    return { prompt: `${who}和另一个小朋友各拿一本书（数学、语文），${who}拿的不是${subj}，${who}拿的是（ ）`, answer: subj === '数学' ? '语文' : '数学', explain: `两本书里排除${subj}，${who}拿的是${subj === '数学' ? '语文' : '数学'}。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const colors = ['红', '黄', '蓝', '绿'];
    const taken = colors[r(rand, 0, 3)];
    const others = colors.filter((x) => x !== taken).sort(() => 0.5 - r(rand, 0, 1));
    return { prompt: `有红、黄、蓝、绿四个球，小明拿的不是${others[0]}球，也不是${others[1]}球，也不是${others[2]}球，他拿的是（ ）`, answer: `${taken}球`, explain: `排除${others[0]}球、${others[1]}球和${others[2]}球，剩下${taken}球。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const name = ['甲', '乙', '丙'][r(rand, 0, 2)];
    const pos = r(rand, 0, 1);
    return { prompt: `甲、乙、丙三人排成一排，${name}${pos === 0 ? '不站最前面' : '不站最后面'}，一共有几种排法？`, answer: 4, unit: '种', explain: `${name}有 2 个位置可选，其余两人排剩下两个位置，共 2 × 2 = 4 种。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const names = ['小红', '小明', '小刚'];
    const i = r(rand, 0, 2);
    const [a, b, c] = [names[i], names[(i + 1) % 3], names[(i + 2) % 3]];
    return { prompt: `${a}、${b}、${c}三人分别拿语文、数学、英语书。${a}不拿语文，${b}不拿语文也不拿数学，${c}拿的是（ ）`, answer: '语文', explain: `${b}只能拿英语，${a}只能拿数学，剩下语文给${c}。` };
  } }
];

const g2Review = [
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const a = r(rand, 20, 45);
    const b = r(rand, 15, 40);
    return { prompt: `二（1）班有 ${a} 人，二（2）班有 ${b} 人，两班一共有多少人？`, answer: a + b, unit: '人', explain: `${a} + ${b} = ${a + b}（人）。` };
  } },
  { askPattern: 'meaning-translate', level: 2, make(rand) {
    const a = r(rand, 3, 9);
    const b = r(rand, 3, 8);
    return { prompt: `一盒铅笔有 ${a} 支，${b} 盒共有多少支？`, answer: a * b, unit: '支', explain: `${a} × ${b} = ${a * b}（支）。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const a = r(rand, 50, 90);
    const b = r(rand, 10, 40);
    return { prompt: `小华带了 ${a} 元，买文具用了 ${b} 元，还剩多少元？`, answer: a - b, unit: '元', explain: `${a} - ${b} = ${a - b}（元）。` };
  } }
];

const g2Length = [
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const n = r(rand, 12, 25);
    return { prompt: `一支新铅笔长 ${n}（ ），括号里填什么单位？`, answer: '厘米', explain: `铅笔的长度用厘米作单位，约 ${n} 厘米。` };
  } },
  { askPattern: 'product-recall', level: 1, make(rand) {
    const n = r(rand, 2, 5);
    return { prompt: `1 米等于多少厘米？`, answer: 100, unit: '厘米', explain: `1 米 = 100 厘米，${n} 米 = ${n * 100} 厘米。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    const m = r(rand, 2, 6);
    const cm = r(rand, 10, 90);
    return { prompt: `${m} 米 ${cm} 厘米合多少厘米？`, answer: m * 100 + cm, unit: '厘米', explain: `${m} 米 = ${m * 100} 厘米，再加 ${cm} 厘米得 ${m * 100 + cm} 厘米。` };
  } }
];

const g2Weight = [
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    const n = r(rand, 2, 6);
    return { prompt: `一个苹果大约重 200（ ），括号里填什么单位？`, answer: '克', explain: `一个苹果约重 200 克（${n} 个约 ${n * 200} 克）。` };
  } },
  { askPattern: 'product-recall', level: 2, make(rand) {
    const n = r(rand, 1, 4);
    return { prompt: `${n} 千克等于多少克？`, answer: n * 1000, unit: '克', explain: `1 千克 = 1000 克，${n} 千克 = ${n * 1000} 克。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const a = r(rand, 2, 6);
    const b = r(rand, 3, 9);
    return { prompt: `${a} 千克和 ${b * 100} 克相比，哪个更重？`, answer: a * 1000 > b * 100 ? `${a} 千克` : `${b * 100} 克`, explain: `${a} 千克 = ${a * 1000} 克，与 ${b * 100} 克比较，${a * 1000 > b * 100 ? `${a} 千克` : `${b * 100} 克`}更重。` };
  } }
];

const g2Observe = [
  { askPattern: 'product-recall', level: 1, make(rand) {
    const n = r(rand, 1, 3);
    return { prompt: `一个正方体有几个面？`, answer: 6, unit: '个', explain: `正方体有 6 个面（这里从第 ${n} 个方向观察）。` };
  } },
  { askPattern: 'meaning-translate', level: 1, make(rand) {
    return { prompt: `从物体的上面往下看，看到的是物体的哪个面？`, answer: '上面', explain: `从上面往下看，看到的是物体的上面。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    return { prompt: `小明站在讲台左侧，小红站在右侧，他们看到粉笔盒的（ ）不同。`, answer: '形状', explain: `观察位置不同，看到的形状不同。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    return { prompt: `一个长方体有几个面？`, answer: 6, unit: '个', explain: `长方体有 6 个面。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    return { prompt: `一个圆柱有几个面？`, answer: 3, unit: '个', explain: `圆柱有 3 个面（上下两个底面和 1 个侧面）。` };
  } },
  { askPattern: 'meaning-translate', level: 2, make(rand) {
    return { prompt: `一个立体图形有两个完全相同的底面，它的底面是什么图形？`, answer: '圆', explain: `圆柱的上下两个底面都是圆。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    return { prompt: `长方体和正方体都有几个面？`, answer: 6, unit: '个', explain: `长方体和正方体都有 6 个面。` };
  } },
  { askPattern: 'apply-solve', level: 2, make(rand) {
    return { prompt: `两个同样的正方体拼成一个长方体，拼成的长方体有几个面？`, answer: 6, unit: '个', explain: `两个正方体各有 6 个面，拼在一起有 2 个面被挡住，共 12 - 2 - 2 = 6 个面。` };
  } }
];

const g2Match2 = [
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const n = r(rand, 2, 8);
    return { prompt: `${n} 种饮料和 2 种点心，每样各选一种，有几种选法？`, answer: n * 2, unit: '种', explain: `每种饮料配 2 种点心，共 ${n} × 2 = ${n * 2} 种。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const n = r(rand, 3, 8);
    return { prompt: `从甲、乙、丙等 ${n} 个地点中任选 2 个去游玩，有多少种选法？`, answer: n * (n - 1) / 2, unit: '种', explain: `${n} 个地点两两组合，共 ${n} × ${n - 1} ÷ 2 = ${n * (n - 1) / 2} 种。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const n = r(rand, 3, 4);
    return { prompt: `用 0、1、2 三张卡片排两位数（数字不重复，0 不能放十位），能排几个？`, answer: 4, unit: '个', explain: `十位只能是 1 或 2，各有 2 种，共 2 × 2 = 4 个。（${n} 张卡片的思路相同）` };
  } },
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const staple = r(rand, 2, 6);
    const dish = r(rand, 2, 4);
    return { prompt: `有 ${staple} 种主食和 ${dish} 种菜，每样各选一种，有几种选法？`, answer: staple * dish, unit: '种', explain: `每种主食配 ${dish} 种菜，共 ${staple} × ${dish} = ${staple * dish} 种。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const n = r(rand, 3, 12);
    return { prompt: `从 ${n} 种水果中任选 2 种做拼盘，有多少种选法？`, answer: n * (n - 1) / 2, unit: '种', explain: `${n} 种水果两两组合，共 ${n} × ${n - 1} ÷ 2 = ${n * (n - 1) / 2} 种。` };
  } }
];

const g2Grid = [
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const a = r(rand, 2, 6);
    const b = r(rand, 1, 4);
    return { prompt: `图形向右平移 ${a} 格，再向右平移 ${b} 格，一共平移几格？`, answer: a + b, unit: '格', explain: `两次都向右，合起来 ${a} + ${b} = ${a + b} 格。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const a = r(rand, 2, 6);
    const b = r(rand, 1, a - 1);
    return { prompt: `图形先向上平移 ${a} 格，再向下平移 ${b} 格，现在比原来高几格？`, answer: a - b, unit: '格', explain: `向上 ${a} 格再向下 ${b} 格，净高 ${a} - ${b} = ${a - b} 格。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const a = r(rand, 2, 5);
    const b = r(rand, 2, 5);
    return { prompt: `点 A 向右平移 ${a} 格到 B，B 再向右平移 ${b} 格到 C，A 到 C 共几格？`, answer: a + b, unit: '格', explain: `A 到 C 的距离是 ${a} + ${b} = ${a + b} 格。` };
  } }
];

const g2Review2 = [
  { askPattern: 'apply-solve', level: 1, make(rand) {
    const b = r(rand, 2, 8);
    const per = r(rand, 2, 9);
    return { prompt: `有 ${b * per} 个橘子，平均分给 ${b} 人，每人几个？`, answer: per, unit: '个', explain: `${b * per} ÷ ${b} = ${per}（个）。` };
  } },
  { askPattern: 'inverse-recall', level: 2, make(rand) {
    const b = r(rand, 2, 9);
    const q = r(rand, 2, 9);
    const rem = r(rand, 0, b - 1);
    return { prompt: `有 ${b * q + rem} 元，每本练习本 ${b} 元，最多能买几本？`, answer: q, unit: '本', explain: `${b * q + rem} ÷ ${b} = ${q} 余 ${rem}，最多买 ${q} 本。` };
  } },
  { askPattern: 'compare-operate', level: 2, make(rand) {
    const a = r(rand, 4, 12);
    const b = r(rand, 4, 12);
    const c = r(rand, 4, 12);
    return { prompt: `三组数据分别是 ${a}、${b}、${c}，一共是多少？`, answer: a + b + c, unit: '个', explain: `${a} + ${b} + ${c} = ${a + b + c}（个）。` };
  } }
];

export const G2_DOMAINS = {
  'g2-grid': g2Grid,
  'g2-review2': g2Review2,
  'g2-length': g2Length,
  'g2-weight': g2Weight,
  'g2-observe': g2Observe,
  'g2-match2': g2Match2,
  'g2-mul': g2Mul,
  'g2-addsub': g2AddSub,
  'g2-angle': g2Angle,
  'g2-view': g2View,
  'g2-time': g2Time,
  'g2-match': g2Match,
  'g2-data': g2Data,
  'g2-div': g2Div,
  'g2-div2': g2Div2,
  'g2-move': g2Move,
  'g2-mass': g2Mass,
  'g2-reason': g2Reason,
  'g2-review': g2Review
};
