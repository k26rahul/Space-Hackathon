import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

import { Item } from './components/Item.js';
import { Container } from './components/Container.js';

import { loadDataset, getStoredDataset } from './data/data.js';
import { setupControls } from './gui/gui.js';

const canvasContainer = document.getElementById('canvas-container');

const stats = new Stats();
document.body.appendChild(stats.dom);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
canvasContainer.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
labelRenderer.domElement.classList.add('css2d-renderer');
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

orthographicCamera.position.set(100, 100, 150);
orthographicCamera.zoom = 0.9;
controls.target.set(50, 50, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const axesHelper = new THREE.AxesHelper(150);
scene.add(axesHelper);

const container = new Container({
  size: { width: 100, height: 100, depth: 100 },
  position: { x: 0, y: 0, z: 0 },
});
scene.add(container.mesh);
container.setupMousePicking(orthographicCamera, renderer);

// Create an <Item>
function createItem(data) {
  const item = new Item(data);
  container.addItem(item);
  item.setContainer(container);
  return item;
}

// Cleanup items
function cleanupItems() {
  container.removeAllItems();
}

let guiControls;

// Initialize items from dataset
function initializeItems(data) {
  data.items.forEach(item => createItem(item));
  guiControls.initializeItemControls(container.items);
}

// Initialize with default dataset and setup controls
loadDataset(getStoredDataset()).then(data => {
  guiControls = setupControls({
    items: container.items,
    createItem,
    container,
    onDatasetChange: dataset => {
      cleanupItems();
      loadDataset(dataset).then(newData => {
        initializeItems(newData);
      });
    },
  });

  initializeItems(data);

  function animate() {
    requestAnimationFrame(animate);
    stats.begin();

    controls.update();

    if (container.sandboxMode) {
      container.checkIntersections(); // check for intersections
      guiControls.updateIntersections(); // update GUI intersections display
      guiControls.updateItemProperties(); // update GUI item properties display
    }

    renderer.render(scene, orthographicCamera);
    labelRenderer.render(scene, orthographicCamera);

    stats.end();
  }
  animate();
});
