import { NT4_Client, NT4_Topic } from '../src/index.js';

// Create a new NT4 client
const client = new NT4_Client(
  'localhost', // Server address - change to your NetworkTables server IP
  'NodeJS-Example', // Client name
  onTopicAnnounce,
  onTopicUnannounce,
  onNewTopicData,
  onConnect,
  onDisconnect
);

// Topic announcement callback
function onTopicAnnounce(topic: NT4_Topic): void {
  console.log(`Topic announced: ${topic.name} (type: ${topic.type})`);
}

// Topic unannouncement callback
function onTopicUnannounce(topic: NT4_Topic): void {
  console.log(`Topic unannounced: ${topic.name}`);
}

// New topic data callback
function onNewTopicData(topic: NT4_Topic, timestamp: number, value: any): void {
  console.log(`New data for ${topic.name}: ${value} (timestamp: ${timestamp})`);
}

// Connection callback
function onConnect(): void {
  console.log('Connected to NetworkTables server!');
  
  // Subscribe to all topics
  client.subscribe(['/'], true);
  
  // Publish a topic
  const counterTopic = client.publishTopic('/node/counter', 'int');
  const stringTopic = client.publishTopic('/node/message', 'string');
  
  // Start sending data
  let counter = 0;
  setInterval(() => {
    client.addSample('/node/counter', counter++);
    client.addSample('/node/message', `Count is now ${counter}`);
    
    // Display network stats
    const serverTime = client.getServerTime_us();
    const latency = client.getNetworkLatency_us();
    console.log(`Network stats - Server time: ${serverTime !== null ? serverTime : 'unknown'}, Latency: ${latency}μs`);
  }, 1000);
}

// Disconnection callback
function onDisconnect(): void {
  console.log('Disconnected from NetworkTables server');
}

// Connect to the server
console.log('Connecting to NetworkTables server...');
client.connect();

// Handle process termination
process.on('SIGINT', () => {
  console.log('Disconnecting from NetworkTables server...');
  client.disconnect();
  process.exit(0);
});
