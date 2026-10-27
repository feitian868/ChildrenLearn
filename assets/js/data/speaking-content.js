/**
 * speaking-content.js —— 英语口语跟读内容库
 *   WORD_BANK     单词（含中文释义与最低年级）
 *   DIALOGUE_BANK 情景对话（2~3 轮，A/B 角色）
 * 句子跟读沿用 knowledge-english.js 里的 speak 短语 + speaking.js 内置短句。
 *
 * 说明：词库有限，日常抽题优先「365 天内未用过」，用尽后按「最久未用」轮换，
 * 保证同一天不重复、相邻日期尽量不重复。
 */

export const WORD_BANK = [
  // ---- 一年级 ----
  { w: 'hello', zh: '你好', g: 1 }, { w: 'goodbye', zh: '再见', g: 1 },
  { w: 'mum', zh: '妈妈', g: 1 }, { w: 'dad', zh: '爸爸', g: 1 },
  { w: 'cat', zh: '猫', g: 1 }, { w: 'dog', zh: '狗', g: 1 },
  { w: 'bird', zh: '鸟', g: 1 }, { w: 'fish', zh: '鱼', g: 1 },
  { w: 'red', zh: '红色', g: 1 }, { w: 'blue', zh: '蓝色', g: 1 },
  { w: 'yellow', zh: '黄色', g: 1 }, { w: 'green', zh: '绿色', g: 1 },
  { w: 'one', zh: '一', g: 1 }, { w: 'two', zh: '二', g: 1 },
  { w: 'three', zh: '三', g: 1 }, { w: 'apple', zh: '苹果', g: 1 },
  { w: 'book', zh: '书', g: 1 }, { w: 'pen', zh: '钢笔', g: 1 },
  { w: 'bag', zh: '书包', g: 1 }, { w: 'hat', zh: '帽子', g: 1 },
  { w: 'sun', zh: '太阳', g: 1 }, { w: 'moon', zh: '月亮', g: 1 },
  { w: 'hand', zh: '手', g: 1 }, { w: 'eye', zh: '眼睛', g: 1 },
  { w: 'ear', zh: '耳朵', g: 1 },
  { w: 'black', zh: '黑色', g: 1 }, { w: 'white', zh: '白色', g: 1 },
  { w: 'pink', zh: '粉红色', g: 1 }, { w: 'brown', zh: '棕色', g: 1 },
  { w: 'purple', zh: '紫色', g: 1 },
  { w: 'four', zh: '四', g: 1 }, { w: 'five', zh: '五', g: 1 },
  { w: 'six', zh: '六', g: 1 }, { w: 'seven', zh: '七', g: 1 },
  { w: 'eight', zh: '八', g: 1 }, { w: 'nine', zh: '九', g: 1 },
  { w: 'ten', zh: '十', g: 1 },
  { w: 'duck', zh: '鸭子', g: 1 }, { w: 'pig', zh: '猪', g: 1 },
  { w: 'cow', zh: '奶牛', g: 1 }, { w: 'sheep', zh: '绵羊', g: 1 },
  { w: 'horse', zh: '马', g: 1 }, { w: 'bear', zh: '熊', g: 1 },
  { w: 'mouse', zh: '老鼠', g: 1 }, { w: 'snake', zh: '蛇', g: 1 },
  { w: 'frog', zh: '青蛙', g: 1 }, { w: 'bee', zh: '蜜蜂', g: 1 },
  { w: 'ant', zh: '蚂蚁', g: 1 },
  { w: 'face', zh: '脸', g: 1 }, { w: 'hair', zh: '头发', g: 1 },
  { w: 'tooth', zh: '牙齿', g: 1 },
  { w: 'grandma', zh: '奶奶/外婆', g: 1 }, { w: 'grandpa', zh: '爷爷/外公', g: 1 },
  { w: 'baby', zh: '婴儿', g: 1 },
  { w: 'candy', zh: '糖果', g: 1 }, { w: 'noodles', zh: '面条', g: 1 },
  { w: 'hamburger', zh: '汉堡包', g: 1 }, { w: 'tea', zh: '茶', g: 1 },
  { w: 'ruler', zh: '尺子', g: 1 }, { w: 'pencil', zh: '铅笔', g: 1 },
  { w: 'eraser', zh: '橡皮', g: 1 }, { w: 'crayon', zh: '蜡笔', g: 1 },
  { w: 'schoolbag', zh: '书包', g: 1 },
  { w: 'doll', zh: '洋娃娃', g: 1 }, { w: 'toy', zh: '玩具', g: 1 },
  { w: 'robot', zh: '机器人', g: 1 }, { w: 'balloon', zh: '气球', g: 1 },
  { w: 'run', zh: '跑', g: 1 }, { w: 'jump', zh: '跳', g: 1 },
  { w: 'walk', zh: '走', g: 1 }, { w: 'sit', zh: '坐', g: 1 },
  { w: 'stand', zh: '站', g: 1 }, { w: 'open', zh: '打开', g: 1 },
  { w: 'close', zh: '关上', g: 1 }, { w: 'look', zh: '看', g: 1 },
  { w: 'listen', zh: '听', g: 1 }, { w: 'read', zh: '读', g: 1 },
  { w: 'write', zh: '写', g: 1 },
  { w: 'big', zh: '大的', g: 1 }, { w: 'small', zh: '小的', g: 1 },
  { w: 'long', zh: '长的', g: 1 }, { w: 'short', zh: '短的', g: 1 },
  { w: 'tall', zh: '高的', g: 1 }, { w: 'fat', zh: '胖的', g: 1 },
  { w: 'thin', zh: '瘦的', g: 1 }, { w: 'happy', zh: '开心的', g: 1 },
  { w: 'sad', zh: '伤心的', g: 1 }, { w: 'good', zh: '好的', g: 1 },
  { w: 'nice', zh: '好的 / 漂亮的', g: 1 },
  { w: 'yes', zh: '是', g: 1 }, { w: 'no', zh: '不', g: 1 },
  { w: 'thank', zh: '谢谢', g: 1 }, { w: 'sorry', zh: '对不起', g: 1 },
  { w: 'please', zh: '请', g: 1 }, { w: 'bye', zh: '再见', g: 1 },
  { w: 'boy', zh: '男孩', g: 1 }, { w: 'girl', zh: '女孩', g: 1 },
  { w: 'man', zh: '男人', g: 1 }, { w: 'woman', zh: '女人', g: 1 },
  { w: 'house', zh: '房子', g: 1 }, { w: 'tree', zh: '树', g: 1 },
  { w: 'flower', zh: '花', g: 1 }, { w: 'grass', zh: '草', g: 1 },
  { w: 'rain', zh: '雨', g: 1 }, { w: 'snow', zh: '雪', g: 1 },
  { w: 'wind', zh: '风', g: 1 }, { w: 'star', zh: '星星', g: 1 },
  { w: 'sky', zh: '天空', g: 1 },
  // ---- 二年级 ----
  { w: 'orange', zh: '橙子', g: 2 }, { w: 'banana', zh: '香蕉', g: 2 },
  { w: 'pear', zh: '梨', g: 2 }, { w: 'milk', zh: '牛奶', g: 2 },
  { w: 'bread', zh: '面包', g: 2 }, { w: 'cake', zh: '蛋糕', g: 2 },
  { w: 'egg', zh: '鸡蛋', g: 2 }, { w: 'rice', zh: '米饭', g: 2 },
  { w: 'water', zh: '水', g: 2 }, { w: 'juice', zh: '果汁', g: 2 },
  { w: 'head', zh: '头', g: 2 }, { w: 'foot', zh: '脚', g: 2 },
  { w: 'nose', zh: '鼻子', g: 2 }, { w: 'mouth', zh: '嘴', g: 2 },
  { w: 'arm', zh: '胳膊', g: 2 }, { w: 'leg', zh: '腿', g: 2 },
  { w: 'desk', zh: '课桌', g: 2 }, { w: 'chair', zh: '椅子', g: 2 },
  { w: 'door', zh: '门', g: 2 }, { w: 'window', zh: '窗户', g: 2 },
  { w: 'ball', zh: '球', g: 2 }, { w: 'kite', zh: '风筝', g: 2 },
  { w: 'car', zh: '小汽车', g: 2 }, { w: 'bus', zh: '公交车', g: 2 },
  { w: 'bike', zh: '自行车', g: 2 },
  { w: 'coffee', zh: '咖啡', g: 2 }, { w: 'chicken', zh: '鸡肉', g: 2 },
  { w: 'beef', zh: '牛肉', g: 2 }, { w: 'soup', zh: '汤', g: 2 },
  { w: 'salad', zh: '沙拉', g: 2 }, { w: 'potato', zh: '土豆', g: 2 },
  { w: 'tomato', zh: '西红柿', g: 2 }, { w: 'carrot', zh: '胡萝卜', g: 2 },
  { w: 'grape', zh: '葡萄', g: 2 }, { w: 'peach', zh: '桃子', g: 2 },
  { w: 'strawberry', zh: '草莓', g: 2 }, { w: 'watermelon', zh: '西瓜', g: 2 },
  { w: 'lemon', zh: '柠檬', g: 2 }, { w: 'sweet', zh: '甜的', g: 2 },
  { w: 'sour', zh: '酸的', g: 2 }, { w: 'salty', zh: '咸的', g: 2 },
  { w: 'finger', zh: '手指', g: 2 }, { w: 'toe', zh: '脚趾', g: 2 },
  { w: 'knee', zh: '膝盖', g: 2 }, { w: 'shoulder', zh: '肩膀', g: 2 },
  { w: 'back', zh: '背', g: 2 },
  { w: 'home', zh: '家', g: 2 }, { w: 'room', zh: '房间', g: 2 },
  { w: 'kitchen', zh: '厨房', g: 2 }, { w: 'bedroom', zh: '卧室', g: 2 },
  { w: 'bathroom', zh: '浴室', g: 2 }, { w: 'garden', zh: '花园', g: 2 },
  { w: 'shop', zh: '商店', g: 2 }, { w: 'street', zh: '街道', g: 2 },
  { w: 'clock', zh: '钟', g: 2 }, { w: 'phone', zh: '电话', g: 2 },
  { w: 'computer', zh: '电脑', g: 2 }, { w: 'TV', zh: '电视', g: 2 },
  { w: 'lamp', zh: '台灯', g: 2 }, { w: 'bed', zh: '床', g: 2 },
  { w: 'table', zh: '桌子', g: 2 }, { w: 'sofa', zh: '沙发', g: 2 },
  { w: 'box', zh: '盒子', g: 2 }, { w: 'cup', zh: '杯子', g: 2 },
  { w: 'plate', zh: '盘子', g: 2 }, { w: 'spoon', zh: '勺子', g: 2 },
  { w: 'fork', zh: '叉子', g: 2 }, { w: 'knife', zh: '刀子', g: 2 },
  { w: 'key', zh: '钥匙', g: 2 }, { w: 'umbrella', zh: '雨伞', g: 2 },
  { w: 'help', zh: '帮助', g: 2 }, { w: 'play', zh: '玩', g: 2 },
  { w: 'eat', zh: '吃', g: 2 }, { w: 'drink', zh: '喝', g: 2 },
  { w: 'sleep', zh: '睡觉', g: 2 }, { w: 'wash', zh: '洗', g: 2 },
  { w: 'buy', zh: '买', g: 2 }, { w: 'give', zh: '给', g: 2 },
  { w: 'put', zh: '放', g: 2 }, { w: 'take', zh: '拿', g: 2 },
  { w: 'sunny', zh: '晴朗的', g: 2 },
  // ---- 三年级 ----
  { w: 'family', zh: '家庭', g: 3 }, { w: 'brother', zh: '哥哥/弟弟', g: 3 },
  { w: 'sister', zh: '姐姐/妹妹', g: 3 }, { w: 'friend', zh: '朋友', g: 3 },
  { w: 'teacher', zh: '老师', g: 3 }, { w: 'student', zh: '学生', g: 3 },
  { w: 'school', zh: '学校', g: 3 }, { w: 'class', zh: '班级', g: 3 },
  { w: 'park', zh: '公园', g: 3 }, { w: 'zoo', zh: '动物园', g: 3 },
  { w: 'tiger', zh: '老虎', g: 3 }, { w: 'monkey', zh: '猴子', g: 3 },
  { w: 'panda', zh: '熊猫', g: 3 }, { w: 'rabbit', zh: '兔子', g: 3 },
  { w: 'elephant', zh: '大象', g: 3 }, { w: 'morning', zh: '早晨', g: 3 },
  { w: 'evening', zh: '傍晚', g: 3 }, { w: 'breakfast', zh: '早饭', g: 3 },
  { w: 'dinner', zh: '晚饭', g: 3 }, { w: 'summer', zh: '夏天', g: 3 },
  { w: 'winter', zh: '冬天', g: 3 }, { w: 'spring', zh: '春天', g: 3 },
  { w: 'autumn', zh: '秋天', g: 3 }, { w: 'cloudy', zh: '多云的', g: 3 },
  { w: 'rainy', zh: '下雨的', g: 3 }, { w: 'windy', zh: '有风的', g: 3 },
  { w: 'snowy', zh: '下雪的', g: 3 }, { w: 'cool', zh: '凉爽的', g: 3 },
  { w: 'warm', zh: '温暖的', g: 3 }, { w: 'hot', zh: '炎热的', g: 3 },
  { w: 'giraffe', zh: '长颈鹿', g: 3 }, { w: 'zebra', zh: '斑马', g: 3 },
  { w: 'deer', zh: '鹿', g: 3 }, { w: 'fox', zh: '狐狸', g: 3 },
  { w: 'wolf', zh: '狼', g: 3 }, { w: 'kangaroo', zh: '袋鼠', g: 3 },
  { w: 'dolphin', zh: '海豚', g: 3 }, { w: 'whale', zh: '鲸', g: 3 },
  { w: 'penguin', zh: '企鹅', g: 3 }, { w: 'butterfly', zh: '蝴蝶', g: 3 },
  { w: 'spider', zh: '蜘蛛', g: 3 },
  { w: 'river', zh: '河流', g: 3 }, { w: 'lake', zh: '湖泊', g: 3 },
  { w: 'mountain', zh: '山', g: 3 }, { w: 'forest', zh: '森林', g: 3 },
  { w: 'sea', zh: '大海', g: 3 }, { w: 'island', zh: '岛屿', g: 3 },
  { w: 'desert', zh: '沙漠', g: 3 }, { w: 'field', zh: '田野', g: 3 },
  { w: 'farm', zh: '农场', g: 3 }, { w: 'village', zh: '村庄', g: 3 },
  { w: 'city', zh: '城市', g: 3 }, { w: 'town', zh: '城镇', g: 3 },
  { w: 'classroom', zh: '教室', g: 3 }, { w: 'playground', zh: '操场', g: 3 },
  { w: 'pupil', zh: '小学生', g: 3 }, { w: 'blackboard', zh: '黑板', g: 3 },
  { w: 'monday', zh: '星期一', g: 3 }, { w: 'tuesday', zh: '星期二', g: 3 },
  { w: 'wednesday', zh: '星期三', g: 3 }, { w: 'thursday', zh: '星期四', g: 3 },
  { w: 'friday', zh: '星期五', g: 3 }, { w: 'saturday', zh: '星期六', g: 3 },
  { w: 'sunday', zh: '星期日', g: 3 }, { w: 'month', zh: '月份', g: 3 },
  { w: 'year', zh: '年', g: 3 }, { w: 'week', zh: '星期 / 周', g: 3 },
  { w: 'today', zh: '今天', g: 3 }, { w: 'afternoon', zh: '下午', g: 3 },
  { w: 'noon', zh: '中午', g: 3 }, { w: 'tonight', zh: '今晚', g: 3 },
  { w: 'come', zh: '来', g: 3 }, { w: 'go', zh: '去', g: 3 },
  { w: 'see', zh: '看见', g: 3 }, { w: 'hear', zh: '听见', g: 3 },
  { w: 'know', zh: '知道', g: 3 }, { w: 'think', zh: '认为 / 想', g: 3 },
  { w: 'want', zh: '想要', g: 3 }, { w: 'like', zh: '喜欢', g: 3 },
  { w: 'love', zh: '爱', g: 3 }, { w: 'make', zh: '制作', g: 3 },
  { w: 'work', zh: '工作', g: 3 }, { w: 'study', zh: '学习', g: 3 },
  { w: 'teach', zh: '教', g: 3 }, { w: 'learn', zh: '学习', g: 3 },
  { w: 'speak', zh: '说', g: 3 }, { w: 'talk', zh: '谈话', g: 3 },
  // ---- 四年级 ----
  { w: 'subject', zh: '科目', g: 4 }, { w: 'English', zh: '英语', g: 4 },
  { w: 'Chinese', zh: '语文', g: 4 }, { w: 'maths', zh: '数学', g: 4 },
  { w: 'music', zh: '音乐', g: 4 }, { w: 'art', zh: '美术', g: 4 },
  { w: 'sport', zh: '体育运动', g: 4 }, { w: 'library', zh: '图书馆', g: 4 },
  { w: 'hospital', zh: '医院', g: 4 }, { w: 'restaurant', zh: '餐馆', g: 4 },
  { w: 'supermarket', zh: '超市', g: 4 }, { w: 'cinema', zh: '电影院', g: 4 },
  { w: 'weekend', zh: '周末', g: 4 }, { w: 'holiday', zh: '假期', g: 4 },
  { w: 'birthday', zh: '生日', g: 4 }, { w: 'question', zh: '问题', g: 4 },
  { w: 'answer', zh: '答案', g: 4 }, { w: 'picture', zh: '图画', g: 4 },
  { w: 'lesson', zh: '课程', g: 4 }, { w: 'homework', zh: '作业', g: 4 },
  { w: 'football', zh: '足球', g: 4 }, { w: 'basketball', zh: '篮球', g: 4 },
  { w: 'swim', zh: '游泳', g: 4 }, { w: 'dance', zh: '跳舞', g: 4 },
  { w: 'draw', zh: '画画', g: 4 }, { w: 'sing', zh: '唱歌', g: 4 },
  { w: 'cook', zh: '做饭', g: 4 }, { w: 'clean', zh: '打扫', g: 4 },
  { w: 'museum', zh: '博物馆', g: 4 }, { w: 'bank', zh: '银行', g: 4 },
  { w: 'hotel', zh: '旅馆', g: 4 }, { w: 'station', zh: '车站', g: 4 },
  { w: 'airport', zh: '机场', g: 4 }, { w: 'bridge', zh: '桥', g: 4 },
  { w: 'square', zh: '广场', g: 4 },
  { w: 'dictionary', zh: '字典', g: 4 }, { w: 'newspaper', zh: '报纸', g: 4 },
  { w: 'magazine', zh: '杂志', g: 4 }, { w: 'letter', zh: '信', g: 4 },
  { w: 'email', zh: '电子邮件', g: 4 }, { w: 'message', zh: '消息', g: 4 },
  { w: 'story', zh: '故事', g: 4 }, { w: 'song', zh: '歌曲', g: 4 },
  { w: 'game', zh: '游戏', g: 4 }, { w: 'film', zh: '电影', g: 4 },
  { w: 'visit', zh: '参观 / 拜访', g: 4 }, { w: 'wait', zh: '等待', g: 4 },
  { w: 'start', zh: '开始', g: 4 }, { w: 'stop', zh: '停止', g: 4 },
  { w: 'turn', zh: '转弯', g: 4 }, { w: 'carry', zh: '搬运', g: 4 },
  { w: 'climb', zh: '爬', g: 4 }, { w: 'ride', zh: '骑', g: 4 },
  { w: 'drive', zh: '驾驶', g: 4 }, { w: 'fly', zh: '飞', g: 4 },
  { w: 'sail', zh: '航行', g: 4 },
  { w: 'dirty', zh: '脏的', g: 4 }, { w: 'quiet', zh: '安静的', g: 4 },
  { w: 'noisy', zh: '吵闹的', g: 4 }, { w: 'busy', zh: '忙的', g: 4 },
  { w: 'free', zh: '有空的', g: 4 }, { w: 'kind', zh: '友好的', g: 4 },
  { w: 'brave', zh: '勇敢的', g: 4 }, { w: 'clever', zh: '聪明的', g: 4 },
  { w: 'funny', zh: '滑稽的', g: 4 }, { w: 'tired', zh: '疲倦的', g: 4 },
  { w: 'hungry', zh: '饥饿的', g: 4 }, { w: 'thirsty', zh: '口渴的', g: 4 },
  { w: 'angry', zh: '生气的', g: 4 }, { w: 'afraid', zh: '害怕的', g: 4 },
  { w: 'before', zh: '在……之前', g: 4 }, { w: 'after', zh: '在……之后', g: 4 },
  { w: 'again', zh: '再一次', g: 4 }, { w: 'soon', zh: '很快', g: 4 },
  { w: 'later', zh: '后来', g: 4 },
  // ---- 五年级 ----
  { w: 'always', zh: '总是', g: 5 }, { w: 'usually', zh: '通常', g: 5 },
  { w: 'often', zh: '经常', g: 5 }, { w: 'sometimes', zh: '有时', g: 5 },
  { w: 'never', zh: '从不', g: 5 }, { w: 'yesterday', zh: '昨天', g: 5 },
  { w: 'tomorrow', zh: '明天', g: 5 }, { w: 'early', zh: '早的', g: 5 },
  { w: 'late', zh: '晚的', g: 5 }, { w: 'heavy', zh: '重的', g: 5 },
  { w: 'light', zh: '轻的', g: 5 }, { w: 'careful', zh: '小心的', g: 5 },
  { w: 'dangerous', zh: '危险的', g: 5 }, { w: 'difficult', zh: '困难的', g: 5 },
  { w: 'exciting', zh: '令人兴奋的', g: 5 }, { w: 'interesting', zh: '有趣的', g: 5 },
  { w: 'delicious', zh: '美味的', g: 5 }, { w: 'expensive', zh: '昂贵的', g: 5 },
  { w: 'cheap', zh: '便宜的', g: 5 }, { w: 'healthy', zh: '健康的', g: 5 },
  { w: 'wonderful', zh: '精彩的', g: 5 }, { w: 'quickly', zh: '迅速地', g: 5 },
  { w: 'slowly', zh: '缓慢地', g: 5 }, { w: 'quietly', zh: '安静地', g: 5 },
  { w: 'loudly', zh: '大声地', g: 5 }, { w: 'arrive', zh: '到达', g: 5 },
  { w: 'finish', zh: '完成', g: 5 }, { w: 'practise', zh: '练习', g: 5 },
  { w: 'remember', zh: '记得', g: 5 },
  { w: 'borrow', zh: '借入', g: 5 }, { w: 'lend', zh: '借出', g: 5 },
  { w: 'return', zh: '归还', g: 5 }, { w: 'invite', zh: '邀请', g: 5 },
  { w: 'join', zh: '参加', g: 5 }, { w: 'follow', zh: '跟随', g: 5 },
  { w: 'notice', zh: '注意到', g: 5 }, { w: 'choose', zh: '选择', g: 5 },
  { w: 'collect', zh: '收集', g: 5 }, { w: 'compare', zh: '比较', g: 5 },
  { w: 'describe', zh: '描述', g: 5 }, { w: 'discuss', zh: '讨论', g: 5 },
  { w: 'repeat', zh: '重复', g: 5 }, { w: 'share', zh: '分享', g: 5 },
  { w: 'show', zh: '展示', g: 5 }, { w: 'tell', zh: '告诉', g: 5 },
  { w: 'ask', zh: '询问', g: 5 },
  { w: 'habit', zh: '习惯', g: 5 }, { w: 'hobby', zh: '爱好', g: 5 },
  { w: 'diary', zh: '日记', g: 5 }, { w: 'dream', zh: '梦想', g: 5 },
  { w: 'idea', zh: '主意', g: 5 }, { w: 'reason', zh: '原因', g: 5 },
  { w: 'problem', zh: '问题 / 难题', g: 5 }, { w: 'rule', zh: '规则', g: 5 },
  { w: 'safety', zh: '安全', g: 5 }, { w: 'traffic', zh: '交通', g: 5 },
  { w: 'weather', zh: '天气', g: 5 }, { w: 'season', zh: '季节', g: 5 },
  { w: 'temperature', zh: '温度', g: 5 }, { w: 'camera', zh: '照相机', g: 5 },
  { w: 'ticket', zh: '票', g: 5 }, { w: 'wallet', zh: '钱包', g: 5 },
  { w: 'pocket', zh: '口袋', g: 5 },
  { w: 'safe', zh: '安全的', g: 5 }, { w: 'proud', zh: '自豪的', g: 5 },
  { w: 'nervous', zh: '紧张的', g: 5 }, { w: 'excited', zh: '兴奋的', g: 5 },
  { w: 'bored', zh: '无聊的', g: 5 }, { w: 'surprised', zh: '惊讶的', g: 5 },
  { w: 'famous', zh: '著名的', g: 5 }, { w: 'important', zh: '重要的', g: 5 },
  { w: 'useful', zh: '有用的', g: 5 }, { w: 'different', zh: '不同的', g: 5 },
  { w: 'same', zh: '相同的', g: 5 }, { w: 'special', zh: '特别的', g: 5 },
  { w: 'enough', zh: '足够的', g: 5 }, { w: 'ready', zh: '准备好的', g: 5 },
  // ---- 六年级 ----
  { w: 'environment', zh: '环境', g: 6 }, { w: 'pollution', zh: '污染', g: 6 },
  { w: 'recycle', zh: '回收利用', g: 6 }, { w: 'protect', zh: '保护', g: 6 },
  { w: 'future', zh: '未来', g: 6 }, { w: 'planet', zh: '行星', g: 6 },
  { w: 'energy', zh: '能源', g: 6 }, { w: 'plastic', zh: '塑料', g: 6 },
  { w: 'invent', zh: '发明', g: 6 }, { w: 'discover', zh: '发现', g: 6 },
  { w: 'improve', zh: '改进', g: 6 }, { w: 'celebrate', zh: '庆祝', g: 6 },
  { w: 'tradition', zh: '传统', g: 6 }, { w: 'culture', zh: '文化', g: 6 },
  { w: 'festival', zh: '节日', g: 6 }, { w: 'journey', zh: '旅程', g: 6 },
  { w: 'travel', zh: '旅行', g: 6 }, { w: 'experience', zh: '经历', g: 6 },
  { w: 'change', zh: '改变', g: 6 }, { w: 'decide', zh: '决定', g: 6 },
  { w: 'explain', zh: '解释', g: 6 }, { w: 'imagine', zh: '想象', g: 6 },
  { w: 'prepare', zh: '准备', g: 6 }, { w: 'realize', zh: '意识到', g: 6 },
  { w: 'suggest', zh: '建议', g: 6 }, { w: 'support', zh: '支持', g: 6 },
  { w: 'develop', zh: '发展', g: 6 }, { w: 'encourage', zh: '鼓励', g: 6 },
  { w: 'achieve', zh: '实现', g: 6 }, { w: 'succeed', zh: '成功', g: 6 },
  { w: 'advantage', zh: '优点', g: 6 }, { w: 'challenge', zh: '挑战', g: 6 },
  { w: 'choice', zh: '选择', g: 6 }, { w: 'courage', zh: '勇气', g: 6 },
  { w: 'effort', zh: '努力', g: 6 }, { w: 'goal', zh: '目标', g: 6 },
  { w: 'health', zh: '健康', g: 6 }, { w: 'knowledge', zh: '知识', g: 6 },
  { w: 'language', zh: '语言', g: 6 }, { w: 'memory', zh: '记忆', g: 6 },
  { w: 'mistake', zh: '错误', g: 6 }, { w: 'opinion', zh: '观点', g: 6 },
  { w: 'progress', zh: '进步', g: 6 }, { w: 'program', zh: '节目', g: 6 },
  { w: 'purpose', zh: '目的', g: 6 }, { w: 'respect', zh: '尊重', g: 6 },
  { w: 'responsibility', zh: '责任', g: 6 }, { w: 'solution', zh: '解决办法', g: 6 },
  { w: 'success', zh: '成功', g: 6 }, { w: 'technology', zh: '科技', g: 6 },
  { w: 'tool', zh: '工具', g: 6 }, { w: 'value', zh: '价值', g: 6 },
  { w: 'volunteer', zh: '志愿者', g: 6 }, { w: 'wisdom', zh: '智慧', g: 6 },
  { w: 'accept', zh: '接受', g: 6 }, { w: 'agree', zh: '同意', g: 6 },
  { w: 'allow', zh: '允许', g: 6 }, { w: 'avoid', zh: '避免', g: 6 },
  { w: 'belong', zh: '属于', g: 6 }, { w: 'communicate', zh: '交流', g: 6 },
  { w: 'continue', zh: '继续', g: 6 }, { w: 'create', zh: '创造', g: 6 },
  { w: 'express', zh: '表达', g: 6 }, { w: 'manage', zh: '管理', g: 6 },
  { w: 'offer', zh: '提供', g: 6 }, { w: 'prefer', zh: '更喜欢', g: 6 },
  { w: 'prevent', zh: '防止', g: 6 }, { w: 'promise', zh: '承诺', g: 6 },
  { w: 'receive', zh: '收到', g: 6 }, { w: 'reduce', zh: '减少', g: 6 },
  { w: 'save', zh: '节省 / 拯救', g: 6 }, { w: 'solve', zh: '解决', g: 6 },
  { w: 'understand', zh: '理解', g: 6 }, { w: 'wonder', zh: '想知道', g: 6 },
  { w: 'active', zh: '积极的', g: 6 }, { w: 'confident', zh: '自信的', g: 6 },
  { w: 'creative', zh: '有创造力的', g: 6 }, { w: 'curious', zh: '好奇的', g: 6 },
  { w: 'friendly', zh: '友好的', g: 6 }, { w: 'honest', zh: '诚实的', g: 6 },
  { w: 'patient', zh: '有耐心的', g: 6 }, { w: 'polite', zh: '有礼貌的', g: 6 },
  { w: 'serious', zh: '严肃的', g: 6 }, { w: 'talented', zh: '有天赋的', g: 6 },
  { w: 'thankful', zh: '感激的', g: 6 }, { w: 'valuable', zh: '有价值的', g: 6 }
];

export const SENTENCE_BANK = [
  // ---- 一年级 ----
  { text: 'I am seven years old.', zh: '我七岁了。', g: 1 },
  { text: 'I have a red bag.', zh: '我有一个红色的书包。', g: 1 },
  { text: 'This is my mum.', zh: '这是我妈妈。', g: 1 },
  { text: 'She is my teacher.', zh: '她是我的老师。', g: 1 },
  { text: 'I can run fast.', zh: '我能跑得很快。', g: 1 },
  { text: 'I can jump high.', zh: '我能跳得很高。', g: 1 },
  { text: 'Look at my cat.', zh: '看我的猫。', g: 1 },
  { text: 'It is a big dog.', zh: '它是一只大狗。', g: 1 },
  { text: 'I see three birds.', zh: '我看见三只鸟。', g: 1 },
  { text: 'I have two apples.', zh: '我有两个苹果。', g: 1 },
  { text: 'My hat is yellow.', zh: '我的帽子是黄色的。', g: 1 },
  { text: 'The sun is bright.', zh: '太阳很明亮。', g: 1 },
  { text: 'I like my school.', zh: '我喜欢我的学校。', g: 1 },
  { text: 'We sing a song.', zh: '我们唱一首歌。', g: 1 },
  { text: 'Let us play a game.', zh: '我们玩个游戏吧。', g: 1 },
  { text: 'Open your book, please.', zh: '请打开你的书。', g: 1 },
  { text: 'Close the door, please.', zh: '请关上门。', g: 1 },
  { text: 'Come here, please.', zh: '请过来。', g: 1 },
  { text: 'Thank you very much.', zh: '非常感谢。', g: 1 },
  { text: 'I am sorry.', zh: '对不起。', g: 1 },
  { text: 'Good night, Mum.', zh: '晚安，妈妈。', g: 1 },
  { text: 'See you tomorrow.', zh: '明天见。', g: 1 },
  { text: 'How old are you?', zh: '你几岁了？', g: 1 },
  { text: 'What is your name?', zh: '你叫什么名字？', g: 1 },
  { text: 'Where is my pen?', zh: '我的钢笔在哪里？', g: 1 },
  { text: 'It is on the desk.', zh: '它在课桌上。', g: 1 },
  { text: 'I can see a rainbow.', zh: '我能看见彩虹。', g: 1 },
  { text: 'The bird is in the tree.', zh: '鸟在树上。', g: 1 },
  { text: 'My dad is tall.', zh: '我爸爸很高。', g: 1 },
  { text: 'I love my family.', zh: '我爱我的家人。', g: 1 },
  // ---- 二年级 ----
  { text: 'I get up at six.', zh: '我六点起床。', g: 2 },
  { text: 'I wash my face.', zh: '我洗脸。', g: 2 },
  { text: 'I have milk for breakfast.', zh: '我早饭喝牛奶。', g: 2 },
  { text: 'I go to school with my sister.', zh: '我和姐姐一起去上学。', g: 2 },
  { text: 'My favourite colour is blue.', zh: '我最喜欢的颜色是蓝色。', g: 2 },
  { text: 'I can ride a bike.', zh: '我会骑自行车。', g: 2 },
  { text: 'Let us go to the zoo.', zh: '我们去动物园吧。', g: 2 },
  { text: 'The panda is black and white.', zh: '熊猫是黑白相间的。', g: 2 },
  { text: 'I have a new kite.', zh: '我有一个新风筝。', g: 2 },
  { text: 'How many books do you have?', zh: '你有多少本书？', g: 2 },
  { text: 'I have ten crayons.', zh: '我有十支蜡笔。', g: 2 },
  { text: 'The cake is very sweet.', zh: '蛋糕很甜。', g: 2 },
  { text: 'My room is small but clean.', zh: '我的房间小但很干净。', g: 2 },
  { text: 'I help my mum at home.', zh: '我在家帮妈妈。', g: 2 },
  { text: 'We play football after school.', zh: '放学后我们踢足球。', g: 2 },
  { text: 'It is raining outside.', zh: '外面在下雨。', g: 2 },
  { text: 'I like sunny days.', zh: '我喜欢晴天。', g: 2 },
  { text: 'Can you swim?', zh: '你会游泳吗？', g: 2 },
  { text: 'Yes, I can swim well.', zh: '是的，我游得很好。', g: 2 },
  { text: 'What time is it now?', zh: '现在几点了？', g: 2 },
  // ---- 三年级 ----
  { text: 'I get up at seven every morning.', zh: '我每天早上七点起床。', g: 3 },
  { text: 'I walk to school with my friend.', zh: '我和朋友走路去上学。', g: 3 },
  { text: 'We have four classes in the morning.', zh: '我们上午有四节课。', g: 3 },
  { text: 'My favourite subject is English.', zh: '我最喜欢的科目是英语。', g: 3 },
  { text: 'The weather is sunny and warm today.', zh: '今天天气晴朗温暖。', g: 3 },
  { text: 'I often play basketball on the playground.', zh: '我经常在操场打篮球。', g: 3 },
  { text: 'There is a big tree near my house.', zh: '我家附近有一棵大树。', g: 3 },
  { text: 'My mother is a teacher.', zh: '我妈妈是老师。', g: 3 },
  { text: 'I like reading story books.', zh: '我喜欢读故事书。', g: 3 },
  { text: 'We visit my grandparents on Sunday.', zh: '我们星期天去看望祖父母。', g: 3 },
  { text: 'The elephant has a long nose.', zh: '大象有长长的鼻子。', g: 3 },
  { text: 'Look, the rabbits are jumping.', zh: '看，兔子们在跳。', g: 3 },
  { text: 'I can count from one to twenty.', zh: '我能从一数到二十。', g: 3 },
  { text: 'Please give me a glass of water.', zh: '请给我一杯水。', g: 3 },
  { text: 'My school is not far from my home.', zh: '我的学校离家不远。', g: 3 },
  { text: 'It is time for lunch.', zh: '到午饭时间了。', g: 3 },
  { text: 'I want to buy a new pencil.', zh: '我想买一支新铅笔。', g: 3 },
  { text: 'How much is this book?', zh: '这本书多少钱？', g: 3 },
  { text: 'Let us help each other.', zh: '我们互相帮助吧。', g: 3 },
  { text: 'I am very happy today.', zh: '我今天很开心。', g: 3 },
  // ---- 四年级 ----
  { text: 'I usually get up at half past six.', zh: '我通常六点半起床。', g: 4 },
  { text: 'My father goes to work by car.', zh: '我爸爸开车去上班。', g: 4 },
  { text: 'We have English on Monday and Friday.', zh: '我们星期一和星期五有英语课。', g: 4 },
  { text: 'I am good at maths.', zh: '我擅长数学。', g: 4 },
  { text: 'My hobby is drawing pictures.', zh: '我的爱好是画画。', g: 4 },
  { text: 'I want to be a doctor.', zh: '我想成为医生。', g: 4 },
  { text: 'The library is next to the park.', zh: '图书馆在公园旁边。', g: 4 },
  { text: 'Excuse me, how can I get to the museum?', zh: '打扰一下，我怎么去博物馆？', g: 4 },
  { text: 'Turn right at the second crossing.', zh: '在第二个路口右转。', g: 4 },
  { text: 'It takes ten minutes to walk there.', zh: '走到那里要十分钟。', g: 4 },
  { text: 'We should wash our hands before meals.', zh: '我们饭前应该洗手。', g: 4 },
  { text: 'My mother is cooking in the kitchen.', zh: '我妈妈正在厨房做饭。', g: 4 },
  { text: 'I helped my teacher after class.', zh: '课后我帮了老师的忙。', g: 4 },
  { text: 'The film starts at seven o\'clock.', zh: '电影七点开始。', g: 4 },
  { text: 'I like this song very much.', zh: '我非常喜欢这首歌。', g: 4 },
  { text: 'Please be quiet in the library.', zh: '在图书馆请安静。', g: 4 },
  { text: 'What did you do last weekend?', zh: '你上周末做了什么？', g: 4 },
  { text: 'I visited my grandparents last weekend.', zh: '我上周末去看望了祖父母。', g: 4 },
  { text: 'Let us clean the classroom together.', zh: '我们一起打扫教室吧。', g: 4 },
  { text: 'I am going to buy a present for my friend.', zh: '我打算给朋友买一份礼物。', g: 4 },
  // ---- 五年级 ----
  { text: 'I always finish my homework before dinner.', zh: '我总是在晚饭前完成作业。', g: 5 },
  { text: 'My brother is taller than me.', zh: '我哥哥比我高。', g: 5 },
  { text: 'This bag is heavier than that one.', zh: '这个包比那个重。', g: 5 },
  { text: 'I go swimming twice a week.', zh: '我一周去游泳两次。', g: 5 },
  { text: 'We are going to have a picnic this Sunday.', zh: '我们这个星期天要去野餐。', g: 5 },
  { text: 'The Great Wall is very long and famous.', zh: '长城又长又有名。', g: 5 },
  { text: 'I have never seen a dolphin.', zh: '我从没见过海豚。', g: 5 },
  { text: 'You should be careful when you cross the road.', zh: '过马路时你应该小心。', g: 5 },
  { text: 'My mother asks me to drink more water.', zh: '妈妈让我多喝水。', g: 5 },
  { text: 'I am reading an interesting book now.', zh: '我现在正在读一本有趣的书。', g: 5 },
  { text: 'She is good at singing and dancing.', zh: '她擅长唱歌和跳舞。', g: 5 },
  { text: 'We must not play with fire.', zh: '我们不能玩火。', g: 5 },
  { text: 'Please wait for me at the school gate.', zh: '请在学校门口等我。', g: 5 },
  { text: 'I will call you after school.', zh: '放学后我会给你打电话。', g: 5 },
  { text: 'The train arrives at nine in the morning.', zh: '火车上午九点到达。', g: 5 },
  { text: 'It is important to keep healthy.', zh: '保持健康很重要。', g: 5 },
  { text: 'My father taught me how to ride a bike.', zh: '我爸爸教我怎么骑自行车。', g: 5 },
  { text: 'I have a lot of homework today.', zh: '我今天有很多作业。', g: 5 },
  { text: 'Let us share the umbrella.', zh: '我们一起用这把伞吧。', g: 5 },
  { text: 'I am proud of my little sister.', zh: '我为我的妹妹感到自豪。', g: 5 },
  // ---- 六年级 ----
  { text: 'I have lived in this city for six years.', zh: '我在这个城市住了六年。', g: 6 },
  { text: 'We should protect the environment together.', zh: '我们应该一起保护环境。', g: 6 },
  { text: 'My dream is to become a scientist.', zh: '我的梦想是成为科学家。', g: 6 },
  { text: 'If it rains tomorrow, we will stay at home.', zh: '如果明天下雨，我们就待在家里。', g: 6 },
  { text: 'I am going to study harder this term.', zh: '这学期我打算更努力学习。', g: 6 },
  { text: 'Reading makes me think and grow.', zh: '阅读让我思考和成长。', g: 6 },
  { text: 'We had a wonderful time at the party.', zh: '我们在聚会上玩得很开心。', g: 6 },
  { text: 'Could you tell me how to get to the airport?', zh: '你能告诉我怎么去机场吗？', g: 6 },
  { text: 'I think everyone should keep trying.', zh: '我认为每个人都应该坚持尝试。', g: 6 },
  { text: 'The more you practise, the better you speak.', zh: '练得越多，说得越好。', g: 6 },
  { text: 'We are going to plant trees next weekend.', zh: '我们下周末要去种树。', g: 6 },
  { text: 'My teacher encourages me to speak English.', zh: '老师鼓励我说英语。', g: 6 },
  { text: 'I have finished reading that story book.', zh: '我已经读完那本故事书了。', g: 6 },
  { text: 'It is not easy, but I will not give up.', zh: '这不容易，但我不会放弃。', g: 6 },
  { text: 'We should save water and paper at school.', zh: '我们在学校应该节约用水用纸。', g: 6 },
  { text: 'I want to travel around the world one day.', zh: '我想有一天环游世界。', g: 6 },
  { text: 'Learning English helps me know the world.', zh: '学英语帮助我了解世界。', g: 6 },
  { text: 'My parents are always proud of me.', zh: '我父母一直为我骄傲。', g: 6 },
  { text: 'Let us make a plan for the summer holiday.', zh: '我们为暑假做个计划吧。', g: 6 },
  { text: 'I believe I can do better next time.', zh: '我相信下次我能做得更好。', g: 6 }
];

export const DIALOGUE_BANK = [
  // ---- 低年级 ----
  {
    g: 1, title: '第一次见面',
    lines: [
      { who: 'A', text: 'Hello!', zh: '你好！' },
      { who: 'B', text: 'Hi! I am Tom.', zh: '嗨！我是汤姆。' },
      { who: 'A', text: 'Nice to meet you.', zh: '很高兴认识你。' }
    ]
  },
  {
    g: 1, title: '问问颜色',
    lines: [
      { who: 'A', text: 'What colour is it?', zh: '它是什么颜色？' },
      { who: 'B', text: 'It is red.', zh: '它是红色的。' },
      { who: 'A', text: 'I like red.', zh: '我喜欢红色。' }
    ]
  },
  {
    g: 2, title: '早餐吃什么',
    lines: [
      { who: 'A', text: 'What do you have for breakfast?', zh: '你早饭吃什么？' },
      { who: 'B', text: 'I have milk and bread.', zh: '我喝牛奶、吃面包。' },
      { who: 'A', text: 'That is healthy.', zh: '那很健康。' }
    ]
  },
  {
    g: 2, title: '我的书包',
    lines: [
      { who: 'A', text: 'What is in your bag?', zh: '你的书包里有什么？' },
      { who: 'B', text: 'A book and a pen.', zh: '一本书和一支钢笔。' },
      { who: 'A', text: 'Me too.', zh: '我也是。' }
    ]
  },
  // ---- 中年级 ----
  {
    g: 3, title: '今天天气',
    lines: [
      { who: 'A', text: 'How is the weather today?', zh: '今天天气怎么样？' },
      { who: 'B', text: 'It is sunny and warm.', zh: '晴天，很暖和。' },
      { who: 'A', text: 'Let us go to the park.', zh: '我们去公园吧。' }
    ]
  },
  {
    g: 3, title: '问路',
    lines: [
      { who: 'A', text: 'Excuse me, where is the zoo?', zh: '打扰一下，动物园在哪里？' },
      { who: 'B', text: 'Go straight and turn left.', zh: '直走，然后左转。' },
      { who: 'A', text: 'Thank you very much.', zh: '非常感谢。' }
    ]
  },
  {
    g: 4, title: '周末计划',
    lines: [
      { who: 'A', text: 'What will you do this weekend?', zh: '你这周末要做什么？' },
      { who: 'B', text: 'I will visit the library.', zh: '我要去图书馆。' },
      { who: 'A', text: 'Can I go with you?', zh: '我能和你一起去吗？' },
      { who: 'B', text: 'Of course. Let us meet at nine.', zh: '当然。我们九点见。' }
    ]
  },
  {
    g: 4, title: '在餐馆',
    lines: [
      { who: 'A', text: 'What would you like to eat?', zh: '你想吃什么？' },
      { who: 'B', text: 'I would like some noodles.', zh: '我想要一些面条。' },
      { who: 'A', text: 'Here you are.', zh: '给你。' },
      { who: 'B', text: 'Thank you. It looks delicious.', zh: '谢谢，看起来很好吃。' }
    ]
  },
  // ---- 高年级 ----
  {
    g: 5, title: '打电话',
    lines: [
      { who: 'A', text: 'Hello, this is Lucy speaking.', zh: '你好，我是露西。' },
      { who: 'B', text: 'Hi Lucy. How are you?', zh: '嗨，露西。你好吗？' },
      { who: 'A', text: 'I am fine. Shall we play football?', zh: '我很好。我们踢足球好吗？' },
      { who: 'B', text: 'Sorry, I have to finish my homework.', zh: '抱歉，我得先完成作业。' }
    ]
  },
  {
    g: 5, title: '在超市',
    lines: [
      { who: 'A', text: 'How much is this bag?', zh: '这个包多少钱？' },
      { who: 'B', text: 'It is thirty yuan.', zh: '三十元。' },
      { who: 'A', text: 'That is too expensive.', zh: '太贵了。' },
      { who: 'B', text: 'This one is cheaper.', zh: '这个便宜一些。' }
    ]
  },
  {
    g: 6, title: '保护环境',
    lines: [
      { who: 'A', text: 'What can we do to protect the environment?', zh: '我们能做什么来保护环境？' },
      { who: 'B', text: 'We should recycle paper and plastic.', zh: '我们应该回收纸和塑料。' },
      { who: 'A', text: 'And we can walk to school.', zh: '我们还可以走路去学校。' },
      { who: 'B', text: 'Good idea. Let us start today.', zh: '好主意，我们从今天开始。' }
    ]
  },
  {
    g: 6, title: '谈梦想',
    lines: [
      { who: 'A', text: 'What do you want to be in the future?', zh: '你将来想做什么？' },
      { who: 'B', text: 'I want to be a scientist.', zh: '我想当科学家。' },
      { who: 'A', text: 'That is a great dream.', zh: '那是个很棒的梦想。' },
      { who: 'B', text: 'I will work hard to achieve it.', zh: '我会努力去实现它。' }
    ]
  },
  {
    g: 1, title: '在教室里',
    lines: [
      { who: 'A', text: 'Good morning, Miss Li!', zh: '早上好，李老师！' },
      { who: 'B', text: 'Good morning! Sit down, please.', zh: '早上好！请坐下。' },
      { who: 'A', text: 'Thank you.', zh: '谢谢。' }
    ]
  },
  {
    g: 1, title: '我的玩具',
    lines: [
      { who: 'A', text: 'What is this?', zh: '这是什么？' },
      { who: 'B', text: 'It is a ball.', zh: '这是一个球。' },
      { who: 'A', text: 'I like your ball.', zh: '我喜欢你的球。' }
    ]
  },
  {
    g: 2, title: '我的一家',
    lines: [
      { who: 'A', text: 'Who is he?', zh: '他是谁？' },
      { who: 'B', text: 'He is my dad.', zh: '他是我爸爸。' },
      { who: 'A', text: 'And who is she?', zh: '那她是谁？' },
      { who: 'B', text: 'She is my mum.', zh: '她是我妈妈。' }
    ]
  },
  {
    g: 2, title: '在水果店',
    lines: [
      { who: 'A', text: 'Do you like apples?', zh: '你喜欢苹果吗？' },
      { who: 'B', text: 'Yes, I do.', zh: '是的，我喜欢。' },
      { who: 'A', text: 'How many?', zh: '要几个？' },
      { who: 'B', text: 'Three, please.', zh: '请给我三个。' }
    ]
  },
  {
    g: 3, title: '上体育课',
    lines: [
      { who: 'A', text: 'Let us play football.', zh: '我们踢足球吧。' },
      { who: 'B', text: 'Good idea!', zh: '好主意！' },
      { who: 'A', text: 'Can you pass the ball?', zh: '你能传球吗？' },
      { who: 'B', text: 'Yes, here you are.', zh: '可以，给你。' }
    ]
  },
  {
    g: 3, title: '我的一天',
    lines: [
      { who: 'A', text: 'When do you get up?', zh: '你什么时候起床？' },
      { who: 'B', text: 'I get up at seven.', zh: '我七点起床。' },
      { who: 'A', text: 'What do you do then?', zh: '然后你做什么？' },
      { who: 'B', text: 'I have breakfast.', zh: '我吃早饭。' }
    ]
  },
  {
    g: 4, title: '我的爱好',
    lines: [
      { who: 'A', text: 'What is your hobby?', zh: '你的爱好是什么？' },
      { who: 'B', text: 'I like drawing pictures.', zh: '我喜欢画画。' },
      { who: 'A', text: 'That is interesting.', zh: '那很有趣。' },
      { who: 'B', text: 'I draw every Saturday.', zh: '我每个星期六都画。' }
    ]
  },
  {
    g: 4, title: '在图书馆',
    lines: [
      { who: 'A', text: 'Can I borrow this book?', zh: '我能借这本书吗？' },
      { who: 'B', text: 'Sure. Please return it in two weeks.', zh: '当然。请两周内归还。' },
      { who: 'A', text: 'Thank you. I will be careful.', zh: '谢谢，我会小心的。' }
    ]
  },
  {
    g: 5, title: '问天气',
    lines: [
      { who: 'A', text: 'What is the weather like today?', zh: '今天天气怎么样？' },
      { who: 'B', text: 'It is cold and windy.', zh: '很冷，还刮风。' },
      { who: 'A', text: 'Shall we stay at home?', zh: '我们待在家里好吗？' },
      { who: 'B', text: 'Yes, let us read books.', zh: '好，我们看书吧。' }
    ]
  },
  {
    g: 5, title: '过生日',
    lines: [
      { who: 'A', text: 'Happy birthday! Here is a gift for you.', zh: '生日快乐！这是给你的礼物。' },
      { who: 'B', text: 'Thank you! Can I open it now?', zh: '谢谢！我现在能打开吗？' },
      { who: 'A', text: 'Sure.', zh: '当然可以。' },
      { who: 'B', text: 'Wow, a story book! I love it.', zh: '哇，一本故事书！我太喜欢了。' }
    ]
  },
  {
    g: 6, title: '周末的安排',
    lines: [
      { who: 'A', text: 'What are you going to do this weekend?', zh: '你周末打算做什么？' },
      { who: 'B', text: 'I am going to visit a museum.', zh: '我打算去参观博物馆。' },
      { who: 'A', text: 'May I join you?', zh: '我可以和你一起去吗？' },
      { who: 'B', text: 'Of course. Let us meet at the gate.', zh: '当然。我们在大门口见。' }
    ]
  },
  {
    g: 6, title: '谈学习',
    lines: [
      { who: 'A', text: 'How do you learn English?', zh: '你怎么学英语？' },
      { who: 'B', text: 'I listen and repeat every day.', zh: '我每天听并跟读。' },
      { who: 'A', text: 'That is a good habit.', zh: '这是个好习惯。' },
      { who: 'B', text: 'It helps me a lot.', zh: '它对我帮助很大。' }
    ]
  },
  {
    g: 1, title: '在公园里',
    lines: [
      { who: 'A', text: 'Look at the tree!', zh: '看那棵树！' },
      { who: 'B', text: 'It is big.', zh: '它很大。' },
      { who: 'A', text: 'I like the park.', zh: '我喜欢这个公园。' }
    ]
  },
  {
    g: 1, title: '我的铅笔',
    lines: [
      { who: 'A', text: 'Where is my pencil?', zh: '我的铅笔在哪里？' },
      { who: 'B', text: 'It is in your bag.', zh: '在你的书包里。' },
      { who: 'A', text: 'Thank you!', zh: '谢谢你！' }
    ]
  },
  {
    g: 1, title: '数一数',
    lines: [
      { who: 'A', text: 'How many cats?', zh: '有几只猫？' },
      { who: 'B', text: 'One, two, three.', zh: '一、二、三。' },
      { who: 'A', text: 'Three cats!', zh: '三只猫！' }
    ]
  },
  {
    g: 1, title: '该睡觉了',
    lines: [
      { who: 'A', text: 'Good night, Mum.', zh: '晚安，妈妈。' },
      { who: 'B', text: 'Good night, dear.', zh: '晚安，宝贝。' },
      { who: 'A', text: 'See you tomorrow.', zh: '明天见。' }
    ]
  },
  {
    g: 1, title: '我喜欢蓝色',
    lines: [
      { who: 'A', text: 'Do you like blue?', zh: '你喜欢蓝色吗？' },
      { who: 'B', text: 'Yes, I like blue.', zh: '是的，我喜欢蓝色。' },
      { who: 'A', text: 'Me too.', zh: '我也是。' }
    ]
  },
  {
    g: 1, title: '这是我的妈妈',
    lines: [
      { who: 'A', text: 'Who is she?', zh: '她是谁？' },
      { who: 'B', text: 'She is my mum.', zh: '她是我妈妈。' },
      { who: 'A', text: 'Hello, Mum!', zh: '妈妈，你好！' }
    ]
  },
  {
    g: 2, title: '在商店',
    lines: [
      { who: 'A', text: 'Can I have a cake?', zh: '我可以要一个蛋糕吗？' },
      { who: 'B', text: 'Here you are.', zh: '给你。' },
      { who: 'A', text: 'How much?', zh: '多少钱？' },
      { who: 'B', text: 'Five yuan.', zh: '五元。' }
    ]
  },
  {
    g: 2, title: '我会游泳',
    lines: [
      { who: 'A', text: 'Can you swim?', zh: '你会游泳吗？' },
      { who: 'B', text: 'Yes, I can.', zh: '是的，我会。' },
      { who: 'A', text: 'Let us swim together.', zh: '我们一起去游泳吧。' },
      { who: 'B', text: 'Great!', zh: '太好了！' }
    ]
  }
];
