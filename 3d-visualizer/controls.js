import { GUI } from 'dat.gui';
import { GuiDisplay } from './gui-display.js';

const gui = new GUI();

// Step control variables
const containerSizeStep = 1;
const containerPositionStep = 1;
const itemSizeStep = 1;
const itemPositionStep = 1;

// Flags to enable/disable controls
const enableContainerControls = false;
const enableItemSizeControls = true;
const enableItemPositionControls = true;

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
      containerSizeFolder.add(container.size, dim, 0, 300, containerSizeStep).onChange(value => {
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
      const ctrl = containerPosFolder
        .add(container.position, axis, min, max, containerPositionStep)
        .onChange(value => {
          container.updatePosition();
        });
      containerPosControllers[axis] = ctrl; // store controller for later use
    });
  }

  // Items
  if (enableItemSizeControls || enableItemPositionControls) {
    const itemsControlFolder = gui.addFolder('Items');

    items.forEach(item => {
      const itemFolder = itemsControlFolder.addFolder(item.name);
      const sizeControllers = [];
      const posControllers = [];

      // Items Size
      if (enableItemSizeControls) {
        const sizeFolder = itemFolder.addFolder('Size');
        sizeFolder.open();

        Object.keys(item.size).forEach(dim => {
          const { min, max } = item.getSizeRange(dim);
          const ctrl = sizeFolder.add(item.size, dim, min, max, itemSizeStep).onChange(value => {
            item.updateSize();
            // update item position sliders when item size changes
            updateItemPosRanges(item, posControllers);
          });
          sizeControllers.push({ dim, ctrl });
        });
      }

      // Items Position
      if (enableItemPositionControls) {
        const posFolder = itemFolder.addFolder('Position');
        posFolder.open();

        Object.keys(item.position).forEach(axis => {
          const { min, max } = item.getPositionRange(axis);
          const ctrl = posFolder
            .add(item.position, axis, min, max, itemPositionStep)
            .onChange(value => {
              item.updatePosition();
            });
          posControllers.push({ axis, ctrl });
        });
      }

      itemsControllers.push({ item, sizeControllers, posControllers }); // store item controllers
    });
  }

  // Intersections
  const intersectionsFolder = gui.addFolder('Intersections');
  const intersectionsDisplay = new GuiDisplay(intersectionsFolder);

  // Item Properties
  const itemPropertiesFolder = gui.addFolder('Item Properties');
  const propertiesDisplay = new GuiDisplay(itemPropertiesFolder);

  // Update function for intersections display
  function updateIntersections() {
    let html = '';
    items.forEach(item => {
      html += `<strong>${item.name}:</strong> `;
      html += item.intersections.length > 0 ? item.intersections.join(', ') : 'None';
      html += '<br/>';
    });
    intersectionsDisplay.update(html);
  }

  // Update function for item properties display
  function updateItemProperties() {
    let html = '';
    items.forEach(item => {
      html += `<strong>${item.name}</strong><br/>`;
      html += `Size: ${item.size.width}, ${item.size.height}, ${item.size.depth}<br/>`;
      html += `Position: ${item.position.x}, ${item.position.y}, ${item.position.z}<br/>`;
      html += '<br/>';
    });
    propertiesDisplay.update(html);
  }

  return {
    updateIntersections,
    updateItemProperties,
  };
}
