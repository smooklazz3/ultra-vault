import { ENERGY, TOUCH } from './config.js';

/**
 * Dokunmatik kontroller (yalnızca tarayıcı; telefon, tablet ve Android uygulaması). Çoklu dokunuş pointer olaylarıyla
 * izlenir, her parmak ayrı iş görür:
 * - Sol yarı: parmağın değdiği yerde beliren **joystick** (hareket, analog). Sonuna kadar itip biraz tutunca hızlı koşu.
 * - Sağ yarı: parmak kaydırmak **bakış / nişan** (farenin karşılığı).
 * - Sağ alttaki düğmeler: ŞUT (sol tık: dokun şut, basılı tut rüzgar), PAS (sağ tık: top sendeyken dokun pas, basılı tut
 *   yakar pas nişanı; topsuzken KAY), ZIPLA (Boşluk), KOŞ (Shift). Düğmeye basılıyken parmağı kaydırmak da nişan alır:
 *   rüzgar dolarken ya da yakar pas nişanında başparmak düğmeden kalkmadan hedefi çevirir.
 * Girdi input.js'e `sink` üzerinden akar (down / up / look); joystick ve kendiliğinden koşu `poll` ile okunur.
 */
export const touchDevice = () => new URLSearchParams(location.search).has('touch') || matchMedia('(pointer: coarse)').matches;

export function createTouch(root, sink) {
  const $ = id => root.querySelector('#yg-' + id);
  const el = { pad: $('touch'), stick: $('stick'), knob: $('stick').firstElementChild, pass: $('t-pass'), shoot: $('t-shoot'), sprint: $('t-sprint') };
  const fingers = new Map();
  let axis = { x: 0, z: 0 };

  const setStick = (x, z) => {
    const d = Math.hypot(x, z), k = d < TOUCH.dead ? 0 : Math.min(1, (d - TOUCH.dead) / (1 - TOUCH.dead)) / (d || 1);
    axis = { x: x * k, z: z * k };
  };

  function padPoint(e) {
    const rect = el.pad.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * el.pad.clientWidth / rect.width,
      y: (e.clientY - rect.top) * el.pad.clientHeight / rect.height,
    };
  }

  function down(e) {
    const target = e.target.closest('[data-t]');
    if (!target) return;
    e.preventDefault();
    const kind = target.dataset.t;
    if ([...fingers.values()].some(f => f.kind === kind)) return;
    const { x, y } = padPoint(e);
    const f = { kind, x, y, target };
    try { target.setPointerCapture?.(e.pointerId); } catch { /* The platform already cancelled the pointer. */ }
    if (kind === 'stick') {
      el.stick.hidden = false;
      el.stick.style.transform = `translate(${x}px,${y}px)`;
      el.knob.style.transform = '';
      setStick(0, 0);
    } else if (kind !== 'look') {
      target.classList.add('on');
      sink.down(kind);
    }
    fingers.set(e.pointerId, f);
  }

  function move(e) {
    const f = fingers.get(e.pointerId);
    if (!f) return;
    e.preventDefault();
    const { x, y } = padPoint(e);
    if (f.kind === 'stick') {
      let dx = x - f.x, dy = y - f.y;
      const d = Math.hypot(dx, dy);
      if (d > TOUCH.stick) { dx *= TOUCH.stick / d; dy *= TOUCH.stick / d; }
      el.knob.style.transform = `translate(${dx}px,${dy}px)`;
      setStick(dx / TOUCH.stick, dy / TOUCH.stick);
      return;
    }
    sink.look((x - f.x) * TOUCH.look, (y - f.y) * TOUCH.look);
    f.x = x; f.y = y;
  }

  function finish(id, cancelled) {
    const f = fingers.get(id);
    if (!f) return;
    fingers.delete(id);
    if (f.kind === 'stick') { el.stick.hidden = true; setStick(0, 0); }
    else if (f.kind !== 'look') {
      f.target.classList.remove('on');
      if (cancelled) sink.cancel(f.kind);
      else sink.up(f.kind);
    }
    if (f.target.hasPointerCapture?.(id)) f.target.releasePointerCapture(id);
  }

  el.pad.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', e => finish(e.pointerId, false));
  window.addEventListener('pointercancel', e => finish(e.pointerId, true));
  el.pad.addEventListener('lostpointercapture', e => finish(e.pointerId, true));

  return {
    /** Joystick yönü (x sağ, z geri; 0-1 analog); tüketmez. */
    axis: () => axis,
    /** Joystick yönü (x sağ, z geri; 0-1 analog). Hızlı koşu yalnız KOŞ düğmesiyle (joystick kendiliğinden koşturmaz). */
    poll() { return { ...axis, sprint: false }; },
    /** Bütün parmakları bırakır (mola, ekran değişimi). */
    clear() {
      for (const id of fingers.keys()) finish(id, true);
    },
    /** Düğme yazıları ve enerji dolumu: topsuzken PAS düğmesi KAY, ŞUT düğmesi PAS İSTE olur. */
    sync(w, visible) {
      el.pad.hidden = !visible;
      if (!visible) return;
      const p = w.players[w.me], owns = w.ball.owner === w.me, cd = Math.min(1, p.energyCd / ENERGY.cooldown).toFixed(3);
      el.pass.classList.toggle('dash', !owns);
      el.shoot.classList.toggle('call', !owns);
      el.pass.style.setProperty('--cd', owns ? 0 : cd);
      el.sprint.style.setProperty('--cd', cd);
    },
  };
}

export const fullscreenOn = () => !!document.fullscreenElement;
export const fullscreenSupported = () => !!document.documentElement.requestFullscreen && document.fullscreenEnabled !== false;

export async function toggleFullscreen() {
  if (!fullscreenSupported()) return false;
  try {
    if (fullscreenOn()) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    return true;
  } catch {
    return false;
  }
}
