const WebSocket = require('ws');

// Create a WebSocket client
const ws = new WebSocket('ws://localhost:5820');

// Store topics
const topics = new Map();
const topicsById = new Map();
let nextPublishId = 1;

// Handle connection open
ws.on('open', () => {
  console.log('Connected to server');
  
  // Subscribe to all topics
  const subscribeMessage = {
    method: 'subscribe',
    params: {
      subuid: 1,
      topics: [''],
      options: {}
    }
  };
  
  ws.send(JSON.stringify([subscribeMessage]));
  console.log('Subscribed to all topics');
  
  // Publish a topic
  const publishMessage = {
    method: 'publish',
    params: {
      name: '/example/counter',
      type: 'double',
      pubuid: nextPublishId,
      properties: {
        persistent: true
      }
    }
  };
  
  ws.send(JSON.stringify([publishMessage]));
  console.log(`Published topic with ID: ${nextPublishId}`);
  
  // Start updating the counter
  let counter = 0;
  setInterval(() => {
    // Find the topic ID for our published topic
    const topic = topics.get('/example/counter');
    
    if (topic) {
      const valueMessage = {
        id: topic.id,
        timestamp: Date.now() * 1000, // Convert to microseconds
        type: 1, // Double type
        value: counter++
      };
      
      ws.send(JSON.stringify(valueMessage));
      console.log(`Set value: ${counter-1}`);
    } else {
      console.log('Waiting for topic announcement...');
    }
  }, 1000);
});

// Handle messages
ws.on('message', (message) => {
  try {
    const data = JSON.parse(message);
    
    // Handle array of messages (control messages)
    if (Array.isArray(data)) {
      for (const msg of data) {
        handleControlMessage(msg);
      }
    } 
    // Handle value update
    else if (typeof data === 'object' && data.id) {
      handleValueMessage(data);
    }
  } catch (error) {
    console.error('Failed to parse message:', error);
  }
});

// Handle control message
function handleControlMessage(message) {
  switch (message.method) {
    case 'announce':
      const { name, id, type, properties } = message.params;
      
      // Store topic
      const topic = {
        id,
        type,
        properties,
        value: null
      };
      
      topics.set(name, topic);
      topicsById.set(id, topic);
      
      console.log(`Topic announced: ${name} (${type})`);
      break;
      
    case 'unannounce':
      const { name: unName, id: unId } = message.params;
      
      // Remove topic
      topics.delete(unName);
      topicsById.delete(unId);
      
      console.log(`Topic unannounced: ${unName}`);
      break;
      
    case 'properties':
      const { name: propName, properties: propValues } = message.params;
      
      // Update properties
      const propTopic = topics.get(propName);
      if (propTopic) {
        Object.assign(propTopic.properties, propValues);
        console.log(`Properties updated for topic ${propName}`);
      }
      break;
  }
}

// Handle value message
function handleValueMessage(message) {
  const { id, timestamp, type, value } = message;
  
  // Find topic by ID
  const topic = topicsById.get(id);
  
  if (topic) {
    // Update topic value
    topic.value = {
      timestamp,
      type,
      value
    };
    
    // Find topic name
    let topicName = '';
    for (const [name, t] of topics.entries()) {
      if (t.id === id) {
        topicName = name;
        break;
      }
    }
    
    console.log(`Value changed for ${topicName}: ${value}`);
  }
}

// Handle errors
ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Handle disconnection
ws.on('close', () => {
  console.log('Disconnected from server');
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Disconnecting...');
  ws.terminate();
  process.exit(0);
});
