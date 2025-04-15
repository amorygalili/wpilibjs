import { SimDataValue } from '../SimDataValue';
import { HAL_Value, HAL_ValueType, HAL_MakeBoolean, HAL_MakeDouble } from '../../HALTypes';

describe('SimDataValue', () => {
  // Test constructor and get method
  test('should initialize with the correct value', () => {
    const value = new SimDataValue<boolean>('TestValue', true, HAL_MakeBoolean);
    expect(value.get()).toBe(true);
  });

  // Test set method
  test('should update the value when set is called', () => {
    const value = new SimDataValue<boolean>('TestValue', false, HAL_MakeBoolean);
    value.set(true);
    expect(value.get()).toBe(true);
  });

  // Test callback notification
  test('should notify callbacks when value changes', () => {
    const mockCallback = jest.fn();
    const value = new SimDataValue<boolean>('TestValue', false, HAL_MakeBoolean);
    
    value.registerCallback(mockCallback, null, false);
    value.set(true);
    
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('TestValue', null, {
      type: HAL_ValueType.Boolean,
      data: true
    });
  });

  // Test callback not called when value doesn't change
  test('should not notify callbacks when value does not change', () => {
    const mockCallback = jest.fn();
    const value = new SimDataValue<boolean>('TestValue', false, HAL_MakeBoolean);
    
    value.registerCallback(mockCallback, null, false);
    value.set(false); // Setting to the same value
    
    expect(mockCallback).not.toHaveBeenCalled();
  });

  // Test initial notification
  test('should call callback immediately if initialNotify is true', () => {
    const mockCallback = jest.fn();
    const value = new SimDataValue<boolean>('TestValue', true, HAL_MakeBoolean);
    
    value.registerCallback(mockCallback, null, true);
    
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('TestValue', null, {
      type: HAL_ValueType.Boolean,
      data: true
    });
  });

  // Test callback cancellation
  test('should not call callback after it has been cancelled', () => {
    const mockCallback = jest.fn();
    const value = new SimDataValue<boolean>('TestValue', false, HAL_MakeBoolean);
    
    const uid = value.registerCallback(mockCallback, null, false);
    value.cancelCallback(uid);
    value.set(true);
    
    expect(mockCallback).not.toHaveBeenCalled();
  });

  // Test reset method
  test('should reset value and clear callbacks', () => {
    const mockCallback = jest.fn();
    const value = new SimDataValue<boolean>('TestValue', false, HAL_MakeBoolean);
    
    value.registerCallback(mockCallback, null, false);
    value.set(true);
    value.reset(false);
    value.set(true);
    
    // The callback should have been called once before reset, but not after
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(value.get()).toBe(true);
  });

  // Test with different value types
  test('should work with number values', () => {
    const mockCallback = jest.fn();
    const value = new SimDataValue<number>('NumberValue', 0.0, HAL_MakeDouble);
    
    value.registerCallback(mockCallback, null, false);
    value.set(3.14);
    
    expect(value.get()).toBe(3.14);
    expect(mockCallback).toHaveBeenCalledWith('NumberValue', null, {
      type: HAL_ValueType.Double,
      data: 3.14
    });
  });

  // Test with custom parameter
  test('should pass custom parameter to callback', () => {
    const mockCallback = jest.fn();
    const customParam = { id: 123 };
    const value = new SimDataValue<boolean>('TestValue', false, HAL_MakeBoolean);
    
    value.registerCallback(mockCallback, customParam, false);
    value.set(true);
    
    expect(mockCallback).toHaveBeenCalledWith('TestValue', customParam, {
      type: HAL_ValueType.Boolean,
      data: true
    });
  });
});
