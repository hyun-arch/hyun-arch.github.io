// 한 글 → 전 채널 디스패처 (현황판)
//   사용:  node naver-blog/publish-all.mjs posts/2026-10-22-간호사-핸드크림
//         node naver-blog/publish-all.mjs posts/<글> --publish   (연결된 채널에 실제 발행)
//
// 원칙(이니 OS·케이 킷과 동일): 토큰은 publish/.env 에서만, 코드엔 안 박음.
// 발행 버튼은 사람이 — --publish 없이는 어떤 SNS에도 실제로 올리지 않는다(초안/현황만).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");                     // 아람미러 루트
const PUBLISH = path.resolve(ROOT, "../9. 이니_personal-os-starter/publish/publish.mjs");
const ENVFILE = path.resolve(path.dirname(PUBLISH), ".env");

const args = process.argv.slice(2);
const doPublish = args.includes("--publish");
const postDir = args.find((a) => !a.startsWith("--"));
if (!postDir) { console.error("글 폴더를 주세요. 예: node naver-blog/publish-all.mjs posts/2026-10-22-간호사-핸드크림"); process.exit(1); }
const dir = path.isAbsolute(postDir) ? postDir : path.join(HERE, postDir);
if (!fs.existsSync(dir)) { console.error("폴더 없음: " + dir); process.exit(1); }

const env = {};
if (fs.existsSync(ENVFILE)) for (const l of fs.readFileSync(ENVFILE, "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].trim();
}
const has = (...keys) => keys.every((k) => env[k]);
const read = (f) => { try { return fs.readFileSync(path.join(dir, f), "utf8"); } catch { return null; } };
const drafted = (() => { try { return JSON.parse(read("drafted.json")); } catch { return {}; } })();
const naverSaved = (drafted?.결과 || []).some((r) => r.key === "naver" && r.saved);

// 채널 정의: 소스 원고 · 연결 상태 · 발행 방법
const CH = [
  { 이름: "네이버 블로그", 소스: "post.md",            연결: naverSaved, 상태: naverSaved ? "임시저장됨 — 발행 버튼만" : "초고 필요", 방법: "반자동(브라우저)" },
  { 이름: "아람미러 사이트", 소스: "writings/*.md",       연결: fs.existsSync(path.join(ROOT, "src/pages/writings")), 상태: "writings/에 글 추가 시 배포하면 게시", 방법: "git push + 빌드" },
  { 이름: "스레드",         소스: "channels/threads.txt",  api: "threads",   토큰: has("THREADS_ACCESS_TOKEN", "THREADS_USER_ID") },
  { 이름: "인스타그램",     소스: "channels/instagram.md", api: "instagram", 토큰: has("IG_ACCESS_TOKEN", "IG_USER_ID") },
  { 이름: "링크드인",       소스: "channels/linkedin.md",  api: "linkedin",  토큰: has("LINKEDIN_ACCESS_TOKEN") },
];

console.log(`\n📡 전 채널 발행 현황 — ${path.basename(dir)}`);
console.log(`${doPublish ? "모드: 실제 발행(--publish) · 연결된 채널만" : "모드: 현황/초안만 (실제 발행 안 함)"}\n`);
console.log("채널            | 원고 | 연결 | 상태");
console.log("----------------|------|------|------------------------------------");

for (const c of CH) {
  const hasSrc = !!read(c.소스) || (c.소스.includes("*") && c.연결);
  let conn, note;
  if (c.api) {
    conn = c.미배선 ? "배선X" : (c.토큰 ? "연결됨" : "미연결");
    note = c.미배선 ? "X 배선을 publish.mjs에 추가하면 지원" : (c.토큰 ? "" : `계정 토큰 필요 (publish/${c.api}.md)`);
    if (c.토큰 && !c.미배선 && doPublish && hasSrc) {
      const r = spawnSync("node", [PUBLISH, c.api, "--file", path.join(dir, c.소스), "--publish"], { encoding: "utf8" });
      note = (r.stdout || r.stderr || "").trim().split("\n").pop();
    } else if (!doPublish && hasSrc) {
      note = note || "원고 준비됨 — 연결 후 자동발행 가능";
    }
  } else {
    conn = c.연결 ? "OK" : "-";
    note = c.상태;
  }
  console.log(
    `${c.이름.padEnd(14)}| ${(hasSrc ? "있음" : "없음").padEnd(4)} | ${String(conn).padEnd(4)} | ${note || ""}`
  );
}

const connectable = CH.filter((c) => c.api && !c.미배선);
const connected = connectable.filter((c) => c.토큰).length;
console.log(`\n요약: API 채널 ${connected}/${connectable.length} 연결됨.`);
if (connected < connectable.length) {
  console.log("→ 자동 동시발행을 켜려면: 각 SNS 토큰을 publish/.env 에 넣기 (사장님 1회, 계정 로그인).");
  console.log("   안내 파일: ../9. 이니_personal-os-starter/publish/{threads,instagram,linkedin}.md");
}
if (!doPublish) console.log("실제 발행:  위 명령에 --publish 추가 (연결된 채널만, 되돌리기 어려우니 확인 후).");
