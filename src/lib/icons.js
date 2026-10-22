/* ══════════ 아이콘 한 벌 ══════════════════════════════════════════════
   이모지를 쓰지 않는다. 24 격자 · 1.6 선 · 둥근 끝 · currentColor.
   메뉴(Base.astro)와 각 페이지가 이 한 벌을 같이 쓴다 — 여기만 고치면 다 바뀐다.
   ═══════════════════════════════════════════════════════════════════ */
export const P = {
  /* ── 메뉴 ── */
  inbox:   '<path d="M4 13.2h4.2l1.5 2.3h4.6l1.5-2.3H20"/><path d="M4 13.2 6.6 5.8A2 2 0 0 1 8.5 4.4h7a2 2 0 0 1 1.9 1.4L20 13.2v4.4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/>',
  mic:     '<rect x="9.2" y="3.2" width="5.6" height="10.8" rx="2.8"/><path d="M5.6 11.6a6.4 6.4 0 0 0 12.8 0"/><path d="M12 18v2.8"/>',
  core:    '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/>',
  ask:     '<path d="M20 12.2c0 3.2-3.4 5.9-7.5 5.9-.9 0-1.8-.1-2.6-.4L5.2 19.6l1.3-3.3C5 15.2 4.2 13.8 4.2 12.2c0-3.2 3.4-5.9 7.5-5.9S20 9 20 12.2Z"/><path d="M10.4 11a1.9 1.9 0 0 1 3.7.6c0 1.3-1.8 1.4-1.8 2.5"/>',
  bot:     '<rect x="4.4" y="8" width="15.2" height="11.2" rx="3.2"/><path d="M12 4.8V8"/><circle cx="12" cy="3.5" r="1.2"/><path d="M9.4 12.6v1.8M14.6 12.6v1.8"/>',
  wall:    '<rect x="3.6" y="5" width="16.8" height="14" rx="2.2"/><path d="M3.6 9.7h16.8M3.6 14.3h16.8M9.4 5v4.7M14.8 9.7v4.6M9.4 14.3V19"/>',
  shelf:   '<rect x="4.2" y="5" width="3.6" height="14.4" rx="1.3"/><rect x="9.6" y="7.6" width="3.6" height="11.8" rx="1.3"/><path d="M15.4 19.4 17 5.6l3 .5-1.8 13.3Z"/>',
  archive: '<rect x="3.6" y="4.6" width="16.8" height="4.4" rx="1.7"/><path d="M5.4 9v8.4a2 2 0 0 0 2 2h9.2a2 2 0 0 0 2-2V9"/><path d="M10 13.2h4"/>',
  book:    '<path d="M12 7.4C10.4 5.9 8.3 5.2 5.4 5.2A1.4 1.4 0 0 0 4 6.6v10.2a1.4 1.4 0 0 0 1.4 1.4c2.9 0 5 .7 6.6 2.2 1.6-1.5 3.7-2.2 6.6-2.2a1.4 1.4 0 0 0 1.4-1.4V6.6a1.4 1.4 0 0 0-1.4-1.4c-2.9 0-5 .7-6.6 2.2Z"/><path d="M12 7.4v13"/>',
  pen:     '<path d="M5 19h3l9.5-9.5a2.1 2.1 0 0 0-3-3L5 16v3Z"/><path d="M14.5 6.5 17.5 9.5"/>',
  send:    '<path d="M12 18.8V5.4"/><path d="M6.6 10.8 12 5.4l5.4 5.4"/><path d="M4.6 20.6h14.8"/>',
  board:   '<rect x="4" y="4.6" width="16" height="14.8" rx="2.4"/><path d="M8 9.6h8M8 13.2h5.4"/>',
  team:    '<circle cx="9.2" cy="9" r="2.9"/><path d="M4 19.4c0-2.9 2.3-4.8 5.2-4.8s5.2 1.9 5.2 4.8"/><circle cx="17.2" cy="8.4" r="2.2"/><path d="M15.6 13.4c2.7-.4 4.4 1.4 4.4 4"/>',
  cards:   '<rect x="8.4" y="4.2" width="11.4" height="15.6" rx="2.4"/><path d="M4.2 7.6v9.8a2.4 2.4 0 0 0 2.4 2.4"/>',
  play:    '<rect x="3.6" y="5" width="16.8" height="14" rx="3"/><path d="M10.4 9.6 14.8 12l-4.4 2.4V9.6Z"/>',
  shell:   '<path d="M12 20c-4.4 0-8-3.9-8-8.7A3.3 3.3 0 0 1 12 8.8a3.3 3.3 0 0 1 8 2.5C20 16.1 16.4 20 12 20Z"/><path d="M12 20V8.8M8.5 19.3 9.9 9.5M15.5 19.3 14.1 9.5"/>',
  target:  '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.8"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  gauge:   '<path d="M4.4 16.6a7.6 7.6 0 1 1 15.2 0"/><path d="M12 16.6 15.8 9.8"/><circle cx="12" cy="16.6" r="1.1" fill="currentColor" stroke="none"/>',
  lock:    '<rect x="4.8" y="10.2" width="14.4" height="9.4" rx="2.4"/><path d="M8.4 10.2V7.9a3.6 3.6 0 0 1 7.2 0v2.3"/><circle cx="12" cy="14.6" r="1.2" fill="currentColor" stroke="none"/>',
  ball:    '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16"/><path d="M6.3 6.3c3.2 3.2 3.2 8.2 0 11.4M17.7 6.3c-3.2 3.2-3.2 8.2 0 11.4"/>',
  sliders: '<path d="M4 7.6h16M4 16.4h16"/><circle cx="9.4" cy="7.6" r="2.2"/><circle cx="15" cy="16.4" r="2.2"/>',
  calendar:'<rect x="4" y="6" width="16" height="14" rx="2.2"/><path d="M4 10.4h16M8.4 3.6v4M15.6 3.6v4"/><circle cx="8.8" cy="14.6" r="1.1" fill="currentColor" stroke="none"/>',
  flow:    '<path d="M20 12a8 8 0 1 1-8-8"/><path d="M16.3 12A4.3 4.3 0 1 1 12 7.7"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/>',
  timer:   '<circle cx="12" cy="13.6" r="7"/><path d="M12 9.8v3.8l2.6 1.6"/><path d="M9.6 3.4h4.8"/>',
  globe:   '<circle cx="12" cy="12" r="8"/><path d="M4 12h16"/><path d="M12 4c2.5 2.5 2.5 13.5 0 16-2.5-2.5-2.5-13.5 0-16Z"/>',
  mentor:  '<circle cx="10" cy="8.8" r="3"/><path d="M4.4 19.4c0-3.1 2.5-5.1 5.6-5.1s5.6 2 5.6 5.1"/><path d="M18.2 4.4c.3 1.8.9 2.4 2.7 2.7-1.8.3-2.4.9-2.7 2.7-.3-1.8-.9-2.4-2.7-2.7 1.8-.3 2.4-.9 2.7-2.7Z"/>',
  gear:    '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.9v2.5M12 18.6v2.5M4.4 7.6l2.2 1.2M17.4 15.2l2.2 1.2M4.4 16.4l2.2-1.2M17.4 8.8l2.2-1.2"/>',
  mirror:  '<ellipse cx="12" cy="10.2" rx="5.8" ry="7"/><path d="M12 17.2v3.4M9.2 20.6h5.6"/>',
  log:     '<path d="M7.4 5.6h12.2M7.4 12h12.2M7.4 18.4h12.2"/><circle cx="4.2" cy="5.6" r="1.2" fill="currentColor" stroke="none"/><circle cx="4.2" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="4.2" cy="18.4" r="1.2" fill="currentColor" stroke="none"/>',
  menu:    '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close:   '<path d="M6 6l12 12M18 6 6 18"/>',

  /* ── 홈 화면 ── */
  bolt:    '<path d="M13.4 3 5.8 13.2h5L10.6 21l7.6-10.2h-5L13.4 3Z"/>',
  flame:   '<path d="M12 3.2s5.4 3.7 5.4 8.6a5.4 5.4 0 0 1-10.8 0c0-1.6.6-2.9 1.4-3.9.5 1 1.3 1.6 2.2 1.6 1 0 1.8-.9 1.8-2.4 0-1.4-.3-2.6 0-3.9Z"/>',
  gem:     '<path d="M4 9.6 7.2 4.8h9.6L20 9.6 12 19.8 4 9.6Z"/><path d="M4 9.6h16M9.2 9.6 12 19.8l2.8-10.2M7.2 4.8l2 4.8M16.8 4.8l-2 4.8"/>',
  sorted:  '<path d="M3.8 8.2A1.7 1.7 0 0 1 5.5 6.5h2.9l1.7 2h6.4A1.7 1.7 0 0 1 18.2 10"/><path d="M3.8 8.2v8.3a1.7 1.7 0 0 0 1.7 1.7h11.8a1.7 1.7 0 0 0 1.7-1.7V10"/><path d="M6.6 10.6h14"/>',
  brain:   '<path d="M12 5.2a3 3 0 0 0-5.6 1.2 3 3 0 0 0-1.6 5A3.2 3.2 0 0 0 7 16.9a3 3 0 0 0 5 1.9Z"/><path d="M12 5.2a3 3 0 0 1 5.6 1.2 3 3 0 0 1 1.6 5A3.2 3.2 0 0 1 17 16.9a3 3 0 0 1-5 1.9Z"/><path d="M12 5.2v13.6"/>',
  medal:   '<circle cx="12" cy="14.6" r="5.2"/><path d="M8.6 9.6 6.2 3.6h11.6l-2.4 6"/><path d="M12 12.4v4.4"/>',
  map:     '<path d="M9 4.6 3.8 6.8v12.6L9 17.2l6 2.2 5.2-2.2V4.6L15 6.8 9 4.6Z"/><path d="M9 4.6v12.6M15 6.8v12.6"/>',
  doc:     '<path d="M13.6 3.6H7.4a1.8 1.8 0 0 0-1.8 1.8v13.2a1.8 1.8 0 0 0 1.8 1.8h9.2a1.8 1.8 0 0 0 1.8-1.8V8.4l-4.8-4.8Z"/><path d="M13.6 3.6v4.8h4.8"/>',
  check:   '<path d="M5 12.6 9.8 17.4 19 6.8"/>',
  arrowR:  '<path d="M5 12h13.5"/><path d="M13 6.4 18.6 12 13 17.6"/>',

  /* ── 미션 · 업적 ── */
  search:  '<circle cx="10.8" cy="10.8" r="6.2"/><path d="M15.4 15.4 20 20"/>',
  scale:   '<path d="M12 4.6v15M7.4 19.6h9.2"/><path d="M12 7.2 5 9.2M12 7.2l7 2"/><path d="M2.4 15.2a2.6 2.6 0 0 0 5.2 0L5 9.2 2.4 15.2ZM16.4 15.2a2.6 2.6 0 0 0 5.2 0L19 9.2l-2.6 6Z"/>',
  tag:     '<path d="M4.6 11.2V5.8a1.2 1.2 0 0 1 1.2-1.2h5.4l8 8a1.7 1.7 0 0 1 0 2.4l-4.6 4.6a1.7 1.7 0 0 1-2.4 0l-8-8Z"/><circle cx="8.6" cy="8.6" r="1.3"/>',
  trash:   '<path d="M4.8 6.8h14.4"/><path d="M9.4 6.8V5.2a1.4 1.4 0 0 1 1.4-1.4h2.4a1.4 1.4 0 0 1 1.4 1.4v1.6"/><path d="M6.6 6.8v11.6a2 2 0 0 0 2 2h6.8a2 2 0 0 0 2-2V6.8"/><path d="M10.4 10.6v5.6M13.6 10.6v5.6"/>',
  door:    '<path d="M6.4 20.4V4.8a1.4 1.4 0 0 1 1.7-1.4l8 1.6a1.4 1.4 0 0 1 1.1 1.4v12.4a1.4 1.4 0 0 1-1.1 1.4l-8 1.6a1.4 1.4 0 0 1-1.7-1.4Z"/><path d="M4.2 20.4h15.6"/><circle cx="14" cy="12" r="1" fill="currentColor" stroke="none"/>',
  steps:   '<path d="M3.6 20.4h4.2v-4.6H12v-4.6h4.2V6.6h4.2"/>',
  eye:     '<path d="M2.8 12S6.4 6.2 12 6.2 21.2 12 21.2 12 17.6 17.8 12 17.8 2.8 12 2.8 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  chart:   '<path d="M4 20.4V3.6"/><path d="M4 20.4h16.4"/><path d="M8 17V11M12.4 17V6.8M16.8 17v-4"/>',
  grid:    '<rect x="4.2" y="4.2" width="6.4" height="6.4" rx="1.6"/><rect x="13.4" y="4.2" width="6.4" height="6.4" rx="1.6"/><rect x="4.2" y="13.4" width="6.4" height="6.4" rx="1.6"/><rect x="13.4" y="13.4" width="6.4" height="6.4" rx="1.6"/>',
  loop:    '<path d="M4.6 10.4a7.4 7.4 0 0 1 12.6-3.6l2.2 2.2"/><path d="M19.4 13.6a7.4 7.4 0 0 1-12.6 3.6l-2.2-2.2"/><path d="M19.4 4.6V9h-4.4M4.6 19.4V15H9"/>',
  sunrise: '<path d="M2.8 18.6h18.4"/><path d="M6.6 14.4a5.4 5.4 0 0 1 10.8 0"/><path d="M12 3.4v3M4.6 7.4l1.8 1.8M19.4 7.4l-1.8 1.8"/>',
  ruler:   '<rect x="2.6" y="8.2" width="18.8" height="7.6" rx="1.8"/><path d="M7 8.2v3M11 8.2v4.4M15 8.2v3M19 8.2v4.4"/>',
  crown:   '<path d="M3.8 7.6 6.6 15h10.8l2.8-7.4-4.6 3L12 4.6 8.4 10.6l-4.6-3Z"/><path d="M6.6 18.4h10.8"/>',

  /* ── 상태 · 도구 ── */
  warn:    '<path d="M12 4.2 2.8 19.8h18.4L12 4.2Z"/><path d="M12 10.2v4.2"/><circle cx="12" cy="17.2" r="1.1" fill="currentColor" stroke="none"/>',
  idea:    '<path d="M9.2 17.4a6.4 6.4 0 1 1 5.6 0"/><path d="M9.6 17.4h4.8v1.8a2.4 2.4 0 0 1-4.8 0v-1.8Z"/><path d="M10.4 20.8h3.2"/>',
  pin:     '<path d="M9.4 3.6h5.2l-.8 5.2 3.2 3.2H7.0l3.2-3.2-.8-5.2Z"/><path d="M12 12v8.4"/>',
  arrowD:  '<path d="M12 5v13.5"/><path d="M6.4 12.8 12 18.4l5.6-5.6"/>',
  link:    '<path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5l-1.3 1.3"/><path d="M13.5 10.5a3.5 3.5 0 0 0-5 0L6 13a3.5 3.5 0 0 0 5 5l1.3-1.3"/>',
  question:'<circle cx="12" cy="12" r="8.2"/><path d="M10 9.6a2 2 0 0 1 3.9.6c0 1.4-1.9 1.6-1.9 2.8"/><circle cx="12" cy="16.2" r="1" fill="currentColor" stroke="none"/>',
  gift:    '<rect x="3.6" y="8.6" width="16.8" height="4" rx="1.2"/><path d="M5.2 12.6v6.2a1.6 1.6 0 0 0 1.6 1.6h10.4a1.6 1.6 0 0 0 1.6-1.6v-6.2"/><path d="M12 8.6v11.8"/><path d="M12 8.6S10.6 3.6 8.2 3.6a2.4 2.4 0 0 0 0 5M12 8.6s1.4-5 3.8-5a2.4 2.4 0 0 1 0 5"/>',
  save:    '<path d="M5.6 4.4h9.6l3.4 3.4v11.8a1.4 1.4 0 0 1-1.4 1.4H5.6a1.4 1.4 0 0 1-1.4-1.4V5.8a1.4 1.4 0 0 1 1.4-1.4Z"/><path d="M8 4.4v5h6.4v-5"/><rect x="7.6" y="13" width="8.8" height="8" rx="1"/>',
  clip:    '<path d="M18.6 11.2 12 17.8a4.2 4.2 0 0 1-6-6l7-7a2.8 2.8 0 0 1 4 4l-6.9 7a1.4 1.4 0 0 1-2-2l6.2-6.2"/>',
  image:   '<rect x="3.6" y="5" width="16.8" height="14" rx="2.4"/><circle cx="9" cy="10" r="1.6"/><path d="M4.4 17.2 9.6 12l3.4 3.2 2.8-2.4 4 4"/>',
  star:    '<path d="m12 3.6 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8L12 3.6Z"/>',
  circle:  '<circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"/>',
  sun:     '<circle cx="12" cy="12" r="4"/><path d="M12 2.9v2.4M12 18.7v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.9 12h2.4M18.7 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"/>',
  rocket:  '<path d="M12 3.2c3.2 2.6 5 6 5 9.6l-2.4 2.6H9.4L7 12.8c0-3.6 1.8-7 5-9.6Z"/><path d="M9.4 15.4 8 20l3-1.4L14 20l-1.4-4.6"/><circle cx="12" cy="10.4" r="1.6"/>',
  wave:    '<path d="M3.4 9.4c2.9-3.2 5.7-3.2 8.6 0s5.7 3.2 8.6 0"/><path d="M3.4 15.4c2.9-3.2 5.7-3.2 8.6 0s5.7 3.2 8.6 0"/>',
  phone:   '<rect x="6.6" y="3" width="10.8" height="18" rx="2.6"/><path d="M10.6 6.2h2.8M11 17.6h2"/>',
  heart:   '<path d="M12 20.2S3.8 15.4 3.8 9.9A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 8.2 1.9c0 5.5-8.2 10.3-8.2 10.3Z"/>',
  hand:    '<path d="M9 11.6V5.4a1.6 1.6 0 0 1 3.2 0v5.4"/><path d="M12.2 10.8V4.8a1.6 1.6 0 0 1 3.2 0v6.4"/><path d="M15.4 11.6V7.4a1.6 1.6 0 0 1 3.2 0v6.8c0 3.4-2.6 6.2-6 6.2h-1a5 5 0 0 1-4.3-2.4L5 14.4a1.6 1.6 0 0 1 2.6-1.8L9 14.4"/>',
  key:     '<circle cx="8" cy="12" r="4"/><path d="M12 12h8.4"/><path d="M17.4 12v3.2M20.4 12v2.4"/>',
  case:    '<rect x="3.6" y="7.4" width="16.8" height="12.2" rx="2.2"/><path d="M9 7.4V5.8a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 5.8v1.6"/><path d="M3.6 12.8h16.8"/>',
  mega:    '<path d="M4 10v4a1.6 1.6 0 0 0 1.6 1.6h2L14 20V4L7.6 8.4h-2A1.6 1.6 0 0 0 4 10Z"/><path d="M17.4 9a4.2 4.2 0 0 1 0 6"/>',

  /* ── 기분 ── */
  moodGood:'<circle cx="12" cy="12" r="8.2"/><path d="M8.4 13.6a4.4 4.4 0 0 0 7.2 0"/><circle cx="9.4" cy="9.8" r="1" fill="currentColor" stroke="none"/><circle cx="14.6" cy="9.8" r="1" fill="currentColor" stroke="none"/>',
  moodOk:  '<circle cx="12" cy="12" r="8.2"/><path d="M9 14.2c1.8 1 4.2 1 6 0"/><circle cx="9.4" cy="9.8" r="1" fill="currentColor" stroke="none"/><circle cx="14.6" cy="9.8" r="1" fill="currentColor" stroke="none"/>',
  moodMeh: '<circle cx="12" cy="12" r="8.2"/><path d="M9 14.4h6"/><circle cx="9.4" cy="9.8" r="1" fill="currentColor" stroke="none"/><circle cx="14.6" cy="9.8" r="1" fill="currentColor" stroke="none"/>',
  moodBad: '<circle cx="12" cy="12" r="8.2"/><path d="M8.6 15.6a4.4 4.4 0 0 1 6.8 0"/><circle cx="9.4" cy="9.8" r="1" fill="currentColor" stroke="none"/><circle cx="14.6" cy="9.8" r="1" fill="currentColor" stroke="none"/>',
  moodTired:'<circle cx="12" cy="12" r="8.2"/><path d="M8.6 15.6a4.4 4.4 0 0 1 6.8 0"/><path d="M8.2 9.8h2.4M13.4 9.8h2.4"/>',

  /* ── 다섯 대륙 ── */
  person:  '<circle cx="12" cy="7.4" r="3.4"/><path d="M5.6 20.4c0-3.6 2.9-6 6.4-6s6.4 2.4 6.4 6"/>',
  building:'<path d="M4.6 20.4V6.2a1.6 1.6 0 0 1 1.6-1.6h7.2a1.6 1.6 0 0 1 1.6 1.6v14.2"/><path d="M15 10.4h2.8a1.6 1.6 0 0 1 1.6 1.6v8.4"/><path d="M3 20.4h18"/><path d="M8 8.6h3.4M8 12.4h3.4M8 16.2h3.4"/>',
  cube:    '<path d="M4 8.2 12 4.2l8 4v7.6l-8 4-8-4V8.2Z"/><path d="M4 8.2 12 12.2l8-4M12 12.2v7.6"/>',

  /* ── 레벨 : 씨앗에서 거울까지 ── */
  lv1:     '<path d="M12 3.4c3.8 2.2 5.8 5.2 5.8 8.4a5.8 5.8 0 0 1-11.6 0c0-3.2 2-6.2 5.8-8.4Z"/><path d="M12 20.6v-3.2M12 17.4c-1.8 0-3-.9-3.6-2.6M12 16.6c1.6-.3 2.6-1.2 3.2-2.6"/>',
  lv2:     '<path d="M12 20.4v-7.6"/><path d="M12 12.8c0-2.8-1.8-4.6-4.6-4.6 0 2.8 1.8 4.6 4.6 4.6Z"/><path d="M12 12.8c0-2.8 1.8-4.6 4.6-4.6 0 2.8-1.8 4.6-4.6 4.6Z"/>',
  lv3:     '<path d="M12 20.4V4.6"/><path d="M12 9.4c2.4 0 3.8-1.4 3.8-3.6-2.4 0-3.8 1.4-3.8 3.6Z"/><path d="M12 14.6c-2.4 0-3.8-1.4-3.8-3.6 2.4 0 3.8 1.4 3.8 3.6Z"/>',
  lv4:     '<path d="M19 5c0 7-4.4 10.6-9.4 10.6H5.4C5.4 8.6 10.6 5 19 5Z"/><path d="M5 20.4c1.8-4 4.6-6.6 8.4-8.4"/>',
  lv5:     '<path d="M12 20.4V7.6"/><path d="M12 12.4 6.4 6.8M12 10.4l5.6-5.6"/><circle cx="5.6" cy="6" r="1.6"/><circle cx="18.4" cy="4" r="1.6"/>',
  lv6:     '<circle cx="12" cy="9.6" r="2.4"/><path d="M12 7.2c0-2 1-3.2 2.8-3.2 0 2-1 3.2-2.8 3.2ZM12 12c0 2-1 3.2-2.8 3.2 0-2 1-3.2 2.8-3.2ZM9.6 9.6c-2 0-3.2-1-3.2-2.8 2 0 3.2 1 3.2 2.8ZM14.4 9.6c2 0 3.2 1 3.2 2.8-2 0-3.2-1-3.2-2.8Z"/><path d="M12 15.2v5.2"/>',
  lv7:     '<circle cx="12" cy="14.4" r="6"/><path d="M12 8.4V4.6"/><path d="M12 6.4c2.4 0 3.8-1.2 3.8-3.2-2.4 0-3.8 1.2-3.8 3.2Z"/>',
  lv8:     '<path d="M12 20.4v-6.2"/><path d="M12 3.6 5.4 14.2h13.2L12 3.6Z"/>',
  lv9:     '<path d="M7 20.4v-3.6M17 20.4v-3.6M12 20.4v-5.4"/><path d="M7 5.6 3.4 12.4h7.2L7 5.6ZM17 7.2l-3.2 6.2h6.4L17 7.2Z"/>',
  lv10:    '<ellipse cx="12" cy="10.2" rx="5.8" ry="7"/><path d="M12 17.2v3.4M9.2 20.6h5.6"/><path d="M9.6 7.6c.8-1.2 1.8-1.9 3-2.1"/>',
};

/** 아이콘 하나를 SVG 문자열로. set:html 로 넣어 쓴다. */
export const ic = (name) =>
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
  'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
  (P[name] || P.core) + '</svg>';

/** 레벨(1~10) → 아이콘 이름 */
export const lvIcon = (lv) => 'lv' + Math.min(10, Math.max(1, lv | 0));

/* 기존 데이터(game.js)의 이모지를 이 아이콘 한 벌로 옮겨 주는 표.
   데이터는 그대로 두고 화면에서만 아이콘으로 바꾼다. */
export const EMOJI_MAP = {
  // 동작
  '⚡': 'bolt', '⬆': 'send', '👇': 'arrowD', '👉': 'arrowR', '🔍': 'search', '🔎': 'search',
  '✅': 'check', '✓': 'check', '✕': 'close', '⚠': 'warn', '⚠️': 'warn',
  // 사물
  '⚖': 'scale', '⚖️': 'scale', '#': 'tag', '💎': 'gem', '🗑': 'trash', '🪨': 'core',
  '🕳': 'flow', '🪞': 'mirror', '🚪': 'door', '🪜': 'steps', '👣': 'steps', '🔥': 'flame',
  '📆': 'calendar', '📅': 'calendar', '🗓': 'calendar', '👁': 'eye', '👀': 'eye',
  '📊': 'chart', '📈': 'chart', '🚧': 'grid', '🔁': 'loop', '🌅': 'sunrise', '☀': 'sun',
  '📐': 'ruler', '📏': 'ruler', '👑': 'crown', '📄': 'doc', '📝': 'pen', '📚': 'book',
  '💡': 'idea', '📌': 'pin', '🔗': 'link', '❓': 'question', '🎁': 'gift', '💾': 'save',
  '📎': 'clip', '🖼': 'image', '★': 'star', '⭐': 'star', '✦': 'star', '✧': 'star', '✨': 'star',
  '🎬': 'play', '⚙': 'gear', '🛠': 'wrench', '🔒': 'lock', '🔑': 'key', '💼': 'case',
  '📣': 'mega', '🚀': 'rocket', '🌊': 'wave', '📱': 'phone', '🙏': 'heart', '👋': 'hand',
  '🟢': 'circle', '🟡': 'circle', '🔴': 'circle', '🐚': 'shell', '🤖': 'bot',
  '💬': 'ask', '💭': 'ask', '🎙': 'mic', '📥': 'inbox', '🗂': 'sorted', '🧠': 'brain',
  '🎯': 'target', '🤝': 'team', '🙌': 'team', '🏗': 'building', '🏭': 'building',
  // 사람 · 대륙
  '🧍': 'person', '👤': 'person', '🏢': 'building', '👥': 'team', '📦': 'cube',
  // 기분
  '😀': 'moodGood', '😊': 'moodGood', '🙂': 'moodOk', '😐': 'moodMeh', '😔': 'moodBad', '😩': 'moodTired',
  // 레벨(식물)
  '🌱': 'lv1', '🌿': 'lv2', '🎋': 'lv3', '🍃': 'lv4', '🌳': 'lv5', '🌸': 'lv6',
  '🍎': 'lv7', '🌲': 'lv8', '🏞': 'lv9', '🎼': 'lv5',
};
/** 이모지(또는 아이콘 이름) → 아이콘 이름 */
export const iconOf = (x) => EMOJI_MAP[x] || (P[x] ? x : 'core');
