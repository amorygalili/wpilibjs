# NetworkTables 4.1 Examples

This directory contains examples of how to use the NetworkTables 4.1 library.

## Running the Examples

To run the examples, first build the library:

```bash
npm run build
```

Then run the example using `ts-node`:

```bash
npx ts-node examples/server.ts
```

In another terminal:

```bash
npx ts-node examples/client.ts
```

## Examples

- `server.ts`: A simple NetworkTables server that listens for connections and logs events.
- `client.ts`: A simple NetworkTables client that connects to a server, publishes a topic, and updates its value.

## Interoperability

These examples should be able to communicate with other NetworkTables 4.1 implementations, such as OutlineViewer or WPILib's NetworkTables implementation.
