// 오픈빌더에 올리기 전에 내 컴퓨터에서 먼저 돌려 보는 서버.
//   node kakao-skill/serve.mjs      →  http://localhost:8787/api/skill
import http from 'node:http';
import skill from './api/skill.js';
import health from './api/health.js';

const PORT = process.env.PORT || 8787;
http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  const shim = { method: req.method, body: raw ? JSON.parse(raw) : {} };
  const out = { status(c) { this.code = c; return this; }, json(j) { this.payload = j; return this; } };
  try {
    if (req.url.startsWith('/api/health')) health(shim, out);
    else await skill(shim, out);
    res.writeHead(out.code || 200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(out.payload));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(e.message) }));
  }
}).listen(PORT, () => console.log('카카오 스킬 서버: http://localhost:' + PORT + '/api/skill'));
