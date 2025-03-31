import * as THREE from 'three';
import { GUI } from 'dat.gui';

const gui = new GUI();

export function setupControls({ items, containerPosition, setContainerPosition }) {
  const containerFolder = gui.addFolder('Container Position');
  containerFolder
    .add(containerPosition, 'x', -100, 100)
    .onChange(value => setContainerPosition(containerPosition));
  containerFolder
    .add(containerPosition, 'y', -100, 100)
    .onChange(value => setContainerPosition(containerPosition));
  containerFolder
    .add(containerPosition, 'z', -100, 100)
    .onChange(value => setContainerPosition(containerPosition));

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
    }
  } else if (property.startsWith('position')) {
    const index = ['x', 'y', 'z'].indexOf(property.split('-')[1]);
    if (index !== -1) {
      item.position[index] = value;
      item.mesh.position.set(...item.position);
    }
  }
}
