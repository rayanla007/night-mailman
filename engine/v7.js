// Story 07 — Shadow Shift: shadow workers (silhouettes with tools), Ryan's shadow, old factory set
import * as THREE from 'three';
import { std, rb, box, mesh, canvasTex, makeTower } from './props.js';
import { makeCharacter } from './character.js';

function makeLadder(h = 2.6) {
  const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: '#04050a' });
  for (const s of [-1, 1]) mesh(box(0.06, h, 0.06), m, s * 0.22, h / 2, 0, g);
  for (let y = 0.3; y < h; y += 0.35) mesh(box(0.44, 0.05, 0.05), m, 0, y, 0, g);
  return { group: g };
}
const blackM = () => new THREE.MeshBasicMaterial({ color: '#04050a' });
function makeBroom() { const g = new THREE.Group(); mesh(box(0.05, 1.4, 0.05), blackM(), 0, 0.7, 0, g); mesh(box(0.4, 0.22, 0.1), blackM(), 0, 0.05, 0, g); return { group: g }; }
function makeHammer() { const g = new THREE.Group(); mesh(box(0.05, 0.45, 0.05), blackM(), 0, 0.22, 0, g); mesh(box(0.22, 0.09, 0.09), blackM(), 0, 0.45, 0, g); return { group: g }; }
function makeRoller() { const g = new THREE.Group(); mesh(box(0.04, 0.9, 0.04), blackM(), 0, 0.45, 0, g); const r = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.35, 10), blackM(), 0, 0.92, 0, g); r.rotation.z = Math.PI / 2; return { group: g }; }

function brickTex(base = '#6b3a2e', mortar = '#3a2620') {
  const t = canvasTex(256, 256, (x, w, h) => { x.fillStyle = mortar; x.fillRect(0, 0, w, h); for (let r = 0; r < 16; r++) for (let c = 0; c < 9; c++) { const off = r % 2 ? 14 : 0; const v = 0.8 + ((r * 7 + c * 13) % 5) * 0.06; x.fillStyle = new THREE.Color(base).multiplyScalar(v).getStyle(); x.fillRect(c * 30 - off + 1, r * 16 + 1, 28, 14); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

export function buildShadowKit(scene, W) {
  // ---------- shadow workers ----------
  const hairs = ['clumps', 'spiky', 'gus', 'mia', 'theo', 'pell', 'cap', 'bo', 'toupee', 'crowd1', 'crowd2'];
  W.shadows = [];
  for (let i = 0; i < 22; i++) {
    const sc = [0.92, 1.1, 0.7, 1.25, 0.6, 1.0][i % 6];
    const c = makeCharacter({ name: 'Shadow' + i, hair: hairs[i % hairs.length], silhouette: true, scale: sc });
    scene.add(c.group); W.shadows.push(c);
  }
  W.chars.shadowRyan = makeCharacter({ name: 'ShadowRyan', hair: 'clumps', silhouette: true, scale: 0.92 }); scene.add(W.chars.shadowRyan.group);
  // flat floor shadow (silhouette lying on the ground behind someone's feet)
  W.chars.flatShadow = makeCharacter({ name: 'FlatShadow', hair: 'clumps', silhouette: true, scale: 0.92 }); scene.add(W.chars.flatShadow.group);
  W.props.ladder = makeLadder(); W.props.ladder2 = makeLadder(3.2);
  W.props.brooms = [0, 1, 2, 3, 4].map(makeBroom); W.props.hammers = [0, 1, 2, 3].map(makeHammer); W.props.rollers = [0, 1, 2, 3].map(makeRoller);
  // fresh road patches (dark squares) + wet paint strip
  const patches = new THREE.Group(); for (let i = 0; i < 6; i++) mesh(box(1.4, 0.065, 1.1), std('#2a2e38', { roughness: 0.6 }), -2 + (i % 3) * 2, 0.035, -8 - Math.floor(i / 3) * 4, patches, { cast: false });
  W.props.patches = { group: patches };

  // ---------- FACTORY (x = -1500): interior room around origin, exterior building at x = 60 ----------
  const f = new THREE.Group(); f.name = 'factory'; f.position.set(-1500, 0, 0); scene.add(f); W.sets.factory = f;
  const g0 = mesh(new THREE.PlaneGeometry(400, 400), std('#2c3448', { roughness: 1 }), 0, 0, 0, f, { cast: false }); g0.rotation.x = -Math.PI / 2;
  const concrete = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#5a5f6e'; x.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(0,0,0,${0.05 + (i % 7) * 0.01})`; x.fillRect((i * 37) % w, (i * 91) % h, 3 + i % 5, 3 + i % 4); } x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 2; for (let i = 0; i <= 256; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } });
  concrete.wrapS = concrete.wrapT = THREE.RepeatWrapping; concrete.repeat.set(6, 6);
  mesh(box(24, 0.1, 30), new THREE.MeshStandardMaterial({ map: concrete, roughness: 0.9 }), 0, 0.05, 0, f, { cast: false });
  const bt = brickTex(); bt.repeat.set(6, 3);
  const brick = new THREE.MeshStandardMaterial({ map: bt, roughness: 0.95 });
  const winM = new THREE.MeshBasicMaterial({ color: '#9fc0ff' });
  // back wall (z=-15) with tall windows, side walls, front wall (z=15) with door gap
  for (const [w, x, z, ry] of [[24, 0, -15, 0], [30, -12, 0, Math.PI / 2], [30, 12, 0, Math.PI / 2]]) { const m = mesh(box(w, 9, 0.4), brick, x, 4.5, z, f); m.rotation.y = ry; }
  for (const s of [-1, 1]) mesh(box(9.5, 9, 0.4), brick, s * 7.25, 4.5, 15, f);
  mesh(box(5, 4, 0.4), brick, 0, 7, 15, f);
  for (let i = 0; i < 5; i++) { const x = -9.6 + i * 4.8; mesh(box(2.2, 4.4, 0.05), winM, x, 5, -14.78, f, { cast: false }); for (const yy of [3.6, 5, 6.4]) mesh(box(2.3, 0.1, 0.1), std('#20232e'), x, yy, -14.75, f); mesh(box(0.1, 4.5, 0.1), std('#20232e'), x, 5, -14.75, f); }
  // moon beams
  const beamM = new THREE.MeshBasicMaterial({ color: '#bcd2ff', transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide });
  for (let i = 0; i < 5; i++) { const b = mesh(box(2.2, 0.02, 12), beamM, -9.6 + i * 4.8, 3.2, -9, f, { cast: false }); b.rotation.x = 0.45; }
  // roof beams + pipes + crates
  for (let z = -12; z <= 12; z += 6) mesh(box(24, 0.5, 0.5), std('#3a3f4e'), 0, 8.6, z, f);
  for (const x of [-10.5, 10.5]) { const p = mesh(new THREE.CylinderGeometry(0.25, 0.25, 30, 12), std('#7a5a3a', { metalness: 0.4, roughness: 0.6 }), x, 6.5, 0, f); p.rotation.x = Math.PI / 2; }
  for (const [x, z, s] of [[-9, -11, 1.2], [-7.6, -11.4, 0.9], [9.2, 9, 1.3], [8, 10.5, 0.8], [9.5, -6, 1]]) mesh(rb(s, s, s, 0.04), std('#8a6a44', { roughness: 0.9 }), x, s / 2 + 0.1, z, f);
  W.factoryLight = new THREE.PointLight('#a9c4ff', 0, 30, 1.6); W.factoryLight.position.set(0, 7, -6); f.add(W.factoryLight);
  // exterior: big brick building + chimneys, at x = 60 (front faces +z)
  const ex = new THREE.Group(); ex.position.set(60, 0, 0); f.add(ex);
  const bt2 = brickTex('#5a3026'); bt2.repeat.set(10, 4);
  mesh(box(40, 14, 20), new THREE.MeshStandardMaterial({ map: bt2, roughness: 0.95 }), 0, 7, 0, ex);
  for (const [x, h] of [[-12, 30], [-4, 26], [10, 34]]) { mesh(new THREE.CylinderGeometry(1.4, 1.8, h, 12), new THREE.MeshStandardMaterial({ map: bt2, roughness: 0.95 }), x, h / 2, -4, ex); }
  for (let i = 0; i < 8; i++) for (const yy of [4, 10]) { const lit = (i * 3 + yy) % 7 === 0; mesh(box(2.6, 3, 0.1), lit ? new THREE.MeshBasicMaterial({ color: '#4d5f8f' }) : std('#14182a', { roughness: 0.2 }), -16 + i * 4.6, yy, 10.06, ex, { cast: false }); }
  mesh(box(6, 6, 0.2), std('#1b1d26'), 0, 3, 10.1, ex);
  const sign = canvasTex(512, 128, (x, w, h) => { x.fillStyle = '#2a2420'; x.fillRect(0, 0, w, h); x.font = '900 72px Montserrat'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#c9b48a'; x.fillText('OLD FACTORY', w / 2, h / 2 + 4); });
  mesh(new THREE.PlaneGeometry(12, 3), new THREE.MeshStandardMaterial({ map: sign, roughness: 0.8 }), 0, 12, 10.12, ex, { cast: false });
  const fence = new THREE.Group(); ex.add(fence); for (let x = -26; x <= 26; x += 1.2) if (Math.abs(x) > 4) mesh(box(0.08, 2.4, 0.08), std('#2a2c34'), x, 1.2, 22, fence); mesh(box(52, 0.08, 0.08), std('#2a2c34'), 0, 2.2, 22, fence); mesh(box(52, 0.08, 0.08), std('#2a2c34'), 0, 0.6, 22, fence);
  // a few skyline towers behind
  for (let i = 0; i < 8; i++) { const t = makeTower(14, 20 + (i * 13) % 30, 12, '#3a4466', i); t.position.set(-10 + i * 18, 0, -70 - (i % 2) * 10); ex.add(t); }

  const setCast = (c, on) => c.group.traverse(o => { if (o.isMesh) o.castShadow = on; });
  W.setCastShadow = setCast;
  W.resetHooks = W.resetHooks || [];
  W.resetHooks.push(() => {
    for (const c of [...W.shadows, W.chars.shadowRyan, W.chars.flatShadow]) { c.group.visible = false; c.setPose({}); c.group.rotation.set(0, 0, 0); c.group.scale.set(1, 1, 1); c.setFace('glow'); scene.add(c.group); }
    for (const p of [W.props.ladder, W.props.ladder2, ...W.props.brooms, ...W.props.hammers, ...W.props.rollers, W.props.patches]) { p.group.removeFromParent(); p.group.rotation.set(0, 0, 0); }
    setCast(W.chars.ivy, true);
    W.factoryLight.intensity = 0;
  });
}
