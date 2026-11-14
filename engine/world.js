// World: town street, wider town, bedroom, hallway, lighting presets, cast.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeCharacter, makeDog } from './character.js';
import {
  std, basic, rb, box, mesh, canvasTex, makeLamp, makeClock, makeEnvelope, makeLetter, makeDoor, makeSign,
  makeLantern, makeSack, makeMovingBox, makeCurtain, makeHouse, makeTree, makeMailbox, GLASS_DARK, GLASS_LIT, makePicketFence, makeCloud, makeTower, makeRulesPaper, makeScrap, makeTruck, makeFlagMailbox,
} from './props.js';

// Merge all static meshes of a group into one mesh per material (fewer draw calls).
function mergeStatic(group, { cast = true } = {}) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const byMat = new Map();
  group.traverse(o => {
    if (!o.isMesh) return;
    const g = o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    const ng = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(ng.attributes)) if (!['position', 'normal', 'uv'].includes(k)) ng.deleteAttribute(k);
    if (!ng.attributes.uv) ng.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(ng.attributes.position.count * 2), 2));
    ng.clearGroups();
    if (!byMat.has(o.material)) byMat.set(o.material, []);
    byMat.get(o.material).push(ng);
  });
  const out = new THREE.Group();
  for (const [m, geos] of byMat) {
    const mm = new THREE.Mesh(mergeGeometries(geos), m);
    mm.castShadow = cast && !m.isMeshBasicMaterial; mm.receiveShadow = true; out.add(mm);
  }
  return out;
}

function skyDome() {
  const geo = new THREE.SphereGeometry(450, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#050a24') }, mid: { value: new THREE.Color('#122a6b') }, bottom: { value: new THREE.Color('#1b3f8f') } },
    vertexShader: 'varying vec3 vp; void main(){ vp = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vp;
      void main(){ float h = vp.y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.55, h)) : mix(mid, bottom, smoothstep(0.0, -0.3, h));
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(geo, mat); m.renderOrder = -10; m.frustumCulled = false;
  return m;
}

function stars() {
  const n = 900, pos = new Float32Array(n * 3);
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < n; i++) {
    const th = rnd() * Math.PI * 2, y = 0.08 + rnd() * 0.92, r = Math.sqrt(1 - y * y);
    pos.set([Math.cos(th) * r * 420, y * 420, Math.sin(th) * r * 420], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: '#cfe0ff', size: 2.2, sizeAttenuation: false, fog: false }));
  p.frustumCulled = false;
  return p;
}

export function buildWorld(scene) {
  const W = { scene, sets: {}, chars: {}, props: {}, anim: [] };

  // ---------- global sky / lights ----------
  const skyRig = new THREE.Group(); scene.add(skyRig);
  const sky = skyDome(); skyRig.add(sky);
  const starField = stars(); skyRig.add(starField);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(16, 40), new THREE.MeshBasicMaterial({ color: '#eaf1ff', fog: false }));
  const moonHalo = new THREE.Mesh(new THREE.CircleGeometry(34, 40), new THREE.MeshBasicMaterial({ color: '#6f8fe0', transparent: true, opacity: 0.22, fog: false, depthWrite: false }));
  skyRig.add(moon); skyRig.add(moonHalo);
  W.sky = sky; W.stars = starField; W.moonDisc = moon; W.skyRig = skyRig; W.moonHalo = moonHalo;

  const hemi = new THREE.HemisphereLight('#6f8cff', '#0b1430', 0.9); scene.add(hemi);
  const key = new THREE.DirectionalLight('#9db6ff', 1.6);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0008; key.shadow.normalBias = 0.03;
  key.shadow.camera.near = 1; key.shadow.camera.far = 220;
  scene.add(key); scene.add(key.target);
  const fill = new THREE.DirectionalLight('#5a6cff', 0.35); scene.add(fill); scene.add(fill.target);
  W.hemi = hemi; W.key = key; W.fill = fill;

  // ---------- STREET / TOWN (origin) ----------
  const street = new THREE.Group(); street.name = 'street'; scene.add(street); W.sets.street = street;
  const ground = mesh(new THREE.PlaneGeometry(600, 600), std('#5cc95a', { roughness: 0.95 }), 0, 0, 0, street, { cast: false });
  ground.rotation.x = -Math.PI / 2;
  const roadMat = std('#4a505e', { roughness: 0.9 }), walkMat = std('#dfe3ea', { roughness: 0.9 });
  const roads = new THREE.Group(); street.add(roads);
  for (const rx of [0, 36, -36]) {
    mesh(box(7, 0.06, 260), roadMat, rx, 0.03, -50, roads, { cast: false });
    for (const s of [1, -1]) mesh(box(2, 0.12, 260), walkMat, rx + s * 4.5, 0.06, -50, roads, { cast: false });
    for (let z = -178; z < 80; z += 6) mesh(box(0.25, 0.07, 2.6), std('#ffffff'), rx, 0.04, z, roads, { cast: false });
    for (const cz of [-86, 26]) for (let k = -3; k <= 3; k++) mesh(box(0.7, 0.07, 3.0), std('#ffffff'), rx + k * 0.95, 0.045, cz, roads, { cast: false });
  }
  for (const cz of [-90, 30]) mesh(box(80, 0.065, 7), roadMat, 0, 0.035, cz, roads, { cast: false });

  // main street houses (individually controllable windows)
  const houses = []; let seed = 0;
  const mainHouses = new THREE.Group(); street.add(mainHouses);
  for (let z = -140; z <= 50; z += 10) {
    if (z === 30 || z === -90) continue;
    for (const side of [-1, 1]) {
      seed++;
      const pattern = [[true, false, false, true], [false, true, true, false], [true, true, false, false], [false, false, true, false], [true, false, true, true]][seed % 5];
      const special = side === 1 && z === -10 ? 2 : -1;
      const h = makeHouse({ seed, lit: pattern, specialWindow: special });
      h.group.position.set(side * 12, 0, z);
      h.group.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;
      mainHouses.add(h.group);
      h.side = side; h.z = z; h.special = special; h.pattern = pattern;
      houses.push(h);
      // yard extras
      if (!(side === 1 && z > -22 && z < 2)) { const t = makeTree(seed, 0.95); t.position.set(side * 9.2, 0, z + 5); mainHouses.add(t); }
      for (const [z0, z1] of [[z - 3.4, z - 0.9], [z + 0.9, z + 3.4]]) { const f = makePicketFence(z1 - z0); f.position.set(side * 5.75, 0, (z0 + z1) / 2); f.rotation.y = Math.PI / 2; mainHouses.add(f); }
      if (!(side === -1 && (z === 0 || z === 10))) {
      const mb = makeMailbox(); mb.position.set(side * 5.9, 0, z - 2.2); mb.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2; mainHouses.add(mb); }
    }
  }
  W.houses = houses;
  W.miaHouse = houses.find(h => h.side === -1 && h.z === 0);
  W.pellHouse = houses.find(h => h.side === -1 && h.z === 10);
  W.figureHouse = houses.find(h => h.side === 1 && h.z === -10);

  // far town: merged for speed, all windows lit
  const far = new THREE.Group();
  let fs = 100;
  for (const [hx, rot] of [[25, -Math.PI / 2], [47, Math.PI / 2], [-25, Math.PI / 2], [-47, -Math.PI / 2]]) {
    for (let z = -140; z <= 50; z += 10) {
      if (z === 30 || z === -90) continue;
      fs++;
      const h = makeHouse({ seed: fs, simple: true, lit: [fs % 2 === 0, true, fs % 3 === 0, fs % 2 === 1] });
      h.group.position.set(hx, 0, z); h.group.rotation.y = rot; far.add(h.group);
      if (fs % 4 === 0) { const t = makeTree(fs, 1); t.position.set(hx + (hx > 0 ? -1 : 1) * (hx === 25 || hx === -25 ? -6 : 6), 0, z + 5); far.add(t); }
    }
  }
  const farMerged = mergeStatic(far, { cast: false });
  street.add(farMerged); W.farTown = farMerged;
  W.farDarkGlass = farMerged.children.find(m => m.material === GLASS_DARK);

  const sign = makeSign(); sign.group.position.set(-6.2, 0, 24); sign.group.rotation.y = 0.35; street.add(sign.group); W.props.sign = sign;
  // moving boxes on Mia's lawn
  for (const [x, y, z, r] of [[-6.6, 0.22, -2.4, 0.2], [-6.5, 0.66, -2.3, -0.1], [-7.2, 0.22, -3.1, 0.6]]) {
    const b = makeMovingBox(); b.group.position.set(x, y, z); b.group.rotation.y = r; street.add(b.group);
  }
  // fences between Mia and Pell
  { const f = makePicketFence(2.2); f.position.set(-7.0, 0, 5.0); street.add(f); }
  // sky decor: clouds + city skyline
  const clouds = new THREE.Group(); street.add(clouds); W.clouds = clouds;
  for (let i = 0; i < 14; i++) { const c = makeCloud(i); c.position.set(-160 + (i * 97) % 320, 55 + (i * 13) % 30, -220 + (i * 61) % 260); c.scale.setScalar(0.9 + (i % 3) * 0.3); clouds.add(c); }
  const skyline = new THREE.Group(); street.add(skyline);
  const tc = ['#dfe7f2', '#cfdcec', '#e8e2d6', '#d4e4e8'];
  for (let i = 0; i < 22; i++) { const h = 30 + (i * 37) % 60, w = 12 + (i * 7) % 10; const t = makeTower(w, h, 12, tc[i % 4], i); t.position.set(-130 + i * 12.5, 0, -205 - (i % 3) * 14); skyline.add(t); }
  for (let i = 0; i < 8; i++) { const h = 28 + (i * 29) % 50; const t = makeTower(14, h, 12, tc[(i + 1) % 4], i); t.position.set(-80 + i * 22, 0, 110 + (i % 2) * 12); skyline.add(t); }
  W.skyline = skyline;

  // ---------- BEDROOM (x = 500) ----------
  const bed = new THREE.Group(); bed.name = 'bedroom'; bed.position.set(500, 0, 0); scene.add(bed); W.sets.bedroom = bed;
  const wallM = W.bedWall = new THREE.MeshStandardMaterial({ color: '#86a6f2', roughness: 0.85 }), trimM = std('#eef3ff'), floorM = std('#8a5a3c', { roughness: 0.7 });
  const floorTex = canvasTex(512, 512, (x, w, h) => {
    for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#8a5a3c' : '#7c5035'; x.fillRect(0, i * 64, w, 64); x.fillStyle = '#5d3a25'; x.fillRect(0, i * 64, w, 3); x.fillRect(((i * 197) % 400) + 40, i * 64, 3, 64); }
  });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(3, 3);
  mesh(box(9.0, 0.2, 6.4), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.7 }), -0.8, -0.1, 0, bed, { cast: false });
  const ceiling = mesh(box(7.4, 0.2, 6.4), std('#e6eeff'), 0, 3.3, 0, bed); W.props.ceiling = ceiling;
  // back wall with window hole x[-2.05,-0.55] y[1.0,2.4]
  const BZ = -3.1;
  // window above the bed: x[1.7,3.2] y[1.35,2.75]
  mesh(box(5.4, 3.2, 0.2), wallM, -1.0, 1.6, BZ, bed);
  mesh(box(0.5, 3.2, 0.2), wallM, 3.45, 1.6, BZ, bed);
  mesh(box(1.5, 1.35, 0.2), wallM, 2.45, 0.675, BZ, bed);
  mesh(box(1.5, 0.45, 0.2), wallM, 2.45, 2.975, BZ, bed);
  // left wall with door hole z[1.0,2.0]
  mesh(box(0.2, 3.2, 4.2), wallM, -3.6, 1.6, -1.1, bed);
  mesh(box(0.2, 3.2, 1.2), wallM, -3.6, 1.6, 2.6, bed);
  mesh(box(0.2, 1.0, 1.0), wallM, -3.6, 2.7, 1.5, bed);
  mesh(box(0.2, 3.2, 6.4), wallM, 3.6, 1.6, 0, bed);
  mesh(box(7.4, 3.2, 0.2), wallM, 0, 1.6, 3.1, bed);
  // baseboards
  mesh(box(7.0, 0.16, 0.06), trimM, 0, 0.08, BZ + 0.12, bed, { cast: false });
  mesh(box(0.06, 0.16, 6.0), trimM, 3.47, 0.08, 0, bed, { cast: false });
  // window frame + panes + curtains
  const wf = std('#f4f7ff');
  mesh(box(1.7, 0.12, 0.3), wf, 2.45, 1.31, BZ, bed); mesh(box(1.7, 0.12, 0.3), wf, 2.45, 2.79, BZ, bed);
  mesh(box(0.12, 1.6, 0.3), wf, 1.64, 2.05, BZ, bed); mesh(box(0.12, 1.6, 0.3), wf, 3.26, 2.05, BZ, bed);
  const glassM = new THREE.MeshStandardMaterial({ color: '#9ec4ff', transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0.2 });
  const panes = [];
  for (const s of [-1, 1]) {
    const hinge = new THREE.Group(); hinge.position.set(s === -1 ? 1.7 : 3.2, 2.05, BZ - 0.06); bed.add(hinge);
    const pg = new THREE.Group(); hinge.add(pg);
    const dx = s === -1 ? 0.375 : -0.375;
    mesh(box(0.74, 1.38, 0.03), glassM, dx, 0, 0, pg, { cast: false });
    mesh(box(0.74, 0.06, 0.06), wf, dx, 0.66, 0, pg); mesh(box(0.74, 0.06, 0.06), wf, dx, -0.66, 0, pg);
    mesh(box(0.06, 1.38, 0.06), wf, dx * 2 - Math.sign(dx) * 0.03, 0, 0, pg); mesh(box(0.06, 1.38, 0.06), wf, Math.sign(dx) * 0.03, 0, 0, pg);
    mesh(box(0.74, 0.04, 0.05), wf, dx, 0, 0, pg);
    panes.push({ hinge, s });
  }
  W.props.window = { panes, setOpen(a) { panes[0].hinge.rotation.y = a; panes[1].hinge.rotation.y = -a; } };
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.1, 8), std('#dfe5f5', { metalness: 0.6 }), 2.45, 2.92, BZ + 0.22, bed).rotation.z = Math.PI / 2;
  const curtL = makeCurtain(0.5, 1.7, '#6a2fe0'), curtR = makeCurtain(0.5, 1.7, '#6a2fe0');
  curtL.mesh.position.set(1.68, 2.9, BZ + 0.24); curtR.mesh.position.set(3.22, 2.9, BZ + 0.24);
  bed.add(curtL.mesh); bed.add(curtR.mesh);
  W.props.curtains = { animate(t, wind) { curtL.animate(t, wind, -1); curtR.animate(t + 1.3, wind, 1); } };
  W.props.curtains.animate(0, 0);
  // bed
  const bedG = new THREE.Group(); bedG.position.set(2.45, 0, -1.75); bed.add(bedG);
  mesh(rb(1.9, 0.35, 2.4, 0.05), std('#f2f5ff'), 0, 0.2, 0, bedG);
  mesh(rb(1.8, 0.2, 2.3, 0.06), std('#e9f0ff', { roughness: 0.9 }), 0, 0.47, 0, bedG);
  mesh(rb(1.95, 1.25, 0.15, 0.05), std('#ff4f7b'), 0, 0.62, -1.2, bedG);
  mesh(rb(1.95, 0.6, 0.12, 0.05), std('#ff4f7b'), 0, 0.3, 1.2, bedG);
  mesh(rb(0.9, 0.18, 0.5, 0.08), std('#ffffff', { roughness: 0.9 }), 0, 0.64, -0.85, bedG);
  const blanket = mesh(rb(1.86, 0.12, 1.6, 0.05), std('#2448ff', { roughness: 0.9 }), 0, 0.62, 0.38, bedG);
  W.props.bed = bedG; W.props.blanket = blanket;
  // nightstand, lamp, clock
  mesh(rb(0.75, 0.62, 0.6, 0.04), std('#4f6bff'), 0.85, 0.31, -2.6, bed);
  mesh(rb(0.6, 0.18, 0.04, 0.02), std('#ff4f7b'), 0.85, 0.42, -2.29, bed);
  const lamp = makeLamp(); lamp.group.position.set(0.7, 0.62, -2.68); bed.add(lamp.group); W.props.lamp = lamp;
  const clock = makeClock(); clock.group.position.set(1.02, 0.62, -2.5); clock.group.rotation.y = -0.35; bed.add(clock.group); W.props.clock = clock;
  // rug
  const rugTex = canvasTex(512, 384, (x, w, h) => {
    const cs = ['#ff3d7f', '#2fa3ff', '#22c48a', '#8f4dff', '#ffffff'];
    for (let i = 0; i < 8; i++) { x.fillStyle = cs[i % cs.length]; x.fillRect(0, i * h / 8, w, h / 8); }
  });
  const rug = mesh(new THREE.PlaneGeometry(2.6, 1.9), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }), -0.6, 0.012, 0.4, bed, { cast: false });
  rug.rotation.x = -Math.PI / 2;
  // toys
  for (const [x, z, c, s] of [[-1.9, 1.2, '#ff3355', 0.3], [-1.6, 1.4, '#1d4cff', 0.26], [-1.75, 1.3, '#22c48a', 0.24]]) mesh(rb(s, s, s, 0.03), std(c), x, s / 2 + (c === '#22c48a' ? 0.28 : 0), z, bed);
  // dresser + poster
  mesh(rb(0.7, 1.1, 1.3, 0.04), std('#ffffff'), -3.1, 0.55, -1.6, bed);
  for (const y of [0.3, 0.65, 0.95]) mesh(box(0.04, 0.22, 1.1), std('#ff4f7b'), -2.74, y, -1.6, bed);
  const posterTex = canvasTex(256, 360, (x, w, h) => {
    x.fillStyle = '#1b1f5e'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#fff'; for (let i = 0; i < 30; i++) x.fillRect((i * 83) % w, (i * 151) % h, 4, 4);
    x.fillStyle = '#ff3355'; x.fillRect(110, 90, 40, 140); x.fillStyle = '#e8ecff'; x.beginPath(); x.moveTo(110, 90); x.lineTo(130, 40); x.lineTo(150, 90); x.fill();
    x.fillStyle = '#2fa3ff'; x.fillRect(90, 190, 20, 50); x.fillRect(150, 190, 20, 50);
    x.font = '900 34px Montserrat'; x.textAlign = 'center'; x.fillStyle = '#fff'; x.fillText('SPACE!', w / 2, 320);
  });
  mesh(new THREE.PlaneGeometry(0.8, 1.1), new THREE.MeshStandardMaterial({ map: posterTex }), -1.3, 2.0, BZ + 0.11, bed, { cast: false });
  // bedroom door (left wall)
  const bdoor = makeDoor({ w: 0.98, h: 2.18, color: '#ffffff' }); bdoor.group.position.set(-3.6, 0.03, 1.5); bdoor.group.rotation.y = Math.PI / 2; bed.add(bdoor.group); W.props.bedDoor = bdoor;
  mesh(box(2.0, 0.2, 2.4), std('#3a2a22'), -4.8, -0.1, 1.5, bed, { cast: false }); // hall floor outside door
  // outside the window
  const outside = new THREE.Group(); bed.add(outside);
  const og = mesh(new THREE.PlaneGeometry(200, 120), std('#1d7a46', { roughness: 1 }), 0, -0.3, -63.2, outside, { cast: false }); og.rotation.x = -Math.PI / 2;
  mesh(box(200, 0.05, 6), roadMat, 0, -0.27, -14, outside, { cast: false });
  for (let i = 0; i < 6; i++) {
    const h = makeHouse({ seed: 30 + i, lit: [i % 2 === 0, true, i % 3 === 0, true], simple: true });
    h.group.position.set(-26 + i * 10, -0.3, -24); outside.add(h.group);
  }
  for (let x = -6; x <= 6; x += 1) mesh(rb(0.14, 0.9, 0.14, 0.03), std('#e9edf8'), x, 0.15, -6.5, outside);
  mesh(box(13, 0.1, 0.07), std('#e9edf8'), 0, 0.4, -6.5, outside);
  const tr = makeTree(2, 1.0); tr.position.set(4, -0.3, -9); outside.add(tr);
  W.props.outsideBedroom = outside;

  // ---------- HALLWAY (x = 600) ----------
  const hall = new THREE.Group(); hall.name = 'hallway'; hall.position.set(600, 0, 0); scene.add(hall); W.sets.hallway = hall;
  const hwall = std('#3b4fd6', { roughness: 0.85 }), wains = std('#e9eefc');
  const hFloorTex = floorTex.clone(); hFloorTex.repeat.set(1, 5); hFloorTex.needsUpdate = true;
  mesh(box(3.0, 0.2, 14.6), new THREE.MeshStandardMaterial({ map: hFloorTex, roughness: 0.7 }), 0, -0.1, -1, hall, { cast: false });
  mesh(box(3.0, 0.2, 14.6), std('#e6eeff'), 0, 3.1, -1, hall);
  // right wall (x=+1.4) with Theo's door z[-3.5,-2.5]
  mesh(box(0.2, 3.0, 4.5), hwall, 1.4, 1.5, -5.75, hall);
  mesh(box(0.2, 3.0, 8.7), hwall, 1.4, 1.5, 1.85, hall);
  mesh(box(0.2, 0.8, 1.0), hwall, 1.4, 2.6, -3.0, hall);
  // left wall (x=-1.4) with door z[1.5,2.5] and window z[-6,-5] y[1.2,2.2]
  mesh(box(0.2, 3.0, 2.0), hwall, -1.4, 1.5, -7.0, hall);
  mesh(box(0.2, 3.0, 6.5), hwall, -1.4, 1.5, -1.75, hall);
  mesh(box(0.2, 1.2, 1.0), hwall, -1.4, 0.6, -5.5, hall);
  mesh(box(0.2, 0.8, 1.0), hwall, -1.4, 2.6, -5.5, hall);
  mesh(box(0.2, 3.0, 3.5), hwall, -1.4, 1.5, 4.25, hall);
  mesh(box(0.2, 0.8, 1.0), hwall, -1.4, 2.6, 2.0, hall);
  mesh(box(0.06, 0.8, 0.06), wains, -1.38, 1.7, -5.5, hall); mesh(box(0.06, 0.06, 1.0), wains, -1.38, 1.7, -5.5, hall);
  // ends
  mesh(box(3.0, 3.0, 0.2), hwall, 0, 1.5, 6.1, hall);
  mesh(box(0.95, 3.0, 0.2), hwall, -0.975, 1.5, -8.1, hall);
  mesh(box(0.95, 3.0, 0.2), hwall, 0.975, 1.5, -8.1, hall);
  mesh(box(1.0, 0.7, 0.2), hwall, 0, 2.65, -8.1, hall);
  // wainscot rails
  for (const x of [-1.29, 1.29]) mesh(box(0.04, 0.08, 14), wains, x, 1.0, -1, hall, { cast: false });
  const runner = mesh(new THREE.PlaneGeometry(1.2, 12), std('#d0204a', { roughness: 1 }), 0, 0.012, -1, hall, { cast: false }); runner.rotation.x = -Math.PI / 2;
  // picture frames
  for (const [z, c] of [[-0.5, '#ff3d7f'], [3.5, '#22c48a'], [-5.8, '#8f4dff']]) {
    mesh(box(0.05, 0.7, 0.55), std('#f4f6ff'), 1.28, 1.8, z, hall);
    mesh(box(0.06, 0.55, 0.4), std(c), 1.27, 1.8, z, hall);
  }
  mesh(rb(0.4, 0.8, 1.0, 0.03), std('#ffffff'), -1.1, 0.4, 4.5, hall);
  const theoDoor = makeDoor({ w: 0.98, h: 2.18, color: '#22c48a' }); theoDoor.group.position.set(1.4, 0.02, -3.0); theoDoor.group.rotation.y = -Math.PI / 2; hall.add(theoDoor.group); W.props.theoDoor = theoDoor;
  const miaDoor = makeDoor({ w: 0.98, h: 2.18, color: '#ff3d7f' }); miaDoor.group.position.set(-1.4, 0.02, 2.0); miaDoor.group.rotation.y = Math.PI / 2; hall.add(miaDoor.group);
  const frontDoor = makeDoor({ w: 0.98, h: 2.28, color: '#1d4cff' }); frontDoor.group.position.set(0, 0.02, -8.1); hall.add(frontDoor.group); W.props.frontDoor = frontDoor;
  // room behind Theo's door (dark blue box) and porch outside the front door
  mesh(box(3, 3, 0.2), std('#1e2e7a'), 3.2, 1.5, -4.6, hall); mesh(box(3, 3, 0.2), std('#1e2e7a'), 3.2, 1.5, -1.4, hall);
  mesh(box(3, 0.2, 3.4), std('#3a2a22'), 3.0, -0.1, -3.0, hall, { cast: false });
  mesh(box(0.2, 3, 3.4), std('#1e2e7a'), 4.6, 1.5, -3.0, hall);
  mesh(box(4, 0.2, 3.6), std('#9aa3c4'), 0, -0.1, -10.0, hall, { cast: false });
  for (const x of [-1.7, 1.7]) mesh(rb(0.25, 2.9, 0.25, 0.04), std('#eef2fb'), x, 1.45, -11.4, hall);
  mesh(box(4.2, 0.2, 3.8), std('#1f2a52'), 0, 3.0, -10.0, hall);
  const hallOut = new THREE.Group(); hall.add(hallOut);
  const hog = mesh(new THREE.PlaneGeometry(200, 120), std('#1d7a46', { roughness: 1 }), 0, -0.25, -70, hallOut, { cast: false }); hog.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 5; i++) {
    const h = makeHouse({ seed: 50 + i, lit: [true, i % 2 === 0, false, true], simple: true });
    h.group.position.set(-20 + i * 10, -0.25, -34); hallOut.add(h.group);
  }

  // ---------- CAST ----------
  const mia = makeCharacter({ name: 'Mia', skin: '#f3c39a', shirt: '#ff4fa3', print: 'hoodie', pants: '#2f5fe0', shoes: '#ffffff', hair: 'mia', hairColor: '#5a3220', scale: 0.92 });
  const theo = makeCharacter({ name: 'Theo', skin: '#f3c39a', shirt: '#4ec3ff', print: 'pj', sleeves: '#4ec3ff', pants: '#4ec3ff', shoes: '#e9f0ff', hair: 'theo', hairColor: '#4a2a17', scale: 0.7 });
  const theoDay = makeCharacter({ name: 'TheoDay', skin: '#f3c39a', shirt: '#ffd23a', print: 'star', pants: '#2f5fe0', shoes: '#ff4d4d', hair: 'theo', hairColor: '#4a2a17', scale: 0.7 });
  const pell = makeCharacter({ name: 'Pell', skin: '#e9b48d', shirt: '#3f8f6a', print: 'cardigan', pants: '#565a7d', shoes: '#2b1d16', hair: 'pell', hairColor: '#d9dde8', hatColor: '#5a2340', scale: 1.04, face: 'serious' });
  const mailman = makeCharacter({ name: 'Mailman', hair: 'mailman', silhouette: true, scale: 1.25, proportions: { leg: 1.75, arm: 1.75, torso: 1.45, width: 0.72 } });
  const figure = makeCharacter({ name: 'Figure', hair: 'theo', silhouette: true, scale: 0.42 });
  const dog = makeDog();
  W.chars = { mia, theo, theoDay, pell, mailman, figure, dog };
  for (const c of Object.values(W.chars)) scene.add(c.group);
  // held props
  const lantern = makeLantern(); W.props.lantern = lantern;
  const sack = makeSack(); W.props.sack = sack;
  mailman.attach(sack.group, 'shoulderL', [0.35, 0.05, -0.35]); sack.group.rotation.set(0.2, 0, -0.2);
  const env = makeEnvelope('THEO'); W.props.envelope = env; scene.add(env.group);
  const letter = makeLetter(); W.props.letter = letter; scene.add(letter.group);
  const heldBox = makeMovingBox("MIA'S STUFF"); W.props.heldBox = heldBox;
  const rules = makeRulesPaper(); W.props.rules = rules; scene.add(rules.group);
  const scrap = makeScrap(); W.props.scrap = scrap; scene.add(scrap.group);
  const truck = makeTruck(); truck.position.set(-2.0, 0, -6.5); street.add(truck); W.props.truck = truck;
  const mbox = makeFlagMailbox(); mbox.group.position.set(-5.2, 0, -1.6); mbox.group.rotation.y = Math.PI / 2; street.add(mbox.group); W.props.mailbox = mbox;

  return W;
}

// ---------- lighting presets ----------
export const PRESETS = {
  day: { top: '#2f8cff', mid: '#8fd0ff', bottom: '#dff3ff', fog: '#cfe9ff', fogNear: 80, fogFar: 520, hemi: ['#ffffff', '#7fa86a', 1.9], key: ['#fff6e8', 3.0], fill: 0.6, stars: false, moon: false, clouds: true, bloom: [0.25, 0.4, 0.98] },
  night: { top: '#071440', mid: '#1c3a8f', bottom: '#2a4fa8', fog: '#1a3478', fogNear: 30, fogFar: 260, hemi: ['#7d9bff', '#1a2a5c', 1.5], key: ['#b9cdff', 1.8], fill: 0.45, stars: true, moon: true, bloom: [0.7, 0.5, 0.62] },
  dusk: { top: '#1b1960', mid: '#5b3fbf', bottom: '#2a64d8', fog: '#4a3fa8', fogNear: 30, fogFar: 200, hemi: ['#a9a6ff', '#1d2a66', 1.6], key: ['#d7c9ff', 2.2], fill: 0.6, stars: false, moon: true, bloom: [0.6, 0.5, 0.75] },
  interiorNight: { top: '#071440', mid: '#1c3a8f', bottom: '#2a4fa8', fog: '#1a3478', fogNear: 14, fogFar: 90, hemi: ['#6f8fff', '#1a2450', 1.0], key: ['#9fb8ff', 2.4], fill: 0.12, stars: true, moon: true, bloom: [0.7, 0.45, 0.82] },
  townFinal: { top: '#03081f', mid: '#10276e', bottom: '#14306e', fog: '#0c1d55', fogNear: 120, fogFar: 520, hemi: ['#6d88ff', '#0c1538', 1.4], key: ['#a9c0ff', 1.6], fill: 0.4, stars: true, moon: true, bloom: [1.6, 0.6, 0.45] },
  interiorDark: { top: '#050f33', mid: '#16317a', bottom: '#20408f', fog: '#0f2160', fogNear: 14, fogFar: 90, hemi: ['#5a7be6', '#101a40', 0.85], key: ['#8eaaff', 2.2], fill: 0.05, stars: true, moon: true, bloom: [0.7, 0.45, 0.8] },
  morning: { top: '#3d8bff', mid: '#8cc8ff', bottom: '#d4ecff', fog: '#cfe6ff', fogNear: 30, fogFar: 200, hemi: ['#e6f2ff', '#7a8fb8', 1.7], key: ['#ffffff', 3.2], fill: 0.5, stars: false, moon: false, bloom: [0.5, 0.4, 0.97] },
};
