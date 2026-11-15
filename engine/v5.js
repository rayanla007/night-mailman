// Story kit additions: Battery Town (charging station), shared by later stories.
import * as THREE from 'three';
import { std, basic, rb, box, mesh, canvasTex, makeTower } from './props.js';

export function buildStation(scene, W) {
  const g = new THREE.Group(); g.name = 'station'; g.position.set(-1000, 0, 0); scene.add(g); W.sets.station = g;
  const floorTex = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#3a4152'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2a2f3c'; x.lineWidth = 4; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, h); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke(); } });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(10, 10);
  mesh(box(40, 0.2, 40), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.5, metalness: 0.3 }), 0, -0.1, 0, g, { cast: false });
  const wall = std('#262c3a', { roughness: 0.8 });
  mesh(box(40, 12, 0.4), wall, 0, 6, -20, g); mesh(box(0.4, 12, 40), wall, -20, 6, 0, g); mesh(box(0.4, 12, 40), wall, 20, 6, 0, g); mesh(box(40, 12, 0.4), wall, 0, 6, 20, g);
  mesh(box(40, 0.4, 40), std('#1d2230'), 0, 12, 0, g);
  // pods in rows
  W.pods = [];
  const glass = new THREE.MeshStandardMaterial({ color: '#9fe8ff', transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.1, depthWrite: false });
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
    const p = new THREE.Group(); p.position.set(-10 + c * 4, 0, -4 + r * 5); g.add(p);
    mesh(new THREE.CylinderGeometry(1.0, 1.1, 0.3, 24), std('#cfd6e6', { metalness: 0.5, roughness: 0.3 }), 0, 0.15, 0, p);
    const ringM = new THREE.MeshBasicMaterial({ color: '#38e07b' });
    mesh(new THREE.TorusGeometry(0.98, 0.05, 8, 32), ringM, 0, 0.32, 0, p, { cast: false }).rotation.x = Math.PI / 2;
    mesh(new THREE.CylinderGeometry(0.95, 0.95, 2.9, 24, 1, true), glass, 0, 1.75, 0, p, { cast: false });
    mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.3, 24), std('#cfd6e6', { metalness: 0.5, roughness: 0.3 }), 0, 3.3, 0, p);
    mesh(new THREE.CylinderGeometry(0.06, 0.06, 8.5, 6), std('#111'), 0.5, 7.7, 0, p);
    const light = new THREE.PointLight('#38e07b', 0.8, 4, 1.6); light.position.set(0, 2, 0.8); p.add(light);
    W.pods.push({ group: p, ring: ringM, light, setColor(c) { ringM.color.set(c); light.color.set(c); } });
  }
  // central machine with a big screen
  mesh(rb(6, 9, 3, 0.2), std('#3a4152', { metalness: 0.4, roughness: 0.4 }), 0, 4.5, -16, g);
  const st = canvasTex(1024, 640, () => {});
  mesh(new THREE.PlaneGeometry(5.2, 3.25), new THREE.MeshBasicMaterial({ map: st }), 0, 6, -14.48, g, { cast: false });
  W.setStationScreen = (lines, col = '#38e07b') => {
    const c = st.userData.canvas, x = c.getContext('2d'); x.fillStyle = '#05080c'; x.fillRect(0, 0, 1024, 640);
    x.strokeStyle = col; x.lineWidth = 14; x.strokeRect(20, 20, 984, 600); x.fillStyle = col; x.textAlign = 'center'; x.textBaseline = 'middle';
    lines.forEach((l, i) => { x.font = `700 ${i ? 76 : 110}px Fredoka`; x.fillText(l, 512, 640 * (i + 1) / (lines.length + 1)); }); st.needsUpdate = true;
  };
  W.setStationScreen(['CHARGING', 'sleep well, citizens']);
  for (const x of [-12, 12]) for (const z of [-12, 4]) { const a = mesh(new THREE.SphereGeometry(0.35, 12, 8), new THREE.MeshBasicMaterial({ color: '#552222' }), x, 10.5, z, g, { cast: false }); (W.alarms = W.alarms || []).push(a); }
  const amb = new THREE.PointLight('#7fa8ff', 3, 0, 1.0); amb.position.set(0, 10, 2); g.add(amb); W.stationAmb = amb;
}

// extra cast members requested by a story's kit list
import { makeCharacter } from './character.js';
export function buildExtras(scene, W, kit) {
  const mk = (key, o) => { const c = makeCharacter(o); W.chars[key] = c; scene.add(c.group); };
  if (kit.includes('pia')) mk('pia', { name: 'Pia', skin: '#f6cfa6', shirt: '#ff7ac4', print: 'heart', pants: '#9b5cff', shoes: '#ffffff', hair: 'mia', hairColor: '#e8b33c', scale: 0.66 });
  if (kit.includes('mic')) { const g = new THREE.Group(); mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.05, 16), std('#222'), 0, 0.025, 0, g); mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.5, 8), std('#888', { metalness: 0.8 }), 0, 0.75, 0, g); mesh(new THREE.SphereGeometry(0.1, 16, 12), std('#333', { metalness: 0.5, roughness: 0.4 }), 0, 1.55, 0, g); W.props.mic = { group: g }; }
  if (kit.includes('dad')) mk('dad', { name: 'Dad', skin: '#f1c09a', shirt: '#3fa9ff', print: 'jacket', pants: '#2a2a3a', shoes: '#2b1d16', hair: 'clumps', hairColor: '#4a2a17', scale: 1.06 });
}

// ---------- Mirror Hour: standing mirror (with a 'reflection' slot) + dining room seen through a window ----------
export function buildMirrorKit(scene, W) {
  const mk = (key, o) => { const c = makeCharacter(o); W.chars[key] = c; scene.add(c.group); return c; };
  mk('ryan2', { name: 'Ryan2', skin: '#f1c09a', shirt: '#8a5cff', print: 'hoodie', faceOpts: { freckles: true }, pants: '#2f5fe0', shoes: '#ffffff', hair: 'clumps', hairColor: '#3b2416', scale: 0.92 });
  // standing mirror (front faces +z)
  const m = new THREE.Group();
  mesh(rb(1.3, 2.4, 0.12, 0.04), std('#f4f1ea'), 0, 1.25, -0.08, m);
  const shine = canvasTex(256, 512, (x, w, h) => { const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#f2f6ff'); gr.addColorStop(0.5, '#c9d6ea'); gr.addColorStop(1, '#e8eef8'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,0.75)'; x.save(); x.translate(w * 0.3, h * 0.3); x.rotate(-0.6); x.fillRect(-20, -200, 26, 400); x.fillRect(30, -200, 10, 400); x.restore(); });
  const glass = new THREE.MeshBasicMaterial({ map: shine, color: '#ffffff', transparent: true, opacity: 0.22, depthWrite: false });
  const gp = mesh(new THREE.PlaneGeometry(1.1, 2.15), glass, 0, 1.25, 0.0, m, { cast: false });
  mesh(box(1.3, 0.1, 0.5), std('#c9b89a'), 0, 0.05, 0, m);
  // hollow it: replace the solid back board by a thin frame so the reflection behind can be seen
  m.children[0].visible = false;
  for (const [x, y, w, h] of [[0, 2.42, 1.3, 0.12], [0, 0.08, 1.3, 0.12], [-0.6, 1.25, 0.1, 2.4], [0.6, 1.25, 0.1, 2.4]]) mesh(box(w, h, 0.12), std('#f4f1ea'), x, y, 0, m);
  W.props.mirror = { group: m, glass, setBlank(b) { glass.opacity = b ? 0.97 : 0.22; glass.color.set(b ? '#dfe6f2' : '#ffffff'); }, setRipple(k, t) { gp.scale.set(1 + 0.03 * k * Math.sin(t * 9), 1 + 0.03 * k * Math.cos(t * 7), 1); glass.color.set(k > 0 ? '#9fd6ff' : '#ffffff'); } };
  // dining room (x = -1100): seen from the street through its window
  const g = new THREE.Group(); g.name = 'dining'; g.position.set(-1100, 0, 0); scene.add(g); W.sets.dining = g;
  mesh(box(30, 0.2, 30), std('#3a4152'), 0, -0.1, 4, g, { cast: false });
  mesh(box(9, 0.2, 7), std('#b07a4f'), 0, 0.01, -3.5, g, { cast: false });
  const wp = std('#ffe2b8', { roughness: 0.9 });
  mesh(box(9, 3.4, 0.2), wp, 0, 1.7, -7, g); mesh(box(0.2, 3.4, 7), wp, -4.5, 1.7, -3.5, g); mesh(box(0.2, 3.4, 7), wp, 4.5, 1.7, -3.5, g); mesh(box(9, 0.2, 7), std('#ffffff'), 0, 3.4, -3.5, g);
  // front wall (z=0) with a big window hole x[-2,2] y[0.9,2.6]
  const fw = std('#5b7fd6', { roughness: 0.85 });
  mesh(box(2.5, 3.4, 0.25), fw, -3.25, 1.7, 0, g); mesh(box(2.5, 3.4, 0.25), fw, 3.25, 1.7, 0, g); mesh(box(4, 0.9, 0.25), fw, 0, 0.45, 0, g); mesh(box(4, 0.8, 0.25), fw, 0, 3.0, 0, g);
  const wglass = new THREE.MeshStandardMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.12, roughness: 0.02, metalness: 0.5, depthWrite: false });
  const wpane = mesh(new THREE.PlaneGeometry(4, 1.7), wglass, 0, 1.75, 0.02, g, { cast: false });
  for (const [x, y, w, h] of [[0, 2.62, 4.2, 0.1], [0, 0.88, 4.2, 0.1], [-2.05, 1.75, 0.1, 1.8], [2.05, 1.75, 0.1, 1.8]]) mesh(box(w, h, 0.14), std('#ffffff'), x, y, 0.05, g);
  W.props.diningGlass = { mat: wglass, pane: wpane };
  mesh(rb(3.2, 0.12, 1.6, 0.04), std('#8b5a2b'), 0, 0.9, -2.6, g);
  for (const [x, z] of [[-1.4, -3.3], [1.4, -3.3], [-1.4, -1.9], [1.4, -1.9]]) mesh(box(0.08, 0.9, 0.08), std('#5b3a20'), x, 0.45, z, g);
  for (const [x, c] of [[-0.9, '#ff5a5a'], [0, '#ffffff'], [0.9, '#3fa9ff']]) { mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16), std('#ffffff'), x, 0.98, -2.6, g); mesh(new THREE.SphereGeometry(0.1, 10, 8), std(c), x, 1.04, -2.6, g); }
  const lamp = new THREE.PointLight('#ffcf8a', 6, 0, 1.4); lamp.position.set(0, 2.8, -2.6); g.add(lamp);
  mesh(new THREE.ConeGeometry(0.4, 0.35, 16, 1, true), new THREE.MeshStandardMaterial({ color: '#ffe2a0', emissive: '#ffb83d', emissiveIntensity: 0.8, side: THREE.DoubleSide }), 0, 3.0, -2.6, g, { cast: false });
  // street in front
  mesh(box(30, 0.12, 3), std('#9aa3c4'), 0, 0.06, 2, g, { cast: false });
  mesh(box(30, 0.08, 7), std('#3a3f4a'), 0, 0.04, 7, g, { cast: false });
}

// ---------- Weather Remote: the remote, snow, tornado, rainbow ----------
export function buildWeatherKit(scene, W) {
  // remote (front face +z), ~0.5 x 0.9
  const r = new THREE.Group();
  mesh(rb(0.55, 0.95, 0.12, 0.05), std('#8f98ad', { metalness: 0.25, roughness: 0.55 }), 0, 0, 0, r);
  const cols = ['#3fa9ff', '#c9d2e3', '#ffc928', '#40c463', '#9b5cff', '#ff7ac4', '#7fd3ff', '#ff9b4a'];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const b = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 12), std(cols[(i * 4 + j) % 8], { roughness: 0.4 }), -0.165 + j * 0.11, 0.3 - i * 0.11, 0.07, r); b.rotation.x = Math.PI / 2; }
  const red = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 20), std('#e8233c', { roughness: 0.3 }), 0, -0.25, 0.075, r); red.rotation.x = Math.PI / 2;
  const tape = new THREE.Group(); tape.position.set(0, -0.25, 0.1); r.add(tape);
  for (const a of [0.6, -0.6]) { const t = mesh(box(0.24, 0.045, 0.01), std('#ffd23a'), 0, 0, 0, tape); t.rotation.z = a; }
  W.props.remote = { group: r, red, tape };
  // snow: a box of points around the camera's set position, falls deterministically with t
  const N = 2500, pos = new Float32Array(N * 3), base = new Float32Array(N * 3);
  let s = 3; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < N; i++) base.set([rnd() * 60 - 30, rnd() * 25, rnd() * 60 - 30], i * 3);
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: 0.12, transparent: true, opacity: 0.95 })); snow.frustumCulled = false;
  W.props.snow = { group: snow, update(t, center = [0, 0, 8], speed = 1.6) {
    for (let i = 0; i < N; i++) { const y = ((base[i * 3 + 1] - t * speed) % 25 + 25) % 25; pos[i * 3] = center[0] + base[i * 3] + Math.sin(t + i) * 0.3; pos[i * 3 + 1] = y; pos[i * 3 + 2] = center[2] + base[i * 3 + 2]; }
    sg.attributes.position.needsUpdate = true; } };
  // tornado: stacked spinning translucent rings
  const tor = new THREE.Group();
  for (let i = 0; i < 14; i++) { const k = i / 13; const ring = mesh(new THREE.TorusGeometry(0.6 + k * k * 7, 0.35 + k * 0.9, 8, 28), new THREE.MeshStandardMaterial({ color: '#9aa3b8', transparent: true, opacity: 0.5, roughness: 1, depthWrite: false }), 0, i * 1.6, 0, tor, { cast: false }); ring.rotation.x = Math.PI / 2; ring.userData.k = k; }
  W.props.tornado = { group: tor, update(t, scale = 1) { tor.children.forEach((c, i) => { c.rotation.z = t * (4 - c.userData.k * 2) + i; c.position.x = Math.sin(t * 2 + i * 0.5) * 0.6 * c.userData.k; }); tor.scale.setScalar(scale); } };
  // rainbow
  const rb_ = new THREE.Group(); ['#ff3b4e', '#ff9b4a', '#ffd23a', '#40c463', '#3fa9ff', '#9b5cff'].forEach((c, i) => mesh(new THREE.TorusGeometry(40 - i * 1.6, 0.8, 8, 64, Math.PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.8, fog: false }), 0, 0, 0, rb_, { cast: false }));
  W.props.rainbow = { group: rb_ };
}

// ---------- Floor Zero: lobby with elevators + elevator car ----------
export function buildElevatorKit(scene, W) {
  const mk = (key, o) => { const c = makeCharacter(o); W.chars[key] = c; scene.add(c.group); return c; };
  mk('grandma', { name: 'Grandma', skin: '#f1c09a', shirt: '#9b5cff', print: 'cardigan', pants: '#565a7d', shoes: '#2b1d16', hair: 'mia', hairColor: '#e6e6ea', scale: 0.95, faceOpts: { glasses: true } });
  mk('manager', { name: 'Manager', skin: '#e9b48d', shirt: '#1e1e2a', print: 'jacket', pants: '#1e1e2a', shoes: '#111', hair: 'crowd1', hairColor: '#2b1a10', scale: 1.08 });
  if (!W.chars.ryan2) mk('ryan2', { name: 'Ryan2', skin: '#f1c09a', shirt: '#8a5cff', print: 'hoodie', faceOpts: { freckles: true }, pants: '#2f5fe0', shoes: '#ffffff', hair: 'clumps', hairColor: '#3b2416', scale: 0.92 });
  // the one building everyone lives in (in the square set, far behind the clock tower)
  if (W.sets.square) { const T = makeTower(30, 170, 30, '#dfe7f2'); T.position.set(0, 0, -70); W.sets.square.add(T); }
  // lobby (x = -1200): elevators on the back wall z=-6 at x = -4, 0, 4 (old one at x=4)
  const g = new THREE.Group(); g.name = 'lobby'; g.position.set(-1200, 0, 0); scene.add(g); W.sets.lobby = g;
  const tile = canvasTex(256, 256, (x, w, h) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#e9e1d2' : '#d7ccb8'; x.fillRect(i * 64, j * 64, 64, 64); } });
  tile.wrapS = tile.wrapT = THREE.RepeatWrapping; tile.repeat.set(6, 6);
  mesh(box(16, 0.2, 14), new THREE.MeshStandardMaterial({ map: tile, roughness: 0.4 }), 0, -0.1, 0, g, { cast: false });
  mesh(new THREE.PlaneGeometry(3, 12), std('#b3223c', { roughness: 1 }), 0, 0.01, 1, g, { cast: false }).rotation.x = -Math.PI / 2;
  const wall = std('#f3e6c8', { roughness: 0.85 });
  mesh(box(16, 5, 0.2), wall, 0, 2.5, -6.1, g); mesh(box(0.2, 5, 14), wall, -8, 2.5, 0, g); mesh(box(0.2, 5, 14), wall, 8, 2.5, 0, g); mesh(box(16, 0.2, 14), std('#ffffff'), 0, 5, 0, g); mesh(box(16, 5, 0.2), wall, 0, 2.5, 7, g);
  W.lobbyDoors = [];
  for (const [x, old] of [[-4, false], [0, false], [4, true]]) {
    const fr = std(old ? '#7a6a4f' : '#c9a24a', { metalness: 0.6, roughness: 0.35 });
    mesh(box(2.4, 3.0, 0.1), fr, x, 1.5, -5.98, g);
    const dm = std(old ? '#8f8a80' : '#d8dde6', { metalness: 0.7, roughness: 0.3 });
    const L = mesh(box(0.98, 2.6, 0.06), dm, x - 0.5, 1.3, -5.9, g), R = mesh(box(0.98, 2.6, 0.06), dm, x + 0.5, 1.3, -5.9, g);
    const ind = canvasTex(256, 96, () => {}); mesh(new THREE.PlaneGeometry(1.0, 0.36), new THREE.MeshBasicMaterial({ map: ind }), x, 3.3, -5.92, g, { cast: false });
    W.lobbyDoors.push({ L, R, x, ind, setOpen(k) { L.position.x = x - 0.5 - 0.95 * k; R.position.x = x + 0.5 + 0.95 * k; }, setFloor(t, col = '#ffb020') { const c = ind.userData.canvas, q = c.getContext('2d'); q.fillStyle = '#0b0b10'; q.fillRect(0, 0, 256, 96); q.fillStyle = col; q.font = 'bold 72px "DejaVu Sans Mono", monospace'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(t, 128, 52); ind.needsUpdate = true; } });
  }
  W.lobbyDoors.forEach((d, i) => d.setFloor(['54', '2', '?'][i], i === 2 ? '#ff3b4e' : '#ffb020'));
  for (const x of [-7, 7]) { mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.8, 12), std('#b07a4f'), x, 0.4, -4.5, g); mesh(new THREE.IcosahedronGeometry(0.9, 1), std('#2fae6a', { flatShading: true }), x, 1.6, -4.5, g); }
  mesh(rb(3.5, 1.1, 1.0, 0.04), std('#8b5a2b'), -4.5, 0.55, 2.5, g);
  const ll = new THREE.PointLight('#fff1d6', 5, 0, 1.3); ll.position.set(0, 4.5, 0); g.add(ll); W.lobbyLight = ll;
  // elevator car (x = -1300): interior 2.4 wide, 2.6 tall, doors at z=+1.2 facing -z...
  const e = new THREE.Group(); e.name = 'elevator'; e.position.set(-1300, 0, 0); scene.add(e); W.sets.elevator = e;
  const metal = std('#b9c0cc', { metalness: 0.6, roughness: 0.35 });
  mesh(box(2.6, 0.1, 2.6), std('#3a3530'), 0, -0.05, 0, e, { cast: false }); mesh(box(2.6, 0.1, 2.6), std('#f4f4f4', { emissive: '#fff4dc', emissiveIntensity: 0.6 }), 0, 2.65, 0, e);
  mesh(box(0.1, 2.7, 2.6), metal, -1.25, 1.35, 0, e); mesh(box(0.1, 2.7, 2.6), metal, 1.25, 1.35, 0, e); mesh(box(2.6, 2.7, 0.1), metal, 0, 1.35, -1.25, e);
  mesh(box(2.4, 0.06, 0.06), std('#c9a24a', { metalness: 0.7 }), 0, 0.95, -1.18, e);
  mesh(box(6, 3.4, 0.2), std('#f3e6c8'), 0, 1.7, 3.2, e); mesh(box(6, 0.1, 2.2), std('#d7ccb8'), 0, -0.05, 2.2, e, { cast: false });
  const dl = std('#9aa1ad', { metalness: 0.7, roughness: 0.3 });
  const eL = mesh(box(1.2, 2.6, 0.06), dl, -0.6, 1.3, 1.25, e), eR = mesh(box(1.2, 2.6, 0.06), dl, 0.6, 1.3, 1.25, e);
  // button panel on the right wall (x=1.19, facing -x)
  const pt = canvasTex(256, 640, (x, w, h) => { x.fillStyle = '#2a2d36'; x.fillRect(0, 0, w, h); x.font = 'bold 30px "DejaVu Sans Mono", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const nums = [100, 96, 92, 88, 84, 80, 76, 72, 68, 64, 60, 56, 52, 48, 44, 40, 36, 32, 28, 24, 20, 16, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    nums.forEach((n, k) => { const r = Math.floor(k / 4), c = k % 4; const cx = 40 + c * 58, cy = 30 + r * 58; x.fillStyle = '#c9ced8'; x.beginPath(); x.arc(cx, cy, 24, 0, 7); x.fill(); x.fillStyle = '#1a1a22'; x.font = `bold ${n > 99 ? 22 : 30}px "DejaVu Sans Mono", monospace`; x.fillText(String(n), cx, cy + 1); });
    x.fillStyle = '#ff3b4e'; x.beginPath(); x.arc(128, 590, 34, 0, 7); x.fill(); x.fillStyle = '#ffffff'; x.font = 'bold 44px "DejaVu Sans Mono", monospace'; x.fillText('0', 128, 592); });
  const panel = mesh(new THREE.PlaneGeometry(0.42, 1.05), new THREE.MeshStandardMaterial({ map: pt, emissive: '#ffffff', emissiveMap: pt, emissiveIntensity: 0.25 }), 1.19, 1.3, 0.6, e, { cast: false }); panel.rotation.y = -Math.PI / 2;
  W.zeroButton = [1.18, 0.88, 0.6];
  const dt = canvasTex(256, 96, () => {}); const disp = mesh(new THREE.PlaneGeometry(0.7, 0.26), new THREE.MeshBasicMaterial({ map: dt }), 0, 2.4, -1.19, e, { cast: false });
  const el = new THREE.PointLight('#fff1d6', 3, 0, 1.3); el.position.set(0, 2.4, 0); e.add(el); W.elevLight = el;
  W.elevator = { setOpen(k) { eL.position.x = -0.6 - 1.15 * k; eR.position.x = 0.6 + 1.15 * k; }, setFloor(t, col = '#ffb020') { const c = dt.userData.canvas, q = c.getContext('2d'); q.fillStyle = '#0b0b10'; q.fillRect(0, 0, 256, 96); q.fillStyle = col; q.font = 'bold 72px "DejaVu Sans Mono", monospace'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(t, 128, 52); dt.needsUpdate = true; } };
  W.elevator.setFloor('2');
}
