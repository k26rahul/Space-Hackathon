import { GUI } from 'dat.gui';

const gui = new GUI();

export function setupControls({ container, items }) {
  const containerFolder = gui.addFolder('Container Position');

  Object.keys(container.position).forEach(dim => {
    containerFolder.add(container.position, dim, -100, 100).onChange(value => {
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
