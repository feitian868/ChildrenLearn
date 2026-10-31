/**
 * pet-shop.js —— 宠物商店三类商品池
 *   pet-food  一次性消耗品，进 pet.inventory.food
 *   pet-deco  永久解锁装饰，进 pet.ownedDeco，slot 决定可戴的位置
 *   pet-scene 永久解锁乐园，进 pet.ownedScene
 */

export const PET_FOODS = [
  { id: 'cookie',   category: 'pet-food', name: '小饼干',   emoji: '🍪', cost: 2, hunger: 30, mood: 0,  desc: '基础款，管饱' },
  { id: 'carrot',   category: 'pet-food', name: '胡萝卜',   emoji: '🥕', cost: 3, hunger: 40, mood: 0,  desc: '脆甜多汁' },
  { id: 'fish',     category: 'pet-food', name: '小鱼干',   emoji: '🐟', cost: 4, hunger: 45, mood: 10, desc: '美味还开心' },
  { id: 'drumstick',category: 'pet-food', name: '鸡腿',     emoji: '🍗', cost: 5, hunger: 50, mood: 5,  desc: '大块肉肉' },
  { id: 'fruits',   category: 'pet-food', name: '水果拼盘', emoji: '🍓', cost: 6, hunger: 35, mood: 15, desc: '营养又美味' },
];

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
