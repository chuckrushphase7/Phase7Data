let _snowAnim = null;

function stopSceneSnow() {
  if (_snowAnim) cancelAnimationFrame(_snowAnim);
  _snowAnim = null;
}

function startSceneSnow(canvas) {
  stopSceneSnow();
  const ctx = canvas.getContext("2d");
  const flakes = [];
  const FLAKE_COUNT = 120;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeFlake(w, h) {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1 + Math.random() * 3,
      vy: 0.6 + Math.random() * 1.8,
      vx: -0.4 + Math.random() * 0.8,
      a: 0.4 + Math.random() * 0.6
    };
  }

  function init() {
    resize();
    const rect = canvas.getBoundingClientRect();
    flakes.length = 0;
    for (let i = 0; i < FLAKE_COUNT; i++) flakes.push(makeFlake(rect.width, rect.height));
  }

  function tick() {
    const rect = canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;

    ctx.clearRect(0, 0, w, h);

    for (const f of flakes) {
      f.x += f.vx;
      f.y += f.vy;

      if (f.y > h + 10) { f.y = -10; f.x = Math.random() * w; }
      if (f.x < -10) f.x = w + 10;
      if (f.x > w + 10) f.x = -10;

      ctx.globalAlpha = f.a;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    _snowAnim = requestAnimationFrame(tick);
  }

  init();
  window.addEventListener("resize", init, { passive: true });
  _snowAnim = requestAnimationFrame(tick);
}
