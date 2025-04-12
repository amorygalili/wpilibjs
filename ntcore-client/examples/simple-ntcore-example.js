import { NetworkTableInstance } from '../src/index.js';
// Get the default NetworkTables instance
const inst = NetworkTableInstance.getDefault();
// Start the client
inst.startClient4('Simple-NT4-Example', 'localhost');
// Get a table
const table = inst.getTable('example');
// Get an entry
const counter = table.getEntry('counter');
// Set initial value
counter.setInteger(0);
// Update the counter every second
let count = 0;
setInterval(() => {
    counter.setInteger(count++);
    console.log(`Counter: ${counter.getInteger(0)}`);
}, 1000);
// Handle process termination
process.on('SIGINT', () => {
    console.log('Disconnecting from NetworkTables server...');
    inst.stopClient();
    process.exit(0);
});
//# sourceMappingURL=simple-ntcore-example.js.map