import { DriverStation, JoystickAxisType, JoystickPOVDirection, Alliance, Location, MatchType } from '../src/DriverStation';
import { EventEmitter } from 'events';

describe('DriverStation', () => {
  let driverStation: DriverStation;
  
  beforeEach(() => {
    // Reset the singleton instance
    (DriverStation as any).instance = undefined;
    
    driverStation = DriverStation.getInstance();
  });
  
  test('should be a singleton', () => {
    const instance1 = DriverStation.getInstance();
    const instance2 = DriverStation.getInstance();
    
    expect(instance1).toBe(instance2);
  });
  
  test('should be an EventEmitter', () => {
    expect(driverStation).toBeInstanceOf(EventEmitter);
  });
  
  test('should initialize with default values', () => {
    expect(driverStation.isEnabled()).toBe(false);
    expect(driverStation.isDisabled()).toBe(true);
    expect(driverStation.isAutonomous()).toBe(false);
    expect(driverStation.isTeleop()).toBe(true);
    expect(driverStation.isTest()).toBe(false);
    expect(driverStation.isEStopped()).toBe(false);
    expect(driverStation.isFMSAttached()).toBe(false);
    expect(driverStation.isDSAttached()).toBe(false);
    expect(driverStation.getAlliance()).toBe(Alliance.kInvalid);
    expect(driverStation.getLocation()).toBe(Location.kInvalid);
    expect(driverStation.getMatchInfo()).toEqual({
      eventName: '',
      gameSpecificMessage: '',
      matchNumber: 0,
      replayNumber: 0,
      matchType: MatchType.kNone
    });
  });
  
  test('should set and get enabled state', () => {
    const listener = jest.fn();
    driverStation.on('enabledChanged', listener);
    
    driverStation.setEnabled(true);
    
    expect(driverStation.isEnabled()).toBe(true);
    expect(driverStation.isDisabled()).toBe(false);
    expect(listener).toHaveBeenCalledWith(true);
    
    driverStation.setEnabled(false);
    
    expect(driverStation.isEnabled()).toBe(false);
    expect(driverStation.isDisabled()).toBe(true);
    expect(listener).toHaveBeenCalledWith(false);
  });
  
  test('should set and get autonomous state', () => {
    const listener = jest.fn();
    driverStation.on('autonomousChanged', listener);
    
    driverStation.setAutonomous(true);
    
    expect(driverStation.isAutonomous()).toBe(true);
    expect(driverStation.isTeleop()).toBe(false);
    expect(listener).toHaveBeenCalledWith(true);
    
    driverStation.setAutonomous(false);
    
    expect(driverStation.isAutonomous()).toBe(false);
    expect(driverStation.isTeleop()).toBe(true);
    expect(listener).toHaveBeenCalledWith(false);
  });
  
  test('should set and get test state', () => {
    const listener = jest.fn();
    driverStation.on('testChanged', listener);
    
    driverStation.setTest(true);
    
    expect(driverStation.isTest()).toBe(true);
    expect(driverStation.isTeleop()).toBe(false);
    expect(listener).toHaveBeenCalledWith(true);
    
    driverStation.setTest(false);
    
    expect(driverStation.isTest()).toBe(false);
    expect(driverStation.isTeleop()).toBe(true);
    expect(listener).toHaveBeenCalledWith(false);
  });
  
  test('should set and get joystick axis values', () => {
    driverStation.setJoystickAxis(0, JoystickAxisType.kX, 0.5);
    
    expect(driverStation.getStickAxis(0, JoystickAxisType.kX)).toBe(0.5);
    
    // Test clamping
    driverStation.setJoystickAxis(0, JoystickAxisType.kY, 1.5);
    
    expect(driverStation.getStickAxis(0, JoystickAxisType.kY)).toBe(1.0);
    
    driverStation.setJoystickAxis(0, JoystickAxisType.kZ, -1.5);
    
    expect(driverStation.getStickAxis(0, JoystickAxisType.kZ)).toBe(-1.0);
    
    // Test invalid joystick
    expect(() => {
      driverStation.getStickAxis(-1, JoystickAxisType.kX);
    }).toThrow();
    
    expect(() => {
      driverStation.getStickAxis(6, JoystickAxisType.kX);
    }).toThrow();
  });
  
  test('should set and get joystick button values', () => {
    driverStation.setJoystickButton(0, 1, true);
    
    expect(driverStation.getStickButton(0, 1)).toBe(true);
    
    driverStation.setJoystickButton(0, 1, false);
    
    expect(driverStation.getStickButton(0, 1)).toBe(false);
    
    // Test invalid joystick
    expect(() => {
      driverStation.getStickButton(-1, 1);
    }).toThrow();
    
    expect(() => {
      driverStation.getStickButton(6, 1);
    }).toThrow();
    
    // Test invalid button
    expect(() => {
      driverStation.getStickButton(0, 0);
    }).toThrow();
  });
  
  test('should set and get joystick POV values', () => {
    driverStation.setJoystickPOV(0, 0, JoystickPOVDirection.kUp);
    
    expect(driverStation.getStickPOV(0, 0)).toBe(JoystickPOVDirection.kUp);
    
    // Test invalid joystick
    expect(() => {
      driverStation.getStickPOV(-1, 0);
    }).toThrow();
    
    expect(() => {
      driverStation.getStickPOV(6, 0);
    }).toThrow();
    
    // Test invalid POV
    expect(() => {
      driverStation.getStickPOV(0, -1);
    }).toThrow();
    
    // Test POV > 0 (not supported)
    expect(driverStation.getStickPOV(0, 1)).toBe(JoystickPOVDirection.kCenter);
  });
  
  test('should set and get alliance', () => {
    const listener = jest.fn();
    driverStation.on('allianceChanged', listener);
    
    driverStation.setAlliance(Alliance.kRed);
    
    expect(driverStation.getAlliance()).toBe(Alliance.kRed);
    expect(listener).toHaveBeenCalledWith(Alliance.kRed);
  });
  
  test('should set and get location', () => {
    const listener = jest.fn();
    driverStation.on('locationChanged', listener);
    
    driverStation.setLocation(Location.kRed1);
    
    expect(driverStation.getLocation()).toBe(Location.kRed1);
    expect(listener).toHaveBeenCalledWith(Location.kRed1);
  });
  
  test('should set and get match info', () => {
    const listener = jest.fn();
    driverStation.on('matchInfoChanged', listener);
    
    const matchInfo = {
      eventName: 'Test Event',
      gameSpecificMessage: 'Test Message',
      matchNumber: 42,
      replayNumber: 1,
      matchType: MatchType.kQualification
    };
    
    driverStation.setMatchInfo(matchInfo);
    
    expect(driverStation.getMatchInfo()).toEqual(matchInfo);
    expect(listener).toHaveBeenCalledWith(matchInfo);
  });
  
  test('should set and get game specific message', () => {
    const listener = jest.fn();
    driverStation.on('gameSpecificMessageChanged', listener);
    
    driverStation.setGameSpecificMessage('Test Message');
    
    expect(driverStation.getGameSpecificMessage()).toBe('Test Message');
    expect(listener).toHaveBeenCalledWith('Test Message');
  });
  
  test('should refresh data without changing state', () => {
    driverStation.setEnabled(true);
    driverStation.setAutonomous(true);
    
    driverStation.refreshData();
    
    expect(driverStation.isEnabled()).toBe(true);
    expect(driverStation.isAutonomous()).toBe(true);
  });
  
  test('should have static observe methods', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    DriverStation.observeUserProgramStarting();
    DriverStation.observeUserProgramDisabled();
    DriverStation.observeUserProgramAutonomous();
    DriverStation.observeUserProgramTeleop();
    DriverStation.observeUserProgramTest();
    
    expect(consoleSpy).toHaveBeenCalledTimes(5);
    
    consoleSpy.mockRestore();
  });
});
