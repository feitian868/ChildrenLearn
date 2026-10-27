/**
 * rewards.js —— 奖励池集中配置
 * 想增删宝箱奖励或积分商店商品，只改这一个文件。
 *
 * 宝箱奖励 type：
 *   points   —— 直接加积分
 *   minigame —— 打开互动小游戏（game: wheel / bubble / memory）
 *   video    —— 播放预设视频（src 可替换成你自己的视频地址）
 */

export const CHEST_REWARDS = [
  {
    id: 'chest-points-2',
    type: 'points',
    name: '2 积分',
    emoji: '⭐',
    points: 2,
    weight: 24,
    desc: '宝箱里跳出一把金色小星星，积分直接进账。'
  },
  {
    id: 'chest-points-5',
    type: 'points',
    name: '5 积分',
    emoji: '🌟',
    points: 5,
    weight: 12,
    desc: '今天的运气不错，是双倍星星！'
  },
  {
    id: 'chest-minigame-wheel',
    type: 'minigame',
    game: 'wheel',
    name: '幸运转盘',
    emoji: '🎡',
    weight: 18,
    desc: '转一转，看看指针停在哪一格。'
  },
  {
    id: 'chest-minigame-bubble',
    type: 'minigame',
    game: 'bubble',
    name: '泡泡大作战',
    emoji: '🫧',
    weight: 18,
    desc: '20 秒内戳破尽可能多的泡泡。'
  },
  {
    id: 'chest-minigame-memory',
    type: 'minigame',
    game: 'memory',
    name: '记忆翻牌',
    emoji: '🃏',
    weight: 16,
    desc: '翻开卡片，找出全部相同的图案。'
  },
  {
    id: 'chest-video-sintel',
    type: 'video',
    name: '动画短片 · 预告',
    emoji: '🎬',
    weight: 6,
    src: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    desc: '一段公开授权的动画预告片，放松一下眼睛。'
  },
  {
    id: 'chest-video-bunny',
    type: 'video',
    name: '动画短片 · 小兔子',
    emoji: '🎞️',
    weight: 6,
    src: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
    desc: '一段公开授权的动画预告片，看完继续加油。'
  }
];

/** 积分商店商品（兑换记录写入 dailyTaskData.orders） */
export const SHOP_ITEMS = [
  {
    id: 'shop-story',
    name: '睡前多讲一个故事',
    emoji: '📚',
    cost: 100,
    desc: '今晚由你来挑故事书。'
  },
  {
    id: 'shop-draw',
    name: '画画 / 手工 30 分钟',
    emoji: '🎨',
    cost: 200,
    desc: '自由创作时间，不被打扰。'
  },
  {
    id: 'shop-game',
    name: '亲子游戏 30 分钟',
    emoji: '🎲',
    cost: 300,
    desc: '和爸爸妈妈一起玩一局桌游或扑克。'
  },
  {
    id: 'shop-dessert',
    name: '选一份小甜点',
    emoji: '🍰',
    cost: 400,
    desc: '周末兑现，由你决定吃什么。'
  },
  {
    id: 'shop-movie',
    name: '周末家庭电影夜',
    emoji: '🍿',
    cost: 600,
    desc: '你来选片，全家一起看。'
  },
  {
    id: 'shop-trip',
    name: '周末公园 / 户外半天',
    emoji: '🌳',
    cost: 800,
    desc: '去公园骑车、放风筝或散步。'
  },
  {
    id: 'shop-book',
    name: '挑一本新书',
    emoji: '📗',
    cost: 1000,
    desc: '和爸爸妈妈一起去书店选一本。'
  }
];

export const CHEST_REWARD_MAP = Object.fromEntries(CHEST_REWARDS.map((r) => [r.id, r]));
export const SHOP_ITEM_MAP = Object.fromEntries(SHOP_ITEMS.map((r) => [r.id, r]));
