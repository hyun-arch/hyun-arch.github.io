/* Aram Huvis OS — 실제로 돌아가는 회사 운영체제 (v1 프로토타입)
   데이터는 이 브라우저에 저장(localStorage). 다중 사용자 공유 DB는 다음 단계. */
'use strict';

// ---------- 가치 (헌법 L0) ----------
const VALUES = [
  { key:'v1', code:'V1', name:'본질을 본다', en:'True Seeing',   desc:'겉이 아니라 사람의 진짜를 본다 — 데이터로 정확히 + 사람으로서 깊이.', object:'"겉만 보고 판단한다"에 이의 가능' },
  { key:'v2', code:'V2', name:'안과 밖을 함께', en:'Inside & Out', desc:'외적 아름다움을 속(심리·영혼)의 아름다움과 잇는다.', object:'겉만 꾸미고 속을 해치는 결정에 이의 가능' },
  { key:'v3', code:'V3', name:'모두에게', en:'For Everyone',   desc:'일부가 아니라 전 세계 누구나 아름다워질 수 있게.', object:'소수만을 위한 방향에 이의 가능' },
  { key:'v4', code:'V4', name:'사람이 목적', en:'Human First',  desc:'기술·매출·직급이 아니라 사람이 중심. (가치>위계의 뿌리)', object:'사람을 수단으로 쓰는 결정에 이의 가능' },
  { key:'v5', code:'V5', name:'지속되는 진짜', en:'Lasting & Honest', desc:'일시적 치장이 아닌, 지속가능하고 정직한 아름다움.', object:'단기 눈속임·과장에 이의 가능' },
];
const valByKey = k => VALUES.find(v=>v.key===k) || VALUES[0];

// ---------- 저장소 ----------
const DB = {
  k:{ people:'ahos.people', props:'ahos.proposals', depts:'ahos.depts', assets:'ahos.assets', seeded:'ahos.seeded.v1' },
  get(key, def){ try{ return JSON.parse(localStorage.getItem(key)) ?? def; }catch(e){ return def; } },
  set(key, val){ localStorage.setItem(key, JSON.stringify(val)); },
  people(){ return DB.get(DB.k.people, []); },
  props(){ return DB.get(DB.k.props, []); },
  depts(){ return DB.get(DB.k.depts, []); },
  assets(){ return DB.get(DB.k.assets, []); },
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const nowISO = () => new Date().toISOString();
const fmt = iso => { const d=new Date(iso); const p=n=>String(n).padStart(2,'0');
  return `${d.getFullYear().toString().slice(2)}.${p(d.getMonth()+1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
const ago = iso => { const s=(Date.now()-new Date(iso))/1000;
  if(s<60)return'방금'; if(s<3600)return Math.floor(s/60)+'분 전'; if(s<86400)return Math.floor(s/3600)+'시간 전';
  return Math.floor(s/86400)+'일 전'; };
const esc = s => (s??'').toString().replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const initials = n => (n||'?').trim().slice(0,2);

// ---------- 시드 (예시 데이터) ----------
function seed(){
  if(DB.get(DB.k.seeded,false)) return;
  DB.set(DB.k.people, [
    {id:uid(), name:'김대표', team:'경영', dept:'경영관리', role:'CEO', goal:'전사 비전 정렬 · 가치 수호'},
    {id:uid(), name:'이연구', team:'맞춤화장품', dept:'R&D', role:'연구원', goal:'맞춤 처방 알고리즘 정확도 향상'},
    {id:uid(), name:'박마케팅', team:'마케팅', dept:'마케팅', role:'매니저', goal:'글로벌 진단-뷰티 스토리 확산'},
  ]);
  DB.set(DB.k.depts, [
    {id:uid(), name:'맞춤화장품 생산관리', lead:'이연구', process:'진단데이터 수신 → 처방 생성 → 조제 → 품질검사 → 출하. 각 단계 로그·책임자 지정.'},
    {id:uid(), name:'마케팅', lead:'박마케팅', process:'주간 콘텐츠 기획 → 승인 → 배포 → 성과 리뷰(가치 태깅).'},
  ]);
  DB.set(DB.k.assets, [
    {id:uid(), name:'맞춤화장품 생산관리 시스템', category:'프로그램', note:'진단→처방→생산 파이프라인. OS의 첫 심화영역.'},
    {id:uid(), name:'진단기기 라인업 스펙', category:'문서', note:'매출의 ~98% 차지하는 진단 디바이스 자산.'},
  ]);
  DB.set(DB.k.props, [
    { id:uid(), title:'신제품 패키지, 화려함보다 성분 투명성을 우선하자', valueKey:'v5', proposer:'박마케팅',
      evidence:'경쟁사 대비 재구매율은 "정직한 성분 표기" 그룹이 22% 높음(내부 설문 n=140). 단기 디자인 화려함은 초기 클릭만 올리고 신뢰는 만들지 못함.',
      status:'decided', createdAt:new Date(Date.now()-86400e3*3).toISOString(),
      comments:[
        {id:uid(),author:'이연구',stance:'for',text:'성분 데이터는 우리가 진단기업이라 강점. V1(본질)과도 맞음.',createdAt:new Date(Date.now()-86400e3*2.5).toISOString()},
        {id:uid(),author:'김대표',stance:'note',text:'직급이 아니라 근거로 간다. 데이터가 설득력 있음.',createdAt:new Date(Date.now()-86400e3*2).toISOString()},
      ],
      decision:{conclusion:'전 제품 패키지에 성분 투명성 우선 원칙 적용. 디자인팀 가이드 개정.',decidedBy:'합의(가치 근거)',dissent:'없음',decidedAt:new Date(Date.now()-86400e3*1.8).toISOString()} },
    { id:uid(), title:'맞춤화장품, 고가 라인만이 아니라 보급형도 함께 개발', valueKey:'v3', proposer:'이연구',
      evidence:'V3(모두에게)에 근거. 현재 로드맵은 프리미엄만. 진단 데이터 플랫폼의 강점은 규모에서 나옴 — 접근성이 곧 경쟁력.',
      status:'open', createdAt:new Date(Date.now()-3600e3*20).toISOString(),
      comments:[{id:uid(),author:'박마케팅',stance:'for',text:'글로벌 확산 스토리와 맞음.',createdAt:new Date(Date.now()-3600e3*18).toISOString()}],
      decision:null },
  ]);
  DB.set(DB.k.seeded, true);
}

// ---------- 라우터 ----------
const routes = ['home','decisions','values','people','ops','assets'];
const NAV = [
  {r:'home', ic:'🏠', label:'홈'},
  {r:'decisions', ic:'⚖️', label:'결정'},
  {r:'values', ic:'💎', label:'가치'},
  {r:'people', ic:'👤', label:'사람'},
  {r:'ops', ic:'🗂️', label:'운영'},
  {r:'assets', ic:'📦', label:'자산'},
];
function parseHash(){ const h=(location.hash||'#/home').replace(/^#\/?/,''); const [r,...rest]=h.split('/'); return {r:routes.includes(r)?r:'home', arg:rest.join('/')}; }
function go(path){ location.hash = '#/'+path; }

// ---------- 렌더 ----------
const app = () => document.getElementById('app');
function render(){
  const {r,arg} = parseHash();
  app().innerHTML = `
    ${sidebar(r)}
    <div class="main">
      ${topbar()}
      <div class="page-wrap">${view(r,arg)}</div>
    </div>
    ${tabbar(r)}
    ${['decisions','people','ops','assets'].includes(r)&&!arg ? `<button class="fab" data-fab="${r}">＋</button>`:''}
  `;
  bind(r,arg);
  window.scrollTo(0,0);
}
function sidebar(r){
  return `<aside class="sidebar">
    <div class="logo">Aram Huvis <b>OS</b></div>
    <div class="logo-sub">회사 운영체제 · v1</div>
    ${NAV.map(n=>`<div class="nav-item ${n.r===r?'active':''}" data-go="${n.r}"><span class="ic">${n.ic}</span>${n.label}</div>`).join('')}
    <div class="side-foot">가치가 위계를 이긴다.<br>근거가 직급을 이긴다.</div>
  </aside>`;
}
function topbar(){ return `<div class="topbar"><div class="t-logo">Aram Huvis <b>OS</b></div><span class="badge-demo">v1</span></div>`; }
function tabbar(r){ return `<nav class="tabbar">${NAV.map(n=>`<div class="tab ${n.r===r?'active':''}" data-go="${n.r}"><span class="ic">${n.ic}</span>${n.label}</div>`).join('')}</nav>`; }

function view(r,arg){
  if(r==='home') return vHome();
  if(r==='decisions') return arg ? vDecisionDetail(arg) : vDecisions();
  if(r==='values') return vValues();
  if(r==='people') return vPeople();
  if(r==='ops') return vOps();
  if(r==='assets') return vAssets();
  return vHome();
}

// ---- 홈/대시보드 ----
function vHome(){
  const props=DB.props(), open=props.filter(p=>p.status==='open'), decided=props.filter(p=>p.status==='decided');
  const people=DB.people();
  const dist=VALUES.map(v=>({v, n:props.filter(p=>p.valueKey===v.key).length}));
  const maxN=Math.max(1,...dist.map(d=>d.n));
  const feed=[...props].map(p=>({t:p.createdAt, txt:`<b>${esc(p.proposer)}</b>님이 제안 · ${esc(p.title)}`, r:'decisions/'+p.id}))
    .concat(decided.filter(p=>p.decision).map(p=>({t:p.decision.decidedAt, txt:`결정됨 · ${esc(p.title)}`, r:'decisions/'+p.id})))
    .sort((a,b)=>new Date(b.t)-new Date(a.t)).slice(0,6);
  return `
    <div class="page-head"><h1 class="page-title">홈</h1>
      <p class="page-desc">지금 회사가 무엇을 향해, 어떻게 결정하고 있는지 한눈에.</p></div>
    <div class="grid tiles">
      <div class="tile"><div class="num amber">${open.length}</div><div class="lbl">열린 제안</div></div>
      <div class="tile"><div class="num acc">${decided.length}</div><div class="lbl">내려진 결정</div></div>
      <div class="tile"><div class="num">${people.length}</div><div class="lbl">등록 인원</div></div>
      <div class="tile"><div class="num gold">${VALUES.length}</div><div class="lbl">핵심 가치</div></div>
    </div>
    <div class="section-h"><h2>가치별 활동</h2><span class="muted tiny">제안·결정이 어떤 가치에 걸려 움직이는가</span></div>
    <div class="card">
      ${dist.map(d=>`<div class="vbar-row"><div class="name ${d.v.key}">${d.v.code}</div>
        <div class="vbar"><i class="bg-${d.v.key}" style="width:${Math.round(d.n/maxN*100)}%"></i></div>
        <div class="cnt">${d.n}</div></div>`).join('')}
    </div>
    <div class="section-h"><h2>최근 활동</h2><span class="muted tiny" data-go="decisions" style="cursor:pointer">결정 전체 →</span></div>
    <div class="card">
      ${feed.length? feed.map(f=>`<div class="feed-item" data-go="${f.r}" style="cursor:pointer"><span class="dot"></span><div><span>${f.txt}</span> <span class="tiny" style="color:var(--dim2)">· ${ago(f.t)}</span></div></div>`).join('')
        : `<div class="center-empty">아직 활동이 없습니다.</div>`}
    </div>
    <div class="section-h"><h2>빠른 시작</h2></div>
    <div class="card" style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn primary" data-fab="decisions">＋ 제안·이의 올리기</button>
      <button class="btn" data-go="values">가치 보기</button>
      <button class="btn" data-go="people">사람 등록</button>
    </div>`;
}

// ---- 결정 엔진 ----
function vDecisions(){
  const props=[...DB.props()].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  return `
    <div class="page-head"><h1 class="page-title">결정</h1>
      <p class="page-desc">누구나 <b>가치 + 근거</b>에 걸어 제안·이의를 올린다. 직급이 아니라 근거가 이긴다. 모든 결정은 여기 투명하게 남는다.</p></div>
    <div style="display:flex;gap:10px;margin-bottom:6px">
      <button class="btn primary" data-fab="decisions">＋ 새 제안·이의</button>
      <div class="seg" id="filter" style="flex:1;max-width:280px">
        <div class="opt on" data-f="all">전체</div><div class="opt" data-f="open">열림</div><div class="opt" data-f="decided">결정됨</div>
      </div>
    </div>
    <div class="card" id="prop-list">${propRows(props)}</div>`;
}
function propRows(props){
  if(!props.length) return `<div class="center-empty">아직 제안이 없습니다. 첫 제안을 올려보세요.</div>`;
  return props.map(p=>{ const v=valByKey(p.valueKey);
    return `<div class="row row-click" data-go="decisions/${p.id}">
      <div class="body">
        <div class="title">${esc(p.title)}</div>
        <div class="meta">
          <span class="vtag ${v.key}"><span class="vdot"></span>${v.code} ${v.name}</span>
          <span class="pill ${p.status}">${p.status==='open'?'열림':'결정됨'}</span>
          <span>· ${esc(p.proposer)}</span><span>· ${ago(p.createdAt)}</span>
          <span>· 💬 ${p.comments.length}</span>
        </div>
      </div><div class="muted" style="font-size:18px">›</div>
    </div>`; }).join('');
}
function vDecisionDetail(id){
  const p=DB.props().find(x=>x.id===id);
  if(!p) return `<div class="back" data-go="decisions">‹ 결정</div><div class="center-empty">항목을 찾을 수 없습니다.</div>`;
  const v=valByKey(p.valueKey);
  return `
    <div class="back" data-go="decisions">‹ 결정 목록</div>
    <div class="page-head"><h1 class="page-title" style="font-size:22px">${esc(p.title)}</h1>
      <div class="kv">
        <span class="vtag ${v.key}"><span class="vdot"></span>${v.code} ${v.name}</span>
        <span class="pill ${p.status}">${p.status==='open'?'열림':'결정됨'}</span>
        <span class="muted small">제안 ${esc(p.proposer)} · ${fmt(p.createdAt)}</span>
      </div></div>
    <div class="card"><div class="muted tiny" style="margin-bottom:6px">근거</div><div style="line-height:1.7">${esc(p.evidence)}</div></div>

    <div class="section-h"><h2>의견 · 근거 (${p.comments.length})</h2></div>
    <div class="card">
      ${p.comments.length? p.comments.map(c=>`
        <div class="comment ${c.stance}">
          <div class="who">${esc(c.author)} · ${c.stance==='for'?'찬성':c.stance==='against'?'반대':'참고'} · ${ago(c.createdAt)}</div>
          <div>${esc(c.text)}</div>
        </div>`).join('') : `<div class="muted small">아직 의견이 없습니다.</div>`}
      <button class="btn sm" data-comment="${p.id}" style="margin-top:12px">＋ 의견·근거 달기</button>
    </div>

    ${p.decision ? `
      <div class="decision-box">
        <div class="lbl">✓ 결정</div>
        <div style="line-height:1.7">${esc(p.decision.conclusion)}</div>
        <div class="kv" style="margin-top:12px">
          <span class="muted small">결정: ${esc(p.decision.decidedBy)}</span>
          <span class="muted small">· 반대의견: ${esc(p.decision.dissent||'없음')}</span>
          <span class="muted small">· ${fmt(p.decision.decidedAt)}</span>
        </div>
      </div>`
    : `<div class="card" style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <span class="muted small" style="flex:1">근거가 모였으면 결정을 남기세요. CEO도 가치 앞에선 한 명의 참여자입니다.</span>
        <button class="btn primary sm" data-decide="${p.id}">결정 기록</button>
      </div>`}`;
}

// ---- 가치 ----
function vValues(){
  const props=DB.props();
  return `
    <div class="page-head"><h1 class="page-title">핵심 가치</h1>
      <p class="page-desc">이 다섯 가치가 조직도(위계)보다 위에 있다. 충돌하면 가치가 이긴다.</p></div>
    ${VALUES.map(v=>{ const n=props.filter(p=>p.valueKey===v.key).length;
      return `<div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
          <div><span class="vtag ${v.key}"><span class="vdot"></span>${v.code}</span>
            <span style="font-weight:800;font-size:16px;margin-left:8px">${v.name}</span>
            <span class="muted small"> · ${v.en}</span></div>
          <span class="muted tiny">연결된 제안 ${n}</span>
        </div>
        <div style="margin:10px 0 8px;line-height:1.7">${v.desc}</div>
        <div class="muted small">🛡️ 이 가치를 근거로 → ${v.object}</div>
      </div>`; }).join('')}`;
}

// ---- 사람 ----
function vPeople(){
  const ppl=DB.people();
  return `
    <div class="page-head"><h1 class="page-title">사람</h1>
      <p class="page-desc">개인 · 팀 · 부서. 각자가 지금 무엇을 향해 가고 있는지.</p></div>
    <button class="btn primary" data-fab="people" style="margin-bottom:6px">＋ 사람 등록</button>
    <div class="card">
      ${ppl.length? ppl.map(p=>`<div class="row">
        <div class="avatar">${esc(initials(p.name))}</div>
        <div class="body"><div class="title">${esc(p.name)} <span class="muted small" style="font-weight:500">· ${esc(p.role)}</span></div>
          <div class="meta"><span>${esc(p.dept)} / ${esc(p.team)}</span></div>
          ${p.goal?`<div class="muted small" style="margin-top:6px">🎯 ${esc(p.goal)}</div>`:''}</div>
        <button class="btn sm ghost danger" data-del-person="${p.id}">삭제</button>
      </div>`).join('') : `<div class="center-empty">등록된 사람이 없습니다.</div>`}
    </div>`;
}

// ---- 운영(부서·프로세스) ----
function vOps(){
  const depts=DB.depts();
  return `
    <div class="page-head"><h1 class="page-title">운영</h1>
      <p class="page-desc">부서별 업무 프로세스(SOP)와 흐름. 일이 실제로 어떻게 굴러가는가.</p></div>
    <button class="btn primary" data-fab="ops" style="margin-bottom:6px">＋ 부서·프로세스 추가</button>
    <div class="card">
      ${depts.length? depts.map(d=>`<div class="row">
        <div class="body"><div class="title">${esc(d.name)} <span class="muted small" style="font-weight:500">· 책임 ${esc(d.lead||'-')}</span></div>
          <div class="muted small" style="margin-top:6px;line-height:1.6">${esc(d.process)}</div></div>
        <button class="btn sm ghost danger" data-del-dept="${d.id}">삭제</button>
      </div>`).join('') : `<div class="center-empty">등록된 부서가 없습니다.</div>`}
    </div>`;
}

// ---- 자산 ----
function vAssets(){
  const assets=DB.assets();
  return `
    <div class="page-head"><h1 class="page-title">자산</h1>
      <p class="page-desc">이미 가진 프로그램·문서·지식. 자재 하나까지 여기 모인다.</p></div>
    <button class="btn primary" data-fab="assets" style="margin-bottom:6px">＋ 자산 추가</button>
    <div class="card">
      ${assets.length? assets.map(a=>`<div class="row">
        <div class="body"><div class="title">${esc(a.name)} <span class="badge-demo">${esc(a.category)}</span></div>
          ${a.note?`<div class="muted small" style="margin-top:6px;line-height:1.6">${esc(a.note)}</div>`:''}</div>
        <button class="btn sm ghost danger" data-del-asset="${a.id}">삭제</button>
      </div>`).join('') : `<div class="center-empty">등록된 자산이 없습니다.</div>`}
    </div>`;
}

// ---------- 모달 ----------
function modal(html){
  const bg=document.createElement('div'); bg.className='modal-bg';
  bg.innerHTML=`<div class="modal">${html}</div>`;
  bg.addEventListener('click',e=>{ if(e.target===bg) bg.remove(); });
  document.body.appendChild(bg);
  const first=bg.querySelector('input,textarea,select'); if(first) setTimeout(()=>first.focus(),50);
  return bg;
}
function closeModal(el){ const m=el.closest('.modal-bg'); if(m) m.remove(); }

function openProposal(){
  const m=modal(`
    <h3>제안 · 이의 올리기</h3>
    <div class="mdesc">직급은 상관없습니다. 반드시 <b>가치 + 근거</b>에 걸어 제기하세요.</div>
    <div class="field"><label>제목 (무엇을 제안/이의하나)</label><input id="f-title" placeholder="예: 신제품, 화려함보다 성분 투명성을 우선하자"></div>
    <div class="field"><label>연결 가치</label>
      <div class="vchips" id="f-vals">${VALUES.map((v,i)=>`<div class="vchip ${v.key} ${i===0?'on':''}" data-v="${v.key}">${v.code} ${v.name}</div>`).join('')}</div></div>
    <div class="field"><label>근거 (데이터·경험 — "싫어서"가 아니라 "왜")</label><textarea id="f-ev" placeholder="이 제안을 뒷받침하는 데이터나 경험을 적어주세요."></textarea></div>
    <div class="field"><label>제안자</label><input id="f-by" placeholder="이름" value="${esc((DB.people()[0]||{}).name||'')}"></div>
    <div class="modal-actions"><button class="btn ghost" data-cancel>취소</button><button class="btn primary" id="f-save">올리기</button></div>
  `);
  let vk=VALUES[0].key;
  m.querySelectorAll('.vchip').forEach(c=>c.onclick=()=>{ m.querySelectorAll('.vchip').forEach(x=>x.classList.remove('on')); c.classList.add('on'); vk=c.dataset.v; });
  m.querySelector('[data-cancel]').onclick=()=>closeModal(m);
  m.querySelector('#f-save').onclick=()=>{
    const title=m.querySelector('#f-title').value.trim(), ev=m.querySelector('#f-ev').value.trim(), by=m.querySelector('#f-by').value.trim()||'익명';
    if(!title){ toast('제목을 입력하세요'); return; }
    if(!ev){ toast('근거를 입력하세요 (가치>위계의 핵심)'); return; }
    const props=DB.props(); props.push({id:uid(),title,valueKey:vk,proposer:by,evidence:ev,status:'open',createdAt:nowISO(),comments:[],decision:null});
    DB.set(DB.k.props,props); closeModal(m); toast('제안이 기록되었습니다'); render();
  };
}
function openComment(pid){
  const m=modal(`
    <h3>의견 · 근거 달기</h3><div class="mdesc">찬성/반대/참고를 근거와 함께.</div>
    <div class="field"><label>입장</label><div class="seg" id="c-stance">
      <div class="opt on" data-s="for">찬성</div><div class="opt" data-s="against">반대</div><div class="opt" data-s="note">참고</div></div></div>
    <div class="field"><label>내용 (근거 포함)</label><textarea id="c-text" placeholder="왜 그렇게 보는지 근거와 함께"></textarea></div>
    <div class="field"><label>작성자</label><input id="c-by" placeholder="이름" value="${esc((DB.people()[0]||{}).name||'')}"></div>
    <div class="modal-actions"><button class="btn ghost" data-cancel>취소</button><button class="btn primary" id="c-save">등록</button></div>
  `);
  let st='for';
  m.querySelectorAll('#c-stance .opt').forEach(o=>o.onclick=()=>{ m.querySelectorAll('#c-stance .opt').forEach(x=>x.classList.remove('on')); o.classList.add('on'); st=o.dataset.s; });
  m.querySelector('[data-cancel]').onclick=()=>closeModal(m);
  m.querySelector('#c-save').onclick=()=>{
    const text=m.querySelector('#c-text').value.trim(), by=m.querySelector('#c-by').value.trim()||'익명';
    if(!text){ toast('내용을 입력하세요'); return; }
    const props=DB.props(); const p=props.find(x=>x.id===pid); if(!p)return;
    p.comments.push({id:uid(),author:by,stance:st,text,createdAt:nowISO()});
    DB.set(DB.k.props,props); closeModal(m); toast('의견이 기록되었습니다'); render();
  };
}
function openDecide(pid){
  const m=modal(`
    <h3>결정 기록</h3><div class="mdesc">근거가 더 옳은 쪽이 이깁니다. 반대의견도 함께 남겨 투명하게.</div>
    <div class="field"><label>결론</label><textarea id="d-con" placeholder="무엇으로 결정됐는지"></textarea></div>
    <div class="field"><label>결정 방식 / 근거</label><input id="d-by" placeholder="예: 합의(V5 근거) / 데이터 우세"></div>
    <div class="field"><label>반대의견 (있다면)</label><input id="d-dis" placeholder="없으면 비워두세요"></div>
    <div class="modal-actions"><button class="btn ghost" data-cancel>취소</button><button class="btn primary" id="d-save">결정 확정</button></div>
  `);
  m.querySelector('[data-cancel]').onclick=()=>closeModal(m);
  m.querySelector('#d-save').onclick=()=>{
    const con=m.querySelector('#d-con').value.trim();
    if(!con){ toast('결론을 입력하세요'); return; }
    const props=DB.props(); const p=props.find(x=>x.id===pid); if(!p)return;
    p.decision={conclusion:con,decidedBy:m.querySelector('#d-by').value.trim()||'합의',dissent:m.querySelector('#d-dis').value.trim()||'없음',decidedAt:nowISO()};
    p.status='decided'; DB.set(DB.k.props,props); closeModal(m); toast('결정이 기록되었습니다'); render();
  };
}
function openPerson(){
  const m=modal(`
    <h3>사람 등록</h3>
    <div class="field"><label>이름</label><input id="p-name"></div>
    <div class="field"><label>부서</label><input id="p-dept" placeholder="예: R&D"></div>
    <div class="field"><label>팀</label><input id="p-team" placeholder="예: 맞춤화장품"></div>
    <div class="field"><label>역할</label><input id="p-role" placeholder="예: 연구원"></div>
    <div class="field"><label>현재 목표</label><input id="p-goal" placeholder="지금 무엇을 향해 가고 있나"></div>
    <div class="modal-actions"><button class="btn ghost" data-cancel>취소</button><button class="btn primary" id="p-save">등록</button></div>
  `);
  m.querySelector('[data-cancel]').onclick=()=>closeModal(m);
  m.querySelector('#p-save').onclick=()=>{
    const name=m.querySelector('#p-name').value.trim(); if(!name){ toast('이름을 입력하세요'); return; }
    const ppl=DB.people(); ppl.push({id:uid(),name,dept:m.querySelector('#p-dept').value.trim(),team:m.querySelector('#p-team').value.trim(),role:m.querySelector('#p-role').value.trim(),goal:m.querySelector('#p-goal').value.trim()});
    DB.set(DB.k.people,ppl); closeModal(m); toast('등록되었습니다'); render();
  };
}
function openDept(){
  const m=modal(`
    <h3>부서 · 프로세스 추가</h3>
    <div class="field"><label>부서/영역 이름</label><input id="o-name"></div>
    <div class="field"><label>책임자</label><input id="o-lead"></div>
    <div class="field"><label>업무 프로세스 (SOP)</label><textarea id="o-proc" placeholder="단계 → 단계 → 단계"></textarea></div>
    <div class="modal-actions"><button class="btn ghost" data-cancel>취소</button><button class="btn primary" id="o-save">추가</button></div>
  `);
  m.querySelector('[data-cancel]').onclick=()=>closeModal(m);
  m.querySelector('#o-save').onclick=()=>{
    const name=m.querySelector('#o-name').value.trim(); if(!name){ toast('이름을 입력하세요'); return; }
    const d=DB.depts(); d.push({id:uid(),name,lead:m.querySelector('#o-lead').value.trim(),process:m.querySelector('#o-proc').value.trim()});
    DB.set(DB.k.depts,d); closeModal(m); toast('추가되었습니다'); render();
  };
}
function openAsset(){
  const m=modal(`
    <h3>자산 추가</h3>
    <div class="field"><label>이름</label><input id="a-name"></div>
    <div class="field"><label>분류</label><input id="a-cat" placeholder="예: 프로그램 / 문서 / 자재"></div>
    <div class="field"><label>메모</label><textarea id="a-note"></textarea></div>
    <div class="modal-actions"><button class="btn ghost" data-cancel>취소</button><button class="btn primary" id="a-save">추가</button></div>
  `);
  m.querySelector('[data-cancel]').onclick=()=>closeModal(m);
  m.querySelector('#a-save').onclick=()=>{
    const name=m.querySelector('#a-name').value.trim(); if(!name){ toast('이름을 입력하세요'); return; }
    const a=DB.assets(); a.push({id:uid(),name,category:m.querySelector('#a-cat').value.trim()||'기타',note:m.querySelector('#a-note').value.trim()});
    DB.set(DB.k.assets,a); closeModal(m); toast('추가되었습니다'); render();
  };
}

function toast(msg){
  let t=document.querySelector('.toast'); if(t)t.remove();
  t=document.createElement('div'); t.className='toast'; t.textContent=msg; document.body.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),250); },1900);
}

// ---------- 이벤트 바인딩 ----------
function bind(r,arg){
  document.querySelectorAll('[data-go]').forEach(el=>el.onclick=e=>{ e.stopPropagation(); go(el.dataset.go); });
  document.querySelectorAll('[data-fab]').forEach(el=>el.onclick=()=>openFor(el.dataset.fab));
  document.querySelectorAll('[data-comment]').forEach(el=>el.onclick=()=>openComment(el.dataset.comment));
  document.querySelectorAll('[data-decide]').forEach(el=>el.onclick=()=>openDecide(el.dataset.decide));
  document.querySelectorAll('[data-del-person]').forEach(el=>el.onclick=()=>del('people',DB.k.people,el.dataset.delPerson));
  document.querySelectorAll('[data-del-dept]').forEach(el=>el.onclick=()=>del('depts',DB.k.depts,el.dataset.delDept));
  document.querySelectorAll('[data-del-asset]').forEach(el=>el.onclick=()=>del('assets',DB.k.assets,el.dataset.delAsset));
  const fseg=document.getElementById('filter');
  if(fseg) fseg.querySelectorAll('.opt').forEach(o=>o.onclick=()=>{
    fseg.querySelectorAll('.opt').forEach(x=>x.classList.remove('on')); o.classList.add('on');
    const f=o.dataset.f; let list=[...DB.props()].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    if(f!=='all') list=list.filter(p=>p.status===f);
    document.getElementById('prop-list').innerHTML=propRows(list);
    document.querySelectorAll('#prop-list [data-go]').forEach(el=>el.onclick=e=>{e.stopPropagation();go(el.dataset.go);});
  });
}
function openFor(r){ ({decisions:openProposal,people:openPerson,ops:openDept,assets:openAsset})[r]?.(); }
function del(route,key,id){ if(!confirm('삭제할까요?'))return; DB.set(key,DB.get(key,[]).filter(x=>x.id!==id)); toast('삭제되었습니다'); render(); }

// ---------- 부팅 ----------
window.addEventListener('hashchange',render);
window.__bootApp=function(){ seed(); if(!location.hash) location.hash='#/home'; render(); };
