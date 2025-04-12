# WPILib NetworkTables for TypeScript

A TypeScript implementation of WPILib NetworkTables, designed for use in Node.js applications.

## Installation

```bash
npm install @wpilib/ntcore
```

## Usage

### High-Level API

The high-level API provides a simple interface for interacting with NetworkTables:

```typescript
import { NetworkTables } from '@wpilib/ntcore';

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

### Low-Level API

The low-level API provides more control over NetworkTables:

```typescript
import { NTInstance, NTClient, NTServer, NTValueType } from '@wpilib/ntcore';

// Create a NetworkTables instance
const instance = new NTInstance();

// Create a client
const client = new NTClient(instance, { host: 'localhost', port: 1735 });

// Connect to the server
await client.connect();

// Create an entry
instance.createEntry('counter', NTValueType.Double, 0);

// Set a value
instance.setValue('counter', 42);

// Get a value
const value = instance.getValue('counter');
console.log(value); // 42

// Listen for changes
const listenerId = instance.addEntryListener((notification) => {
  console.log(`Entry changed: ${notification.name} = ${notification.value}`);
}, { notifyOnUpdate: true });

// Disconnect
client.disconnect();
```

## Examples

See the [examples](./examples) directory for more examples of how to use the library.

## Development

### Building

```bash
npm install
npm run build
```

### Testing

```bash
npm test
```

### Running Examples

```bash
# Start a server
npm run example:server

# In another terminal, start a client
npm run example:client
```

## License

BSD-3-Clause
