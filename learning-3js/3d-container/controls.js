import { GUI } from 'dat.gui';

const gui = new GUI();

const posToDim = {
  x: 'width',
  y: 'height',
  z: 'depth',
};

export function setupControls({ container, items }) {
  // Store controller references
  const containerPosControllers = {}; // { x: controller, y: controller, ... }
  const itemsControllers = []; // each { item, dimControllers: [{dim, ctrl}], posControllers: [{dim, ctrl}] }

  function getContainerPosRange(dim) {
    const val = container.dimensions[posToDim[dim]] || 100;
    return { min: -val, max: val };
  }

  function getItemPosRange(item, dim) {
    if (dim === 'x') return { min: 0, max: container.dimensions.width - item.size.width };
    if (dim === 'y') return { min: 0, max: container.dimensions.height - item.size.height };
    if (dim === 'z') return { min: -(container.dimensions.depth - item.size.depth), max: 0 };
  }

  function updateItemSizeRanges(item, dimControllers) {
    dimControllers.forEach(({ dim, ctrl }) => {
      ctrl.min(1).max(container.dimensions[dim] || 100);
    });
  }

  function updateItemPosRanges(item, posControllers) {
    posControllers.forEach(({ dim, ctrl }) => {
      const { min, max } = getItemPosRange(item, dim);
      ctrl.min(min).max(max);
    });
  }

  // Container Folder
  const containerFolder = gui.addFolder('Container');

  // Dimensions
  const containerDimFolder = containerFolder.addFolder('Dimensions');
  Object.keys(container.dimensions).forEach(dim => {
    containerDimFolder.add(container.dimensions, dim, 0, 300).onChange(value => {
      container.updateDimensions();
      // update container position sliders when container size changes
      Object.keys(container.position).forEach(dim => {
        const { min, max } = getContainerPosRange(dim);
        containerPosControllers[dim].min(min).max(max);
      });
      // refresh all item sliders when container size changes
      itemsControllers.forEach(({ item, dimControllers, posControllers }) => {
        updateItemSizeRanges(item, dimControllers);
        updateItemPosRanges(item, posControllers);
      });
    });
  });

  // Position (DRY: use getContainerPosRange)
  const containerPosFolder = containerFolder.addFolder('Position');
  Object.keys(container.position).forEach(dim => {
    const { min, max } = getContainerPosRange(dim);
    const ctrl = containerPosFolder.add(container.position, dim, min, max).onChange(value => {
      container.updatePosition();
    });
    containerPosControllers[dim] = ctrl;
  });

  // Items
  items.forEach(item => {
    const itemFolder = gui.addFolder(item.name);
    const dimFolder = itemFolder.addFolder('Dimensions');
    const posFolder = itemFolder.addFolder('Position');
    const dimControllers = [];
    const posControllers = [];

    // Dimensions
    Object.keys(item.size).forEach(dim => {
      const max = container.dimensions[dim] || 100;
      const ctrl = dimFolder.add(item.size, dim, 1, max).onChange(value => {
        item.updateSize();
        updateItemPosRanges(item, posControllers);
      });
      dimControllers.push({ dim, ctrl });
    });

    // Position (DRY: use getItemPosRange)
    Object.keys(item.position).forEach(dim => {
      const { min, max } = getItemPosRange(item, dim);
      const ctrl = posFolder.add(item.position, dim, min, max).onChange(value => {
        item.updatePosition();
      });
      posControllers.push({ dim, ctrl });
    });

    itemsControllers.push({ item, dimControllers, posControllers });
  });
}
