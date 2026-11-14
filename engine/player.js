// Page entry: builds the world, plays the shot list frame by frame, draws captions, returns JPEG frames.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildWorld, PRESETS } from './world.js';
import { evalCamera, applyCamera } from './camera.js';
import { Poses } from './character.js';
import { GLASS_DARK, GLASS_LIT } from './props.js';

const Wd = 1080, Ht = 1920, FPS = 30;

async function loadFonts() {
  const faces = [
    new FontFace('Montserrat', 'url(/node_modules/@fontsource/montserrat/files/montserrat-latin-900-normal.woff2)', { weight: '900' }),
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
  const [{ shots }, timing] = await Promise.all([
    import('/shots.js?v=' + Date.now()),
    fetch('/build/timing.json?v=' + Date.now()).then(r => r.json()),
  ]);
  const canvas = document.createElement('canvas'); canvas.width = Wd; canvas.height = Ht;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(Wd, Ht, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, Wd / Ht, 0.05, 900);
  const W = buildWorld(scene);
  W.Poses = Poses; W.THREE = THREE; W.GLASS_LIT = GLASS_LIT;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(Wd / 2, Ht / 2), 0.8, 0.5, 0.7); composer.addPass(bloom);
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
    bloom.strength = p.bloom[0]; bloom.radius = p.bloom[1]; bloom.threshold = p.bloom[2];
    W.preset = p;
  }

  function resetWorld(shot) {
    const setName = shot.set || 'street';
    for (const [n, g] of Object.entries(W.sets)) g.visible = n === setName;
    W.activeSet = W.sets[setName]; W.setName = setName;
    for (const c of Object.values(W.chars)) { c.group.visible = false; c.setPose({}); c.setFace(c.name === 'Pell' ? 'serious' : 'neutral'); c.group.rotation.set(0, 0, 0); scene.add(c.group); }
    const P = W.props;
    P.lamp.setOn(1); P.lamp.power = 1; P.clock.setTime('11:59'); P.clock.group.visible = true;
    P.window.setOpen(0); P.curtains.animate(0, 0); P.bedDoor.hinge.rotation.y = 0;
    P.frontDoor.setOpen(0); P.theoDoor.setOpen(0); P.ceiling.visible = true;
    for (const k of ['envelope', 'letter']) { P[k].group.visible = false; P[k].group.rotation.set(0, 0, 0); scene.add(P[k].group); }
    P.lantern.group.removeFromParent(); P.heldBox.group.removeFromParent();
    P.blanket.position.set(0, 0.62, 0.38); P.blanket.scale.set(1, 1, 1);
    for (const h of W.houses) h.windows.forEach((win, i) => win.setLit(h.pattern[i] && i !== h.special));
    if (W.farDarkGlass) W.farDarkGlass.material = GLASS_DARK;
    W.cool.intensity = 0;
    W.farTown.visible = true;
    setLighting(shot.light || 'night', setName);
    if (shot.fog) scene.fog = new THREE.Fog(...shot.fog);
    // moon/key light direction relative to set
    const dir = new THREE.Vector3(...(shot.moonDir || (setName === 'street' ? [-0.35, 0.55, -1] : [0.25, 0.75, -1]))).normalize();
    W.moonDirection = dir;
    W.shadowSize = shot.shadowSize || (setName === 'street' ? 30 : 7);
    const sc = W.key.shadow.camera; sc.left = -W.shadowSize; sc.right = W.shadowSize; sc.top = W.shadowSize; sc.bottom = -W.shadowSize; sc.updateProjectionMatrix();
    grade.uniforms.flash.value = 0; grade.uniforms.dark.value = 0; grade.uniforms.strength.value = 0.55;
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
    let size = 112;
    ctx.save();
    ctx.font = `900 ${size}px Montserrat`;
    const text = word.text.toUpperCase();
    const maxW = 760; // keeps clear of right edge
    let wTxt = ctx.measureText(text).width;
    if (wTxt > maxW) { size = Math.floor(size * maxW / wTxt); ctx.font = `900 ${size}px Montserrat`; wTxt = ctx.measureText(text).width; }
    const cx = Wd * 0.46, cy = Ht * 0.68;
    ctx.translate(cx, cy); ctx.scale(pop, pop);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 9;
    ctx.lineWidth = size * 0.24; ctx.strokeStyle = '#000'; ctx.strokeText(text, 0, 0);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = word.color || '#ffffff'; ctx.fillText(text, 0, 0);
    ctx.restore();
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
    composer.render();
    ctx.drawImage(canvas, 0, 0);
    if (captions) drawCaption(time);
    return out;
  }

  window.__frameCount = Math.round(total * FPS);
  window.__total = total;
  window.renderFrameJpeg = (f, captions = true) => { renderTime(f / FPS, { captions }); return out.toDataURL('image/jpeg', 0.93); };
  window.renderShotAt = (i, u) => { const st = timing.shots[i]; current = -1; renderTime(st.start + Math.min(st.dur - 1 / FPS, u * st.dur)); return out.toDataURL('image/jpeg', 0.9); };
  window.__ready = true;
}

boot().catch(e => { window.__error = String(e && e.stack || e); console.error(e); });
