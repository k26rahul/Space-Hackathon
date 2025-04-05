import { GUI } from 'lil-gui';
import { ContainerGui } from './ContainerGui.js';
import { DATASETS, getStoredDataset, setStoredDataset, exportDataset } from '../data/data.js';

export const settings = {
  showLabelOnIntersection: true,
  currentDataset: getStoredDataset(),
};

let containerGuis = [];
const gui = new GUI();

export function initializeGUI({ containers, onDatasetChange }) {
  gui.add(settings, 'showLabelOnIntersection').name('Show Label on Intersection');

  // Dataset selection
  gui
    .add(settings, 'currentDataset', DATASETS)
    .name('Dataset')
    .onChange(value => {
      setStoredDataset(value);
      cleanupContainerGuis();
      onDatasetChange(value);
    });

  // Export button
  gui
    .add(
      {
        exportDataset: () => {
          Object.values(containers).forEach(container => {
            exportDataset(container);
          });
        },
      },
      'exportDataset'
    )
    .name('Export Dataset');

  Object.values(containers).forEach(container => {
    const containerGui = new ContainerGui(container, gui);
    container.setGuiControls(containerGui);
    containerGuis.push(containerGui);
  });
}

function cleanupContainerGuis() {
  containerGuis.forEach(gui => gui.destroy());
  containerGuis = [];
}
