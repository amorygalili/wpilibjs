import { NetworkTables, ConnectionMode } from '../../api/NetworkTables';
import { NTEntryFlags } from '../../types/NTTypes';
import { sleep } from '../helpers/TestUtils';

// These tests were previously skipped because they use real network connections
// Now enabled to verify client-server communication
describe('Client-Server Integration', () => {
  let server: NetworkTables;
  let client: NetworkTables;
  const port = 5810; // Use a non-standard port for testing

  beforeEach(async () => {
    // Create server and client instances
    server = new NetworkTables();
    client = new NetworkTables();

    // Start the server
    await server.startServer({ port, host: 'localhost' });
  });

  afterEach(async () => {
    // Clean up
    await client.disconnect();
    await server.disconnect();
    await sleep(100); // Give time for cleanup
  });

  test('client connects to server', async () => {
    // Connect the client
    await client.connectAsClient({ host: 'localhost', port });

    // Verify connection status
    expect(client.mode).toBe(ConnectionMode.Client);
    expect(client.connected).toBe(true);
    expect(server.mode).toBe(ConnectionMode.Server);
    expect(server.connected).toBe(true);
  });

  test('client receives server entries', async () => {
    // Create a topic on the server
    const serverTopic = server.getBoolean('test');
    serverTopic.value = true;

    // Connect the client
    await client.connectAsClient({ host: 'localhost', port });

    // Wait for the entry to be synchronized
    await sleep(1000);

    // Check if the client received the entry
    const clientTopic = client.getBoolean('test');
    expect(clientTopic.value).toBe(true);
  });

  test('client updates propagate to server', async () => {
    // Connect the client
    await client.connectAsClient({ host: 'localhost', port });
    await sleep(500);

    // Create a topic on the client
    const clientTopic = client.getNumber('clientTest');
    clientTopic.value = 3.14;

    // Wait for the entry to be synchronized
    await sleep(1000);

    // Check if the server received the entry
    const serverTopic = server.getNumber('clientTest');
    expect(serverTopic.value).toBe(3.14);
  });

  test('server updates propagate to client', async () => {
    // Connect the client
    await client.connectAsClient({ host: 'localhost', port });
    await sleep(500);

    // Create a topic on the server
    const serverTopic = server.getString('serverTest');
    serverTopic.value = 'hello';

    // Wait for the entry to be synchronized
    await sleep(1000);

    // Check if the client received the entry
    const clientTopic = client.getString('serverTest');
    expect(clientTopic.value).toBe('hello');

    // Update the entry on the server
    serverTopic.value = 'world';

    // Wait for the update to be synchronized
    await sleep(1000);

    // Check if the client received the update
    expect(clientTopic.value).toBe('world');
  });

  test('entry deletion propagates', async () => {
    // Create a topic on the server
    const serverTopic = server.getBoolean('deleteTest');
    serverTopic.value = true;

    // Connect the client
    await client.connectAsClient({ host: 'localhost', port });

    // Wait for the entry to be synchronized
    await sleep(1000);

    // Check if the client received the entry
    const clientTopic = client.getBoolean('deleteTest');
    expect(clientTopic.value).toBe(true);

    // Delete the entry on the server
    server['_instance'].deleteEntry('deleteTest');

    // Wait for the deletion to be synchronized
    await sleep(1000);

    // Check if the entry was deleted on the client
    expect(client['_instance'].getValue('deleteTest')).toBeUndefined();
  });

  test('flag changes propagate', async () => {
    // Create a topic on the server
    const serverTopic = server.getBoolean('flagTest');
    serverTopic.value = true;

    // Connect the client
    await client.connectAsClient({ host: 'localhost', port });

    // Wait for the entry to be synchronized
    await sleep(1000);

    // Check if the client received the entry with default flags
    expect(client['_instance'].getFlags('flagTest')).toBe(NTEntryFlags.None);

    // Update the flags on the server
    serverTopic.setPersistent(true);

    // Wait for the update to be synchronized
    await sleep(1000);

    // Check if the client received the flag update
    expect(client['_instance'].getFlags('flagTest')).toBe(NTEntryFlags.Persistent);
  });

  test('reconnection works', async () => {
    // Connect the client
    await client.connectAsClient({ host: 'localhost', port });
    await sleep(500);

    // Create a topic on the client
    const clientTopic = client.getNumber('reconnectTest');
    clientTopic.value = 3.14;

    // Wait for the entry to be synchronized
    await sleep(1000);

    // Check if the server received the entry
    const serverTopic = server.getNumber('reconnectTest');
    expect(serverTopic.value).toBe(3.14);

    // Disconnect the client
    await client.disconnect();
    await sleep(500);

    // Reconnect the client
    await client.connectAsClient({ host: 'localhost', port });
    await sleep(1000);

    // Check if the entry is still there
    const reconnectedClientTopic = client.getNumber('reconnectTest');
    expect(reconnectedClientTopic.value).toBe(3.14);

    // Update the entry on the server
    serverTopic.value = 2.71;

    // Wait for the update to be synchronized
    await sleep(1000);

    // Check if the client received the update
    expect(reconnectedClientTopic.value).toBe(2.71);
  });
});
