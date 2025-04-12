# NetworkTables 4 Client for Node.js

A TypeScript implementation of the NetworkTables 4 protocol for Node.js environments.

## Installation

```bash
pnpm install
```

## Building

```bash
pnpm build
```

## Usage

### Basic Example

```typescript
import { NT4_Client, NT4_Topic } from 'ntcore-client';

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

  // Start sending data
  let counter = 0;
  setInterval(() => {
    client.addSample('/node/counter', counter++);
  }, 1000);
}

// Disconnection callback
function onDisconnect(): void {
  console.log('Disconnected from NetworkTables server');
}

// Connect to the server
client.connect();
```

### ntcore-like API Example

The library also provides an API that is similar to the ntcore API:

```typescript
import { NetworkTableInstance } from 'ntcore-client';

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

// Set values
booleanEntry.setBoolean(true);
doubleEntry.setDouble(123.456);
stringEntry.setString('Hello, NetworkTables!');

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
```

### Running Examples

The package includes several examples:

```bash
# Run the basic example
pnpm example:basic

# Run the advanced example
pnpm example:advanced

# Run the Node.js specific example
pnpm example:node

# Run the ntcore-like API example
pnpm example:ntcore

# Run the simple ntcore-like API example
pnpm example:simple-ntcore
```

## API Reference

### NT4 API

#### NT4_Client

The main client class for interacting with a NetworkTables server.

#### Constructor

```typescript
constructor(
  serverAddr: string,
  appName: string,
  onTopicAnnounce: (topic: NT4_Topic) => void,
  onTopicUnannounce: (topic: NT4_Topic) => void,
  onNewTopicData: (topic: NT4_Topic, timestamp_us: number, value: unknown) => void,
  onConnect: () => void,
  onDisconnect: () => void
)
```

#### Methods

- `connect()`: Starts the connection to the server
- `disconnect()`: Disconnects from the server
- `publishTopic(name: string, type: string, properties: object = {})`: Publishes a new topic
- `unpublishTopic(name: string)`: Unpublishes a topic
- `subscribe(topicPatterns: string[], prefixMode: boolean, sendAll: boolean = false, periodic: number = 0.1)`: Subscribes to topics
- `unsubscribe(subuid: number)`: Unsubscribes from topics
- `addSample(topic: string, value: any)`: Sends a value to the server
- `addTimestampedSample(topic: string, timestamp: number, value: any)`: Sends a timestamped value to the server
- `getClientTime_us()`: Returns the current client time in microseconds
- `getServerTime_us(clientTime?: number)`: Returns the current server time in microseconds
- `getNetworkLatency_us()`: Returns the current network latency in microseconds

#### NT4_Topic

Represents a NetworkTables topic.

##### Properties

- `uid`: Topic ID
- `name`: Topic name
- `type`: Topic type
- `properties`: Topic properties

### ntcore-like API

#### NetworkTableInstance

The main class for interacting with NetworkTables. Similar to the ntcore NetworkTableInstance class.

##### Methods

- `getDefault()`: Gets the default instance (static method)
- `create()`: Creates a new instance (static method)
- `startClient4(identity: string, serverAddr: string, port: number)`: Starts a NT4 client
- `stopClient()`: Stops the client
- `getTable(key: string)`: Gets a table with the specified key
- `getTopic(name: string)`: Gets a generic topic
- `getBooleanTopic(name: string)`: Gets a boolean topic
- `getDoubleTopic(name: string)`: Gets a double topic
- `getIntegerTopic(name: string)`: Gets an integer topic
- `getFloatTopic(name: string)`: Gets a float topic
- `getStringTopic(name: string)`: Gets a string topic
- `getRawTopic(name: string)`: Gets a raw topic
- `getBooleanArrayTopic(name: string)`: Gets a boolean array topic
- `getDoubleArrayTopic(name: string)`: Gets a double array topic
- `getIntegerArrayTopic(name: string)`: Gets an integer array topic
- `getFloatArrayTopic(name: string)`: Gets a float array topic
- `getStringArrayTopic(name: string)`: Gets a string array topic

#### NetworkTable

Represents a NetworkTables table. Similar to the ntcore NetworkTable class.

##### Methods

- `getInstance()`: Gets the instance for the table
- `getPath()`: Gets the table's path
- `getSubTable(key: string)`: Gets a subtable
- `getEntry(key: string)`: Gets the entry for a key
- `getTopic(name: string)`: Gets a topic
- `getBooleanTopic(name: string)`: Gets a boolean topic
- `getDoubleTopic(name: string)`: Gets a double topic
- `getIntegerTopic(name: string)`: Gets an integer topic
- `getFloatTopic(name: string)`: Gets a float topic
- `getStringTopic(name: string)`: Gets a string topic
- `getRawTopic(name: string)`: Gets a raw topic
- `getBooleanArrayTopic(name: string)`: Gets a boolean array topic
- `getDoubleArrayTopic(name: string)`: Gets a double array topic
- `getIntegerArrayTopic(name: string)`: Gets an integer array topic
- `getFloatArrayTopic(name: string)`: Gets a float array topic
- `getStringArrayTopic(name: string)`: Gets a string array topic

#### NetworkTableEntry

Represents a NetworkTables entry. Similar to the ntcore NetworkTableEntry class.

##### Methods

- `getInstance()`: Gets the instance for the entry
- `getTopic()`: Gets the topic for the entry
- `getName()`: Gets the name of the entry
- `exists()`: Determines if the entry exists
- `getLastChange()`: Gets the last time the entry's value was changed
- `getValue()`: Gets the entry's value
- `getBoolean(defaultValue: boolean)`: Gets the entry's value as a boolean
- `getDouble(defaultValue: number)`: Gets the entry's value as a double
- `getInteger(defaultValue: number)`: Gets the entry's value as an integer
- `getFloat(defaultValue: number)`: Gets the entry's value as a float
- `getString(defaultValue: string)`: Gets the entry's value as a string
- `getRaw(defaultValue: Uint8Array)`: Gets the entry's value as a raw value
- `getBooleanArray(defaultValue: boolean[])`: Gets the entry's value as a boolean array
- `getDoubleArray(defaultValue: number[])`: Gets the entry's value as a double array
- `getIntegerArray(defaultValue: number[])`: Gets the entry's value as an integer array
- `getFloatArray(defaultValue: number[])`: Gets the entry's value as a float array
- `getStringArray(defaultValue: string[])`: Gets the entry's value as a string array
- `setValue(value: any)`: Sets the entry's value
- `setBoolean(value: boolean)`: Sets the entry's value as a boolean
- `setDouble(value: number)`: Sets the entry's value as a double
- `setInteger(value: number)`: Sets the entry's value as an integer
- `setFloat(value: number)`: Sets the entry's value as a float
- `setString(value: string)`: Sets the entry's value as a string
- `setRaw(value: Uint8Array)`: Sets the entry's value as a raw value
- `setBooleanArray(value: boolean[])`: Sets the entry's value as a boolean array
- `setDoubleArray(value: number[])`: Sets the entry's value as a double array
- `setIntegerArray(value: number[])`: Sets the entry's value as an integer array
- `setFloatArray(value: number[])`: Sets the entry's value as a float array
- `setStringArray(value: string[])`: Sets the entry's value as a string array

#### Topic

Represents a NetworkTables topic. Similar to the ntcore Topic class.

##### Methods

- `getInstance()`: Gets the instance for the topic
- `getName()`: Gets the name of the topic
- `getType()`: Gets the type of the topic
- `exists()`: Determines if the topic exists
- `getProperty(name: string)`: Gets a property of the topic
- `setProperty(name: string, value: any)`: Sets a property of the topic
- `getProperties()`: Gets all properties of the topic
- `setProperties(properties: Record<string, any>)`: Sets the topic's properties
- `publish(typeStr: string, properties: Record<string, any>)`: Publishes the topic with a specific type
- `unpublish()`: Unpublishes the topic
- `subscribe(periodic: number, all: boolean)`: Subscribes to the topic
- `unsubscribe(subuid: number)`: Unsubscribes from the topic

## Supported Data Types

- `boolean`: Boolean value
- `double`: Double precision floating-point value
- `int`: Integer value
- `float`: Single precision floating-point value
- `string`: String value
- `json`: JSON value (sent as string)
- `raw`: Raw binary data
- `boolean[]`: Array of boolean values
- `double[]`: Array of double precision floating-point values
- `int[]`: Array of integer values
- `float[]`: Array of single precision floating-point values
- `string[]`: Array of string values

## License

ISC
