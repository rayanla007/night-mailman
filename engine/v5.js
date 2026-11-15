// Story kit additions: Battery Town (charging station), shared by later stories.
import * as THREE from 'three';
import { std, basic, rb, box, mesh, canvasTex } from './props.js';

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
