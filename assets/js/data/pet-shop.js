/**
 * pet-shop.js —— 宠物商店三类商品池
 *   pet-food  一次性消耗品，进 pet.inventory.food
 *   pet-deco  永久解锁装饰，进 pet.ownedDeco，slot 决定可戴的位置
 *   pet-scene 永久解锁乐园，进 pet.ownedScene
 */

export const PET_FOODS = [
  // species: 喜欢吃的物种列表 —— 喂喜欢的动物时效果 +50%，还会说开心话
  { id: 'cookie',    category: 'pet-food', name: '小饼干',   emoji: '🍪', cost: 2, hunger: 30, mood: 0,  desc: '基础款，管饱',     species: ['cat','dog','rabbit','panda','chick','koala'] },
  { id: 'carrot',    category: 'pet-food', name: '胡萝卜',   emoji: '🥕', cost: 3, hunger: 40, mood: 0,  desc: '脆甜多汁',         species: ['rabbit','chick'],                              hate:   ['cat','dog','panda','koala'] },
  { id: 'fish',      category: 'pet-food', name: '小鱼干',   emoji: '🐟', cost: 4, hunger: 45, mood: 10, desc: '美味还开心',       species: ['cat'],                                         hate:   ['rabbit','panda','koala'] },
  { id: 'drumstick', category: 'pet-food', name: '鸡腿',     emoji: '🍗', cost: 5, hunger: 50, mood: 5,  desc: '大块肉肉',         species: ['cat','dog'],                                   hate:   ['rabbit','panda','koala'] },
  { id: 'fruits',    category: 'pet-food', name: '水果拼盘', emoji: '🍓', cost: 6, hunger: 35, mood: 15, desc: '营养又美味',       species: ['rabbit','panda','chick','koala'],             hate:   ['dog'] },
];

/**
 * 物种→喜欢食物的反向索引（运行时快速查）
 * 以及每种动物的语音台词（按场景触发）
 */
export const SPECIES_TRAITS = {
  cat:    { likes: ['cookie','fish','drumstick'], hates: ['carrot','fruits'],
            voices: { like: '喵~太好吃啦！谢谢你~', hate: '喵呜呜…我不想吃这个', levelup: '我是长大了的大猫咪啦！', hi: '喵~想和你玩！' } },
  dog:    { likes: ['cookie','drumstick'],        hates: ['carrot','fruits'],
            voices: { like: '汪汪！好香啊谢谢主人！', hate: '呜呜…我不想吃这个啦', levelup: '哇！我长大啦可以看家了！', hi: '汪汪~主人你好！' } },
  rabbit: { likes: ['cookie','carrot','fruits'],  hates: ['fish','drumstick'],
            voices: { like: '咔嚓咔嚓~好脆好甜！', hate: '我不吃肉的呜呜', levelup: '我长大啦！蹦得更高了！', hi: '蹦蹦~我来啦！' } },
  panda:  { likes: ['cookie','fruits'],           hates: ['fish','drumstick'],
            voices: { like: '嗯嗯…甜甜的，好满足', hate: '这个我真的吃不下呀', levelup: '我长大了！会爬更高的树啦！', hi: '竹子竹子~我最喜欢！' } },
  chick:  { likes: ['cookie','carrot','fruits'],  hates: ['fish'],
            voices: { like: '叽叽~好吃好吃！', hate: '叽叽…这个我不吃', levelup: '啾啾！我长大啦会飞了！', hi: '叽叽~一起来玩吧！' } },
  koala:  { likes: ['cookie','fruits'],           hates: ['fish','drumstick'],
            voices: { like: '嗯嗯…好甜，谢谢', hate: '这个不行…我只吃树叶和水果', levelup: '我长大了！可以爬更高的桉树啦！', hi: '呼噜~我在呢~' } },
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
  { id: 'red-bow',   category: 'pet-deco', slot: 'head', name: '红色蝴蝶结', emoji: '🎀', cost: 15 },
  { id: 'crown',     category: 'pet-deco', slot: 'head', name: '小皇冠',     emoji: '👑', cost: 30 },
  { id: 'xmas-hat',  category: 'pet-deco', slot: 'head', name: '圣诞帽',     emoji: '🎄', cost: 20 },
  { id: 'scarf',     category: 'pet-deco', slot: 'neck', name: '红围巾',     emoji: '🧣', cost: 12 },
  { id: 'collar',    category: 'pet-deco', slot: 'neck', name: '粉色项圈',   emoji: '💗', cost: 18 },
  { id: 'tie',       category: 'pet-deco', slot: 'neck', name: '小领带',     emoji: '👔', cost: 22 },
  { id: 'sunglass',  category: 'pet-deco', slot: 'face', name: '墨镜',       emoji: '🕶️', cost: 25 },
  { id: 'wings',     category: 'pet-deco', slot: 'back', name: '羽毛翅膀',   emoji: '🪶', cost: 40 },
];

export const PET_SCENES = [
  { id: 'garden',   category: 'pet-scene', name: '花园草地',   emoji: '🌿', cost: 0  }, // 初始解锁
  { id: 'home',     category: 'pet-scene', name: '温馨小窝',   emoji: '🏠', cost: 10 },
  { id: 'beach',    category: 'pet-scene', name: '海边沙滩',   emoji: '🏖️', cost: 20 },
  { id: 'snow',     category: 'pet-scene', name: '雪山之巅',   emoji: '🏔️', cost: 30 },
  { id: 'candy',    category: 'pet-scene', name: '糖果王国',   emoji: '🍭', cost: 45 },
  { id: 'space',    category: 'pet-scene', name: '太空乐园',   emoji: '🛸', cost: 50 },
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
