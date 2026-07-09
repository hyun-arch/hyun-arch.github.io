// @ts-check
import { defineConfig } from 'astro/config';

// Aramirror static site. Add MDX/integrations later as the content grows.
export default defineConfig({
  // 실제 라이브 주소(gh-pages). 커스텀 도메인(aramirror.com) 연결되면 이 값만 교체.
  site: 'https://hyun-arch.github.io',
});
