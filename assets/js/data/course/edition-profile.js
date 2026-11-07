/**
 * edition-profile.js —— 教材版本口径包（P0）
 *
 * 主口径：人教版新课标。
 *   math    人教版小学数学（1~6 上下册）
 *   chinese 统编版小学语文（人教社出版）
 *   english 人教新起点（1~2）+ 人教 PEP（3~6），两套 sub-track 用 track 区分
 *   science 人教/鄂教版小学科学
 *
 * 版本差异只体现在数据（本文件 + volumes/*），不改代码、不改 kid 命名。
 * 换教材 = 换 profile 包。
 *
 * ★ 48 册目录在此登记；已建册为 volumes/ 下真实文件，未建册仅登记元数据，
 *   不填任何虚构单元名（单元内容由 P2~P5 按课目录包，P0 不造内容）。
 */

export const EDITION_ID = 'renjiao-newcurriculum';
export const EDITION_NAME = '人教版新课标';
export const GRADES = [1, 2, 3, 4, 5, 6];
export const TERMS = ['上册', '下册'];

export const SUBJECT_PROFILES = {
  math: { name: '数学', version: '人教版', publisher: '人民教育出版社', track: 'renjiao' },
  chinese: { name: '语文', version: '统编版', publisher: '人民教育出版社', track: 'tongbian' },
  english: {
    name: '英语', version: '人教新起点 / 人教 PEP', publisher: '人民教育出版社',
    // ★ 两个 sub-track 不合并：1~2 新起点，3~6 PEP
    tracks: { 1: 'newstart', 2: 'newstart', 3: 'pep', 4: 'pep', 5: 'pep', 6: 'pep' }
  },
  science: { name: '科学', version: '人教/鄂教版', publisher: '人民教育出版社 / 湖北教育出版社', track: 'renjiao-ejiao' }
};

export const SUBJECTS = Object.keys(SUBJECT_PROFILES);

/** 册键：math:3:上册 —— 稳定、可枚举、与文件路径一一对应 */
export function volumeKeyOf(subject, grade, term) {
  return `${subject}:${Number(grade)}:${term}`;
}

export function trackOf(subject, grade) {
  const p = SUBJECT_PROFILES[subject];
  if (!p) return '';
  return p.tracks ? p.tracks[Number(grade)] || '' : p.track;
}

/** 48 册目录（12 册 × 4 科 × 上下册）。不含单元内容，避免 P0 发明教材目录。 */
export function buildCatalog() {
  const list = [];
  for (const subject of SUBJECTS) {
    for (const grade of GRADES) {
      for (const term of TERMS) {
        list.push({
          key: volumeKeyOf(subject, grade, term),
          edition: EDITION_ID,
          subject,
          subjectName: SUBJECT_PROFILES[subject].name,
          grade,
          term,
          track: trackOf(subject, grade)
        });
      }
    }
  }
  return list;
}

export const VOLUME_CATALOG = buildCatalog();

/**
 * 出处必须由结构化索引生成：册（grade/term）+ 单元名。
 * ★ 不允许再把题目自带的 source 字符串当教材事实。
 */
export function sourceOf(volume, unitName) {
  const p = SUBJECT_PROFILES[volume.subject] || {};
  const g = volume.grade;
  const t = volume.term;
  if (volume.subject === 'english') {
    const label = volume.track === 'newstart' ? '人教新起点' : '人教 PEP';
    return `${label}英语${g}年级${t} · ${unitName}`;
  }
  const name = volume.subject === 'math' ? '数学'
    : volume.subject === 'chinese' ? '语文'
      : volume.subject === 'science' ? '科学' : (p.name || '');
  const version = volume.subject === 'math' ? '人教版'
    : volume.subject === 'chinese' ? '统编版'
      : volume.subject === 'science' ? '人教/鄂教' : '';
  return `${version}${name}${g}年级${t} · ${unitName}`;
}

/** 已建册清单（P0 只把 v4 单册骨架按 metaGrade/metaTerm 拆成 4 册） */
export const BUILT_VOLUME_KEYS = [
  'math:2:上册', 'math:2:下册', 'math:3:上册', 'math:3:下册'
];

export const ID_NAMING = {
  version: 'v5-id-1',
  editionAbbr: { 'renjiao-newcurriculum': 'rj' },
  unit: '{editionAbbr}-{subject}-g{grade}-{up|down}-u{2位}',
  lesson: '{unitId}-l{2位}',
  knowledge: '{lessonId}-k{2位}',
  question: '{knowledgeId}-s{2位}-{gen|static-01}'
};
