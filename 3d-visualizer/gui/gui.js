import { GUI } from 'dat.gui';
import { GuiTextDisplay } from './GuiTextDisplay.js';

const gui = new GUI();

// Step control variables
const containerSizeStep = 1;
const containerPositionStep = 1;
const itemSizeStep = 1;
const itemPositionStep = 1;

export function setupControls({ container, items, createItem }) {
  // { x: controller, y: controller, ... }
  const containerPosControllers = {};

  // each { item, sizeControllers: [{dim, ctrl}], posControllers: [{axis, ctrl}] }
  // dim: 'width', 'height', 'depth'
  // axis: 'x', 'y', 'z'
  const itemsControllers = [];

  function createNewItem(itemData) {
    const newItem = createItem(itemData);
    setupItemControls(newItem);
    return newItem;
  }

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

  // Items
  const itemsControlFolder = gui.addFolder('Items');

  function setupItemControls(item) {
    const itemFolder = itemsControlFolder.addFolder(item.name);

    // Add Clone button as first control
    itemFolder
      .add(
        {
          clone: () => {
            const newItemData = {
              size: { ...item.size },
              position: { ...item.position },
            };
            createNewItem(newItemData);
          },
        },
        'clone'
      )
      .name('Clone');

    const sizeControllers = [];
    const posControllers = [];

    // Items Size
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

    // Items Position
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

    itemsControllers.push({ item, sizeControllers, posControllers }); // store item controllers
  }

  // Setup controls for existing items
  items.forEach(item => setupItemControls(item));

  // Add New Item button
  gui
    .add(
      {
        addItem: () => {
          const newItemData = {
            size: {
              // random size between 20 and 50
              width: Math.floor(Math.random() * 7) * 5 + 20,
              height: Math.floor(Math.random() * 7) * 5 + 20,
              depth: Math.floor(Math.random() * 7) * 5 + 20,
            },
            position: {
              // random position between 0 and 50
              x: Math.floor(Math.random() * 51),
              y: Math.floor(Math.random() * 51),
              z: -Math.floor(Math.random() * 51), // negative z for depth
            },
          };
          createNewItem(newItemData);
        },
      },
      'addItem'
    )
    .name('Add New Item');

  // Intersections
  const intersectionsFolder = gui.addFolder('Intersections');
  const intersectionsDisplay = new GuiTextDisplay(intersectionsFolder);

  // Item Properties
  const itemPropertiesFolder = gui.addFolder('Item Properties');
  const propertiesDisplay = new GuiTextDisplay(itemPropertiesFolder);

  // Add Export button to Item Properties folder
  gui
    .add(
      {
        exportItems: () => {
          const itemsData = items.map(item => ({
            size: { ...item.size },
            position: { ...item.position },
          }));
          const jsonString = JSON.stringify({ items: itemsData });
          navigator.clipboard
            .writeText(jsonString)
            .then(() => {
              console.log('Items data copied to clipboard!');
            })
            .catch(err => {
              console.error('Failed to copy to clipboard:', err);
            });
        },
      },
      'exportItems'
    )
    .name('Export Items Data');

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
