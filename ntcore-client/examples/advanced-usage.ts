import { NT4_Client, NT4_Topic } from '../src/index.js';
import readline from 'readline';

// Create a new NT4 client
const client = new NT4_Client(
  'localhost', // Server address - change to your OutlineViewer IP
  'NodeJS-Advanced-Example', // Client name
  onTopicAnnounce,
  onTopicUnannounce,
  onNewTopicData,
  onConnect,
  onDisconnect
);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Track subscriptions
const subscriptions: Map<number, string[]> = new Map();
// Track published topics
const publishedTopics: Set<string> = new Set();

// Topic announcement callback
function onTopicAnnounce(topic: NT4_Topic): void {
  console.log(`Topic announced: ${topic.name} (type: ${topic.type})`);
  console.log(`  Properties: ${JSON.stringify(topic.properties)}`);
}

// Topic unannouncement callback
function onTopicUnannounce(topic: NT4_Topic): void {
  console.log(`Topic unannounced: ${topic.name}`);
}

// New topic data callback
function onNewTopicData(topic: NT4_Topic, timestamp_us: number, value: unknown): void {
  const date = new Date(timestamp_us / 1000);
  const timeStr = date.toISOString();
  console.log(`[${timeStr}] New data for ${topic.name}: ${JSON.stringify(value)}`);
}

// Connection callback
function onConnect(): void {
  console.log('Connected to NT server!');
  showMenu();
}

// Disconnection callback
function onDisconnect(): void {
  console.log('Disconnected from NT server');
}

// Show the main menu
function showMenu(): void {
  console.log('\n--- NetworkTables 4 Client Menu ---');
  console.log('1. Subscribe to topics');
  console.log('2. Unsubscribe from topics');
  console.log('3. Publish a topic');
  console.log('4. Unpublish a topic');
  console.log('5. Send data to a topic');
  console.log('6. Set topic properties');
  console.log('7. Show network statistics');
  console.log('8. List all subscriptions');
  console.log('9. List all published topics');
  console.log('0. Exit');

  rl.question('Select an option: ', (answer) => {
    switch (answer) {
      case '1':
        subscribeToTopics();
        break;
      case '2':
        unsubscribeFromTopics();
        break;
      case '3':
        publishTopic();
        break;
      case '4':
        unpublishTopic();
        break;
      case '5':
        sendData();
        break;
      case '6':
        setTopicProperties();
        break;
      case '7':
        showNetworkStats();
        break;
      case '8':
        listSubscriptions();
        break;
      case '9':
        listPublishedTopics();
        break;
      case '0':
        exitProgram();
        break;
      default:
        console.log('Invalid option');
        showMenu();
        break;
    }
  });
}

// Subscribe to topics
function subscribeToTopics(): void {
  rl.question('Enter topic patterns (comma-separated): ', (topics) => {
    rl.question('Use prefix mode? (y/n): ', (prefixMode) => {
      rl.question('Send all values? (y/n): ', (sendAll) => {
        rl.question('Update period (seconds): ', (period) => {
          const topicList = topics.split(',').map(t => t.trim());
          const isPrefixMode = prefixMode.toLowerCase() === 'y';
          const isSendAll = sendAll.toLowerCase() === 'y';
          const updatePeriod = parseFloat(period) || 0.1;

          const subId = client.subscribe(topicList, isPrefixMode, isSendAll, updatePeriod);
          subscriptions.set(subId, topicList);

          console.log(`Subscribed with ID ${subId} to topics: ${topicList.join(', ')}`);
          showMenu();
        });
      });
    });
  });
}

// Unsubscribe from topics
function unsubscribeFromTopics(): void {
  if (subscriptions.size === 0) {
    console.log('No active subscriptions');
    showMenu();
    return;
  }

  console.log('Active subscriptions:');
  for (const [id, topics] of subscriptions.entries()) {
    console.log(`ID ${id}: ${topics.join(', ')}`);
  }

  rl.question('Enter subscription ID to unsubscribe (or "all" for all): ', (id) => {
    if (id.toLowerCase() === 'all') {
      client.clearAllSubscriptions();
      subscriptions.clear();
      console.log('Unsubscribed from all topics');
    } else {
      const subId = parseInt(id);
      if (subscriptions.has(subId)) {
        client.unsubscribe(subId);
        subscriptions.delete(subId);
        console.log(`Unsubscribed from subscription ID ${subId}`);
      } else {
        console.log(`Subscription ID ${subId} not found`);
      }
    }
    showMenu();
  });
}

// Publish a topic
function publishTopic(): void {
  rl.question('Enter topic name: ', (name) => {
    rl.question('Enter topic type (boolean, double, int, float, string, boolean[], double[], int[], float[], string[]): ', (type) => {
      client.publishTopic(name, type);
      publishedTopics.add(name);
      console.log(`Published topic: ${name} (type: ${type})`);
      showMenu();
    });
  });
}

// Unpublish a topic
function unpublishTopic(): void {
  if (publishedTopics.size === 0) {
    console.log('No published topics');
    showMenu();
    return;
  }

  console.log('Published topics:');
  for (const topic of publishedTopics) {
    console.log(`- ${topic}`);
  }

  rl.question('Enter topic name to unpublish: ', (name) => {
    if (publishedTopics.has(name)) {
      client.unpublishTopic(name);
      publishedTopics.delete(name);
      console.log(`Unpublished topic: ${name}`);
    } else {
      console.log(`Topic ${name} not found or not published by this client`);
    }
    showMenu();
  });
}

// Send data to a topic
function sendData(): void {
  if (publishedTopics.size === 0) {
    console.log('No published topics');
    showMenu();
    return;
  }

  console.log('Published topics:');
  for (const topic of publishedTopics) {
    console.log(`- ${topic}`);
  }

  rl.question('Enter topic name: ', (name) => {
    if (!publishedTopics.has(name)) {
      console.log(`Topic ${name} not found or not published by this client`);
      showMenu();
      return;
    }

    rl.question('Enter value (for arrays use comma-separated values): ', (valueStr) => {
      try {
        // Try to parse as JSON first
        let value: any;
        try {
          value = JSON.parse(valueStr);
        } catch {
          // If not valid JSON, handle common types
          if (valueStr.includes(',')) {
            // Treat as array
            value = valueStr.split(',').map(v => {
              const num = parseFloat(v.trim());
              return isNaN(num) ? v.trim() : num;
            });
          } else if (valueStr.toLowerCase() === 'true') {
            value = true;
          } else if (valueStr.toLowerCase() === 'false') {
            value = false;
          } else {
            const num = parseFloat(valueStr);
            value = isNaN(num) ? valueStr : num;
          }
        }

        client.addSample(name, value);
        console.log(`Sent value to ${name}: ${JSON.stringify(value)}`);
      } catch (error) {
        console.error('Error sending data:', error);
      }
      showMenu();
    });
  });
}

// Set topic properties
function setTopicProperties(): void {
  rl.question('Enter topic name: ', (name) => {
    console.log('Property options:');
    console.log('1. Set persistent');
    console.log('2. Set retained');
    console.log('3. Set custom property');

    rl.question('Select option: ', (option) => {
      switch (option) {
        case '1':
          rl.question('Persistent (true/false): ', (value) => {
            const isPersistent = value.toLowerCase() === 'true';
            client.setPersistent(name, isPersistent);
            console.log(`Set ${name} persistent: ${isPersistent}`);
            showMenu();
          });
          break;
        case '2':
          rl.question('Retained (true/false): ', (value) => {
            const isRetained = value.toLowerCase() === 'true';
            client.setRetained(name, isRetained);
            console.log(`Set ${name} retained: ${isRetained}`);
            showMenu();
          });
          break;
        case '3':
          rl.question('Property name: ', (propName) => {
            rl.question('Property value (use "null" to remove): ', (propValue) => {
              let value: any = propValue;
              if (propValue === 'null') {
                value = null as any;
              } else {
                try {
                  value = JSON.parse(propValue);
                } catch {
                  // Keep as string if not valid JSON
                }
              }

              const props: { [key: string]: any } = {};
              props[propName] = value;
              client.setProperties(name, props);
              console.log(`Set ${name} property ${propName}: ${JSON.stringify(value)}`);
              showMenu();
            });
          });
          break;
        default:
          console.log('Invalid option');
          showMenu();
          break;
      }
    });
  });
}

// Show network statistics
function showNetworkStats(): void {
  const serverTime = client.getServerTime_us();
  const latency = client.getNetworkLatency_us();

  console.log('Network Statistics:');
  console.log(`Server time: ${serverTime !== null ? serverTime + ' μs' : 'Unknown'}`);
  console.log(`Network latency: ${latency} μs`);

  showMenu();
}

// List all subscriptions
function listSubscriptions(): void {
  console.log('Active subscriptions:');
  if (subscriptions.size === 0) {
    console.log('  None');
  } else {
    for (const [id, topics] of subscriptions.entries()) {
      console.log(`  ID ${id}: ${topics.join(', ')}`);
    }
  }
  showMenu();
}

// List all published topics
function listPublishedTopics(): void {
  console.log('Published topics:');
  if (publishedTopics.size === 0) {
    console.log('  None');
  } else {
    for (const topic of publishedTopics) {
      console.log(`  - ${topic}`);
    }
  }
  showMenu();
}

// Exit the program
function exitProgram(): void {
  console.log('Shutting down...');
  client.disconnect();
  rl.close();
  process.exit(0);
}

// Connect to the server
console.log('Connecting to NT server...');
client.connect();

// Handle process termination
process.on('SIGINT', exitProgram);
