import { GUI } from 'dat.gui';

const gui = new GUI();

export function setupControls({
  items,
  containerPosition,
  updateContainerPosition,
  updateItemPosition,
  updateItemSize,
}) {
  const containerFolder = gui.addFolder('Container Position');
  containerFolder
    .add(containerPosition, 'x', -100, 100)
    .onChange(value => updateContainerPosition(containerPosition));
  containerFolder
    .add(containerPosition, 'y', -100, 100)
    .onChange(value => updateContainerPosition(containerPosition));
  containerFolder
    .add(containerPosition, 'z', -100, 100)
    .onChange(value => updateContainerPosition(containerPosition));

  items.forEach(item => {
    const itemFolder = gui.addFolder(item.name);
    const posFolder = itemFolder.addFolder('Position');
    const dimFolder = itemFolder.addFolder('Dimensions');

    Object.keys(item.position).forEach(dim => {
      posFolder.add(item.position, dim, -100, 100).onChange(value => updateItemPosition(item));
    });

    Object.keys(item.size).forEach(dim => {
      dimFolder.add(item.size, dim, -100, 100).onChange(value => {
        updateItemSize(item);
      });
    });
  });
}
