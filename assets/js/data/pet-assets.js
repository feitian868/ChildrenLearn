/**
 * pet-assets.js v10 —— 六只 × 三姿态 · 共用骨架 / 共用 keyframes
 *
 * 硬约束落地说明：
 * 1. 动画只改 transform；几何在静态阶段画完（d/cx/cy/x/y/w/h 全程零改动）。
 * 2. 对称器官只画一侧：动画类在外层 <g>，mirror() 只包内层内容；
 *    右肢原点由 CSS calc(200px - var(--x)) 推出，源码里没有右侧坐标。
 * 3. 关节原点 = armPath 首点 (sx,sy) / 实测坐标；三套姿态各写各的 pose 变量。
 * 4. 6 只共用 pet.css 里同一套 @keyframes；差异只在造型包 + CSS 变量。
 * 5. 循环动画 ease-in-out；cubic-bezier(.34,1.56,.64,1) 只给一次性交互。
 * 6. 交互尾巴统一切 swayJoy；act-pat 为 .35s × 6 = 2.1s。
 * 7. 交互头角收在 ±9° 内；五只不画遮挡片（猫保留已定稿的肩部遮挡片）。
 * 8. 后腿 2*rx ÷ armPath.w1：1.5~1.7（兔 2.0）；data-part / data-w1 / data-rx 供测量。
 * 9. 场景层独立 <g class="scene">；角色层 .rig / .pose-* 可整体隐藏做差帧。
 * 10. 复制顺序：猫（stage7 定稿）→ 小鸡 → 狗 → 熊猫 → 考拉 → 兔。
 */

/* ============================================================
   共用几何工具
   ============================================================ */
const mirror = (s) => `<g transform="translate(200,0) scale(-1,1)">${s}</g>`;

const armPath = (sx, sy, ex, ey, wx, wy, w1, w2) =>
  `M${sx - w1 / 2},${sy} Q${ex - w1 * 0.62},${ey} ${wx - w2 / 2},${wy} ` +
  `Q${wx},${wy + w2 * 0.80} ${wx + w2 / 2},${wy} Q${ex + w1 * 0.46},${ey} ${sx + w1 / 2},${sy} ` +
  `Q${sx},${sy - w1 * 0.52} ${sx - w1 / 2},${sy} Z`;

/* 前肢：轮廓 + 内侧高光。data-w1 / data-sx / data-sy 是可测量的唯一真相。
   注意：肩关节原点就是 armPath 的 sx,sy（不是参照成品的 --arm-x/--arm-y）。 */
const armAt = (sx, sy, ex, ey, wx, wy, w1, w2) =>
  `<path data-part="forearm" data-w1="${w1}" data-w2="${w2}" data-sx="${sx}" data-sy="${sy}" ` +
  `d="${armPath(sx, sy, ex, ey, wx, wy, w1, w2)}" fill="var(--limb)" stroke="var(--outline)" ` +
  `stroke-width="2" stroke-linejoin="round"/>` +
  `<path d="M${sx - w1 / 2 + 2.6},${sy + 9} Q${ex - w1 * 0.48},${ey} ${wx - w2 / 2 + 2},${wy - 5}" ` +
  `fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".2"/>`;

const pawAt = (cx, cy, rx, ry, toes) => {
  let t = '';
  if (toes === 'catpad')
    t = `<circle cx="${cx - 5}" cy="${cy - 3}" r="2.2" fill="var(--limb)" stroke="var(--outline)" stroke-width="1.1"/>` +
        `<circle cx="${cx}" cy="${cy - 4}" r="2.2" fill="var(--limb)" stroke="var(--outline)" stroke-width="1.1"/>` +
        `<circle cx="${cx + 5}" cy="${cy - 3}" r="2.1" fill="var(--limb)" stroke="var(--outline)" stroke-width="1.1"/>` +
        `<ellipse cx="${cx}" cy="${cy + 1.5}" rx="6" ry="3.6" fill="var(--pink)" opacity=".6"/>`;
  else if (toes === 'pads')
    t = `<circle cx="${cx - 8}" cy="${cy - 3}" r="3.2" fill="var(--limb)" stroke="var(--outline)" stroke-width="1.3"/>` +
        `<circle cx="${cx - 2.5}" cy="${cy - 4}" r="3.3" fill="var(--limb)" stroke="var(--outline)" stroke-width="1.3"/>` +
        `<circle cx="${cx + 3}" cy="${cy - 3.6}" r="3.2" fill="var(--limb)" stroke="var(--outline)" stroke-width="1.3"/>` +
        `<ellipse cx="${cx}" cy="${cy + 2}" rx="5.8" ry="4.2" fill="var(--pink)" opacity=".55"/>`;
  else if (toes === 'lines')
    t = `<path d="M${cx - 6},${cy - 2.5} v4.5 M${cx + 0.5},${cy - 3} v5 M${cx + 7},${cy - 2.5} v4.5" ` +
        `fill="none" stroke="var(--outline)" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>`;
  else if (toes === 'claws')
    t = `<circle cx="${cx - 6}" cy="${cy + 3}" r="1.8" fill="#E8E9EF"/>` +
        `<circle cx="${cx - 2}" cy="${cy + 4.2}" r="1.9" fill="#E8E9EF"/>` +
        `<circle cx="${cx + 2.5}" cy="${cy + 4}" r="1.8" fill="#E8E9EF"/>` +
        `<circle cx="${cx + 6.5}" cy="${cy + 2.6}" r="1.7" fill="#E8E9EF"/>`;
  else if (toes === 'soft')
    t = `<circle cx="${cx - 6}" cy="${cy - 2}" r="2.3" fill="#C8CDD4" opacity=".85"/>` +
        `<circle cx="${cx}" cy="${cy - 3}" r="2.3" fill="#C8CDD4" opacity=".85"/>` +
        `<circle cx="${cx + 6}" cy="${cy - 2}" r="2.2" fill="#C8CDD4" opacity=".85"/>` +
        `<ellipse cx="${cx}" cy="${cy + 1.8}" rx="6" ry="3.2" fill="#D8DCE2" opacity=".5"/>`;
  return `<ellipse data-part="paw" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="var(--limb)" ` +
         `stroke="var(--outline)" stroke-width="2"/>` + t;
};

const hindFoot = (cx, cy, halfW, halfH, toes, toeColor, padColor) => {
  let t = '';
  if (toes === 'pads')
    t = `<circle cx="${cx - 9}" cy="${cy - 2}" r="3.1" fill="var(--foot)" stroke="var(--outline)" stroke-width="1.2"/>` +
        `<circle cx="${cx - 3}" cy="${cy - 3.2}" r="3.3" fill="var(--foot)" stroke="var(--outline)" stroke-width="1.2"/>` +
        `<circle cx="${cx + 3}" cy="${cy - 3}" r="3.1" fill="var(--foot)" stroke="var(--outline)" stroke-width="1.2"/>` +
        `<ellipse cx="${cx}" cy="${cy + 2}" rx="6" ry="4" fill="${padColor}" opacity=".55"/>`;
  else if (toes === 'catpad')
    t = `<circle cx="${cx - 5}" cy="${cy - 3}" r="2.2" fill="var(--foot)" stroke="var(--outline)" stroke-width="1.1"/>` +
        `<circle cx="${cx}" cy="${cy - 4}" r="2.2" fill="var(--foot)" stroke="var(--outline)" stroke-width="1.1"/>` +
        `<circle cx="${cx + 5}" cy="${cy - 3}" r="2.1" fill="var(--foot)" stroke="var(--outline)" stroke-width="1.1"/>` +
        `<ellipse cx="${cx}" cy="${cy + 1.5}" rx="6" ry="3.6" fill="var(--pink)" opacity=".6"/>`;
  else if (toes === 'claws')
    t = `<circle cx="${cx - 8}" cy="${cy + 3}" r="2" fill="#E8E9EF"/>` +
        `<circle cx="${cx - 3}" cy="${cy + 4.2}" r="2.1" fill="#E8E9EF"/>` +
        `<circle cx="${cx + 2}" cy="${cy + 4}" r="2" fill="#E8E9EF"/>` +
        `<circle cx="${cx + 7}" cy="${cy + 2.6}" r="1.9" fill="#E8E9EF"/>`;
  else if (toes === 'long')
    t = `<ellipse cx="${cx + 2}" cy="${cy - 0.8}" rx="${halfW * 0.6}" ry="${halfH * 0.5}" fill="${padColor}" opacity=".32"/>` +
        `<path d="M${cx - 12},${cy - 2} v4 M${cx - 5},${cy - 2.6} v4.6 M${cx + 2},${cy - 2.6} v4.6" ` +
        `fill="none" stroke="var(--outline)" stroke-width="1.3" stroke-linecap="round" opacity=".4"/>`;
  else if (toes === 'soft')
    t = `<circle cx="${cx - 6}" cy="${cy - 2}" r="2.3" fill="${toeColor}" opacity=".8"/>` +
        `<circle cx="${cx}" cy="${cy - 3}" r="2.3" fill="${toeColor}" opacity=".8"/>` +
        `<circle cx="${cx + 6}" cy="${cy - 2}" r="2.2" fill="${toeColor}" opacity=".8"/>` +
        `<ellipse cx="${cx}" cy="${cy + 1.8}" rx="6" ry="3.2" fill="#D8DCE2" opacity=".5"/>`;
  return `<ellipse data-part="hindfoot" cx="${cx}" cy="${cy}" rx="${halfW}" ry="${halfH}" ` +
         `fill="var(--foot)" stroke="var(--outline)" stroke-width="2"/>` + t;
};

/* 对称器官：只画左，右用 mirror；右侧 transform-origin 由 CSS calc 推出 */
const hindLegs = (cx, cy, rx, ry, fill) => {
  const one = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ` +
              `stroke="var(--outline)" stroke-width="2"/>`;
  return `<g class="hindleg hindleg-l" data-part="hindleg-l" data-rx="${rx}" data-cx="${cx}" data-cy="${cy}">${one}</g>` +
         `<g class="hindleg hindleg-r" data-part="hindleg-r" data-rx="${rx}">${mirror(one)}</g>`;
};
const hindFeet = (cx, cy, hw, hh, toes, toeColor, padColor) => {
  const one = hindFoot(cx, cy, hw, hh, toes, toeColor, padColor);
  return `<g class="hindfoot hindfoot-l" data-part="hindfoot-l">${one}</g>` +
         `<g class="hindfoot hindfoot-r" data-part="hindfoot-r">${mirror(one)}</g>`;
};

/* 两层眨眼：睁眼层纯 fill（零面积不留描边）；闭眼弧独立层 */
const eyesFor = (ex, ey, rx, ry, iris, pupil, shine) => {
  const open = `<g class="eye-open" data-part="eye-open">` +
    `<ellipse cx="${ex - 14}" cy="${ey}" rx="${rx}" ry="${ry}" fill="${iris}"/>` +
    `<circle cx="${ex - 16}" cy="${ey - 3}" r="${shine}" fill="#fff"/>` +
    `<ellipse cx="${ex + 14}" cy="${ey}" rx="${rx}" ry="${ry}" fill="${iris}"/>` +
    `<circle cx="${ex + 12}" cy="${ey - 3}" r="${shine}" fill="#fff"/>` +
    `</g>`;
  const lid = `<g class="eye-lid" data-part="eye-lid">` +
    `<path d="M${ex - 20},${ey} Q${ex - 14},${ey - 3.5} ${ex - 8},${ey}" fill="none" stroke="${pupil}" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path d="M${ex + 8},${ey} Q${ex + 14},${ey - 3.5} ${ex + 20},${ey}" fill="none" stroke="${pupil}" stroke-width="2.4" stroke-linecap="round"/>` +
    `</g>`;
  return open + lid;
};

/* ============================================================
   场景：六只配色不同（变量由 SPECIES_VARS 提供），vignette 径向提亮
   ============================================================ */
const SCENE = (key, extra) => `
  <g class="scene" aria-hidden="true">
    <defs>
      <linearGradient id="${key}-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style="stop-color:var(--sky1)"/>
        <stop offset=".58" style="stop-color:var(--sky2)"/>
      </linearGradient>
      <linearGradient id="${key}-grass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style="stop-color:var(--grass1)"/>
        <stop offset="1" style="stop-color:var(--grass2)"/>
      </linearGradient>
      <radialGradient id="${key}-vig">
        <stop offset="0" stop-color="#FFFFFF" stop-opacity=".26"/>
        <stop offset=".62" stop-color="#FFFFFF" stop-opacity=".10"/>
        <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="200" height="200" style="fill:url(#${key}-sky)"/>
    <ellipse cx="46" cy="38" rx="17" ry="10" fill="#fff" opacity=".9"/>
    <ellipse cx="58" cy="34" rx="13" ry="12" fill="#fff" opacity=".9"/>
    <circle cx="166" cy="34" r="11" style="fill:var(--sun)" opacity=".85"/>
    <path d="M0,140 Q50,112 100,132 Q150,148 200,126 L200,162 L0,162 Z" style="fill:var(--tree)" opacity=".38"/>
    <path d="M0,146 Q50,134 100,140 T200,136 L200,200 L0,200 Z" style="fill:url(#${key}-grass)"/>
    ${extra || ''}
    <path d="M4,178 H196" stroke="#4E9C5E" stroke-width="1" stroke-dasharray="4 4" opacity=".3"/>
    <ellipse cx="100" cy="116" rx="76" ry="84" style="fill:url(#${key}-vig)"/>
  </g>`;

/* ============================================================
   POSE：一套姿态 = 一个完整骨架（各自 rig / torso / head / foreleg）
   ============================================================ */
const POSE = (p, s, cls) => {
  const vars = {
    '--hip-x': '100px',
    '--hip-y': `${s.hipY}px`,
    '--neck-x': '100px',
    '--neck-y': '100px',
    '--arm-x': `${(s.armXY || [100, 150])[0]}px`,
    '--arm-y': `${(s.armXY || [100, 150])[1]}px`,
    '--hindleg-l-x': `${(s.hindXY || [100, 150])[0]}px`,
    '--hindleg-l-y': `${(s.hindXY || [100, 150])[1]}px`,
  };
  const style = Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';');
  const hasArm = !!s.arm;
  const arms = hasArm
    ? `<g class="foreleg foreleg-l" data-part="foreleg-l">${s.arm}${s.paw || ''}</g>` +
      `<g class="foreleg foreleg-r" data-part="foreleg-r">${mirror(s.arm + (s.paw || ''))}</g>`
    : '';
  const ears = p.earL
    ? `<g class="ear ear-l" data-part="ear-l">${p.earL}</g>` +
      `<g class="ear ear-r" data-part="ear-r">${mirror(p.earL)}</g>`
    : '';
  const crest = p.crest ? `<g class="crest" data-part="crest">${p.crest}</g>` : '';
  return `<g class="pose ${cls}${cls === 'pose-sit' ? ' pose-on' : ''}" data-pose="${cls}" style="${style}">
    <ellipse class="shadow" cx="100" cy="${s.shadowY}" rx="${s.shadowRx}" ry="9" fill="#1B2A38" opacity=".18"/>
    <g class="rig" data-part="root">
      <g class="tail" data-part="tail">${p.tail || ''}</g>
      <g class="torso" data-part="torso">
        ${s.body}
        ${s.belly || ''}
        ${s.torsoExtra || ''}
        ${arms}
        ${s.shoulder || ''}
        <g class="head" data-part="head">
          ${ears}
          ${crest}
          ${p.head}
          <g class="eyes" data-part="eyes">${p.eyes}</g>
        </g>
      </g>
      <g class="decorations" data-part="decorations"></g>
    </g>
  </g>`;
};

/* 物种 CSS 变量直接内联在 svg 根上：领养卡片与乐园舞台都拿到同一份变量，
   不需要再用 .pet-card.cat 之类的选择器重复定义（约束 4：差异只在造型包 + 变量）。 */
const buildSpeciesSvg = (p) => {
  const styleStr = Object.entries(p.vars).map(([k, v]) => `${k}:${v}`).join(';');
  return `<svg class="pet" data-species="${p.key}" style="${styleStr}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-label="${p.name}">
  ${SCENE(p.key, p.sceneExtra)}
  ${POSE(p, p.sit, 'pose-sit')}
  ${POSE(p, p.stand, 'pose-stand')}
  ${POSE(p, p.ly, 'pose-ly')}
</svg>`;
};

/* ============================================================
   🐱 猫 —— stage7 定稿（几何逐点保留；仅把两侧脚改为 mirror 生成）
   ============================================================ */
const CAT = {
  key: 'cat', name: '猫', emoji: '🐱',
  vars: {
    '--fur': '#B9C0C9', '--fur-dark': '#8E97A3', '--fur-light': '#DCE1E7', '--belly': '#F7F9FB',
    '--pink': '#FF9AA8', '--ink': '#3B2A20', '--foot': '#E8ECF1', '--limb': '#CFD5DC',
    '--outline': '#55606E',
    '--eye-x': '100px', '--eye-y': '74px',
    '--tail-x': '138px', '--tail-y': '150px',
    '--ear-l-x': '74px', '--ear-l-y': '54px',
    '--legs-x': '100px', '--legs-y': '150px',
    '--sky1': '#9BD7FF', '--sky2': '#DEF3FF', '--grass1': '#8EDC92', '--grass2': '#5CBF73',
    '--sun': '#FFD34D', '--tree': '#4FA96B',
  },
  sceneExtra: '',
  tail: '<path d="M138,150 C158,157 176,143 172,123 C169,109 155,107 150,117" fill="none" ' +
        'stroke="var(--fur-dark)" stroke-width="15" stroke-linecap="round"/>' +
        '<path d="M139,150 C155,155 168,144 166,130" fill="none" stroke="var(--fur-light)" stroke-width="4" stroke-linecap="round" opacity=".55"/>',
  /* 猫定稿的肩部遮挡片：头 0° 时完全落在头圆内，只在 ±9° 补薄楔形 */
  shoulder:
    '<path data-part="shoulder" d="M74.3,96 Q82,88.72 89,96 L89,82 L73.5,82 Z" fill="var(--fur)"/>' +
    mirror('<path data-part="shoulder" d="M74.3,96 Q82,88.72 89,96 L89,82 L73.5,82 Z" fill="var(--fur)"/>'),
  earL: '<path d="M74,54 C66,40 62,26 63,18 C73,27 84,34 92,41 Z" fill="var(--fur)"/>' +
        '<path d="M76,50 C70,38 67,29 68,24 C74,30 81,35 87,40 Z" fill="var(--pink)" opacity=".9"/>',
  head:
    '<circle data-part="skull" cx="100" cy="74" r="34" fill="var(--fur)"/>' +
    '<ellipse cx="86" cy="60" rx="12" ry="7" fill="#fff" opacity=".16" transform="rotate(-18 86 60)"/>' +
    '<path d="M94,45l2,11M100,43v12M106,45l-2,11" stroke="var(--fur-dark)" stroke-width="3" stroke-linecap="round"/>' +
    '<ellipse cx="72" cy="88" rx="8" ry="5" fill="var(--pink)" opacity=".5"/>' +
    '<ellipse cx="128" cy="88" rx="8" ry="5" fill="var(--pink)" opacity=".5"/>' +
    '<path d="M96,87 Q100,84 104,87 Q100,93 96,87 Z" fill="#E8737A"/>' +
    '<path d="M100,93 Q95,99 90,95 M100,93 Q105,99 110,95" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M68,84 L46,78 M68,90 L48,91 M132,84 L154,78 M132,90 L152,91" stroke="var(--fur-light)" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>',
  eyes: eyesFor(100, 74, 6, 7.5, 'var(--ink)', 'var(--ink)', 2.2),
  sit: {
    hipY: 176, shadowY: 176, shadowRx: 42,
    armXY: [82, 96], hindXY: [66, 146],
    body: '<g data-part="body"><path d="M100,88 C123,88 136,113 137,141 C137,164 121,175 100,175 C79,175 63,164 63,141 C64,113 77,88 100,88 Z" fill="var(--fur)"/>' +
          '<path d="M71,118 l7,-4 M69,130 l8,-3 M72,142 l7,-3" stroke="var(--fur-dark)" stroke-width="4.5" stroke-linecap="round" opacity=".5"/>' +
          '<path d="M129,118 l-7,-4 M131,130 l-8,-3 M128,142 l-7,-3" stroke="var(--fur-dark)" stroke-width="4.5" stroke-linecap="round" opacity=".5"/></g>',
    belly: '<ellipse data-part="belly" cx="100" cy="146" rx="19" ry="19" fill="var(--belly)"/>',
    torsoExtra: hindLegs(66, 146, 11.5, 21, 'var(--fur-dark)') + hindFeet(66, 169, 10.5, 6.5, 'catpad'),
    arm: armAt(82, 96, 70, 128, 80, 165, 14, 10),
    paw: pawAt(80, 170, 8.5, 6.8, 'catpad'),
  },
  stand: {
    hipY: 157, shadowY: 176, shadowRx: 36,
    armXY: [80, 96], hindXY: [74, 141],
    body: '<g data-part="body"><path d="M100,88 C124,88 136,112 137,138 C137,150 122,157 100,157 C78,157 63,150 63,138 C64,112 76,88 100,88 Z" fill="var(--fur)"/>' +
          '<path d="M72,116 l7,-4 M70,128 l8,-3 M73,140 l7,-3" stroke="var(--fur-dark)" stroke-width="4.2" stroke-linecap="round" opacity=".45"/>' +
          '<path d="M128,116 l-7,-4 M130,128 l-8,-3 M127,140 l-7,-3" stroke="var(--fur-dark)" stroke-width="4.2" stroke-linecap="round" opacity=".45"/></g>',
    belly: '<ellipse data-part="belly" cx="100" cy="136" rx="18" ry="17" fill="var(--belly)"/>',
    torsoExtra: hindLegs(74, 141, 10, 18, 'var(--fur-dark)') + hindFeet(74, 170, 10, 6, 'catpad'),
    arm: armAt(80, 96, 74, 128, 78, 163, 12, 9.5),
    paw: pawAt(78, 169, 8.5, 6.6, 'lines'),
  },
  ly: {
    hipY: 174, shadowY: 178, shadowRx: 48,
    armXY: [80, 100], hindXY: [62, 152],
    body: '<g data-part="body"><ellipse cx="100" cy="136" rx="48" ry="38" fill="var(--fur)"/>' +
          '<path d="M58,126 l8,-3 M56,138 l9,-2 M60,150 l8,-2" stroke="var(--fur-dark)" stroke-width="4.2" stroke-linecap="round" opacity=".45"/>' +
          '<path d="M142,126 l-8,-3 M144,138 l-9,-2 M140,150 l-8,-2" stroke="var(--fur-dark)" stroke-width="4.2" stroke-linecap="round" opacity=".45"/></g>',
    belly: '<ellipse data-part="belly" cx="100" cy="146" rx="30" ry="22" fill="var(--belly)"/>',
    torsoExtra: hindLegs(62, 152, 10.5, 20, 'var(--fur-dark)') + hindFeet(56, 170, 10.5, 6.5, 'catpad'),
    arm: armAt(80, 100, 70, 128, 78, 160, 12.5, 9.5),
    paw: pawAt(78, 168, 8.5, 6.6, 'lines'),
  },
};

/* ============================================================
   🐶 狗 —— 金毛 / 竖耳 / 突出吻部 / 4 趾大肉垫
   ============================================================ */
const DOG = {
  key: 'dog', name: '狗', emoji: '🐶',
  vars: {
    '--fur': '#D79A62', '--fur-dark': '#B87A44', '--fur-light': '#EEBE8C', '--belly': '#FFF1DF',
    '--pink': '#FF9AA8', '--ink': '#3B2A20', '--nose': '#2B2B33', '--foot': '#FFF1DF',
    '--limb': '#D79A62', '--outline': '#55606E',
    '--eye-x': '100px', '--eye-y': '72px',
    '--tail-x': '140px', '--tail-y': '138px',
    '--ear-l-x': '80px', '--ear-l-y': '50px',
    '--legs-x': '100px', '--legs-y': '150px',
    '--sky1': '#FFD9A0', '--sky2': '#FFF3DC', '--grass1': '#A8DE7C', '--grass2': '#79C468',
    '--sun': '#FFB84D', '--tree': '#5FA35E',
  },
  sceneExtra: '',
  tail: '<path d="M140,138 C155,132 163,118 158,106 C154,96 143,99 144,110" fill="none" ' +
        'stroke="var(--fur-dark)" stroke-width="13" stroke-linecap="round"/>' +
        '<path d="M150,118 C154,112 156,108 157,104" fill="none" stroke="var(--fur-light)" stroke-width="6" stroke-linecap="round" opacity=".5"/>',
  earL: '<path d="M73,58 C68,46 67,30 71,19 C75,12 82,20 85,32 C88,43 87,53 83,58 Z" fill="var(--fur-dark)"/>' +
        '<path d="M76,54 C72,44 71,32 74,24 C77,18 81,25 83,35 C85,43 84,51 81,55 Z" fill="var(--pink)" opacity=".6"/>' +
        '<path d="M74,52 C71,43 70.5,33 73,26" fill="none" stroke="#9A6533" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>',
  head:
    '<circle data-part="skull" cx="100" cy="74" r="34" fill="var(--fur)"/>' +
    '<ellipse cx="86" cy="60" rx="12" ry="7" fill="#fff" opacity=".16" transform="rotate(-18 86 60)"/>' +
    '<ellipse cx="72" cy="88" rx="8" ry="5" fill="var(--pink)" opacity=".45"/>' +
    '<ellipse cx="128" cy="88" rx="8" ry="5" fill="var(--pink)" opacity=".45"/>' +
    '<ellipse cx="100" cy="92" rx="17" ry="14" fill="var(--belly)" stroke="var(--outline)" stroke-width="1.8"/>' +
    '<path d="M100,84 C105,84 108.5,88 107.5,91.5 C106.5,95.5 103,97.5 100,97.5 C97,97.5 93.5,95.5 92.5,91.5 C91.5,88 95,84 100,84 Z" fill="var(--nose)"/>' +
    '<ellipse cx="96.5" cy="88.5" rx="2.4" ry="1.8" fill="#fff" opacity=".5"/>' +
    '<path d="M100,97.5 v3" stroke="var(--nose)" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M100,100.5 Q92,108.5 85,99.5 M100,100.5 Q108,108.5 115,99.5" fill="none" stroke="var(--nose)" stroke-width="2.4" stroke-linecap="round"/>' +
    '<path d="M98,102 Q96.5,110 101,112 Q105.5,110 104,102 Z" fill="#FF8FA3" stroke="#E8737A" stroke-width="1"/>',
  eyes: eyesFor(100, 72, 5.6, 6.8, 'var(--ink)', 'var(--ink)', 2),
  sit: {
    hipY: 174, shadowY: 176, shadowRx: 40,
    armXY: [80, 96], hindXY: [64, 145],
    body: '<g data-part="body"><path d="M100,86 C124,86 138,113 139,140 C139,163 122,175 100,175 C78,175 61,163 61,140 C62,113 76,86 100,86 Z" fill="var(--fur)"/></g>',
    belly: '<ellipse data-part="belly" cx="100" cy="146" rx="20" ry="19" fill="var(--belly)"/>',
    torsoExtra: hindLegs(64, 145, 12, 22, 'var(--fur-dark)') + hindFeet(60, 169, 11.5, 7, 'pads', null, 'var(--pink)'),
    arm: armAt(80, 96, 66, 124, 79, 158, 14.5, 11.5),
    paw: pawAt(79, 168, 9, 7.2, 'pads'),
  },
  stand: {
    hipY: 157, shadowY: 176, shadowRx: 36,
    armXY: [78, 94], hindXY: [72, 141],
    body: '<g data-part="body"><path d="M100,86 C122,86 134,111 135,138 C135,150 121,157 100,157 C79,157 65,150 65,138 C66,111 78,86 100,86 Z" fill="var(--fur)"/></g>',
    belly: '<ellipse data-part="belly" cx="100" cy="134" rx="18" ry="17" fill="var(--belly)"/>',
    torsoExtra: hindLegs(72, 141, 11.5, 19, 'var(--fur-dark)') + hindFeet(71, 170, 11.5, 6.5, 'pads', null, 'var(--pink)'),
    arm: armAt(78, 94, 72, 128, 77, 164, 14, 11.5),
    paw: pawAt(77, 169, 9, 7, 'pads'),
  },
  ly: {
    hipY: 174, shadowY: 178, shadowRx: 48,
    armXY: [78, 98], hindXY: [60, 152],
    body: '<g data-part="body"><ellipse cx="100" cy="136" rx="46" ry="37" fill="var(--fur)"/></g>',
    belly: '<ellipse data-part="belly" cx="100" cy="146" rx="28" ry="21" fill="var(--belly)"/>',
    torsoExtra: hindLegs(60, 152, 12.5, 21, 'var(--fur-dark)') + hindFeet(52, 170, 11.5, 7, 'pads', null, 'var(--pink)'),
    arm: armAt(78, 98, 68, 128, 76, 160, 15, 11.5),
    paw: pawAt(76, 168, 9, 7, 'pads'),
  },
};

/* ============================================================
   🐰 兔子 —— 白毛 / 长耳 / 门牙 / 棉花尾 / 后腿比 2.0 / 前爪短不落地
   ============================================================ */
const RABBIT = {
  key: 'rabbit', name: '兔子', emoji: '🐰',
  vars: {
    '--fur': '#FCF8F2', '--fur-dark': '#D8CDBC', '--fur-light': '#FFFFFF', '--belly': '#FFFFFF',
    '--pink': '#FFA6B5', '--ink': '#3B2A20', '--line': '#B9AC97', '--foot': '#FCF8F2',
    '--limb': '#FCF8F2', '--outline': '#B0A390',
    '--eye-x': '100px', '--eye-y': '76px',
    '--tail-x': '150px', '--tail-y': '150px',
    '--ear-l-x': '88px', '--ear-l-y': '58px',
    '--legs-x': '100px', '--legs-y': '150px',
    '--sky1': '#9ECBF2', '--sky2': '#DCEFFC', '--grass1': '#A8DE8E', '--grass2': '#6FC470',
    '--sun': '#FFE08A', '--tree': '#4E9C68',
  },
  sceneExtra: '<path d="M30,170 q4,-10 8,0 M38,170 q3,-8 6,0 M150,168 q4,-10 8,0" fill="none" stroke="#4E9C5E" stroke-width="2" opacity=".55"/>',
  tail: '<g><path d="M166,132.5 C170,132.5 173,135 174.5,138 C177.5,139 179,142 179,145.5 ' +
        'C179,149 177.5,152 175,154 C175,157.5 171.5,159.5 168,159.5 C164.5,160 161,158.5 159,156 ' +
        'C155.5,155.5 153,153 152.5,149.5 C151.5,146.5 152.5,143 154.5,140.5 C156,137 159,134.5 162.5,133.5 ' +
        'C163.5,132.8 164.8,132.5 166,132.5 Z" fill="var(--fur)" stroke="var(--line)" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<ellipse cx="162" cy="142" rx="4" ry="3.4" fill="#fff" opacity=".75"/></g>',
  earL: '<ellipse cx="88" cy="34" rx="9.5" ry="25" transform="rotate(-10 88 58)" fill="var(--fur)" stroke="var(--line)" stroke-width="2.6"/>' +
        '<ellipse cx="88" cy="34" rx="4.8" ry="17" transform="rotate(-10 88 58)" fill="var(--pink)" opacity=".7"/>',
  head:
    '<circle data-part="skull" cx="100" cy="76" r="32" fill="var(--fur)" stroke="var(--line)" stroke-width="2.6"/>' +
    '<ellipse cx="86" cy="62" rx="11" ry="6" fill="#fff" opacity=".18" transform="rotate(-18 86 62)"/>' +
    '<ellipse cx="74" cy="90" rx="8" ry="5" fill="var(--pink)" opacity=".45"/>' +
    '<ellipse cx="126" cy="90" rx="8" ry="5" fill="var(--pink)" opacity=".45"/>' +
    '<path d="M96.5,86 Q100,82.5 103.5,86 Q100,91.5 96.5,86 Z" fill="#F58FA0"/>' +
    '<path d="M100,91 v3.5" stroke="#8C8272" stroke-width="1.6" stroke-linecap="round"/>' +
    '<path d="M100,94.5 C97.5,99.5 93,99.5 89.5,95" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M100,94.5 C102.5,99.5 107,99.5 110.5,95" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/>' +
    '<rect x="96.2" y="95.5" width="3.8" height="5.5" rx="1.7" fill="#fff" stroke="#CFC5B4" stroke-width="1.1"/>' +
    '<rect x="100" y="95.5" width="3.8" height="5.5" rx="1.7" fill="#fff" stroke="#CFC5B4" stroke-width="1.1"/>' +
    '<path d="M68,88 L48,84 M68,94 L50,96 M132,88 L152,84 M132,94 L150,96" stroke="var(--fur-dark)" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>',
  eyes: eyesFor(100, 76, 5.8, 7, 'var(--ink)', 'var(--ink)', 2.1),
  sit: {
    hipY: 174, shadowY: 176, shadowRx: 44,
    armXY: [83, 100], hindXY: [62, 145],
    body: '<g data-part="body"><path d="M100,90 C126,90 139,115 139,142 C139,164 122,175 100,175 C78,175 61,164 61,142 C61,115 74,90 100,90 Z" fill="var(--fur)" stroke="var(--line)" stroke-width="2.6"/></g>',
    belly: '<ellipse data-part="belly" cx="100" cy="146" rx="17" ry="16" fill="#fff"/>',
    torsoExtra: hindLegs(62, 145, 14, 25, '#EFE7DA') + hindFeet(62, 169, 12.5, 7.5, 'long', null, 'var(--pink)'),
    arm: armAt(83, 100, 75, 118, 80, 137, 14, 11),
    paw: pawAt(80, 141, 8.5, 6.4, 'lines'),
  },
  stand: {
    hipY: 157, shadowY: 176, shadowRx: 40,
    armXY: [83, 100], hindXY: [68, 140],
    body: '<g data-part="body"><path d="M100,90 C127,90 141,113 142,139 C142,151 127,157 100,157 C73,157 58,151 58,139 C59,113 73,90 100,90 Z" fill="var(--fur)" stroke="var(--line)" stroke-width="2.6"/></g>',
    belly: '<ellipse data-part="belly" cx="100" cy="134" rx="16" ry="15" fill="#fff"/>',
    torsoExtra: hindLegs(68, 140, 13, 23, '#EFE7DA') + hindFeet(68, 170, 12.5, 7, 'long', null, 'var(--pink)'),
    arm: armAt(83, 100, 78, 122, 80, 140, 13, 10.5),
    paw: pawAt(80, 145, 8, 6, 'lines'),
  },
  ly: {
    hipY: 176, shadowY: 178, shadowRx: 52,
    armXY: [83, 104], hindXY: [52, 152],
    body: '<g data-part="body"><ellipse cx="100" cy="136" rx="50" ry="40" fill="var(--fur)" stroke="var(--line)" stroke-width="2.6"/></g>',
    belly: '<ellipse data-part="belly" cx="100" cy="148" rx="28" ry="21" fill="#fff"/>',
    torsoExtra: hindLegs(52, 152, 15, 24, '#EFE7DA') + hindFeet(52, 170, 12.5, 7.5, 'long', null, 'var(--pink)'),
    arm: armAt(83, 104, 78, 126, 80, 148, 15, 12),
    paw: pawAt(80, 153, 8.5, 6.2, 'lines'),
  },
};

/* ============================================================
   🐼 熊猫 —— 白身黑臂 / 黑眼圈 / 黑肩块 / 白爪尖
   ============================================================ */
const PANDA = {
  key: 'panda', name: '熊猫', emoji: '🐼',
  vars: {
    '--fur': '#FFFFFF', '--fur-dark': '#2E2E36', '--fur-light': '#F4F5F9', '--belly': '#F1F2F6',
    '--pink': '#FFB3C0', '--ink': '#2E2E36', '--foot': '#43434F', '--limb': '#2E2E36',
    '--outline': '#7A7A88',
    '--eye-x': '100px', '--eye-y': '77px',
    '--tail-x': '140px', '--tail-y': '150px',
    '--ear-l-x': '74px', '--ear-l-y': '50px',
    '--legs-x': '100px', '--legs-y': '150px',
    '--sky1': '#9FCFC4', '--sky2': '#DFF2EA', '--grass1': '#8FCBA4', '--grass2': '#54A47C',
    '--sun': '#FFEBB0', '--tree': '#3E8C68',
  },
  sceneExtra: '<g opacity=".9"><path d="M34,172 V108 M40,172 V112" stroke="#3E8C68" stroke-width="4" stroke-linecap="round"/>' +
              '<path d="M28,126 q8,-5 14,0 M26,140 q8,-5 14,0 M36,112 q6,-6 12,-1" fill="none" stroke="#6DBB8E" stroke-width="2.4"/>' +
              '<path d="M164,172 V104 M170,172 V110" stroke="#3E8C68" stroke-width="4" stroke-linecap="round"/></g>',
  tail: '<ellipse data-part="tail" cx="158" cy="145" rx="10" ry="8" transform="rotate(-22 158 145)" fill="var(--fur-dark)"/>',
  earL: '<circle cx="74" cy="50" r="14.5" fill="var(--fur-dark)"/><circle cx="71" cy="47" r="5" fill="#fff" opacity=".12"/>',
  head:
    '<circle data-part="skull" cx="100" cy="74" r="35" fill="var(--fur)"/>' +
    '<ellipse cx="86" cy="60" rx="12" ry="7" fill="#fff" opacity=".12" transform="rotate(-18 86 60)"/>' +
    '<ellipse cx="85" cy="76" rx="12.5" ry="15" transform="rotate(-22 85 76)" fill="var(--ink)"/>' +
    '<ellipse cx="115" cy="76" rx="12.5" ry="15" transform="rotate(22 115 76)" fill="var(--ink)"/>' +
    '<ellipse cx="100" cy="90" rx="7.5" ry="5.5" fill="var(--ink)"/>' +
    '<path d="M100,95 Q95,101 90,98 M100,95 Q105,101 110,98" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round"/>',
  eyes: '<g class="eye-open" data-part="eye-open">' +
        '<circle cx="86" cy="77" r="5.2" fill="#fff"/><circle cx="86.5" cy="77" r="3.1" fill="#15151B"/><circle cx="85" cy="75.6" r="1.2" fill="#fff"/>' +
        '<circle cx="114" cy="77" r="5.2" fill="#fff"/><circle cx="113.5" cy="77" r="3.1" fill="#15151B"/><circle cx="112" cy="75.6" r="1.2" fill="#fff"/>' +
        '</g>' +
        '<g class="eye-lid" data-part="eye-lid">' +
        '<path d="M80,77 Q86,73.5 92,77" fill="none" stroke="#15151B" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M108,77 Q114,73.5 120,77" fill="none" stroke="#15151B" stroke-width="2.4" stroke-linecap="round"/>' +
        '</g>',
  sit: {
    hipY: 176, shadowY: 177, shadowRx: 46,
    armXY: [80, 96], hindXY: [58, 146],
    body: '<g data-part="body"><path d="M100,84 C131,84 149,113 150,141 C150,164 129,176 100,176 C71,176 50,164 50,141 C51,113 69,84 100,84 Z" fill="var(--fur)" stroke="var(--line)" stroke-width="2.4"/>' +
          '<ellipse cx="58" cy="132" rx="16" ry="12" fill="var(--ink)"/>' +
          '<ellipse cx="142" cy="132" rx="16" ry="12" fill="var(--ink)"/></g>',
    belly: '<ellipse data-part="belly" cx="100" cy="147" rx="22" ry="19" fill="var(--belly)"/>',
    torsoExtra: hindLegs(58, 146, 15, 25, '#43434F') + hindFeet(59, 169, 13, 8, 'claws', '#E8E9EF'),
    arm: armAt(80, 96, 63, 124, 78, 158, 18, 14),
    paw: pawAt(78, 168, 9.8, 8, 'claws'),
  },
  stand: {
    hipY: 158, shadowY: 177, shadowRx: 44,
    armXY: [78, 96], hindXY: [70, 141],
    body: '<g data-part="body"><path d="M100,84 C128,84 143,111 144,139 C144,151 127,158 100,158 C73,158 56,151 56,139 C57,111 72,84 100,84 Z" fill="var(--fur)" stroke="var(--line)" stroke-width="2.4"/>' +
          '<ellipse cx="62" cy="130" rx="15" ry="11" fill="var(--ink)"/>' +
          '<ellipse cx="138" cy="130" rx="15" ry="11" fill="var(--ink)"/></g>',
    belly: '<ellipse data-part="belly" cx="100" cy="136" rx="20" ry="17" fill="var(--belly)"/>',
    torsoExtra: hindLegs(70, 141, 14, 21, '#43434F') + hindFeet(71, 170, 13, 7, 'claws', '#E8E9EF'),
    arm: armAt(78, 96, 70, 128, 76, 163, 17, 13.5),
    paw: pawAt(76, 168, 9.8, 7.8, 'claws'),
  },
  ly: {
    hipY: 176, shadowY: 178, shadowRx: 54,
    armXY: [78, 100], hindXY: [56, 152],
    body: '<g data-part="body"><ellipse cx="100" cy="136" rx="52" ry="42" fill="var(--fur)" stroke="var(--line)" stroke-width="2.4"/>' +
          '<ellipse cx="56" cy="132" rx="17" ry="12" fill="var(--ink)"/>' +
          '<ellipse cx="144" cy="132" rx="17" ry="12" fill="var(--ink)"/></g>',
    belly: '<ellipse data-part="belly" cx="100" cy="148" rx="32" ry="23" fill="var(--belly)"/>',
    torsoExtra: hindLegs(56, 152, 16, 22, '#43434F') + hindFeet(50, 170, 13.5, 7.5, 'claws', '#E8E9EF'),
    arm: armAt(78, 100, 66, 129, 77, 160, 19, 13.5),
    paw: pawAt(77, 168, 9.8, 7.8, 'claws'),
  },
};

/* ============================================================
   🐥 小鸡 —— 无前肢 / 无尾 / 翅膀走 torsoExtra / 禽腿绕髋 (100,150)
   ============================================================ */
const WING = (side, cy) => {
  const cx = side === 'l' ? 72 : 128, flip = side === 'l' ? 1 : -1;
  return `<g class="wing wing-${side}" data-part="wing-${side}">` +
    `<g transform="translate(${cx},${cy}) scale(${flip},1) rotate(5)">` +
    `<path d="M0,-13 C9,-12 13,-4 12,4 C11,12 6,17 0,18 C-4,14 -6,7 -4,1 C-2,-6 -1,-10 0,-13 Z" ` +
    `fill="var(--wingc)" stroke="var(--outline)" stroke-width="1.7" stroke-linejoin="round"/>` +
    `<path d="M-2,-6 C4,-5 7,0 7,6" fill="none" stroke="#B87A16" stroke-width="1.5" opacity=".7" stroke-linecap="round"/>` +
    `<path d="M-3,1 C3,2 6,7 6,12" fill="none" stroke="#B87A16" stroke-width="1.4" opacity=".62" stroke-linecap="round"/>` +
    `<path d="M-2,8 C2,9 4,12 4,15" fill="none" stroke="#B87A16" stroke-width="1.2" opacity=".52" stroke-linecap="round"/>` +
    `</g></g>`;
};

const CHICK_LEGS = (topY, footY) => {
  const one = `<path d="M88,${topY} v${footY - topY}" fill="none" stroke="var(--beak)" stroke-width="3.4" stroke-linecap="round"/>` +
    `<path d="M88,${footY} l-7.5,4 M88,${footY} l0.5,5.5 M88,${footY} l7,4" fill="none" stroke="var(--beak)" ` +
    `stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<g class="legs" data-part="legs">${one}${mirror(one)}</g>`;
};

const CHICK = {
  key: 'chick', name: '小鸡', emoji: '🐤',
  vars: {
    '--fur': '#FFD34D', '--fur-dark': '#F0B52C', '--fur-light': '#FFE89A', '--belly': '#FFF0C2',
    '--beak': '#FF9F3D', '--pink': '#FFB3A0', '--ink': '#3B2A20', '--foot': '#FFD34D',
    '--limb': '#FFD34D', '--outline': '#D18A2A', '--wingc': '#E09A22',
    '--eye-x': '100px', '--eye-y': '72px',
    '--tail-x': '140px', '--tail-y': '136px',
    '--ear-l-x': '100px', '--ear-l-y': '46px',
    '--wing-l-x': '70px', '--wing-l-y': '128px',
    '--legs-x': '100px', '--legs-y': '150px',
    '--sky1': '#A8E6FF', '--sky2': '#E9FAFF', '--grass1': '#9FDC86', '--grass2': '#6FC470',
    '--sun': '#FFE066', '--tree': '#6BB45E',
  },
  sceneExtra: '<g opacity=".7"><path d="M18,174 q10,-14 20,0 M162,174 q10,-14 20,0" fill="none" stroke="#A0763B" stroke-width="3" stroke-linecap="round"/></g>',
  tail: '',
  earL: '',
  crest: '<path d="M97,44 C94,36 93,28 96,22 M100,44 C101,35 105,28 110,25" fill="none" stroke="var(--fur-dark)" stroke-width="3.6" stroke-linecap="round"/>' +
         '<path d="M107,46 C110,38 114,32 118,29" fill="none" stroke="var(--fur-dark)" stroke-width="3.2" stroke-linecap="round"/>',
  head:
    '<circle data-part="skull" cx="100" cy="72" r="35" fill="var(--fur)"/>' +
    '<ellipse cx="86" cy="58" rx="11" ry="6" fill="#fff" opacity=".2" transform="rotate(-18 86 58)"/>' +
    '<ellipse cx="72" cy="84" rx="7" ry="4.6" fill="var(--pink)" opacity=".55"/>' +
    '<ellipse cx="128" cy="84" rx="7" ry="4.6" fill="var(--pink)" opacity=".55"/>' +
    '<path d="M87,85 C93,81.5 107,81.5 113,85 C109,94 104,101 100,104 C96,101 91,94 87,85 Z" fill="var(--beak)"/>' +
    '<path d="M89,88.5 C95,90.5 105,90.5 111,88.5" fill="none" stroke="#E5812A" stroke-width="1.6" stroke-linecap="round"/>' +
    '<path d="M93,85.5 C96,84.4 100,84.2 102.5,84.8" fill="none" stroke="#FFD9A8" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>',
  eyes: eyesFor(100, 72, 5.2, 5.2, 'var(--ink)', 'var(--ink)', 1.9),
  sit: {
    hipY: 174, shadowY: 176, shadowRx: 30,
    body: '<g data-part="body"><ellipse cx="100" cy="135" rx="41" ry="38" fill="var(--fur)" stroke="var(--outline)" stroke-width="2.4"/></g>',
    belly: '<ellipse data-part="belly" cx="100" cy="145" rx="26" ry="24" fill="var(--fur-light)" opacity=".7"/>',
    torsoExtra: WING('l', 134) + WING('r', 134) + CHICK_LEGS(166, 171),
  },
  stand: {
    hipY: 166, shadowY: 177, shadowRx: 28,
    body: '<g data-part="body"><ellipse cx="100" cy="131" rx="35" ry="35" fill="var(--fur)" stroke="var(--outline)" stroke-width="2.4"/></g>',
    belly: '<ellipse data-part="belly" cx="100" cy="140" rx="22" ry="22" fill="var(--fur-light)" opacity=".7"/>',
    torsoExtra: WING('l', 131) + WING('r', 131) + CHICK_LEGS(160, 171),
  },
  ly: {
    hipY: 174, shadowY: 177, shadowRx: 36,
    body: '<g data-part="body"><ellipse cx="100" cy="136" rx="42" ry="40" fill="var(--fur)" stroke="var(--outline)" stroke-width="2.4"/></g>',
    belly: '<ellipse data-part="belly" cx="100" cy="145" rx="26" ry="24" fill="var(--fur-light)" opacity=".7"/>',
    torsoExtra: WING('l', 134) + WING('r', 134) + CHICK_LEGS(168, 171),
  },
};

/* ============================================================
   🐨 考拉 —— 灰毛 / 大圆耳 / 大鼻 / 短尾 / 圆胖
   ============================================================ */
const KOALA = {
  key: 'koala', name: '考拉', emoji: '🐨',
  vars: {
    '--fur': '#C3C1BA', '--fur-dark': '#9C9A92', '--fur-light': '#E2E0DA', '--belly': '#F2F0EB',
    '--pink': '#FFB3C0', '--ink': '#3B2A20', '--nose': '#3A3A44', '--foot': '#AEB7C2',
    '--limb': '#AEB7C2', '--outline': '#5F6874',
    '--eye-x': '100px', '--eye-y': '74px',
    '--tail-x': '147px', '--tail-y': '152px',
    '--ear-l-x': '80px', '--ear-l-y': '48px',
    '--legs-x': '100px', '--legs-y': '150px',
    '--sky1': '#BFE3F5', '--sky2': '#EAF7FF', '--grass1': '#A8DE96', '--grass2': '#74C67E',
    '--sun': '#FFD34D', '--tree': '#4F9C6E',
  },
  sceneExtra: '<g opacity=".92"><path d="M160,174 V118" stroke="#7E8B6E" stroke-width="5" stroke-linecap="round"/>' +
              '<path d="M160,132 q-14,-6 -22,-16 M160,140 q14,-6 22,-16 M160,148 q-14,-6 -22,-16" fill="none" stroke="#6FA46A" stroke-width="6" stroke-linecap="round"/></g>',
  tail: '<ellipse data-part="tail" cx="154" cy="150" rx="8.5" ry="7.5" transform="rotate(-18 154 150)" ' +
        'fill="var(--fur-dark)" stroke="var(--outline)" stroke-width="2"/>' +
        '<ellipse cx="151" cy="148" rx="3.4" ry="2.8" fill="var(--fur-light)" opacity=".5"/>',
  earL: '<circle cx="66" cy="62" r="22" fill="var(--fur)"/>' +
        '<circle cx="66" cy="62" r="13" fill="var(--pink)" opacity=".45"/>',
  head:
    '<circle data-part="skull" cx="100" cy="74" r="34" fill="var(--fur)"/>' +
    '<ellipse cx="86" cy="60" rx="12" ry="7" fill="#fff" opacity=".14" transform="rotate(-18 86 60)"/>' +
    '<ellipse cx="76" cy="90" rx="9" ry="6" fill="var(--fur-dark)" opacity=".45"/>' +
    '<ellipse cx="124" cy="90" rx="9" ry="6" fill="var(--fur-dark)" opacity=".45"/>' +
    '<ellipse cx="100" cy="90" rx="11" ry="9" fill="var(--nose)"/>' +
    '<ellipse cx="96.5" cy="87" rx="3" ry="2.2" fill="#fff" opacity=".38"/>' +
    '<path d="M100,98 Q95,104 90,100 M100,98 Q105,104 110,100" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/>',
  eyes: eyesFor(100, 74, 4.8, 5.6, 'var(--ink)', 'var(--ink)', 1.7),
  sit: {
    hipY: 174, shadowY: 176, shadowRx: 42,
    armXY: [81, 96], hindXY: [64, 146],
    body: '<g data-part="body"><path d="M100,90 C129,90 145,117 145,143 C145,165 126,174 100,174 C74,174 55,165 55,143 C55,117 71,90 100,90 Z" fill="var(--fur)"/></g>',
    belly: '<ellipse data-part="belly" cx="100" cy="146" rx="20" ry="18" fill="var(--belly)"/>',
    torsoExtra: hindLegs(64, 146, 12, 21, 'var(--fur-dark)') + hindFeet(64, 169, 11.5, 6.5, 'soft', '#C8CDD4'),
    arm: armAt(81, 96, 66, 124, 79, 158, 14.5, 12),
    paw: pawAt(79, 168, 10, 7.8, 'soft'),
  },
  stand: {
    hipY: 157, shadowY: 176, shadowRx: 38,
    armXY: [79, 96], hindXY: [72, 141],
    body: '<g data-part="body"><path d="M100,90 C126,90 138,113 139,139 C139,151 124,157 100,157 C76,157 61,151 61,139 C62,113 74,90 100,90 Z" fill="var(--fur)"/></g>',
    belly: '<ellipse data-part="belly" cx="100" cy="134" rx="18" ry="16" fill="var(--belly)"/>',
    torsoExtra: hindLegs(72, 141, 11.5, 19, 'var(--fur-dark)') + hindFeet(72, 170, 11.5, 6, 'soft', '#C8CDD4'),
    arm: armAt(79, 96, 72, 128, 78, 163, 14, 11.5),
    paw: pawAt(78, 168, 10, 7.8, 'soft'),
  },
  ly: {
    hipY: 174, shadowY: 178, shadowRx: 48,
    armXY: [79, 100], hindXY: [54, 152],
    body: '<g data-part="body"><ellipse cx="100" cy="136" rx="48" ry="37" fill="var(--fur)"/></g>',
    belly: '<ellipse data-part="belly" cx="100" cy="146" rx="28" ry="21" fill="var(--belly)"/>',
    torsoExtra: hindLegs(54, 152, 12, 20, 'var(--fur-dark)') + hindFeet(54, 170, 11.5, 6.5, 'soft', '#C8CDD4'),
    arm: armAt(79, 100, 68, 128, 77, 160, 14.5, 11.5),
    paw: pawAt(77, 168, 10, 7.8, 'soft'),
  },
};

/* ============================================================
   物种表 / 变量表
   ============================================================ */
const SPECIES_LIST = [CAT, DOG, RABBIT, PANDA, CHICK, KOALA];

export const SPECIES = SPECIES_LIST.map((p) => ({
  id: p.key, name: p.name, emoji: p.emoji, svg: buildSpeciesSvg(p),
}));

export function speciesOf(id) { return SPECIES.find((s) => s.id === id) || SPECIES[0]; }

export const SPECIES_VARS = Object.fromEntries(SPECIES_LIST.map((p) => [p.key, p.vars]));

/* ============================================================
   装饰 —— 坐标以猫头为基准（头顶 y=40 / 颈部 y=104）
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
   场景（乐园页外层用）
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

/* 供验收页使用：每只的 key / 三套姿态 key 都从 DOM 读，不在这里硬编码 */
export const POSE_KEYS = ['pose-sit', 'pose-stand', 'pose-ly'];
