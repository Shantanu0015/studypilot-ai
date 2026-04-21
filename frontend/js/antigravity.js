/**
 * =========================================
 *   ANTIGRAVITY ENGINE — Animation System
 * =========================================
 *   Magnetic cursor · Particle trails · Orbs
 *   Scroll-reveal · Tilt cards · Ripples
 * =========================================
 */

(function () {
  'use strict';

  /* ─── CUSTOM CURSOR ─── */
  const cursor = document.createElement('div');
  cursor.id = 'ag-cursor';
  cursor.innerHTML = `<div id="ag-cursor-dot"></div><div id="ag-cursor-ring"></div>`;
  document.body.appendChild(cursor);

  const dot  = document.getElementById('ag-cursor-dot');
  const ring = document.getElementById('ag-cursor-ring');

  let mx = window.innerWidth / 2,  my = window.innerHeight / 2;
  let rx = mx, ry = my;
  let isPointer = false, isClicking = false;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
    spawnParticle(mx, my);
  });

  document.addEventListener('mousedown', () => { isClicking = true; ring.classList.add('clicking'); });
  document.addEventListener('mouseup',   () => { isClicking = false; ring.classList.remove('clicking'); });

  document.addEventListener('mouseover', e => {
    const el = e.target.closest('button,a,[data-tilt],.glass-card,.nav-link,.btn-primary,.feature-card');
    if (el) { isPointer = true; ring.classList.add('hovering'); }
  });
  document.addEventListener('mouseout', e => {
    const el = e.target.closest('button,a,[data-tilt],.glass-card,.nav-link,.btn-primary,.feature-card');
    if (el) { isPointer = false; ring.classList.remove('hovering'); }
  });

  /* Smooth ring follow with lerp */
  function lerpCursor() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(lerpCursor);
  }
  lerpCursor();

  /* ─── PARTICLE TRAILS ─── */
  const PARTICLE_POOL_SIZE = 40;
  const particles = [];

  function spawnParticle(x, y) {
    if (Math.random() > 0.4) return;   // throttle
    const p = document.createElement('div');
    p.className = 'ag-particle';
    const size  = Math.random() * 5 + 2;
    const hue   = Math.random() > 0.5 ? '258' : '214';  // violet or blue
    const tx    = (Math.random() - 0.5) * 80;
    const ty    = (Math.random() - 0.5) * 80;
    const dur   = 600 + Math.random() * 600;
    p.style.cssText = `
      left:${x}px; top:${y}px;
      width:${size}px; height:${size}px;
      background: hsl(${hue},90%,70%);
      --tx:${tx}px; --ty:${ty}px;
      animation: ag-particle-fly ${dur}ms ease-out forwards;
    `;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), dur);
  }

  /* ─── FLOATING ORBS BACKGROUND ─── */
  const orbCanvas = document.createElement('canvas');
  orbCanvas.id = 'ag-orb-canvas';
  document.body.prepend(orbCanvas);

  const ctx = orbCanvas.getContext('2d');
  let W, H;

  function resizeCanvas() {
    W = orbCanvas.width  = window.innerWidth;
    H = orbCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  const ORBS = Array.from({ length: 6 }, (_, i) => ({
    x:    Math.random() * W,
    y:    Math.random() * H,
    r:    180 + Math.random() * 200,
    vx:   (Math.random() - 0.5) * 0.3,
    vy:   (Math.random() - 0.5) * 0.3,
    hue:  [258, 214, 285, 190][i % 4],
    alpha: 0.06 + Math.random() * 0.08,
  }));

  function drawOrbs() {
    ctx.clearRect(0, 0, W, H);
    ORBS.forEach(o => {
      o.x += o.vx + (mx - W / 2) * 0.00015;
      o.y += o.vy + (my - H / 2) * 0.00015;
      if (o.x < -o.r) o.x = W + o.r;
      if (o.x > W + o.r) o.x = -o.r;
      if (o.y < -o.r) o.y = H + o.r;
      if (o.y > H + o.r) o.y = -o.r;

      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      g.addColorStop(0, `hsla(${o.hue},80%,60%,${o.alpha})`);
      g.addColorStop(1, `hsla(${o.hue},80%,60%,0)`);
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    });
    requestAnimationFrame(drawOrbs);
  }
  drawOrbs();

  /* ─── SCROLL REVEAL ─── */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('ag-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  function scanReveal() {
    document.querySelectorAll('.glass-card,.stat-value,.feature-card,.glass-card-header').forEach(el => {
      if (!el.classList.contains('ag-reveal')) {
        el.classList.add('ag-reveal');
        io.observe(el);
      }
    });
  }

  /* ─── MAGNETIC TILT ON CARDS ─── */
  function addTilt() {
    document.querySelectorAll('.glass-card:not([data-tilt-added])').forEach(card => {
      card.dataset.tiltAdded = '1';
      card.addEventListener('mousemove', e => {
        const rect  = card.getBoundingClientRect();
        const cx    = rect.left + rect.width  / 2;
        const cy    = rect.top  + rect.height / 2;
        const dx    = (e.clientX - cx) / (rect.width  / 2);
        const dy    = (e.clientY - cy) / (rect.height / 2);
        card.style.transform = `perspective(800px) rotateY(${dx * 6}deg) rotateX(${-dy * 6}deg) translateY(-4px) scale(1.01)`;
        card.style.transition = 'transform 0.08s linear';

        // inner glow follows mouse
        const gx = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
        const gy = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
        card.style.setProperty('--gx', gx + '%');
        card.style.setProperty('--gy', gy + '%');
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
      });
    });
  }

  /* ─── RIPPLE ON BUTTONS ─── */
  function addRipple() {
    document.querySelectorAll('.btn-primary:not([data-ripple])').forEach(btn => {
      btn.dataset.ripple = '1';
      btn.addEventListener('click', e => {
        const rect = btn.getBoundingClientRect();
        const rip  = document.createElement('span');
        rip.className = 'ag-ripple';
        const d = Math.max(rect.width, rect.height) * 2;
        rip.style.cssText = `
          width:${d}px; height:${d}px;
          left:${e.clientX - rect.left - d/2}px;
          top:${e.clientY  - rect.top  - d/2}px;
        `;
        btn.appendChild(rip);
        setTimeout(() => rip.remove(), 700);
      });
    });
  }

  /* ─── COUNTER ANIMATION ─── */
  function animateCounter(el) {
    const target = parseFloat(el.textContent) || 0;
    if (target === 0) return;
    let start = 0;
    const step = target / 40;
    const int  = setInterval(() => {
      start = Math.min(start + step, target);
      el.textContent = Number.isInteger(target) ? Math.round(start) : start.toFixed(1);
      if (start >= target) clearInterval(int);
    }, 20);
  }

  /* ─── STAR FIELD ─── */
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    const s = document.createElement('div');
    s.className = 'ag-star';
    s.style.cssText = `
      left: ${Math.random() * 100}vw;
      top:  ${Math.random() * 100}vh;
      width: ${Math.random() * 2 + 1}px;
      height: ${Math.random() * 2 + 1}px;
      animation-delay: ${Math.random() * 4}s;
      animation-duration: ${2 + Math.random() * 4}s;
    `;
    document.body.appendChild(s);
  }

  /* ─── INIT & LOOP ─── */
  function init() {
    addTilt();
    addRipple();
    scanReveal();

    // Animate stat counters when they appear
    document.querySelectorAll('.stat-value, [id^="stat-"]').forEach(el => {
      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { animateCounter(el); obs.disconnect(); }
      }, { threshold: 0.5 });
      obs.observe(el);
    });
  }

  /* Re-scan on page transitions */
  const _observer = new MutationObserver(() => {
    addTilt();
    addRipple();
    scanReveal();
  });
  
  document.addEventListener('DOMContentLoaded', () => {
    init();
    _observer.observe(document.body, { childList: true, subtree: true });
  });

  // also fire immediately if DOM already loaded
  if (document.readyState !== 'loading') init();

})();
