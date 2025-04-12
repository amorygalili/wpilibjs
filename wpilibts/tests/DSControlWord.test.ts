import { DSControlWord } from '../src/DSControlWord';

describe('DSControlWord', () => {
  let controlWord: DSControlWord;
  
  beforeEach(() => {
    controlWord = new DSControlWord();
  });
  
  test('should initialize with default values', () => {
    expect(controlWord.isEnabled()).toBe(false);
    expect(controlWord.isDisabled()).toBe(true);
    expect(controlWord.isAutonomous()).toBe(false);
    expect(controlWord.isTeleop()).toBe(true);
    expect(controlWord.isTest()).toBe(false);
    expect(controlWord.isEStopped()).toBe(false);
    expect(controlWord.isFMSAttached()).toBe(false);
    expect(controlWord.isDSAttached()).toBe(false);
  });
  
  test('should initialize with provided values', () => {
    const customControlWord = new DSControlWord(true, true, false, true, true, true);
    
    expect(customControlWord.isEnabled()).toBe(true);
    expect(customControlWord.isDisabled()).toBe(false);
    expect(customControlWord.isAutonomous()).toBe(true);
    expect(customControlWord.isTeleop()).toBe(false);
    expect(customControlWord.isTest()).toBe(false);
    expect(customControlWord.isEStopped()).toBe(true);
    expect(customControlWord.isFMSAttached()).toBe(true);
    expect(customControlWord.isDSAttached()).toBe(true);
  });
  
  test('should set and get enabled state', () => {
    controlWord.setEnabled(true);
    expect(controlWord.isEnabled()).toBe(true);
    expect(controlWord.isDisabled()).toBe(false);
    
    controlWord.setEnabled(false);
    expect(controlWord.isEnabled()).toBe(false);
    expect(controlWord.isDisabled()).toBe(true);
  });
  
  test('should set and get autonomous state', () => {
    controlWord.setAutonomous(true);
    expect(controlWord.isAutonomous()).toBe(true);
    expect(controlWord.isTeleop()).toBe(false);
    expect(controlWord.isTest()).toBe(false);
    
    controlWord.setAutonomous(false);
    expect(controlWord.isAutonomous()).toBe(false);
    expect(controlWord.isTeleop()).toBe(true);
  });
  
  test('should set and get test state', () => {
    controlWord.setTest(true);
    expect(controlWord.isTest()).toBe(true);
    expect(controlWord.isAutonomous()).toBe(false);
    expect(controlWord.isTeleop()).toBe(false);
    
    controlWord.setTest(false);
    expect(controlWord.isTest()).toBe(false);
    expect(controlWord.isTeleop()).toBe(true);
  });
  
  test('should set and get emergency stop state', () => {
    controlWord.setEStopped(true);
    expect(controlWord.isEStopped()).toBe(true);
    
    controlWord.setEStopped(false);
    expect(controlWord.isEStopped()).toBe(false);
  });
  
  test('should set and get FMS attached state', () => {
    controlWord.setFMSAttached(true);
    expect(controlWord.isFMSAttached()).toBe(true);
    
    controlWord.setFMSAttached(false);
    expect(controlWord.isFMSAttached()).toBe(false);
  });
  
  test('should set and get DS attached state', () => {
    controlWord.setDSAttached(true);
    expect(controlWord.isDSAttached()).toBe(true);
    
    controlWord.setDSAttached(false);
    expect(controlWord.isDSAttached()).toBe(false);
  });
  
  test('should handle mode conflicts correctly', () => {
    // Setting autonomous should clear test
    controlWord.setTest(true);
    expect(controlWord.isTest()).toBe(true);
    
    controlWord.setAutonomous(true);
    expect(controlWord.isAutonomous()).toBe(true);
    expect(controlWord.isTest()).toBe(false);
    
    // Setting test should clear autonomous
    controlWord.setTest(true);
    expect(controlWord.isTest()).toBe(true);
    expect(controlWord.isAutonomous()).toBe(false);
  });
  
  test('should refresh without changing state', () => {
    controlWord.setEnabled(true);
    controlWord.setAutonomous(true);
    
    controlWord.refresh();
    
    expect(controlWord.isEnabled()).toBe(true);
    expect(controlWord.isAutonomous()).toBe(true);
  });
});
