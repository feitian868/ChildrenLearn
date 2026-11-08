/**
 * specs-science-modes-life.js —— 生命世界（sc-life）与生物与环境（sc-env）的 12 外壳
 *
 * 每个外壳返回 { prompt, type, options, answer, explain, level }；
 * 题干统一带【单元标签·册次】前缀，同一 grade 内不同单元题面不重复。
 * 每个外壳内置 2~3 种同义问法，拉开同一外壳的题面供给。
 */

import { pick, sample } from '../../core/rng.js';
import {
  SCI_ANIMALS, SCI_LIVING, SCI_PLANT_PARTS, SCI_REPRO, SCI_LIFE_SEQS,
  SCI_ORGANS, SCI_HABITS, SCI_MICROBES,
  SCI_CHAINS, SCI_ADAPT, SCI_HABITATS, SCI_ENV_IMPACT, SCI_CONSERVE
} from './specs-science-data.js';
import { p, ph, choiceOf, judgeOf, uniq } from './specs-science-util.js';

const otherText = (rand, list, value, n = 3) => sample(rand, uniq(list.filter((x) => x !== value)), n);

/* ============================ 生命世界 ============================ */

export const SC_LIFE_MODES = [
  {
    level: 1, ask: '动物分类',
    make(rand, ctx) {
      const a = pick(rand, SCI_ANIMALS);
      const cats = uniq(SCI_ANIMALS.map((x) => x.cat));
      const t = ph(rand, [
        `${a.n}属于下面哪一类动物？`,
        `从身体特征看，${a.n}应该归入哪一类？`,
        `科学课上给动物分类，${a.n}属于哪一类？`
      ]);
      return choiceOf(rand, a.cat, otherText(rand, cats, a.cat), {
        prompt: p(ctx, t), explain: `${a.n}有${a.feature}，属于${a.cat}。`, level: 1
      });
    }
  },
  {
    level: 1, ask: '繁殖方式',
    make(rand, ctx) {
      const r = pick(rand, SCI_REPRO);
      const ways = uniq(SCI_REPRO.map((x) => x.way));
      const t = ph(rand, [
        `${r.n}是通过什么方式繁殖后代的？`,
        `${r.n}繁殖后代的方式是哪一种？`,
        `下面哪种说法是${r.n}的繁殖方式？`
      ]);
      return choiceOf(rand, r.way, otherText(rand, ways, r.way), {
        prompt: p(ctx, t), explain: `${r.n}的繁殖方式是${r.way}。`, level: 1
      });
    }
  },
  {
    level: 2, ask: '植物器官作用',
    make(rand, ctx) {
      const it = pick(rand, SCI_PLANT_PARTS);
      const uses = uniq(SCI_PLANT_PARTS.map((x) => x.use));
      const t = ph(rand, [
        `植物的${it.part}的主要作用是什么？`,
        `在植物体内，${it.part}负责做什么？`,
        `${it.part}对植物的生长有什么作用？`
      ]);
      return choiceOf(rand, it.use, otherText(rand, uses, it.use), {
        prompt: p(ctx, t), explain: `${it.part}的作用是${it.use}。`, level: 2
      });
    }
  },
  {
    level: 1, ask: '生物判断',
    make(rand, ctx) {
      const it = pick(rand, SCI_LIVING);
      const t = ph(rand, [
        `${it.n}是有生命的物体吗？`,
        `${it.n}属于生物吗？`,
        `判断：${it.n}是生物。`
      ]);
      return judgeOf(it.living, {
        prompt: p(ctx, t),
        explain: it.living ? `${it.n}能生长、能繁殖，是生物。` : `${it.n}不能生长繁殖，不是生物。`,
        level: 1
      });
    }
  },
  {
    level: 2, ask: '生长顺序',
    make(rand, ctx) {
      const s = pick(rand, SCI_LIFE_SEQS);
      const first = s.order[0];
      const second = s.order[1];
      const last = s.order[3];
      const correct = s.order[2];
      const t = ph(rand, [
        `发育过程的顺序是：${first}→${second}→（ ）→${last}。括号里应填什么？`,
        `一生的顺序是${first}、${second}、（ ）、${last}。横线上填哪个阶段？`,
        `按${s.name}的生长顺序，${second}之后、${last}之前是哪个阶段？`
      ]);
      return choiceOf(rand, correct, s.order.filter((x) => x !== correct), {
        prompt: p(ctx, t), explain: `${s.name}的顺序是${s.order.join('→')}。`, level: 2
      }, 3);
    }
  },
  {
    level: 2, ask: '动物特征',
    make(rand, ctx) {
      const a = pick(rand, SCI_ANIMALS);
      const feats = uniq(SCI_ANIMALS.map((x) => x.feature));
      const t = ph(rand, [
        `${a.n}的身体有什么特点？`,
        `下面哪种说法描述的是${a.n}？`,
        `${a.n}最明显的身体特征是什么？`
      ]);
      return choiceOf(rand, a.feature, otherText(rand, feats, a.feature), {
        prompt: p(ctx, t), explain: `${a.n}的特点是：${a.feature}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '动物类别判断',
    make(rand, ctx) {
      const a = pick(rand, SCI_ANIMALS);
      const cats = uniq(SCI_ANIMALS.map((x) => x.cat));
      const claim = rand() < 0.5 ? a.cat : pick(rand, cats.filter((c) => c !== a.cat));
      const t = ph(rand, [
        `判断：${a.n}属于${claim}。`,
        `${a.n}是${claim}吗？`,
        `“${a.n}属于${claim}”这句话对吗？`
      ]);
      return judgeOf(a.cat === claim, {
        prompt: p(ctx, t), explain: `${a.n}属于${a.cat}，不是${claim}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '器官识别',
    make(rand, ctx) {
      const byUse = new Map();
      for (const it of SCI_PLANT_PARTS) {
        byUse.set(it.use, [...(byUse.get(it.use) || []), it.part]);
      }
      const uniqueUses = [...byUse.entries()].filter(([, parts]) => parts.length === 1).map(([use]) => use);
      const use = pick(rand, uniqueUses);
      const correct = byUse.get(use)[0];
      const parts = uniq(SCI_PLANT_PARTS.map((x) => x.part));
      const t = ph(rand, [
        `植物的哪个器官能${use}？`,
        `要完成“${use}”，靠的是植物的哪个器官？`,
        `植物身上负责“${use}”的器官是哪个？`
      ]);
      return choiceOf(rand, correct, otherText(rand, parts, correct), {
        prompt: p(ctx, t), explain: `负责“${use}”的器官是${correct}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '人体器官功能',
    make(rand, ctx) {
      const o = pick(rand, SCI_ORGANS);
      const organs = uniq(SCI_ORGANS.map((x) => x.n));
      const uses = uniq(SCI_ORGANS.map((x) => x.use));
      const byOrgan = rand() < 0.5;
      if (byOrgan) {
        const t = ph(rand, [
          `人体中${o.n}的主要功能是什么？`,
          `${o.n}在人体里负责做什么？`,
          `关于${o.n}的作用，下面哪种说法正确？`
        ]);
        return choiceOf(rand, o.use, otherText(rand, uses, o.use), {
          prompt: p(ctx, t), explain: `${o.n}的作用是${o.use}。`, level: 2
        });
      }
      const t = ph(rand, [
        `人体中负责“${o.use}”的器官是哪个？`,
        `要完成“${o.use}”，靠的是人体的哪个器官？`,
        `人体里承担“${o.use}”任务的器官是？`
      ]);
      return choiceOf(rand, o.n, otherText(rand, organs, o.n), {
        prompt: p(ctx, t), explain: `负责“${o.use}”的器官是${o.n}。`, level: 2
      });
    }
  },
  {
    level: 1, ask: '健康习惯判断',
    make(rand, ctx) {
      const h = pick(rand, SCI_HABITS);
      const t = ph(rand, [
        `${h.n}是有益健康的好习惯吗？`,
        `判断：${h.n}是对健康有益的好习惯。`,
        `“${h.n}”这种做法对健康有好处吗？`
      ]);
      return judgeOf(h.good, {
        prompt: p(ctx, t),
        explain: h.good ? `${h.n}是好习惯，因为${h.why}。` : `${h.n}不是好习惯，因为${h.why}。`,
        level: 1
      });
    }
  },
  {
    level: 2, ask: '微生物作用',
    make(rand, ctx) {
      const m = pick(rand, SCI_MICROBES);
      const uses = uniq(SCI_MICROBES.map((x) => x.use));
      const t = ph(rand, [
        `${m.n}有什么用途或影响？`,
        `关于${m.n}，下面哪种说法正确？`,
        `${m.n}会带来什么影响或作用？`
      ]);
      return choiceOf(rand, m.use, otherText(rand, uses, m.use), {
        prompt: p(ctx, t), explain: `${m.n}属于${m.kind}微生物，作用是${m.use}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '习惯原因',
    make(rand, ctx) {
      const h = pick(rand, SCI_HABITS);
      const whys = uniq(SCI_HABITS.map((x) => x.why));
      const t = ph(rand, [
        `${h.n}这种做法为什么${h.good ? '值得提倡' : '不好'}？`,
        `从健康角度看，${h.n}会带来什么结果？`,
        `关于${h.n}，下面哪种解释正确？`
      ]);
      return choiceOf(rand, h.why, otherText(rand, whys, h.why), {
        prompt: p(ctx, t), explain: `${h.n}会${h.why}。`, level: 2
      });
    }
  }
];

/* ============================ 生物与环境 ============================ */

const chainParts = (c) => String(c.chain).split('→');

export const SC_ENV_MODES = [
  {
    level: 2, ask: '食物链谁吃谁',
    make(rand, ctx) {
      const c = pick(rand, SCI_CHAINS);
      const t = ph(rand, [
        `在食物链“${c.chain}”中，${c.eater}直接吃什么？`,
        `“${c.chain}”里，${c.eater}的食物是什么？`,
        `按“${c.chain}”这条食物链，谁被${c.eater}吃？`
      ]);
      return choiceOf(rand, c.eat, otherText(rand, chainParts(c), c.eat), {
        prompt: p(ctx, t), explain: `${c.eater}以${c.eat}为食。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '食物链判断',
    make(rand, ctx) {
      const c = pick(rand, SCI_CHAINS);
      const forward = rand() < 0.5;
      const who = forward ? c.eater : c.eat;
      const what = forward ? c.eat : c.eater;
      const t = ph(rand, [
        `在“${c.chain}”中，${who}直接吃${what}。这句话对吗？`,
        `判断：食物链“${c.chain}”中，${who}以${what}为食。`,
        `“${who}吃${what}”符合食物链“${c.chain}”的顺序吗？`
      ]);
      return judgeOf(forward, {
        prompt: p(ctx, t),
        explain: `食物链的箭头指向取食者：${c.chain}，所以是${c.eater}吃${c.eat}。`,
        level: 2
      });
    }
  },
  {
    level: 3, ask: '食物链中断',
    make(rand, ctx) {
      const c = pick(rand, SCI_CHAINS);
      const parts = chainParts(c);
      if (parts.length < 3) return null;
      const top = parts[2];
      const t = ph(rand, [
        `如果“${c.chain}”中的${c.eater}大量减少，最先受影响的是谁？`,
        `食物链“${c.chain}”里，${c.eater}大量减少后，谁会缺少食物？`,
        `“${c.chain}”中，${c.eater}数量骤减，直接受影响的动物是？`
      ]);
      return choiceOf(rand, top, [c.eat, c.eater, pick(rand, SCI_CHAINS.filter((x) => x !== c)).eater], {
        prompt: p(ctx, t), explain: `${top}以${c.eater}为食，${c.eater}减少，${top}会缺食物。`, level: 3
      });
    }
  },
  {
    level: 2, ask: '栖息地匹配',
    make(rand, ctx) {
      // 动物名本身含栖息地答案（如「北极熊」含「北极」）会触发题干泄漏，先剔除
      const pool = SCI_HABITATS.filter((x) => !x.n.includes(x.habitat));
      const h = pick(rand, pool);
      const homes = uniq(pool.map((x) => x.habitat));
      const t = ph(rand, [
        `${h.n}生活在什么环境里？`,
        `${h.n}的栖息地是下面哪一个？`,
        `下面哪种环境最适合${h.n}生活？`
      ]);
      return choiceOf(rand, h.habitat, otherText(rand, homes, h.habitat), {
        prompt: p(ctx, t), explain: `${h.n}生活在${h.habitat}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '栖息地判断',
    make(rand, ctx) {
      const h = pick(rand, SCI_HABITATS);
      const homes = uniq(SCI_HABITATS.map((x) => x.habitat));
      const claim = rand() < 0.5 ? h.habitat : pick(rand, homes.filter((x) => x !== h.habitat));
      const t = ph(rand, [
        `判断：${h.n}生活在${claim}。`,
        `${h.n}生活在${claim}，这句话对吗？`,
        `“${h.n}的栖息地是${claim}”这种说法正确吗？`
      ]);
      return judgeOf(h.habitat === claim, {
        prompt: p(ctx, t), explain: `${h.n}生活在${h.habitat}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '适应环境',
    make(rand, ctx) {
      const a = pick(rand, SCI_ADAPT);
      const answers = uniq(SCI_ADAPT.map((x) => x.answer));
      const t = ph(rand, [
        `${a.scene}，这对它有什么好处？`,
        `${a.scene}，这样能帮助它做什么？`,
        `${a.scene}，这种特点的作用是什么？`
      ]);
      return choiceOf(rand, a.answer, otherText(rand, answers, a.answer), {
        prompt: p(ctx, t), explain: `这是为了${a.answer}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '适应判断',
    make(rand, ctx) {
      const a = pick(rand, SCI_ADAPT);
      const answers = uniq(SCI_ADAPT.map((x) => x.answer));
      const claim = rand() < 0.5 ? a.answer : pick(rand, answers.filter((x) => x !== a.answer));
      const t = ph(rand, [
        `判断：${a.scene}，这是为了${claim}。`,
        `${a.scene}，说这是为了${claim}，对吗？`,
        `“${a.scene}，这样是为了${claim}”这种说法正确吗？`
      ]);
      return judgeOf(a.answer === claim, {
        prompt: p(ctx, t), explain: `这实际是为了${a.answer}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '人类活动影响',
    make(rand, ctx) {
      const e = pick(rand, SCI_ENV_IMPACT);
      const effects = uniq(SCI_ENV_IMPACT.map((x) => x.effect));
      const t = ph(rand, [
        `${e.act}会带来什么后果？`,
        `大量出现“${e.act}”这种现象，最可能造成什么影响？`,
        `${e.act}对环境的直接影响是什么？`
      ]);
      return choiceOf(rand, e.effect, otherText(rand, effects, e.effect), {
        prompt: p(ctx, t), explain: `${e.act}会造成${e.effect}。`, level: 2
      });
    }
  },
  {
    level: 1, ask: '环保做法',
    make(rand, ctx) {
      const c = pick(rand, SCI_CONSERVE.filter((x) => x.good));
      const bad = uniq(SCI_CONSERVE.filter((x) => !x.good).map((x) => x.act));
      const t = ph(rand, [
        `下面哪种做法有利于保护环境？`,
        `为了保护环境，我们应该选择哪种做法？`,
        `下列做法中，值得提倡的是哪一种？`
      ]);
      return choiceOf(rand, c.act, bad, {
        prompt: p(ctx, t), explain: `${c.act}可以${c.why}。`, level: 1
      });
    }
  },
  {
    level: 1, ask: '环保判断',
    make(rand, ctx) {
      const c = pick(rand, SCI_CONSERVE);
      const t = ph(rand, [
        `${c.act}是保护环境的做法吗？`,
        `判断：${c.act}有利于保护环境。`,
        `“${c.act}”这种做法对保护环境有好处吗？`
      ]);
      return judgeOf(c.good, {
        prompt: p(ctx, t),
        explain: c.good ? `${c.act}可以${c.why}。` : `${c.act}会${c.why}，不是环保做法。`,
        level: 1
      });
    }
  },
  {
    level: 2, ask: '环保原因',
    make(rand, ctx) {
      const c = pick(rand, SCI_CONSERVE);
      const whys = uniq(SCI_CONSERVE.map((x) => x.why));
      const t = ph(rand, [
        `${c.act}为什么${c.good ? '值得提倡' : '不应该提倡'}？`,
        `从环保角度看，“${c.act}”会带来什么结果？`,
        `关于“${c.act}”，下面哪种解释正确？`
      ]);
      return choiceOf(rand, c.why, otherText(rand, whys, c.why), {
        prompt: p(ctx, t), explain: `${c.act}会${c.why}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '环境影响识别',
    make(rand, ctx) {
      const e = pick(rand, SCI_ENV_IMPACT);
      const acts = uniq(SCI_ENV_IMPACT.map((x) => x.act));
      const t = ph(rand, [
        `下面哪种做法最可能造成“${e.effect}”？`,
        `想要减少“${e.effect}”，最应该避免哪种做法？`,
        `“${e.effect}”与下面哪种行为关系最直接？`
      ]);
      return choiceOf(rand, e.act, otherText(rand, acts, e.act), {
        prompt: p(ctx, t), explain: `${e.act}会造成${e.effect}。`, level: 2
      });
    }
  }
];
