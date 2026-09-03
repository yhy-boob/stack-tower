/* Stack Tower — core game logic on top of the minimal renderer. */
(function () {
  'use strict';

  var canvas = document.getElementById('game-canvas');
  var renderer = new Renderer(canvas);
  var camera = renderer.camera;

  /* ---------- config ---------- */
  var BASE = 3.2;          // starting block size (x width, z depth)
  var H = 1.0;             // block height
  var DEPTH = 3.2;         // z depth (constant for all layers)
  var SLIDE_RANGE = 3.4;   // slide x offset, block center wanders in [-range, range]
  var GROUND_H = 0.7;      // ground slab height
  var GROUND_SIZE = 11;    // ground slab footprint
  var GRAVITY = 90;        // drop acceleration (units/s^2)
  var DROP_MAX = 42;       // terminal fall speed
  var PERFECT_EPS = 0.16;  // |dx| within this => perfect alignment
  var SPEED0 = 1.15;       // initial slide angular speed (rad/s)
  var SPEED_GROW = 0.065;  // speed added per level (capped)

  var BEST_KEY = 'stack_best';

  function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    var k = function (n) { return (n + h / 30) % 12; };
    var a = s * Math.min(l, 1 - l);
    var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
    return { r: Math.round(255 * f(0)), g: Math.round(255 * f(8)), b: Math.round(255 * f(4)) };
  }

  var palette = [
    hslToRgb(207, 88, 58), // vivid blue
    hslToRgb(27, 92, 62)   // warm orange
  ];
  var groundColor = { r: 46, g: 54, b: 92 };

  /* ---------- state ---------- */
  var state = 'idle';        // idle | sliding | drop | over
  var tower = [];            // placed layers: { box, x, w }
  var slide = null;          // moving block: { box, x, w, speed }
  var drop = null;           // falling block: { box, x, y, w, vy, targetY }
  var shards = [];           // cut-off falling pieces: { box, vy, y, life }
  var fx = [];               // floating texts: { text, x, y, life, kind }
  var ground = null;
  var level = 0;
  var score = 0;
  var best = 0;
  var combo = 0;
  var camY = 0;
  var time = 0;
  var lastT = 0;

  /* ---------- ui ---------- */
  var uiScore = document.getElementById('score');
  var uiBest = document.getElementById('best');
  var uiOverlay = document.getElementById('overlay');
  var uiFinalScore = document.getElementById('final-score');
  var uiFinalBest = document.getElementById('final-best');
  var uiBtnRestart = document.getElementById('btn-restart');
  var uiBtnRevive = document.getElementById('btn-revive');
  var uiHint = document.getElementById('hint');

  try { best = parseInt(localStorage.getItem(BEST_KEY) || '0', 10) || 0; } catch (e) { best = 0; }

  function layerCenterY(i) { return GROUND_H + H / 2 + i * H; }

  /* ---------- helpers ---------- */
  function spawnSlide() {
    var w = tower.length ? tower[tower.length - 1].w : BASE;
    var color = palette[level % 2];
    var b = new Box(0, layerCenterY(level), 0, w, H, DEPTH, color);
    slide = { box: b, x: 0, w: w, speed: SPEED0 + Math.min(level * SPEED_GROW, 4.5) };
    state = 'sliding';
  }

  function spawnShard(centerX, shardW, y) {
    var color = palette[level % 2];
    var b = new Box(centerX, y, 0, shardW, H, DEPTH, color);
    shards.push({ box: b, y: y, vy: 2 + Math.random() * 3, life: 2.2, drift: (Math.random() - 0.5) * 2 });
  }

  function addFx(text, x, y, kind) {
    fx.push({ text: text, x: x, y: y, life: 1.0, kind: kind || 'normal' });
  }

  function updateHud() {
    uiScore.textContent = score;
    uiScore.classList.remove('pop');
    void uiScore.offsetWidth; // restart animation
    uiScore.classList.add('pop');
    uiBest.textContent = best;
  }

  function start() {
    uiHint.classList.add('hidden');
    spawnSlide();
  }

  function doDrop() {
    drop = { box: slide.box, x: slide.x, y: slide.box.y, w: slide.w, vy: 0, targetY: layerCenterY(level) };
    slide = null;
    state = 'drop';
    Sfx.drop();
  }

  function settle() {
    var i = level;
    var top = i === 0 ? null : tower[tower.length - 1];
    var topW = top ? top.w : GROUND_SIZE;
    var topX = top ? top.x : 0;
    var w = drop.w;
    var x = drop.x;

    var l = x - w / 2, r = x + w / 2;
    var tl = topX - topW / 2, tr = topX + topW / 2;
    var ovL = Math.max(l, tl), ovR = Math.min(r, tr);
    var ov = ovR - ovL;

    if (ov <= 0.001) { // total whiff -> game over
      drop = null;
      gameOver();
      return;
    }

    var perfect = Math.abs(x - topX) < PERFECT_EPS && ov >= Math.min(w, topW) - 0.001;
    var newCx = perfect ? topX : (ovL + ovR) / 2;
    var newW = perfect ? Math.min(w, topW) : ov;
    var color = palette[level % 2];

    var placed = new Box(newCx, drop.targetY, 0, newW, H, DEPTH, color);
    tower.push({ box: placed, x: newCx, w: newW });
    level++;

    if (perfect) {
      combo++;
      var bonus = 2 + Math.min(combo - 1, 6);
      score += bonus;
      addFx('PERFECT +' + bonus, renderer.w / 2, renderer.h * 0.36, 'perfect');
      if (combo > 1) addFx('COMBO x' + combo, renderer.w / 2, renderer.h * 0.36 + 34, 'combo');
      Sfx.perfect(level);
    } else {
      combo = 0;
      score += 1;
      if (l < ovL - 0.001) spawnShard((l + ovL) / 2, ovL - l, drop.targetY);
      if (r > ovR + 0.001) spawnShard((ovR + r) / 2, r - ovR, drop.targetY);
      Sfx.cut();
    }

    drop = null;
    updateHud();
    spawnSlide();
  }

  function gameOver() {
    state = 'over';
    drop = null;
    slide = null;
    Sfx.fail();
    if (score > best) {
      best = score;
      try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {}
    }
    uiBest.textContent = best;
    uiFinalScore.textContent = score;
    uiFinalBest.textContent = best;
    if (AdMgr.hasRewarded()) uiBtnRevive.classList.remove('hidden');
    else uiBtnRevive.classList.add('hidden');
    uiOverlay.classList.remove('hidden');
  }

  function restart() {
    tower = [];
    shards = [];
    fx = [];
    level = 0;
    score = 0;
    combo = 0;
    state = 'idle';
    slide = null;
    drop = null;
    camY = 0;
    uiOverlay.classList.add('hidden');
    uiHint.classList.remove('hidden');
    updateHud();
    Sfx.click();
  }

  function revive() {
    if (!tower.length) { restart(); return; }
    uiOverlay.classList.add('hidden');
    combo = 0;
    spawnSlide();
  }

  /* ---------- input ---------- */
  function onAction() {
    Sfx.unlock();
    if (state === 'over') return;
    if (state === 'idle') { start(); return; }
    if (state === 'sliding') { doDrop(); }
  }

  canvas.addEventListener('pointerdown', onAction);
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
      e.preventDefault();
      onAction();
    }
  });
  uiBtnRestart.addEventListener('click', restart);
  uiBtnRevive.addEventListener('click', function () {
    AdMgr.showRewarded(function (ok) { if (ok) revive(); });
  });

  /* ---------- update ---------- */
  function update(dt) {
    var topCenterY = layerCenterY(level - (slide || drop ? 1 : 0));
    var desired = Math.max(0, topCenterY - 5);
    camY += (desired - camY) * Math.min(1, dt * 4);
    camera.pos.x = 0; camera.pos.y = 6 + camY; camera.pos.z = 13;
    camera.target.x = 0; camera.target.y = 2 + camY * 0.8; camera.target.z = 0;

    if (state === 'sliding') {
      slide.x = Math.sin(time * slide.speed) * SLIDE_RANGE;
      slide.box.setPos(slide.x, layerCenterY(level), 0);
    } else if (state === 'drop') {
      drop.vy = Math.min(drop.vy + GRAVITY * dt, DROP_MAX);
      drop.y += drop.vy * dt;
      if (drop.y >= drop.targetY) {
        drop.y = drop.targetY;
        drop.box.setPos(drop.x, drop.y, 0);
        settle();
      } else {
        drop.box.setPos(drop.x, drop.y, 0);
      }
    }

    for (var i = shards.length - 1; i >= 0; i--) {
      var s = shards[i];
      s.vy += 28 * dt;
      s.y -= s.vy * dt;
      s.life -= dt;
      s.box.setPos(s.box.x + s.drift * dt, s.y, 0);
      s.box.setOpacity(Math.max(0, Math.min(1, s.life / 0.6)));
      if (s.life <= 0 || s.y < -4) shards.splice(i, 1);
    }

    for (var j = fx.length - 1; j >= 0; j--) {
      var f = fx[j];
      f.life -= dt * 1.15;
      f.y -= 36 * dt;
      if (f.life <= 0) fx.splice(j, 1);
    }
  }

  /* ---------- render ---------- */
  function render() {
    var boxes = [ground];
    for (var i = 0; i < tower.length; i++) boxes.push(tower[i].box);
    if (slide) boxes.push(slide.box);
    if (drop) boxes.push(drop.box);
    for (var j = 0; j < shards.length; j++) boxes.push(shards[j].box);
    renderer.render(boxes);

    if (fx.length) {
      var ctx = renderer.ctx;
      ctx.save();
      ctx.textAlign = 'center';
      for (var k = 0; k < fx.length; k++) {
        var f = fx[k];
        ctx.globalAlpha = Math.max(0, f.life);
        if (f.kind === 'perfect') {
          ctx.fillStyle = '#7ff3ff';
          ctx.font = '800 30px system-ui, sans-serif';
          ctx.shadowColor = 'rgba(127,243,255,.8)';
          ctx.shadowBlur = 18;
        } else {
          ctx.fillStyle = '#ffd76a';
          ctx.font = '700 20px system-ui, sans-serif';
          ctx.shadowColor = 'rgba(255,215,106,.7)';
          ctx.shadowBlur = 12;
        }
        ctx.fillText(f.text, f.x, f.y);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  /* ---------- loop ---------- */
  function loop(t) {
    var dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
    lastT = t;
    time += dt;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  /* ---------- boot ---------- */
  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.resize(w, h, Math.min(window.devicePixelRatio || 1, 2));
  }
  window.addEventListener('resize', resize);

  ground = new Box(0, GROUND_H / 2, 0, GROUND_SIZE, GROUND_H, GROUND_SIZE, groundColor);
  resize();
  uiBest.textContent = best;
  uiScore.textContent = 0;
  requestAnimationFrame(function (t) { lastT = t; requestAnimationFrame(loop); });
})();
