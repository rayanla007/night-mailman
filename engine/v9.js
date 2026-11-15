// Story 09 — Upside-Down Friday: ceiling handles, pizza, shoes, roof door, mirrored tree, cloud arms,
// hungry sky cloud, windmill (exterior + interior with the flip switch)
import * as THREE from 'three';
import { std, rb, box, mesh, canvasTex, makeDoor, makeTree } from './props.js';

function makeHandle() { // hangs down from y=0 (attach point) ; ring at the bottom
  const g = new THREE.Group();
  mesh(box(0.05, 0.4, 0.05), std('#2a2c34'), 0, -0.2, 0, g);
  const r = mesh(new THREE.TorusGeometry(0.11, 0.025, 8, 20), std('#ffd23a', { roughness: 0.4 }), 0, -0.5, 0, g); r.rotation.y = Math.PI / 2;
  return g;
}
function makePizza() {
  const g = new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 6, 1, false, 0, Math.PI / 3), std('#f0c060'), 0, 0, 0, g);
  mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.06, 6, 1, false, 0.02, Math.PI / 3 - 0.04), std('#ffb02a'), 0, 0.01, 0, g);
  for (const [a, r] of [[0.25, 0.22], [0.6, 0.3], [0.8, 0.15]]) mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.07, 12), std('#d8342a'), Math.sin(a) * r, 0.02, Math.cos(a) * r, g);
  return { group: g };
}
function makeShoe(color = '#ff3b4e', s = 1) {
  const g = new THREE.Group();
  mesh(rb(0.16, 0.08, 0.32, 0.03), std('#ffffff'), 0, 0.04, 0, g);
  mesh(rb(0.15, 0.12, 0.3, 0.05), std(color), 0, 0.12, -0.02, g);
  mesh(rb(0.14, 0.1, 0.12, 0.04), std(color), 0, 0.22, -0.08, g);
  for (let i = 0; i < 3; i++) mesh(box(0.1, 0.012, 0.012), std('#ffffff'), 0, 0.185, 0.04 + i * 0.04, g);
  g.scale.setScalar(s); return { group: g };
}
// blocky cloud arm, reaching along +y from its base, hand at the top
function makeCloudArm(len = 14) {
  const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ color: '#f4f6ff', roughness: 1, emissive: '#c8d4f0', emissiveIntensity: 0.3 });
  for (let i = 0; i < 6; i++) mesh(rb(2.2 - i * 0.12, len / 6 + 0.3, 2.2 - i * 0.12, 0.5), m, Math.sin(i * 0.9) * 0.3, (i + 0.5) * len / 6, 0, g, { cast: false });
  const hand = new THREE.Group(); hand.position.y = len + 0.6; g.add(hand);
  mesh(rb(2.0, 1.4, 1.2, 0.4), m, 0, 0, 0, hand, { cast: false });
  const fingers = [];
  for (let i = 0; i < 4; i++) { const f = new THREE.Group(); f.position.set(-0.75 + i * 0.5, 0.6, 0); hand.add(f); mesh(rb(0.38, 1.2, 0.5, 0.15), m, 0, 0.55, 0, f, { cast: false }); fingers.push(f); }
  const th = new THREE.Group(); th.position.set(1.0, 0, 0); hand.add(th); mesh(rb(0.4, 0.9, 0.5, 0.15), m, 0.3, 0.2, 0, th, { cast: false }); th.rotation.z = -0.8;
  return { group: g, setGrip(k) { fingers.forEach(f => (f.rotation.x = k * 1.4)); th.rotation.z = -0.8 + k * 0.9; } };
}
function hungryFace() {
  return canvasTex(512, 512, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    for (const cx of [170, 342]) { x.fillStyle = '#1a1420'; x.beginPath(); x.ellipse(cx, 190, 44, 58, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(cx + 14, 170, 14, 0, Math.PI * 2); x.fill(); }
    x.strokeStyle = '#1a1420'; x.lineWidth = 16; x.lineCap = 'round'; for (const [a, b] of [[110, 110], [400, 110]]) { x.beginPath(); x.moveTo(a, b + 10); x.lineTo(a + (a < 256 ? 100 : -100), b + 30); x.stroke(); }
    x.fillStyle = '#3a1020'; x.beginPath(); x.ellipse(256, 360, 150, 80, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff'; for (let i = 0; i < 7; i++) { x.beginPath(); x.moveTo(126 + i * 37, 300); x.lineTo(144 + i * 37, 340); x.lineTo(162 + i * 37, 300); x.fill(); x.beginPath(); x.moveTo(140 + i * 33, 425); x.lineTo(156 + i * 33, 395); x.lineTo(172 + i * 33, 425); x.fill(); }
    x.fillStyle = '#8fd0ff'; x.beginPath(); x.ellipse(390, 450, 16, 30, 0, 0, Math.PI * 2); x.fill();
  });
}

export function buildFlipKit(scene, W) {
  // ceiling handles in the dining room (ceiling underside at y = 3.3)
  const dn = W.sets.dining; W.ceilHandles = [];
  for (let i = 0; i < 4; i++) for (const z of [-4.6, -1.4]) { const h = makeHandle(); h.position.set(-3 + i * 2, 3.3, z); dn.add(h); W.ceilHandles.push(h); }
  W.ceilHandlesVis = v => W.ceilHandles.forEach(h => (h.visible = v));
  // ceiling stove for "cooking on the ceiling"
  const pan = new THREE.Group(); mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.08, 20), std('#2a2c34', { metalness: 0.5 }), 0, 0, 0, pan); mesh(box(0.5, 0.04, 0.06), std('#2a2c34'), 0.5, 0.02, 0, pan); mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 12), std('#ffe08a'), 0, 0.045, 0, pan);
  W.props.pan = { group: pan };
  W.props.pizza = makePizza();
  W.props.shoes = ['#ff3b4e', '#3fa9ff', '#40c463', '#ffd23a', '#9b5cff', '#ff9b4a'].map(c => makeShoe(c, 1));
  W.props.miloShoe = makeShoe('#ff3b4e', 0.75);
  // street: door on a roof (main-street house at x=12, z=-30 — roof ridge at y~8.6) + mirrored tree
  const st = W.sets.street;
  const rd = makeDoor({ w: 1, h: 1.8, color: '#ff4f8b' }); rd.group.position.set(12, 8.75, -30); rd.group.rotation.set(0, -Math.PI / 2, 0); st.add(rd.group); W.props.roofDoor = rd;
  const tUp = makeTree(3, 0.95); tUp.position.set(-9.2, 0, -25); st.add(tUp);
  const tDown = makeTree(3, 0.95); tDown.position.set(-9.2, 4.6, -25); tDown.rotation.z = Math.PI; st.add(tDown); W.props.flipTree = tDown;
  // cloud arms (in the street set, hanging from the sky downward; base high up)
  W.cloudArms = [0, 1, 2].map(i => { const a = makeCloudArm(16); st.add(a.group); a.group.visible = false; return a; });
  // hungry cloud face
  const hc = new THREE.Group(); const hm = new THREE.MeshStandardMaterial({ color: '#f2f5ff', roughness: 1, emissive: '#b8c4e0', emissiveIntensity: 0.3 });
  [[0, 0, 0, 34, 16, 14], [-18, -2, 0, 20, 12, 12], [18, -2, 0, 20, 12, 12], [-6, 8, -2, 18, 10, 10], [9, 7, -2, 16, 9, 10]].forEach(([x, y, z, w, h, d]) => mesh(rb(w, h, d, 3), hm, x, y, z, hc, { cast: false }));
  mesh(new THREE.PlaneGeometry(18, 18), new THREE.MeshBasicMaterial({ map: hungryFace(), transparent: true, depthWrite: false, fog: false }), 0, -1, 7.05, hc, { cast: false }).renderOrder = 2;
  W.props.hungryCloud = { group: hc };

  // ---------- WINDMILL (x = -1900): exterior at origin, interior room at x = 40 ----------
  const g = new THREE.Group(); g.name = 'windmill'; g.position.set(-1900, 0, 0); scene.add(g); W.sets.windmill = g;
  const gr = mesh(new THREE.PlaneGeometry(400, 400), std('#62cc5c', { roughness: 1 }), 0, 0, 0, g, { cast: false }); gr.rotation.x = -Math.PI / 2;
  const hill = mesh(new THREE.SphereGeometry(14, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), std('#58bd52', { roughness: 1 }), 0, -9, -6, g, { cast: false }); hill.scale.y = 0.75;
  const mill = new THREE.Group(); mill.position.set(0, 1.4, -6); g.add(mill);
  mesh(new THREE.CylinderGeometry(2.2, 3.2, 10, 8), std('#e8dcc4', { roughness: 0.8 }), 0, 5, 0, mill);
  const cap = mesh(new THREE.ConeGeometry(2.8, 3, 8), std('#b04a3a'), 0, 11.5, 0, mill);
  mesh(box(1.4, 2.2, 0.2), std('#6a4a30'), 0, 1.1, 3.0, mill);
  const blades = new THREE.Group(); blades.position.set(0, 9, 2.6); mill.add(blades);
  for (let i = 0; i < 4; i++) { const b = new THREE.Group(); b.rotation.z = i * Math.PI / 2; blades.add(b); mesh(box(0.25, 7, 0.15), std('#6a4a30'), 0, 3.5, 0, b); mesh(box(1.4, 5.5, 0.06), std('#f4ead8'), 0.75, 4, 0, b); }
  mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.6, 12), std('#4a3a2a'), 0, 9, 2.4, mill).rotation.x = Math.PI / 2;
  W.millBlades = blades;
  // interior (x = 40): round-ish wooden room with a big lever on a panel, gears
  const I = new THREE.Group(); I.position.set(40, 0, 0); g.add(I);
  const plank = canvasTex(256, 256, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#8a6040' : '#7a5236'; x.fillRect(0, i * 32, w, 32); x.fillStyle = 'rgba(0,0,0,0.2)'; x.fillRect(0, i * 32, w, 2); } });
  plank.wrapS = plank.wrapT = THREE.RepeatWrapping; plank.repeat.set(3, 2);
  const pm = new THREE.MeshStandardMaterial({ map: plank, roughness: 0.9 });
  mesh(box(8, 0.1, 8), pm, 0, -0.05, 0, I, { cast: false });
  mesh(box(8, 5, 0.2), pm, 0, 2.5, -4, I); mesh(box(0.2, 5, 8), pm, -4, 2.5, 0, I); mesh(box(0.2, 5, 8), pm, 4, 2.5, 0, I);
  for (let i = 0; i < 3; i++) mesh(box(8, 0.3, 0.3), std('#5a3a24'), 0, 4.6, -3 + i * 3, I);
  const panel = new THREE.Group(); panel.position.set(0, 0, -3.8); I.add(panel);
  mesh(rb(2.4, 2.6, 0.3, 0.05), std('#5a5f6e', { metalness: 0.4, roughness: 0.5 }), 0, 1.6, 0, panel);
  const signT = canvasTex(256, 64, (x, w, h) => { x.fillStyle = '#ffd23a'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a1420'; x.font = '900 40px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('FLIP', w / 2, h / 2 + 2); });
  mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshStandardMaterial({ map: signT }), 0, 2.65, 0.16, panel, { cast: false });
  mesh(box(0.2, 1.4, 0.1), std('#1a1c24'), 0, 1.55, 0.16, panel); // slot
  const lever = new THREE.Group(); lever.position.set(0, 1.55, 0.2); panel.add(lever);
  mesh(box(0.1, 0.9, 0.1), std('#c8cdd8', { metalness: 0.7, roughness: 0.3 }), 0, 0.45, 0, lever);
  mesh(new THREE.SphereGeometry(0.15, 14, 10), std('#e8233c', { roughness: 0.3 }), 0, 0.92, 0, lever);
  W.flipLever = lever; W.flipPanel = panel;
  for (const [x, y, r] of [[-2.6, 3.4, 0.9], [2.5, 3.2, 1.1], [2.9, 1.6, 0.6]]) { const gg = mesh(new THREE.CylinderGeometry(r, r, 0.25, 16), std('#a07a3a', { metalness: 0.5, roughness: 0.4 }), x, y, -3.8, I); gg.rotation.x = Math.PI / 2; }
  const lamp = new THREE.PointLight('#ffd9a0', 6, 12, 1.4); lamp.position.set(0, 3.8, -1); I.add(lamp);

  W.resetHooks = W.resetHooks || [];
  W.resetHooks.push(() => {
    W.ceilHandlesVis(true);
    for (const p of [W.props.pan, W.props.pizza, W.props.miloShoe, ...W.props.shoes, W.props.hungryCloud]) { p.group.removeFromParent(); p.group.rotation.set(0, 0, 0); }
    W.cloudArms.forEach(a => { a.group.visible = false; a.setGrip(0); a.group.rotation.set(0, 0, 0); });
    if (W.clouds) W.clouds.position.y = 0;
    W.props.bed.rotation.set(0, 0, 0);
    W.flipLever.rotation.x = 0;
    for (const h of W.houses) { h.group.position.y = 0; h.group.rotation.x = 0; }
    W.props.truck.position.y = 0;
  });
}
