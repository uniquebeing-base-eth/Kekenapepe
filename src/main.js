import * as THREE from 'three';
import './style.css';

const gameElement = document.querySelector('#game');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#b8e8c9');
scene.fog = new THREE.Fog('#b8e8c9', 38, 135);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 220);
function setCameraFraming() {
  const narrowScreen = window.innerWidth < 700;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.fov = narrowScreen ? 64 : 43;
  camera.position.y = narrowScreen ? 5.6 : 5.3;
  camera.position.z = narrowScreen ? 11.9 : 9.7;
  camera.updateProjectionMatrix();
}
setCameraFraming();
camera.lookAt(0, 1, -0.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
gameElement.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight('#eafff0', '#697d54', 2.1));
const sun = new THREE.DirectionalLight('#fff1c1', 3.2);
sun.position.set(-15, 27, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -24;
sun.shadow.camera.right = 24;
sun.shadow.camera.top = 25;
sun.shadow.camera.bottom = -20;
sun.shadow.bias = -0.0006;
scene.add(sun);

const colors = {
  road: '#424b48', shoulder: '#d3c5a0', line: '#f8e5a1', leaf: '#4d9660',
  roof: '#bd6650', wall: '#f2d7a1', mint: '#c5e4c9', cream: '#f4e8c9',
};
const mats = Object.fromEntries(Object.entries(colors).map(([key, color]) => [key, new THREE.MeshStandardMaterial({ color, roughness: 0.92 })]));
function roadCurve(z) {
  const firstBend = (z + 206) / 56;
  const secondBend = (z + 382) / 48;
  return 3.1 * Math.exp(-firstBend * firstBend) - 2.6 * Math.exp(-secondBend * secondBend);
}

const routeStart = -540;
const routeLength = 1100;
const sceneryLoopLength = 50 * 10.5;
const roadMaterial = new THREE.MeshStandardMaterial({ color: colors.road, roughness: 0.94 });
const roadGeometry = new THREE.PlaneGeometry(11.4, routeLength, 1, 260);
roadGeometry.rotateX(-Math.PI / 2);
const roadPositions = roadGeometry.attributes.position;
for (let i = 0; i < roadPositions.count; i += 1) {
  const worldZ = routeStart + roadPositions.getZ(i);
  roadPositions.setX(i, roadCurve(worldZ) + roadPositions.getX(i));
}
roadGeometry.computeVertexNormals();
const road = new THREE.Mesh(roadGeometry, roadMaterial);
road.position.set(0, -0.07, routeStart);
road.receiveShadow = true;
scene.add(road);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(380, routeLength + 180), new THREE.MeshStandardMaterial({ color: '#8fc894', roughness: 1 }));
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -0.16, routeStart - 90);
ground.receiveShadow = true;
scene.add(ground);

const laneWidth = 3.35;
const lanes = [-laneWidth, 0, laneWidth];
const dashMaterial = new THREE.MeshStandardMaterial({ color: '#f8e5a1', roughness: 0.8 });
const dashes = [];
for (const x of [-laneWidth / 2, laneWidth / 2]) {
  for (let i = 0; i < 75; i += 1) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.018, 2.1), dashMaterial);
    dash.userData.laneMarkX = x;
    dash.position.set(roadCurve(9 - i * 7.2) + x, -0.015, 9 - i * 7.2);
    scene.add(dash);
    dashes.push(dash);
  }
}
for (const x of [-5.58, 5.58]) {
  const edgeGeometry = new THREE.PlaneGeometry(0.11, routeLength, 1, 260);
  edgeGeometry.rotateX(-Math.PI / 2);
  const edgePositions = edgeGeometry.attributes.position;
  for (let i = 0; i < edgePositions.count; i += 1) {
    const worldZ = routeStart + edgePositions.getZ(i);
    edgePositions.setX(i, roadCurve(worldZ) + x + edgePositions.getX(i));
  }
  edgeGeometry.computeVertexNormals();
  const edge = new THREE.Mesh(edgeGeometry, new THREE.MeshStandardMaterial({ color: '#f2ead0' }));
  edge.position.set(0, -0.01, routeStart);
  scene.add(edge);
}

const random = (() => {
  let seed = 83922;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
})();

function makeBox(parent, width, height, depth, material, position, castShadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(...position);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function createPalm(x, z, scale = 1) {
  const palm = new THREE.Group();
  palm.position.set(x, 0, z);
  palm.userData.roadsideX = x;
  palm.scale.setScalar(scale);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.29, 4, 6), new THREE.MeshStandardMaterial({ color: '#956746', roughness: 1 }));
  trunk.position.y = 2;
  trunk.rotation.z = -0.09;
  trunk.castShadow = true;
  palm.add(trunk);
  const leafMaterial = new THREE.MeshStandardMaterial({ color: '#458856', roughness: 1, flatShading: true });
  for (let i = 0; i < 7; i += 1) {
    const angle = i / 7 * Math.PI * 2;
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.34, 2.9, 4), leafMaterial);
    frond.position.set(Math.cos(angle) * 1.12, 4.05, Math.sin(angle) * 1.12);
    frond.rotation.z = -Math.cos(angle) * 0.85;
    frond.rotation.x = Math.sin(angle) * 0.85;
    frond.rotation.y = angle;
    frond.castShadow = true;
    palm.add(frond);
  }
  scene.add(palm);
  return palm;
}

function createBuilding(x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.userData.roadsideX = x;
  const width = 5.4 + random() * 5.5;
  const height = 5 + random() * 8;
  const depth = 6 + random() * 7;
  const wallOptions = [mats.wall, mats.mint, mats.cream, new THREE.MeshStandardMaterial({ color: '#e6aa70', roughness: 1 })];
  const wall = wallOptions[Math.floor(random() * wallOptions.length)];
  makeBox(group, width, height, depth, wall, [0, height / 2, 0]);
  makeBox(group, width + 0.3, 0.28, depth + 0.3, mats.roof, [0, height + 0.12, 0]);
  const windowMaterial = new THREE.MeshStandardMaterial({ color: '#83b8a3', roughness: 0.5, metalness: 0.06 });
  const rows = Math.max(1, Math.floor(height / 2.1));
  const cols = Math.max(2, Math.floor(width / 1.8));
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const wx = (col - (cols - 1) / 2) * (width / cols);
      const wy = 1.25 + row * 1.85;
      makeBox(group, 0.52, 0.72, 0.055, windowMaterial, [wx, wy, depth / 2 + 0.035], false);
    }
  }
  scene.add(group);
  return group;
}

const scenery = [];
for (let i = 0; i < 50; i += 1) {
  const z = 8 - i * 10.5;
  for (const side of [-1, 1]) {
    if (i % 3 === 0 || random() > 0.48) {
      const tree = createPalm(side * (8.4 + random() * 6), z - random() * 3, 0.72 + random() * 0.62);
      scenery.push(tree);
    } else {
      const building = createBuilding(side * (11 + random() * 5), z - random() * 2);
      scenery.push(building);
    }
  }
}

const cityLandmarks = [];
const trafficSignals = [];
const policeCheckpoints = [];

function addCityLandmark(group, x, z, osmCoordinate = null) {
  group.position.set(x + roadCurve(z), 0, z);
  group.userData.roadsideX = x;
  group.userData.startX = group.position.x;
  group.userData.startZ = z;
  group.userData.osmCoordinate = osmCoordinate;
  scene.add(group);
  cityLandmarks.push(group);
  return group;
}

function createSignMaterial(title, subtitle, background = '#1d6547') {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 180;
  const context = canvas.getContext('2d');
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#f4f0d6';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  let fontSize = 48;
  context.font = `800 ${fontSize}px Arial`;
  while (context.measureText(title).width > 598 && fontSize > 24) {
    fontSize -= 2;
    context.font = `800 ${fontSize}px Arial`;
  }
  context.fillText(title, 320, 62);
  context.fillStyle = '#d4e5b5';
  context.font = '700 24px Arial';
  context.fillText(subtitle, 320, 132);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: texture });
}

function createRoadSign(title, subtitle, x, z, osmCoordinate = null) {
  const group = new THREE.Group();
  const postMaterial = new THREE.MeshStandardMaterial({ color: '#64705e', roughness: 0.9 });
  const boardMaterial = new THREE.MeshStandardMaterial({ color: '#1c543e', roughness: 0.8 });
  for (const postX of [-1.3, 1.3]) makeBox(group, 0.12, 2.9, 0.12, postMaterial, [postX, 1.45, 0]);
  makeBox(group, 3.15, 0.86, 0.18, boardMaterial, [0, 3.04, 0]);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.72), createSignMaterial(title, subtitle));
  face.position.set(0, 3.04, 0.101);
  group.add(face);
  return addCityLandmark(group, x, z, osmCoordinate);
}

function createIntersection(z) {
  const group = new THREE.Group();
  const crossStreet = new THREE.Mesh(new THREE.BoxGeometry(40, 0.055, 5), roadMaterial);
  crossStreet.position.set(0, -0.035, 0);
  crossStreet.receiveShadow = true;
  group.add(crossStreet);
  const paint = new THREE.MeshStandardMaterial({ color: '#f5e9cb', roughness: 0.85 });
  for (let stripe = -2; stripe <= 2; stripe += 1) {
    makeBox(group, 10.3, 0.025, 0.25, paint, [0, -0.003, stripe * 0.48]);
  }
  return addCityLandmark(group, 0, z);
}

function createTrafficSignal(z) {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: '#45524a', roughness: 0.78 });
  const housing = new THREE.MeshStandardMaterial({ color: '#303934', roughness: 0.65 });
  makeBox(group, 0.2, 5.4, 0.2, metal, [-6.8, 2.7, 0]);
  makeBox(group, 7.1, 0.18, 0.18, metal, [-3.25, 5.2, 0]);
  makeBox(group, 0.54, 1.62, 0.58, housing, [-0.2, 4.22, 0]);
  const bulbs = {};
  const lightColors = { red: '#e9483f', amber: '#f2b83d', green: '#5ed36f' };
  for (const [index, [name, value]] of Object.entries(lightColors).entries()) {
    const bulbMaterial = new THREE.MeshStandardMaterial({ color: value, emissive: value, emissiveIntensity: 0.04, roughness: 0.4 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), bulbMaterial);
    bulb.position.set(-0.2, 4.75 - index * 0.52, 0.31);
    group.add(bulb);
    bulbs[name] = bulbMaterial;
  }
  trafficSignals.push(bulbs);
  return addCityLandmark(group, 0, z);
}

function createStreetlight(x, z) {
  const group = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: '#657164', roughness: 0.78 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.2, 6.8, 7), steel);
  post.position.y = 3.4;
  post.castShadow = true;
  group.add(post);
  const arm = makeBox(group, 1.9, 0.13, 0.13, steel, [x > 0 ? -0.78 : 0.78, 6.55, 0]);
  arm.rotation.z = x > 0 ? -0.16 : 0.16;
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.32), new THREE.MeshStandardMaterial({ color: '#f3e3aa', emissive: '#9c7840', emissiveIntensity: 0.32, roughness: 0.45 }));
  lamp.position.set(x > 0 ? -1.55 : 1.55, 6.28, 0);
  group.add(lamp);
  return addCityLandmark(group, x, z);
}

function createPerson(parent, x, z, shirtColor, trousersColor, role = 'civilian') {
  const person = new THREE.Group();
  person.position.set(x, 0, z);
  const shirt = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.88, flatShading: true });
  const trousers = new THREE.MeshStandardMaterial({ color: trousersColor, roughness: 0.93, flatShading: true });
  const skin = new THREE.MeshStandardMaterial({ color: '#86583f', roughness: 0.95, flatShading: true });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.82, 0.32), shirt);
  torso.position.y = 1.02;
  torso.castShadow = true;
  person.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 9, 7), skin);
  head.position.y = 1.62;
  head.castShadow = true;
  person.add(head);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.68, 0.23), trousers);
    leg.position.set(side * 0.15, 0.37, 0);
    person.add(leg);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.64, 0.2), shirt);
    arm.position.set(side * 0.38, 1.02, 0.03);
    arm.rotation.z = side * -0.14;
    person.add(arm);
  }
  if (role === 'worker') {
    const hardhat = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#f0bd36', roughness: 0.76 }));
    hardhat.position.y = 1.78;
    person.add(hardhat);
    makeBox(person, 0.58, 0.13, 0.35, new THREE.MeshStandardMaterial({ color: '#e8d97b', emissive: '#897b35', emissiveIntensity: 0.08 }), [0, 1.04, 0.18], false);
  } else if (role === 'police') {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, 0.18, 8), new THREE.MeshStandardMaterial({ color: '#253a59', roughness: 0.82 }));
    cap.position.y = 1.79;
    person.add(cap);
    makeBox(person, 0.48, 0.1, 0.05, new THREE.MeshStandardMaterial({ color: '#d7b852', roughness: 0.65 }), [0, 1.23, 0.17], false);
  }
  parent.add(person);
  return person;
}

function createBusiness(name, descriptor, x, z, colors, osmCoordinate) {
  const group = new THREE.Group();
  const wall = new THREE.MeshStandardMaterial({ color: colors.wall, roughness: 0.9, flatShading: true });
  const trim = new THREE.MeshStandardMaterial({ color: colors.trim, roughness: 0.82 });
  makeBox(group, 8.5, 4.4, 5.6, wall, [0, 2.2, 0]);
  makeBox(group, 8.8, 0.34, 5.9, trim, [0, 4.48, 0]);
  makeBox(group, 8.7, 0.22, 5.86, trim, [0, 0.65, 2.84]);
  for (const windowX of [-2.75, -0.95, 2.45]) {
    makeBox(group, 1.35, 1.55, 0.08, new THREE.MeshStandardMaterial({ color: '#73aa9b', roughness: 0.42 }), [windowX, 2.45, 2.84], false);
    makeBox(group, 1.46, 0.13, 0.16, trim, [windowX, 3.28, 2.9], false);
  }
  makeBox(group, 1.15, 2.35, 0.12, new THREE.MeshStandardMaterial({ color: '#754c39', roughness: 0.84 }), [0.85, 1.85, 2.88]);
  makeBox(group, 7.2, 0.88, 0.22, new THREE.MeshStandardMaterial({ color: colors.sign, roughness: 0.76 }), [0, 3.76, 2.91]);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(6.95, 0.7), createSignMaterial(name, descriptor, colors.sign));
  face.position.set(0, 3.76, 3.035);
  group.add(face);
  const roadsideSignX = Math.sign(x) * 5.2 - x;
  const roadsideBoard = makeBox(group, 4.4, 0.76, 0.18, new THREE.MeshStandardMaterial({ color: colors.sign, roughness: 0.76 }), [roadsideSignX, 2.7, 4.35]);
  roadsideBoard.castShadow = false;
  const roadsideFace = new THREE.Mesh(new THREE.PlaneGeometry(4.18, 0.62), createSignMaterial(name, descriptor, colors.sign));
  roadsideFace.position.set(roadsideSignX, 2.7, 4.455);
  group.add(roadsideFace);
  makeBox(group, 8.6, 0.32, 0.78, trim, [0, 3.02, 3.15]);
  for (const tableX of [-3.1, 3.4]) {
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.12, 10), new THREE.MeshStandardMaterial({ color: '#e7d2a6', roughness: 0.88 }));
    table.position.set(tableX, 0.95, 4.7);
    group.add(table);
    makeBox(group, 0.12, 0.88, 0.12, trim, [tableX, 0.49, 4.7]);
    createPerson(group, tableX + 0.9, 4.55, '#d98642', '#37483d');
  }
  return addCityLandmark(group, x, z, osmCoordinate);
}

function createPoliceCheckpoint(z) {
  const group = new THREE.Group();
  const blue = new THREE.MeshStandardMaterial({ color: '#344766', roughness: 0.88 });
  const white = new THREE.MeshStandardMaterial({ color: '#e8e0c6', roughness: 0.9 });
  const red = new THREE.MeshStandardMaterial({ color: '#cf5544', roughness: 0.82 });
  makeBox(group, 4.7, 2.8, 3.1, new THREE.MeshStandardMaterial({ color: '#ddd3b8', roughness: 0.92 }), [9.5, 1.4, 0]);
  makeBox(group, 5.1, 0.26, 3.4, blue, [9.5, 2.9, 0]);
  makeBox(group, 3.2, 0.72, 0.12, blue, [9.5, 3.42, 1.62]);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.02, 0.62), createSignMaterial('POLICE', 'KEEP CENTER · CHECKPOINT', '#344766'));
  sign.position.set(9.5, 3.42, 1.69);
  group.add(sign);
  createPerson(group, 5.5, 2.3, '#344766', '#283449', 'police');
  createPerson(group, 7.3, 2.55, '#344766', '#283449', 'police');
  makeBox(group, 0.18, 0.2, 4.1, blue, [5.3, 1.18, 4.2]);
  for (let segment = 0; segment < 4; segment += 1) {
    makeBox(group, 1.02, 0.36, 0.24, segment % 2 ? white : red, [-4.59 + segment * 1.02, 1.35, 4.2]);
    makeBox(group, 1.02, 0.36, 0.24, segment % 2 ? red : white, [1.53 + segment * 1.02, 1.35, 4.2]);
  }
  for (const coneX of [-2.2, -0.3, 1.6, 3.5]) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.95, 6), new THREE.MeshStandardMaterial({ color: '#ec764b', roughness: 0.82 }));
    cone.position.set(coneX, 0.48, 4.8);
    group.add(cone);
  }
  const checkpoint = addCityLandmark(group, 0, z, [5.02309, 7.90377]);
  checkpoint.userData.barrierOffset = 4.2;
  policeCheckpoints.push(checkpoint);
  return checkpoint;
}

function createRoadWorks(z) {
  const group = new THREE.Group();
  const scaffold = new THREE.MeshStandardMaterial({ color: '#56675b', roughness: 0.85 });
  const wall = new THREE.MeshStandardMaterial({ color: '#d1b987', roughness: 0.95, flatShading: true });
  for (let level = 0; level < 3; level += 1) {
    makeBox(group, 0.12, 2.2, 0.12, scaffold, [8.3, 1.1 + level * 2.1, 0]);
    makeBox(group, 0.12, 2.2, 0.12, scaffold, [12.4, 1.1 + level * 2.1, 0]);
    makeBox(group, 4.2, 0.12, 0.12, scaffold, [10.35, 2.1 + level * 2.1, 0]);
    makeBox(group, 4.2, 0.1, 0.1, scaffold, [10.35, 0.12 + level * 2.1, 0]);
  }
  makeBox(group, 5.1, 5.1, 4.3, wall, [10.4, 2.55, -3]);
  makeBox(group, 5.5, 0.32, 0.3, new THREE.MeshStandardMaterial({ color: '#e6b43e', roughness: 0.9 }), [10.3, 5.3, -0.75]);
  const warning = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 0.66), createSignMaterial('ROAD WORKS', 'PEDESTRIANS AT WORK', '#b45a36'));
  warning.position.set(10.3, 5.3, -0.57);
  group.add(warning);
  createPerson(group, 7.3, 2.2, '#3d7853', '#303c35', 'worker');
  createPerson(group, 13.2, 2.7, '#e26e45', '#343f38', 'worker');
  for (const x of [4.6, 6.2, 14.8, 16.4]) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.86, 6), new THREE.MeshStandardMaterial({ color: '#ed7549', roughness: 0.82 }));
    cone.position.set(x, 0.43, 3.6);
    group.add(cone);
  }
  for (let brick = 0; brick < 4; brick += 1) makeBox(group, 0.56, 0.32, 0.3, new THREE.MeshStandardMaterial({ color: '#a9563b', roughness: 0.94 }), [7.0 + (brick % 2) * 0.56, 0.16 + Math.floor(brick / 2) * 0.32, 4.8]);
  return addCityLandmark(group, 0, z, [5.03702, 7.93128]);
}

function createRoundabout(z, osmCoordinate) {
  const group = new THREE.Group();
  const roundaboutX = 0;
  const branchMaterial = new THREE.MeshStandardMaterial({ color: '#424b48', roughness: 0.94 });
  for (const side of [-1, 1]) {
    const branch = new THREE.Mesh(new THREE.BoxGeometry(20, 0.06, 5.4), branchMaterial);
    branch.position.set(side * 11.6, -0.035, 0);
    branch.receiveShadow = true;
    group.add(branch);
    const straightArm = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.06, 18), branchMaterial);
    straightArm.position.set(0, -0.035, side * 11.6);
    straightArm.receiveShadow = true;
    group.add(straightArm);
  }
  const ringMaterial = new THREE.MeshStandardMaterial({ color: '#464e49', roughness: 0.96, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.0, 6.2, 64), ringMaterial);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(roundaboutX, -0.005, 0);
  ring.receiveShadow = true;
  group.add(ring);
  const island = new THREE.Mesh(new THREE.CylinderGeometry(1.88, 2.02, 0.12, 40), new THREE.MeshStandardMaterial({ color: '#83aa65', roughness: 1 }));
  island.position.set(roundaboutX, 0.01, 0);
  island.castShadow = true;
  island.receiveShadow = true;
  group.add(island);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.68, 0.24, 8), new THREE.MeshStandardMaterial({ color: '#ead9ae', roughness: 0.82 }));
  plinth.position.set(roundaboutX, 0.18, 0);
  group.add(plinth);
  const marker = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.84, 0.22), new THREE.MeshStandardMaterial({ color: '#e6a94b', roughness: 0.7, flatShading: true }));
  marker.position.set(roundaboutX, 0.7, 0);
  marker.castShadow = true;
  group.add(marker);
  for (let i = 0; i < 6; i += 1) {
    const angle = i / 6 * Math.PI * 2;
    const shrub = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 0), new THREE.MeshStandardMaterial({ color: i % 2 ? '#4b8454' : '#629256', roughness: 1, flatShading: true }));
    shrub.position.set(roundaboutX + Math.cos(angle) * 1.4, 0.34, Math.sin(angle) * 1.4);
    shrub.castShadow = true;
    group.add(shrub);
  }
  const lineMaterial = new THREE.MeshStandardMaterial({ color: '#f5e9cb', roughness: 0.9 });
  const arc = new THREE.Mesh(new THREE.TorusGeometry(5.55, 0.055, 5, 72), lineMaterial);
  arc.rotation.x = Math.PI / 2;
  arc.position.y = 0.035;
  group.add(arc);
  for (const side of [-1, 1]) {
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.95, 3), lineMaterial);
    arrow.rotation.z = -Math.PI / 2;
    arrow.position.set(side * 8.1, 0.04, -3.3);
    group.add(arrow);
  }
  const exitBoard = makeBox(group, 4.6, 0.92, 0.18, new THREE.MeshStandardMaterial({ color: '#1c543e' }), [-8.2, 3.15, -0.2]);
  exitBoard.castShadow = false;
  const exitFace = new THREE.Mesh(new THREE.PlaneGeometry(4.38, 0.74), createSignMaterial('ROUNDABOUT', 'KEEP LEFT · CHOOSE EXIT'));
  exitFace.position.set(-8.2, 3.15, -0.095);
  group.add(exitFace);
  return addCityLandmark(group, 0, z, osmCoordinate);
}

function createPlazaLandmark(z) {
  const group = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: '#e9d4a2', roughness: 0.82, flatShading: true });
  const accent = new THREE.MeshStandardMaterial({ color: '#cf6546', roughness: 0.76, flatShading: true });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.45, 0.42, 24), stone);
  base.position.y = 0.22;
  group.add(base);
  const terrace = new THREE.Mesh(new THREE.CylinderGeometry(3.35, 3.8, 0.25, 24), new THREE.MeshStandardMaterial({ color: '#d3bb84', roughness: 0.9 }));
  terrace.position.y = 0.55;
  group.add(terrace);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.78, 7.1, 6), new THREE.MeshStandardMaterial({ color: '#3f7654', roughness: 0.72, flatShading: true }));
  tower.position.y = 4.2;
  tower.castShadow = true;
  group.add(tower);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.35, 6), accent);
  cap.position.y = 8.38;
  cap.castShadow = true;
  group.add(cap);
  for (const side of [-1, 1]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.48, 2.25, 0.48), accent);
    pillar.position.set(side * 1.95, 1.48, 0.5);
    pillar.castShadow = true;
    group.add(pillar);
  }
  const sign = makeBox(group, 5.5, 0.92, 0.2, new THREE.MeshStandardMaterial({ color: '#176346' }), [0, 2.35, 4.25]);
  sign.castShadow = false;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(5.25, 0.72), createSignMaterial('IBOM PLAZA', 'UYO CITY CENTRE'));
  face.position.set(0, 2.35, 4.36);
  group.add(face);
  return addCityLandmark(group, -13.5, z);
}

function createUniversityGate(z) {
  const group = new THREE.Group();
  const cream = new THREE.MeshStandardMaterial({ color: '#ead7b2', roughness: 0.86 });
  const maroon = new THREE.MeshStandardMaterial({ color: '#7b3440', roughness: 0.8 });
  for (const x of [-4.3, 4.3]) {
    makeBox(group, 0.82, 4.5, 0.95, cream, [x, 2.25, 0]);
    makeBox(group, 1.12, 0.35, 1.22, maroon, [x, 4.68, 0]);
  }
  makeBox(group, 9.3, 0.52, 0.8, maroon, [0, 4.25, 0]);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 0.42), createSignMaterial('UNIVERSITY OF UYO', 'AKWA IBOM STATE', '#7b3440'));
  face.position.set(0, 4.25, 0.43);
  group.add(face);
  for (const x of [-2.6, 0, 2.6]) {
    const rail = makeBox(group, 0.09, 1.8, 0.12, maroon, [x, 1.2, 0]);
    rail.castShadow = false;
  }
  return addCityLandmark(group, 14, z, [5.04195, 7.92497]);
}

function createSecretariat(z) {
  const group = new THREE.Group();
  const concrete = new THREE.MeshStandardMaterial({ color: '#e8d8b5', roughness: 0.9 });
  const green = new THREE.MeshStandardMaterial({ color: '#477b5a', roughness: 0.84 });
  makeBox(group, 12.5, 5.4, 6.2, concrete, [0, 2.7, 0]);
  makeBox(group, 12.9, 0.42, 6.55, green, [0, 4.55, 0]);
  makeBox(group, 12.8, 0.18, 6.5, green, [0, 1.25, 3.12]);
  for (let column = -5; column <= 5; column += 2) {
    makeBox(group, 0.16, 3.7, 0.18, concrete, [column, 2.85, 3.18]);
    makeBox(group, 0.88, 0.84, 0.06, new THREE.MeshStandardMaterial({ color: '#83b8a3' }), [column, 3.4, 3.2], false);
  }
  makeBox(group, 8.2, 0.92, 0.2, green, [0, 5.65, 2.9]);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(7.9, 0.72), createSignMaterial('AKWA IBOM SECRETARIAT', 'IDONGESIT NKANGA COMPLEX'));
  face.position.set(0, 5.65, 3.01);
  group.add(face);
  return addCityLandmark(group, -17, z, [5.02309, 7.90377]);
}

function createTownshipStadium(z) {
  const group = new THREE.Group();
  const standMaterial = new THREE.MeshStandardMaterial({ color: '#d9c292', roughness: 0.94, side: THREE.DoubleSide });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 5.1, 2.6, 28, 1, true), standMaterial);
  shell.position.y = 1.4;
  shell.castShadow = true;
  group.add(shell);
  for (let tier = 0; tier < 4; tier += 1) {
    const seating = new THREE.Mesh(new THREE.RingGeometry(4.4 + tier * 0.14, 4.75 + tier * 0.14, 28), new THREE.MeshStandardMaterial({ color: tier % 2 ? '#c7684e' : '#417b58', roughness: 0.9, side: THREE.DoubleSide }));
    seating.rotation.x = -Math.PI / 2;
    seating.position.y = 1.05 + tier * 0.44;
    group.add(seating);
  }
  makeBox(group, 3.2, 0.25, 1.2, new THREE.MeshStandardMaterial({ color: '#74a76d' }), [0, 0.35, 0]);
  for (const x of [-5.1, 5.1]) {
    makeBox(group, 0.18, 7.8, 0.18, new THREE.MeshStandardMaterial({ color: '#77796d' }), [x, 3.9, -1.2]);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 0.3), new THREE.MeshStandardMaterial({ color: '#f4e7bb', emissive: '#76633e', emissiveIntensity: 0.18 }));
    lamp.position.set(x, 7.85, -1.2);
    group.add(lamp);
  }
  return addCityLandmark(group, 15, z, [5.01916, 7.92564]);
}

createRoadSign('IKOT EKPENE ROAD', 'UYO CITY CENTRE', -6.8, -24, [5.0389, 7.9095]);
createIntersection(-52);
createTrafficSignal(-52);
createStreetlight(-7.3, -28);
createStreetlight(7.3, -81);
createRoadSign('AKA ROAD', 'CITY CENTRE', 6.8, -77, [5.03335, 7.92875]);
const roundaboutLandmark = createRoundabout(-122, [5.03279, 7.93103]);
createRoadSign('ORON ROAD / NWANIBA', 'ROUNDABOUT AHEAD', -6.8, -112, [5.03279, 7.93103]);
createStreetlight(-7.3, -159);
createUniversityGate(-180);
createBusiness('NIGHT FAST FOOD', 'HOT GRILLS · COLD DRINKS', -11, -210, { wall: '#e9c98b', trim: '#bf623c', sign: '#bd4c34' }, [5.02266, 7.93877]);
createPlazaLandmark(-238);
createTrafficSignal(-262);
createBusiness('CALWINO BAR', 'CHOPS · COLD DRINKS', 11, -274, { wall: '#d9c68e', trim: '#527c54', sign: '#315d42' }, [5.0277, 7.93017]);
createRoadWorks(-298);
createPoliceCheckpoint(-338);
createRoadSign('WELLINGTON BASSEY WAY', 'BARRACKS ROAD', -6.8, -298, [5.03702, 7.93128]);
createStreetlight(7.3, -325);
createSecretariat(-350);
createRoadSign('ABAK ROAD', 'WESTERN UYO', 6.8, -405, [5.02991, 7.91506]);
createBusiness('FRESH SPRING HOTELS', 'ROOMS · RESTAURANT · LOUNGE', -11, -433, { wall: '#e7d1a7', trim: '#4c7e81', sign: '#306b70' }, [5.01539, 7.91701]);
createStreetlight(-7.3, -441);
createTownshipStadium(-462);
createIntersection(-520);
createTrafficSignal(-520);
createRoadSign('ATIKU ABUBAKAR AVENUE', 'CENTRAL UYO', 6.8, -548, [5.0364, 7.90062]);
createRoadSign('IKPA ROAD', 'UNIVERSITY DISTRICT', -6.8, -625, [5.05043, 7.9265]);
createRoadSign('NWANIBA ROAD', 'ORON ROAD JUNCTION', 6.8, -705, [5.03279, 7.93103]);
createIntersection(-770);
createTrafficSignal(-770);
createPoliceCheckpoint(-850);
createRoadSign('IBB AVENUE', 'SOUTH UYO', -6.8, -795, [5.01834, 7.91132]);
createRoadSign('ITAM ROAD', 'EASTERN UYO', 6.8, -875, [5.05399, 7.89907]);
createRoadSign('NELSON MANDELA ROAD', 'IKOT EKPENE DISTRICT', -6.8, -960, [5.04552, 7.91508]);

function createKeke(primary = false) {
  const group = new THREE.Group();
  const paint = primary ? '#ef713c' : ['#e1a62f', '#278c68', '#d95041', '#477eae'][Math.floor(random() * 4)];
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: paint, roughness: 0.65, metalness: 0.02, flatShading: true });
  const darkMetal = new THREE.MeshStandardMaterial({ color: '#34413b', roughness: 0.82, flatShading: true });
  const glass = new THREE.MeshStandardMaterial({ color: '#a8d8c6', roughness: 0.3, metalness: 0.12 });
  makeBox(group, 1.38, 0.56, 2.15, bodyMaterial, [0, 0.77, 0]);
  makeBox(group, 1.28, 0.12, 2.05, new THREE.MeshStandardMaterial({ color: '#fff3dc', roughness: 0.7 }), [0, 1.09, -0.06]);
  makeBox(group, 1.26, 0.1, 1.68, darkMetal, [0, 1.78, -0.22]);
  for (const x of [-0.58, 0.58]) {
    for (const z of [-0.86, 0.42]) {
      const post = makeBox(group, 0.09, 0.7, 0.09, darkMetal, [x, 1.43, z]);
      post.castShadow = false;
    }
    makeBox(group, 0.035, 0.45, 0.035, glass, [x * 0.8, 1.45, -0.43], false);
  }
  makeBox(group, 0.92, 0.56, 0.08, glass, [0, 1.47, -0.89], false);
  makeBox(group, 0.96, 0.09, 0.12, new THREE.MeshStandardMaterial({ color: '#fff2d1', roughness: 0.4 }), [0, 0.82, -1.08], false);
  for (const x of [-0.79, 0.79]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.19, 9), darkMetal);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.39, 0.58);
    wheel.castShadow = true;
    group.add(wheel);
    makeBox(group, 0.1, 0.2, 0.16, new THREE.MeshStandardMaterial({ color: '#f6d76d' }), [x * 0.79, 0.82, -1.12], false);
  }
  const frontWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 9), darkMetal);
  frontWheel.rotation.z = Math.PI / 2;
  frontWheel.position.set(0, 0.34, -1.02);
  frontWheel.castShadow = true;
  group.add(frontWheel);
  group.userData.wheels = group.children.filter((child) => child.geometry?.type === 'CylinderGeometry');
  return group;
}

function createBike() {
  const group = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({ color: '#34413b', roughness: 0.8, flatShading: true });
  const paint = new THREE.MeshStandardMaterial({ color: '#e1a62f', roughness: 0.72, flatShading: true });
  const rider = new THREE.MeshStandardMaterial({ color: '#43805d', roughness: 0.9, flatShading: true });
  const helmet = new THREE.MeshStandardMaterial({ color: '#e96d46', roughness: 0.65, flatShading: true });
  const wheels = [];

  for (const z of [-0.72, 0.68]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.14, 10), frame);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0, 0.31, z);
    wheel.castShadow = true;
    group.add(wheel);
    wheels.push(wheel);
  }

  const addBar = (start, end, width, material) => {
    const from = new THREE.Vector3(...start);
    const to = new THREE.Vector3(...end);
    const direction = to.clone().sub(from);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(width, direction.length(), width), material);
    bar.position.copy(from.add(to).multiplyScalar(0.5));
    bar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    bar.castShadow = true;
    group.add(bar);
  };
  addBar([0, 0.32, 0.68], [0, 0.87, 0.3], 0.09, paint);
  addBar([0, 0.87, 0.3], [0, 0.36, -0.72], 0.08, paint);
  addBar([0, 0.32, 0.68], [0, 0.36, -0.72], 0.075, frame);
  addBar([0, 0.9, 0.28], [0, 1.18, -0.55], 0.065, frame);
  makeBox(group, 0.3, 0.1, 0.42, frame, [0, 0.92, 0.33]);
  makeBox(group, 0.42, 0.56, 0.28, rider, [0, 1.2, -0.02]);
  makeBox(group, 0.48, 0.12, 0.09, frame, [0, 1.2, -0.58]);
  for (const side of [-1, 1]) {
    addBar([side * 0.16, 1.35, -0.06], [side * 0.25, 1.18, -0.52], 0.07, rider);
    addBar([side * 0.12, 0.96, 0.04], [side * 0.18, 0.48, -0.34], 0.09, frame);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), helmet);
  head.position.set(0, 1.65, -0.12);
  head.castShadow = true;
  group.add(head);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshStandardMaterial({ color: '#fff0b0', emissive: '#725224', emissiveIntensity: 0.35 }));
  lamp.position.set(0, 0.76, -0.77);
  group.add(lamp);
  group.userData.wheels = wheels;
  return group;
}

function createBus() {
  const group = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: '#e4aa3d', roughness: 0.7, flatShading: true });
  const trim = new THREE.MeshStandardMaterial({ color: '#f5e4c0', roughness: 0.8 });
  const glass = new THREE.MeshStandardMaterial({ color: '#83b8a3', roughness: 0.36, metalness: 0.08 });
  const dark = new THREE.MeshStandardMaterial({ color: '#34413b', roughness: 0.85, flatShading: true });
  const wheels = [];

  makeBox(group, 1.9, 1.72, 4.1, paint, [0, 1.25, 0]);
  makeBox(group, 1.95, 0.16, 4.16, trim, [0, 2.13, 0]);
  makeBox(group, 1.58, 0.66, 0.06, glass, [0, 1.78, 2.08], false);
  makeBox(group, 1.52, 0.64, 0.06, glass, [0, 1.78, -2.08], false);
  makeBox(group, 1.12, 0.11, 0.07, dark, [0, 0.82, 2.11], false);
  for (const x of [-0.96, 0.96]) {
    for (const z of [-0.98, 0.18, 1.33]) {
      makeBox(group, 0.055, 0.58, 0.76, glass, [x, 1.73, z], false);
    }
    for (const z of [-1.2, 1.2]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.2, 10), dark);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x * 0.98, 0.38, z);
      wheel.castShadow = true;
      group.add(wheel);
      wheels.push(wheel);
    }
    makeBox(group, 0.15, 0.24, 0.12, new THREE.MeshStandardMaterial({ color: '#dc6448' }), [x * 0.82, 0.93, 2.1], false);
    makeBox(group, 0.15, 0.2, 0.12, new THREE.MeshStandardMaterial({ color: '#fff0b0' }), [x * 0.82, 1.07, -2.1], false);
  }
  group.userData.wheels = wheels;
  return group;
}

function createTrafficVehicle(type) {
  if (type === 'bike') return createBike();
  if (type === 'bus') return createBus();
  return createKeke(false);
}

const player = createKeke(true);
player.position.set(roadCurve(3.4), 0, 3.4);
player.scale.setScalar(1.08);
scene.add(player);

const traffic = [];
function spawnTraffic(z = -92) {
  const type = ['keke', 'bike', 'bus'][traffic.length % 3];
  const vehicle = createTrafficVehicle(type);
  const lane = Math.floor(random() * lanes.length);
  const spawnZ = z - random() * 22;
  vehicle.position.set(roadCurve(spawnZ) + lanes[lane], 0, spawnZ);
  vehicle.scale.setScalar(type === 'bus' ? 0.92 : type === 'bike' ? 1.06 : 0.98);
  scene.add(vehicle);
  traffic.push({ mesh: vehicle, lane, lanePosition: vehicle.position.x, type, hitDepth: type === 'bus' ? 2.25 : type === 'bike' ? 0.85 : 1.25, hitWidth: type === 'bus' ? 1.7 : type === 'bike' ? 0.92 : 1.35, speed: 2 + random() * 2.4 });
}
for (let index = 0; index < 10; index += 1) spawnTraffic(-48 - index * 35);

const pickups = [];
function createPickup(kind, lane, z) {
  const group = new THREE.Group();
  group.position.set(roadCurve(z) + lanes[lane], 0, z);
  if (kind === 'coin') {
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 10), new THREE.MeshStandardMaterial({ color: '#ffd64b', metalness: 0.38, roughness: 0.28 }));
    coin.rotation.x = Math.PI / 2;
    coin.position.y = 1.15;
    coin.castShadow = true;
    group.add(coin);
  } else {
    const post = makeBox(group, 0.12, 1.35, 0.12, new THREE.MeshStandardMaterial({ color: '#477c57' }), [0, 0.68, 0]);
    post.castShadow = false;
    makeBox(group, 0.82, 0.48, 0.1, new THREE.MeshStandardMaterial({ color: '#f1e5c5' }), [0, 1.45, 0]);
    makeBox(group, 0.64, 0.09, 0.12, new THREE.MeshStandardMaterial({ color: '#e76f4c' }), [0, 1.51, 0.07]);
    const letter = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.22), new THREE.MeshBasicMaterial({ color: '#335b42' }));
    letter.position.set(0, 1.46, 0.065);
    group.add(letter);
  }
  scene.add(group);
  pickups.push({ mesh: group, kind, lane, taken: false, phase: random() * Math.PI * 2 });
}
for (let i = 0; i < 18; i += 1) createPickup(i % 5 === 4 ? 'passenger' : 'coin', Math.floor(random() * 3), -16 - i * 12.5);

const ui = {
  score: document.querySelector('#score'), best: document.querySelector('#best-score'), speed: document.querySelector('#speed'),
  meter: document.querySelector('#speed-meter-fill'), fuel: document.querySelector('#fuel'), fuelMeter: document.querySelector('#fuel-meter-fill'),
  coins: document.querySelector('#coins'), street: document.querySelector('#street-name'),
  mission: document.querySelector('#mission-title'), progress: document.querySelector('#mission-progress'), detail: document.querySelector('#mission-detail'),
  passengerTitle: document.querySelector('#passenger-title'), passengerDetail: document.querySelector('#passenger-detail'), passengers: document.querySelector('#passenger-count'),
  hornStatus: document.querySelector('#horn-status'), toast: document.querySelector('#toast'), landmark: document.querySelector('#landmark-label'), crash: document.querySelector('#crash-screen'),
  crashMessage: document.querySelector('#crash-message'), finalScore: document.querySelector('#final-score'), loading: document.querySelector('#loading-screen'),
  startScreen: document.querySelector('#start-screen'), startButton: document.querySelector('#start-button'), reviveButton: document.querySelector('#revive-button'),
  saveName: document.querySelector('#save-name'), saveScoreButton: document.querySelector('#save-score-button'), shareXButton: document.querySelector('#share-x-button'),
  shareCopyButton: document.querySelector('#share-copy-button'), downloadCardButton: document.querySelector('#download-card-button'), leaderboard: document.querySelector('#leaderboard-list'),
  roadScreen: document.querySelector('#road-screen'), roadGrid: document.querySelector('#road-grid'), roadDone: document.querySelector('#road-done'), roadBack: document.querySelector('#road-back'),
};

const streets = ['Abak Road', 'Ikot Ekpene Road', 'Aka Road', 'Wellington Bassey Way', 'Atiku Abubakar Avenue', 'Oron Road', 'Nwaniba Road', 'Ikpa Road', 'IBB Avenue', 'Itam Road', 'Nelson Mandela Road'];
const coinPointValue = 50;
const leaderboardKey = 'kekenapepe-leaderboard';
const roadChoices = [
  ['Ikot Ekpene Road', 'City centre traffic'], ['Aka Road', 'Busy shops and junctions'], ['Abak Road', 'Western Uyo route'],
  ['Oron Road', 'Nwaniba connection'], ['Nwaniba Road', 'Roundabout route'], ['Wellington Bassey Way', 'Barracks Road'],
  ['Ibom Plaza Loop', 'Landmark circuit'], ['UniUyo Road', 'University district'],
];
let selectedRoad = 0;
const crashMessages = [
  'Even the keke needs a breather.', 'My brother, the road no be yours alone!', 'This keke don collect.', 'Omo, that one pain small.',
  'Conductor! Make we try again.', 'No worry. Uyo traffic gets everybody.',
];
const state = {
  lane: 1, lanePosition: 0, speed: 48, score: 0, coins: 0, distance: 0, time: 0,
  active: false, braking: false, boosting: false, passengers: 0, dropDistance: null,
  nextPickup: 1.5, streetIndex: 1, toastTimer: null, missionStage: 0, roadTime: 0,
  fuel: 100, hornCooldown: 0, profileName: 'Uyo Driver', revives: 1,
};
let bestScore = Number(localStorage.getItem('kekenapepe-best') || 0);
ui.best.textContent = String(bestScore).padStart(6, '0');

function getLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem(leaderboardKey) || '[]');
  } catch {
    return [];
  }
}

function renderLeaderboard() {
  const entries = getLeaderboard();
  if (!ui.leaderboard) return;
  ui.leaderboard.innerHTML = entries.length
    ? entries.slice(0, 5).map((entry, index) => `<li><span>${index + 1}. ${entry.name}</span><strong>${entry.score}</strong></li>`).join('')
    : '<li class="empty-entry"><span>1. First rider</span><strong>0</strong></li>';
}

function saveLeaderboardEntry(score, name, distance) {
  const entries = getLeaderboard();
  const cleanedName = (name || 'Rider').trim().slice(0, 14) || 'Rider';
  entries.push({ name: cleanedName, score, distance, at: Date.now() });
  entries.sort((a, b) => b.score - a.score || b.distance - a.distance);
  localStorage.setItem(leaderboardKey, JSON.stringify(entries.slice(0, 5)));
  renderLeaderboard();
}

function createResultCard() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, '#173c31');
  gradient.addColorStop(1, '#3f7e5d');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1200, 630);
  context.fillStyle = '#d5ef43';
  context.font = '900 80px Barlow Condensed, sans-serif';
  context.fillText('KEKENAPEPE', 70, 105);
  context.fillStyle = '#f5f1d7';
  context.font = '700 30px DM Sans, sans-serif';
  context.fillText('UYO RUN · AKWA IBOM', 75, 150);
  context.fillStyle = '#f5f1d7';
  context.font = '800 42px Barlow Condensed, sans-serif';
  context.fillText(state.profileName || 'YOUR UYO RUN', 75, 260);
  context.font = '700 24px DM Sans, sans-serif';
  context.fillStyle = '#c9e3ca';
  context.fillText(`${Math.floor(state.distance)} m   ·   ${Math.floor(state.score)} points`, 75, 315);
  context.fillText(`${state.coins} coins   ·   ₦${state.coins * coinPointValue} earned`, 75, 355);
  context.fillText(`${ui.street.textContent}   ·   Uyo, Nigeria`, 75, 395);
  context.fillStyle = '#d5ef43';
  context.font = '800 22px DM Sans, sans-serif';
  context.fillText('Drive smart. No wahala.', 75, 530);
  return canvas.toDataURL('image/png');
}

function syncProfileName() {
  const cleaned = (ui.saveName.value || localStorage.getItem('kekenapepe-name') || 'Rider').trim().slice(0, 14) || 'Rider';
  state.profileName = cleaned;
  ui.saveName.value = cleaned;
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 1550);
}

function openRoadPicker() {
  ui.roadGrid.innerHTML = roadChoices.map(([name, detail], index) => `<button class="road-choice${index === selectedRoad ? ' is-selected' : ''}" data-road-index="${index}"><strong>${name}</strong><small>${detail}</small></button>`).join('');
  ui.roadGrid.querySelectorAll('.road-choice').forEach((choice) => choice.addEventListener('click', () => {
    selectedRoad = Number(choice.dataset.roadIndex);
    ui.roadGrid.querySelectorAll('.road-choice').forEach((item) => item.classList.toggle('is-selected', item === choice));
  }));
  ui.startScreen.classList.add('hidden');
  ui.roadScreen.hidden = false;
}

function closeRoadPicker() {
  ui.roadScreen.hidden = true;
  ui.startScreen.classList.remove('hidden');
}

function changeLane(direction) {
  if (!state.active) return;
  const nextLane = state.lane + direction;
  if (nextLane < 0 || nextLane > 2) {
    endRun('You drifted into the roadside!');
    return;
  }
  state.lane = nextLane;
}

function endRun(reason = null) {
  if (!state.active) return;
  state.active = false;
  if (soundEnabled) playCrash();
  const final = Math.floor(state.score);
  if (final > bestScore) {
    bestScore = final;
    localStorage.setItem('kekenapepe-best', String(bestScore));
  }
  ui.best.textContent = String(bestScore).padStart(6, '0');
  state.profileName = localStorage.getItem('kekenapepe-name') || 'Rider';
  ui.saveName.value = localStorage.getItem('kekenapepe-name') || '';
  const crashReason = reason || crashMessages[Math.floor(random() * crashMessages.length)];
  ui.crashMessage.textContent = crashReason;
  ui.finalScore.textContent = `${state.profileName} made it ${Math.floor(state.distance)} m · ${final} points · ${state.coins} coins · ₦${state.coins * coinPointValue} earned`;
  ui.downloadCardButton.href = createResultCard();
  ui.reviveButton.hidden = state.revives <= 0;
  ui.crash.hidden = false;
}

function reviveRun() {
  if (state.active || state.revives <= 0) return;
  state.revives -= 1;
  state.active = true;
  state.fuel = Math.max(30, state.fuel);
  state.speed = 34;
  state.hornCooldown = 0;
  player.position.z = Math.max(player.position.z - 18, -12);
  player.position.x = roadCurve(player.position.z) + lanes[state.lane];
  ui.crash.hidden = true;
  showToast('Revive used! Back on the road, boss.');
  if (soundEnabled) playChime();
}

function resetRun() {
  state.lane = 1;
  state.lanePosition = 0;
  state.speed = 48;
  state.score = 0;
  state.coins = 0;
  state.distance = 0;
  state.time = 0;
  state.active = true;
  state.passengers = 0;
  state.dropDistance = null;
  state.nextPickup = 1.5;
  state.streetIndex = 1;
  state.missionStage = 0;
  state.roadTime = 0;
  state.fuel = 100;
  state.hornCooldown = 0;
  state.revives = 1;
  if (engineGain && soundEnabled) engineGain.gain.setTargetAtTime(0.035, audioContext.currentTime, 0.08);
  player.position.set(roadCurve(3.4), 0, 3.4);
  camera.position.x = 0;
  camera.lookAt(0, 1, -0.5);
  for (const item of traffic) {
    item.mesh.position.z = -42 - random() * 70;
    item.lane = Math.floor(random() * 3);
    item.collected = false;
    item.lanePosition = roadCurve(item.mesh.position.z) + lanes[item.lane];
    item.mesh.position.x = item.lanePosition;
  }
  for (const landmark of cityLandmarks) {
    landmark.position.z = landmark.userData.startZ;
    landmark.position.x = landmark.userData.startX;
  }
  for (const [index, item] of pickups.entries()) {
    item.taken = false;
    item.kind = index % 5 === 4 ? 'passenger' : 'coin';
    item.lane = Math.floor(random() * 3);
    const pickupZ = -16 - index * 12.5;
    item.mesh.position.set(roadCurve(pickupZ) + lanes[item.lane], 0, pickupZ);
    item.mesh.visible = true;
  }
  ui.crash.hidden = true;
  ui.street.textContent = roadChoices[selectedRoad][0];
  ui.mission.textContent = 'Reach Ibom Plaza';
  ui.progress.style.width = '0%';
  ui.detail.textContent = '0 / 400 m';
  ui.passengerTitle.textContent = 'No passenger';
  ui.passengerDetail.textContent = 'Look out for a pickup';
  ui.passengers.textContent = '0';
  ui.landmark.classList.remove('visible');
  ui.fuel.textContent = '100';
  ui.fuelMeter.style.width = '100%';
  ui.hornStatus.textContent = 'READY';
  ui.startScreen.classList.add('hidden');
  ui.roadScreen.hidden = true;
  showToast(`${roadChoices[selectedRoad][0]} dey wait. Make we move!`);
}

function bindHold(button, key) {
  const start = (event) => {
    event.preventDefault();
    state[key] = true;
    button.classList.add('pressed');
    button.setPointerCapture?.(event.pointerId);
  };
  const stop = () => {
    state[key] = false;
    button.classList.remove('pressed');
  };
  button.addEventListener('pointerdown', start);
  button.addEventListener('pointerup', stop);
  button.addEventListener('pointercancel', stop);
  button.addEventListener('lostpointercapture', stop);
  button.addEventListener('pointerleave', stop);
}

bindHold(document.querySelector('#brake'), 'braking');
bindHold(document.querySelector('#faster'), 'boosting');
ui.startButton.addEventListener('click', openRoadPicker);
document.querySelector('#home-roads').addEventListener('click', openRoadPicker);
ui.roadDone.addEventListener('click', resetRun);
ui.roadBack.addEventListener('click', closeRoadPicker);
ui.saveName.addEventListener('input', syncProfileName);
ui.reviveButton.addEventListener('click', reviveRun);
ui.saveScoreButton.addEventListener('click', () => {
  const cleanName = (ui.saveName.value || 'Rider').trim().slice(0, 14) || 'Rider';
  state.profileName = cleanName;
  localStorage.setItem('kekenapepe-name', cleanName);
  saveLeaderboardEntry(Math.floor(state.score), cleanName, Math.floor(state.distance));
  showToast(`Saved as ${cleanName}`);
});
ui.shareXButton.addEventListener('click', () => {
  const shareText = encodeURIComponent(`${state.profileName || 'Rider'} just scored ${Math.floor(state.score)} in Kekenapepe! #UyoRun #Kekenapepe`);
  window.open(`https://twitter.com/intent/tweet?text=${shareText}`, '_blank', 'noopener,noreferrer');
});
ui.shareCopyButton.addEventListener('click', async () => {
  const text = `${state.profileName || 'Rider'} scored ${Math.floor(state.score)} in Kekenapepe — ${Math.floor(state.distance)} m in Uyo.`;
  try {
    await navigator.clipboard.writeText(text);
    showToast('Result copied to clipboard.');
  } catch {
    showToast('Copy failed.');
  }
});
document.querySelector('#horn').addEventListener('click', triggerHorn);
document.querySelector('#restart-button').addEventListener('click', resetRun);
document.querySelectorAll('input[name="vehicle"]').forEach((choice) => {
  choice.addEventListener('change', () => {
    document.querySelectorAll('.profile-option').forEach((option) => option.classList.toggle('is-selected', option.querySelector('input').checked));
  });
});

let swipeStart = null;
gameElement.addEventListener('pointerdown', (event) => {
  if (!state.active || event.target.closest('button, a') || (event.pointerType === 'mouse' && event.button !== 0)) return;
  swipeStart = { x: event.clientX, y: event.clientY };
  gameElement.setPointerCapture(event.pointerId);
});
gameElement.addEventListener('pointerup', (event) => {
  if (!swipeStart) return;
  const deltaX = event.clientX - swipeStart.x;
  const deltaY = event.clientY - swipeStart.y;
  if (Math.abs(deltaX) > 36 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) changeLane(Math.sign(deltaX));
  swipeStart = null;
});
gameElement.addEventListener('pointercancel', () => { swipeStart = null; });

let soundEnabled = false;
let audioContext = null;
let masterGain = null;
let engineOscillator = null;
let engineGain = null;
let musicTimer = null;
let musicStep = 0;

function triggerHorn() {
  if (!state.active) return;
  if (state.hornCooldown > 0) {
    showToast(`Horn cooling down • ${state.hornCooldown.toFixed(1)}s`);
    return;
  }
  state.hornCooldown = 2.6;
  state.score += 12;
  if (soundEnabled) {
    playTone(520, 0.14, 'square', 0.08);
    playTone(660, 0.2, 'square', 0.08, 0.08);
  }
  showToast('Horn blast! Road clear.');
}
document.querySelector('#sound-toggle').addEventListener('click', (event) => {
  soundEnabled = !soundEnabled;
  event.currentTarget.classList.toggle('is-muted', !soundEnabled);
  event.currentTarget.setAttribute('aria-label', soundEnabled ? 'Mute sound' : 'Enable sound');
  event.currentTarget.title = soundEnabled ? 'Mute sound' : 'Enable sound';
  event.currentTarget.setAttribute('aria-pressed', String(soundEnabled));
  if (soundEnabled) {
    startAudio();
    showToast('Engine and music on. Enjoy the ride!');
  } else {
    stopAudio();
    showToast('Sound off');
  }
});

const keysDown = new Set();
window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) event.preventDefault();
  if (event.repeat) return;
  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') changeLane(-1);
  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') changeLane(1);
  if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') state.boosting = true;
  if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's' || event.key === ' ') state.braking = true;
  if (event.key.toLowerCase() === 'h') triggerHorn();
  if (event.key.toLowerCase() === 'r' && !state.active) resetRun();
  keysDown.add(event.key);
});
window.addEventListener('keyup', (event) => {
  keysDown.delete(event.key);
  if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') state.boosting = false;
  if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's' || event.key === ' ') state.braking = false;
});
window.addEventListener('blur', () => {
  state.boosting = false;
  state.braking = false;
  state.braking = false;
  state.boosting = false;
  keysDown.clear();
});

let previousTime = performance.now();
function animate(now) {
  requestAnimationFrame(animate);
  const delta = Math.min((now - previousTime) / 1000, 0.05);
  previousTime = now;
  if (state.active) {
    state.time += delta;
    state.hornCooldown = Math.max(0, state.hornCooldown - delta);
    state.fuel = Math.max(0, state.fuel - delta * (state.boosting ? 4.8 : 2.4));
    if (state.fuel <= 0) {
      endRun('Fuel empty. The keke coasted to a stop in the middle of Uyo.');
    }
    const signalPhase = state.time % 9;
    const activeSignal = signalPhase < 4.8 ? 'green' : signalPhase < 5.8 ? 'amber' : 'red';
    for (const signal of trafficSignals) {
      for (const [name, material] of Object.entries(signal)) material.emissiveIntensity = name === activeSignal ? 1.5 : 0.04;
    }
    const cruisingSpeed = Math.min(68, 48 + Math.floor(state.distance / 360) * 4);
    const targetSpeed = state.braking ? 25 : state.boosting ? Math.min(100, cruisingSpeed + 34) : cruisingSpeed;
    state.speed = THREE.MathUtils.damp(state.speed, targetSpeed, 2.8, delta);
    if (soundEnabled && engineOscillator) {
      engineOscillator.frequency.setTargetAtTime(52 + state.speed * 1.15, audioContext.currentTime, 0.08);
    }
    const flow = state.speed / 48;
    const forward = 12.2 * flow * delta;
    state.distance += forward;
    state.score += forward * 1.35;
    state.lanePosition = THREE.MathUtils.damp(state.lanePosition, lanes[state.lane], 10, delta);
    player.position.x = roadCurve(player.position.z) + state.lanePosition;
    const cameraX = THREE.MathUtils.damp(camera.position.x, player.position.x, 5, delta);
    camera.position.x = cameraX;
    camera.lookAt(cameraX, 1, -0.5);
    player.position.y = Math.sin(state.time * 13) * 0.035;
    player.rotation.z = THREE.MathUtils.damp(player.rotation.z, (lanes[state.lane] - state.lanePosition) * -0.07, 9, delta);
    for (const wheel of player.userData.wheels) wheel.rotation.x += forward * 0.75;

    for (const dash of dashes) {
      dash.position.z += forward;
      if (dash.position.z > 12) dash.position.z -= dashes.length / 2 * 7.2;
      dash.position.x = roadCurve(dash.position.z) + dash.userData.laneMarkX;
      dash.visible = Math.abs(dash.position.z - roundaboutLandmark.position.z) > 8;
    }
    for (const object of scenery) {
      object.position.z += forward;
      if (object.position.z > 18) object.position.z -= sceneryLoopLength;
      object.position.x = roadCurve(object.position.z) + object.userData.roadsideX;
    }
    for (const landmark of cityLandmarks) {
      landmark.position.z += forward;
      if (landmark.position.z > 18) landmark.position.z -= routeLength;
      landmark.position.x = roadCurve(landmark.position.z) + landmark.userData.roadsideX;
    }
    for (const checkpoint of policeCheckpoints) {
      const barrierDistance = checkpoint.position.z + checkpoint.userData.barrierOffset - player.position.z;
      const checkpointLaneOffset = player.position.x - checkpoint.position.x;
      if (Math.abs(barrierDistance) < 1.1 && Math.abs(checkpointLaneOffset) > 1.05) {
        endRun('You hit the police checkpoint barrier. Run over.');
      }
    }
    const roundaboutDistance = roundaboutLandmark.position.z - player.position.z;
    if (roundaboutDistance > -1.5 && roundaboutDistance < 1.5 && state.lane === 1) {
      endRun('You hit the roundabout island. Choose an outer lane next time.');
    }

    for (const item of traffic) {
      item.mesh.position.z += (forward - item.speed * delta);
      const distanceToIsland = item.mesh.position.z - roundaboutLandmark.position.z;
      if (Math.abs(distanceToIsland) < 20 && item.lane === 1) {
        item.lane = item.mesh.position.x < roundaboutLandmark.position.x ? 0 : 2;
      }
      const trafficTargetX = roadCurve(item.mesh.position.z) + lanes[item.lane];
      item.lanePosition = THREE.MathUtils.damp(item.lanePosition, trafficTargetX, 6, delta);
      item.mesh.position.x = item.lanePosition;
      const islandClearance = 1.88 + (item.type === 'bus' ? 1.0 : 0.72);
      if (Math.abs(distanceToIsland) < item.hitDepth + 1.2 && Math.abs(item.mesh.position.x - roundaboutLandmark.position.x) < islandClearance) {
        item.lane = item.mesh.position.x < roundaboutLandmark.position.x ? 0 : 2;
        item.lanePosition = roadCurve(item.mesh.position.z) + lanes[item.lane];
        item.mesh.position.x = item.lanePosition;
      }
      for (const wheel of item.mesh.userData.wheels) wheel.rotation.x += (forward - item.speed * delta) * 0.75;
      if (item.mesh.position.z > player.position.z - item.hitDepth && item.mesh.position.z < player.position.z + item.hitDepth && Math.abs(item.mesh.position.x - player.position.x) < item.hitWidth) {
        endRun();
        break;
      }
      if (item.mesh.position.z > 16) {
        item.lane = Math.floor(random() * 3);
        item.mesh.position.z = -105 - random() * 165;
        item.lanePosition = roadCurve(item.mesh.position.z) + lanes[item.lane];
        item.mesh.position.x = item.lanePosition;
        item.speed = 2 + random() * 2.4 + Math.min(4, state.distance / 450);
      }
    }

    state.nextPickup -= delta;
    if (state.nextPickup <= 0) {
      const availablePickup = pickups.find((item) => item.taken || item.mesh.position.z > 11);
      if (availablePickup) {
        availablePickup.taken = false;
        availablePickup.lane = Math.floor(random() * 3);
        const pickupZ = -110 - random() * 35;
        availablePickup.mesh.position.set(roadCurve(pickupZ) + lanes[availablePickup.lane], 0, pickupZ);
        availablePickup.mesh.visible = true;
      }
      state.nextPickup = 0.9 + random() * 0.7;
    }
    for (const item of pickups) {
      if (item.taken) continue;
      item.mesh.position.z += forward;
      item.mesh.position.x = roadCurve(item.mesh.position.z) + lanes[item.lane];
      if (item.kind === 'coin') {
        const coin = item.mesh.children[0];
        coin.rotation.y += delta * 2.4;
        coin.position.y = 1.14 + Math.sin(state.time * 4 + item.phase) * 0.1;
      }
      if (item.kind === 'passenger') item.mesh.children[1].rotation.y = Math.sin(state.time * 2 + item.phase) * 0.08;
      if (item.mesh.position.z > player.position.z - 1.2 && item.mesh.position.z < player.position.z + 1.25 && Math.abs(lanes[item.lane] - player.position.x) < 1.18) {
        item.taken = true;
        item.mesh.visible = false;
        if (item.kind === 'coin') {
          state.coins += 1;
          state.score += coinPointValue;
          if (soundEnabled) playChime();
          showToast(`Coin collected! +${coinPointValue} points · ₦${coinPointValue}`);
        } else if (state.passengers === 0) {
          state.passengers = 1;
          state.dropDistance = state.distance + 160;
          showToast('Passenger onboard! Drop-off ahead.');
        }
      }
    }

    if (state.passengers && state.distance >= state.dropDistance) {
      state.passengers = 0;
      state.dropDistance = null;
      state.score += 150;
      showToast('Drop-off complete! +150 points');
    }
    const streetIndex = (Math.floor(state.distance / 180) + 1) % streets.length;
    if (streetIndex !== state.streetIndex) {
      state.streetIndex = streetIndex;
      ui.street.textContent = streets[streetIndex];
      showToast(`Now riding on ${streets[streetIndex]}`);
    }
    if (state.distance >= 400 && state.missionStage === 0) {
      state.missionStage = 1;
      ui.mission.textContent = 'Survive Ikot Ekpene Road';
      showToast('Ibom Plaza reached! Next: survive Ikot Ekpene Road.');
    }
    if (state.missionStage === 0) {
      ui.progress.style.width = `${Math.min(100, state.distance / 400 * 100)}%`;
      ui.detail.textContent = `${Math.min(400, Math.floor(state.distance))} / 400 m`;
    } else if (state.missionStage === 1) {
      if (streetIndex === 1) state.roadTime += delta;
      ui.progress.style.width = `${Math.min(100, state.roadTime / 60 * 100)}%`;
      ui.detail.textContent = `${Math.min(60, Math.floor(state.roadTime))} / 60 sec · Ikot Ekpene`;
      if (state.roadTime >= 60) {
        state.missionStage = 2;
        state.score += 300;
        ui.mission.textContent = 'Uyo road legend';
        ui.detail.textContent = 'All missions complete';
        ui.progress.style.width = '100%';
        showToast('Uyo road legend! Mission complete +300');
      }
    }
    if (state.distance > 350 && state.distance < 450) ui.landmark.classList.add('visible');
    else ui.landmark.classList.remove('visible');
    ui.score.textContent = String(Math.floor(state.score)).padStart(6, '0');
    ui.speed.textContent = String(Math.round(state.speed));
    ui.meter.style.width = `${Math.min(100, state.speed / 88 * 100)}%`;
    ui.fuel.textContent = String(Math.max(0, Math.round(state.fuel)));
    ui.fuelMeter.style.width = `${Math.max(0, state.fuel)}%`;
    ui.coins.textContent = String(state.coins);
    ui.hornStatus.textContent = state.hornCooldown > 0 ? `${state.hornCooldown.toFixed(1)}s` : 'READY';
    ui.passengers.textContent = String(state.passengers);
    ui.passengerTitle.textContent = state.passengers ? 'Passenger onboard' : 'No passenger';
    ui.passengerDetail.textContent = state.passengers ? `${Math.max(0, Math.ceil(state.dropDistance - state.distance))} m to drop-off` : 'Look out for a pickup';
  }
  renderer.render(scene, camera);
}

function startAudio() {
  audioContext ||= new AudioContext();
  if (audioContext.state === 'suspended') audioContext.resume();
  if (!masterGain) {
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.0001;
    masterGain.connect(audioContext.destination);
  }
  masterGain.gain.setTargetAtTime(0.62, audioContext.currentTime, 0.12);
  if (!engineOscillator) {
    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 190;
    engineOscillator = audioContext.createOscillator();
    engineOscillator.type = 'sawtooth';
    engineOscillator.frequency.value = 105;
    engineGain = audioContext.createGain();
    engineGain.gain.value = 0.035;
    engineOscillator.connect(filter);
    filter.connect(engineGain);
    engineGain.connect(masterGain);
    engineOscillator.start();
  }
  if (!musicTimer) musicTimer = setInterval(playMusicStep, 230);
}

function stopAudio() {
  if (masterGain && audioContext) masterGain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.08);
}

function playTone(frequency, duration, type = 'sine', volume = 0.05, delay = 0) {
  if (!soundEnabled || !audioContext || !masterGain) return;
  const start = audioContext.currentTime + delay;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start();
  oscillator.stop(start + duration + 0.02);
}

function playMusicStep() {
  if (!soundEnabled) return;
  const melody = [220, 0, 261.63, 329.63, 0, 293.66, 261.63, 0, 196, 0, 261.63, 293.66, 0, 329.63, 293.66, 0];
  const bass = [110, 0, 0, 0, 130.81, 0, 0, 0, 98, 0, 0, 0, 146.83, 0, 0, 0];
  const step = musicStep % melody.length;
  if (melody[step]) playTone(melody[step], 0.19, 'triangle', 0.05);
  if (bass[step]) playTone(bass[step], 0.36, 'sine', 0.075);
  if (step % 4 === 2) playTone(1450, 0.045, 'square', 0.008);
  musicStep += 1;
}

function playChime() {
  playTone(880, 0.13, 'sine', 0.1);
  playTone(1320, 0.18, 'sine', 0.075, 0.07);
}

function playCrash() {
  engineGain.gain.setTargetAtTime(0.008, audioContext.currentTime, 0.06);
  playTone(220, 0.2, 'sawtooth', 0.11);
  playTone(146.83, 0.24, 'triangle', 0.09, 0.12);
  playTone(82.41, 0.36, 'sawtooth', 0.12, 0.25);
}

window.addEventListener('resize', () => {
  setCameraFraming();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
});

renderLeaderboard();
requestAnimationFrame(animate);
setTimeout(() => ui.loading.classList.add('hidden'), 450);
setTimeout(() => ui.loading.remove(), 1000);