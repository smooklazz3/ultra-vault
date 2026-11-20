/**
 * Kısa sentez sesler (dosya yok): şut, yanma, gol ve rüzgar. Tarayıcı ilk kullanıcı hareketinden önce ses açtırmaz;
 * bağlam ilk seste kurulur, hata olursa sessiz kalır.
 * Aç / kapa ayarı tarayıcıda kalır (localStorage "yg.sound").
 */
const TONES = {
  kick: [380, 120],
  burn: [160, 120],
  goal: [650, 920],
  blow: [520, 260],
  ignite: [180, 980],
  impact: [120, 60],
  boom: [90, 40],
  call: [880, 660],
};

export function createAudio() {
  let context = null, enabled = true;
  try { enabled = localStorage.getItem('ultra-vault-street-football-sound') !== 'off'; } catch { /* yok */ }
  function unlock() {
    if (!enabled) return;
    try {
      context ??= new (window.AudioContext || window.webkitAudioContext)();
      if (context.state === 'suspended') context.resume().catch(() => {});
    } catch { /* Audio is optional on unsupported devices. */ }
  }
  return {
    unlock,
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      try { localStorage.setItem('ultra-vault-street-football-sound', enabled ? 'on' : 'off'); } catch { /* yok */ }
      unlock();
      return enabled;
    },
    play(type) {
      const tone = TONES[type];
      if (!enabled || !tone) return;
      try {
        if (!context || context.state !== 'running') return;
        const o = context.createOscillator(), g = context.createGain(), t = context.currentTime;
        o.frequency.setValueAtTime(tone[0], t);
        o.frequency.exponentialRampToValueAtTime(tone[1], t + 0.18);
        g.gain.setValueAtTime(0.045, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.23);
        o.connect(g); g.connect(context.destination);
        o.start(); o.stop(t + 0.24);
      } catch { /* ses yok */ }
    },
  };
}
