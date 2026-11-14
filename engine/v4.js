// v4 "Skip Button": wrist skip-buttons, classroom, repair shop, cast.
import * as THREE from 'three';
import { makeCharacter } from './character.js';
import { std, basic, rb, box, mesh, canvasTex } from './props.js';
import { makeSignBoard } from './v3.js';

// ---------- wrist skip button ----------
function buttonTex(state) {
  return canvasTex(128, 128, (x, W, H) => {
    const on = state !== 'off';
    x.fillStyle = on ? '#0b2a3a' : '#2a2d36'; x.beginPath(); x.arc(64, 64, 62, 0, 7); x.fill();
    x.lineWidth = 9; x.strokeStyle = on ? '#3ff0ff' : '#5b606e'; x.beginPath(); x.arc(64, 64, 54, 0, 7); x.stroke();
    x.fillStyle = on ? '#bffbff' : '#6b7080';
    for (const dx of [-16, 10]) { x.beginPath(); x.moveTo(72 + dx, 38); x.lineTo(44 + dx, 64); x.lineTo(72 + dx, 90); x.closePath(); x.fill(); } // drawn mirrored: reads as >> on the wrist
  });
}
const BTEX = {};
export function addWristButton(char) {
  const g = new THREE.Group();
  const scale = 1;
  BTEX.off = BTEX.off || buttonTex('off'); BTEX.on = BTEX.on || buttonTex('on');
  mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.045, 24), std('#1d2029', { metalness: 0.5, roughness: 0.35 }), 0, 0, 0, g);
  const face = new THREE.MeshStandardMaterial({ map: BTEX.off, emissive: '#ffffff', emissiveMap: BTEX.off, emissiveIntensity: 0.0, roughness: 0.3 });
  const top = mesh(new THREE.CircleGeometry(0.095, 24), face, 0, 0.024, 0, g, { cast: false }); top.rotation.x = -Math.PI / 2;
  const light = new THREE.PointLight('#3ff0ff', 0, 1.6, 1.6); light.position.set(0, 0.15, 0); g.add(light);
  // on the front of the left forearm, near the wrist
  g.rotation.x = Math.PI / 2; g.position.set(0, -0.24, 0.215); g.scale.setScalar(scale);
  char.joints.elbowL.add(g);
  const api = {
    group: g, light,
    set(state, t = 0) { // 'off' | 'on' | 'skip' | 'blink'
      let k = state === 'off' ? 0 : state === 'on' ? 1 : state === 'skip' ? 1.2 + 0.5 * Math.sin(t * 12) : (Math.sin(t * 25) > 0 ? 1.4 : 0);
      face.map = face.emissiveMap = k > 0 ? BTEX.on : BTEX.off; face.emissiveIntensity = k * 1.3; face.needsUpdate = true;
      light.intensity = k * 0.8;
    },
  };
  api.set('off'); char.button = api;
  return api;
}

// ---------- classroom ----------
function makeDesk(chairColor = '#ff5a5a') {
  const g = new THREE.Group();
  mesh(rb(1.2, 0.08, 0.75, 0.02), std('#c88a4f', { roughness: 0.6 }), 0, 0.78, 0, g);
  for (const [x, z] of [[-0.52, -0.3], [0.52, -0.3], [-0.52, 0.3], [0.52, 0.3]]) mesh(box(0.06, 0.78, 0.06), std('#3b3f4f'), x, 0.39, z, g);
  const ch = new THREE.Group(); ch.position.set(0, 0, 0.75); g.add(ch);
  mesh(rb(0.6, 0.06, 0.55, 0.02), std(chairColor), 0, 0.48, 0, ch);
  mesh(rb(0.6, 0.6, 0.06, 0.02), std(chairColor), 0, 0.8, 0.27, ch);
  for (const [x, z] of [[-0.25, -0.22], [0.25, -0.22], [-0.25, 0.22], [0.25, 0.22]]) mesh(box(0.05, 0.48, 0.05), std('#3b3f4f'), x, 0.24, z, ch);
  return g;
}

function makeClassroom(W) {
  const g = new THREE.Group(); g.name = 'classroom';
  const floorTex = canvasTex(256, 256, (x, w, h) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#e8ecf3' : '#c9d2e6'; x.fillRect(i * 64, j * 64, 64, 64); } });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(6, 6);
  mesh(box(14, 0.2, 14), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.6 }), 0, -0.1, 0, g, { cast: false });
  const wall = std('#f6e9cf', { roughness: 0.85 }), trim = std('#2f8f6a');
  mesh(box(14, 4, 0.2), wall, 0, 2, -7, g); mesh(box(0.2, 4, 14), wall, -7, 2, 0, g); mesh(box(0.2, 4, 14), wall, 7, 2, 0, g); mesh(box(14, 4, 0.2), wall, 0, 2, 7, g);
  mesh(box(14, 0.2, 14), std('#ffffff'), 0, 4.1, 0, g);
  for (const [x, z, w, d] of [[0, -6.88, 14, 0.06], [-6.88, 0, 0.06, 14], [6.88, 0, 0.06, 14]]) mesh(box(w, 0.9, d), trim, x, 0.45, z, g);
  // windows on the right wall
  for (const z of [-3.5, 0, 3.5]) { mesh(box(0.06, 1.8, 2.4), std('#9fd6ff', { metalness: 0.4, roughness: 0.1, emissive: '#bfe6ff', emissiveIntensity: 0.4 }), 6.88, 2.3, z, g, { cast: false }); mesh(box(0.1, 0.1, 2.5), std('#ffffff'), 6.85, 2.3, z, g); }
  // chalkboard (text changes per shot)
  const bt = canvasTex(1024, 400, () => {});
  const board = mesh(new THREE.PlaneGeometry(6, 2.3), new THREE.MeshStandardMaterial({ map: bt, roughness: 0.9 }), 0, 2.3, -6.88, g, { cast: false });
  mesh(box(6.3, 2.6, 0.08), std('#8b5a2b'), 0, 2.3, -6.93, g);
  W.setBoard = (lines, color = '#ffffff') => {
    const c = bt.userData.canvas, x = c.getContext('2d'); x.fillStyle = '#21473a'; x.fillRect(0, 0, 1024, 400);
    x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle';
    lines.forEach((l, i) => { x.font = `700 ${i === 0 && lines.length > 1 ? 96 : 120}px Fredoka`; x.fillText(l, 512, 400 * (i + 1) / (lines.length + 1)); });
    bt.needsUpdate = true;
  };
  W.setBoard(['2x + 7 = 19']);
  // wall clock
  const ck = mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 32), std('#ffffff'), 4.2, 3.2, -6.86, g); ck.rotation.x = Math.PI / 2;
  mesh(box(0.05, 0.32, 0.02), std('#222'), 4.2, 3.32, -6.8, g); mesh(box(0.22, 0.04, 0.02), std('#222'), 4.3, 3.2, -6.8, g);
  // teacher desk
  mesh(rb(2.4, 0.9, 1.0, 0.04), std('#8b5a2b'), -3.5, 0.45, -4.8, g);
  const papers = new THREE.Group(); papers.position.set(-3.8, 0.9, -4.8); g.add(papers);
  for (let i = 0; i < 12; i++) { const p = mesh(box(0.42, 0.012, 0.56), std('#ffffff'), 0, i * 0.013, 0, papers); p.rotation.y = (i % 3 - 1) * 0.06; }
  W.papers = papers;
  // desks grid
  W.desks = [];
  const cols = ['#ff5a5a', '#3fa9ff', '#40c463', '#ffb020', '#9b5cff'];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const d = makeDesk(cols[(r + c) % 5]); d.position.set(-4.2 + c * 2.8, 0, -2 + r * 2.6); g.add(d); W.desks.push(d); }
  const posterL = makeSignBoard([{ t: 'NO SKIPPING', c: '#ffffff' }, { t: 'IN CLASS!', c: '#ffe14a', s: 0.8 }], { w: 2.4, h: 1.3, bg: '#e8233c', font: 'Fredoka' });
  posterL.group.position.set(-6.85, 2.6, -2); posterL.group.rotation.y = Math.PI / 2; g.add(posterL.group);
  const lamp = new THREE.PointLight('#fff4e0', 3, 0, 1.2); lamp.position.set(0, 3.6, 0); g.add(lamp);
  return g;
}

// ---------- repair shop ----------
function makeShop(W) {
  const g = new THREE.Group(); g.name = 'shop';
  mesh(box(10, 0.2, 10), std('#b07a4f', { roughness: 0.7 }), 0, -0.1, 0, g, { cast: false });
  const wall = std('#cfe6f3', { roughness: 0.85 });
  mesh(box(10, 4, 0.2), wall, 0, 2, -5, g); mesh(box(0.2, 4, 10), wall, -5, 2, 0, g); mesh(box(0.2, 4, 10), wall, 5, 2, 0, g); mesh(box(10, 0.2, 10), std('#ffffff'), 0, 4.1, 0, g);
  mesh(rb(5, 1.1, 1.1, 0.04), std('#3b6fd6'), 0, 0.55, -1.5, g);
  mesh(rb(5.2, 0.1, 1.3, 0.03), std('#f4f4f4'), 0, 1.15, -1.5, g);
  // shelves of gadgets
  const gc = ['#ff5a5a', '#3fa9ff', '#40c463', '#ffb020', '#9b5cff', '#ff7ac4'];
  for (let s = 0; s < 3; s++) { mesh(box(7, 0.08, 0.6), std('#8b5a2b'), 0, 1.4 + s * 0.8, -4.6, g); for (let i = 0; i < 9; i++) mesh(rb(0.45, 0.35 + (i % 3) * 0.1, 0.4, 0.06), std(gc[(i + s) % 6]), -3.1 + i * 0.78, 1.62 + s * 0.8 + (i % 3) * 0.05, -4.6, g); }
  const sign = makeSignBoard([{ t: 'BUTTON REPAIR', c: '#ffffff' }, { t: 'we fix ANY skip button', c: '#ffe14a', s: 0.6 }], { w: 5, h: 1.3, bg: '#2f6fe0', font: 'Fredoka' });
  sign.group.position.set(0, 3.35, -4.85); g.add(sign.group);
  const l = new THREE.PointLight('#fff4e0', 3, 0, 1.2); l.position.set(0, 3.5, 1); g.add(l);
  return g;
}

function makeCake() {
  const g = new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 24), std('#ff9bd2'), 0, 0.16, 0, g);
  mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.06, 24), std('#ffffff'), 0, 0.33, 0, g);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; mesh(box(0.04, 0.18, 0.04), std('#3fa9ff'), Math.cos(a) * 0.25, 0.45, Math.sin(a) * 0.25, g); mesh(new THREE.SphereGeometry(0.035, 8, 6), basic('#ffd27a'), Math.cos(a) * 0.25, 0.57, Math.sin(a) * 0.25, g, { cast: false }); }
  return g;
}

export function buildV4(scene, W, { buttons = true } = {}) {
  const cr = makeClassroom(W); cr.position.set(-800, 0, 0); scene.add(cr); W.sets.classroom = cr;
  const sh = makeShop(W); sh.position.set(-900, 0, 0); scene.add(sh); W.sets.shop = sh;
  W.props.cake = { group: makeCake() };
  const C = (o) => makeCharacter(o);
  const jayden = C({ name: 'Jayden', skin: '#c98a5c', shirt: '#2fbf71', print: 'jacket', pants: '#2a2a3a', shoes: '#ffffff', hair: 'spiky', hairColor: '#1a1410', scale: 0.92 });
  const jaydenOld = C({ name: 'JaydenOld', skin: '#c98a5c', shirt: '#2a8f5c', print: 'jacket', pants: '#24242e', shoes: '#cfcfcf', hair: 'crowd2', hairColor: '#1a1410', scale: 1.0, faceOpts: { beard: '#2a1d14' } });
  const mom = C({ name: 'Mom', skin: '#f1c09a', shirt: '#ff7ac4', print: 'cardigan', pants: '#3b4a8f', shoes: '#ffffff', hair: 'mia', hairColor: '#7a4a2a', scale: 1.0 });
  const teacher = C({ name: 'Teacher', skin: '#e0a77a', shirt: '#ffffff', print: 'cardigan', pants: '#4b4f72', shoes: '#2b1d16', hair: 'gus', hairColor: '#8a8f9a', scale: 1.04, faceOpts: { glasses: true } });
  const repair = C({ name: 'Repair', skin: '#f3c39a', shirt: '#ffb020', print: 'overalls', pants: '#2f6fe0', shoes: '#2b1d16', hair: 'cap', hatColor: '#e8233c', hairColor: '#3b2416', scale: 1.05 });
  const postman = C({ name: 'Postman', skin: '#8d5a3b', shirt: '#2f6fe0', print: 'jacket', pants: '#1f2a52', shoes: '#111', hair: 'cap', hatColor: '#1f2a52', hairColor: '#111', scale: 1.02 });
  Object.assign(W.chars, { jayden, jaydenOld, mom, teacher, repair, postman });
  for (const c of [jayden, jaydenOld, mom, teacher, repair, postman]) scene.add(c.group);
  // everyone gets a wrist button
  if (buttons) for (const c of [W.chars.ivy, jayden, jaydenOld, mom, teacher, repair, postman, ...W.crowd]) addWristButton(c);
  W.v4 = true;
}
