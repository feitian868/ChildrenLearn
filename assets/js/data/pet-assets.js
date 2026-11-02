/**
 * pet-assets.js v7 — 骨骼分层重构版
 *
 * 铁律（违反任意一条即不合格）：
 * 1. transform-only：动画只改 transform；d/cx/cy/x/y/width/height 全程零改动
 * 2. 父子嵌套：rig → (tail/paw/torso) → head → ear；子嵌父里，身体动→头跟着动
 * 3. 关节即原点：transform-box:view-box + transform-origin = 关节坐标（所见即所得）
 * 4. 几何只画一次：静态阶段画完，动画阶段只变换
 * 5. 统一骨架：6 只共用同一套 CSS keyframes，差异只在 CSS 变量
 *
 * 关节命名：hip / neck / tail-base / ear-root-l / ear-root-r
 * 变量：--fur / --fur-dark / --belly / --pink / --ink / --line
 *       --hip-x --hip-y --neck-x --neck-y --tail-x --tail-y
 *       --ear-l-x --ear-l-y --ear-r-x --ear-r-y
 *       --t-breathe --t-nod --t-sway --t-twitch --delay
 */

/* ============================================================
   🐱 CAT —— 橘虎斑
   关节表：
   hip=(100,172) 脚底；neck=(100,104) 颈根；tail=(136,152) 尾根
   ear-l=(85,46) ear-r=(115,46)
   ============================================================ */
const CAT_SVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <g class="rig" data-part="root">
    <!-- 尾巴：画在躯干之前 → 永远在身体后面 -->
    <g class="tail" data-part="tail">
      <path d="M136,152 C156,160 174,148 172,128 C170,112 154,106 148,116"
            fill="none" stroke="var(--fur-dark)" stroke-width="14" stroke-linecap="round"/>
    </g>

    <!-- 后爪：单独在 rig 里，不随 torso 挤压（脚要踩地） -->
    <g class="paw paw-bl" data-part="backleg-l">
      <ellipse cx="54" cy="168" rx="12" ry="8" fill="var(--fur)"/>
    </g>
    <g class="paw paw-br" data-part="backleg-r">
      <ellipse cx="146" cy="168" rx="12" ry="8" fill="var(--fur)"/>
    </g>
    <!-- 前爪 -->
    <g class="paw paw-fl" data-part="foreleg-l">
      <ellipse cx="82" cy="166" rx="14" ry="9" fill="var(--belly)"/>
    </g>
    <g class="paw paw-fr" data-part="foreleg-r">
      <ellipse cx="118" cy="166" rx="14" ry="9" fill="var(--belly)"/>
    </g>

    <!-- 躯干：闭合 path，head 嵌里面 -->
    <g class="torso" data-part="torso">
      <path d="M100,92 C126,92 140,116 140,140 C140,162 124,172 100,172
               C76,172 60,162 60,140 C60,116 74,92 100,92 Z" fill="var(--fur)"/>
      <ellipse cx="100" cy="143" rx="25" ry="24" fill="var(--belly)"/>
      <!-- 虎斑条纹（装饰，不影响动画） -->
      <path d="M72,110 Q76,104 72,98" fill="none" stroke="var(--fur-dark)" stroke-width="3" stroke-linecap="round"/>
      <path d="M88,100 Q92,94 88,88" fill="none" stroke="var(--fur-dark)" stroke-width="3" stroke-linecap="round"/>
      <path d="M112,100 Q108,94 112,88" fill="none" stroke="var(--fur-dark)" stroke-width="3" stroke-linecap="round"/>
      <path d="M128,110 Q124,104 128,98" fill="none" stroke="var(--fur-dark)" stroke-width="3" stroke-linecap="round"/>

      <g class="head" data-part="head">
        <!-- 耳朵先画 → 被头圆盖住耳根，接缝永远不露 -->
        <g class="ear ear-l" data-part="ear-l">
          <path d="M76,52 C70,38 66,26 67,18 C78,28 88,34 94,40 Z" fill="var(--fur)"/>
          <path d="M79,48 C75,37 72,29 73,24 C79,30 85,35 90,40 Z" fill="var(--pink)" opacity=".85"/>
        </g>
        <g class="ear ear-r" data-part="ear-r">
          <path d="M124,52 C130,38 134,26 133,18 C122,28 112,34 106,40 Z" fill="var(--fur)"/>
          <path d="M121,48 C125,37 128,29 127,24 C121,30 115,35 110,40 Z" fill="var(--pink)" opacity=".85"/>
        </g>

        <circle cx="100" cy="74" r="34" fill="var(--fur)"/>
        <ellipse cx="73" cy="88" rx="8" ry="5" fill="var(--pink)" opacity=".45"/>
        <ellipse cx="127" cy="88" rx="8" ry="5" fill="var(--pink)" opacity=".45"/>

        <!-- 眼睛（表情切换用 mood class + CSS 显示/隐藏，不改几何） -->
        <g class="eye-l" data-part="eye-l">
          <ellipse cx="84" cy="76" rx="6" ry="7.5" fill="var(--ink)"/>
          <circle cx="82" cy="73" r="2.2" fill="#fff"/>
        </g>
        <g class="eye-r" data-part="eye-r">
          <ellipse cx="116" cy="76" rx="6" ry="7.5" fill="var(--ink)"/>
          <circle cx="114" cy="73" r="2.2" fill="#fff"/>
        </g>

        <path d="M96,86 Q100,84 104,86 Q100,93 96,86 Z" fill="#E8737A"/>
        <g class="mouth-layer">
          <path class="m-default" d="M100,93 Q95,99 90,95 M100,93 Q105,99 110,95" fill="none"
                stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/>
          <path class="m-happy" d="M90,88 Q100,104 110,88" fill="#4A1530" stroke="var(--ink)" stroke-width="1.8" style="display:none"/>
          <path class="m-sad" d="M92,98 Q100,90 108,98" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" style="display:none"/>
          <path class="m-sleep" d="M94,94 L106,94" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" style="display:none"/>
        </g>
        <!-- 胡须 -->
        <path d="M68,84L48,79M68,90L50,90M132,84L152,79M132,90L150,90"
              stroke="var(--fur-dark)" stroke-width="1.8" stroke-linecap="round" opacity=".75"/>
      </g>
    </g>
    <!-- 装饰品层：所有 wear 的装饰插在这里（rig 下最顶层） -->
    <g class="decorations" data-part="decorations"></g>
  </g>
</svg>`;

/* ============================================================
   🐶 DOG —— 金毛
   hip=(100,172) neck=(100,102) tail=(138,142)
   ear-l=(72,72) ear-r=(128,72)
   ============================================================ */
const DOG_SVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <g class="rig" data-part="root">
    <g class="tail" data-part="tail">
      <path d="M138,142 C158,132 168,108 158,90 C154,82 146,84 146,94"
            fill="none" stroke="var(--fur-dark)" stroke-width="16" stroke-linecap="round"/>
    </g>

    <g class="paw paw-bl" data-part="backleg-l">
      <ellipse cx="54" cy="170" rx="13" ry="8" fill="var(--fur)"/>
    </g>
    <g class="paw paw-br" data-part="backleg-r">
      <ellipse cx="146" cy="170" rx="13" ry="8" fill="var(--fur)"/>
    </g>
    <g class="paw paw-fl" data-part="foreleg-l">
      <ellipse cx="78" cy="168" rx="14" ry="9" fill="var(--belly)"/>
    </g>
    <g class="paw paw-fr" data-part="foreleg-r">
      <ellipse cx="122" cy="168" rx="14" ry="9" fill="var(--belly)"/>
    </g>

    <g class="torso" data-part="torso">
      <path d="M100,88 C128,88 144,116 144,144 C144,164 126,172 100,172
               C74,172 56,164 56,144 C56,116 72,88 100,88 Z" fill="var(--fur)"/>
      <ellipse cx="100" cy="148" rx="28" ry="26" fill="var(--belly)"/>

      <g class="head" data-part="head">
        <!-- 下垂大耳 -->
        <g class="ear ear-l" data-part="ear-l">
          <path d="M72,50 C60,54 54,70 56,90 C60,104 70,110 76,104 C78,96 78,80 76,62 Z" fill="var(--fur-dark)"/>
          <path d="M74,58 C66,64 62,78 64,94 C66,102 72,106 74,102" fill="var(--pink)" opacity=".5"/>
        </g>
        <g class="ear ear-r" data-part="ear-r">
          <path d="M128,50 C140,54 146,70 144,90 C140,104 130,110 124,104 C122,96 122,80 124,62 Z" fill="var(--fur-dark)"/>
          <path d="M126,58 C134,64 138,78 136,94 C134,102 128,106 126,102" fill="var(--pink)" opacity=".5"/>
        </g>

        <circle cx="100" cy="74" r="36" fill="var(--fur)"/>
        <!-- 口鼻（在头圆下方突出） -->
        <ellipse cx="100" cy="108" rx="22" ry="17" fill="var(--muzzle,var(--belly))"/>
        <ellipse cx="100" cy="106" rx="9" ry="7" fill="var(--ink)"/>
        <ellipse cx="97" cy="103" rx="2.5" ry="1.5" fill="white" opacity=".4"/>

        <g class="eye-l" data-part="eye-l">
          <ellipse cx="82" cy="70" rx="6.5" ry="7" fill="var(--ink)"/>
          <circle cx="80" cy="67" r="2.2" fill="#fff"/>
        </g>
        <g class="eye-r" data-part="eye-r">
          <ellipse cx="118" cy="70" rx="6.5" ry="7" fill="var(--ink)"/>
          <circle cx="116" cy="67" r="2.2" fill="#fff"/>
        </g>

        <g class="mouth-layer">
          <path class="m-default" d="M100,114 Q95,122 88,118 M100,114 Q105,122 112,118" fill="none"
                stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/>
          <path class="m-happy" d="M90,114 Q100,128 110,114" fill="#4A1530" stroke="var(--ink)" stroke-width="1.8" style="display:none"/>
          <path class="m-sad" d="M92,122 Q100,114 108,122" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" style="display:none"/>
          <path class="m-sleep" d="M94,118 L106,118" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" style="display:none"/>
        </g>
      </g>
    </g>
    <g class="decorations" data-part="decorations"></g>
  </g>
</svg>`;

/* ============================================================
   🐰 RABBIT —— 雪白
   hip=(100,172) neck=(100,110) tail=(140,150)
   ear-l=(90,62) ear-r=(110,62)
   ============================================================ */
const RABBIT_SVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <g class="rig" data-part="root">
    <g class="tail" data-part="tail">
      <circle cx="140" cy="150" r="12" fill="var(--fur)" stroke="var(--line)" stroke-width="2"/>
    </g>

    <!-- 兔子后肢大，前肢小 -->
    <g class="paw paw-bl" data-part="backleg-l">
      <ellipse cx="52" cy="170" rx="17" ry="11" fill="var(--fur)" stroke="var(--line)" stroke-width="1.5"/>
    </g>
    <g class="paw paw-br" data-part="backleg-r">
      <ellipse cx="148" cy="170" rx="17" ry="11" fill="var(--fur)" stroke="var(--line)" stroke-width="1.5"/>
    </g>
    <g class="paw paw-fl" data-part="foreleg-l">
      <ellipse cx="78" cy="168" rx="10" ry="7" fill="var(--belly)" stroke="var(--line)" stroke-width="1.5"/>
    </g>
    <g class="paw paw-fr" data-part="foreleg-r">
      <ellipse cx="122" cy="168" rx="10" ry="7" fill="var(--belly)" stroke="var(--line)" stroke-width="1.5"/>
    </g>

    <g class="torso" data-part="torso">
      <path d="M100,104 C124,104 136,124 136,146 C136,164 122,172 100,172
               C78,172 64,164 64,146 C64,124 76,104 100,104 Z"
            fill="var(--fur)" stroke="var(--line)" stroke-width="2"/>
      <ellipse cx="100" cy="150" rx="21" ry="18" fill="var(--belly)"/>

      <g class="head" data-part="head">
        <!-- 长耳：每只绕根部 rotate，单独 transform-origin -->
        <g class="ear ear-l" data-part="ear-l">
          <ellipse cx="90" cy="38" rx="9" ry="26" fill="var(--fur)" stroke="var(--line)" stroke-width="2"/>
          <ellipse cx="90" cy="38" rx="4.5" ry="17" fill="var(--pink)" opacity=".7"/>
        </g>
        <g class="ear ear-r" data-part="ear-r">
          <ellipse cx="110" cy="38" rx="9" ry="26" fill="var(--fur)" stroke="var(--line)" stroke-width="2"/>
          <ellipse cx="110" cy="38" rx="4.5" ry="17" fill="var(--pink)" opacity=".7"/>
        </g>

        <circle cx="100" cy="82" r="32" fill="var(--fur)" stroke="var(--line)" stroke-width="2"/>
        <ellipse cx="76" cy="94" rx="8" ry="5" fill="var(--pink)" opacity=".5"/>
        <ellipse cx="124" cy="94" rx="8" ry="5" fill="var(--pink)" opacity=".5"/>

        <g class="eye-l" data-part="eye-l">
          <circle cx="86" cy="84" r="5.5" fill="#E05070"/>
          <circle cx="86" cy="84" r="2.5" fill="#8B0000"/>
          <circle cx="84" cy="81" r="2" fill="#fff"/>
        </g>
        <g class="eye-r" data-part="eye-r">
          <circle cx="114" cy="84" r="5.5" fill="#E05070"/>
          <circle cx="114" cy="84" r="2.5" fill="#8B0000"/>
          <circle cx="112" cy="81" r="2" fill="#fff"/>
        </g>

        <path d="M97,95 Q100,93 103,95 Q100,100 97,95 Z" fill="#F58FA0"/>
        <g class="mouth-layer">
          <g class="m-default">
            <rect x="96.5" y="100" width="5" height="7" rx="1" fill="white" stroke="var(--line)" stroke-width="1.3"/>
            <rect x="102.5" y="100" width="5" height="7" rx="1" fill="white" stroke="var(--line)" stroke-width="1.3"/>
          </g>
          <path class="m-happy" d="M93,102 Q100,112 107,102" fill="#FFB6C1" stroke="var(--ink)" stroke-width="1.8" style="display:none"/>
          <path class="m-sad" d="M92,112 Q100,104 108,112" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" style="display:none"/>
          <path class="m-sleep" d="M95,108 L105,108" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" style="display:none"/>
        </g>
      </g>
    </g>
    <g class="decorations" data-part="decorations"></g>
  </g>
</svg>`;

/* ============================================================
   🐼 PANDA —— 黑白
   hip=(100,172) neck=(100,92) tail=(150,140)
   ear-l=(70,50) ear-r=(130,50)
   ============================================================ */
const PANDA_SVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <g class="rig" data-part="root">
    <g class="tail" data-part="tail">
      <circle cx="150" cy="140" r="10" fill="var(--ink)"/>
    </g>

    <g class="paw paw-bl" data-part="backleg-l">
      <ellipse cx="54" cy="174" rx="14" ry="10" fill="var(--ink)"/>
    </g>
    <g class="paw paw-br" data-part="backleg-r">
      <ellipse cx="146" cy="174" rx="14" ry="10" fill="var(--ink)"/>
    </g>
    <g class="paw paw-fl" data-part="foreleg-l">
      <ellipse cx="76" cy="172" rx="13" ry="9" fill="var(--ink)"/>
    </g>
    <g class="paw paw-fr" data-part="foreleg-r">
      <ellipse cx="124" cy="172" rx="13" ry="9" fill="var(--ink)"/>
    </g>

    <g class="torso" data-part="torso">
      <path d="M100,88 C130,88 148,116 148,144 C148,164 128,174 100,174
               C72,174 52,164 52,144 C52,116 70,88 100,88 Z" fill="var(--fur)"/>
      <!-- 肩部黑块（嵌在躯干里，不随动画分离） -->
      <ellipse cx="58" cy="132" rx="16" ry="12" fill="var(--ink)"/>
      <ellipse cx="142" cy="132" rx="16" ry="12" fill="var(--ink)"/>

      <g class="head" data-part="head">
        <g class="ear ear-l" data-part="ear-l">
          <circle cx="70" cy="50" r="14" fill="var(--ink)"/>
        </g>
        <g class="ear ear-r" data-part="ear-r">
          <circle cx="130" cy="50" r="14" fill="var(--ink)"/>
        </g>

        <circle cx="100" cy="82" r="44" fill="var(--fur)"/>
        <!-- 黑眼圈 + 眼睛 -->
        <ellipse cx="80" cy="80" rx="15" ry="17" fill="var(--ink)" transform="rotate(-20 80 80)"/>
        <ellipse cx="120" cy="80" rx="15" ry="17" fill="var(--ink)" transform="rotate(20 120 80)"/>
        <g class="eye-l" data-part="eye-l">
          <ellipse cx="80" cy="80" rx="5" ry="6" fill="#fff"/>
          <circle cx="81" cy="79" r="3" fill="var(--ink)"/>
        </g>
        <g class="eye-r" data-part="eye-r">
          <ellipse cx="120" cy="80" rx="5" ry="6" fill="#fff"/>
          <circle cx="121" cy="79" r="3" fill="var(--ink)"/>
        </g>

        <ellipse cx="100" cy="96" rx="7" ry="5" fill="var(--ink)"/>
        <g class="mouth-layer">
          <path class="m-default" d="M100,101 Q96,107 92,105 M100,101 Q104,107 108,105" fill="none"
                stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/>
          <path class="m-happy" d="M93,102 Q100,114 107,102" fill="#4A1530" stroke="var(--ink)" stroke-width="1.8" style="display:none"/>
          <path class="m-sad" d="M94,110 Q100,103 106,110" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" style="display:none"/>
          <path class="m-sleep" d="M96,106 L104,106" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" style="display:none"/>
        </g>
      </g>
    </g>
    <g class="decorations" data-part="decorations"></g>
  </g>
</svg>`;

/* ============================================================
   🐥 CHICK —— 亮黄（2 只脚）
   hip=(100,170) neck=(100,94) tail=(148,140)
   ear-l/r → 小鸡不用，改成翅膀
   ============================================================ */
const CHICK_SVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <g class="rig" data-part="root">
    <g class="tail" data-part="tail">
      <path d="M148,140 Q162,126 158,112 Q154,122 152,128" fill="none" stroke="var(--fur-dark)" stroke-width="8" stroke-linecap="round"/>
    </g>

    <!-- 鸡只有 2 只脚，不参与 4 腿系统 -->
    <g class="paw paw-l" data-part="leg-l">
      <rect x="86" y="180" width="8" height="12" rx="2" fill="#FF8C33"/>
    </g>
    <g class="paw paw-r" data-part="leg-r">
      <rect x="106" y="180" width="8" height="12" rx="2" fill="#FF8C33"/>
    </g>

    <g class="torso" data-part="torso">
      <circle cx="100" cy="142" r="46" fill="var(--fur)"/>
      <ellipse cx="100" cy="154" rx="28" ry="22" fill="var(--belly)"/>
      <!-- 小翅膀（不随耳朵动画，单独 class） -->
      <g class="wing wing-l" data-part="wing-l" style="transform-origin:72px 138px">
        <path d="M72,138 Q58,130 52,144 Q58,154 74,150 Z" fill="var(--fur-dark)" opacity=".8"/>
      </g>
      <g class="wing wing-r" data-part="wing-r" style="transform-origin:128px 138px">
        <path d="M128,138 Q142,130 148,144 Q142,154 126,150 Z" fill="var(--fur-dark)" opacity=".8"/>
      </g>

      <g class="head" data-part="head">
        <!-- 小鸡没有耳朵，但用 ear-l/r 关节名保持统一，动画改为翅膀 -->
        <g class="ear ear-l" data-part="comb">
          <path d="M88,44 Q90,32 94,40 Q100,26 106,40 Q110,32 112,44" fill="#FF4D4D"/>
        </g>

        <circle cx="100" cy="78" r="40" fill="var(--fur)"/>

        <g class="eye-l" data-part="eye-l">
          <circle cx="86" cy="74" r="7" fill="#fff"/>
          <circle cx="87" cy="75" r="3.5" fill="var(--ink)"/>
          <circle cx="88" cy="73" r="1.3" fill="#fff"/>
        </g>
        <g class="eye-r" data-part="eye-r">
          <circle cx="114" cy="74" r="7" fill="#fff"/>
          <circle cx="115" cy="75" r="3.5" fill="var(--ink)"/>
          <circle cx="116" cy="73" r="1.3" fill="#fff"/>
        </g>

        <g class="mouth-layer">
          <path class="m-default" d="M94,86 L106,86 L100,98 Z" fill="#FF8C33" stroke="var(--ink)" stroke-width="1.5"/>
          <path class="m-happy" d="M92,85 L108,85 L100,102 Z" fill="#FF8C33" stroke="var(--ink)" stroke-width="1.5" style="display:none"/>
          <path class="m-sad" d="M95,90 L105,90 L100,98 Z" fill="#CC7026" stroke="var(--ink)" stroke-width="1.5" style="display:none"/>
          <path class="m-sleep" d="M92,90 L108,90" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" style="display:none"/>
        </g>
      </g>
    </g>
    <g class="decorations" data-part="decorations"></g>
  </g>
</svg>`;

/* ============================================================
   🐨 KOALA —— 灰色（头比身体大是考拉特征）
   hip=(100,172) neck=(100,106) tail=(146,142)
   ear-l=(65,46) ear-r=(135,46)
   ============================================================ */
const KOALA_SVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <g class="rig" data-part="root">
    <g class="tail" data-part="tail">
      <ellipse cx="146" cy="142" rx="8" ry="6" fill="var(--fur-dark)"/>
    </g>

    <g class="paw paw-bl" data-part="backleg-l">
      <ellipse cx="56" cy="174" rx="12" ry="9" fill="var(--fur-dark)"/>
    </g>
    <g class="paw paw-br" data-part="backleg-r">
      <ellipse cx="144" cy="174" rx="12" ry="9" fill="var(--fur-dark)"/>
    </g>
    <g class="paw paw-fl" data-part="foreleg-l">
      <ellipse cx="76" cy="172" rx="11" ry="8" fill="var(--fur-dark)"/>
    </g>
    <g class="paw paw-fr" data-part="foreleg-r">
      <ellipse cx="124" cy="172" rx="11" ry="8" fill="var(--fur-dark)"/>
    </g>

    <g class="torso" data-part="torso">
      <path d="M100,116 C122,116 134,132 134,150 C134,166 122,174 100,174
               C78,174 66,166 66,150 C66,132 78,116 100,116 Z" fill="var(--fur)"/>
      <ellipse cx="100" cy="156" rx="22" ry="18" fill="var(--belly)"/>

      <g class="head" data-part="head">
        <g class="ear ear-l" data-part="ear-l">
          <circle cx="65" cy="46" r="16" fill="var(--fur)"/>
          <circle cx="65" cy="46" r="8" fill="var(--fur-dark)"/>
        </g>
        <g class="ear ear-r" data-part="ear-r">
          <circle cx="135" cy="46" r="16" fill="var(--fur)"/>
          <circle cx="135" cy="46" r="8" fill="var(--fur-dark)"/>
        </g>

        <circle cx="100" cy="86" r="44" fill="var(--fur)"/>
        <!-- 脸颊色块 -->
        <ellipse cx="76" cy="100" rx="12" ry="8" fill="var(--fur-dark)" opacity=".5"/>
        <ellipse cx="124" cy="100" rx="12" ry="8" fill="var(--fur-dark)" opacity=".5"/>

        <g class="eye-l" data-part="eye-l">
          <circle cx="82" cy="84" r="6" fill="var(--ink)"/>
          <circle cx="84" cy="81" r="2.2" fill="#fff"/>
        </g>
        <g class="eye-r" data-part="eye-r">
          <circle cx="118" cy="84" r="6" fill="var(--ink)"/>
          <circle cx="120" cy="81" r="2.2" fill="#fff"/>
        </g>

        <ellipse cx="100" cy="102" rx="9" ry="6" fill="var(--ink)"/>
        <g class="mouth-layer">
          <path class="m-default" d="M100,108 Q96,114 92,112 M100,108 Q104,114 108,112" fill="none"
                stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/>
          <path class="m-happy" d="M93,110 Q100,122 107,110" fill="#4A1530" stroke="var(--ink)" stroke-width="1.8" style="display:none"/>
          <path class="m-sad" d="M94,117 Q100,110 106,117" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" style="display:none"/>
          <path class="m-sleep" d="M96,113 L104,113" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" style="display:none"/>
        </g>
      </g>
    </g>
    <g class="decorations" data-part="decorations"></g>
  </g>
</svg>`;

/* ============================================================
   物种表
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
   装饰 SVG —— 坐标以猫头为基准（头顶 y=40, 颈部 y=104）
   装饰品插在 <g class="decorations"> 里，在 rig 最顶层
   ============================================================ */
export const DECO_SVG = {
  'crown': `<g data-deco="crown">
    <path d="M70,36 L80,14 L92,28 L100,8 L108,28 L120,14 L130,36 Z" fill="#FFD700" stroke="#B8860B" stroke-width="2"/>
    <circle cx="100" cy="14" r="4.5" fill="#FF4D4D" stroke="#2D1F1A" stroke-width="1"/>
    <circle cx="80" cy="24" r="3" fill="#4DA6FF" stroke="#2D1F1A" stroke-width="1"/>
    <circle cx="120" cy="24" r="3" fill="#4DA6FF" stroke="#2D1F1A" stroke-width="1"/>
  </g>`,
  'red-bow': `<g data-deco="red-bow">
    <path d="M82,32 Q92,18 100,28 Q108,18 118,32 Q108,36 100,30 Q92,36 82,32" fill="#E74C3C" stroke="#2D1F1A" stroke-width="1.8"/>
    <circle cx="100" cy="32" r="4" fill="#C0392B"/>
  </g>`,
  'xmas-hat': `<g data-deco="xmas-hat">
    <path d="M72,36 L128,36 L110,8 Q104,4 94,8 Q80,16 72,36 Z" fill="#E74C3C" stroke="#2D1F1A" stroke-width="2"/>
    <ellipse cx="100" cy="40" rx="30" ry="7" fill="#FFFFFF" stroke="#2D1F1A" stroke-width="2"/>
    <circle cx="106" cy="8" r="6" fill="#FFFFFF" stroke="#2D1F1A" stroke-width="1.5"/>
  </g>`,
  'sunglass': `<g data-deco="sunglass">
    <rect x="70" y="74" width="28" height="13" rx="5" fill="#1a1a1a" stroke="#2D1F1A" stroke-width="1.5"/>
    <rect x="102" y="74" width="28" height="13" rx="5" fill="#1a1a1a" stroke="#2D1F1A" stroke-width="1.5"/>
    <rect x="96" y="78" width="8" height="3" fill="#1a1a1a"/>
    <rect x="74" y="76" width="8" height="5" fill="#333" opacity="0.5"/>
    <rect x="106" y="76" width="8" height="5" fill="#333" opacity="0.5"/>
  </g>`,
  'scarf': `<g data-deco="scarf">
    <ellipse cx="100" cy="104" rx="32" ry="7" fill="#E74C3C" stroke="#922B21" stroke-width="1.5"/>
    <rect x="68" y="100" width="12" height="28" rx="3" fill="#C0392B" stroke="#922B21" stroke-width="1.5"/>
    <rect x="120" y="100" width="12" height="22" rx="3" fill="#C0392B" stroke="#922B21" stroke-width="1.5"/>
  </g>`,
  'collar': `<g data-deco="collar">
    <ellipse cx="100" cy="104" rx="30" ry="6" fill="#FF6B8A" stroke="#2D1F1A" stroke-width="1.5"/>
    <circle cx="100" cy="110" r="6" fill="#FFD700" stroke="#B8860B" stroke-width="1.5"/>
    <circle cx="100" cy="110" r="2.5" fill="#2D1F1A"/>
  </g>`,
  'tie': `<g data-deco="tie">
    <path d="M93,104 L107,104 L105,124 L100,136 L95,124 Z" fill="#3498DB" stroke="#1A5276" stroke-width="2"/>
  </g>`,
  'wings': `<g data-deco="wings">
    <path d="M55,130 Q30,110 22,85 Q40,100 52,118 Z" fill="#FFFFFF" stroke="#2D1F1A" stroke-width="2" opacity="0.88"/>
    <path d="M145,130 Q170,110 178,85 Q160,100 148,118 Z" fill="#FFFFFF" stroke="#2D1F1A" stroke-width="2" opacity="0.88"/>
  </g>`,
};

/* ============================================================
   场景 —— 不变
   ============================================================ */
export const SCENES = [
  { id: 'garden', name: '花园草地', bg: 'linear-gradient(180deg, #87CEEB 0%, #B0E0A8 55%, #7ED957 100%)', extra: `
    <svg class="scene-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
      <path d="M0,140 Q50,110 100,130 Q150,145 200,125 Q250,105 300,130 Q350,145 400,125 L400,160 L0,160 Z" fill="#7BC87B" opacity="0.5"/>
      <g class="cloud"><ellipse cx="80" cy="32" rx="24" ry="14" fill="white"/><ellipse cx="100" cy="28" rx="20" ry="16" fill="white"/></g>
      <circle cx="360" cy="38" r="18" fill="#FFE066"/>
      <rect x="28" y="118" width="10" height="42" fill="#8B4513"/><circle cx="33" cy="112" r="28" fill="#4CAF50"/>
      <rect x="362" y="112" width="12" height="48" fill="#8B4513"/><circle cx="368" cy="105" r="32" fill="#388E3C"/>
    </svg>` },
  { id: 'home', name: '温馨小窝', bg: 'linear-gradient(180deg, #FFF5E6 0%, #FFE4CC 100%)', extra: `
    <svg class="scene-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
      <rect x="0" y="160" width="400" height="40" fill="#D4A574"/>
      <rect x="30" y="25" width="80" height="70" fill="#87CEEB"/>
      <path d="M70,25 L70,95" stroke="#2D1F1A" stroke-width="2"/>
      <line x1="30" y1="60" x2="110" y2="60" stroke="#2D1F1A" stroke-width="2"/>
      <rect x="170" y="30" width="60" height="40" fill="#FFD700"/>
    </svg>` },
  { id: 'beach', name: '海边沙滩', bg: 'linear-gradient(180deg, #FFB347 0%, #87CEEB 35%, #4DA6FF 55%, #F4D03F 80%, #F0E68C 100%)', extra: `
    <svg class="scene-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
      <circle cx="60" cy="50" r="32" fill="#FFD700"/>
      <rect x="260" y="100" width="8" height="60" fill="#8B4513"/>
      <path d="M264,100 Q250,95 240,105 Q260,100 264,100" fill="#4CAF50"/>
      <path d="M0,140 Q50,135 100,140 Q150,145 200,140 Q250,135 300,140 Q350,145 400,140 L400,160 L0,160 Z" fill="#FFE4B5" opacity="0.9"/>
    </svg>` },
  { id: 'snow', name: '雪山之巅', bg: 'linear-gradient(180deg, #1A2980 0%, #26D0CE 50%, #F0F8FF 80%, #FFFFFF 100%)', extra: `
    <svg class="scene-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
      <polygon points="0,180 120,100 220,180" fill="#E8E8E8"/>
      <polygon points="180,180 280,120 380,180" fill="#E8E8E8"/>
    </svg>` },
  { id: 'candy', name: '糖果王国', bg: 'linear-gradient(135deg, #FFB6C1 0%, #FFD1DC 30%, #E6E6FA 60%, #FFE4B5 100%)', extra: `
    <svg class="scene-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
      <path d="M50,130 Q200,-10 350,130" fill="none" stroke="#FF6B6B" stroke-width="10" stroke-linecap="round"/>
      <path d="M60,138 Q200,0 340,138" fill="none" stroke="#FFD93D" stroke-width="10" stroke-linecap="round"/>
      <path d="M70,146 Q200,10 330,146" fill="none" stroke="#6BCB77" stroke-width="10" stroke-linecap="round"/>
      <path d="M80,154 Q200,20 320,154" fill="none" stroke="#4DA6FF" stroke-width="10" stroke-linecap="round"/>
      <path d="M90,162 Q200,30 310,162" fill="none" stroke="#9B59B6" stroke-width="10" stroke-linecap="round"/>
    </svg>` },
  { id: 'space', name: '太空乐园', bg: 'linear-gradient(180deg, #0F0F3C 0%, #2D1B5E 40%, #4A235A 70%, #1A1A4A 100%)', extra: `
    <svg class="scene-svg" viewBox="0 0 400 200" preserveAspectRatio="none">
      <circle cx="340" cy="55" r="22" fill="#F5F0FF"/>
      <circle cx="80" cy="100" r="16" fill="#E74C3C"/>
      <ellipse cx="80" cy="100" rx="28" ry="6" fill="none" stroke="#F39C12" stroke-width="2.5"/>
    </svg>` },
];

export function sceneOf(id) { return SCENES.find((s) => s.id === id) || SCENES[0]; }

/**
 * 每只动物的 CSS 关节变量表（用于 pet.css 里的变量覆盖）
 * 给 pet-card.species 类设置这些变量即可
 */
export const SPECIES_VARS = {
  cat: {
    '--fur': '#F9A94E', '--fur-dark': '#E4862C', '--belly': '#FFF3DF', '--pink': '#FF9AA8',
    '--ink': '#3B2A20', '--line': '#2D1F1A',
    '--hip-x': '100px', '--hip-y': '172px',
    '--neck-x': '100px', '--neck-y': '104px',
    '--tail-x': '136px', '--tail-y': '152px',
    '--ear-l-x': '85px', '--ear-l-y': '46px',
    '--ear-r-x': '115px', '--ear-r-y': '46px',
    '--t-breathe': '2.4s', '--t-nod': '3.2s', '--t-sway': '1.9s', '--t-twitch': '2.6s', '--delay': '0s',
  },
  dog: {
    '--fur': '#E8C27A', '--fur-dark': '#C89554', '--belly': '#FFF5E6', '--pink': '#FFB6C1',
    '--ink': '#2D1F1A', '--line': '#2D1F1A', '--muzzle': '#F5D89F',
    '--hip-x': '100px', '--hip-y': '172px',
    '--neck-x': '100px', '--neck-y': '102px',
    '--tail-x': '138px', '--tail-y': '142px',
    '--ear-l-x': '72px', '--ear-l-y': '72px',
    '--ear-r-x': '128px', '--ear-r-y': '72px',
    '--t-breathe': '2.5s', '--t-nod': '3.4s', '--t-sway': '2.1s', '--t-twitch': '2.8s', '--delay': '0.15s',
  },
  rabbit: {
    '--fur': '#FBF7F0', '--fur-dark': '#E7DED1', '--belly': '#FFFFFF', '--pink': '#FFA6B5',
    '--ink': '#3B2A20', '--line': '#E2D9CB',
    '--hip-x': '100px', '--hip-y': '172px',
    '--neck-x': '100px', '--neck-y': '110px',
    '--tail-x': '140px', '--tail-y': '150px',
    '--ear-l-x': '90px', '--ear-l-y': '62px',
    '--ear-r-x': '110px', '--ear-r-y': '62px',
    '--t-breathe': '2.1s', '--t-nod': '3.0s', '--t-sway': '2.3s', '--t-twitch': '2.4s', '--delay': '0.35s',
  },
  panda: {
    '--fur': '#FFFFFF', '--fur-dark': '#2D1F1A', '--belly': '#FFFFFF', '--pink': '#FFB6C1',
    '--ink': '#2D1F1A', '--line': '#2D1F1A',
    '--hip-x': '100px', '--hip-y': '172px',
    '--neck-x': '100px', '--neck-y': '92px',
    '--tail-x': '150px', '--tail-y': '140px',
    '--ear-l-x': '70px', '--ear-l-y': '50px',
    '--ear-r-x': '130px', '--ear-r-y': '50px',
    '--t-breathe': '2.6s', '--t-nod': '3.6s', '--t-sway': '2.0s', '--t-twitch': '3.0s', '--delay': '0.5s',
  },
  chick: {
    '--fur': '#FFE44D', '--fur-dark': '#E8C900', '--belly': '#FFF27A', '--pink': '#FFB6C1',
    '--ink': '#2D1F1A', '--line': '#2D1F1A',
    '--hip-x': '100px', '--hip-y': '170px',
    '--neck-x': '100px', '--neck-y': '94px',
    '--tail-x': '148px', '--tail-y': '140px',
    '--ear-l-x': '100px', '--ear-l-y': '36px', '--ear-r-x': '100px', '--ear-r-y': '36px',
    '--t-breathe': '1.8s', '--t-nod': '2.8s', '--t-sway': '1.6s', '--t-twitch': '2.2s', '--delay': '0.7s',
  },
  koala: {
    '--fur': '#A8A29E', '--fur-dark': '#6B6663', '--belly': '#CFCBC6', '--pink': '#FFB6C1',
    '--ink': '#2D1F1A', '--line': '#2D1F1A',
    '--hip-x': '100px', '--hip-y': '172px',
    '--neck-x': '100px', '--neck-y': '106px',
    '--tail-x': '146px', '--tail-y': '142px',
    '--ear-l-x': '65px', '--ear-l-y': '46px',
    '--ear-r-x': '135px', '--ear-r-y': '46px',
    '--t-breathe': '2.8s', '--t-nod': '3.8s', '--t-sway': '2.4s', '--t-twitch': '3.2s', '--delay': '0.9s',
  },
};
