import{K as L,V as q,p as g,j as p,r as w,k as D,l as k,m as j,q as I,u as x,v as M,w as y,x as R,o as T,y as H,S,z as O,A,B as V}from"./hoisted.BT7d54VM.js";const o=e=>document.querySelector(e),$=e=>Array.prototype.slice.call(document.querySelectorAll(e)),C=Object.fromEntries(L.map(e=>[e.id,e])),h=Object.fromEntries(q.map(e=>[e.id,e])),d=e=>String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");let l={kind:"all",verified:null,q:""};function F(){const e=O();o("#ibStats").innerHTML=[["총 던진 것",e.total,""],["오늘",e.today,""],["연속",e.streak+"일",""],["안 끝난 할 일",e.openTodo,""],["미확인 근거",e.unverified,""],["자산까지",e.assets,"good"],["승격률",e.promoteRate+"%","good"],["결정 카드",e.decisions,""]].map(([t,n,c])=>`<div class="ib-st ${c}"><b>${d(n)}</b><span>${d(t)}</span></div>`).join("")}function K(e){const t=C[e.kind]||{ic:"·",ko:e.kind,c:"#999"},n=h[e.verified]||h.unknown,c=y(),a=e.due&&e.due<c&&!e.done,s=S.indexOf(e.stage);return`<div class="ic" style="--kc:${t.c}" id="${e.id}">
        <div class="ic-top">
          <span class="ic-kind">${t.ic} ${d(t.ko)}</span>
          ${e.due?`<span class="ic-due ${a?"over":""}">📅 ${d(e.due)}${a?" 지남":""}</span>`:""}
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
      </div>`}function v(){const e=H({q:l.q,verified:l.verified||void 0}),t=l.kind==="all"?e:e.filter(n=>n.kind===l.kind);S.forEach(n=>{const c=t.filter(u=>u.stage===n),a=document.querySelector(`[data-list="${n}"]`),s=document.querySelector(`[data-empty="${n}"]`),r=document.querySelector(`[data-n="${n}"]`);r&&(r.textContent=String(c.length)),a&&(a.innerHTML=c.map(K).join("")),s&&(s.hidden=c.length>0)})}function Q(){const e=A(),t=o("#decList");if(!e.length){t.innerHTML='<p class="dec-none">아직 남긴 결정이 없어요. 위에서 한 장 남겨보세요 — 쌓이면 다음 결정이 쉬워집니다.</p>';return}t.innerHTML=e.map(n=>`<article class="dc">
        <h4>${d(n.q)}</h4>
        <dl>
          ${n.decision?`<dt>📌 결정</dt><dd>${d(n.decision)}</dd>`:""}
          ${n.criteria?`<dt>🎯 기준</dt><dd>${d(n.criteria)}</dd>`:""}
          ${n.risk?`<dt>⚠️ 리스크</dt><dd>${d(n.risk)}</dd>`:""}
          ${n.firstStep?`<dt>👣 첫걸음</dt><dd>${d(n.firstStep)}</dd>`:""}
        </dl>
        <div class="dc-bot"><span class="dc-ts">${new Date(n.ts).toLocaleString("ko-KR")}</span>
        <button class="dc-del" data-dd="${n.id}">삭제</button></div>
      </article>`).join("")}function U(){const e=V(),t=Object.entries(e).sort((a,s)=>s[1].n-a[1].n).slice(0,12),n=o("#honestGrid");if(!t.length){n.innerHTML='<p class="dec-none">아직 기록이 없어요. 페이지를 열 때마다 여기 쌓입니다.</p>';return}const c=Date.now()-14*864e5;n.innerHTML=t.map(([a,s])=>{const r=s.last<c,u=Math.max(0,Math.round((Date.now()-s.last)/864e5));return`<div class="hs ${r?"cold":""}">
          <div class="hs-p">${d(a)}</div>
          <div class="hs-n"><b>${s.n}</b>번 열었고, ${u===0?"오늘":u+"일 전"}이 마지막${r?" — 2주 넘게 안 열었어요":""}</div>
        </div>`}).join("")}function i(){F(),v(),Q(),U()}document.addEventListener("click",e=>{const t=e.target;if(!(t instanceof HTMLElement))return;const n=t.dataset.up,c=t.dataset.dn,a=t.dataset.del,s=t.dataset.v,r=t.dataset.done,u=t.dataset.dec,m=t.dataset.dd;if(n)g(n,1),p("up"),i();else if(c)g(c,-1),i();else if(a)w(a),p("deleted"),i();else if(r)D(r),i();else if(s){const f=k(s),b=["unknown","verified","inferred"];j(s,b[(b.indexOf(f.verified)+1)%3]),i()}else if(u){const f=k(u);f&&(document.querySelector("#decQ").value=f.text,document.querySelector(".ib-dec").scrollIntoView({behavior:"smooth"}),document.querySelector("#decD").focus())}else m&&(I(m),i())});$(".ibf[data-k]").forEach(e=>e.addEventListener("click",()=>{l.kind=e.dataset.k,$(".ibf[data-k]").forEach(t=>t.classList.toggle("on",t===e)),v()}));$(".ibf[data-v]").forEach(e=>e.addEventListener("click",()=>{l.verified=l.verified?null:e.dataset.v,e.classList.toggle("on",!!l.verified),v()}));o("#ibQ")?.addEventListener("input",e=>{l.q=e.target.value.trim(),v()});o("#ibSeed")?.addEventListener("click",()=>{x(),i()});o("#ibExport")?.addEventListener("click",()=>{const e=new Blob([M()],{type:"application/json"}),t=document.createElement("a");t.href=URL.createObjectURL(e),t.download="aramirror-os-"+y()+".json",t.click()});o("#decForm")?.addEventListener("submit",e=>{e.preventDefault(),R({q:o("#decQ").value,decision:o("#decD").value,criteria:o("#decC").value,risk:o("#decR").value,firstStep:o("#decF").value}),["#decQ","#decD","#decC","#decR","#decF"].forEach(t=>{o(t).value=""}),i()});T(i);window.addEventListener("aramos:captured",i);i();if("IntersectionObserver"in window){const e=new IntersectionObserver(n=>{n.forEach(c=>{c.isIntersecting&&(p("honest"),e.disconnect())})},{threshold:.4}),t=document.querySelector(".ib-honest");t&&e.observe(t)}const E=new URLSearchParams(location.search).get("f");E==="todo"&&document.querySelector('.ibf[data-k="todo"]')?.click();E==="unknown"&&document.querySelector('.ibf[data-v="unknown"]')?.click();
