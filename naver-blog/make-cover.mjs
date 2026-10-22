// 글 → 대표 이미지(1080×1080 브랜드 카드) 1장 생성
//   node naver-blog/make-cover.mjs "<제목>" <brand> <출력.png> ["<한 줄 후킹>"]
//   brand: relai | ellapiel | medicustom | b2b
import { chromium } from "playwright";

const [,, title = "", brand = "ellapiel", out = "cover.png", hook = ""] = process.argv;
if (!title || !out) { console.error('사용: make-cover.mjs "<제목>" <brand> <out.png> ["<후킹>"]'); process.exit(1); }

const BR = {
  relai:     { name: "릴라이 · 두피",      bg: "#0f766e", bg2: "#115e59", ink: "#ecfdf5", chip: "#5eead4" },
  ellapiel:  { name: "엘라피엘 · 피부",    bg: "#9d174d", bg2: "#831843", ink: "#fff1f2", chip: "#fda4af" },
  medicustom:{ name: "메디커스텀 · 손상피부", bg: "#1e3a8a", bg2: "#1e40af", ink: "#eff6ff", chip: "#93c5fd" },
  b2b:       { name: "아람휴비스 · B2B",   bg: "#1f2937", bg2: "#111827", ink: "#f9fafb", chip: "#cbd5e1" },
}[brand] || null;
if (!BR) { console.error("brand는 relai|ellapiel|medicustom|b2b 중 하나"); process.exit(1); }

const esc = (s) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<style>
  * { margin:0; box-sizing:border-box; }
  html,body { width:1080px; height:1080px; }
  body { font-family:"Apple SD Gothic Neo","Noto Sans KR",sans-serif;
    background:linear-gradient(135deg,${BR.bg} 0%,${BR.bg2} 100%); color:${BR.ink};
    padding:96px 92px; display:flex; flex-direction:column; justify-content:space-between; }
  .kicker { font-size:30px; letter-spacing:4px; font-weight:700; color:${BR.chip}; }
  .title { font-size:88px; line-height:1.18; font-weight:800; letter-spacing:-1.5px; text-wrap:balance; }
  .hook { font-size:40px; line-height:1.5; font-weight:500; opacity:.92; margin-top:28px; }
  .rule { width:120px; height:8px; background:${BR.chip}; border-radius:4px; margin:40px 0 0; }
  .foot { display:flex; justify-content:space-between; align-items:flex-end; font-size:30px; }
  .brand { font-weight:800; }
  .tag { opacity:.8; font-weight:600; }
</style></head><body>
  <div>
    <div class="kicker">측정 기반 · 아람휴비스</div>
    <div class="rule"></div>
  </div>
  <div>
    <div class="title">${esc(title)}</div>
    ${hook ? `<div class="hook">${esc(hook)}</div>` : ""}
  </div>
  <div class="foot"><div class="brand">${BR.name}</div><div class="tag">#측정으로_갈린다</div></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "networkidle" });
await page.screenshot({ path: out });
await browser.close();
console.log("생성:", out);
