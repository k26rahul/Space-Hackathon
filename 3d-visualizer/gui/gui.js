import { GUI } from 'lil-gui';
import { GuiTextDisplay } from './GuiTextDisplay.js';
import {
  TOTAL_SETS,
  getStoredDatasetIndex,
  setStoredDatasetIndex,
  exportDataset,
} from '../data/data.js';

const gui = new GUI();

export const settings = {
  showLabelOnIntersection: true,
};

gui.add(settings, 'showLabelOnIntersection').name('Show Label on Intersection');

// Step control variables
const ITEM_SIZE_STEP = 5;
const ITEM_POSITION_STEP = 5;

export function setupControls({ items, createItem, container, onDatasetChange }) {
  const datasetConfig = { currentSet: getStoredDatasetIndex() };

  function loadDataset(datasetIndex) {
    setStoredDatasetIndex(datasetIndex);
    cleanupItemControls();
    onDatasetChange(datasetIndex);
  }

  // Add Dataset selector at the top
  gui
    .add(
      datasetConfig,
      'currentSet',
      Array.from({ length: TOTAL_SETS }, (_, i) => i)
    )
    .name('Dataset')
    .onChange(value => loadDataset(value));

  // Add Reload button
  gui
    .add(
      {
        reload: () => loadDataset(datasetConfig.currentSet),
      },
      'reload'
    )
    .name('Reload Dataset');

  // Position controllers for each item
  // Format: { item, posControllers: [{axis, ctrl}] }
  // dim: 'width', 'height', 'depth'
  // axis: 'x', 'y', 'z'
  const itemsControllers = [];

  function createNewItem(itemData) {
    const newItem = createItem(itemData);
    setupItemControls(newItem);
    return newItem;
  }

  function updateItemPosRanges(item, posControllers) {
    posControllers.forEach(({ axis, ctrl }) => {
      const { min, max } = item.getPositionRange(axis);
      ctrl.min(min).max(max).updateDisplay();
    });
  }

  // Items
  const itemsControlFolder = gui.addFolder('Items');
  itemsControlFolder.close();

  // Add Visibility Controls folder
  const visibilityFolder = gui.addFolder('Visibility');
  visibilityFolder.close();

  // Add Toggle All button
  const visibilityState = { allVisible: true };
  const toggleAllControl = visibilityFolder
    .add(visibilityState, 'allVisible')
    .name('Toggle All')
    .onChange(value => {
      // Update all items and their controls
      Object.entries(visibilityControls).forEach(([name, control]) => {
        control.setValue(value);
        // No need to call updateVisual() here since setValue will trigger the control's onChange
      });
    });

  // Store visibility controllers
  const visibilityControls = {};

  function cleanupItemControls() {
    // Remove all item folders
    while (itemsControlFolder.children.length > 0) {
      itemsControlFolder.children[0].destroy();
    }

    // Remove all visibility controls except Toggle All
    while (visibilityFolder.children.length > 1) {
      visibilityFolder.children[1].destroy();
    }

    // Clear visibility controls cache
    Object.keys(visibilityControls).forEach(key => delete visibilityControls[key]);
  }

  function initializeItemControls(items) {
    items.forEach(item => setupItemControls(item));
    visibilityState.allVisible = true;
    toggleAllControl.updateDisplay();
  }

  function addVisibilityControl(item) {
    const control = visibilityFolder
      .add(item, 'visible')
      .name(item.name)
      .onChange(() => {
        item.updateVisual();
        // Update all-visible state and its display
        visibilityState.allVisible = items.every(item => item.visible);
        toggleAllControl.updateDisplay();
      });
    visibilityControls[item.name] = control;
  }

  function setupItemControls(item) {
    addVisibilityControl(item);

    const itemFolder = itemsControlFolder.addFolder(item.name);
    itemFolder.close();

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

    const posControllers = [];

    // Items Size
    const sizeFolder = itemFolder.addFolder('Size');
    sizeFolder.open(); // Keep size folder open

    Object.keys(item.size).forEach(dim => {
      const { min, max } = item.getSizeRange(dim);
      sizeFolder.add(item.size, dim, min, max, ITEM_SIZE_STEP).onChange(value => {
        item.updateSize();
        updateItemPosRanges(item, posControllers); // update item position sliders when item size changes
      });
    });

    // Items Position
    const posFolder = itemFolder.addFolder('Position');
    posFolder.open(); // Keep position folder open

    Object.keys(item.position).forEach(axis => {
      const { min, max } = item.getPositionRange(axis);
      const ctrl = posFolder
        .add(item.position, axis, min, max, ITEM_POSITION_STEP)
        .onChange(value => {
          item.updatePosition();
        });
      posControllers.push({ axis, ctrl });
    });

    itemsControllers.push({ item, posControllers }); // store only position controllers
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
  intersectionsFolder.close();

  const intersectionsDisplay = new GuiTextDisplay(intersectionsFolder);

  // Item Properties
  const itemPropertiesFolder = gui.addFolder('Item Properties');
  itemPropertiesFolder.close();

  const propertiesDisplay = new GuiTextDisplay(itemPropertiesFolder);

  // Add Export button to Item Properties folder
  gui
    .add(
      {
        exportItems: () => exportDataset(items),
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
    let totalItemVolume = 0;
    const containerVolume = container.size.width * container.size.height * container.size.depth;

    html += '<strong>Format</strong><br/>';
    html += 'Size: width, height, depth<br/>';
    html += 'Position: x, y, z<br/><br/>';

    items.forEach(item => {
      const itemVolume = item.size.width * item.size.height * item.size.depth;
      totalItemVolume += itemVolume;

      html += `<strong>${item.name}</strong><br/>`;
      html += `Size: ${item.size.width}, ${item.size.height}, ${item.size.depth}<br/>`;
      html += `Position: ${item.position.x}, ${item.position.y}, ${item.position.z}<br/>`;
      html += '<br/>';
    });

    html += `<strong>Volume Statistics</strong><br/>`;
    html += `Container Volume: ${containerVolume / 1000}K cubic units<br/>`;
    html += `Total Items Volume: ${totalItemVolume / 1000}K cubic units<br/>`;
    html += `Space Utilization: ${((totalItemVolume / containerVolume) * 100).toFixed(1)}%<br/>`;

    propertiesDisplay.update(html);
  }

  return {
    updateIntersections,
    updateItemProperties,
    initializeItemControls,
  };
}
