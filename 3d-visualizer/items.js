// Create a promise that resolves when all data is loaded
export const dataLoaded = Promise.all([
  fetch('./data/set1.json').then(res => res.json()),
  fetch('./data/set2.json').then(res => res.json()),
  fetch('./data/set3.json').then(res => res.json()),
  fetch('./data/set4.json').then(res => res.json()),
  fetch('./data/set5.json').then(res => res.json()),
])
  .then(([set1Data, set2Data, set3Data, set4Data, set5Data]) => {
    return {
      set1: set1Data.items,
      set2: set2Data.items,
      set3: set3Data.items,
      set4: set4Data.items,
      set5: set5Data.items,
    };
  })
  .catch(error => {
    console.error('Error loading item sets:', error);
    throw error;
  });

// Export the promise that resolves to the data
export const itemsData = dataLoaded.then(data => data.set2);
