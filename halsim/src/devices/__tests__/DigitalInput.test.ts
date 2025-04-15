import { DigitalInputSim } from '../DigitalInput';
import { HAL_ValueType } from '../../HALTypes';

describe('DigitalInputSim', () => {
  test('should initialize with the correct channel and default values', () => {
    const channel = 5;
    const dio = new DigitalInputSim(channel);
    
    expect(dio.getChannel()).toBe(channel);
    expect(dio.getInitialized()).toBe(false);
    expect(dio.getValue()).toBe(true);
    expect(dio.getPulseLength()).toBe(0.0);
    expect(dio.getIsInput()).toBe(true);
    expect(dio.getFilterIndex()).toBe(-1);
  });

  test('should update initialized state', () => {
    const dio = new DigitalInputSim(0);
    
    dio.setInitialized(true);
    expect(dio.getInitialized()).toBe(true);
    
    dio.setInitialized(false);
    expect(dio.getInitialized()).toBe(false);
  });

  test('should update value', () => {
    const dio = new DigitalInputSim(0);
    
    dio.setValue(false);
    expect(dio.getValue()).toBe(false);
    
    dio.setValue(true);
    expect(dio.getValue()).toBe(true);
  });

  test('should update pulse length', () => {
    const dio = new DigitalInputSim(0);
    const pulseLength = 0.5;
    
    dio.setPulseLength(pulseLength);
    expect(dio.getPulseLength()).toBe(pulseLength);
  });

  test('should update isInput state', () => {
    const dio = new DigitalInputSim(0);
    
    dio.setIsInput(false);
    expect(dio.getIsInput()).toBe(false);
    
    dio.setIsInput(true);
    expect(dio.getIsInput()).toBe(true);
  });

  test('should update filter index', () => {
    const dio = new DigitalInputSim(0);
    const filterIndex = 2;
    
    dio.setFilterIndex(filterIndex);
    expect(dio.getFilterIndex()).toBe(filterIndex);
  });

  test('should notify callbacks when value changes', () => {
    const dio = new DigitalInputSim(0);
    const mockCallback = jest.fn();
    
    dio.registerValueCallback(mockCallback, null, false);
    dio.setValue(false);
    
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('Value', null, {
      type: HAL_ValueType.Boolean,
      data: false
    });
  });

  test('should call callback immediately if initialNotify is true', () => {
    const dio = new DigitalInputSim(0);
    const mockCallback = jest.fn();
    
    dio.registerValueCallback(mockCallback, null, true);
    
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith('Value', null, {
      type: HAL_ValueType.Boolean,
      data: true
    });
  });

  test('should not call callback after it has been cancelled', () => {
    const dio = new DigitalInputSim(0);
    const mockCallback = jest.fn();
    
    const uid = dio.registerValueCallback(mockCallback, null, false);
    dio.cancelValueCallback(uid);
    dio.setValue(false);
    
    expect(mockCallback).not.toHaveBeenCalled();
  });

  test('should reset all values to defaults', () => {
    const dio = new DigitalInputSim(0);
    
    dio.setInitialized(true);
    dio.setValue(false);
    dio.setPulseLength(0.5);
    dio.setIsInput(false);
    dio.setFilterIndex(2);
    
    dio.resetData();
    
    expect(dio.getInitialized()).toBe(false);
    expect(dio.getValue()).toBe(true);
    expect(dio.getPulseLength()).toBe(0.0);
    expect(dio.getIsInput()).toBe(true);
    expect(dio.getFilterIndex()).toBe(-1);
  });
});
