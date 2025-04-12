# NetworkTables TypeScript Examples

This directory contains examples of how to use the NetworkTables TypeScript library.

## Running the Examples

To run the examples, you'll need to have Node.js installed. Then, you can run the examples using the following commands:

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run the server example
npx ts-node examples/simple-server.ts

# Run the client example (in a separate terminal)
npx ts-node examples/simple-client.ts
```

## Examples

### Basic Examples

- **simple-server.ts** and **simple-client.ts**: Basic client-server communication example
- **data-types-server.ts** and **data-types-client.ts**: Demonstrates all supported data types

### Feature Examples

- **persistence-example.ts**: Demonstrates persistent entries that are saved to disk
- **topic-subscription.ts**: Shows different ways to subscribe to topic changes

### Application Examples

- **robot-simulation.ts**: Simulates a robot publishing data to NetworkTables
- **simple-dashboard.ts**: Console-based dashboard that displays robot data

## Example Pairs

Some examples are designed to work together:

1. **simple-server.ts** and **simple-client.ts**
2. **data-types-server.ts** and **data-types-client.ts**
3. **robot-simulation.ts** and **simple-dashboard.ts**

## Known Issues

See the [KNOWN_ISSUES.md](../KNOWN_ISSUES.md) file in the root directory for information about known issues with the NetworkTables implementation.

## Example Descriptions

### simple-server.ts and simple-client.ts

Basic example showing how to create a server and client and exchange simple values.

### data-types-server.ts and data-types-client.ts

Demonstrates all supported data types in NetworkTables, including:
- Boolean values
- Number values
- String values
- Boolean arrays
- Number arrays
- String arrays

### persistence-example.ts

Shows how to create persistent entries that are saved to disk and restored when the server restarts.

### topic-subscription.ts

Demonstrates different ways to subscribe to topic changes:
- Direct topic subscriptions
- Global entry listeners
- Filtered entry listeners

### robot-simulation.ts

Simulates a robot publishing data to NetworkTables, including:
- Robot state (enabled/disabled)
- Battery voltage
- Motor speeds
- Sensor values
- Autonomous modes

### simple-dashboard.ts

A console-based dashboard that displays robot data and allows the user to:
- Toggle robot enabled/disabled
- Change autonomous mode
- Send messages to the robot
- View robot status and sensor values

## API Overview

The NetworkTables TypeScript library provides a high-level API for interacting with NetworkTables:

```typescript
// Create a new NetworkTables instance
const nt = new NetworkTables();

// Connect as a client
await nt.connectAsClient({ host: 'localhost', port: 1735 });

// Or start a server
await nt.startServer({ port: 1735 });

// Get topics with type safety
const counter = nt.getNumber('counter');
const message = nt.getString('message');
const enabled = nt.getBoolean('robot/enabled');

// Get and set values
console.log(counter.value); // Get value
counter.value = 42; // Set value

// Listen for value changes
counter.on('valueChanged', (value) => {
  console.log(`Counter changed: ${value}`);
});

// Disconnect when done
await nt.disconnect();
```

See the examples for more details on how to use the API.
