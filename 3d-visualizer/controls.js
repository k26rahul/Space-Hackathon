import { GUI } from 'dat.gui';

const gui = new GUI();

// Flags to enable/disable controls
const enableContainerControls = false;
const enableItemControls = false;

export function setupControls({ container, items }) {
  // { x: controller, y: controller, ... }
  const containerPosControllers = {};

  // each { item, sizeControllers: [{dim, ctrl}], posControllers: [{axis, ctrl}] }
  // dim: 'width', 'height', 'depth'
  // axis: 'x', 'y', 'z'
  const itemsControllers = [];

  function updateItemSizeRanges(item, sizeControllers) {
    sizeControllers.forEach(({ dim, ctrl }) => {
      const { min, max } = item.getSizeRange(dim);
      ctrl.min(min).max(max).updateDisplay();
    });
  }

  function updateItemPosRanges(item, posControllers) {
    posControllers.forEach(({ axis, ctrl }) => {
      const { min, max } = item.getPositionRange(axis);
      ctrl.min(min).max(max).updateDisplay();
    });
  }

  // Container
  if (enableContainerControls) {
    const containerFolder = gui.addFolder('Container');

    // Container Size
    const containerSizeFolder = containerFolder.addFolder('Size');
    Object.keys(container.size).forEach(dim => {
      containerSizeFolder.add(container.size, dim, 0, 300).onChange(value => {
        container.updateSize();

        // update container position sliders when container size changes
        Object.keys(container.position).forEach(axis => {
          const { min, max } = container.getPositionRange(axis);
          containerPosControllers[axis].min(min).max(max).updateDisplay();
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
      const { min, max } = container.getPositionRange(axis);
      const ctrl = containerPosFolder.add(container.position, axis, min, max).onChange(value => {
        container.updatePosition();
      });
      containerPosControllers[axis] = ctrl; // store controller for later use
    });
  }

  // Items
  if (enableItemControls) {
    items.forEach(item => {
      const itemFolder = gui.addFolder(item.name);
      const sizeFolder = itemFolder.addFolder('Size');
      const posFolder = itemFolder.addFolder('Position');
      const sizeControllers = [];
      const posControllers = [];

      // Items Size
      Object.keys(item.size).forEach(dim => {
        const { min, max } = item.getSizeRange(dim);
        const ctrl = sizeFolder.add(item.size, dim, min, max).onChange(value => {
          item.updateSize();

          // update item position sliders when item size changes
          updateItemPosRanges(item, posControllers);
        });
        sizeControllers.push({ dim, ctrl });
      });

      // Items Position
      Object.keys(item.position).forEach(axis => {
        const { min, max } = item.getPositionRange(axis);
        const ctrl = posFolder.add(item.position, axis, min, max).onChange(value => {
          item.updatePosition();
        });
        posControllers.push({ axis, ctrl });
      });

      itemsControllers.push({ item, sizeControllers, posControllers }); // store item controllers
    });
  }

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
