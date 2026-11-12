/**
 * pet-shop.js —— 宠物商店三类商品池
 *   pet-food  一次性消耗品，进 pet.inventory.food
 *   pet-deco  永久解锁装饰，进 pet.ownedDeco，slot 决定可戴的位置
 *   pet-scene 永久解锁乐园，进 pet.ownedScene
 */

export const PET_FOODS = [
  // species: 喜欢吃的物种列表 —— 喂喜欢的动物时效果 +50%，还会说开心话
  { id: 'cookie',    category: 'pet-food', name: '小饼干',   emoji: '🍪', cost: 1, hunger: 30, mood: 0,  desc: '基础款，管饱',     species: ['cat','dog','rabbit','panda','chick','koala'] },
  { id: 'carrot',    category: 'pet-food', name: '胡萝卜',   emoji: '🥕', cost: 2, hunger: 40, mood: 0,  desc: '脆甜多汁',         species: ['rabbit','chick'],                              hate:   ['cat','dog','panda','koala'] },
  { id: 'fish',      category: 'pet-food', name: '小鱼干',   emoji: '🐟', cost: 2, hunger: 45, mood: 10, desc: '美味还开心',       species: ['cat'],                                         hate:   ['rabbit','panda','koala'] },
  { id: 'drumstick', category: 'pet-food', name: '鸡腿',     emoji: '🍗', cost: 2, hunger: 50, mood: 5,  desc: '大块肉肉',         species: ['cat','dog'],                                   hate:   ['rabbit','panda','koala'] },
  { id: 'fruits',    category: 'pet-food', name: '水果拼盘', emoji: '🍓', cost: 3, hunger: 35, mood: 15, desc: '营养又美味',       species: ['rabbit','panda','chick','koala'],             hate:   ['dog'] },
];

/**
 * 物种→喜欢食物的反向索引（运行时快速查）
 * 以及每种动物的语音台词（按场景触发）
 *
 * voices 的每个键是「台词数组」：宠物说话时随机挑一句，避免每次重复同一句。
 * 台词除互动反应外，也承担鼓励作用（夸孩子努力、提醒休息、给学习打气）。
 */
export const SPECIES_TRAITS = {
  cat:    { likes: ['cookie','fish','drumstick'], hates: ['carrot','fruits'],
            voices: {
              like: ['喵~太好吃啦！谢谢你~', '喵~吃饱饱，学习更有精神啦！', '喵呜~你喂的特别香！'],
              hate: ['喵呜呜…我不想吃这个', '喵…这个不合我胃口，换一个好不好~'],
              levelup: ['我是长大了的大猫咪啦！', '喵！我升级啦，谢谢你一直照顾我~'],
              hi: ['喵~想和你玩！', '喵~今天也要一起加油学习哦！', '喵呜~见到你真开心！'],
              pet: ['呼噜呼噜…真舒服啊~', '喵~被你摸摸，心情超好！', '喵~你认真学习的样子最棒啦！'],
              play: ['喵！接住啦~再来一次嘛~', '喵喵~和你玩最开心！', '喵~玩够了就去做作业吧，我等你！'],
              clean: ['喵呜…洗得香香的~', '喵~干干净净，心情也亮亮的！'],
              dress: ['喵~我好漂亮呀！', '喵~这身打扮你眼光真好！'],
              undress: ['咦？摘掉啦~', '喵~轻松多啦！'],
              scene: ['喵~新家真好看！', '喵~谢谢你给我这么漂亮的家！'],
              hungry: ['喵…肚子饿啦，去商店换点吃的吧~', '喵…吃点东西才有力气玩呀~'],
              limit: ['喵…今天玩累啦，明天再玩~', '喵~我先睡啦，你也要早点休息哦！'],
              cheer: ['喵~你每天都有进步，我看得出来！', '喵~遇到难题别怕，慢慢想就会啦！', '喵~今天也辛苦啦，抱抱你！']
            } },
  dog:    { likes: ['cookie','drumstick'],        hates: ['carrot','fruits'],
            voices: {
              like: ['汪汪！好香啊谢谢主人！', '汪汪！吃饱啦，陪你一起加油！', '汪汪汪！这是我最爱的味道！'],
              hate: ['呜呜…我不想吃这个啦', '呜呜…这个我不太喜欢，换一个吧~'],
              levelup: ['哇！我长大啦可以看家了！', '汪汪！我升级啦，会一直保护你！'],
              hi: ['汪汪~主人你好！', '汪汪！今天也要努力呀，我陪着你！', '汪汪~见到你就摇尾巴！'],
              pet: ['汪汪！再摸摸我~真舒服啊~', '汪汪~被主人摸摸最幸福啦！', '汪汪！你写得真认真，我都看呆了！'],
              play: ['汪汪！球球最好玩啦！', '汪汪！接住啦，我们好厉害！', '汪汪~玩一会儿就回去学习吧！'],
              clean: ['哗啦啦~干净又舒服！', '汪汪！洗完澡我香喷喷的！'],
              dress: ['汪汪！我帅不帅？', '汪汪！这身打扮太适合我啦！'],
              undress: ['咦，衣服没了~', '汪汪~轻装上阵！'],
              scene: ['汪汪！新家好大呀！', '汪汪！这个家我太喜欢啦！'],
              hungry: ['呜呜…肚子饿啦，去商店换点吃的吧~', '呜呜…肚子咕咕叫，想吃点东西~'],
              limit: ['呼…今天玩累啦，明天再来~', '呼…我先歇会儿，你也别太晚睡哦！'],
              cheer: ['汪汪！你坚持的样子最酷啦！', '汪汪！写完作业再来玩，我等你！', '汪汪！错了没关系，再试一次就对了！']
            } },
  rabbit: { likes: ['cookie','carrot','fruits'],  hates: ['fish','drumstick'],
            voices: {
              like: ['咔嚓咔嚓~好脆好甜！', '蹦蹦~吃饱啦，学习也蹦蹦跳跳！', '咔嚓咔嚓~最爱的美味！'],
              hate: ['我不吃肉的呜呜', '唧唧…这个我不想吃，换一个吧~'],
              levelup: ['我长大啦！蹦得更高了！', '蹦蹦！我升级啦，谢谢你陪着我！'],
              hi: ['蹦蹦~我来啦！', '蹦蹦~今天我们一起变得更棒吧！', '蹦蹦~等你好久啦！'],
              pet: ['唧唧…好舒服呀~', '蹦蹦~你摸我我就安静下来啦！', '唧唧~你读书的声音好好听！'],
              play: ['蹦蹦蹦！再来一次嘛~', '蹦蹦~我们配合得真好！', '蹦蹦~玩完记得收心学习哦！'],
              clean: ['洗得白白的啦~', '唧唧~白白的我最好看！'],
              dress: ['哇！我变漂亮啦~', '蹦蹦~你选的装饰真好看！'],
              undress: ['咦，摘下来啦~', '蹦蹦~摘下也很轻松！'],
              scene: ['蹦蹦！新家真好看~', '蹦蹦~谢谢你的新家！'],
              hungry: ['唧唧…肚子咕咕叫，去商店换点吃的吧~', '唧唧…想吃胡萝卜啦~'],
              limit: ['蹦累啦，明天再玩~', '蹦累啦，我先睡，你也早点休息~'],
              cheer: ['蹦蹦~你今天很努力，我看到了！', '蹦蹦~慢一点没关系，稳稳地进步！', '蹦蹦~我们明天继续加油！']
            } },
  panda:  { likes: ['cookie','fruits'],           hates: ['fish','drumstick'],
            voices: {
              like: ['嗯嗯…甜甜的，好满足', '嗯~吃饱啦，慢慢学，慢慢长大！', '嗯嗯…这个真好吃！'],
              hate: ['这个我真的吃不下呀', '嗯…这个不合口味，换一个吧~'],
              levelup: ['我长大了！会爬更高的树啦！', '嗯！我升级啦，谢谢你！'],
              hi: ['竹子竹子~我最喜欢！', '嗯~今天想和你一起慢慢努力！', '嗯~见到你真好！'],
              pet: ['嗯嗯…好舒服呀~', '嗯~被你摸摸，困意都没啦！', '嗯~你写字的样子真专注！'],
              play: ['滚滚~真好玩！', '滚滚~再来一次！', '嗯~玩一会儿就安心学习吧！'],
              clean: ['洗香香，好舒服~', '嗯~干净的感觉真好！'],
              dress: ['哇，我好看吗？', '嗯~你挑的真好看！'],
              undress: ['嗯？摘掉啦~', '嗯~轻松多了！'],
              scene: ['嗯~新家很舒服！', '嗯~谢谢你给我一个家！'],
              hungry: ['嗯…肚子饿啦，去商店换点吃的吧~', '嗯…有点饿，想吃竹子和水果~'],
              limit: ['有点累啦，明天再玩~', '嗯…我先睡了，要抱抱吗？'],
              cheer: ['嗯~不着急，一步一步来就好！', '嗯~你今天坚持下来了，很棒！', '嗯~我们明天再一起努力！']
            } },
  chick:  { likes: ['cookie','carrot','fruits'],  hates: ['fish'],
            voices: {
              like: ['叽叽~好吃好吃！', '叽叽~吃饱啦，精神满满！', '啾啾~谢谢你的美味！'],
              hate: ['叽叽…这个我不吃', '叽叽…换一个好不好嘛~'],
              levelup: ['啾啾！我长大啦会飞了！', '叽叽！我升级啦，好开心！'],
              hi: ['叽叽~一起来玩吧！', '叽叽~今天也要一起进步哦！', '啾啾~看到你就唱歌！'],
              pet: ['叽叽~真舒服呀~', '叽叽~你的手好温暖！', '叽叽~你学习时我在旁边陪着你！'],
              play: ['啾啾！接住啦！', '叽叽~飞起来啦，好棒！', '叽叽~玩好就去写作业吧！'],
              clean: ['扑棱扑棱~洗得香香的！', '叽叽~羽毛亮亮的啦！'],
              dress: ['叽叽~我最漂亮啦！', '啾啾~这身装扮真精神！'],
              undress: ['咦，摘下来啦~', '叽叽~轻快多啦！'],
              scene: ['啾啾！新家真好看！', '叽叽~谢谢你，我好喜欢！'],
              hungry: ['叽叽…肚子饿啦，去商店换点吃的吧~', '叽叽…想吃小饼干啦~'],
              limit: ['叽…今天玩累啦，明天再玩~', '叽叽~我先睡啦，晚安！'],
              cheer: ['叽叽~你每天都比昨天更棒！', '叽叽~做错了也没关系，再来一次！', '叽叽~陪你一起加油！']
            } },
  koala:  { likes: ['cookie','fruits'],           hates: ['fish','drumstick'],
            voices: {
              like: ['嗯嗯…好甜，谢谢', '呼噜~吃饱啦，好幸福！', '嗯~你选的水果最甜！'],
              hate: ['这个不行…我只吃树叶和水果', '呼噜…这个我不吃，换一个吧~'],
              levelup: ['我长大了！可以爬更高的桉树啦！', '呼噜~我升级啦，谢谢你照顾我！'],
              hi: ['呼噜~我在呢~', '呼噜~今天也一起慢慢努力吧！', '呼噜~你来啦，我等你很久啦！'],
              pet: ['呼噜…真舒服啊~', '呼噜噜~你的手好温柔！', '呼噜~你认真的样子真好看！'],
              play: ['呼噜噜~好开心！', '呼噜~再来一次~', '呼噜~玩好了就回去写作业吧！'],
              clean: ['洗得香香的啦~', '呼噜~干干净净真舒服！'],
              dress: ['嗯…我好看吗？', '呼噜~你眼光真好！'],
              undress: ['咦，摘掉啦~', '呼噜~轻松多啦！'],
              scene: ['呼噜~新家真好！', '呼噜~谢谢你给我一个舒服的家！'],
              hungry: ['呼噜…肚子饿啦，去商店换点吃的吧~', '呼噜…想吃甜甜的水果~'],
              limit: ['困啦…明天再玩~', '呼噜…我要睡啦，你也早点休息哦！'],
              cheer: ['呼噜~慢一点也没关系，稳稳地来！', '呼噜~你今天很努力啦，夸夸你！', '呼噜~明天我们还一起加油！']
            } }
};

/**
 * 查某种食物对某种动物的效果修饰
 * 返回 { modifier: 1.5 / 1 / 0.7, tag: 'like' / 'normal' / 'hate' }
 */
export function foodModifierFor(foodId, speciesId) {
  const trait = SPECIES_TRAITS[speciesId];
  if (!trait) return { modifier: 1, tag: 'normal' };
  if (trait.likes.includes(foodId)) return { modifier: 1.5, tag: 'like' };
  if (trait.hates.includes(foodId)) return { modifier: 0.7, tag: 'hate' };
  return { modifier: 1, tag: 'normal' };
}

export const PET_DECOS = [
  { id: 'red-bow',   category: 'pet-deco', slot: 'head', name: '红色蝴蝶结', emoji: '🎀', cost: 8 },
  { id: 'crown',     category: 'pet-deco', slot: 'head', name: '小皇冠',     emoji: '👑', cost: 15 },
  { id: 'xmas-hat',  category: 'pet-deco', slot: 'head', name: '圣诞帽',     emoji: '🎄', cost: 10 },
  { id: 'scarf',     category: 'pet-deco', slot: 'neck', name: '红围巾',     emoji: '🧣', cost: 6 },
  { id: 'collar',    category: 'pet-deco', slot: 'neck', name: '粉色项圈',   emoji: '💗', cost: 9 },
  { id: 'tie',       category: 'pet-deco', slot: 'neck', name: '小领带',     emoji: '👔', cost: 11 },
  { id: 'sunglass',  category: 'pet-deco', slot: 'face', name: '墨镜',       emoji: '🕶️', cost: 12 },
  { id: 'wings',     category: 'pet-deco', slot: 'back', name: '羽毛翅膀',   emoji: '🪶', cost: 20 },
];

export const PET_SCENES = [
  { id: 'garden',   category: 'pet-scene', name: '花园草地',   emoji: '🌿', cost: 0  }, // 初始解锁，保持 0 免进商店
  { id: 'home',     category: 'pet-scene', name: '温馨小窝',   emoji: '🏠', cost: 5 },
  { id: 'beach',    category: 'pet-scene', name: '海边沙滩',   emoji: '🏖️', cost: 10 },
  { id: 'snow',     category: 'pet-scene', name: '雪山之巅',   emoji: '🏔️', cost: 15 },
  { id: 'candy',    category: 'pet-scene', name: '糖果王国',   emoji: '🍭', cost: 22 },
  { id: 'space',    category: 'pet-scene', name: '太空乐园',   emoji: '🛸', cost: 25 },
];

/** 给 Shop 模块消费的扁平列表，带 category 标签区分普通商品和宠物商品 */
export const ALL_PET_ITEMS = [...PET_FOODS, ...PET_DECOS, ...PET_SCENES];

/** 宝箱会掉落的食物包（不进商店，只从宝箱得） */
export const CHEST_FOOD_PACKS = [
  { food: 'cookie',   count: 2 },
  { food: 'cookie',   count: 3 },
  { food: 'carrot',   count: 2 },
  { food: 'fish',     count: 2 },
  { food: 'carrot',   count: 1 },
];
