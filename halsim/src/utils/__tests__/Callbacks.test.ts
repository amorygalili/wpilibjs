import { CallbackRegistry, NotifyCallbackRegistry, BufferCallbackRegistry } from '../Callbacks';

describe('CallbackRegistry', () => {
  test('should register a callback and return a valid UID', () => {
    const registry = new CallbackRegistry<() => void>();
    const callback = jest.fn();
    
    const uid = registry.register(callback, null);
    
    expect(uid).toBeGreaterThan(0);
  });

  test('should return -1 when registering a null callback', () => {
    const registry = new CallbackRegistry<() => void>();
    
    const uid = registry.register(null as any, null);
    
    expect(uid).toBe(-1);
  });

  test('should cancel a callback by UID', () => {
    const registry = new CallbackRegistry<() => void>();
    const callback = jest.fn();
    
    const uid = registry.register(callback, null);
    registry.cancel(uid);
    
    // We can't directly test if the callback was removed, but we can check that
    // getAll() doesn't include it
    expect(registry.getAll()).toHaveLength(0);
  });

  test('should not throw when cancelling an invalid UID', () => {
    const registry = new CallbackRegistry<() => void>();
    
    expect(() => registry.cancel(-1)).not.toThrow();
    expect(() => registry.cancel(0)).not.toThrow();
    expect(() => registry.cancel(999)).not.toThrow();
  });

  test('should reset all callbacks', () => {
    const registry = new CallbackRegistry<() => void>();
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    
    registry.register(callback1, null);
    registry.register(callback2, null);
    registry.reset();
    
    expect(registry.getAll()).toHaveLength(0);
  });

  test('should return all registered callbacks', () => {
    const registry = new CallbackRegistry<() => void>();
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const param1 = { id: 1 };
    const param2 = { id: 2 };
    
    const uid1 = registry.register(callback1, param1);
    const uid2 = registry.register(callback2, param2);
    
    const callbacks = registry.getAll();
    expect(callbacks).toHaveLength(2);
    expect(callbacks[0].callback).toBe(callback1);
    expect(callbacks[0].param).toBe(param1);
    expect(callbacks[0].uid).toBe(uid1);
    expect(callbacks[1].callback).toBe(callback2);
    expect(callbacks[1].param).toBe(param2);
    expect(callbacks[1].uid).toBe(uid2);
  });
});

describe('NotifyCallbackRegistry', () => {
  test('should notify all registered callbacks', () => {
    const registry = new NotifyCallbackRegistry();
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const param1 = { id: 1 };
    const param2 = { id: 2 };
    
    registry.register(callback1, param1);
    registry.register(callback2, param2);
    
    const name = 'testValue';
    const value = { data: true };
    registry.notify(name, value);
    
    expect(callback1).toHaveBeenCalledWith(name, param1, value);
    expect(callback2).toHaveBeenCalledWith(name, param2, value);
  });
});

describe('BufferCallbackRegistry', () => {
  test('should notify all registered callbacks with buffer data', () => {
    const registry = new BufferCallbackRegistry();
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const param1 = { id: 1 };
    const param2 = { id: 2 };
    
    registry.register(callback1, param1);
    registry.register(callback2, param2);
    
    const name = 'testBuffer';
    const buffer = new Uint8Array([1, 2, 3, 4]);
    const count = 4;
    registry.notify(name, buffer, count);
    
    expect(callback1).toHaveBeenCalledWith(name, param1, buffer, count);
    expect(callback2).toHaveBeenCalledWith(name, param2, buffer, count);
  });
});
