import { GUI } from 'lil-gui';
import { GuiTextDisplay } from './GuiTextDisplay.js';
import {
  DATASETS,
  getStoredDataset,
  setStoredDataset,
  exportDataset,
  generateRandomItemData,
} from '../data/data.js';

export const settings = {
  allItemsVisible: true,
  showLabelOnIntersection: true,
  currentDataset: getStoredDataset(),
  selectedContainerId: null,
};

const ITEM_SIZE_STEP = 5;
const ITEM_POSITION_STEP = 5;

const gui = new GUI();

export function initializeGUI({ containers, onDatasetChange }) {
  settings.selectedContainerId = containers[0]?.id || null;
  let selectedContainer = null;

  function switchContainers(newContainers) {
    containers = newContainers;
    settings.selectedContainerId = newContainers[0]?.id || null;
    loadContainer(settings.selectedContainerId);
  }

  function loadContainer(containerId) {
    cleanupItemControls();
    selectedContainer = containers[containerId]; // Changed from containers.find()
    selectedContainer.itemsArray.forEach(item => setupItemControls(item));
    settings.allItemsVisible = true;
    toggleAllControl.updateDisplay();
  }

  function cleanupItemControls() {
    while (sizeAndPositionFolder.children.length > 0) {
      sizeAndPositionFolder.children[0].destroy();
    }
    while (visibilitySubFolder.children.length > 2) {
      visibilitySubFolder.children[2].destroy();
    }
    Object.keys(visibilityControls).forEach(key => delete visibilityControls[key]);
  }

  function createNewItem(itemData) {
    const newItem = selectedContainer.addItem(itemData);
    setupItemControls(newItem);
    return newItem;
  }

  // Format: [{ item, posControllers: [{ axis, ctrl }] }, ...]
  // axis: 'x', 'y', 'z'
  const itemsControllers = [];

  function setupItemControls(item) {
    function updateItemPosRanges(item, posControllers) {
      posControllers.forEach(({ axis, ctrl }) => {
        const { min, max } = item.getPositionRange(axis);
        ctrl.min(min).max(max).updateDisplay();
      });
    }

    // Add visibility toggle
    const control = visibilitySubFolder
      .add(item, 'visible')
      .name(item.name)
      .onChange(() => {
        item.updateVisual();
        settings.allItemsVisible = selectedContainer.items.every(i => i.visible);
        toggleAllControl.updateDisplay();
      });
    visibilityControls[item.name] = control;

    const itemFolder = sizeAndPositionFolder.addFolder(item.name);
    itemFolder.close();

    // Add Clone button
    sizeAndPositionFolder
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

    // Items Size
    const sizeFolder = itemFolder.addFolder('Size');
    sizeFolder.open();

    Object.keys(item.size).forEach(dim => {
      const { min, max } = item.getSizeRange(dim);
      sizeFolder.add(item.size, dim, min, max, ITEM_SIZE_STEP).onChange(value => {
        item.updateSize();
        updateItemPosRanges(item, posControllers); // update item position sliders when item size changes
      });
    });

    // Items Position
    const posFolder = itemFolder.addFolder('Position');
    posFolder.open();

    const posControllers = [];
    Object.keys(item.position).forEach(axis => {
      const { min, max } = item.getPositionRange(axis);
      const ctrl = posFolder
        .add(item.position, axis, min, max, ITEM_POSITION_STEP)
        .onChange(value => {
          item.updatePosition();
        });
      posControllers.push({ axis, ctrl });
    });

    itemsControllers.push({ item, posControllers });
  }

  gui.add(settings, 'showLabelOnIntersection').name('Show Label on Intersection');

  const itemsFolder = gui.addFolder('Items');
  itemsFolder.close();

  // Add New Item button
  itemsFolder
    .add(
      {
        addItem: () => {
          const newItemData = generateRandomItemData();
          createNewItem(newItemData);
        },
      },
      'addItem'
    )
    .name('Add New Item');

  const sizeAndPositionFolder = itemsFolder.addFolder('Size and Position');
  sizeAndPositionFolder.close();

  const visibilitySubFolder = itemsFolder.addFolder('Visibility');
  visibilitySubFolder.close();

  // Add Animate Visibility button
  visibilitySubFolder
    .add(
      {
        animateVisibility: () => {
          // Get all visibility controls
          const controls = Object.values(visibilityControls);
          if (controls.length === 0) return;

          // First, hide all items
          controls.forEach(control => {
            control.setValue(false);
          });

          // Then show them one by one with delay
          const DELAY = 200;
          controls.forEach((control, index) => {
            setTimeout(() => {
              control.setValue(true);
            }, DELAY * (index + 1));
          });
        },
      },
      'animateVisibility'
    )
    .name('Animate Visibility');

  const visibilityControls = {};
  const toggleAllControl = visibilitySubFolder
    .add(settings, 'allItemsVisible')
    .name('Toggle All')
    .onChange(value => {
      Object.entries(visibilityControls).forEach(([name, control]) => {
        control.setValue(value);
      });
    });

  // Dataset selection dropdown
  gui
    .add(settings, 'currentDataset', DATASETS)
    .name('Dataset')
    .onChange(value => {
      setStoredDataset(value);
      onDatasetChange(value).then(newContainers => {
        switchContainers(newContainers);
      });
    });

  // Container selection dropdown
  gui
    .add(
      settings,
      'selectedContainerId',
      Object.keys(containers) // Changed from containers.map()
    )
    .name('Container')
    .onChange(value => loadContainer(value));

  // Intersections
  const intersectionsFolder = itemsFolder.addFolder('Intersections');
  const intersectionsDisplay = new GuiTextDisplay(intersectionsFolder);
  intersectionsFolder.close();

  // Container Stats
  const containerStatsFolder = itemsFolder.addFolder('Container Stats');
  const containerStatsDisplay = new GuiTextDisplay(containerStatsFolder);
  containerStatsFolder.close();

  // Export Dataset button
  gui
    .add(
      {
        exportDataset: () => exportDataset(selectedContainer),
      },
      'exportDataset'
    )
    .name('Export Dataset');

  function updateIntersections() {
    let html = '';
    selectedContainer.itemsArray.forEach(item => {
      html += `<strong>${item.name}:</strong> `;
      html += item.intersections.length > 0 ? item.intersections.join(', ') : 'None';
      html += '<br/>';
    });
    intersectionsDisplay.update(html);
  }

  function updateItemProperties() {
    let html = '';
    const containerVolume =
      selectedContainer.size.width * selectedContainer.size.height * selectedContainer.size.depth;

    html += '<strong>Item Count</strong><br/>';
    html += `Total Items: ${selectedContainer.itemsArray.length}<br/><br/>`;

    let totalItemVolume = selectedContainer.itemsArray.reduce((acc, item) => {
      return acc + item.size.width * item.size.height * item.size.depth;
    }, 0);

    html += `<strong>${selectedContainer.name}:</strong><br/>`;
    html += `Container Volume: ${containerVolume / 1000}K cubic units<br/>`;
    html += `Total Items Volume: ${totalItemVolume / 1000}K cubic units<br/>`;
    html += `Space Utilization: ${((totalItemVolume / containerVolume) * 100).toFixed(1)}%<br/>`;

    containerStatsDisplay.update(html);
  }

  loadContainer(settings.selectedContainerId);
}
