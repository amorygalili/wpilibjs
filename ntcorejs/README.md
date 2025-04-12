# NetworkTables 4.1 for Node.js

A Node.js TypeScript implementation of the NetworkTables 4.1 protocol. This library allows you to create NetworkTables clients and servers that can communicate with other programs that use NetworkTables, such as OutlineViewer.

## Current Status

This project is currently in development. The basic functionality is working, but there are some limitations:

- **Limited Protocol Support**: Not all features of the NetworkTables 4.1 protocol are implemented yet.
- **Limited Testing**: The test suite is still being developed.

## Features

- Implementation of the NetworkTables 4.1 protocol
- Support for both client and server modes
- Support for all NetworkTables data types
- Time synchronization using Cristian's algorithm
- WebSocket ping/pong for connection health monitoring
- Event-based API for easy integration

## Installation

```bash
# Clone the repository
git clone https://github.com/wpilibsuite/ntcorejs.git
cd ntcorejs

# Install dependencies
npm install

# Build the project
npm run build
```

## Running Examples

Start the server:

```bash
npx ts-node examples/server.ts
```

In another terminal, start the client:

```bash
npx ts-node examples/client.ts
```

## Usage

### Client Example

```typescript
// If using as a local project
import { NetworkTablesClient, NetworkTablesClientEvent } from './src/client';

// Create a client
const client = new NetworkTablesClient({
  serverHost: 'localhost',
  serverPort: 5810,
  clientName: 'example-client'
});

// Set up event handlers
client.on(NetworkTablesClientEvent.Connected, () => {
  console.log('Connected to server');

  // Subscribe to all topics
  const subId = client.subscribe(['']);
  console.log(`Subscribed with ID: ${subId}`);

  // Publish a topic
  const pubId = client.publish('/example/counter', 'double', {
    persistent: true
  });
  console.log(`Published topic with ID: ${pubId}`);

  // Start updating the counter
  let counter = 0;
  setInterval(() => {
    client.setValue(pubId, counter++);
  }, 1000);
});

client.on(NetworkTablesClientEvent.ValueChanged, (topicName, value) => {
  console.log(`Value changed for ${topicName}: ${JSON.stringify(value.value)}`);
});

// Connect to the server
client.connect();
```

### Server Example

```typescript
// If using as a local project
import { NetworkTablesServer, NetworkTablesServerEvent } from './src/server';

// Create a server
const server = new NetworkTablesServer({
  port: 5810,
  persistentFilePath: './networktables.json'
});

// Set up event handlers
server.on(NetworkTablesServerEvent.Started, (port) => {
  console.log(`Server started on port ${port}`);
});

server.on(NetworkTablesServerEvent.ClientConnected, (clientId) => {
  console.log(`Client connected: ${clientId}`);
});

server.on(NetworkTablesServerEvent.TopicPublished, (topic) => {
  console.log(`Topic published: ${topic.name} (${topic.type})`);
});

server.on(NetworkTablesServerEvent.ValueChanged, (topicName, value) => {
  console.log(`Value changed for ${topicName}: ${JSON.stringify(value.value)}`);
});

// Start the server
server.start();
```

## API Reference

### NetworkTablesClient

The `NetworkTablesClient` class provides methods for connecting to a NetworkTables server, publishing topics, subscribing to topics, and setting values.

#### Constructor

```typescript
new NetworkTablesClient(options: NetworkTablesClientOptions)
```

#### Methods

- `connect()`: Connects to the NetworkTables server
- `disconnect()`: Disconnects from the NetworkTables server
- `publish(name: string, type: string, properties?: Properties): number`: Publishes a topic
- `unpublish(pubuid: number): void`: Unpublishes a topic
- `setProperties(name: string, properties: Properties): void`: Sets properties for a topic
- `subscribe(topics: string[], options?: PubSubOptions): number`: Subscribes to topics
- `unsubscribe(subuid: number): void`: Unsubscribes from topics
- `setValue(pubuid: number, value: any): void`: Sets a value for a topic
- `getTopic(name: string): Topic | undefined`: Gets a topic by name
- `getTopics(): Topic[]`: Gets all topics
- `getServerTimeOffset(): number`: Gets the server time offset
- `isConnected(): boolean`: Checks if the client is connected

#### Events

- `NetworkTablesClientEvent.Connected`: Emitted when the client connects to the server
- `NetworkTablesClientEvent.Disconnected`: Emitted when the client disconnects from the server
- `NetworkTablesClientEvent.TopicAnnounced`: Emitted when a topic is announced
- `NetworkTablesClientEvent.TopicUnannounced`: Emitted when a topic is unannounced
- `NetworkTablesClientEvent.TopicPropertiesChanged`: Emitted when topic properties change
- `NetworkTablesClientEvent.ValueChanged`: Emitted when a topic value changes
- `NetworkTablesClientEvent.TimeSyncUpdated`: Emitted when the time synchronization is updated

### NetworkTablesServer

The `NetworkTablesServer` class provides methods for starting a NetworkTables server, handling client connections, and managing topics.

#### Constructor

```typescript
new NetworkTablesServer(options?: NetworkTablesServerOptions)
```

#### Methods

- `start(): void`: Starts the NetworkTables server
- `stop(): void`: Stops the NetworkTables server
- `getTopic(name: string): Topic | undefined`: Gets a topic by name
- `getTopics(): Topic[]`: Gets all topics
- `getClients(): string[]`: Gets all clients
- `isRunning(): boolean`: Checks if the server is running

#### Events

- `NetworkTablesServerEvent.Started`: Emitted when the server starts
- `NetworkTablesServerEvent.Stopped`: Emitted when the server stops
- `NetworkTablesServerEvent.ClientConnected`: Emitted when a client connects
- `NetworkTablesServerEvent.ClientDisconnected`: Emitted when a client disconnects
- `NetworkTablesServerEvent.TopicPublished`: Emitted when a topic is published
- `NetworkTablesServerEvent.TopicUnpublished`: Emitted when a topic is unpublished
- `NetworkTablesServerEvent.TopicPropertiesChanged`: Emitted when topic properties change
- `NetworkTablesServerEvent.ValueChanged`: Emitted when a topic value changes

## License

ISC
