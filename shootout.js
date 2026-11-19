'use strict';

const canvas = document.querySelector('#pitch');
const ctx = canvas.getContext('2d');
const ui = Object.fromEntries(['hud', 'score', 'attempts', 'overlay', 'intro-text', 'start',
  'controls', 'kick', 'power-fill', 'status', 'help', 'record'].map(id => [id, document.getElementById(id)]));

const maxShots = 8;
const goal = { z: 15.5, half: 3.66, height: 2.44 };
const kickSpot = { x: 0, y: .13, z: 4.65 };
const targetSpots = [[-2.86, 1.98], [2.83, .56], [2.86, 1.98], [-2.83, .56]];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const aim = { x: 0, y: 1.3 };
let phase = 'intro';
let score = 0;
let shots = 0;
let chargingAt = null;
let flight = null;
let keeperStarted = 0;
let keeperSpeed = 1.65;
let kickPointer = null;
let aimPointer = null;
let width = 0;
let height = 0;
let focal = 0;
let horizon = 0;
let best = 0;
try { best = Number(localStorage.getItem('ultra-vault-shootout-best')) || 0; } catch {}
ui.record.textContent = best;

function project(x, y, z) {
  return { x: width / 2 + x * focal / z, y: horizon + (1.65 - y) * focal / z };
}

function line(points, color, size = 1) {
  ctx.beginPath();
  points.forEach(([x, y, z], index) => {
    const point = project(x, y, z);
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.stroke();
}

function turf() {
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#091719');
  sky.addColorStop(1, '#305b4d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  const grass = ctx.createLinearGradient(0, horizon, 0, height);
  grass.addColorStop(0, '#456b45');
  grass.addColorStop(1, '#173f2a');
  ctx.fillStyle = grass;
  ctx.fillRect(0, horizon, width, height - horizon);

  for (let z = 66; z > 1; z -= 5) {
    const back = project(0, 0, z + 2.5).y;
    const front = project(0, 0, z).y;
    ctx.fillStyle = '#afcf7118';
    ctx.fillRect(0, back, width, front - back);
  }

  ctx.fillStyle = '#132822';
  ctx.fillRect(0, horizon - 22, width, 25);
  for (let i = 0; i < width; i += 6) {
    ctx.fillStyle = ['#457366', '#6b7254', '#1a3a30', '#829579'][Math.floor(i / 6) % 4];
    ctx.fillRect(i, horizon - 16 + i % 9, 2, 2);
  }
  for (const x of [width * .13, width * .87]) {
    const glimmer = ctx.createRadialGradient(x, horizon * .51, 1, x, horizon * .51, height * .21);
    glimmer.addColorStop(0, '#e1e7a853');
    glimmer.addColorStop(1, '#e1e7a800');
    ctx.fillStyle = glimmer;
    ctx.fillRect(0, 0, width, horizon);
    ctx.fillStyle = '#e7f1c9';
    for (let lamp = -1; lamp <= 1; lamp++) ctx.fillRect(x + 6 * lamp, horizon * .51, 4, 3);
  }
  line([[-18,0,24], [18,0,24]], '#e2edcf55');
  line([[-10,0,3], [-10,0,goal.z], [10,0,goal.z], [10,0,3]], '#e6efd7a0', 1.5);
  line([[-5.5,0,goal.z], [-5.5,0,10], [5.5,0,10], [5.5,0,goal.z]], '#f5f0d49b', 1.5);
  const arc = [];
  for (let i = 0; i <= 38; i++) {
    const angle = .18 * Math.PI + i / 38 * .64 * Math.PI;
    arc.push([Math.cos(angle) * 4.8, 0, 9.2 - Math.sin(angle) * 4.8]);
  }
  line(arc, '#edf5d990', 1.4);

  const h = goal.height;
  const w = goal.half;
  const z = goal.z;
  for (let i = 0; i <= 14; i++) {
    const x = -w + 2 * w * i / 14;
    line([[x, 0, z + 1.3], [x, h, z + 1.3], [x, h, z]], '#d3e9c74d');
  }
  for (let i = 0; i <= 5; i++) {
    const y = h * i / 5;
    line([[-w, y, z], [-w, y, z + 1.3], [w, y, z + 1.3], [w, y, z]], '#d3e9c756');
  }
  line([[-w, 0, z], [-w, h, z], [w, h, z], [w, 0, z]], '#f8f5db', Math.max(2, focal / z * .095));
  line([[-w, 0, z], [-w, 0, z + 1.3], [w, 0, z + 1.3], [w, 0, z]], '#b4d6b8');
}

function keeperX(now) {
  const elapsed = (now - keeperStarted) / 1000;
  return Math.sin(elapsed * keeperSpeed) * 2.6;
}

function circle(x, y, radius, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawKeeper(x, reaction = 0) {
  const z = goal.z - .7;
  const hip = project(x, .91, z);
  const head = project(x, 1.73 + reaction, z);
  const scale = focal / z;
  line([[x-.26,0,z],[x-.20,.36,z],[x-.12,.95,z],[x+.12,.95,z],[x+.23,.42,z],[x+.30,0,z]], '#192924', scale * .17);
  line([[x-.55,1.12 + reaction,z],[x-.35,1.37 + reaction,z],[x+.35,1.37 + reaction,z],[x+.55,1.12 + reaction,z]], '#e7bf61', scale * .14);
  const torso = project(x, 1.45 + reaction, z);
  ctx.fillStyle = '#d9a94f';
  ctx.fillRect(torso.x-scale*.24, torso.y, scale*.48, hip.y-torso.y);
  circle(head.x, head.y, scale * .125, '#e6b98a');
}

function target() {
  return targetSpots[shots % targetSpots.length];
}

function ring(x, y, radius, color, thickness = 2) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.stroke();
}

function drawMarker(now) {
  const [x, y] = target();
  const point = project(x, y, goal.z);
  const radius = focal / goal.z * .33;
  circle(point.x, point.y, radius, '#f4d48232');
  ring(point.x, point.y, radius, '#f4d482', 1.6);
  circle(point.x, point.y, 2.2, '#fff1c2');
  if (phase !== 'ready') return;
  const cursor = project(aim.x, aim.y, goal.z);
  const color = chargingAt === null ? '#eff9e6' : '#ffdf88';
  ring(cursor.x, cursor.y, 10, color);
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(cursor.x - 15, cursor.y);
  ctx.lineTo(cursor.x - 6, cursor.y);
  ctx.moveTo(cursor.x + 6, cursor.y);
  ctx.lineTo(cursor.x + 15, cursor.y);
  ctx.moveTo(cursor.x, cursor.y - 15);
  ctx.lineTo(cursor.x, cursor.y - 6);
  ctx.moveTo(cursor.x, cursor.y + 6);
  ctx.lineTo(cursor.x, cursor.y + 15);
  ctx.stroke();
}

function drawBall(x, y, z, turn) {
  const point = project(x, y, z);
  const shadow = project(x, 0, z);
  const r = focal / z * .116;
  ctx.beginPath();
  ctx.ellipse(shadow.x, shadow.y + r * .27, r * 1.14, r * .35, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#071d148c';
  ctx.fill();
  const gloss = ctx.createRadialGradient(point.x-r*.32, point.y-r*.4, 0, point.x, point.y, r);
  gloss.addColorStop(0, '#fffef0');
  gloss.addColorStop(1, '#b2c2ae');
  circle(point.x, point.y, r, gloss);
  ctx.save();
  ctx.translate(point.x, point.y);
  ctx.rotate(turn);
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = i * 2 * Math.PI / 5;
    if (i === 0) ctx.moveTo(Math.cos(a)*r*.36, Math.sin(a)*r*.36);
    else ctx.lineTo(Math.cos(a)*r*.36, Math.sin(a)*r*.36);
  }
  ctx.closePath();
  ctx.fillStyle = '#273931';
  ctx.fill();
  for (let i = 0; i < 5; i++) {
    const a = i * 2 * Math.PI / 5;
    circle(Math.cos(a)*r*.73, Math.sin(a)*r*.73, r*.13, '#526054');
  }
  ctx.restore();
}

function power(now) {
  return chargingAt === null ? 0 : clamp((now - chargingAt) / 850, 0, 1);
}

function setStatus(text) { ui.status.textContent = text; }
function setScore() {
  ui.score.textContent = score;
  ui.attempts.textContent = `${shots} / ${maxShots}`;
}

function prepareShot(now) {
  phase = 'ready';
  flight = null;
  keeperStarted = now;
  keeperSpeed = 1.65 + shots * .1;
  aim.x = 0;
  aim.y = 1.3;
  ui.kick.disabled = false;
  setStatus('瞄准球门，准备射门。');
}

function start() {
  score = 0;
  shots = 0;
  chargingAt = null;
  ui.overlay.hidden = true;
  ui.hud.hidden = ui.controls.hidden = ui.help.hidden = false;
  setScore();
  prepareShot(performance.now());
  ui.kick.focus();
}

function end() {
  phase = 'finished';
  if (score > best) {
    best = score;
    ui.record.textContent = best;
    try { localStorage.setItem('ultra-vault-shootout-best', String(best)); } catch {}
  }
  ui['intro-text'].textContent = `8 次射门拿下 ${score} 分。最佳成绩 ${best} 分。`;
  ui.start.textContent = '再玩一局';
  ui.overlay.hidden = false;
  ui.controls.hidden = ui.help.hidden = true;
  ui.start.focus();
}

function beginCharge() {
  if (phase !== 'ready' || chargingAt !== null) return;
  chargingAt = performance.now();
  setStatus('蓄力中，松开即可射门。');
}

function kick() {
  if (phase !== 'ready' || chargingAt === null) return;
  const now = performance.now();
  const force = power(now);
  const duration = 850 - force * 420;
  const x = aim.x;
  const y = Math.max(.05, aim.y - (force < .08 ? .025 : 0));
  const [tx, ty] = target();
  shots++;
  const keeperAtImpact = keeperX(now + duration * .94);
  const inGoal = Math.abs(x) <= goal.half - .11 && y >= .10 && y <= goal.height - .10;
  const saved = inGoal && Math.abs(x - keeperAtImpact) < .63 && y <= 1.84;
  const bonus = inGoal && !saved && Math.hypot(x-tx,y-ty) < .37;
  phase = 'flight';
  flight = { start: now, duration, x, y, saved, inGoal, bonus, resolved: false };
  chargingAt = null;
  ui.kick.disabled = true;
  setScore();
  setStatus('球已出脚。');
}

function resolveFlight(now) {
  flight.resolved = true;
  flight.finish = now;
  if (flight.bonus) {
    score += 2;
    setStatus('命中金色靶标！＋2 分');
  } else if (flight.saved) {
    setStatus('被守门员扑出。');
  } else if (flight.inGoal) {
    score++;
    setStatus('进球！＋1 分');
  } else {
    setStatus('球偏出球门。');
  }
  setScore();
}

function frame(now) {
  if (width && height) {
    turf();
    const intercepted = flight?.saved && now-flight.start > flight.duration*.80;
    drawKeeper(keeperX(now), intercepted ? .15 : 0);
    if (phase === 'ready') drawMarker(now);
    if (flight) {
      const t = clamp((now-flight.start)/flight.duration,0,1);
      const y = kickSpot.y + (flight.y-kickSpot.y)*t + 2.9*t*(1-t);
      const z = kickSpot.z + (goal.z+(flight.saved?-.7:.7)-kickSpot.z)*t;
      drawBall(flight.x*t, y, z, t*8);
      if (phase === 'flight' && t === 1 && !flight.resolved) resolveFlight(now);
      if (phase === 'flight' && flight.resolved && now-flight.finish > 950) {
        if (shots === maxShots) end();
        else prepareShot(now);
      }
    } else {
      drawBall(kickSpot.x,kickSpot.y,kickSpot.z,0);
    }
    ui['power-fill'].style.transform = `scaleX(${power(now)})`;
  }
  requestAnimationFrame(frame);
}

function aimAt(event) {
  if (phase !== 'ready' || !focal) return;
  const rect = canvas.getBoundingClientRect();
  aim.x = clamp((event.clientX-rect.left-width/2)*goal.z/focal, -5.3, 5.3);
  aim.y = clamp(1.65-(event.clientY-rect.top-horizon)*goal.z/focal, .08, 3.5);
}

canvas.addEventListener('pointerdown', event => {
  if (aimPointer !== null || phase !== 'ready') return;
  aimPointer = event.pointerId;
  canvas.setPointerCapture(aimPointer);
  aimAt(event);
});
canvas.addEventListener('pointermove', event => {
  if (aimPointer === event.pointerId) aimAt(event);
});
canvas.addEventListener('lostpointercapture', () => { aimPointer = null; });

ui.kick.addEventListener('pointerdown', event => {
  if (kickPointer !== null || phase !== 'ready') return;
  kickPointer = event.pointerId;
  ui.kick.setPointerCapture(event.pointerId);
  beginCharge();
});
ui.kick.addEventListener('pointerup', event => {
  if (event.pointerId !== kickPointer) return;
  kickPointer = null;
  kick();
});
ui.kick.addEventListener('lostpointercapture', () => {
  if (kickPointer === null) return;
  kickPointer = null;
  chargingAt = null;
  if (phase === 'ready') setStatus('瞄准球门，准备射门。');
});
ui.kick.addEventListener('click', event => {
  if (event.detail === 0 && phase === 'ready' && chargingAt === null) {
    beginCharge();
    kick();
  }
});
document.addEventListener('keydown', event => {
  if (phase !== 'ready' || event.altKey || event.metaKey || event.ctrlKey) return;
  const move = { ArrowLeft: [-.18,0], ArrowRight: [.18,0], ArrowUp: [0,.13], ArrowDown: [0,-.13] }[event.key];
  if (move) {
    event.preventDefault();
    aim.x = clamp(aim.x + move[0], -5.3, 5.3);
    aim.y = clamp(aim.y + move[1], .08, 3.5);
  } else if (event.code === 'Space') {
    event.preventDefault();
    if (!event.repeat && kickPointer === null) beginCharge();
  }
});
document.addEventListener('keyup', event => {
  if (event.code === 'Space' && phase === 'ready' && chargingAt !== null && kickPointer === null) {
    event.preventDefault();
    kick();
  }
});
window.addEventListener('blur', () => {
  if (chargingAt === null) return;
  chargingAt = null;
  setStatus('瞄准球门，准备射门。');
});
ui.start.addEventListener('click', start);
new ResizeObserver(() => {
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  focal = Math.min(width * 1.42, height * 1.42);
  horizon = height * .42;
}).observe(canvas);
requestAnimationFrame(frame);
