/* Scroll-linked hasta morphing.
 *
 * The geometry here mirrors prototype/pose.py exactly, and the pose numbers are
 * injected from it, so Python and the browser cannot drift apart.
 *
 * Two things move together as you scroll: the silhouette morphs from the
 * previous gesture to the current one, and the CSS shape-outside the body text
 * wraps around is regenerated to match, so the paragraph reflows to the hand's
 * actual contour as it opens.
 *
 * Both are quantised to a fixed number of positions rather than run per-frame.
 * That is deliberate twice over: reflowing text on every frame would be
 * expensive, and Bharatanatyam strikes and holds rather than gliding.
 */
(function () {
  'use strict';

  var W = 120, H = 140;
  var PALM_CENTRE = [61, 100];
  var FINGER_W = 13, THUMB_W = 15, CREASE_W = 3.4;
  var QUANTISE = 12;              // positions per transition

  // name -> [base x, base y, resting angle, length, fan offset]
  var DIGITS = {
    index: [44, 76, -10, 42, -17],
    middle: [58, 74, -3, 47, -6],
    ring: [72, 75, 7, 43, 8],
    little: [83, 80, 19, 33, 20]
  };
  var THUMB = [36, 104, -25, 45, 0];
  var FINGERS = ['little', 'ring', 'middle', 'index'];
  var ALL = ['thumb', 'index', 'middle', 'ring', 'little'];
  var ADJACENT = [['index', 'middle'], ['middle', 'ring'], ['ring', 'little']];

  var PALM = 'M 33 86 Q 33 72 47 71 L 76 71 Q 88 72 88 85 L 89 107 '
           + 'Q 90 123 74 128 Q 55 132 42 124 Q 33 117 33 104 Z';

  function vec(deg) {
    var r = deg * Math.PI / 180;
    return [Math.sin(r), -Math.cos(r)];
  }
  function unit(p, q) {
    var dx = q[0] - p[0], dy = q[1] - p[1];
    var d = Math.hypot(dx, dy) || 1;
    return [dx / d, dy / d];
  }
  function n(v) { return Math.round(v * 10) / 10; }

  function blend(a, b, t) {
    t = Math.max(0, Math.min(1, t));
    var out = {};
    ALL.forEach(function (k) {
      out[k] = a[k].map(function (v, i) { return v + (b[k][i] - v) * t; });
    });
    out._conv = [a._conv[0] + (b._conv[0] - a._conv[0]) * t,
                 a._conv[1] + (b._conv[1] - a._conv[1]) * t];
    return out;
  }

  /** Tip position for one digit — shared by the path and the outline. */
  function tipOf(name, pose) {
    var g = name === 'thumb' ? THUMB : DIGITS[name];
    var p = pose[name];
    var ext = p[0], curl = p[1], abd = p[2], conv = p[3];
    var d = vec(g[2] + abd);
    var knuckle = [g[0], g[1]];
    var reach = g[3] * ext;
    var free = [knuckle[0] + d[0] * reach, knuckle[1] + d[1] * reach];
    var inw = unit(knuckle, PALM_CENTRE);
    var curled = [free[0] + inw[0] * curl * 20, free[1] + inw[1] * curl * 20];
    var cp = pose._conv;
    return {
      knuckle: knuckle, d: d, reach: reach,
      tip: [curled[0] + (cp[0] - curled[0]) * conv,
            curled[1] + (cp[1] - curled[1]) * conv]
    };
  }

  function digitPath(name, pose) {
    var s = tipOf(name, pose);
    var base = [s.knuckle[0] - s.d[0] * 10, s.knuckle[1] - s.d[1] * 10];
    var ctrl = [s.knuckle[0] + s.d[0] * s.reach * 0.8,
                s.knuckle[1] + s.d[1] * s.reach * 0.8];
    return 'M ' + n(base[0]) + ' ' + n(base[1])
         + ' Q ' + n(ctrl[0]) + ' ' + n(ctrl[1])
         + ' ' + n(s.tip[0]) + ' ' + n(s.tip[1]);
  }

  function creases(pose) {
    var out = [];
    ADJACENT.forEach(function (pair) {
      var a = pair[0], b = pair[1];
      var strength = Math.min(pose[a][0], pose[b][0]);
      if (strength < 0.4) return;
      var ga = DIGITS[a], gb = DIGITS[b];
      var mid = [(ga[0] + gb[0]) / 2, (ga[1] + gb[1]) / 2];
      var d = vec(((ga[2] + pose[a][2]) + (gb[2] + pose[b][2])) / 2);
      var reach = Math.max(pose[a][3], pose[b][3]) > 0.5 ? 0.42 : 0.66;
      var run = Math.min(ga[3], gb[3]) * reach * strength;
      out.push('M ' + n(mid[0] - d[0] * 6) + ' ' + n(mid[1] - d[1] * 6)
             + ' L ' + n(mid[0] + d[0] * run) + ' ' + n(mid[1] + d[1] * run));
    });
    FINGERS.forEach(function (name) {
      var strength = (0.45 - pose[name][0]) / 0.45;
      if (strength <= 0.05) return;
      var g = DIGITS[name];
      var k = [g[0], g[1]];
      var d = vec(g[2] + pose[name][2]);
      var inw = unit(k, PALM_CENTRE);
      var start = [k[0] + inw[0] * 7, k[1] + inw[1] * 7];
      var run = 11 * Math.min(1, strength);
      out.push('M ' + n(start[0]) + ' ' + n(start[1])
             + ' Q ' + n(start[0] + d[0] * 5) + ' ' + n(start[1] + d[1] * 5)
             + ' ' + n(start[0] + inw[0] * run) + ' ' + n(start[1] + inw[1] * run));
    });
    return out;
  }

  function markup(pose, uid) {
    var strokes = '<path d="' + digitPath('thumb', pose) + '" stroke-width="' + THUMB_W + '"/>';
    FINGERS.forEach(function (name) {
      strokes += '<path d="' + digitPath(name, pose) + '" stroke-width="' + FINGER_W + '"/>';
    });
    var cr = creases(pose);
    var mask = '', ref = '';
    if (cr.length) {
      mask = '<mask id="' + uid + '" maskUnits="userSpaceOnUse" x="0" y="0" width="'
           + W + '" height="' + H + '"><rect width="' + W + '" height="' + H
           + '" fill="#fff"/><g stroke="#000" stroke-width="' + CREASE_W
           + '" fill="none" stroke-linecap="round">'
           + cr.map(function (d) { return '<path d="' + d + '"/>'; }).join('')
           + '</g></mask>';
      ref = ' mask="url(#' + uid + ')"';
    }
    return mask + '<g' + ref + ' fill="currentColor" stroke="currentColor"'
         + ' stroke-linecap="round" stroke-linejoin="round">'
         + '<path d="' + PALM + '" stroke="none"/>' + strokes + '</g>';
  }

  /** CSS polygon() hull of the silhouette, for shape-outside. */
  function outline(pose) {
    var pts = [[33, 86], [33, 104], [42, 124], [74, 128], [89, 107], [88, 85]];
    ['index', 'middle', 'ring', 'little', 'thumb'].forEach(function (name) {
      var s = tipOf(name, pose);
      var half = (name === 'thumb' ? THUMB_W : FINGER_W) / 2;
      pts.push([s.tip[0] - half, s.tip[1]]);
      pts.push([s.tip[0] + half, s.tip[1]]);
    });
    var cx = 0, cy = 0;
    pts.forEach(function (p) { cx += p[0]; cy += p[1]; });
    cx /= pts.length; cy /= pts.length;
    pts.sort(function (a, b) {
      return Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx);
    });
    return 'polygon(' + pts.map(function (p) {
      return (p[0] / W * 100).toFixed(1) + '% ' + (p[1] / H * 100).toFixed(1) + '%';
    }).join(', ') + ')';
  }

  /* ---------------------------------------------------------- controller --- */

  var store = document.getElementById('mudra-poses');
  if (!store) return;
  var POSES;
  try { POSES = JSON.parse(store.textContent); } catch (e) { return; }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var steps = [].slice.call(document.querySelectorAll('[data-mudra]'));
  if (!steps.length) return;

  steps.forEach(function (el, i) {
    var key = el.getAttribute('data-mudra');
    var from = el.getAttribute('data-mudra-from') || key;
    if (!POSES[key] || !POSES[from]) return;
    el.__from = POSES[from];
    el.__to = POSES[key];
    el.__svg = el.querySelector('[data-mudra-svg]');
    el.__shape = el.querySelector('[data-mudra-shape]');
    el.__uid = 'mk' + i;
    el.__q = -1;
  });

  function paint(el, q) {
    if (el.__q === q || !el.__svg) return;
    el.__q = q;
    var pose = blend(el.__from, el.__to, q / QUANTISE);
    el.__svg.innerHTML = markup(pose, el.__uid);
    if (el.__shape) el.__shape.style.shapeOutside = outline(pose);
  }

  function frame() {
    var vh = window.innerHeight;
    steps.forEach(function (el) {
      if (!el.__svg) return;
      if (reduced) { paint(el, QUANTISE); return; }
      var r = el.getBoundingClientRect();
      // the gesture completes over the first part of the step's travel,
      // then holds — strike and hold, not a continuous glide
      var raw = (vh * 0.85 - r.top) / Math.max(1, r.height * 0.55);
      var t = Math.max(0, Math.min(1, raw));
      paint(el, Math.round(t * QUANTISE));
    });
  }

  var queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(function () { queued = false; frame(); });
  }

  frame();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
})();
