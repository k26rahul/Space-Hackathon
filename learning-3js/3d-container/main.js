import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { setupControls } from './controls.js';
import { hexToRgb } from './utils.js';

const canvasContainer = document.getElementById('canvas-container');

const renderer = new THREE.WebGLRenderer({
  antialias: true,
});
renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
canvasContainer.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
canvasContainer.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

const aspectRatio = window.innerWidth / window.innerHeight;
const viewSize = 200;
const orthographicCamera = new THREE.OrthographicCamera(
  (-viewSize * aspectRatio) / 2,
  (viewSize * aspectRatio) / 2,
  viewSize / 2,
  -viewSize / 2,
  -1000,
  1000
);

const controls = new OrbitControls(orthographicCamera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

{
  const [x, y] = [50, 50];
  orthographicCamera.position.set(x, y, 150);
  controls.target.set(x, y, 0);
}

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const containerSize = 100;
const containerGeo = new THREE.BoxGeometry(containerSize, containerSize, containerSize);
const containerMat = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  wireframe: true,
});
const container = new THREE.Mesh(containerGeo, containerMat);
scene.add(container);

const containerPosition = { x: 0, y: 0, z: 0 };
function updateContainerPosition({ x, y, z } = containerPosition) {
  const containerOffset = containerSize / 2;
  x += containerOffset;
  y += containerOffset;
  z += -containerOffset;
  container.position.set(x, y, z);
}
updateContainerPosition();

const frontFaceGeo = new THREE.PlaneGeometry(containerSize, containerSize);
const frontFaceMat = new THREE.MeshBasicMaterial({
  color: 0x00ff00,
  transparent: true,
  opacity: 0.2,
  side: THREE.DoubleSide,
});
const frontFace = new THREE.Mesh(frontFaceGeo, frontFaceMat);
frontFace.position.set(0, 0, containerSize / 2);
container.add(frontFace);

const items = [
  {
    name: 'Item 1',
    size: [30, 30, 30],
    size: { width: 30, height: 30, depth: 30 },
    position: { x: 0, y: 0, z: 0 },
    color: 0xff0000,
    mesh: null,
    label: null,
  },
  {
    name: 'Item 2',
    size: { width: 40, height: 40, depth: 40 },
    position: { x: 0, y: 0, z: -30 },
    color: 0x0000ff,
    mesh: null,
    label: null,
  },
];

function updateItemPosition(item) {
  const containerOffset = containerSize / 2;
  const { width, height, depth } = item.size;
  const { x, y, z } = item.position;

  const posX = x + width / 2 - containerOffset;
  const posY = y + height / 2 - containerOffset;
  const posZ = z - depth / 2 + containerOffset;

  item.mesh.position.set(posX, posY, posZ);
}

function updateItemSize(item) {
  item.mesh.geometry.dispose();
  item.mesh.geometry = new THREE.BoxGeometry(item.size.width, item.size.height, item.size.depth);
  item.label.position.set(0, item.size.height / 2 + 5, 0);
  updateItemPosition(item);
}

function createItem(item) {
  const { width, height, depth } = item.size;

  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({
    color: item.color,
    transparent: true,
    opacity: 0.8,
  });
  const mesh = new THREE.Mesh(geometry, material);

  const labelDiv = document.createElement('div');
  labelDiv.className = 'label';
  labelDiv.textContent = item.name;
  labelDiv.style.borderColor = hexToRgb(item.color);
  const label = new CSS2DObject(labelDiv);
  label.position.set(0, height / 2 + 5, 0);
  mesh.add(label);

  item.mesh = mesh;
  item.label = label;
  updateItemPosition(item);
  return mesh;
}

items.forEach(item => {
  const itemMesh = createItem(item);
  container.add(itemMesh);
});

const axesHelper = new THREE.AxesHelper(150);
scene.add(axesHelper);

setupControls({
  items,
  containerPosition,
  updateContainerPosition,
  updateItemPosition,
  updateItemSize,
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, orthographicCamera);
  labelRenderer.render(scene, orthographicCamera);
}
animate();
