/**
 * Script to open our NetworkTablesViewer in the default browser.
 * 
 * Usage: node open-web-viewer.js
 */
const path = require('path');
const { exec } = require('child_process');

// Open NetworkTablesViewer in the default browser
console.log('Opening NetworkTablesViewer in the default browser...');

const viewerPath = path.join(__dirname, 'examples', 'NetworkTablesViewer.html');
const viewerUrl = `file://${viewerPath}`;

// Open in the default browser
let command;
if (process.platform === 'win32') {
  command = `start "" "${viewerUrl}"`;
} else if (process.platform === 'darwin') {
  command = `open "${viewerUrl}"`;
} else {
  command = `xdg-open "${viewerUrl}"`;
}

exec(command, (error) => {
  if (error) {
    console.error(`Error opening NetworkTablesViewer: ${error.message}`);
  } else {
    console.log('NetworkTablesViewer opened in the default browser.');
    console.log('You should see test data in the NetworkTablesViewer window.');
  }
});
