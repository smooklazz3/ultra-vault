import * as T from 'three';
import { GOAL_BLAST, TOUCH } from '../config.js';
import { t } from '../dil.js';
import { createActor, syncActors } from './actors.js';
import { createBallView, syncBall, topKalkisi } from './ballview.js';
import { createShoulderCamera } from './camera.js?v=screen-fit';
import { createEffects } from './effects.js';
import { buildPitch } from './pitch.js';

/** Render a match and its effects in the available game area. */
export function createView(container, { mobile = false } = {}) {
  const renderer = new T.WebGLRenderer({ antialias: !mobile || devicePixelRatio < 2, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? TOUCH.pixelRatio : 1.5));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = mobile ? T.PCFShadowMap : T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-label', t('saha.aria'));
  container.insertBefore(renderer.domElement, container.firstChild);

  const scene = new T.Scene();
  scene.background = new T.Color('#e4d5b3');
  scene.add(new T.HemisphereLight('#fff0d0', '#768b86', 2.6));
  const sun = new T.DirectionalLight('#ffe1b0', 3.2);
  sun.position.set(-25, 55, 20); sun.castShadow = true;
  sun.shadow.mapSize.setScalar(mobile ? TOUCH.shadow : 2048); sun.shadow.normalBias = 0.04;
  Object.assign(sun.shadow.camera, { left: -72, right: 72, top: 72, bottom: -72, near: 1, far: 200 });
  scene.add(sun);

  buildPitch(scene);
  const labels = container.querySelector('#yg-labels');
  const actors = Array.from({ length: 10 }, (_, id) => createActor(scene, labels, id));
  const ball = createBallView(scene);
  const effects = createEffects(scene);
  const shoulder = createShoulderCamera();
  let time = 0, real = 0, aimAt = null;
  // İzometrik nişan oku: oyuncunun ayağından nişan yönüne yassı bir ok.
  const arrow = new T.Group(), arrowMat = new T.MeshBasicMaterial({ color: '#fff3c4', transparent: true, opacity: 0.9, depthWrite: false, depthTest: false });
  const shaft = new T.Mesh(new T.PlaneGeometry(0.22, 3.2), arrowMat), head = new T.Mesh(new T.CircleGeometry(0.55, 3), arrowMat);
  shaft.rotation.x = head.rotation.x = -Math.PI / 2; shaft.position.z = 2.4; head.position.z = 4.2; head.rotation.z = Math.PI / 2;
  arrow.add(shaft, head); arrow.visible = false; arrow.renderOrder = 5; shaft.renderOrder = head.renderOrder = 5; scene.add(arrow);

  let size = { width: 0, height: 0 };
  const resize = () => {
    const { clientWidth: width, clientHeight: height } = container;
    if (!width || !height || (size.width === width && size.height === height)) return;
    size = { width, height };
    renderer.setSize(width, height, false);
    shoulder.resize(width, height);
  };
  resize();
  new ResizeObserver(resize).observe(container);

  return {
    canvas: renderer.domElement,
    get size() { return size; },
    get camera() { return shoulder.camera; },
    get cameraMode() { return shoulder.mode; },
    setCamera: mode => shoulder.setMode(mode),
    faceBall: w => shoulder.faceBall(w),
    look: (dx, dy) => shoulder.look(dx, dy),
    point: (x, y) => {
      const bounds = container.getBoundingClientRect();
      shoulder.point(x - bounds.left, y - bounds.top);
    },
    aim: move => shoulder.aim(move),
    /** İzometrik nişan oku bu karede nereyi göstersin (null: gizli). */
    showAim: at => { aimAt = at; },
    movement: (x, z) => shoulder.movement(x, z),
    project: (x, y, z) => shoulder.project(x, y, z),
    event: e => { effects.spawn(e); if (e.type === 'goal') shoulder.shake(GOAL_BLAST.shake); },
    render(w, dt, playing, cine = null, charge = null) {
      const scale = cine?.scale ?? 1;
      time += dt * scale; real += dt;
      const hero = w.players[w.me];
      shoulder.follow(hero, dt);
      syncActors(actors, w, time, playing, shoulder.project, real, shoulder.mode === 'iso');
      syncBall(ball, w.ball, real, dt * scale, cine ? cine.heat : 0, w.ball.owner === w.me ? charge : null, topKalkisi(w));
      effects.update(cine ? dt * Math.max(scale, 0.3) : dt);
      arrow.visible = !!aimAt && shoulder.mode === 'iso' && hero.burn <= 0;
      if (arrow.visible) { arrow.position.set(hero.x, 0.2, hero.z); arrow.rotation.y = Math.atan2(aimAt.x - hero.x, aimAt.z - hero.z); }
      renderer.render(scene, shoulder.camera);
    },
  };
}
