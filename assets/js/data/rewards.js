/**
 * rewards.js —— 奖励池集中配置
 * 想增删宝箱奖励或积分商店商品，只改这一个文件。
 *
 * 宝箱奖励 type：
 *   points   —— 直接加积分
 *   minigame —— 打开互动小游戏（game: wheel / bubble / memory / piano）
 *   song     —— 播放合成儿歌（song: songs.js 里的曲目 id）
 *   video    —— 播放预设视频（src 可替换成你自己的视频地址）
 */

export const CHEST_REWARDS = [
  /* ---------------- 积分 ---------------- */
  {
    id: 'chest-points-2',
    type: 'points',
    name: '2 积分',
    emoji: '⭐',
    points: 2,
    weight: 16,
    desc: '宝箱里跳出一把金色小星星，积分直接进账。'
  },
  {
    id: 'chest-points-5',
    type: 'points',
    name: '5 积分',
    emoji: '🌟',
    points: 5,
    weight: 9,
    desc: '今天的运气不错，是加倍星星！'
  },
  {
    id: 'chest-points-10',
    type: 'points',
    name: '10 积分大奖',
    emoji: '🏆',
    points: 10,
    weight: 3,
    desc: '稀有的金色大奖，一次拿走 10 积分！'
  },

  /* ---------------- 互动小游戏 ---------------- */
  {
    id: 'chest-minigame-catch',
    type: 'minigame',
    game: 'catch-apple',
    name: '接苹果',
    emoji: '🍎',
    weight: 11,
    desc: '20 秒内用篮子接住天上掉下来的水果。'
  },
  {
    id: 'chest-minigame-bubble',
    type: 'minigame',
    game: 'bubble',
    name: '泡泡大作战',
    emoji: '🫧',
    weight: 10,
    desc: '20 秒内戳破尽可能多的泡泡。'
  },
  {
    id: 'chest-minigame-memory',
    type: 'minigame',
    game: 'memory',
    name: '记忆翻牌',
    emoji: '🃏',
    weight: 8,
    desc: '翻开卡片，找出全部相同的图案。'
  },
  {
    id: 'chest-minigame-piano',
    type: 'minigame',
    game: 'piano',
    name: '小小钢琴',
    emoji: '🎹',
    weight: 8,
    desc: '点彩色琴键弹出声音，自己弹出《小星星》。'
  },

  /* ---------------- 儿歌 ---------------- */
  {
    id: 'chest-song-twinkle',
    type: 'song',
    song: 'twinkle',
    name: '儿歌《小星星》',
    emoji: '⭐',
    weight: 8,
    desc: '一闪一闪亮晶晶，跟着哼一哼。'
  },
  {
    id: 'chest-song-two-tigers',
    type: 'song',
    song: 'two-tigers',
    name: '儿歌《两只老虎》',
    emoji: '🐯',
    weight: 7,
    desc: '两只老虎跑得快，一起唱起来。'
  },
  {
    id: 'chest-song-mary',
    type: 'song',
    song: 'mary-lamb',
    name: '儿歌《玛丽有只小羊羔》',
    emoji: '🐑',
    weight: 6,
    desc: '雪白羊毛真漂亮，轻松的小旋律。'
  },
  {
    id: 'chest-song-birthday',
    type: 'song',
    song: 'birthday',
    name: '儿歌《生日快乐》',
    emoji: '🎂',
    weight: 6,
    desc: '祝你生日快乐，可以跟着一起唱。'
  },

  /* ---------------- 自然小短片（≈25% 权重） ---------------- */
  {
    id: 'chest-video-forest',
    type: 'video',
    name: '自然小短片 · 森林里的一天',
    emoji: '🌳',
    weight: 7,
    src: 'https://media.w3.org/2010/05/bunny/trailer.mp4',
    desc: '跟着小动物一起走进森林，看看它们的一天。'
  },
  {
    id: 'chest-video-butterfly',
    type: 'video',
    name: '自然小短片 · 蝴蝶飞呀飞',
    emoji: '🦋',
    weight: 7,
    src: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    desc: '看看小动物们怎么在花丛中自由自在。'
  },
  {
    id: 'chest-video-ocean',
    type: 'video',
    name: '自然小短片 · 海洋世界',
    emoji: '🐠',
    weight: 7,
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    desc: '潜入海底看看五颜六色的鱼。'
  },
  {
    id: 'chest-video-sky',
    type: 'video',
    name: '自然小短片 · 天空的云',
    emoji: '☁️',
    weight: 8,
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    desc: '抬头看看天上的云，变化多端真好看。'
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
