// Page entry: builds the world, plays the shot list frame by frame, draws captions, returns JPEG frames.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
const _q = new URLSearchParams(location.search); const HQ = _q.get('hq') !== '0'; const RS = Number(_q.get('rs') ?? 1); /* render scale: 3D at RS x size, overlays full-res */ const MSAA = Number(_q.get('msaa') ?? 4); const AO = _q.get('ao') === '1'; // ambient occlusion: barely visible here but doubles render time
import { buildWorld, PRESETS } from './world.js';
import { buildV3, PRESETS_V3 } from './v3.js';
import { buildV4 } from './v4.js';
import { buildStation, buildExtras, buildMirrorKit, buildWeatherKit, buildElevatorKit } from './v5.js';
Object.assign(PRESETS, PRESETS_V3);
import { buildPetKit, PRESETS_V6 } from './v6.js';
import { buildShadowKit } from './v7.js';
import { buildNameKit } from './v8.js';
Object.assign(PRESETS, PRESETS_V6);
const QS = new URLSearchParams(location.search);
import { evalCamera, applyCamera } from './camera.js';
import { Poses } from './character.js';
import { GLASS_DARK, GLASS_LIT } from './props.js';

const Wd = 1080, Ht = 1920, FPS = 30;

async function loadFonts() {
  const faces = [
    new FontFace('Montserrat', 'url(/node_modules/@fontsource/montserrat/files/montserrat-latin-900-normal.woff2)', { weight: '900' }),
    new FontFace('Fredoka', 'url(/node_modules/@fontsource/fredoka/files/fredoka-latin-700-normal.woff2)', { weight: '700' }),
    new FontFace('Special Elite', 'url(/node_modules/@fontsource/special-elite/files/special-elite-latin-400-normal.woff2)'),
  ];
  for (const f of faces) { await f.load(); document.fonts.add(f); }
  await document.fonts.ready;
}

const Vignette = {
  uniforms: { tDiffuse: { value: null }, strength: { value: 0.55 }, sat: { value: 1.12 }, flash: { value: 0 }, dark: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float strength; uniform float sat; uniform float flash; uniform float dark; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.299,0.587,0.114)); c.rgb = mix(vec3(l), c.rgb, sat);
      vec2 d = (vUv - 0.5) * vec2(1.0, 1.35); float v = 1.0 - strength * smoothstep(0.25, 0.85, length(d));
      c.rgb *= v; c.rgb += flash * vec3(1.0, 0.78, 0.35); c.rgb *= (1.0 - dark);
      gl_FragColor = c; }`,
};

export async function boot() {
  await loadFonts();
  const [shotMod, timing] = await Promise.all([
    import('/' + (QS.get('shots') || 'shots.js') + '?v=' + Date.now()),
    fetch('/' + (QS.get('timing') || 'build/timing.json') + '?v=' + Date.now()).then(r => r.json()),
  ]);
  const RW = Math.round(1080 * RS), RH = Math.round(1920 * RS);
  const canvas = document.createElement('canvas'); canvas.width = RW; canvas.height = RH;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(RW, RH, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, Wd / Ht, 0.05, 900);
  const W = buildWorld(scene);
  const shots = shotMod.shots;
  const kit = shotMod.kit || [];
  if (shotMod.v3 || shotMod.v4 || kit.length) buildV3(scene, W);
  if (shotMod.v4 || kit.includes('cast4')) buildV4(scene, W, { buttons: !!shotMod.v4 });
  if (kit.includes('station')) buildStation(scene, W);
  if (kit.length) buildExtras(scene, W, kit);
  if (kit.includes('mirror')) buildMirrorKit(scene, W);
  if (kit.includes('weather')) buildWeatherKit(scene, W);
  if (kit.includes('elevator')) buildElevatorKit(scene, W);
  if (kit.includes('pets')) buildPetKit(scene, W);
  if (kit.includes('shadow')) buildShadowKit(scene, W);
  if (kit.includes('names')) buildNameKit(scene, W);
  W.Poses = Poses; W.THREE = THREE; W.GLASS_LIT = GLASS_LIT; W.GLASS_DARKM = GLASS_DARK;

  const rt = new THREE.WebGLRenderTarget(RW, RH, { type: THREE.HalfFloatType, samples: HQ ? MSAA : 0 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  let gtao = null, bokeh = null;
  if (HQ) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
    if (AO) { gtao = new GTAOPass(scene, camera, Math.round(Wd / 3), Math.round(Ht / 3)); gtao.blendIntensity = 0.85;
    if (gtao) gtao.updateGtaoMaterial({ radius: 0.6, distanceExponent: 1.4, thickness: 1.2, scale: 1.0, samples: 6 });
    composer.addPass(gtao); }
    bokeh = new BokehPass(scene, camera, { focus: 3, aperture: 0.004, maxblur: 0.008 }); composer.addPass(bokeh);
  }
  const bloom = new UnrealBloomPass(new THREE.Vector2(RW / 2, RH / 2), 0.8, 0.5, 0.7); composer.addPass(bloom);
  const grade = new ShaderPass(Vignette); composer.addPass(grade);
  composer.addPass(new OutputPass());

  // caption overlay
  const out = document.createElement('canvas'); out.width = Wd; out.height = Ht;
  const ctx = out.getContext('2d');
  document.body.appendChild(out); out.style.width = '270px';

  let current = -1;
  const shotStarts = timing.shots.map(s => s.start);
  const total = timing.total;

  function setLighting(name, setName) {
    const p = PRESETS[name] || PRESETS.night;
    W.sky.material.uniforms.top.value.set(p.top); W.sky.material.uniforms.mid.value.set(p.mid); W.sky.material.uniforms.bottom.value.set(p.bottom);
    scene.fog = new THREE.Fog(p.fog, p.fogNear, p.fogFar);
    W.hemi.color.set(p.hemi[0]); W.hemi.groundColor.set(p.hemi[1]); W.hemi.intensity = p.hemi[2];
    W.key.color.set(p.key[0]); W.key.intensity = p.key[1]; W.fill.intensity = p.fill;
    W.stars.visible = p.stars; W.moonDisc.visible = W.moonHalo.visible = p.moon;
    if (W.clouds) W.clouds.visible = !!p.clouds;
    if (W.clouds3) W.clouds3.visible = !!p.clouds;
    bloom.strength = p.bloom[0]; bloom.radius = p.bloom[1]; bloom.threshold = p.bloom[2];
    if (HQ) renderer.toneMappingExposure = p.exposure ?? ({ interiorNight: 1.75, interiorDark: 1.7, nightTown: 1.35, night: 1.4, morning: 1.05 }[name] ?? 1.12);
    W.preset = p;
  }

  function resetWorld(shot) {
    const setName = shot.set || 'street';
    for (const [n, g] of Object.entries(W.sets)) g.visible = n === setName;
    W.activeSet = W.sets[setName]; W.setName = setName;
    for (const c of Object.values(W.chars)) { c.group.visible = false; c.setPose({}); c.setFace(c.name === 'Pell' ? 'serious' : c.name === 'Dog' ? 'dog' : 'neutral'); c.group.rotation.set(0, 0, 0); c.group.position.set(0, 0, 0); c.group.scale.set(1, 1, 1); scene.add(c.group); }
    const P = W.props;
    P.lamp.setOn(1); P.lamp.power = 1; P.clock.setTime('11:59'); P.clock.group.visible = true;
    P.window.setOpen(0); P.curtains.animate(0, 0); P.bedDoor.hinge.rotation.y = 0;
    P.frontDoor.setOpen(0); P.theoDoor.setOpen(0); P.ceiling.visible = true;
    P.mailbox.setFlag(1.5); P.mailbox.setDoor(0); grade.uniforms.sat.value = 1.12;
    for (const k of ['envelope', 'letter', 'rules', 'scrap']) { P[k].group.visible = false; P[k].group.rotation.set(0, 0, 0); scene.add(P[k].group); }
    P.lantern.group.removeFromParent(); P.heldBox.group.removeFromParent();
    P.blanket.position.set(0, 0.62, 0.38); P.blanket.scale.set(1, 1, 1);
    for (const h of W.houses) h.windows.forEach((win, i) => win.setLit(h.pattern[i] && i !== h.special));
    if (W.farDarkGlass) W.farDarkGlass.material = GLASS_DARK;
    W.cool.intensity = 0;
    W.farTown.visible = true;
    W.props.truck.visible = (shot.light || 'night') === 'day';
    W.bedWall.color.set('#86a6f2'); W.props.bed.position.y = 0;
    if (W.v3) {
      for (const c of W.crowd) { c.group.visible = false; c.setPose({}); c.group.rotation.set(0, 0, 0); scene.add(c.group); }
      for (const c of W.cars) { c.obj.position.set(...c.base); c.obj.rotation.set(0, c.rot, 0); }
      if (!W.__shopBase) W.__shopBase = W.shops.children.map(c => [c.position.clone(), c.rotation.clone()]);
      W.shops.children.forEach((c, i) => { c.position.copy(W.__shopBase[i][0]); c.rotation.copy(W.__shopBase[i][1]); });
      W.bus.obj.position.set(...W.bus.base); W.bus.obj.rotation.set(0, W.bus.rot, 0);
      for (const m of W.mailboxes3) { m.obj.position.set(...m.base); m.obj.rotation.set(0, 0, 0); }
      for (const h of W.houses3) { h.group.position.y = 0; h.group.rotation.z = 0; }
      const tp = W.chars.mayor.parts.toupee, th = W.props.toupeeHome; th.parent.add(tp); tp.position.copy(th.pos); tp.rotation.set(0, 0, 0); tp.scale.setScalar(1); tp.visible = true;
      W.tower.key.visible = true; W.tower.key.rotation.set(0, 0, 0); W.tower.setTime(11, 59); W.tower.setDigital('11:59:00');
      W.bigKey.visible = true; W.bigKey.rotation.z = 0; W.gears.forEach(g => (g.obj.rotation.z = 0));
      W.fountain.jet.scale.set(1, 1, 1); W.fountain.water.visible = true; W.siren.light.visible = true;
      for (const k of ['balloon', 'keyProp', 'neckKey']) { const o = W.props[k].group || W.props[k]; o.removeFromParent(); o.visible = true; o.rotation.set(0, 0, 0); }
      if (W.__blobs) W.__blobs.forEach(b => (b.visible = false));
      for (const k of ['remote', 'snow', 'tornado', 'rainbow']) if (W.props[k]) W.props[k].group.removeFromParent();
      W.frozen = false;
      if (W.elevator) { W.elevator.setOpen(0); W.elevator.setFloor('2'); W.lobbyDoors.forEach((d, i) => { d.setOpen(0); d.setFloor(['54', '2', '?'][i], i === 2 ? '#ff3b4e' : '#ffb020'); }); W.elevLight.color.set('#fff1d6'); W.lobbyLight.color.set('#fff1d6'); }
      if (W.props.mirror) { W.props.mirror.group.removeFromParent(); W.props.mirror.setBlank(false); W.props.mirror.setRipple(0, 0); W.props.diningGlass.pane.scale.set(1, 1, 1); W.props.diningGlass.mat.color.set('#cfe8ff'); }
      if (W.pods) { W.pods.forEach(p => p.setColor('#38e07b')); W.setStationScreen(['CHARGING', 'sleep well, citizens']); W.alarms.forEach(a => a.material.color.set('#552222')); W.stationAmb.color.set('#7fa8ff'); }
      if (W.v4) {
        for (const c of [...Object.values(W.chars), ...W.crowd]) if (c.button) c.button.set('off');
        W.papers.scale.set(1, 1, 1); W.papers.visible = true; W.setBoard(['2x + 7 = 19']);
        const ck = W.props.cake.group; ck.removeFromParent();
      }
    }
    if (W.resetPets) W.resetPets();
    if (W.resetHooks) W.resetHooks.forEach(f => f());
    setLighting(shot.light || 'night', setName);
    if (shot.fog) scene.fog = new THREE.Fog(...shot.fog);
    if (W.bigKey && shot.noKey) W.bigKey.visible = false;
    // moon/key light direction relative to set
    const dir = new THREE.Vector3(...(shot.moonDir || (setName === 'street' ? [-0.35, 0.55, -1] : [0.25, 0.75, -1]))).normalize();
    W.moonDirection = dir;
    W.shadowSize = shot.shadowSize || (setName === 'street' ? 30 : 7);
    const sc = W.key.shadow.camera; sc.left = -W.shadowSize; sc.right = W.shadowSize; sc.top = W.shadowSize; sc.bottom = -W.shadowSize; sc.updateProjectionMatrix();
    grade.uniforms.flash.value = 0; grade.uniforms.dark.value = 0; grade.uniforms.strength.value = HQ ? 0.4 : 0.55;
  }

  // helpers available to shots
  const v3 = new THREE.Vector3();
  W.put = (obj, pos = [0, 0, 0], rotY = 0) => {
    const o = obj.group || obj; W.activeSet.add(o); o.visible = true;
    o.position.set(...pos); o.rotation.set(0, rotY, 0); return obj;
  };
  W.hold = (char, prop, joint = 'wristR', offset = [0, -0.18, 0], rot = [0, 0, 0]) => {
    const o = prop.group || prop; o.visible = true; char.attach(o, joint, offset); o.rotation.set(...rot); return prop;
  };
  W.grade = grade; W.bloom = bloom;
  // set-local position of a point on an object
  W.localPos = (obj, off = [0, 0, 0]) => { const o = obj.group || obj; o.updateMatrixWorld(true); const p = o.localToWorld(new THREE.Vector3(...off)); return W.activeSet.worldToLocal(p).toArray(); };
  W.worldPt = (p) => { W.activeSet.updateMatrixWorld(); return W.activeSet.localToWorld(new THREE.Vector3(...p)); };
  W.reach = (char, side, p) => char.reach(side, W.worldPt(p));
  W.keepUpright = (obj) => { const o = obj.group || obj; o.parent.updateMatrixWorld(true); const q = new THREE.Quaternion(); o.parent.getWorldQuaternion(q); o.quaternion.copy(q.invert()); };
  W.cool = new THREE.PointLight('#8fb0ff', 0, 0, 1.6); scene.add(W.cool);
  W.coolAt = (p, intensity = 3) => { W.cool.position.copy(W.worldPt(p)); W.cool.intensity = intensity; };

  function placeLights(look) {
    const set = W.activeSet; set.updateMatrixWorld();
    const tgt = set.localToWorld(v3.set(...look)).clone();
    W.key.target.position.copy(tgt);
    W.key.position.copy(tgt).addScaledVector(W.moonDirection, 80);
    W.fill.target.position.copy(tgt); W.fill.position.copy(tgt).add(new THREE.Vector3(30, 20, 60));
    W.skyRig.position.copy(camera.position);
    const md = W.moonDirection;
    W.moonDisc.position.copy(md).multiplyScalar(380); W.moonDisc.lookAt(0, 0, 0);
    W.moonHalo.position.copy(md).multiplyScalar(385); W.moonHalo.lookAt(0, 0, 0);
  }

  function drawCaption(time) {
    const word = timing.words.find(wd => time >= wd.start && time < wd.end);
    if (!word) return;
    const age = time - word.start;
    const pop = 1 + 0.22 * Math.max(0, 1 - age / 0.09);
    let size = 104;
    ctx.save();
    const CF = s => `700 ${s}px Fredoka`;
    ctx.font = CF(size);
    const text = word.text.replace(/^["'“”]+|["'“”]+$/g, '');
    const maxW = 760; // keeps clear of right edge
    let wTxt = ctx.measureText(text).width;
    if (wTxt > maxW) { size = Math.floor(size * maxW / wTxt); ctx.font = CF(size); wTxt = ctx.measureText(text).width; }
    const cx = Wd * 0.47, cy = Ht * 0.71;
    ctx.translate(cx, cy); ctx.scale(pop, pop);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 14; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 7;
    ctx.lineWidth = size * 0.15; ctx.strokeStyle = '#2a1d08'; ctx.strokeText(text, 0, 0);
    ctx.shadowColor = 'transparent';
    const gr = ctx.createLinearGradient(0, -size * 0.45, 0, size * 0.45); gr.addColorStop(0, word.color || '#f7ff5c'); gr.addColorStop(1, word.color || '#e6f02a');
    ctx.fillStyle = gr; ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  // ---------- HUD overlays (game-style labels) ----------
  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };
  const warnIcon = (x, y, s, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 1.1, y + s * 0.8); ctx.lineTo(x - s * 1.1, y + s * 0.8); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#000'; ctx.font = `900 ${s * 1.2}px Montserrat`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', x, y + s * 0.15); };
  const projV = new THREE.Vector3();
  function drawHUD(shot, t, u) {
    const items = (shot.hud || []).flatMap(h0 => { const r = typeof h0 === 'function' ? h0(t, u, W) : h0; return Array.isArray(r) ? r : [r]; });
    for (const h of items) {
      if (!h || (h.from != null && u < h.from) || (h.to != null && u > h.to)) continue;
      const age = t - (h.from != null ? h.from * timing.shots[current].dur : 0);
      const pop = 1 + 0.25 * Math.max(0, 1 - age / 0.12);
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (h.type === 'counter') {
        const cx = Wd * 0.47, cy = h.y || 190; ctx.translate(cx, cy); const pulse = h.pulse ? 1 + 0.06 * Math.sin(t * 18) : 1; ctx.scale(pop * pulse, pop * pulse);
        rr(-280, -82, 560, 164, 26); ctx.fillStyle = 'rgba(16,14,28,0.92)'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = h.border || '#ffcf3a'; ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.font = '900 36px Montserrat'; ctx.fillText(h.label, 0, -38);
        ctx.fillStyle = h.color || '#ffe14a'; ctx.font = '900 84px Montserrat'; ctx.fillText(h.value, 0, 30);
      } else if (h.type === 'badge') {
        const ok = h.kind === 'ok', col = ok ? '#38e07b' : '#ff3b4e';
        ctx.font = '900 40px Montserrat'; const w = ctx.measureText(h.text).width + 110;
        const blink = ok ? 1 : (0.65 + 0.35 * Math.abs(Math.sin(t * 6)));
        ctx.translate(Wd * 0.47, h.y || 86); ctx.scale(pop, pop); ctx.globalAlpha = blink;
        rr(-w / 2, -36, w, 72, 36); ctx.fillStyle = 'rgba(20,10,16,0.88)'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke();
        if (ok) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(-w / 2 + 40, 0, 14, 0, 7); ctx.fill(); } else warnIcon(-w / 2 + 40, 0, 16, col);
        ctx.fillStyle = '#ffffff'; ctx.fillText(h.text, 22, 2);
      } else if (h.type === 'tag') {
        const ch = h.obj || W.chars[h.char]; if (!ch || !ch.group.visible) { ctx.restore(); continue; }
        ch.group.updateMatrixWorld(true);
        projV.set(0, h.at != null ? (ch.height || 1.2) / (ch.scale || 1) * h.at : (ch.height || 1.2) / (ch.scale || 1) + 0.35, 0); (ch.body || ch.group).localToWorld(projV); projV.project(camera);
        if (projV.z > 1) { ctx.restore(); continue; }
        let x = (projV.x * 0.5 + 0.5) * Wd, y = (-projV.y * 0.5 + 0.5) * Ht;
        if (h.at == null) { x = Math.min(Wd * 0.72, Math.max(Wd * 0.18, x)); y = Math.max(300, Math.min(Ht * 0.55, y)); } else if (x < 0 || x > Wd || y < 0 || y > Ht) { ctx.restore(); continue; }
        ctx.font = '900 46px Montserrat'; const w = ctx.measureText(h.text).width + 90;
        ctx.translate(x, y); ctx.scale(pop, pop);
        rr(-w / 2, -34, w, 68, 18); ctx.fillStyle = 'rgba(25,22,40,0.85)'; ctx.fill();
        ctx.fillStyle = h.color || '#7fd3ff'; ctx.beginPath(); ctx.arc(-w / 2 + 36, -6, 10, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(-w / 2 + 36, 18, 16, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillText(h.text, 22, 2);
      } else if (h.type === 'battery') {
        const ch = h.obj || W.chars[h.char]; if (!ch || !ch.group.visible) { ctx.restore(); continue; }
        ch.group.updateMatrixWorld(true); projV.set(0, (ch.height || 1.2) / (ch.scale || 1) + 0.45, 0); (ch.body || ch.group).localToWorld(projV); projV.project(camera);
        if (projV.z > 1) { ctx.restore(); continue; }
        const x = (projV.x * 0.5 + 0.5) * Wd, y = (-projV.y * 0.5 + 0.5) * Ht, s = h.size || 1;
        if (x < -100 || x > Wd + 100 || y < -100 || y > Ht + 100) { ctx.restore(); continue; }
        const lv = Math.max(0, Math.min(100, h.level)), col = h.color || (lv > 50 ? '#38e07b' : lv > 20 ? '#ffc928' : '#ff3b4e');
        ctx.translate(x, y); ctx.scale(s * pop, s * pop);
        rr(-80, -32, 150, 64, 14); ctx.fillStyle = 'rgba(15,15,25,0.85)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff'; ctx.stroke();
        rr(72, -12, 12, 24, 4); ctx.fillStyle = '#ffffff'; ctx.fill();
        rr(-72, -24, 134 * lv / 100, 48, 8); ctx.fillStyle = col; ctx.fill();
        ctx.font = '700 34px Fredoka'; ctx.fillStyle = '#ffffff'; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(Math.round(lv) + '%', -5, 2); ctx.fillText(Math.round(lv) + '%', -5, 2);
      } else if (h.type === 'text') {
        ctx.translate(h.x ?? Wd * 0.47, h.y || 300); ctx.scale(pop, pop); if (h.rot) ctx.rotate(h.rot); if (h.alpha != null) ctx.globalAlpha = h.alpha;
        ctx.font = `900 ${h.size || 70}px Montserrat`; ctx.lineJoin = 'round'; ctx.lineWidth = 16; ctx.strokeStyle = '#000'; ctx.strokeText(h.text, 0, 0); ctx.fillStyle = h.color || '#fff'; ctx.fillText(h.text, 0, 0);
      }
      ctx.restore();
    }
  }

  function renderTime(time, { captions = true } = {}) {
    let i = shotStarts.findLastIndex(s => s <= time + 1e-6); if (i < 0) i = 0;
    const shot = shots[i], st = timing.shots[i];
    if (i !== current) { resetWorld(shot); shot.setup && shot.setup(W); current = i; }
    const t = time - st.start, u = Math.min(1, t / st.dur);
    shot.update && shot.update(W, t, u);
    const c = evalCamera(shot.cam, t, u, W);
    applyCamera(camera, c, time, W.activeSet);
    placeLights(c.look);
    if (bokeh) {
      const dist = camera.position.distanceTo(W.activeSet.localToWorld(new THREE.Vector3(...c.look)));
      const dof = shot.dof ?? (dist < 4.5 && !shot.noDof && !c.noDof);
      bokeh.enabled = !!dof;
      if (dof) { bokeh.uniforms.focus.value = dist; bokeh.uniforms.aperture.value = (typeof dof === 'number' ? dof : 0.0045) * (2.5 / Math.max(1, dist)); }
    }
    composer.render();
    ctx.imageSmoothingQuality = 'high'; ctx.drawImage(canvas, 0, 0, Wd, Ht);
    drawHUD(shot, t, u);
    if (captions) drawCaption(time);
    return out;
  }

  window.__frameCount = Math.round(total * FPS);
  window.__total = total;
  // one 3D render -> [clean frame (no captions), captioned frame]
  window.renderFrameBoth = (f) => { renderTime(f / FPS, { captions: false }); const clean = out.toDataURL('image/jpeg', 0.93); drawCaption(f / FPS); return [clean, out.toDataURL('image/jpeg', 0.93)]; };
  window.renderFrameJpeg = (f, captions = true) => { renderTime(f / FPS, { captions }); return out.toDataURL('image/jpeg', 0.93); };
  window.renderShotAt = (i, u) => { const st = timing.shots[i]; current = -1; renderTime(st.start + Math.min(st.dur - 1 / FPS, u * st.dur)); return out.toDataURL('image/jpeg', 0.9); };
  window.__W = W;
  window.__ready = true;
}

boot().catch(e => { window.__error = String(e && e.stack || e); console.error(e); });
