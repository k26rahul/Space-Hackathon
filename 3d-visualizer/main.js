import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

import { Container } from './components/Container.js';
import { initializeGUI } from './gui/gui.js';
import { loadDataset, getStoredDataset } from './data/data.js';
import { exportDataset } from './utils.js';

const stats = new Stats();
document.body.appendChild(stats.dom);

const canvasContainer = document.getElementById('canvas-container');

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
  -2000,
  2000
);

const controls = new OrbitControls(orthographicCamera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

orthographicCamera.position.set(100, 100, 150);
orthographicCamera.zoom = 0.9;
controls.target.set(50, 50, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const axesHelper = new THREE.AxesHelper(150);
scene.add(axesHelper);

function initializeContainers(data) {
  const enableSandbox = data.items.length < 100;

  const containers = data.containers.reduce((acc, containerData) => {
    const ctr = new Container(containerData, enableSandbox);
    scene.add(ctr.mesh);
    if (enableSandbox) {
      ctr.setupMousePicking(orthographicCamera, renderer);
    }
    acc[containerData.id] = ctr;
    return acc;
  }, {});

  data.items.forEach(itemData => {
    containers[itemData.container_id].addItem(itemData);
  });

  return containers;
}

async function main() {
  const data = await loadDataset(getStoredDataset());
  let containers = initializeContainers(data);

  initializeGUI({
    containers,
    onDatasetChange: async dataset => {
      const newData = await loadDataset(dataset);
      Object.values(containers).forEach(c => {
        c.destroy();
      });
      containers = initializeContainers(newData);
      return containers;
    },
    onExport: () => exportDataset(containers),
  });

  function animate() {
    requestAnimationFrame(animate);
    stats.begin();
    controls.update();

    Object.values(containers).forEach(c => {
      c.tick();
    });

    renderer.render(scene, orthographicCamera);
    labelRenderer.render(scene, orthographicCamera);
    stats.end();
  }
  animate();
}

console.log('Initializing 3D visualizer...');
main()
  .then(() => console.log('3D visualizer initialized successfully.'))
  .catch(console.error);
