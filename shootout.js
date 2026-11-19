'use strict';

const canvas = document.querySelector('#pitch');
const ctx = canvas.getContext('2d');
const ui = Object.fromEntries(['hud', 'score', 'attempts', 'clock', 'overlay', 'intro-text', 'start',
  'controls', 'status', 'help', 'record', 'stamina', 'power', 'crosshair', 'mouse-lock',
  'touch', 'joystick', 'feint', 'sprint', 'kick', 'outcome'].map(id => [id, document.getElementById(id)]));

const goal = { z: 36, half: 3.66, height: 2.44 };
const field = { half: 13, first: 0, last: goal.z + 2.7 };
const totalAttacks = 5;
const attackTime = 20;
const dribbleDistance = 2.75;
const keys = new Set();
const stick = { x: 0, z: 0 };
const player = { x: 0, z: 0, yaw: 0, pitch: 0, stamina: 1, dash: 0, dashX: 0, dashZ: 0, cooldown: 0 };
const ball = { x: 0, y: .11, z: 0, vx: 0, vy: 0, vz: 0, spin: 0 };
const keeper = { x: 0, z: goal.z - 1, reach: 0 };
let defenders = [];
let phase = 'intro';
let attack = 1;
let goals = 0;
let remaining = attackTime;
let charge = null;
let resultAt = 0;
let shotAge = 0;
let sprintHeld = false;
let aiming = null;
let width = 0;
let height = 0;
let focal = 0;
let camera;
let best = 0;
try { best = Number(localStorage.getItem('ultra-vault-shootout-drive-best')) || 0; } catch {}

const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const approach = (from, to, amount) => from + clamp(to - from, -amount, amount);
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const now = () => performance.now() / 1000;
ui.record.textContent = best;

function resetAttack() {
  Object.assign(player, { x: (attack % 3 - 1) * 1.8, z: 14, yaw: 0, pitch: -.03,
    stamina: 1, dash: 0, dashX: 0, dashZ: 0, cooldown: 0 });
  Object.assign(ball, { x: player.x, y: .11, z: player.z + dribbleDistance, vx: 0, vy: 0, vz: 0, spin: 0 });
  Object.assign(keeper, { x: 0, reach: 0 });
  defenders = [
    { x: -2.8, z: 25.5, pace: 3.25, mode: 'track', timer: 0, targetX: 0, targetZ: 0 },
    { x: 3.6, z: 29, pace: 2.85, mode: 'track', timer: 0, targetX: 0, targetZ: 0 }
  ];
  if (attack >= 3) defenders.push({ x: -.6, z: 31.5, pace: 2.75, mode: 'track', timer: 0, targetX: 0, targetZ: 0 });
  remaining = attackTime;
  shotAge = 0;
  charge = null;
  phase = 'dribble';
  ui.outcome.hidden = true;
  ui.status.textContent = '带球摆脱后卫，找角度射门。';
  ui.attempts.textContent = `${attack} / ${totalAttacks}`;
  ui.clock.textContent = attackTime;
  ui.clock.parentElement.classList.remove('urgent');
}

function startGame() {
  keys.clear();
  sprintHeld = false;
  stick.x = stick.z = 0;
  ui.joystick.firstElementChild.style.transform = '';
  attack = 1;
  goals = 0;
  ui.score.textContent = '0';
  ui.overlay.hidden = true;
  for (const id of ['hud', 'controls', 'help', 'crosshair', 'touch', 'mouse-lock']) ui[id].hidden = false;
  resetAttack();
  canvas.focus();
}

function endAttack(message, scored = false) {
  if (phase !== 'dribble' && phase !== 'shot') return;
  phase = 'result';
  charge = null;
  resultAt = now();
  if (scored) {
    goals++;
    ui.score.textContent = goals;
  }
  ui.status.textContent = message;
  ui.outcome.textContent = message;
  ui.outcome.classList.toggle('scored', scored);
  ui.outcome.hidden = false;
}

function finishGame() {
  phase = 'finished';
  if (document.pointerLockElement === canvas) document.exitPointerLock();
  if (goals > best) {
    best = goals;
    ui.record.textContent = best;
    try { localStorage.setItem('ultra-vault-shootout-drive-best', String(best)); } catch {}
  }
  ui['intro-text'].textContent = `${totalAttacks} 次进攻，打进 ${goals} 球。最佳成绩 ${best} 球。`;
  ui.start.textContent = '再踢一局';
  ui.overlay.hidden = false;
  ui.outcome.hidden = true;
  for (const id of ['touch', 'crosshair', 'help', 'controls', 'mouse-lock']) ui[id].hidden = true;
  ui.start.focus();
}

function look(dx, dy) {
  player.yaw += dx;
  player.pitch = clamp(player.pitch + dy, -.48, .29);
}
function moveInput() {
  const x = clamp(stick.x + Number(keys.has('d')) - Number(keys.has('a')), -1, 1);
  const z = clamp(stick.z + Number(keys.has('w')) - Number(keys.has('s')), -1, 1);
  const length = Math.max(1, Math.hypot(x, z));
  const sin = Math.sin(player.yaw);
  const cos = Math.cos(player.yaw);
  return { x: (x * cos + z * sin) / length, z: (z * cos - x * sin) / length };
}

function feint() {
  if (phase !== 'dribble' || player.cooldown > 0 || player.stamina < .16) return;
  const localX = stick.x + Number(keys.has('d')) - Number(keys.has('a'));
  const nearest = defenders.reduce((a, b) => distance(a, player) < distance(b, player) ? a : b);
  const rightX = Math.cos(player.yaw);
  const rightZ = -Math.sin(player.yaw);
  const relativeSide = (nearest.x-player.x)*rightX + (nearest.z-player.z)*rightZ;
  const side = Math.abs(localX) > .25 ? Math.sign(localX) : relativeSide > 0 ? -1 : 1;
  player.dashX = rightX * side;
  player.dashZ = rightZ * side;
  player.dash = .27;
  player.cooldown = .95;
  player.stamina -= .16;
  ui.status.textContent = '变向！趁后卫上抢时绕开。';
}

function advancePlayer(dt) {
  look((Number(keys.has('arrowright')) - Number(keys.has('arrowleft'))) * 1.25 * dt,
    (Number(keys.has('arrowup')) - Number(keys.has('arrowdown'))) * .75 * dt);
  const movement = moveInput();
  const moving = Math.hypot(movement.x, movement.z) > .05;
  const running = moving && (keys.has('shift') || sprintHeld) && player.stamina > .025;
  const speed = (running ? 6.7 : 4.15) * (charge === null ? 1 : .64);
  player.stamina = clamp(player.stamina + dt * (running ? -.38 : .23), 0, 1);
  player.cooldown = Math.max(0, player.cooldown - dt);
  player.dash = Math.max(0, player.dash - dt);
  const sideStep = player.dash > 0 ? 8.7 : 0;
  player.x = clamp(player.x + (movement.x * speed + player.dashX * sideStep) * dt, -field.half + 1, field.half - 1);
  player.z = clamp(player.z + (movement.z * speed + player.dashZ * sideStep) * dt, 9, goal.z - 3.6);
  // Follow the run, not the view, so players can scan the goal while dribbling.
  const angle = moving ? Math.atan2(movement.x, movement.z) : player.yaw;
  const follow = Math.min(1, dt * 16);
  ball.x += (player.x + Math.sin(angle) * dribbleDistance - ball.x) * follow;
  ball.z += (player.z + Math.cos(angle) * dribbleDistance - ball.z) * follow;
  ball.spin += dt * (moving ? speed / .35 : 0);
}

function advanceDefender(defender, index, dt) {
  defender.timer -= dt;
  if (defender.mode === 'windup' && defender.timer <= 0) {
    defender.mode = 'tackle';
    defender.timer = .29;
  } else if (defender.mode === 'tackle' && defender.timer <= 0) {
    defender.mode = 'recover';
    defender.timer = .72;
  } else if (defender.mode === 'recover' && defender.timer <= 0) {
    defender.mode = 'track';
  }

  const gap = distance(defender, ball);
  if (phase === 'dribble' && defender.mode === 'track' && gap < 1.65) {
    defender.mode = 'windup';
    defender.timer = .32;
    defender.targetX = ball.x;
    defender.targetZ = ball.z;
    ui.status.textContent = '后卫要上抢！变向或加速摆脱。';
  }

  let targetX = ball.x;
  let targetZ = ball.z;
  let speed = defender.pace + (attack - 1) * .13;
  if (phase === 'dribble' && defender.mode !== 'track') {
    targetX = defender.targetX;
    targetZ = defender.targetZ;
    speed = defender.mode === 'tackle' ? 8 : 0;
  } else if (index > 0 && gap > 3.2) {
    targetX = ball.x * .55 + (index === 1 ? 2.5 : -2.5);
    targetZ = Math.min(goal.z - 3, ball.z + 4.4 + index);
  }

  const dx = targetX - defender.x;
  const dz = targetZ - defender.z;
  const amount = Math.min(dt * speed, Math.hypot(dx, dz));
  const angle = Math.atan2(dx, dz);
  defender.x += Math.sin(angle) * amount;
  defender.z += Math.cos(angle) * amount;
  if (phase === 'dribble' && defender.mode === 'tackle' && distance(defender, ball) < .75) {
    endAttack('后卫断球。这次进攻结束。');
  }
}

function strength() {
  return charge === null ? 0 : clamp((now() - charge) / .82, 0, 1);
}
function beginCharge() {
  if (phase === 'dribble' && charge === null) charge = now();
}
function shoot() {
  if (phase !== 'dribble' || charge === null) return;
  const power = strength();
  charge = null;
  shotAge = 0;
  const speed = 11 + 18 * power;
  ball.vx = Math.sin(player.yaw) * speed;
  ball.vz = Math.cos(player.yaw) * speed;
  // A small lift offsets gravity. Raising the view or holding longer can send it over the bar.
  ball.vy = Math.sin(player.pitch) * speed + 2.5 + power;
  phase = 'shot';
  ui.status.textContent = '射门！';
}
function advanceShot(dt) {
  shotAge += dt;
  const oldX = ball.x;
  const oldY = ball.y;
  const oldZ = ball.z;
  ball.x += ball.vx * dt;
  ball.z += ball.vz * dt;
  ball.y += ball.vy * dt;
  ball.vy -= 8.3 * dt;
  ball.spin += dt * 24;
  if (ball.y < .11) {
    ball.y = .11;
    if (ball.vy < -1) {
      ball.vy = -ball.vy * .37;
      ball.vx *= .89;
      ball.vz *= .89;
    } else {
      ball.vy = 0;
      ball.vx *= Math.exp(-1.1 * dt);
      ball.vz *= Math.exp(-1.1 * dt);
    }
  }

  const keeperGap = keeper.z - ball.z;
  if (ball.vz > .01) {
    const intercept = ball.x + ball.vx * Math.max(0, keeperGap / ball.vz);
    if (shotAge > .16 && keeperGap < 11) {
      keeper.x = approach(keeper.x, clamp(intercept, -3.15, 3.15), dt * (4.8 + attack * .17));
      keeper.reach = keeperGap < 1.4 ? .32 : 0;
    }
  }
  if (ball.y < 1.94 && distance(ball, keeper) < .64 + keeper.reach) {
    endAttack('门将扑出。试试贴近门柱的角度。');
  } else if (shotAge > .04 && defenders.some(d => distance(ball,d) < .5 && ball.y < 1.7)) {
    endAttack('射门被后卫封堵。');
  } else if (oldZ < goal.z && ball.z >= goal.z) {
    const t = (goal.z - oldZ) / (ball.z - oldZ);
    const x = oldX + (ball.x - oldX) * t;
    const y = oldY + (ball.y - oldY) * t;
    if (Math.abs(x) < goal.half - .1 && y < goal.height - .1) endAttack('进球！', true);
    else endAttack(y >= goal.height ? '射高了，球越过横梁。' : '射偏了，球出了底线。');
  } else if (Math.abs(ball.x) > field.half || ball.z < field.first || shotAge > 3.6) {
    endAttack('球出界或被防线化解。');
  }
}

function update(dt) {
  if (phase === 'dribble') {
    remaining -= dt;
    ui.clock.textContent = String(Math.max(0, Math.ceil(remaining)));
    ui.clock.parentElement.classList.toggle('urgent', remaining < 5);
    if (remaining <= 0) {
      endAttack('进攻时间到。');
      return;
    }
    advancePlayer(dt);
    defenders.forEach((d, i) => advanceDefender(d, i, dt));
    keeper.x = approach(keeper.x, clamp(ball.x * .17, -1.7, 1.7), dt * 2.7);
  } else if (phase === 'shot') {
    advanceShot(dt);
  } else if (phase === 'result' && now() - resultAt > 1.45) {
    if (attack === totalAttacks) finishGame();
    else {
      attack++;
      resetAttack();
    }
  }

  ui.feint.disabled = phase !== 'dribble' || player.cooldown > 0 || player.stamina < .16;
  ui.kick.disabled = phase !== 'dribble';
  ui.stamina.style.transform = `scaleX(${player.stamina})`;
  ui.power.style.transform = `scaleX(${strength()})`;
}

function toView([x, y, z]) {
  const dx = x - player.x;
  const dy = y - 1.58;
  const dz = z - player.z;
  const forward = dx * camera.sinYaw + dz * camera.cosYaw;
  return [
    dx * camera.cosYaw - dz * camera.sinYaw,
    dy * camera.cosPitch - forward * camera.sinPitch,
    dy * camera.sinPitch + forward * camera.cosPitch
  ];
}
const near = .17;
function screen([x, y, z]) {
  return [width / 2 + x * focal / z, height / 2 - y * focal / z];
}
function clipEdge(a, b) {
  const t = (near - a[2]) / (b[2] - a[2]);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, near];
}

function line(points, color, size = 1) {
  ctx.beginPath();
  for (let i = 1; i < points.length; i++) {
    let a = toView(points[i - 1]);
    let b = toView(points[i]);
    if (a[2] < near && b[2] < near) continue;
    if (a[2] < near) a = clipEdge(a, b);
    if (b[2] < near) b = clipEdge(b, a);
    ctx.moveTo(...screen(a));
    ctx.lineTo(...screen(b));
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.stroke();
}

function polygon(points, color) {
  const view = points.map(toView);
  const clipped = [];
  for (let i = 0; i < view.length; i++) {
    const a = view[i];
    const b = view[(i + 1) % view.length];
    if (a[2] >= near) clipped.push(a);
    if ((a[2] >= near) !== (b[2] >= near)) clipped.push(clipEdge(a, b));
  }
  if (clipped.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(...screen(clipped[0]));
  for (const p of clipped.slice(1)) ctx.lineTo(...screen(p));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function disc(x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function outline(x, z, radius, color) {
  const points = Array.from({length: 33}, (_, i) => {
    const a = i * Math.PI / 16;
    return [x + Math.cos(a) * radius, .015, z + Math.sin(a) * radius];
  });
  line(points, color, 2);
}

function stadium() {
  const horizon = clamp(height / 2 + Math.tan(player.pitch) * focal, 1, height - 1);
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#09191e');
  sky.addColorStop(1, '#345a50');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#183d2b';
  ctx.fillRect(0, horizon, width, height - horizon);
  for (const x of [width * .12, width * .88]) {
    const glow = ctx.createRadialGradient(x, horizon*.48, 1, x, horizon*.48, height*.26);
    glow.addColorStop(0, '#d7ffc66b');
    glow.addColorStop(1, '#d7ffc600');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, horizon);
    ctx.fillStyle = '#f6f1d3';
    ctx.fillRect(x-10, horizon*.48, 20, 3);
  }
  ctx.fillStyle = '#152d2a';
  ctx.fillRect(0, horizon-21, width, 20);
  const offset = Math.floor((player.x + player.yaw*12)*6) % 8;
  for (let x = offset; x < width; x += 8) {
    ctx.fillStyle = ['#5d897d','#96a479','#346659'][Math.abs(Math.floor(x/8)) % 3];
    ctx.fillRect(x, horizon-13 + Math.abs(x % 3), 3, 2);
  }
  const w = field.half;
  for (let z = 0; z < field.last; z += 3.6) {
    const end = Math.min(z + 3.6, field.last);
    polygon([[-w,0,z],[w,0,z],[w,0,end],[-w,0,end]], z % 7.2 < 1 ? '#386d48' : '#2b5b3f');
  }
  line([[-w,.02,0],[-w,.02,goal.z],[w,.02,goal.z],[w,.02,0]], '#d8ecd1a5', 2);
  line([[-8.8,.02,goal.z],[-8.8,.02,24],[8.8,.02,24],[8.8,.02,goal.z]], '#edf4dba8', 2);
  line([[-5.4,.02,goal.z],[-5.4,.02,31],[5.4,.02,31],[5.4,.02,goal.z]], '#edf4db91', 1.5);
}

function drawGoal() {
  const {half: w, height: h, z} = goal;
  const goalDepth = Math.max(near, toView([0, h/2, z])[2]);
  const thickness = clamp(focal / goalDepth * .11, 2, 9);
  for (let i = 0; i <= 12; i++) {
    const x = -w + 2*w*i/12;
    line([[x,0,z+1.6],[x,h,z+1.6],[x,h,z]], '#d2e5cc61');
  }
  for (let i = 0; i <= 5; i++) {
    const y = h*i/5;
    line([[-w,y,z],[-w,y,z+1.6],[w,y,z+1.6],[w,y,z]], '#d2e5cc61');
  }
  line([[-w,0,z],[-w,h,z],[w,h,z],[w,0,z]], '#fff4d9', thickness);
}

function drawPerson(person, isKeeper, time) {
  const foot = toView([person.x, 0, person.z]);
  if (foot[2] < .53) return;
  const [x, y] = screen(foot);
  const scale = focal / foot[2];
  const windup = person.mode === 'windup';
  if (windup) outline(person.x, person.z, .58, '#ffd768');
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(scale,scale);
  const stride = Math.sin(time*12 + person.x) * (windup ? .025 : .12);
  const spread = isKeeper ? .23 + person.reach * .28 : .12;
  ctx.strokeStyle = '#112624';
  ctx.lineWidth = .13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-.12,-.78);
  ctx.lineTo(-spread + stride,-.08);
  ctx.moveTo(.12,-.78);
  ctx.lineTo(spread - stride,-.08);
  ctx.stroke();
  ctx.fillStyle = isKeeper ? '#e8b653' : windup ? '#e8ae59' : '#498ee2';
  ctx.beginPath();
  ctx.moveTo(-.27,-1.45);
  ctx.lineTo(.27,-1.45);
  ctx.lineTo(.19,-.76);
  ctx.lineTo(-.19,-.76);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = .12;
  ctx.beginPath();
  ctx.moveTo(-.25,-1.37);
  ctx.lineTo(-spread-.18,-1.12-(person.reach ?? 0));
  ctx.moveTo(.25,-1.37);
  ctx.lineTo(spread+.18,-1.12-(person.reach ?? 0));
  ctx.stroke();
  disc(0,-1.63,.13,'#d6ad8c');
  ctx.restore();
}

function drawBall() {
  const view = toView([ball.x, ball.y, ball.z]);
  if (view[2] < .3) return;
  const [x,y] = screen(view);
  const radius = clamp(focal/view[2]*.113, 2, 62);
  const shade = toView([ball.x, .005, ball.z]);
  if (shade[2] >= near) {
    const [sx,sy] = screen(shade);
    ctx.beginPath();
    ctx.ellipse(sx,sy,radius*.9,radius*.24,0,0,Math.PI*2);
    ctx.fillStyle = '#102b2196';
    ctx.fill();
  }
  disc(x,y,radius,'#fff5d9');
  for (let i = 0; i < 5; i++) {
    const a = ball.spin + i * Math.PI * 2/5;
    disc(x + Math.sin(a)*radius*.68,y + Math.cos(a)*radius*.68,radius*.15,'#274038');
  }
  disc(x,y,radius*.26,'#274038');
  if (phase === 'dribble') outline(ball.x, ball.z, .27, '#eff4c591');
}

function radar() {
  if (phase === 'intro' || phase === 'finished') return;
  const w = width < 600 ? 68 : 99;
  const h = w * .77;
  const x = width - w - 12;
  const y = height - h - (width < 650 ? 85 : 14);
  ctx.fillStyle = '#09251dd6';
  ctx.fillRect(x,y,w,h);
  ctx.strokeStyle = '#d1e8bf90';
  ctx.lineWidth = 1;
  ctx.strokeRect(x,y,w,h);
  ctx.strokeRect(x+w*.32,y,w*.36,h*.09);
  function dot(actor,color) {
    disc(x + w/2 + actor.x/field.half*w*.48,y + h*(goal.z-actor.z)/(goal.z-8),2.6,color);
  }
  defenders.forEach(d => dot(d,'#76b6ff'));
  dot(keeper,'#eeb65d');
  dot(player,'#f57962');
}

function frame(time) {
  const seconds = time / 1000;
  update(Math.min(.032, Math.max(0, seconds - previous)));
  previous = seconds;
  if (width && height) {
    camera = {
      sinYaw: Math.sin(player.yaw), cosYaw: Math.cos(player.yaw),
      sinPitch: Math.sin(player.pitch), cosPitch: Math.cos(player.pitch)
    };
    stadium();
    drawGoal();
    const actors = [...defenders, keeper, ball].sort((a, b) =>
      toView([b.x,0,b.z])[2] - toView([a.x,0,a.z])[2]);
    for (const actor of actors) {
      if (actor === ball) drawBall();
      else drawPerson(actor, actor === keeper, seconds);
    }
    radar();
  }
  requestAnimationFrame(frame);
}

const controlledKeys = ['w','a','s','d','shift','arrowleft','arrowright','arrowup','arrowdown','q',' '];
document.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if (phase !== 'dribble' || event.ctrlKey || event.metaKey || event.altKey || !controlledKeys.includes(key)) return;
  event.preventDefault();
  keys.add(key);
  if (event.repeat) return;
  if (key === 'q') feint();
  if (key === ' ') beginCharge();
});
document.addEventListener('keyup', event => {
  const key = event.key.toLowerCase();
  keys.delete(key);
  if (key === ' ' && phase === 'dribble') {
    event.preventDefault();
    shoot();
  }
});
window.addEventListener('blur', () => {
  keys.clear();
  stick.x = stick.z = 0;
  sprintHeld = false;
  charge = null;
  ui.joystick.firstElementChild.style.transform = '';
});

canvas.tabIndex = -1;
canvas.addEventListener('pointerdown', event => {
  if (phase !== 'dribble' || aiming || document.pointerLockElement === canvas) return;
  aiming = { id: event.pointerId, x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (phase !== 'dribble' || aiming?.id !== event.pointerId) return;
  look((event.clientX - aiming.x)*.005,(aiming.y - event.clientY)*.004);
  aiming.x = event.clientX;
  aiming.y = event.clientY;
});
canvas.addEventListener('lostpointercapture', () => { aiming = null; });
document.addEventListener('mousemove', event => {
  if (phase === 'dribble' && document.pointerLockElement === canvas) {
    look(event.movementX*.003,-event.movementY*.003);
  }
});
ui['mouse-lock'].addEventListener('click', async () => {
  if (document.pointerLockElement === canvas) {
    document.exitPointerLock();
    return;
  }
  try {
    if (!canvas.requestPointerLock) throw Error('Unavailable');
    await canvas.requestPointerLock();
  } catch {
    ui.status.textContent = '可以拖动画面或用方向键转视角。';
  }
});
document.addEventListener('pointerlockchange', () => {
  ui['mouse-lock'].textContent = document.pointerLockElement === canvas ? 'Esc 释放鼠标' : '锁定鼠标视角';
});

let joystickPointer = null;
function steer(event) {
  const rect = ui.joystick.getBoundingClientRect();
  const x = (event.clientX - rect.left - rect.width / 2) / 27;
  const y = (event.clientY - rect.top - rect.height / 2) / 27;
  const length = Math.max(1, Math.hypot(x,y));
  stick.x = x/length;
  stick.z = -y/length;
  ui.joystick.firstElementChild.style.transform = `translate(${stick.x*27}px,${-stick.z*27}px)`;
}
ui.joystick.addEventListener('pointerdown', event => {
  if (joystickPointer !== null) return;
  joystickPointer = event.pointerId;
  ui.joystick.setPointerCapture(event.pointerId);
  steer(event);
});
ui.joystick.addEventListener('pointermove', event => {
  if (event.pointerId === joystickPointer) steer(event);
});
ui.joystick.addEventListener('lostpointercapture', () => {
  joystickPointer = null;
  stick.x = stick.z = 0;
  ui.joystick.firstElementChild.style.transform = '';
});
ui.sprint.addEventListener('pointerdown', event => {
  ui.sprint.setPointerCapture(event.pointerId);
  sprintHeld = true;
});
ui.sprint.addEventListener('lostpointercapture', () => { sprintHeld = false; });
ui.feint.addEventListener('click', feint);
ui.kick.addEventListener('pointerdown', event => {
  ui.kick.setPointerCapture(event.pointerId);
  beginCharge();
});
ui.kick.addEventListener('pointerup', shoot);
ui.kick.addEventListener('lostpointercapture', () => { charge = null; });
ui.kick.addEventListener('click', event => {
  if (event.detail === 0) {
    beginCharge();
    shoot();
  }
});
ui.start.addEventListener('click', startGame);
new ResizeObserver(() => {
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  focal = Math.min(width * .93, height * .90);
}).observe(canvas);
resetAttack();
phase = 'intro';
let previous = now();
requestAnimationFrame(frame);
