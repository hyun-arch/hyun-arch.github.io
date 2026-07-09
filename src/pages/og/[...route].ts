import { OGImageRoute } from 'astro-og-canvas';

// ── 아라미러 OG 이미지 자동생성 (무기: 제목 → 공유카드 PNG, 빌드타임) ──
// 빌드 시 각 글의 프론트매터(title/description)로 /og/<slug>.png 를 자동 생성한다.
// 폰트는 저장소에 넣지 않고, 이 PC의 맑은 고딕을 빌드 때만 참조한다(로컬빌드 배포 전제).
// ⚠️ 클라우드 빌드로 옮기면 이 폰트 경로만 저장소 내 TTF로 교체하면 된다.

const FONT_BOLD = 'C:/Windows/Fonts/malgunbd.ttf';
const FONT_REG = 'C:/Windows/Fonts/malgun.ttf';

type Meta = { title: string; description?: string };

// 글 모음(빌드로그 + 에세이)의 프론트매터를 자동 수집한다.
const md = import.meta.glob<{ frontmatter: Meta }>(
  ['../build-logs/*.md', '../writings/*.md'],
  { eager: true }
);

const pages: Record<string, Meta> = {
  // 사이트 대표 카드
  home: { title: '아라미러 — AI는 나를 대신하지 않는다, 거울이 된다', description: '아람: 아름다운 사람. 매일의 생각을 자동으로 담는 개인 OS.' },
};

for (const [file, mod] of Object.entries(md)) {
  // '../build-logs/01-genesis.md' → 'build-logs/01-genesis'
  const key = file.replace('../', '').replace(/\.md$/, '');
  const fm = mod.frontmatter;
  if (fm?.title) pages[key] = { title: fm.title, description: fm.description };
}

export const { getStaticPaths, GET } = OGImageRoute({
  param: 'route',
  pages,
  getImageOptions: (_path, page: Meta) => ({
    title: page.title,
    description: page.description ?? '',
    // 흑요석 다크 + 코랄 포인트 (아라미러 브랜드)
    bgGradient: [
      [14, 12, 10],
      [26, 21, 18],
    ],
    border: { color: [194, 96, 59], width: 12, side: 'inline-start' },
    padding: 80,
    fonts: [FONT_BOLD, FONT_REG],
    font: {
      title: {
        color: [243, 237, 227],
        size: 64,
        weight: 'Bold',
        lineHeight: 1.25,
        families: ['Malgun Gothic'],
      },
      description: {
        color: [168, 158, 144],
        size: 32,
        lineHeight: 1.4,
        families: ['Malgun Gothic'],
      },
    },
  }),
});
