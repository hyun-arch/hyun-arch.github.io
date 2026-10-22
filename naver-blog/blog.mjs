#!/usr/bin/env node
// 네이버 블로그 — 글감 고르기부터 발행까지.
//
//   node naver-blog/blog.mjs 저울 "두피진단기 가격" --검색 1900 --경쟁 8400 --시즌 2.5
//   node naver-blog/blog.mjs 쓰기 "두피진단기 가격" --사실 facts.json
//   node naver-blog/blog.mjs 검사 posts/2026-10-17-두피진단기-가격
//   node naver-blog/blog.mjs 발행 posts/2026-10-17-두피진단기-가격
//   node naver-blog/blog.mjs 기준
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load, save } from './lib/standards.mjs';
import { weigh, rank } from './lib/scale.mjs';
import { lint, report } from './lib/lint.mjs';
import { draft, revise } from './lib/write.mjs';
import { toNaver } from './lib/tonaver.mjs';
import { route, assign, 카테고리표 } from './lib/route.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const cmd = args[0];
const val = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 && args[i+1] ? args[i+1] : d; };
const num = (n) => { const v = val(n); return v === undefined ? undefined : Number(v); };
const slug = (s) => s.trim().replace(/\s+/g, '-').replace(/[^\w가-힣-]/g, '');

const dim = (s) => '\x1b[2m' + s + '\x1b[0m';
const ok  = (s) => '\x1b[32m' + s + '\x1b[0m';
const bad = (s) => '\x1b[31m' + s + '\x1b[0m';

function postDir(name) {
  return path.isAbsolute(name) ? name : path.join(HERE, name.startsWith('posts/') ? name : 'posts/' + name);
}
function readPost(dir) {
  const md = path.join(dir, 'post.md');
  if (!fs.existsSync(md)) throw new Error('글이 없어요: ' + dir);
  const raw = fs.readFileSync(md, 'utf8');
  const meta = fs.existsSync(path.join(dir, 'meta.json'))
    ? JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8')) : {};
  const facts = fs.existsSync(path.join(dir, 'facts.json'))
    ? JSON.parse(fs.readFileSync(path.join(dir, 'facts.json'), 'utf8')) : null;
  const title = (raw.match(/^#\s+(.+)$/m) || [, meta.title || ''])[1];
  return { ...meta, title, body: raw.replace(/^#\s+.+\n+/, ''), facts, dir };
}

switch (cmd) {
  case '저울': {
    const kw = args[1];
    if (!kw) { console.log('\n  쓰는 법: blog.mjs 저울 "키워드" --검색 1900 --경쟁 8400 [--시즌 2.5] [--트렌드 0.7]\n'); break; }
    const r = weigh({ keyword: kw, monthlySearch: num('검색'), rivalPosts: num('경쟁'),
                      seasonRatio: num('시즌'), trend: num('트렌드') });
    console.log('');
    console.log(`  ${r.keyword}  ${r.verdict === '탈락' ? bad(r.verdict) : ok(r.verdict)}  ${r.score ?? '-'}점`);
    console.log(`  ${r.why}`);
    r.notes.forEach((n) => console.log(dim('    · ' + n)));
    console.log('');
    break;
  }

  case '쓰기': {
    const kw = args[1];
    if (!kw) { console.log('\n  쓰는 법: blog.mjs 쓰기 "키워드" [--사실 facts.json] [--각도 "..."]\n'); break; }
    const factsPath = val('사실');
    const facts = factsPath && fs.existsSync(factsPath) ? JSON.parse(fs.readFileSync(factsPath, 'utf8')) : {};
    // 링크는 글 쓰기 '전에' 정한다 — 강의의 '링크 먼저' 장치.
    // 다 쓰고 나서 끼워 넣으면 어색해진다.
    const links = [];
    if (val('링크')) links.push({ label: val('링크이름', '자세히 보기'), url: val('링크') });
    for (const [k, v] of Object.entries(facts)) {
      if (typeof v === 'string' && /^https?:\/\//.test(v)) links.push({ label: k, url: v });
    }

    console.log(dim('\n  초고를 쓰는 중… (Claude Code 가 씁니다)'));
    let post = await draft({ keyword: kw, facts, links, angle: val('각도', '') });
    post.links = links;

    // 검사 → 고치기를 최대 두 번
    for (let i = 0; i < 2; i++) {
      const r = lint(post);
      if (r.ok) break;
      console.log(dim(`  검사에서 ${r.fail.length}건 걸림 — 고쳐 쓰는 중…`));
      post = await revise(post, r);
      post.links = links;
    }
    const final = lint(post);

    const dir = path.join(HERE, 'posts', new Date().toISOString().slice(0,10) + '-' + slug(kw));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'post.md'), '# ' + post.title + '\n\n' + post.body + '\n');
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(
      { keyword: kw, title: post.title, createdAt: new Date().toISOString(), lint: { score: final.score, ok: final.ok } }, null, 2));
    if (Object.keys(facts).length) fs.writeFileSync(path.join(dir, 'facts.json'), JSON.stringify(facts, null, 2));

    console.log('\n  ' + post.title);
    console.log(report(final));
    console.log(dim('\n  저장  ' + path.relative(process.cwd(), dir) + '\n'));
    break;
  }

  case '검사': {
    const dir = postDir(args[1] || '');
    const post = readPost(dir);
    console.log('\n  ' + post.title);
    console.log(report(lint(post)));
    console.log('');
    break;
  }

  case '발행':
  case '임시저장': {
    const isDraft = cmd === '임시저장';
    const dir = postDir(args[1] || '');
    const post = readPost(dir);
    const r = lint(post);
    if (!r.ok) {
      console.log('\n  ' + bad(`검사를 통과하지 못했어요. ${isDraft ? '임시저장하지' : '발행하지'} 않습니다.`));
      console.log(report(r)); console.log('');
      process.exit(1);
    }
    const cat = assign(post);
    console.log(dim('\n  검사 통과.'));
    console.log(`  분류  ${cat.no} ${cat.대분류}${cat.중분류 ? ' / ' + cat.중분류 : ''}   번호 ${cat.번호}`);
    if (cat.근거.length) console.log(dim('  근거  ' + cat.근거.join(', ')));
    console.log(dim(isDraft ? '  네이버에 임시저장합니다… (발행 버튼은 누르지 않습니다)' : '  네이버에 올립니다…'));
    const { publish } = await import('../publish/lib/engine.mjs');
    // 마크다운을 그대로 보내면 에디터에 ## 과 ** 가 글자로 남는다. 블록으로 바꿔 보낸다.
    const conv = toNaver(post.body, dir);
    if (conv.missing.length)
      console.log(dim(`  이미지 ${conv.missing.length}개를 못 올립니다: ${conv.missing.join(', ')}`));
    console.log(dim(`  본문 ${conv.blocks.filter(b => b.type === 'text').length}덩이 · 사진 ${conv.images.length}장`));
    const res = await publish({ text: conv.text, blocks: conv.blocks, title: post.title, to: 'naver', files: [],
                    category: cat.중분류 ? `${cat.no} ${cat.중분류}` : `${cat.no} ${cat.대분류}`,
                    serial: cat.번호, draft: isDraft });
    fs.writeFileSync(path.join(dir, isDraft ? 'drafted.json' : 'published.json'),
      JSON.stringify({ at: new Date().toISOString(), 분류: cat, 임시저장: isDraft, 결과: res }, null, 2));
    // 결과를 보고 말한다 — 실패했는데 "완료"라고 찍으면 그게 제일 나쁘다
    const ok = Array.isArray(res) ? res.every((r) => r && r.ok !== false) : res?.ok !== false;
    if (!ok) {
      console.log('\n  ' + bad(isDraft ? '임시저장에 실패했습니다.' : '발행에 실패했습니다.'));
      process.exitCode = 1;
    } else if (isDraft) {
      console.log(dim('  임시저장 완료. 네이버 글쓰기 > 저장 글에서 확인하고 직접 발행하세요.'));
    }
    console.log('');
    break;
  }

  case '분류': {
    const asPath = args[1] && (args[1].startsWith('posts/') || fs.existsSync(postDir(args[1])));
    const post = asPath ? readPost(postDir(args[1])) : { title: args.slice(1).join(' '), body: '' };
    if (!post.title) { console.log('\n  쓰는 법: blog.mjs 분류 "제목" | blog.mjs 분류 posts/…\n'); break; }
    const r = route(post);
    console.log('');
    console.log(`  ${post.title}`);
    console.log(`  → ${r.no} ${r.대분류}${r.중분류 ? ' / ' + r.중분류 : ''}  확신 ${(r.확신 * 100).toFixed(0)}%`);
    if (r.근거.length) console.log(dim('    근거  ' + r.근거.join(', ')));
    for (const c of r.후보) console.log(dim(`    다음 후보  ${c.no} ${c.중분류 || c.대분류}`));
    console.log('');
    break;
  }

  case '기준': {
    const s = load();
    console.log('\n  내 기준  ' + dim('(' + (s.기준선.측정일 || '아직 실측 전') + ')'));
    console.log(`    경쟁 글 상한     ${s.기준선.경쟁글_상한.toLocaleString()}개`);
    console.log(`    최소 월 검색량   ${s.기준선.최소_월검색량.toLocaleString()}회`);
    console.log(`    황금비 합격선    ${s.기준선.황금비_합격선}`);
    console.log(`    제목             ${s.글_규칙.제목_글자수.join('~')}자`);
    console.log(`    본문             ${s.글_규칙.본문_권장글자.join('~')}자`);
    console.log(`    이미지           ${s.글_규칙.이미지_최소}장 이상`);
    console.log(dim('\n  이 숫자는 밤 루틴이 내 실측으로 고쳐 씁니다.\n'));
    break;
  }

  default:
    console.log(`
  네이버 블로그

    저울   글감이 쓸 만한지 달아 본다
    쓰기   초고를 쓰고 검사까지 돌린다
    검사   내 기준을 지켰는지 본다
    발행       검사를 통과한 글만 올린다
    임시저장   검사를 통과한 글을 네이버에 임시저장만 한다 (발행 버튼은 안 누름)
    기준   지금 내 기준 보기
`);
}
