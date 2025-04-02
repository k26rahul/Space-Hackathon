export const TOTAL_SETS = 6;
export const STORAGE_KEY = 'selectedDataset';
export const DEFAULT_SET = 2;

export function getStoredDataset() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? parseInt(stored) : 2; // fallback to 2 if nothing stored
}

export function setStoredDataset(setNumber) {
  localStorage.setItem(STORAGE_KEY, setNumber.toString());
}

export function loadDataset(setNumber) {
  return fetch(`./data/set${setNumber}.json`)
    .then(res => res.json())
    .catch(error => {
      console.error('Error loading item set:', error);
      throw error;
    });
}
