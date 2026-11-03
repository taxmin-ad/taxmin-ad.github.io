/* 택스민 토끼 모션 — 랜딩 내용에 맞춰 움직임(원본: 사용자 제공 '택스민_토끼랜딩_사이트_20261103.zip' js/bun.js, 지금 시안 B 구조에 맞게 2·3번 자리만 바꿈)
   첫 화면: 위에서 폴짝 내려와 앉고 "당근이죠!" (누르면 다시 폴짝)
   안내 띠: 말풍선마다 콩, 대화 답장("당근이죠")이 올 때마다 끄덕
   5만원: 날아와 가격 꼬리표 위에 앉음 / 계산: 고를 때 귀 쫑긋, 결과 나오면 만세
   마무리: 스티커처럼 착 붙고 윙크 */
(function () {
  'use strict';
  var doc = document;
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE_OUT = 'cubic-bezier(.22,.8,.3,1)', EASE_IN = 'cubic-bezier(.55,0,.8,.4)';

  var EYES =
    '<svg viewBox="0 0 820 929" aria-hidden="true"><g class="look">' +
    '<g class="o-l"><g class="lid"><ellipse class="eye" cx="354" cy="357" rx="25" ry="30"/>' +
    '<circle cx="345" cy="344" r="8.5" fill="#fff"/><circle cx="363" cy="369" r="3.5" fill="#fff" opacity=".8"/></g></g>' +
    '<g class="o-r"><g class="lid"><ellipse class="eye" cx="518" cy="394" rx="22" ry="27"/>' +
    '<circle cx="510" cy="382" r="7.5" fill="#fff"/><circle cx="526" cy="405" r="3" fill="#fff" opacity=".8"/></g></g>' +
    '<path class="w-r eye-line" d="M547 380 Q514 386 492 397 Q515 405 545 414"/>' +
    '<path class="h-l eye-line" d="M329 368 Q354 334 379 368"/>' +
    '<path class="h-r eye-line" d="M495 404 Q518 372 541 404"/>' +
    '</g></svg>';

  function make(el, eye) {
    el.classList.add('bun');
    el.setAttribute('data-eye', eye || 'wink');
    el.innerHTML = '<i class="sh"></i><div class="rig"><i class="el"></i><i class="er"></i><i class="bd"></i>' + EYES + '<i class="bg"></i></div>';
    var b = { el: el, rig: el.querySelector('.rig'), sh: el.querySelector('.sh'), el_: el.querySelector('.el'), er: el.querySelector('.er'),
      bang: el.querySelector('.bg'), look: el.querySelector('.look'), busy: false };
    if (!calm) blinkLoop(b);
    return b;
  }
  function anim(node, frames, ms, opt) {
    if (calm || !node.animate) return { finished: Promise.resolve() };
    var a = node.animate(frames, Object.assign({ duration: ms, easing: 'linear', fill: 'both' }, opt || {}));
    return a;
  }
  function eyes(b, mode) { b.el.setAttribute('data-eye', mode); }
  function blink(b) { if (b.el.getAttribute('data-eye') === 'happy') return; b.el.classList.add('blink'); setTimeout(function () { b.el.classList.remove('blink'); }, 120); }
  function blinkLoop(b) { setTimeout(function () { if (!doc.hidden) blink(b); blinkLoop(b); }, 2600 + Math.random() * 2400); }
  function look(b, x, y) { b.look.style.transform = 'translate(' + (x || 0) + 'px,' + (y || 0) + 'px)'; }
  function idle(b, on) { b.el.classList.toggle('idle', !!on); }

  /* 느낌표 두 줄이 톡 튀어나옴 */
  function pop(b, delay) {
    return anim(b.bang, [
      { opacity: 0, transform: 'scale(.2) rotate(-20deg)' },
      { opacity: 1, transform: 'scale(1.15) rotate(4deg)', offset: .45 },
      { opacity: 1, transform: 'scale(1) rotate(0)', offset: .7 },
      { opacity: 1, transform: 'scale(1)', offset: .85 },
      { opacity: 0, transform: 'scale(.9)' }
    ], 1500, { delay: delay || 0, easing: EASE_OUT });
  }
  /* 귀 털기: 왼귀·오른귀가 엇박으로 */
  function ears(b, k, delay) {
    k = k || 1; delay = delay || 0;
    anim(b.el_, [{ transform: 'rotate(0)' }, { transform: 'rotate(' + (-14 * k) + 'deg)', offset: .3 }, { transform: 'rotate(' + (6 * k) + 'deg)', offset: .6 }, { transform: 'rotate(' + (-2 * k) + 'deg)', offset: .82 }, { transform: 'rotate(0)' }], 760, { delay: delay, fill: 'none' });
    return anim(b.er, [{ transform: 'rotate(0)' }, { transform: 'rotate(' + (16 * k) + 'deg)', offset: .34 }, { transform: 'rotate(' + (-7 * k) + 'deg)', offset: .64 }, { transform: 'rotate(' + (2 * k) + 'deg)', offset: .85 }, { transform: 'rotate(0)' }], 820, { delay: delay + 60, fill: 'none' });
  }
  /* 폴짝: 웅크림 → 위로 늘어남 → 착지 찌그러짐 → 출렁 (h = 몸 높이 대비 점프 %) */
  function hop(b, h, opt) {
    opt = opt || {};
    h = h || 26;
    var from = opt.from || 'translate(0,0)';
    var t = anim(b.rig, [
      { transform: from + ' scale(1,1)', opacity: opt.from ? 0 : 1 },
      { transform: 'translate(0,0) scale(1.08,.9)', opacity: 1, offset: opt.from ? 0.001 : .14, easing: EASE_OUT },
      { transform: 'translate(0,-' + h + '%) scale(.94,1.08)', offset: .45, easing: EASE_IN },
      { transform: 'translate(0,0) scale(1.14,.84)', offset: .66, easing: EASE_OUT },
      { transform: 'translate(0,-4%) scale(.97,1.04)', offset: .8, easing: 'ease-in-out' },
      { transform: 'translate(0,0) scale(1,1)', opacity: 1 }
    ], opt.ms || 900, { delay: opt.delay || 0 });
    anim(b.sh, [
      { transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.06,1)', offset: .14 },
      { transform: 'scale(.62)', opacity: .45, offset: .45 }, { transform: 'scale(1.1,1)', opacity: 1, offset: .66 }, { transform: 'scale(1)', opacity: 1 }
    ], opt.ms || 900, { delay: opt.delay || 0 });
    ears(b, 1, (opt.delay || 0) + (opt.ms || 900) * .55);
    return t;
  }
  /* 위에서 떨어져 앉기(등장) */
  function drop(b, opt) {
    opt = opt || {};
    var ms = opt.ms || 1150, d = opt.delay || 0;
    b.el.classList.add('on');
    anim(b.rig, [
      { transform: 'translate(0,-34%) scale(.92,1.1)', opacity: 0 },
      { transform: 'translate(0,-30%) scale(.92,1.1)', opacity: 1, offset: .14 },
      { transform: 'translate(0,0) scale(.95,1.06)', offset: .42, easing: EASE_IN },
      { transform: 'translate(0,0) scale(1.18,.8)', offset: .52, easing: EASE_OUT },
      { transform: 'translate(0,-9%) scale(.96,1.05)', offset: .7, easing: 'ease-in-out' },
      { transform: 'translate(0,0) scale(1.04,.96)', offset: .84 },
      { transform: 'translate(0,0) scale(1,1)', opacity: 1 }
    ], ms, { delay: d, easing: 'cubic-bezier(.5,0,.9,.6)' });
    anim(b.sh, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(.9)', opacity: .8, offset: .42 }, { transform: 'scale(1.15,1)', opacity: 1, offset: .52 }, { transform: 'scale(1)', opacity: 1 }], ms, { delay: d });
    ears(b, 1.2, d + ms * .45);
    return new Promise(function (r) { setTimeout(r, calm ? 0 : d + ms); });
  }
  /* 끄덕: 몸을 앞으로 숙였다가 귀가 따라옴 */
  function nod(b, delay) {
    anim(b.rig, [{ transform: 'rotate(0) translateY(0)' }, { transform: 'rotate(5deg) translateY(2%)', offset: .35, easing: EASE_OUT }, { transform: 'rotate(-2deg) translateY(-1%)', offset: .7 }, { transform: 'rotate(0) translateY(0)' }], 620, { delay: delay || 0, fill: 'none' });
    ears(b, .7, (delay || 0) + 140);
  }

  function seen(el, fn, th) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { o.disconnect(); fn(); } }, { threshold: th || .35 });
    o.observe(el);
  }

  /* ── 1. 첫 화면 ── */
  var hostHero = doc.querySelector('[data-bun="hero"]');
  if (hostHero) {
    var H = make(hostHero, 'open'), say = doc.querySelector('.stage-b .say'), tag = doc.querySelector('.stage-b .tag5');
    hostHero.setAttribute('data-in', '');
    if (say) say.style.animation = 'none';
    var sayIn = function (d) {
      if (!say) return;
      anim(say, [{ opacity: 0, transform: 'scale(.3) rotate(-10deg)' }, { opacity: 1, transform: 'scale(1.08) rotate(2deg)', offset: .6 }, { opacity: 1, transform: 'scale(1) rotate(0)' }], 520, { delay: d || 0, easing: EASE_OUT });
    };
    if (say && !calm) say.style.opacity = 0;
    if (tag && !calm) tag.style.opacity = 0;
    var heroIntro = function () {
      drop(H, { delay: 250 }).then(function () {
        pop(H); eyes(H, 'wink'); sayIn(80);
        if (tag) anim(tag, [{ opacity: 0, transform: 'translateY(-30px) rotate(-14deg)' }, { opacity: 1, transform: 'translateY(0) rotate(7deg)', offset: .55 }, { opacity: 1, transform: 'rotate(1deg)', offset: .78 }, { opacity: 1, transform: 'rotate(3deg)' }], 900, { delay: 380, easing: EASE_OUT });
        setTimeout(function () { eyes(H, 'open'); idle(H, true); }, 1600);
      });
    };
    if (calm) { hostHero.classList.add('on'); eyes(H, 'wink'); } else heroIntro();
    hostHero.addEventListener('click', function () {
      if (H.busy || calm) return; H.busy = true; idle(H, false);
      eyes(H, 'happy'); hop(H, 30, { ms: 820 }); pop(H, 300); sayIn(380);
      setTimeout(function () { eyes(H, 'wink'); }, 900);
      setTimeout(function () { eyes(H, 'open'); idle(H, true); H.busy = false; }, 1900);
    });
    /* 마우스·스크롤 쪽으로 눈동자 */
    if (!calm) doc.addEventListener('pointermove', function (e) {
      var r = hostHero.getBoundingClientRect(), cx = r.left + r.width * .52, cy = r.top + r.height * .42;
      var dx = Math.max(-1, Math.min(1, (e.clientX - cx) / 400)), dy = Math.max(-1, Math.min(1, (e.clientY - cy) / 400));
      look(H, dx * 7, dy * 6);
    }, { passive: true });
  }

  /* ── 2. 안내 띠: 말풍선이 하나 올라올 때마다 콩, 휴대폰 속 답장('당근이죠')이 오면 끄덕 ── */
  var hostG = doc.querySelector('.guide [data-bun="guide"]');
  var G = null;
  if (hostG) {
    G = make(hostG, 'open');
    hostG.setAttribute('data-in', '');
    G.sh.style.opacity = .7;
    var guide = hostG.closest('.guide');
    seen(guide, function () {
      G.el.classList.add('on');
      if (calm) return;
      // 말풍선 등장 시각(v2 .g-says li: .2s · .65s · 1.1s)에 맞춰 콩·콩·콩
      [200, 650, 1100].forEach(function (d) { hop(G, 12, { ms: 440, delay: d }); });
      setTimeout(function () { eyes(G, 'happy'); pop(G); }, 1650);
      setTimeout(function () { eyes(G, 'open'); idle(G, true); }, 2700);
    }, .5);
    look(G, 8, 2);   // 말풍선 쪽을 봄
  }
  var dev = doc.querySelector('.b-band .device');
  if (dev && G) {
    var rows = [].slice.call(dev.querySelectorAll('.seq'));
    var mo = new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        var r = m.target;
        if (!r.classList.contains('show') || r.classList.contains('typing-row') || r._bun) return;
        r._bun = 1;
        if (r.classList.contains('me')) { look(G, 10, 8); return; }   // 사장님 질문 → 휴대폰 쪽 보기
        var yes = /당근/.test(r.textContent);
        look(G, 6, 2); nod(G);
        if (yes) { eyes(G, 'happy'); pop(G, 120); setTimeout(function () { eyes(G, 'open'); }, 1100); }
      });
      if (rows.every(function (x) { return !x.classList.contains('show'); })) rows.forEach(function (x) { x._bun = 0; });
    });
    rows.forEach(function (r) { mo.observe(r, { attributes: true, attributeFilter: ['class'] }); });
  }

  /* ── 3. 5만원 꼬리표 위에 날아와 앉기 ── */
  var hang = doc.querySelector('.hang');
  var S = null;
  if (hang) {
    var hostSit = doc.createElement('span'); hostSit.className = 'bun-sit'; hostSit.setAttribute('data-in', ''); hostSit.setAttribute('aria-hidden', 'true');
    hang.appendChild(hostSit);
    S = make(hostSit, 'open');
    seen(hang, function () {
      S.el.classList.add('on');
      // 오른쪽 위에서 포물선으로 날아와 꼬리표 위에 착지
      anim(S.el, [{ transform: 'translate(70%,-120%) rotate(20deg)', opacity: 0 }, { transform: 'translate(45%,-140%) rotate(12deg)', opacity: 1, offset: .25, easing: 'cubic-bezier(.3,0,.6,1)' }, { transform: 'translate(0,0) rotate(0)', opacity: 1 }], 700, { easing: 'cubic-bezier(.4,0,.7,1)' });
      setTimeout(function () {
        anim(S.rig, [{ transform: 'scale(1.2,.78)' }, { transform: 'translateY(-10%) scale(.95,1.06)', offset: .45, easing: 'ease-in-out' }, { transform: 'scale(1.04,.96)', offset: .75 }, { transform: 'none' }], 560, { easing: EASE_OUT });
        anim(hang, [{ transform: 'rotate(-4deg)' }, { transform: 'rotate(-1deg) translateY(6px)', offset: .3 }, { transform: 'rotate(-5deg) translateY(-2px)', offset: .65 }, { transform: 'rotate(-4deg)' }], 560, { fill: 'none' });
        ears(S, 1.2, 80); pop(S, 120); eyes(S, 'wink');
        setTimeout(function () { eyes(S, 'open'); idle(S, true); }, 1500);
      }, calm ? 0 : 690);
    }, .6);
    look(S, -6, 9);   // 아래 '기장료 계산' 버튼 쪽을 내려다봄
  }

  /* ── 3-2. 계산: 고를 때 귀 쫑긋, 결과에서 만세 ── */
  var calcBox = doc.querySelector('[data-calc]');
  if (calcBox && S) calcBox.addEventListener('click', function (e) { if (e.target.closest('.chip, button')) { ears(S, .8); blink(S); } });
  var res = doc.getElementById('calc-res');
  if (res) {
    var R = null;
    new MutationObserver(function () {
      if (res.classList.contains('ph') || !res.querySelector('.r-price') || res.querySelector('.bun-res')) return;
      var host = doc.createElement('div'); host.className = 'bun-res'; host.setAttribute('aria-hidden', 'true');
      res.insertBefore(host, res.firstChild);
      R = make(host, 'happy');
      R.sh.style.display = 'none';
      anim(R.rig, [{ transform: 'translateY(70%) scale(.9)', opacity: 0 }, { transform: 'translateY(-14%) scale(.96,1.06)', opacity: 1, offset: .55, easing: EASE_OUT }, { transform: 'translateY(0) scale(1.06,.94)', offset: .8 }, { transform: 'none', opacity: 1 }], 700, { delay: 250 });
      ears(R, 1.3, 520); pop(R, 600);
      setTimeout(function () { eyes(R, 'wink'); idle(R, true); }, 1700);
    }).observe(res, { childList: true });
  }

  /* ── 4. 마무리: 스티커처럼 착 ── */
  var st = doc.querySelector('.b-close .sticker');
  if (st) {
    var img = st.querySelector('img'); var hostEnd = doc.createElement('div');
    if (img) img.replaceWith(hostEnd); else st.appendChild(hostEnd);
    var E = make(hostEnd, 'open');
    E.sh.style.opacity = .6;
    seen(st, function () {
      st.classList.add('on');
      setTimeout(function () { pop(E); ears(E, 1.1); eyes(E, 'wink'); }, calm ? 0 : 520);
      setTimeout(function () { eyes(E, 'open'); idle(E, true); }, 2200);
    }, .5);
    var kakao = doc.querySelector('.b-close .btn-kakao');
    if (kakao) {   // 카톡 단추에 손이 가면 그쪽을 보고 귀 쫑긋
      kakao.addEventListener('pointerenter', function () { look(E, 0, 9); ears(E, .6); eyes(E, 'happy'); });
      kakao.addEventListener('pointerleave', function () { look(E, 0, 0); eyes(E, 'open'); });
    }
  }

  /* 영상·캡처용: 정해진 순간 재생 */
  window.__bun = { make: make, hop: hop, drop: drop, nod: nod, ears: ears, pop: pop, eyes: eyes };
})();
