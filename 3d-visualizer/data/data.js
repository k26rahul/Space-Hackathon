import { copyToClipboard } from '../utils.js';

export const DATASETS = [
  '100-10x40x20',
  '100-80x10x10',
  '1000-10x10x10',
  '1000000cube1',
  '1000cube10',
  '125000cube2',
  '125cube20',
  '150-30x20x10',
  '1500-30x5x4',
  '15625cube4',
  '17mixed',
  '17mixed2',
  '31mixed',
  '40-10x40x50',
  '400-10x40x5',
  '50-100x20x10',
  '500-10x20x10',
  '5000-10x5x4',
  '65stairs',
  '7giant',
  '8000cube5',
  '8cube50',
];

export const DEFAULT_DATASET = '17mixed';
export const STORAGE_KEY = 'selectedDataset';

export function getStoredDataset() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored || DEFAULT_DATASET;
}

export function setStoredDataset(dataset) {
  localStorage.setItem(STORAGE_KEY, dataset);
}

export function loadDataset(dataset) {
  return fetch(`./data/${dataset}.json`)
    .then(res => res.json())
    .catch(error => {
      console.error('Error loading dataset:', error);
      throw error;
    });
}

export function exportDataset(items) {
  const itemsData = items.map(item => ({
    size: { ...item.size },
    position: { ...item.position },
  }));

  const jsonString = JSON.stringify({ items: itemsData });
  copyToClipboard(jsonString);
}

export function generateRandomItemData() {
  return {
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
}
