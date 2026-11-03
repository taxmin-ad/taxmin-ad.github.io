/* 택스민 광고 랜딩 공통 — 첫 화면 대화 재생 · 쇼케이스 탭 · 39칸 · 하단 버튼 · 기장료 계산기 · 들어온 곳 기록
   계산 규칙(BAND·compute)은 v1(js/workshop.js)과 같다(단, 법인 기장은 2026-11-03 사용자 지시로 월 12만 → 10만원부터). 바꿀 땐 두 곳을 같이 고친다.
   신청서·클릭 기록은 <html data-endpoint="구글 Apps Script 웹앱 주소"> 가 있을 때만 켜진다(docs/apps-script.gs).
   주소가 없으면 신청서를 숨기고 카카오톡·전화로만 받는다 — 보내지 않고 '접수됐다'고 보이는 일은 없게. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, q = new URLSearchParams(location.search);
  var KAKAO = 'https://pf.kakao.com/_Mxojqs/chat', TEL = '0507-1445-7729';
  var ENDPOINT = (root.getAttribute('data-endpoint') || '').trim();
  var VARIANT = root.getAttribute('data-variant') || 'A';
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IO = 'IntersectionObserver' in window;
  function $(s, el) { return (el || doc).querySelector(s); }
  function $$(s, el) { return [].slice.call((el || doc).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function won(n) { return n.toLocaleString('ko-KR') + '원'; }
  function watch(el, fn, opt) { if (!IO) { fn(true); return; } new IntersectionObserver(function (es) { fn(es[0].isIntersecting); }, opt || { threshold: 0.2 }).observe(el); }

  /* 들어온 곳(v1과 같은 규칙) */
  var ALIAS = { insta: 'insta', instagram: 'insta', ig: 'insta', daangn: 'daangn', karrot: 'daangn', danggeun: 'daangn',
    youtube: 'youtube', yt: 'youtube', kakao: 'kakao', kakaotalk: 'kakao', blog: 'blog', naver: 'naver',
    facebook: 'facebook', fb: 'facebook', google: 'google', homepage: 'homepage' };
  var NAME = { insta: '인스타그램', daangn: '당근', youtube: '유튜브', kakao: '카카오톡', blog: '블로그', naver: '네이버',
    facebook: '페이스북', google: '구글', homepage: '세무회계 민 홈페이지', direct: '(주소에 표시 없음)' };
  function clean(s, n) { return String(s || '').replace(/[^0-9A-Za-z_\-]/g, '').slice(0, n || 24); }
  var rawSrc = clean(q.get('src') || q.get('utm_source')).toLowerCase(), srcKey = ALIAS[rawSrc] || rawSrc, guessed = false;
  if (!srcKey) {
    var ua = navigator.userAgent || '', ref = doc.referrer || '';
    if (/Instagram/i.test(ua) || /instagram\.com/i.test(ref)) srcKey = 'insta';
    else if (/karrot|daangn/i.test(ua) || /daangn|karrot/i.test(ref)) srcKey = 'daangn';
    else if (/FBAN|FBAV/i.test(ua) || /facebook\.com/i.test(ref)) srcKey = 'facebook';
    else if (/KAKAOTALK/i.test(ua)) srcKey = 'kakao';
    else if (/naver\.com/i.test(ref)) srcKey = 'naver';
    else if (/google\./i.test(ref)) srcKey = 'google';
    guessed = !!srcKey;
  }
  if (!srcKey) srcKey = 'direct';
  var srcLabel = (NAME[srcKey] || srcKey) + (guessed ? '(앱 정보로 짐작)' : '');
  var adKey = clean(q.get('v') || q.get('utm_content'), 30).toUpperCase(), campaign = clean(q.get('utm_campaign'), 40);

  var sent = {};
  function hit(e, once) {
    if (!ENDPOINT || q.has('shot') || (once && sent[e])) return;
    sent[e] = 1;
    var body = JSON.stringify({ type: 'hit', e: e, s: srcKey, v: adKey, page: VARIANT });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain;charset=utf-8' }));
      else fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: body, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, keepalive: true });
    } catch (x) {}
  }
  hit('view');
  doc.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('[data-hit]');
    if (a) hit(a.getAttribute('data-hit'));
  });

  /* 머리 줄 선 · 하단 버튼(계산기·마무리·꼬리가 보이면 숨김) */
  var hd = $('.hd'), dock = $('.dock'), hero = $('[data-hero]'), quiet = new Set();
  if (hero && hd) watch(hero, function (v) { hd.classList.toggle('on', !v); }, { threshold: 0 });
  if (dock && IO) {
    var qio = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) quiet.add(en.target); else quiet.delete(en.target); });
      dock.classList.toggle('off', quiet.size > 0);
    }, { threshold: 0.12 });
    $$('[data-nodock]').forEach(function (el) { qio.observe(el); });
  }

  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = doc.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); doc.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.classList.remove('on'); }, 2600);
  }

  /* ── 대화 재생: .seq 를 한 줄씩 보여 주고, '입력 중' 줄은 다음 말이 오면 사라짐 ── */
  function player(scope, opts) {
    var seq = $$('.seq', scope), timer = null, step = 0, on = false, done = false, rolled = false;
    var roll = $('[data-roll]', scope);
    function rollNum() {
      if (!roll || calm) return; var to = +roll.getAttribute('data-roll'), t0 = null, small = roll.innerHTML.replace(/^[^<]*/, '');
      (function f(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 900); roll.innerHTML = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString('ko-KR') + small; if (p < 1) requestAnimationFrame(f); })(performance.now());
    }
    /* 첫 줄은 늘 보이게(빈 화면으로 시작하지 않게) */
    function reset() { seq.forEach(function (x) { x.classList.remove('show', 'gone'); }); if (seq[0]) seq[0].classList.add('show'); step = 1; done = false; }
    if (!calm) reset();
    function tick() {
      if (!on) return;
      if (step < seq.length) {
        var el = seq[step], prev = seq[step - 1];
        if (prev && prev.classList.contains('typing-row')) prev.classList.add('gone');
        el.classList.add('show');
        step++;
        timer = setTimeout(tick, el.classList.contains('typing-row') ? 1200 : (opts && opts.gap) || 1300);
      } else if (opts && opts.loop) {
        timer = setTimeout(function () { reset(); timer = setTimeout(tick, 600); }, 3600);
      } else { done = true; if (opts && opts.onDone) opts.onDone(); }
    }
    if (calm) { seq.forEach(function (x) { x.classList.add(x.classList.contains('typing-row') ? 'gone' : 'show'); }); }
    return {
      play: function () { if (calm) return; on = true; if (!rolled) { rolled = true; rollNum(); } clearTimeout(timer); if (!done) timer = setTimeout(tick, 700); },
      pause: function () { on = false; clearTimeout(timer); },
      restart: function () { clearTimeout(timer); if (calm) return; reset(); on = true; timer = setTimeout(tick, 250); },
      isDone: function () { return done || calm; }
    };
  }

  /* 첫 화면 휴대폰: 보이는 동안 반복 재생 */
  $$('[data-player]').forEach(function (dev) {
    var p = player(dev, { loop: true });
    watch(dev, function (v) { dev.classList.toggle('paused', !v); if (v) p.play(); else p.pause(); });
  });

  /* 쇼케이스: 탭 4개, 보이는 동안 화면 대화가 끝나면 다음 탭으로(손으로 누르면 자동 넘김 멈춤) */
  $$('[data-show]').forEach(function (sec) {
    var tabs = $$('[role="tab"]', sec), panels = tabs.map(function (t) { return doc.getElementById(t.getAttribute('aria-controls')); });
    var copies = $$('.show-copy .d', sec), cur = 0, auto = true, visible = false, wait = null;
    var players = panels.map(function (pn, i) { return player(pn, { gap: 1000, onDone: function () { if (auto && visible && i === cur) wait = setTimeout(function () { select((cur + 1) % tabs.length); }, 2600); } }); });
    function select(i, byHand) {
      clearTimeout(wait);
      if (byHand) auto = false;
      players[cur].pause();
      tabs.forEach(function (t, j) { var s = j === i; t.setAttribute('aria-selected', s); t.tabIndex = s ? 0 : -1; panels[j].classList.toggle('on', s); if (copies[j]) copies[j].classList.toggle('on', s); });
      cur = i;
      if (visible) players[i].restart();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, true); });
      t.addEventListener('keydown', function (e) {
        var k = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!k) return; e.preventDefault(); var n = (i + k + tabs.length) % tabs.length; select(n, true); tabs[n].focus();
      });
    });
    watch(sec, function (v) {
      visible = v;
      if (v) { if (players[cur].isDone()) { if (auto) wait = setTimeout(function () { select((cur + 1) % tabs.length); }, 1500); } else players[cur].play(); }
      else { players[cur].pause(); clearTimeout(wait); }
    }, { threshold: 0.35 });
  });

  /* 팝업(기장료 계산·전화 상담 예약): href="#calc"·"#reserve" 링크가 열고, 바깥·닫기 버튼이 닫음 */
  var sheets = Object.create(null);   // #constructor 같은 주소 해시에 걸려 멈추지 않게
  $$('dialog.sheet').forEach(function (d) {
    sheets[d.id] = d;
    d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
  });
  function openSheet(id) {
    var d = sheets[id]; if (!d) return false;
    Object.keys(sheets).forEach(function (k) { if (k !== id && sheets[k].open) sheets[k].close(); });
    if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else d.setAttribute('open', '');
    hit(id + '_open'); return true;
  }
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a && sheets[a.getAttribute('href').slice(1)]) { e.preventDefault(); openSheet(a.getAttribute('href').slice(1)); }
  });
  if (sheets[location.hash.slice(1)]) openSheet(location.hash.slice(1));

  /* 토끼 안내 말풍선: 보이면 차례로 */
  $$('[data-guide]').forEach(function (g) {
    if (calm || !IO) { g.classList.add('in'); return; }
    var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { g.classList.add('in'); o.disconnect(); } }, { threshold: 0.5 });
    o.observe(g);
  });
  /* 업종 칩: 5만원(가운데)에서 하나씩 튀어나와 제자리로 → 그다음엔 '음식점도!', '카페도!'… 차례로 통통 불이 들어오고
     그때마다 가운데 꼬리표가 살짝 출렁. 보이는 동안만 돌고, 움직임 줄이기 설정이면 처음부터 제자리 */
  $$('.burst').forEach(function (b) {
    var chips = $$('.bc', b), core = $('.burst-core', b), bump = $('.hang', b) || core, k = 0, loop = null, started = false;
    function aim() {   // 칩마다 '가운데까지의 거리'를 재서 튀어나오는 출발점으로 씀
      var c = core.getBoundingClientRect(), cx = c.left + c.width / 2, cy = c.top + c.height / 2;
      chips.forEach(function (x) { var r = x.getBoundingClientRect(); x.style.setProperty('--fx', (cx - (r.left + r.width / 2)) + 'px'); x.style.setProperty('--fy', (cy - (r.top + r.height / 2)) + 'px'); });
    }
    function hitNext() {
      var x = chips[k % chips.length]; k++;
      x.classList.remove('hit'); void x.offsetWidth; x.classList.add('hit');
      if (bump.animate) bump.animate([{ transform: 'rotate(-4deg)' }, { transform: 'rotate(-2deg) scale(1.03)', offset: .35 }, { transform: 'rotate(-4deg)' }], { duration: 420, easing: 'ease-out' });
    }
    if (calm || !IO) { b.classList.add('in', 'done'); return; }
    watch(b, function (v) {
      if (v && !started) {
        started = true; aim(); b.classList.add('in');
        setTimeout(function () { b.classList.add('done'); loop = setInterval(hitNext, 1500); }, chips.length * 110 + 900);
      } else if (v && started && !loop && b.classList.contains('done')) loop = setInterval(hitNext, 1500);
      else if (!v && loop) { clearInterval(loop); loop = null; }
    }, { threshold: 0.35 });
  });
  /* 업종 띠: 화면 밖이면 멈춤 */
  $$('.ticker').forEach(function (t) { watch(t, function (v) { t.classList.toggle('paused', !v); }, { threshold: 0 }); });

  /* 39칸: 보이면 순서대로 채움 */
  $$('.grid39').forEach(function (g) {
    $$('i', g).forEach(function (x, i) { x.style.setProperty('--i', i); });
    if (calm || !IO) { g.classList.add('in'); return; }
    var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { g.classList.add('in'); o.disconnect(); } }, { threshold: 0.4 });
    o.observe(g);
  });

  /* ───────── 기장료 계산기 ─────────
     택스민 요금 등급표(10/29, 개인사업자 · 직전 연도 매출 기준) — v1과 같음
     업종군: 가 = 도소매(A) · 나 = 음식·제조·건설·운수·정보통신(B) · 다 = 서비스·임대·교육·전문직·그 밖(C·P·?)
     Lite 월 5~6만원(직원 3명까지 5만 · 4~5명 6만) | Plus 월 7~8만원 | 성실 월 12~15만원
     Lite 상한 가 9억 · 나 5억 · 다 3억 / 성실 가 15억 · 나 7.5억 · 다 5억 이상. 부가세·조정료 별도, 6개월 약정. */
  var box = $('[data-calc]');
  if (!box) return;
  /* 먼저 6개만 보이고 나머지는 '다른 업종'으로 펼침(업종 묶음·규칙은 그대로) */
  var IND = [['food', 'B', '음식점 · 카페 · 숙박'], ['retail', 'A', '도소매 · 온라인 판매'], ['personal', 'C', '미용 · 네일 · 세탁'],
    ['free', 'C', '프리랜서 · 크리에이터'], ['edu', 'C', '학원 · 교습소'], ['biz', 'C', '디자인 · 광고 · 컨설팅'],
    ['mfg', 'B', '제조 · 건설 · 운수'], ['it', 'B', 'IT · 소프트웨어'], ['rent', 'C', '부동산 임대'], ['pro', 'P', '전문직(의료·법률·세무 등)'],
    ['etc', '?', '그 밖의 업종'], ['corp', 'X', '법인사업자예요']];
  var EMP = [['0', '없어요'], ['3', '1~3명'], ['5', '4~5명'], ['10', '6명 이상']];
  var BAND = {
    A: { lo: '9억원', hi: '15억원', loM: '7,500만원', hiM: '1억 2,500만원' },
    B: { lo: '5억원', hi: '7억 5천만원', loM: '약 4,200만원', hiM: '약 6,300만원' },
    C: { lo: '3억원', hi: '5억원', loM: '2,500만원', hiM: '약 4,200만원' }
  };
  function band(g) { return BAND[g === 'A' || g === 'B' ? g : 'C']; }
  var CK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 12.5l4.2 4.2L18.5 7.8" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CHAT = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6c-5 0-9 3.1-9 7 0 2.5 1.7 4.7 4.2 5.9l-.9 3.5c-.1.4.4.7.7.4l4.2-2.8h.8c5 0 9-3.1 9-7s-4-7-9-7z" fill="currentColor"/></svg>';

  function chips(name, list, col) {
    return '<div class="chips' + (col ? ' col' : '') + '" data-name="' + name + '">' + list.map(function (x, i) {
      var g = x.length > 3, hide = name === 'ind' && i >= 6;
      return '<button type="button" class="chip" data-v="' + x[0] + '"' + (g ? ' data-g="' + x[1] + '"' : '') + (hide ? ' hidden' : '') + '>' + x[g ? 2 : 1] + '</button>';
    }).join('') + (name === 'ind' ? '<button type="button" class="chip more" data-more>다른 업종 보기</button>' : '') + '</div>';
  }
  box.innerHTML =
    '<div class="q" data-q="ind"><h3 class="q-t"><span>1</span>어떤 일을 하세요?</h3>' +
      chips('ind', IND.map(function (x) { return [x[0], x[1], x[2], 1]; })) + '</div>' +
    '<div class="q" data-q="rev" hidden><h3 class="q-t"><span>2</span>작년 매출은 어느 정도예요?</h3>' +
      '<p class="q-h">대략이면 괜찮아요. 홈택스 ‘매출 조회’에서도 볼 수 있어요.</p>' +
      chips('rev', [['new', '올해 시작했어요<small>사업 준비 중 포함</small>'], ['lo', ''], ['mid', ''], ['hi', ''], ['unk', '잘 모르겠어요']], 1) + '</div>' +
    '<div class="q" data-q="emp" hidden><h3 class="q-t"><span>3</span>4대보험 직원은 몇 명이에요?</h3>' +
      '<p class="q-h">사장님 본인은 빼고 세어 주세요.</p>' + chips('emp', EMP, 1) + '</div>';
  var resHost = $('[data-calc-res]') || box;
  var res = doc.createElement('div'); res.className = 'res'; res.id = 'calc-res'; res.setAttribute('aria-live', 'polite');
  resHost.appendChild(res);
  var LADDER = [['lite', 'Lite', '월 5~6만'], ['plus', 'Plus', '월 7~8만'], ['sin', '성실', '월 12~15만']];
  function ladder(kind) { return '<div class="ladder" aria-hidden="true">' + LADDER.map(function (x) { return '<div class="' + (kind === x[0] ? 'on' : '') + '"><b>' + x[1] + '</b><span>' + x[2] + '</span></div>'; }).join('') + '</div>'; }
  function placeholder() {
    res.classList.add('ph');
    res.innerHTML = '<p class="r-price num">월 5만원부터<small>부가세 별도</small></p><p class="r-incl">왼쪽에서 업종을 고르면 바로 계산돼요.</p>';
  }
  placeholder();

  var A = {}, R = null, qs = {};
  $$('.q', box).forEach(function (el) { qs[el.getAttribute('data-q')] = el; });

  function revBands(g) {
    var b = band(g), wrap = $('[data-name="rev"]', box);
    var L = { lo: b.lo + ' 이하<small>한 달 평균 ' + b.loM + ' 이하</small>',
              mid: b.lo + ' 초과 ~ ' + b.hi + ' 미만<small>한 달 평균 ' + b.loM + ' ~ ' + b.hiM + '</small>',
              hi: b.hi + ' 이상<small>한 달 평균 ' + b.hiM + ' 이상</small>' };
    $$('.chip', wrap).forEach(function (x) { x.classList.remove('on'); var v = x.getAttribute('data-v'); if (L[v]) x.innerHTML = L[v]; });
    A.rev = null;
  }
  function compute() {
    var ind = A.ind, g = ind.getAttribute('data-g');
    var rv = A.rev ? A.rev.getAttribute('data-v') : '', emp = A.emp ? +A.emp.getAttribute('data-v') : 0;
    R = { ind: ind.textContent, rev: A.rev ? A.rev.firstChild.textContent : '-', emp: A.emp ? A.emp.textContent : '-', plan: '', price: '', why: '', sub: '', kind: '' };
    if (g === 'X') { R.rev = '-'; R.emp = '-'; R.kind = 'corp'; R.plan = '<b>법인 기장</b>'; R.price = '월 10만원부터'; R.firm = 1; R.why = '법인은 상담 때 장부 상태를 보고 안내해 드려요.'; R.won = [100000]; return; }
    var b = band(g), t = rv === 'new' || rv === 'lo' ? 'L' : rv === 'mid' ? 'P' : rv === 'hi' ? 'S' : 'U';
    if (t === 'L' && emp > 5) { t = 'P'; R.why = '4대보험 직원이 6명 이상이면 이 금액이에요.'; }
    if (t === 'L') { R.kind = 'lite'; R.plan = '택스민 <b>Lite</b>'; R.price = emp > 3 ? '월 6만원' : '월 5만원'; R.staff = emp; if (emp <= 3) R.sub = '직원이 4~5명이면 월 6만원이에요.'; R.won = [emp > 3 ? 60000 : 50000]; }
    else if (t === 'U') { R.kind = 'unk'; R.plan = '택스민 <b>Lite</b> · <b>Plus</b> · <b>성실</b> 중 하나'; R.price = '월 5만원부터'; R.why = '작년 매출에 따라 등급이 정해져요. 상담 때 홈택스 자료로 함께 확인해 드릴게요.'; R.won = [50000]; }
    else if (t === 'S') { R.kind = 'sin'; R.plan = '택스민 <b>성실</b>'; R.price = '월 12~15만원'; R.why = '작년 매출이 ' + b.hi + ' 이상인 가게는 신고 때 세무사가 한 번 더 꼼꼼히 확인해요.'; R.won = [120000, 150000]; }
    else { R.kind = 'plus'; R.plan = '택스민 <b>Plus</b>'; R.price = '월 7~8만원'; if (!R.why) R.why = '작년 매출이 ' + b.lo + '을 넘으면 이 금액이에요.'; R.sub = '작년 매출이 ' + b.hi + ' 이상이 되면 월 12~15만원이에요.'; R.won = [70000, 80000]; }
    if (g === '?' && t !== 'L') R.why = (R.why ? R.why + ' ' : '') + '그 밖의 업종은 기준이 다를 수 있어 상담 때 확정해요.';
  }
  function plain(html) { var d = doc.createElement('div'); d.innerHTML = html; return d.textContent; }
  /* 부가세 포함 금액(공급가액 × 1.1, 부가가치세법 제30조 세율 10%) — 산출 */
  function inclLine() {
    var w = R.won, from = R.kind === 'unk' || R.kind === 'corp';
    if (w.length === 2) return '부가세 포함 월 ' + won(w[0] * 1.1) + ' ~ ' + won(w[1] * 1.1);
    return '부가세 포함 월 ' + won(w[0] * 1.1) + (from ? '부터' : '');
  }
  function renderResult() {
    res.classList.remove('ph');
    var h = '<p class="r-price num">' + esc(R.price) + '<small>부가세 별도</small></p><p class="r-incl num">' + inclLine() + '</p>';
    h += '<button type="button" class="btn btn-kakao btn-block" data-copy data-hit="kakao_copy">' + CHAT + '이 결과로 카톡 상담하기</button>';
    h += '<a class="btn btn-rsv btn-block" href="#reserve" data-hit="res_reserve">전화 상담 예약</a>';
    h += '<a class="r-tel" href="tel:' + TEL + '" data-hit="tel">바로 전화 ' + TEL + '</a>';
    var list = R.kind === 'corp' ? ['법인 장부 기장', '부가가치세·법인세 신고', '인건비 신고'] :
      ['장부 정리', '매달 매출 보고서', '부가가치세 신고', '인건비 신고 <small>' + (R.kind === 'lite' ? (R.staff ? '직원 ' + (R.staff === 3 ? '1~3명' : R.staff === 5 ? '4~5명' : R.staff + '명') + ' 포함' : '직원 5명까지') : '포함') + '</small>', '신고 일정 먼저 안내', '카카오톡 상담'];
    h += '<details><summary>포함된 일과 조건 보기</summary><div class="r-more">';
    if (R.sub) h += '<p>' + esc(R.sub) + '</p>';
    if (R.kind !== 'lite') h += '<p>예상 금액이에요. 장부 상태를 보고 상담 때 확정해 알려 드려요.</p>';
    if (R.why) h += '<p>' + esc(R.why) + '</p>';
    h += '<ul class="r-list">' + list.map(function (x) { return '<li>' + CK + '<span>' + x + '</span></li>'; }).join('') + '</ul>';
    h += '<p>' + (R.kind === 'corp' ? '법인세 신고 비용은 따로이고, 신고 전에 먼저 알려 드려요.' : '5월 종합소득세 신고 비용은 따로이고, 신고 전에 먼저 알려 드려요.') + '</p></div></details>';
    h += '<button class="r-again" type="button" data-again>다시 계산하기</button>';
    res.innerHTML = h;
    hit('calc_done', true);
    requestAnimationFrame(function () {
      var r = res.getBoundingClientRect();
      if (r.top > innerHeight - 120 || r.top < 0) res.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
    });
  }
  function resultText() {
    return '[택스민 기장료 계산 결과]\n업종: ' + R.ind + (R.kind === 'corp' ? '' : '\n작년 매출: ' + R.rev + '\n4대보험 직원: ' + R.emp) +
      '\n→ ' + plain(R.plan) + ' ' + R.price + ' (부가세 별도)\n이 내용으로 상담 받고 싶어요.';
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, no) {
      var t = doc.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
      doc.body.appendChild(t); t.select(); try { doc.execCommand('copy') ? ok() : no(); } catch (e) { no(e); } doc.body.removeChild(t);
    });
  }
  function reset(from) {
    var order = ['ind', 'rev', 'emp'], i = order.indexOf(from);
    order.slice(i + 1).forEach(function (k) { A[k] = null; qs[k].hidden = true; qs[k].classList.remove('done'); $$('.chip', qs[k]).forEach(function (c) { c.classList.remove('on'); }); });
    placeholder();
  }
  function onClick(e) {
    if (e.target.closest('[data-more]')) {
      var mb = e.target.closest('[data-more]'); $$('.chip[hidden]', mb.parentNode).forEach(function (c) { c.hidden = false; }); mb.remove(); return;
    }
    var c = e.target.closest('.chip');
    if (c && box.contains(c)) {
      var name = c.parentNode.getAttribute('data-name');
      $$('.chip', c.parentNode).forEach(function (x) { x.classList.toggle('on', x === c); });
      A[name] = c; qs[name].classList.add('done'); reset(name);
      if (name === 'ind') {
        hit('calc_start', true);
        if (c.getAttribute('data-g') === 'X') { compute(); renderResult(); return; }
        revBands(c.getAttribute('data-g')); qs.rev.hidden = false; next(qs.rev);
      } else if (name === 'rev') { qs.emp.hidden = false; next(qs.emp); }
      else { compute(); renderResult(); }
      return;
    }
    if (e.target.closest('[data-again]')) { reset('ind'); A.ind = null; qs.ind.classList.remove('done'); $$('.chip', qs.ind).forEach(function (x) { x.classList.remove('on'); }); qs.ind.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' }); return; }
    if (e.target.closest('[data-copy]')) {
      var go = function () { window.open(KAKAO, '_blank', 'noopener'); };
      copy(resultText()).then(function () { toast('계산 결과를 복사했어요. 카톡 창에 붙여넣기만 하세요.'); setTimeout(go, 700); }, go);
    }
  }
  box.addEventListener('click', onClick);
  if (resHost !== box) resHost.addEventListener('click', onClick);
  function next(el) { requestAnimationFrame(function () { var r = el.getBoundingClientRect(); if (r.bottom > innerHeight - 100) el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'center' }); }); }

  /* 전화 상담 예약: ENDPOINT(구글 Apps Script)로 보내면 시트에 쌓이고 min@taxmin.kr 로 메일이 감(docs/apps-script.gs).
     주소가 없으면 보낸 척하지 않고 전화·카톡으로 안내한다. */
  var rf = $('#reserve .rsv');
  if (rf) {
    var nI = $('#r-name', rf), tI = $('#r-tel', rf), bI = $('#r-biz', rf), mI = $('#r-msg', rf), oI = $('#r-ok', rf), out = $('.msg', rf), sb = $('button[type=submit]', rf);
    tI.addEventListener('input', function () {
      var d = tI.value.replace(/\D/g, '').slice(0, 11); if (!/^01/.test(d)) return;
      var mid = d.length === 10 ? 6 : 7;
      tI.value = d.length < 4 ? d : d.length <= mid ? d.slice(0, 3) + '-' + d.slice(3) : d.slice(0, 3) + '-' + d.slice(3, mid) + '-' + d.slice(mid);
    });
    [nI, tI].forEach(function (el) { el.addEventListener('input', function () { el.parentNode.classList.remove('bad'); }); });
    rf.addEventListener('submit', function (ev) {
      ev.preventDefault(); out.textContent = '';
      var tel = tI.value.trim(), digits = tel.replace(/\D/g, '');
      if (!nI.value.trim()) { nI.parentNode.classList.add('bad'); out.textContent = '이름을 적어 주세요.'; nI.focus(); return; }
      if (!/^01\d{8,9}$/.test(digits)) { tI.parentNode.classList.add('bad'); out.textContent = '휴대폰 번호를 확인해 주세요. 예) 010-1234-5678'; tI.focus(); return; }
      if (!oI.checked) { out.textContent = '개인정보 수집·이용에 동의해 주세요.'; oI.focus(); return; }
      if (!ENDPOINT) { out.textContent = '지금은 온라인 예약을 받을 수 없어요. 전화(' + TEL + ')나 카카오톡으로 연락 주세요.'; return; }
      var when = (rf.querySelector('input[name=when]:checked') || {}).value || '-';
      var data = { type: 'lead', '요청': '전화 상담 예약', '이름': nI.value.trim(), '연락처': tel, '통화 편한 시간': when,
        '업종': bI.value.trim() || (R ? R.ind : '-'), '남기실 말씀': mI.value.trim(),
        '작년 매출': R ? R.rev : '-', '직원(4대보험)': R ? R.emp : '-', '추천 요금제': R ? plain(R.plan) : '-', '예상 기장료': R ? R.price + ' (부가세 별도)' : '-',
        '들어온 곳': srcLabel, '광고': adKey || '-', '캠페인': campaign || '-', '시안': VARIANT, '개인정보 수집·이용 동의': '동의함',
        '_honey': rf.querySelector('[name=hp]').value };
      sb.disabled = true; sb.textContent = '보내는 중…';
      /* 서버 답을 읽어서 정말 받았을 때만 '받았어요'(ok·dup·held = 시트에 남음). 그 밖이면 전화·카톡 안내 */
      function fail(t) { sb.disabled = false; sb.textContent = '전화 상담 예약하기'; out.textContent = t || '보내지 못했어요. 잠시 뒤 다시 하시거나 전화(' + TEL + ')·카카오톡으로 연락 주세요.'; }
      fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) })
        .then(function (r) { return r.text(); })
        .then(function (t) {
          t = String(t || '').trim();
          if (t === 'bad') return fail('이름·휴대폰 번호를 다시 확인해 주세요.');
          if (t !== 'ok' && t !== 'dup' && t !== 'held') return fail();
          hit('reserve_done', true);
          var whenTxt = when === '언제든' ? '평일 10:00–17:30 중 편하실 때' : when + '에';
          rf.outerHTML = '<div class="rsv-done" role="status"><b>예약을 받았어요</b><p>' + esc(whenTxt) + ' ' + esc(tel) + '로 전화드릴게요.<br>급하시면 카카오톡으로 말씀해 주세요.</p></div>';
        })
        .catch(function () { fail(); });
    });
  }
})();
