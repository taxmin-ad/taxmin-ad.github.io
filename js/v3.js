/* 택스민 당근 랜딩 v3(2026-11-23 시안) — v2.js 뒤에 읽는다(계산 결과·집계·창 열기는 v2.js 의 window.TMX 를 씀)
   ① 카톡 단추 → '한 마디 보내기' 안내 창(보낼 말 고르기 → 복사하고 카톡 열기 → 돌아오면 "보내셨나요?")
   ② 첫 화면 토끼 영상 ③ 대화 시연(입력 → 보내기 → 대화 시작) ④ 스크롤 등장·영수증·흐르는 띠 */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, X = window.TMX || {};
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IO = 'IntersectionObserver' in window;
  function $(s, el) { return (el || doc).querySelector(s); }
  function $$(s, el) { return [].slice.call((el || doc).querySelectorAll(s)); }
  function watch(el, fn, opt) { if (!IO) { fn(true); return; } new IntersectionObserver(function (es) { fn(es[0].isIntersecting); }, opt || { threshold: 0.2 }).observe(el); }
  function once(el, fn, th) {
    if (!IO || calm) { fn(); return; }
    var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { o.disconnect(); fn(); } }, { threshold: th || 0.25 });
    o.observe(el);
  }
  root.classList.add('v3on');

  /* ── 첫 화면 토끼 영상: 사진을 먼저 보여 주고, 영상이 돌기 시작하면 바꿔 끼움 ── */
  var v = $('[data-bun-v]');
  if (v) {
    var host = v.parentNode, conn = navigator.connection || {};
    if (calm || conn.saveData) { /* 사진 그대로 */ }
    else {
      v.muted = true;
      v.src = matchMedia('(max-width: 719px)').matches ? v.getAttribute('data-m') : v.getAttribute('data-pc');
      v.addEventListener('playing', function () { host.classList.add('live'); host.classList.remove('still'); }, { once: true });
      v.addEventListener('error', function () { host.classList.add('still'); }, { once: true });
      var tryPlay = function () { var p = v.play(); if (p && p.catch) p.catch(function () { if (!host.classList.contains('live')) host.classList.add('still'); }); };
      watch(host, function (vis) { if (vis) tryPlay(); else v.pause(); }, { threshold: 0 });
    }
  }

  /* ── 스크롤 등장 · 영수증 ── */
  $$('[data-rv]').forEach(function (el) { once(el, function () { el.classList.add('in'); }, 0.2); });
  $$('.v3-rc-w').forEach(function (el) {
    $$('li', el).forEach(function (li, i) { li.style.setProperty('--i', i); });
    once(el, function () { el.classList.add('in'); }, 0.35);
  });
  $$('.v3-mq-w').forEach(function (el) { watch(el, function (vis) { el.classList.toggle('paused', !vis); }, { threshold: 0 }); });

  /* ── 대화 시연: 입력 칸에 한 마디 → 보내기 → 대화 시작(보이는 동안 반복) ── */
  $$('[data-player3]').forEach(function (dev) {
    var rows = $$('.seq', dev), bar = $('.v3-in', dev), inT = $('[data-in-t]', dev);
    var steps = $$('.v3-how li', dev.parentNode), run = 0, on = false;
    function mark(i) { steps.forEach(function (s, j) { s.classList.toggle('on', j === i); }); }
    function wait(ms, id) { return new Promise(function (ok) { setTimeout(function () { if (id === run && on) ok(); }, ms); }); }
    function type(text, id) {
      return new Promise(function (ok) {
        var i = 0;
        (function f() { if (id !== run || !on) return; inT.textContent = text.slice(0, ++i); if (i < text.length) setTimeout(f, 62); else ok(); })();
      });
    }
    function reset() { rows.forEach(function (r) { r.classList.remove('show', 'gone'); }); inT.textContent = ''; bar.classList.remove('has', 'tap'); mark(0); }
    function sendTyped(row, id) {
      bar.classList.add('has');
      return type($('.bub', row).textContent, id)
        .then(function () { mark(1); bar.classList.add('tap'); return wait(620, id); })
        .then(function () { bar.classList.remove('has', 'tap'); inT.textContent = ''; row.classList.add('show'); mark(2); return wait(750, id); });
    }
    function seq(i, id) {
      if (i >= rows.length) return wait(4000, id).then(function () { play(); });
      var el = rows[i], prev = rows[i - 1];
      if (prev && prev.classList.contains('typing-row')) prev.classList.add('gone');
      if (el.classList.contains('me')) return sendTyped(el, id).then(function () { return seq(i + 1, id); });
      el.classList.add('show');
      return wait(el.classList.contains('typing-row') ? 1100 : 1350, id).then(function () { return seq(i + 1, id); });
    }
    function play() { var id = ++run; reset(); wait(450, id).then(function () { return seq(0, id); }); }
    if (calm || !window.Promise) { rows.forEach(function (r) { r.classList.add(r.classList.contains('typing-row') ? 'gone' : 'show'); }); mark(2); return; }
    reset();
    watch(dev, function (vis) { on = vis; dev.classList.toggle('paused', !vis); if (vis) play(); else run++; }, { threshold: 0.35 });
  });

  /* ── 카톡 안내 창 ── */
  var kk = doc.getElementById('kk');
  if (!kk || !X.open) return;   // v2.js 가 없으면 카톡 단추는 원래대로 카톡을 바로 연다
  var panes = {}, title = $('#kk-t', kk), TITLES = { pick: '카톡, 한 마디만 보내 주세요', check: '메시지 보내셨나요?', done: '고마워요!' };
  $$('[data-kk]', kk).forEach(function (p) { panes[p.getAttribute('data-kk')] = p; });
  var resOpt = $('[data-kk-res]', kk), resIn = resOpt && $('input', resOpt), firstIn = $('.kk-msgs label:not([data-kk-res]) input', kk);
  var pending = 0, msg = '', timer = null;
  function show(name) {
    Object.keys(panes).forEach(function (k) { panes[k].hidden = k !== name; });
    if (title) title.textContent = TITLES[name];
    kk.scrollTop = 0;
  }
  function chosen() {
    var r = $('input[name=kkm]:checked', kk); if (!r) return '';
    return r.value === '__res' ? (X.result() || '') : r.value;
  }
  doc.addEventListener('click', function (e) {
    var t = e.target; if (!t.closest) return;
    var opener = t.closest('[data-kk-open]');
    if (opener) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      var has = !!(X.result && X.result());
      if (resOpt) {
        resOpt.hidden = !has;
        if (has) { resIn.checked = true; var pr = $('[data-kk-res-p]', resOpt); if (pr) pr.textContent = X.price(); }
        else if (resIn.checked && firstIn) firstIn.checked = true;
      }
      clearTimeout(timer); pending = 0; show('pick'); X.open('kk');
      return;
    }
    var go = t.closest('[data-kk-go]');
    if (go) {   // 링크는 그대로 카톡을 열고, 누르는 그 순간 고른 말을 복사해 둔다
      msg = chosen() || msg || '기장 상담 받고 싶어요';
      X.copy(msg);
      $$('[data-kk-msg]', kk).forEach(function (n) { n.textContent = msg; });
      pending = Date.now();
      clearTimeout(timer); timer = setTimeout(function () { show('check'); }, 600);
      return;
    }
    if (t.closest('[data-kk-yes]')) { pending = 0; show('done'); }
  });
  /* 카톡에서 돌아오면 "보내셨나요?"를 다시 보여 줌 */
  function back() {
    if (!pending || Date.now() - pending < 1500) return;
    show('check');
    if (!kk.open && typeof kk.showModal === 'function' && !$('dialog[open]')) kk.showModal();
  }
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) back(); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) back(); });
  kk.addEventListener('close', function () { if (panes.done && !panes.done.hidden) show('pick'); });
})();
