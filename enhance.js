/* Lớp hiệu ứng nâng cao: Three.js + GSAP + Lenis. Thiếu thư viện nào thì bỏ qua phần đó. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = innerWidth < 700;
  const $ = (s) => document.querySelector(s);
  let lenis = null;
  let scrollP = 0;

  /* ---------- Cuộn mượt (Lenis) + GSAP ScrollTrigger ---------- */
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: .09, wheelMultiplier: 1 });
    lenis.stop();
    $('#openBtn').addEventListener('click', () => setTimeout(() => lenis.start(), 900));
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: 0, duration: 1.6 }); }
    }));
  }

  if (!reduced && window.gsap && window.ScrollTrigger) {
    /* Hero trôi lên và mờ dần khi cuộn */
    gsap.to('.hero-title, .hero-sub', {
      yPercent: -40, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 20%', scrub: true }
    });
    gsap.to('.cube-wrap', {
      scale: 1.9, yPercent: 60, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 30%', scrub: true }
    });
    /* Băng chữ nghiêng theo tốc độ cuộn */
    ScrollTrigger.create({
      onUpdate: self => {
        const v = gsap.utils.clamp(-10, 10, self.getVelocity() / -260);
        gsap.to('.marquee', { skewX: v, duration: .4, overwrite: 'auto' });
      }
    });
    /* Tiêu đề từng phần phóng nhẹ khi vào khung hình */
    gsap.utils.toArray('.section-head h3, .finale h3').forEach(h => {
      gsap.fromTo(h, { letterSpacing: '.12em' }, {
        letterSpacing: '0em', ease: 'none',
        scrollTrigger: { trigger: h, start: 'top 95%', end: 'top 55%', scrub: true }
      });
    });
    /* Thẻ nhân vật: đường viền sáng chạy theo cuộn */
    gsap.fromTo('.idcard .avatar', { rotate: -90 }, {
      rotate: 0, ease: 'none',
      scrollTrigger: { trigger: '.idcard', start: 'top 90%', end: 'bottom 30%', scrub: true }
    });
  }

  /* ---------- Thiên hà + khối 3D thật (Three.js) ---------- */
  const canvas = $('#gl');
  if (!canvas || reduced || !window.THREE) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !small });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, .1, 100);
  camera.position.z = 15;

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  /* sprite tròn mềm cho các hạt */
  const tex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  /* thiên hà xoắn ốc */
  const N = small ? 1800 : 4200, arms = 3;
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const cIn = new THREE.Color('#f6e3b8'), cMid = new THREE.Color('#f2a7b8'), cOut = new THREE.Color('#7c5cff');
  for (let i = 0; i < N; i++) {
    const r = Math.pow(Math.random(), 1.6) * 13;
    const a = (i % arms) / arms * Math.PI * 2 + r * .55;
    const spread = (Math.random() - .5) * (.4 + r * .14);
    pos[i * 3] = Math.cos(a) * r + spread;
    pos[i * 3 + 1] = (Math.random() - .5) * (.6 + r * .08);
    pos[i * 3 + 2] = Math.sin(a) * r + spread;
    const c = r < 4 ? cIn.clone().lerp(cMid, r / 4) : cMid.clone().lerp(cOut, Math.min(1, (r - 4) / 9));
    col.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const galaxy = new THREE.Points(geo, new THREE.PointsMaterial({
    size: small ? .22 : .2, map: tex, vertexColors: true, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, opacity: .9
  }));
  galaxy.rotation.x = .9;
  scene.add(galaxy);

  /* ba khối wireframe bay lơ lửng */
  const shapes = [
    [new THREE.IcosahedronGeometry(1.5, 0), 0xe9c98b, [-8, 4, -2]],
    [new THREE.TorusKnotGeometry(1, .3, 90, 10), 0xf2a7b8, [8.5, -3, -3]],
    [new THREE.OctahedronGeometry(1.2, 0), 0x9fe3ff, [6, 5.5, -6]]
  ].map(([g, c, p]) => {
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: c, wireframe: true, transparent: true, opacity: .55 }));
    m.position.set(...p); m.userData.base = m.position.clone(); scene.add(m); return m;
  });

  const mouse = { x: 0, y: 0 };
  addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; }, { passive: true });
  addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    scrollP = h > 0 ? scrollY / h : 0;
  }, { passive: true });
  /* click: thiên hà xoay vọt một cái */
  let boost = 0;
  addEventListener('pointerdown', () => { boost = 1; });

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (document.hidden) return;
    const t = clock.getElapsedTime();
    boost *= .94;
    galaxy.rotation.y = t * .06 + scrollP * 3 + boost * .8;
    galaxy.rotation.x = .9 - scrollP * .5;
    galaxy.position.y = scrollP * 6 - 1;
    camera.position.x += (mouse.x * 3 - camera.position.x) * .03;
    camera.position.y += (-mouse.y * 2 - camera.position.y) * .03;
    camera.lookAt(0, 0, 0);
    shapes.forEach((m, i) => {
      m.rotation.x = t * (.25 + i * .08); m.rotation.y = t * (.3 - i * .06);
      m.position.y = m.userData.base.y + Math.sin(t * .7 + i * 2) * .7 + scrollP * (i % 2 ? -5 : 5);
    });
    renderer.render(scene, camera);
  }
  frame();
})();
