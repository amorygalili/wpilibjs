import { NetworkTables } from '../src/api/NetworkTables';

// Enable debug logging
process.env.NT_DEBUG = 'true';

// Create a new NetworkTables instance
const nt = new NetworkTables();

// Connect to the NetworkTables server
nt.connectAsClient({ host: 'localhost', port: 1735 })
  .then(() => {
    console.log('Connected to NetworkTables server');

    // Get some topics
    const counter = nt.getNumber('counter');
    const message = nt.getString('message', 'Hello, NetworkTables!');
    const enabled = nt.getBoolean('robot/enabled', false);

    // Set initial values
    counter.value = 0;
    message.value = 'Hello, NetworkTables!';
    enabled.value = false;

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

    // Update counter every second
    let count = 0;
    setInterval(() => {
      count++;
      counter.value = count;
    }, 1000);

    // Toggle robot enabled every 5 seconds
    setInterval(() => {
      enabled.value = !enabled.value;
    }, 5000);
  })
  .catch((error) => {
    console.error('Failed to connect to NetworkTables server:', error);
  });

// Handle process termination
process.on('SIGINT', () => {
  console.log('Disconnecting from NetworkTables server');
  nt.disconnect().then(() => {
    console.log('Disconnected');
    process.exit(0);
  });
});
