/**
 * specs-science-data.js —— P5 科学规格题库的事实数据
 *
 * 口径：只放小学科学教材范围内的常识事实，不引入超纲术语；
 * 每条数据都能同时支撑 ≥3 种问法（家族 modes 负责换外壳）。
 */

/* ---------------- sc-life ---------------- */
export const SCI_ANIMALS = [
  { n: '蚂蚁', cat: '昆虫', legs: 6, feature: '身体分头、胸、腹三部分' },
  { n: '蝴蝶', cat: '昆虫', legs: 6, feature: '翅膀上有鳞片' },
  { n: '蜜蜂', cat: '昆虫', legs: 6, feature: '会采花蜜' },
  { n: '蜻蜓', cat: '昆虫', legs: 6, feature: '有两对翅膀' },
  { n: '金鱼', cat: '鱼类', legs: 0, feature: '用鳃呼吸、用鳍游泳' },
  { n: '鲤鱼', cat: '鱼类', legs: 0, feature: '生活在水里' },
  { n: '青蛙', cat: '两栖动物', legs: 4, feature: '小时候是蝌蚪' },
  { n: '乌龟', cat: '爬行动物', legs: 4, feature: '背上有硬壳' },
  { n: '麻雀', cat: '鸟类', legs: 2, feature: '身上有羽毛' },
  { n: '鸽子', cat: '鸟类', legs: 2, feature: '有翅膀和喙' },
  { n: '猫', cat: '哺乳动物', legs: 4, feature: '直接生小猫、吃奶长大' },
  { n: '狗', cat: '哺乳动物', legs: 4, feature: '用肺呼吸' },
  { n: '兔子', cat: '哺乳动物', legs: 4, feature: '长耳朵、吃奶长大' },
  { n: '牛', cat: '哺乳动物', legs: 4, feature: '吃草、会反刍' },
  { n: '猴子', cat: '哺乳动物', legs: 4, feature: '会爬树' },
  { n: '鲸', cat: '哺乳动物', legs: 0, feature: '生活在海里但用肺呼吸' }
];

export const SCI_LIVING = [
  { n: '蚂蚁', living: true }, { n: '大树', living: true },
  { n: '蘑菇', living: true }, { n: '金鱼', living: true },
  { n: '小草', living: true }, { n: '小狗', living: true },
  { n: '向日葵', living: true }, { n: '蜜蜂', living: true },
  { n: '石头', living: false }, { n: '水', living: false },
  { n: '铅笔', living: false }, { n: '汽车', living: false },
  { n: '云', living: false }, { n: '空气', living: false },
  { n: '书本', living: false }, { n: '桌子', living: false }
];

export const SCI_PLANT_PARTS = [
  { part: '根', use: '吸收水分和养分' },
  { part: '茎', use: '运输水分、支撑植物' },
  { part: '叶', use: '制造养分' },
  { part: '花', use: '繁殖后代' },
  { part: '种子', use: '繁殖后代' },
  { part: '果实', use: '保护种子' },
  { part: '树皮', use: '保护植物' },
  { part: '叶脉', use: '运输水分' },
  { part: '花蕊', use: '产生花粉' },
  { part: '枝条', use: '支撑叶和花' },
  { part: '萝卜的根', use: '储存养分' },
  { part: '土豆的块茎', use: '储存养分' },
  { part: '莲藕的茎', use: '储存养分' },
  { part: '松树的叶', use: '减少水分散失' },
  { part: '仙人掌的茎', use: '储存水分' },
  { part: '竹子的茎', use: '支撑植物' }
];

export const SCI_REPRO = [
  { n: '猫', way: '胎生' }, { n: '狗', way: '胎生' },
  { n: '兔子', way: '胎生' }, { n: '牛', way: '胎生' },
  { n: '麻雀', way: '卵生' }, { n: '鸽子', way: '卵生' },
  { n: '乌龟', way: '卵生' }, { n: '金鱼', way: '卵生' },
  { n: '蝴蝶', way: '卵生' }, { n: '青蛙', way: '卵生' },
  { n: '蚕', way: '卵生' }, { n: '鸡', way: '卵生' },
  { n: '向日葵', way: '用种子繁殖' }, { n: '凤仙花', way: '用种子繁殖' },
  { n: '土豆', way: '用块茎繁殖' }, { n: '绿萝', way: '用茎繁殖' }
];

export const SCI_ADAPT = [
  { scene: '仙人掌生活在沙漠里，它的叶子退化成刺', answer: '减少水分散失' },
  { scene: '北极熊有厚厚的脂肪和白色的毛', answer: '保暖并隐藏自己' },
  { scene: '鱼的身体呈流线型', answer: '减小水中游动的阻力' },
  { scene: '青蛙的皮肤颜色和周围环境相近', answer: '保护自己不被发现' },
  { scene: '候鸟秋天飞到南方', answer: '寻找温暖和有食物的地方' },
  { scene: '熊在冬天冬眠', answer: '度过缺少食物的寒冷季节' },
  { scene: '骆驼的驼峰储存脂肪', answer: '在沙漠中补充能量' },
  { scene: '莲的根扎在水底泥土里', answer: '固定植物并吸收养分' },
  { scene: '蒲公英的种子有绒毛', answer: '借助风传播种子' },
  { scene: '苍耳的种子表面有刺', answer: '挂在动物身上传播' },
  { scene: '松鼠秋天储存松果', answer: '为过冬准备食物' },
  { scene: '企鹅有厚厚的脂肪和密密的羽毛', answer: '在寒冷的地方保暖' }
];

export const SCI_CHAINS = [
  { chain: '草→兔→狼', eat: '草', eater: '兔' },
  { chain: '树叶→毛毛虫→小鸟', eat: '树叶', eater: '毛毛虫' },
  { chain: '水草→小鱼→大鱼', eat: '水草', eater: '小鱼' },
  { chain: '稻谷→老鼠→蛇', eat: '稻谷', eater: '老鼠' },
  { chain: '花蜜→蝴蝶→麻雀', eat: '花蜜', eater: '蝴蝶' },
  { chain: '浮游植物→小虾→鱼', eat: '浮游植物', eater: '小虾' },
  { chain: '青草→羊→狼', eat: '青草', eater: '羊' },
  { chain: '树叶→蜗牛→鸟', eat: '树叶', eater: '蜗牛' }
];

export const SCI_HABITS = [
  { n: '勤洗手', good: true, why: '能洗掉手上的病菌' },
  { n: '长时间看手机', good: false, why: '容易伤害眼睛' },
  { n: '早睡早起', good: true, why: '让身体得到充分休息' },
  { n: '挑食只吃肉', good: false, why: '营养不均衡' },
  { n: '戴耳机把音量开得很大', good: false, why: '会损伤听力' },
  { n: '坚持锻炼身体', good: true, why: '增强体质' },
  { n: '饭后马上剧烈跑跳', good: false, why: '影响消化' },
  { n: '每天喝足够的水', good: true, why: '身体需要水分' },
  { n: '咬铅笔头', good: false, why: '不卫生，还可能中毒' },
  { n: '早晚认真刷牙', good: true, why: '保护牙齿' },
  { n: '蒙着头睡觉', good: false, why: '呼吸不到新鲜空气' },
  { n: '经常开窗通风', good: true, why: '保持空气新鲜' },
  { n: '熬夜玩到很晚', good: false, why: '影响生长发育' },
  { n: '按时吃早餐', good: true, why: '上午学习有精神' },
  { n: '随地吐痰', good: false, why: '传播病菌' },
  { n: '读书写字坐姿端正', good: true, why: '保护脊柱和视力' }
];

export const SCI_ORGANS = [
  { n: '胃', use: '消化食物' },
  { n: '小肠', use: '吸收营养' },
  { n: '大肠', use: '吸收水分、形成粪便' },
  { n: '肺', use: '呼吸空气' },
  { n: '心脏', use: '推动血液流动' },
  { n: '眼睛', use: '看东西' },
  { n: '耳朵', use: '听声音' },
  { n: '鼻子', use: '闻气味' },
  { n: '舌头', use: '尝味道' },
  { n: '皮肤', use: '感觉冷热和疼痛' },
  { n: '脑', use: '思考和指挥身体' },
  { n: '牙齿', use: '咀嚼食物' }
];

export const SCI_MICROBES = [
  { n: '乳酸菌', kind: '有益', use: '做酸奶' },
  { n: '酵母菌', kind: '有益', use: '发面做馒头' },
  { n: '大肠杆菌', kind: '有害', use: '可能引起腹泻' },
  { n: '霉菌', kind: '有害', use: '让食物变质' },
  { n: '新冠病毒', kind: '有害', use: '引起疾病' },
  { n: '青霉', kind: '有益', use: '可提取青霉素' },
  { n: '醋酸菌', kind: '有益', use: '酿醋' },
  { n: '感冒病毒', kind: '有害', use: '引起感冒' }
];

export const SCI_LIFE_SEQS = [
  { name: '蝴蝶', order: ['卵', '幼虫', '蛹', '成虫'] },
  { name: '蚕', order: ['蚕卵', '蚁蚕', '蚕蛹', '蚕蛾'] },
  { name: '青蛙', order: ['卵', '蝌蚪', '长出后腿的蝌蚪', '青蛙'] },
  { name: '凤仙花', order: ['种子', '发芽', '幼苗', '开花结果'] },
  { name: '向日葵', order: ['种子', '发芽', '幼苗', '开花结籽'] },
  { name: '人', order: ['婴儿', '幼儿', '儿童', '少年'] },
  { name: '小鸡', order: ['鸡蛋', '孵化', '小鸡', '成年鸡'] },
  { name: '树', order: ['种子', '幼苗', '小树', '大树'] }
];

/* ---------------- sc-matter ---------------- */
export const SCI_MATERIALS = [
  { n: '铁钉', material: '金属', conducts: true, dissolves: false, floats: false },
  { n: '铜丝', material: '金属', conducts: true, dissolves: false, floats: false },
  { n: '铝勺', material: '金属', conducts: true, dissolves: false, floats: false },
  { n: '塑料尺', material: '塑料', conducts: false, dissolves: false, floats: true },
  { n: '木块', material: '木头', conducts: false, dissolves: false, floats: true },
  { n: '玻璃杯', material: '玻璃', conducts: false, dissolves: false, floats: false },
  { n: '纸片', material: '纸', conducts: false, dissolves: false, floats: true },
  { n: '橡皮', material: '橡胶', conducts: false, dissolves: false, floats: true },
  { n: '陶瓷碗', material: '陶瓷', conducts: false, dissolves: false, floats: false },
  { n: '布片', material: '布', conducts: false, dissolves: false, floats: true },
  { n: '食盐', material: '盐', conducts: false, dissolves: true, floats: false },
  { n: '白糖', material: '糖', conducts: false, dissolves: true, floats: false },
  { n: '沙子', material: '沙', conducts: false, dissolves: false, floats: false },
  { n: '食用油', material: '油', conducts: false, dissolves: false, floats: true },
  { n: '小石子', material: '石头', conducts: false, dissolves: false, floats: false },
  { n: '泡沫块', material: '泡沫', conducts: false, dissolves: false, floats: true }
];

export const SCI_STATES = [
  { n: '冰块', state: '固体', true: true },
  { n: '木块', state: '固体', true: true },
  { n: '石头', state: '固体', true: true },
  { n: '铁钉', state: '固体', true: true },
  { n: '牛奶', state: '液体', true: true },
  { n: '果汁', state: '液体', true: true },
  { n: '食用油', state: '液体', true: true },
  { n: '水', state: '液体', true: true },
  { n: '空气', state: '气体', true: true },
  { n: '水蒸气', state: '气体', true: true },
  { n: '氧气', state: '气体', true: true },
  { n: '二氧化碳', state: '气体', true: true },
  { n: '沙子', state: '固体', true: true },
  { n: '白糖', state: '固体', true: true },
  { n: '醋', state: '液体', true: true },
  { n: '酱油', state: '液体', true: true }
];

export const SCI_CHANGES = [
  { from: '水', to: '水蒸气', type: '蒸发', cond: '受热' },
  { from: '水蒸气', to: '水', type: '凝结', cond: '遇冷' },
  { from: '水', to: '冰', type: '结冰', cond: '受冷到 0℃' },
  { from: '冰', to: '水', type: '融化', cond: '受热' },
  { from: '铁', to: '铁锈', type: '生锈', cond: '长期潮湿' },
  { from: '纸', to: '灰', type: '燃烧', cond: '点燃' },
  { from: '牛奶', to: '酸奶', type: '变质', cond: '放久了' },
  { from: '湿衣服', to: '干衣服', type: '蒸发', cond: '晾晒' },
  { from: '锅盖', to: '水珠', type: '凝结', cond: '水蒸气遇冷' },
  { from: '蜡烛', to: '烛泪', type: '融化', cond: '受热' },
  { from: '冰雪', to: '水', type: '融化', cond: '气温升高' },
  { from: '面包', to: '霉变面包', type: '变质', cond: '受潮放久' }
];

export const SCI_USES = [
  { item: '电线芯', material: '铜', why: '铜容易导电' },
  { item: '窗玻璃', material: '玻璃', why: '玻璃透明' },
  { item: '雨衣', material: '塑料', why: '塑料不透水' },
  { item: '筷子', material: '木头', why: '木头轻且不烫手' },
  { item: '炒锅', material: '金属', why: '金属传热快' },
  { item: '饭碗', material: '陶瓷', why: '陶瓷耐热易清洗' },
  { item: '轮胎', material: '橡胶', why: '橡胶有弹性' },
  { item: '书本', material: '纸', why: '纸能写字且轻' },
  { item: '插座外壳', material: '塑料', why: '塑料不导电' },
  { item: '剪刀', material: '金属', why: '金属坚硬' },
  { item: '衣服', material: '布', why: '布柔软透气' },
  { item: '锅铲手柄', material: '塑料', why: '塑料不烫手且不导电' }
];

export const SCI_SEPARATE = [
  { mix: '沙子和水', way: '过滤' },
  { mix: '铁钉和沙子', way: '用磁铁吸' },
  { mix: '盐和水', way: '加热蒸发' },
  { mix: '木屑和沙子', way: '放入水中分离' },
  { mix: '米和糠', way: '筛子筛' },
  { mix: '油和水', way: '用分液漏斗' },
  { mix: '豆子和沙子', way: '筛子筛' },
  { mix: '铁屑和铜屑', way: '用磁铁吸' }
];

export const SCI_BURN = [
  { n: '纸', burns: true }, { n: '木头', burns: true },
  { n: '汽油', burns: true }, { n: '布', burns: true },
  { n: '塑料', burns: true }, { n: '树叶', burns: true },
  { n: '石头', burns: false }, { n: '水', burns: false },
  { n: '玻璃', burns: false }, { n: '铁钉', burns: false },
  { n: '沙子', burns: false }, { n: '陶瓷', burns: false }
];

export const SCI_RUST = [
  { n: '铁钉' }, { n: '铁门' }, { n: '铁链' }, { n: '铁锅' },
  { n: '铁栏杆' }, { n: '铁剪刀' }, { n: '铁钉盒' }, { n: '铁自行车' },
  { n: '铁螺丝' }, { n: '铁锤' }, { n: '铁水管' }, { n: '铁钥匙' }
];

export const SCI_SPOIL = [
  { n: '牛奶', spoils: true }, { n: '面包', spoils: true },
  { n: '肉', spoils: true }, { n: '水果', spoils: true },
  { n: '米饭', spoils: true }, { n: '蔬菜', spoils: true },
  { n: '食盐', spoils: false }, { n: '白糖', spoils: false },
  { n: '干豆子', spoils: false }, { n: '醋', spoils: false },
  { n: '蜂蜜', spoils: false }, { n: '干茶叶', spoils: false }
];

export const SCI_AIR = [
  { stmt: '空气看不见摸不着，但占据空间。', true: true },
  { stmt: '空气有质量。', true: true },
  { stmt: '空气能被压缩。', true: true },
  { stmt: '空气会流动形成风。', true: true },
  { stmt: '空气中含量最多的是氧气。', true: false },
  { stmt: '空气是纯净物。', true: false },
  { stmt: '把空杯子倒扣压入水中，杯内的纸会湿。', true: false },
  { stmt: '给气球充气后，气球变大了。', true: true },
  { stmt: '空气没有质量。', true: false },
  { stmt: '植物生长需要空气。', true: true },
  { stmt: '空气占据空间，所以吹鼓的塑料袋鼓起来。', true: true },
  { stmt: '真空里也有空气。', true: false }
];

/* ---------------- sc-force ---------------- */
export const SCI_FORCES = [
  { n: '推门', force: '推力' }, { n: '拉抽屉', force: '拉力' },
  { n: '磁铁吸铁钉', force: '磁力' }, { n: '搓手发热', force: '摩擦力' },
  { n: '压弹簧', force: '弹力' }, { n: '苹果落地', force: '重力' },
  { n: '气球放气飞走', force: '反冲力' }, { n: '流水推动水车', force: '水力' },
  { n: '拉开橡皮筋', force: '弹力' }, { n: '磁铁同极相斥', force: '磁力' },
  { n: '用手提书包', force: '拉力' }, { n: '用手推小车', force: '推力' },
  { n: '湿手搓动', force: '摩擦力' }, { n: '瀑布落下', force: '重力' },
  { n: '喷气飞机前进', force: '反冲力' }, { n: '风吹动风车', force: '风力' }
];

export const SCI_FRICTION = [
  { scene: '鞋底刻有花纹', effect: '增大摩擦力' },
  { scene: '给自行车链条上油', effect: '减小摩擦力' },
  { scene: '在雪地上铺沙子', effect: '增大摩擦力' },
  { scene: '滑梯表面做得很光滑', effect: '减小摩擦力' },
  { scene: '汽车轮胎有花纹', effect: '增大摩擦力' },
  { scene: '滚珠轴承里装钢珠', effect: '减小摩擦力' },
  { scene: '运动员手上抹镁粉', effect: '增大摩擦力' },
  { scene: '门轴滴润滑油', effect: '减小摩擦力' },
  { scene: '跑步鞋底有钉子', effect: '增大摩擦力' },
  { scene: '磁悬浮列车悬浮行驶', effect: '减小摩擦力' },
  { scene: '握紧瓶子不容易滑', effect: '增大摩擦力' },
  { scene: '溜冰鞋的冰刀很光滑', effect: '减小摩擦力' }
];

export const SCI_MAGNETS = [
  { a: 'N', b: 'N', attract: false },
  { a: 'S', b: 'S', attract: false },
  { a: 'N', b: 'S', attract: true },
  { a: 'S', b: 'N', attract: true }
];

export const SCI_MAGNET_ITEMS = [
  { n: '铁钉', magnet: true }, { n: '回形针', magnet: true },
  { n: '铁钥匙', magnet: true }, { n: '铁尺', magnet: true },
  { n: '铜丝', magnet: false }, { n: '铝勺', magnet: false },
  { n: '塑料尺', magnet: false }, { n: '木块', magnet: false },
  { n: '玻璃杯', magnet: false }, { n: '纸片', magnet: false },
  { n: '橡皮', magnet: false }, { n: '陶瓷碗', magnet: false },
  { n: '铁螺丝', magnet: true }, { n: '铁锤', magnet: true },
  { n: '布片', magnet: false }, { n: '硬币', magnet: false }
];

export const SCI_CIRCUIT = [
  { stmt: '一个完整的电路需要电源、导线、用电器。', true: true },
  { stmt: '开关断开时，电路是通路。', true: false },
  { stmt: '小灯泡发光说明电路中有电流。', true: true },
  { stmt: '短路是安全的。', true: false },
  { stmt: '干电池的两端叫正极和负极。', true: true },
  { stmt: '导线外皮是绝缘体。', true: true },
  { stmt: '电池可以提供电能。', true: true },
  { stmt: '开关闭合时，电路接通。', true: true },
  { stmt: '把电池的两极直接用导线连起来是正确做法。', true: false },
  { stmt: '手电筒里有电池、灯泡和开关。', true: true },
  { stmt: '电路中没有电源小灯泡也能一直亮。', true: false },
  { stmt: '一个开关只能控制一个灯泡。', true: false }
];

export const SCI_ELECTRIC = [
  { n: '铁钉', conducts: true }, { n: '铜丝', conducts: true },
  { n: '铝勺', conducts: true }, { n: '铅笔芯', conducts: true },
  { n: '硬币', conducts: true }, { n: '钥匙', conducts: true },
  { n: '钢丝', conducts: true }, { n: '盐水', conducts: true },
  { n: '塑料尺', conducts: false }, { n: '橡皮', conducts: false },
  { n: '玻璃杯', conducts: false }, { n: '木筷', conducts: false },
  { n: '陶瓷碗', conducts: false }, { n: '干布', conducts: false },
  { n: '纸片', conducts: false }, { n: '空气', conducts: false }
];

export const SCI_SOUND = [
  { stmt: '声音是由物体振动产生的。', true: true },
  { stmt: '声音能在真空中传播。', true: false },
  { stmt: '声音可以在水中传播。', true: true },
  { stmt: '声音可以在空气中传播。', true: true },
  { stmt: '用力敲鼓，声音会变响。', true: true },
  { stmt: '物体振动越快，音调越高。', true: true },
  { stmt: '物体振动越慢，音调越高。', true: false },
  { stmt: '声音在固体中传播比在空气中慢。', true: false },
  { stmt: '噪声会伤害听力。', true: true },
  { stmt: '戴耳机时音量越大越好。', true: false },
  { stmt: '用手按住发声的音叉，声音会停止。', true: true },
  { stmt: '声音只能朝一个方向传播。', true: false },
  { stmt: '尺子伸出桌面越长，振动时音调越低。', true: true },
  { stmt: '捂住耳朵能减弱听到的声音。', true: true },
  { stmt: '所有声音都悦耳好听。', true: false },
  { stmt: '鼓面振动停止，鼓声也停止。', true: true }
];

export const SCI_LIGHT = [
  { stmt: '光沿直线传播。', true: true },
  { stmt: '影子是光被物体挡住形成的。', true: true },
  { stmt: '镜子能反射光。', true: true },
  { stmt: '月亮自己会发光。', true: false },
  { stmt: '太阳是光源。', true: true },
  { stmt: '点燃的蜡烛是光源。', true: true },
  { stmt: '光能穿过玻璃。', true: true },
  { stmt: '光不能穿过墙壁。', true: true },
  { stmt: '阳光下影子的方向随太阳位置变化。', true: true },
  { stmt: '彩虹是太阳光被分解形成的。', true: true },
  { stmt: '放大镜能聚光。', true: true },
  { stmt: '在完全黑暗的房间里能看清物体。', true: false },
  { stmt: '潜望镜利用了光的反射。', true: true },
  { stmt: '汽车后视镜利用了光的反射。', true: true },
  { stmt: '光从空气斜射入水中时方向不会改变。', true: false },
  { stmt: '打开的手电筒是光源。', true: true }
];

export const SCI_ENERGY = [
  { device: '电灯', from: '电能', to: '光能' },
  { device: '电饭锅', from: '电能', to: '热能' },
  { device: '电风扇', from: '电能', to: '动能' },
  { device: '电池', from: '化学能', to: '电能' },
  { device: '太阳能热水器', from: '太阳能', to: '热能' },
  { device: '水电站', from: '水能', to: '电能' },
  { device: '风车', from: '风能', to: '动能' },
  { device: '电动机', from: '电能', to: '动能' },
  { device: '燃气灶', from: '化学能', to: '热能' },
  { device: '音响', from: '电能', to: '声能' },
  { device: '植物光合作用', from: '光能', to: '化学能' },
  { device: '汽车发动机', from: '化学能', to: '动能' },
  { device: '发电机', from: '动能', to: '电能' },
  { device: '充电宝充电', from: '电能', to: '化学能' },
  { device: '蹦床', from: '动能', to: '弹性势能' },
  { device: '电热水壶', from: '电能', to: '热能' }
];

/* ---------------- sc-earth ---------------- */
export const SCI_WEATHER = [
  { n: '气温', tool: '温度计' },
  { n: '风向', tool: '风向标' },
  { n: '风力', tool: '风旗' },
  { n: '降水量', tool: '雨量器' },
  { n: '云量', tool: '眼睛观察' },
  { n: '湿度', tool: '湿度计' },
  { n: '天气', tool: '天气预报' },
  { n: '空气质量', tool: '空气质量指数' },
  { n: '雾', tool: '能见度观测' },
  { n: '雷电', tool: '闪电定位仪' },
  { n: '霜', tool: '地面观测' },
  { n: '日照时间', tool: '日照计' }
];

export const SCI_WATER_CYCLE = [
  { process: '水面变成水蒸气', stage: '蒸发' },
  { process: '水蒸气变成小水滴', stage: '凝结' },
  { process: '小水滴聚集成云', stage: '成云' },
  { process: '雨或雪从云中落下', stage: '降水' },
  { process: '水汇入河流和海洋', stage: '汇流' },
  { process: '植物把水蒸气送回空气', stage: '蒸腾' },
  { process: '水渗入土壤', stage: '下渗' },
  { process: '冰雪变成水', stage: '融化' }
];

export const SCI_EARTH = [
  { stmt: '地球是球形的。', true: true },
  { stmt: '地球表面大部分是海洋。', true: true },
  { stmt: '地球内部有岩浆。', true: true },
  { stmt: '地震是地球内部运动引起的。', true: true },
  { stmt: '火山喷发会改变地表。', true: true },
  { stmt: '流水会改变地表形态。', true: true },
  { stmt: '土壤是由岩石风化形成的。', true: true },
  { stmt: '化石可以记录远古生物。', true: true },
  { stmt: '地球上的水在循环流动。', true: true },
  { stmt: '地球自西向东自转。', true: true },
  { stmt: '月相变化的周期约为一个月。', true: true },
  { stmt: '月球围绕地球公转。', true: true },
  { stmt: '太阳围绕地球转。', true: false },
  { stmt: '四季形成与地球绕太阳公转有关。', true: true },
  { stmt: '昼夜交替与地球自转有关。', true: true },
  { stmt: '北极星大致在正北方。', true: true }
];

export const SCI_SPACE = [
  { stmt: '太阳是一颗恒星。', true: true },
  { stmt: '地球是一颗行星。', true: true },
  { stmt: '月球是地球的卫星。', true: true },
  { stmt: '太阳系有八颗行星。', true: true },
  { stmt: '太阳系中最大的行星是木星。', true: true },
  { stmt: '离太阳最近的行星是水星。', true: true },
  { stmt: '月球上没有空气。', true: true },
  { stmt: '月球表面有环形山。', true: true },
  { stmt: '太阳会发光发热。', true: true },
  { stmt: '银河系包含太阳。', true: true },
  { stmt: '火箭靠反冲力前进。', true: true },
  { stmt: '宇航员在太空要穿宇航服。', true: true },
  { stmt: '火星被称为红色行星。', true: true },
  { stmt: '流星是太空中的尘埃进入大气层燃烧发光。', true: true },
  { stmt: '太阳系有九颗行星。', true: false },
  { stmt: '月球会自己发光。', true: false }
];

export const SCI_RESOURCES = [
  { n: '太阳能', renewable: true }, { n: '风能', renewable: true },
  { n: '水能', renewable: true }, { n: '森林', renewable: true },
  { n: '潮汐能', renewable: true }, { n: '地热能', renewable: true },
  { n: '生物质能', renewable: true }, { n: '土壤', renewable: true },
  { n: '煤', renewable: false }, { n: '石油', renewable: false },
  { n: '天然气', renewable: false }, { n: '铁矿', renewable: false },
  { n: '铜矿', renewable: false }, { n: '石灰石', renewable: false },
  { n: '铀矿', renewable: false }, { n: '磷矿', renewable: false }
];

/* ---------------- sc-inquiry ---------------- */
export const SCI_TOOLS = [
  { n: '刻度尺', use: '测量长度' },
  { n: '天平', use: '测量质量' },
  { n: '温度计', use: '测量温度' },
  { n: '量筒', use: '测量液体体积' },
  { n: '放大镜', use: '放大观察细小物体' },
  { n: '显微镜', use: '观察细胞和微小生物' },
  { n: '弹簧测力计', use: '测量力的大小' },
  { n: '秒表', use: '测量时间' },
  { n: '指南针', use: '辨别方向' },
  { n: '雨量器', use: '测量降水量' },
  { n: '风向标', use: '测量风向' },
  { n: '酒精灯', use: '加热' },
  { n: '镊子', use: '夹取细小物体' },
  { n: '剪刀', use: '剪裁材料' },
  { n: '漏斗', use: '过滤液体' },
  { n: '三脚架', use: '支撑加热容器' }
];

export const SCI_VARS = [
  { scenario: '研究不同土壤对植物生长的影响', variable: '土壤种类' },
  { scenario: '研究浇水量对植物生长的影响', variable: '浇水量' },
  { scenario: '研究温度对种子发芽的影响', variable: '温度' },
  { scenario: '研究光照对植物生长的影响', variable: '光照' },
  { scenario: '研究不同材料的导电性', variable: '材料种类' },
  { scenario: '研究船的形状对载重的影响', variable: '船的形状' },
  { scenario: '研究斜面坡度对小车速度的影响', variable: '斜面坡度' },
  { scenario: '研究材料厚度对隔音效果的影响', variable: '材料厚度' },
  { scenario: '研究弦的长短对音高的影响', variable: '弦的长短' },
  { scenario: '研究不同材料的保温效果', variable: '材料种类' },
  { scenario: '研究水量对溶解食盐多少的影响', variable: '水量' },
  { scenario: '研究不同纸的吸水能力', variable: '纸的种类' },
  { scenario: '研究不同表面的摩擦力大小', variable: '表面粗糙程度' },
  { scenario: '研究不同颜色物体的吸热本领', variable: '物体颜色' },
  { scenario: '研究磁铁大小对磁力强弱的影响', variable: '磁铁大小' },
  { scenario: '研究不同形状结构承受力的大小', variable: '结构形状' }
];

export const SCI_EVIDENCE = [
  { obs: '阳光下的影子在中午最短', concl: '太阳在中午升得最高' },
  { obs: '清晨草叶上出现小水珠', concl: '空气中的水蒸气遇冷凝结' },
  { obs: '湿衣服在通风处更快变干', concl: '空气流动加快蒸发' },
  { obs: '铁钉放在潮湿处一段时间后出现锈', concl: '铁在潮湿环境中容易生锈' },
  { obs: '蜡烛燃烧后变短了', concl: '蜡烛在燃烧中被消耗' },
  { obs: '小车从斜面滑下后自己前进一段', concl: '小车离开斜面时具有能量' },
  { obs: '磁铁隔着纸也能吸住回形针', concl: '磁力能穿过某些物体' },
  { obs: '尺子一端被按住、另一端振动时发出声音', concl: '声音由振动产生' },
  { obs: '手电筒照镜子，墙上有光斑', concl: '镜子反射光' },
  { obs: '雨后天空出现彩虹', concl: '阳光被空中的小水滴分解' },
  { obs: '云层变厚、天色变暗', concl: '可能要下雨' },
  { obs: '蚂蚁排队搬运食物', concl: '蚂蚁在觅食和搬运' },
  { obs: '窗台上的植物向光的一侧长得更旺', concl: '植物有向光生长的特点' },
  { obs: '鱼在水里不停地张口', concl: '鱼在用鳃呼吸' },
  { obs: '放大镜聚光处纸片变焦发黄', concl: '放大镜把光会聚起来' },
  { obs: '热水杯上方的冷玻璃片出现水珠', concl: '水蒸气遇冷凝结成水' }
];

export const SCI_SAFETY = [
  { stmt: '酒精灯用灯帽盖灭。', true: true },
  { stmt: '可以用嘴吹灭酒精灯。', true: false },
  { stmt: '实验时应该戴护目镜。', true: true },
  { stmt: '可以用手直接拿加热后的物体。', true: false },
  { stmt: '闻气味时用手轻轻扇闻。', true: true },
  { stmt: '可以用嘴尝未知的物体。', true: false },
  { stmt: '电器着火应立即用水浇灭。', true: false },
  { stmt: '湿手不能插拔插座。', true: true },
  { stmt: '不能用放大镜直接看太阳。', true: true },
  { stmt: '加热试管要用试管夹。', true: true },
  { stmt: '玻璃器皿要轻拿轻放。', true: true },
  { stmt: '实验结束后要洗手。', true: true },
  { stmt: '可以在实验室里吃东西。', true: false },
  { stmt: '刀片用完可以随手放在桌边。', true: false },
  { stmt: '发现有人触电要先切断电源。', true: true },
  { stmt: '使用剪刀时刀口应朝外。', true: true }
];

/* ---------------- sc-tech ---------------- */
export const SCI_TECH = [
  { product: '小船', principle: '浮力' },
  { product: '乐器', principle: '振动发声' },
  { product: '日晷', principle: '影子的变化' },
  { product: '太阳能热水器', principle: '吸收太阳的热' },
  { product: '杠杆', principle: '省力' },
  { product: '滑轮', principle: '改变用力方向' },
  { product: '轮轴', principle: '省力' },
  { product: '斜面', principle: '省力' },
  { product: '保温杯', principle: '减少热传递' },
  { product: '雨伞', principle: '防水' },
  { product: '拱形桥', principle: '拱形承重' },
  { product: '植物工厂', principle: '控制生长环境' },
  { product: '灭火器', principle: '隔绝空气' },
  { product: '温度计', principle: '液体的热胀冷缩' },
  { product: '指南针', principle: '磁力' },
  { product: '潜望镜', principle: '光的反射' }
];

export const SCI_TECH_NEEDS = [
  { need: '想过河又不想弄湿衣服', product: '小船' },
  { need: '想看清很远处的风景', product: '望远镜' },
  { need: '想在夜里照亮房间', product: '电灯' },
  { need: '想在下雨天不被淋湿', product: '雨伞' },
  { need: '想把热汤保温', product: '保温杯' },
  { need: '想测量今天的气温', product: '温度计' },
  { need: '想在野外辨别方向', product: '指南针' },
  { need: '想搬动很重的石头', product: '杠杆' },
  { need: '想把水从低处送到高处', product: '抽水机' },
  { need: '想记录时间', product: '钟表' },
  { need: '想在教室里听到声音', product: '音响' },
  { need: '想看清微小的细胞', product: '显微镜' }
];

/* ---------------- 补充：环境 / 探究 / 技术（P5 拆壳用） ---------------- */
export const SCI_HABITATS = [
  { n: '金鱼', habitat: '淡水里' }, { n: '鲸', habitat: '海洋里' },
  { n: '海豚', habitat: '海洋里' }, { n: '珊瑚', habitat: '海洋里' },
  { n: '企鹅', habitat: '南极' }, { n: '北极熊', habitat: '北极' },
  { n: '骆驼', habitat: '沙漠里' }, { n: '仙人掌', habitat: '沙漠里' },
  { n: '青蛙', habitat: '池塘边' }, { n: '蚯蚓', habitat: '土壤里' },
  { n: '熊猫', habitat: '竹林里' }, { n: '老虎', habitat: '森林里' },
  { n: '麻雀', habitat: '树林里' }, { n: '蚂蚁', habitat: '土壤里' },
  { n: '向日葵', habitat: '田野里' }, { n: '荷花', habitat: '池塘里' }
];

export const SCI_ENV_IMPACT = [
  { act: '乱丢塑料垃圾', effect: '污染土壤和水源' },
  { act: '大量砍伐森林', effect: '造成水土流失' },
  { act: '排放工厂废气', effect: '污染空气' },
  { act: '过度捕捞鱼类', effect: '鱼类数量减少' },
  { act: '随意引进外来物种', effect: '影响本地生物生存' },
  { act: '过量使用农药', effect: '污染土壤和水源' },
  { act: '汽车排放尾气', effect: '空气质量下降' },
  { act: '围湖造田', effect: '湿地减少' },
  { act: '大量使用塑料袋', effect: '造成白色污染' },
  { act: '排放生活污水', effect: '水质变差' },
  { act: '过度放牧', effect: '草地退化' },
  { act: '随意丢弃废电池', effect: '污染土壤和水' }
];

export const SCI_CONSERVE = [
  { act: '随手关灯', good: true, why: '节约电能' },
  { act: '垃圾分类投放', good: true, why: '便于回收利用' },
  { act: '大量使用一次性筷子', good: false, why: '浪费木材' },
  { act: '随手关水龙头', good: true, why: '节约水资源' },
  { act: '植树造林', good: true, why: '改善生态环境' },
  { act: '把废电池扔进普通垃圾桶', good: false, why: '污染土壤和水' },
  { act: '短途出行步行或骑车', good: true, why: '减少尾气排放' },
  { act: '长时间开着水龙头', good: false, why: '浪费水资源' },
  { act: '把废纸送去回收', good: true, why: '节约资源' },
  { act: '燃放烟花爆竹', good: false, why: '污染空气' },
  { act: '使用节能灯', good: true, why: '节约用电' },
  { act: '捕捉野生保护动物', good: false, why: '破坏生态平衡' }
];

export const SCI_UNITS = [
  { quantity: '长度', unit: '米', tool: '刻度尺' },
  { quantity: '质量', unit: '千克', tool: '天平' },
  { quantity: '温度', unit: '摄氏度', tool: '温度计' },
  { quantity: '时间', unit: '秒', tool: '秒表' },
  { quantity: '液体体积', unit: '毫升', tool: '量筒' },
  { quantity: '力的大小', unit: '牛顿', tool: '弹簧测力计' },
  { quantity: '降水量', unit: '毫米', tool: '雨量器' },
  { quantity: '风向', unit: '方向', tool: '风向标' },
  { quantity: '声音强弱', unit: '分贝', tool: '噪声计' },
  { quantity: '湿度', unit: '百分比', tool: '湿度计' }
];

export const SCI_STRUCT = [
  { shape: '拱形', strength: '承重能力强' },
  { shape: '三角形框架', strength: '稳定不易变形' },
  { shape: '四边形框架', strength: '受力容易变形' },
  { shape: '圆柱', strength: '承重比较均匀' },
  { shape: '薄壳结构', strength: '跨度大而轻' },
  { shape: '瓦楞形', strength: '抗弯能力强' },
  { shape: '上小下大', strength: '重心低更稳' },
  { shape: '加斜撑', strength: '不易倾倒' }
];

export const SCI_MACHINES = [
  { tool: '剪刀', type: '杠杆' },
  { tool: '撬棍', type: '杠杆' },
  { tool: '天平', type: '杠杆' },
  { tool: '定滑轮', type: '滑轮' },
  { tool: '动滑轮', type: '滑轮' },
  { tool: '斜面', type: '斜面' },
  { tool: '螺丝钉', type: '斜面' },
  { tool: '门把手', type: '轮轴' },
  { tool: '方向盘', type: '轮轴' },
  { tool: '钓鱼竿', type: '杠杆' },
  { tool: '指甲刀', type: '杠杆' },
  { tool: '盘山公路', type: '斜面' }
];

export const SCI_TECH_EFFECT = [
  { tech: '汽车', effect: '出行更快更远' },
  { tech: '电话', effect: '远距离传递信息' },
  { tech: '电灯', effect: '夜里也能照明' },
  { tech: '冰箱', effect: '延长食物保存时间' },
  { tech: '洗衣机', effect: '节省洗衣时间' },
  { tech: '高铁', effect: '长途出行更快' },
  { tech: '互联网', effect: '信息传播更快' },
  { tech: '空调', effect: '调节室内温度' }
];

export const SCI_TECH_MATERIAL = [
  { product: '雨伞', material: '防水布', why: '能挡雨' },
  { product: '电线芯', material: '铜', why: '导电性好' },
  { product: '窗户', material: '玻璃', why: '透明能透光' },
  { product: '炒锅', material: '金属', why: '导热快' },
  { product: '轮胎', material: '橡胶', why: '有弹性' },
  { product: '书本', material: '纸', why: '能写字又轻' },
  { product: '饭盒', material: '塑料', why: '轻便不漏' },
  { product: '菜刀', material: '金属', why: '坚硬锋利' },
  { product: '衣服', material: '棉布', why: '柔软透气' },
  { product: '插头外壳', material: '塑料', why: '不导电' },
  { product: '镜子', material: '玻璃', why: '能反光' },
  { product: '保温杯', material: '不锈钢', why: '结实耐用' }
];

export const SCI_TECH_ENERGY = [
  { scene: '太阳能热水器', energy: '太阳能' },
  { scene: '风力发电机', energy: '风能' },
  { scene: '水力发电站', energy: '水能' },
  { scene: '手电筒的电池', energy: '化学能' },
  { scene: '燃气灶', energy: '化学能' },
  { scene: '电动汽车的电池', energy: '电能' },
  { scene: '地热发电站', energy: '地热能' },
  { scene: '潮汐发电站', energy: '潮汐能' }
];

export const SCI_BIO = [
  { product: '潜水艇', model: '鱼' },
  { product: '飞机', model: '鸟' },
  { product: '雷达', model: '蝙蝠' },
  { product: '直升机', model: '蜻蜓' },
  { product: '尼龙搭扣', model: '苍耳' },
  { product: '迷彩服', model: '动物的保护色' },
  { product: '声呐', model: '海豚' },
  { product: '机器人', model: '人' }
];

export const SCI_EXP_ORDER = [
  { exp: '种子发芽实验', steps: ['提出问题', '作出假设', '设计实验', '观察记录', '得出结论'] },
  { exp: '观察蚂蚁', steps: ['准备工具', '选定观察地点', '仔细观察', '记录发现'] },
  { exp: '测量水温', steps: ['准备温度计', '放入水中', '待示数稳定', '读数记录'] },
  { exp: '比较材料吸水性', steps: ['准备材料', '称量', '吸水', '再称量比较'] },
  { exp: '研究斜面', steps: ['搭斜面', '测高度', '放小车', '测距离'] },
  { exp: '观察月相', steps: ['确定日期', '固定时间', '固定地点', '记录形状'] },
  { exp: '种植凤仙花', steps: ['选种', '播种', '浇水', '观察记录'] },
  { exp: '制作生态瓶', steps: ['准备容器', '放入水草', '放入小动物', '观察记录'] }
];

export const SCI_WEATHER_STMT = [
  { stmt: '今天下雨，出门要带伞。', true: true },
  { stmt: '雾天能见度低，出行要注意安全。', true: true },
  { stmt: '天气预报说降温，应该适当加衣服。', true: true },
  { stmt: '雨量器可以测量降水量。', true: true },
  { stmt: '风向标可以测量降水量的多少。', true: false },
  { stmt: '阴天一定不会下雨。', true: false },
  { stmt: '晴天时天空中的云量很少。', true: true },
  { stmt: '气温越高人一定越舒服。', true: false },
  { stmt: '雷电天气可以躲在大树下避雨。', true: false },
  { stmt: '沙尘天气要减少户外活动。', true: true },
  { stmt: '霜一般出现在寒冷的清晨。', true: true },
  { stmt: '天气变化与我们的生活没有关系。', true: false }
];

export const SCI_EARTH_CHANGE = [
  { stmt: '地震会使地表出现裂缝。', true: true },
  { stmt: '火山喷发会改变周围的地形。', true: true },
  { stmt: '流水会冲刷出河谷。', true: true },
  { stmt: '风会把沙土搬运并堆积。', true: true },
  { stmt: '冰川移动会改变地表。', true: true },
  { stmt: '植物的生长不会改变地表。', true: false },
  { stmt: '雨水冲刷会造成水土流失。', true: true },
  { stmt: '修建水库会改变地表形态。', true: true },
  { stmt: '地表形态在短时间内都不会变化。', true: false },
  { stmt: '泥石流会改变地表形态。', true: true },
  { stmt: '风化作用会使岩石破碎。', true: true },
  { stmt: '地表形态变化只由人类活动引起。', true: false }
];

export const SCI_SKY = [
  { stmt: '地球自转产生昼夜交替。', true: true },
  { stmt: '地球公转产生四季变化。', true: true },
  { stmt: '月相变化一个周期约一个月。', true: true },
  { stmt: '月球本身会发光。', true: false },
  { stmt: '太阳东升西落是地球自转造成的。', true: true },
  { stmt: '北极星在天空中的位置基本不变。', true: true },
  { stmt: '不同季节正午太阳高度相同。', true: false },
  { stmt: '昼夜交替的周期是一年。', true: false }
];

export const SCI_LIGHT_ITEMS = [
  { n: '太阳', source: true }, { n: '点燃的蜡烛', source: true },
  { n: '打开的手电筒', source: true }, { n: '萤火虫', source: true },
  { n: '月亮', source: false }, { n: '镜子', source: false },
  { n: '白纸', source: false }, { n: '玻璃杯', source: false }
];

export const SCI_ENG_STMT = [
  { stmt: '作品测试后发现问题，应该继续改进设计。', true: true },
  { stmt: '失败的作品没有任何价值。', true: false },
  { stmt: '动手制作前先画设计图，有助于理清思路。', true: true },
  { stmt: '制作时可以完全不考虑材料的特点。', true: false },
  { stmt: '作品完成后不需要测试。', true: false },
  { stmt: '小组合作时要听取不同的意见。', true: true },
  { stmt: '遇到问题时可以查资料或请教别人。', true: true },
  { stmt: '作品只要好看就行，不用管功能。', true: false },
  { stmt: '记录制作过程有助于发现问题并改进。', true: true },
  { stmt: '使用剪刀等工具时要注意安全。', true: true },
  { stmt: '一次做不好就应该马上放弃。', true: false },
  { stmt: '废旧材料经过改造也可以再利用。', true: true }
];

export const SCI_ORDER = [
  { product: '制作小船', steps: ['明确任务', '画设计图', '选择材料制作', '下水测试并改进'] },
  { product: '制作乐器', steps: ['确定声音目标', '选材料', '制作发声部分', '调音并演奏'] },
  { product: '制作日晷', steps: ['了解原理', '设计晷面', '安装晷针', '对照时间校准'] },
  { product: '制作保温杯', steps: ['了解保温原理', '选保温材料', '制作杯体', '测量水温验证'] },
  { product: '制作太阳能热水器', steps: ['了解吸热原理', '选吸热材料', '组装水箱', '测试升温效果'] },
  { product: '建造植物工厂', steps: ['调查植物需要', '设计环境控制', '搭建模型', '试种并改进'] },
  { product: '制作简易天平', steps: ['了解平衡原理', '做横梁', '做托盘', '用已知重物校准'] },
  { product: '制作潜望镜', steps: ['了解反射原理', '设计镜筒', '安装镜片', '观察并调整角度'] }
];
