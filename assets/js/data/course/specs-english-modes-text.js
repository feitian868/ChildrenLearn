/**
 * specs-english-modes-text.js —— 句子 / 语法 / 交际 三族的 12 外壳
 *
 * 所有题干都带【Unit N·册次】前缀；答案不出现在题干陈述里，
 * 低参数外壳（如交际固定问句）通过加入不同说话人保证 365 天题面不重复。
 */

import { pick, sample, shuffle } from '../../core/rng.js';
import {
  SENT_BANK, BE_BANK, ORDER_BANK, PUNCT_BANK, ERROR_BANK, SUBJECT_BANK,
  SUBJECT_BE, POSSESSIVES, ARTICLE_NOUNS, PREP_SCENES, COMPARATIVES,
  FUTURE_FILLS, PAST_FILLS, PROGRESSIVE_FILLS, MODAL_FILLS, QUESTION_WORDS,
  THERE_BE, PLURAL_BANK, FORMS_BANK,
  D_NAMES, D_AGES, D_COLORS, D_COUNTS, D_TIMES, D_WEATHERS,
  D_DOINGS, D_LOCATIONS, POLITE_PAIRS, D_HOUSE
} from './specs-english-data.js';
import { choiceOf, blankOut } from './specs-english-util.js';

const p = (ctx, text) => `【${ctx.tag}】${text}`;
const otherThan = (rand, pool, value, n) => sample(rand, pool.filter((x) => x !== value), n);
const lowerFirst = (s) => s[0].toLowerCase() + s.slice(1);

const JOBS = ['teacher', 'doctor', 'nurse', 'farmer', 'driver', 'cook', 'worker', 'policeman'];
const JOBS_ZH = {
  teacher: '老师', doctor: '医生', nurse: '护士', farmer: '农民',
  driver: '司机', cook: '厨师', worker: '工人', policeman: '警察'
};

const QA_PAIRS = [
  { q: "What's your name?", a: 'My name is Tom.' },
  { q: 'How old are you?', a: 'I am eight.' },
  { q: 'What colour is it?', a: "It's blue." },
  { q: 'How many books do you have?', a: 'Five.' },
  { q: 'What time is it?', a: "It's seven o'clock." },
  { q: "How's the weather?", a: "It's sunny." },
  { q: 'Where is my book?', a: "It's on the desk." },
  { q: 'What are you doing?', a: 'I am reading.' },
  { q: 'Can you swim?', a: 'Yes, I can.' },
  { q: 'Thank you.', a: "You're welcome." },
  { q: 'Sorry.', a: "That's all right." },
  { q: 'Nice to meet you.', a: 'Nice to meet you, too.' }
];

const GREET_SCENES = [
  { zh: '早上见到老师，应该说什么？', a: 'Good morning!' },
  { zh: '下午见到同学，应该说什么？', a: 'Good afternoon!' },
  { zh: '晚上见到家人，应该说什么？', a: 'Good evening!' },
  { zh: '别人向你问好，你应该怎么回答？', a: 'Hello!' },
  { zh: '和朋友告别，应该说什么？', a: 'Goodbye!' },
  { zh: '问对方身体怎么样，应该说什么？', a: 'How are you?' },
  { zh: '第一次见面，应该说什么？', a: 'Nice to meet you.' },
  { zh: '正式场合第一次见面，应该说什么？', a: 'How do you do?' }
];

/* ============================ 句子族 ============================ */

export const EN_SENTENCE_MODES = [
  {
    level: 1, ask: '句意（英→中）',
    make(rand, ctx) {
      const it = pick(rand, SENT_BANK);
      const wrongs = sample(rand, SENT_BANK.filter((x) => x.zh !== it.zh).map((x) => x.zh), 3);
      return choiceOf(rand, it.zh, wrongs, {
        prompt: p(ctx, `句子“${it.en}”的意思是？`),
        explain: `${it.en} 的意思是“${it.zh}”`, level: 1
      });
    }
  },
  {
    level: 1, ask: '句意（中→英）',
    make(rand, ctx) {
      const it = pick(rand, SENT_BANK);
      const wrongs = sample(rand, SENT_BANK.filter((x) => x.en !== it.en).map((x) => x.en), 3);
      return choiceOf(rand, it.en, wrongs, {
        prompt: p(ctx, `“${it.zh}”用英语怎么说？`),
        explain: `“${it.zh}”的英文是 ${it.en}`, level: 1
      });
    }
  },
  {
    level: 1, ask: '句意判断',
    make(rand, ctx) {
      const it = pick(rand, SENT_BANK);
      const truth = rand() < 0.5;
      const shot = truth ? it.zh : pick(rand, SENT_BANK.filter((x) => x.zh !== it.zh)).zh;
      return {
        prompt: p(ctx, `句子“${it.en}”的意思是“${shot}”。这句话对吗？`),
        type: 'judge', answer: truth,
        explain: `${it.en} 的意思是“${it.zh}”`, level: 1
      };
    }
  },
  {
    level: 2, ask: '选词填空',
    make(rand, ctx) {
      const it = pick(rand, SENT_BANK.filter((x) => x.blank));
      return choiceOf(rand, it.blank, it.wrongs, {
        prompt: p(ctx, `选词填空：${blankOut(it.en, it.blank)}`),
        explain: `完整句子是 ${it.en} “${it.zh}”`, level: 2
      });
    }
  },
  {
    level: 3, ask: '改一般疑问句',
    make(rand, ctx) {
      const it = pick(rand, BE_BANK);
      const beCap = it.be[0].toUpperCase() + it.be.slice(1);
      const subQ = it.sub === 'Tom' ? it.sub : lowerFirst(it.sub);
      const correct = `${beCap} ${subQ} ${it.rest}?`;
      const wrongs = [
        `${it.sub} ${it.be} ${it.rest}?`,
        `${pick(rand, ['Is', 'Are', 'Am'])} ${subQ} ${it.rest}?`,
        `${beCap} ${subQ} ${it.rest}.`
      ].filter((x) => x !== correct);
      return choiceOf(rand, correct, wrongs, {
        prompt: p(ctx, `把句子“${it.sub} ${it.be} ${it.rest}.”改为一般疑问句，正确的是？`),
        explain: `含有 be 动词的句子改疑问句时，把 ${it.be} 提到主语前。`, level: 3
      });
    }
  },
  {
    level: 3, ask: '改否定句',
    make(rand, ctx) {
      const it = pick(rand, BE_BANK);
      const correct = `${it.sub} ${it.be} not ${it.rest}.`;
      const wrongs = [
        `${it.sub} not ${it.be} ${it.rest}.`,
        `${it.sub} ${it.be} ${it.rest}.`,
        `${it.sub} don't ${it.be} ${it.rest}.`
      ];
      return choiceOf(rand, correct, wrongs, {
        prompt: p(ctx, `把句子“${it.sub} ${it.be} ${it.rest}.”改为否定句，正确的是？`),
        explain: `否定句在 be 动词后加 not：${correct}`, level: 3
      });
    }
  },
  {
    level: 2, ask: '问句应答',
    make(rand, ctx) {
      const it = pick(rand, QA_PAIRS);
      const wrongs = sample(rand, QA_PAIRS.filter((x) => x.a !== it.a).map((x) => x.a), 3);
      return choiceOf(rand, it.a, wrongs, {
        prompt: p(ctx, `问句“${it.q}”的正确回答是？`),
        explain: `${it.q} 的合适回答是 ${it.a}`, level: 2
      });
    }
  },
  {
    level: 2, ask: '单词排序',
    make(rand, ctx) {
      const it = pick(rand, ORDER_BANK);
      const correct = it.words.join(' ');
      const wrongs = [];
      for (let i = 0; i < 24 && wrongs.length < 3; i += 1) {
        const perm = shuffle(rand, it.words).join(' ');
        if (perm !== correct && !wrongs.includes(perm)) wrongs.push(perm);
      }
      if (wrongs.length < 3) return null;
      return choiceOf(rand, correct, wrongs, {
        prompt: p(ctx, `把单词排成一句话：${it.words.join(' / ')}`),
        explain: `正确语序是 ${correct}，意思是“${it.zh}”`, level: 2
      });
    }
  },
  {
    level: 2, ask: '句末标点',
    make(rand, ctx) {
      const it = pick(rand, PUNCT_BANK);
      // 选项写成「名称（符号）」，避免单独的“.”被数值检查当成数字
      const labels = { '.': '句号（.）', '?': '问号（?）', '!': '感叹号（!）' };
      const options = shuffle(rand, [labels['.'], labels['?'], labels['!']]);
      return {
        prompt: p(ctx, `句子“${it.text}”末尾应该用什么标点？`),
        type: 'choice', options, answer: options.indexOf(labels[it.mark]),
        explain: `该句应使用${labels[it.mark]}。`, level: 2
      };
    }
  },
  {
    level: 2, ask: '句首大写',
    make(rand, ctx) {
      const w = pick(rand, ['hello', 'school', 'panda', 'yellow', 'teacher', 'friend', 'family', 'morning']);
      const cap = w[0].toUpperCase() + w.slice(1);
      return choiceOf(rand, cap, [w, w.toUpperCase(), w.slice(1)], {
        prompt: p(ctx, `句子开头的单词“${w}”应该写成？`),
        explain: `句首单词首字母大写，应写成 ${cap}`, level: 2
      });
    }
  },
  {
    level: 3, ask: '找病句',
    make(rand, ctx) {
      const it = pick(rand, ERROR_BANK);
      return choiceOf(rand, it.correct, it.wrongs, {
        prompt: p(ctx, `下面哪一句没有错误？`),
        explain: `没有错误的句子是：${it.correct}`, level: 3
      });
    }
  },
  {
    level: 2, ask: '情景描述',
    make(rand, ctx) {
      const it = pick(rand, PREP_SCENES);
      const correct = it.zh;
      const wrongs = sample(rand, PREP_SCENES.filter((x) => x.zh !== it.zh).map((x) => x.zh), 3);
      const fullEn = it.en.replace('___', it.answer);
      return choiceOf(rand, correct, wrongs, {
        prompt: p(ctx, `句子“${fullEn}”描述的是？`),
        explain: `${fullEn} 的意思是“${it.zh}”`, level: 2
      });
    }
  }
];

/* ============================ 语法族 ============================ */

const beFor = (sub) => {
  if (sub === 'I') return 'am';
  if (['He', 'She', 'It', 'Tom', 'My mother', 'The cat'].includes(sub)) return 'is';
  return 'are';
};

export const EN_GRAMMAR_MODES = [
  {
    level: 2, ask: 'be 动词',
    make(rand, ctx) {
      const it = pick(rand, SUBJECT_BE);
      const wrongs = ['am', 'is', 'are', 'be'].filter((x) => x !== it.be);
      return choiceOf(rand, it.be, wrongs, {
        prompt: p(ctx, `选择正确的 be 动词：${it.sub} ___ ${it.pred}.`),
        explain: `${it.sub} 后面用 ${it.be}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '物主代词',
    make(rand, ctx) {
      const it = pick(rand, POSSESSIVES);
      const wrongs = otherThan(rand, [...new Set(POSSESSIVES.map((x) => x.word))], it.word, 3);
      return choiceOf(rand, it.word, wrongs, {
        prompt: p(ctx, `选择正确的物主代词：This is ___ book.（${it.hint}）`),
        explain: `${it.sub} 对应的物主代词是 ${it.word}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '名词复数',
    make(rand, ctx) {
      const it = pick(rand, PLURAL_BANK);
      const wrongs = [it.en, `${it.pl}s`, `${it.pl}es`, `${it.en}s`, `${it.en}es`];
      return choiceOf(rand, it.pl, wrongs, {
        prompt: p(ctx, `“${it.zh}”的英文单词复数形式是？`),
        explain: `${it.en} → ${it.pl}`, level: 2
      });
    }
  },
  {
    level: 2, ask: '冠词',
    make(rand, ctx) {
      const it = pick(rand, ARTICLE_NOUNS);
      const wrongs = ['a', 'an', 'the', 'some'].filter((x) => x !== it.art);
      return choiceOf(rand, it.art, wrongs, {
        prompt: p(ctx, `选择正确的冠词：I have ___ ${it.noun}.`),
        explain: `${it.noun} 前用 ${it.art}。`, level: 2
      });
    }
  },
  {
    level: 3, ask: '第三人称单数',
    make(rand, ctx) {
      const it = pick(rand, FORMS_BANK);
      const wrongs = [it.en, it.ing, `${it.en}s`, `${it.en}es`];
      return choiceOf(rand, it.third, wrongs, {
        prompt: p(ctx, `选择正确的形式：He ___ every day.（${it.zh}）`),
        explain: `主语是第三人称单数时用 ${it.third}。`, level: 3
      });
    }
  },
  {
    level: 3, ask: '现在进行时',
    make(rand, ctx) {
      const it = pick(rand, PROGRESSIVE_FILLS);
      const be = beFor(it.sub);
      const correct = `${be} ${it.ing}`;
      const wrongs = [it.en, it.ing, `${be} ${it.en}`];
      return choiceOf(rand, correct, wrongs, {
        prompt: p(ctx, `选择正确的形式：Look! ${it.sub} ___ ${it.obj}.`),
        explain: `现在进行时是 be + 动词 ing：${correct}。`, level: 3
      });
    }
  },
  {
    level: 3, ask: '一般过去时',
    make(rand, ctx) {
      const it = pick(rand, PAST_FILLS);
      const wrongs = [it.en, `${it.en}ed`, `${it.en}ing`, `${it.en}s`];
      return choiceOf(rand, it.past, wrongs, {
        prompt: p(ctx, `选择正确的形式：${it.sub} ___ ${it.obj} ${it.when}.`),
        explain: `${it.when} 表示过去，用过去式 ${it.past}。`, level: 3
      });
    }
  },
  {
    level: 3, ask: '一般将来时',
    make(rand, ctx) {
      const it = pick(rand, FUTURE_FILLS);
      return choiceOf(rand, 'will', ['am', 'was', 'do'], {
        prompt: p(ctx, `选择正确的形式：${it.sub} ___ ${it.act} ${it.when}.`),
        explain: `${it.when} 表示将来，用 will。`, level: 3
      });
    }
  },
  {
    level: 2, ask: '介词',
    make(rand, ctx) {
      const it = pick(rand, PREP_SCENES);
      return choiceOf(rand, it.answer, it.wrongs, {
        prompt: p(ctx, `${it.zh}选择正确的介词：${it.en}`),
        explain: `${it.zh} 对应 ${it.answer}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '疑问词',
    make(rand, ctx) {
      const it = pick(rand, QUESTION_WORDS);
      return choiceOf(rand, it.a, it.wrongs, {
        prompt: p(ctx, `选择正确的疑问词：${it.q}`),
        explain: `该句用疑问词 ${it.a}。`, level: 2
      });
    }
  },
  {
    level: 3, ask: '比较级',
    make(rand, ctx) {
      const it = pick(rand, COMPARATIVES);
      return choiceOf(rand, it.comp, it.wrongs, {
        prompt: p(ctx, `选择正确的比较级：${it.adj} → ___`),
        explain: `${it.adj} 的比较级是 ${it.comp}。`, level: 3
      });
    }
  },
  {
    level: 3, ask: '情态动词',
    make(rand, ctx) {
      const it = pick(rand, MODAL_FILLS);
      return choiceOf(rand, it.answer, it.wrongs, {
        prompt: p(ctx, `${it.extra} You ___ ${it.act}.`),
        explain: `根据句意应填 ${it.answer}。`, level: 3
      });
    }
  }
];

/* ============================ 交际族 ============================ */

export const EN_DIALOGUE_MODES = [
  {
    level: 1, ask: '问候场景',
    make(rand, ctx) {
      const it = pick(rand, GREET_SCENES);
      const wrongs = sample(rand, GREET_SCENES.filter((x) => x.a !== it.a).map((x) => x.a), 3);
      return choiceOf(rand, it.a, wrongs, {
        prompt: p(ctx, it.zh),
        explain: `该场景应说 ${it.a}`, level: 1
      });
    }
  },
  {
    level: 1, ask: '询问姓名',
    make(rand, ctx) {
      const asker = pick(rand, D_NAMES);
      const answer = pick(rand, D_NAMES.filter((x) => x !== asker));
      return choiceOf(rand, `My name is ${answer}.`, ['I am fine, thank you.', 'It is red.', 'Seven.'], {
        prompt: p(ctx, `${asker} 问：“What's your name?” 你应该回答？`),
        explain: `问姓名时回答 My name is ...`, level: 1
      });
    }
  },
  {
    level: 1, ask: '询问年龄',
    make(rand, ctx) {
      const asker = pick(rand, D_NAMES);
      const age = pick(rand, D_AGES);
      return choiceOf(rand, `I am ${age}.`, ['My name is Tom.', 'It is red.', 'Thank you.'], {
        prompt: p(ctx, `${asker} 问：“How old are you?” 你应该回答？`),
        explain: `问年龄时回答 I am ...`, level: 1
      });
    }
  },
  {
    level: 1, ask: '询问颜色',
    make(rand, ctx) {
      const asker = pick(rand, D_NAMES);
      const color = pick(rand, D_COLORS);
      return choiceOf(rand, `It's ${color}.`, ['It is sunny.', 'I am seven.', 'My name is Tom.'], {
        prompt: p(ctx, `${asker} 问：“What colour is the apple?” 你应该回答？`),
        explain: `问颜色时回答 It's ...`, level: 1
      });
    }
  },
  {
    level: 2, ask: '询问数量',
    make(rand, ctx) {
      const asker = pick(rand, D_NAMES);
      const n = pick(rand, D_COUNTS);
      return choiceOf(rand, `${n}.`, ['It is blue.', 'I am fine.', 'My name is Tom.'], {
        prompt: p(ctx, `${asker} 问：“How many books do you have?” 你应该回答？`),
        explain: `问数量时直接回答数字，如 ${n}。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '询问时间',
    make(rand, ctx) {
      const asker = pick(rand, D_NAMES);
      const t = pick(rand, D_TIMES);
      return choiceOf(rand, `It's ${t}.`, ['It is sunny.', 'It is red.', 'My name is Tom.'], {
        prompt: p(ctx, `${asker} 问：“What time is it?” 你应该回答？`),
        explain: `问时间时回答 It's ...`, level: 2
      });
    }
  },
  {
    level: 2, ask: '询问天气',
    make(rand, ctx) {
      const asker = pick(rand, D_NAMES);
      const w = pick(rand, D_WEATHERS);
      return choiceOf(rand, `It's ${w}.`, ['It is red.', "It is seven o'clock.", 'My name is Tom.'], {
        prompt: p(ctx, `${asker} 问：“How's the weather?” 你应该回答？`),
        explain: `问天气时回答 It's ...`, level: 2
      });
    }
  },
  {
    level: 2, ask: '提供物品',
    make(rand, ctx) {
      const asker = pick(rand, D_NAMES);
      return choiceOf(rand, 'Yes, please.', ['Yes, I do.', 'No, I am not.', "You're welcome."], {
        prompt: p(ctx, `${asker} 想给你一些苹果，问：“Would you like some apples?” 你接受时回答？`),
        explain: `接受别人给的东西时说 Yes, please.`, level: 2
      });
    }
  },
  {
    level: 2, ask: '询问地点',
    make(rand, ctx) {
      const asker = pick(rand, D_NAMES);
      const loc = pick(rand, D_LOCATIONS);
      return choiceOf(rand, `It's ${loc}.`, ['It is red.', 'I am seven.', 'Thank you.'], {
        prompt: p(ctx, `${asker} 问：“Where is my book?” 你应该回答？`),
        explain: `问地点时回答 It's + 地点。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '询问正在做什么',
    make(rand, ctx) {
      const asker = pick(rand, D_NAMES);
      const doing = pick(rand, D_DOINGS);
      return choiceOf(rand, `I am ${doing}.`, ['It is blue.', 'I am seven.', 'Yes, please.'], {
        prompt: p(ctx, `${asker} 问：“What are you doing?” 你应该回答？`),
        explain: `问正在做什么时回答 I am + 动词 ing。`, level: 2
      });
    }
  },
  {
    level: 2, ask: '礼貌用语',
    make(rand, ctx) {
      const it = pick(rand, POLITE_PAIRS);
      const wrongs = sample(rand, POLITE_PAIRS.filter((x) => x.a !== it.a).map((x) => x.a), 3);
      return choiceOf(rand, it.a, wrongs, {
        prompt: p(ctx, `${pick(rand, D_NAMES)} 对你说：“${it.q}” 你应该回答？`),
        explain: `${it.q} 的合适回答是 ${it.a}`, level: 2
      });
    }
  },
  {
    level: 2, ask: '询问职业',
    make(rand, ctx) {
      const asker = pick(rand, D_NAMES);
      const job = pick(rand, JOBS);
      return choiceOf(rand, `He is a ${job}.`, otherThan(rand, JOBS.map((x) => `He is a ${x}.`), `He is a ${job}.`, 3), {
        prompt: p(ctx, `你爸爸是${JOBS_ZH[job]}。${asker} 问：“What does your father do?” 你应该回答？`),
        explain: `问职业时回答 He is a ...`, level: 2
      });
    }
  }
];
