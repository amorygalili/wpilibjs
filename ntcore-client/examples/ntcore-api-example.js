import { NetworkTableInstance } from '../src/index.js';
// Get the default NetworkTables instance
const inst = NetworkTableInstance.getDefault();
// Start the client
inst.startClient4('NT4-Example-Client', 'localhost');
// Get a table
const table = inst.getTable('SmartDashboard');
// Get entries
const booleanEntry = table.getEntry('Boolean');
const doubleEntry = table.getEntry('Double');
const stringEntry = table.getEntry('String');
const booleanArrayEntry = table.getEntry('BooleanArray');
const doubleArrayEntry = table.getEntry('DoubleArray');
const stringArrayEntry = table.getEntry('StringArray');
// Set values
booleanEntry.setBoolean(true);
doubleEntry.setDouble(123.456);
stringEntry.setString('Hello, NetworkTables!');
booleanArrayEntry.setBooleanArray([true, false, true]);
doubleArrayEntry.setDoubleArray([1.1, 2.2, 3.3]);
stringArrayEntry.setStringArray(['one', 'two', 'three']);
// Using topics directly
const booleanTopic = table.getBooleanTopic('BooleanTopic');
const doubleTopic = table.getDoubleTopic('DoubleTopic');
const stringTopic = table.getStringTopic('StringTopic');
// Publish topics
booleanTopic.publish();
doubleTopic.publish();
stringTopic.publish();
// Get entries from topics
const booleanTopicEntry = booleanTopic.getEntry();
const doubleTopicEntry = doubleTopic.getEntry();
const stringTopicEntry = stringTopic.getEntry();
// Set values
booleanTopicEntry.set(false);
doubleTopicEntry.set(789.012);
stringTopicEntry.set('Hello from topic!');
// Print network stats
setInterval(() => {
    const serverTime = inst.getServerTime();
    const latency = inst.getNetworkLatency();
    console.log(`Network stats - Server time: ${serverTime !== null ? serverTime : 'unknown'}, Latency: ${latency}μs`);
    // Read and print values
    console.log('Boolean:', booleanEntry.getBoolean(false));
    console.log('Double:', doubleEntry.getDouble(0));
    console.log('String:', stringEntry.getString(''));
    console.log('BooleanArray:', booleanArrayEntry.getBooleanArray([]));
    console.log('DoubleArray:', doubleArrayEntry.getDoubleArray([]));
    console.log('StringArray:', stringArrayEntry.getStringArray([]));
    console.log('BooleanTopic:', booleanTopicEntry.get());
    console.log('DoubleTopic:', doubleTopicEntry.get());
    console.log('StringTopic:', stringTopicEntry.get());
}, 1000);
// Handle process termination
process.on('SIGINT', () => {
    console.log('Disconnecting from NetworkTables server...');
    inst.stopClient();
    process.exit(0);
});
//# sourceMappingURL=ntcore-api-example.js.map