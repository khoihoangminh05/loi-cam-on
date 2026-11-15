(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (a, b) => Math.random() * (b - a) + a;
  const pick = a => a[(Math.random() * a.length) | 0];
  const COLORS = ['#ff6b8b', '#ffb938', '#2fd1a8', '#4aa8ff', '#8b6cff', '#ff8fab', '#ffd86e'];

  /* Tên người nhận: mặc định Hà Ly, đổi bằng ?to=Tên */
  const NAME = (new URLSearchParams(location.search).get('to') || 'Hà Ly').trim().slice(0, 30);
  $('#name').textContent = NAME;

  /* Tiêu đề: từng chữ nhún nhảy */
  (() => {
    const t = $('#title'), text = t.textContent;
    t.textContent = '';
    let i = 0;
    text.split(' ').forEach(w => {
      const word = document.createElement('span');
      word.className = 'w';
      [...w].forEach(ch => {
        const s = document.createElement('span');
        s.className = 'c'; s.style.setProperty('--i', i++); s.textContent = ch;
        word.appendChild(s);
      });
      i++;
      t.appendChild(word);
    });
  })();

  /* ---------- Canvas: pháo giấy + lấp lánh ---------- */
  const cv = $('#fx'), ctx = cv.getContext('2d');
  let W = 0, H = 0, parts = [];
  const DPR = Math.min(devicePixelRatio || 1, 2);
  function resize() {
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize(); addEventListener('resize', resize);

  function confetti(x, y, n = 90, power = 1) {
    if (reduced) return;
    for (let i = 0; i < n && parts.length < 900; i++) {
      const a = rand(-Math.PI, 0) + rand(-.4, .4), v = rand(5, 15) * power;
      parts.push({ k: Math.random() < .25 ? 'dot' : 'rect', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        w: rand(6, 11), h: rand(4, 7), r: rand(0, 6), vr: rand(-.3, .3), life: 1, dec: rand(.004, .009), c: pick(COLORS) });
    }
  }
  function sparkle(x, y) {
    if (reduced) return;
    for (let i = 0; i < 2; i++) {
      parts.push({ k: 'star', x, y, vx: rand(-1, 1), vy: rand(-1.4, .4), s: rand(5, 11), r: rand(0, 3), vr: rand(-.1, .1), life: 1, dec: .03, c: pick(COLORS) });
    }
  }
  function star(s) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 ? s * .35 : s, a = i * Math.PI / 4;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
  }
  function loop() {
    ctx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx; p.y += p.vy; p.life -= p.dec;
      if (p.k === 'star') { p.vy += .02; } else { p.vy += .32; p.vx *= .985; }
      if (p.life <= 0 || p.y > H + 30) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = Math.min(1, p.life * 1.6);
      ctx.fillStyle = p.c;
      ctx.save(); ctx.translate(p.x, p.y);
      if (p.k === 'star') { ctx.rotate(p.r += p.vr); star(p.s * p.life + 2); }
      else if (p.k === 'dot') { ctx.beginPath(); ctx.arc(0, 0, p.w / 2.2, 0, 7); ctx.fill(); }
      else { ctx.rotate(p.r += p.vr); ctx.scale(1, Math.abs(Math.cos(p.r * 1.7)) + .15); ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ---------- Bóng bay (bấm để làm nổ) ---------- */
  const bal = $('#balloons');
  function balloon(fromBottom = true) {
    if (reduced || document.hidden || bal.children.length > 22) return;
    const b = document.createElement('div');
    const w = rand(40, 66);
    b.className = 'balloon';
    b.style.setProperty('--c', pick(COLORS));
    b.style.setProperty('--w', w + 'px');
    b.style.setProperty('--x', rand(2, 94) + 'vw');
    b.style.setProperty('--d', rand(9, 16) + 's');
    b.style.setProperty('--dx', rand(-60, 60) + 'px');
    b.addEventListener('pointerdown', e => {
      e.stopPropagation();
      const r = b.getBoundingClientRect();
      confetti(r.left + r.width / 2, r.top + r.height / 2, 40, .7);
      b.remove();
    });
    b.addEventListener('animationend', () => b.remove());
    bal.appendChild(b);
  }
  setInterval(balloon, 1300);
  for (let i = 0; i < 4; i++) setTimeout(balloon, i * 300);
  const balloonBurst = n => { for (let i = 0; i < n; i++) setTimeout(balloon, i * 90); };

  /* ---------- Mở hộp quà ---------- */
  const gift = $('#gift'), stage = $('#stage');
  let opened = false;
  gift.addEventListener('click', e => {
    if (opened) return; opened = true;
    gift.classList.add('open');
    const r = $('.gift', gift).getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + 30, 170, 1.15);
    setTimeout(() => confetti(W * .2, H * .8, 80, 1.1), 250);
    setTimeout(() => confetti(W * .8, H * .8, 80, 1.1), 400);
    balloonBurst(10);
    setTimeout(() => { gift.classList.add('gone'); stage.classList.add('show'); }, 650);
    setTimeout(() => confetti(W / 2, H * .45, 100, 1), 1100);
  });

  /* ---------- Lời chúc ---------- */
  const WISHES = [
    'Chúc em luôn khỏe mạnh! 💪',
    'Chúc em học thật giỏi! 📚',
    'Chúc em mỗi ngày đều vui! 😄',
    'Chúc em mọi việc thuận lợi! 🍀',
    'Chúc em một mùa đông thật ấm! ☕'
  ];
  let wi = 0;
  const wish = $('#wish');
  $('#boom').addEventListener('click', e => {
    wish.textContent = WISHES[wi++ % WISHES.length];
    wish.classList.remove('pop'); void wish.offsetWidth; wish.classList.add('pop');
    const r = e.currentTarget.getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top, 120, 1.1);
    balloonBurst(6);
  });

  /* ---------- Thẻ nghiêng 3D + ánh sáng ---------- */
  const tilt = $('#tilt'), card = $('#card');
  addEventListener('pointermove', e => {
    if (e.pointerType === 'mouse') {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      const nx = (e.clientX / W - .5), ny = (e.clientY / H - .5);
      tilt.classList.add('live');
      tilt.style.setProperty('--ry', (nx * 22) + 'deg');
      tilt.style.setProperty('--rx', (-ny * 18) + 'deg');
      card.style.setProperty('--mx', (px * 100) + '%');
      card.style.setProperty('--my', (py * 100) + '%');
      sparkle(e.clientX, e.clientY);
    }
  }, { passive: true });
  addEventListener('pointerleave', () => {
    tilt.classList.remove('live');
    tilt.style.setProperty('--ry', '0deg'); tilt.style.setProperty('--rx', '0deg');
  });
  /* chạm đâu cũng có pháo giấy nhỏ */
  addEventListener('pointerdown', e => { if (opened) { confetti(e.clientX, e.clientY, 22, .6); } });
})();
