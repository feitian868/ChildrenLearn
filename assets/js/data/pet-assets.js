/**
 * pet-assets.js —— 6 只宠物的 SVG 矢量角色 + 装饰 SVG fragments + 乐园场景
 *
 * 所有动物统一 viewBox="0 0 200 200"，层结构一致：
 *   .body-layer  身体（最底层）
 *   .tail-layer  尾巴
 *   .head-layer  头（含耳朵、眼睛、嘴、鼻子）
 *     .ear-left / .ear-right   耳朵（有独立 transform-origin）
 *     .eye-left / .eye-right   眼睛（眨眼动画）
 *     .mouth-layer             嘴（含 default/happy/sad/sleep 四套）
 *   .decorations 装饰层（运行时动态插入）
 *
 * 每只动物返回 { species, name, emoji, bodyColor, bellyColor, eyeColor, svg }
 */

/* ============================================================
   1. 小猫 cat
   ============================================================ */
const CAT_SVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <!-- 身体 -->
  <g class="body-layer" style="transform-origin: 100px 170px">
    <ellipse cx="100" cy="140" rx="52" ry="45" fill="#FFB89E" stroke="#2D1F1A" stroke-width="3"/>
    <ellipse cx="100" cy="150" rx="32" ry="25" fill="#FFD4C2"/>
  </g>
  <!-- 尾巴 -->
  <g class="tail-layer" style="transform-origin: 148px 140px">
    <path d="M148,140 Q178,120 175,85 Q174,75 180,68" fill="none" stroke="#FFB89E" stroke-width="14" stroke-linecap="round"/>
    <path d="M148,140 Q178,120 175,85 Q174,75 180,68" fill="none" stroke="#2D1F1A" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
  </g>
  <!-- 头 -->
  <g class="head-layer" style="transform-origin: 100px 82px">
    <!-- 左耳 -->
    <g class="ear-left" style="transform-origin: 72px 58px">
      <path d="M72,58 L57,32 L88,48 Z" fill="#FFB89E" stroke="#2D1F1A" stroke-width="2.5"/>
      <path d="M72,52 L63,36 L83,48 Z" fill="#FFC9B5"/>
    </g>
    <!-- 右耳 -->
    <g class="ear-right" style="transform-origin: 128px 58px">
      <path d="M128,58 L143,32 L112,48 Z" fill="#FFB89E" stroke="#2D1F1A" stroke-width="2.5"/>
      <path d="M128,52 L137,36 L117,48 Z" fill="#FFC9B5"/>
    </g>
    <!-- 脸 -->
    <circle cx="100" cy="82" r="44" fill="#FFB89E" stroke="#2D1F1A" stroke-width="3"/>
    <!-- 腮红 -->
    <circle cx="73" cy="96" r="7" fill="#FFB6C1" opacity="0.55"/>
    <circle cx="127" cy="96" r="7" fill="#FFB6C1" opacity="0.55"/>
    <!-- 眼睛 -->
    <g class="eye-left" style="transform-origin: 83px 78px">
      <ellipse class="eye-shape" cx="83" cy="78" rx="7" ry="9" fill="#1a1a1a"/>
      <circle cx="85" cy="75" r="2.5" fill="white"/>
    </g>
    <g class="eye-right" style="transform-origin: 117px 78px">
      <ellipse class="eye-shape" cx="117" cy="78" rx="7" ry="9" fill="#1a1a1a"/>
      <circle cx="119" cy="75" r="2.5" fill="white"/>
    </g>
    <!-- 鼻子 -->
    <path d="M96,93 L104,93 L100,98 Z" fill="#FF6B8A"/>
    <!-- 嘴 -->
    <g class="mouth-layer">
      <path class="m-default" d="M100,98 Q95,105 90,102" fill="none" stroke="#2D1F1A" stroke-width="2.5" stroke-linecap="round"/>
      <path class="m-default" d="M100,98 Q105,105 110,102" fill="none" stroke="#2D1F1A" stroke-width="2.5" stroke-linecap="round"/>
      <path class="m-happy" d="M90,100 Q100,114 110,100" fill="#4A1530" stroke="#2D1F1A" stroke-width="2" style="display:none"/>
      <path class="m-sad" d="M92,106 Q100,99 108,106" fill="none" stroke="#2D1F1A" stroke-width="2.5" stroke-linecap="round" style="display:none"/>
      <path class="m-sleep" d="M95,103 L105,103" fill="none" stroke="#2D1F1A" stroke-width="2.5" stroke-linecap="round" style="display:none"/>
    </g>
  </g>
  <!-- 胡须（猫特有） -->
  <g stroke="#2D1F1A" stroke-width="1.5" stroke-linecap="round" opacity="0.6">
    <line x1="62" y1="94" x2="30" y2="88"/>
    <line x1="62" y1="100" x2="30" y2="100"/>
    <line x1="62" y1="106" x2="30" y2="112"/>
    <line x1="138" y1="94" x2="170" y2="88"/>
    <line x1="138" y1="100" x2="170" y2="100"/>
    <line x1="138" y1="106" x2="170" y2="112"/>
  </g>
  <!-- 装饰层（运行时插入） -->
  <g class="decorations"></g>
</svg>`;

/* ============================================================
   2. 小狗 dog（下垂耳 + 向上卷尾）
   ============================================================ */
const DOG_SVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <g class="body-layer" style="transform-origin: 100px 170px">
    <ellipse cx="100" cy="142" rx="52" ry="44" fill="#E8C27A" stroke="#2D1F1A" stroke-width="3"/>
    <ellipse cx="100" cy="152" rx="30" ry="23" fill="#F5D89F"/>
  </g>
  <g class="tail-layer" style="transform-origin: 148px 138px">
    <path d="M148,138 Q162,118 160,100 Q158,88 168,82 Q178,78 175,88" fill="#E8C27A" stroke="#2D1F1A" stroke-width="2.5"/>
  </g>
  <g class="head-layer" style="transform-origin: 100px 82px">
    <g class="ear-left" style="transform-origin: 75px 62px">
      <path d="M75,62 L58,72 L62,105 L78,95 Z" fill="#D4A55A" stroke="#2D1F1A" stroke-width="2.5"/>
    </g>
    <g class="ear-right" style="transform-origin: 125px 62px">
      <path d="M125,62 L142,72 L138,105 L122,95 Z" fill="#D4A55A" stroke="#2D1F1A" stroke-width="2.5"/>
    </g>
    <circle cx="100" cy="82" r="44" fill="#E8C27A" stroke="#2D1F1A" stroke-width="3"/>
    <g class="eye-left" style="transform-origin: 83px 80px">
      <ellipse class="eye-shape" cx="83" cy="80" rx="6" ry="8" fill="#1a1a1a"/>
      <circle cx="85" cy="78" r="2" fill="white"/>
    </g>
    <g class="eye-right" style="transform-origin: 117px 80px">
      <ellipse class="eye-shape" cx="117" cy="80" rx="6" ry="8" fill="#1a1a1a"/>
      <circle cx="119" cy="78" r="2" fill="white"/>
    </g>
    <!-- 狗的大鼻子 -->
    <ellipse cx="100" cy="96" rx="9" ry="7" fill="#2D1F1A"/>
    <circle cx="100" cy="94" r="1.5" fill="white" opacity="0.5"/>
    <g class="mouth-layer">
      <path class="m-default" d="M100,103 Q95,112 88,108" fill="none" stroke="#2D1F1A" stroke-width="2.5" stroke-linecap="round"/>
      <path class="m-default" d="M100,103 Q105,112 112,108" fill="none" stroke="#2D1F1A" stroke-width="2.5" stroke-linecap="round"/>
      <path class="m-happy" d="M90,104 Q100,118 110,104" fill="#4A1530" stroke="#2D1F1A" stroke-width="2" style="display:none"/>
      <path class="m-sad" d="M92,110 Q100,102 108,110" fill="none" stroke="#2D1F1A" stroke-width="2.5" stroke-linecap="round" style="display:none"/>
      <path class="m-sleep" d="M95,107 L105,107" fill="none" stroke="#2D1F1A" stroke-width="2.5" stroke-linecap="round" style="display:none"/>
    </g>
  </g>
  <g class="decorations"></g>
</svg>`;

/* ============================================================
   3. 兔子 rabbit（超长直耳 + 短绒毛球尾 + 门牙）
   ============================================================ */
const RABBIT_SVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <g class="body-layer" style="transform-origin: 100px 170px">
    <ellipse cx="100" cy="142" rx="50" ry="42" fill="#F5F0FF" stroke="#2D1F1A" stroke-width="3"/>
    <ellipse cx="100" cy="152" rx="28" ry="22" fill="#FFFFFF"/>
  </g>
  <g class="tail-layer" style="transform-origin: 148px 145px">
    <circle cx="148" cy="145" r="12" fill="#FFFFFF" stroke="#2D1F1A" stroke-width="2.5"/>
  </g>
  <g class="head-layer" style="transform-origin: 100px 100px">
    <!-- 左长耳 -->
    <g class="ear-left" style="transform-origin: 80px 55px">
      <ellipse cx="80" cy="25" rx="9" ry="30" fill="#F5F0FF" stroke="#2D1F1A" stroke-width="2.5"/>
      <ellipse cx="80" cy="26" rx="5" ry="22" fill="#FFC9B5"/>
    </g>
    <!-- 右长耳 -->
    <g class="ear-right" style="transform-origin: 120px 55px">
      <ellipse cx="120" cy="25" rx="9" ry="30" fill="#F5F0FF" stroke="#2D1F1A" stroke-width="2.5"/>
      <ellipse cx="120" cy="26" rx="5" ry="22" fill="#FFC9B5"/>
    </g>
    <circle cx="100" cy="85" r="42" fill="#F5F0FF" stroke="#2D1F1A" stroke-width="3"/>
    <circle cx="74" cy="100" r="6" fill="#FFB6C1" opacity="0.55"/>
    <circle cx="126" cy="100" r="6" fill="#FFB6C1" opacity="0.55"/>
    <g class="eye-left" style="transform-origin: 84px 82px">
      <ellipse class="eye-shape" cx="84" cy="82" rx="7" ry="9" fill="#1a1a1a"/>
      <circle cx="86" cy="79" r="2.5" fill="white"/>
    </g>
    <g class="eye-right" style="transform-origin: 116px 82px">
      <ellipse class="eye-shape" cx="116" cy="82" rx="7" ry="9" fill="#1a1a1a"/>
      <circle cx="118" cy="79" r="2.5" fill="white"/>
    </g>
    <!-- 兔鼻子 -->
    <path d="M95,96 L105,96 L100,101 Z" fill="#FF6B8A"/>
    <!-- 兔门牙 -->
    <g class="mouth-layer">
      <rect x="97" y="102" width="6" height="9" rx="1.5" fill="white" stroke="#2D1F1A" stroke-width="1.5"/>
      <rect x="103" y="102" width="6" height="9" rx="1.5" fill="white" stroke="#2D1F1A" stroke-width="1.5"/>
      <path class="m-happy" d="M90,102 Q100,118 110,102" fill="#4A1530" stroke="#2D1F1A" stroke-width="2" style="display:none"/>
      <path class="m-sad" d="M92,114 Q100,106 108,114" fill="none" stroke="#2D1F1A" stroke-width="2.5" stroke-linecap="round" style="display:none"/>
      <path class="m-sleep" d="M95,107 L105,107" fill="none" stroke="#2D1F1A" stroke-width="2.5" stroke-linecap="round" style="display:none"/>
    </g>
  </g>
  <g class="decorations"></g>
</svg>`;

/* ============================================================
   4. 熊猫 panda（黑眼圈 + 圆耳 + 短尾）
   ============================================================ */
const PANDA_SVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <g class="body-layer" style="transform-origin: 100px 170px">
    <ellipse cx="100" cy="142" rx="52" ry="44" fill="#FFFFFF" stroke="#2D1F1A" stroke-width="3"/>
    <ellipse cx="100" cy="152" rx="30" ry="23" fill="#FFFFFF"/>
    <!-- 熊手脚 -->
    <ellipse cx="55" cy="165" rx="15" ry="10" fill="#2D1F1A"/>
    <ellipse cx="145" cy="165" rx="15" ry="10" fill="#2D1F1A"/>
  </g>
  <g class="tail-layer" style="transform-origin: 148px 140px">
    <circle cx="148" cy="140" r="8" fill="#2D1F1A"/>
  </g>
  <g class="head-layer" style="transform-origin: 100px 85px">
    <g class="ear-left" style="transform-origin: 68px 52px">
      <circle cx="68" cy="52" r="12" fill="#2D1F1A"/>
    </g>
    <g class="ear-right" style="transform-origin: 132px 52px">
      <circle cx="132" cy="52" r="12" fill="#2D1F1A"/>
    </g>
    <circle cx="100" cy="85" r="46" fill="#FFFFFF" stroke="#2D1F1A" stroke-width="3"/>
    <!-- 黑眼圈 -->
    <ellipse cx="80" cy="82" rx="14" ry="16" fill="#2D1F1A" transform="rotate(-15 80 82)"/>
    <ellipse cx="120" cy="82" rx="14" ry="16" fill="#2D1F1A" transform="rotate(15 120 82)"/>
    <g class="eye-left" style="transform-origin: 80px 82px">
      <ellipse class="eye-shape" cx="80" cy="82" rx="5" ry="6" fill="#FFFFFF"/>
      <circle cx="81" cy="81" r="2" fill="#1a1a1a"/>
    </g>
    <g class="eye-right" style="transform-origin: 120px 82px">
      <ellipse class="eye-shape" cx="120" cy="82" rx="5" ry="6" fill="#FFFFFF"/>
      <circle cx="121" cy="81" r="2" fill="#1a1a1a"/>
    </g>
    <ellipse cx="100" cy="98" rx="5" ry="3.5" fill="#2D1F1A"/>
    <g class="mouth-layer">
      <path class="m-default" d="M100,101 Q96,107 92,105" fill="none" stroke="#2D1F1A" stroke-width="2" stroke-linecap="round"/>
      <path class="m-default" d="M100,101 Q104,107 108,105" fill="none" stroke="#2D1F1A" stroke-width="2" stroke-linecap="round"/>
      <path class="m-happy" d="M93,103 Q100,113 107,103" fill="#4A1530" stroke="#2D1F1A" stroke-width="2" style="display:none"/>
      <path class="m-sad" d="M94,110 Q100,104 106,110" fill="none" stroke="#2D1F1A" stroke-width="2" stroke-linecap="round" style="display:none"/>
      <path class="m-sleep" d="M96,106 L104,106" fill="none" stroke="#2D1F1A" stroke-width="2" stroke-linecap="round" style="display:none"/>
    </g>
  </g>
  <g class="decorations"></g>
</svg>`;

/* ============================================================
   5. 小鸡 chick（椭圆身体 + 尖嘴 + 小翅膀）
   ============================================================ */
const CHICK_SVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <g class="body-layer" style="transform-origin: 100px 170px">
    <ellipse cx="100" cy="142" rx="46" ry="42" fill="#FFE44D" stroke="#2D1F1A" stroke-width="3"/>
    <ellipse cx="100" cy="155" rx="28" ry="18" fill="#FFF27A"/>
    <!-- 小翅膀 -->
    <ellipse cx="58" cy="135" rx="14" ry="20" fill="#FFD633" stroke="#2D1F1A" stroke-width="2.5" transform="rotate(-10 58 135)"/>
    <ellipse cx="142" cy="135" rx="14" ry="20" fill="#FFD633" stroke="#2D1F1A" stroke-width="2.5" transform="rotate(10 142 135)"/>
    <!-- 脚 -->
    <line x1="90" y1="180" x2="90" y2="192" stroke="#FF8C33" stroke-width="3" stroke-linecap="round"/>
    <line x1="110" y1="180" x2="110" y2="192" stroke="#FF8C33" stroke-width="3" stroke-linecap="round"/>
  </g>
  <!-- 小鸡尾巴短小，直接加在身体上，tail-layer 简化 -->
  <g class="tail-layer" style="transform-origin: 146px 140px">
    <path d="M146,140 Q158,128 155,118" fill="none" stroke="#FFD633" stroke-width="8" stroke-linecap="round"/>
  </g>
  <g class="head-layer" style="transform-origin: 100px 80px">
    <circle cx="100" cy="78" r="40" fill="#FFE44D" stroke="#2D1F1A" stroke-width="3"/>
    <!-- 小冠 -->
    <path d="M88,42 L92,32 L96,40 L100,28 L104,40 L108,32 L112,42 Z" fill="#FF4D4D" stroke="#2D1F1A" stroke-width="2"/>
    <g class="eye-left" style="transform-origin: 86px 75px">
      <circle cx="86" cy="75" r="7" fill="#FFFFFF" stroke="#2D1F1A" stroke-width="2"/>
      <circle cx="87" cy="76" r="3" fill="#1a1a1a"/>
    </g>
    <g class="eye-right" style="transform-origin: 114px 75px">
      <circle cx="114" cy="75" r="7" fill="#FFFFFF" stroke="#2D1F1A" stroke-width="2"/>
      <circle cx="115" cy="76" r="3" fill="#1a1a1a"/>
    </g>
    <!-- 尖嘴 -->
    <g class="mouth-layer">
      <path class="m-default" d="M96,88 L104,88 L100,100 Z" fill="#FF8C33" stroke="#2D1F1A" stroke-width="2"/>
      <path class="m-happy" d="M94,87 L106,87 L100,104 Z" fill="#FF8C33" stroke="#2D1F1A" stroke-width="2" style="display:none"/>
      <path class="m-sad" d="M96,91 L104,91 L100,100 Z" fill="#CC7026" stroke="#2D1F1A" stroke-width="2" style="display:none"/>
      <path class="m-sleep" d="M92,92 L108,92" fill="none" stroke="#2D1F1A" stroke-width="2.5" stroke-linecap="round" style="display:none"/>
    </g>
  </g>
  <g class="decorations"></g>
</svg>`;

/* ============================================================
   6. 考拉 koala（圆耳 + 大鼻子 + 几乎无尾）
   ============================================================ */
const KOALA_SVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <g class="body-layer" style="transform-origin: 100px 170px">
    <ellipse cx="100" cy="142" rx="50" ry="42" fill="#A8A29E" stroke="#2D1F1A" stroke-width="3"/>
    <ellipse cx="100" cy="152" rx="28" ry="22" fill="#CFCBC6"/>
  </g>
  <g class="tail-layer" style="transform-origin: 148px 140px">
    <!-- 考拉几乎没尾巴，给一个短 stub -->
    <ellipse cx="146" cy="140" rx="8" ry="6" fill="#A8A29E" stroke="#2D1F1A" stroke-width="2"/>
  </g>
  <g class="head-layer" style="transform-origin: 100px 85px">
    <g class="ear-left" style="transform-origin: 65px 48px">
      <circle cx="65" cy="48" r="15" fill="#A8A29E" stroke="#2D1F1A" stroke-width="2.5"/>
      <circle cx="65" cy="48" r="8" fill="#6B6663"/>
    </g>
    <g class="ear-right" style="transform-origin: 135px 48px">
      <circle cx="135" cy="48" r="15" fill="#A8A29E" stroke="#2D1F1A" stroke-width="2.5"/>
      <circle cx="135" cy="48" r="8" fill="#6B6663"/>
    </g>
    <circle cx="100" cy="85" r="46" fill="#A8A29E" stroke="#2D1F1A" stroke-width="3"/>
    <g class="eye-left" style="transform-origin: 82px 82px">
      <ellipse class="eye-shape" cx="82" cy="82" rx="7" ry="8" fill="#1a1a1a"/>
      <circle cx="84" cy="79" r="2.5" fill="white"/>
    </g>
    <g class="eye-right" style="transform-origin: 118px 82px">
      <ellipse class="eye-shape" cx="118" cy="82" rx="7" ry="8" fill="#1a1a1a"/>
      <circle cx="120" cy="79" r="2.5" fill="white"/>
    </g>
    <!-- 考拉大鼻子 -->
    <ellipse cx="100" cy="100" rx="7" ry="5" fill="#2D1F1A"/>
    <ellipse cx="100" cy="99" rx="2" ry="1" fill="#4D4540"/>
    <g class="mouth-layer">
      <path class="m-default" d="M100,105 Q96,112 92,110" fill="none" stroke="#2D1F1A" stroke-width="2.5" stroke-linecap="round"/>
      <path class="m-default" d="M100,105 Q104,112 108,110" fill="none" stroke="#2D1F1A" stroke-width="2.5" stroke-linecap="round"/>
      <path class="m-happy" d="M93,107 Q100,119 107,107" fill="#4A1530" stroke="#2D1F1A" stroke-width="2" style="display:none"/>
      <path class="m-sad" d="M94,114 Q100,107 106,114" fill="none" stroke="#2D1F1A" stroke-width="2.5" stroke-linecap="round" style="display:none"/>
      <path class="m-sleep" d="M96,110 L104,110" fill="none" stroke="#2D1F1A" stroke-width="2.5" stroke-linecap="round" style="display:none"/>
    </g>
  </g>
  <g class="decorations"></g>
</svg>`;

/* ============================================================
   动物表
   ============================================================ */
export const SPECIES = [
  { id: 'cat',    name: '小猫', emoji: '🐱', svg: CAT_SVG },
  { id: 'dog',    name: '小狗', emoji: '🐶', svg: DOG_SVG },
  { id: 'rabbit', name: '兔子', emoji: '🐰', svg: RABBIT_SVG },
  { id: 'panda',  name: '熊猫', emoji: '🐼', svg: PANDA_SVG },
  { id: 'chick',  name: '小鸡', emoji: '🐥', svg: CHICK_SVG },
  { id: 'koala',  name: '考拉', emoji: '🐨', svg: KOALA_SVG },
];

export function speciesOf(id) { return SPECIES.find((s) => s.id === id) || SPECIES[0]; }

/* ============================================================
   装饰 SVG fragments（插到 .decorations 组里）
   每个 fragment 自带 style 定位到对应 slot
   ============================================================ */
export const DECO_SVG = {
  'red-bow': `<g data-deco="red-bow">
    <path d="M85,40 Q95,55 115,40 Q105,55 115,40 Q105,55 115,40" fill="none"/>
    <path d="M85,42 L95,50 L85,58 Z" fill="#E74C3C"/>
    <path d="M115,42 L105,50 L115,58 Z" fill="#E74C3C"/>
    <circle cx="100" cy="50" r="6" fill="#C0392B"/>
  </g>`,

  'crown': `<g data-deco="crown">
    <path d="M72,48 L82,22 L92,40 L100,18 L108,40 L118,22 L128,48 Z" fill="#FFD700" stroke="#B8860B" stroke-width="2"/>
    <circle cx="100" cy="22" r="4" fill="#FF4D4D"/>
    <circle cx="82" cy="32" r="3" fill="#4DA6FF"/>
    <circle cx="118" cy="32" r="3" fill="#4DA6FF"/>
  </g>`,

  'xmas-hat': `<g data-deco="xmas-hat">
    <path d="M75,48 L125,48 L110,20 Q105,15 95,18 Q80,25 75,48 Z" fill="#E74C3C" stroke="#2D1F1A" stroke-width="2"/>
    <ellipse cx="100" cy="52" rx="28" ry="6" fill="#FFFFFF" stroke="#2D1F1A" stroke-width="2"/>
    <circle cx="108" cy="20" r="5" fill="#FFFFFF" stroke="#2D1F1A" stroke-width="1.5"/>
  </g>`,

  'scarf': `<g data-deco="scarf">
    <rect x="60" y="98" width="80" height="12" rx="4" fill="#E74C3C" stroke="#922B21" stroke-width="1.5"/>
    <rect x="60" y="98" width="10" height="28" rx="2" fill="#C0392B" stroke="#922B21" stroke-width="1.5"/>
    <rect x="130" y="98" width="10" height="22" rx="2" fill="#C0392B" stroke="#922B21" stroke-width="1.5"/>
  </g>`,

  'collar': `<g data-deco="collar">
    <ellipse cx="100" cy="98" rx="30" ry="6" fill="#FF6B8A" stroke="#2D1F1A" stroke-width="1.5"/>
    <circle cx="100" cy="104" r="5" fill="#FFD700" stroke="#B8860B" stroke-width="1.5"/>
    <circle cx="100" cy="104" r="2" fill="#2D1F1A"/>
  </g>`,

  'tie': `<g data-deco="tie">
    <path d="M93,98 L107,98 L104,118 L100,128 L96,118 Z" fill="#3498DB" stroke="#1A5276" stroke-width="2"/>
  </g>`,

  'sunglass': `<g data-deco="sunglass">
    <rect x="72" y="72" width="26" height="12" rx="4" fill="#1a1a1a"/>
    <rect x="102" y="72" width="26" height="12" rx="4" fill="#1a1a1a"/>
    <rect x="94" y="76" width="12" height="4" fill="#1a1a1a"/>
    <rect x="75" y="75" width="8" height="5" fill="#333" opacity="0.6"/>
    <rect x="105" y="75" width="8" height="5" fill="#333" opacity="0.6"/>
  </g>`,

  'wings': `<g data-deco="wings">
    <path d="M52,120 Q35,95 30,70 Q45,85 55,105" fill="#FFFFFF" stroke="#2D1F1A" stroke-width="2" opacity="0.85"/>
    <path d="M148,120 Q165,95 170,70 Q155,85 145,105" fill="#FFFFFF" stroke="#2D1F1A" stroke-width="2" opacity="0.85"/>
    <path d="M45,105 Q38,88 35,75" fill="none" stroke="#2D1F1A" stroke-width="1" opacity="0.3"/>
    <path d="M155,105 Q162,88 165,75" fill="none" stroke="#2D1F1A" stroke-width="1" opacity="0.3"/>
  </g>`,
};

/* ============================================================
   乐园场景（CSS 渐变 + 少量 SVG 点缀，完全无 JS 循环）
   ============================================================ */
export const SCENES = [
  { id: 'garden', name: '花园草地', bg: 'linear-gradient(180deg, #A8E6CF 0%, #7ED957 100%)', extra: `
    <svg class="scene-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
      <ellipse cx="50" cy="180" rx="40" ry="25" fill="#5AC44A" opacity="0.4"/>
      <ellipse cx="350" cy="185" rx="50" ry="30" fill="#5AC44A" opacity="0.4"/>
      <!-- 花 -->
      <g class="flower" style="transform-origin: 60px 160px">
        <circle cx="60" cy="155" r="4" fill="#FF6B8A"/><line x1="60" y1="160" x2="60" y2="180" stroke="#4A9A3A" stroke-width="2"/>
      </g>
      <g class="flower" style="transform-origin: 130px 170px">
        <circle cx="130" cy="165" r="4" fill="#FFD700"/><line x1="130" y1="170" x2="130" y2="190" stroke="#4A9A3A" stroke-width="2"/>
      </g>
      <g class="flower" style="transform-origin: 280px 165px">
        <circle cx="280" cy="160" r="4" fill="#9B59B6"/><line x1="280" y1="165" x2="280" y2="185" stroke="#4A9A3A" stroke-width="2"/>
      </g>
    </svg>` },
  { id: 'home', name: '温馨小窝', bg: 'linear-gradient(180deg, #FFF5E6 0%, #FFE4CC 100%)', extra: `
    <svg class="scene-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
      <!-- 地板 -->
      <rect x="0" y="170" width="400" height="30" fill="#D4A574"/>
      <rect x="0" y="170" width="400" height="4" fill="#B8864F"/>
      <!-- 窗户 -->
      <rect x="300" y="30" width="70" height="60" fill="#87CEEB" stroke="#2D1F1A" stroke-width="2"/>
      <line x1="335" y1="30" x2="335" y2="90" stroke="#2D1F1A" stroke-width="2"/>
      <line x1="300" y1="60" x2="370" y2="60" stroke="#2D1F1A" stroke-width="2"/>
      <!-- 小地毯 -->
      <ellipse cx="200" cy="185" rx="120" ry="15" fill="#E74C3C" opacity="0.3"/>
    </svg>` },
  { id: 'beach', name: '海边沙滩', bg: 'linear-gradient(180deg, #87CEEB 0%, #F0E68C 55%, #F4D03F 100%)', extra: `
    <svg class="scene-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
      <!-- 太阳 -->
      <circle cx="60" cy="50" r="30" fill="#FFD700" opacity="0.8"/>
      <!-- 海浪 -->
      <path d="M0,110 Q50,100 100,110 Q150,120 200,110 Q250,100 300,110 Q350,120 400,110 L400,130 L0,130 Z" fill="#4DA6FF" opacity="0.7"/>
      <!-- 贝壳 -->
      <g transform="translate(80,170)"><ellipse cx="0" cy="0" rx="8" ry="5" fill="#FFF5E6" stroke="#D4A574" stroke-width="1"/><line x1="-6" y1="-3" x2="6" y2="-3" stroke="#D4A574" stroke-width="0.5"/></g>
      <g transform="translate(320,180)"><ellipse cx="0" cy="0" rx="6" ry="4" fill="#FFB6C1" stroke="#D4A574" stroke-width="1"/></g>
    </svg>` },
  { id: 'snow', name: '雪山之巅', bg: 'linear-gradient(180deg, #D6EAF8 0%, #85C1E9 60%, #FFFFFF 100%)', extra: `
    <svg class="scene-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
      <!-- 山 -->
      <polygon points="0,180 100,60 200,140 300,40 400,160 400,200 0,200" fill="#BFC9CA"/>
      <polygon points="100,60 140,100 60,100" fill="#FFFFFF"/>
      <polygon points="300,40 330,80 270,80" fill="#FFFFFF"/>
    </svg>
    <!-- 雪花点用 CSS 动画，在 pet.css 里 -->
    <div class="snow-particles">
      <span></span><span></span><span></span><span></span><span></span>
      <span></span><span></span><span></span><span></span><span></span>
    </div>` },
  { id: 'candy', name: '糖果王国', bg: 'linear-gradient(135deg, #FFB6C1 0%, #E6E6FA 50%, #FFD700 100%)', extra: `
    <svg class="scene-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
      <!-- 彩虹 -->
      <path d="M50,120 Q200,-20 350,120" fill="none" stroke="#FF6B6B" stroke-width="8" stroke-linecap="round"/>
      <path d="M58,125 Q200,-10 342,125" fill="none" stroke="#FFD93D" stroke-width="8" stroke-linecap="round"/>
      <path d="M66,130 Q200,0 334,130" fill="none" stroke="#6BCB77" stroke-width="8" stroke-linecap="round"/>
      <path d="M74,135 Q200,10 326,135" fill="none" stroke="#4D96FF" stroke-width="8" stroke-linecap="round"/>
      <!-- 糖果 -->
      <circle cx="80" cy="170" r="10" fill="#FF6B8A"/><polygon points="70,170 60,160 60,180" fill="#FF6B8A"/><polygon points="90,170 100,160 100,180" fill="#FF6B8A"/>
      <circle cx="320" cy="175" r="9" fill="#9B59B6"/><polygon points="311,175 301,165 301,185" fill="#9B59B6"/><polygon points="329,175 339,165 339,185" fill="#9B59B6"/>
    </svg>` },
  { id: 'space', name: '太空乐园', bg: 'linear-gradient(180deg, #1A1A4A 0%, #2D1B5E 50%, #0F0F3C 100%)', extra: `
    <svg class="scene-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
      <!-- 星星 -->
      <g fill="#FFFFFF" class="star-field">
        <circle cx="30" cy="40" r="1.5" class="st"/><circle cx="80" cy="70" r="1" class="st"/><circle cx="150" cy="30" r="2" class="st"/>
        <circle cx="220" cy="80" r="1.2" class="st"/><circle cx="290" cy="50" r="1.5" class="st"/><circle cx="360" cy="30" r="1" class="st"/>
        <circle cx="50" cy="120" r="1" class="st"/><circle cx="180" cy="140" r="1.8" class="st"/><circle cx="340" cy="110" r="1.3" class="st"/>
        <circle cx="100" cy="170" r="1" class="st"/><circle cx="270" cy="180" r="1.2" class="st"/>
      </g>
      <!-- 月亮 -->
      <circle cx="340" cy="55" r="20" fill="#F5F0FF"/>
      <circle cx="333" cy="48" r="4" fill="#D8D0E6"/>
      <circle cx="348" cy="62" r="3" fill="#D8D0E6"/>
    </svg>` },
];

export function sceneOf(id) { return SCENES.find((s) => s.id === id) || SCENES[0]; }
