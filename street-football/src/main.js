import { createAudio } from './audio.js';
import { createCinema } from './cinema.js';
import { CINEMA, KICK } from './config.js';
import { createInput } from './input.js';
import { fullscreenOn, fullscreenSupported, toggleFullscreen, touchDevice } from './touch.js?v=screen-fit';
import { createUI, onTap } from './ui.js?v=screen-fit';
import { createView } from './view/view.js?v=screen-fit';
import { canPower, createWorld, startAim, step } from './world.js';
import { t } from './dil.js';

const STEP = 1 / 60;
const MAX_STEPS = 5;

export function start(root) {
  const testMode = new URLSearchParams(location.search).has('test');
  const touch = touchDevice();
  const portrait = matchMedia('(orientation: portrait)');
  root.classList.toggle('touch', touch);
  fitVisibleViewport(root);
  const view = createView(root.querySelector('#yg-view'), { mobile: touch });
  const ui = createUI(root);
  const audio = createAudio();
  const cinema = createCinema();
  const pauseButton = root.querySelector('#yg-pause-open');
  const cameraButton = root.querySelector('#yg-cam');
  const fullButton = root.querySelector('#yg-full');
  const fullscreenNote = root.querySelector('#yg-fullscreen-note');
  let w = createWorld();
  let screen = 'home', helpReturn = 'home', started = false;
  let cine = null, rightHold = null, acc = 0, uiClock = 0, last = performance.now();
  let activePointerLock = false;

  const active = () => started && !screen;
  const refresh = () => ui.hud(w, started, screen);
  const input = createInput(view.canvas, {
    testMode,
    touch: touch && root,
    playing: active,
    onHelp: help,
    onCamera: toggleCamera,
    onPause: pause,
    onLook: (dx, dy) => { if (!cine || cine.phase === 'aim') view.look(dx, dy); },
    onPoint: (x, y) => view.point(x, y),
    canLock: () => view.cameraMode === 'shoulder',
    onUnlock: () => { if (activePointerLock && active() && view.cameraMode === 'shoulder') show('pause'); },
    onBlur: () => { if (active()) show('pause'); else input.clear(); },
  });
  document.addEventListener('pointerlockchange', () => { activePointerLock = document.pointerLockElement === view.canvas; });

  function setCamera(mode) {
    view.setCamera(mode);
    if (mode === 'iso') input.unlock();
    if (mode === 'shoulder') {
      view.faceBall(w);
      if (active()) input.lock();
    }
    root.classList.toggle('iso', mode === 'iso');
    cameraButton.textContent = mode === 'iso' ? '肩后视角' : '俯视视角';
  }
  function toggleCamera() { setCamera(view.cameraMode === 'iso' ? 'shoulder' : 'iso'); }
  setCamera(touch ? 'iso' : 'shoulder');
  onTap(cameraButton, toggleCamera);
  const launchedFromHome = navigator.standalone || matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
  const syncFull = () => {
    fullButton.hidden = launchedFromHome;
    fullButton.textContent = fullscreenOn() ? '退出全屏' : fullscreenSupported() ? '全屏' : '全屏方式';
  };
  document.addEventListener('fullscreenchange', syncFull);
  onTap(fullButton, async () => {
    if (await toggleFullscreen()) return;
    fullscreenNote.hidden = false;
    if (screen !== 'help') help();
    fullscreenNote.scrollIntoView({ block: 'nearest' });
  });
  syncFull();

  function show(next) {
    screen = next;
    if (next) input.unlock();
    input.clear();
    ui.show(next);
    root.dataset.screen = next || 'match';
    pauseButton.hidden = !active();
    input.sync(w, active());
    refresh();
    if (next === 'pause' || next === 'help' || next === 'results') {
      root.querySelector(`#yg-${next} button`)?.focus({ preventScroll: true });
    }
  }
  function begin() {
    if (touch && portrait.matches) return;
    endCinema(); cinema.reset(); rightHold = null;
    w = createWorld();
    ui.reset();
    view.faceBall(w);
    started = true;
    acc = 0;
    audio.unlock();
    show(null);
    input.lock();
  }
  function resume() {
    if (touch && portrait.matches) return;
    show(null);
    input.lock();
  }
  function help() {
    if (screen === 'help') { closeHelp(); return; }
    helpReturn = screen;
    show('help');
  }
  function closeHelp() {
    show(helpReturn);
    if (active()) input.lock();
  }
  function pause() {
    if (screen === 'help') { closeHelp(); return; }
    if (screen === 'pause') { resume(); return; }
    if (active()) show('pause');
  }
  function menu() {
    endCinema(); cinema.reset(); rightHold = null;
    started = false;
    w = createWorld();
    ui.reset();
    view.faceBall(w);
    show('home');
  }
  portrait.addEventListener('change', e => { if (touch && e.matches && active()) show('pause'); });

  for (const id of ['start', 'restart', 'again']) ui.button(id, begin);
  ui.button('pause-open', pause);
  ui.button('resume', resume);
  ui.button('menu', menu);
  ui.button('result-menu', menu);
  for (const id of ['help-open', 'pause-help']) ui.button(id, help);
  ui.button('help-close', closeHelp);
  const toggleSound = () => ui.setSound(audio.toggle());
  ui.button('sound', toggleSound);
  ui.button('pause-sound', toggleSound);
  ui.setSound(audio.enabled);

  const who = p => (p.id === w.me ? t('mac.sen') : t('mac.kim', { takim: ui.teamName(p.team), ad: p.name }));
  const mine = () => w.players[w.me];
  const powerBlocked = kind => {
    const p = mine(), left = (kind === 'fire' ? w.fireLeft : w.windLeft)[p.team];
    return left <= 0 ? t(kind === 'fire' ? 'mac.yakarBitti' : 'mac.ruzgarBitti') : null;
  };
  const myAim = () => (w.aim && w.aim.id === w.me ? w.aim : null);
  function route(cmd) {
    const aim = myAim();
    if (aim && aim.kind === 'fire') {
      if (cmd.secondaryUp || !input.rightHeld() || cmd.tap) cmd.fire = true;
      cmd.secondary = false; cmd.tap = false;
      return cmd;
    }
    const owns = w.ball.owner === w.me;
    if (cmd.secondary && owns) { cmd.secondary = false; rightHold = { t: 0, warned: false }; }
    if (rightHold) {
      if (!owns) rightHold = null;
      else if (cmd.secondaryUp || !input.rightHeld()) { cmd.pass = true; rightHold = null; }
    }
    cmd.held2 = !!rightHold;
    return cmd;
  }
  function tickRightHold(dt) {
    if (!rightHold || w.aim) return;
    rightHold.t += dt;
    if (rightHold.t < CINEMA.hold) return;
    const why = powerBlocked('fire');
    if (!why && canPower(w, w.me, 'fire')) { rightHold = null; startAim(w, w.me, 'fire'); }
    else if (!rightHold.warned) { rightHold.warned = true; if (why) ui.message(why, 1.2); }
  }
  function chargeState() {
    if (!active()) return null;
    const p = mine(), aim = myAim();
    if (aim) return { kind: aim.kind, p: 1 - (cine?.phase === 'aim' ? cine.t : 0) / CINEMA.aim, text: t(aim.kind === 'wind' ? 'mac.birakRuzgar' : 'mac.birakYakar'), full: true };
    if (cine) return null;
    if (rightHold) {
      const why = powerBlocked('fire'), full = rightHold.t >= CINEMA.hold;
      return { kind: why ? 'blocked' : 'fire', p: rightHold.t / CINEMA.hold, full: full && !why, text: why ? t('mac.engelPas', { neden: why }) : t('mac.birakPasTutYakar') };
    }
    if (p.charge > 0 && w.ball.owner === w.me) {
      const why = powerBlocked('wind'), full = p.charge >= KICK.windCharge;
      return { kind: why && full ? 'blocked' : 'wind', p: p.charge / KICK.windCharge, full: full && !why, text: why && full ? t('mac.engelSut', { neden: why }) : t('mac.birakSutTutRuzgar') };
    }
    return null;
  }

  function endCinema() {
    if (!cine) return;
    cine = null;
    ui.cinema(false);
  }
  function syncCine(dt) {
    const s = cinema.state;
    if (!s) { endCinema(); return; }
    const p = w.players[s.id], self = s.id === w.me;
    if (!cine) cine = { phase: null };
    if (cine.phase !== s.phase || cine.id !== s.id) {
      const first = cine.phase === null;
      Object.assign(cine, { phase: s.phase, kind: s.kind, id: s.id, mine: self, t: 0 });
      if (s.phase === 'aim') {
        view.event({ type: s.kind === 'fire' ? 'ignite' : 'blow', x: w.ball.x, z: w.ball.z });
        audio.play('ignite');
        ui.cinema(true, self ? t('mac.nisanAl') : t('mac.nisanAliyor', { kim: who(p) }), self ? 1 : null, s.kind);
      } else if (s.phase === 'impact') {
        view.event({ type: 'impact', x: w.ball.x, z: w.ball.z }); audio.play('impact');
      } else {
        if (first && s.kind === 'fire') { view.event({ type: 'ignite', x: w.ball.x, z: w.ball.z }); audio.play('ignite'); }
        ui.cinema(true, who(p), null, s.kind);
      }
    }
    cine.t += dt;
    if (cine.phase === 'aim' && cine.mine) ui.cinemaAim(1 - cine.t / CINEMA.aim);
  }
  function cinemaLook() {
    if (!cine) return null;
    const scale = { aim: CINEMA.aimScale, flight: CINEMA.flightScale, wind: CINEMA.windScale, impact: CINEMA.impactScale }[cine.phase] ?? 1;
    const heat = cine.kind !== 'fire' ? 0 : cine.phase === 'aim' ? Math.min(1, cine.t / 0.6) : cine.phase === 'flight' ? Math.max(0.35, 1 - cine.t / CINEMA.flightMax) : 1;
    return { scale, heat };
  }

  function consume() {
    const me = w.me;
    for (const e of w.events) {
      view.event(e);
      audio.play(e.type);
      if (touch) buzz(e, me);
      cinema.event(e);
      if (e.type === 'goal') { ui.message(t('mac.gol', { takim: ui.teamName(e.team) }), 2.2); audio.play('boom'); view.faceBall(w); }
      if (e.type === 'lineup') view.faceBall(w);
      if (e.type === 'return' && e.id === me) view.faceBall(w);
      if (e.type === 'burn' && e.attacker === me) ui.message(t('mac.yakaladin'), 1.8);
      if (e.type === 'receive' && e.id === me) ui.message(t('mac.topSende'), 0.75);
      if (e.type === 'steal' && e.from === me && e.stun) ui.message(t('mac.kaptirdin'), 1.4);
      if (e.type === 'aimLost' && e.id === me) ui.message(t('mac.vurusYok'), 1.6);
      if (e.type === 'aimLost' && e.by === me) ui.message(t('mac.vurusEngel'), 1.6);
      if (e.type === 'overtime') ui.message(t('mac.altinGolMesaj'), 3);
    }
    w.events.length = 0;
    if (w.winner !== null && screen !== 'results') { ui.results(w); show('results'); }
  }


  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.08, (now - last) / 1000);
    last = now;
    if (active()) {
      acc += dt * cinema.scale();
      for (let n = 0; acc >= STEP && n < MAX_STEPS; n++) {
        step(w, STEP, route(input.read(view)));
        consume();
        acc -= STEP;
        if (screen) break;
      }
      if (active()) {
        tickRightHold(dt);
        cinema.tick(w, dt);
        syncCine(dt);
      }
    } else acc = 0;

    const charge = chargeState();
    const playing = active();
    const me = mine();
    ui.tickMessage(dt, w, playing);
    ui.charge(charge);
    ui.speed(playing && !cine && me.sprint > 0 && me.burn <= 0);
    input.sync(w, playing);
    const aiming = playing && view.cameraMode === 'iso' && ((w.ball.owner === w.me && !cine) || !!myAim());
    view.showAim(aiming ? view.aim(input.move(view)) : null);
    const drawDt = playing ? dt : 0;
    view.render(w, drawDt, playing, cinemaLook(), charge);
    ui.overhead(w, dt, playing, view.project);
    ui.ballMark(w, playing, view.project, view.size);
    uiClock -= dt;
    if (uiClock <= 0) { uiClock = 0.08; refresh(); }
  }

  if (testMode) {
    window.__streetFootball = { world: () => w, view: () => view, state: () => ({ screen, cine: cine?.phase }) };
  }
  show('home');
  requestAnimationFrame(frame);
}

function fitVisibleViewport(root) {
  const viewport = window.visualViewport;
  if (!viewport) return;
  const sync = () => {
    // Keep browser zoom available in menus without resizing the game in response to a pinch.
    if (Math.abs(viewport.scale - 1) > 0.01 || !viewport.width || !viewport.height) return;
    root.style.setProperty('--view-width', `${viewport.width}px`);
    root.style.setProperty('--view-height', `${viewport.height}px`);
    root.style.setProperty('--view-left', `${viewport.offsetLeft}px`);
    root.style.setProperty('--view-top', `${viewport.offsetTop}px`);
  };
  viewport.addEventListener('resize', sync);
  viewport.addEventListener('scroll', sync);
  sync();
}

const BUZZ = { kick: 18, steal: 30, receive: 12, burn: 60, goal: [70, 50, 120] };
function buzz(e, me) {
  const ms = BUZZ[e.type];
  const mine = e.type === 'goal' || e.id === me || e.from === me || e.attacker === me || e.target === me;
  if (ms && mine) try { navigator.vibrate?.(ms); } catch { /* desteklenmiyor */ }
}
