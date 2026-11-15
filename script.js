(() => {
  'use strict';

  /* ===== Cấu hình nhanh =====
     Có thể gắn tên vào link: ?to=Lan  -> "Gửi Lan", "Chào Lan," */
  const params = new URLSearchParams(location.search);
  const NAME = (params.get('to') || 'Hà Ly').trim().slice(0, 30);

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;
  const rand = (a, b) => Math.random() * (b - a) + a;
  const PALETTE = ['#f6e3b8', '#e9c98b', '#f2a7b8', '#ffffff', '#c9a8ff', '#ffd1a1'];

  if (NAME) {
    $('#to').textContent = 'Gửi em ' + NAME;
    $('#salute').textContent = 'Gửi em ' + NAME + ',';
  }

  /* ===== Tiêu đề hero: tách từng chữ ===== */
  (() => {
    const t = $('#heroTitle');
    const text = t.textContent;
    t.textContent = '';
    let i = 0;
    text.split(' ').forEach(w => {
      const word = document.createElement('span');
      word.className = 'word';
      [...w].forEach(c => {
        const s = document.createElement('span');
        s.className = 'ch';
        s.style.setProperty('--i', i++);
        s.textContent = c;
        word.appendChild(s);
      });
      t.appendChild(word);
    });
  })();

  /* ===== Lá thư: tách từng từ ===== */
  let k = 0;
  $$('.words, .salute').forEach(p => {
    k = 0;
    const frag = document.createDocumentFragment();
    p.textContent.trim().split(/\s+/).forEach((w, idx, arr) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.style.setProperty('--k', Math.min(k++, 70));
      s.textContent = w;
      frag.appendChild(s);
      if (idx < arr.length - 1) frag.appendChild(document.createTextNode(' '));
    });
    p.textContent = '';
    p.appendChild(frag);
  });

  const heroEl = $('.hero');
  $$('.fly').forEach(f => f.setAttribute('data-e', f.textContent)); $$('.fly').forEach(f => f.textContent = '');

  /* ===== Bầu trời sao ===== */
  const sky = $('#sky'), sctx = sky.getContext('2d');
  let W = 0, H = 0, DPR = Math.min(devicePixelRatio || 1, 2);
  let stars = [], shooters = [];
  let mx = 0, my = 0, tx = 0, ty = 0;

  function resize() {
    W = innerWidth; H = innerHeight;
    [sky, fx].forEach(c => {
      c.width = W * DPR; c.height = H * DPR;
      c.getContext('2d').setTransform(DPR, 0, 0, DPR, 0, 0);
    });
    const n = Math.round((W * H) / 5200);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: rand(.3, 1.5), z: rand(.2, 1),
      p: rand(0, Math.PI * 2), sp: rand(.6, 2.2),
      c: Math.random() < .2 ? '#f2a7b8' : Math.random() < .4 ? '#e9c98b' : '#ffffff'
    }));
  }
  const fx = $('#fx'), fctx = fx.getContext('2d');
  resize();
  addEventListener('resize', resize);

  function drawSky(t) {
    sctx.clearRect(0, 0, W, H);
    mx += (tx - mx) * .05; my += (ty - my) * .05;
    heroEl.style.setProperty('--px', mx.toFixed(3)); heroEl.style.setProperty('--py', my.toFixed(3));
    for (const s of stars) {
      const a = .35 + .65 * (.5 + .5 * Math.sin(t * .001 * s.sp + s.p));
      sctx.globalAlpha = a * s.z;
      sctx.fillStyle = s.c;
      const x = (s.x + mx * 22 * s.z + W) % W;
      const y = (s.y + my * 22 * s.z + H) % H;
      sctx.beginPath(); sctx.arc(x, y, s.r, 0, 7); sctx.fill();
    }
    sctx.globalAlpha = 1;
    if (Math.random() < .006 && shooters.length < 2) {
      shooters.push({ x: rand(W * .2, W), y: rand(0, H * .4), vx: -rand(7, 11), vy: rand(3, 5), life: 1 });
    }
    shooters = shooters.filter(s => s.life > 0);
    for (const s of shooters) {
      const g = sctx.createLinearGradient(s.x, s.y, s.x - s.vx * 9, s.y - s.vy * 9);
      g.addColorStop(0, `rgba(255,244,214,${s.life})`); g.addColorStop(1, 'rgba(255,244,214,0)');
      sctx.strokeStyle = g; sctx.lineWidth = 1.6;
      sctx.beginPath(); sctx.moveTo(s.x, s.y); sctx.lineTo(s.x - s.vx * 9, s.y - s.vy * 9); sctx.stroke();
      s.x += s.vx; s.y += s.vy; s.life -= .014;
    }
  }

  /* ===== Hạt: lấp lánh, pháo hoa, confetti, cánh hoa ===== */
  let parts = [];
  const MAX_PARTS = 1400;

  function spark(x, y, n = 10, spread = 3, life = 1) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), v = rand(.4, spread);
      push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - .4, g: .03, d: .985,
        r: rand(1, 2.6), life, decay: rand(.012, .028), c: pick(PALETTE), kind: 'dot' });
    }
  }
  function push(p) { if (parts.length < MAX_PARTS) parts.push(p); }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }

  function burst(x, y, n = 90) {
    const hue = pick(['#f6e3b8', '#f2a7b8', '#c9a8ff', '#ffd1a1', '#9fe3ff']);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand(-.05, .05), v = rand(2, 6.5);
      push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: .05, d: .975,
        r: rand(1.2, 2.8), life: 1, decay: rand(.009, .016), c: Math.random() < .7 ? hue : '#fff', kind: 'trail' });
    }
  }

  function rocket(tx2, ty2) {
    const x = tx2 + rand(-40, 40);
    push({ x, y: H + 10, vx: 0, vy: -rand(11, 14), g: .16, d: 1, r: 2.2, life: 1, decay: 0, c: '#fff3d6', kind: 'rocket', ty: ty2 });
  }

  function confetti(x, y, n = 120) {
    for (let i = 0; i < n; i++) {
      const a = rand(-Math.PI, 0), v = rand(5, 14);
      push({ x, y, vx: Math.cos(a) * v * rand(.5, 1.2), vy: Math.sin(a) * v, g: .28, d: .985,
        w: rand(5, 10), h: rand(3, 6), rot: rand(0, 6), vr: rand(-.3, .3),
        life: 1, decay: rand(.004, .008), c: pick(PALETTE), kind: 'paper' });
    }
  }

  function petals() {
    if (reduced) return;
    const spawn = () => {
      if (document.hidden) return;
      push({ x: rand(0, W), y: -20, vx: rand(-.3, .5), vy: rand(.5, 1.2), g: 0, d: 1,
        w: rand(7, 13), h: rand(5, 9), rot: rand(0, 6), vr: rand(-.03, .03), sway: rand(0, 6),
        life: 1, decay: .0009, c: pick(['#f6c9d3', '#f2a7b8', '#fbe4ea', '#e9c98b']), kind: 'petal' });
    };
    setInterval(spawn, 650);
  }

  function drawFx() {
    fctx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (p.kind === 'rocket') {
        p.vy += p.g * .3; p.y += p.vy; p.x += p.vx;
        fctx.globalAlpha = 1; fctx.fillStyle = p.c;
        fctx.beginPath(); fctx.arc(p.x, p.y, p.r, 0, 7); fctx.fill();
        spark(p.x, p.y, 1, .6, .6);
        if (p.vy > -2 || p.y < p.ty) { burst(p.x, p.y, 100); parts.splice(i, 1); }
        continue;
      }
      p.vx *= p.d; p.vy = p.vy * p.d + p.g;
      p.x += p.vx + (p.kind === 'petal' ? Math.sin(p.sway += .03) * .7 : 0);
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0 || p.y > H + 30 || p.x < -40 || p.x > W + 40) { parts.splice(i, 1); continue; }
      fctx.globalAlpha = Math.max(0, Math.min(1, p.life * (p.kind === 'petal' ? 1.4 : 1.2)));
      fctx.fillStyle = p.c;
      if (p.kind === 'paper' || p.kind === 'petal') {
        p.rot += p.vr;
        fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.rot);
        if (p.kind === 'petal') {
          fctx.beginPath(); fctx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, 7); fctx.fill();
        } else {
          fctx.scale(1, Math.abs(Math.cos(p.rot * 2)) + .2);
          fctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        fctx.restore();
      } else {
        if (p.kind === 'trail') { fctx.shadowColor = p.c; fctx.shadowBlur = 8; }
        fctx.beginPath(); fctx.arc(p.x, p.y, p.r * (p.kind === 'trail' ? p.life + .3 : 1), 0, 7); fctx.fill();
        fctx.shadowBlur = 0;
      }
    }
    fctx.globalAlpha = 1;
  }

  /* ===== Vòng lặp chính ===== */
  function loop(t) {
    drawSky(t);
    drawFx();
    requestAnimationFrame(loop);
  }
  if (!reduced) requestAnimationFrame(loop); else drawSky(0);

  /* ===== Con trỏ: quầng sáng + vệt lấp lánh ===== */
  const glow = $('#glow');
  let gx = innerWidth / 2, gy = innerHeight / 2, cx = gx, cy = gy, lastSpark = 0;
  addEventListener('pointermove', e => {
    cx = e.clientX; cy = e.clientY;
    tx = (e.clientX / W - .5) * 2; ty = (e.clientY / H - .5) * 2;
    glow.style.opacity = 1;
    if (!reduced && e.pointerType === 'mouse' && performance.now() - lastSpark > 40) {
      lastSpark = performance.now(); spark(cx, cy, 2, 1.2, .8);
    }
  }, { passive: true });
  (function follow() {
    gx += (cx - gx) * .12; gy += (cy - gy) * .12;
    glow.style.transform = `translate(${gx}px,${gy}px)`;
    requestAnimationFrame(follow);
  })();
  addEventListener('pointerdown', e => {
    if (!document.body.classList.contains('opened') || reduced) return;
    spark(e.clientX, e.clientY, 14, 4, 1);
  });

  /* ===== Mở cổng ===== */
  $('#openBtn').addEventListener('click', e => {
    const gate = $('#gate');
    gate.classList.add('open');
    document.body.classList.remove('locked');
    document.body.classList.add('opened');
    scrollTo(0, 0);
    if (!reduced) {
      const r = e.currentTarget.getBoundingClientRect();
      confetti(r.left + r.width / 2, r.top + r.height / 2, 140);
      setTimeout(() => { rocket(W * .25, H * .3); }, 500);
      setTimeout(() => { rocket(W * .75, H * .25); }, 800);
    }
    setTimeout(() => gate.classList.add('gone'), 1800);
    startObservers();
    petals();
  });

  /* ===== Hiện dần khi cuộn ===== */
  function startObservers() {
    const io = new IntersectionObserver(es => {
      es.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        if (en.target.matches('.stats')) countUp();
        io.unobserve(en.target);
      });
    }, { threshold: .18, rootMargin: '0px 0px -6% 0px' });
    $$('.reveal, .words, .salute, .sign').forEach(el => io.observe(el));
    setTimeout(() => $$('.hero .reveal').forEach(el => el.classList.add('in')), 700);
  }

  function countUp() {
    $$('[data-count]').forEach(el => {
      const end = +el.dataset.count, suf = el.dataset.suffix || '';
      const t0 = performance.now(), dur = 1600;
      (function step(t) {
        const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(end * e) + suf;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  /* ===== Thanh tiến độ + parallax ===== */
  const bar = $('#progress'), blobs = $$('.blob');
  function onScroll() {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
    blobs.forEach((b, i) => b.style.translate = `0 ${scrollY * (.06 + i * .04)}px`);
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ===== Thẻ quà: nghiêng 3D + lật ===== */
  $$('.card').forEach(card => {
    const move = e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      card.style.setProperty('--ry', (px * 18) + 'deg');
      card.style.setProperty('--rx', (-py * 14) + 'deg');
    };
    card.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') card.classList.add('tilting'); });
    card.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') move(e); });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('tilting');
      card.style.setProperty('--ry', '0deg'); card.style.setProperty('--rx', '0deg');
    });
    const flip = () => {
      card.classList.toggle('flipped');
      card.setAttribute('aria-pressed', card.classList.contains('flipped'));
      const r = card.getBoundingClientRect();
      if (!reduced) spark(r.left + r.width / 2, r.top + r.height / 2, 26, 5, 1);
    };
    card.addEventListener('click', flip);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
  });

  /* ===== Lời chúc cuối ===== */
  const MSG = 'Đã gửi 1 lần "cần gì anh giúp". Hạn dùng vô thời hạn, không đổi trả.';
  let wishing = false;
  $('#wishBtn').addEventListener('click', () => {
    const box = $('#wishMsg');
    if (!reduced) {
      for (let i = 0; i < 6; i++) setTimeout(() => rocket(rand(W * .15, W * .85), rand(H * .12, H * .45)), i * 330);
      confetti(W / 2, H * .75, 160);
    }
    if (wishing) return;
    wishing = true;
    box.textContent = '';
    let i = 0;
    MSG.split(' ').forEach((w, wi, arr) => {
      const word = document.createElement('span');
      word.style.cssText = 'display:inline-block;opacity:1;transform:none;animation:none';
      [...w].forEach(c => {
        const s = document.createElement('span');
        s.textContent = c;
        s.style.animationDelay = (i++ * 0.035) + 's';
        word.appendChild(s);
      });
      i++;
      box.appendChild(word);
      if (wi < arr.length - 1) box.appendChild(document.createTextNode(' '));
    });
    setTimeout(() => { wishing = false; }, MSG.length * 35 + 600);
  });
})();

/* ===== Thẻ nhân vật: nghiêng + ánh holo ===== */
(() => {
  const c = document.getElementById('idcard');
  if (!c) return;
  c.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const r = c.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    c.classList.add('tilting');
    c.style.setProperty('--ry', ((px - .5) * 16) + 'deg');
    c.style.setProperty('--rx', (-(py - .5) * 12) + 'deg');
    c.style.setProperty('--mx', (px * 100) + '%');
    c.style.setProperty('--my', (py * 100) + '%');
  });
  c.addEventListener('pointerleave', () => {
    c.classList.remove('tilting');
    c.style.setProperty('--ry', '0deg'); c.style.setProperty('--rx', '0deg');
  });
})();

/* ===== Máy bay giấy bay theo cuộn + emoji khi chạm ===== */
(() => {
  const plane = document.getElementById('flyer');
  const hero = document.querySelector('.hero');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last = { x: 0, y: 0 };
  function place() {
    const h = document.documentElement.scrollHeight - innerHeight;
    const p = h > 0 ? scrollY / h : 0;
    const x = innerWidth / 2 + Math.sin(p * 14) * innerWidth * .4;
    const y = 70 + p * (innerHeight - 160);
    const ang = Math.atan2(y - last.y, x - last.x) * 180 / Math.PI;
    plane.style.transform = `translate(${x}px,${y}px) rotate(${(isFinite(ang) ? ang : 0) + 20}deg)`;
    last = { x, y };
  }
  if (!reduced) { addEventListener('scroll', place, { passive: true }); place(); }
  const EM = ['💊', '🎁', '✨', '🌸', '⭐', '🪄', '🧧'];
  addEventListener('pointerdown', e => {
    if (!document.body.classList.contains('opened') || reduced) return;
    const s = document.createElement('span');
    s.className = 'emo';
    s.textContent = EM[(Math.random() * EM.length) | 0];
    s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px';
    s.style.setProperty('--dx', ((Math.random() - .5) * 120) + 'px');
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1700);
  });
})();
