import{K as E,V as L,p as b,r as q,t as w,g,i as D,j,k as I,l as M,m as h,n as R,o as T,q as x,S,u as H,v as O,w as A}from"./hoisted.Df80yk3M.js";const a=e=>document.querySelector(e),p=e=>Array.prototype.slice.call(document.querySelectorAll(e)),V=Object.fromEntries(E.map(e=>[e.id,e])),k=Object.fromEntries(L.map(e=>[e.id,e])),d=e=>String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");let l={kind:"all",verified:null,q:""};function C(){const e=H();a("#ibStats").innerHTML=[["총 던진 것",e.total,""],["오늘",e.today,""],["연속",e.streak+"일",""],["안 끝난 할 일",e.openTodo,""],["미확인 근거",e.unverified,""],["자산까지",e.assets,"good"],["승격률",e.promoteRate+"%","good"],["결정 카드",e.decisions,""]].map(([t,n,c])=>`<div class="ib-st ${c}"><b>${d(n)}</b><span>${d(t)}</span></div>`).join("")}function F(e){const t=V[e.kind]||{ic:"·",ko:e.kind,c:"#999"},n=k[e.verified]||k.unknown,c=h(),o=e.due&&e.due<c&&!e.done,s=S.indexOf(e.stage);return`<div class="ic" style="--kc:${t.c}" id="${e.id}">
        <div class="ic-top">
          <span class="ic-kind">${t.ic} ${d(t.ko)}</span>
          ${e.due?`<span class="ic-due ${o?"over":""}">📅 ${d(e.due)}${o?" 지남":""}</span>`:""}
          <button class="ic-v" data-v="${e.id}" title="${d(n.desc)} — 눌러서 바꾸기" style="color:${n.c}">${n.ic} ${d(n.ko)}</button>
        </div>
        <div class="ic-txt ${e.done?"done":""}">${d(e.text)}</div>
        ${e.routeWhy?`<p class="ic-why">🎼 ${d(e.routeWhy)}</p>`:""}
        ${(e.tags||[]).length?`<div class="ic-tags">${e.tags.map(r=>`<span class="ic-tag">#${d(r)}</span>`).join("")}</div>`:""}
        <div class="ic-act">
          ${s>0?`<button class="ic-b" data-dn="${e.id}" title="한 칸 내리기">←</button>`:""}
          ${s<3?`<button class="ic-b up" data-up="${e.id}">승격 →</button>`:'<span class="ic-tag">💎 자산</span>'}
          ${e.kind==="todo"?`<button class="ic-b" data-done="${e.id}">${e.done?"되돌리기":"완료"}</button>`:""}
          ${e.kind==="question"||e.kind==="decision"?`<button class="ic-b" data-dec="${e.id}">결정카드</button>`:""}
          <button class="ic-b del" data-del="${e.id}">삭제</button>
        </div>
      </div>`}function v(){const e=x({q:l.q,verified:l.verified||void 0}),t=l.kind==="all"?e:e.filter(n=>n.kind===l.kind);S.forEach(n=>{const c=t.filter(u=>u.stage===n),o=document.querySelector(`[data-list="${n}"]`),s=document.querySelector(`[data-empty="${n}"]`),r=document.querySelector(`[data-n="${n}"]`);r&&(r.textContent=String(c.length)),o&&(o.innerHTML=c.map(F).join("")),s&&(s.hidden=c.length>0)})}function K(){const e=O(),t=a("#decList");if(!e.length){t.innerHTML='<p class="dec-none">아직 남긴 결정이 없어요. 위에서 한 장 남겨보세요 — 쌓이면 다음 결정이 쉬워집니다.</p>';return}t.innerHTML=e.map(n=>`<article class="dc">
        <h4>${d(n.q)}</h4>
        <dl>
          ${n.decision?`<dt>📌 결정</dt><dd>${d(n.decision)}</dd>`:""}
          ${n.criteria?`<dt>🎯 기준</dt><dd>${d(n.criteria)}</dd>`:""}
          ${n.risk?`<dt>⚠️ 리스크</dt><dd>${d(n.risk)}</dd>`:""}
          ${n.firstStep?`<dt>👣 첫걸음</dt><dd>${d(n.firstStep)}</dd>`:""}
        </dl>
        <div class="dc-bot"><span class="dc-ts">${new Date(n.ts).toLocaleString("ko-KR")}</span>
        <button class="dc-del" data-dd="${n.id}">삭제</button></div>
      </article>`).join("")}function Q(){const e=A(),t=Object.entries(e).sort((o,s)=>s[1].n-o[1].n).slice(0,12),n=a("#honestGrid");if(!t.length){n.innerHTML='<p class="dec-none">아직 기록이 없어요. 페이지를 열 때마다 여기 쌓입니다.</p>';return}const c=Date.now()-14*864e5;n.innerHTML=t.map(([o,s])=>{const r=s.last<c,u=Math.max(0,Math.round((Date.now()-s.last)/864e5));return`<div class="hs ${r?"cold":""}">
          <div class="hs-p">${d(o)}</div>
          <div class="hs-n"><b>${s.n}</b>번 열었고, ${u===0?"오늘":u+"일 전"}이 마지막${r?" — 2주 넘게 안 열었어요":""}</div>
        </div>`}).join("")}function i(){C(),v(),K(),Q()}document.addEventListener("click",e=>{const t=e.target;if(!(t instanceof HTMLElement))return;const n=t.dataset.up,c=t.dataset.dn,o=t.dataset.del,s=t.dataset.v,r=t.dataset.done,u=t.dataset.dec,$=t.dataset.dd;if(n)b(n,1),i();else if(c)b(c,-1),i();else if(o)q(o),i();else if(r)w(r),i();else if(s){const f=g(s),m=["unknown","verified","inferred"];D(s,m[(m.indexOf(f.verified)+1)%3]),i()}else if(u){const f=g(u);f&&(document.querySelector("#decQ").value=f.text,document.querySelector(".ib-dec").scrollIntoView({behavior:"smooth"}),document.querySelector("#decD").focus())}else $&&(j($),i())});p(".ibf[data-k]").forEach(e=>e.addEventListener("click",()=>{l.kind=e.dataset.k,p(".ibf[data-k]").forEach(t=>t.classList.toggle("on",t===e)),v()}));p(".ibf[data-v]").forEach(e=>e.addEventListener("click",()=>{l.verified=l.verified?null:e.dataset.v,e.classList.toggle("on",!!l.verified),v()}));a("#ibQ")?.addEventListener("input",e=>{l.q=e.target.value.trim(),v()});a("#ibSeed")?.addEventListener("click",()=>{I(),i()});a("#ibExport")?.addEventListener("click",()=>{const e=new Blob([M()],{type:"application/json"}),t=document.createElement("a");t.href=URL.createObjectURL(e),t.download="aramirror-os-"+h()+".json",t.click()});a("#decForm")?.addEventListener("submit",e=>{e.preventDefault(),R({q:a("#decQ").value,decision:a("#decD").value,criteria:a("#decC").value,risk:a("#decR").value,firstStep:a("#decF").value}),["#decQ","#decD","#decC","#decR","#decF"].forEach(t=>{a(t).value=""}),i()});T(i);window.addEventListener("aramos:captured",i);i();const y=new URLSearchParams(location.search).get("f");y==="todo"&&document.querySelector('.ibf[data-k="todo"]')?.click();y==="unknown"&&document.querySelector('.ibf[data-v="unknown"]')?.click();
