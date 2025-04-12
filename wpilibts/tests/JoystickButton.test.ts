import { JoystickButton } from '../src/commands/button/JoystickButton';
import { DriverStation } from '../src/DriverStation';

// Mock the CommandScheduler
jest.mock('../src/commands/CommandScheduler', () => {
  return {
    CommandScheduler: {
      getInstance: jest.fn().mockReturnValue({
        registerButton: jest.fn(),
      }),
    },
  };
});

// Mock the DriverStation
jest.mock('../src/DriverStation', () => {
  return {
    DriverStation: {
      getInstance: jest.fn().mockReturnValue({
        getStickButton: jest.fn(),
      }),
    },
  };
});

describe('JoystickButton', () => {
  let driverStation: any;
  
  beforeEach(() => {
    driverStation = DriverStation.getInstance();
  });
  
  test('should get button value from DriverStation', () => {
    const joystick = 0;
    const button = 1;
    const button1 = new JoystickButton(joystick, button);
    
    driverStation.getStickButton.mockReturnValue(true);
    
    expect(button1.get()).toBe(true);
    expect(driverStation.getStickButton).toHaveBeenCalledWith(joystick, button);
    
    driverStation.getStickButton.mockReturnValue(false);
    
    expect(button1.get()).toBe(false);
  });
});
