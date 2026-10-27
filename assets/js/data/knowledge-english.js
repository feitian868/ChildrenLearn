/**
 * knowledge-english.js —— 英语知识点池
 * 每级 24 条静态题 + 每日参数化生成题；
 * type: choice（answer 为下标）| judge（answer 为布尔）| match（pairs 配对）| order（tiles 排序）
 * 出处标注人教社教材（新起点 / PEP）册次与单元主题，便于家长核对。
 */

import { shuffle, hashString, pick, sample } from '../core/rng.js';

const e = (id, grade, level, topic, type, prompt, options, answer, explain, source, extra = {}) => ({
  id: `en-${id}`,
  subject: 'english',
  grade,
  level,
  topic,
  type,
  prompt,
  ...(options ? { options } : {}),
  ...(answer !== null && answer !== undefined ? { answer } : {}),
  explain,
  source,
  ...extra
});

const J1A = '人教新起点英语一年级上册';
const J1B = '人教新起点英语一年级下册';
const J2A = '人教新起点英语二年级上册';
const J2B = '人教新起点英语二年级下册';
const P3A = '人教PEP英语三年级上册';
const P3B = '人教PEP英语三年级下册';
const P4A = '人教PEP英语四年级上册';
const P4B = '人教PEP英语四年级下册';
const P5A = '人教PEP英语五年级上册';
const P5B = '人教PEP英语五年级下册';
const P6A = '人教PEP英语六年级上册';
const P6B = '人教PEP英语六年级下册';

export const ENGLISH_BANK = [
  /* ---------------- 一年级 ---------------- */
  e('g1-01', 1, 1, '问候', 'choice', '“hello”是什么意思？', ['你好', '再见', '谢谢', '对不起'], 0,
    'hello 是最常用的问候语，意思是“你好”。', `${J1A} · Hello!`, { speak: 'hello' }),
  e('g1-02', 1, 1, '问候', 'choice', '“goodbye”是什么意思？', ['你好', '再见', '请', '谢谢'], 1,
    'goodbye 意思是“再见”。', `${J1A} · Hello!`, { speak: 'goodbye' }),
  e('g1-03', 1, 1, '家庭成员', 'choice', '“mum”是什么意思？', ['爸爸', '妈妈', '哥哥', '弟弟'], 1,
    'mum 意思是“妈妈”，美式英语中也写作 mom。', `${J1A} · My Family`, { speak: 'mum' }),
  e('g1-04', 1, 1, '家庭成员', 'choice', '“dad”是什么意思？', ['妈妈', '爸爸', '姐姐', '妹妹'], 1,
    'dad 意思是“爸爸”。', `${J1A} · My Family`, { speak: 'dad' }),
  e('g1-05', 1, 1, '动物', 'choice', '“cat”是什么意思？', ['狗', '猫', '鸟', '鱼'], 1,
    'cat 意思是“猫”。', `${J1A} · Animals`, { speak: 'cat' }),
  e('g1-06', 1, 1, '动物', 'choice', '“dog”是什么意思？', ['猫', '狗', '鸟', '鱼'], 1,
    'dog 意思是“狗”。', `${J1A} · Animals`, { speak: 'dog' }),
  e('g1-07', 1, 1, '动物', 'choice', '“bird”是什么意思？', ['鸟', '鱼', '猫', '狗'], 0,
    'bird 意思是“鸟”。', `${J1A} · Animals`, { speak: 'bird' }),
  e('g1-08', 1, 1, '动物', 'choice', '“fish”是什么意思？', ['鱼', '鸟', '猫', '狗'], 0,
    'fish 意思是“鱼”，复数是 fish 或 fishes。', `${J1A} · Animals`, { speak: 'fish' }),
  e('g1-09', 1, 1, '颜色', 'choice', '“red”是什么颜色？', ['红色', '蓝色', '黄色', '绿色'], 0,
    'red 是红色。', `${J1A} · Colours`, { speak: 'red' }),
  e('g1-10', 1, 1, '颜色', 'choice', '“blue”是什么颜色？', ['红色', '蓝色', '黄色', '绿色'], 1,
    'blue 是蓝色。', `${J1A} · Colours`, { speak: 'blue' }),
  e('g1-11', 1, 1, '颜色', 'choice', '“yellow”是什么颜色？', ['红色', '蓝色', '黄色', '绿色'], 2,
    'yellow 是黄色。', `${J1A} · Colours`, { speak: 'yellow' }),
  e('g1-12', 1, 1, '颜色', 'choice', '“green”是什么颜色？', ['红色', '蓝色', '黄色', '绿色'], 3,
    'green 是绿色。', `${J1A} · Colours`, { speak: 'green' }),
  e('g1-13', 1, 1, '数字', 'choice', '“one”是数字几？', ['1', '2', '3', '4'], 0,
    'one 是 1。', `${J1A} · Numbers`, { speak: 'one' }),
  e('g1-14', 1, 1, '数字', 'choice', '“two”是数字几？', ['1', '2', '3', '4'], 1,
    'two 是 2。', `${J1A} · Numbers`, { speak: 'two' }),
  e('g1-15', 1, 1, '数字', 'choice', '“three”是数字几？', ['1', '2', '3', '4'], 2,
    'three 是 3。', `${J1A} · Numbers`, { speak: 'three' }),
  e('g1-16', 1, 2, '情景对话', 'choice', '—Hello! —___', ['Hello!', 'Goodbye!', 'Thank you!', 'Sorry!'], 0,
    '别人说 Hello 时，也回答 Hello。', `${J1A} · Hello!`),
  e('g1-17', 1, 2, '情景对话', 'choice', '—Good morning! —___', ['Good morning!', 'Good night!', 'Goodbye!', 'Thank you!'], 0,
    '早上问好要用 Good morning。', `${J1A} · Good Morning`),
  e('g1-18', 1, 2, '情景对话', 'choice', '—How are you? —___', ['I am fine, thank you.', 'Goodbye.', 'Good night.', 'You are welcome.'], 0,
    'How are you 是问身体怎么样，回答 I am fine, thank you.', `${J1A} · How Are You?`),
  e('g1-19', 1, 2, '情景对话', 'choice', '—What is your name? —___', ['My name is Tom.', 'I am fine.', 'Good morning.', 'Thank you.'], 0,
    '问名字用 What is your name，答 My name is...', `${J1A} · What Is Your Name?`),
  e('g1-20', 1, 2, '情景对话', 'choice', '—How old are you? —___', ['I am six.', 'I am fine.', 'My name is Lily.', 'Goodbye.'], 0,
    'How old are you 问年龄，答 I am six（我六岁）。', `${J1A} · How Old Are You?`),
  e('g1-21', 1, 2, '数字配对', 'match', '把数字和英文配成对', null, null,
    'one=1，two=2，three=3，four=4。', `${J1A} · Numbers`, {
      pairs: [{ a: 'one', b: '1' }, { a: 'two', b: '2' }, { a: 'three', b: '3' }, { a: 'four', b: '4' }]
    }),
  e('g1-22', 1, 2, '颜色配对', 'match', '把颜色英文和中文配成对', null, null,
    'red=红色，blue=蓝色，yellow=黄色，green=绿色。', `${J1A} · Colours`, {
      pairs: [{ a: 'red', b: '红色' }, { a: 'blue', b: '蓝色' }, { a: 'yellow', b: '黄色' }, { a: 'green', b: '绿色' }]
    }),
  e('g1-23', 1, 2, '拼写', 'order', '按顺序点字母，拼出“猫”的英文', null, 'cat',
    '猫的英文是 cat，字母顺序 c-a-t。', `${J1A} · Animals`, { tiles: ['c', 'a', 't'] }),
  e('g1-24', 1, 2, '拼写', 'order', '按顺序点字母，拼出“狗”的英文', null, 'dog',
    '狗的英文是 dog，字母顺序 d-o-g。', `${J1A} · Animals`, { tiles: ['d', 'o', 'g'] }),

  /* ---------------- 二年级 ---------------- */
  e('g2-01', 2, 1, '身体部位', 'choice', '“head”是什么意思？', ['头', '手', '脚', '眼睛'], 0,
    'head 是头。', `${J2A} · My Body`, { speak: 'head' }),
  e('g2-02', 2, 1, '身体部位', 'choice', '“hand”是什么意思？', ['头', '手', '脚', '耳朵'], 1,
    'hand 是手。', `${J2A} · My Body`, { speak: 'hand' }),
  e('g2-03', 2, 1, '身体部位', 'choice', '“foot”是什么意思？', ['头', '手', '脚', '鼻子'], 2,
    'foot 是脚，复数是 feet。', `${J2A} · My Body`, { speak: 'foot' }),
  e('g2-04', 2, 1, '身体部位', 'choice', '“eye”是什么意思？', ['眼睛', '耳朵', '鼻子', '嘴'], 0,
    'eye 是眼睛，复数是 eyes。', `${J2A} · My Body`, { speak: 'eye' }),
  e('g2-05', 2, 1, '身体部位', 'choice', '“ear”是什么意思？', ['眼睛', '耳朵', '鼻子', '嘴'], 1,
    'ear 是耳朵。', `${J2A} · My Body`, { speak: 'ear' }),
  e('g2-06', 2, 1, '身体部位', 'choice', '“nose”是什么意思？', ['眼睛', '耳朵', '鼻子', '嘴'], 2,
    'nose 是鼻子。', `${J2A} · My Body`, { speak: 'nose' }),
  e('g2-07', 2, 1, '身体部位', 'choice', '“mouth”是什么意思？', ['眼睛', '耳朵', '鼻子', '嘴'], 3,
    'mouth 是嘴。', `${J2A} · My Body`, { speak: 'mouth' }),
  e('g2-08', 2, 1, '身体部位', 'choice', '“arm”是什么意思？', ['胳膊', '腿', '手', '脚'], 0,
    'arm 是胳膊。', `${J2A} · My Body`, { speak: 'arm' }),
  e('g2-09', 2, 1, '身体部位', 'choice', '“leg”是什么意思？', ['胳膊', '腿', '手', '头'], 1,
    'leg 是腿。', `${J2A} · My Body`, { speak: 'leg' }),
  e('g2-10', 2, 1, '水果', 'choice', '“apple”是什么意思？', ['苹果', '香蕉', '梨', '橙子'], 0,
    'apple 是苹果。', `${J2A} · Fruit`, { speak: 'apple' }),
  e('g2-11', 2, 1, '水果', 'choice', '“banana”是什么意思？', ['苹果', '香蕉', '梨', '橙子'], 1,
    'banana 是香蕉。', `${J2A} · Fruit`, { speak: 'banana' }),
  e('g2-12', 2, 1, '水果', 'choice', '“pear”是什么意思？', ['苹果', '香蕉', '梨', '橙子'], 2,
    'pear 是梨。', `${J2A} · Fruit`, { speak: 'pear' }),
  e('g2-13', 2, 1, '水果', 'choice', '“orange”是什么意思？', ['苹果', '香蕉', '梨', '橙子'], 3,
    'orange 是橙子，也可以表示橙色。', `${J2A} · Fruit`, { speak: 'orange' }),
  e('g2-14', 2, 1, '食物', 'choice', '“milk”是什么意思？', ['牛奶', '水', '面包', '米饭'], 0,
    'milk 是牛奶。', `${J2A} · Food`, { speak: 'milk' }),
  e('g2-15', 2, 1, '食物', 'choice', '“bread”是什么意思？', ['牛奶', '水', '面包', '米饭'], 2,
    'bread 是面包。', `${J2A} · Food`, { speak: 'bread' }),
  e('g2-16', 2, 1, '食物', 'choice', '“water”是什么意思？', ['牛奶', '水', '面包', '米饭'], 1,
    'water 是水。', `${J2A} · Food`, { speak: 'water' }),
  e('g2-17', 2, 1, '文具', 'choice', '“book”是什么意思？', ['书', '钢笔', '尺子', '书包'], 0,
    'book 是书。', `${J2A} · School Things`, { speak: 'book' }),
  e('g2-18', 2, 1, '文具', 'choice', '“pen”是什么意思？', ['书', '钢笔', '尺子', '书包'], 1,
    'pen 是钢笔。', `${J2A} · School Things`, { speak: 'pen' }),
  e('g2-19', 2, 1, '文具', 'choice', '“ruler”是什么意思？', ['书', '钢笔', '尺子', '书包'], 2,
    'ruler 是尺子。', `${J2A} · School Things`, { speak: 'ruler' }),
  e('g2-20', 2, 1, '文具', 'choice', '“bag”是什么意思？', ['书', '钢笔', '尺子', '书包'], 3,
    'bag 是包，schoolbag 是书包。', `${J2A} · School Things`, { speak: 'bag' }),
  e('g2-21', 2, 2, '情景对话', 'choice', '—What is this? —___', ['It is a cat.', 'They are cats.', 'I am a cat.', 'Yes, it is.'], 0,
    '问“这是什么”用 What is this，答 It is a cat（这是一只猫）。', `${J2A} · What Is This?`),
  e('g2-22', 2, 2, '情景对话', 'choice', '—How many books? —___', ['Five.', 'It is a book.', 'Yes, it is.', 'Thank you.'], 0,
    'How many 问数量，答 Five（五本）。', `${J2B} · How Many?`),
  e('g2-23', 2, 2, '身体配对', 'match', '把身体部位英文和中文配成对', null, null,
    'eye=眼睛，ear=耳朵，nose=鼻子，mouth=嘴。', `${J2A} · My Body`, {
      pairs: [{ a: 'eye', b: '眼睛' }, { a: 'ear', b: '耳朵' }, { a: 'nose', b: '鼻子' }, { a: 'mouth', b: '嘴' }]
    }),
  e('g2-24', 2, 2, '拼写', 'order', '按顺序点字母，拼出“学校”的英文', null, 'school',
    '学校的英文是 school，字母顺序 s-c-h-o-o-l。', `${J2A} · School`, {
      tiles: ['s', 'c', 'h', 'o', 'o', 'l']
    }),

  /* ---------------- 三年级 ---------------- */
  e('g3-01', 3, 1, '问候', 'choice', '“good afternoon”是什么意思？', ['早上好', '下午好', '晚上好', '晚安'], 1,
    'afternoon 是下午，good afternoon 是下午好。', `${P3A} · Unit 1 Hello!`, { speak: 'good afternoon' }),
  e('g3-02', 3, 1, '文具', 'choice', '“pencil”是什么意思？', ['铅笔', '钢笔', '尺子', '橡皮'], 0,
    'pencil 是铅笔。', `${P3A} · Unit 1 Hello!`, { speak: 'pencil' }),
  e('g3-03', 3, 1, '文具', 'choice', '“eraser”是什么意思？', ['铅笔', '钢笔', '尺子', '橡皮'], 3,
    'eraser 是橡皮。', `${P3A} · Unit 1 Hello!`, { speak: 'eraser' }),
  e('g3-04', 3, 1, '文具', 'choice', '“crayon”是什么意思？', ['蜡笔', '钢笔', '尺子', '橡皮'], 0,
    'crayon 是蜡笔。', `${P3A} · Unit 1 Hello!`, { speak: 'crayon' }),
  e('g3-05', 3, 1, '文具', 'choice', '“ruler”是什么意思？', ['铅笔', '钢笔', '尺子', '橡皮', '蜡笔'], 2,
    'ruler 是尺子。', `${P3A} · Unit 1 Hello!`, { speak: 'ruler' }),
  e('g3-06', 3, 1, '颜色', 'choice', '“brown”是什么颜色？', ['棕色', '黑色', '白色', '橙色'], 0,
    'brown 是棕色。', `${P3A} · Unit 2 Colours`, { speak: 'brown' }),
  e('g3-07', 3, 1, '颜色', 'choice', '“black”是什么颜色？', ['棕色', '黑色', '白色', '橙色'], 1,
    'black 是黑色。', `${P3A} · Unit 2 Colours`, { speak: 'black' }),
  e('g3-08', 3, 1, '颜色', 'choice', '“white”是什么颜色？', ['棕色', '黑色', '白色', '橙色'], 2,
    'white 是白色。', `${P3A} · Unit 2 Colours`, { speak: 'white' }),
  e('g3-09', 3, 1, '动物', 'choice', '“panda”是什么意思？', ['熊猫', '猴子', '大象', '老虎'], 0,
    'panda 是熊猫。', `${P3A} · Unit 4 We Love Animals`, { speak: 'panda' }),
  e('g3-10', 3, 1, '动物', 'choice', '“monkey”是什么意思？', ['熊猫', '猴子', '大象', '老虎'], 1,
    'monkey 是猴子。', `${P3A} · Unit 4 We Love Animals`, { speak: 'monkey' }),
  e('g3-11', 3, 1, '动物', 'choice', '“elephant”是什么意思？', ['熊猫', '猴子', '大象', '老虎'], 2,
    'elephant 是大象。', `${P3A} · Unit 4 We Love Animals`, { speak: 'elephant' }),
  e('g3-12', 3, 1, '动物', 'choice', '“tiger”是什么意思？', ['熊猫', '猴子', '大象', '老虎'], 3,
    'tiger 是老虎。', `${P3A} · Unit 4 We Love Animals`, { speak: 'tiger' }),
  e('g3-13', 3, 1, '食物', 'choice', '“egg”是什么意思？', ['鸡蛋', '面包', '牛奶', '水'], 0,
    'egg 是鸡蛋。', `${P3A} · Unit 5 Let Us Eat`, { speak: 'egg' }),
  e('g3-14', 3, 1, '食物', 'choice', '“bread”是什么意思？', ['鸡蛋', '面包', '牛奶', '水'], 1,
    'bread 是面包。', `${P3A} · Unit 5 Let Us Eat`, { speak: 'bread' }),
  e('g3-15', 3, 1, '食物', 'choice', '“juice”是什么意思？', ['果汁', '牛奶', '水', '茶'], 0,
    'juice 是果汁。', `${P3A} · Unit 5 Let Us Eat`, { speak: 'juice' }),
  e('g3-16', 3, 1, '食物', 'choice', '“cake”是什么意思？', ['蛋糕', '面包', '牛奶', '鸡蛋'], 0,
    'cake 是蛋糕。', `${P3A} · Unit 6 Happy Birthday!`, { speak: 'cake' }),
  e('g3-17', 3, 2, '情景对话', 'choice', '—What is your name? —___', ['My name is Amy.', 'I am nine.', 'It is a pen.', 'Goodbye.'], 0,
    '问名字答 My name is Amy。', `${P3A} · Unit 1 Hello!`),
  e('g3-18', 3, 2, '情景对话', 'choice', '—How old are you? —___', ['I am nine years old.', 'My name is John.', 'It is red.', 'I am fine.'], 0,
    'How old are you 问年龄，答 I am nine years old。', `${P3A} · Unit 6 Happy Birthday!`),
  e('g3-19', 3, 2, '情景对话', 'choice', '—Where is my pencil? —___', ['It is in your bag.', 'I am nine.', 'They are pandas.', 'Yes, it is.'], 0,
    'Where 问地点，答 It is in your bag（在你的书包里）。', `${P3B} · Unit 4 Where Is My Car?`),
  e('g3-20', 3, 2, '情景对话', 'choice', '—Do you like apples? —___', ['Yes, I do.', 'Yes, I am.', 'Yes, it is.', 'Yes, I can.'], 0,
    'Do you like...? 的回答用 Yes, I do. 或 No, I do not.', `${P3B} · Unit 5 Do You Like Pears?`),
  e('g3-21', 3, 2, '动物配对', 'match', '把动物英文和中文配成对', null, null,
    'panda=熊猫，monkey=猴子，elephant=大象，tiger=老虎。', `${P3A} · Unit 4 We Love Animals`, {
      pairs: [{ a: 'panda', b: '熊猫' }, { a: 'monkey', b: '猴子' }, { a: 'elephant', b: '大象' }, { a: 'tiger', b: '老虎' }]
    }),
  e('g3-22', 3, 2, '拼写', 'order', '按顺序点字母，拼出“熊猫”的英文', null, 'panda',
    '熊猫的英文是 panda，字母顺序 p-a-n-d-a。', `${P3A} · Unit 4 We Love Animals`, {
      tiles: ['p', 'a', 'n', 'd', 'a']
    }),
  e('g3-23', 3, 2, '拼写', 'order', '按顺序点字母，拼出“橡皮”的英文', null, 'eraser',
    '橡皮的英文是 eraser，字母顺序 e-r-a-s-e-r。', `${P3A} · Unit 1 Hello!`, {
      tiles: ['e', 'r', 'a', 's', 'e', 'r']
    }),
  e('g3-24', 3, 2, '数字', 'choice', '“twelve”是数字几？', ['10', '11', '12', '20'], 2,
    'twelve 是 12。', `${P3A} · Unit 6 Happy Birthday!`, { speak: 'twelve' }),

  /* ---------------- 四年级 ---------------- */
  e('g4-01', 4, 1, '教室', 'choice', '“classroom”是什么意思？', ['教室', '窗户', '门', '课桌'], 0,
    'classroom 是教室。', `${P4A} · Unit 1 My Classroom`, { speak: 'classroom' }),
  e('g4-02', 4, 1, '教室', 'choice', '“window”是什么意思？', ['教室', '窗户', '门', '课桌'], 1,
    'window 是窗户。', `${P4A} · Unit 1 My Classroom`, { speak: 'window' }),
  e('g4-03', 4, 1, '教室', 'choice', '“door”是什么意思？', ['教室', '窗户', '门', '课桌'], 2,
    'door 是门。', `${P4A} · Unit 1 My Classroom`, { speak: 'door' }),
  e('g4-04', 4, 1, '教室', 'choice', '“desk”是什么意思？', ['椅子', '课桌', '黑板', '灯'], 1,
    'desk 是课桌。', `${P4A} · Unit 1 My Classroom`, { speak: 'desk' }),
  e('g4-05', 4, 1, '教室', 'choice', '“chair”是什么意思？', ['椅子', '课桌', '黑板', '灯'], 0,
    'chair 是椅子。', `${P4A} · Unit 1 My Classroom`, { speak: 'chair' }),
  e('g4-06', 4, 1, '书包', 'choice', '“storybook”是什么意思？', ['故事书', '笔记本', '糖果', '钥匙'], 0,
    'storybook 是故事书。', `${P4A} · Unit 2 My Schoolbag`, { speak: 'storybook' }),
  e('g4-07', 4, 1, '书包', 'choice', '“candy”是什么意思？', ['故事书', '笔记本', '糖果', '钥匙'], 2,
    'candy 是糖果。', `${P4A} · Unit 2 My Schoolbag`, { speak: 'candy' }),
  e('g4-08', 4, 1, '书包', 'choice', '“notebook”是什么意思？', ['故事书', '笔记本', '糖果', '钥匙'], 1,
    'notebook 是笔记本。', `${P4A} · Unit 2 My Schoolbag`, { speak: 'notebook' }),
  e('g4-09', 4, 1, '书包', 'choice', '“key”是什么意思？', ['故事书', '笔记本', '糖果', '钥匙'], 3,
    'key 是钥匙。', `${P4A} · Unit 2 My Schoolbag`, { speak: 'key' }),
  e('g4-10', 4, 1, '朋友', 'choice', '“strong”是什么意思？', ['强壮的', '友好的', '安静的', '瘦小的'], 0,
    'strong 是强壮的。', `${P4A} · Unit 3 My Friends`, { speak: 'strong' }),
  e('g4-11', 4, 1, '朋友', 'choice', '“friendly”是什么意思？', ['强壮的', '友好的', '安静的', '瘦小的'], 1,
    'friendly 是友好的。', `${P4A} · Unit 3 My Friends`, { speak: 'friendly' }),
  e('g4-12', 4, 1, '朋友', 'choice', '“quiet”是什么意思？', ['强壮的', '友好的', '安静的', '瘦小的'], 2,
    'quiet 是安静的。', `${P4A} · Unit 3 My Friends`, { speak: 'quiet' }),
  e('g4-13', 4, 1, '房间', 'choice', '“bedroom”是什么意思？', ['卧室', '厨房', '浴室', '客厅'], 0,
    'bedroom 是卧室。', `${P4A} · Unit 4 My Home`, { speak: 'bedroom' }),
  e('g4-14', 4, 1, '房间', 'choice', '“kitchen”是什么意思？', ['卧室', '厨房', '浴室', '客厅'], 1,
    'kitchen 是厨房。', `${P4A} · Unit 4 My Home`, { speak: 'kitchen' }),
  e('g4-15', 4, 1, '房间', 'choice', '“bathroom”是什么意思？', ['卧室', '厨房', '浴室', '客厅'], 2,
    'bathroom 是浴室。', `${P4A} · Unit 4 My Home`, { speak: 'bathroom' }),
  e('g4-16', 4, 1, '房间', 'choice', '“living room”是什么意思？', ['卧室', '厨房', '浴室', '客厅'], 3,
    'living room 是客厅。', `${P4A} · Unit 4 My Home`, { speak: 'living room' }),
  e('g4-17', 4, 1, '天气', 'choice', '“sunny”是什么意思？', ['晴朗的', '下雨的', '有风的', '多云的'], 0,
    'sunny 是晴朗的。', `${P4B} · Unit 3 Weather`, { speak: 'sunny' }),
  e('g4-18', 4, 1, '天气', 'choice', '“rainy”是什么意思？', ['晴朗的', '下雨的', '有风的', '多云的'], 1,
    'rainy 是下雨的。', `${P4B} · Unit 3 Weather`, { speak: 'rainy' }),
  e('g4-19', 4, 1, '天气', 'choice', '“windy”是什么意思？', ['晴朗的', '下雨的', '有风的', '多云的'], 2,
    'windy 是有风的。', `${P4B} · Unit 3 Weather`, { speak: 'windy' }),
  e('g4-20', 4, 1, '天气', 'choice', '“cloudy”是什么意思？', ['晴朗的', '下雨的', '有风的', '多云的'], 3,
    'cloudy 是多云的。', `${P4B} · Unit 3 Weather`, { speak: 'cloudy' }),
  e('g4-21', 4, 2, '情景对话', 'choice', '—What time is it? —___', ['It is nine o clock.', 'It is sunny.', 'I am nine.', 'There are nine.'], 0,
    '问时间答 It is nine o clock（九点了）。', `${P4B} · Unit 2 What Time Is It?`),
  e('g4-22', 4, 2, '情景对话', 'choice', '—How many horses? —___', ['Twelve.', 'It is twelve.', 'Yes, it is.', 'I am twelve.'], 0,
    'How many 问数量，答 Twelve。', `${P4B} · Unit 4 At the Farm`),
  e('g4-23', 4, 2, '房间配对', 'match', '把房间英文和中文配成对', null, null,
    'bedroom=卧室，kitchen=厨房，bathroom=浴室，living room=客厅。', `${P4A} · Unit 4 My Home`, {
      pairs: [{ a: 'bedroom', b: '卧室' }, { a: 'kitchen', b: '厨房' }, { a: 'bathroom', b: '浴室' }, { a: 'living room', b: '客厅' }]
    }),
  e('g4-24', 4, 2, '拼写', 'order', '按顺序点字母，拼出“天气”的英文', null, 'weather',
    '天气的英文是 weather，字母顺序 w-e-a-t-h-e-r。', `${P4B} · Unit 3 Weather`, {
      tiles: ['w', 'e', 'a', 't', 'h', 'e', 'r']
    }),

  /* ---------------- 五年级 ---------------- */
  e('g5-01', 5, 1, '人物性格', 'choice', '“funny”是什么意思？', ['滑稽的', '严格的', '和善的', '勤奋的'], 0,
    'funny 是好笑的、滑稽的。', `${P5A} · Unit 1 What Is He Like?`, { speak: 'funny' }),
  e('g5-02', 5, 1, '人物性格', 'choice', '“strict”是什么意思？', ['滑稽的', '严格的', '和善的', '勤奋的'], 1,
    'strict 是严格的。', `${P5A} · Unit 1 What Is He Like?`, { speak: 'strict' }),
  e('g5-03', 5, 1, '人物性格', 'choice', '“kind”是什么意思？', ['滑稽的', '严格的', '和善的', '勤奋的'], 2,
    'kind 是和善的、亲切的。', `${P5A} · Unit 1 What Is He Like?`, { speak: 'kind' }),
  e('g5-04', 5, 1, '人物性格', 'choice', '“hard-working”是什么意思？', ['滑稽的', '严格的', '和善的', '勤奋的'], 3,
    'hard-working 是勤奋的。', `${P5A} · Unit 1 What Is He Like?`, { speak: 'hard-working' }),
  e('g5-05', 5, 1, '食物', 'choice', '“sandwich”是什么意思？', ['三明治', '沙拉', '汉堡包', '冰淇淋'], 0,
    'sandwich 是三明治。', `${P5A} · Unit 3 What Would You Like?`, { speak: 'sandwich' }),
  e('g5-06', 5, 1, '食物', 'choice', '“salad”是什么意思？', ['三明治', '沙拉', '汉堡包', '冰淇淋'], 1,
    'salad 是沙拉。', `${P5A} · Unit 3 What Would You Like?`, { speak: 'salad' }),
  e('g5-07', 5, 1, '食物', 'choice', '“hamburger”是什么意思？', ['三明治', '沙拉', '汉堡包', '冰淇淋'], 2,
    'hamburger 是汉堡包。', `${P5A} · Unit 3 What Would You Like?`, { speak: 'hamburger' }),
  e('g5-08', 5, 1, '食物', 'choice', '“ice cream”是什么意思？', ['三明治', '沙拉', '汉堡包', '冰淇淋'], 3,
    'ice cream 是冰淇淋。', `${P5A} · Unit 3 What Would You Like?`, { speak: 'ice cream' }),
  e('g5-09', 5, 1, '星期', 'choice', '“Monday”是星期几？', ['星期一', '星期二', '星期三', '星期四'], 0,
    'Monday 是星期一。', `${P5A} · Unit 2 My Week`, { speak: 'Monday' }),
  e('g5-10', 5, 1, '星期', 'choice', '“Wednesday”是星期几？', ['星期一', '星期二', '星期三', '星期四'], 2,
    'Wednesday 是星期三。', `${P5A} · Unit 2 My Week`, { speak: 'Wednesday' }),
  e('g5-11', 5, 1, '星期', 'choice', '“Friday”是星期几？', ['星期四', '星期五', '星期六', '星期日'], 1,
    'Friday 是星期五。', `${P5A} · Unit 2 My Week`, { speak: 'Friday' }),
  e('g5-12', 5, 1, '动作', 'choice', '“wash”是什么意思？', ['洗', '做饭', '游泳', '唱歌'], 0,
    'wash 是洗。', `${P5A} · Unit 4 What Can You Do?`, { speak: 'wash' }),
  e('g5-13', 5, 1, '动作', 'choice', '“cook”是什么意思？', ['洗', '做饭', '游泳', '唱歌'], 1,
    'cook 是做饭。', `${P5A} · Unit 4 What Can You Do?`, { speak: 'cook' }),
  e('g5-14', 5, 1, '动作', 'choice', '“swim”是什么意思？', ['洗', '做饭', '游泳', '唱歌'], 2,
    'swim 是游泳。', `${P5A} · Unit 4 What Can You Do?`, { speak: 'swim' }),
  e('g5-15', 5, 1, '自然', 'choice', '“mountain”是什么意思？', ['山', '河流', '湖', '森林'], 0,
    'mountain 是山。', `${P5A} · Unit 6 In a Nature Park`, { speak: 'mountain' }),
  e('g5-16', 5, 1, '自然', 'choice', '“river”是什么意思？', ['山', '河流', '湖', '森林'], 1,
    'river 是河流。', `${P5A} · Unit 6 In a Nature Park`, { speak: 'river' }),
  e('g5-17', 5, 1, '自然', 'choice', '“lake”是什么意思？', ['山', '河流', '湖', '森林'], 2,
    'lake 是湖。', `${P5A} · Unit 6 In a Nature Park`, { speak: 'lake' }),
  e('g5-18', 5, 1, '自然', 'choice', '“forest”是什么意思？', ['山', '河流', '湖', '森林'], 3,
    'forest 是森林。', `${P5A} · Unit 6 In a Nature Park`, { speak: 'forest' }),
  e('g5-19', 5, 2, '情景对话', 'choice', '—What do you do on Mondays? —___', ['I often read books.', 'I am reading.', 'I did my homework.', 'I can read.'], 0,
    '问经常做什么用一般现在时，答 I often read books。', `${P5A} · Unit 2 My Week`),
  e('g5-20', 5, 2, '情景对话', 'choice', '—Can you swim? —___', ['Yes, I can.', 'Yes, I do.', 'Yes, I am.', 'Yes, I did.'], 0,
    'Can you...? 的回答用 Yes, I can. 或 No, I cannot.', `${P5A} · Unit 4 What Can You Do?`),
  e('g5-21', 5, 2, '星期配对', 'match', '把星期英文和中文配成对', null, null,
    'Monday=星期一，Tuesday=星期二，Wednesday=星期三，Friday=星期五。', `${P5A} · Unit 2 My Week`, {
      pairs: [{ a: 'Monday', b: '星期一' }, { a: 'Tuesday', b: '星期二' }, { a: 'Wednesday', b: '星期三' }, { a: 'Friday', b: '星期五' }]
    }),
  e('g5-22', 5, 2, '拼写', 'order', '按顺序点字母，拼出“星期五”的英文', null, 'Friday',
    '星期五的英文是 Friday，字母顺序 F-r-i-d-a-y。', `${P5A} · Unit 2 My Week`, {
      tiles: ['F', 'r', 'i', 'd', 'a', 'y']
    }),
  e('g5-23', 5, 2, '拼写', 'order', '按顺序点字母，拼出“河流”的英文', null, 'river',
    '河流的英文是 river，字母顺序 r-i-v-e-r。', `${P5A} · Unit 6 In a Nature Park`, {
      tiles: ['r', 'i', 'v', 'e', 'r']
    }),
  e('g5-24', 5, 2, '情景对话', 'choice', '—What would you like to eat? —___', ['I would like a sandwich.', 'I like swimming.', 'I am hungry.', 'It is a sandwich.'], 0,
    'What would you like 问想要什么，答 I would like a sandwich。', `${P5A} · Unit 3 What Would You Like?`),

  /* ---------------- 六年级 ---------------- */
  e('g6-01', 6, 1, '地点', 'choice', '“post office”是什么意思？', ['邮局', '医院', '电影院', '博物馆'], 0,
    'post office 是邮局。', `${P6A} · Unit 1 How Can I Get There?`, { speak: 'post office' }),
  e('g6-02', 6, 1, '地点', 'choice', '“hospital”是什么意思？', ['邮局', '医院', '电影院', '博物馆'], 1,
    'hospital 是医院。', `${P6A} · Unit 1 How Can I Get There?`, { speak: 'hospital' }),
  e('g6-03', 6, 1, '地点', 'choice', '“cinema”是什么意思？', ['邮局', '医院', '电影院', '博物馆'], 2,
    'cinema 是电影院。', `${P6A} · Unit 1 How Can I Get There?`, { speak: 'cinema' }),
  e('g6-04', 6, 1, '地点', 'choice', '“museum”是什么意思？', ['邮局', '医院', '电影院', '博物馆'], 3,
    'museum 是博物馆。', `${P6A} · Unit 1 How Can I Get There?`, { speak: 'museum' }),
  e('g6-05', 6, 1, '交通', 'choice', '“subway”是什么意思？', ['地铁', '飞机', '轮船', '火车'], 0,
    'subway 是地铁。', `${P6A} · Unit 2 Ways to Go to School`, { speak: 'subway' }),
  e('g6-06', 6, 1, '交通', 'choice', '“plane”是什么意思？', ['地铁', '飞机', '轮船', '火车'], 1,
    'plane 是飞机。', `${P6A} · Unit 2 Ways to Go to School`, { speak: 'plane' }),
  e('g6-07', 6, 1, '交通', 'choice', '“ship”是什么意思？', ['地铁', '飞机', '轮船', '火车'], 2,
    'ship 是轮船。', `${P6A} · Unit 2 Ways to Go to School`, { speak: 'ship' }),
  e('g6-08', 6, 1, '交通', 'choice', '“train”是什么意思？', ['地铁', '飞机', '轮船', '火车'], 3,
    'train 是火车。', `${P6A} · Unit 2 Ways to Go to School`, { speak: 'train' }),
  e('g6-09', 6, 1, '动词', 'choice', '“visit”是什么意思？', ['拜访', '看见', '骑', '买'], 0,
    'visit 是拜访、参观。', `${P6A} · Unit 3 My Weekend Plan`, { speak: 'visit' }),
  e('g6-10', 6, 1, '物品', 'choice', '“comic book”是什么意思？', ['漫画书', '明信片', '词典', '故事书'], 0,
    'comic book 是漫画书。', `${P6A} · Unit 3 My Weekend Plan`, { speak: 'comic book' }),
  e('g6-11', 6, 1, '物品', 'choice', '“postcard”是什么意思？', ['漫画书', '明信片', '词典', '故事书'], 1,
    'postcard 是明信片。', `${P6A} · Unit 3 My Weekend Plan`, { speak: 'postcard' }),
  e('g6-12', 6, 1, '物品', 'choice', '“dictionary”是什么意思？', ['漫画书', '明信片', '词典', '故事书'], 2,
    'dictionary 是词典。', `${P6A} · Unit 3 My Weekend Plan`, { speak: 'dictionary' }),
  e('g6-13', 6, 1, '比较级', 'choice', '“taller”是什么意思？', ['更高的', '更重的', '更年轻的', '更宽的'], 0,
    'taller 是更高的。', `${P6B} · Unit 1 How Tall Are You?`, { speak: 'taller' }),
  e('g6-14', 6, 1, '比较级', 'choice', '“heavier”是什么意思？', ['更高的', '更重的', '更年轻的', '更宽的'], 1,
    'heavier 是更重的。', `${P6B} · Unit 1 How Tall Are You?`, { speak: 'heavier' }),
  e('g6-15', 6, 1, '比较级', 'choice', '“younger”是什么意思？', ['更高的', '更重的', '更年轻的', '更宽的'], 2,
    'younger 是更年轻的。', `${P6B} · Unit 1 How Tall Are You?`, { speak: 'younger' }),
  e('g6-16', 6, 1, '过去式', 'choice', '“went”是哪两个词的变化？', ['go 的过去式', 'see 的过去式', 'ride 的过去式', 'buy 的过去式'], 0,
    'go 的过去式是 went。', `${P6B} · Unit 3 Where Did You Go?`, { speak: 'went' }),
  e('g6-17', 6, 1, '过去式', 'choice', '“saw”是哪两个词的变化？', ['go 的过去式', 'see 的过去式', 'ride 的过去式', 'buy 的过去式'], 1,
    'see 的过去式是 saw。', `${P6B} · Unit 3 Where Did You Go?`, { speak: 'saw' }),
  e('g6-18', 6, 1, '过去式', 'choice', '“rode”是哪两个词的变化？', ['go 的过去式', 'see 的过去式', 'ride 的过去式', 'buy 的过去式'], 2,
    'ride 的过去式是 rode。', `${P6B} · Unit 3 Where Did You Go?`, { speak: 'rode' }),
  e('g6-19', 6, 1, '过去式', 'choice', '“bought”是哪两个词的变化？', ['go 的过去式', 'see 的过去式', 'ride 的过去式', 'buy 的过去式'], 3,
    'buy 的过去式是 bought。', `${P6B} · Unit 3 Where Did You Go?`, { speak: 'bought' }),
  e('g6-20', 6, 2, '情景对话', 'choice', '—How do you come to school? —___', ['I come by bus.', 'I come to school.', 'I am at school.', 'I like school.'], 0,
    '问交通方式答 I come by bus（我坐公共汽车来）。', `${P6A} · Unit 2 Ways to Go to School`),
  e('g6-21', 6, 2, '情景对话', 'choice', '—What are you going to do this weekend? —___', ['I am going to visit my grandparents.', 'I visited my grandparents.', 'I visit them every day.', 'I am visiting now.'], 0,
    'be going to 表示将要做的事，答 I am going to visit my grandparents。', `${P6A} · Unit 3 My Weekend Plan`),
  e('g6-22', 6, 2, '情景对话', 'choice', '—How heavy are you? —___', ['I am 45 kilograms.', 'I am 1.6 metres.', 'I am 12 years old.', 'I am fine.'], 0,
    'How heavy 问体重，答 I am 45 kilograms（45 千克）。', `${P6B} · Unit 1 How Tall Are You?`),
  e('g6-23', 6, 2, '过去式配对', 'match', '把动词原形和过去式配成对', null, null,
    'go-went，see-saw，ride-rode，buy-bought。', `${P6B} · Unit 3 Where Did You Go?`, {
      pairs: [{ a: 'go', b: 'went' }, { a: 'see', b: 'saw' }, { a: 'ride', b: 'rode' }, { a: 'buy', b: 'bought' }]
    }),
  e('g6-24', 6, 2, '拼写', 'order', '按顺序点字母，拼出"博物馆"的英文', null, 'museum',
    '博物馆的英文是 museum，字母顺序 m-u-s-e-u-m。', `${P6A} · Unit 1 How Can I Get There?`, {
      tiles: ['m', 'u', 's', 'e', 'u', 'm']
    }),

  /* ---------------- 情景表达 / 看图说话（主动输出类） ---------------- */
  // 一年级：简单交际场景
  e('g1-ex-1', 1, 2, '情景表达', 'choice', '早上来到学校见到老师，你应该说什么？', ['Good morning, teacher!', 'Good night!', 'Goodbye!', 'I am fine!'], 0,
    '早上问好说 Good morning。', `${J1A} · Hello!`, { speak: 'Good morning, teacher!' }),
  e('g1-ex-2', 1, 2, '情景表达', 'choice', '别人帮了你，你应该说什么？', ['Thank you!', 'Sorry!', 'Hello!', 'Goodbye!'], 0,
    '表示感谢用 Thank you。', `${J1A} · Hello!`, { speak: 'Thank you' }),

  // 二年级：日常场景
  e('g2-ex-1', 2, 2, '情景表达', 'choice', '在商场想买一件衣服，你应该对售货员说什么？', ['How much is this?', 'Where is the hospital?', 'What is your name?', 'I am ten.'], 0,
    '问价格用 How much is this?（这个多少钱？）', `${J2A} · Shopping`, { speak: 'How much is this' }),
  e('g2-ex-2', 2, 2, '情景表达', 'choice', '朋友生日聚会，你应该说什么祝福语？', ['Happy birthday!', 'Good morning!', 'Goodbye!', 'See you later.'], 0,
    '生日祝福说 Happy birthday!', `${J2A} · Happy Birthday`, { speak: 'Happy birthday' }),

  // 三年级：学校与家庭
  e('g3-ex-1', 3, 2, '情景表达', 'choice', '老师问"What is your hobby?"（你的爱好是什么？），你应该回答什么？', ['My hobby is reading.', 'I am fine.', 'I am ten.', 'Yes, I do.'], 0,
    '回答爱好用 My hobby is...（我的爱好是……）', `${P3A} · My Hobby`, { speak: 'My hobby is reading' }),
  e('g3-ex-2', 3, 2, '情景表达', 'choice', '你想知道动物园几点开门，应该怎么问？', ['When does the zoo open?', 'Where is the zoo?', 'How much is the ticket?', 'What animals do you like?'], 0,
    '问营业时间用 When does...open?', `${P3A} · Ask and Answer`, { speak: 'When does the zoo open' }),

  // 四年级：描述与询问
  e('g4-ex-1', 4, 2, '情景表达', 'choice', '你生病了去看医生，医生问"What is wrong with you?"，你应该回答什么？', ['I have a cold.', 'I am eleven.', 'I like apples.', 'I go to school by bus.'], 0,
    '描述病情用 I have...（我得了……）。', `${P4B} · What's the Matter?`, { speak: 'I have a cold' }),
  e('g4-ex-2', 4, 2, '情景表达', 'choice', '电话里找 Mike，你应该怎么说？', ['Hello, may I speak to Mike?', 'Hello, I am Mike.', 'Goodbye.', 'See you tomorrow.'], 0,
    '打电话找人用 May I speak to...', `${P4A} · At the Phone`, { speak: 'May I speak to Mike' }),

  // 五年级：计划与经历
  e('g5-ex-1', 5, 2, '情景表达', 'choice', '朋友问你周末打算做什么，你应该回答什么？', ['I am going to visit my grandma.', 'I go to school every day.', 'I am a student.', 'I like cats.'], 0,
    '描述计划用 be going to...（打算做……）', `${P5A} · My Weekend Plan`, { speak: 'I am going to visit my grandma' }),
  e('g5-ex-2', 5, 2, '情景表达', 'choice', '同学问你"你刚才去哪儿了？"（Where did you go just now?），你应该回答什么？', ['I went to the library.', 'I go to school.', 'I will go home.', 'I am happy.'], 0,
    '描述过去的经历用一般过去时 went。', `${P5B} · Yesterday`, { speak: 'I went to the library' }),

  // 六年级：综合交际
  e('g6-ex-1', 6, 2, '情景表达', 'choice', '外国朋友说他明天要考试，你应该怎么回应？', ['Good luck!', 'Goodbye!', 'I am sorry.', 'Thank you.'], 0,
    '别人要考试或面试时，说 Good luck!（祝你好运！）', `${P6A} · Polite Expressions`, { speak: 'Good luck' }),
  e('g6-ex-2', 6, 2, '情景表达', 'choice', '你想表达"我认为我们应该多锻炼"，最地道的说法是？', ['I think we should exercise more.', 'I think we must exercise more.', 'I like exercise more.', 'We exercise more.'], 0,
    '表达建议用 should（应该），比 must（必须）语气更委婉得体。', `${P6B} · Advice`, { speak: 'I think we should exercise more' })
];

export function englishPool(grade) {
  return ENGLISH_BANK.filter((item) => item.grade === grade);
}

/* ============================================================
   参数化题库
   ------------------------------------------------------------
   每组词表 = 一个教材单元的同类词。生成器每天用「日期种子」
   随机抽词、随机配干扰项，题目 id 由「题干 + 选项内容」哈希
   得到，因此同一道题不会在 365 天内被再次抽到。
   ============================================================ */

const WORD_GROUPS = {
  1: [
    { topic: '问候', book: J1A, unit: 'Hello!', words: [['hello', '你好'], ['hi', '嗨'], ['goodbye', '再见'], ['bye', '拜拜'], ['please', '请'], ['thanks', '谢谢']] },
    { topic: '家庭', book: J1A, unit: 'My Family', words: [['mum', '妈妈'], ['dad', '爸爸'], ['sister', '姐姐'], ['brother', '哥哥'], ['grandma', '奶奶'], ['grandpa', '爷爷']] },
    { topic: '动物', book: J1A, unit: 'Animals', words: [['cat', '猫'], ['dog', '狗'], ['bird', '鸟'], ['fish', '鱼'], ['duck', '鸭子'], ['rabbit', '兔子']] },
    { topic: '颜色', book: J1A, unit: 'Colours', words: [['red', '红色'], ['blue', '蓝色'], ['yellow', '黄色'], ['green', '绿色'], ['black', '黑色'], ['white', '白色']] },
    { topic: '数字', book: J1A, unit: 'Numbers', words: [['one', '一'], ['two', '二'], ['three', '三'], ['four', '四'], ['five', '五'], ['six', '六']] },
    { topic: '身体', book: J1A, unit: 'My Body', words: [['eye', '眼睛'], ['ear', '耳朵'], ['nose', '鼻子'], ['mouth', '嘴'], ['hand', '手'], ['foot', '脚']] },
    { topic: '水果', book: J1A, unit: 'Fruit', words: [['apple', '苹果'], ['banana', '香蕉'], ['pear', '梨'], ['orange', '橙子'], ['peach', '桃子'], ['grape', '葡萄']] },
    { topic: '学习用品', book: J1A, unit: 'School Things', words: [['pen', '钢笔'], ['pencil', '铅笔'], ['book', '书'], ['bag', '书包'], ['ruler', '尺子'], ['crayon', '蜡笔']] },
    { topic: '食物', book: J1B, unit: 'Food', words: [['rice', '米饭'], ['egg', '鸡蛋'], ['cake', '蛋糕'], ['milk', '牛奶'], ['bread', '面包'], ['noodles', '面条']] },
    { topic: '衣物', book: J1B, unit: 'Clothes', words: [['hat', '帽子'], ['coat', '外套'], ['shoes', '鞋子'], ['socks', '袜子'], ['dress', '连衣裙'], ['skirt', '裙子']] },
    { topic: '玩具', book: J1B, unit: 'Toys', words: [['ball', '球'], ['doll', '洋娃娃'], ['kite', '风筝'], ['car', '小汽车'], ['robot', '机器人'], ['bike', '自行车']] },
    { topic: '自然', book: J1B, unit: 'Nature', words: [['sun', '太阳'], ['moon', '月亮'], ['star', '星星'], ['tree', '树'], ['flower', '花'], ['grass', '草']] }
  ],
  2: [
    { topic: '身体', book: J2A, unit: 'My Body', words: [['head', '头'], ['arm', '胳膊'], ['leg', '腿'], ['hair', '头发'], ['face', '脸'], ['finger', '手指']] },
    { topic: '食物', book: J2A, unit: 'Food', words: [['milk', '牛奶'], ['bread', '面包'], ['water', '水'], ['egg', '鸡蛋'], ['rice', '米饭'], ['cake', '蛋糕']] },
    { topic: '学习用品', book: J2A, unit: 'School Things', words: [['school', '学校'], ['desk', '课桌'], ['chair', '椅子'], ['eraser', '橡皮'], ['notebook', '笔记本'], ['schoolbag', '书包']] },
    { topic: '衣物', book: J2A, unit: 'Clothes', words: [['coat', '外套'], ['shirt', '衬衫'], ['skirt', '裙子'], ['shoes', '鞋子'], ['hat', '帽子'], ['socks', '袜子']] },
    { topic: '动物', book: J2A, unit: 'Animals', words: [['tiger', '老虎'], ['panda', '熊猫'], ['monkey', '猴子'], ['elephant', '大象'], ['lion', '狮子'], ['bear', '熊']] },
    { topic: '家庭', book: J2A, unit: 'My Family', words: [['mother', '妈妈'], ['father', '爸爸'], ['aunt', '姑姑'], ['uncle', '叔叔'], ['cousin', '表兄妹'], ['baby', '婴儿']] },
    { topic: '动作', book: J2A, unit: 'Actions', words: [['run', '跑'], ['jump', '跳'], ['swim', '游泳'], ['sing', '唱歌'], ['dance', '跳舞'], ['read', '读']] },
    { topic: '玩具', book: J2A, unit: 'Toys', words: [['ball', '球'], ['doll', '洋娃娃'], ['kite', '风筝'], ['car', '小汽车'], ['train', '火车'], ['robot', '机器人']] },
    { topic: '天气', book: J2B, unit: 'Weather', words: [['sunny', '晴朗的'], ['rainy', '下雨的'], ['windy', '有风的'], ['cloudy', '多云的'], ['snowy', '下雪的'], ['hot', '热的']] },
    { topic: '房间', book: J2B, unit: 'My Home', words: [['bedroom', '卧室'], ['kitchen', '厨房'], ['bathroom', '浴室'], ['garden', '花园'], ['house', '房子'], ['door', '门']] },
    { topic: '颜色', book: J2B, unit: 'Colours', words: [['pink', '粉色'], ['purple', '紫色'], ['brown', '棕色'], ['grey', '灰色'], ['orange', '橙色'], ['gold', '金色']] },
    { topic: '数字', book: J2B, unit: 'Numbers', words: [['seven', '七'], ['eight', '八'], ['nine', '九'], ['ten', '十'], ['eleven', '十一'], ['twelve', '十二']] }
  ],
  3: [
    { topic: '学习用品', book: P3A, unit: 'Unit 1 Hello!', words: [['pencil', '铅笔'], ['eraser', '橡皮'], ['crayon', '蜡笔'], ['ruler', '尺子'], ['pen', '钢笔'], ['bag', '书包']] },
    { topic: '颜色', book: P3A, unit: 'Unit 2 Colours', words: [['brown', '棕色'], ['black', '黑色'], ['white', '白色'], ['orange', '橙色'], ['pink', '粉色'], ['purple', '紫色']] },
    { topic: '动物', book: P3A, unit: 'Unit 4 We Love Animals', words: [['panda', '熊猫'], ['monkey', '猴子'], ['elephant', '大象'], ['tiger', '老虎'], ['giraffe', '长颈鹿'], ['bear', '熊']] },
    { topic: '食物', book: P3A, unit: 'Unit 5 Let Us Eat', words: [['egg', '鸡蛋'], ['bread', '面包'], ['juice', '果汁'], ['milk', '牛奶'], ['cake', '蛋糕'], ['fish', '鱼']] },
    { topic: '数字', book: P3A, unit: 'Unit 6 Happy Birthday!', words: [['eleven', '十一'], ['twelve', '十二'], ['thirteen', '十三'], ['fourteen', '十四'], ['fifteen', '十五'], ['sixteen', '十六']] },
    { topic: '家庭', book: P3A, unit: 'Unit 2 My Family', words: [['father', '爸爸'], ['mother', '妈妈'], ['brother', '兄弟'], ['sister', '姐妹'], ['grandfather', '祖父'], ['grandmother', '祖母']] },
    { topic: '学校', book: P3A, unit: 'My School', words: [['classroom', '教室'], ['library', '图书馆'], ['playground', '操场'], ['teacher', '老师'], ['student', '学生'], ['window', '窗户']] },
    { topic: '水果', book: P3A, unit: 'Fruit', words: [['apple', '苹果'], ['banana', '香蕉'], ['orange', '橙子'], ['pear', '梨'], ['watermelon', '西瓜'], ['strawberry', '草莓']] },
    { topic: '身体', book: P3B, unit: 'Unit 3 My Body', words: [['head', '头'], ['hand', '手'], ['arm', '胳膊'], ['leg', '腿'], ['foot', '脚'], ['hair', '头发']] },
    { topic: '衣物', book: P3B, unit: 'Unit 5 My Clothes', words: [['dress', '连衣裙'], ['skirt', '裙子'], ['shirt', '衬衫'], ['jacket', '夹克'], ['hat', '帽子'], ['socks', '袜子']] },
    { topic: '动作', book: P3B, unit: 'Unit 4 Actions', words: [['run', '跑'], ['jump', '跳'], ['swim', '游泳'], ['sing', '唱歌'], ['dance', '跳舞'], ['draw', '画画']] },
    { topic: '天气', book: P3B, unit: 'Unit 6 Weather', words: [['sunny', '晴朗的'], ['rainy', '下雨的'], ['cold', '冷的'], ['hot', '热的'], ['windy', '有风的'], ['snowy', '下雪的']] }
  ],
  4: [
    { topic: '教室', book: P4A, unit: 'Unit 1 My Classroom', words: [['classroom', '教室'], ['window', '窗户'], ['door', '门'], ['desk', '课桌'], ['chair', '椅子'], ['blackboard', '黑板']] },
    { topic: '书包', book: P4A, unit: 'Unit 2 My Schoolbag', words: [['storybook', '故事书'], ['candy', '糖果'], ['notebook', '笔记本'], ['key', '钥匙'], ['toy', '玩具'], ['maths book', '数学书']] },
    { topic: '朋友', book: P4A, unit: 'Unit 3 My Friends', words: [['strong', '强壮的'], ['friendly', '友好的'], ['quiet', '安静的'], ['thin', '瘦小的'], ['tall', '高的'], ['short', '矮的']] },
    { topic: '房间', book: P4A, unit: 'Unit 4 My Home', words: [['bedroom', '卧室'], ['kitchen', '厨房'], ['bathroom', '浴室'], ['living room', '客厅'], ['study', '书房'], ['garden', '花园']] },
    { topic: '天气', book: P4B, unit: 'Unit 3 Weather', words: [['sunny', '晴朗的'], ['rainy', '下雨的'], ['windy', '有风的'], ['cloudy', '多云的'], ['snowy', '下雪的'], ['hot', '热的']] },
    { topic: '农场', book: P4B, unit: 'Unit 4 At the Farm', words: [['horse', '马'], ['cow', '奶牛'], ['sheep', '绵羊'], ['hen', '母鸡'], ['goat', '山羊'], ['duck', '鸭子']] },
    { topic: '时间', book: P4B, unit: 'Unit 2 What Time Is It?', words: [['breakfast', '早餐'], ['lunch', '午餐'], ['dinner', '晚餐'], ['morning', '早上'], ['afternoon', '下午'], ['evening', '晚上']] },
    { topic: '衣物', book: P4B, unit: 'Unit 5 My Clothes', words: [['dress', '连衣裙'], ['skirt', '裙子'], ['shirt', '衬衫'], ['jacket', '夹克'], ['shoes', '鞋子'], ['socks', '袜子']] },
    { topic: '课程', book: P4A, unit: 'Unit 2 My Schoolbag', words: [['music', '音乐'], ['art', '美术'], ['science', '科学'], ['Chinese', '语文'], ['maths', '数学'], ['English', '英语']] },
    { topic: '家庭', book: P4A, unit: "Unit 6 Meet My Family", words: [['parents', '父母'], ['uncle', '叔叔'], ['aunt', '姑姑'], ['cousin', '表兄妹'], ['baby brother', '小弟弟'], ['family', '家庭']] },
    { topic: '购物', book: P4B, unit: 'Unit 6 Shopping', words: [['gloves', '手套'], ['scarf', '围巾'], ['umbrella', '雨伞'], ['sunglasses', '太阳镜'], ['money', '钱'], ['cheap', '便宜的']] },
    { topic: '饮食', book: P4A, unit: "Unit 5 Dinner's Ready", words: [['beef', '牛肉'], ['chicken', '鸡肉'], ['soup', '汤'], ['vegetable', '蔬菜'], ['noodles', '面条'], ['rice', '米饭']] }
  ],
  5: [
    { topic: '性格', book: P5A, unit: 'Unit 1 What Is He Like?', words: [['funny', '滑稽的'], ['strict', '严格的'], ['kind', '和善的'], ['hard-working', '勤奋的'], ['polite', '有礼貌的'], ['shy', '害羞的']] },
    { topic: '星期', book: P5A, unit: 'Unit 2 My Week', words: [['Monday', '星期一'], ['Tuesday', '星期二'], ['Wednesday', '星期三'], ['Thursday', '星期四'], ['Friday', '星期五'], ['Saturday', '星期六']] },
    { topic: '食物', book: P5A, unit: 'Unit 3 What Would You Like?', words: [['sandwich', '三明治'], ['salad', '沙拉'], ['hamburger', '汉堡包'], ['ice cream', '冰淇淋'], ['tea', '茶'], ['juice', '果汁']] },
    { topic: '动作', book: P5A, unit: 'Unit 4 What Can You Do?', words: [['wash', '洗'], ['cook', '做饭'], ['swim', '游泳'], ['sing', '唱歌'], ['dance', '跳舞'], ['draw', '画画']] },
    { topic: '自然', book: P5A, unit: 'Unit 6 In a Nature Park', words: [['mountain', '山'], ['river', '河流'], ['lake', '湖'], ['forest', '森林'], ['hill', '小山'], ['tree', '树']] },
    { topic: '课程', book: P5A, unit: 'Unit 2 My Week', words: [['English', '英语'], ['maths', '数学'], ['music', '音乐'], ['art', '美术'], ['PE', '体育'], ['science', '科学']] },
    { topic: '房间物品', book: P5A, unit: 'Unit 5 There Is a Big Bed', words: [['clock', '时钟'], ['plant', '植物'], ['bottle', '瓶子'], ['photo', '照片'], ['bike', '自行车'], ['bed', '床']] },
    { topic: '情绪', book: P5A, unit: 'Unit 1 What Is He Like?', words: [['happy', '高兴的'], ['sad', '伤心的'], ['angry', '生气的'], ['tired', '累的'], ['hungry', '饿的'], ['thirsty', '渴的']] },
    { topic: '月份', book: P5B, unit: 'Unit 3 My School Calendar', words: [['January', '一月'], ['February', '二月'], ['March', '三月'], ['April', '四月'], ['May', '五月'], ['June', '六月']] },
    { topic: '季节', book: P5B, unit: 'Unit 2 My Favourite Season', words: [['spring', '春天'], ['summer', '夏天'], ['autumn', '秋天'], ['winter', '冬天'], ['season', '季节'], ['weather', '天气']] },
    { topic: '家务', book: P5B, unit: 'Unit 6 Work Quietly!', words: [['clean', '打扫'], ['sweep', '扫地'], ['water', '浇水'], ['feed', '喂养'], ['mop', '拖地'], ['tidy', '整理']] },
    { topic: '频率', book: P5B, unit: 'Unit 1 My Day', words: [['always', '总是'], ['usually', '通常'], ['often', '经常'], ['sometimes', '有时'], ['never', '从不'], ['seldom', '很少']] }
  ],
  6: [
    { topic: '地点', book: P6A, unit: 'Unit 1 How Can I Get There?', words: [['post office', '邮局'], ['hospital', '医院'], ['cinema', '电影院'], ['museum', '博物馆'], ['bookstore', '书店'], ['library', '图书馆']] },
    { topic: '交通', book: P6A, unit: 'Unit 2 Ways to Go to School', words: [['subway', '地铁'], ['plane', '飞机'], ['ship', '轮船'], ['train', '火车'], ['bus', '公共汽车'], ['bike', '自行车']] },
    { topic: '周末计划', book: P6A, unit: 'Unit 3 My Weekend Plan', words: [['visit', '拜访'], ['comic book', '漫画书'], ['postcard', '明信片'], ['dictionary', '词典'], ['magazine', '杂志'], ['film', '电影']] },
    { topic: '比较级', book: P6B, unit: 'Unit 1 How Tall Are You?', words: [['taller', '更高的'], ['heavier', '更重的'], ['younger', '更年轻的'], ['thinner', '更瘦的'], ['longer', '更长的'], ['older', '更年长的']] },
    { topic: '过去式', book: P6B, unit: 'Unit 3 Where Did You Go?', words: [['went', '去（过去）'], ['saw', '看见（过去）'], ['rode', '骑（过去）'], ['bought', '买（过去）'], ['ate', '吃（过去）'], ['took', '拿（过去）']] },
    { topic: '假期', book: P6B, unit: 'Unit 2 Last Weekend', words: [['holiday', '假期'], ['camping', '露营'], ['fishing', '钓鱼'], ['swimming', '游泳'], ['hiking', '徒步'], ['shopping', '购物']] },
    { topic: '爱好', book: P6B, unit: 'Unit 4 Then and Now', words: [['hobby', '爱好'], ['singing', '唱歌'], ['dancing', '跳舞'], ['reading', '阅读'], ['drawing', '画画'], ['playing', '玩']] },
    { topic: '感受', book: P6B, unit: 'Unit 2 Last Weekend', words: [['excited', '兴奋的'], ['worried', '担心的'], ['afraid', '害怕的'], ['proud', '自豪的'], ['surprised', '惊讶的'], ['bored', '无聊的']] },
    { topic: '出行方式', book: P6A, unit: 'Unit 2 Ways to Go to School', words: [['by bus', '坐公共汽车'], ['by bike', '骑自行车'], ['on foot', '步行'], ['by train', '坐火车'], ['by plane', '坐飞机'], ['by subway', '坐地铁']] },
    { topic: '职业', book: P6A, unit: 'Unit 5 What Does He Do?', words: [['factory worker', '工厂工人'], ['postman', '邮递员'], ['businessman', '商人'], ['police officer', '警察'], ['fisherman', '渔民'], ['scientist', '科学家']] },
    { topic: '周末活动', book: P6B, unit: 'Unit 3 Where Did You Go?', words: [['went camping', '去露营'], ['went fishing', '去钓鱼'], ['rode a bike', '骑自行车'], ['hurt my foot', '伤到脚'], ['ate fresh food', '吃新鲜食物'], ['took pictures', '拍照']] },
    { topic: '现在与过去', book: P6B, unit: 'Unit 4 Then and Now', words: [['before', '在…之前'], ['ago', '以前'], ['now', '现在'], ['then', '那时'], ['different', '不同的'], ['same', '相同的']] }
  ]
};

const flatCache = {};

function allWords(grade) {
  if (!flatCache[grade]) {
    const list = [];
    (WORD_GROUPS[grade] || []).forEach((group) => {
      group.words.forEach(([en, zh]) => list.push({ en, zh, group }));
    });
    flatCache[grade] = list;
  }
  return flatCache[grade];
}

function uniqBy(list, keyOf) {
  const seen = new Set();
  return list.filter((item) => {
    const key = keyOf(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function itemId(grade, kind, ...parts) {
  return `enx-g${grade}-${kind}-${hashString(parts.join('|'))}`;
}

/**
 * 生成当天的英语参数化题池
 * @param {number} grade 1~6
 * @param {() => number} rng 日期种子随机数（同一天必得同一批题）
 * @returns {Array} 题目数组（当天内已去重）
 */
export function englishGenerated(grade, rng) {
  const groups = WORD_GROUPS[grade] || [];
  const flat = allWords(grade);
  if (!flat.length) return [];

  const out = [];
  const seen = new Set();
  const usedWords = new Set(); // 同一天内词义类题目不重复考同一个单词
  const usedOdd = new Set();   // 同一天内「找不同类」的答案词不重复
  const usedSpell = new Set(); // 同一天内拼写题不重复考同一个单词
  const repeat = (count, build) => {
    for (let i = 0, guard = 0; i < count && guard < count * 12; guard++) {
      const item = build();
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        out.push(item);
        i++;
      }
    }
  };

  // 1) 英→中：选词义（基础）
  repeat(12, () => {
    const candidates = flat.filter((x) => !usedWords.has(x.en));
    if (!candidates.length) return null;
    const w = pick(rng, candidates);
    // 排除同词多义（如 orange 既表示橙色也表示橙子）造成的干扰项歧义
    const distract = uniqBy(
      sample(rng, flat.filter((x) => x.zh !== w.zh && x.en !== w.en), 14),
      (x) => x.zh
    ).slice(0, 3);
    if (distract.length < 3) return null;
    const options = shuffle(rng, [w.zh, ...distract.map((x) => x.zh)]);
    const id = itemId(grade, 'm', w.en, options.join('|'));
    if (seen.has(id)) return null;
    usedWords.add(w.en);
    return {
      id,
      key: `en:zh:${w.en}`,
      subject: 'english', grade, level: 1,
      topic: `${w.group.topic}词义`, type: 'choice',
      prompt: `“${w.en}”是什么意思？`,
      options,
      answer: options.indexOf(w.zh),
      explain: `${w.en} 意思是“${w.zh}”。`,
      source: `${w.group.book} · ${w.group.unit}`,
      speak: w.en
    };
  });

  // 2) 中→英：反向选词（挑战）
  repeat(9, () => {
    const candidates = flat.filter((x) => !usedWords.has(x.en));
    if (!candidates.length) return null;
    const w = pick(rng, candidates);
    const distract = uniqBy(
      sample(rng, flat.filter((x) => x.en !== w.en && x.zh !== w.zh), 14),
      (x) => x.en
    ).slice(0, 3);
    if (distract.length < 3) return null;
    const options = shuffle(rng, [w.en, ...distract.map((x) => x.en)]);
    const id = itemId(grade, 'r', w.zh, options.join('|'));
    if (seen.has(id)) return null;
    usedWords.add(w.en);
    return {
      id,
      key: `en:zh:${w.en}`,
      subject: 'english', grade, level: 2,
      topic: `${w.group.topic}词义`, type: 'choice',
      prompt: `“${w.zh}”用英语怎么说？`,
      options,
      answer: options.indexOf(w.en),
      explain: `${w.zh} 的英文是 ${w.en}。`,
      source: `${w.group.book} · ${w.group.unit}`
    };
  });

  // 3) 词义判断（对 / 错）
  repeat(7, () => {
    const candidates = flat.filter((x) => !usedWords.has(x.en));
    if (!candidates.length) return null;
    const w = pick(rng, candidates);
    const truth = rng() < 0.5;
    const other = pick(rng, uniqBy(flat.filter((x) => x.zh !== w.zh && x.en !== w.en), (x) => x.zh));
    if (!other) return null;
    const said = truth ? w.zh : other.zh;
    const id = itemId(grade, 'j', w.en, said, truth ? '1' : '0');
    if (seen.has(id)) return null;
    usedWords.add(w.en);
    return {
      id,
      key: `en:zh:${w.en}`,
      subject: 'english', grade, level: grade <= 2 ? 1 : 2,
      topic: `${w.group.topic}词义`, type: 'judge',
      prompt: `“${w.en}”的意思是“${said}”。`,
      answer: truth,
      explain: truth
        ? `${w.en} 意思是“${w.zh}”，这句话是对的。`
        : `${w.en} 意思是“${w.zh}”，不是“${said}”。`,
      source: `${w.group.book} · ${w.group.unit}`,
      speak: w.en
    };
  });

  // 4) 同类词辨认（挑战）
  repeat(4, () => {
    if (groups.length < 2) return null;
    const gA = pick(rng, groups);
    const gB = pick(rng, groups.filter((g) => g !== gA));
    const same = sample(rng, gA.words, 3);
    if (same.length < 3) return null;
    const sameSet = new Set(same.map(([en]) => en));
    const odd = pick(rng, gB.words.filter(([en]) => !sameSet.has(en) && !usedOdd.has(en)));
    if (!odd) return null;
    const options = shuffle(rng, [...sameSet, odd[0]]);
    const id = itemId(grade, 'o', gA.topic, options.join('|'));
    if (seen.has(id)) return null;
    usedOdd.add(odd[0]);
    return {
      id,
      key: `en:odd:${odd[0]}`,
      subject: 'english', grade, level: 2,
      topic: '同类词', type: 'choice',
      prompt: '下面哪个单词和其他三个不是同一类？',
      options,
      answer: options.indexOf(odd[0]),
      explain: `其他三个都是「${gA.topic}」类的单词，${odd[0]} 属于「${gB.topic}」。`,
      source: `${gB.book} · ${gB.unit}`
    };
  });

  // 5) 英中配对
  repeat(2, () => {
    const g = pick(rng, groups);
    const four = sample(rng, g.words, 4);
    if (four.length < 4) return null;
    const pairs = four.map(([en, zh]) => ({ a: en, b: zh }));
    return {
      id: itemId(grade, 'p', g.topic, pairs.map((p) => `${p.a}:${p.b}`).join('|')),
      key: `en:match:${g.topic}`,
      subject: 'english', grade, level: grade <= 2 ? 1 : 2,
      topic: `${g.topic}配对`, type: 'match',
      prompt: '把英文和中文配成对',
      pairs,
      explain: pairs.map((p) => `${p.a}=${p.b}`).join('，') + '。',
      source: `${g.book} · ${g.unit}`
    };
  });

  // 6) 补全单词（挑战）
  repeat(4, () => {
    const spellable = flat.filter((x) => /^[a-zA-Z]{4,9}$/.test(x.en) && !usedSpell.has(x.en));
    const w = pick(rng, spellable);
    if (!w) return null;
    const pos = Math.floor(rng() * w.en.length);
    const letter = w.en[pos];
    const masked = w.en.slice(0, pos) + '_' + w.en.slice(pos + 1);
    const upper = letter === letter.toUpperCase();
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('').map((ch) => (upper ? ch.toUpperCase() : ch));
    const distract = sample(rng, letters.filter((ch) => ch.toLowerCase() !== letter.toLowerCase()), 3);
    if (distract.length < 3) return null;
    const options = shuffle(rng, [letter, ...distract]);
    usedSpell.add(w.en);
    return {
      id: itemId(grade, 's', masked, options.join('|')),
      key: `en:sp:${w.en}`,
      subject: 'english', grade, level: 2,
      topic: '单词拼写', type: 'choice',
      prompt: `单词“${masked}”（${w.zh}）缺少的字母是？`,
      options,
      answer: options.indexOf(letter),
      explain: `完整单词是 ${w.en}（${w.zh}）。`,
      source: `${w.group.book} · ${w.group.unit}`
    };
  });

  /* —— 以下为难度加深题型 —— */

  // 7) 短句填空（三年级起挑战；五年级起加入过去时/将来时混合）
  const SENTENCE_BANK = [
    { s: 'I ___ up at seven in the morning.', a: 'get', zh: '我早上七点起床。', w: ['go', 'play', 'eat'], g: 3 },
    { s: 'I go to school ___ bus.', a: 'by', zh: '我乘公交车去上学。', w: ['on', 'in', 'at'], g: 3 },
    { s: 'We ___ English every day.', a: 'learn', zh: '我们每天学英语。', w: ['run', 'jump', 'swim'], g: 3 },
    { s: 'There ___ many books on the desk.', a: 'are', zh: '课桌上有很多书。', w: ['is', 'am', 'be'], g: 3 },
    { s: 'I ___ TV in the evening.', a: 'watch', zh: '我晚上看电视。', w: ['look', 'see', 'read'], g: 3 },
    { s: 'Spring is warm and ___.', a: 'sunny', zh: '春天温暖又晴朗。', w: ['cold', 'snowy', 'rainy'], g: 3 },
    { s: 'The bird can ___ high.', a: 'fly', zh: '鸟能飞得很高。', w: ['run', 'swim', 'jump'], g: 3 },
    { s: 'Elephants have long ___.', a: 'noses', zh: '大象有长鼻子。', w: ['tails', 'legs', 'eyes'], g: 3 },
    { s: 'We have PE class ___ Monday.', a: 'on', zh: '我们星期一有体育课。', w: ['at', 'in', 'of'], g: 3 },
    { s: 'I ___ my homework after dinner.', a: 'do', zh: '晚饭后我做作业。', w: ['read', 'write', 'play'], g: 3 },
    { s: 'My father ___ English in a school.', a: 'teaches', zh: '我爸爸在学校教英语。', w: ['learns', 'plays', 'sings'], g: 4 },
    { s: 'The cat is ___ the chair.', a: 'under', zh: '猫在椅子下面。', w: ['on', 'in', 'behind'], g: 4 },
    { s: 'She ___ a red dress today.', a: 'wears', zh: '她今天穿着一条红裙子。', w: ['makes', 'draws', 'reads'], g: 4 },
    { s: 'We ___ hands before meals.', a: 'wash', zh: '我们饭前洗手。', w: ['make', 'clean', 'close'], g: 4 },
    { s: 'I like ___ because they are sweet.', a: 'apples', zh: '我喜欢苹果，因为它们很甜。', w: ['peppers', 'onions', 'potatoes'], g: 4 },
    { s: 'He ___ to the park yesterday.', a: 'went', zh: '他昨天去了公园。', w: ['goes', 'go', 'going'], g: 5 },
    { s: 'I will ___ my grandma tomorrow.', a: 'visit', zh: '我明天要去看望奶奶。', w: ['visited', 'visits', 'visiting'], g: 5 },
    { s: 'She ___ a letter last night.', a: 'wrote', zh: '她昨晚写了一封信。', w: ['writes', 'write', 'writing'], g: 5 },
    { s: 'They ___ football next Sunday.', a: 'will play', zh: '他们下周日要踢足球。', w: ['plays', 'played', 'playing'], g: 5 },
    { s: 'Look! The boys are ___.', a: 'running', zh: '看！男孩们正在跑步。', w: ['run', 'runs', 'ran'], g: 6 },
    { s: 'We ___ a picnic last weekend.', a: 'had', zh: '我们上周末野餐了。', w: ['have', 'has', 'having'], g: 6 },
    { s: 'There ___ a football match tomorrow.', a: 'will be', zh: '明天将有一场足球赛。', w: ['is', 'was', 'are'], g: 6 }
  ];
  const clozeBank = SENTENCE_BANK.filter((x) => grade >= x.g);
  if (clozeBank.length >= 4) {
    repeat(4, () => {
      const item = pick(rng, clozeBank);
      if (!item) return null;
      const options = shuffle(rng, [item.a, ...item.w]);
      return {
        id: itemId(grade, 'c', item.s, options.join('|')),
        key: `en:cloze:${item.s}`,
        subject: 'english', grade, level: 2,
        topic: '短句填空', type: 'choice',
        prompt: `选出正确的选项补全句子：“${item.s}”（${item.zh}）`,
        options,
        answer: options.indexOf(item.a),
        explain: `正确答案是“${item.a}”，句子的意思是“${item.zh}”。`,
        source: '句型运用 · 情景表达',
        speak: item.s.replace('___', item.a)
      };
    });
  }

  return out;
}

