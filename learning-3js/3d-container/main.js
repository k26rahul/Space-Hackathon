import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { setupControls } from './controls.js';
import { Container } from './Container.js';
import { Item } from './Item.js';

const canvasContainer = document.getElementById('canvas-container');

const renderer = new THREE.WebGLRenderer({ antialias: true });
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
// controls.autoRotate = true;
// controls.autoRotateSpeed = 1;

{
  orthographicCamera.position.set(100, 100, 150);
  orthographicCamera.zoom = 0.9;
  controls.target.set(50, 50, 0);
}

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const container = new Container({ width: 100, height: 100, depth: 100 });
scene.add(container.mesh);

const items = [
  new Item('Item 1', { width: 30, height: 30, depth: 30 }, { x: 0, y: 0, z: 0 }, 0xff0000),
  new Item('Item 2', { width: 40, height: 40, depth: 40 }, { x: 0, y: 0, z: -30 }, 0x0000ff),
];

items.forEach(item => {
  container.addItem(item);
  item.setContainer(container);
  item.updatePosition();
});

const axesHelper = new THREE.AxesHelper(150);
scene.add(axesHelper);

setupControls({
  container,
  items,
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  container.checkIntersections();
  items.forEach(item => item.updateVisual());

  renderer.render(scene, orthographicCamera);
  labelRenderer.render(scene, orthographicCamera);
}
animate();
