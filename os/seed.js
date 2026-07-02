/* Aram Huvis OS — 초기 시드 데이터 (열자마자 살아있게).
   전 세계 베스트 앱 리서치 반영: Dalio Dot Collector(신뢰도 가중), Cloverpop/ADR(결정 구조),
   Lattice/Viva Goals(OKR), Process Street(템플릿→실행 SOP), Notion(채워진 예시). */
'use strict';

window.AHOS_VERSION = 'v2';

// ---- 핵심 가치 (행동 서술 포함) ----
window.VALUES = [
  { key:'v1', code:'V1', name:'본질을 본다', en:'True Seeing',
    desc:'겉이 아니라 사람·문제의 진짜를 본다 — 데이터로 정확히 + 사람으로서 깊이.',
    behaviors:['판단 전에 데이터·근거를 먼저 확인한다','증상이 아니라 근본 원인을 찾는다','불편한 진실도 테이블에 올린다'],
    object:'"겉만 보고 판단한다"에 이의 가능' },
  { key:'v2', code:'V2', name:'안과 밖을 함께', en:'Inside & Out',
    desc:'외적 아름다움을 속(심리·영혼)의 아름다움과 잇는다.',
    behaviors:['단기 외형과 장기 신뢰를 함께 본다','고객의 진짜 만족을 지표로 삼는다'],
    object:'겉만 꾸미고 속을 해치는 결정에 이의 가능' },
  { key:'v3', code:'V3', name:'모두에게', en:'For Everyone',
    desc:'일부가 아니라 전 세계 누구나 아름다워질 수 있게(접근성·보편성).',
    behaviors:['소수 프리미엄에만 갇히지 않는다','접근성·확장성을 설계에 넣는다'],
    object:'소수만을 위한 방향에 이의 가능' },
  { key:'v4', code:'V4', name:'사람이 목적', en:'Human First',
    desc:'기술·매출·직급이 아니라 사람이 중심. (가치>위계의 뿌리)',
    behaviors:['근거가 직급을 이긴다','사람을 수단으로 쓰지 않는다','반대의견을 존중해 기록한다'],
    object:'사람을 수단으로 쓰는 결정에 이의 가능' },
  { key:'v5', code:'V5', name:'지속되는 진짜', en:'Lasting & Honest',
    desc:'일시적 치장이 아닌, 지속가능하고 정직한 아름다움.',
    behaviors:['눈속임·과장을 하지 않는다','지속가능성을 비용보다 우선 검토한다'],
    object:'단기 눈속임·과장에 이의 가능' },
];

// ---- 부서 ----
window.DEPTS_LIST = ['경영','R&D','맞춤화장품','마케팅','구매/자재','생산'];

// ---- 사람 (신뢰도는 도메인별 track record 기반, 직급 아님) ----
const P = (o)=>Object.assign({id:o.id, photo:'', anniversary:'', birthday:''}, o);
window.SEED_PEOPLE = [
  P({id:'p_ceo', name:'김대표', role:'대표이사', dept:'경영', team:'경영', manager:'', location:'서울', start:'2011-03-02',
     skills:['비전','사업전략','조직'], ask:'회사 비전 · 사업 방향', bio:'아람휴비스를 창업. 가치가 위계를 이기는 조직을 만든다.',
     believe:{제품:6, 전략:9, 마케팅:7, 생산:5, 재무:7, 인사:7}, birthday:'07-08', anniversary:'03-02' }),
  P({id:'p_rnd', name:'이연구', role:'R&D 팀장', dept:'R&D', team:'R&D', manager:'p_ceo', location:'서울', start:'2014-06-16',
     skills:['광학센서','피부진단 알고리즘','신호처리'], ask:'진단 정확도 · 센서', bio:'차세대 피부 진단기 개발 리드.',
     believe:{제품:9, 전략:6, 마케팅:3, 생산:6, 재무:4, 인사:4}, birthday:'11-21' }),
  P({id:'p_cos', name:'박조제', role:'맞춤화장품 생산팀장', dept:'맞춤화장품', team:'맞춤화장품', manager:'p_ceo', location:'수원', start:'2018-09-03',
     skills:['조제공정','GMP','QC'], ask:'맞춤 조제 · 품질', bio:'진단→처방→조제 파이프라인 총괄.',
     believe:{제품:7, 전략:5, 마케팅:3, 생산:9, 재무:5, 인사:5} }),
  P({id:'p_mkt', name:'최마케팅', role:'마케팅 팀장', dept:'마케팅', team:'마케팅', manager:'p_ceo', location:'서울', start:'2019-02-11',
     skills:['글로벌 전시회','더마 채널','브랜드'], ask:'해외 마케팅 · 브랜드', bio:'진단·뷰티 브랜드의 글로벌 확산 담당.',
     believe:{제품:4, 전략:7, 마케팅:9, 생산:3, 재무:5, 인사:5} }),
  P({id:'p_pur', name:'정구매', role:'구매/자재 팀장', dept:'구매/자재', team:'구매/자재', manager:'p_ceo', location:'수원', start:'2016-11-28',
     skills:['원료 소싱','공급망','원가'], ask:'원자재 · 공급망', bio:'핵심 원료 이원화와 원가 개선.',
     believe:{제품:5, 전략:6, 마케팅:2, 생산:7, 재무:8, 인사:4} }),
];

// ---- OKR (Objective → Key Results). 진행률은 start→current→target로 자동 계산 ----
const KR = (name, unit, s, c, t)=>({id:'kr_'+Math.random().toString(36).slice(2,7), name, unit, start:s, current:c, target:t});
window.SEED_OKRS = [
  { id:'o_co', level:'전사', dept:'경영', owner:'p_ceo', cycle:'2026 H2',
    objective:'진단기기 리더십을 지키며, 맞춤화장품으로 두 번째 성장축을 만든다', status:'ontrack',
    krs:[ KR('진단기기 매출 성장률','%',0,9,15), KR('맞춤화장품 매출 비중','%',2,3.5,8), KR('신규 해외 대리점','개국',0,2,5) ] },
  { id:'o_rnd', level:'부서', dept:'R&D', owner:'p_rnd', cycle:'2026 H2', parent:'o_co',
    objective:'차세대 피부 진단 정확도를 업계 최고로 끌어올린다', status:'ontrack',
    krs:[ KR('진단 알고리즘 정확도','%',88,91,94), KR('차세대 진단기 시제품 DVT 완료','건',0,0,1), KR('특허 출원','건',2,3,5) ] },
  { id:'o_cos', level:'부서', dept:'맞춤화장품', owner:'p_cos', cycle:'2026 H2', parent:'o_co',
    objective:'진단→처방→조제 리드타임을 반으로 줄여 규모화한다', status:'risk',
    krs:[ KR('주문→출하 리드타임','일',5,4,2), KR('조제 QC 불량률','%',3,1.8,0.8), KR('월 조제 캐파','건',500,700,1500) ] },
  { id:'o_mkt', level:'부서', dept:'마케팅', owner:'p_mkt', cycle:'2026 H2', parent:'o_co',
    objective:'진단기기 브랜드를 글로벌 더마·뷰티 채널의 표준으로 만든다', status:'ontrack',
    krs:[ KR('해외 전시회 리드','건',200,320,500), KR('웹 유입','만/월',3,4.2,6), KR('MQL','건/월',150,210,300) ] },
  { id:'o_pur', level:'부서', dept:'구매/자재', owner:'p_pur', cycle:'2026 H2', parent:'o_co',
    objective:'핵심 원자재 공급 안정성과 원가를 동시에 개선한다', status:'behind',
    krs:[ KR('핵심 원료 이원화율','%',60,72,100), KR('원자재 결품','건/월',4,2,0), KR('주요 부품 단가 절감','%',0,3,7) ] },
];

// ---- 의사결정 (Dalio 신뢰도 가중 + Cloverpop/ADR 구조) ----
const VOTE=(voter,choice,reason)=>({voter,choice,reason});
window.SEED_DECISIONS = [
  { id:'d1', title:'신제품 패키지, 화려함보다 성분 투명성을 우선할까?', domain:'마케팅',
    valueKey:'v5', proposer:'p_mkt', reversibility:'two', status:'decided',
    context:'신제품 패키지 방향 결정. 디자인 화려함 vs 성분·효능 투명 표기 중 무엇을 앞세울지.',
    options:['화려한 프리미엄 디자인 우선','성분·효능 투명성 우선','절충(미니멀+성분 요약)'],
    evidence:'재구매율은 "정직한 성분 표기" 그룹이 22% 높음(내부 설문 n=140). 우리는 진단기업이라 성분·데이터가 강점.',
    votes:[ VOTE('p_mkt','성분·효능 투명성 우선','데이터가 신뢰=재구매로 연결됨'),
            VOTE('p_rnd','성분·효능 투명성 우선','V1 본질. 진단 데이터 강점과 정합'),
            VOTE('p_ceo','절충(미니멀+성분 요약)','브랜드감도 필요') ],
    chosen:'성분·효능 투명성 우선', decidedBy:'신뢰도 가중 우세', dissent:'김대표: 절충안 선호(기록, disagree & commit)',
    expected:'재구매율 6개월 내 +10%p', confidence:70, reviewDate:'2027-01-05',
    createdAt: iso(-3*24) },
  { id:'d2', title:'맞춤화장품, 프리미엄만이 아니라 보급형도 함께 개발할까?', domain:'전략',
    valueKey:'v3', proposer:'p_rnd', reversibility:'one', status:'proposed',
    context:'현재 맞춤화장품 로드맵은 고가 프리미엄만. 보급형 동시 개발 여부.',
    options:['프리미엄에 집중','프리미엄+보급형 동시','보급형 우선'],
    evidence:'V3(모두에게). 진단 데이터 플랫폼의 강점은 규모에서 나옴 — 접근성이 곧 경쟁력. 단, 초기 R&D 리소스 분산 위험.',
    votes:[ VOTE('p_rnd','프리미엄+보급형 동시','규모가 데이터 우위를 만든다'),
            VOTE('p_mkt','프리미엄+보급형 동시','글로벌 확산 스토리와 맞음'),
            VOTE('p_cos','프리미엄에 집중','조제 캐파가 아직 부족, 분산 위험') ],
    chosen:'', decidedBy:'', dissent:'',
    expected:'', confidence:0, reviewDate:'', createdAt: iso(-20) },
  { id:'d3', title:'핵심 원료 A, 단일 공급사 유지 vs 이원화?', domain:'생산',
    valueKey:'v5', proposer:'p_pur', reversibility:'two', status:'proposed',
    context:'핵심 원료 A가 단일 공급사. 최근 납기 지연 2회. 이원화 시 원가 +3% 예상.',
    options:['단일 공급사 유지(원가 우선)','이원화(안정성 우선)'],
    evidence:'최근 2개월 결품 위기 2회. 이원화는 원가를 조금 올리지만 지속가능성(V5)·결품 리스크를 줄임.',
    votes:[ VOTE('p_pur','이원화(안정성 우선)','결품 1건 손실 > 원가 3%'),
            VOTE('p_cos','이원화(안정성 우선)','생산 중단 리스크가 더 큼') ],
    chosen:'', decidedBy:'', dissent:'', expected:'', confidence:0, reviewDate:'', createdAt: iso(-6) },
];

// ---- SOP (템플릿 → 실행). 단계: 표준/승인/게이트(stop) ----
const STEP=(name,type,who,extra)=>Object.assign({id:'s_'+Math.random().toString(36).slice(2,7), name, type, who:who||'', done:false}, extra||{});
window.SEED_SOP_TEMPLATES = [
  { id:'sop_cos', name:'맞춤화장품 생산관리', dept:'맞춤화장품', owner:'p_cos', star:true,
    desc:'진단 → 처방 → 조제 → QC → 출하. 각 단계 책임자·기록·게이트.',
    steps:[
      STEP('고객 피부 진단 데이터 접수','표준','p_cos',{field:'고객ID / 측정일 / 진단파일'}),
      STEP('진단 결과 분석 & 처방 생성','표준','p_rnd'),
      STEP('처방 승인','승인','p_rnd',{stop:true}),
      STEP('원료 불출 & 계량 (로트번호 기록)','표준','p_pur',{field:'원료 로트번호'}),
      STEP('조제 (온도·시간 기록, 작업자 서명)','표준','p_cos'),
      STEP('QC 검사 (외관·pH·점도·미생물)','게이트','p_cos',{stop:true, field:'불합격 시 재조제'}),
      STEP('충전·라벨링·포장 (라벨 대조)','표준','p_cos'),
      STEP('출하 & 배송 등록','표준','p_cos',{field:'송장번호'}),
      STEP('완료 로그 (리드타임 자동 기록)','표준','p_cos'),
    ] },
  { id:'sop_dev', name:'진단기기 출하 검사', dept:'생산', owner:'p_cos',
    desc:'기능검사 → 캘리브레이션 → 포장 → QA 출하 승인 → 출하.',
    steps:[ STEP('기능 검사 체크리스트','표준'), STEP('캘리브레이션 확인','표준'),
            STEP('포장','표준'), STEP('QA 출하 승인','승인','',{stop:true}), STEP('출하','표준') ] },
  { id:'sop_pur', name:'구매 발주 승인', dept:'구매/자재', owner:'p_pur',
    desc:'발주 요청 → 견적 비교 → 금액별 승인 → 발주 → 입고 검수.',
    steps:[ STEP('발주 요청','표준','p_pur',{field:'품목/수량/희망납기'}), STEP('견적 비교(3사)','표준','p_pur'),
            STEP('금액별 승인 (일정액 이상 대표 승인)','승인','p_ceo',{stop:true}),
            STEP('발주','표준','p_pur'), STEP('입고 검수','표준','p_pur') ] },
  { id:'sop_onboard', name:'신입사원 온보딩', dept:'경영', owner:'p_ceo',
    desc:'입사 전 → 첫날 → 첫 주 → 첫 달. 장비·계정, 안전/품질 교육 + 이해도 확인.',
    steps:[ STEP('[입사 전] 장비·계정 발급 요청','표준'), STEP('[첫날] 환영 & 가치·비전 오리엔테이션','표준','p_ceo'),
            STEP('[첫날] 안전·품질 교육','표준'), STEP('[첫 주] 부서 SOP 숙지','표준'),
            STEP('이해도 확인 (퀴즈 + 서명)','승인',''), STEP('[첫 달] 첫 목표(OKR) 설정','표준') ] },
];
// 진행 중인 실행 1건 (홈 "지금 챙길 것"에 뜨도록)
window.SEED_SOP_RUNS = [
  { id:'run1', tplId:'sop_cos', label:'고객 #A-2291 맞춤 세럼', startedBy:'p_cos', startedAt: iso(-8),
    stepDone:[true,true,true,true,false,false,false,false,false] },
];

// ---- 신규 생성용 템플릿 (빈칸 대신 채워진 시작점) ----
window.TEMPLATES = {
  decision: [
    { key:'blank', label:'빈 양식', hint:'처음부터', data:{} },
    { key:'hire', label:'채용 결정', hint:'지원자 채용 여부',
      data:{ domain:'인사', valueKey:'v4', reversibility:'one',
        title:'○○ 포지션, △△ 지원자를 채용할까?', context:'포지션·지원자 배경·팀 필요.',
        options:['채용한다','채용하지 않는다','추가 인터뷰 후 재결정'],
        evidence:'역량 평가·레퍼런스·컬처핏 근거를 적으세요.' } },
    { key:'vendor', label:'도구·업체 선정', hint:'벤더/툴 선택',
      data:{ domain:'전략', valueKey:'v1', reversibility:'two',
        title:'○○ 용도로 어떤 도구/업체를 쓸까?', context:'용도·후보·비용·리스크.',
        options:['후보 A','후보 B','도입 보류'],
        evidence:'비용·기능·전환비용·데이터 근거.' } },
    { key:'roadmap', label:'로드맵 우선순위', hint:'무엇을 먼저',
      data:{ domain:'제품', valueKey:'v3', reversibility:'two',
        title:'이번 분기, 무엇을 먼저 할까?', context:'후보 과제와 자원 제약.',
        options:['과제 A 먼저','과제 B 먼저','병행'],
        evidence:'임팩트·노력·전략 정합성 근거.' } },
    { key:'policy', label:'정책·규칙 변경', hint:'사내 정책',
      data:{ domain:'인사', valueKey:'v4', reversibility:'one',
        title:'○○ 정책을 이렇게 바꿀까?', context:'현재 정책의 문제와 제안.',
        options:['제안대로 변경','현행 유지','수정 후 변경'],
        evidence:'영향 범위·근거.' } },
  ],
  okr: [
    { key:'blank', label:'빈 양식', hint:'처음부터', data:{ krs:[{name:'',unit:'%',start:0,current:0,target:100}] } },
    { key:'growth', label:'성장 목표', hint:'매출·규모', data:{ objective:'○○을(를) 키운다', status:'ontrack',
        krs:[{name:'매출 성장률',unit:'%',start:0,current:0,target:15},{name:'신규 고객',unit:'개',start:0,current:0,target:50}] } },
    { key:'quality', label:'품질 목표', hint:'불량·정확도', data:{ objective:'품질을 최고로 끌어올린다', status:'ontrack',
        krs:[{name:'불량률',unit:'%',start:3,current:3,target:0.5},{name:'정확도',unit:'%',start:88,current:88,target:95}] } },
    { key:'process', label:'프로세스 개선', hint:'리드타임·효율', data:{ objective:'프로세스를 더 빠르고 안정적으로', status:'ontrack',
        krs:[{name:'리드타임',unit:'일',start:5,current:5,target:2},{name:'정시 납기율',unit:'%',start:90,current:90,target:98}] } },
  ],
  sop: [
    { key:'blank', label:'빈 양식', hint:'단계 직접', data:{ steps:[] } },
    { key:'approval', label:'승인 프로세스', hint:'요청→승인→실행', data:{ desc:'요청 → 검토 → 승인 → 실행 → 완료',
        steps:[['요청 접수','표준'],['검토','표준'],['승인','승인'],['실행','표준'],['완료 확인','표준']] } },
    { key:'onboard', label:'온보딩 체크리스트', hint:'단계별 교육', data:{ desc:'준비 → 교육 → 확인',
        steps:[['사전 준비','표준'],['오리엔테이션','표준'],['교육','표준'],['이해도 확인','승인']] } },
    { key:'qc', label:'품질 검사(QC)', hint:'검사→게이트', data:{ desc:'검사 → 합/불 게이트 → 후속',
        steps:[['검사 항목 체크','표준'],['합격 게이트','게이트'],['후속 처리','표준']] } },
  ],
};

function iso(hoursFromNow){ return new Date(Date.now() + (hoursFromNow||0)*3600e3).toISOString(); }
