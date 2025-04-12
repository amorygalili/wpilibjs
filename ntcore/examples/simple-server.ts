import { NetworkTables } from '../src/api/NetworkTables';
import { NTEntryFlags } from '../src/types/NTTypes';

// Enable debug logging
process.env.NT_DEBUG = 'true';

// Create a new NetworkTables instance
const nt = new NetworkTables();

// Start a NetworkTables server
nt.startServer({ port: 1735 })
  .then(() => {
    console.log('NetworkTables server started on port 1735');

    // Get some topics
    const counter = nt.getNumber('counter');
    const message = nt.getString('message');
    const enabled = nt.getBoolean('robot/enabled');

    // Listen for value changes
    counter.on('valueChanged', (value) => {
      console.log(`Counter changed: ${value}`);
    });

    message.on('valueChanged', (value) => {
      console.log(`Message changed: ${value}`);
    });

    enabled.on('valueChanged', (value) => {
      console.log(`Robot ${value ? 'enabled' : 'disabled'}`);
    });

    // Print all topics every 5 seconds
    setInterval(() => {
      console.log('\nCurrent NetworkTables values:');
      console.log(`- counter: ${counter.value}`);
      console.log(`- message: ${message.value}`);
      console.log(`- robot/enabled: ${enabled.value}`);
    }, 5000);
  })
  .catch((error) => {
    console.error('Failed to start NetworkTables server:', error);
  });

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping NetworkTables server');
  nt.disconnect().then(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});
