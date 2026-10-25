// 원고 24편을 아람휴비스 블로그로 옮긴다. 창 하나로 끝까지.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const BASE = "/Users/aram/Desktop/project/14. 나만의 os/아람미러(hyun-arch.github.io)";
const { toNaver } = await import(`file://${BASE}/naver-blog/lib/tonaver.mjs`);
const { 자리들, 보기 } = await import(`file://${BASE}/naver-blog/lib/slot.mjs`);

const 기록 = "/tmp/aramhuvis-move.log";
const 적기 = (...a) => { const l = a.join(" "); console.log(l);
  try { fs.appendFileSync(기록, `[${new Date().toTimeString().slice(0,8)}] ${l}\n`); } catch {} };

// 이미 옮긴 것 — 끝낸목록.json 에 쌓는다. 끊겨도 이어서 돌 수 있게.
const 끝낸파일 = "/tmp/aramhuvis-done.json";
const 끝낸 = fs.existsSync(끝낸파일) ? JSON.parse(fs.readFileSync(끝낸파일, "utf8")) : [];

const 뿌리 = path.join(BASE, "naver-blog/posts");
const 전부 = fs.readdirSync(뿌리).sort()
  .filter((d) => fs.existsSync(path.join(뿌리, d, "post.md")));
const 할것 = 전부.filter((d) => !끝낸.includes(d));

적기(`원고 ${전부.length}편 · 이미 옮김 ${끝낸.length}편 · 남은 것 ${할것.length}편`);
if (!할것.length) { 적기("다 옮겼습니다."); process.exit(0); }

// 이미 쓴 예약 자리를 피한다. 끝낸 글 수만큼 자리를 건너뛴다.
// (안 하면 10-25 06:30 자리를 또 잡아 두 글이 같은 시각에 겹친다)
const 때들 = 자리들(할것.length + 끝낸.length).slice(끝낸.length);
적기(`예약: ${보기(때들[0])} ~ ${보기(때들[때들.length-1])}`);

const task = await takeOverTaskSpace(1);
const page = task.page("p1");

const 붙이기 = (p) => execFileSync("osascript", ["-e",
  `set the clipboard to (read (POSIX file "${p.replace(/"/g, '\\"')}") as «class PNGf»)`]);

let 됨 = 0; const 실패 = [];

for (const [n, d] of 할것.entries()) {
  const dir = path.join(뿌리, d);
  const raw = fs.readFileSync(path.join(dir, "post.md"), "utf8");
  const 제목 = (raw.match(/^#\s+(.+)$/m) || [, ""])[1].trim();
  const 본문 = raw.replace(/^#\s+.+\n+/, "");
  const conv = toNaver(본문, dir);
  const 때 = 때들[n];
  적기(`\n▶ ${n+1}/${할것.length} ${제목.slice(0,34)}  → ${보기(때)}`);

  try {
    await page.goto("https://blog.naver.com/aramhuvis/postwrite");
    await page.waitForTimeout(9000);

    // 「작성 중인 글」 팝업 치우기
    for (let i = 0; i < 4; i++) {
      const c = await page.evaluate(() => {
        const b = [...document.querySelectorAll("button,a")]
          .find((e) => /^(취소|닫기)$/.test((e.innerText||"").trim()) && e.offsetParent);
        if (!b) return false; b.click(); return true;
      });
      if (!c) break;
      await page.waitForTimeout(1800);
    }
    await page.evaluate(() => {
      document.querySelectorAll('.se-popup-dim,[class*="popup-dim"],.se-help-panel')
        .forEach((e) => (e.style.display = "none"));
      const x = [...document.querySelectorAll("button")]
        .find((e) => /도움말 닫기|닫기/.test(e.getAttribute("aria-label")||"") && e.offsetParent);
      if (x) x.click();
    });
    await page.waitForTimeout(1500);

    // ── 제목 — 숨은 입력 버퍼라 좌표로 눌러야 한다
    const tp = await page.evaluate(() => {
      const t = document.querySelector(".se-section-documentTitle .se-module-text, .se-title-text");
      if (!t) return null;
      const r = t.getBoundingClientRect();
      return { x: Math.round(r.x + 40), y: Math.round(r.y + r.height/2) };
    });
    if (!tp) throw new Error("제목 칸을 못 찾음");
    await page.mouse.click(tp.x, tp.y, { label: "제목 칸" });
    await page.waitForTimeout(900);
    await page.keyboard.type(제목, { delay: 14 });
    await page.waitForTimeout(900);

    // ── 본문
    const bp = await page.evaluate(() => {
      const b = [...document.querySelectorAll(".se-component.se-text .se-text-paragraph")].pop();
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { x: Math.round(r.x + 30), y: Math.round(r.y + r.height/2) };
    });
    if (!bp) throw new Error("본문 칸을 못 찾음");
    await page.mouse.click(bp.x, bp.y, { label: "본문 칸" });
    await page.waitForTimeout(900);

    let 사진 = 0;
    for (const [i, b] of conv.blocks.entries()) {
      if (b.type === "image") {
        if (!fs.existsSync(b.path)) { 적기(`   (사진 없음 ${path.basename(b.path)})`); continue; }
        붙이기(path.resolve(b.path));
        await page.keyboard.press("ControlOrMeta+v");
        await page.waitForTimeout(7000);
        await page.keyboard.press("End");
        await page.keyboard.press("Enter");
        사진++;
        continue;
      }
      if (i > 0 && conv.blocks[i-1].type === "text") await page.keyboard.press("Enter");
      for (const line of String(b.text||"").split("\n")) {
        await page.keyboard.type(line, { delay: 6 });
        await page.keyboard.press("Enter");
      }
    }

    // 본문 컨테이너는 **.se-canvas** 다. .se-main-container 는 새 글쓰기 화면에 없다.
    // (2026-10-24 — 이걸 틀려서 23편을 "0자"로 읽고 전부 안 올렸다)
    const 들어간것 = await page.evaluate(() => {
      const ps = [...document.querySelectorAll(".se-component.se-text .se-text-paragraph")];
      return {
        본문길이: ps.map((x) => x.innerText).join("\n").length,
        단락수: ps.length,
        캔버스: (document.querySelector(".se-canvas")?.innerText || "").length,
        그림수: document.querySelectorAll(".se-component.se-image").length,
      };
    });
    적기(`   넣음 — 글자 ${들어간것.본문길이} · 단락 ${들어간것.단락수} · 사진 ${들어간것.그림수}/${conv.images.length}장`);
    if (들어간것.본문길이 < 600) throw new Error(`본문이 너무 짧다 (${들어간것.본문길이}자)`);
    if (들어간것.그림수 === 0) throw new Error("사진이 하나도 안 들어갔다");
    if (conv.images.length && 들어간것.그림수 < conv.images.length)
      적기(`   ! 사진 ${conv.images.length}장 중 ${들어간것.그림수}장만 들어갔다`);

    // ── 첫 그림을 대표로
    await page.evaluate(() => {
      const g = document.querySelector(".se-component.se-image");
      if (!g) return;
      g.scrollIntoView({ block: "center" });
      const b = g.querySelector("button.se-set-rep-image-button");
      if (b && !/se-is-selected/.test(b.className)) b.click();
    });
    await page.waitForTimeout(1200);

    // ── 발행 레이어
    await page.evaluate(() => {
      const b = document.querySelector('button[data-click-area="tpb.publish"]');
      if (b) b.click();
    });
    await page.waitForTimeout(3000);

    // ── 예약 ──────────────────────────────────────────────
    // 두 가지를 틀렸었다 (2026-10-24):
    //   ① 라디오를 JS click() 으로 눌렀다 → React 가 안 받는다. **좌표로 눌러야** 켜진다.
    //   ② 날짜 칸을 아예 안 건드렸다 → 22편이 전부 같은 날 06:30/16:30 에 겹칠 뻔했다.
    //      날짜 칸은 readonly 다. 눌러서 뜨는 jQuery UI 달력에서 골라야 한다.
    const rp = await page.evaluate(() => {
      const r = document.querySelector("#radio_time2");
      if (!r) return null;
      const el = document.querySelector('label[for="radio_time2"]') || r.parentElement || r;
      el.scrollIntoView({ block: "center" });
      const b = el.getBoundingClientRect();
      return { x: Math.round(b.x + Math.min(20, b.width / 2)), y: Math.round(b.y + b.height / 2) };
    });
    if (!rp) throw new Error("예약 라디오를 못 찾음");
    await page.mouse.click(rp.x, rp.y, { label: "예약 라디오" });
    await page.waitForTimeout(2500);

    // 날짜 — 달력을 열어 목표 달까지 넘기고 일을 누른다
    const 날짜자리 = await page.evaluate(() => {
      const d = document.querySelector("input.input_date__UwKAB");
      if (!d) return null;
      d.scrollIntoView({ block: "center" });
      const r = d.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    });
    if (!날짜자리) throw new Error("날짜 칸이 안 나타남 (라디오가 안 켜졌다)");
    await page.mouse.click(날짜자리.x, 날짜자리.y, { label: "날짜 칸" });
    await page.waitForTimeout(1600);

    const 목표 = { y: 때.getFullYear(), m: 때.getMonth() + 1, d: 때.getDate() };
    for (let k = 0; k < 20; k += 1) {
      const now = await page.evaluate(() => {
        const t = document.querySelector(".ui-datepicker-title");
        if (!t) return null;
        const m = (t.innerText || "").match(/(\d{4})년?\s*(\d{1,2})월?/);
        return m ? { y: +m[1], m: +m[2] } : null;
      });
      if (!now) throw new Error("달력이 안 열림");
      if (now.y === 목표.y && now.m === 목표.m) break;
      const 앞으로 = (목표.y * 12 + 목표.m) > (now.y * 12 + now.m);
      const bp = await page.evaluate((앞) => {
        const b = document.querySelector(앞 ? ".ui-datepicker-next" : ".ui-datepicker-prev");
        if (!b) return null;
        const r = b.getBoundingClientRect();
        return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
      }, 앞으로);
      if (!bp) throw new Error("달 넘김 단추 없음");
      await page.mouse.click(bp.x, bp.y, { label: 앞으로 ? "다음 달" : "이전 달" });
      await page.waitForTimeout(900);
      if (k === 19) throw new Error(`달력을 ${목표.y}-${목표.m} 로 못 옮김`);
    }
    const dp = await page.evaluate((d) => {
      const b = [...document.querySelectorAll(".ui-datepicker .ui-state-default")]
        .find((e) => e.offsetParent && (e.innerText || "").trim() === String(d));
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
    }, 목표.d);
    if (!dp) throw new Error(`달력에서 ${목표.d}일을 못 찾음`);
    await page.mouse.click(dp.x, dp.y, { label: `${목표.d}일` });
    await page.waitForTimeout(1500);

    // 시 · 분
    const 예약결과 = await page.evaluate(({ 시, 분 }) => {
      const ss = [...document.querySelectorAll("select")].filter((e) => e.offsetParent);
      if (ss.length < 2) return { 오류: `select ${ss.length}개` };
      const put = (s, v) => { s.value = v;
        s.dispatchEvent(new Event("input", { bubbles: true }));
        s.dispatchEvent(new Event("change", { bubbles: true })); return s.value; };
      return { 날짜: document.querySelector("input.input_date__UwKAB")?.value,
               시: put(ss[0], 시), 분: put(ss[1], 분) };
    }, { 시: String(때.getHours()).padStart(2, "0"), 분: String(Math.floor(때.getMinutes() / 10) * 10).padStart(2, "0") });

    // **맞게 들어갔는지 확인한다.** 틀리면 발행하지 않는다.
    const 바람 = `${목표.y}. ${String(목표.m).padStart(2,"0")}. ${String(목표.d).padStart(2,"0")}`;
    const 실제 = String(예약결과.날짜 || "").replace(/\s+/g, " ").trim();
    const 같나 = 실제.replace(/\D+/g, "-") === 바람.replace(/\D+/g, "-");
    if (!같나 || 예약결과.시 !== String(때.getHours()).padStart(2,"0"))
      throw new Error(`예약이 어긋남 — 바란 것 ${바람} ${때.getHours()}시 / 실제 ${실제} ${예약결과.시}시`);
    적기(`   예약 ${JSON.stringify(예약결과)}`);

    // 최종 발행
    const pr = await page.evaluate(() => {
      const b = document.querySelector('button[data-click-area="tpb*i.publish"]')
        || [...document.querySelectorAll("button")]
             .filter((e) => /^발행$/.test((e.innerText||"").trim()) && e.offsetParent).pop();
      if (!b) return "단추 없음"; b.click(); return "눌렀음";
    });
    if (pr !== "눌렀음") throw new Error("발행 단추를 못 찾음");

    let 주소 = "";
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(2000);
      주소 = await page.url();
      if (!/postwrite/i.test(주소)) break;
    }
    if (/postwrite/i.test(주소)) throw new Error("발행 확인 안 됨");
    const no = (주소.match(/logNo=(\d+)/) || [, "?"])[1];
    적기(`   ✓ ${no}`);
    끝낸.push(d);
    fs.writeFileSync(끝낸파일, JSON.stringify(끝낸, null, 2));
    됨++;
  } catch (e) {
    const 왜 = String(e.message).split("\n")[0].slice(0, 90);
    적기(`   ✗ ${왜}`);
    실패.push([d, 왜]);
  }
}

적기(`\n== ${됨}편 옮겼습니다. 실패 ${실패.length}편`);
실패.forEach(([d, 왜]) => 적기(`   ✗ ${d} — ${왜}`));
