/* WebAudio synthesized sound effects — zero assets, no copyright risk. */
(function (global) {
  'use strict';
  var ctx = null;

  function ensure() {
    if (!ctx) {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  function tone(freq, dur, type, vol, when, slideTo) {
    if (!ensure()) return;
    var t0 = ctx.currentTime + (when || 0);
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol, freq) {
    if (!ensure()) return;
    var t0 = ctx.currentTime;
    var len = Math.floor(ctx.sampleRate * dur);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var g = ctx.createGain();
    g.gain.value = vol;
    var filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = freq || 1200;
    src.connect(filt).connect(g).connect(ctx.destination);
    src.start(t0);
  }

  global.Sfx = {
    unlock: ensure,
    click: function () { tone(600, 0.05, 'square', 0.12); },
    drop: function () { tone(420, 0.09, 'triangle', 0.25); },
    place: function (level) {
      var f = 320 + level * 8;
      tone(f, 0.1, 'sine', 0.28);
      tone(f * 1.5, 0.12, 'sine', 0.14, 0.02);
    },
    perfect: function (level) {
      var f = 440 + level * 6;
      tone(f, 0.14, 'sine', 0.3);
      tone(f * 1.26, 0.16, 'sine', 0.26, 0.06);
      tone(f * 1.5, 0.22, 'triangle', 0.22, 0.12);
    },
    cut: function () {
      noise(0.12, 0.4, 1600);
      tone(180, 0.12, 'square', 0.1, 0, 60);
    },
    fail: function () {
      tone(300, 0.5, 'sawtooth', 0.2, 0, 70);
      noise(0.4, 0.3, 700);
    }
  };
})(window);
