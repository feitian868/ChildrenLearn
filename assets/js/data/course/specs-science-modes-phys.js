/**
 * specs-science-modes-phys.js —— 物质科学（sc-matter）与力与能量（sc-force）的 12 外壳
 */

import { pick, sample } from '../../core/rng.js';
import {
  SCI_MATERIALS, SCI_STATES, SCI_CHANGES, SCI_SEPARATE, SCI_BURN,
  SCI_RUST, SCI_SPOIL, SCI_AIR,
  SCI_FORCES, SCI_FRICTION, SCI_MAGNETS, SCI_MAGNET_ITEMS, SCI_CIRCUIT,
  SCI_ELECTRIC, SCI_SOUND, SCI_LIGHT, SCI_LIGHT_ITEMS, SCI_ENERGY
} from './specs-science-data.js';
import { p, ph, choiceOf, judgeOf, uniq } from './specs-science-util.js';

const otherText = (rand, list, value, n = 3) => sample(rand, uniq(list.filter((x) => x !== value)), n);

/** 只保留“具体物体”，排除食盐、白糖等本身是材料名的条目 */
const OBJECTS = SCI_MATERIALS.filter((x) => !['盐', '糖', '油', '沙', '石头'].includes(x.material));

/* ============================ 物质科学 ============================ */

export const SC_MATTER_MODES = [
  {
    level: 1, ask: '材料归属',
    make(rand, ctx) {
      const it = pick(rand, OBJECTS);
      const mats = uniq(OBJECTS.map((x) => x.material));
      const t = ph(rand, [
        `${it.n}用什么材料做的？`,
        `从材料上看，${it.n}属于哪一类？`,
        `制作${it.n}主要使用了哪种材料？`
      ]);
      return choiceOf(rand, it.material, otherText(rand, mats, it.material), {
        prompt: p(ctx, t), explain: `${it.n}是用${it.material}做的。`, level: 1
      });
    }
  },
  {
    level: 2, ask: '导电判断',
    make(rand, ctx) {
      const it = pick(rand, SCI_MATERIALS);
      const t = ph(rand, [
        `${it.n}容易导电吗？`,
        `${it.n}是导体吗？`,
        `判断：${it.n}可以让电流通过。`
      ]);
      return judgeOf(it.conducts, {
        prompt: p(ctx, t),
        explain: it.conducts ? `${it.n}容易导电，是导体。` : `${it.n}不容易导电，是绝缘体。`,
        level: 2
      });
    }
  },
  {
    level: 1, ask: '溶解选择',
    make(rand, ctx) {
      const it = pick(rand, SCI_MATERIALS.filter((x) => x.dissolves));
      const wrongs = uniq(SCI_MATERIALS.filter((x) => !x.dissolves).map((x) => x.n));
      const t = ph(rand, [
        '下面哪种物质能溶解在水中？',
        '把下面哪种物质放进水里，会溶解？',
        '下列物质中，能溶解在水里的是哪一种？'
      ]);
      return choiceOf(rand, it.n, wrongs, {
        prompt: p(ctx, t), explain: `${it.n}能溶解在水中。`, level: 1
      });
    }
  },
  {
    level: 1, ask: '物态判断',
    make(rand, ctx) {
      const it = pick(rand, SCI_STATES);
      const t = ph(rand, [
        `${it.n}在常温下是什么状态？`,
        `${it.n}属于固体、液体还是气体？`,
        `从状态上看，${it.n}是哪一类？`
      ]);
      return choiceOf(rand, it.state, ['固体', '液体', '气体'].filter((x) => x !== it.state), {
        prompt: p(ctx, t), explain: `${it.n}在常温下是${it.state}。`, level: 1
      }, 2);
    }
  },
  {
    level: 2, ask: '物态判断（说法）',
    make(rand, ctx) {
      const it = pick(rand, SCI_STATES);
      const states = ['固体', '液体', '气体'];
      const claim = rand() < 0.5 ? it.state : pick(rand, states.filter((x) => x !== it.state));
      const t = ph(rand, [
        `判断：${it.n}是${claim}。`,
        `${it.n}是${claim}，这句话对吗？`,
        `“${it.n}属于${claim}”这种说法正确吗？`
      ]);
      return judgeOf(it.state === claim, {
        prompt: p(ctx, t), explain: `${it.n}是${it.state}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '变化类型',
    make(rand, ctx) {
      const c = pick(rand, SCI_CHANGES);
      const types = uniq(SCI_CHANGES.map((x) => x.type));
      const t = ph(rand, [
        `${c.from}变成${c.to}，这属于什么变化？`,
        `${c.from}变成${c.to}的过程叫什么？`,
        `科学上把“${c.from}变成${c.to}”称为什么变化？`
      ]);
      return choiceOf(rand, c.type, otherText(rand, types, c.type), {
        prompt: p(ctx, t), explain: `${c.from}变成${c.to}属于${c.type}。`, level: 2
      });
    }
  },
  {
    level: 3, ask: '变化条件',
    make(rand, ctx) {
      const c = pick(rand, SCI_CHANGES);
      const conds = uniq(SCI_CHANGES.map((x) => x.cond));
      const t = ph(rand, [
        `${c.from}变成${c.to}，需要什么条件？`,
        `要让${c.from}变成${c.to}，下面哪种条件最合适？`,
        `${c.from}变成${c.to}通常是在什么条件下发生的？`
      ]);
      return choiceOf(rand, c.cond, otherText(rand, conds, c.cond), {
        prompt: p(ctx, t), explain: `${c.from}变成${c.to}需要${c.cond}。`, level: 3
      });
    }
  },
  {
    level: 3, ask: '分离方法',
    make(rand, ctx) {
      const s = pick(rand, SCI_SEPARATE);
      const ways = uniq(SCI_SEPARATE.map((x) => x.way));
      const t = ph(rand, [
        `要把${s.mix}分开，最合适的方法是什么？`,
        `分离${s.mix}，应该采用下面哪种方法？`,
        `下面哪种方法适合把${s.mix}分开？`
      ]);
      return choiceOf(rand, s.way, otherText(rand, ways, s.way), {
        prompt: p(ctx, t), explain: `${s.mix}可以用“${s.way}”分开。`, level: 3
      });
    }
  },
  {
    level: 1, ask: '可燃性',
    make(rand, ctx) {
      const it = pick(rand, SCI_BURN.filter((x) => x.burns));
      const wrongs = uniq(SCI_BURN.filter((x) => !x.burns).map((x) => x.n));
      const t = ph(rand, [
        '下面哪种物体容易燃烧？',
        '下列物体中，属于可燃物的是哪一种？',
        '把下面哪种物体靠近火源，最容易燃烧？'
      ]);
      return choiceOf(rand, it.n, wrongs, {
        prompt: p(ctx, t), explain: `${it.n}是可燃物，容易燃烧。`, level: 1
      });
    }
  },
  {
    level: 2, ask: '生锈物品',
    make(rand, ctx) {
      const it = pick(rand, SCI_RUST);
      const nonMetal = uniq(SCI_MATERIALS.filter((x) => x.material !== '金属').map((x) => x.n));
      const t = ph(rand, [
        '下面哪个物品是铁制品、容易生锈？',
        '下列物品中，最容易生锈的是哪一个？',
        '下面哪种物品放久了会出现铁锈？'
      ]);
      return choiceOf(rand, it.n, nonMetal, {
        prompt: p(ctx, t), explain: `${it.n}是铁制品，在潮湿环境中容易生锈。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '变质判断',
    make(rand, ctx) {
      const it = pick(rand, SCI_SPOIL);
      const t = ph(rand, [
        `${it.n}放久了容易变质吗？`,
        `判断：${it.n}保存不当容易腐败变质。`,
        `“${it.n}放久了会变质”这种说法对吗？`
      ]);
      return judgeOf(it.spoils, {
        prompt: p(ctx, t),
        explain: it.spoils ? `${it.n}营养丰富，放久了容易变质。` : `${it.n}不容易变质，可以较长时间保存。`,
        level: 2
      });
    }
  },
  {
    level: 2, ask: '空气性质',
    make(rand, ctx) {
      const it = pick(rand, SCI_AIR);
      const t = ph(rand, [
        `判断：${it.stmt}`,
        `“${it.stmt}”这句话对吗？`,
        `关于空气，下面这种说法正确吗？${it.stmt}`
      ]);
      return judgeOf(it.true, {
        prompt: p(ctx, t), explain: it.true ? `这种说法正确。` : `这种说法错误，空气的性质需要按科学事实判断。`, level: 2
      });
    }
  }
];

/* ============================ 力与能量 ============================ */

export const SC_FORCE_MODES = [
  {
    level: 1, ask: '力的种类',
    make(rand, ctx) {
      const it = pick(rand, SCI_FORCES);
      const forces = uniq(SCI_FORCES.map((x) => x.force));
      const t = ph(rand, [
        `${it.n}时，主要用到了什么力？`,
        `${it.n}主要体现了哪种力？`,
        `“${it.n}”这个现象与哪种力关系最直接？`
      ]);
      return choiceOf(rand, it.force, otherText(rand, forces, it.force), {
        prompt: p(ctx, t), explain: `${it.n}主要体现了${it.force}。`, level: 1
      });
    }
  },
  {
    level: 2, ask: '力的效果',
    make(rand, ctx) {
      const it = pick(rand, SCI_FORCES);
      const effect = it.force === '弹力' ? '改变物体的形状' : '改变物体的运动状态';
      const t = ph(rand, [
        `${it.n}说明力可以改变物体的什么？`,
        `从${it.n}可以看出，力能改变物体的什么？`,
        `${it.n}这个现象说明力的作用效果是什么？`
      ]);
      return choiceOf(rand, effect, ['改变物体的形状', '改变物体的运动状态', '改变物体的颜色', '改变物体的温度'].filter((x) => x !== effect), {
        prompt: p(ctx, t), explain: `${it.n}说明力可以${effect}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '摩擦力增减',
    make(rand, ctx) {
      const it = pick(rand, SCI_FRICTION);
      const t = ph(rand, [
        `${it.scene}是为了什么？`,
        `${it.scene}，这样做的主要目的是？`,
        `“${it.scene}”对摩擦力有什么影响？`
      ]);
      return choiceOf(rand, it.effect, ['增大摩擦力', '减小摩擦力', '增大重力', '增大弹力'].filter((x) => x !== it.effect), {
        prompt: p(ctx, t), explain: `${it.scene}是为了${it.effect}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '摩擦判断',
    make(rand, ctx) {
      const it = pick(rand, SCI_FRICTION);
      const claim = rand() < 0.5 ? it.effect : (it.effect === '增大摩擦力' ? '减小摩擦力' : '增大摩擦力');
      const t = ph(rand, [
        `判断：${it.scene}是为了${claim}。`,
        `${it.scene}，说这是为了${claim}，对吗？`,
        `“${it.scene}是为了${claim}”这种说法正确吗？`
      ]);
      return judgeOf(it.effect === claim, {
        prompt: p(ctx, t), explain: `${it.scene}实际是为了${it.effect}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '磁极',
    make(rand, ctx) {
      const it = pick(rand, SCI_MAGNETS);
      const t = ph(rand, [
        `一块磁铁的${it.a}极和另一块的${it.b}极靠近，会怎样？`,
        `把${it.a}极和${it.b}极靠近，它们会？`,
        `${it.a}极与${it.b}极之间的作用是？`
      ]);
      return choiceOf(rand, it.attract ? '互相吸引' : '互相排斥', ['互相吸引', '互相排斥', '没有作用', '粘在一起'].filter((x) => x !== (it.attract ? '互相吸引' : '互相排斥')), {
        prompt: p(ctx, t), explain: it.attract ? '异极靠近互相吸引。' : '同极靠近互相排斥。', level: 2
      });
    }
  },
  {
    level: 1, ask: '磁铁吸引',
    make(rand, ctx) {
      const it = pick(rand, SCI_MAGNET_ITEMS.filter((x) => x.magnet));
      const wrongs = uniq(SCI_MAGNET_ITEMS.filter((x) => !x.magnet).map((x) => x.n));
      const t = ph(rand, [
        '下面哪种物体能被磁铁吸引？',
        '用磁铁靠近下列物体，能被吸住的是哪一个？',
        '下列物品中，磁铁能吸引的是？'
      ]);
      return choiceOf(rand, it.n, wrongs, {
        prompt: p(ctx, t), explain: `${it.n}含有铁，能被磁铁吸引。`, level: 1
      });
    }
  },
  {
    level: 2, ask: '电路判断',
    make(rand, ctx) {
      const it = pick(rand, SCI_CIRCUIT);
      const t = ph(rand, [
        `判断：${it.stmt}`,
        `“${it.stmt}”这句话对吗？`,
        `关于电路，下面这种说法正确吗？${it.stmt}`
      ]);
      return judgeOf(it.true, {
        prompt: p(ctx, t), explain: it.true ? '这种说法正确。' : '这种说法错误，不符合电路的基本规律。', level: 2
      });
    }
  },
  {
    level: 1, ask: '导体选择',
    make(rand, ctx) {
      const it = pick(rand, SCI_ELECTRIC.filter((x) => x.conducts));
      const wrongs = uniq(SCI_ELECTRIC.filter((x) => !x.conducts).map((x) => x.n));
      const t = ph(rand, [
        '下面哪种材料是导体？',
        '下列材料中，能让电流通过的是哪一种？',
        '下面哪种物体接入电路后小灯泡可能发光？'
      ]);
      return choiceOf(rand, it.n, wrongs, {
        prompt: p(ctx, t), explain: `${it.n}容易导电，是导体。`, level: 1
      });
    }
  },
  {
    level: 2, ask: '声音判断',
    make(rand, ctx) {
      const it = pick(rand, SCI_SOUND);
      const t = ph(rand, [
        `判断：${it.stmt}`,
        `“${it.stmt}”这句话对吗？`,
        `关于声音，下面这种说法正确吗？${it.stmt}`
      ]);
      return judgeOf(it.true, {
        prompt: p(ctx, t), explain: it.true ? '这种说法正确。' : '这种说法错误，不符合声音传播的规律。', level: 2
      });
    }
  },
  {
    level: 2, ask: '光现象判断',
    make(rand, ctx) {
      const it = pick(rand, SCI_LIGHT);
      const t = ph(rand, [
        `判断：${it.stmt}`,
        `“${it.stmt}”这句话对吗？`,
        `关于光，下面这种说法正确吗？${it.stmt}`
      ]);
      return judgeOf(it.true, {
        prompt: p(ctx, t), explain: it.true ? '这种说法正确。' : '这种说法错误，不符合光传播的规律。', level: 2
      });
    }
  },
  {
    level: 1, ask: '光源判断',
    make(rand, ctx) {
      const it = pick(rand, SCI_LIGHT_ITEMS.filter((x) => x.source));
      const wrongs = uniq(SCI_LIGHT_ITEMS.filter((x) => !x.source).map((x) => x.n));
      const t = ph(rand, [
        '下面哪个物体是光源？',
        '下列物体中，自己能发光的是哪一个？',
        '下面哪种物体属于光源？'
      ]);
      return choiceOf(rand, it.n, wrongs, {
        prompt: p(ctx, t), explain: `${it.n}自己能发光，是光源。`, level: 1
      });
    }
  },
  {
    level: 3, ask: '能量转换',
    make(rand, ctx) {
      const it = pick(rand, SCI_ENERGY);
      const pairs = uniq(SCI_ENERGY.map((x) => `${x.from}→${x.to}`));
      const correct = `${it.from}→${it.to}`;
      const t = ph(rand, [
        `${it.device}工作时，能量是怎样转化的？`,
        `${it.device}把什么能转化成了什么能？`,
        `关于${it.device}的能量转化，下面哪种说法正确？`
      ]);
      return choiceOf(rand, correct, otherText(rand, pairs, correct), {
        prompt: p(ctx, t), explain: `${it.device}把${it.from}转化为${it.to}。`, level: 3
      });
    }
  }
];
