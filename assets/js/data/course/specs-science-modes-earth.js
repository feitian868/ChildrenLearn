/**
 * specs-science-modes-earth.js —— 地球与宇宙（sc-earth）、科学探究（sc-inquiry）、技术与工程（sc-tech）的 12 外壳
 */

import { pick, sample } from '../../core/rng.js';
import {
  SCI_WEATHER, SCI_WATER_CYCLE, SCI_EARTH, SCI_SPACE, SCI_RESOURCES,
  SCI_TOOLS, SCI_UNITS, SCI_VARS, SCI_EVIDENCE, SCI_SAFETY, SCI_EXP_ORDER,
  SCI_WEATHER_STMT, SCI_EARTH_CHANGE, SCI_SKY,
  SCI_TECH, SCI_TECH_NEEDS, SCI_ORDER, SCI_STRUCT, SCI_MACHINES,
  SCI_TECH_EFFECT, SCI_TECH_MATERIAL, SCI_TECH_ENERGY, SCI_BIO, SCI_ENG_STMT
} from './specs-science-data.js';
import { p, ph, choiceOf, judgeOf, uniq } from './specs-science-util.js';

const otherText = (rand, list, value, n = 3) => sample(rand, uniq(list.filter((x) => x !== value)), n);
const rotJoin = (arr, k) => arr.slice(k).concat(arr.slice(0, k)).join('→');
// 超纲词拦截：≤4 年级不出现「体积」，量筒/量杯类工具在低年级换成别的工具
const toolsOf = (ctx) => (ctx.grade <= 4 ? SCI_TOOLS.filter((x) => !x.use.includes('体积')) : SCI_TOOLS);

/* ============================ 地球与宇宙 ============================ */

const MEASURABLE_WEATHER = SCI_WEATHER.filter((x) => !['天气'].includes(x.n));

export const SC_EARTH_MODES = [
  {
    level: 1, ask: '天气工具',
    make(rand, ctx) {
      const it = pick(rand, MEASURABLE_WEATHER);
      const tools = uniq(MEASURABLE_WEATHER.map((x) => x.tool));
      const t = ph(rand, [
        `测量${it.n}应该用什么工具？`,
        `要观测${it.n}，需要用到下面哪种工具？`,
        `下面哪种工具可以用来观测${it.n}？`
      ]);
      return choiceOf(rand, it.tool, otherText(rand, tools, it.tool), {
        prompt: p(ctx, t), explain: `观测${it.n}要用${it.tool}。`, level: 1
      });
    }
  },
  {
    level: 1, ask: '天气判断',
    make(rand, ctx) {
      const it = pick(rand, SCI_WEATHER_STMT);
      const t = ph(rand, [
        `判断：${it.stmt}`,
        `“${it.stmt}”这句话对吗？`,
        `关于天气，下面这种说法正确吗？${it.stmt}`
      ]);
      return judgeOf(it.true, {
        prompt: p(ctx, t), explain: it.true ? '这种说法正确。' : '这种说法错误，不符合天气常识。', level: 1
      });
    }
  },
  {
    level: 2, ask: '水循环环节',
    make(rand, ctx) {
      const it = pick(rand, SCI_WATER_CYCLE);
      const stages = uniq(SCI_WATER_CYCLE.map((x) => x.stage));
      const t = ph(rand, [
        `“${it.process}”属于水循环的哪个环节？`,
        `水循环中，“${it.process}”对应的是哪个环节？`,
        `“${it.process}”说的是水循环中的哪一步？`
      ]);
      return choiceOf(rand, it.stage, otherText(rand, stages, it.stage), {
        prompt: p(ctx, t), explain: `“${it.process}”属于${it.stage}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '水循环判断',
    make(rand, ctx) {
      const it = pick(rand, SCI_WATER_CYCLE);
      const stages = uniq(SCI_WATER_CYCLE.map((x) => x.stage));
      const claim = rand() < 0.5 ? it.stage : pick(rand, stages.filter((x) => x !== it.stage));
      const t = ph(rand, [
        `判断：“${it.process}”属于${claim}。`,
        `“${it.process}”属于${claim}，这样说对吗？`,
        `“${it.process}”是水循环中的${claim}吗？`
      ]);
      return judgeOf(it.stage === claim, {
        prompt: p(ctx, t), explain: `“${it.process}”属于${it.stage}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '地球特征',
    make(rand, ctx) {
      const pool = SCI_EARTH.filter((x) => !/自转|公转|月相|月球|四季|昼夜|北极星/.test(x.stmt));
      const it = pick(rand, pool);
      const t = ph(rand, [
        `判断：${it.stmt}`,
        `“${it.stmt}”这句话对吗？`,
        `关于地球，下面这种说法正确吗？${it.stmt}`
      ]);
      return judgeOf(it.true, {
        prompt: p(ctx, t), explain: it.true ? '这种说法正确。' : '这种说法错误，不符合地球的实际情况。', level: 2
      });
    }
  },
  {
    level: 2, ask: '地表变化',
    make(rand, ctx) {
      const it = pick(rand, SCI_EARTH_CHANGE);
      const t = ph(rand, [
        `判断：${it.stmt}`,
        `“${it.stmt}”这句话对吗？`,
        `关于地表的变化，下面这种说法正确吗？${it.stmt}`
      ]);
      return judgeOf(it.true, {
        prompt: p(ctx, t), explain: it.true ? '这种说法正确。' : '这种说法错误，地表形态会不断变化。', level: 2
      });
    }
  },
  {
    level: 2, ask: '昼夜四季',
    make(rand, ctx) {
      const it = pick(rand, SCI_SKY);
      const t = ph(rand, [
        `判断：${it.stmt}`,
        `“${it.stmt}”这句话对吗？`,
        `关于昼夜和四季，下面这种说法正确吗？${it.stmt}`
      ]);
      return judgeOf(it.true, {
        prompt: p(ctx, t), explain: it.true ? '这种说法正确。' : '这种说法错误，与地球运动的规律不符。', level: 2
      });
    }
  },
  {
    level: 2, ask: '月球特征',
    make(rand, ctx) {
      const pool = SCI_SPACE.filter((x) => /月球|环形山/.test(x.stmt));
      const it = pick(rand, pool);
      const t = ph(rand, [
        `判断：${it.stmt}`,
        `“${it.stmt}”这句话对吗？`,
        `关于月球，下面这种说法正确吗？${it.stmt}`
      ]);
      return judgeOf(it.true, {
        prompt: p(ctx, t), explain: it.true ? '这种说法正确。' : '这种说法错误，月球自己不发光。', level: 2
      });
    }
  },
  {
    level: 2, ask: '太阳系',
    make(rand, ctx) {
      const pool = SCI_SPACE.filter((x) => !/月球|环形山|银河|火箭|宇航员|流星/.test(x.stmt));
      const it = pick(rand, pool);
      const t = ph(rand, [
        `判断：${it.stmt}`,
        `“${it.stmt}”这句话对吗？`,
        `关于太阳系，下面这种说法正确吗？${it.stmt}`
      ]);
      return judgeOf(it.true, {
        prompt: p(ctx, t), explain: it.true ? '这种说法正确。' : '这种说法错误，太阳系有八颗行星。', level: 2
      });
    }
  },
  {
    level: 2, ask: '宇宙与航天',
    make(rand, ctx) {
      const pool = SCI_SPACE.filter((x) => /银河|火箭|宇航员|流星/.test(x.stmt));
      const it = pick(rand, pool);
      const t = ph(rand, [
        `判断：${it.stmt}`,
        `“${it.stmt}”这句话对吗？`,
        `关于宇宙和航天，下面这种说法正确吗？${it.stmt}`
      ]);
      return judgeOf(it.true, {
        prompt: p(ctx, t), explain: it.true ? '这种说法正确。' : '这种说法错误，不符合航天常识。', level: 2
      });
    }
  },
  {
    level: 1, ask: '可再生资源',
    make(rand, ctx) {
      const it = pick(rand, SCI_RESOURCES.filter((x) => x.renewable));
      const wrongs = uniq(SCI_RESOURCES.filter((x) => !x.renewable).map((x) => x.n));
      const t = ph(rand, [
        '下面哪种资源属于可再生资源？',
        '下列资源中，可以自然恢复或持续利用的是哪一种？',
        '下面哪种资源属于可再生能源？'
      ]);
      return choiceOf(rand, it.n, wrongs, {
        prompt: p(ctx, t), explain: `${it.n}属于可再生资源。`, level: 1
      });
    }
  },
  {
    level: 2, ask: '资源分类判断',
    make(rand, ctx) {
      const it = pick(rand, SCI_RESOURCES);
      const t = ph(rand, [
        `判断：${it.n}属于可再生资源。`,
        `${it.n}是可再生资源，这句话对吗？`,
        `“${it.n}属于可再生资源”这种说法正确吗？`
      ]);
      return judgeOf(it.renewable, {
        prompt: p(ctx, t),
        explain: it.renewable ? `${it.n}属于可再生资源。` : `${it.n}属于不可再生资源，用完了很难再形成。`,
        level: 2
      });
    }
  }
];

/* ============================ 科学探究 ============================ */

export const SC_INQUIRY_MODES = [
  {
    level: 1, ask: '工具用途',
    make(rand, ctx) {
      const pool = toolsOf(ctx);
      const it = pick(rand, pool);
      const uses = uniq(pool.map((x) => x.use));
      const t = ph(rand, [
        `${it.n}是用来做什么的？`,
        `在科学探究中，${it.n}的主要用途是什么？`,
        `下面哪种说法正确描述了${it.n}的用途？`
      ]);
      return choiceOf(rand, it.use, otherText(rand, uses, it.use), {
        prompt: p(ctx, t), explain: `${it.n}用来${it.use}。`, level: 1
      });
    }
  },
  {
    level: 2, ask: '测量单位',
    make(rand, ctx) {
      const pool = SCI_UNITS.filter((x) => ctx.grade >= 5 || !/体积/.test(x.quantity));
      const it = pick(rand, pool);
      const units = uniq(pool.map((x) => x.unit));
      const t = ph(rand, [
        `测量${it.quantity}时，常用的单位是什么？`,
        `下面哪个单位适合表示${it.quantity}？`,
        `${it.quantity}通常用什么单位来记录？`
      ]);
      return choiceOf(rand, it.unit, otherText(rand, units, it.unit), {
        prompt: p(ctx, t), explain: `测量${it.quantity}常用${it.unit}。`, level: 2
      });
    }
  },
  {
    level: 1, ask: '工具选择',
    make(rand, ctx) {
      const pool = toolsOf(ctx);
      const it = pick(rand, pool);
      const tools = uniq(pool.map((x) => x.n));
      const t = ph(rand, [
        `要${it.use}，应该选用什么工具？`,
        `完成“${it.use}”这项任务，下面哪种工具最合适？`,
        `如果我们要${it.use}，应该拿什么工具？`
      ]);
      return choiceOf(rand, it.n, otherText(rand, tools, it.n), {
        prompt: p(ctx, t), explain: `要${it.use}，应选用${it.n}。`, level: 1
      });
    }
  },
  {
    level: 3, ask: '证据推理',
    make(rand, ctx) {
      const it = pick(rand, SCI_EVIDENCE);
      const concls = uniq(SCI_EVIDENCE.map((x) => x.concl));
      const t = ph(rand, [
        `${it.obs}，最合理的解释是什么？`,
        `观察到“${it.obs}”，可以说明什么？`,
        `根据“${it.obs}”这一现象，下面哪种解释合理？`
      ]);
      return choiceOf(rand, it.concl, otherText(rand, concls, it.concl), {
        prompt: p(ctx, t), explain: `${it.obs}，说明${it.concl}。`, level: 3
      });
    }
  },
  {
    level: 3, ask: '控制变量',
    make(rand, ctx) {
      const it = pick(rand, SCI_VARS);
      const vars = uniq(SCI_VARS.map((x) => x.variable));
      const t = ph(rand, [
        `要${it.scenario}，需要改变的条件是什么？`,
        `设计对比实验：${it.scenario}，应该改变哪个条件？`,
        `${it.scenario}，实验变量是什么？`
      ]);
      return choiceOf(rand, it.variable, otherText(rand, vars, it.variable), {
        prompt: p(ctx, t), explain: `${it.scenario}时，只改变${it.variable}。`, level: 3
      });
    }
  },
  {
    level: 3, ask: '变量判断',
    make(rand, ctx) {
      const it = pick(rand, SCI_VARS);
      const vars = uniq(SCI_VARS.map((x) => x.variable));
      const claim = rand() < 0.5 ? it.variable : pick(rand, vars.filter((x) => x !== it.variable));
      const t = ph(rand, [
        `${it.scenario}时，需要改变的条件是${claim}。这句话对吗？`,
        `判断：${it.scenario}，应改变的条件是${claim}。`,
        `设计对比实验：${it.scenario}，实验变量是${claim}吗？`
      ]);
      return judgeOf(it.variable === claim, {
        prompt: p(ctx, t), explain: `该实验应改变的条件是${it.variable}。`, level: 3
      });
    }
  },
  {
    level: 3, ask: '结论判断',
    make(rand, ctx) {
      const it = pick(rand, SCI_EVIDENCE);
      const concls = uniq(SCI_EVIDENCE.map((x) => x.concl));
      const claim = rand() < 0.5 ? it.concl : pick(rand, concls.filter((x) => x !== it.concl));
      const t = ph(rand, [
        `观察到“${it.obs}”，可以得出“${claim}”的结论吗？`,
        `判断：由“${it.obs}”能得出“${claim}”的结论。`,
        `“${it.obs}”能说明“${claim}”吗？`
      ]);
      return judgeOf(it.concl === claim, {
        prompt: p(ctx, t), explain: `该现象说明的是：${it.concl}。`, level: 3
      });
    }
  },
  {
    level: 2, ask: '实验顺序',
    make(rand, ctx) {
      const it = pick(rand, SCI_EXP_ORDER);
      const correct = it.steps.join('→');
      const t = ph(rand, [
        `${it.exp}的正确步骤顺序是什么？`,
        `做${it.exp}时，下面哪种顺序是正确的？`,
        `${it.exp}应该按照什么顺序进行？`
      ]);
      return choiceOf(rand, correct, [1, 2, 3].map((k) => rotJoin(it.steps, k)), {
        prompt: p(ctx, t), explain: `${it.exp}的顺序是：${correct}。`, level: 2
      });
    }
  },
  {
    level: 1, ask: '安全判断',
    make(rand, ctx) {
      const it = pick(rand, SCI_SAFETY);
      const t = ph(rand, [
        `判断：${it.stmt}`,
        `“${it.stmt}”这种说法对吗？`,
        `关于实验安全，下面这种说法正确吗？${it.stmt}`
      ]);
      return judgeOf(it.true, {
        prompt: p(ctx, t), explain: it.true ? '这是正确的安全做法。' : '这样做不安全，容易发生危险。', level: 1
      });
    }
  },
  {
    level: 1, ask: '安全做法',
    make(rand, ctx) {
      const safe = pick(rand, SCI_SAFETY.filter((x) => x.true));
      const unsafe = uniq(SCI_SAFETY.filter((x) => !x.true).map((x) => x.stmt));
      const t = ph(rand, [
        '做实验时，下面哪种做法是正确的？',
        '下列做法中，符合实验安全要求的是哪一种？',
        '为了保证实验安全，我们应该选择哪种做法？'
      ]);
      return choiceOf(rand, safe.stmt, unsafe, {
        prompt: p(ctx, t), explain: `${safe.stmt}是正确的安全做法。`, level: 1
      });
    }
  },
  {
    level: 2, ask: '重复实验',
    make(rand, ctx) {
      const t = ph(rand, [
        '只做一次实验就下结论，最应该改进的是什么？',
        '为了让结论更可靠，最应该怎么做？',
        '实验只做了一次，接下来最好怎样做？'
      ]);
      return choiceOf(rand, '多做几次实验并比较结果', ['换一个同学来做', '换一间教室再做', '不再记录数据'], {
        prompt: p(ctx, t), explain: '重复实验可以减少偶然因素的影响，让结论更可靠。', level: 2
      });
    }
  },
  {
    level: 2, ask: '测量误差',
    make(rand, ctx) {
      const t = ph(rand, [
        '测量时多次读数取平均值，目的是什么？',
        '为什么要对同一物体测量多次再取平均值？',
        '测量长度时读数三次取平均，主要是为了？'
      ]);
      return choiceOf(rand, '减小测量误差', ['加快测量速度', '让数据看起来更好', '节约测量工具'], {
        prompt: p(ctx, t), explain: '多次测量取平均值可以减小误差。', level: 2
      });
    }
  }
];

/* ============================ 技术与工程 ============================ */

export const SC_TECH_MODES = [
  {
    level: 2, ask: '产品原理',
    make(rand, ctx) {
      const it = pick(rand, SCI_TECH);
      const principles = uniq(SCI_TECH.map((x) => x.principle));
      const t = ph(rand, [
        `${it.product}主要利用了哪个原理？`,
        `制作${it.product}时，主要用到了什么科学原理？`,
        `${it.product}能发挥作用，主要依靠什么原理？`
      ]);
      return choiceOf(rand, it.principle, otherText(rand, principles, it.principle), {
        prompt: p(ctx, t), explain: `${it.product}主要利用了${it.principle}。`, level: 2
      });
    }
  },
  {
    level: 1, ask: '需求与产品',
    make(rand, ctx) {
      const it = pick(rand, SCI_TECH_NEEDS);
      const products = uniq(SCI_TECH_NEEDS.map((x) => x.product));
      const t = ph(rand, [
        `如果“${it.need}”，可以制作什么？`,
        `为了解决“${it.need}”的问题，最合适制作什么？`,
        `人们“${it.need}”，于是发明了下面哪种物品？`
      ]);
      return choiceOf(rand, it.product, otherText(rand, products, it.product), {
        prompt: p(ctx, t), explain: `为了解决“${it.need}”，可以制作${it.product}。`, level: 1
      });
    }
  },
  {
    level: 2, ask: '制作步骤',
    make(rand, ctx) {
      const it = pick(rand, SCI_ORDER);
      const idx = 1 + Math.floor(rand() * (it.steps.length - 1));
      const prev = it.steps[idx - 1];
      const correct = it.steps[idx];
      const t = ph(rand, [
        `制作${it.product}时，${prev}之后应该做什么？`,
        `在${it.product}的步骤中，${prev}的下一步是什么？`,
        `制作${it.product}，完成“${prev}”后接下来要做什么？`
      ]);
      return choiceOf(rand, correct, it.steps.filter((x) => x !== correct), {
        prompt: p(ctx, t), explain: `${it.product}的步骤是：${it.steps.join('→')}。`, level: 2
      }, 3);
    }
  },
  {
    level: 2, ask: '结构稳固',
    make(rand, ctx) {
      const it = pick(rand, SCI_STRUCT);
      const strengths = uniq(SCI_STRUCT.map((x) => x.strength));
      const t = ph(rand, [
        `把材料做成${it.shape}，在承重或稳定方面会怎样？`,
        `${it.shape}这种结构有什么特点？`,
        `在建筑和制作中采用${it.shape}，主要是因为它？`
      ]);
      return choiceOf(rand, it.strength, otherText(rand, strengths, it.strength), {
        prompt: p(ctx, t), explain: `${it.shape}的特点是${it.strength}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '简单机械',
    make(rand, ctx) {
      // 工具名含类型答案（「定滑轮」含「滑轮」）会触发题干泄漏，先剔除
      const pool = SCI_MACHINES.filter((x) => !x.tool.includes(x.type));
      const it = pick(rand, pool);
      const types = uniq(SCI_MACHINES.map((x) => x.type));
      const t = ph(rand, [
        `${it.tool}属于哪一类简单机械？`,
        `从简单机械的角度看，${it.tool}是哪种类型？`,
        `下面哪种简单机械与${it.tool}的原理相同？`
      ]);
      const wrongs = otherText(rand, types, it.type);
      return choiceOf(rand, it.type, wrongs, {
        prompt: p(ctx, t), explain: `${it.tool}属于${it.type}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '材料选择',
    make(rand, ctx) {
      const it = pick(rand, SCI_TECH_MATERIAL);
      const mats = uniq(SCI_TECH_MATERIAL.map((x) => x.material));
      const t = ph(rand, [
        `制作${it.product}时，最适合的材料是什么？`,
        `要制作${it.product}，应该选择下面哪种材料？`,
        `从用途看，${it.product}最适合用什么材料制作？`
      ]);
      return choiceOf(rand, it.material, otherText(rand, mats, it.material), {
        prompt: p(ctx, t), explain: `${it.product}适合用${it.material}，因为它${it.why}。`, level: 2
      });
    }
  },
  {
    level: 3, ask: '工程顺序',
    make(rand, ctx) {
      const it = pick(rand, SCI_ORDER);
      const correct = it.steps.join('→');
      const t = ph(rand, [
        `${it.product}的正确先后顺序是什么？`,
        `设计并完成${it.product}，应该按什么顺序做？`,
        `制作${it.product}时，下面哪种顺序合理？`
      ]);
      return choiceOf(rand, correct, [1, 2, 3].map((k) => rotJoin(it.steps, k)), {
        prompt: p(ctx, t), explain: `${it.product}的顺序是：${correct}。`, level: 3
      });
    }
  },
  {
    level: 2, ask: '技术影响',
    make(rand, ctx) {
      const it = pick(rand, SCI_TECH_EFFECT);
      const effects = uniq(SCI_TECH_EFFECT.map((x) => x.effect));
      const t = ph(rand, [
        `${it.tech}给生活带来的主要变化是什么？`,
        `${it.tech}的发明主要改善了哪一方面？`,
        `下面哪种说法正确描述了${it.tech}的作用？`
      ]);
      return choiceOf(rand, it.effect, otherText(rand, effects, it.effect), {
        prompt: p(ctx, t), explain: `${it.tech}使${it.effect}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '能源选择',
    make(rand, ctx) {
      // 场景名含能源答案（「太阳能热水器」含「太阳能」）会触发题干泄漏，先剔除
      const pool = SCI_TECH_ENERGY.filter((x) => !x.scene.includes(x.energy));
      const it = pick(rand, pool);
      const energies = uniq(SCI_TECH_ENERGY.map((x) => x.energy));
      const t = ph(rand, [
        `${it.scene}主要利用了哪种能源？`,
        `从能源角度看，${it.scene}依靠的是什么？`,
        `${it.scene}工作时，能量主要来自哪里？`
      ]);
      return choiceOf(rand, it.energy, otherText(rand, energies, it.energy), {
        prompt: p(ctx, t), explain: `${it.scene}主要利用${it.energy}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '仿生设计',
    make(rand, ctx) {
      // 产品名含仿生对象答案（「机器人」含「人」）会触发题干泄漏，先剔除
      const pool = SCI_BIO.filter((x) => !x.product.includes(x.model));
      const it = pick(rand, pool);
      const models = uniq(SCI_BIO.map((x) => x.model));
      const t = ph(rand, [
        `${it.product}的设计模仿了什么？`,
        `工程师发明${it.product}时，从什么身上获得了灵感？`,
        `${it.product}的发明与下面哪种生物或结构关系最密切？`
      ]);
      return choiceOf(rand, it.model, otherText(rand, models, it.model), {
        prompt: p(ctx, t), explain: `${it.product}的设计模仿了${it.model}。`, level: 2
      });
    }
  },
  {
    level: 1, ask: '工程判断',
    make(rand, ctx) {
      const it = pick(rand, SCI_ENG_STMT);
      const t = ph(rand, [
        `判断：${it.stmt}`,
        `“${it.stmt}”这种说法对吗？`,
        `关于设计与制作，下面这种说法正确吗？${it.stmt}`
      ]);
      return judgeOf(it.true, {
        prompt: p(ctx, t), explain: it.true ? '这是正确的工程习惯。' : '这种说法不正确，不利于完成作品。', level: 1
      });
    }
  },
  {
    level: 2, ask: '制作起点',
    make(rand, ctx) {
      const it = pick(rand, SCI_ORDER);
      const correct = it.steps[0];
      const t = ph(rand, [
        `制作${it.product}，第一步应该做什么？`,
        `开始制作${it.product}时，最先要做的是什么？`,
        `${it.product}的制作流程中，起点是哪一步？`
      ]);
      return choiceOf(rand, correct, it.steps.filter((x) => x !== correct), {
        prompt: p(ctx, t), explain: `${it.product}的第一步是${correct}。`, level: 2
      }, 3);
    }
  }
];
