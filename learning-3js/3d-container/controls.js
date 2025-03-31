import * as THREE from 'three';

export function updateContainerPosition(container, axis, value) {
  const positionIndex = {
    x: 0,
    y: 1,
    z: 2,
  }[axis];
  container.position.setComponent(positionIndex, value);
}

export function setupControls({
  gui,
  container,
  items,
  orthographicCamera,
  perspectiveCamera,
  containerSize,
  controls,
  setActiveCamera,
}) {
  const cameraFolder = gui.addFolder('Camera Settings');
  const cameraSettings = {
    type: 'orthographic',
    fov: 75,
    zoom: 1,
  };

  cameraFolder.add(cameraSettings, 'type', ['orthographic', 'perspective']).onChange(value => {
    const camera = value === 'orthographic' ? orthographicCamera : perspectiveCamera;
    setActiveCamera(camera);
    controls.object = camera;
    camera.position.set(150, 150, 150);
    camera.lookAt(containerSize / 2, containerSize / 2, containerSize / 2);
  });

  cameraFolder.add(cameraSettings, 'fov', 30, 120).onChange(value => {
    perspectiveCamera.fov = value;
    perspectiveCamera.updateProjectionMatrix();
  });

  cameraFolder.add(cameraSettings, 'zoom', 0.1, 5).onChange(value => {
    orthographicCamera.zoom = value;
    perspectiveCamera.zoom = value;
    orthographicCamera.updateProjectionMatrix();
    perspectiveCamera.updateProjectionMatrix();
  });

  const containerFolder = gui.addFolder('Container Position');
  containerFolder
    .add({ x: 0 }, 'x', -200, 200)
    .onChange(value => updateContainerPosition(container, 'x', value));
  containerFolder
    .add({ y: 0 }, 'y', -200, 200)
    .onChange(value => updateContainerPosition(container, 'y', value));
  containerFolder
    .add({ z: 0 }, 'z', -200, 200)
    .onChange(value => updateContainerPosition(container, 'z', value));

  items.forEach((item, index) => {
    const itemFolder = gui.addFolder(
      `Item ${index + 1} (${item.color === 0xff0000 ? 'Red' : 'Blue'})`
    );
    const dimFolder = itemFolder.addFolder('Dimensions');
    const posFolder = itemFolder.addFolder('Position');

    ['width', 'height', 'depth'].forEach((dim, i) => {
      dimFolder
        .add({ [dim]: item.size[i] }, dim, 10, 100)
        .onChange(value => updateItem(items, index, `size-${dim}`, value));
    });

    ['x', 'y', 'z'].forEach((axis, i) => {
      posFolder
        .add({ [axis]: item.position[i] }, axis, 0, 100)
        .onChange(value => updateItem(items, index, `position-${axis}`, value));
    });
  });
}

function updateItem(items, itemIndex, property, value) {
  const item = items[itemIndex];

  if (property.startsWith('size')) {
    const index = ['width', 'height', 'depth'].indexOf(property.split('-')[1]);
    if (index !== -1) {
      item.size[index] = value;
      const [width, height, depth] = item.size;
      item.mesh.geometry.dispose();
      item.mesh.geometry = new THREE.BoxGeometry(width, height, depth);
      item.label.position.set(0, height / 2 + 5, 0);
      validateItemPosition(items, itemIndex);
    }
  } else if (property.startsWith('position')) {
    const index = ['x', 'y', 'z'].indexOf(property.split('-')[1]);
    if (index !== -1) {
      item.position[index] = value;
      item.mesh.position.set(...item.position);
      validateItemPosition(items, itemIndex);
    }
  }
}

function validateItemPosition(items, itemIndex) {
  const item = items[itemIndex];
  const [width, height, depth] = item.size;
  const [x, y, z] = item.position;

  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const halfDepth = depth / 2;

  const newX = Math.max(halfWidth, Math.min(100 - halfWidth, x));
  const newY = Math.max(halfHeight, Math.min(100 - halfHeight, y));
  const newZ = Math.max(halfDepth, Math.min(100 - halfDepth, z));

  if (newX !== x || newY !== y || newZ !== z) {
    item.position = [newX, newY, newZ];
    item.mesh.position.set(...item.position);
  }
}
