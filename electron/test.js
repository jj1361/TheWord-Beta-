// Simple test for Electron
console.log('Starting test...');
console.log('process.type:', process.type);
console.log('process.versions.electron:', process.versions.electron);

try {
  const electron = require('electron');
  console.log('electron module type:', typeof electron);
  console.log('electron module:', electron);

  if (electron.app) {
    console.log('app found!');
  } else {
    console.log('app is undefined');
  }
} catch (e) {
  console.error('Error:', e.message);
}
