/* Aram Huvis OS v2 — 실제로 돌아가는 회사 운영체제.
   리서치 반영: 신뢰도 가중 의사결정(Dot Collector), 결정 구조(Cloverpop/ADR),
   OKR(Viva/Lattice), 템플릿→실행 SOP(Process Street), 채워진 예시·템플릿(Notion). */
'use strict';

// ---------- storage ----------
const NS = 'ahos.v2.';
const S = {
  get(k, def){ try{ const v=localStorage.getItem(NS+k); return v==null?def:JSON.parse(v);}catch(e){return def;} },
  set(k, v){ localStorage.setItem(NS+k, JSON.stringify(v)); },
  people(){return S.get('people',[]);}, okrs(){return S.get('okrs',[]);},
  decisions(){return S.get('decisions',[]);}, sopTpl(){return S.get('sopTpl',[]);}, sopRuns(){return S.get('sopRuns',[]);},
};
function seedIfNeeded(){
  if(S.get('seeded',false)) return;
  const clone=x=>JSON.parse(JSON.stringify(x));
  S.set('people',clone(window.SEED_PEOPLE)); S.set('okrs',clone(window.SEED_OKRS));
  S.set('decisions',clone(window.SEED_DECISIONS)); S.set('sopTpl',clone(window.SEED_SOP_TEMPLATES));
  S.set('sopRuns',clone(window.SEED_SOP_RUNS)); S.set('seeded',true);
}
// 현재 사용자(프로토타입): 첫 사람
function me(){ return S.people()[0] || {id:'',name:'나'}; }

// ---------- utils ----------
const VALUES = window.VALUES;
const uid = p => (p||'x_') + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const nowISO = () => new Date().toISOString();
const esc = s => (s??'').toString().replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const valByKey = k => VALUES.find(v=>v.key===k) || VALUES[0];
const personById = id => S.people().find(p=>p.id===id) || {name:id||'—', believe:{}};
const pname = id => personById(id).name;
const initials = n => (n||'?').trim().slice(0,2);
const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
const fmt = iso => { if(!iso)return''; const d=new Date(iso),p=n=>String(n).padStart(2,'0');
  return `${String(d.getFullYear()).slice(2)}.${p(d.getMonth()+1)}.${p(d.getDate())}`; };
const ago = iso => { if(!iso)return''; const s=(Date.now()-new Date(iso))/1000;
  if(s<60)return'방금'; if(s<3600)return Math.floor(s/60)+'분 전'; if(s<86400)return Math.floor(s/3600)+'시간 전'; return Math.floor(s/86400)+'일 전'; };
function krPct(kr){ const d=kr.target-kr.start; if(d===0) return kr.current>=kr.target?100:0; return clamp(Math.round((kr.current-kr.start)/d*100),0,100); }
function okrPct(o){ if(!o.krs||!o.krs.length)return 0; return Math.round(o.krs.reduce((a,k)=>a+krPct(k),0)/o.krs.length); }
const STATUS_KR = { ontrack:'순항', risk:'주의', behind:'지연' };

// ---------- believability voting ----------
function tally(dec){
  const raw={}, weighted={};
  (dec.options||[]).forEach(o=>{raw[o]=0;weighted[o]=0;});
  (dec.votes||[]).forEach(v=>{
    if(!(v.choice in raw)){raw[v.choice]=0;weighted[v.choice]=0;}
    const b=(personById(v.voter).believe||{})[dec.domain] ?? 5;
    raw[v.choice]+=1; weighted[v.choice]+=b;
  });
  const winner=k=>{let best=null,bv=-1;for(const o in k){if(k[o]>bv){bv=k[o];best=o;}}return bv>0?best:null;};
  return {raw,weighted,rawWin:winner(raw),wWin:winner(weighted),
    diverge:winner(raw)&&winner(weighted)&&winner(raw)!==winner(weighted)};
}

// ---------- router ----------
const routes=['home','decisions','okr','sop','people','values'];
const NAV=[{r:'home',ic:'🏠',label:'홈'},{r:'decisions',ic:'⚖️',label:'결정'},{r:'okr',ic:'🎯',label:'목표'},
  {r:'sop',ic:'📋',label:'프로세스'},{r:'people',ic:'👤',label:'사람'},{r:'values',ic:'💎',label:'가치'}];
function parseHash(){ const h=(location.hash||'#/home').replace(/^#\/?/,''); const [r,...rest]=h.split('/'); return {r:routes.includes(r)?r:'home',arg:rest.join('/')}; }
function go(path){ location.hash='#/'+path; }

// ---------- render ----------
const appEl=()=>document.getElementById('app');
function render(){
  const {r,arg}=parseHash();
  const fabRoutes={decisions:'결정',okr:'목표',sop:'프로세스',people:'사람'};
  appEl().innerHTML=`
    ${sidebar(r)}
    <div class="main"><div class="topbar"><div class="t-logo">Aram Huvis <b>OS</b></div><span class="t-k" data-cmdk>⌘</span></div>
      <div class="page-wrap">${view(r,arg)}</div></div>
    ${tabbar(r)}
    ${fabRoutes[r]&&!arg?`<button class="fab" data-new="${r}">＋</button>`:''}`;
  bind(r,arg); window.scrollTo(0,0);
}
function sidebar(r){ return `<aside class="sidebar">
  <div class="logo">Aram Huvis <b>OS</b></div><div class="logo-sub">회사 운영체제 · v2</div>
  ${NAV.map(n=>`<div class="nav-item ${n.r===r?'active':''}" data-go="${n.r}"><span class="ic">${n.ic}</span>${n.label}</div>`).join('')}
  <div class="nav-cmdk" data-cmdk>빠른 이동·생성 <kbd>⌘K</kbd></div>
  <div class="side-foot">가치가 위계를 이긴다.<br>근거가 직급을 이긴다.</div></aside>`; }
function tabbar(r){ return `<nav class="tabbar">${NAV.map(n=>`<div class="tab ${n.r===r?'active':''}" data-go="${n.r}"><span class="ic">${n.ic}</span>${n.label}</div>`).join('')}</nav>`; }
function view(r,arg){
  if(r==='home')return vHome();
  if(r==='decisions')return arg?vDecisionDetail(arg):vDecisions();
  if(r==='okr')return vOkr();
  if(r==='sop')return arg?vSopDetail(arg):vSop();
  if(r==='people')return arg?vPersonDetail(arg):vPeople();
  if(r==='values')return vValues();
  return vHome();
}

// ================= HOME =================
function vHome(){
  const decs=S.decisions(), okrs=S.okrs(), runs=S.sopRuns(), tpls=S.sopTpl();
  const openDec=decs.filter(d=>d.status==='proposed');
  const riskKr=okrs.flatMap(o=>o.krs.map(k=>({o,k}))).filter(x=>krPct(x.k)<40);
  const activeRuns=runs.map(rn=>{const t=tpls.find(t=>t.id===rn.tplId);const done=rn.stepDone.filter(Boolean).length;
    return {rn,t,done,total:rn.stepDone.length,next:t?t.steps[rn.stepDone.findIndex((d,i)=>!d)]:null};}).filter(x=>x.t&&x.done<x.total);
  // attention
  const attn=[];
  openDec.forEach(d=>attn.push({ic:'⚖️',h:esc(d.title),s:`제안 ${pname(d.proposer)} · 결정 대기 · 투표 ${d.votes.length}`,go:'decisions/'+d.id}));
  activeRuns.forEach(x=>attn.push({ic:'📋',h:`${esc(x.t.name)} — ${esc(x.rn.label||'실행중')}`,s:`다음 단계: ${esc(x.next?x.next.name:'')} (${x.done}/${x.total})`,go:'sop/run:'+x.rn.id}));
  riskKr.slice(0,3).forEach(x=>attn.push({ic:'🎯',h:`${esc(x.k.name)} 진척 ${krPct(x.k)}%`,s:`${esc(x.o.objective.slice(0,30))}… · 주의`,go:'okr'}));
  const co=okrs.find(o=>o.level==='전사');
  const feed=buildFeed().slice(0,6);
  const cel=celebrations();
  const dist=VALUES.map(v=>({v,n:decs.filter(d=>d.valueKey===v.key).length})); const mx=Math.max(1,...dist.map(d=>d.n));
  const h=new Date().getHours(); const greet=h<12?'좋은 아침입니다':h<18?'안녕하세요':'수고 많으셨습니다';
  return `
  <div class="page-head"><h1 class="page-title">${greet}, ${esc(me().name)}님</h1>
    <p class="page-desc">오늘 회사가 무엇을 향해, 어떻게 결정하고 있는지 — 그리고 지금 당신이 챙길 것.</p></div>

  <div class="section-h"><h2>⚡ 지금 챙길 것</h2><span class="muted tiny">${attn.length}건</span></div>
  ${attn.length? attn.map(a=>`<div class="attn" data-go="${a.go}"><div class="ai">${a.ic}</div><div class="at"><div class="h">${a.h}</div><div class="s">${a.s}</div></div><div class="chev">›</div></div>`).join('')
    : `<div class="card center-empty">지금 급히 챙길 건 없습니다. 👍</div>`}

  <div class="section-h"><h2>전사 목표</h2><span class="link" data-go="okr">전체 목표 →</span></div>
  ${co?`<div class="card"><div class="okr-head"><div><div style="font-weight:700">${esc(co.objective)}</div>
    <div class="muted tiny" style="margin-top:4px">${co.cycle} · ${pname(co.owner)}</div></div>
    <div class="pct" style="color:var(--acc)">${okrPct(co)}%</div></div>
    <div class="bar ${co.status}" style="margin-top:10px"><i style="width:${okrPct(co)}%"></i></div></div>`:''}

  <div class="grid tiles" style="margin-top:14px">
    <div class="tile"><div class="n amber">${openDec.length}</div><div class="l">결정 대기</div></div>
    <div class="tile"><div class="n acc">${decs.filter(d=>d.status==='decided').length}</div><div class="l">내려진 결정</div></div>
    <div class="tile"><div class="n">${okrs.length}</div><div class="l">진행 목표</div></div>
    <div class="tile"><div class="n gold">${S.people().length}</div><div class="l">구성원</div></div>
  </div>

  <div class="section-h"><h2>가치별 결정 활동</h2><span class="muted tiny">어느 가치에 걸려 움직이는가</span></div>
  <div class="card">${dist.map(d=>`<div class="vbar-row"><div class="name ${d.v.key}">${d.v.code}</div>
    <div class="vbar"><i class="bg-${d.v.key}" style="width:${Math.round(d.n/mx*100)}%"></i></div><div class="cnt">${d.n}</div></div>`).join('')}</div>

  ${cel.length?`<div class="section-h"><h2>🎉 이번 달</h2></div><div class="card">${cel.map(c=>`<div class="feed"><span class="fd"></span><div>${c}</div></div>`).join('')}</div>`:''}

  <div class="section-h"><h2>최근 활동</h2><span class="link" data-go="decisions">결정 전체 →</span></div>
  <div class="card">${feed.length?feed.map(f=>`<div class="feed" ${f.go?`data-go="${f.go}" style="cursor:pointer"`:''}><span class="fd"></span><div>${f.txt} <span class="dim2 tiny">· ${ago(f.t)}</span></div></div>`).join(''):`<div class="center-empty">활동이 아직 없습니다.</div>`}</div>`;
}
function buildFeed(){
  const f=[];
  S.decisions().forEach(d=>{ f.push({t:d.createdAt,txt:`<b>${esc(pname(d.proposer))}</b>님이 제안 · ${esc(d.title)}`,go:'decisions/'+d.id});
    if(d.status==='decided') f.push({t:d.decidedAt||d.createdAt,txt:`✓ 결정됨 · ${esc(d.title)}`,go:'decisions/'+d.id}); });
  return f.sort((a,b)=>new Date(b.t)-new Date(a.t));
}
function celebrations(){
  const m=String(new Date().getMonth()+1).padStart(2,'0'); const out=[];
  S.people().forEach(p=>{ if((p.birthday||'').slice(0,2)===m) out.push(`🎂 <b>${esc(p.name)}</b>님 생일 (${p.birthday})`);
    if((p.anniversary||'').slice(0,2)===m) out.push(`🎊 <b>${esc(p.name)}</b>님 입사기념일 (${p.anniversary})`); });
  return out;
}

// ================= DECISIONS =================
function vDecisions(){
  const decs=[...S.decisions()].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  return `
  <div class="page-head"><h1 class="page-title">결정</h1>
    <p class="page-desc">누구나 <b>가치 + 근거</b>에 걸어 제안·이의를 올린다. 직급이 아니라 근거가 이긴다 — 표는 <b>신뢰도(도메인 실적)로 가중</b>된다. 모든 결정과 반대의견은 투명하게 남는다.</p></div>
  <div class="row-flex" style="margin-bottom:8px">
    <button class="btn primary" data-new="decisions">＋ 새 제안·이의</button>
    <div class="seg" id="filter" style="max-width:300px;flex:1"><div class="opt on" data-f="all">전체</div><div class="opt" data-f="proposed">대기</div><div class="opt" data-f="decided">결정됨</div></div></div>
  <div class="card" id="dlist">${decRows(decs)}</div>`;
}
function decRows(decs){
  if(!decs.length)return `<div class="center-empty">아직 제안이 없습니다.<div class="cta"><button class="btn primary" data-new="decisions">＋ 첫 제안 올리기</button></div></div>`;
  return decs.map(d=>{const v=valByKey(d.valueKey);const t=tally(d);
    return `<div class="row-click" data-go="decisions/${d.id}"><div class="body">
      <div class="title">${esc(d.title)}</div>
      <div class="meta"><span class="vtag ${v.key}"><span class="vdot"></span>${v.code} ${v.name}</span>
        <span class="pill ${d.status}">${d.status==='decided'?'결정됨':'대기'}</span>
        <span class="pill ${d.reversibility}">${d.reversibility==='one'?'되돌리기 어려움':'되돌릴 수 있음'}</span>
        <span>· ${esc(pname(d.proposer))}</span><span>· 🗳️ ${d.votes.length}</span>
        ${t.diverge?`<span class="believe-chip">신뢰도-투표 결과 상이 ⚠</span>`:''}</div></div><div class="chev">›</div></div>`;}).join('');
}
function vDecisionDetail(id){
  const decs=S.decisions(); const d=decs.find(x=>x.id===id);
  if(!d)return `<div class="back" data-go="decisions">‹ 결정</div><div class="center-empty">찾을 수 없습니다.</div>`;
  const v=valByKey(d.valueKey); const t=tally(d);
  const optTally=(k,win)=>d.options.map(o=>`<div class="opt-tally"><div class="ol"><span>${esc(o)}</span><span class="${o===win?'':'muted'}">${k[o]||0}${o===win?' ★':''}</span></div>
    <div class="bar"><i style="width:${Math.round((k[o]||0)/Math.max(1,Math.max(...Object.values(k)))*100)}%;background:${o===win?'var(--acc)':'var(--line2)'}"></i></div></div>`).join('');
  return `
  <div class="back" data-go="decisions">‹ 결정 목록</div>
  <div class="page-head"><h1 class="page-title" style="font-size:21px">${esc(d.title)}</h1>
    <div class="kv-line"><span class="vtag ${v.key}"><span class="vdot"></span>${v.code} ${v.name}</span>
      <span class="pill ${d.status}">${d.status==='decided'?'결정됨':d.status==='superseded'?'대체됨':'대기'}</span>
      <span class="pill ${d.reversibility}">${d.reversibility==='one'?'되돌리기 어려움 (신중)':'되돌릴 수 있음 (빠르게)'}</span>
      <span class="muted small">제안 ${esc(pname(d.proposer))} · ${fmt(d.createdAt)} · 도메인 ${esc(d.domain)}</span></div></div>

  <div class="card"><div class="muted tiny">맥락</div><div style="margin:6px 0 14px;line-height:1.7">${esc(d.context)}</div>
    <div class="muted tiny">검토한 선택지 (${d.options.length})</div>
    <ul class="opt-list">${d.options.map(o=>`<li class="${o===d.chosen?'chosen':''}">${o===d.chosen?'✓':'○'} ${esc(o)}</li>`).join('')}</ul>
    <div class="muted tiny">근거</div><div style="margin-top:6px;line-height:1.7">${esc(d.evidence)}</div></div>

  <div class="section-h"><h2>투표 · 근거 (${d.votes.length})</h2><button class="btn sm" data-vote="${d.id}">＋ 내 표·근거</button></div>
  ${d.votes.length?`<div class="card">
    <div class="tally">
      <div class="box"><h4>① 1인 1표 (raw)</h4>${optTally(t.raw,t.rawWin)}</div>
      <div class="box"><h4>② 신뢰도 가중 (believability)</h4>${optTally(t.weighted,t.wWin)}</div></div>
    ${t.diverge?`<div class="believe-chip" style="display:inline-block;margin-bottom:10px">⚠ 두 결과가 다릅니다 — 자동으로 정하지 말고 더 파고들 신호</div>`:''}
    ${d.votes.map(vo=>{const b=(personById(vo.voter).believe||{})[d.domain]??5;
      return `<div class="vote"><div class="who">${esc(pname(vo.voter))}<span class="believe-chip">${d.domain} 신뢰도 ${b}</span></div>
      <div class="ch">→ ${esc(vo.choice)}</div><div class="small muted" style="margin-top:2px">${esc(vo.reason)}</div></div>`;}).join('')}
  </div>`:`<div class="card center-empty">아직 표가 없습니다.</div>`}

  ${d.status==='decided'?`<div class="decision-box"><div class="lbl">✓ 결정</div>
    <div style="line-height:1.7;font-weight:600">${esc(d.chosen)}</div>
    <div class="kv-line" style="margin-top:10px"><span class="muted small">방식: ${esc(d.decidedBy)}</span>
      ${d.dissent?`<span class="muted small">· 반대(기록): ${esc(d.dissent)}</span>`:''}</div>
    ${d.expected?`<div class="small muted" style="margin-top:8px">예상 결과: ${esc(d.expected)} · 확신 ${d.confidence}% · 리뷰 예정 ${fmt(d.reviewDate)}</div>`:''}</div>`
  :`<div class="card" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><span class="muted small" style="flex:1">근거가 모였으면 결정을 남기세요. CEO도 가치 앞에선 한 명의 참여자입니다.</span>
    <button class="btn primary sm" data-decide="${d.id}">결정 기록</button></div>`}`;
}

// ================= OKR =================
function vOkr(){
  const okrs=S.okrs();
  const byLevel=g=>okrs.filter(o=>o.level===g);
  const card=o=>{const v=okrPct(o);
    return `<div class="card"><div class="okr-head"><div><div style="font-weight:700;font-size:15px">${esc(o.objective)}</div>
      <div class="kv-line" style="margin-top:6px"><span class="pill ${o.status}">${STATUS_KR[o.status]||o.status}</span>
        <span class="muted tiny">${esc(o.dept)} · ${pname(o.owner)} · ${o.cycle}</span></div></div><div class="pct" style="color:var(--acc)">${v}%</div></div>
      <div class="bar ${o.status}" style="margin:10px 0 4px"><i style="width:${v}%"></i></div>
      ${o.krs.map(k=>`<div class="kr"><div class="kn"><span>${esc(k.name)}</span><span class="kv">${k.current}${esc(k.unit)} <span class="dim2">/ ${k.target}${esc(k.unit)}</span> · ${krPct(k)}%</span></div>
        <div class="bar"><i style="width:${krPct(k)}%"></i></div>
        <div style="text-align:right;margin-top:6px"><button class="btn sm ghost" data-checkin="${o.id}|${k.id}">체크인</button></div></div>`).join('')}</div>`;};
  return `
  <div class="page-head"><h1 class="page-title">목표 (OKR)</h1>
    <p class="page-desc">Objective(정성) → Key Result(정량: 시작→현재→목표로 진행률 자동). 개인·팀·전사가 하나로 정렬된다.</p></div>
  <button class="btn primary" data-new="okr" style="margin-bottom:6px">＋ 목표 추가</button>
  <div class="section-h"><h2>전사</h2></div>${byLevel('전사').map(card).join('')||'<div class="card center-empty">없음</div>'}
  <div class="section-h"><h2>부서</h2></div>${byLevel('부서').map(card).join('')||'<div class="card center-empty">없음</div>'}`;
}

// ================= SOP =================
function vSop(){
  const tpls=S.sopTpl(), runs=S.sopRuns();
  const active=runs.map(rn=>({rn,t:tpls.find(t=>t.id===rn.tplId)})).filter(x=>x.t&&x.rn.stepDone.filter(Boolean).length<x.rn.stepDone.length);
  return `
  <div class="page-head"><h1 class="page-title">프로세스 (SOP)</h1>
    <p class="page-desc">템플릿으로 <b>한 번 정의</b>하고 → 필요할 때 <b>실행(Run)</b>을 돌린다. 누가 어느 단계를 언제 완료했는지 기록되고, 승인·품질 게이트는 통과 전까지 진행을 막는다.</p></div>
  <button class="btn primary" data-new="sop" style="margin-bottom:6px">＋ 프로세스 템플릿 추가</button>
  ${active.length?`<div class="section-h"><h2>진행 중인 실행</h2></div>
    ${active.map(x=>{const done=x.rn.stepDone.filter(Boolean).length;return `<div class="row-click" data-go="sop/run:${x.rn.id}"><div class="body">
      <div class="title">${esc(x.t.name)} — ${esc(x.rn.label||'실행')}</div>
      <div class="meta"><span>${done}/${x.rn.stepDone.length} 단계</span><span>· 시작 ${pname(x.rn.startedBy)}</span><span>· ${ago(x.rn.startedAt)}</span></div>
      <div class="bar" style="margin-top:8px"><i style="width:${Math.round(done/x.rn.stepDone.length*100)}%"></i></div></div><div class="chev">›</div></div>`;}).join('')}`:''}
  <div class="section-h"><h2>템플릿</h2></div>
  ${tpls.map(t=>`<div class="row-click" data-go="sop/tpl:${t.id}"><div class="body">
    <div class="title">${t.star?'⭐ ':''}${esc(t.name)}</div>
    <div class="meta"><span>${esc(t.dept)}</span><span>· ${pname(t.owner)}</span><span>· ${t.steps.length}단계</span></div>
    <div class="muted small" style="margin-top:5px">${esc(t.desc||'')}</div></div><div class="chev">›</div></div>`).join('')}`;
}
function vSopDetail(arg){
  const [kind,id]=arg.split(':');
  if(kind==='tpl'){ const t=S.sopTpl().find(x=>x.id===id); if(!t)return notFound('sop');
    return `<div class="back" data-go="sop">‹ 프로세스</div>
    <div class="page-head"><h1 class="page-title" style="font-size:21px">${t.star?'⭐ ':''}${esc(t.name)}</h1>
      <div class="kv-line"><span class="muted small">${esc(t.dept)} · 책임 ${pname(t.owner)} · ${t.steps.length}단계</span></div>
      <p class="page-desc">${esc(t.desc||'')}</p></div>
    <div class="card"><div class="steps">${t.steps.map((s,i)=>stepView(s,i,false)).join('')}</div></div>
    <div class="card row-flex"><span class="muted small" style="flex:1">이 템플릿으로 실제 건을 돌립니다. 각 단계 완료가 기록돼요.</span>
      <button class="btn primary sm" data-run="${t.id}">▶ 이 프로세스 실행</button></div>`;
  }
  const rn=S.sopRuns().find(x=>x.id===id); if(!rn)return notFound('sop');
  const t=S.sopTpl().find(x=>x.id===rn.tplId); const done=rn.stepDone.filter(Boolean).length;
  const nextIdx=rn.stepDone.findIndex(x=>!x);
  return `<div class="back" data-go="sop">‹ 프로세스</div>
  <div class="page-head"><h1 class="page-title" style="font-size:21px">${esc(t.name)} — ${esc(rn.label||'실행')}</h1>
    <div class="kv-line"><span class="pill ${done===rn.stepDone.length?'decided':'proposed'}">${done}/${rn.stepDone.length} 완료</span>
      <span class="muted small">시작 ${pname(rn.startedBy)} · ${ago(rn.startedAt)}</span></div>
    <div class="bar" style="margin-top:8px;max-width:320px"><i style="width:${Math.round(done/rn.stepDone.length*100)}%"></i></div></div>
  <div class="card"><div class="steps">${t.steps.map((s,i)=>stepView(s,i,rn.stepDone[i],rn.id,i===nextIdx)).join('')}</div></div>`;
}
function stepView(s,i,done,runId,isNext){
  const gate=s.stop&&!done; const canClick=runId&&(done||isNext);
  return `<div class="step ${done?'done':''}">
    <div class="sdot" ${canClick?`data-step="${runId}|${i}" style="cursor:pointer"`:''}>${done?'✓':i+1}</div>
    <div class="sb"><div class="sn">${esc(s.name)}</div>
      <div class="sm">${s.type!=='표준'?`<span class="type-tag type-${s.type}">${s.type}</span>`:''}
        ${s.who?`<span>👤 ${esc(pname(s.who))}</span>`:''}${s.field?`<span class="dim2">📝 ${esc(s.field)}</span>`:''}
        ${gate?`<span class="type-tag type-게이트">통과 전 진행 불가</span>`:''}
        ${canClick&&!done?`<span class="link" data-step="${runId}|${i}">완료 표시 →</span>`:''}</div></div></div>`;
}
function notFound(back){return `<div class="back" data-go="${back}">‹ 뒤로</div><div class="center-empty">찾을 수 없습니다.</div>`;}

// ================= PEOPLE =================
function vPeople(){
  const ppl=S.people();
  return `<div class="page-head"><h1 class="page-title">사람</h1>
    <p class="page-desc">개인·팀·부서. 전문분야와 "저에게 물어보세요", 그리고 도메인별 신뢰도(실적으로 쌓이는)까지.</p></div>
  <button class="btn primary" data-new="people" style="margin-bottom:6px">＋ 사람 등록</button>
  <div class="card">${ppl.map(p=>`<div class="row-click" data-go="people/${p.id}"><div class="avatar">${esc(initials(p.name))}</div>
    <div class="body"><div class="title">${esc(p.name)} <span class="muted small" style="font-weight:500">· ${esc(p.role)}</span></div>
      <div class="meta"><span>${esc(p.dept)}</span>${p.ask?`<span>· 💬 ${esc(p.ask)}</span>`:''}</div>
      ${p.skills&&p.skills.length?`<div class="chips" style="margin-top:7px">${p.skills.map(s=>`<span class="chip">${esc(s)}</span>`).join('')}</div>`:''}</div><div class="chev">›</div></div>`).join('')}</div>`;
}
function vPersonDetail(id){
  const p=S.people().find(x=>x.id===id); if(!p)return notFound('people');
  const reports=S.people().filter(x=>x.manager===id);
  const myOkrs=S.okrs().filter(o=>o.owner===id);
  const bd=Object.entries(p.believe||{});
  const mx=10;
  return `<div class="back" data-go="people">‹ 사람</div>
  <div class="card"><div class="prof-head"><div class="avatar">${esc(initials(p.name))}</div>
    <div><div style="font-size:19px;font-weight:800">${esc(p.name)}</div><div class="muted">${esc(p.role)} · ${esc(p.dept)}</div>
      <div class="muted tiny" style="margin-top:3px">${p.manager?'매니저 '+esc(pname(p.manager))+' · ':''}입사 ${esc(p.start||'—')} · ${esc(p.location||'')}</div></div></div>
    ${p.bio?`<div style="margin-top:12px;line-height:1.6">${esc(p.bio)}</div>`:''}
    ${p.ask?`<div class="small" style="margin-top:8px"><span class="muted">저에게 물어보세요:</span> ${esc(p.ask)}</div>`:''}
    ${p.skills&&p.skills.length?`<div class="chips" style="margin-top:10px">${p.skills.map(s=>`<span class="chip">${esc(s)}</span>`).join('')}</div>`:''}</div>
  ${bd.length?`<div class="section-h"><h2>도메인 신뢰도</h2><span class="muted tiny">실적으로 쌓임 · 직급 아님</span></div>
    <div class="card"><div class="believe-grid">${bd.map(([k,val])=>`<div class="believe-row"><div class="bn">${esc(k)}</div><div class="bb"><i style="width:${val/mx*100}%"></i></div><div class="bv">${val}</div></div>`).join('')}</div></div>`:''}
  ${myOkrs.length?`<div class="section-h"><h2>담당 목표</h2></div>${myOkrs.map(o=>`<div class="card"><div class="okr-head"><div style="font-weight:700">${esc(o.objective)}</div><div class="pct" style="color:var(--acc)">${okrPct(o)}%</div></div><div class="bar ${o.status}" style="margin-top:8px"><i style="width:${okrPct(o)}%"></i></div></div>`).join('')}`:''}
  ${reports.length?`<div class="section-h"><h2>부서원 (${reports.length})</h2></div><div class="card">${reports.map(r=>`<div class="row-click" data-go="people/${r.id}"><div class="avatar sm">${esc(initials(r.name))}</div><div class="body"><div class="title" style="font-size:13.5px">${esc(r.name)} <span class="muted small" style="font-weight:500">· ${esc(r.role)}</span></div></div><div class="chev">›</div></div>`).join('')}</div>`:''}`;
}

// ================= VALUES =================
function vValues(){
  const decs=S.decisions();
  return `<div class="page-head"><h1 class="page-title">핵심 가치</h1>
    <p class="page-desc">이 다섯 가치가 조직도(위계)보다 위에 있다. 충돌하면 가치가 이긴다. 각 가치는 <b>관찰 가능한 행동</b>으로 정의돼, 결정·인정에 태그된다.</p></div>
  ${VALUES.map(v=>{const n=decs.filter(d=>d.valueKey===v.key).length;
    return `<div class="card"><div class="okr-head"><div><span class="vtag ${v.key}"><span class="vdot"></span>${v.code}</span>
      <span style="font-weight:800;font-size:16px;margin-left:8px">${esc(v.name)}</span><span class="muted small"> · ${esc(v.en)}</span></div>
      <span class="muted tiny">연결된 결정 ${n}</span></div>
      <div style="margin:10px 0;line-height:1.7">${esc(v.desc)}</div>
      <div class="muted tiny">행동</div><ul style="margin:6px 0 10px;padding-left:18px;line-height:1.7">${v.behaviors.map(b=>`<li class="small">${esc(b)}</li>`).join('')}</ul>
      <div class="muted small">🛡️ 이 가치를 근거로 → ${esc(v.object)}</div></div>`;}).join('')}`;
}

// ================= MODALS =================
function modal(html){ const bg=document.createElement('div');bg.className='modal-bg';bg.innerHTML=`<div class="modal">${html}</div>`;
  bg.addEventListener('click',e=>{if(e.target===bg)bg.remove();}); document.body.appendChild(bg);
  const f=bg.querySelector('input,textarea,select');if(f)setTimeout(()=>f.focus(),60); return bg; }
const closeModal=el=>{const m=el.closest('.modal-bg');if(m)m.remove();};
function toast(msg){let t=document.querySelector('.toast');if(t)t.remove();t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);requestAnimationFrame(()=>t.classList.add('show'));setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),250);},1900);}

function newFor(r){ ({decisions:newDecision,okr:newOkr,sop:newSop,people:newPerson})[r]?.(); }

// -- template picker --
function pickTemplate(kind,onPick){
  const tpls=window.TEMPLATES[kind]||[];
  const m=modal(`<h3>템플릿으로 시작</h3><div class="mdesc">빈칸부터 채우지 말고, 가까운 걸 골라 고치세요.</div>
    <div class="tgal">${tpls.map((t,i)=>`<div class="tcard" data-t="${i}"><div class="tt">${esc(t.label)}</div><div class="th">${esc(t.hint)}</div></div>`).join('')}</div>`);
  m.querySelectorAll('.tcard').forEach(c=>c.onclick=()=>{const t=tpls[+c.dataset.t];closeModal(m);onPick(JSON.parse(JSON.stringify(t.data||{})));});
}

function newDecision(){ pickTemplate('decision',data=>decisionForm(data)); }
function decisionForm(d){
  const opts=(d.options&&d.options.length?d.options:['','']);
  const m=modal(`<h3>제안 · 이의 올리기</h3><div class="mdesc">직급 무관. 반드시 <b>가치 + 근거 + 2개 이상 선택지</b>로.</div>
    <div class="field"><label>제목 <span class="hintlbl">질문 형태로</span></label><input id="f-title" value="${esc(d.title||'')}" placeholder="예: 신제품 패키지, 성분 투명성을 우선할까?"></div>
    <div class="field"><label>도메인 <span class="hintlbl">신뢰도 가중 기준</span></label>
      <select id="f-dom">${['전략','제품','마케팅','생산','재무','인사'].map(x=>`<option ${d.domain===x?'selected':''}>${x}</option>`).join('')}</select></div>
    <div class="field"><label>연결 가치</label><div class="chips-sel" id="f-vals">${VALUES.map(v=>`<div class="vchip ${v.key} ${d.valueKey===v.key?'on':''}" data-v="${v.key}">${v.code} ${v.name}</div>`).join('')}</div></div>
    <div class="field"><label>맥락</label><textarea id="f-ctx" placeholder="무엇을 왜 정해야 하나">${esc(d.context||'')}</textarea></div>
    <div class="field"><label>선택지 <span class="hintlbl">2개 이상 (앵커링 방지)</span></label><div class="opt-inputs" id="f-opts">${opts.map(o=>`<div class="oi"><input value="${esc(o)}" placeholder="선택지"><button class="btn sm ghost" data-rmopt>✕</button></div>`).join('')}</div><button class="btn sm ghost" id="f-addopt">＋ 선택지</button></div>
    <div class="field"><label>근거 <span class="hintlbl">데이터·경험</span></label><textarea id="f-ev" placeholder="이 방향을 뒷받침하는 근거">${esc(d.evidence||'')}</textarea></div>
    <div class="field"><label>되돌릴 수 있나? <span class="hintlbl">과정 무게 결정</span></label>
      <div class="seg" id="f-rev"><div class="opt ${d.reversibility!=='one'?'on':''}" data-r="two">되돌릴 수 있음 (빠르게)</div><div class="opt ${d.reversibility==='one'?'on':''}" data-r="one">되돌리기 어려움 (신중)</div></div></div>
    <div class="modal-actions"><button class="btn ghost" data-cancel>취소</button><button class="btn primary" id="f-save">올리기</button></div>`);
  let vk=d.valueKey||'', rev=d.reversibility==='one'?'one':'two';
  m.querySelectorAll('.vchip').forEach(c=>c.onclick=()=>{m.querySelectorAll('.vchip').forEach(x=>x.classList.remove('on'));c.classList.add('on');vk=c.dataset.v;});
  m.querySelectorAll('#f-rev .opt').forEach(o=>o.onclick=()=>{m.querySelectorAll('#f-rev .opt').forEach(x=>x.classList.remove('on'));o.classList.add('on');rev=o.dataset.r;});
  m.querySelector('#f-addopt').onclick=()=>{const w=document.createElement('div');w.className='oi';w.innerHTML=`<input placeholder="선택지"><button class="btn sm ghost" data-rmopt>✕</button>`;m.querySelector('#f-opts').appendChild(w);w.querySelector('[data-rmopt]').onclick=()=>w.remove();};
  m.querySelectorAll('[data-rmopt]').forEach(b=>b.onclick=()=>b.closest('.oi').remove());
  m.querySelector('[data-cancel]').onclick=()=>closeModal(m);
  m.querySelector('#f-save').onclick=()=>{
    const title=m.querySelector('#f-title').value.trim();
    const options=[...m.querySelectorAll('#f-opts input')].map(i=>i.value.trim()).filter(Boolean);
    const ev=m.querySelector('#f-ev').value.trim();
    if(!title)return toast('제목을 입력하세요');
    if(!vk)return toast('연결 가치를 고르세요');
    if(options.length<2)return toast('선택지를 2개 이상 입력하세요');
    if(!ev)return toast('근거를 입력하세요 (가치>위계의 핵심)');
    const decs=S.decisions();
    decs.push({id:uid('d_'),title,domain:m.querySelector('#f-dom').value,valueKey:vk,proposer:me().id,reversibility:rev,status:'proposed',
      context:m.querySelector('#f-ctx').value.trim(),options,evidence:ev,votes:[],chosen:'',decidedBy:'',dissent:'',expected:'',confidence:0,reviewDate:'',createdAt:nowISO()});
    S.set('decisions',decs);closeModal(m);toast('제안이 기록되었습니다');go('decisions/'+decs[decs.length-1].id);
  };
}
function voteDecision(id){
  const d=S.decisions().find(x=>x.id===id);
  const m=modal(`<h3>내 표 · 근거</h3><div class="mdesc">직책이 아니라 근거로. 당신의 표는 <b>${esc(d.domain)}</b> 도메인 신뢰도로 가중됩니다.</div>
    <div class="field"><label>선택</label><select id="v-ch">${d.options.map(o=>`<option>${esc(o)}</option>`).join('')}</select></div>
    <div class="field"><label>근거</label><textarea id="v-r" placeholder="왜 그렇게 보는지"></textarea></div>
    <div class="modal-actions"><button class="btn ghost" data-cancel>취소</button><button class="btn primary" id="v-save">등록</button></div>`);
  m.querySelector('[data-cancel]').onclick=()=>closeModal(m);
  m.querySelector('#v-save').onclick=()=>{const reason=m.querySelector('#v-r').value.trim();if(!reason)return toast('근거를 입력하세요');
    const decs=S.decisions();const dd=decs.find(x=>x.id===id);
    dd.votes=dd.votes.filter(v=>v.voter!==me().id);
    dd.votes.push({voter:me().id,choice:m.querySelector('#v-ch').value,reason});
    S.set('decisions',decs);closeModal(m);toast('표가 기록되었습니다');render();};
}
function decideDecision(id){
  const d=S.decisions().find(x=>x.id===id);const t=tally(d);
  const m=modal(`<h3>결정 기록</h3><div class="mdesc">근거가 더 옳은 쪽이 이깁니다. 신뢰도 가중 우세: <b>${esc(t.wWin||'—')}</b>. 반대의견도 남기세요(disagree & commit).</div>
    <div class="field"><label>결론(택1)</label><select id="d-ch">${d.options.map(o=>`<option ${o===t.wWin?'selected':''}>${esc(o)}</option>`).join('')}</select></div>
    <div class="field"><label>결정 방식</label><input id="d-by" value="${t.diverge?'신뢰도 가중 우세':'합의'}" placeholder="예: 신뢰도 가중 우세 / 합의"></div>
    <div class="field"><label>반대의견 <span class="hintlbl">있으면 기록</span></label><input id="d-dis" placeholder="없으면 비워두세요"></div>
    <div class="field"><label>예상 결과 + 리뷰</label><input id="d-exp" placeholder="예: 재구매율 6개월 +10%p"></div>
    <div class="row-flex"><div class="field" style="flex:1"><label>확신 %</label><input id="d-conf" type="number" value="70" min="0" max="100"></div>
      <div class="field" style="flex:1"><label>리뷰 예정일</label><input id="d-rev" type="date"></div></div>
    <div class="modal-actions"><button class="btn ghost" data-cancel>취소</button><button class="btn primary" id="d-save">결정 확정</button></div>`);
  m.querySelector('[data-cancel]').onclick=()=>closeModal(m);
  m.querySelector('#d-save').onclick=()=>{const decs=S.decisions();const dd=decs.find(x=>x.id===id);
    dd.chosen=m.querySelector('#d-ch').value;dd.decidedBy=m.querySelector('#d-by').value.trim()||'합의';
    dd.dissent=m.querySelector('#d-dis').value.trim();dd.expected=m.querySelector('#d-exp').value.trim();
    dd.confidence=+m.querySelector('#d-conf').value||0;dd.reviewDate=m.querySelector('#d-rev').value;
    dd.status='decided';dd.decidedAt=nowISO();S.set('decisions',decs);closeModal(m);toast('결정이 기록되었습니다');render();};
}

function newOkr(){ pickTemplate('okr',data=>okrForm(data)); }
function okrForm(d){
  const krs=(d.krs&&d.krs.length?d.krs:[{name:'',unit:'%',start:0,current:0,target:100}]);
  const krRow=k=>`<div class="oi" style="flex-wrap:wrap;gap:6px"><input style="flex:2;min-width:120px" placeholder="Key Result" value="${esc(k.name||'')}" data-kn>
    <input style="width:52px" placeholder="단위" value="${esc(k.unit||'%')}" data-ku>
    <input style="width:56px" type="number" placeholder="시작" value="${k.start??0}" data-ks>
    <input style="width:56px" type="number" placeholder="현재" value="${k.current??0}" data-kc>
    <input style="width:56px" type="number" placeholder="목표" value="${k.target??100}" data-kt>
    <button class="btn sm ghost" data-rmkr>✕</button></div>`;
  const m=modal(`<h3>목표 추가</h3><div class="mdesc">Objective(정성) + Key Results(정량).</div>
    <div class="field"><label>Objective</label><input id="o-obj" value="${esc(d.objective||'')}" placeholder="무엇을 이룰 것인가"></div>
    <div class="row-flex"><div class="field" style="flex:1"><label>레벨</label><select id="o-lvl"><option>부서</option><option>팀</option><option>전사</option><option>개인</option></select></div>
      <div class="field" style="flex:1"><label>부서</label><select id="o-dept">${window.DEPTS_LIST.map(x=>`<option>${x}</option>`).join('')}</select></div></div>
    <div class="field"><label>담당</label><select id="o-owner">${S.people().map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>
    <div class="field"><label>Key Results <span class="hintlbl">시작→현재→목표로 진행률 자동</span></label><div id="o-krs">${krs.map(krRow).join('')}</div><button class="btn sm ghost" id="o-addkr">＋ KR</button></div>
    <div class="modal-actions"><button class="btn ghost" data-cancel>취소</button><button class="btn primary" id="o-save">저장</button></div>`);
  const wire=w=>w.querySelector('[data-rmkr]').onclick=()=>w.remove();
  m.querySelectorAll('#o-krs .oi').forEach(wire);
  m.querySelector('#o-addkr').onclick=()=>{const div=document.createElement('div');div.innerHTML=krRow({unit:'%',start:0,current:0,target:100});const w=div.firstElementChild;m.querySelector('#o-krs').appendChild(w);wire(w);};
  m.querySelector('[data-cancel]').onclick=()=>closeModal(m);
  m.querySelector('#o-save').onclick=()=>{const obj=m.querySelector('#o-obj').value.trim();if(!obj)return toast('Objective를 입력하세요');
    const krs=[...m.querySelectorAll('#o-krs .oi')].map(w=>({id:uid('kr_'),name:w.querySelector('[data-kn]').value.trim(),unit:w.querySelector('[data-ku]').value.trim()||'%',start:+w.querySelector('[data-ks]').value||0,current:+w.querySelector('[data-kc]').value||0,target:+w.querySelector('[data-kt]').value||0})).filter(k=>k.name);
    if(!krs.length)return toast('Key Result를 1개 이상 입력하세요');
    const okrs=S.okrs();okrs.push({id:uid('o_'),level:m.querySelector('#o-lvl').value,dept:m.querySelector('#o-dept').value,owner:m.querySelector('#o-owner').value,cycle:'2026 H2',objective:obj,status:'ontrack',krs});
    S.set('okrs',okrs);closeModal(m);toast('목표가 추가되었습니다');render();};
}
function checkin(arg){ const [oid,kid]=arg.split('|');const okrs=S.okrs();const o=okrs.find(x=>x.id===oid);const k=o.krs.find(x=>x.id===kid);
  const m=modal(`<h3>체크인 — ${esc(k.name)}</h3><div class="mdesc">현재 값을 갱신하세요. 진행률이 자동 반영됩니다.</div>
    <div class="field"><label>현재 값 (${esc(k.unit)}) <span class="hintlbl">시작 ${k.start} → 목표 ${k.target}</span></label><input id="c-v" type="number" value="${k.current}"></div>
    <div class="field"><label>상태</label><div class="seg" id="c-st">${['ontrack','risk','behind'].map(s=>`<div class="opt ${o.status===s?'on':''}" data-s="${s}">${STATUS_KR[s]}</div>`).join('')}</div></div>
    <div class="modal-actions"><button class="btn ghost" data-cancel>취소</button><button class="btn primary" id="c-save">갱신</button></div>`);
  let st=o.status;m.querySelectorAll('#c-st .opt').forEach(x=>x.onclick=()=>{m.querySelectorAll('#c-st .opt').forEach(y=>y.classList.remove('on'));x.classList.add('on');st=x.dataset.s;});
  m.querySelector('[data-cancel]').onclick=()=>closeModal(m);
  m.querySelector('#c-save').onclick=()=>{k.current=+m.querySelector('#c-v').value;o.status=st;S.set('okrs',okrs);closeModal(m);toast('체크인 완료');render();};
}

function newSop(){ pickTemplate('sop',data=>sopForm(data)); }
function sopForm(d){
  const steps=(d.steps&&d.steps.length?d.steps.map(s=>Array.isArray(s)?s:[s.name||'',s.type||'표준']):[['','표준']]);
  const row=s=>`<div class="oi"><input style="flex:1" placeholder="단계 이름" value="${esc(s[0]||'')}" data-sn>
    <select style="width:90px" data-st>${['표준','승인','게이트'].map(t=>`<option ${s[1]===t?'selected':''}>${t}</option>`).join('')}</select>
    <button class="btn sm ghost" data-rmst>✕</button></div>`;
  const m=modal(`<h3>프로세스 템플릿</h3><div class="mdesc">단계를 정의하세요. 승인/게이트는 통과 전 진행을 막습니다.</div>
    <div class="field"><label>이름</label><input id="s-name" placeholder="예: 맞춤화장품 생산관리"></div>
    <div class="row-flex"><div class="field" style="flex:1"><label>부서</label><select id="s-dept">${window.DEPTS_LIST.map(x=>`<option>${x}</option>`).join('')}</select></div>
      <div class="field" style="flex:1"><label>책임자</label><select id="s-owner">${S.people().map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div></div>
    <div class="field"><label>설명</label><input id="s-desc" value="${esc(d.desc||'')}" placeholder="한 줄 요약"></div>
    <div class="field"><label>단계</label><div id="s-steps">${steps.map(row).join('')}</div><button class="btn sm ghost" id="s-add">＋ 단계</button></div>
    <div class="modal-actions"><button class="btn ghost" data-cancel>취소</button><button class="btn primary" id="s-save">저장</button></div>`);
  const wire=w=>w.querySelector('[data-rmst]').onclick=()=>w.remove();
  m.querySelectorAll('#s-steps .oi').forEach(wire);
  m.querySelector('#s-add').onclick=()=>{const div=document.createElement('div');div.innerHTML=row(['','표준']);const w=div.firstElementChild;m.querySelector('#s-steps').appendChild(w);wire(w);};
  m.querySelector('[data-cancel]').onclick=()=>closeModal(m);
  m.querySelector('#s-save').onclick=()=>{const name=m.querySelector('#s-name').value.trim();if(!name)return toast('이름을 입력하세요');
    const steps=[...m.querySelectorAll('#s-steps .oi')].map(w=>{const t=w.querySelector('[data-st]').value;return {id:uid('s_'),name:w.querySelector('[data-sn]').value.trim(),type:t,who:'',stop:t!=='표준',done:false};}).filter(s=>s.name);
    if(!steps.length)return toast('단계를 1개 이상 입력하세요');
    const tpls=S.sopTpl();tpls.push({id:uid('sop_'),name,dept:m.querySelector('#s-dept').value,owner:m.querySelector('#s-owner').value,desc:m.querySelector('#s-desc').value.trim(),steps});
    S.set('sopTpl',tpls);closeModal(m);toast('프로세스 템플릿이 추가되었습니다');render();};
}
function runSop(tplId){ const t=S.sopTpl().find(x=>x.id===tplId);
  const m=modal(`<h3>프로세스 실행 — ${esc(t.name)}</h3><div class="mdesc">이 건에 이름을 붙이세요. 각 단계 완료가 기록됩니다.</div>
    <div class="field"><label>실행 이름 <span class="hintlbl">예: 고객/건 번호</span></label><input id="r-label" placeholder="예: 고객 #A-2291 맞춤 세럼"></div>
    <div class="modal-actions"><button class="btn ghost" data-cancel>취소</button><button class="btn primary" id="r-save">▶ 실행 시작</button></div>`);
  m.querySelector('[data-cancel]').onclick=()=>closeModal(m);
  m.querySelector('#r-save').onclick=()=>{const runs=S.sopRuns();const id=uid('run_');
    runs.push({id,tplId,label:m.querySelector('#r-label').value.trim()||'실행',startedBy:me().id,startedAt:nowISO(),stepDone:t.steps.map(()=>false)});
    S.set('sopRuns',runs);closeModal(m);toast('실행을 시작했습니다');go('sop/run:'+id);};
}
function toggleStep(arg){ const [runId,idx]=arg.split('|');const i=+idx;const runs=S.sopRuns();const rn=runs.find(x=>x.id===runId);
  // 게이트/순차: 이전 단계 미완료면 막기
  if(!rn.stepDone[i]){ for(let j=0;j<i;j++){ if(!rn.stepDone[j]){toast('이전 단계를 먼저 완료하세요');return;} } }
  rn.stepDone[i]=!rn.stepDone[i]; S.set('sopRuns',runs);render();}

function newPerson(){
  const m=modal(`<h3>사람 등록</h3>
    <div class="field"><label>이름</label><input id="p-name"></div>
    <div class="row-flex"><div class="field" style="flex:1"><label>부서</label><select id="p-dept">${window.DEPTS_LIST.map(x=>`<option>${x}</option>`).join('')}</select></div>
      <div class="field" style="flex:1"><label>역할</label><input id="p-role" placeholder="예: 연구원"></div></div>
    <div class="field"><label>매니저</label><select id="p-mgr"><option value="">없음</option>${S.people().map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>
    <div class="field"><label>전문분야 <span class="hintlbl">쉼표로</span></label><input id="p-skills" placeholder="예: 조제공정, GMP, QC"></div>
    <div class="field"><label>저에게 물어보세요</label><input id="p-ask" placeholder="예: 품질 · 공급망"></div>
    <div class="modal-actions"><button class="btn ghost" data-cancel>취소</button><button class="btn primary" id="p-save">등록</button></div>`);
  m.querySelector('[data-cancel]').onclick=()=>closeModal(m);
  m.querySelector('#p-save').onclick=()=>{const name=m.querySelector('#p-name').value.trim();if(!name)return toast('이름을 입력하세요');
    const ppl=S.people();ppl.push({id:uid('p_'),name,dept:m.querySelector('#p-dept').value,role:m.querySelector('#p-role').value.trim(),manager:m.querySelector('#p-mgr').value,
      skills:m.querySelector('#p-skills').value.split(',').map(s=>s.trim()).filter(Boolean),ask:m.querySelector('#p-ask').value.trim(),bio:'',believe:{},start:'',location:'',birthday:'',anniversary:''});
    S.set('people',ppl);closeModal(m);toast('등록되었습니다');render();};
}

// ================= COMMAND PALETTE =================
function openCmdK(){
  if(document.querySelector('.cmdk-bg'))return;
  const cmds=[
    ...NAV.map(n=>({ic:n.ic,label:n.label+' 열기',sub:'이동',run:()=>go(n.r)})),
    {ic:'⚖️',label:'새 제안·이의',sub:'생성',run:()=>newDecision()},
    {ic:'🎯',label:'새 목표(OKR)',sub:'생성',run:()=>newOkr()},
    {ic:'📋',label:'새 프로세스',sub:'생성',run:()=>newSop()},
    {ic:'👤',label:'새 사람',sub:'생성',run:()=>newPerson()},
    ...S.decisions().map(d=>({ic:'⚖️',label:d.title,sub:'결정',run:()=>go('decisions/'+d.id)})),
    ...S.okrs().map(o=>({ic:'🎯',label:o.objective,sub:'목표',run:()=>go('okr')})),
    ...S.people().map(p=>({ic:'👤',label:p.name+' · '+p.role,sub:'사람',run:()=>go('people/'+p.id)})),
  ];
  const bg=document.createElement('div');bg.className='cmdk-bg';
  bg.innerHTML=`<div class="cmdk"><input placeholder="이동하거나 만들 것을 입력…" /><div class="res"></div></div>`;
  document.body.appendChild(bg);
  const input=bg.querySelector('input'),res=bg.querySelector('.res');let sel=0,list=cmds;
  const fuzzy=(q,s)=>{q=q.toLowerCase();s=s.toLowerCase();let i=0;for(const c of s){if(c===q[i])i++;}return i===q.length;};
  function draw(){res.innerHTML=list.slice(0,8).map((c,i)=>`<div class="ci ${i===sel?'sel':''}" data-i="${i}"><span class="cic">${c.ic}</span><span>${esc(c.label)}</span><span class="csub">${c.sub}</span></div>`).join('')||`<div class="ci muted">결과 없음</div>`;
    res.querySelectorAll('.ci[data-i]').forEach(el=>el.onclick=()=>{const c=list[+el.dataset.i];close();c.run();});}
  function filter(){const q=input.value.trim();list=q?cmds.filter(c=>fuzzy(q,c.label)||fuzzy(q,c.sub)):cmds;sel=0;draw();}
  function close(){bg.remove();document.removeEventListener('keydown',onKey);}
  function onKey(e){if(e.key==='Escape')close();else if(e.key==='ArrowDown'){e.preventDefault();sel=Math.min(sel+1,Math.min(list.length,8)-1);draw();}
    else if(e.key==='ArrowUp'){e.preventDefault();sel=Math.max(sel-1,0);draw();}
    else if(e.key==='Enter'){e.preventDefault();const c=list[sel];if(c){close();c.run();}}}
  input.addEventListener('input',filter);document.addEventListener('keydown',onKey);
  bg.addEventListener('click',e=>{if(e.target===bg)close();});
  filter();setTimeout(()=>input.focus(),40);
}

// ================= BIND =================
function bind(r,arg){
  document.querySelectorAll('[data-go]').forEach(el=>el.onclick=e=>{e.stopPropagation();go(el.dataset.go);});
  document.querySelectorAll('[data-new]').forEach(el=>el.onclick=()=>newFor(el.dataset.new));
  document.querySelectorAll('[data-vote]').forEach(el=>el.onclick=e=>{e.stopPropagation();voteDecision(el.dataset.vote);});
  document.querySelectorAll('[data-decide]').forEach(el=>el.onclick=e=>{e.stopPropagation();decideDecision(el.dataset.decide);});
  document.querySelectorAll('[data-checkin]').forEach(el=>el.onclick=e=>{e.stopPropagation();checkin(el.dataset.checkin);});
  document.querySelectorAll('[data-run]').forEach(el=>el.onclick=e=>{e.stopPropagation();runSop(el.dataset.run);});
  document.querySelectorAll('[data-step]').forEach(el=>el.onclick=e=>{e.stopPropagation();toggleStep(el.dataset.step);});
  document.querySelectorAll('[data-cmdk]').forEach(el=>el.onclick=()=>openCmdK());
  const fseg=document.getElementById('filter');
  if(fseg)fseg.querySelectorAll('.opt').forEach(o=>o.onclick=()=>{fseg.querySelectorAll('.opt').forEach(x=>x.classList.remove('on'));o.classList.add('on');
    const f=o.dataset.f;let list=[...S.decisions()].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    if(f!=='all')list=list.filter(d=>d.status===f);
    const el=document.getElementById('dlist');el.innerHTML=decRows(list);
    el.querySelectorAll('[data-go]').forEach(x=>x.onclick=e=>{e.stopPropagation();go(x.dataset.go);});});
}

// ================= BOOT =================
window.addEventListener('hashchange',render);
window.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openCmdK();}});
window.__bootApp=function(){ seedIfNeeded(); if(!location.hash)location.hash='#/home'; render(); };
