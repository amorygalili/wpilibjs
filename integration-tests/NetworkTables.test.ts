import { NTInstance, NTValueType, NTEntryFlags } from '../ntcore/src';
import { sleep } from '../ntcore/src/__tests__/helpers/TestUtils';

describe('NetworkTables Integration', () => {
  let instance: NTInstance;

  beforeEach(() => {
    instance = new NTInstance();
  });

  test('Create and update entries', () => {
    // Create entries
    const boolEntry = instance.createEntry('boolean', NTValueType.Boolean, true);
    const doubleEntry = instance.createEntry('double', NTValueType.Double, 3.14);
    const stringEntry = instance.createEntry('string', NTValueType.String, 'hello');

    // Check entry values
    expect(instance.getValue('boolean')).toBe(true);
    expect(instance.getValue('double')).toBe(3.14);
    expect(instance.getValue('string')).toBe('hello');

    // Update entry values
    instance.setValue('boolean', false);
    instance.setValue('double', 2.71);
    instance.setValue('string', 'world');

    // Check updated values
    expect(instance.getValue('boolean')).toBe(false);
    expect(instance.getValue('double')).toBe(2.71);
    expect(instance.getValue('string')).toBe('world');
  });

  test('Entry listeners', async () => {
    // Create a listener
    const listener = jest.fn();
    const listenerId = instance.addEntryListener(listener, {
      notifyOnNew: true,
      notifyOnUpdate: true,
      notifyOnDelete: true,
      notifyOnFlagsChange: true,
      notifyImmediately: false
    });

    // Create an entry
    instance.createEntry('test', NTValueType.Boolean, true);

    // Update the entry
    instance.setValue('test', false);

    // Update the flags
    instance.setFlags('test', NTEntryFlags.Persistent);

    // Delete the entry
    instance.deleteEntry('test');

    // Wait for all events to be processed
    await sleep(10);

    // Check that the listener was called for all events
    expect(listener).toHaveBeenCalledTimes(4);

    // Remove the listener
    instance.removeEntryListener(listenerId);

    // Create another entry
    instance.createEntry('test2', NTValueType.Boolean, true);

    // Wait for all events to be processed
    await sleep(10);

    // Check that the listener was not called again
    expect(listener).toHaveBeenCalledTimes(4);
  });

  test('Connection status', () => {
    // Check initial connection status
    expect(instance.connectionStatus).toBe(0); // Disconnected

    // Set up a connection listener
    const listener = jest.fn();
    const listenerId = instance.addConnectionListener(listener);

    // Check that the listener was called with the initial status
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      connected: false,
      conn: { remoteId: '', protocolVersion: 0 }
    });

    // Update the connection status
    instance.setConnectionStatus(1); // Connecting

    // Check that the listener was called with the new status
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith({
      connected: false,
      conn: { remoteId: '', protocolVersion: 0 }
    });

    // Update the connection status to connected
    instance.setConnectionStatus(2, { remoteId: 'localhost:1735', protocolVersion: 3 });

    // Check that the listener was called with the new status
    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenCalledWith({
      connected: true,
      conn: { remoteId: 'localhost:1735', protocolVersion: 3 }
    });

    // Remove the listener
    instance.removeConnectionListener(listenerId);

    // Update the connection status
    instance.setConnectionStatus(0); // Disconnected

    // Check that the listener was not called again
    expect(listener).toHaveBeenCalledTimes(3);
  });
});
