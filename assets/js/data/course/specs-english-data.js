/**
 * specs-english-data.js —— P4 英语规格数据池（只放可枚举素材，不放交互/渲染）
 *
 * 口径：
 *   · 单词按语义类目分组，类目之间不重叠，供词义 / 同类词 / 找不同类使用；
 *   · 语音池带首音、元音、音节、押韵族，字母组合池带 sh/ch/th/ph；
 *   · 句型、语法、交际池均为「一题一事实」，干扰项来自同一语义场而非随机词。
 */

/* ------------------------- 词汇池（类目不重叠） ------------------------- */

export const EN_WORDS = [
  // 家庭
  { en: 'mother', zh: '妈妈', cat: '家庭' }, { en: 'father', zh: '爸爸', cat: '家庭' },
  { en: 'sister', zh: '姐妹', cat: '家庭' }, { en: 'brother', zh: '兄弟', cat: '家庭' },
  { en: 'grandma', zh: '奶奶/外婆', cat: '家庭' }, { en: 'grandpa', zh: '爷爷/外公', cat: '家庭' },
  { en: 'aunt', zh: '姑姑/阿姨', cat: '家庭' }, { en: 'uncle', zh: '叔叔/舅舅', cat: '家庭' },
  // 动物
  { en: 'cat', zh: '猫', cat: '动物' }, { en: 'dog', zh: '狗', cat: '动物' },
  { en: 'bird', zh: '鸟', cat: '动物' }, { en: 'fish', zh: '鱼', cat: '动物' },
  { en: 'panda', zh: '熊猫', cat: '动物' }, { en: 'monkey', zh: '猴子', cat: '动物' },
  { en: 'tiger', zh: '老虎', cat: '动物' }, { en: 'elephant', zh: '大象', cat: '动物' },
  { en: 'rabbit', zh: '兔子', cat: '动物' }, { en: 'duck', zh: '鸭子', cat: '动物' },
  { en: 'bear', zh: '熊', cat: '动物' }, { en: 'lion', zh: '狮子', cat: '动物' },
  { en: 'horse', zh: '马', cat: '动物' }, { en: 'cow', zh: '奶牛', cat: '动物' },
  // 水果
  { en: 'apple', zh: '苹果', cat: '水果' }, { en: 'banana', zh: '香蕉', cat: '水果' },
  { en: 'pear', zh: '梨', cat: '水果' }, { en: 'peach', zh: '桃子', cat: '水果' },
  { en: 'grape', zh: '葡萄', cat: '水果' }, { en: 'watermelon', zh: '西瓜', cat: '水果' },
  { en: 'strawberry', zh: '草莓', cat: '水果' }, { en: 'lemon', zh: '柠檬', cat: '水果' },
  { en: 'orange', zh: '橙子', cat: '水果' }, { en: 'mango', zh: '芒果', cat: '水果' },
  // 颜色
  { en: 'red', zh: '红色', cat: '颜色' }, { en: 'blue', zh: '蓝色', cat: '颜色' },
  { en: 'yellow', zh: '黄色', cat: '颜色' }, { en: 'green', zh: '绿色', cat: '颜色' },
  { en: 'black', zh: '黑色', cat: '颜色' }, { en: 'white', zh: '白色', cat: '颜色' },
  { en: 'pink', zh: '粉色', cat: '颜色' }, { en: 'purple', zh: '紫色', cat: '颜色' },
  { en: 'brown', zh: '棕色', cat: '颜色' }, { en: 'grey', zh: '灰色', cat: '颜色' },
  // 衣物
  { en: 'hat', zh: '帽子', cat: '衣物' }, { en: 'coat', zh: '外套', cat: '衣物' },
  { en: 'shirt', zh: '衬衫', cat: '衣物' }, { en: 'skirt', zh: '裙子', cat: '衣物' },
  { en: 'shoes', zh: '鞋子', cat: '衣物' }, { en: 'socks', zh: '袜子', cat: '衣物' },
  { en: 'dress', zh: '连衣裙', cat: '衣物' }, { en: 'scarf', zh: '围巾', cat: '衣物' },
  // 房间
  { en: 'bedroom', zh: '卧室', cat: '房间' }, { en: 'kitchen', zh: '厨房', cat: '房间' },
  { en: 'bathroom', zh: '浴室', cat: '房间' }, { en: 'garden', zh: '花园', cat: '房间' },
  { en: 'house', zh: '房子', cat: '房间' }, { en: 'door', zh: '门', cat: '房间' },
  { en: 'window', zh: '窗户', cat: '房间' }, { en: 'sofa', zh: '沙发', cat: '房间' },
  // 天气
  { en: 'sunny', zh: '晴朗的', cat: '天气' }, { en: 'rainy', zh: '下雨的', cat: '天气' },
  { en: 'windy', zh: '有风的', cat: '天气' }, { en: 'cloudy', zh: '多云的', cat: '天气' },
  { en: 'snowy', zh: '下雪的', cat: '天气' }, { en: 'hot', zh: '炎热的', cat: '天气' },
  { en: 'cold', zh: '寒冷的', cat: '天气' }, { en: 'warm', zh: '温暖的', cat: '天气' },
  // 动作
  { en: 'run', zh: '跑', cat: '动作' }, { en: 'jump', zh: '跳', cat: '动作' },
  { en: 'swim', zh: '游泳', cat: '动作' }, { en: 'sing', zh: '唱歌', cat: '动作' },
  { en: 'dance', zh: '跳舞', cat: '动作' }, { en: 'read', zh: '读', cat: '动作' },
  { en: 'write', zh: '写', cat: '动作' }, { en: 'draw', zh: '画画', cat: '动作' },
  { en: 'play', zh: '玩', cat: '动作' }, { en: 'eat', zh: '吃', cat: '动作' },
  { en: 'drink', zh: '喝', cat: '动作' }, { en: 'sleep', zh: '睡觉', cat: '动作' },
  { en: 'cook', zh: '做饭', cat: '动作' }, { en: 'walk', zh: '走', cat: '动作' },
  // 数字
  { en: 'one', zh: '一', cat: '数字' }, { en: 'two', zh: '二', cat: '数字' },
  { en: 'three', zh: '三', cat: '数字' }, { en: 'four', zh: '四', cat: '数字' },
  { en: 'five', zh: '五', cat: '数字' }, { en: 'six', zh: '六', cat: '数字' },
  { en: 'seven', zh: '七', cat: '数字' }, { en: 'eight', zh: '八', cat: '数字' },
  { en: 'nine', zh: '九', cat: '数字' }, { en: 'ten', zh: '十', cat: '数字' },
  { en: 'eleven', zh: '十一', cat: '数字' }, { en: 'twelve', zh: '十二', cat: '数字' },
  // 学校
  { en: 'school', zh: '学校', cat: '学校' }, { en: 'classroom', zh: '教室', cat: '学校' },
  { en: 'teacher', zh: '老师', cat: '学校' }, { en: 'student', zh: '学生', cat: '学校' },
  { en: 'book', zh: '书', cat: '学校' }, { en: 'pen', zh: '钢笔', cat: '学校' },
  { en: 'pencil', zh: '铅笔', cat: '学校' }, { en: 'ruler', zh: '尺子', cat: '学校' },
  { en: 'bag', zh: '书包', cat: '学校' }, { en: 'eraser', zh: '橡皮', cat: '学校' },
  { en: 'desk', zh: '课桌', cat: '学校' }, { en: 'chair', zh: '椅子', cat: '学校' }
];

export const EN_CATS = [...new Set(EN_WORDS.map((w) => w.cat))];

/** 语境句：题面里出现目标词，问它在句中的意思（答案不出现在题干陈述中） */
export const EN_CONTEXTS = [
  { s: 'I say hello to my teacher.', word: 'teacher', zh: '老师' },
  { s: 'Look at the red apple.', word: 'apple', zh: '苹果' },
  { s: 'My mother is a teacher.', word: 'mother', zh: '妈妈' },
  { s: 'The cat is under the table.', word: 'cat', zh: '猫' },
  { s: 'I have six books.', word: 'six', zh: '六' },
  { s: 'We play football after school.', word: 'play', zh: '玩' },
  { s: 'She is my sister.', word: 'sister', zh: '姐妹' },
  { s: 'The panda is black and white.', word: 'panda', zh: '熊猫' },
  { s: 'I drink water in the morning.', word: 'drink', zh: '喝' },
  { s: 'The bird can fly high.', word: 'bird', zh: '鸟' },
  { s: 'My father drives a car.', word: 'father', zh: '爸爸' },
  { s: 'The rabbit likes carrots.', word: 'rabbit', zh: '兔子' }
];

/* ------------------------- 语音池 ------------------------- */

export const RHYME_SETS = [
  ['cat', 'hat', 'bat', 'rat'],
  ['dog', 'frog', 'log', 'jog'],
  ['cake', 'lake', 'make', 'take'],
  ['bike', 'like', 'kite', 'white'],
  ['sun', 'fun', 'run', 'bun'],
  ['bed', 'red', 'led', 'shed'],
  ['star', 'car', 'far', 'jar'],
  ['moon', 'soon', 'spoon', 'balloon']
];

export const DIGRAPH_BANK = [
  { en: 'ship', dg: 'sh' }, { en: 'fish', dg: 'sh' }, { en: 'shoe', dg: 'sh' }, { en: 'shop', dg: 'sh' },
  { en: 'chair', dg: 'ch' }, { en: 'lunch', dg: 'ch' }, { en: 'teacher', dg: 'ch' }, { en: 'peach', dg: 'ch' },
  { en: 'three', dg: 'th' }, { en: 'this', dg: 'th' }, { en: 'mother', dg: 'th' }, { en: 'mouth', dg: 'th' },
  { en: 'phone', dg: 'ph' }, { en: 'graph', dg: 'ph' }, { en: 'photo', dg: 'ph' }
];

export const BLEND_BANK = [
  { en: 'black', blend: 'bl' }, { en: 'blue', blend: 'bl' },
  { en: 'bread', blend: 'br' }, { en: 'brown', blend: 'br' },
  { en: 'green', blend: 'gr' }, { en: 'grape', blend: 'gr' },
  { en: 'street', blend: 'st' }, { en: 'star', blend: 'st' },
  { en: 'swim', blend: 'sw' }, { en: 'snow', blend: 'sn' },
  { en: 'plane', blend: 'pl' }, { en: 'play', blend: 'pl' },
  { en: 'clock', blend: 'cl' }, { en: 'clean', blend: 'cl' },
  { en: 'dress', blend: 'dr' }, { en: 'drink', blend: 'dr' },
  { en: 'flower', blend: 'fl' }, { en: 'frog', blend: 'fr' },
  { en: 'train', blend: 'tr' }, { en: 'tree', blend: 'tr' }
];

export const SILENT_E = ['cake', 'bike', 'kite', 'name', 'home', 'nose', 'make', 'five', 'nine', 'rope'];
export const SOUND_E = ['he', 'she', 'me', 'we', 'be'];

export const LETTER_SOUNDS = [
  { letters: 'sh', sound: '/ʃ/' }, { letters: 'ch', sound: '/tʃ/' },
  { letters: 'th', sound: '/θ/' }, { letters: 'ph', sound: '/f/' }
];

/* ------------------------- 拼写池 ------------------------- */

export const FORMS_BANK = [
  { en: 'play', zh: '玩', third: 'plays', ing: 'playing', past: 'played' },
  { en: 'go', zh: '去', third: 'goes', ing: 'going', past: 'went' },
  { en: 'do', zh: '做', third: 'does', ing: 'doing', past: 'did' },
  { en: 'have', zh: '有', third: 'has', ing: 'having', past: 'had' },
  { en: 'watch', zh: '观看', third: 'watches', ing: 'watching', past: 'watched' },
  { en: 'read', zh: '读', third: 'reads', ing: 'reading', past: 'read' },
  { en: 'swim', zh: '游泳', third: 'swims', ing: 'swimming', past: 'swam' },
  { en: 'run', zh: '跑', third: 'runs', ing: 'running', past: 'ran' },
  { en: 'eat', zh: '吃', third: 'eats', ing: 'eating', past: 'ate' },
  { en: 'write', zh: '写', third: 'writes', ing: 'writing', past: 'wrote' },
  { en: 'study', zh: '学习', third: 'studies', ing: 'studying', past: 'studied' },
  { en: 'fly', zh: '飞', third: 'flies', ing: 'flying', past: 'flew' },
  { en: 'cook', zh: '做饭', third: 'cooks', ing: 'cooking', past: 'cooked' },
  { en: 'walk', zh: '走', third: 'walks', ing: 'walking', past: 'walked' },
  { en: 'teach', zh: '教', third: 'teaches', ing: 'teaching', past: 'taught' },
  { en: 'draw', zh: '画画', third: 'draws', ing: 'drawing', past: 'drew' }
];

export const PLURAL_BANK = [
  { en: 'cat', zh: '猫', pl: 'cats' }, { en: 'book', zh: '书', pl: 'books' },
  { en: 'dog', zh: '狗', pl: 'dogs' }, { en: 'apple', zh: '苹果', pl: 'apples' },
  { en: 'bus', zh: '公交车', pl: 'buses' }, { en: 'box', zh: '盒子', pl: 'boxes' },
  { en: 'baby', zh: '婴儿', pl: 'babies' }, { en: 'knife', zh: '刀', pl: 'knives' },
  { en: 'man', zh: '男人', pl: 'men' }, { en: 'child', zh: '孩子', pl: 'children' },
  { en: 'foot', zh: '脚', pl: 'feet' }, { en: 'tooth', zh: '牙齿', pl: 'teeth' },
  { en: 'fish', zh: '鱼', pl: 'fish' }, { en: 'sheep', zh: '绵羊', pl: 'sheep' },
  { en: 'pen', zh: '钢笔', pl: 'pens' }, { en: 'car', zh: '小汽车', pl: 'cars' },
  { en: 'watch', zh: '手表', pl: 'watches' }, { en: 'story', zh: '故事', pl: 'stories' }
];

export const CAPITAL_BANK = ['Monday', 'Tuesday', 'Sunday', 'China', 'English', 'Tom', 'Amy', 'Beijing', 'Wednesday', 'Saturday', 'Shanghai', 'Jack'];
export const UPPER_BANK = ['hello', 'school', 'panda', 'yellow', 'teacher', 'orange', 'friend', 'family', 'apple', 'book', 'tiger', 'winter', 'chair', 'river', 'pencil', 'mother'];

/* ------------------------- 句子池 ------------------------- */

/** 每句一个明确填空点；affirm 只用于判断题，避免歧义 */
export const SENT_BANK = [
  { en: 'I am a student.', zh: '我是一名学生。', blank: 'am', wrongs: ['is', 'are', 'be'] },
  { en: 'She is my sister.', zh: '她是我姐姐。', blank: 'is', wrongs: ['am', 'are', 'be'] },
  { en: 'They are in the park.', zh: '他们在公园里。', blank: 'are', wrongs: ['is', 'am', 'be'] },
  { en: 'I have a red bag.', zh: '我有一个红色的书包。', blank: 'have', wrongs: ['has', 'had', 'having'] },
  { en: 'He goes to school every day.', zh: '他每天去上学。', blank: 'goes', wrongs: ['go', 'going', 'went'] },
  { en: 'Look! The boy is running.', zh: '看！那个男孩正在跑。', blank: 'is running', wrongs: ['run', 'runs', 'ran'] },
  { en: 'I watched TV last night.', zh: '我昨晚看了电视。', blank: 'watched', wrongs: ['watch', 'watches', 'watching'] },
  { en: 'I will visit my grandma tomorrow.', zh: '我明天要去看望奶奶。', blank: 'will', wrongs: ['am', 'was', 'do'] },
  { en: 'There are two books on the desk.', zh: '课桌上有两本书。', blank: 'are', wrongs: ['is', 'am', 'be'] },
  { en: 'My father goes to work by bus.', zh: '我爸爸乘公交车去上班。', blank: 'by', wrongs: ['on', 'in', 'at'] },
  { en: 'We have English on Monday.', zh: '我们星期一有英语课。', blank: 'on', wrongs: ['at', 'in', 'of'] },
  { en: 'The cat is under the chair.', zh: '猫在椅子下面。', blank: 'under', wrongs: ['on', 'in', 'behind'] },
  { en: 'She can sing very well.', zh: '她唱歌唱得很好。', blank: 'can', wrongs: ['is', 'do', 'does'] },
  { en: 'It is sunny and warm today.', zh: '今天晴朗又温暖。', blank: 'sunny', wrongs: ['rainy', 'snowy', 'windy'] },
  { en: 'I usually get up at seven.', zh: '我通常七点起床。', blank: 'usually', wrongs: ['never', 'sometimes', 'always'] },
  { en: 'Tom is taller than Jim.', zh: '汤姆比吉姆高。', blank: 'taller', wrongs: ['tall', 'tallest', 'more tall'] },
  { en: 'We should protect the environment.', zh: '我们应该保护环境。', blank: 'protect', wrongs: ['pollute', 'waste', 'throw'] },
  { en: 'I want to be a doctor.', zh: '我想成为一名医生。', blank: 'doctor', wrongs: ['teacher', 'farmer', 'driver'] },
  { en: 'The library is next to the park.', zh: '图书馆在公园旁边。', blank: 'next to', wrongs: ['on', 'under', 'in front of'] },
  { en: 'Turn right at the second crossing.', zh: '在第二个路口右转。', blank: 'right', wrongs: ['left', 'straight', 'around'] },
  { en: 'I am reading an interesting book.', zh: '我正在读一本有趣的书。', blank: 'reading', wrongs: ['read', 'reads', 'to read'] },
  { en: 'Spring is warm and green.', zh: '春天温暖而且满眼绿色。', blank: 'Spring', wrongs: ['Summer', 'Autumn', 'Winter'] },
  { en: 'My hobby is drawing pictures.', zh: '我的爱好是画画。', blank: 'drawing', wrongs: ['draw', 'draws', 'drew'] },
  { en: 'We are going to have a picnic.', zh: '我们打算去野餐。', blank: 'going', wrongs: ['go', 'went', 'goes'] },
  { en: 'My brother likes apples.', zh: '我弟弟喜欢苹果。', blank: 'likes', wrongs: ['like', 'liked', 'liking'] },
  { en: 'There is a bird in the tree.', zh: '树上有一只鸟。', blank: 'is', wrongs: ['are', 'am', 'be'] },
  { en: 'She has long black hair.', zh: '她有一头黑色长发。', blank: 'has', wrongs: ['have', 'had', 'having'] },
  { en: 'We are cleaning the classroom now.', zh: '我们现在正在打扫教室。', blank: 'are cleaning', wrongs: ['clean', 'cleans', 'cleaned'] },
  { en: 'He will play football tomorrow.', zh: '他明天要踢足球。', blank: 'will', wrongs: ['is', 'was', 'did'] },
  { en: 'The shop is near the school.', zh: '商店在学校附近。', blank: 'near', wrongs: ['on', 'under', 'behind'] }
];

/** be 动词句型转换用 */
export const BE_BANK = [
  { sub: 'She', be: 'is', rest: 'my sister', zh: '她是我姐姐。' },
  { sub: 'He', be: 'is', rest: 'a doctor', zh: '他是一名医生。' },
  { sub: 'Tom', be: 'is', rest: 'in the classroom', zh: '汤姆在教室里。' },
  { sub: 'They', be: 'are', rest: 'my friends', zh: '他们是我的朋友。' },
  { sub: 'We', be: 'are', rest: 'in the park', zh: '我们在公园里。' },
  { sub: 'You', be: 'are', rest: 'a good student', zh: '你是一名好学生。' },
  { sub: 'The cats', be: 'are', rest: 'under the table', zh: '猫在桌子下面。' },
  { sub: 'It', be: 'is', rest: 'a red apple', zh: '它是一个红苹果。' },
  { sub: 'My parents', be: 'are', rest: 'at home', zh: '我父母在家。' },
  { sub: 'The boy', be: 'is', rest: 'very happy', zh: '那个男孩很开心。' },
  { sub: 'She', be: 'is', rest: 'at home', zh: '她在家里。' },
  { sub: 'They', be: 'are', rest: 'in the classroom', zh: '他们在教室里。' },
  { sub: 'I', be: 'am', rest: 'a pupil', zh: '我是一名小学生。' },
  { sub: 'The girls', be: 'are', rest: 'my friends', zh: '这些女孩是我的朋友。' }
];

export const ORDER_BANK = [
  { words: ['I', 'have', 'a', 'red', 'bag'], zh: '我有一个红色的书包。' },
  { words: ['She', 'is', 'my', 'sister'], zh: '她是我姐姐。' },
  { words: ['We', 'play', 'football', 'after', 'school'], zh: '放学后我们踢足球。' },
  { words: ['The', 'cat', 'is', 'under', 'the', 'chair'], zh: '猫在椅子下面。' },
  { words: ['I', 'go', 'to', 'school', 'by', 'bus'], zh: '我乘公交车去上学。' },
  { words: ['He', 'likes', 'reading', 'books'], zh: '他喜欢读书。' },
  { words: ['My', 'mother', 'is', 'a', 'teacher'], zh: '我妈妈是老师。' },
  { words: ['Can', 'you', 'swim', 'well'], zh: '你游泳游得好吗？' },
  { words: ['He', 'is', 'my', 'friend'], zh: '他是我的朋友。' },
  { words: ['They', 'are', 'in', 'the', 'park'], zh: '他们在公园里。' },
  { words: ['I', 'like', 'red', 'apples'], zh: '我喜欢红苹果。' },
  { words: ['She', 'can', 'sing', 'well'], zh: '她唱歌唱得好。' }
];

export const PUNCT_BANK = [
  { text: 'How are you', mark: '?' }, { text: 'What is your name', mark: '?' },
  { text: 'Where is my book', mark: '?' }, { text: 'Do you like apples', mark: '?' },
  { text: 'I am a student', mark: '.' }, { text: 'This is my mother', mark: '.' },
  { text: 'We go to school by bus', mark: '.' }, { text: 'The cat is under the chair', mark: '.' },
  { text: 'What a lovely day', mark: '!' }, { text: 'Happy birthday', mark: '!' },
  { text: 'Look at the big elephant', mark: '!' }, { text: 'How nice the park is', mark: '!' },
  { text: 'Are you happy', mark: '?' }, { text: 'Where do you live', mark: '?' },
  { text: 'I like apples', mark: '.' }, { text: 'My father is a doctor', mark: '.' },
  { text: 'What a beautiful flower', mark: '!' }, { text: 'How fast he runs', mark: '!' }
];

export const ERROR_BANK = [
  {
    correct: 'She is my sister.',
    wrongs: ['She are my sister.', 'She am my sister.', 'She be my sister.']
  },
  {
    correct: 'There are two books on the desk.',
    wrongs: ['There is two books on the desk.', 'There am two books on the desk.', 'There be two books on the desk.']
  },
  {
    correct: 'I watched TV last night.',
    wrongs: ['I watch TV last night.', 'I watches TV last night.', 'I watching TV last night.']
  },
  {
    correct: 'He goes to school every day.',
    wrongs: ['He go to school every day.', 'He going to school every day.', 'He went to school every day.']
  },
  {
    correct: 'Tom is taller than Jim.',
    wrongs: ['Tom is tall than Jim.', 'Tom is tallest than Jim.', 'Tom is more tall than Jim.']
  },
  {
    correct: 'The cat is under the chair.',
    wrongs: ['The cat is on under the chair.', 'The cat are under the chair.', 'The cat is under chair.']
  },
  {
    correct: 'I am reading an interesting book.',
    wrongs: ['I am read an interesting book.', 'I am reads an interesting book.', 'I reading an interesting book.']
  },
  {
    correct: 'We should protect the environment.',
    wrongs: ['We should protects the environment.', 'We should protecting the environment.', 'We should protected the environment.']
  },
  {
    correct: 'My brother likes apples.',
    wrongs: ['My brother like apples.', 'My brother liking apples.', 'My brother liked apples every day.']
  },
  {
    correct: 'There is a bird in the tree.',
    wrongs: ['There are a bird in the tree.', 'There am a bird in the tree.', 'There be a bird in the tree.']
  },
  {
    correct: 'She has long black hair.',
    wrongs: ['She have long black hair.', 'She having long black hair.', 'She has long black hairs.']
  },
  {
    correct: 'He will play football tomorrow.',
    wrongs: ['He will plays football tomorrow.', 'He will playing football tomorrow.', 'He will played football tomorrow.']
  }
];

export const SUBJECT_BANK = [
  { sent: 'She is my sister.', sub: 'She', wrongs: ['is', 'my', 'sister'] },
  { sent: 'The cat is under the chair.', sub: 'The cat', wrongs: ['is', 'under', 'chair'] },
  { sent: 'My father goes to work by bus.', sub: 'My father', wrongs: ['goes', 'work', 'bus'] },
  { sent: 'We play football after school.', sub: 'We', wrongs: ['play', 'football', 'school'] },
  { sent: 'Tom is taller than Jim.', sub: 'Tom', wrongs: ['is', 'taller', 'Jim'] },
  { sent: 'The library is next to the park.', sub: 'The library', wrongs: ['is', 'next', 'park'] },
  { sent: 'I am reading an interesting book.', sub: 'I', wrongs: ['am', 'reading', 'book'] },
  { sent: 'My mother is a teacher.', sub: 'My mother', wrongs: ['is', 'teacher', 'a'] }
];

/* ------------------------- 语法池 ------------------------- */

export const SUBJECT_BE = [
  { sub: 'I', be: 'am', pred: 'a student' },
  { sub: 'You', be: 'are', pred: 'my friend' },
  { sub: 'He', be: 'is', pred: 'a doctor' },
  { sub: 'She', be: 'is', pred: 'my sister' },
  { sub: 'It', be: 'is', pred: 'a cat' },
  { sub: 'We', be: 'are', pred: 'in the park' },
  { sub: 'They', be: 'are', pred: 'my parents' },
  { sub: 'Tom', be: 'is', pred: 'in the classroom' }
];

export const POSSESSIVES = [
  { sub: 'I', word: 'my', hint: '我的' }, { sub: 'you', word: 'your', hint: '你的' },
  { sub: 'he', word: 'his', hint: '他的' }, { sub: 'she', word: 'her', hint: '她的' },
  { sub: 'we', word: 'our', hint: '我们的' }, { sub: 'they', word: 'their', hint: '他们的' },
  { sub: 'Tom', word: 'his', hint: '汤姆的' }, { sub: 'the girl', word: 'her', hint: '这个女孩的' }
];

export const ARTICLE_NOUNS = [
  { noun: 'apple', art: 'an' }, { noun: 'egg', art: 'an' }, { noun: 'orange', art: 'an' },
  { noun: 'elephant', art: 'an' }, { noun: 'umbrella', art: 'an' }, { noun: 'book', art: 'a' },
  { noun: 'cat', art: 'a' }, { noun: 'pen', art: 'a' }, { noun: 'dog', art: 'a' },
  { noun: 'pencil', art: 'a' }
];

export const PREP_SCENES = [
  { zh: '猫在桌子下面。', en: 'The cat is ___ the desk.', answer: 'under', wrongs: ['on', 'in', 'behind'] },
  { zh: '书在书包里面。', en: 'The book is ___ the bag.', answer: 'in', wrongs: ['on', 'under', 'behind'] },
  { zh: '球在椅子上面。', en: 'The ball is ___ the chair.', answer: 'on', wrongs: ['in', 'under', 'behind'] },
  { zh: '狗在门后面。', en: 'The dog is ___ the door.', answer: 'behind', wrongs: ['on', 'in', 'under'] },
  { zh: '树在房子旁边。', en: 'The tree is ___ the house.', answer: 'next to', wrongs: ['on', 'in', 'under'] },
  { zh: '鸟在天上飞。', en: 'The bird is ___ the sky.', answer: 'in', wrongs: ['on', 'under', 'behind'] },
  { zh: '铅笔在课桌上。', en: 'The pencil is ___ the desk.', answer: 'on', wrongs: ['in', 'under', 'behind'] },
  { zh: '妈妈在厨房里。', en: 'My mother is ___ the kitchen.', answer: 'in', wrongs: ['on', 'under', 'next to'] },
  { zh: '椅子在门旁边。', en: 'The chair is ___ the door.', answer: 'next to', wrongs: ['on', 'in', 'under'] },
  { zh: '书在桌子上面。', en: 'The book is ___ the table.', answer: 'on', wrongs: ['in', 'under', 'behind'] },
  { zh: '猫在床下面。', en: 'The cat is ___ the bed.', answer: 'under', wrongs: ['on', 'in', 'behind'] },
  { zh: '花在花园里面。', en: 'The flowers are ___ the garden.', answer: 'in', wrongs: ['on', 'under', 'behind'] }
];

export const COMPARATIVES = [
  { adj: 'tall', comp: 'taller', wrongs: ['tallest', 'more tall', 'tallerer'] },
  { adj: 'long', comp: 'longer', wrongs: ['longest', 'more long', 'longerer'] },
  { adj: 'big', comp: 'bigger', wrongs: ['biggest', 'more big', 'biger'] },
  { adj: 'small', comp: 'smaller', wrongs: ['smallest', 'more small', 'smallerer'] },
  { adj: 'heavy', comp: 'heavier', wrongs: ['heaviest', 'more heavy', 'heavyer'] },
  { adj: 'happy', comp: 'happier', wrongs: ['happiest', 'more happy', 'happyier'] },
  { adj: 'fast', comp: 'faster', wrongs: ['fastest', 'more fast', 'fasterer'] },
  { adj: 'old', comp: 'older', wrongs: ['oldest', 'more old', 'olderer'] }
];

export const FUTURE_FILLS = [
  { sub: 'I', act: 'visit my grandma', when: 'tomorrow' },
  { sub: 'We', act: 'have a picnic', when: 'next Sunday' },
  { sub: 'She', act: 'buy a book', when: 'tomorrow' },
  { sub: 'They', act: 'play football', when: 'next week' },
  { sub: 'He', act: 'clean the room', when: 'after school' },
  { sub: 'Tom', act: 'draw a picture', when: 'this evening' },
  { sub: 'My mother', act: 'cook dinner', when: 'tonight' },
  { sub: 'The students', act: 'plant trees', when: 'next weekend' }
];

export const PAST_FILLS = [
  { sub: 'I', past: 'visited', en: 'visit', obj: 'my grandparents', when: 'last weekend' },
  { sub: 'She', past: 'watched', en: 'watch', obj: 'TV', when: 'last night' },
  { sub: 'They', past: 'played', en: 'play', obj: 'football', when: 'yesterday' },
  { sub: 'He', past: 'went', en: 'go', obj: 'to the park', when: 'yesterday' },
  { sub: 'We', past: 'had', en: 'have', obj: 'a picnic', when: 'last Sunday' },
  { sub: 'Tom', past: 'ate', en: 'eat', obj: 'an apple', when: 'last morning' },
  { sub: 'My father', past: 'drove', en: 'drive', obj: 'to work', when: 'yesterday' },
  { sub: 'The girl', past: 'wrote', en: 'write', obj: 'a letter', when: 'last night' }
];

export const PROGRESSIVE_FILLS = [
  { sub: 'He', ing: 'reading', en: 'read', obj: 'a book' },
  { sub: 'She', ing: 'singing', en: 'sing', obj: 'a song' },
  { sub: 'They', ing: 'playing', en: 'play', obj: 'football' },
  { sub: 'I', ing: 'drawing', en: 'draw', obj: 'a picture' },
  { sub: 'We', ing: 'running', en: 'run', obj: 'on the playground' },
  { sub: 'The cat', ing: 'sleeping', en: 'sleep', obj: 'under the chair' },
  { sub: 'Tom', ing: 'writing', en: 'write', obj: 'a letter' },
  { sub: 'My mother', ing: 'cooking', en: 'cook', obj: 'dinner' }
];

export const THERE_BE = [
  { np: 'two books', be: 'are', place: 'on the desk' },
  { np: 'a cat', be: 'is', place: 'under the chair' },
  { np: 'many students', be: 'are', place: 'in the classroom' },
  { np: 'a big tree', be: 'is', place: 'in the park' },
  { np: 'some apples', be: 'are', place: 'in the bag' },
  { np: 'a pen', be: 'is', place: 'on the desk' },
  { np: 'three birds', be: 'are', place: 'in the tree' },
  { np: 'a library', be: 'is', place: 'next to the park' }
];

export const MODAL_FILLS = [
  { act: 'swim in the river', extra: 'It is dangerous.', answer: "mustn't", wrongs: ['can', 'must', 'should'] },
  { act: 'play with fire', extra: 'It is dangerous.', answer: "mustn't", wrongs: ['can', 'must', 'should'] },
  { act: 'cross the road', extra: 'The light is red.', answer: "mustn't", wrongs: ['can', 'must', 'should'] },
  { act: 'speak English', extra: 'You are in the English class.', answer: 'can', wrongs: ["mustn't", 'must', 'should'] },
  { act: 'help my mother', extra: 'She is busy.', answer: 'should', wrongs: ['can', "mustn't", 'must'] },
  { act: 'run in the classroom', extra: 'It is not safe.', answer: "mustn't", wrongs: ['can', 'must', 'should'] },
  { act: 'read this book', extra: 'It is very interesting.', answer: 'can', wrongs: ["mustn't", 'must', 'should'] },
  { act: 'be quiet', extra: 'We are in the library.', answer: 'should', wrongs: ['can', "mustn't", 'must'] }
];

export const QUESTION_WORDS = [
  { q: '___ is your name?', a: 'What', wrongs: ['Where', 'Who', 'When'] },
  { q: '___ is my book?', a: 'Where', wrongs: ['What', 'Who', 'How'] },
  { q: '___ is that man?', a: 'Who', wrongs: ['What', 'Where', 'When'] },
  { q: '___ old are you?', a: 'How', wrongs: ['What', 'Where', 'Who'] },
  { q: '___ do you get up?', a: 'When', wrongs: ['What', 'Where', 'Who'] },
  { q: '___ colour is it?', a: 'What', wrongs: ['Where', 'Who', 'When'] },
  { q: '___ many books do you have?', a: 'How', wrongs: ['What', 'Where', 'Who'] },
  { q: '___ is the weather today?', a: 'How', wrongs: ['What', 'Where', 'Who'] }
];

/* ------------------------- 交际池 ------------------------- */

export const D_NAMES = ['Tom', 'Lily', 'Amy', 'Bob', 'Lucy', 'Jack', 'Kate', 'Mike', 'Anna', 'Ben', 'Cindy', 'David', 'Emma', 'Frank', 'Grace', 'Henry'];
export const D_AGES = ['six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen'];
export const D_COLORS = ['red', 'blue', 'yellow', 'green', 'black', 'white', 'pink', 'purple', 'brown', 'grey'];
export const D_COUNTS = ['one', 'two', 'three', 'four', 'five', 'six', 'eight', 'ten', 'seven', 'nine'];
export const D_TIMES = ['seven o\'clock', 'eight o\'clock', 'nine o\'clock', 'ten o\'clock', 'seven thirty', 'eight thirty', 'six o\'clock', 'nine thirty'];
export const D_WEATHERS = ['sunny', 'rainy', 'windy', 'cloudy', 'snowy', 'hot', 'cold', 'warm', 'cool', 'dry'];
export const D_FRUITS = ['apples', 'bananas', 'pears', 'peaches', 'grapes', 'watermelons', 'oranges', 'mangoes'];
export const D_ACTIONS = ['swim', 'sing', 'dance', 'draw', 'cook', 'skate', 'jump', 'read'];
export const D_LOCATIONS = ['on the desk', 'in the bag', 'under the chair', 'on the bed', 'in the box', 'near the door', 'under the tree', 'on the shelf'];
export const D_DOINGS = ['reading', 'writing', 'drawing', 'singing', 'dancing', 'running', 'cooking', 'swimming'];

export const POLITE_PAIRS = [
  { q: 'Thank you.', a: "You're welcome." },
  { q: 'Sorry.', a: "That's all right." },
  { q: 'Here you are.', a: 'Thank you.' },
  { q: 'Happy birthday!', a: 'Thank you!' },
  { q: 'Goodbye!', a: 'See you!' },
  { q: 'Nice to meet you.', a: 'Nice to meet you, too.' },
  { q: 'Can I help you?', a: 'Yes, please.' },
  { q: 'Excuse me.', a: 'Yes? Can I help you?' }
];

/** 通用回答池：用于给每个交际外壳构造 3 个不匹配的干扰项 */
export const D_HOUSE = [
  "You're welcome.", "That's all right.", 'Thank you.', 'See you!',
  'Nice to meet you, too.', 'Yes, please.', 'Yes? Can I help you.',
  'I am fine, thank you.', 'My name is Tom.', "It's red.",
  "It's seven o'clock.", 'Five, please.', 'Yes, I can.', 'No, I don\'t.'
];
