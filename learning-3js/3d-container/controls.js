import { GUI } from 'dat.gui';
import * as THREE from 'three';

const gui = new GUI();

export function setupControls({ container, items }) {
  // Create a parent folder for Container
  const containerFolder = gui.addFolder('Container');

  // Dimensions folder
  const containerDimFolder = containerFolder.addFolder('Dimensions');
  Object.keys(container.dimensions).forEach(dim => {
    containerDimFolder.add(container.dimensions, dim, -100, 300).onChange(value => {
      container.updateDimensions();
    });
  });

  // Position folder
  const containerPosFolder = containerFolder.addFolder('Position');
  Object.keys(container.position).forEach(dim => {
    containerPosFolder.add(container.position, dim, -100, 100).onChange(value => {
      container.updatePosition();
    });
  });

  items.forEach(item => {
    const itemFolder = gui.addFolder(item.name);
    const posFolder = itemFolder.addFolder('Position');
    const dimFolder = itemFolder.addFolder('Dimensions');

    Object.keys(item.position).forEach(dim => {
      posFolder.add(item.position, dim, -100, 100).onChange(value => item.updatePosition());
    });

    Object.keys(item.size).forEach(dim => {
      dimFolder.add(item.size, dim, -100, 100).onChange(value => item.updateSize());
    });
  });
}
