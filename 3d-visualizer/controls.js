import { GUI } from 'dat.gui';

const gui = new GUI();

const axisToDimension = {
  x: 'width',
  y: 'height',
  z: 'depth',
};

export function setupControls({ container, items }) {
  // { x: controller, y: controller, ... }
  const containerPosControllers = {};

  // each { item, sizeControllers: [{dim, ctrl}], posControllers: [{axis, ctrl}] }
  // dim: 'width', 'height', 'depth'
  // axis: 'x', 'y', 'z'
  const itemsControllers = [];

  function getContainerPosRange(axis) {
    const val = container.size[axisToDimension[axis]];
    return { min: -val, max: val };
  }

  function getItemPosRange(item, axis) {
    if (axis === 'x') return { min: 0, max: container.size.width - item.size.width };
    if (axis === 'y') return { min: 0, max: container.size.height - item.size.height };
    if (axis === 'z') return { min: -(container.size.depth - item.size.depth), max: 0 };
  }

  function getItemSizeRange(dim) {
    return { min: 1, max: container.size[dim] };
  }

  function updateItemSizeRanges(item, sizeControllers) {
    sizeControllers.forEach(({ dim, ctrl }) => {
      const { min, max } = getItemSizeRange(dim);
      ctrl.min(min).max(max);
    });
  }

  function updateItemPosRanges(item, posControllers) {
    posControllers.forEach(({ axis, ctrl }) => {
      const { min, max } = getItemPosRange(item, axis);
      ctrl.min(min).max(max);
    });
  }

  // Container
  const containerFolder = gui.addFolder('Container');

  // Container Size
  const containerSizeFolder = containerFolder.addFolder('Size');
  Object.keys(container.size).forEach(dim => {
    containerSizeFolder.add(container.size, dim, 0, 300).onChange(value => {
      container.updateSize();
      // update container position sliders when container size changes
      Object.keys(container.position).forEach(axis => {
        const { min, max } = getContainerPosRange(axis);
        containerPosControllers[axis].min(min).max(max);
      });
      // update items size and position sliders when container size changes
      itemsControllers.forEach(({ item, sizeControllers, posControllers }) => {
        updateItemSizeRanges(item, sizeControllers);
        updateItemPosRanges(item, posControllers);
      });
    });
  });

  // Container Position
  const containerPosFolder = containerFolder.addFolder('Position');
  Object.keys(container.position).forEach(axis => {
    const { min, max } = getContainerPosRange(axis);
    const ctrl = containerPosFolder.add(container.position, axis, min, max).onChange(value => {
      container.updatePosition();
    });
    containerPosControllers[axis] = ctrl; // store controller for later use
  });

  // Items
  items.forEach(item => {
    const itemFolder = gui.addFolder(item.name);
    const sizeFolder = itemFolder.addFolder('Size');
    const posFolder = itemFolder.addFolder('Position');
    const sizeControllers = [];
    const posControllers = [];

    // Items Size
    Object.keys(item.size).forEach(dim => {
      const { min, max } = getItemSizeRange(dim);
      const ctrl = sizeFolder.add(item.size, dim, min, max).onChange(value => {
        item.updateSize();
        // update item position sliders when item size changes
        updateItemPosRanges(item, posControllers);
      });
      sizeControllers.push({ dim, ctrl });
    });

    // Items Position
    Object.keys(item.position).forEach(axis => {
      const { min, max } = getItemPosRange(item, axis);
      const ctrl = posFolder.add(item.position, axis, min, max).onChange(value => {
        item.updatePosition();
      });
      posControllers.push({ axis, ctrl });
    });

    itemsControllers.push({ item, sizeControllers, posControllers }); // store item controllers
  });

  // Intersections
  const intersectionsFolder = gui.addFolder('Intersections');
  const intersectionsDisplay = document.createElement('div');
  intersectionsDisplay.className = 'intersections-display';
  // Append the display to the folder's internal list so it toggles with the folder
  intersectionsFolder.__ul.appendChild(intersectionsDisplay);

  // Update function for intersections display
  function updateIntersections() {
    let html = '';
    items.forEach(item => {
      html += `<strong>${item.name}:</strong> `;
      html += item.intersections.length > 0 ? item.intersections.join(', ') : 'None';
      html += '<br/>';
    });
    intersectionsDisplay.innerHTML = html;
  }

  return {
    updateIntersections,
  };
}
