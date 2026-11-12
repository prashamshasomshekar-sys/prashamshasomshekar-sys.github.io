(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const small = innerWidth < 760 || !fine;
  document.documentElement.classList.add('js');
  const progress = () => { const m = document.documentElement.scrollHeight - innerHeight; return m > 0 ? Math.min(1, Math.max(0, scrollY / m)) : 0; };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mixI = (a, b, t) => {
    const ch = s => { const x = (a >> s) & 255, y = (b >> s) & 255; return Math.round(x + (y - x) * t); };
    return (ch(16) << 16) | (ch(8) << 8) | ch(0);
  };
  const css = c => '#' + c.toString(16).padStart(6, '0');
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return [c, c.getContext('2d')]; };
  const PET = ['#ffd6de', '#f8b3c2', '#ef93a8', '#ffe8ec', '#e25a6e'];
  const SAKURA = ['#fff0f3', '#ffd6de', '#f8b3c2', '#ef93a8', '#d9667f', '#b8475f'];
  const REDBLOOM = ['#ffd0cf', '#f59a9b', '#e2606e', '#c93a4c', '#B51A2B', '#8a1526'];

  /* ======================= Canvas + layers ======================= */
  const bg = document.getElementById('world'), g = bg.getContext('2d');
  const fx = document.getElementById('fx'), f = fx.getContext('2d');
  const [land, l] = mk(1, 1);
  let W = 1, H = 1, DPR = 1, M = 70, u = 1, layers = [], cityLights = [], pagodaLight = null, vign = null;

  // A layer covers a horizontal strip of the full (W+2M)x(H+2M) layer space
  function layer(d, y0f, y1f, hi, paint) {
    const top = M + y0f * H, bot = M + y1f * H, ld = hi ? Math.min(DPR, 1.25) : 1;
    const [c, x] = mk((W + 2 * M) * ld, (bot - top) * ld);
    x.setTransform(ld, 0, 0, ld, 0, -top * ld);
    paint(x);
    return { c, d, top, h: bot - top, w: W + 2 * M };
  }
  const X = fx_ => M + fx_ * W, Y = fy => M + fy * H;

  function clump(x, cx, cy, r, pal, n, R) {
    for (let i = 0; i < n; i++) {
      const a = R() * 6.283, rr = Math.sqrt(R()) * r, px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * .8;
      const shade = (py - cy) / r * .55 - (px - cx) / r * .25 + (R() - .5) * .7;
      const idx = Math.max(0, Math.min(pal.length - 1, Math.round((shade + .6) / 1.4 * (pal.length - 1))));
      x.fillStyle = pal[idx]; x.beginPath(); x.arc(px, py, (1.3 + R() * 2.3) * u, 0, 6.283); x.fill();
    }
    for (let i = 0; i < n * .12; i++) {
      const a = R() * 6.283, rr = Math.sqrt(R()) * r * .8;
      x.fillStyle = 'rgba(255,255,255,.75)'; x.beginPath(); x.arc(cx + Math.cos(a) * rr + r * .1, cy + Math.sin(a) * rr * .7 - r * .15, (.8 + R()) * u, 0, 6.283); x.fill();
    }
  }
  function limb(x, x0, y0, ang, len, w, depth, R, out, droop) {
    const x2 = x0 + Math.cos(ang) * len, y2 = y0 + Math.sin(ang) * len + len * droop;
    const cx = (x0 + x2) / 2 + Math.cos(ang + 1.57) * len * .15 * (R() - .5) * 2, cy = (y0 + y2) / 2 - len * .06;
    const N = 16; let lx = x0, ly = y0;
    x.lineCap = 'round';
    for (let i = 1; i <= N; i++) {
      const t = i / N, bx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x2, by = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y2;
      x.strokeStyle = '#3a2127'; x.lineWidth = Math.max(1, w * (1 - t * .65));
      x.beginPath(); x.moveTo(lx, ly); x.lineTo(bx, by); x.stroke();
      x.strokeStyle = 'rgba(255,190,160,.25)'; x.lineWidth = Math.max(.6, w * (1 - t * .65) * .25);
      x.beginPath(); x.moveTo(lx, ly - w * .2); x.lineTo(bx, by - w * .2); x.stroke();
      if (t > .3 && R() < .28) out.push([bx, by, depth]);
      lx = bx; ly = by;
    }
    out.push([x2, y2, depth]);
    if (depth > 0) {
      const nb = 2 + ((R() * 2) | 0);
      for (let k = 0; k < nb; k++) {
        const t = .3 + R() * .6, px = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x2, py = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y2;
        limb(x, px, py, ang + (R() < .5 ? -1 : 1) * (.35 + R() * .6), len * (.4 + R() * .25), w * .55, depth - 1, R, out, droop * 1.2);
      }
    }
  }
  function pagoda(x, cx, by, h, R) {
    const s = h / 600;
    x.save(); x.translate(cx, by); x.scale(s, s);
    x.fillStyle = '#3a2a2e'; x.fillRect(-110, -30, 220, 30);
    let yb = -30; const wins = [];
    for (let i = 0; i < 5; i++) {
      const bw = 150 - i * 20, bh = i === 0 ? 70 : 52;
      x.fillStyle = '#B51A2B'; x.fillRect(-bw / 2, yb - bh, bw, bh);
      x.fillStyle = '#7d1220'; x.fillRect(-bw / 2, yb - bh, bw * .18, bh);
      x.fillStyle = '#ffd7a0'; x.fillRect(-bw * .14, yb - bh * .75, bw * .28, bh * .45); wins.push(yb - bh * .5);
      const rw = bw * 1.75, ry = yb - bh;
      x.fillStyle = '#2a1f2a'; x.beginPath();
      x.moveTo(-rw / 2, ry - 8); x.quadraticCurveTo(-rw / 2 + 26, ry + 8, -rw * .3, ry + 8); x.lineTo(rw * .3, ry + 8);
      x.quadraticCurveTo(rw / 2 - 26, ry + 8, rw / 2, ry - 8); x.lineTo(bw * .36, ry - 28); x.lineTo(-bw * .36, ry - 28); x.closePath(); x.fill();
      x.strokeStyle = '#FFA586'; x.lineWidth = 3; x.beginPath(); x.moveTo(rw * .05, ry - 26); x.lineTo(rw * .3, ry + 6); x.lineTo(rw / 2, ry - 7); x.stroke();
      yb = ry - 28;
    }
    x.strokeStyle = '#d9a24a'; x.lineWidth = 6; x.beginPath(); x.moveTo(0, yb); x.lineTo(0, yb - 100); x.stroke();
    x.restore();
    return { x: cx, y: by - h * .45, r: h * 1.1 };
  }

  function buildLayers() {
    u = Math.max(.6, Math.min(W, H * 1.7) / 1000);
    const dens = small ? .55 : 1;
    cityLights = [];
    layers = [
      // streaky sunset clouds
      layer(.04, 0, .62, false, x => {
        const R = rng(3);
        const streak = (cx, cy, len, th) => {
          x.beginPath();
          for (let i = 0; i < 9; i++) { const px = cx - len / 2 + (i / 8) * len, rr = th * (.6 + R() * .8) * (1 - Math.abs(i / 8 - .5) * .9); x.moveTo(px + rr * 2.4, cy - rr * .3); x.ellipse(px, cy - rr * .3, rr * 2.4, rr, 0, 0, 6.283); }
          const gr = x.createLinearGradient(0, cy - th * 1.4, 0, cy + th); gr.addColorStop(0, '#ffcdb4'); gr.addColorStop(.6, '#f59a8f'); gr.addColorStop(1, '#d9707e');
          x.fillStyle = gr; x.fill();
        };
        for (let i = 0; i < 9; i++) streak(X(R() * .38 - .02), Y(.42 + R() * .14), W * (.12 + R() * .2), (6 + R() * 10) * u);
        for (let i = 0; i < 9; i++) streak(X(.62 + R() * .4), Y(.40 + R() * .16), W * (.12 + R() * .2), (6 + R() * 10) * u);
        for (let i = 0; i < 6; i++) streak(X(R()), Y(.1 + R() * .2), W * (.1 + R() * .15), (4 + R() * 7) * u);
      }),
      // Mt Fuji
      layer(.08, .33, .78, false, x => {
        const R = rng(8), fuji = new Path2D();
        fuji.moveTo(X(-.06), Y(.68)); fuji.quadraticCurveTo(X(.3), Y(.6), X(.475), Y(.405)); fuji.lineTo(X(.565), Y(.4));
        fuji.quadraticCurveTo(X(.74), Y(.6), X(1.08), Y(.67)); fuji.lineTo(X(1.08), Y(.78)); fuji.lineTo(X(-.06), Y(.78)); fuji.closePath();
        const body = x.createLinearGradient(0, Y(.4), 0, Y(.72)); body.addColorStop(0, '#a49cba'); body.addColorStop(1, '#6e6688');
        x.fillStyle = body; x.fill(fuji);
        x.save(); x.clip(fuji);
        const side = x.createLinearGradient(X(.3), 0, X(.75), 0); side.addColorStop(0, 'rgba(50,40,80,.28)'); side.addColorStop(.5, 'rgba(50,40,80,0)'); side.addColorStop(1, 'rgba(255,200,170,.12)');
        x.fillStyle = side; x.fillRect(0, Y(.35), W + 2 * M, H * .45);
        // snowcap with ridges running down
        x.beginPath(); x.moveTo(X(.3), Y(.4));
        for (let k = 0; k <= 34; k++) {
          const fx_ = .36 + k * .01, dist = Math.abs(fx_ - .52) / .16;
          const base = .445 + dist * .06 + (R() - .5) * .012, finger = k % 2 ? (R() * .055 * (1 - dist * .6)) : 0;
          x.lineTo(X(fx_), Y(base + finger));
        }
        x.lineTo(X(.74), Y(.4)); x.closePath();
        const snow = x.createLinearGradient(X(.42), 0, X(.66), 0); snow.addColorStop(0, '#cfc8e0'); snow.addColorStop(.5, '#f4eef6'); snow.addColorStop(1, '#fff6ef');
        x.fillStyle = snow; x.fill();
        for (let k = 0; k < 40; k++) {
          const sx = X(.48 + R() * .08), sy = Y(.41), dir = (sx - X(.52)) / W * 2.6, len = H * (.04 + R() * .1);
          x.strokeStyle = dir < 0 ? 'rgba(150,140,185,.45)' : 'rgba(255,255,255,.55)'; x.lineWidth = (1 + R() * 1.6) * u;
          x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + dir * len * .6, sy + len * .5, sx + dir * len * 1.3 + (R() - .5) * 10, sy + len); x.stroke();
        }
        const haze = x.createLinearGradient(0, Y(.55), 0, Y(.7)); haze.addColorStop(0, 'rgba(210,150,160,0)'); haze.addColorStop(1, 'rgba(210,150,160,.55)');
        x.fillStyle = haze; x.fillRect(0, Y(.55), W + 2 * M, H * .25);
        x.restore();
      }),
      // far ridges
      layer(.16, .56, .8, false, x => {
        const R = rng(11);
        const band = (y0, amp, c1, c2) => {
          x.beginPath(); x.moveTo(0, Y(.8));
          for (let px = 0; px <= W + 2 * M + 30; px += 30) x.lineTo(px, Y(y0) + Math.sin(px * .006 + y0 * 40) * amp * H + Math.sin(px * .021) * amp * .4 * H + (R() - .5) * 3);
          x.lineTo(W + 2 * M, Y(.8)); x.closePath();
          const gr = x.createLinearGradient(0, Y(y0 - amp), 0, Y(.8)); gr.addColorStop(0, c1); gr.addColorStop(1, c2); x.fillStyle = gr; x.fill();
        };
        band(.64, .012, '#b98a9a', '#8d6680');
        band(.675, .014, '#8c5f78', '#5f3d58');
      }),
      // town in the valley
      layer(.26, .64, .84, false, x => {
        const R = rng(17);
        const gr = x.createLinearGradient(0, Y(.67), 0, Y(.84)); gr.addColorStop(0, '#a99cb2'); gr.addColorStop(1, '#6f6585');
        x.fillStyle = gr; x.beginPath(); x.moveTo(X(.12), Y(.84)); x.lineTo(X(.18), Y(.695)); x.quadraticCurveTo(X(.6), Y(.68), X(1.04), Y(.69)); x.lineTo(X(1.04), Y(.84)); x.closePath(); x.fill();
        const cols = ['#c8bccb', '#9a90aa', '#7d738f', '#b3a6bb', '#6a6080', '#d8c8cc'];
        for (let i = 0; i < 2600 * dens; i++) {
          const fy = .695 + Math.pow(R(), .8) * .14, fx_ = .17 + R() * .87;
          if (fy < .69 + (fx_ < .25 ? (.25 - fx_) * 1.2 : 0)) continue;
          const s = (.6 + (fy - .69) * 14) * u;
          x.fillStyle = cols[(R() * cols.length) | 0]; x.fillRect(X(fx_), Y(fy), s * (1 + R() * 2.5), s * (.8 + R() * 1.6));
        }
        for (let i = 0; i < 520 * dens; i++) { const fy = .7 + R() * .13, fx_ = .2 + R() * .84; cityLights.push([X(fx_), Y(fy), R() * 6.28, R() < .8 ? '#ffd28a' : '#ffa586']); }
        const hz = x.createLinearGradient(0, Y(.68), 0, Y(.74)); hz.addColorStop(0, 'rgba(220,170,175,.7)'); hz.addColorStop(1, 'rgba(220,170,175,0)');
        x.fillStyle = hz; x.fillRect(0, Y(.66), W + 2 * M, H * .09);
      }),
      // dark wine forest hills
      layer(.42, .7, 1.06, false, x => {
        const R = rng(23);
        x.beginPath(); x.moveTo(X(.25), Y(1.06));
        const ridge = fx_ => .79 - (fx_ - .25) * .05 + Math.sin(fx_ * 14) * .012;
        for (let fx_ = .25; fx_ <= 1.08; fx_ += .01) x.lineTo(X(fx_), Y(ridge(fx_)));
        x.lineTo(X(1.08), Y(1.06)); x.closePath();
        const gr = x.createLinearGradient(0, Y(.75), 0, Y(1)); gr.addColorStop(0, '#5e2a3d'); gr.addColorStop(1, '#2e1726'); x.fillStyle = gr; x.fill();
        for (let i = 0; i < 260 * dens; i++) {
          const fx_ = .26 + R() * .82, fy = ridge(fx_) + R() * .06, s = (5 + R() * 8) * u;
          if (R() < .55) { x.fillStyle = R() < .5 ? '#3c2230' : '#4a2c37'; x.beginPath(); x.moveTo(X(fx_), Y(fy) - s * 2.4); x.lineTo(X(fx_) + s, Y(fy)); x.lineTo(X(fx_) - s, Y(fy)); x.fill(); }
          else { x.fillStyle = ['#8e2134', '#a8303a', '#7a2a3a'][(R() * 3) | 0]; x.beginPath(); x.arc(X(fx_), Y(fy) - s, s * 1.1, 0, 6.283); x.fill(); }
        }
      }),
      // left hillside: autumn forest + crimson pagoda
      layer(.62, .45, 1.06, true, x => {
        const R = rng(31), rY = fx_ => .5 + .48 * Math.pow(Math.min(1, Math.max(0, (fx_ + .06) / .58)), 1.35);
        x.beginPath(); x.moveTo(X(-.07), Y(1.06));
        for (let fx_ = -.07; fx_ <= .53; fx_ += .01) x.lineTo(X(fx_), Y(rY(fx_)));
        x.lineTo(X(.53), Y(1.06)); x.closePath();
        x.fillStyle = '#2b2b22'; x.fill();
        const trees = [];
        for (let i = 0; i < 360 * dens; i++) { const fx_ = -.06 + R() * .58, fy = rY(fx_) + .005 + Math.pow(R(), 1.4) * .5; if (fy < 1.08) trees.push([fx_, fy, R()]); }
        trees.sort((a, b) => a[1] - b[1]);
        const pg = { fx: .29, fy: rY(.29) + .045 };
        let drawn = false;
        trees.forEach(t => {
          if (!drawn && t[1] > pg.fy) { const p = pagoda(x, X(pg.fx), Y(pg.fy), H * .15, R); pagodaLight = p; drawn = true; }
          const sz = (.018 + (t[1] - .5) * .07) * H, px = X(t[0]), py = Y(t[1]);
          if (t[2] < .5) {
            const greens = [['#2f4a35', '#4f6b45'], ['#3d5a3a', '#6b7d4a'], ['#56602f', '#8a8f45']][(R() * 3) | 0];
            for (let k = 0; k < 3; k++) {
              const ty = py - k * sz * .55, tw = sz * (.55 - k * .12);
              x.fillStyle = greens[0]; x.beginPath(); x.moveTo(px, ty - sz * .75); x.lineTo(px + tw, ty); x.lineTo(px - tw, ty); x.fill();
              x.fillStyle = greens[1]; x.beginPath(); x.moveTo(px, ty - sz * .75); x.lineTo(px + tw, ty); x.lineTo(px + tw * .25, ty); x.fill();
            }
          } else {
            const pal = [['#B51A2B', '#d9473f', '#7d1220'], ['#c8562e', '#e8834a', '#8a3320'], ['#d39b3a', '#efc46a', '#9a6a22'], ['#9a2235', '#c94a5a', '#5e1220']][(R() * 4) | 0];
            for (let k = 0; k < 7; k++) {
              const a = R() * 6.283, rr = R() * sz * .4, cx = px + Math.cos(a) * rr, cy = py - sz * .45 + Math.sin(a) * rr * .7, r = sz * (.2 + R() * .18);
              x.fillStyle = pal[2]; x.beginPath(); x.arc(cx, cy + r * .2, r, 0, 6.283); x.fill();
              x.fillStyle = pal[0]; x.beginPath(); x.arc(cx, cy, r * .92, 0, 6.283); x.fill();
              x.fillStyle = pal[1]; x.beginPath(); x.arc(cx + r * .25, cy - r * .3, r * .45, 0, 6.283); x.fill();
            }
          }
        });
      }),
      // foreground blossom masses
      layer(.85, .7, 1.06, true, x => {
        const R = rng(41), cl = [];
        for (let i = 0; i < 80 * dens; i++) { const fx_ = .48 + R() * .62, top = .82 - (fx_ - .48) * .16; cl.push([fx_, top + Math.pow(R(), .7) * .3, R() < .45 ? REDBLOOM : SAKURA]); }
        for (let i = 0; i < 45 * dens; i++) { const fx_ = -.08 + R() * .46, top = .9 + Math.abs(fx_ - .1) * .2; cl.push([fx_, top + R() * .2, R() < .3 ? REDBLOOM : SAKURA]); }
        cl.sort((a, b) => a[1] - b[1]);
        x.strokeStyle = '#2e1a20'; x.lineCap = 'round';
        for (let i = 0; i < 14; i++) { const sx = X(.5 + R() * .55), sy = Y(1.06); x.lineWidth = (4 + R() * 6) * u; x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + (R() - .5) * 80, Y(.95), sx + (R() - .5) * 140, Y(.84 + R() * .06)); x.stroke(); }
        cl.forEach(c => clump(x, X(c[0]), Y(c[1]), (34 + R() * 34) * u, c[2], small ? 110 : 190, R));
      }),
      // hanging branches framing the top
      layer(1, -.06, .72, true, x => {
        const R = rng(53), out = [];
        limb(x, X(-.07), Y(-.03), .42, W * .5, 22 * u, 3, R, out, .12);
        limb(x, X(-.07), Y(.2), .15, W * .3, 13 * u, 2, R, out, .18);
        limb(x, X(1.07), Y(-.01), Math.PI - .48, W * .46, 20 * u, 3, R, out, .12);
        limb(x, X(1.07), Y(.26), Math.PI - .12, W * .26, 12 * u, 2, R, out, .2);
        out.forEach(o => clump(x, o[0], o[1], (14 + R() * 20 + o[2] * 4) * u, SAKURA, small ? 50 : 90, R));
      })
    ];
    // vignette
    const [v, vx] = mk(W / 2, H / 2);
    const vg = vx.createRadialGradient(W / 4, H / 4, Math.min(W, H) * .2, W / 4, H / 4, Math.max(W, H) * .6);
    vg.addColorStop(0, 'rgba(21,30,47,0)'); vg.addColorStop(1, 'rgba(21,30,47,.45)'); vx.fillStyle = vg; vx.fillRect(0, 0, W, H);
    vign = v;
  }

  let lastW = 0, lastH = 0, rebuildT = 0;
  function resize(force) {
    W = Math.max(320, innerWidth || document.documentElement.clientWidth); H = Math.max(320, innerHeight || document.documentElement.clientHeight); DPR = Math.min(devicePixelRatio || 1, small ? 1 : 1.5);
    [bg, fx, land].forEach(c => { c.width = Math.max(1, Math.round(W * DPR)); c.height = Math.max(1, Math.round(H * DPR)); });
    g.setTransform(DPR, 0, 0, DPR, 0, 0); f.setTransform(DPR, 0, 0, DPR, 0, 0); l.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (force || Math.abs(W - lastW) > 2 || Math.abs(H - lastH) > 140) { buildLayers(); lastW = W; lastH = H; }
  }
  resize(true);
  addEventListener('resize', () => { clearTimeout(rebuildT); rebuildT = setTimeout(() => { resize(false); if (reduce) draw(0, 0); }, 180); });

  /* ======================= Input ======================= */
  const mouse = { x: -999, y: -999, nx: 0, ny: 0, sx: 0, sy: 0, last: -1e9 };
  addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.nx = e.clientX / W * 2 - 1; mouse.ny = e.clientY / H * 2 - 1; mouse.last = performance.now(); }, { passive: true });

  /* ======================= Live elements ======================= */
  const R0 = rng(99);
  const NP = small ? 55 : 130, BP = [];
  for (let i = 0; i < NP; i++) BP.push({ x: R0() * innerWidth, y: R0() * innerHeight, d: .4 + R0() * .9, vx: 0, vy: 0, rot: R0() * 6.28, spin: 1 + R0() * 2.5, ph: R0() * 6.28, c: PET[i % 5] });
  const FF = []; for (let i = 0; i < (small ? 22 : 46); i++) FF.push({ bx: R0(), by: .62 + R0() * .38, ph: R0() * 6.28, sp: .3 + R0() * .6, drift: (R0() - .5) * .01 });
  const stars = []; for (let i = 0; i < 160; i++) stars.push({ fx: R0(), fy: R0() * .5, s: .6 + R0() * 1.4, ph: R0() * 6.28 });
  const birds = []; for (let i = 0; i < 7; i++) birds.push({ ox: i * 22 + R0() * 14, oy: Math.abs(i - 3) * 9 + R0() * 6, ph: R0() * 6.28 });
  const glowC = (() => { const [c, x] = mk(128, 128), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,214,150,1)'); gr.addColorStop(.25, 'rgba(255,190,120,.5)'); gr.addColorStop(1, 'rgba(255,170,110,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return c; })();
  const flyC = (() => { const [c, x] = mk(64, 64), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,248,190,1)'); gr.addColorStop(.3, 'rgba(255,236,150,.45)'); gr.addColorStop(1, 'rgba(255,236,150,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return c; })();

  function petal(ctx, x, y, r, rot, flip, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(flip, 1); ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(0, -r * .7); ctx.lineTo(-r * .25, -r); ctx.bezierCurveTo(-r, -r * .6, -r * .7, r * .6, 0, r);
    ctx.bezierCurveTo(r * .7, r * .6, r, -r * .6, r * .25, -r); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  /* ======================= Draw ======================= */
  const K = [
    { top: 0xe9a08f, mid: 0xf6b493, hor: 0xffd0a2 },
    { top: 0x541A2E, mid: 0xB51A2B, hor: 0xFFA586 },
    { top: 0x151E2F, mid: 0x242F49, hor: 0x384358 }
  ];
  let sp = progress();
  function draw(t, dt) {
    const a = sp < .45 ? 0 : 1, k = sp < .45 ? sm(0, .45, sp) : sm(.45, 1, sp);
    const sky = { top: mixI(K[a].top, K[a + 1].top, k), mid: mixI(K[a].mid, K[a + 1].mid, k), hor: mixI(K[a].hor, K[a + 1].hor, k) };
    const thanksEl = document.getElementById('thanks'), eb = thanksEl ? sm(H * .95, 0, thanksEl.getBoundingClientRect().top) : 0, zp = sp * (1 - eb);
    const n = sm(.5, .92, sp), dusk = sm(.15, .45, sp) * (1 - sm(.55, .85, sp));
    const FX = W * .5, FY = H * .62, HZ = H * .66;

    const sk = g.createLinearGradient(0, 0, 0, HZ);
    sk.addColorStop(0, css(sky.top)); sk.addColorStop(.55, css(sky.mid)); sk.addColorStop(1, css(sky.hor));
    g.fillStyle = sk; g.fillRect(0, 0, W, H);
    // stars
    if (n > .01) { stars.forEach(s => { g.globalAlpha = n * (.35 + .65 * Math.abs(Math.sin(t * .7 + s.ph))) * (1 - s.fy * 1.4); g.fillStyle = '#fff'; g.fillRect(s.fx * W, s.fy * H, s.s, s.s); }); g.globalAlpha = 1; }
    // sun sinking behind Fuji
    const sunX = W * .515 - mouse.sx * 3, sunY = H * (.385 + sp * .34), sunR = Math.min(W, H) * .085;
    if (sp < .7) {
      const sg = g.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 3.2);
      sg.addColorStop(0, `rgba(255,222,185,${.55 * (1 - sp)})`); sg.addColorStop(1, 'rgba(255,200,160,0)');
      g.fillStyle = sg; g.fillRect(sunX - sunR * 3.2, sunY - sunR * 3.2, sunR * 6.4, sunR * 6.4);
      g.fillStyle = css(mixI(0xffd3a6, 0xff8d6b, sm(.1, .6, sp))); g.beginPath(); g.arc(sunX, sunY, sunR, 0, 6.283); g.fill();
    }
    // moon rising
    if (n > .01) {
      const mx = W * .8, my = H * (.42 - .28 * n);
      g.globalAlpha = n; g.globalCompositeOperation = 'lighter';
      g.drawImage(glowC, mx - H * .2, my - H * .2, H * .4, H * .4);
      g.globalCompositeOperation = 'source-over';
      const mg = g.createRadialGradient(mx - H * .01, my - H * .01, 0, mx, my, H * .045); mg.addColorStop(0, '#fffaf0'); mg.addColorStop(1, '#ffe2c4');
      g.fillStyle = mg; g.beginPath(); g.arc(mx, my, H * .045, 0, 6.283); g.fill(); g.globalAlpha = 1;
    }

    // painted land layers (flown into as you scroll)
    l.clearRect(0, 0, W, H);
    const drift = (t * 6) % (W + 2 * M);
    const T = [];
    layers.forEach((L, i) => {
      const s = 1 + zp * 1.8 * L.d * L.d;
      const px = -mouse.sx * 30 * L.d + (i === 0 ? -drift : 0), py = -mouse.sy * 16 * L.d - zp * H * .2 * L.d;
      const dx = FX + (-M + px - FX) * s, dy = FY + (L.top - M + py - FY) * s;
      T.push({ s, px, py });
      l.drawImage(L.c, dx, dy, L.w * s, L.h * s);
      if (i === 0) l.drawImage(L.c, dx + L.w * s, dy, L.w * s, L.h * s);
    });
    l.globalCompositeOperation = 'source-atop';
    if (dusk > .01) { l.fillStyle = `rgba(84,26,46,${.3 * dusk})`; l.fillRect(0, 0, W, H); }
    if (n > .01) { l.fillStyle = `rgba(21,30,47,${.62 * n * (1 - .4 * eb)})`; l.fillRect(0, 0, W, H); }
    l.globalCompositeOperation = 'source-over';
    g.drawImage(land, 0, 0, W, H);

    // birds crossing at dusk
    if (sp < .6 && !reduce) {
      const cyc = (t % 34) / 34, bx = -200 + cyc * (W + 400), by = H * .24 + Math.sin(cyc * 6) * 20;
      g.strokeStyle = `rgba(60,30,45,${.7 * (1 - sp / .6)})`; g.lineWidth = 1.6; g.lineCap = 'round';
      birds.forEach(b => { const fl = Math.sin(t * 9 + b.ph) * 4, x0 = bx + b.ox, y0 = by + b.oy; g.beginPath(); g.moveTo(x0 - 6, y0 - fl); g.quadraticCurveTo(x0 - 2, y0 - 2, x0, y0); g.quadraticCurveTo(x0 + 2, y0 - 2, x0 + 6, y0 - fl); g.stroke(); });
    }

    // night lights
    if (n > .01) {
      g.globalCompositeOperation = 'lighter';
      const tc = T[3], s = tc.s;
      cityLights.forEach(c => {
        const x = FX + (c[0] - M + tc.px - FX) * s, y = FY + (c[1] - M + tc.py - FY) * s;
        g.globalAlpha = n * (.55 + .45 * Math.sin(t * 1.5 + c[2])); g.fillStyle = c[3]; g.fillRect(x, y, 1.6, 1.6);
      });
      const cgx = FX + (X(.6) - M + tc.px - FX) * s, cgy = FY + (Y(.76) - M + tc.py - FY) * s;
      g.globalAlpha = n * .35; g.drawImage(glowC, cgx - W * .45, cgy - H * .12, W * .9, H * .24);
      if (pagodaLight) {
        const tp = T[5], px = FX + (pagodaLight.x - M + tp.px - FX) * tp.s, py = FY + (pagodaLight.y - M + tp.py - FY) * tp.s, r = pagodaLight.r * tp.s;
        g.globalAlpha = n * .8; g.drawImage(glowC, px - r, py - r, r * 2, r * 2);
      }
      FF.forEach(o => {
        o.bx += o.drift * dt; if (o.bx > 1.05) o.bx = -.05; if (o.bx < -.05) o.bx = 1.05;
        const x = o.bx * W + Math.sin(t * o.sp + o.ph) * 40, y = o.by * H + Math.cos(t * o.sp * .8 + o.ph) * 26;
        g.globalAlpha = n * (.3 + .7 * Math.max(0, Math.sin(t * 2.2 + o.ph))); g.drawImage(flyC, x - 12, y - 12, 24, 24);
      });
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }

    // petals
    const active = performance.now() - mouse.last < 1500, kk = 1 - Math.exp(-dt * 1.5);
    BP.forEach(o => {
      if (!reduce) {
        const bx = (24 + Math.sin(t * .6 + o.ph) * 28) * o.d, by = (32 + Math.cos(t * .5 + o.ph) * 8) * o.d;
        o.vx += (bx - o.vx) * kk; o.vy += (by - o.vy) * kk;
        if (active) {
          const dx = o.x - mouse.x, dy = o.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < 19600) { const d = Math.sqrt(d2) + .01, fo = (1 - d / 140) * 1100 * dt; o.vx += (dx / d - dy / d * .7) * fo; o.vy += (dy / d + dx / d * .7) * fo; }
        }
        o.x += o.vx * dt; o.y += o.vy * dt; o.rot += dt * o.spin * .6;
        if (o.y > H + 20) { o.y = -20; o.x = Math.random() * W * 1.2 - W * .2; }
        if (o.y < -40) o.y = H + 10;
        if (o.x > W + 20) o.x = -20; else if (o.x < -40) o.x = W + 10;
      }
      g.globalAlpha = 1 - n * .45;
      petal(g, o.x, o.y, 3 + o.d * 4.5, o.rot, Math.cos(t * o.spin + o.ph) * .8 + .2, o.c);
    });
    g.globalAlpha = 1;
    // warm sunset bloom
    if (sp < .7) {
      g.globalCompositeOperation = 'screen';
      const bl = g.createRadialGradient(sunX, sunY, 0, sunX, sunY, H * .8);
      bl.addColorStop(0, `rgba(255,200,160,${.35 * (1 - sp / .7)})`); bl.addColorStop(1, 'rgba(255,200,160,0)');
      g.fillStyle = bl; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
    }
    if (vign) g.drawImage(vign, 0, 0, W, H);
  }

  /* ======================= FX: petal cursor, sparkle trail, click shine ======================= */
  const dust = [], shines = [], burst = [];
  const kcur = document.getElementById('kcur');
  let lastPX = -99, lastPY = -99;
  if (fine) {
    document.documentElement.classList.add('kc');
    addEventListener('pointermove', e => {
      kcur.style.transform = `translate(${e.clientX - 15}px, ${e.clientY - 15}px)`;
      if (!reduce && Math.hypot(e.clientX - lastPX, e.clientY - lastPY) > 7) {
        dust.push({ x: e.clientX + (Math.random() - .5) * 10, y: e.clientY + (Math.random() - .5) * 10, vx: (Math.random() - .5) * 20, vy: 12 + Math.random() * 26, life: 0, max: .55 + Math.random() * .5, r: 1 + Math.random() * 1.6, star: Math.random() < .25 });
        lastPX = e.clientX; lastPY = e.clientY;
      }
    }, { passive: true });
    document.addEventListener('pointerover', e => kcur.classList.toggle('hot', !!e.target.closest('a,button,.kj-head')));
    document.addEventListener('pointerleave', () => { kcur.style.transform = 'translate(-99px,-99px)'; });
  }
  function shineCursor() { if (!fine) return; kcur.classList.remove('shine'); void kcur.offsetWidth; kcur.classList.add('shine'); }
  function shineAt(x, y) {
    if (reduce) return;
    shines.push({ x, y, t: performance.now(), rot: Math.random() * 6.28 });
    for (let i = 0; i < (small ? 14 : 24); i++) {
      const a = Math.random() * 6.28, v = 80 + Math.random() * 260;
      burst.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 90, r: 3 + Math.random() * 4.5, rot: Math.random() * 6.28, spin: 2 + Math.random() * 5, life: 0, max: 1.3 + Math.random() * .9, c: PET[i % 5] });
    }
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * 6.28, v = 60 + Math.random() * 200;
      dust.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: .6 + Math.random() * .6, r: 1.4 + Math.random() * 2.2, star: true });
    }
  }
  document.addEventListener('click', e => {
    shineCursor();
    if (e.target.closest('a,button,code')) return;
    shineAt(e.clientX, e.clientY);
  });
  function star(ctx, x, y, r) {
    ctx.beginPath(); ctx.moveTo(x, y - r * 3); ctx.quadraticCurveTo(x, y, x + r * 3, y); ctx.quadraticCurveTo(x, y, x, y + r * 3);
    ctx.quadraticCurveTo(x, y, x - r * 3, y); ctx.quadraticCurveTo(x, y, x, y - r * 3); ctx.fill();
  }
  function drawFx(now, dt) {
    f.clearRect(0, 0, W, H);
    f.globalCompositeOperation = 'lighter';
    for (let i = dust.length - 1; i >= 0; i--) {
      const o = dust[i]; o.life += dt;
      if (o.life > o.max) { dust.splice(i, 1); continue; }
      o.vx *= Math.exp(-dt * 2.5); o.vy = o.vy * Math.exp(-dt * 2.5) + 20 * dt; o.x += o.vx * dt; o.y += o.vy * dt;
      const a = 1 - o.life / o.max;
      if (o.star) { f.fillStyle = `rgba(255,248,250,${a})`; star(f, o.x, o.y, o.r * (.6 + a * .6)); }
      f.fillStyle = `rgba(255,190,210,${a * .35})`; f.beginPath(); f.arc(o.x, o.y, o.r * 3, 0, 6.283); f.fill();
      f.fillStyle = `rgba(255,236,242,${a})`; f.beginPath(); f.arc(o.x, o.y, o.r, 0, 6.283); f.fill();
    }
    for (let i = shines.length - 1; i >= 0; i--) {
      const s = shines[i], p = (now - s.t) / 750;
      if (p > 1) { shines.splice(i, 1); continue; }
      const a = 1 - p, e = 1 - Math.pow(1 - p, 3);
      const fl = f.createRadialGradient(s.x, s.y, 0, s.x, s.y, 70 * (1 - p * .4));
      fl.addColorStop(0, `rgba(255,255,255,${a * a})`); fl.addColorStop(.3, `rgba(255,214,222,${a * a * .6})`); fl.addColorStop(1, 'rgba(255,180,200,0)');
      f.fillStyle = fl; f.beginPath(); f.arc(s.x, s.y, 70, 0, 6.283); f.fill();
      f.strokeStyle = `rgba(255,240,245,${a * .9})`; f.lineWidth = .6 + 2.4 * a;
      f.beginPath(); f.arc(s.x, s.y, 8 + e * 90, 0, 6.283); f.stroke();
      f.lineCap = 'round';
      for (let k = 0; k < 8; k++) {
        const ang = s.rot + k * Math.PI / 4, r0 = 6 + e * 26, r1 = r0 + (k % 2 ? 22 : 42) * a + 6;
        f.strokeStyle = `rgba(255,250,252,${a * .85})`; f.lineWidth = (k % 2 ? 1.2 : 2) * a + .4;
        f.beginPath(); f.moveTo(s.x + Math.cos(ang) * r0, s.y + Math.sin(ang) * r0); f.lineTo(s.x + Math.cos(ang) * r1, s.y + Math.sin(ang) * r1); f.stroke();
      }
    }
    f.globalCompositeOperation = 'source-over';
    for (let i = burst.length - 1; i >= 0; i--) {
      const o = burst[i]; o.life += dt;
      if (o.life > o.max) { burst.splice(i, 1); continue; }
      o.vx *= Math.exp(-dt * 2.2); o.vy = o.vy * Math.exp(-dt * 2.2) + 140 * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.spin * dt;
      f.globalAlpha = 1 - o.life / o.max; petal(f, o.x, o.y, o.r, o.rot, Math.cos(o.life * 6), o.c);
    }
    f.globalAlpha = 1;
  }

  /* ======================= Skills handscroll ======================= */
  (function () {
    const maki = document.getElementById('maki'), strip = document.getElementById('strip'), hint = document.getElementById('strip-hint');
    const fit = () => {
      maki.style.setProperty('--shut', -(maki.clientWidth - 48) + 'px');
      hint.hidden = strip.scrollWidth <= strip.clientWidth + 4;
    };
    fit(); addEventListener('resize', fit);
    if (!reduce && 'IntersectionObserver' in window && maki.getBoundingClientRect().top > innerHeight * .8) {
      maki.classList.add('closed');
      const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { setTimeout(() => maki.classList.remove('closed'), 350); io.disconnect(); } }, { rootMargin: '0px 0px -25% 0px' });
      io.observe(maki);
    }
    let down = false, sx = 0, sl = 0;
    strip.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = strip.scrollLeft; strip.classList.add('drag'); });
    addEventListener('pointermove', e => { if (down) strip.scrollLeft = sl - (e.clientX - sx); });
    addEventListener('pointerup', () => { down = false; strip.classList.remove('drag'); });
  })();

  /* ======================= Hanging scrolls ======================= */
  document.querySelectorAll('.kj').forEach(kj => {
    const btn = kj.querySelector('.kj-head'), tg = kj.querySelector('.toggle');
    if (!btn || !tg) return;
    btn.addEventListener('click', () => { const open = kj.classList.toggle('open'); btn.setAttribute('aria-expanded', open); tg.textContent = open ? 'Roll up ↑' : 'Unroll ↓'; });
  });

  /* ======================= Slash reveal ======================= */
  if (!reduce && 'IntersectionObserver' in window) {
    const els = [...document.querySelectorAll('.reveal')];
    els.forEach(el => { if (el.getBoundingClientRect().top > innerHeight) el.classList.add('pending'); });
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target; io.unobserve(el);
      if (!el.classList.contains('pending')) return;
      el.classList.add('cut');
      setTimeout(() => el.classList.remove('pending'), 300);
      setTimeout(() => el.classList.remove('cut'), 1200);
    }), { rootMargin: '0px 0px -18% 0px' });
    els.forEach(el => io.observe(el));
  }

  /* ======================= Scroll load animation (Works + Currently learning) ======================= */
  if (!reduce && 'IntersectionObserver' in window) {
    document.querySelectorAll('.scrolls, .learn').forEach(box => {
      const kjs = [...box.querySelectorAll('.kj')];
      kjs.forEach((k, i) => {
        k.style.setProperty('--i', i);
        k.addEventListener('animationend', e => { if (e.animationName === 'hangIn') k.classList.add('landed'); });
      });
      if (box.getBoundingClientRect().top < innerHeight * .85) return;
      box.classList.add('hang-wait');
      const io = new IntersectionObserver(es => {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        box.classList.add('hang-in');
        box.classList.remove('hang-wait');
      }, { rootMargin: '0px 0px -20% 0px' });
      io.observe(box);
    });
  }

  /* ======================= Copy email ======================= */
  (function () {
    const btn = document.getElementById('copy'), email = document.getElementById('email');
    btn.addEventListener('click', () => {
      const sel = () => { getSelection().selectAllChildren(email); btn.textContent = 'Selected, press Ctrl+C'; };
      try { navigator.clipboard.writeText(email.textContent).then(() => { btn.textContent = 'Copied'; setTimeout(() => btn.textContent = 'Copy email', 1800); }, sel); }
      catch (e) { sel(); }
    });
  })();

  /* ======================= Main loop ======================= */
  if (reduce) {
    const still = () => { sp = progress(); draw(0, 0); };
    still(); addEventListener('scroll', () => requestAnimationFrame(still), { passive: true });
  } else {
    let last = performance.now();
    (function loop(now) {
      const dt = Math.min(.05, (now - last) / 1000), t = now / 1000; last = now;
      sp += (progress() - sp) * (1 - Math.exp(-dt * 4));
      mouse.sx += (mouse.nx - mouse.sx) * (1 - Math.exp(-dt * 3)); mouse.sy += (mouse.ny - mouse.sy) * (1 - Math.exp(-dt * 3));
      draw(t, dt); drawFx(now, dt);
      requestAnimationFrame(loop);
    })(last);
  }
})();
