/* Shanti Kala Nikketan — prototype behaviour.
   Vanilla, no dependencies. Everything degrades to working HTML without it. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- beat: read the tala straight out of the stylesheet ---------------- */
  function beat() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--beat');
    var n = parseFloat(v);
    if (!n) return 150;
    return /ms/.test(v) ? n : n * 1000;
  }
  var BEAT = beat();

  /* --- mobile navigation ------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', String(!open));
      toggle.setAttribute('aria-expanded', String(!open));
    });
  }

  /* --- the polysemy panel ----------------------------------------------
     One hand, many meanings. The hand never changes; only what it is asked
     to say. Advances on an eight-beat cycle so it keeps tala with the rest
     of the interface. Pauses on hover, focus, and when off screen.        */
  document.querySelectorAll('[data-polysemy]').forEach(function (root) {
    var out = root.querySelector('.polysemy__meaning span');
    var counter = root.querySelector('.polysemy__count');
    var box = root.querySelector('.polysemy__meaning');
    var items;
    try {
      items = JSON.parse(root.getAttribute('data-polysemy'));
    } catch (e) { return; }
    if (!out || !items || items.length < 2) return;

    var i = 0;
    var timer = null;
    var paused = false;

    function paint() {
      out.textContent = items[i];
      if (counter) counter.textContent = (i + 1) + ' of ' + items.length;
    }

    function advance() {
      if (paused) return;
      i = (i + 1) % items.length;
      if (reduced) { paint(); return; }
      box.setAttribute('data-swapping', 'true');
      window.setTimeout(function () {
        paint();
        box.setAttribute('data-swapping', 'false');
      }, BEAT * 2);
    }

    paint();
    function start() { if (!timer) timer = window.setInterval(advance, BEAT * 16); }
    function stop() { window.clearInterval(timer); timer = null; }

    root.addEventListener('mouseenter', function () { paused = true; });
    root.addEventListener('mouseleave', function () { paused = false; });
    root.addEventListener('focusin', function () { paused = true; });
    root.addEventListener('focusout', function () { paused = false; });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { en.isIntersecting ? start() : stop(); });
      }, { threshold: 0.25 }).observe(root);
    } else {
      start();
    }
  });

  /* --- reveal on first sight -------------------------------------------- */
  var targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.setAttribute('data-reveal', 'in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.setAttribute('data-reveal', 'in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (el) { io.observe(el); });
  }
})();

/* --- enquiry form ------------------------------------------------------
   PROTOTYPE ONLY. This intercepts the submit and shows the success state
   without sending anything. There is no backend, no validation beyond the
   browser's, and no spam protection. Before this goes live it needs a real
   handler, server-side validation, and a CAPTCHA or equivalent.          */
(function () {
  'use strict';
  var form = document.getElementById('enquiry-form');
  var done = document.getElementById('enquiry-success');
  if (!form || !done) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    form.hidden = true;
    done.setAttribute('data-shown', 'true');
    done.setAttribute('tabindex', '-1');
    done.focus();
  });
})();

/* --- sound toggle -----------------------------------------------------
   Muted by default and deliberately inert in the prototype. The intent is a
   nattuvangam click marking the beat; wiring real audio needs the recording
   and a considered decision about autoplay policy.                      */
(function () {
  'use strict';
  var btn = document.querySelector('.sound-toggle');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var on = btn.getAttribute('aria-pressed') === 'true';
    btn.setAttribute('aria-pressed', String(!on));
    btn.querySelector('[data-sound-label]').textContent = on ? 'Sound off' : 'Sound on';
  });
})();
