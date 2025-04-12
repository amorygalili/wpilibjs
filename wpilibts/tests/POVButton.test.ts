import { POVButton } from '../src/commands/button/POVButton';
import { DriverStation, JoystickPOVDirection } from '../src/DriverStation';

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
        getStickPOV: jest.fn(),
      }),
    },
    JoystickPOVDirection: {
      kCenter: -1,
      kUp: 0,
      kUpRight: 45,
      kRight: 90,
      kDownRight: 135,
      kDown: 180,
      kDownLeft: 225,
      kLeft: 270,
      kUpLeft: 315
    }
  };
});

describe('POVButton', () => {
  let driverStation: any;
  
  beforeEach(() => {
    driverStation = DriverStation.getInstance();
  });
  
  test('should get POV value from DriverStation', () => {
    const joystick = 0;
    const pov = 0;
    const angle = JoystickPOVDirection.kUp;
    const button = new POVButton(joystick, angle, pov);
    
    driverStation.getStickPOV.mockReturnValue(JoystickPOVDirection.kUp);
    
    expect(button.get()).toBe(true);
    expect(driverStation.getStickPOV).toHaveBeenCalledWith(joystick, pov);
    
    driverStation.getStickPOV.mockReturnValue(JoystickPOVDirection.kDown);
    
    expect(button.get()).toBe(false);
  });
  
  test('should work with default POV value', () => {
    const joystick = 0;
    const angle = JoystickPOVDirection.kUp;
    const button = new POVButton(joystick, angle);
    
    driverStation.getStickPOV.mockReturnValue(JoystickPOVDirection.kUp);
    
    expect(button.get()).toBe(true);
    expect(driverStation.getStickPOV).toHaveBeenCalledWith(joystick, 0);
  });
});
