/* Minimal 3D software renderer on Canvas 2D — zero dependencies.
   Pinhole camera with lookAt; painter's-algorithm depth sorting. */
(function (global) {
  'use strict';

  function Vec3(x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; }
  Vec3.prototype.sub = function (o) { return new Vec3(this.x - o.x, this.y - o.y, this.z - o.z); };
  Vec3.prototype.dot = function (o) { return this.x * o.x + this.y * o.y + this.z * o.z; };
  Vec3.prototype.norm = function () {
    var l = Math.sqrt(this.dot(this)) || 1;
    return new Vec3(this.x / l, this.y / l, this.z / l);
  };
  Vec3.prototype.cross = function (o) {
    return new Vec3(
      this.y * o.z - this.z * o.y,
      this.z * o.x - this.x * o.z,
      this.x * o.y - this.y * o.x
    );
  };

  function Camera() {
    this.pos = new Vec3(0, 6, 14);
    this.target = new Vec3(0, 2, 0);
    this.fovY = 55;
    this.cx = 0; this.cy = 0; this.focal = 1;
    this.right = new Vec3(1, 0, 0);
    this.up = new Vec3(0, 1, 0);
    this.fwd = new Vec3(0, 0, -1);
  }
  Camera.prototype.resize = function (w, h) {
    this.cx = w / 2; this.cy = h / 2;
    this.focal = h / (2 * Math.tan(this.fovY * Math.PI / 360));
  };
  Camera.prototype.lookAt = function () {
    var f = this.target.sub(this.pos).norm();
    var up = new Vec3(0, 1, 0);
    this.right = f.cross(up).norm();
    this.up = this.right.cross(f).norm();
    this.fwd = f;
  };
  Camera.prototype.project = function (p) {
    var d = p.sub(this.pos);
    var zc = d.dot(this.fwd);
    if (zc < 0.1) return null;
    var xc = d.dot(this.right);
    var yc = d.dot(this.up);
    var s = this.focal / zc;
    return { x: this.cx + xc * s, y: this.cy - yc * s, z: zc };
  };

  // Face definitions: vertex indices into box's 8 verts, fixed brightness per face (fake lighting)
  var FACE_DEFS = [
    { iv: [0, 1, 5, 4], br: 0.42 }, // back (z-)
    { iv: [1, 2, 6, 5], br: 0.78 }, // right
    { iv: [2, 3, 7, 6], br: 0.62 }, // front (z+)
    { iv: [3, 0, 4, 7], br: 0.50 }, // left
    { iv: [4, 5, 6, 7], br: 1.00 }, // top
    { iv: [0, 3, 2, 1], br: 0.26 }  // bottom
  ];

  function Box(x, y, z, sx, sy, sz, color) {
    this.sx = sx; this.sy = sy; this.sz = sz;
    this.opacity = 1;
    this.setPos(x, y, z);
    this.setColor(color || { r: 80, g: 120, b: 200 });
  }
  Box.prototype.setPos = function (x, y, z) {
    this.x = x; this.y = y; this.z = z;
    var hx = this.sx / 2, hy = this.sy / 2, hz = this.sz / 2;
    this.verts = [
      new Vec3(x - hx, y - hy, z - hz),
      new Vec3(x + hx, y - hy, z - hz),
      new Vec3(x + hx, y + hy, z - hz),
      new Vec3(x - hx, y + hy, z - hz),
      new Vec3(x - hx, y - hy, z + hz),
      new Vec3(x + hx, y - hy, z + hz),
      new Vec3(x + hx, y + hy, z + hz),
      new Vec3(x - hx, y + hy, z + hz)
    ];
  };
  Box.prototype.setColor = function (c) {
    var self = this;
    this.color = c;
    this.faces = FACE_DEFS.map(function (fd) {
      var br = fd.br;
      return {
        iv: fd.iv,
        fill: 'rgba(' + Math.round(Math.min(255, c.r * br)) + ',' +
                        Math.round(Math.min(255, c.g * br)) + ',' +
                        Math.round(Math.min(255, c.b * br)) + ',' + self.opacity + ')'
      };
    });
  };
  Box.prototype.setOpacity = function (o) {
    this.opacity = Math.max(0, Math.min(1, o));
    this.setColor(this.color);
  };

  function Renderer(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = new Camera();
    this.w = 0; this.h = 0;
  }
  Renderer.prototype.resize = function (w, h, dpr) {
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.camera.resize(w, h);
    this.w = w; this.h = h;
  };
  Renderer.prototype.render = function (boxes) {
    var cam = this.camera;
    cam.lookAt();
    var ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);

    var faces = [];
    for (var i = 0; i < boxes.length; i++) {
      var b = boxes[i];
      var proj = [];
      for (var j = 0; j < 8; j++) proj.push(cam.project(b.verts[j]));
      for (var k = 0; k < 6; k++) {
        var f = b.faces[k];
        var iv = f.iv;
        var ok = true, sum = 0, pts = [];
        for (var m = 0; m < 4; m++) {
          var p = proj[iv[m]];
          if (!p) { ok = false; break; }
          pts.push(p); sum += p.z;
        }
        if (!ok) continue;
        faces.push({ pts: pts, depth: sum / 4, fill: f.fill });
      }
    }
    faces.sort(function (a, b) { return b.depth - a.depth; });
    for (var n = 0; n < faces.length; n++) {
      var g = faces[n];
      ctx.fillStyle = g.fill;
      ctx.beginPath();
      ctx.moveTo(g.pts[0].x, g.pts[0].y);
      for (var q = 1; q < 4; q++) ctx.lineTo(g.pts[q].x, g.pts[q].y);
      ctx.closePath();
      ctx.fill();
    }
  };

  global.Vec3 = Vec3;
  global.Camera = Camera;
  global.Box = Box;
  global.Renderer = Renderer;
})(window);
