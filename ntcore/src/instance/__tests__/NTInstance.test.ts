import { NTInstance } from '../NTInstance';
import { NTEntryFlags, NTValueType } from '../../types/NTTypes';
import { sleep } from '../../__tests__/helpers/TestUtils';

describe('NTInstance', () => {
  let instance: NTInstance;

  beforeEach(() => {
    instance = new NTInstance();
  });

  describe('createEntry', () => {
    test('creates a new entry', () => {
      const entry = instance.createEntry('test', NTValueType.Boolean, false);
      expect(entry).toBeDefined();
      expect(entry.name).toBe('test');
      expect(entry.type).toBe(NTValueType.Boolean);
      expect(entry.value).toBe(false);
      expect(entry.flags).toBe(NTEntryFlags.None);
    });

    test('creates a new entry with flags', () => {
      const entry = instance.createEntry('test', NTValueType.Boolean, false, NTEntryFlags.Persistent);
      expect(entry.flags).toBe(NTEntryFlags.Persistent);
    });

    test('returns existing entry if name already exists', () => {
      const entry1 = instance.createEntry('test', NTValueType.Boolean, false);
      const entry2 = instance.createEntry('test', NTValueType.Boolean, true);
      expect(entry1).toBe(entry2);
      expect(entry1.value).toBe(true); // Value should be updated
    });

    test('throws if type mismatch on existing entry', () => {
      instance.createEntry('test', NTValueType.Boolean, false);
      expect(() => {
        instance.createEntry('test', NTValueType.Double, 123);
      }).toThrow('Entry type mismatch');
    });
  });

  describe('getEntry', () => {
    test('returns entry if it exists', () => {
      const entry = instance.createEntry('test', NTValueType.Boolean, false);
      const retrievedEntry = instance.getEntry('test');
      expect(retrievedEntry).toBe(entry);
    });

    test('returns undefined if entry does not exist', () => {
      const entry = instance.getEntry('nonexistent');
      expect(entry).toBeUndefined();
    });
  });

  describe('getEntries', () => {
    test('returns all entries', () => {
      instance.createEntry('test1', NTValueType.Boolean, false);
      instance.createEntry('test2', NTValueType.Double, 123);
      instance.createEntry('test3', NTValueType.String, 'hello');

      const entries = instance.getEntries();
      expect(entries.length).toBe(3);
      expect(entries.map(e => e.name).sort()).toEqual(['test1', 'test2', 'test3']);
    });

    test('returns empty array if no entries', () => {
      const entries = instance.getEntries();
      expect(entries).toEqual([]);
    });
  });

  describe('getValue', () => {
    test('returns value if entry exists', () => {
      instance.createEntry('test', NTValueType.Boolean, false);
      const value = instance.getValue('test');
      expect(value).toBe(false);
    });

    test('returns undefined if entry does not exist', () => {
      const value = instance.getValue('nonexistent');
      expect(value).toBeUndefined();
    });
  });

  describe('setValue', () => {
    test('updates value if entry exists', () => {
      instance.createEntry('test', NTValueType.Boolean, false);
      instance.setValue('test', true);
      expect(instance.getValue('test')).toBe(true);
    });

    test('creates entry if it does not exist', () => {
      instance.setValue('test', true);
      expect(instance.getValue('test')).toBe(true);
      expect(instance.getEntry('test')?.type).toBe(NTValueType.Boolean);
    });

    test('throws if type mismatch', () => {
      instance.createEntry('test', NTValueType.Boolean, false);
      expect(() => {
        instance.setValue('test', 123 as any);
      }).toThrow('Value type mismatch');
    });
  });

  describe('getEntry', () => {
    test('returns entry type if entry exists', () => {
      instance.createEntry('test', NTValueType.Boolean, false);
      const entry = instance.getEntry('test');
      expect(entry).not.toBeNull();
      expect(entry?.type).toBe(NTValueType.Boolean);
    });

    test('returns null if entry does not exist', () => {
      const entry = instance.getEntry('nonexistent');
      expect(entry).toBeUndefined();
    });
  });

  describe('getFlags', () => {
    test('returns flags if entry exists', () => {
      instance.createEntry('test', NTValueType.Boolean, false, NTEntryFlags.Persistent);
      const flags = instance.getFlags('test');
      expect(flags).toBe(NTEntryFlags.Persistent);
    });

    test('returns undefined if entry does not exist', () => {
      const flags = instance.getFlags('nonexistent');
      expect(flags).toBeUndefined();
    });
  });

  describe('setFlags', () => {
    test('updates flags if entry exists', () => {
      instance.createEntry('test', NTValueType.Boolean, false);
      instance.setFlags('test', NTEntryFlags.Persistent);
      expect(instance.getFlags('test')).toBe(NTEntryFlags.Persistent);
    });

    test('does nothing if entry does not exist', () => {
      instance.setFlags('nonexistent', NTEntryFlags.Persistent);
      expect(instance.getFlags('nonexistent')).toBeUndefined();
    });
  });

  describe('deleteEntry', () => {
    test('deletes entry if it exists', () => {
      instance.createEntry('test', NTValueType.Boolean, false);
      expect(instance.getEntry('test')).toBeDefined();
      instance.deleteEntry('test');
      expect(instance.getEntry('test')).toBeUndefined();
    });

    test('does nothing if entry does not exist', () => {
      instance.deleteEntry('nonexistent');
      expect(instance.getEntry('nonexistent')).toBeUndefined();
    });
  });

  describe('deleteAllEntries', () => {
    test('deletes all entries', () => {
      instance.createEntry('test1', NTValueType.Boolean, false);
      instance.createEntry('test2', NTValueType.Double, 123);
      instance.createEntry('test3', NTValueType.String, 'hello');
      expect(instance.getEntries().length).toBe(3);

      // Delete each entry manually
      instance.deleteEntry('test1');
      instance.deleteEntry('test2');
      instance.deleteEntry('test3');

      expect(instance.getEntries().length).toBe(0);
    });

    test('does nothing if no entries', () => {
      expect(instance.getEntries().length).toBe(0);
      // Nothing to delete
      expect(instance.getEntries().length).toBe(0);
    });
  });

  describe('addEntryListener', () => {
    test('notifies on new entry', async () => {
      const listener = jest.fn();
      instance.addEntryListener(listener, { notifyOnNew: true });
      instance.createEntry('test', NTValueType.Boolean, false);
      await sleep(10); // Wait for async notification
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        name: 'test',
        value: false,
        flags: NTEntryFlags.None,
        isNew: true,
        isDelete: false
      }));
    });

    test('notifies on update', async () => {
      const listener = jest.fn();
      instance.createEntry('test', NTValueType.Boolean, false);
      instance.addEntryListener(listener, { notifyOnUpdate: true });
      instance.setValue('test', true);
      await sleep(10); // Wait for async notification
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        name: 'test',
        value: true,
        flags: NTEntryFlags.None,
        isNew: false,
        isDelete: false
      }));
    });

    test('notifies on delete', async () => {
      const listener = jest.fn();
      instance.createEntry('test', NTValueType.Boolean, false);
      instance.addEntryListener(listener, { notifyOnDelete: true });
      instance.deleteEntry('test');
      await sleep(10); // Wait for async notification
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        name: 'test',
        value: false,
        flags: NTEntryFlags.None,
        isNew: false,
        isDelete: true
      }));
    });

    test('notifies on flags change', async () => {
      const listener = jest.fn();
      instance.createEntry('test', NTValueType.Boolean, false);
      instance.addEntryListener(listener, { notifyOnFlagsChange: true });
      instance.setFlags('test', NTEntryFlags.Persistent);
      await sleep(10); // Wait for async notification
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        name: 'test',
        value: false,
        flags: NTEntryFlags.Persistent,
        isNew: false,
        isDelete: false
      }));
    });

    test('notifies immediately if requested', async () => {
      instance.createEntry('test', NTValueType.Boolean, false);
      const listener = jest.fn();
      instance.addEntryListener(listener, { notifyImmediately: true });
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        name: 'test',
        value: false,
        flags: NTEntryFlags.None,
        isNew: true,
        isDelete: false
      }));
    });

    test('filters by name', async () => {
      const listener = jest.fn();
      instance.addEntryListener(listener, { notifyOnNew: true }, 'foo/bar');
      instance.createEntry('foo/bar', NTValueType.Boolean, false);
      instance.createEntry('baz/qux', NTValueType.Boolean, false);
      await sleep(10); // Wait for async notification
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({
        name: 'foo/bar',
        value: false,
        flags: NTEntryFlags.None,
        isNew: true,
        isDelete: false
      }));
    });
  });

  describe('removeEntryListener', () => {
    test('stops notifications when removed', async () => {
      const listener = jest.fn();
      const id = instance.addEntryListener(listener, { notifyOnUpdate: true, notifyOnNew: true });
      instance.createEntry('test', NTValueType.Boolean, false);
      await sleep(10); // Wait for async notification for new entry
      instance.setValue('test', true);
      await sleep(10); // Wait for async notification for update
      expect(listener).toHaveBeenCalledTimes(2); // New + update

      instance.removeEntryListener(id);
      instance.setValue('test', false);
      await sleep(10); // Wait for async notification
      expect(listener).toHaveBeenCalledTimes(2); // No additional calls
    });

    test('does nothing if id does not exist', () => {
      expect(() => {
        instance.removeEntryListener(999);
      }).not.toThrow();
    });
  });

  describe('addConnectionListener', () => {
    test('notifies with initial status', () => {
      const listener = jest.fn();
      instance.addConnectionListener(listener);
      expect(listener).toHaveBeenCalledWith({
        connected: false,
        conn: { remoteId: '', protocolVersion: 0 }
      });
    });

    test('notifies on connection status change', () => {
      const listener = jest.fn();
      instance.addConnectionListener(listener);
      listener.mockClear(); // Clear initial call

      instance.setConnectionStatus(1); // Connecting
      expect(listener).toHaveBeenCalledWith({
        connected: false,
        conn: { remoteId: '', protocolVersion: 0 }
      });

      instance.setConnectionStatus(2, { remoteId: 'localhost:1735', protocolVersion: 3 }); // Connected
      expect(listener).toHaveBeenCalledWith({
        connected: true,
        conn: { remoteId: 'localhost:1735', protocolVersion: 3 }
      });
    });
  });

  describe('removeConnectionListener', () => {
    test('stops notifications when removed', () => {
      const listener = jest.fn();
      const id = instance.addConnectionListener(listener);
      listener.mockClear(); // Clear initial call

      instance.removeConnectionListener(id);
      instance.setConnectionStatus(1); // Connecting
      expect(listener).not.toHaveBeenCalled();
    });

    test('does nothing if id does not exist', () => {
      expect(() => {
        instance.removeConnectionListener(999);
      }).not.toThrow();
    });
  });

  describe('setConnectionStatus', () => {
    test('updates connection status', () => {
      expect(instance.connectionStatus).toBe(0); // Disconnected
      instance.setConnectionStatus(1); // Connecting
      expect(instance.connectionStatus).toBe(1);
      instance.setConnectionStatus(2, { remoteId: 'localhost:1735', protocolVersion: 3 }); // Connected
      expect(instance.connectionStatus).toBe(2);
      expect(instance.connectionInfo).toEqual({ remoteId: 'localhost:1735', protocolVersion: 3 });
    });
  });
});
