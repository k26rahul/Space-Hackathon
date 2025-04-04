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

function initializeContainers(data) {
  const containers = data.containers.map(containerData => {
    const ctr = new Container(containerData);
    scene.add(ctr.mesh);
    ctr.setupMousePicking(orthographicCamera, renderer);
    return ctr;
  });

  data.items.forEach(itemData => {
    const target = containers.find(c => c.id === itemData.container_id);
    if (target) target.addItem(itemData);
  });

  return containers;
}

loadDataset(getStoredDataset()).then(data => {
  const containers = initializeContainers(data);
  const guiControls = setupControls({
    containers,
    onDatasetChange: dataset => {
      containers.forEach(c => {
        c.destroy();
      });
      return loadDataset(dataset).then(newData => {
        return initializeContainers(newData);
      });
    },
  });

  function animate() {
    requestAnimationFrame(animate);
    stats.begin();

    controls.update();

    containers.forEach(c => {
      if (c.sandboxMode) {
        c.checkIntersections();
      }
    });

    // guiControls.updateIntersections();
    // guiControls.updateItemProperties();

    renderer.render(scene, orthographicCamera);
    labelRenderer.render(scene, orthographicCamera);

    stats.end();
  }
  animate();
});
